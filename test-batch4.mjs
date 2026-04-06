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

async function dismissSplashAndOverlays(page) {
  // Dismiss splash screen
  try {
    const splash = page.locator('#splash-screen');
    if (await splash.count() > 0) {
      await page.evaluate(() => {
        const s = document.getElementById('splash-screen');
        if (s) { s.classList.add('fade-out'); setTimeout(() => s.remove(), 600); }
      });
      await page.waitForTimeout(300);
    }
  } catch(e) {}

  // Dismiss tutorial overlays
  try {
    const overlays = page.locator('#tutorialOverlay, .tutorial-overlay, #tutorial-overlay, [id*="tutorial"]');
    for (let i = 0; i < await overlays.count(); i++) {
      const overlay = overlays.nth(i);
      if (await overlay.isVisible()) {
        await page.evaluate((el) => {
          if (el) { el.style.display = 'none'; }
          // Also try closing via button
          const btn = el?.querySelector('button, [role="button"]');
          if (btn) btn.click();
        }, await overlay.elementHandle());
      }
    }
  } catch(e) {}
}

async function tryStartGame(page, gameName) {
  // Strategy 1: Call window.startGame if available
  const hasStart = await page.evaluate(() => typeof window.startGame === 'function');
  if (hasStart) {
    await page.evaluate(() => window.startGame());
    console.log(`  [OK] Called window.startGame()`);
    return true;
  }

  // Strategy 2: Click explicit start buttons
  const startSelectors = [
    '#start-btn', '#play-btn', '#start', '#play',
    'button:has-text("Start")', 'button:has-text("Play")',
    'button:has-text("BEGIN")', 'button:has-text("Engage")',
    'button:has-text("begin")', 'button:has-text("GO")',
    '[role="button"]:has-text("Start")', '[role="button"]:has-text("Play")',
    '#start-button', '#btn-start', '.btn-start'
  ];

  for (const sel of startSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.click({ timeout: 2000 });
        console.log(`  [OK] Clicked: ${sel}`);
        return true;
      }
    } catch(e) {}
  }

  // Strategy 3: Dismiss overlays and retry
  await dismissSplashAndOverlays(page);
  await page.waitForTimeout(500);

  for (const sel of startSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.click({ timeout: 2000 });
        console.log(`  [OK] Clicked after overlay dismiss: ${sel}`);
        return true;
      }
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

      // Dismiss splash and overlays first
      await dismissSplashAndOverlays(page);
      await page.waitForTimeout(1000);

      // Step 3: Start the game
      const started = await tryStartGame(page, game.name);
      if (!started) {
        console.log(`  [WARN] Could not find/start button, trying canvas click`);
        const canvas = page.locator('canvas').first();
        if (await canvas.count() > 0) {
          await canvas.click();
          console.log(`  [OK] Clicked canvas`);
        }
      }
      await page.waitForTimeout(1500);

      // Step 4: Perform 5-10 actions
      for (let i = 0; i < 7; i++) {
        if (game.name === 'typing-speed') {
          await page.keyboard.type('the be to of and a in that ');
          await page.waitForTimeout(300);
        } else if (game.name === 'slope') {
          await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight');
          await page.waitForTimeout(200);
        } else if (game.name === 'reaction-time') {
          // Reaction time - just wait
          await page.waitForTimeout(1000);
        } else {
          const canvas = page.locator('canvas').first();
          if (await canvas.count() > 0) {
            await canvas.click({ position: { x: 300 + (i % 3) * 100, y: 250 + (i % 2) * 100 } });
          } else {
            await page.mouse.click(300 + (i % 3) * 100, 250 + (i % 2) * 100);
          }
          await page.waitForTimeout(400);
        }
      }

      // Step 5: Screenshot after actions
      await page.screenshot({ path: `/tmp/${game.name}_after.png` });

      // Step 6: Check game state
      let gameState = null;
      try {
        gameState = await page.evaluate(() => {
          if (window.game) return JSON.stringify(window.game).substring(0, 200);
          if (window._gameState) {
            const s = window._gameState;
            return Object.keys(s).map(k => `${k}:${typeof s[k] === 'function' ? 'fn' : s[k]}`).join(', ');
          }
          return null;
        });
        console.log(`  Game state: ${gameState || 'no window.game'}`);
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
        !e.includes('gamezipper-bi') && !e.includes('analytics.cap')
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
