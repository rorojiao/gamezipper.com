import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import worker, { validateSubmission, normalizeGameUrl, deliverWishEmail } from '../worker/src/index.js';

const validSubmission = () => ({
  title: 'Fireboy and Watergirl 6',
  nickname: 'PuzzleFan',
  details: 'More co-op puzzles, please!',
  category: 'puzzle',
  startedAt: Date.now() - 5000,
});

test('submission validation accepts a normal wish and trims text', () => {
  const result = validateSubmission({ ...validSubmission(), title: '  2048   Galaxy  ' });
  assert.equal(result.title, '2048 Galaxy');
  assert.equal(result.category, 'puzzle');
});

test('submission validation rejects bots, links, contact details and invalid fields', () => {
  assert.throws(() => validateSubmission({ ...validSubmission(), startedAt: Date.now() }), /take a moment/i);
  const missingTimestamp = validSubmission();
  delete missingTimestamp.startedAt;
  assert.throws(() => validateSubmission(missingTimestamp), /take a moment/i);
  assert.throws(() => validateSubmission({ ...validSubmission(), startedAt: 0 }), /take a moment/i);
  assert.throws(() => validateSubmission({ ...validSubmission(), title: 'x' }), /between 2 and 80/i);
  assert.throws(() => validateSubmission({ ...validSubmission(), details: 'visit https://spam.example' }), /remove links/i);
  assert.throws(() => validateSubmission({ ...validSubmission(), details: 'mail me at kid@example.com' }), /remove links/i);
  assert.throws(() => validateSubmission({ ...validSubmission(), category: 'not-real' }), /valid game category/i);
  assert.throws(() => validateSubmission({ ...validSubmission(), details: 'x'.repeat(501) }), /under 501/i);
});

test('game URLs are restricted to safe GameZipper paths', () => {
  assert.equal(normalizeGameUrl('/2048/'), '/2048/');
  assert.equal(normalizeGameUrl('https://gamezipper.com/magic-sort/?x=1'), '/magic-sort/');
  assert.equal(normalizeGameUrl(''), '');
  assert.throws(() => normalizeGameUrl('https://evil.example/phishing/'), /Only GameZipper/);
  assert.throws(() => normalizeGameUrl('/../admin/'), /game path/);
  assert.throws(() => normalizeGameUrl('javascript:alert(1)'), /game path/);
});

test('email delivery escapes user HTML and stores sent status', async t => {
  let requestBody;
  let storedStatus;
  const env = {
    RESEND_API_KEY: 'test-key', WISH_EMAIL_TO: 'admin@example.com',
    WISH_EMAIL_FROM: 'Wishes <wishes@example.com>',
    DB: { prepare: () => ({ bind: (status) => ({ run: async () => { storedStatus = status; } }) }) },
  };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'email-123' }), { status: 200 });
  });
  const status = await deliverWishEmail(env, {
    id: '12345678-1234-1234-1234-123456789012', title: '<img src=x onerror=alert(1)>',
    category: 'puzzle', nickname: '<b>Player</b>', details: 'A & B\n<script>bad()</script>',
    created_at: Date.now(),
  });
  assert.equal(status, 'sent');
  assert.equal(storedStatus, 'sent');
  assert.equal(requestBody.to[0], 'admin@example.com');
  assert.ok(!requestBody.html.includes('<img src=x'));
  assert.ok(!requestBody.html.includes('<script>bad()'));
  assert.ok(requestBody.html.includes('&lt;script&gt;bad()&lt;/script&gt;'));
  assert.ok(requestBody.text.includes('<script>bad()</script>'));
});

test('email failure never throws away a saved wish and records failed status', async t => {
  let storedStatus;
  const env = {
    RESEND_API_KEY: 'test-key', WISH_EMAIL_TO: 'admin@example.com', WISH_EMAIL_FROM: 'Wishes <wishes@example.com>',
    DB: { prepare: () => ({ bind: (status) => ({ run: async () => { storedStatus = status; } }) }) },
  };
  t.mock.method(globalThis, 'fetch', async () => new Response('{"error":"no"}', { status: 500 }));
  const status = await deliverWishEmail(env, {
    id: '12345678-1234-1234-1234-123456789012', title: '2048', category: 'puzzle', nickname: 'Player', details: '', created_at: Date.now(),
  });
  assert.equal(status, 'failed');
  assert.equal(storedStatus, 'failed');
});

test('mutating API calls reject untrusted origins before touching the database', async () => {
  const response = await worker.fetch(new Request('https://wishes.gamezipper.com/api/wishes', {
    method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}',
  }), {});
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'origin_not_allowed');
});

test('async validation errors return their intended 400 response, not a 500', async () => {
  const response = await worker.fetch(new Request('https://wishes.gamezipper.com/api/wishes', {
    method: 'POST',
    headers: { Origin: 'https://gamezipper.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Fast Bot', category: 'other', startedAt: Date.now() }),
  }), {});
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'submission_too_fast');
});

test('streamed request bodies are capped even without Content-Length', async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`{"title":"${'x'.repeat(17000)}`));
      controller.close();
    },
  });
  const response = await worker.fetch(new Request('https://wishes.gamezipper.com/api/wishes', {
    method: 'POST',
    headers: { Origin: 'https://gamezipper.com', 'Content-Type': 'application/json' },
    body: stream,
    duplex: 'half',
  }), {});
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, 'body_too_large');
});

test('frontend and admin scripts parse, and homepage exposes the product entries', async () => {
  for (const path of ['wishes/wishes.js', 'admin/wishes/admin.js']) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotThrow(() => new vm.Script(source, { filename: path }));
  }
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(home.includes('✨ Request a Game'));
  assert.ok(home.includes('✨ Wish Wall'));
  assert.ok(home.includes('✨ COMMUNITY WISH WALL'));
  const admin = await readFile(new URL('../admin/wishes/index.html', import.meta.url), 'utf8');
  assert.ok(!/gzAdmin2026|ADMIN_PW\s*=/.test(admin));
  const existingAdmin = await readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  assert.ok(existingAdmin.includes('href="/admin/wishes/"'));
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.ok(sitemap.includes('<loc>https://gamezipper.com/wishes/</loc>'));
});
