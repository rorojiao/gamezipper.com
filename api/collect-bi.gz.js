// Proxy endpoint for gz-analytics.js → forwards to internal BI server
// gz-analytics.js sends JSON array events to this endpoint
// We proxy to https://site-analytics.gamezipper.com/api/collect.gz

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
    console.error('BI proxy error:', error);
    return new Response('Bad Gateway', { status: 502 });
  }
}
