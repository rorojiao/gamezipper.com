#!/usr/bin/env node
/* R337 queens independent uniqueness counter.
 *
 * The shipped queens/verify_engine.js ONLY validates that the stored solution
 * satisfies the 4 rules. It never COUNTS solutions, so the page's claim
 * ("Every puzzle has exactly one unique solution", "The solution is unique for
 * each puzzle") is unguarded — Pitfall #59/#86 shape.
 *
 * This script re-implements the rules FROM THE ENGINE (not from level key
 * names) and counts solutions with limit=2.
 *
 * Engine rules (queens/index.html checkWin, line ~1016):
 *   - exactly n crowns
 *   - at most one crown per row
 *   - at most one crown per column
 *   - at most one crown per region
 *   - no two crowns adjacent (8-direction, dr<=1 && dc<=1)
 * => with n crowns and n rows, "at most one per row" => exactly one per row.
 *
 * CALIBRATION: the game ships countSolutions(n, regions, limit) in the page.
 * We run OUR counter and the PAGE's counter and require agreement — that is
 * the control that proves our re-implementation matches the engine.
 *
 * Also asserts the SHIPPED solution is accepted by the rule (independent
 * validation), and reports region-count anomalies (regions != n means the
 * puzzle is under- or over-constrained).
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const html = fs.readFileSync(path.join(HERE, '..', 'queens', 'index.html'), 'utf8');

// --- extract PUZZLE_DATA with a balanced-bracket extractor ---
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
if (!raw) { console.error('FAIL: PUZZLE_DATA not found'); process.exit(1); }
const PUZZLE_DATA = eval('(' + '[' + raw + ']' + ')');

// --- extract the PAGE's countSolutions so we can cross-check ---
// NOTE: the brace scan must start AFTER the opening brace, otherwise the
// opening brace itself is counted and depth never returns to 0.
function grabFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf('{', m.index);
  if (open < 0) return null;
  let i = open + 1;
  let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
}
const pageFn = grabFunction(html, 'countSolutions');
if (!pageFn) { console.error('FAIL: countSolutions not found in page'); process.exit(1); }
const pageCtx = { console };
let pageCountSolutions = null;
try {
  // NOTE: no trailing () — we want the function VALUE, not the result of
  // calling it with no arguments.
  pageCountSolutions = new Function('return (' + pageFn + ')')();
} catch (e) {
  console.error('FAIL: could not instantiate page countSolutions: ' + e.message);
  process.exit(1);
}
if (typeof pageCountSolutions !== 'function') {
  console.error('FAIL: page countSolutions did not evaluate to a function');
  process.exit(1);
}

// --- OUR independent counter (rules re-derived from checkWin) ---
function countOurSolutions(n, regions, limit) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();          // region id -> true  (Map, not array: ids may exceed n)
  const placed = new Array(n).fill(-1);
  let count = 0;

  function backtrack(row) {
    if (count >= limit) return;
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      // adjacency to the previous row is the only adjacency possible while
      // filling rows top-down (two crowns are adjacent only if |dr| <= 1)
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c;
      colUsed[c] = true;
      regUsed.set(reg, true);
      backtrack(row + 1);
      colUsed[c] = false;
      regUsed.delete(reg);
      placed[row] = -1;
    }
  }
  backtrack(0);
  return count;
}

// --- independent validation of a candidate placement ---
function validateGrid(n, regions, cols) {
  const rowsUsed = new Set(), colsUsed = new Set(), regsUsed = new Set();
  for (let r = 0; r < n; r++) {
    const c = cols[r];
    if (c < 0 || c >= n) return 'col out of bounds';
    if (rowsUsed.has(r)) return 'two crowns in row ' + r;
    rowsUsed.add(r);
    if (colsUsed.has(c)) return 'two crowns in col ' + c;
    colsUsed.add(c);
    const reg = regions[r][c];
    if (regsUsed.has(reg)) return 'two crowns in region ' + reg;
    regsUsed.add(reg);
    for (let r2 = 0; r2 < n; r2++) {
      if (r2 === r) continue;
      if (Math.abs(r2 - r) <= 1 && Math.abs(cols[r2] - c) <= 1) {
        return 'crowns (' + r + ',' + c + ') and (' + r2 + ',' + cols[r2] + ') adjacent';
      }
    }
  }
  return null;
}

let pass = 0, multi = [], zero = [], badStored = [], regionAnomaly = [], solverMismatch = [];
let calibrated = false;

for (const p of PUZZLE_DATA) {
  const n = p.n, regions = p.regions;

  // region count sanity: n crowns, one per region => regions should be exactly n
  const distinctRegions = new Set();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) distinctRegions.add(regions[r][c]);
  if (distinctRegions.size !== n) {
    regionAnomaly.push({ id: p.id, n, regions: distinctRegions.size });
  }

  // stored solution must be rule-valid (independent validation)
  const err = validateGrid(n, regions, p.solution);
  if (err) badStored.push({ id: p.id, reason: err });

  // OUR counter
  const ours = countOurSolutions(n, regions, 2);
  // PAGE counter (the control)
  const theirs = pageCountSolutions(n, regions, 2);
  if (ours !== theirs) solverMismatch.push({ id: p.id, ours, theirs });

  if (ours === 0) zero.push(p.id);
  else if (ours > 1) multi.push(p.id);
  else pass++;
}

// --- SENSITIVITY / negative controls -------------------------------------
// (a) The counter MUST find multiple solutions when the constraint is
//     relaxed. Drop the adjacency rule on level 1's regions and confirm the
//     count rises above 1. A counter that always returns 1 is a no-op gate.
// (b) The counter MUST return 0 for an impossible level (e.g. a region grid
//     where two rows are forced into the same single region).
function countNoAdjacency(n, regions, limit) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  let count = 0;
  (function backtrack(row) {
    if (count >= limit) return;
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      backtrack(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}
const relaxL1 = countNoAdjacency(PUZZLE_DATA[0].n, PUZZLE_DATA[0].regions, 2);
const impossible = countOurSolutions(3, [[0,0,0],[0,0,0],[0,0,0]], 2); // 3 rows, 1 region
const sensOK = relaxL1 > 1;
const impOK = impossible === 0;
calibrated = sensOK && impOK && solverMismatch.length === 0;

console.log('QUEENS independent uniqueness audit — ' + PUZZLE_DATA.length + ' levels');
console.log('  unique (count==1)        : ' + pass + '/' + PUZZLE_DATA.length);
console.log('  MULTI-solution levels    : ' + (multi.length ? multi.join(',') : 'none'));
console.log('  UNSOLVABLE levels        : ' + (zero.length ? zero.join(',') : 'none'));
console.log('  bad stored solutions     : ' + (badStored.length ? JSON.stringify(badStored) : 'none'));
console.log('  region-count anomalies   : ' + (regionAnomaly.length ? JSON.stringify(regionAnomaly) : 'none'));
console.log('  solver mismatch vs page  : ' + (solverMismatch.length ? JSON.stringify(solverMismatch) : 'none'));
console.log('  CONTROL relax-adjacency  : ' + relaxL1 + ' (must be >1) ' + (sensOK ? 'PASS' : 'FAIL'));
console.log('  CONTROL impossible level : ' + impossible + ' (must be 0) ' + (impOK ? 'PASS' : 'FAIL'));

const verdict = (pass === PUZZLE_DATA.length && badStored.length === 0 &&
  multi.length === 0 && zero.length === 0 && regionAnomaly.length === 0 && calibrated)
  ? 'PASS' : 'FAIL';
console.log('verdict=' + verdict);
console.log(JSON.stringify({
  total: PUZZLE_DATA.length, unique: pass, multi, zero, badStored,
  regionAnomaly, solverMismatch, controls: { relaxL1, impossible, sensOK, impOK },
  calibrated, verdict
}));
process.exit(verdict === 'PASS' ? 0 : 1);
