const STATUSES = new Set(['pending', 'approved', 'added', 'hidden']);
const CATEGORIES = new Set([
  'puzzle', 'arcade', 'adventure', 'racing-sports',
  'strategy-simulation', 'card-board', 'word-trivia', 'other',
]);
const DEFAULT_ORIGINS = 'https://gamezipper.com,https://www.gamezipper.com';
const SESSION_COOKIE = 'gz_wish_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_BODY_BYTES = 16 * 1024;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function allowedOrigins(env) {
  return (env.WISH_ALLOWED_ORIGINS || DEFAULT_ORIGINS)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Content-Type': 'application/json; charset=utf-8',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

function json(request, env, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request, env), ...extraHeaders },
  });
}

function requireAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin || !allowedOrigins(env).includes(origin)) {
    throw new HttpError(403, 'origin_not_allowed', 'This request origin is not allowed.');
  }
}

async function readBody(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'body_too_large', 'This submission is too large.');
  }
  try {
    if (!request.body) throw new Error('empty body');
    const reader = request.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw new HttpError(413, 'body_too_large', 'This submission is too large.');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
    return body;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'invalid_json', 'Please send a valid request.');
  }
}

function cleanLine(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength + 1);
}

function cleanDetails(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 501);
}

function validateSubmission(body) {
  const title = cleanLine(body.title, 80);
  const nickname = cleanLine(body.nickname, 24) || 'Player';
  const details = cleanDetails(body.details);
  const category = typeof body.category === 'string' ? body.category : 'other';

  if (title.length < 2 || title.length > 80) {
    throw new HttpError(400, 'invalid_title', 'Please enter a game title between 2 and 80 characters.');
  }
  if (nickname.length > 24) {
    throw new HttpError(400, 'invalid_nickname', 'Please keep your display name under 25 characters.');
  }
  if (details.length > 500) {
    throw new HttpError(400, 'invalid_details', 'Please keep your note under 501 characters.');
  }
  if (!CATEGORIES.has(category)) {
    throw new HttpError(400, 'invalid_category', 'Please choose a valid game category.');
  }
  if (/https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+/i.test(`${title}\n${nickname}\n${details}`)) {
    throw new HttpError(400, 'unsupported_content', 'Please remove links and contact details from your wish.');
  }

  const startedAt = Number(body.startedAt);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || startedAt <= 0 || !Number.isFinite(elapsed) || elapsed < 2500) {
    throw new HttpError(400, 'submission_too_fast', 'Please take a moment to review your wish, then submit again.');
  }
  return { title, nickname, details, category };
}

function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{20,50}$/.test(value);
}

function normalizeGameUrl(value) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > 220) {
    throw new HttpError(400, 'invalid_game_url', 'Use a GameZipper game path such as /2048/.');
  }
  let path = value.trim();
  if (/^https?:\/\//i.test(path)) {
    let url;
    try { url = new URL(path); } catch { throw new HttpError(400, 'invalid_game_url', 'Invalid game URL.'); }
    if (!['gamezipper.com', 'www.gamezipper.com'].includes(url.hostname)) {
      throw new HttpError(400, 'invalid_game_url', 'Only GameZipper game links are allowed.');
    }
    path = url.pathname;
  }
  if (!/^\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*\/$/.test(path) || path.includes('..') || path.includes('//')) {
    throw new HttpError(400, 'invalid_game_url', 'Use a GameZipper game path such as /2048/.');
  }
  return path;
}

function publicWish(row) {
  return {
    id: row.id,
    title: row.title,
    details: row.details,
    nickname: row.nickname,
    category: row.category,
    status: row.status,
    votes: Number(row.votes || 0),
    gameUrl: row.status === 'added' ? row.game_url : '',
    createdAt: Number(row.created_at),
  };
}

function adminWish(row) {
  return {
    ...publicWish(row),
    gameUrl: row.game_url,
    emailStatus: row.email_status,
    updatedAt: Number(row.updated_at),
  };
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(String(left));
  const b = new TextEncoder().encode(String(right));
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] || 0) ^ (b[index] || 0);
  }
  return difference === 0;
}

function requestIp(request) {
  // Cloudflare supplies CF-Connecting-IP. Do not trust spoofable forwarding headers
  // when the service is reached outside its intended Cloudflare route.
  return request.headers.get('CF-Connecting-IP') || 'unverified-client';
}

async function ipHash(request, env) {
  if (!env.WISH_ADMIN_PASSWORD) {
    throw new HttpError(503, 'configuration_required', 'The wish service has not been configured yet.');
  }
  return hmacHex(env.WISH_ADMIN_PASSWORD, `gamezipper-wish-ip-v1:${requestIp(request)}`);
}

async function checkRateLimit(env, key, limit, windowSeconds) {
  const now = Date.now();
  const expiresAt = now + windowSeconds * 1000;
  const row = await env.DB.prepare(`
    INSERT INTO wish_rate_limits(key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN wish_rate_limits.expires_at <= ? THEN 1 ELSE wish_rate_limits.count + 1 END,
      expires_at = CASE WHEN wish_rate_limits.expires_at <= ? THEN excluded.expires_at ELSE wish_rate_limits.expires_at END
    RETURNING count, expires_at
  `).bind(key, expiresAt, now, now).first();

  if (Math.random() < 0.01) {
    await env.DB.prepare('DELETE FROM wish_rate_limits WHERE expires_at <= ?').bind(now).run();
  }
  return {
    allowed: Number(row.count) <= limit,
    retryAfter: Math.max(1, Math.ceil((Number(row.expires_at) - now) / 1000)),
  };
}

async function enforceRateLimit(request, env, action, limit, windowSeconds) {
  const hash = await ipHash(request, env);
  const result = await checkRateLimit(env, `${action}:${hash}`, limit, windowSeconds);
  if (!result.allowed) {
    throw new HttpError(429, 'rate_limited', `Too many attempts. Please try again in ${Math.ceil(result.retryAfter / 60)} minute(s).`);
  }
  return hash;
}

async function verifyTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return;
  if (!token || typeof token !== 'string') {
    throw new HttpError(400, 'captcha_required', 'Please complete the human check.');
  }
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(8000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new HttpError(400, 'captcha_failed', 'The human check failed. Please try again.');
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

async function deliverWishEmail(env, wish) {
  const updateStatus = async (status, emailId = '') => {
    try {
      await env.DB.prepare('UPDATE wishes SET email_status = ?, email_id = ? WHERE id = ?')
        .bind(status, emailId, wish.id).run();
    } catch (error) {
      // Email bookkeeping must never turn an already-saved wish into a failed submission.
      console.error('Wish email status update failed', wish.id, error.name);
    }
    return status;
  };

  if (!env.RESEND_API_KEY || !env.WISH_EMAIL_TO || !env.WISH_EMAIL_FROM) {
    return updateStatus('not_configured');
  }

  const adminUrl = env.WISH_ADMIN_URL || 'https://gamezipper.com/admin/wishes/';
  const subject = `New game wish: ${wish.title.slice(0, 90)}`;
  const text = [
    'A new game wish arrived on GameZipper.', '',
    `Game: ${wish.title}`,
    `Category: ${wish.category}`,
    `Player: ${wish.nickname}`,
    `Note: ${wish.details || '(none)'}`,
    `Wish ID: ${wish.id}`,
    `Submitted: ${new Date(wish.created_at).toISOString()}`, '',
    `Review it here: ${adminUrl}`,
  ].join('\n');
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#172033">`
    + `<h2 style="color:#087f74">✨ New GameZipper wish</h2>`
    + `<p><strong>Game:</strong> ${escapeHtml(wish.title)}</p>`
    + `<p><strong>Category:</strong> ${escapeHtml(wish.category)}</p>`
    + `<p><strong>Player:</strong> ${escapeHtml(wish.nickname)}</p>`
    + `<p><strong>Note:</strong><br>${escapeHtml(wish.details || '(none)').replace(/\n/g, '<br>')}</p>`
    + `<p style="color:#64748b;font-size:13px">Wish ID: ${escapeHtml(wish.id)}<br>Submitted: ${new Date(wish.created_at).toISOString()}</p>`
    + `<p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#4ecdc4;color:#062522;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Review wish</a></p>`
    + '</body></html>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.WISH_EMAIL_FROM,
        to: env.WISH_EMAIL_TO.split(',').map(value => value.trim()).filter(Boolean),
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Wish email failed', wish.id, response.status);
      return updateStatus('failed');
    }
    return updateStatus('sent', typeof result.id === 'string' ? result.id : '');
  } catch (error) {
    console.error('Wish email error', wish.id, error.name);
    return updateStatus('failed');
  }
}

async function listPublicWishes(request, env, url) {
  const sort = url.searchParams.get('sort') === 'top' ? 'top' : 'new';
  const limit = Math.min(24, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '12', 10) || 12));
  const offset = Math.min(100000, Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0));
  const origin = request.headers.get('Origin') || '';
  const cacheOrigin = allowedOrigins(env).includes(origin) ? origin : 'direct';
  const cacheKey = new Request(`https://wish-cache.gamezipper.internal/api/wishes?sort=${sort}&limit=${limit}&offset=${offset}&origin=${encodeURIComponent(cacheOrigin)}`);
  const useCache = !request.headers.get('Cache-Control')?.includes('no-cache')
    && typeof caches !== 'undefined' && caches.default;
  if (useCache) {
    try {
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        const response = new Response(cached.body, cached);
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        response.headers.set('X-Wish-Cache', 'HIT');
        return response;
      }
    } catch (error) {
      console.error('Wish cache read failed', error.name);
    }
  }

  const order = sort === 'top' ? 'votes DESC, created_at DESC' : 'created_at DESC';
  const [rows, counts] = await Promise.all([
    env.DB.prepare(`
      SELECT * FROM wishes WHERE status IN ('approved', 'added')
      ORDER BY ${order} LIMIT ? OFFSET ?
    `).bind(limit, offset).all(),
    env.DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'added' THEN 1 ELSE 0 END) AS added
      FROM wishes WHERE status IN ('approved', 'added')
    `).first(),
  ]);
  const response = json(request, env, {
    ok: true,
    wishes: (rows.results || []).map(publicWish),
    total: Number(counts.total || 0),
    added: Number(counts.added || 0),
    hasMore: offset + (rows.results || []).length < Number(counts.total || 0),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || '',
  });
  response.headers.set('X-Wish-Cache', useCache ? 'MISS' : 'BYPASS');
  if (useCache) {
    try {
      const cacheResponse = new Response(response.clone().body, response);
      cacheResponse.headers.set('Cache-Control', 'public, max-age=30');
      await caches.default.put(cacheKey, cacheResponse);
    } catch (error) {
      console.error('Wish cache write failed', error.name);
    }
  }
  return response;
}

async function submitWish(request, env, ctx, body) {
  // Silently accept honeypot submissions so bots receive no useful feedback.
  if (cleanLine(body.website, 120)) {
    return json(request, env, { ok: true, wish: null }, 201);
  }
  const wishInput = validateSubmission(body);
  await verifyTurnstile(request, env, body.turnstileToken);
  await enforceRateLimit(request, env, 'submit', 5, 6 * 60 * 60);

  const now = Date.now();
  const wish = { id: crypto.randomUUID(), ...wishInput, created_at: now };
  await env.DB.prepare(`
    INSERT INTO wishes(id, title, details, nickname, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(wish.id, wish.title, wish.details, wish.nickname, wish.category, now, now).run();

  const delivery = deliverWishEmail(env, wish).catch(error => {
    console.error('Wish email background error', wish.id, error.name);
  });
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(delivery);
  else await delivery;
  return json(request, env, {
    ok: true,
    wish: { id: wish.id, status: 'pending' },
    emailNotification: 'queued',
    message: 'Your wish is in! It will appear on the wall after a quick review.',
  }, 201);
}

async function voteWish(request, env, body) {
  if (!validId(body.id)) {
    throw new HttpError(400, 'invalid_vote', 'This vote could not be submitted.');
  }
  const ip = await enforceRateLimit(request, env, 'vote', 10, 60 * 60);
  // A browser-provided identifier is attacker-controlled. Per-network keyed hashes
  // provide a stronger duplicate-vote boundary without storing raw IP addresses.
  const voterHash = await hmacHex(env.WISH_ADMIN_PASSWORD, `gamezipper-vote-v2:${ip}`);
  const inserted = await env.DB.prepare(`
    INSERT OR IGNORE INTO wish_votes(wish_id, voter_hash, created_at)
    SELECT ?, ?, ? WHERE EXISTS (
      SELECT 1 FROM wishes WHERE id = ? AND status IN ('approved', 'added')
    )
  `).bind(body.id, voterHash, Date.now(), body.id).run();

  if (Number(inserted.meta.changes || 0) === 0) {
    const wish = await env.DB.prepare("SELECT votes, status FROM wishes WHERE id = ? AND status IN ('approved', 'added')")
      .bind(body.id).first();
    if (!wish) throw new HttpError(404, 'wish_not_found', 'This wish is no longer available.');
    return json(request, env, { ok: true, alreadyVoted: true, votes: Number(wish.votes) });
  }

  const updated = await env.DB.prepare(`
    UPDATE wishes SET votes = votes + 1, updated_at = ?
    WHERE id = ? AND status IN ('approved', 'added') RETURNING votes
  `).bind(Date.now(), body.id).first();
  if (!updated) {
    await env.DB.prepare('DELETE FROM wish_votes WHERE wish_id = ? AND voter_hash = ?').bind(body.id, voterHash).run();
    throw new HttpError(404, 'wish_not_found', 'This wish is no longer available.');
  }
  return json(request, env, { ok: true, alreadyVoted: false, votes: Number(updated.votes) });
}

function sessionCookie(token, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/api/wish-admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

async function createSession(env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const signature = await hmacHex(env.WISH_ADMIN_PASSWORD, `gamezipper-wish-session-v1:${expires}`);
  return `${expires}.${signature}`;
}

async function requireAdmin(request, env) {
  if (!env.WISH_ADMIN_PASSWORD) {
    throw new HttpError(503, 'configuration_required', 'The wish service has not been configured yet.');
  }
  const cookies = request.headers.get('Cookie') || '';
  const token = cookies.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || '';
  const [expiresText, signature, extra] = token.split('.');
  const expires = Number(expiresText);
  if (extra || !/^\d+$/.test(expiresText || '') || expires <= Math.floor(Date.now() / 1000) || !signature) {
    throw new HttpError(401, 'unauthorized', 'Please sign in to continue.');
  }
  const expected = await hmacHex(env.WISH_ADMIN_PASSWORD, `gamezipper-wish-session-v1:${expiresText}`);
  if (!constantTimeEqual(signature, expected)) {
    throw new HttpError(401, 'unauthorized', 'Please sign in to continue.');
  }
}

async function adminLogin(request, env, body) {
  await enforceRateLimit(request, env, 'admin-login', 8, 15 * 60);
  if (typeof body.password !== 'string' || !constantTimeEqual(body.password, env.WISH_ADMIN_PASSWORD || '')) {
    throw new HttpError(401, 'invalid_login', 'Incorrect password.');
  }
  const token = await createSession(env);
  return json(request, env, { ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
}

async function listAdminWishes(request, env, url) {
  await requireAdmin(request, env);
  const requestedStatus = url.searchParams.get('status') || 'all';
  if (requestedStatus !== 'all' && !STATUSES.has(requestedStatus)) {
    throw new HttpError(400, 'invalid_status', 'Unknown wish status.');
  }
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '40', 10) || 40));
  const offset = Math.min(100000, Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0));
  const where = requestedStatus === 'all' ? '' : 'WHERE status = ?';
  const countWhere = requestedStatus === 'all' ? '' : 'WHERE status = ?';
  const listStatement = env.DB.prepare(`SELECT * FROM wishes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
  const countStatement = env.DB.prepare(`SELECT COUNT(*) AS count FROM wishes ${countWhere}`);
  const [rows, count, stats] = await Promise.all([
    (requestedStatus === 'all' ? listStatement.bind(limit, offset) : listStatement.bind(requestedStatus, limit, offset)).all(),
    (requestedStatus === 'all' ? countStatement : countStatement.bind(requestedStatus)).first(),
    env.DB.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status IN ('approved', 'added') THEN 1 ELSE 0 END) AS public,
        SUM(CASE WHEN status = 'added' THEN 1 ELSE 0 END) AS added,
        SUM(CASE WHEN email_status = 'failed' THEN 1 ELSE 0 END) AS email_failed
      FROM wishes
    `).first(),
  ]);
  return json(request, env, {
    ok: true,
    wishes: (rows.results || []).map(adminWish),
    total: Number(count.count || 0),
    hasMore: offset + (rows.results || []).length < Number(count.count || 0),
    stats: {
      total: Number(stats.total || 0),
      pending: Number(stats.pending || 0),
      public: Number(stats.public || 0),
      added: Number(stats.added || 0),
      emailFailed: Number(stats.email_failed || 0),
    },
    emailConfigured: Boolean(env.RESEND_API_KEY && env.WISH_EMAIL_TO && env.WISH_EMAIL_FROM),
  });
}

async function updateWish(request, env, body) {
  await requireAdmin(request, env);
  if (!validId(body.id) || !STATUSES.has(body.status) || body.status === 'pending') {
    throw new HttpError(400, 'invalid_update', 'This wish update is not valid.');
  }
  const gameUrl = normalizeGameUrl(body.gameUrl || '');
  const updated = await env.DB.prepare(`
    UPDATE wishes SET status = ?, game_url = ?, updated_at = ? WHERE id = ?
    RETURNING *
  `).bind(body.status, gameUrl, Date.now(), body.id).first();
  if (!updated) throw new HttpError(404, 'wish_not_found', 'Wish not found.');
  return json(request, env, { ok: true, wish: adminWish(updated) });
}

async function deleteWish(request, env, body) {
  await requireAdmin(request, env);
  if (!validId(body.id)) throw new HttpError(400, 'invalid_id', 'Invalid wish ID.');
  const result = await env.DB.prepare('DELETE FROM wishes WHERE id = ?').bind(body.id).run();
  if (!Number(result.meta.changes || 0)) throw new HttpError(404, 'wish_not_found', 'Wish not found.');
  return json(request, env, { ok: true });
}

async function resendWishEmail(request, env, body) {
  await requireAdmin(request, env);
  if (!validId(body.id)) throw new HttpError(400, 'invalid_id', 'Invalid wish ID.');
  const wish = await env.DB.prepare('SELECT * FROM wishes WHERE id = ?').bind(body.id).first();
  if (!wish) throw new HttpError(404, 'wish_not_found', 'Wish not found.');
  const emailStatus = await deliverWishEmail(env, wish);
  return json(request, env, { ok: emailStatus === 'sent', emailStatus });
}

export { validateSubmission, normalizeGameUrl, deliverWishEmail };

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (request.method === 'OPTIONS') {
        requireAllowedOrigin(request, env);
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders(request, env),
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      if (url.pathname === '/api/health' && request.method === 'GET') {
        await env.DB.prepare('SELECT 1 AS ok').first();
        return json(request, env, { ok: true, service: 'gamezipper-wishes' });
      }

      if (url.pathname === '/api/wishes') {
        if (request.method === 'GET') return await listPublicWishes(request, env, url);
        if (request.method === 'POST') {
          requireAllowedOrigin(request, env);
          const body = await readBody(request);
          return await (body.action === 'vote' ? voteWish(request, env, body) : submitWish(request, env, ctx, body));
        }
        throw new HttpError(405, 'method_not_allowed', 'Method not allowed.');
      }

      if (url.pathname === '/api/wish-admin') {
        if (['POST', 'PATCH', 'DELETE'].includes(request.method)) requireAllowedOrigin(request, env);
        if (request.method === 'GET') return await listAdminWishes(request, env, url);
        const body = await readBody(request);
        if (request.method === 'POST' && body.action === 'login') return await adminLogin(request, env, body);
        if (request.method === 'POST' && body.action === 'logout') {
          return json(request, env, { ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
        }
        if (request.method === 'POST' && body.action === 'resend') return await resendWishEmail(request, env, body);
        if (request.method === 'PATCH') return await updateWish(request, env, body);
        if (request.method === 'DELETE') return await deleteWish(request, env, body);
        throw new HttpError(405, 'method_not_allowed', 'Method not allowed.');
      }

      return json(request, env, { ok: false, error: 'not_found' }, 404);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(request, env, { ok: false, error: error.code, message: error.message }, error.status);
      }
      console.error('Wish API error', error);
      return json(request, env, { ok: false, error: 'server_error', message: 'Something went wrong. Please try again.' }, 500);
    }
  },
};
