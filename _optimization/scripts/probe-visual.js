#!/usr/bin/env node
/* One-game visual probe: load <slug> on a temporary local server with bundled
 * chromium, print every console error + page error WITH source location, save
 * full-res screenshots. Usage: node probe-visual.js <slug> [waitMs] */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];
const waitMs = parseInt(process.argv[3] || '4000', 10);
if (!slug) { console.error('usage: node probe-visual.js <slug>'); process.exit(2); }
const PORT = 8129;
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
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 800, height: 600 } });
    p.on('pageerror', e => console.log('PAGEERROR:', String(e).split('\n').slice(0, 4).join(' | ').slice(0, 400)));
    p.on('console', m => { if (m.type() === 'error') { const l = m.location(); console.log('CONSOLE:', m.text().slice(0, 150), '@', l ? (l.url + ':' + (l.lineNumber || '?')) : '?'); } });
    await p.goto('http://127.0.0.1:' + PORT + '/' + slug + '/', { waitUntil: 'load', timeout: 15000 });
    await p.waitForTimeout(Math.min(1500, waitMs));
    for (const sel of ['[id*="play" i]', '.play-btn', '#startBtn', '[id*="start" i]', 'button:has-text("Play")', 'button:has-text("PLAY")', 'button:has-text("Start")']) {
      const loc = p.locator(sel).first();
      try { if (await loc.count() && await loc.isVisible()) { console.log('click', sel); await loc.click({ timeout: 1500 }); break; } } catch {}
    }
    await p.waitForTimeout(waitMs);
    await p.screenshot({ path: '/tmp/probe-load.png' });
    await p.screenshot({ path: '/tmp/probe-play.png' });
    console.log('shots: /tmp/probe-load.png /tmp/probe-play.png');
  } finally {
    await b.close().catch(() => {});
    try { b.process() && b.process().kill('SIGKILL'); } catch {}
    server.close();
  }
})();
