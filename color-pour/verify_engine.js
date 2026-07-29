#!/usr/bin/env node
/**
 * Redirect-aware verifier for the archived slug.
 * color-pour is not a live game entry; it is a canonical redirect to the live
 * magic-sort keeper. Verify the redirect contract instead of trying to extract
 * the old game's removed LEVELS payload.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const expected = 'https://gamezipper.com/magic-sort/';
const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
const refresh = html.match(/http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i);
const checks = {
  noindex: /name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
  canonical: canonical && canonical[1] === expected,
  metaRefresh: refresh && refresh[1] === expected,
  jsRedirect: html.includes(`window.location.replace('${expected}')`) || html.includes(`window.location.replace("${expected}")`),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({slug: 'color-pour', kind: 'canonical-redirect', target: expected, checks}));
if (failed.length) {
  console.error('Redirect verification failed:', failed.join(', '));
  process.exit(1);
}
console.log('color-pour redirect verifier: PASS');
