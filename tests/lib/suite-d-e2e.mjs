// tests/lib/suite-d-e2e.mjs — E2E smoke over a local static server + Playwright (cases.md Suite D).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, loadGames, listRootPages, SuiteResult } from './common.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

const AD_NOISE = /monetag|adsterra|adsbygoogle|googlesyndication|doubleclick|1ktower|alwingulla|gamedistribution|imasdk|amazon-adsystem|ads\.google|pagead/i;

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.includes('..')) { res.writeHead(403).end(); return; }
      let file = path.join(ROOT, p);
      if (p.endsWith('/')) file = path.join(file, 'index.html');
      else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) { res.writeHead(301, { Location: p + '/' }).end(); return; }
      if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

export default async function suiteD() {
  const R = new SuiteResult('D:e2e');
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch (e) { R.record('D1', 'playwright', false, 'playwright import failed: ' + e.message); return R; }

  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  R.record('D1', 'local-server', true, base);

  const games = loadGames();
  const pages = [
    ...listRootPages().map(f => '/' + f),
    ...games.map(g => g.url),
  ];
  // Redirect stubs & search-engine verification files are not real pages.
  const metaRefresh = new Map();
  for (const p of pages) {
    const rel = p.slice(1) || 'index.html';
    const file = rel.endsWith('/') ? rel + 'index.html' : rel;
    try {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const m = html.match(/http-equiv="refresh"[^>]*url=([^"'\s>]+)/i) || html.match(/http-equiv="refresh"[^>]*content="0;\s*url=([^"']+)/i);
      if (m) metaRefresh.set(p, m[1]);
    } catch {}
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  } catch (e) {
    R.record('D2', 'chromium-launch', false, e.message.split('\n')[0]);
    server.close();
    return R;
  }

  async function checkPage(urlPath) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    // External requests → empty 200 so ad/analytics scripts no-op instead of hanging.
    await context.route(/^https?:\/\//, route => {
      const u = route.request().url();
      if (u.startsWith(base)) return route.continue();
      const ext = path.extname(new URL(u).pathname).toLowerCase();
      return route.fulfill({ status: 200, contentType: MIME[ext] || 'text/javascript', body: '' });
    });
    const page = await context.newPage();
    const jsErrors = [], adNoise = [], local404 = [];
    page.on('pageerror', e => { (AD_NOISE.test(String(e)) ? adNoise : jsErrors).push(String(e).split('\n')[0]); });
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      (AD_NOISE.test(t) ? adNoise : jsErrors).push(t.split('\n')[0]);
    });
    page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) local404.push(`${r.status()} ${r.url().slice(base.length)}`); });
    try {
      await page.goto(base + urlPath, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(400);
      const state = await page.evaluate(() => ({ title: document.title, bodyKids: document.body ? document.body.childElementCount : 0 }));
      R.record('D2', urlPath, jsErrors.length === 0, jsErrors.slice(0, 3).join(' || '));
      R.record('D3', urlPath, local404.length === 0, local404.slice(0, 5).join(' | '));
      if (/^\/google[a-f0-9]+\.html$/.test(urlPath)) {
        R.note(`${urlPath}: search-engine verification file, D4 skipped`);
      } else if (metaRefresh.has(urlPath)) {
        // Redirect stub: the refresh target must resolve to a real local page.
        const target = metaRefresh.get(urlPath).replace(/^https?:\/\/gamezipper\.com/i, '');
        const rel = target.replace(/^\//, '');
        const file = rel.endsWith('/') || rel === '' ? rel + 'index.html' : rel;
        R.record('D4', urlPath, fs.existsSync(path.join(ROOT, file)), `refresh target ${target} missing`);
      } else {
        R.record('D4', urlPath, !!state.title && state.bodyKids > 0, `title="${state.title}" bodyKids=${state.bodyKids}`);
      }
      if (adNoise.length) R.note(`${urlPath} adNoise: ${adNoise[0]}`);
    } catch (e) {
      R.record('D2', urlPath, false, 'goto: ' + String(e).split('\n')[0]);
    } finally {
      await context.close();
    }
  }

  const conc = 8;
  let i = 0;
  await Promise.all(Array.from({ length: conc }, async () => {
    while (i < pages.length) await checkPage(pages[i++]);
  }));
  await browser.close();
  server.close();
  R.note(`loaded ${pages.length} pages against ${base}`);
  return R;
}
