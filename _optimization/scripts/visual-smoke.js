#!/usr/bin/env node
/* Visual smoke pass over every game, via Playwright BUNDLED chromium (never system
 * Chrome — 浏览器铁律: chromium.launch() default, no channel param).
 * Per game: load over local HTTP, capture console/page errors + failed subresource
 * requests (external ad/analytics noise filtered), click a PLAY control (fallback:
 * Space/Enter + canvas center click), take load+play JPEG screenshots, detect truly
 * contentless pages (all canvases blank incl. WebGL check AND no DOM text).
 * Output: evidence/<slug>/visual-load.jpg + visual-play.jpg + reports/visual-smoke.json.
 * Lifecycle: browser closed + server killed in finally (开一个关一个). */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const EV = path.join(repo, '_optimization', 'evidence');
const REPORT = path.join(repo, '_optimization', 'reports', 'visual-smoke.json');
const PORT = 8123;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let p = path.join(repo, u === '/' ? 'index.html' : u);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});

const only = process.argv[2] ? process.argv[2].split(',') : null;
const slugs = (only || fs.readdirSync(repo).filter(d => {
  const p = path.join(repo, d, 'index.html');
  return fs.existsSync(p) && fs.statSync(p).isFile() && !d.startsWith('_');
}).sort());

const PLAY_SEL = ['[id*="play" i]', '.play-btn', '.playBtn', '#startBtn', '[id*="start" i]', 'button:has-text("Play")', 'button:has-text("PLAY")', 'button:has-text("Start")', 'button:has-text("开始")', 'a:has-text("Play")'];
// external ad/analytics/offline noise — never a game defect
const NOISE = /ERR_NAME_NOT_RESOLVED|TagError|net::ERR_BLOCKED|net::ERR_CONNECTION|net::ERR_INTERNET|net::ERR_ABORTED|net::ERR_TIMED_OUT|favicon|adsbygoogle|doubleclick|googletagmanager|google-analytics|googleads|gtag|cdn\.jsdelivr|unpkg\.com|fonts\.googleapis|Content Security Policy|Refused to (load|apply|execute)/i;

// classify page content: 'rendered' if any canvas has pixel variance (2d or webgl);
// 'dom-ok' if no canvas but the DOM has real text; 'blank' only when nothing at all.
const CANVAS_EVAL = `(() => {
  const cs = [...document.querySelectorAll('canvas')];
  let canvases = cs.length, live = 0;
  for (const c of cs) {
    let g = null;
    try { g = c.getContext('2d'); } catch {}
    if (g) {
      const d = g.getImageData(0, 0, Math.min(64, c.width || 1), Math.min(64, c.height || 1)).data;
      let first = d[0] + ':' + d[1] + ':' + d[2] + ':' + d[3], vary = false;
      for (let i = 4; i < d.length; i += 4) if (d[i] + ':' + d[i+1] + ':' + d[i+2] + ':' + d[i+3] !== first) { vary = true; break; }
      if (vary) live++;
      continue;
    }
    let gl = null;
    try { gl = c.getContext('webgl') || c.getContext('experimental-webgl'); } catch {}
    if (gl) {
      const px = new Uint8Array(4 * 256);
      try { gl.readPixels(0, 0, 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, px); } catch {}
      let vary = false;
      for (let i = 0; i < px.length; i++) if (px[i] !== px[0]) { vary = true; break; }
      if (vary) live++;
    }
  }
  const text = (document.body ? document.body.innerText : '').replace(/\\s+/g, ' ').trim();
  return { canvases, live, textLen: text.length, cls: live > 0 ? 'rendered' : (canvases === 0 && text.length > 40 ? 'dom-ok' : (text.length > 40 ? 'dom-only' : 'blank')) };
})()`;

async function contentClass(page) {
  try { return await page.evaluate(CANVAS_EVAL); } catch { return { canvases: 0, live: 0, textLen: -1, cls: 'eval-failed' }; }
}

async function gameOne(page, slug) {
  const out = { slug, consoleErrors: [], pageErrors: [], failedRequests: [], content: null, clickedPlay: false, shots: [] };
  const onConsole = m => { if (m.type() === 'error' && !NOISE.test(m.text())) out.consoleErrors.push(m.text().slice(0, 200)); };
  const onPageErr = e => { const s = String(e); if (!NOISE.test(s)) out.pageErrors.push(s.slice(0, 200)); };
  const onResp = r => { if (r.status() >= 400 && r.url().startsWith('http://127.0.0.1:' + PORT)) out.failedRequests.push(r.status() + ' ' + r.url().replace('http://127.0.0.1:' + PORT, '').slice(0, 120)); };
  page.on('console', onConsole); page.on('pageerror', onPageErr); page.on('response', onResp);
  const evDir = path.join(EV, slug);
  try { fs.mkdirSync(evDir, { recursive: true }); } catch {}
  try {
    await page.goto('http://127.0.0.1:' + PORT + '/' + slug + '/', { waitUntil: 'load', timeout: 12000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(evDir, 'visual-load.jpg'), type: 'jpeg', quality: 62, width: 640 });
    out.shots.push('visual-load.jpg');
    for (const sel of PLAY_SEL) {
      const loc = page.locator(sel).first();
      try { if (await loc.count() && await loc.isVisible()) { await loc.click({ timeout: 1500 }); out.clickedPlay = true; break; } } catch {}
    }
    if (!out.clickedPlay) {
      try { await page.keyboard.press('Space'); } catch {}
      try { const c = page.locator('canvas').first(); if (await c.count()) await c.click({ timeout: 1000 }); } catch {}
    }
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(evDir, 'visual-play.jpg'), type: 'jpeg', quality: 62, width: 640 });
    out.shots.push('visual-play.jpg');
    out.content = await contentClass(page);
  } catch (e) {
    out.fatal = String(e).slice(0, 200);
  }
  page.off('console', onConsole); page.off('pageerror', onPageErr); page.off('response', onResp);
  // generic "Failed to load resource" console lines carry no URL; if nothing on our own
  // origin failed, they're external ad/analytics fetches — drop them (noise).
  if (!out.failedRequests.length) out.consoleErrors = out.consoleErrors.filter(e => !/^Failed to load resource/.test(e));
  return out;
}

(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch(); // bundled chromium — NEVER channel:"chrome"
  const results = [];
  const WORKERS = 3;
  let idx = 0;
  async function worker() {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await ctx.newPage();
    while (idx < slugs.length) {
      const slug = slugs[idx++];
      const r = await gameOne(page, slug);
      results.push(r);
      const bad = r.fatal || r.content === null || ['blank', 'eval-failed'].includes(r.content.cls) || r.consoleErrors.length || r.pageErrors.length || r.failedRequests.length ? ' *' : '';
      console.log('[' + results.length + '/' + slugs.length + '] ' + slug + ' play=' + (r.clickedPlay ? 'Y' : 'n') + ' cls=' + (r.content ? r.content.cls : '?') + ' err=' + (r.consoleErrors.length + r.pageErrors.length) + ' req=' + r.failedRequests.length + bad);
    }
    await ctx.close();
  }
  try {
    await Promise.all(Array.from({ length: WORKERS }, worker));
  } finally {
    await browser.close().catch(() => {});
    try { browser.process() && browser.process().kill('SIGKILL'); } catch {} // belt & braces
    server.close();
  }
  fs.writeFileSync(REPORT, JSON.stringify({ updated: new Date().toISOString(), total: results.length, results }, null, 1));
  const flagged = results.filter(r => r.fatal || r.content === null || ['blank', 'eval-failed'].includes(r.content ? r.content.cls : 'blank') || r.consoleErrors.length || r.pageErrors.length || r.failedRequests.length);
  console.log(JSON.stringify({ total: results.length, flagged: flagged.length, flaggedSlugs: flagged.map(f => f.slug) }));
})();
