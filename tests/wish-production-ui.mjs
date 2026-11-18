import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const PASSWORD = process.env.WISH_TEST_ADMIN_PASSWORD;
assert.ok(PASSWORD, 'Set WISH_TEST_ADMIN_PASSWORD for the live browser test');
const API = 'https://wishes.gamezipper.com';
const unique = Date.now();
const title = `Live Browser Smoke ${unique}`;
let browser;

async function cleanup() {
  try {
    const login = await fetch(`${API}/api/wish-admin`, {
      method: 'POST', headers: { Origin: 'https://gamezipper.com', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password: PASSWORD }),
    });
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const list = await fetch(`${API}/api/wish-admin?status=all&limit=50`, { headers: { Origin: 'https://gamezipper.com', Cookie: cookie } });
    const data = await list.json();
    const wish = data.wishes?.find(item => item.title === title);
    if (wish) await fetch(`${API}/api/wish-admin`, {
      method: 'DELETE', headers: { Origin: 'https://gamezipper.com', 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: wish.id }),
    });
  } catch (error) { console.error('UI_CLEANUP_FAILED', error.message); }
}

async function apiResponse(page, admin = false) {
  return page.waitForResponse(response => {
    const path = admin ? '/api/wish-admin' : '/api/wishes?';
    return response.url().startsWith(`${API}${path}`) && response.request().method() === 'GET' && response.status() === 200;
  }, { timeout: 20000 });
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  const pageErrors = [];
  const serverErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(API) && response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('https://gamezipper.com/wishes/', { waitUntil: 'domcontentloaded' });
  await apiResponse(page);
  await page.locator('#game-title').fill(title);
  await page.locator('#nickname').fill('Browser QA');
  await page.locator('#wish-details').fill(`Real browser deployment verification ${unique}`);
  await page.waitForTimeout(2700);
  await page.locator('#submit-wish').click();
  await page.locator('#form-status.success').waitFor({ timeout: 20000 });
  await page.screenshot({ path: '/tmp/opencode/live-wishes-desktop.png', fullPage: true });

  const admin = await context.newPage();
  admin.on('pageerror', error => pageErrors.push(error.message));
  await admin.goto('https://gamezipper.com/admin/wishes/', { waitUntil: 'domcontentloaded' });
  await admin.locator('#login-view').waitFor({ state: 'visible' });
  await admin.locator('#admin-password').fill(PASSWORD);
  await admin.locator('#login-button').click();
  await admin.locator('#admin-view').waitFor({ state: 'visible', timeout: 20000 });
  await admin.locator('#email-warning').waitFor({ state: 'hidden' });
  await admin.locator('#status-filter').selectOption('pending');
  const pendingCard = admin.locator('.admin-wish', { hasText: title });
  await pendingCard.waitFor({ timeout: 20000 });
  assert.match(await pendingCard.textContent(), /Email: sent/);
  await pendingCard.locator('.admin-action.primary').click();
  await pendingCard.waitFor({ state: 'detached', timeout: 20000 });

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await apiResponse(page);
  const publicCard = page.locator('.wish-card', { hasText: title });
  await publicCard.waitFor({ timeout: 20000 });
  await publicCard.locator('.vote-button').click();
  await publicCard.locator('.vote-button.voted').waitFor();
  assert.equal(await publicCard.locator('.vote-count').textContent(), '1');

  await admin.locator('#status-filter').selectOption('approved');
  const approvedCard = admin.locator('.admin-wish', { hasText: title });
  await approvedCard.waitFor({ timeout: 20000 });
  await approvedCard.locator('input[type="text"]').fill('/2048/');
  await approvedCard.locator('.admin-action.added').click();
  await approvedCard.waitFor({ state: 'detached', timeout: 20000 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await apiResponse(page);
  const addedCard = page.locator('.wish-card', { hasText: title });
  await addedCard.waitFor({ timeout: 20000 });
  assert.match(await addedCard.textContent(), /ADDED/);
  assert.equal(await addedCard.locator('.play-link').getAttribute('href'), '/2048/');

  await admin.locator('#status-filter').selectOption('added');
  const addedAdminCard = admin.locator('.admin-wish', { hasText: title });
  await addedAdminCard.waitFor({ timeout: 20000 });
  await admin.screenshot({ path: '/tmp/opencode/live-wishes-admin.png', fullPage: true });
  admin.once('dialog', dialog => dialog.accept());
  await addedAdminCard.locator('.admin-action.danger').click();
  await addedAdminCard.waitFor({ state: 'detached', timeout: 20000 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await apiResponse(page);
  assert.equal(await page.locator('.wish-card', { hasText: title }).count(), 0);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(serverErrors, []);

  const mobile = await context.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('https://gamezipper.com/wishes/', { waitUntil: 'domcontentloaded' });
  await apiResponse(mobile);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await mobile.screenshot({ path: '/tmp/opencode/live-wishes-mobile.png', fullPage: true });

  console.log(JSON.stringify({
    ok: true, formSubmitted: true, emailSent: true, adminLogin: true,
    approved: true, hardRefresh: true, vote: 1, added: true, playLink: true,
    deleted: true, mobileNoOverflow: true, pageErrors: 0, serverErrors: 0,
  }));
} catch (error) {
  await cleanup();
  throw error;
} finally {
  if (browser) await browser.close();
}
