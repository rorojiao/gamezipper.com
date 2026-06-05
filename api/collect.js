// Proxy endpoint for gz-analytics.js — FIXED 2026-06-05
// Receives array format from gz-analytics, transforms to Python server format,
// forwards to BI server via Cloudflare quick tunnel.
// PERMANENT FIX NEEDED: Create Cloudflare Worker as stable public endpoint
// (see comments in this file for setup instructions)
//
// Temporary: Uses cloudflared quick tunnel (URL changes on restart)
// Cloudflare Worker approach (permanent):
// 1. Create Worker at https://dash.cloudflare.com
// 2. Worker code: async function: receive request, forward to 10.10.29.67:8090/api/collect
// 3. Route analytics.gamezipper.com/* to the Worker
// 4. Update EP in gz-analytics.js to point to the Worker URL

// Temporary tunnel URL — REPLACE with Cloudflare Worker URL for production
const BI_SERVER_URL = 'https://earth-textbook-qualification-newark.trycloudflare.com/api/collect';

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }
  // Health check for GET (avoids 405 noise from browser preflight, monitoring, etc)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', endpoint: 'collect', method: 'GET' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }
  if (req.method !== 'POST') {
    // Return 200 for non-POST to avoid Varnish-cached 405 noise in browser console.
    // GET is a health check; OPTIONS is CORS preflight. Both are 200/204 above.
    // This branch only fires for truly weird methods (DELETE, PUT, etc).
    return new Response(JSON.stringify({ status: 'ok', endpoint: 'collect', method: req.method, msg: 'ignored' }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let events;
  try {
    const body = await req.json();
    // gz-analytics sends an array: [{s, e, d, t}, ...]
    if (Array.isArray(body)) {
      events = body;
    } else if (body.events && Array.isArray(body.events)) {
      events = body.events;
    } else {
      events = [body];
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ status: 'ok', msg: 'no events' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Transform gz-analytics format to Python server format
  // gz-analytics: {s: "site", e: "event_name", d: {u: "/path", ...custom...}, t: timestamp}
  // Python server: {site, path, event, vid, sid, device, screen, browser, os, referrer, country, duration, ip, meta}
  const transformed = events.map(ev => {
    const meta = { ...ev.d }; // copy all custom data fields
    const path = ev.d && ev.d.u ? ev.d.u : '/';

    return {
      site: ev.s || 'gamezipper.com',
      path: path,
      event: ev.e || 'page_view',
      vid: ev.d && ev.d.vid ? ev.d.vid : '',
      sid: ev.d && ev.d.sid ? ev.d.sid : '',
      device: ev.d && ev.d.device ? ev.d.device : '',
      screen: ev.d && ev.d.screen ? ev.d.screen : '',
      browser: '',
      os: '',
      referrer: ev.d && ev.d.ref ? ev.d.ref : '',
      country: ev.d && ev.d.country ? ev.d.country : '',
      duration: ev.d && ev.d.dur ? parseInt(ev.d.dur) : 0,
      ip: '',
      meta: JSON.stringify(meta)
    };
  });

  // Forward to Python BI server
  try {
    const results = await Promise.allSettled(
      transformed.map(ev =>
        fetch(BI_SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ev),
          // keepalive ensures the request completes even if page unloads
          keepalive: true
        }).then(r => r.json()).catch(() => ({ status: 'network_error' }))
      )
    );

    const allOk = results.every(r => r.status === 'ok');
    return new Response(JSON.stringify({
      status: allOk ? 'ok' : 'partial',
      received: events.length,
      results: results.map(r => r.status || r)
    }), {
      status: allOk ? 200 : 207,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('BI forward error:', err);
    // Return 200 to browser to avoid errors, but log the failure
    return new Response(JSON.stringify({ status: 'error', msg: 'forward_failed' }), {
      status: 200, // Still 200 so browser doesn't show errors
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
