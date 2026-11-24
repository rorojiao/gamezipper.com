#!/usr/bin/env node
/* sandwich-sudoku uniqueness gate (R432).
 * The page promises "Each puzzle has a unique solution verified by an independent
 * solver" and its win check is a pure solution-compare (board !== solution),
 * but the only shipped verifier (verify_engine.js) re-validates the stored
 * solution without COUNTING solutions. This gate closes that gap:
 * an independent sandwich-aware solver counts solutions per level (limit 2).
 *
 * RULES (re-derived from index.html engine, not from key names):
 *   1. Standard Sudoku on n x n with box_r x box_c boxes.
 *   2. For each row/column, the outside clue = sum of digits strictly between
 *      the digit 1 and the digit n in that line (0 if no such pair encloses
 *      anything). The engine's own sandwichSum (loadLevel/checkWin path):
 *        scan line; first 1-or-n starts the window; window ends at the OTHER
 *        crust (1 or n); digits inside are summed.
 *
 * Calibration (a counter that cannot fail is not a gate):
 *   positive control: the stored solution must pass rule validation for every level.
 *   negative control: a synthetic line violating a clue must be rejected.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/var LEVELS = (\[[\s\S]*?\]);/);
if (!m) { console.error('FAIL: could not extract LEVELS'); process.exit(1); }
let LEVELS;
try { LEVELS = JSON.parse(m[1]); } catch (e) { console.error('FAIL: LEVELS not JSON:', e.message); process.exit(1); }
console.log('Extracted levels:', LEVELS.length);

function sandwichSum(line) {
  // mirrors the engine: crusts are 1 and n; sum strictly between first crust pair
  let s = 0, started = false;
  for (let k = 0; k < line.length; k++) {
    const v = line[k];
    if (v === 1 || v === line.length) {
      if (started) break;
      started = true;
    } else if (started) s += v;
  }
  return s;
}

function cluesValid(line, clue) {
  return sandwichSum(line) === clue;
}

function validateSolution(L) {
  const n = L.n, br = L.box_r, bc = L.box_c, S = L.solution;
  for (let r = 0; r < n; r++) {
    const seen = new Set();
    for (let c = 0; c < n; c++) { const v = S[r][c]; if (v < 1 || v > n || seen.has(v)) return 'row' + r; seen.add(v); }
    if (!cluesValid(S[r], L.row_clues[r])) return 'rowClue' + r;
  }
  for (let c = 0; c < n; c++) {
    const col = [], seen = new Set();
    for (let r = 0; r < n; r++) { const v = S[r][c]; if (seen.has(v)) return 'col' + c; seen.add(v); col.push(v); }
    if (!cluesValid(col, L.col_clues[c])) return 'colClue' + c;
  }
  for (let brI = 0; brI < n / br; brI++) for (let bcI = 0; bcI < n / bc; bcI++) {
    const seen = new Set();
    for (let r = brI * br; r < brI * br + br; r++) for (let c = bcI * bc; c < bcI * bc + bc; c++) {
      const v = S[r][c]; if (seen.has(v)) return 'box' + brI + ',' + bcI; seen.add(v);
    }
  }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (L.puzzle[r][c] && L.puzzle[r][c] !== S[r][c]) return 'given' + r + ',' + c;
  return null;
}

/* Independent solver: MRV backtracking with row/col/box candidate masks and
 * incremental sandwich-clue pruning (a clue is refutable once both crusts and
 * all between-cells are filled; also pruned when the remaining unfilled window
 * cannot reach the clue). */
function countSolutions(L, limit = 2, cap = 4000000) {
  const n = L.n, br = L.box_r, bc = L.box_c;
  const nbr = n / br, nbc = n / bc;
  const grid = L.puzzle.map(r => r.slice());
  const rowc = Array.from({ length: n }, () => new Set(Array.from({ length: n }, (_, i) => i + 1)));
  const colc = Array.from({ length: n }, () => new Set(Array.from({ length: n }, (_, i) => i + 1)));
  const boxc = Array.from({ length: nbr * nbc }, () => new Set(Array.from({ length: n }, (_, i) => i + 1)));
  const bid = (r, c) => Math.floor(r / br) * nbc + Math.floor(c / bc);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const v = grid[r][c]; if (v) { rowc[r].delete(v); colc[c].delete(v); boxc[bid(r, c)].delete(v); } }

  function cluePrunable(line, clue) {
    // locate crusts among filled cells; if window fully determined, check equality;
    // else bound: min possible (0 if window can still be empty) vs max possible.
    let firstCrust = -1, secondCrust = -1;
    for (let k = 0; k < n; k++) {
      const v = line[k];
      if (v === 1 || v === n) { if (firstCrust < 0) firstCrust = k; else { secondCrust = k; break; } }
    }
    if (firstCrust >= 0 && secondCrust >= 0) {
      let sum = 0, undetermined = false;
      for (let k = firstCrust + 1; k < secondCrust; k++) {
        if (line[k]) sum += line[k];
        else { undetermined = true; }
      }
      if (!undetermined) return sum !== clue;
      // max additional: unfilled window cells can each be at most n-1 (crusts are 1,n)
      let maxAdd = 0;
      for (let k = firstCrust + 1; k < secondCrust; k++) if (!line[k]) maxAdd += n - 1;
      if (sum + maxAdd < clue) return true;
      if (sum > clue) return true;
    }
    return false;
  }

  function linePrune() {
    for (let r = 0; r < n; r++) if (cluePrunable(grid[r], L.row_clues[r])) return true;
    for (let c = 0; c < n; c++) {
      const col = []; for (let r = 0; r < n; r++) col.push(grid[r][c]);
      if (cluePrunable(col, L.col_clues[c])) return true;
    }
    return false;
  }

  let sols = 0, nodes = 0, capped = false;
  function solve() {
    if (capped || sols >= limit) return;
    nodes++; if (nodes > cap) { capped = true; return; }
    let best = null, bestLen = 99, bestCand = null;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (grid[r][c]) continue;
      const cand = [];
      rowc[r].forEach(v => { if (colc[c].has(v) && boxc[bid(r, c)].has(v)) cand.push(v); });
      if (cand.length < bestLen) { bestLen = cand.length; best = [r, c]; bestCand = cand; if (bestLen <= 1) break; }
    }
    if (!best) { if (!linePrune()) sols++; return; }
    if (bestLen === 0) return;
    if (linePrune()) return;
    const [r, c] = best; const b = bid(r, c);
    for (const v of bestCand) {
      grid[r][c] = v; rowc[r].delete(v); colc[c].delete(v); boxc[b].delete(v);
      solve();
      grid[r][c] = 0; rowc[r].add(v); colc[c].add(v); boxc[b].add(v);
      if (sols >= limit || capped) return;
    }
  }
  solve();
  return capped ? -1 : sols;
}

/* negative control: a line whose window sum != clue must be rejected */
{
  const bad = [3, 1, 4, 2]; // n=4, crusts 1@1 and 4@2 -> window empty -> clue 0
  if (sandwichSum(bad) !== 0) { console.error('CALIBRATION FAIL: sandwichSum(bad) != 0'); process.exit(1); }
  const good = [2, 1, 3, 4]; // window [3] -> 3
  if (sandwichSum(good) !== 3) { console.error('CALIBRATION FAIL: sandwichSum(good) != 3'); process.exit(1); }
}

let fails = 0;
for (const L of LEVELS) {
  const why = validateSolution(L);
  if (why) { console.error(`L${L.id} INVALID SOLUTION (${why})`); fails++; continue; }
  const cnt = countSolutions(L, 2);
  if (cnt === -1) { console.error(`L${L.id} TIMEOUT (cap reached, count>=? unresolved)`); fails++; continue; }
  if (cnt !== 1) { console.error(`L${L.id} NOT_UNIQUE count=${cnt}`); fails++; continue; }
  console.log(`L${L.id} ${L.tier} n=${L.n} — unique, solution valid`);
}
console.log(`\nsandwich-sudoku uniqueness gate: ${LEVELS.length - fails}/${LEVELS.length} levels unique+valid`);
if (fails) { console.error(`FAIL: ${fails} problem levels`); process.exit(1); }
console.log('✅ ALL LEVELS VERIFIED UNIQUE AND VALID');
