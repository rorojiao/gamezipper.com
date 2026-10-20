#!/usr/bin/env node
/* R966 — bot referrer blocklist unit tests.
   Extracts isBotReferrer() from BOTH layers (gz-analytics.js + monetag-manager.js)
   and asserts identical behaviour, including NO false positives on realistic
   legitimate referrers. Run: node .audit/test-r966-botblock.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// Extract the BOT_REFERRERS array + AUTO_DEPLOY_RE + isBotReferrer fn from a file
function extract(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const start = src.indexOf('var BOT_REFERRERS = [');
  if (start < 0) throw new Error('BOT_REFERRERS not found in ' + file);
  const fnStart = src.indexOf('function isBotReferrer', start);
  if (fnStart < 0) throw new Error('isBotReferrer not found in ' + file);
  let i = src.indexOf('{', fnStart), depth = 0, end = i;
  for (let k = i; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
  }
  const chunk = src.slice(start, end) + '\nreturn isBotReferrer;';
  return new Function(chunk)();
}

const layers = {
  'gz-analytics.js': extract('gz-analytics.js'),
  'monetag-manager.js': extract('monetag-manager.js'),
};

// ---- MUST BLOCK -------------------------------------------------------------
const BLOCK = [
  // R962 originals (regression guard)
  ['https://dfvvf.pages.dev/', 'R962 primary'],
  ['https://dfvvf.pages.dev/some/path?q=1', 'R962 primary + path'],
  ['http://glasspane.pages.dev/', 'R962 sibling'],
  ['https://varonexa.pages.dev/', 'R962 sibling'],
  ['https://DFVVF.PAGES.DEV/', 'case-insensitive'],
  ['https://dfvvf.pages.dev:443/', 'explicit port'],
  // R966 explicit (non-shape-conforming)
  ['https://assignment-notebook.netlify.app/', 'R966 explicit netlify'],
  ['https://playroomapi.netlify.app/', 'R966 explicit netlify'],
  ['https://vamp-games.netlify.app/', 'R966 explicit netlify'],
  ['https://vboard-delta.vercel.app/', 'R966 explicit vercel'],
  ['https://game-web-sandy-gamma.vercel.app/', 'R966 explicit vercel'],
  ['https://harveyspecter16.github.io/', 'R966 explicit gh-pages'],
  ['https://coolhiglers.github.io/', 'R966 explicit gh-pages'],
  ['https://shoaibbilal125134-crypto.github.io/', 'R966 explicit gh-pages'],
  ['https://sron2527.github.io/', 'R966 explicit gh-pages'],
  ['https://mskennedyj.github.io/', 'R966 explicit gh-pages'],
  // R966 SHAPE rule — unseen future rotations (the whole point)
  ['https://heroic-dusk-8446ca.netlify.app/', 'shape: netlify deploy'],
  ['https://mellifluous-pithivier-8ec2ec.netlify.app/', 'shape: netlify long hex'],
  ['https://mobile-preview--mellifluous-pithivier-8ec2ec.netlify.app/', 'shape: netlify --'],
  ['https://friendly-cactus-ba6339.netlify.app/', 'shape: netlify deploy'],
  ['https://somebrandnewsite-abc1234567.vercel.app/', 'shape: vercel 10-hex'],
  ['https://brand-new-farm-99887766.pages.dev/', 'shape: pages.dev rotation'],
  ['https://x-8446ca.web.app/', 'shape: firebase web.app'],
  ['https://x-1234ab.onrender.com/', 'shape: onrender'],
  ['https://proj-1a2b3c.now.sh/', 'shape: now.sh'],
  ['https://unseen-rotation-abcdef12.netlify.app/', 'shape: future rotation'],
];

// ---- MUST NOT BLOCK (false-positive guards — this is the load-bearing half) ---
const ALLOW = [
  ['', 'empty referrer (direct)'],
  ['https://www.bing.com/', 'bing'],
  ['https://cn.bing.com/', 'bing cn'],
  ['https://duckduckgo.com/', 'ddg'],
  ['https://www.google.com/', 'google'],
  ['https://gamezipper.com/', 'internal'],
  ['https://gamezipper.com/tangram/?utm_source=embed', 'internal + query'],
  ['https://t.co/abc123', 'twitter shortener'],
  ['https://chatgpt.com/', 'chatgpt'],
  ['https://l.facebook.com/l.php?u=x', 'facebook'],
  ['https://www.youtube.com/', 'youtube'],
  ['https://telegram.me/', 'telegram'],
  ['https://www.reddit.com/r/games/', 'reddit'],
  ['https://mysite.netlify.app/', 'LEGIT netlify, human name no hex'],
  ['https://portfolio.vercel.app/', 'LEGIT vercel, human name no hex'],
  ['https://someone.github.io/', 'LEGIT gh-pages profile'],
  ['https://foo.pages.dev/', 'LEGIT pages.dev, human name'],
  ['https://myapp.web.app/', 'LEGIT firebase, human name'],
  ['https://abc123.netlify.app/', 'hex-LOOKING but no hyphen delimiter'],
  ['https://netlify.app/', 'bare apex'],
  ['https://x-8446ca.netlify.app.evil.com/', 'SUFFIX ATTACK — must not match'],
  ['https://dfvvf.pages.dev.evil.com/', 'SUFFIX ATTACK on R962 host'],
  ['https://notdfvvf.pages.dev/', 'near-miss pages.dev'],
];

let pass = 0, fail = 0;
const fails = [];
for (const [name, fn] of Object.entries(layers)) {
  for (const [ref, label] of BLOCK) {
    if (fn(ref) === true) pass++;
    else { fail++; fails.push(`${name}: SHOULD BLOCK but allowed -> "${ref}" (${label})`); }
  }
  for (const [ref, label] of ALLOW) {
    if (fn(ref) === false) pass++;
    else { fail++; fails.push(`${name}: SHOULD ALLOW but blocked -> "${ref}" (${label})`); }
  }
}

// Both layers must agree on every case (defense-in-depth must not diverge)
for (const [ref] of [...BLOCK, ...ALLOW]) {
  const a = layers['gz-analytics.js'](ref), b = layers['monetag-manager.js'](ref);
  if (a === b) pass++;
  else { fail++; fails.push(`LAYER DIVERGENCE on "${ref}": analytics=${a} monetag=${b}`); }
}

const total = pass + fail;
console.log(`R966 bot-block tests: ${pass}/${total} PASS`);
if (fail) {
  console.log('\nFAILURES:');
  fails.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
console.log(`  layers verified: ${Object.keys(layers).length} | block cases: ${BLOCK.length} | allow cases: ${ALLOW.length}`);
console.log('  suffix-attack guards OK | legit netlify/vercel/pages.dev NOT blocked');
