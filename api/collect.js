// Vercel Edge Function — gz-analytics proxy
// Per Vercel 2026 docs: edge functions use export default handler(request)
// Located at api/collect (NO .js suffix — Vercel routes /api/* to /api/*.{js,ts} as static)
//
// To force this to be a function, we use Node.js-style signature.
// POST events array → forward to Python BI server.

const BI_SERVER_URL = 'https://earth-textbook-qualification-newark.trycloudflare.com/api/collect';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

export default async function handler(req) {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', endpoint: 'collect', method: 'GET' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ status: 'ok', method }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  let events;
  try {
    const body = await req.json();
    if (Array.isArray(body)) events = body;
    else if (body && Array.isArray(body.events)) events = body.events;
    else events = [body];
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'invalid_json' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  if (!events || events.length === 0) {
    return new Response(
      JSON.stringify({ status: 'ok', msg: 'no_events' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  const transformed = events.map(ev => {
    const meta = { ...(ev.d || {}) };
    return {
      site: ev.s || 'gamezipper.com',
      path: (ev.d && ev.d.u) || '/',
      event: ev.e || 'page_view',
      vid: (ev.d && ev.d.vid) || '',
      sid: (ev.d && ev.d.sid) || '',
      device: (ev.d && ev.d.device) || '',
      screen: (ev.d && ev.d.screen) || '',
      referrer: (ev.d && ev.d.ref) || '',
      country: (ev.d && ev.d.country) || '',
      duration: (ev.d && ev.d.dur) ? parseInt(ev.d.dur) : 0,
      meta: JSON.stringify(meta),
    };
  });

  try {
    const results = await Promise.allSettled(
      transformed.map(ev =>
        fetch(BI_SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ev),
          keepalive: true,
        })
          .then(r => r.json().catch(() => ({ status: 'parse_error' })))
          .catch(() => ({ status: 'forward_error' }))
      )
    );

    const allOk = results.every(
      r => r.status === 'fulfilled' && r.value && r.value.status !== 'forward_error'
    );

    return new Response(
      JSON.stringify({
        status: allOk ? 'ok' : 'partial',
        received: events.length,
      }),
      {
        status: allOk ? 200 : 207,
        headers: { 'Content-Type': 'application/json', ...CORS },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'error', msg: 'forward_failed' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }
}

export const config = { runtime: 'edge' };
