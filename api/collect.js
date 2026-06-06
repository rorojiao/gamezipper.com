// Vercel Serverless Function — gz-analytics proxy (POST-safe, no edge runtime)
// Remove 'runtime=edge' to avoid Vercel routing-layer POST blocking
const BI_SERVER_URL = 'https://timeline-administrative-affiliation-taxi.trycloudflare.com/api/collect';

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
    return json({ status: allOk ? 'ok' : 'partial', received: events.length }, allOk ? 200 : 207);
  } catch (err) {
    return json({ status: 'error', msg: 'forward_failed' });
  }
}
