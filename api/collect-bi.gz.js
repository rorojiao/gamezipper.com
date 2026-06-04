// Proxy endpoint for gz-analytics.js — TEMPORARILY DISABLED
// site-analytics.gamezipper.com DEAD (2026-06-04)
// Same fix as collect.js — silent 200 to avoid 502 errors
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return new Response(null, { status: 200 });
}
