#!/usr/bin/env node
/* Head-inject <script src="/gz-ux.js?v=ux1"></script> into target pages.
 * Inserted right after the viewport meta (runs before body scripts → mute
 * prototypes patched ahead of game code). Idempotent.
 * Usage: node inject-ux.js            (union list from /tmp/ux-lists.json)
 *        node inject-ux.js slug1,slug2 */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const TAG = '<script src="/gz-ux.js?v=ux1"></script>';

const slugs = process.argv[2]
  ? process.argv[2].split(',')
  : [...new Set(Object.values(JSON.parse(fs.readFileSync('/tmp/ux-lists.json', 'utf8'))).flat())];

let done = 0, skipped = 0, missing = 0;
for (const slug of slugs) {
  const f = path.join(repo, slug, 'index.html');
  if (!fs.existsSync(f)) { missing++; continue; }
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('/gz-ux.js')) { skipped++; continue; }
  const m = h.match(/<meta[^>]+name="viewport"[^>]*>/i);
  if (m) h = h.replace(m[0], m[0] + '\n' + TAG);
  else h = h.replace(/<\/head>/i, TAG + '\n</head>');
  fs.writeFileSync(f, h);
  done++;
}
console.log(JSON.stringify({ injected: done, alreadyHad: skipped, missingIndex: missing, total: slugs.length }));
