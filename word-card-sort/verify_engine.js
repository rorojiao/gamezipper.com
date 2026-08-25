// word-card-sort/verify_engine.js — full Level verification
// Rules:
//   Tier 1 (L1-10): 3 cats x 4 words (12 total)
//   Tier 2 (L11-20): 4 cats x 4 words (16 total)
//   Tier 3 (L21-30): 4 cats x 5 words (20 total)
//   Tier 4 (L31-40): 5 cats x 4 words (20 total)
//   Tier 5 (L41-50): 5 cats x 5 words (25 total)
// Invariants: every level's flattened word list has no duplicates; cats are non-empty strings
const fs = require('fs');
const path = require('path');

const SLUG = 'word-card-sort';
const html = fs.readFileSync(path.join('/home/junze/gamezipper.com', SLUG, 'index.html'), 'utf8');
const m = html.match(/(?:const|var)\s+LEVELS\s*=\s*(\[)/);
if (!m) { console.error('NO LEVELS'); process.exit(1); }
const start = m.index + m[0].length - 1;
let depth = 0, end = start;
for (let i = start; i < html.length; i++) {
  const c = html[i];
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
let arrSrc = html.substring(start, end);
arrSrc = arrSrc.replace(/\/\/[^\n]*/g, '');
let LEVELS;
try { LEVELS = (new Function('return ' + arrSrc))(); }
catch (e) { console.error('eval fail:', e.message); process.exit(1); }

console.log('LEVELS.length =', LEVELS.length);

function expectedShape(l) {
  if (l <= 10) return [3, 4];
  if (l <= 20) return [4, 4];
  if (l <= 30) return [4, 5];
  if (l <= 40) return [5, 4];
  return [5, 5];
}

const seen = new Map();
let problems = [];
for (let i = 0; i < LEVELS.length; i++) {
  const e = LEVELS[i];
  const exp = expectedShape(e.l);
  // shape
  if (!e.c || !e.w) { problems.push(`L${e.l}: missing c/w`); continue; }
  if (!Array.isArray(e.c) || e.c.length !== exp[0]) { problems.push(`L${e.l}: cats=${e.c?.length} expected ${exp[0]}`); continue; }
  if (!Array.isArray(e.w) || e.w.length !== exp[0]) { problems.push(`L${e.l}: word rows=${e.w?.length} expected ${exp[0]}`); continue; }
  for (let r = 0; r < e.w.length; r++) {
    if (!Array.isArray(e.w[r]) || e.w[r].length !== exp[1]) { problems.push(`L${e.l}: row ${r} length=${e.w[r]?.length} expected ${exp[1]}`); }
  }
  // uniqueness across whole level
  const all = e.w.flat();
  if (all.length !== new Set(all).size) {
    const seen2 = new Set(); const dupSet = [];
    for (const w of all) { if (seen2.has(w)) dupSet.push(w); else seen2.add(w); }
    problems.push(`L${e.l}: DUPLICATE words in same level: ${dupSet.join(', ')}`);
  }
  // unique across levels (same word in same exact position across different levels is OK — it's a theme; but a "level hash" check ensures variety)
  const key = JSON.stringify({c: e.c, w: e.w});
  if (seen.has(key)) problems.push(`L${e.l}: DUPLICATE of L${seen.get(key)}`);
  seen.set(key, e.l);
}

console.log('problems:', problems.length);
for (const p of problems.slice(0, 20)) console.log('  ', p);

if (problems.length === 0) {
  console.log(`OK: ${LEVELS.length} levels, 0 problems`);
  process.exit(0);
} else {
  console.log(`FAIL: ${problems.length} problems`);
  process.exit(1);
}