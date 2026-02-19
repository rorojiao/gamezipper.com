const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const html = fs.readFileSync('/home/msdn/memory-match/index.html', 'utf-8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(html);
  }).listen(9877);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  
  await page.goto('http://localhost:9877');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/msdn/.openclaw/workspace/test-memory-match.png' });

  // Click start button area
  await page.click('canvas', { position: { x: 195, y: 600 } });
  await page.waitForTimeout(500);
  // Click a card
  await page.click('canvas', { position: { x: 100, y: 300 } });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/msdn/.openclaw/workspace/test-memory-match-2.png' });

  console.log('JS errors:', errors);
  if (errors.length) { console.error('FAIL: JS errors found'); process.exit(1); }
  console.log('PASS');

  await browser.close();
  server.close();
})();
