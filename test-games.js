const { chromium } = require('playwright');

const GAMES = [
  { name: 'memory-match', url: 'https://gamezipper.com/memory-match/', type: 'click' },
  { name: 'mo-yu-fayu', url: 'https://gamezipper.com/mo-yu-fayu/', type: 'click' },
  { name: 'neon-run', url: 'https://gamezipper.com/neon-run/', type: 'keyboard' },
  { name: 'ocean-gem-pop', url: 'https://gamezipper.com/ocean-gem-pop/', type: 'click' },
  { name: 'paint-splash', url: 'https://gamezipper.com/paint-splash/', type: 'click' },
  { name: 'phantom-blade', url: 'https://gamezipper.com/phantom-blade/', type: 'keyboard' },
  { name: 'pong', url: 'https://gamezipper.com/pong/', type: 'keyboard' },
];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  for (const game of GAMES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${game.name}`);
    console.log('='.repeat(60));

    errors.length = 0;
    const gameErrors = [];

    try {
      await page.goto(game.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `/tmp/game_test/${game.name}_init.png`, fullPage: false }).catch(() => {});
      console.log(`  [1] Navigated & waited 3s`);

      // Find Start/Play button
      const startBtn = page.locator('button, [role="button"], a, input').filter({ hasText: /start|play|begin|ready|go/i }).first();
      let clicked = false;
      try {
        await startBtn.click({ timeout: 3000 });
        clicked = true;
        console.log(`  [2] Clicked Start/Play button`);
      } catch (e) {
        // Try finding by common selectors
        const altSelectors = ['#start', '#play', '.start', '.play', '[data-start]', '#start-btn', '.start-btn', '#btn-start', '.btn-play'];
        for (const sel of altSelectors) {
          try {
            const el = page.locator(sel).first();
            await el.click({ timeout: 1000 });
            clicked = true;
            console.log(`  [2] Clicked button via selector: ${sel}`);
            break;
          } catch {}
        }
        if (!clicked) console.log(`  [2] No Start button found (may auto-start)`);
      }

      await page.waitForTimeout(1000);

      // Perform 5-10 interactions
      const actions = [];
      if (game.type === 'click') {
        // Click around the canvas/game area
        const canvas = page.locator('canvas').first();
        for (let i = 0; i < 8; i++) {
          try {
            const box = await canvas.boundingBox();
            if (box) {
              const x = box.x + Math.random() * box.width;
              const y = box.y + Math.random() * box.height;
              await page.mouse.click(x, y);
              await page.waitForTimeout(300);
              actions.push(`click ${i+1}`);
            }
          } catch {}
        }
      } else {
        // Keyboard actions
        const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'w', 'a', 's', 'd'];
        for (let i = 0; i < 8; i++) {
          const key = keys[i % keys.length];
          await page.keyboard.press(key);
          await page.waitForTimeout(300);
          actions.push(`key ${key}`);
        }
      }
      console.log(`  [3] Performed ${actions.length} actions: ${actions.join(', ')}`);

      await page.waitForTimeout(1000);
      await page.screenshot({ path: `/tmp/game_test/${game.name}_after.png`, fullPage: false }).catch(() => {});
      console.log(`  [4] Screenshots captured`);

      // Check score/state via JS
      let state = {};
      try {
        state = await page.evaluate(() => {
          // Try common game state patterns
          const patterns = ['score', 'points', 'level', 'gameState', 'gameState', 'state', 'hp', 'health', 'lives', 'timer', 'time'];
          const result = {};
          // Check window
          for (const k of patterns) {
            if (window[k] !== undefined) result[k] = window[k];
          }
          // Check common global vars
          if (window.game) result.game = typeof window.game;
          if (window.gameState) result.gameState = JSON.stringify(window.gameState);
          return result;
        });
      } catch {}
      console.log(`  [5] Game state:`, JSON.stringify(state));

      // Report errors
      if (errors.length > 0) {
        console.log(`  [6] JS Errors:`, errors.join('; '));
        gameErrors.push(...errors);
      } else {
        console.log(`  [6] No JS errors`);
      }

      console.log(`  ✅ ${game.name}: Tested successfully`);

    } catch (e) {
      console.log(`  ❌ ${game.name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone.');
})();
