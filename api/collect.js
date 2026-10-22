// Vercel Serverless Function — gz-analytics proxy (POST-safe, no edge runtime)
// Keep this fallback aligned with the live QuickTunnel endpoint in gz-analytics.js.
// The previous packing-asset-drums-sarah URL expired, causing POST fallback requests
// to fail even while the browser's direct gz-analytics endpoint remained healthy.
const BI_SERVER_URL = 'https://vessel-refine-servers-arbitrary.trycloudflare.com/api/collect';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function GET() {
  return json({ status: 'ok', endpoint: 'collect', method: 'GET' });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  let events;
  try {
    const body = await request.json();
    if (Array.isArray(body)) events = body;
    else if (body && Array.isArray(body.events)) events = body.events;
    else events = [body];
  } catch (e) {
    return json({ error: 'invalid_json' }, 400);
  }

  if (!events || events.length === 0) {
    return json({ status: 'ok', msg: 'no_events' });
  }

  const transformed = events.map(ev => {
    const d = (ev.d && typeof ev.d === 'object') ? ev.d : {};
    // R975: the old transform only understood the gz-analytics envelope
    // ({e, d:{...}}) and hard-coded path='/', event='page_view', meta='{}'
    // for anything else. The legacy public/t.js shape (evt/br/dev/scr/ref/dur)
    // therefore arrived at BI as a fake homepage page_view with the payload
    // destroyed, and the real browser UA never reached _BOT_FILTER at all.
    const metaSrc = (ev.meta && typeof ev.meta === 'object') ? ev.meta : d;
    const pick = (...keys) => {
      for (const k of keys) {
        const a = ev[k], b = d[k];
        if (a !== undefined && a !== null && a !== '') return a;
        if (b !== undefined && b !== null && b !== '') return b;
      }
      return '';
    };
    return {
      site: pick('site', 's') || 'gamezipper.com',
      path: pick('path', 'u') || '/',
      event: pick('e', 'event', 'evt') || 'page_view',
      vid: pick('vid') || '',
      sid: pick('sid') || '',
      device: pick('device', 'dev') || '',
      screen: pick('screen', 'scr') || '',
      browser: pick('browser', 'br') || '',
      os: pick('os') || '',
      referrer: pick('referrer', 'ref') || '',
      country: pick('country') || '',
      duration: parseInt(pick('duration', 'dur')) || 0,
      meta: JSON.stringify(metaSrc),
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
    return json({ status: allOk ? 'ok' : 'partial', received: events.length }, allOk ? 200 : 207);
  } catch (err) {
    return json({ status: 'error', msg: 'forward_failed' });
  }
}
