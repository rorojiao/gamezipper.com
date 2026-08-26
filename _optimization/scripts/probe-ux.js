#!/usr/bin/env node
/* UX visual probe: per game (fresh context → first-visit state):
 * 1) onboarding overlay present? screenshot  2) dismiss → node gone?  3) HUD chips present?
 * 4) mute click → icon flips  5) post-dismiss screenshot (game visible)
 * Usage: node probe-ux.js slug1,slug2,... */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const slugs = (process.argv[2] || '').split(',').filter(Boolean);
if (!slugs.length) { console.error('usage: node probe-ux.js slug1,slug2'); process.exit(2); }
const PORT = 8131;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let p = path.join(repo, u === '/' ? 'index.html' : u);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});
(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch(); // bundled chromium — NEVER system Chrome (浏览器铁律)
  const out = [];
  try {
    for (const slug of slugs) {
      const ctx = await b.newContext({ viewport: { width: 800, height: 600 } });
      const p = await ctx.newPage();
      const rec = { slug };
      try {
        await p.goto('http://127.0.0.1:' + PORT + '/' + slug + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await p.waitForTimeout(1200);
        rec.onboardShown = await p.locator('#gz-ux-onboard').count();
        if (rec.onboardShown) {
          await p.screenshot({ path: '/tmp/uxp-' + slug + '-overlay.jpg', type: 'jpeg', quality: 70 });
          await p.locator('#gz-ux-onboard button').click({ timeout: 3000 });
          await p.waitForTimeout(400);
        }
        rec.onboardGone = (await p.locator('#gz-ux-onboard').count()) === 0;
        rec.hudRestart = await p.locator('#gz-ux-hud button[aria-label="Restart"]').count();
        rec.hudMute = await p.locator('#gz-ux-hud button[aria-label="Mute"], #gz-ux-hud button[aria-label="Unmute"]').count();
        if (rec.hudMute) {
          const before = await p.locator('#gz-ux-hud button').last().textContent();
          await p.locator('#gz-ux-hud button').last().click();
          await p.waitForTimeout(250);
          const after = await p.locator('#gz-ux-hud button').last().textContent();
          rec.muteToggles = before !== after;
        }
        await p.waitForTimeout(800);
        await p.screenshot({ path: '/tmp/uxp-' + slug + '-game.jpg', type: 'jpeg', quality: 70 });
      } catch (e) { rec.error = String(e).split('\n')[0].slice(0, 150); }
      out.push(rec);
      await ctx.close();
    }
  } finally {
    await b.close().catch(() => {});
    try { b.process() && b.process().kill('SIGKILL'); } catch {}
    server.close();
  }
  console.log(JSON.stringify(out, null, 1));
})();
