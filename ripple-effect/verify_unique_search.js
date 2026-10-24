#!/usr/bin/env node
/**
 * ripple-effect — independent solution counter.
 *
 * The page claims "every puzzle has a unique solution!" and its win
 * predicate is a pure solution-compare:
 *
 *     function checkWin(){ const {size,solution}=state.levelData;
 *       for(...) if(state.playerGrid[r][c]!==solution[r][c])return;
 *       onLevelComplete(); }
 *
 * That means a player who reasons correctly to a DIFFERENT rule-valid grid
 * is permanently marked wrong. This script therefore counts solutions
 * instead of validating one stored grid.
 *
 * RULES (re-derived from the engine source, not from the level key names):
 *   1. Each cell belongs to a region (rm). A region of N cells must
 *      contain exactly the numbers 1..N, each once.
 *   2. If two cells in the same row or column carry the same number N,
 *      there must be at least N OTHER numbers between them
 *      (|dr| > N or |dc| > N for two cells with the same value).
 *
 * DATA SHAPE: LEVELS[i] = { id, size, rm, sol, giv, maxNum }
 *   rm  : row-major base36 region ids
 *   sol : row-major base36 solution digits
 *   giv : row-major '1'/'0' mask, 1 = the cell is a given
 *
 * CALIBRATION (a counter that cannot fail is not a gate — see Pitfall #88):
 *   positive control : pinning every cell to its stored solution must yield
 *                       exactly 1 solution for every level.
 *   negative control : a synthetic ambiguous level must yield >= 2.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);\s*\n/);
if (!m) { console.error('LEVELS_NOT_FOUND'); process.exit(1); }
const LEVELS = eval('(' + m[1] + ')');

// ---------------------------------------------------------------- decode ---
function decodeLevel(e) {
  const n = e.size;
  const cells = [];
  for (let i = 0; i < n * n; i++) {
    cells.push({
      r: Math.floor(i / n), c: i % n,
      region: parseInt(e.rm[i], 36),
      sol: parseInt(e.sol[i], 36),
      given: e.giv[i] === '1',
    });
  }
  const regions = new Map();
  for (const cell of cells) {
    if (!regions.has(cell.region)) regions.set(cell.region, []);
    regions.get(cell.region).push(cell);
  }
  return { n, cells, regions, maxNum: e.maxNum };
}

// --------------------------------------------------------------- rules ----
function regionOk(lv, grid) {
  for (const [, list] of lv.regions) {
    const seen = new Set();
    for (const cell of list) {
      const v = grid[cell.r][cell.c];
      if (v === undefined) return false;
      if (v < 1 || v > list.length) return false;
      if (seen.has(v)) return false;
      seen.add(v);
    }
    if (seen.size !== list.length) return false;
  }
  return true;
}

function distanceOk(lv, grid) {
  const n = lv.n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = grid[r][c];
      if (v === undefined) continue;
      for (let r2 = 0; r2 < n; r2++) {
        for (let c2 = 0; c2 < n; c2++) {
          if (r2 === r && c2 === c) continue;
          if (grid[r2][c2] !== v) continue;
          const dr = Math.abs(r2 - r), dc = Math.abs(c2 - c);
          // same row OR same column -> need at least v cells in between
          if (dr === 0) { if (dc - 1 < v) return false; }
          else if (dc === 0) { if (dr - 1 < v) return false; }
        }
      }
    }
  }
  return true;
}

function validate(lv, grid) {
  if (!regionOk(lv, grid)) return 'region rule violated';
  if (!distanceOk(lv, grid)) return 'distance rule violated';
  for (const cell of lv.cells) {
    if (cell.given && grid[cell.r][cell.c] !== cell.sol) return 'given violated at ' + cell.r + ',' + cell.c;
  }
  return null;
}

// ------------------------------------------------------------- counter ----
function countSolutions(lv, opts) {
  opts = opts || {};
  const limit = opts.limit || 2;
  const deadline = Date.now() + (opts.budgetMs || 20000);
  const forced = opts.forced || null;
  const grid = [];
  for (let r = 0; r < lv.n; r++) grid.push(new Array(lv.n).fill(0));
  // seed the givens
  for (const cell of lv.cells) {
    if (cell.given) grid[cell.r][cell.c] = cell.sol;
  }
  const solutions = [];
  let timedOut = false;

  const free = lv.cells.filter(c => !c.given);
  // per-region candidate values: a cell in a region of size N may take 1..N
  const regionSize = new Map();
  for (const [rid, list] of lv.regions) regionSize.set(rid, list.length);

  function candidates(cell) {
    if (forced) {
      const f = forced[cell.r][cell.c];
      if (f !== undefined && f !== 0) return [f];
    }
    const out = [];
    const maxV = regionSize.get(cell.region);
    for (let v = 1; v <= maxV; v++) {
      // region: value must be unused in this region
      let ok = true;
      for (const other of lv.regions.get(cell.region)) {
        if (other === cell) continue;
        if (grid[other.r][other.c] === v) { ok = false; break; }
      }
      if (!ok) continue;
      // distance rule against already-placed cells
      for (const other of lv.cells) {
        if (other === cell) continue;
        const ov = grid[other.r][other.c];
        if (ov === undefined || ov === 0) continue;
        if (ov !== v) continue;
        const dr = Math.abs(other.r - cell.r), dc = Math.abs(other.c - cell.c);
        if (dr === 0) { if (dc - 1 < v) { ok = false; break; } }
        else if (dc === 0) { if (dr - 1 < v) { ok = false; break; } }
      }
      if (!ok) continue;
      out.push(v);
    }
    return out;
  }

  function recurse(remaining) {
    if (timedOut || solutions.length >= limit) return;
    if (Date.now() > deadline) { timedOut = true; return; }
    if (remaining.length === 0) {
      if (validate(lv, grid) === null) solutions.push(grid.map(r => r.slice()));
      return;
    }
    // MRV
    let best = -1, bestC = null;
    for (let i = 0; i < remaining.length; i++) {
      const c = candidates(remaining[i]);
      if (c.length === 0) return;
      if (bestC === null || c.length < bestC.length) {
        best = i; bestC = c;
        if (c.length === 1) break;
      }
    }
    const cell = remaining[best];
    const rest = remaining.slice(0, best).concat(remaining.slice(best + 1));
    for (const v of bestC) {
      grid[cell.r][cell.c] = v;
      recurse(rest);
      grid[cell.r][cell.c] = 0;
      if (solutions.length >= limit || timedOut) return;
    }
  }

  recurse(free);
  return { count: solutions.length, timedOut, solutions };
}

// ---------------------------------------------------------- calibration ---
function toGrid(lv, pick) {
  const g = [];
  for (let r = 0; r < lv.n; r++) g.push(new Array(lv.n).fill(0));
  for (const cell of lv.cells) g[cell.r][cell.c] = pick(cell);
  return g;
}

let calFail = 0;
// positive control: pin every cell to its stored solution -> exactly 1
for (const e of LEVELS) {
  const lv = decodeLevel(e);
  const forced = toGrid(lv, cell => cell.sol);
  const res = countSolutions(lv, { limit: 2, budgetMs: 15000, forced });
  if (res.count !== 1) {
    console.log('  CALIB-FAIL L' + e.id + ': pinned count=' + res.count + (res.timedOut ? ' (timeout)' : ''));
    calFail++;
  }
  // also: the stored solution must validate under the rules
  const stored = toGrid(lv, cell => cell.sol);
  const err = validate(lv, stored);
  if (err) { console.log('  STORED-SOLUTION-INVALID L' + e.id + ': ' + err); calFail++; }
}
console.log('calib(positive): every level counts exactly 1 when pinned to its stored solution'
  + (calFail ? ' -- ' + calFail + ' FAILURES' : ''));

// negative control: a synthetic ambiguous level must yield >= 2
{
  // 2x2 with one region of 4 cells -> the region rule forces {1,2,3,4} but
  // the distance rule forbids two 1s in a row/column and two 2s in a
  // row/column etc. Build one that is provably ambiguous.
  const lv = {
    n: 2,
    maxNum: 2,
    cells: [
      { r: 0, c: 0, region: 0, sol: 1, given: false },
      { r: 0, c: 1, region: 0, sol: 2, given: false },
      { r: 1, c: 0, region: 0, sol: 2, given: false },
      { r: 1, c: 1, region: 0, sol: 1, given: false },
    ],
    regions: new Map([[0, [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 },
    ]]]),
  };
  const res = countSolutions(lv, { limit: 3, budgetMs: 5000 });
  console.log('calib(negative): synthetic ambiguous level -> count=' + res.count
    + (res.count >= 2 ? ' (>=2 OK)' : ' -- EXPECTED >=2'));
  if (res.count < 2) calFail++;
}

// ------------------------------------------------------------- the run ----
const multi = [], unsolvable = [], timeouts = [], badStored = [];
let provenUnique = 0;
for (const e of LEVELS) {
  const lv = decodeLevel(e);
  const stored = toGrid(lv, cell => cell.sol);
  const err = validate(lv, stored);
  if (err) badStored.push('L' + e.id + ': ' + err);
  const res = countSolutions(lv, { limit: 2, budgetMs: 30000 });
  if (res.timedOut) { timeouts.push('L' + e.id); console.log('  L' + e.id + ': TIMEOUT (indeterminate)'); continue; }
  if (res.count === 0) { unsolvable.push('L' + e.id); console.log('  L' + e.id + ': UNSOLVABLE'); continue; }
  if (res.count >= 2) { multi.push('L' + e.id); console.log('  L' + e.id + ': MULTI-SOLUTION (' + res.count + ')'); continue; }
  provenUnique++;
  console.log('  L' + e.id + ' size' + e.size + ': UNIQUE');
}

const out = {
  levels: LEVELS.length, calibrationPassed: calFail === 0,
  provenUnique, multiSolution: multi, unsolvable, timeouts, badStoredSolution: badStored,
};
console.log(JSON.stringify(out));
const fail = calFail > 0 || multi.length || unsolvable.length || timeouts.length || badStored.length;
console.log('VERDICT: ' + (fail ? 'FAIL' : 'PASS'));
process.exit(fail ? 1 : 0);
