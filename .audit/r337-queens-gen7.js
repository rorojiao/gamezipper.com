#!/usr/bin/env node
/* R337 queens — FINAL generator v7 (fast, exact, incremental).
 *
 * MONOTONICITY (load-bearing, proven here):
 *   Let old = the map with cell (r,c) UNASSIGNED and new = old with (r,c)
 *   assigned to region R. Any solution X of old is also a solution of new:
 *   X never crowns (r,c) (an unassigned cell cannot hold a crown), so all of
 *   X's rows / columns / regions / adjacency relations are unchanged.
 *   => solutions(old) is a SUBSET of solutions(new).
 *   => the solution count is MONOTONE NON-DECREASING as cells are assigned.
 *   => if the count ever reaches 2, the completed map can never be unique, so
 *      that branch is dead and can be pruned IMMEDIATELY.
 *
 * INCREMENTAL UPDATE (why this is fast):
 *   solutions(new) = { X in solutions(old) : X has no crown at (r,c) }
 *                 U { solutions of new with a crown at (r,c) }.
 *   The second set is enumerated directly by backtracking with row r pinned
 *   to column c and region R marked used. The first set is a list filter.
 *   Because a surviving branch always has exactly ONE solution, the tracked
 *   set never grows, so every step costs O(|set| + one bounded search).
 *
 * CONNECTIVITY: a cell may only join a region that already has a 4-adjacent
 *   cell. Every region starts as its single queen cell, so every region is
 *   connected BY INDUCTION.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');

function grabFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src); if (!m) return null;
  const open = src.indexOf('{', m.index);
  let i = open + 1, depth = 1;
  while (i < src.length && depth > 0) { const c = src[i]; if (c === '{') depth++; else if (c === '}') depth--; i++; }
  return src.slice(m.index, i);
}
let src = '';
for (const n of ['makeRNG', 'tryPlaceQueens', 'countSolutions']) src += (grabFunction(html, n) || '') + '\n';
const ctx = { Math, console: { log: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__pq=tryPlaceQueens; this.__cs=countSolutions;', ctx);

/* EXACT full enumeration — the verdict, never the guide */
function exactCount(n, regions, limit) {
  let count = 0;
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (count >= limit) return;
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (reg < 0) continue;
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}
function validate(n, regions, cols) {
  const rows = new Set(), colsS = new Set(), regs = new Set();
  for (let r = 0; r < n; r++) {
    const c = cols[r];
    if (c < 0 || c >= n) return 'col oob';
    if (rows.has(r)) return 'row dup'; rows.add(r);
    if (colsS.has(c)) return 'col dup'; colsS.add(c);
    const reg = regions[r][c];
    if (regs.has(reg)) return 'region dup'; regs.add(reg);
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.abs(i - j) <= 1 && Math.abs(cols[i] - cols[j]) <= 1) return 'adjacent';
  }
  return null;
}
function connectedOK(n, regions) {
  for (let R = 0; R < n; R++) {
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === R) cells.push([r, c]);
    if (!cells.length) return false;
    const seen = new Set([cells[0][0] + ',' + cells[0][1]]);
    const st = [cells[0]];
    while (st.length) {
      const [r, c] = st.pop();
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        if (regions[nr][nc] !== R) continue;
        const k = nr + ',' + nc; if (seen.has(k)) continue; seen.add(k); st.push([nr, nc]);
      }
    }
    if (seen.size !== cells.length) return false;
  }
  return true;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* solutions of the CURRENT map that place a crown at (r0,c0) using region R0 */
function solutionsWithCrownAt(n, regions, r0, c0, R0, cap) {
  const out = [];
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  colUsed[c0] = true; regUsed.set(R0, true); placed[r0] = c0;
  (function bt(row) {
    if (out.length >= cap) return;
    if (row === n) { out.push(placed.slice()); return; }
    if (row === r0) { bt(row + 1); return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (reg < 0) continue;
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return out;
}

function buildUnique(n, sol, rng, nodeCap, minRegionSize, maxRegionSize) {
  minRegionSize = minRegionSize || 1;
  maxRegionSize = maxRegionSize || Infinity;
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let c = 0; c < n; c++) grid[r][c] = -1; }
  for (let r = 0; r < n; r++) grid[r][sol[r]] = r;

  const size = new Array(n).fill(1);   // current cells per region
  let sols = [sol.slice()];   // solution set of the current partial map
  let nodes = 0;

  function adjacentRegions(r, c) {
    const opts = [];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const R = grid[nr][nc];
      if (R >= 0 && opts.indexOf(R) < 0) opts.push(R);
    }
    return opts;
  }
  function frontierCells() {
    const out = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (grid[r][c] >= 0) continue;
      const o = adjacentRegions(r, c);
      if (o.length) out.push([r, c, o]);
    }
    return out;
  }

  function rec(left) {
    if (++nodes > nodeCap) return false;
    if (left === 0) {
      if (exactCount(n, grid, 3) !== 1) return false;
      if (validate(n, grid, sol) !== null) return false;
      if (!connectedOK(n, grid)) return false;
      // every region must be at least minRegionSize cells
      for (let R = 0; R < n; R++) {
        let k = 0;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] === R) k++;
        if (k < minRegionSize) return false;
        // no region may swallow the board — a 40-cell region next to 3-cell
        // ones makes the puzzle degenerate even though it is "unique"
        if (k > maxRegionSize) return false;
      }
      return true;
    }
    const front = frontierCells();
    if (!front.length) return false;
    // Primary: most-constrained first (fewest adjacent regions) — this is what
    // makes the search converge fast.
    // Secondary: prefer cells touching a region that is still UNDER-SIZED, so
    // no region ends up as a 1-cell stub.
    front.sort((a, b) => a[2].length - b[2].length);
    const pick = Math.min(front.length, 5);
    const start = Math.floor(rng() * Math.min(pick, 2));
    for (let i = start; i < pick; i++) {
      const [r, c] = front[i];
      const opts = adjacentRegions(r, c);
      // grow the smallest adjacent region first
      opts.sort((x, y) => size[x] - size[y]);
      for (let k = opts.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        const t = opts[k]; opts[k] = opts[j]; opts[j] = t;
      }
      for (const R of opts) {
        const survivors = sols.filter(s => s[r] !== c);
        const newcomers = solutionsWithCrownAt(n, grid, r, c, R, 3);
        const merged = survivors.concat(newcomers);
        if (merged.length > 1) continue;         // monotone -> dead branch
        grid[r][c] = R;
        size[R]++;
        const saved = sols;
        sols = merged;
        if (rec(left - 1)) return true;
        grid[r][c] = -1;
        size[R]--;
        sols = saved;
      }
    }
    return false;
  }

  const total = n * n - n;
  if (!rec(total)) return null;
  return grid;
}

module.exports = { exactCount, validate, connectedOK, buildUnique, mulberry32, ctx };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '7', 10);
  const tries = parseInt(process.argv[3] || '3', 10);
  console.log('R337 queens — v7 fast incremental generator, n=' + n);
  const t0 = Date.now();
  let ok = 0;
  for (let seed = 1; seed <= tries; seed++) {
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    let grid = null;
    for (let att = 0; att < 10 && !grid; att++) {
      grid = buildUnique(n, sol, mulberry32(seed * 7919 + n * 104729 + att * 977), 200000);
    }
    if (!grid) { console.log('  seed=' + seed + ' NO MAP'); continue; }
    const exact = exactCount(n, grid, 5);
    const page = ctx.__cs(n, grid, 5);
    const err = validate(n, grid, sol);
    const conn = connectedOK(n, grid);
    ok++;
    console.log('  seed=' + seed + ': exact=' + exact + ' page=' + page + ' err=' + err + ' connected=' + conn +
      '  (' + ((Date.now() - t0) / 1000).toFixed(2) + 's)');
  }
  console.log('n=' + n + ': ' + ok + '/' + tries + ' unique+connected, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
