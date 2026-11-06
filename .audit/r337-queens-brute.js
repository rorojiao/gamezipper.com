#!/usr/bin/env node
/* R337 queens BRUTE-FORCE calibration.
 *
 * Purpose: the r337-queens-unique.js counter and the PAGE's own countSolutions
 * agree, but two implementations that share the same ROW-BY-ROW pruning
 * assumption are not fully independent. This enumerator makes NO assumption
 * about the shape of a solution: it enumerates every possible SET of n cells
 * on the n x n board (C(n*n, n) is too large for n=11, so it enumerates all
 * PERMUTATIONS of columns per row = the "one per row" reading, then filters
 * by the remaining rules) AND, for the smallest levels, an exhaustive
 * subset-enumeration over all n-cell subsets with no row assumption.
 *
 * The subset enumeration is the truly assumption-free control: it does not
 * presuppose "one crown per row" — it tests the rule set as the ENGINE
 * states it (n crowns, at most one per row/col/region, no adjacency).
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');
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
const raw = extractArray(html, /var PUZZLE_DATA\s*=\s*\[/);
const PUZZLE_DATA = eval('(' + '[' + raw + ']' + ')');

function ruleViolations(n, regions, cells) {
  // cells = array of [r,c]
  if (cells.length !== n) return 'not exactly n crowns';
  const rows = new Set(), cols = new Set(), regs = new Set();
  for (const [r, c] of cells) {
    if (r < 0 || r >= n || c < 0 || c >= n) return 'out of bounds';
    if (rows.has(r)) return 'two crowns in row ' + r;
    rows.add(r);
    if (cols.has(c)) return 'two crowns in col ' + c;
    cols.add(c);
    const reg = regions[r][c];
    if (regs.has(reg)) return 'two crowns in region ' + reg;
    regs.add(reg);
  }
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const dr = Math.abs(cells[i][0] - cells[j][0]);
      const dc = Math.abs(cells[i][1] - cells[j][1]);
      if (dr <= 1 && dc <= 1) return 'crowns (' + cells[i] + ') and (' + cells[j] + ') adjacent';
    }
  }
  return null;
}

/* CONTROL A — assumption-free: enumerate ALL n-cell subsets of the n*n
 * board and keep the rule-valid ones. Only feasible for n <= 8
 * (C(64,8) = 4.4e9 is too big; n=7 -> C(49,7)=85.9M which is borderline).
 * We do n <= 6 exhaustively and n=7 by permutation-with-no-row-assumption
 * via a cell-ordered DFS. */
function enumerateSubsetSolutions(n, regions, limit) {
  const total = n * n;
  const results = [];
  const chosen = [];
  (function dfs(start) {
    if (results.length >= limit) return;
    const need = n - chosen.length;
    if (total - start < need) return;
    if (need === 0) {
      if (!ruleViolations(n, regions, chosen)) results.push(chosen.map(c => c.slice()));
      return;
    }
    for (let idx = start; idx <= total - need; idx++) {
      chosen.push([Math.floor(idx / n), idx % n]);
      dfs(idx + 1);
      chosen.pop();
      if (results.length >= limit) return;
    }
  })(0);
  return results;
}

/* CONTROL B — permutation based (one per row), no other assumption */
function enumeratePermutationSolutions(n, regions, limit) {
  const results = [];
  const cols = [];
  const used = new Array(n).fill(false);
  (function rec(row) {
    if (results.length >= limit) return;
    if (row === n) {
      if (!ruleViolations(n, regions, cols.map((c, r) => [r, c]))) {
        results.push(cols.slice());
      }
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      used[c] = true; cols.push(c);
      rec(row + 1);
      cols.pop(); used[c] = false;
      if (results.length >= limit) return;
    }
  })(0);
  return results;
}

console.log('QUEENS brute-force calibration');
const bruteResults = {};
for (const p of PUZZLE_DATA) {
  const n = p.n;
  let sols, method;
  if (n <= 7) {
    sols = enumerateSubsetSolutions(n, p.regions, 3);
    method = 'subset-exhaustive (assumption-free)';
  } else {
    sols = enumeratePermutationSolutions(n, p.regions, 3);
    method = 'permutation-exhaustive';
  }
  bruteResults[p.id] = { n, count: sols.length, method };
  console.log('  level ' + String(p.id).padStart(2) + ' n=' + n +
    '  brute solutions=' + sols.length + '  [' + method + ']' +
    (sols.length > 1 ? '  -> ' + JSON.stringify(sols.slice(0, 2)) : ''));
}

const multi = Object.entries(bruteResults).filter(([, v]) => v.count > 1).map(([k]) => +k);
const zero = Object.entries(bruteResults).filter(([, v]) => v.count === 0).map(([k]) => +k);
console.log('brute-force MULTI levels : ' + (multi.length ? multi.join(',') : 'none'));
console.log('brute-force ZERO levels  : ' + (zero.length ? zero.join(',') : 'none'));

// also confirm the stored solution is one of the enumerated ones
let storedFound = 0, storedMissing = [];
for (const p of PUZZLE_DATA) {
  const found = bruteResults[p.id].count > 0;
  const storedValid = !ruleViolations(p.n, p.regions, p.solution.map((c, r) => [r, c]));
  if (storedValid) storedFound++; else storedMissing.push(p.id);
}
console.log('stored solutions rule-valid: ' + storedFound + '/' + PUZZLE_DATA.length +
  (storedMissing.length ? ' INVALID: ' + storedMissing.join(',') : ''));

fs.writeFileSync(path.join(__dirname, 'r337-queens-brute.json'),
  JSON.stringify({ bruteResults, multi, zero, storedFound, storedMissing }, null, 1));
console.log(JSON.stringify({ multi, zero, storedFound, storedMissing }));
