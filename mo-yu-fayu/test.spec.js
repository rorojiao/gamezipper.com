const { test, expect } = require('@playwright/test');

test('mo-yu-fayu mobile UI is readable and core controls work end-to-end', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8088/mo-yu-fayu/index.html', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /slackoff defense/i })).toBeVisible();
  await expect(page.getByText(/office tower defense/i)).toBeVisible();
  await expect(page.getByText(/tap build mode/i).first()).toBeVisible();
  await expect(page.getByText(/tap a glowing slot/i).first()).toBeVisible();

  const buildBtn = page.getByRole('button', { name: /build mode/i });
  const upgradeBtn = page.getByRole('button', { name: /upgrade/i });
  const breakBtn = page.getByRole('button', { name: /take break/i });
  const speedBtn = page.getByRole('button', { name: /speed/i });
  await expect(buildBtn).toBeVisible();
  await expect(upgradeBtn).toBeVisible();
  await expect(breakBtn).toBeVisible();
  await expect(speedBtn).toBeVisible();

  await page.getByRole('button', { name: /start shift/i }).click();
  await expect(page.getByText(/step 1/i)).toBeVisible();
  await expect(page.getByText(/build your first screen turret/i)).toBeVisible();

  await buildBtn.click();
  await page.locator('canvas').click({ position: { x: 120, y: 170 } });
  await expect(page.locator('#hudCoin')).toHaveText('$60');
  await expect(page.getByText(/wave 1:/i)).toBeVisible();

  await page.locator('canvas').click({ position: { x: 120, y: 170 } });
  await upgradeBtn.click();
  await expect(page.getByRole('button', { name: /upgrade \$120/i })).toBeVisible();

  await speedBtn.click();
  await expect(page.getByRole('button', { name: /normal speed/i })).toBeVisible();

  await breakBtn.click();
  await expect(page.getByText(/\+5\/s/i)).toBeVisible();

  const sizes = await page.evaluate(() => {
    const els = {
      hud: document.querySelector('#hud'),
      status: document.querySelector('#statusLabel'),
      build: document.querySelector('#btnBuild'),
      tutorialTitle: document.querySelector('#tutorialCard h2'),
      tutorialBody: document.querySelector('#tutorialCard p'),
    };
    const out = {};
    for (const [k, el] of Object.entries(els)) {
      const cs = getComputedStyle(el);
      out[k] = {
        fontSize: parseFloat(cs.fontSize),
        rect: el.getBoundingClientRect().toJSON ? el.getBoundingClientRect().toJSON() : { width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }
      };
    }
    return out;
  });

  expect(sizes.build.fontSize).toBeGreaterThanOrEqual(13);
  expect(sizes.tutorialTitle.fontSize).toBeGreaterThanOrEqual(16);
  expect(sizes.tutorialBody.fontSize).toBeGreaterThanOrEqual(13);
});
