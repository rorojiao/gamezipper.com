const { test, expect } = require('@playwright/test');

test('mo-yu-fayu shows clear tower-defense onboarding on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8088/mo-yu-fayu/index.html', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /slackoff defense/i })).toBeVisible();
  await expect(page.getByText(/office tower defense/i)).toBeVisible();
  await expect(page.getByText(/tap build mode/i).first()).toBeVisible();
  await expect(page.getByText(/tap a glowing slot/i).first()).toBeVisible();

  await page.getByRole('button', { name: /start shift/i }).click();
  await expect(page.getByText(/step 1/i)).toBeVisible();
  await expect(page.getByText(/build your first screen turret/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /build mode/i })).toBeVisible();

  await page.getByRole('button', { name: /build mode/i }).click();
  await page.locator('canvas').click({ position: { x: 120, y: 170 } });

  await expect(page.locator('#hudCoin')).toHaveText('$60');
  await expect(page.getByText(/wave 1:/i)).toBeVisible();
});
