#!/usr/bin/env node
/**
 * ripple-effect — repair the multi-solution levels.
 *
 * PROBLEM
 *   The page's win predicate is a pure solution-compare:
 *       function checkWin(){ const {size,solution}=state.levelData;
 *         for(...) if(state.playerGrid[r][c]!==solution[r][c])return;
 *         onLevelComplete(); }
 *   and 15 of the 30 campaign levels admit a SECOND rule-valid grid. A
 *   player who reasons correctly to the rival grid is permanently marked
 *   wrong and can never finish the level.
 *
 * FIX (the R318 / R324 method)
 *   For each multi-solution level, collect the cells on which any rival
 *   solution disagrees with the stored one, then add givens DRAWN ONLY FROM
 *   that disagreement set, choosing the cell that minimises the remaining
 *   solution count at each step. Adding a given at a disagreement cell
 *   kills every rival that differs there, so the count collapses.
 *
 *   A greedy that merely accepts "a cell which alone finishes the job" gets
 *   stuck on levels where no single addition is enough, so the greedy here
 *   minimises the count at every step and keeps going until the count is 1.
 *
 *   IMPORTANT: the given's VALUE is always the stored solution's value, so
 *   the level's intended solution is preserved and the difficulty of the
 *   unaffected cells is untouched.
 *
 * OUTPUT
 *   A JSON file with, per level id, the new `giv` mask (and the added cells).
 *   The masks are applied to index.html by the caller and then re-verified.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const LEVELS = eval('(' + html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);\s*\n/)[1] + ')');

function decode(e) {
  const n = e.size;
  const cells = [];
  for (let i = 0; i < n * n; i++) {
    cells.push({ r: (i / n) | 0, c: i % n, region: parseInt(e.rm[i], 36),
                 sol: parseInt(e.sol[i], 36), given: e.giv[i] === '1' });
  }
  const regions = new Map();
  for (const cell of cells) {
    if (!regions.has(cell.region)) regions.set(cell.region, []);
    regions.get(cell.region).push(cell);
  }
  return { n, cells, regions, maxNum: e.maxNum, id: e.id };
}

function validate(lv, g) {
  for (const [, list] of lv.regions) {
    const seen = new Set();
    for (const cell of list) {
      const v = g[cell.r][cell.c];
      if (v === undefined || v < 1 || v > list.length) return false;
      if (seen.has(v)) return false;
      seen.add(v);
    }
    if (seen.size !== list.length) return false;
  }
  for (let r = 0; r < lv.n; r++) for (let c = 0; c < lv.n; c++) {
    const v = g[r][c];
    if (v === undefined) continue;
    for (let r2 = 0; r2 < lv.n; r2++) for (let c2 = 0; c2 < lv.n; c2++) {
      if (r2 === r && c2 === c) continue;
      if (g[r2][c2] !== v) continue;
      const dr = Math.abs(r2 - r), dc = Math.abs(c2 - c);
      if (dr === 0) { if (dc - 1 < v) return false; }
      else if (dc === 0) { if (dr - 1 < v) return false; }
    }
  }
  for (const cell of lv.cells) if (cell.given && g[cell.r][cell.c] !== cell.sol) return false;
  return true;
}

function count(lv, budgetMs) {
  const deadline = Date.now() + (budgetMs || 30000);
  const grid = [];
  for (let r = 0; r < lv.n; r++) grid.push(new Array(lv.n).fill(0));
  for (const cell of lv.cells) if (cell.given) grid[cell.r][cell.c] = cell.sol;
  const solutions = [];
  let timedOut = false;
  const free = lv.cells.filter(c => !c.given);
  const rsize = new Map();
  for (const [rid, list] of lv.regions) rsize.set(rid, list.length);

  function candidates(cell) {
    const out = [];
    const maxV = rsize.get(cell.region);
    for (let v = 1; v <= maxV; v++) {
      let ok = true;
      for (const o of lv.regions.get(cell.region)) {
        if (o === cell) continue;
        if (grid[o.r][o.c] === v) { ok = false; break; }
      }
      if (!ok) continue;
      for (const o of lv.cells) {
        if (o === cell) continue;
        const ov = grid[o.r][o.c];
        if (!ov) continue;
        if (ov !== v) continue;
        const dr = Math.abs(o.r - cell.r), dc = Math.abs(o.c - cell.c);
        if (dr === 0) { if (dc - 1 < v) { ok = false; break; } }
        else if (dc === 0) { if (dr - 1 < v) { ok = false; break; } }
      }
      if (ok) out.push(v);
    }
    return out;
  }

  function recurse(remaining) {
    if (timedOut || solutions.length >= 2) return;
    if (Date.now() > deadline) { timedOut = true; return; }
    if (!remaining.length) { if (validate(lv, grid)) solutions.push(grid.map(r => r.slice())); return; }
    let best = -1, bestC = null;
    for (let i = 0; i < remaining.length; i++) {
      const c = candidates(remaining[i]);
      if (!c.length) return;
      if (!bestC || c.length < bestC.length) { best = i; bestC = c; if (c.length === 1) break; }
    }
    const cell = remaining[best];
    const rest = remaining.slice(0, best).concat(remaining.slice(best + 1));
    for (const v of bestC) {
      grid[cell.r][cell.c] = v;
      recurse(rest);
      grid[cell.r][cell.c] = 0;
      if (solutions.length >= 2 || timedOut) return;
    }
  }
  recurse(free);
  return { count: solutions.length, timedOut, solutions };
}

function withGiven(lv, r, c, value) {
  const copy = { n: lv.n, regions: lv.regions, maxNum: lv.maxNum, id: lv.id,
                 cells: lv.cells.map(x => Object.assign({}, x)) };
  const cell = copy.cells[r * copy.n + c];
  cell.given = true;
  cell.sol = value;
  return copy;
}

const out = {};
let repaired = 0;
for (const e of LEVELS) {
  const lv = decode(e);
  const res = count(lv, 30000);
  if (res.timedOut) { console.log('L' + e.id + ': TIMEOUT (skipped)'); continue; }
  if (res.count < 2) { console.log('L' + e.id + ': already unique'); continue; }

  // collect the disagreement cells between the stored solution and any rival
  const stored = [];
  for (let r = 0; r < lv.n; r++) stored.push(lv.cells.slice(r * lv.n, (r + 1) * lv.n).map(c => c.sol));

  // GREEDY: at each step add the cell that minimises the remaining count.
  // The candidate set is RECOMPUTED every round from the CURRENT rivals —
  // a rival that only appears after the previous given was added can
  // disagree on cells the original set did not cover, and a frozen
  // candidate list is exactly what makes this greedy stall (R318's L20).
  let cur = lv;
  const added = [];
  for (let step = 0; step < 16; step++) {
    const st = count(cur, 30000);
    if (st.timedOut) { console.log('L' + e.id + ': TIMEOUT during greedy — not applied'); break; }
    if (st.count < 2) break;

    // disagreement cells of the CURRENT rivals
    const diffCells = [];
    for (const sol of st.solutions) {
      for (let r = 0; r < lv.n; r++) for (let c = 0; c < lv.n; c++) {
        if (sol[r][c] !== stored[r][c]) diffCells.push([r, c]);
      }
    }
    const uniq = [];
    const seenK = new Set();
    for (const [r, c] of diffCells) {
      const k = r + ',' + c;
      if (seenK.has(k)) continue;
      seenK.add(k);
      if (cur.cells[r * cur.n + c].given) continue;   // already a given
      uniq.push([r, c]);
    }
    if (!uniq.length) { console.log('L' + e.id + ': no free disagreement cell — not applied'); break; }

    let bestCell = null, bestCount = Infinity;
    for (const [r, c] of uniq) {
      const trial = withGiven(cur, r, c, stored[r][c]);
      const tr = count(trial, 30000);
      if (tr.timedOut) continue;
      if (tr.count < bestCount) { bestCount = tr.count; bestCell = [r, c]; }
      if (tr.count === 1) break;   // cannot do better
    }
    if (!bestCell) { console.log('L' + e.id + ': no candidate reduced the count — not applied'); break; }
    if (bestCount === 0) { console.log('L' + e.id + ': adding ' + bestCell + ' would make it UNSOLVABLE — skipping'); break; }
    cur = withGiven(cur, bestCell[0], bestCell[1], stored[bestCell[0]][bestCell[1]]);
    added.push(bestCell);
    if (bestCount === 1) break;
  }

  const final = count(cur, 30000);
  if (final.count !== 1) {
    console.log('L' + e.id + ': repair INCOMPLETE (count=' + final.count + ') — not applied');
    continue;
  }
  // emit the new giv mask
  const mask = [];
  for (let i = 0; i < lv.n * lv.n; i++) mask.push(cur.cells[i].given ? '1' : '0');
  out[e.id] = { giv: mask.join(''), added: added.map(([r, c]) => r + ',' + c),
                 givensBefore: lv.cells.filter(c => c.given).length,
                 givensAfter: cur.cells.filter(c => c.given).length };
  repaired++;
  console.log('L' + e.id + ': repaired — added ' + added.length + ' given(s) at '
    + added.map(a => '(' + a[0] + ',' + a[1] + ')').join(' ')
    + '  givens ' + out[e.id].givensBefore + ' -> ' + out[e.id].givensAfter
    + '  -> count=1');
}

fs.writeFileSync(path.join(HERE, 'r334_repair_giv.json'), JSON.stringify(out, null, 1));
console.log('---');
console.log('levels repaired: ' + repaired + '/' + LEVELS.length);
console.log('mask written to ' + path.join(HERE, 'r334_repair_giv.json'));
