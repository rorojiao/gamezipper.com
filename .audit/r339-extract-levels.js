#!/usr/bin/env node
/**
 * R339 — extract the tangle-master LEVELS catalog to JSON.
 * (Python `eval` cannot parse the JS object shorthand `{n:4,e:[...]}`: it
 *  reads `n:4` as a SLICE expression and raises NameError.)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function extractLevels(slug) {
  const html = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
  const m = /(?:const|var|let)\s+LEVELS\s*=\s*\[/.exec(html);
  if (!m) return null;
  const start = html.indexOf('[', m.index);
  let depth = 0, i = start, inStr = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const lit = html.slice(start, i);
  return new Function('return (' + lit + ')')();
}

const slug = process.argv[2] || 'tangle-master';
const L = extractLevels(slug);
console.log(`${slug}: extracted ${L.length} levels`);
const out = L.map((lv, idx) => ({
  idx: idx + 1,
  n: lv.n, m: lv.e.length,
  e: lv.e.map(x => [x[0], x[1]]),
  par: lv.par,
}));
fs.writeFileSync(path.join(ROOT, `.audit/r339-${slug}-levels.json`), JSON.stringify(out, null, 1));
for (const o of out) {
  const bound = 3 * o.n - 6;
  console.log(`  L${String(o.idx).padStart(2)}  n=${String(o.n).padStart(2)} m=${String(o.m).padStart(2)}  3n-6=${String(bound).padStart(2)}  ${o.m <= bound ? 'within-bound' : 'OVER-BOUND (non-planar!)'}`);
}
