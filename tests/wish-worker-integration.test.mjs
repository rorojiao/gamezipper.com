import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = (process.env.WISH_TEST_BASE || 'http://localhost:8787').replace(/\/$/, '');
const ORIGIN = 'https://gamezipper.com';
const PASSWORD = 'integration-test-password-not-secret';

async function request(path, { method = 'GET', body, cookie = '', ip = '203.0.113.10', origin = ORIGIN, cache = false } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip,
      ...(cache ? {} : { 'Cache-Control': 'no-cache' }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

test('real Worker + D1 wish lifecycle', async t => {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200, 'Start Wrangler and apply local D1 migrations before this test');
  await request('/api/wishes?limit=5&offset=0', { cache: true });
  const cachedRead = await request('/api/wishes?limit=5&offset=0', { cache: true });
  assert.equal(cachedRead.response.status, 200);
  assert.equal(cachedRead.response.headers.get('x-wish-cache'), 'HIT');

  const unique = Date.now();
  const title = `Integration <img> ${unique}`;
  let wishId;

  t.after(async () => {
    if (!wishId) return;
    const login = await request('/api/wish-admin', { method: 'POST', body: { action: 'login', password: PASSWORD }, ip: '203.0.113.200' });
    const cookie = (login.response.headers.get('set-cookie') || '').split(';')[0];
    if (cookie) await request('/api/wish-admin', { method: 'DELETE', body: { id: wishId }, cookie, ip: '203.0.113.200' });
  });

  const tooFast = await request('/api/wishes', { method: 'POST', body: { title: 'Fast Bot', category: 'other', startedAt: Date.now() } });
  assert.equal(tooFast.response.status, 400);
  assert.equal(tooFast.data.error, 'submission_too_fast');
  const missingTimestamp = await request('/api/wishes', { method: 'POST', body: { title: 'Missing Timestamp', category: 'other' } });
  assert.equal(missingTimestamp.response.status, 400);
  assert.equal(missingTimestamp.data.error, 'submission_too_fast');

  const created = await request('/api/wishes', {
    method: 'POST', ip: '203.0.113.11',
    body: { title, nickname: '<b>QA Player</b>', details: 'A & B\n<script>not-html()</script>', category: 'puzzle', startedAt: Date.now() - 5000 },
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.data));
  wishId = created.data.wish.id;
  assert.equal(created.data.wish.status, 'pending');
  assert.equal(created.data.emailNotification, 'queued');

  let publicList = await request('/api/wishes?limit=24&offset=0');
  assert.equal(publicList.response.status, 200);
  assert.ok(!publicList.data.wishes.some(wish => wish.id === wishId), 'pending wishes must stay private');

  const unauthorized = await request('/api/wish-admin');
  assert.equal(unauthorized.response.status, 401);
  const wrongLogin = await request('/api/wish-admin', { method: 'POST', body: { action: 'login', password: 'wrong' }, ip: '203.0.113.12' });
  assert.equal(wrongLogin.response.status, 401);

  const login = await request('/api/wish-admin', { method: 'POST', body: { action: 'login', password: PASSWORD }, ip: '203.0.113.13' });
  assert.equal(login.response.status, 200, JSON.stringify(login.data));
  const setCookie = login.response.headers.get('set-cookie') || '';
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);
  const cookie = setCookie.split(';')[0];

  let adminWish;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const adminList = await request('/api/wish-admin?status=pending', { cookie });
    assert.equal(adminList.response.status, 200);
    adminWish = adminList.data.wishes.find(wish => wish.id === wishId);
    if (adminWish?.emailStatus !== 'pending') break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(adminWish);
  assert.equal(adminWish.emailStatus, 'not_configured');

  const approved = await request('/api/wish-admin', { method: 'PATCH', body: { id: wishId, status: 'approved', gameUrl: '' }, cookie });
  assert.equal(approved.response.status, 200, JSON.stringify(approved.data));
  assert.equal(approved.data.wish.status, 'approved');

  publicList = await request('/api/wishes?limit=24&offset=0');
  const publicWish = publicList.data.wishes.find(wish => wish.id === wishId);
  assert.ok(publicWish, 'approved wish should be public');
  assert.equal(publicWish.title, title);
  assert.equal(publicWish.emailStatus, undefined, 'private email metadata must not leak');

  const vote = await request('/api/wishes', { method: 'POST', ip: '203.0.113.14', body: { action: 'vote', id: wishId } });
  assert.equal(vote.response.status, 200, JSON.stringify(vote.data));
  assert.equal(vote.data.alreadyVoted, false);
  assert.equal(vote.data.votes, 1);
  const duplicateVote = await request('/api/wishes', { method: 'POST', ip: '203.0.113.14', body: { action: 'vote', id: wishId, voterId: `rotated-client-id-${unique}` } });
  assert.equal(duplicateVote.data.alreadyVoted, true);
  assert.equal(duplicateVote.data.votes, 1);

  const externalUrl = await request('/api/wish-admin', { method: 'PATCH', body: { id: wishId, status: 'added', gameUrl: 'https://evil.example/game/' }, cookie });
  assert.equal(externalUrl.response.status, 400);
  const added = await request('/api/wish-admin', { method: 'PATCH', body: { id: wishId, status: 'added', gameUrl: '/2048/' }, cookie });
  assert.equal(added.response.status, 200);
  assert.equal(added.data.wish.gameUrl, '/2048/');

  publicList = await request('/api/wishes?sort=top&limit=24&offset=0');
  const addedPublic = publicList.data.wishes.find(wish => wish.id === wishId);
  assert.equal(addedPublic.status, 'added');
  assert.equal(addedPublic.gameUrl, '/2048/');

  const secondVote = await request('/api/wishes', { method: 'POST', ip: '203.0.113.15', body: { action: 'vote', id: wishId } });
  assert.equal(secondVote.data.votes, 2);

  const hidden = await request('/api/wish-admin', { method: 'PATCH', body: { id: wishId, status: 'hidden', gameUrl: '' }, cookie });
  assert.equal(hidden.response.status, 200);
  publicList = await request('/api/wishes?limit=24&offset=0');
  assert.ok(!publicList.data.wishes.some(wish => wish.id === wishId), 'hidden wishes must disappear publicly');

  const deleted = await request('/api/wish-admin', { method: 'DELETE', body: { id: wishId }, cookie });
  assert.equal(deleted.response.status, 200);
  const voteDeleted = await request('/api/wishes', { method: 'POST', ip: '203.0.113.16', body: { action: 'vote', id: wishId } });
  assert.equal(voteDeleted.response.status, 404);
  wishId = null;

  const badOrigin = await request('/api/wishes', { method: 'POST', origin: 'https://evil.example', body: {} });
  assert.equal(badOrigin.response.status, 403);

  let lastAttempt;
  for (let index = 0; index < 9; index += 1) {
    lastAttempt = await request('/api/wish-admin', { method: 'POST', ip: '203.0.113.99', body: { action: 'login', password: 'wrong' } });
  }
  assert.equal(lastAttempt.response.status, 429);
});
