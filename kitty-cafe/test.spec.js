const { test, expect } = require('@playwright/test');

test('Kitty Cafe loads correctly', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await page.goto('file:///home/msdn/gamezipper.com/kitty-cafe/index.html');
  await page.waitForTimeout(1000);
  
  // Canvas exists
  const canvas = page.locator('canvas#c');
  await expect(canvas).toBeVisible();
  
  // Tutorial visible
  const tutorial = page.locator('#tutorial-overlay');
  await expect(tutorial).toBeVisible();
  
  // Click Got it button
  await page.click('#tutorial-btn');
  await page.waitForTimeout(500);
  await expect(tutorial).toBeHidden();
  
  // No JS errors (ignore network errors for ads)
  const realErrors = errors.filter(e => !e.includes('pagead') && !e.includes('game-audio') && !e.includes('ERR_FILE_NOT_FOUND') && !e.includes('net::'));
  expect(realErrors).toHaveLength(0);
});
