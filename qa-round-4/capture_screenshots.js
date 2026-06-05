// Capture screenshot of each game after interaction
const { chromium } = require('/home/msdn/.nvm/versions/node/v22.22.0/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/msdn/gamezipper.com';
const SHOTS = path.join(ROOT, 'qa-round-4', 'evidence', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const GAMES = process.argv[2] ? process.argv[2].split(',') : ['2048', 'chess', 'snake', 'sudoku', 'minesweeper', 'color-sort', 'magic-sort', 'flappy-wings', 'brick-breaker', 'kitty-cafe', 'abyss-chef', 'glyph-quest', 'ocean-gem-pop'];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const slug of GAMES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 100)); });
    page.on('pageerror', err => errors.push('PE: ' + err.message.slice(0, 100)));

    try {
      await page.goto(`https://gamezipper.com/${slug}/?bust=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);

      // Screenshot 1: before any interaction
      await page.screenshot({ path: path.join(SHOTS, `${slug}-1-initial.png`), fullPage: false });

      // Dismiss tap-to-start if present
      const tap = await page.$('#gz-tap-start');
      if (tap) {
        try { await tap.click({ timeout: 1000 }); await page.waitForTimeout(1000); } catch {}
      }

      // Try keyboard arrows (for 2048/snake/sudoku)
      for (const k of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
        try { await page.keyboard.press(k); await page.waitForTimeout(200); } catch {}
      }

      // Try mouse click in middle
      try { await page.mouse.click(640, 400); } catch {}
      await page.waitForTimeout(1000);

      // Screenshot 2: after interactions
      await page.screenshot({ path: path.join(SHOTS, `${slug}-2-after.png`), fullPage: false });

      // Check final state
      const state = await page.evaluate(() => {
        const text = (document.body.innerText || '').slice(0, 400);
        // Look for game-over / win / lose / game-over
        const indicators = {};
        ['game-over', 'game over', 'you win', 'you lose', 'Game Over', 'You Win', 'You Lose', 'Play Again', 'Restart'].forEach(k => {
          if (text.toLowerCase().includes(k.toLowerCase())) indicators[k] = true;
        });
        return { text, indicators };
      });
      console.log(`${slug}: ${errors.length} errors. Indicators: ${JSON.stringify(state.indicators)}`);
      if (errors.length > 0) errors.slice(0, 3).forEach(e => console.log(`  - ${e}`));
    } catch (e) {
      console.log(`${slug}: CRASHED ${e.message.slice(0, 100)}`);
    }
    await ctx.close();
  }
  await browser.close();
  console.log('\nScreenshots in:', SHOTS);
})();
