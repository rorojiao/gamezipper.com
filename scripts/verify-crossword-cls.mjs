#!/usr/bin/env node
import { createRequire } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('This verifier requires Playwright. Install it or make it available to Node.');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const contentTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

function startServer() {
  return new Promise((resolveServer, reject) => {
    const server = createServer((request, response) => {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      } catch {
        response.writeHead(400).end();
        return;
      }
      let file = resolve(root, `.${pathname}`);
      if (!file.startsWith(`${root}/`)) {
        response.writeHead(403).end();
        return;
      }
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': contentTypes[extname(file)] || 'application/octet-stream'
      });
      response.end(readFileSync(file));
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

function calculateCls(entries) {
  let maximum = 0;
  let windowValue = 0;
  let windowStart = 0;
  let previousTime = 0;
  for (const entry of entries) {
    if (!windowStart || entry.startTime - previousTime > 1000 || entry.startTime - windowStart > 5000) {
      windowStart = entry.startTime;
      windowValue = 0;
    }
    windowValue += entry.value;
    maximum = Math.max(maximum, windowValue);
    previousTime = entry.startTime;
  }
  return maximum;
}

async function verifyViewport(browser, viewport, pageUrl) {
  const context = await browser.newContext({
    viewport,
    isMobile: Boolean(viewport.isMobile),
    hasTouch: Boolean(viewport.hasTouch)
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__crosswordLayoutShifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__crosswordLayoutShifts.push({ value: entry.value, startTime: entry.startTime });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const preStart = await page.evaluate(() => ({
    shifts: window.__crosswordLayoutShifts,
    aboveReused: document.querySelector('#gz-ad-above-game')?.dataset.gzBannerReused,
    belowReused: document.querySelector('#gz-ad-below-canvas')?.dataset.gzBannerReused,
    initialOverlay: !document.querySelector('#start-overlay')?.classList.contains('hidden')
  }));

  await page.locator('#puzzle-list .puzzle-card').first().click();
  const input = page.locator('#crossword-grid .cell input').first();
  await input.waitFor();
  await input.fill('A');
  const game = await page.evaluate(() => ({
    cells: document.querySelectorAll('#crossword-grid .cell').length,
    inputValue: document.querySelector('#crossword-grid .cell input')?.value,
    overlayHidden: document.querySelector('#start-overlay')?.classList.contains('hidden')
  }));

  const cls = calculateCls(preStart.shifts);
  await context.close();
  if (pageErrors.length) throw new Error(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
  if (cls >= 0.1) throw new Error(`${viewport.name}: CLS ${cls.toFixed(6)} is not below 0.1`);
  if (!preStart.initialOverlay || preStart.aboveReused !== '1' || preStart.belowReused !== '1') {
    throw new Error(`${viewport.name}: expected the static overlay and ad placeholders to initialize`);
  }
  if (!game.cells || game.inputValue !== 'A' || !game.overlayHidden) {
    throw new Error(`${viewport.name}: game start or text input failed`);
  }
  return { viewport: viewport.name, cls, shifts: preStart.shifts.length, cells: game.cells };
}

const html = readFileSync(join(root, 'crossword/index.html'), 'utf8');
const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
for (const [, value] of jsonLd) JSON.parse(value.trim());

const server = await startServer();
try {
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    const { port } = server.address();
    const pageUrl = `http://127.0.0.1:${port}/crossword/`;
    results.push(await verifyViewport(browser, { name: 'desktop', width: 1280, height: 800 }, pageUrl));
    results.push(await verifyViewport(browser, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }, pageUrl));
    console.log(JSON.stringify({ jsonLd: 'valid', results }, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  await new Promise(resolveServer => server.close(resolveServer));
}
