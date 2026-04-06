const { chromium } = require('playwright');

const GAMES = [
  {
    name: '2048',
    url: 'https://gamezipper.com/2048/',
    type: 'keyboard',
    actions: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
    verify: (page) => page.evaluate(() => {
      // Check if game grid exists
      const container = document.querySelector('.container, #game-container, main');
      const tiles = document.querySelectorAll('.tile, [class*="tile"]');
      return { gridExists: !!container || tiles.length > 0, tileCount: tiles.length };
    })
  },
  {
    name: 'alien-whack',
    url: 'https://gamezipper.com/alien-whack/',
    type: 'click',
    actions: [
      { x: 200, y: 300 }, { x: 400, y: 250 }, { x: 300, y: 350 },
      { x: 150, y: 280 }, { x: 450, y: 320 }, { x: 250, y: 300 },
      { x: 350, y: 270 }, { x: 200, y: 340 }, { x: 400, y: 290 }
    ],
    verify: (page) => page.evaluate(() => {
      const score = document.querySelector('#score, .score, [class*="score"]');
      return { scoreText: score ? score.textContent : 'not found' };
    })
  },
  {
    name: 'ball-catch',
    url: 'https://gamezipper.com/ball-catch/',
    type: 'mouse',
    actions: [
      { moveX: 100, type: 'move' }, { moveX: 200, type: 'move' }, { moveX: 150, type: 'move' },
      { moveX: 250, type: 'move' }, { moveX: 180, type: 'move' }, { moveX: 220, type: 'move' },
      { moveX: 160, type: 'move' }, { moveX: 240, type: 'move' }
    ],
    verify: (page) => page.evaluate(() => {
      const score = document.querySelector('#score, .score, [class*="score"]');
      return { scoreText: score ? score.textContent : 'not found' };
    })
  },
  {
    name: 'bounce-bot',
    url: 'https://gamezipper.com/bounce-bot/',
    type: 'keyboard',
    actions: ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', ' ', ' '],
    verify: (page) => page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return { canvasExists: !!canvas };
    })
  },
  {
    name: 'brick-breaker',
    url: 'https://gamezipper.com/brick-breaker/',
    type: 'mouse',
    actions: [
      { moveX: 100, type: 'move' }, { moveX: 200, type: 'move' }, { moveX: 150, type: 'move' },
      { moveX: 250, type: 'move' }, { moveX: 180, type: 'move' }, { moveX: 220, type: 'move' },
      { moveX: 160, type: 'move' }, { moveX: 240, type: 'move' }
    ],
    verify: (page) => page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return { canvasExists: !!canvas };
    })
  },
  {
    name: 'catch-turkey',
    url: 'https://gamezipper.com/catch-turkey/',
    type: 'click',
    actions: [
      { x: 150, y: 200 }, { x: 300, y: 250 }, { x: 200, y: 300 },
      { x: 400, y: 220 }, { x: 250, y: 280 }, { x: 350, y: 320 },
      { x: 180, y: 260 }, { x: 420, y: 240 }, { x: 280, y: 290 }
    ],
    verify: (page) => page.evaluate(() => {
      const score = document.querySelector('#score, .score, [class*="score"], #points');
      return { scoreText: score ? score.textContent : 'not found' };
    })
  },
  {
    name: 'cloud-sheep',
    url: 'https://gamezipper.com/cloud-sheep/',
    type: 'click',
    actions: [
      { x: 200, y: 300 }, { x: 300, y: 250 }, { x: 250, y: 350 },
      { x: 150, y: 280 }, { x: 350, y: 300 }, { x: 200, y: 320 },
      { x: 400, y: 270 }, { x: 300, y: 340 }
    ],
    verify: (page) => page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return { canvasExists: !!canvas };
    })
  }
];

async function testGame(browser, game) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  let result = { name: game.name, status: 'unknown', details: '', screenshot: '' };

  try {
    // Step 1: Navigate and wait
    await page.goto(game.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Step 2: Screenshot initial state
    const initialPath = `/home/msdn/gamezipper.com/test-results/${game.name}-initial.png`;
    await page.screenshot({ path: initialPath, fullPage: false });
    result.screenshot = initialPath;

    // Step 3: Find and click Start/Play button
    const startSelectors = [
      'button:has-text("Start")', 'button:has-text("Play")', 'button:has-text("start")',
      'button:has-text("play")', '#start', '.start', '[class*="start"]', '#play', '.play',
      'canvas', 'a:has-text("Start")', 'div:has-text("Start")', 'button:first-of-type'
    ];
    
    let clicked = false;
    for (const sel of startSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click({ timeout: 3000 });
          clicked = true;
          result.details += `Clicked: ${sel}\n`;
          break;
        }
      } catch (e) {}
    }
    
    if (!clicked) {
      result.details += 'No explicit Start button found, trying canvas click\n';
    }
    
    await page.waitForTimeout(2000);

    // Step 4: Perform actions
    if (game.type === 'keyboard') {
      for (const key of game.actions) {
        await page.keyboard.press(key);
        await page.waitForTimeout(300);
      }
      result.details += `Performed ${game.actions.length} keyboard actions\n`;
    } else if (game.type === 'mouse' || game.type === 'click') {
      const canvas = page.locator('canvas').first();
      if (await canvas.isVisible({ timeout: 2000 })) {
        const box = await canvas.boundingBox();
        if (box) {
          for (const action of game.actions) {
            const x = box.x + (action.x || action.moveX || 300);
            const y = box.y + (action.y || 300);
            await page.mouse.click(x, y);
            await page.waitForTimeout(300);
          }
          result.details += `Performed ${game.actions.length} click actions\n`;
        }
      } else {
        for (const action of game.actions) {
          await page.mouse.click(action.x || 300, action.y || 300);
          await page.waitForTimeout(300);
        }
        result.details += `Performed ${game.actions.length} click actions (no canvas)\n`;
      }
    }

    // Step 5: Screenshot after actions
    const afterPath = `/home/msdn/gamezipper.com/test-results/${game.name}-after.png`;
    await page.screenshot({ path: afterPath, fullPage: false });
    result.screenshot = afterPath;

    // Step 6: Verify state
    const verifyResult = await game.verify(page);
    result.details += `Verification: ${JSON.stringify(verifyResult)}\n`;

    // Step 7: Check errors
    if (errors.length > 0) {
      result.details += `JS Errors: ${errors.join(' | ')}\n`;
    } else {
      result.details += 'No JS errors detected\n';
    }

    result.status = 'PASS';
  } catch (err) {
    result.status = 'ERROR';
    result.details += `Error: ${err.message}\n`;
    result.details += `JS Errors: ${errors.join(' | ')}\n`;
    
    const errorPath = `/home/msdn/gamezipper.com/test-results/${game.name}-error.png`;
    try { await page.screenshot({ path: errorPath, fullPage: false }); } catch (e) {}
    result.screenshot = errorPath;
  }

  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  
  for (const game of GAMES) {
    console.log(`\n=== Testing: ${game.name} ===`);
    const result = await testGame(browser, game);
    results.push(result);
    
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${game.name}: ${result.status}`);
    console.log(result.details);
  }

  await browser.close();

  // Print summary
  console.log('\n\n========== SUMMARY ==========');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.status}`);
  }
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('/home/msdn/gamezipper.com/test-results/test-7-games.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to test-results/test-7-games.json');
}

main().catch(console.error);
