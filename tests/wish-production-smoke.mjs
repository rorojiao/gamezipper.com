import assert from 'node:assert/strict';

const BASE = (process.env.WISH_TEST_BASE || 'https://wishes.gamezipper.com').replace(/\/$/, '');
const ORIGIN = process.env.WISH_TEST_ORIGIN || 'https://gamezipper.com';
const PASSWORD = process.env.WISH_TEST_ADMIN_PASSWORD;
assert.ok(PASSWORD, 'Set WISH_TEST_ADMIN_PASSWORD for the production smoke test');

async function request(path, { method = 'GET', body, cookie = '', origin = ORIGIN, cache = false } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Origin: origin, 'Content-Type': 'application/json',
      ...(cache ? {} : { 'Cache-Control': 'no-cache' }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

const unique = Date.now();
const title = `Live Deployment Smoke ${unique}`;
let wishId;
let cookie = '';

async function cleanup() {
  if (!wishId) return;
  try {
    if (!cookie) {
      const login = await request('/api/wish-admin', { method: 'POST', body: { action: 'login', password: PASSWORD } });
      cookie = (login.response.headers.get('set-cookie') || '').split(';')[0];
    }
    await request('/api/wish-admin', { method: 'DELETE', body: { id: wishId }, cookie });
  } catch (error) {
    console.error('CLEANUP_FAILED', wishId, error.message);
  }
}

try {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.data.ok, true);

  const preflight = await fetch(`${BASE}/api/wishes`, {
    method: 'OPTIONS',
    headers: {
      Origin: ORIGIN, 'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'cache-control, pragma',
    },
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-headers') || '', /Cache-Control/);
  assert.match(preflight.headers.get('access-control-allow-headers') || '', /Pragma/);

  await request('/api/wishes?limit=5&offset=0', { cache: true });
  const cached = await request('/api/wishes?limit=5&offset=0', { cache: true });
  assert.equal(cached.response.headers.get('x-wish-cache'), 'HIT');

  const created = await request('/api/wishes', {
    method: 'POST',
    body: {
      title, nickname: 'Deploy QA', details: `Automated production verification ${unique}`,
      category: 'other', startedAt: Date.now() - 5000,
    },
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.data));
  wishId = created.data.wish.id;

  const login = await request('/api/wish-admin', { method: 'POST', body: { action: 'login', password: PASSWORD } });
  assert.equal(login.response.status, 200, JSON.stringify(login.data));
  const setCookie = login.response.headers.get('set-cookie') || '';
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);
  cookie = setCookie.split(';')[0];

  let adminWish;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const adminList = await request('/api/wish-admin?status=pending', { cookie });
    assert.equal(adminList.response.status, 200);
    adminWish = adminList.data.wishes.find(wish => wish.id === wishId);
    if (adminWish?.emailStatus === 'sent') break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(adminWish, 'Submitted wish should be visible to the administrator');
  assert.equal(adminWish.emailStatus, 'sent', 'SMTP must send the new-wish notification');

  const approved = await request('/api/wish-admin', {
    method: 'PATCH', body: { id: wishId, status: 'approved', gameUrl: '' }, cookie,
  });
  assert.equal(approved.response.status, 200, JSON.stringify(approved.data));

  let publicWish;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const publicList = await request('/api/wishes?limit=24&offset=0');
    publicWish = publicList.data.wishes.find(wish => wish.id === wishId);
    if (publicWish) break;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  assert.ok(publicWish, 'Approved wish should appear publicly');
  assert.equal(publicWish.emailStatus, undefined);

  const vote = await request('/api/wishes', { method: 'POST', body: { action: 'vote', id: wishId } });
  assert.equal(vote.response.status, 200, JSON.stringify(vote.data));
  assert.equal(vote.data.alreadyVoted, false);
  assert.equal(vote.data.votes, 1);
  const duplicate = await request('/api/wishes', {
    method: 'POST', body: { action: 'vote', id: wishId, voterId: `rotated-${unique}` },
  });
  assert.equal(duplicate.data.alreadyVoted, true);
  assert.equal(duplicate.data.votes, 1);

  const added = await request('/api/wish-admin', {
    method: 'PATCH', body: { id: wishId, status: 'added', gameUrl: '/2048/' }, cookie,
  });
  assert.equal(added.response.status, 200, JSON.stringify(added.data));
  assert.equal(added.data.wish.gameUrl, '/2048/');

  const hidden = await request('/api/wish-admin', {
    method: 'PATCH', body: { id: wishId, status: 'hidden', gameUrl: '' }, cookie,
  });
  assert.equal(hidden.response.status, 200);
  const afterHide = await request('/api/wishes?limit=24&offset=0');
  assert.ok(!afterHide.data.wishes.some(wish => wish.id === wishId));

  const deleted = await request('/api/wish-admin', { method: 'DELETE', body: { id: wishId }, cookie });
  assert.equal(deleted.response.status, 200);
  wishId = null;

  const rejectedOrigin = await request('/api/wishes', { method: 'POST', origin: 'https://evil.example', body: {} });
  assert.equal(rejectedOrigin.response.status, 403);

  console.log(JSON.stringify({
    ok: true, title, emailStatus: 'sent', approved: true, public: true,
    votes: 1, duplicateVoteBlocked: true, added: true, hidden: true,
    deleted: true, cache: 'HIT', preflight: true, originProtection: true,
  }));
} catch (error) {
  await cleanup();
  throw error;
}
