// After Round 4 fix: check that 2048/sudoku/snake/chess are all "playable"
const { chromium } = require('/home/msdn/.nvm/versions/node/v22.22.0/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const GAMES = ['2048', 'chess', 'snake', 'sudoku', 'minesweeper', 'color-sort', 'magic-sort', 'flappy-wings', 'brick-breaker', 'kitty-cafe'];
const SHOTS = '/home/msdn/gamezipper.com/qa-round-4/evidence/screenshots-after-fix';

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const slug of GAMES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    const networkFails = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 150)); });
    page.on('pageerror', err => errors.push('PE: ' + err.message.slice(0, 150)));
    page.on('response', resp => {
      if (resp.status() >= 400 && !resp.url().includes('api/collect')) {
        networkFails.push(`${resp.status()} ${resp.url().slice(0, 100)}`);
      }
    });
    try {
      await page.goto(`https://gamezipper.com/${slug}/?bust=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      // dismiss tap-to-start
      const tap = await page.$('#gz-tap-start');
      if (tap) { try { await tap.click({ timeout: 1000 }); } catch {} }
      // for sudoku: pick Easy
      if (slug === 'sudoku') {
        try {
          const easy = await page.$('text=Easy, button:has-text("Easy"), [class*="easy" i]');
          if (easy) await easy.click();
        } catch {}
      }
      // press arrows
      for (const k of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
        try { await page.keyboard.press(k); await page.waitForTimeout(200); } catch {}
      }
      // click center
      try { await page.mouse.click(640, 400); } catch {}
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SHOTS, `${slug}.png`), fullPage: false });
      console.log(`✓ ${slug}: ${errors.length} console_errors, ${networkFails.length} net_fails`);
      if (errors.length) errors.slice(0, 3).forEach(e => console.log(`    err: ${e}`));
      if (networkFails.length) networkFails.slice(0, 3).forEach(f => console.log(`    net: ${f}`));
    } catch (e) {
      console.log(`✗ ${slug}: ${e.message.slice(0, 100)}`);
    }
    await ctx.close();
  }
  await browser.close();
})();
