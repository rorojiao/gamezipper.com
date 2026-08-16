#!/usr/bin/env node
/* repro-crash.js: load a game with bundled chromium, replay playtest-like random input,
 * print every pageerror WITH stack trace. Usage: node repro-crash.js <slug> [durSec] [seed]
 * Rules: bundled chromium only, abort-only routes, browser closed at end. */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];
const DUR = parseInt(process.argv[3] || '12', 10);
let seed = parseInt(process.argv[4] || '12345', 10);
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.json': 'application/json', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let u; try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { u = '/'; }
  let fp = path.join(repo, u === '/' ? 'index.html' : u);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
const BLOCK = ['https://pagead2.googlesyndication.com/**', 'https://*.doubleclick.net/**', 'https://*.google-analytics.com/**', 'https://*.googletagmanager.com/**', 'https://*.monetag.com/**', 'https://*.magsrv.com/**', 'https://alwingulla.com/**', 'https://*.trycloudflare.com/**', 'https://*.cloudflareinsights.com/**', 'https://*.amazon-adsystem.com/**', 'https://*.clkmg.com/**', 'https://*.cap.1ktower.com/**', 'https://*.facebook.net/**', 'https://*.hotjar.com/**', 'https://*.adsterra.com/**', 'https://*.highperformanceformat.com/**', 'https://gamezipper.com/**', 'https://*.vignette.js/**'];

server.listen(0, '127.0.0.1', async () => {
  const PORT = server.address().port;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  for (const p of BLOCK) await page.route(p, r => r.abort());
  const ENV_NOISE = [/play\(\)/i, /NotAllowedError/, /autoplay/i, /AudioContext.*suspended/i, /user gesture/i, /The play\(\) request was interrupted/, /adsbygoogle|adsense|monetag|adsterra|clkmg|doubleclick|googlesyndication|trycloudflare/i, /net::ERR_FAILED.*pagead|ERR_BLOCKED/i, /AbortError/i, /audio/i];
  let nErr = 0;
  page.on('pageerror', e => {
    const t = String(e && e.message || e);
    if (ENV_NOISE.some(re => re.test(t))) return;
    nErr++;
    console.log('=== PAGEERROR #' + nErr + ' ===');
    console.log(String(e.stack || e).slice(0, 1500));
  });
  await page.goto(`http://127.0.0.1:${PORT}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);
  // shield against link navigation (same as playtest)
  await page.evaluate(`(() => { if (window.__gzptShield) return; window.__gzptShield = true; document.addEventListener('click', e => { const t = e.target; if (!t || !t.closest) return; const a = t.closest('a[href]'); if (!a) return; const h = a.getAttribute('href') || ''; if (h.startsWith('#') || h.startsWith('javascript:') || a.target === '_blank') return; e.preventDefault(); e.stopPropagation(); }, true); })()`);
  const SAFE = `(x, y) => { const el = document.elementFromPoint(x, y); if (!el || !el.closest) return true; const a = el.closest('a[href]'); if (!a) return true; const h = a.getAttribute('href') || ''; return h.startsWith('#') || h.startsWith('javascript:') || a.target === '_blank'; }`;
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const t0 = Date.now();
  let inputCount = 0;
  while (Date.now() - t0 < DUR * 1000) {
    await sleep(250 + rnd() * 300);
    const roll = rnd();
    try {
      if (roll < 0.40) {
        for (let t = 0; t < 3; t++) {
          const x = Math.round(1280 * (0.2 + rnd() * 0.6)), y = Math.round(800 * (0.2 + rnd() * 0.6));
          if (!(await page.evaluate(SAFE, x, y).catch(() => true))) continue;
          await page.mouse.click(x, y); inputCount++; break;
        }
      } else if (roll < 0.65) { const k = keys[(rnd() * 4) | 0]; await page.keyboard.press(k); inputCount++; }
      else if (roll < 0.85) { await page.keyboard.press('Space'); inputCount++; }
      else {
        const x1 = Math.round(1280 * (0.2 + rnd() * 0.6)), y1 = Math.round(800 * (0.2 + rnd() * 0.6));
        const x2 = Math.round(1280 * (0.2 + rnd() * 0.6)), y2 = Math.round(800 * (0.2 + rnd() * 0.6));
        if (!(await page.evaluate(SAFE, x1, y1).catch(() => true))) continue;
        await page.mouse.move(x1, y1); await page.mouse.down();
        await page.mouse.move(Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2), { steps: 3 });
        await page.mouse.move(x2, y2, { steps: 3 }); await page.mouse.up(); inputCount++;
      }
    } catch (e) { }
  }
  console.log(`[repro] ${slug} inputs=${inputCount} pageErrors=${nErr}`);
  await context.close();
  await browser.close();
  server.close();
  process.exit(0);
});
