#!/usr/bin/env node
/**
 * Strimko browser smoke test using Playwright (bundled chromium).
 * - Loads index.html
 * - Verifies no console errors
 * - Captures screenshots of title + game
 * - Plays one level (clicks cells, fills solution, checks)
 */
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:8765/strimko/index.html';
const SCREENSHOT_DIR = '/home/junze/gamezipper.com/strimko/.screenshots';

(async () => {
  // Ensure screenshot dir
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 540, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(`PAGE ERROR: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
  });

  console.log('Loading', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Title screen
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-title.png') });
  console.log('Saved 01-title.png');

  // Click Play
  await page.click('#btn-play');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-levels.png') });
  console.log('Saved 02-levels.png');

  // Click first level
  await page.click('.level-btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-game-beginner.png') });
  console.log('Saved 03-game-beginner.png');

  // Verify game state
  const gameState = await page.evaluate(() => {
    if (!window.STRIMKO) return { error: 'STRIMKO not exposed' };
    return {
      n: window.STRIMKO.n(),
      grid: window.STRIMKO.grid(),
    };
  });
  console.log('Game state:', JSON.stringify(gameState).substring(0, 200));

  // Solve the level using the engine (auto-fill via test path)
  const solved = await page.evaluate(() => {
    if (!window.STRIMKO) return false;
    // Get current level data
    const idx = 0; // First level
    const lvl = STRIMKO_LEVELS.levels[idx];
    // Set grid to solution
    const gridEl = document.querySelector('#board');
    // Use the engine: load solution as current grid
    window.STRIMKO.loadLevel(idx);
    // Manually set grid to solution
    const grid = window.STRIMKO.grid();
    for (let r = 0; r < lvl.n; r++) {
      for (let c = 0; c < lvl.n; c++) {
        grid[r][c] = lvl.solution[r][c];
      }
    }
    // Trigger redraw
    if (typeof window.STRIMKO.redraw === 'function') window.STRIMKO.redraw();
    return true;
  });

  // Trigger check via clicking
  await page.waitForTimeout(300);
  // Click check button
  await page.click('#btn-check');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-after-check.png') });
  console.log('Saved 04-after-check.png');

  // Check win overlay visibility
  const winVisible = await page.evaluate(() => {
    const overlay = document.getElementById('win-overlay');
    return overlay && !overlay.classList.contains('hidden');
  });
  console.log('Win overlay visible:', winVisible);

  // Mobile viewport test
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-mobile.png') });
  console.log('Saved 05-mobile.png');

  await browser.close();

  // Final report
  console.log('\n=== Errors ===');
  if (errors.length === 0) {
    console.log('NO ERRORS');
  } else {
    errors.forEach(e => console.log(' -', e));
  }
  process.exit(errors.length > 0 ? 1 : 0);
})().catch(e => {
  console.error('FATAL', e);
  process.exit(1);
});
