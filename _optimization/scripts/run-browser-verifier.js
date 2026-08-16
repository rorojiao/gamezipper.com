#!/usr/bin/env node
/* Run a browser-convention verifier (async IIFE expecting DOM) against local server in Playwright.
 * Usage: node run-browser-verifier.js <slug> */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let u; try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { u = '/'; }
  let fp = path.join(repo, u);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  for (const p of ['https://pagead2.googlesyndication.com/**', 'https://*.trycloudflare.com/**', 'https://*.monetag.com/**', 'https://*.magsrv.com/**', 'https://gamezipper.com/**', 'https://*.doubleclick.net/**']) await page.route(p, r => r.abort());
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 150)));
  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);
  const code = fs.readFileSync(path.join(repo, slug, 'verify_engine.js'), 'utf8');
  const result = await page.evaluate(code).catch(e => ({ verdict: 'FAIL', harnessError: String(e).slice(0, 300) }));
  await page.screenshot({ path: path.join(repo, '_optimization', 'evidence', slug, 'browser-verify.png') }).catch(() => {});
  console.log(JSON.stringify({ slug, pageErrors: errs, result }, null, 1));
  await browser.close(); server.close(); process.exit(0);
});
