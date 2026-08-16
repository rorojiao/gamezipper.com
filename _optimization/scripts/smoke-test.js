#!/usr/bin/env node
/* Phase 1 smoke test: headless-chromium load every game, capture errors/404s/canvas-boot/screenshot.
 * Usage: node smoke-test.js [--limit N] [--only a,b,c] [--force] [--concurrency 6]
 * Evidence: _optimization/evidence/<slug>/smoke.{json,png} + aggregate _optimization/reports/smoke-results.json
 * Rules: bundled chromium only (no channel), single browser, closed at end. External ad/analytics requests blocked. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '..', '..');
const EV = p => path.join(repo, '_optimization', 'evidence', p);
const REP = path.join(repo, '_optimization', 'reports');
const RESULTS = path.join(REP, 'smoke-results.json');

const args = process.argv.slice(2);
const argOf = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const LIMIT = parseInt(argOf('--limit') || '0', 10);
const ONLY = argOf('--only') ? argOf('--only').split(',') : null;
const FORCE = args.includes('--force');
const CONC = parseInt(argOf('--concurrency') || '6', 10);

const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'inventory.json'), 'utf8')).games;
let targets = inventory.map(g => g.slug);
if (ONLY) targets = targets.filter(s => ONLY.includes(s));
if (LIMIT > 0) targets = targets.slice(0, LIMIT);

// ---- static server ----
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.json': 'application/json', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let u;
  try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { u = '/'; }
  let fp = path.join(repo, u === '/' ? 'index.html' : u);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
server.listen(0, '127.0.0.1');

// Abort-only routes for ad/analytics/prod domains (route.continue() is broken in this env; never call it)
const BLOCK_PATTERNS = [
  'https://pagead2.googlesyndication.com/**', 'https://*.doubleclick.net/**', 'https://*.google-analytics.com/**',
  'https://*.googletagmanager.com/**', 'https://*.monetag.com/**', 'https://*.magsrv.com/**', 'https://alwingulla.com/**',
  'https://*.trycloudflare.com/**', 'https://*.cloudflareinsights.com/**', 'https://*.amazon-adsystem.com/**',
  'https://*.clkmg.com/**', 'https://*.cap.1ktower.com/**', 'https://*.facebook.net/**', 'https://*.hotjar.com/**',
  'https://*.adsterra.com/**', 'https://*.highperformanceformat.com/**', 'https://gamezipper.com/**', 'https://*.vignette.js/**',
];
const ENV_NOISE = [/play\(\)/i, /NotAllowedError/, /autoplay/i, /AudioContext.*suspended/i, /user gesture/i, /The play\(\) request was interrupted/, /adsbygoogle|adsense|monetag|adsterra|clkmg|doubleclick|googlesyndication|trycloudflare/i, /net::ERR_FAILED.*pagead|ERR_BLOCKED/i];

let results = {};
if (fs.existsSync(RESULTS) && !FORCE) {
  try { results = JSON.parse(fs.readFileSync(RESULTS, 'utf8')).results || {}; } catch (e) { results = {}; }
}
const queue = targets.filter(s => FORCE || !results[s]);
const total = targets.length;
let done = Object.keys(results).length;
let saveTick = 0;

function persist() {
  fs.writeFileSync(RESULTS, JSON.stringify({ updated: new Date().toISOString(), total_in_scope: total, done, results }, null, 1));
}

async function testGame(page, slug) {
  const rec = { slug, ts: new Date().toISOString() };
  const consoleMsgs = [], pageErrors = [], badResources = [], envNoise = [];
  let blockedCount = 0;
  const onConsole = m => {
    if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push({ type: m.type(), text: (m.text() || '').slice(0, 300) });
  };
  const onPageErr = e => pageErrors.push(String(e && e.message || e).slice(0, 300));
  const onResponse = r => {
    const s = r.status();
    if (s >= 400) {
      const h = new URL(r.url()).host;
      if (h === '127.0.0.1') badResources.push({ url: r.url().replace('http://127.0.0.1:' + PORT, ''), status: s });
    }
  };
  const onReqFail = r => {
    const fu = r.url(); const h = new URL(fu).host;
    if (h === '127.0.0.1') badResources.push({ url: fu.replace('http://127.0.0.1:' + PORT, ''), failure: (r.failure() || {}).errorText });
    else blockedCount++;
  };
  page.on('console', onConsole); page.on('pageerror', onPageErr); page.on('response', onResponse); page.on('requestfailed', onReqFail);
  try {
    const resp = await page.goto(`http://127.0.0.1:${PORT}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    rec.httpStatus = resp ? resp.status() : 0;
    await page.waitForTimeout(3500);
    rec.dom = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll('canvas')];
      const visibleCanvas = canvases.find(c => c.width > 0 && c.getBoundingClientRect().width > 50);
      const h1 = document.querySelector('h1');
      const interactives = document.querySelectorAll('button, [role=button], .cell, .tile, .grid div, .board div, input, select').length;
      return {
        title: document.title.slice(0, 120),
        h1: h1 ? h1.textContent.trim().slice(0, 80) : null,
        canvasCount: canvases.length,
        canvasW: visibleCanvas ? visibleCanvas.width : 0,
        canvasDrawn: !!visibleCanvas,
        interactives, bodyText: (document.body.innerText || '').length,
      };
    }).catch(e => ({ evalError: String(e).slice(0, 200) }));
    // rAF liveness probe (max 1.8s)
    rec.rafAlive = await page.evaluate(() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      const cb = () => { n++; if (n >= 5) res(true); else if (performance.now() - t0 > 1800) res(false); else requestAnimationFrame(cb); };
      requestAnimationFrame(cb);
      setTimeout(() => res(n > 0), 1900);
    })).catch(() => null);
    // central click interaction probe
    try {
      await page.mouse.click(640, 400);
      await page.keyboard.press('Space');
      await page.waitForTimeout(400);
    } catch (e) { /* ignore */ }
    await page.screenshot({ path: EV(`${slug}/smoke.png`) }).catch(() => {});
    // classify
    // classify: generic ERR_FAILED console errors up to the number of our aborted requests are ad-block noise
    let genericErrf = 0;
    const realConsoleErrors = consoleMsgs.filter(m => {
      if (m.type !== 'error') return false;
      if (ENV_NOISE.some(re => re.test(m.text))) return false;
      if (/Failed to load resource.*ERR_FAILED/i.test(m.text) && genericErrf++ < blockedCount) return false;
      return true;
    });
    envNoise.push(...consoleMsgs.filter(m => ENV_NOISE.some(re => re.test(m.text))).map(m => m.text.slice(0, 100)));
    const realPageErrors = pageErrors.filter(t => !ENV_NOISE.some(re => re.test(t)));
    rec.consoleErrors = realConsoleErrors.slice(0, 10);
    rec.pageErrors = realPageErrors.slice(0, 10);
    rec.envNoiseCount = envNoise.length;
    rec.badResources = badResources.slice(0, 10);
    rec.blockedExternal = blockedCount;
    rec.consoleWarnings = consoleMsgs.filter(m => m.type === 'warning').length;

    const d = rec.dom || {};
    const noBoot = d.evalError || (!d.canvasDrawn && (d.interactives || 0) < 6 && (d.bodyText || 0) < 200);
    if (rec.httpStatus !== 200) rec.verdict = 'FAIL';
    else if (realPageErrors.length > 0) rec.verdict = 'FAIL';
    else if (badResources.length > 0) rec.verdict = 'FAIL';
    else if (noBoot) rec.verdict = 'WARN';
    else rec.verdict = 'PASS';
    rec.severity = rec.verdict === 'FAIL' ? 'P0' : (rec.verdict === 'WARN' ? 'P1?' : 'OK');
  } catch (e) {
    rec.verdict = 'FAIL'; rec.error = String(e && e.message || e).slice(0, 300);
    rec.severity = rec.verdict.includes('Timeout') ? 'P0-timeout' : 'P0';
    await page.screenshot({ path: EV(`${slug}/smoke.png`) }).catch(() => {});
  } finally {
    page.off('console', onConsole); page.off('pageerror', onPageErr); page.off('response', onResponse); page.off('requestfailed', onReqFail);
  }
  return rec;
}

let PORT = 0;
server.on('listening', async () => {
  PORT = server.address().port;
  const browser = await chromium.launch(); // bundled chromium, headless default
  console.log(`[smoke] server=127.0.0.1:${PORT} games=${queue.length}/${total} conc=${CONC}`);
  const t0 = Date.now();
  let idx = 0;
  async function worker() {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    for (const pat of BLOCK_PATTERNS) await page.route(pat, r => r.abort());
    while (idx < queue.length) {
      const slug = queue[idx++];
      const rec = await testGame(page, slug);
      results[slug] = rec;
      done++;
      const dt = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`[${done}/${total}] ${slug} ${rec.verdict} ${rec.pageErrors?.length ? 'pageErr=' + rec.pageErrors.length : ''} ${rec.badResources?.length ? '404=' + rec.badResources.length : ''} ${dt}s`);
      if (++saveTick % 10 === 0) persist();
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  persist();
  await browser.close();
  server.close();
  const v = {};
  Object.values(results).forEach(r => v[r.verdict] = (v[r.verdict] || 0) + 1);
  console.log('[smoke] DONE', JSON.stringify(v), ((Date.now() - t0) / 1000 / 60).toFixed(1) + 'min');
  process.exit(0);
});
