import { chromium } from 'playwright';

const GAMES = [
  { name: 'reaction-time', url: 'https://gamezipper.com/reaction-time/' },
  { name: 'slope', url: 'https://gamezipper.com/slope/' },
  { name: 'stacker', url: 'https://gamezipper.com/stacker/' },
  { name: 'sudoku', url: 'https://gamezipper.com/sudoku/' },
  { name: 'sushi-stack', url: 'https://gamezipper.com/sushi-stack/' },
  { name: 'typing-speed', url: 'https://gamezipper.com/typing-speed/' },
  { name: 'whack-a-mole', url: 'https://gamezipper.com/whack-a-mole/' },
];

const EXEC_PATH = '/home/msdn/.local/bin/google-chrome';

async function dismissSplash(page) {
  try {
    await page.evaluate(() => {
      const s = document.getElementById('splash-screen');
      if (s) { s.classList.add('fade-out'); setTimeout(() => s.remove(), 100); }
    });
    await page.waitForTimeout(200);
  } catch(e) {}
}

async function startGame(page, gameName) {
  // Game-specific start strategies
  if (gameName === 'sudoku') {
    await dismissSplash(page);
    await page.waitForTimeout(500);
    // Sudoku needs game.start() to initialize canvas
    const started = await page.evaluate(() => {
      if (typeof game !== 'undefined' && typeof game.start === 'function') {
        game.start('easy');
        return true;
      }
      return false;
    });
    if (started) { console.log('  [OK] Called game.start(easy)'); return true; }
  }

  if (gameName === 'sushi-stack') {
    await dismissSplash(page);
    await page.waitForTimeout(500);
    // Need to hide menuScreen then call startGame
    const started = await page.evaluate(() => {
      // Hide menu screen
      const menu = document.getElementById('menuScreen');
      if (menu) menu.classList.add('hidden');
      // Call startGame
      if (typeof window.startGame === 'function') {
        window.startGame(0);
        return true;
      }
      // Or try initLevel + showGame
      if (typeof initLevel === 'function') {
        initLevel(0);
        const menu2 = document.getElementById('menuScreen');
        if (menu2) menu2.classList.add('hidden');
        return true;
      }
      return false;
    });
    if (started) { console.log('  [OK] Started sushi-stack via JS'); return true; }
  }

  if (gameName === 'typing-speed') {
    await dismissSplash(page);
    await page.waitForTimeout(500);
    // Typing speed needs input focus
    const started = await page.evaluate(() => {
      const input = document.getElementById('inputArea');
      if (input) { input.focus(); return true; }
      return false;
    });
    if (started) { console.log('  [OK] Focused typing input'); return true; }
  }

  // Generic: try window.startGame first
  const hasStart = await page.evaluate(() => typeof window.startGame === 'function');
  if (hasStart) {
    await page.evaluate(() => window.startGame());
    console.log('  [OK] Called window.startGame()');
    return true;
  }

  // Try button clicks
  const selectors = [
    '#start-btn', '#play-btn', '#start', '#play',
    'button:has-text("Start")', 'button:has-text("Play")',
    'button:has-text("BEGIN")', 'button:has-text("Engage")',
    'button:has-text("begin")', 'button:has-text("GO")',
    'button:has-text("▶ PLAY")', 'button:has-text("PLAY")',
  ];
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.click({ timeout: 2000 });
        console.log(`  [OK] Clicked: ${sel}`);
        return true;
      }
    } catch(e) {}
  }

  // Canvas click as last resort
  const canvas = page.locator('canvas').first();
  if (await canvas.count() > 0) {
    try {
      await canvas.click({ timeout: 2000, force: true });
      console.log('  [OK] Force-clicked canvas');
      return true;
    } catch(e) {}
  }

  return false;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: EXEC_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  const results = [];

  for (const game of GAMES) {
    console.log(`\n========== Testing: ${game.name} ==========`);
    const result = { name: game.name, status: 'FAIL', details: {} };
    const consoleErrors = [];

    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    try {
      // Step 1: Navigate and wait
      await page.goto(game.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(3000);

      // Step 2: Screenshot initial state
      await page.screenshot({ path: `/tmp/${game.name}_initial.png` });

      // Step 3: Start the game
      const started = await startGame(page, game.name);
      await page.waitForTimeout(1500);

      // Step 4: Perform actions based on game type
      for (let i = 0; i < 7; i++) {
        if (game.name === 'typing-speed') {
          await page.keyboard.type('the be to of and a in that have i it for not ');
          await page.waitForTimeout(200);
        } else if (game.name === 'slope') {
          await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight');
          await page.waitForTimeout(200);
        } else if (game.name === 'sudoku') {
          // Click numpad buttons
          const num = (i % 9) + 1;
          try {
            await page.locator(`.num-btn:text("${num}")`).first().click({ timeout: 1000 });
          } catch(e) {}
          await page.waitForTimeout(300);
        } else if (game.name === 'reaction-time') {
          await page.waitForTimeout(1500);
        } else if (game.name === 'sushi-stack') {
          // Sushi stack is 3D, just click canvas area
          try {
            await page.mouse.click(640 + (i % 3) * 50 - 75, 360 + (i % 2) * 50 - 25, { timeout: 1000 });
          } catch(e) {}
          await page.waitForTimeout(300);
        } else {
          // Generic canvas click
          const canvas = page.locator('canvas').first();
          if (await canvas.count() > 0) {
            try {
              await canvas.click({ position: { x: 300 + (i % 3) * 100, y: 250 + (i % 2) * 100 }, force: true, timeout: 1000 });
            } catch(e) {}
          }
          await page.waitForTimeout(400);
        }
      }

      // Step 5: Screenshot after actions
      await page.screenshot({ path: `/tmp/${game.name}_after.png` });

      // Step 6: Read game state
      let gameState = null;
      try {
        gameState = await page.evaluate(() => {
          if (window.game && window.game.board) return 'sudoku-active';
          if (window._gameState) {
            const s = window._gameState;
            return Object.keys(s).map(k => `${k}:${typeof s[k] === 'function' ? 'fn' : s[k]}`).join(', ');
          }
          // Try to find score displays
          const scoreEls = document.querySelectorAll('[id*="score"], [id*="wpm"], [id*="time"], [id*="timer"]');
          for (const el of scoreEls) {
            if (el.offsetParent !== null && el.textContent.trim()) {
              return `${el.id}:${el.textContent.trim()}`;
            }
          }
          return 'unknown';
        });
        console.log(`  Game state: ${gameState || 'no state'}`);
      } catch(e) {
        console.log(`  Could not read game state: ${e.message}`);
      }

      // Step 7: Filter real JS errors
      const realErrors = consoleErrors.filter(e =>
        !e.includes('favicon') && !e.includes('manifest') &&
        !e.includes('net::ERR') && !e.includes('Failed to load resource') &&
        !e.includes('monetag') && !e.includes('monetization') &&
        !e.includes('google') && !e.includes('analytics') &&
        !e.includes('ads') && !e.includes('advertising') &&
        !e.includes('doubleclick') && !e.includes('googlesyndication') &&
        !e.includes('AdBl') && !e.includes('adblock') &&
        !e.includes('ERR_INTERNET_DISCONNECTED') &&
        !e.includes('Failed to fetch') && !e.includes('t.js') &&
        !e.includes('gamezipper-bi') && !e.includes('analytics.cap') &&
        !e.includes('babylon') && !e.includes('BABYLON')
      );

      result.details = {
        started,
        gameState,
        consoleErrors: realErrors,
        totalErrors: consoleErrors.length
      };
      result.status = realErrors.length === 0 ? 'PASS' : 'ERRORS';
      console.log(`  Start clicked: ${started}`);
      console.log(`  JS errors: ${realErrors.length} (total: ${consoleErrors.length})`);
      if (realErrors.length > 0) console.log(`  Errors: ${realErrors.slice(0, 3).join(' | ')}`);

    } catch (e) {
      result.status = 'FAIL';
      result.details = { error: e.message };
      console.log(`  [FATAL] ${e.message}`);
    }

    await page.close();
    results.push(result);
  }

  await browser.close();

  // Print summary
  console.log('\n========== SUMMARY ==========');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'ERRORS' ? '⚠️' : '❌';
    console.log(`${icon} ${r.name}: ${r.status}`);
    if (r.status !== 'PASS') console.log(`   Details: ${JSON.stringify(r.details)}`);
  }
})();
