import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

function staticServer() {
  return createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(root, `.${pathname}`);
      if (!file.startsWith(`${resolve(root)}${sep}`)) {
        response.writeHead(403).end(); return;
      }
      const content = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(content);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
}

async function fulfill(route, data, status = 200, headers = {}) {
  await route.fulfill({ status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }, body: JSON.stringify(data) });
}

function publicWishes() {
  return [
    { id: '12345678-1234-1234-1234-123456789012', title: '<img src=x onerror=window.__xss=1> Co-op Quest', details: 'A & B should team up.\nMore levels, please!', nickname: '<b>PuzzleFan</b>', category: 'puzzle', status: 'approved', votes: 7, gameUrl: '', createdAt: Date.now() - 3600000 },
    { id: '22345678-1234-1234-1234-123456789012', title: '2048 Galaxy', details: 'A fresh daily challenge would be great.', nickname: 'Nova', category: 'puzzle', status: 'added', votes: 12, gameUrl: '/2048/', createdAt: Date.now() - 86400000 },
  ];
}

test('Wish Wall and admin render and work on desktop and mobile', { timeout: 90000 }, async t => {
  const server = staticServer();
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    await context.addInitScript(apiOrigin => { window.GAMEZIPPER_WISH_API_URL = apiOrigin; }, origin);
    let submitted;
    let voteBody;
    await context.route('**/api/wishes*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === 'GET') {
        const wishes = publicWishes();
        if (url.searchParams.get('sort') === 'top') wishes.sort((a, b) => b.votes - a.votes);
        return fulfill(route, { ok: true, wishes, total: 2, added: 1, hasMore: false, turnstileSiteKey: '' });
      }
      const body = request.postDataJSON();
      if (body.action === 'vote') {
        voteBody = body;
        return fulfill(route, { ok: true, alreadyVoted: false, votes: 8 });
      }
      submitted = body;
      return fulfill(route, { ok: true, wish: { id: 'new-wish', status: 'pending' }, message: 'Your wish is in! It will appear on the wall after a quick review.' }, 201);
    });

    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/wishes/`, { waitUntil: 'networkidle' });
    await page.locator('.wish-card').first().waitFor();
    assert.equal(await page.locator('.wish-card').count(), 2);
    assert.equal(await page.locator('#stat-total').textContent(), '2');
    assert.equal(await page.locator('#stat-added').textContent(), '1');
    assert.equal(await page.locator('.wish-card img').count(), 0, 'wish HTML must render as text, not markup');
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.match(await page.locator('.wish-card').first().textContent(), /<img src=x/);
    assert.equal(await page.locator('.play-link').getAttribute('href'), '/2048/');
    await page.screenshot({ path: '/tmp/opencode/gamezipper-wishes-desktop.png', fullPage: true });

    await page.locator('.wish-card').first().locator('.vote-button').click();
    await page.locator('.wish-card').first().locator('.vote-button.voted').waitFor();
    assert.equal(voteBody.id, '12345678-1234-1234-1234-123456789012');
    assert.equal(voteBody.voterId, undefined, 'client-minted voter IDs must not be trusted or sent');

    await page.locator('#game-title').fill('Fireboy and Watergirl 6');
    await page.locator('#nickname').fill('TestPlayer');
    await page.locator('#wish-details').fill('More cooperative puzzles, please!');
    await page.locator('#submit-wish').click();
    await page.locator('#form-status.success').waitFor();
    assert.equal(submitted.title, 'Fireboy and Watergirl 6');
    assert.equal(submitted.nickname, 'TestPlayer');
    assert.ok(submitted.startedAt > 0);

    await page.locator('[data-sort="top"]').click();
    await page.waitForFunction(() => document.querySelector('[data-sort="top"]').getAttribute('aria-pressed') === 'true');

    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(`${origin}/wishes/`, { waitUntil: 'networkidle' });
    await mobile.locator('.wish-card').first().waitFor();
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile page must not overflow horizontally');
    await mobile.screenshot({ path: '/tmp/opencode/gamezipper-wishes-mobile.png', fullPage: true });
    await mobile.close();

    const home = await context.newPage();
    await home.setViewportSize({ width: 390, height: 844 });
    await home.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === origin ? route.continue() : route.abort();
    });
    await home.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await home.locator('.gz-hero-cta a[href="/wishes/"]').waitFor();
    assert.ok(await home.locator('a[href="/wishes/"]').count() >= 3, 'homepage should expose wish entries');
    await home.screenshot({ path: '/tmp/opencode/gamezipper-home-wish-mobile.png', fullPage: false });
    await home.close();

    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
    await adminContext.addInitScript(apiOrigin => { window.GAMEZIPPER_WISH_API_URL = apiOrigin; }, origin);
    let authenticated = false;
    let patched;
    let adminWish = { ...publicWishes()[0], title: 'Fireboy and Watergirl 6', status: 'pending', emailStatus: 'sent', updatedAt: Date.now() };
    await adminContext.route('**/api/wish-admin*', async route => {
      const request = route.request();
      if (request.method() === 'GET') {
        if (!authenticated) return fulfill(route, { ok: false, message: 'Please sign in to continue.' }, 401);
        return fulfill(route, { ok: true, wishes: [adminWish], total: 1, hasMore: false, stats: { total: 1, pending: adminWish.status === 'pending' ? 1 : 0, public: 1, added: 0, emailFailed: 0 }, emailConfigured: true });
      }
      const body = request.postDataJSON();
      if (body.action === 'login') {
        assert.equal(body.password, 'test-password');
        authenticated = true;
        return fulfill(route, { ok: true }, 200, { 'Set-Cookie': 'gz_wish_admin=test; Path=/api/wish-admin; HttpOnly; SameSite=Strict' });
      }
      if (request.method() === 'PATCH') {
        patched = body;
        adminWish = { ...adminWish, status: body.status, gameUrl: body.gameUrl };
        return fulfill(route, { ok: true, wish: adminWish });
      }
      return fulfill(route, { ok: true });
    });
    const admin = await adminContext.newPage();
    admin.on('pageerror', error => errors.push(error.message));
    await admin.goto(`${origin}/admin/wishes/`, { waitUntil: 'networkidle' });
    await admin.locator('#login-view').waitFor({ state: 'visible' });
    await admin.locator('#admin-password').fill('test-password');
    await admin.locator('#login-button').click();
    await admin.locator('#admin-view').waitFor({ state: 'visible' });
    await admin.locator('.admin-wish').waitFor();
    assert.match(await admin.locator('.admin-wish').textContent(), /Fireboy and Watergirl 6/);
    await admin.screenshot({ path: '/tmp/opencode/gamezipper-wishes-admin.png', fullPage: true });
    await admin.locator('.admin-action.primary').click();
    await admin.waitForFunction(() => document.querySelector('.status-badge')?.textContent === 'PUBLISHED');
    assert.equal(patched.status, 'approved');
    assert.equal(await admin.locator('#admin-stat-pending').textContent(), '0');
    assert.deepEqual(errors, []);
    await adminContext.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
});
