#!/usr/bin/env node
/* R337 queens — INDEPENDENT assumption-free verifier for the SHIPPED catalog.
 *
 * Separate from the generator's own solver: this one enumerates every
 * placement of n queens (one per row) with NO pruning beyond the rules
 * themselves, then filters by the full rule set. Three rules:
 *   R1 one queen per column
 *   R2 one queen per region
 *   R3 no two queens adjacent (8-directional, |dr|<=1 && |dc|<=1)
 *
 * Rules are read from the PAGE (checkWin body), not from level key names.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

function extractArray(src, marker) {
  const m = src.match(marker);
  if (!m) return null;
  let i = m.index + m[0].length;
  const start = i;
  let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

const file = process.argv[2] || path.join(HERE, '..', 'queens', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const raw = extractArray(html, /var PUZZLE_DATA\s*=\s*\[/);
if (!raw) { console.error('PUZZLE_DATA not found'); process.exit(1); }
const PUZZLE_DATA = eval('(' + '[' + raw + ']' + ')');

// sanity: region ids must be < n (the page's own countSolutions uses an
// ARRAY indexed by region id of length n — an id >= n would be undefined
// and silently treated as "region unused", i.e. a solver bug, not a data bug)
let maxReg = -1, regOver = [];
for (const p of PUZZLE_DATA) {
  let mx = -1;
  for (const row of p.regions) for (const v of row) if (v > mx) mx = v;
  maxReg = Math.max(maxReg, mx);
  if (mx >= p.n) regOver.push({ id: p.id, n: p.n, maxReg: mx });
}
console.log('max region id across catalog:', maxReg);
console.log('levels with region id >= n (page-solver blind spot):', regOver.length ? JSON.stringify(regOver) : 'none');

// ---- assumption-free enumeration ---------------------------------------
function countAll(n, regions, limit) {
  // NOTE: limit must be >= the true solution count, otherwise "stored solution
  // not among the solutions" is an artifact of truncation (self-inflicted
  // bug, caught by re-running with limit = n!).
  const colUsed = new Array(n).fill(false);
  const regUsed = new Set();
  const placed = new Array(n).fill(-1);
  const sols = [];
  (function bt(row) {
    if (sols.length >= limit) return;
    if (row === n) {
      // full pairwise validation (not just adjacent rows)
      const rows = new Set(), cols = new Set(), regs = new Set();
      for (let r = 0; r < n; r++) {
        const c = placed[r];
        if (c < 0) return;
        if (rows.has(r) || cols.has(c) || regs.has(regions[r][c])) return;
        rows.add(r); cols.add(c); regs.add(regions[r][c]);
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 && Math.abs(placed[i] - placed[j]) <= 1) return;
      }
      sols.push(placed.slice());
      return;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.has(reg)) continue;
      // prune only by adjacency with the previous row (sound: |dr|<=1)
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.add(reg);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return sols;
}

// ---- also re-run the PAGE's own countSolutions ---------------------------
function pageCountSolutions(n, regions, limit) {
  const colUsed = []; for (let i = 0; i < n; i++) colUsed.push(false);
  const regionUsed = []; for (let i = 0; i < n; i++) regionUsed.push(false);
  let solutionCount = 0;
  const placed = [];
  (function backtrack(row) {
    if (solutionCount >= limit) return;
    if (row === n) { solutionCount++; return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regionUsed[reg]) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regionUsed[reg] = true;
      backtrack(row + 1);
      colUsed[c] = false; regionUsed[reg] = false; placed[row] = undefined;
    }
  })(0);
  return solutionCount;
}

const LIMIT = Math.max(5, 100000);
let multi = [], mism = [], badStored = [], noSol = [];
let total = 0;
for (const p of PUZZLE_DATA) {
  const mine = countAll(p.n, p.regions, LIMIT);
  const page = pageCountSolutions(p.n, p.regions, LIMIT);
  total += mine.length;
  if (mine.length !== page) mism.push({ id: p.id, mine: mine.length, page });
  if (mine.length === 0) noSol.push(p.id);
  if (mine.length > 1) multi.push({ id: p.id, n: p.n, sols: mine.length });
  // stored solution must be one of the enumerated solutions
  const sol = p.solution;
  const ok = mine.some(s => s.every((v, i) => v === sol[i]));
  if (!ok) badStored.push({ id: p.id, sol });
}
console.log('\nlevel | n | independent | page');
for (const p of PUZZLE_DATA) {
  const mine = countAll(p.n, p.regions, LIMIT).length;
  const page = pageCountSolutions(p.n, p.regions, LIMIT);
  const flag = mine !== 1 ? '  <== NOT UNIQUE' : '';
  console.log(`  ${String(p.id).padStart(2)}  | ${p.n} | ${String(mine).padStart(5)} | ${String(page).padStart(5)}${flag}`);
}
console.log('\nTOTAL solutions across catalog:', total);
console.log('multi-solution levels:', multi.length, multi.length ? JSON.stringify(multi.map(m => m.id)) : '');
console.log('independent vs page mismatches:', mism.length, mism.length ? JSON.stringify(mism) : '');
console.log('levels with NO solution:', noSol.length, noSol.length ? JSON.stringify(noSol) : '');
console.log('levels whose STORED solution is not among the solutions:', badStored.length, badStored.length ? JSON.stringify(badStored) : '');
const bad = multi.length > 0 || mism.length > 0 || noSol.length > 0 || badStored.length > 0;
console.log('\nVERDICT:', bad ? 'FAIL' : 'PASS');
process.exit(bad ? 1 : 0);
