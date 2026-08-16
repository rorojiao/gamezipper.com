#!/usr/bin/env node
/* Reproduce a game crash with staged evidence: load-only vs after-interaction.
 * Usage: node repro.js <slug> */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: node repro.js <slug>'); process.exit(1); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.json': 'application/json', '.ico': 'image/x-icon' };
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
  const BLOCK = ['https://pagead2.googlesyndication.com/**', 'https://*.trycloudflare.com/**', 'https://*.monetag.com/**', 'https://*.magsrv.com/**', 'https://gamezipper.com/**', 'https://*.doubleclick.net/**'];
  for (const p of BLOCK) await page.route(p, r => r.abort());
  const errs = [];
  page.on('pageerror', e => errs.push({ src: 'pageerror', msg: String(e.message).slice(0, 250), stack: String(e.stack || '').split('\n').slice(0, 4).join(' | ').slice(0, 400) }));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errs.push({ src: 'console', msg: m.text().slice(0, 250) }); });

  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  const stage1 = errs.slice();
  await page.screenshot({ path: `/tmp/repro-${slug}-1-load.png` });
  // interactions
  try { await page.mouse.click(640, 400); } catch (e) {}
  await page.waitForTimeout(800);
  try { await page.keyboard.press('Space'); } catch (e) {}
  await page.waitForTimeout(800);
  try { await page.mouse.click(640, 400, { button: 'right' }); await page.mouse.move(300, 300); await page.mouse.down(); await page.mouse.move(900, 500, { steps: 8 }); await page.mouse.up(); } catch (e) {}
  await page.waitForTimeout(1200);
  const stage2 = errs.slice();
  await page.screenshot({ path: `/tmp/repro-${slug}-2-interact.png` });
  const dom = await page.evaluate(() => ({ title: document.title.slice(0, 80), canvas: document.querySelectorAll('canvas').length, text: (document.body.innerText || '').length })).catch(e => ({ err: String(e).slice(0, 100) }));
  console.log(JSON.stringify({ slug, dom, loadStage: stage1, afterInteract: stage2.slice(stage1.length) }, null, 1));
  await browser.close(); server.close(); process.exit(0);
});
