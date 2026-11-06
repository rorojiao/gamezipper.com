#!/usr/bin/env node
/* R337 queens — region id range check + regeneration feasibility.
 *
 * Two questions:
 *  (1) Are all region ids < n? The PAGE's countSolutions uses
 *      `var regionUsed=[]; for(i<n) regionUsed.push(false)` and then
 *      `if(regionUsed[reg]) continue;`. If any region id >= n, that lookup is
 *      `undefined` (falsy) -> the region constraint is silently DROPPED for
 *      that region -> countSolutions over-counts solutions. This is the
 *      Pitfall-#72-family bitmask/indexing bug.
 *  (2) Can the PAGE's own generator (generatePuzzle) actually produce levels
 *      with exactly one solution? If yes, we can regenerate the shipped
 *      catalog so the page's uniqueness claim becomes true.
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');

function extractArray(src, marker) {
  const m = src.match(marker);
  if (!m) return null;
  let i = m.index + m[0].length;
  const start = i; let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '[') depth++; else if (c === ']') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}
const raw = extractArray(html, /var PUZZLE_DATA\s*=\s*\[/);
const PUZZLE_DATA = eval('(' + '[' + raw + ']' + ')');

// (1) region id range
let badRange = [];
for (const p of PUZZLE_DATA) {
  let maxId = -1;
  for (let r = 0; r < p.n; r++) for (let c = 0; c < p.n; c++) maxId = Math.max(maxId, p.regions[r][c]);
  if (maxId >= p.n) badRange.push({ id: p.id, n: p.n, maxId });
}
console.log('regions with id >= n (would break the page solver): ' +
  (badRange.length ? JSON.stringify(badRange) : 'none'));

// (2) can the page generator produce unique levels?
// Extract the generator's dependencies and run them in a VM.
function grabFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf('{', m.index);
  let i = open + 1, depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '{') depth++; else if (c === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
}
const names = ['makeRNG', 'tryPlaceQueens', 'tryMakeRegions', 'countSolutions',
  'getNeighbors', 'generatePuzzle', 'fallbackSolution', 'fallbackRegions',
  'isRegionConnected', 'findNearestRegion'];
let src = '';
for (const n of names) {
  const f = grabFunction(html, n);
  if (!f) { console.error('FAIL: cannot extract ' + n); process.exit(1); }
  src += f + '\n';
}
const ctx = { Math, console: { log: () => {} } };
const vm = require('vm');
vm.createContext(ctx);
try { vm.runInContext(src + '\nthis.__gen = generatePuzzle; this.__cs = countSolutions;', ctx); }
catch (e) { console.error('FAIL: generator eval: ' + e.message); process.exit(1); }

// independent counter (Map-based, no id-range assumption)
function countOurs(n, regions, limit) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  let count = 0;
  (function bt(row) {
    if (count >= limit) return;
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}

// Does the generator's own uniqueness check agree with ours?
// generatePuzzle returns the FIRST seed attempt that passes countSolutions(...,3)===1.
// We call it for a spread of seeds and check the result with OUR counter.
let tried = 0, ok = 0, mismatch = [], fallbackHits = [];
const sizes = [7, 8, 9, 10, 11];
for (const n of sizes) {
  for (let seed = 1; seed <= 12; seed++) {
    tried++;
    const p = ctx.__gen(n, seed);
    if (!p || !p.regions) { fallbackHits.push({ n, seed, why: 'no puzzle' }); continue; }
    const mine = countOurs(p.n, p.regions, 2);
    const theirs = ctx.__cs(p.n, p.regions, 2);
    if (mine !== theirs) mismatch.push({ n, seed, mine, theirs });
    if (mine === 1) ok++; else fallbackHits.push({ n, seed, mine });
  }
}
console.log('generator trials: ' + tried + '  produced UNIQUE(1 solution): ' + ok);
console.log('generator/counter mismatch: ' + (mismatch.length ? JSON.stringify(mismatch) : 'none'));
console.log('non-unique generator outputs: ' + (fallbackHits.length ? JSON.stringify(fallbackHits) : 'none'));

// (3) daily path: n = 8 + (seed % 4) -> 8..11, seed = YYYYMMDD
// Run the daily generation for a wide range of plausible seeds and see how
// often it produces a NON-unique puzzle (the generator's fallback branch).
let dailyBad = 0, dailyTested = 0;
const dailySamples = [];
for (let y = 2026; y <= 2027; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 28; d++) {
      const seed = y * 10000 + m * 100 + d;
      const n = 8 + (seed % 4);
      dailyTested++;
      const p = ctx.__gen(n, seed);
      const mine = countOurs(p.n, p.regions, 2);
      if (mine !== 1) { dailyBad++; if (dailySamples.length < 10) dailySamples.push({ seed, n, mine }); }
    }
  }
}
console.log('DAILY generation: ' + dailyBad + '/' + dailyTested +
  ' dates produce a NON-unique puzzle (page claims every puzzle is unique)');
if (dailySamples.length) console.log('  samples: ' + JSON.stringify(dailySamples));
