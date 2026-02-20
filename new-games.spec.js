const { test, expect } = require('@playwright/test');

for (const game of ['kitty-cafe', 'paint-splash']) {
  test(`${game} loads and works`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    
    await page.goto(`file:///home/msdn/gamezipper.com/${game}/index.html`);
    await page.waitForTimeout(2000);
    
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
    
    const html = await page.content();
    expect(html).toContain('gamezipper');
    expect(html).toContain('ca-pub-8346383990981353');
    expect(html).toContain('game-audio');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    
    await canvas.first().click({ position: { x: 200, y: 300 } });
    await page.waitForTimeout(500);
    
    expect(errors).toHaveLength(0);
  });
}
