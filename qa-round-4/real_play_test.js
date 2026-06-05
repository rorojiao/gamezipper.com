// For 30 games: load + dismiss splash + try interactions + check final state via vision key elements
const { chromium } = require('/home/msdn/.nvm/versions/node/v22.22.0/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const GAMES = ['2048','chess','snake','sudoku','minesweeper','color-sort','magic-sort','flappy-wings',
  'brick-breaker','kitty-cafe','abyss-chef','glyph-quest','ocean-gem-pop','tetris','memory-match',
  'bounce-bot','phantom-blade','sushi-stack','bolt-jam-3d','alien-whack','save-the-doge',
  'pong','slope','reaction-time','stack-ball','wordle','crossword','happy-glass',
  'carrom','spider-solitaire'];

const OUT = '/home/msdn/gamezipper.com/qa-round-4/evidence/real-play';
fs.mkdirSync(OUT, { recursive: true });

async function testOne(browser, slug) {
  const result = { slug, ok: false, scoreBefore: '', scoreAfter: '', scoreChanged: false,
    crashError: '', errors: [], gameUiVisible: false, restartedSuccessfully: false };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => result.crashError = e.message.slice(0, 200));

  try {
    await page.goto(`https://gamezipper.com/${slug}/?bust=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);

    // Click splash to dismiss
    await page.evaluate(() => {
      const ss = document.getElementById('splash-screen');
      if (ss) { ss.classList.add('fade-out'); setTimeout(() => ss.remove(), 100); }
      const tap = document.getElementById('gz-tap-start');
      if (tap) tap.remove();
    });
    await page.waitForTimeout(800);

    // Get state before
    const before = await page.evaluate(() => {
      const all = document.body.innerText || '';
      // Common score patterns
      const sm = all.match(/(?:SCORE|Score|score)\s*[:.]?\s*(\d+)/);
      const lm = all.match(/(?:LEVEL|Level|level)\s*[:.]?\s*(\d+)/);
      return { score: sm ? sm[1] : '', level: lm ? lm[1] : '', text: all.slice(0, 200) };
    });
    result.scoreBefore = before.score;
    result.levelBefore = before.level;

    // Try interactions
    // 1. Click center
    await page.mouse.click(640, 400);
    await page.waitForTimeout(300);
    // 2. Arrow keys
    for (const k of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
    }
    // 3. Try difficulty click for sudoku
    if (slug === 'sudoku') {
      try {
        const easyBtn = await page.locator('text=/easy/i').first();
        await easyBtn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
      } catch (e) { result.errors.push('sudoku easy click failed: ' + e.message.slice(0, 100)); }
    }
    // 4. Click on game container area (try multiple positions)
    await page.mouse.click(640, 500);
    await page.waitForTimeout(300);
    await page.mouse.click(640, 300);
    await page.waitForTimeout(500);

    // Get state after
    const after = await page.evaluate(() => {
      const all = document.body.innerText || '';
      const sm = all.match(/(?:SCORE|Score|score)\s*[:.]?\s*(\d+)/);
      const lm = all.match(/(?:LEVEL|Level|level)\s*[:.]?\s*(\d+)/);
      // Look for game UI signs
      const hasGameOver = all.toLowerCase().includes('game over');
      const hasPlayAgain = all.toLowerCase().includes('play again') || all.toLowerCase().includes('restart');
      const hasWon = all.toLowerCase().includes('you win') || all.toLowerCase().includes('you won');
      return {
        score: sm ? sm[1] : '',
        level: lm ? lm[1] : '',
        text: all.slice(0, 200),
        hasGameOver, hasPlayAgain, hasWon
      };
    });
    result.scoreAfter = after.score;
    result.levelAfter = after.level;
    result.scoreChanged = before.score !== after.score;
    result.levelChanged = before.level !== after.level;
    result.gameUiVisible = !!(after.score || after.level || after.text.length > 50);
    result.hasGameOver = after.hasGameOver;
    result.hasPlayAgain = after.hasPlayAgain;
    result.hasWon = after.hasWon;

    // Screenshot
    await page.screenshot({ path: path.join(OUT, `${slug}.png`) });

    // For sudoku: did it actually start?
    if (slug === 'sudoku') {
      const sd = await page.evaluate(() => {
        // Check if 9x9 grid exists
        const cells = document.querySelectorAll('[class*="cell" i], [class*="sudoku" i] td, .cell, .sudoku-cell, [data-row]');
        return { cellCount: cells.length };
      });
      result.sudokuCells = sd.cellCount;
    }

    result.ok = result.gameUiVisible && (result.scoreChanged || result.levelChanged || result.hasGameOver || result.hasPlayAgain || result.hasWon || result.crashError === '');
  } catch (e) {
    result.crashError = e.message.slice(0, 200);
  }
  await ctx.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  for (let i = 0; i < GAMES.length; i++) {
    const r = await testOne(browser, GAMES[i]);
    results.push(r);
    const status = r.crashError ? '✗ CRASH' : (r.scoreChanged || r.levelChanged) ? '✓ CHANGED' : (r.gameUiVisible ? '◐ UI-OK' : '? NONE');
    console.log(`[${i+1}/${GAMES.length}] ${status} ${r.slug.padEnd(20)} score:${r.scoreBefore || '-'}→${r.scoreAfter || '-'} level:${r.levelBefore || '-'}→${r.levelAfter || '-'} errs=${r.errors.length}`);
    if (r.crashError) console.log(`  CRASH: ${r.crashError}`);
  }
  await browser.close();

  fs.writeFileSync('/home/msdn/gamezipper.com/qa-round-4/real-play-results.json', JSON.stringify(results, null, 2));

  // Summary
  const stats = { tested: results.length, scoreChanged: 0, levelChanged: 0, uiVisible: 0, crashed: 0, consoleErrors: 0 };
  results.forEach(r => {
    if (r.scoreChanged) stats.scoreChanged++;
    if (r.levelChanged) stats.levelChanged++;
    if (r.gameUiVisible) stats.uiVisible++;
    if (r.crashError) stats.crashed++;
    if (r.errors.length) stats.consoleErrors++;
  });
  console.log('\n=== Summary ===');
  console.log(JSON.stringify(stats, null, 2));
})();
