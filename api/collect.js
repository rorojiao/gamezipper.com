// Proxy endpoint for t.js and gz-analytics.js — forwards to internal BI server
// BI server: https://site-analytics.gamezipper.com/api/collect.gz (accepts POST JSON)
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const BI_SERVER = 'https://site-analytics.gamezipper.com/api/collect.gz';

    const response = await fetch(BI_SERVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    return new Response(null, { status: response.status });
  } catch (error) {
    console.error('BI collect proxy error:', error);
    return new Response('Bad Gateway', { status: 502 });
  }
}
