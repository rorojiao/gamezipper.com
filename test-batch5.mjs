import { chromium } from 'playwright';

const GAMES = [
  {
    name: 'wood-block-puzzle',
    url: 'https://gamezipper.com/wood-block-puzzle/',
    title: '木块拼图',
    actions: async (page) => {
      // Try clicking start/play button
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("开始")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        console.log('  Clicked start button');
      }
      await page.waitForTimeout(500);

      // Click on the board area a few times
      const canvas = page.locator('canvas').first();
      if (await canvas.isVisible({ timeout: 2000 })) {
        const box = await canvas.boundingBox();
        if (box) {
          // Click center, then some grid positions
          for (let i = 0; i < 5; i++) {
            const x = box.x + box.width * (0.2 + Math.random() * 0.6);
            const y = box.y + box.height * (0.2 + Math.random() * 0.6);
            await page.mouse.click(x, y);
            await page.waitForTimeout(200);
          }
          console.log('  Clicked on canvas 5 times');
        }
      }
    },
    checkScore: async (page) => {
      const scoreEl = page.locator('text=/\\d+/').filter({ hasText: page.locator('body') }).first();
      return true;
    }
  },
  {
    name: 'word-puzzle',
    url: 'https://gamezipper.com/word-puzzle/',
    title: '单词拼图',
    actions: async (page) => {
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("开始"), button:has-text("Play Now")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        console.log('  Clicked start button');
      }
      await page.waitForTimeout(500);

      // Type some letters
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press(letters[Math.floor(Math.random() * 26)]);
        await page.waitForTimeout(150);
      }
      console.log('  Typed 5 random letters');
    }
  },
  {
    name: 'abyss-chef',
    url: 'https://gamezipper.com/abyss-chef/',
    title: '深渊厨师',
    actions: async (page) => {
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("开始"), button:has-text("Play Now")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        console.log('  Clicked start button');
      }
      await page.waitForTimeout(500);

      // Click on game area
      const canvas = page.locator('canvas').first();
      if (await canvas.isVisible({ timeout: 2000 })) {
        const box = await canvas.boundingBox();
        if (box) {
          for (let i = 0; i < 5; i++) {
            const x = box.x + box.width * 0.5;
            const y = box.y + box.height * (0.3 + i * 0.12);
            await page.mouse.click(x, y);
            await page.waitForTimeout(200);
          }
          console.log('  Clicked on canvas 5 times');
        }
      }
    }
  },
  {
    name: 'bolt-jam-3d',
    url: 'https://gamezipper.com/bolt-jam-3d/',
    title: '螺栓拧拧乐3D',
    actions: async (page) => {
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("开始"), button:has-text("Play Now")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        console.log('  Clicked start button');
      }
      await page.waitForTimeout(500);

      // Click on canvas
      const canvas = page.locator('canvas').first();
      if (await canvas.isVisible({ timeout: 2000 })) {
        const box = await canvas.boundingBox();
        if (box) {
          for (let i = 0; i < 5; i++) {
            const x = box.x + box.width * (0.3 + Math.random() * 0.4);
            const y = box.y + box.height * (0.3 + Math.random() * 0.4);
            await page.mouse.click(x, y);
            await page.waitForTimeout(200);
          }
          console.log('  Clicked on canvas 5 times');
        }
      }
    }
  },
  {
    name: 'tetris',
    url: 'https://gamezipper.com/tetris/',
    title: '俄罗斯方块',
    actions: async (page) => {
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("开始"), button:has-text("Play Now")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        console.log('  Clicked start button');
      }
      await page.waitForTimeout(500);

      // Press arrow keys
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'];
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
        await page.waitForTimeout(150);
      }
      console.log('  Pressed 8 arrow keys');
    }
  },
  {
    name: 'minesweeper',
    url: 'https://gamezipper.com/minesweeper/',
    title: '扫雷',
    actions: async (page) => {
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("开始"), button:has-text("Play Now"), button:has-text("New Game")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        console.log('  Clicked start button');
      }
      await page.waitForTimeout(500);

      // Click on grid cells
      const cells = page.locator('td, .cell, [class*="cell"]').filter({ hasNot: page.locator('button') });
      for (let i = 0; i < 8; i++) {
        const cell = cells.nth(Math.floor(Math.random() * 25));
        if (await cell.isVisible({ timeout: 1000 })) {
          await cell.click();
          await page.waitForTimeout(150);
        }
      }
      console.log('  Clicked 8 random cells');
    }
  }
];

async function testGame(browser, game) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  const result = { name: game.title, path: game.name, status: 'unknown', errors: [], fix: null, commitHash: null };

  try {
    console.log(`\n========== Testing: ${game.title} ==========`);

    // Step 1: Navigate
    await page.goto(game.url, { waitUntil: 'networkidle', timeout: 15000 });
    console.log(`  Loaded: ${game.url}`);
    await page.waitForTimeout(3000);

    // Step 2: Initial screenshot
    const screenshotDir = `/home/msdn/gamezipper.com/test-results/batch5/${game.name}`;
    await exec(`mkdir -p ${screenshotDir}`);
    await page.screenshot({ path: `${screenshotDir}/01_initial.png` });
    console.log('  Screenshot: 01_initial.png');

    // Step 3: Click Start/Play
    await game.actions(page);
    await page.waitForTimeout(1000);

    // Step 4: Screenshot after start
    await page.screenshot({ path: `${screenshotDir}/02_after_start.png` });
    console.log('  Screenshot: 02_after_start.png');

    // Step 5: Check for JS errors
    if (errors.length > 0) {
      console.log(`  ⚠️ JS Errors: ${errors.length}`);
      errors.forEach(e => console.log(`    - ${e.substring(0, 120)}`));
      result.errors = [...errors];
    } else {
      console.log('  ✅ No JS errors');
    }

    result.status = errors.length === 0 ? 'pass' : 'fix_needed';

  } catch (e) {
    console.log(`  ❌ ERROR: ${e.message}`);
    result.status = 'error';
    result.errorMsg = e.message;
  }

  await context.close();
  return result;
}

import { execSync } from 'child_process';
function exec(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  console.log('Browser launched');

  const results = [];
  for (const game of GAMES) {
    const result = await testGame(browser, game);
    results.push(result);
  }

  await browser.close();
  console.log('\n\n========== SUMMARY ==========');
  for (const r of results) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fix_needed' ? '🔧' : '❌';
    console.log(`${icon} ${r.title}: ${r.status}`);
    if (r.errors.length > 0) {
      r.errors.forEach(e => console.log(`   Error: ${e.substring(0, 100)}`));
    }
  }
  console.log('============================');

  // Save results
  const fs = await import('fs');
  fs.writeFileSync('/home/msdn/gamezipper.com/test-results/batch5_results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to test-results/batch5_results.json');
}

main().catch(console.error);
