#!/usr/bin/env node
// R338 — determine which tateboo-yokoboo catalog is the AUTHORITATIVE one.
//
// Ground-truth sources, in order of authority:
//   1. gen_levels.py TIERS spec  (5x5,6x6,7x7,8x8,9x9 — 6 levels each)
//   2. gen_supplement.py intent   ("Supplement missing levels for 8x8 and 9x9")
//   3. levels_compact.json        (5x5/6x6/7x7/8x8/9x9 x 6  == spec)
//   4. levels.json                (5x5/6x6/7x7x2/8x8  == NO 9x9)
//   5. inline const LEVELS        (what the browser actually ships)
//
// Uses the canonical extractor (.audit/gz-extract-levels.js) — no re-implementation.
const fs = require('fs');
const path = require('path');
const extractLevels = require('./gz-extract-levels.js');

const DIR = path.resolve(__dirname, '..', 'tateboo-yokoboo');
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');

// --- canonical extractor: inline-first, then sibling JSON/compact ---
const canonical = extractLevels('tateboo-yokoboo');

const inline = JSON.parse(
  (function () {
    const re = /\b(?:const|let|var)\s+LEVELS\s*=\s*\[/g;
    let m;
    while ((m = re.exec(html))) {
      const start = m.index + m[0].length - 1;
      // balanced-bracket scan (string aware) — reuse the canonical helper's scanner
      const { extractLevelsFromHtml } = require('./gz-extract-levels.js');
      void extractLevelsFromHtml;
      let depth = 1, i = start + 1, inStr = null;
      for (; i < html.length; i++) {
        const c = html[i];
        if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; continue; }
        if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
        if (c === '[') depth++;
        else if (c === ']') { depth--; if (depth === 0) break; }
      }
      return html.slice(start, i + 1);
    }
    return '[]';
  })()
);

const lvlJson = JSON.parse(fs.readFileSync(path.join(DIR, 'levels.json'), 'utf8'));
const compact = JSON.parse(fs.readFileSync(path.join(DIR, 'levels_compact.json'), 'utf8'));

// level identity = everything except cosmetic fields
const DENY = new Set(['id', 'name', 'label', 'desc']);
const ident = (l) => JSON.stringify(
  Object.keys(l).filter((k) => !DENY.has(k)).sort().map((k) => [k, l[k]])
);

function profile(name, arr) {
  const sizes = {};
  for (const l of arr) {
    const k = `${l.rows}x${l.cols}`;
    sizes[k] = (sizes[k] || 0) + 1;
  }
  const ids = new Set(arr.map(ident));
  console.log(`\n### ${name}  (n=${arr.length})`);
  console.log('  sizes      :', JSON.stringify(Object.entries(sizes).sort((a, b) => a[0].localeCompare(b[0]))));
  console.log('  unique lvls:', ids.size, ids.size === arr.length ? '(no dupes)' : '(DUPLICATES PRESENT)');
  console.log('  has 9x9    :', arr.some((l) => l.rows === 9 && l.cols === 9));
  return { ids, arr };
}

const P = {};
P.inline = profile('INLINE const LEVELS (what ships)', inline);
P.json = profile('levels.json (sibling)', lvlJson);
P.compact = profile('levels_compact.json', compact);

console.log('\n### IDENTITY OVERLAPS (level-for-level) ###');
const pairs = [
  ['inline', 'json'], ['inline', 'compact'], ['json', 'compact'],
];
for (const [a, b] of pairs) {
  let same = 0;
  for (const id of P[a].ids) if (P[b].ids.has(id)) same++;
  console.log(`  ${a} vs ${b}: ${same}/${P[a].arr.length} levels identical`);
}

console.log('\n### BUILD DRIFT CHECK ###');
console.log('  inline == levels.json ?', ident === undefined ? '' : (JSON.stringify(inline.map(ident)) === JSON.stringify(lvlJson.map(ident))));
console.log('  canonical extractor returned n =', canonical.length, '(source precedence check)');
console.log('  canonical == inline     ?', JSON.stringify(canonical.map(ident)) === JSON.stringify(inline.map(ident)));
console.log('  canonical == compact    ?', JSON.stringify(canonical.map(ident)) === JSON.stringify(compact.map(ident)));

console.log('\n### numSegments ladder (difficulty monotonicity per 6-level tier) ###');
for (const [nm, arr] of [['inline', inline], ['compact', compact]]) {
  const segs = arr.map((l) => l.numSegments);
  const tiers = [];
  for (let i = 0; i < arr.length; i += 6) tiers.push(segs.slice(i, i + 6));
  console.log(`  ${nm}:`);
  for (let t = 0; t < tiers.length; t++) {
    const sz = `${arr[t * 6].rows}x${arr[t * 6].cols}`;
    console.log(`    tier${t} ${sz.padEnd(5)} segs=${JSON.stringify(tiers[t])}`);
  }
}
