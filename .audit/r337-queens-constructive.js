#!/usr/bin/env node
/* R337 queens — CONSTRUCTIVE unique-level generator (v3, dynamic order).
 *
 * MONOTONICITY (why this converges):
 *   A cell with no region cannot hold a crown. Assigning a cell to a region
 *   only ADDS a possible crown position, so a partial map's solution set is a
 *   SUBSET of any completion's.
 *   The queen-only start map has exactly ONE solution (every region is a
 *   single cell, so each region's crown is forced).
 *   => if the final map is unique, every prefix is unique too, and the count
 *      can never exceed 1 during the build. We therefore simply refuse any
 *      assignment that would make the count 2 — no backtracking on that
 *      condition is ever needed.
 *
 * CONNECTIVITY: a cell may only join a region that already has a 4-adjacent
 *   cell. Every region starts as its single queen cell, so this makes every
 *   region connected BY INDUCTION — no post-hoc repair is needed.
 *
 * CELL ORDER is DYNAMIC: the next cell is chosen among the unassigned cells
 *   that already touch an assigned region. A fixed order can pick a cell
 *   whose neighbours are all unassigned, which has no legal region at all.
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
for (const n of ['makeRNG', 'tryPlaceQueens', 'countSolutions', 'getNeighbors']) src += grabFunction(html, n) + '\n';
const ctx = { Math, console: { log: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__pq=tryPlaceQueens; this.__cs=countSolutions;', ctx);

function countUpTo(n, regions, limit) {
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
function componentsOf(n, regions, rid) {
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === rid) cells.push([r, c]);
  const seen = new Set(); const comps = [];
  for (const cell of cells) {
    const k = cell[0] + ',' + cell[1];
    if (seen.has(k)) continue;
    const st = [cell]; const comp = []; seen.add(k);
    while (st.length) {
      const [r, c] = st.pop(); comp.push([r, c]);
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        if (regions[nr][nc] !== rid) continue;
        const kk = nr + ',' + nc; if (seen.has(kk)) continue; seen.add(kk); st.push([nr, nc]);
      }
    }
    comps.push(comp);
  }
  return comps;
}
function connectedOK(n, regions) {
  for (let R = 0; R < n; R++) if (componentsOf(n, regions, R).length !== 1) return false;
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

function buildUnique(n, sol, rng, nodeCap) {
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let c = 0; c < n; c++) grid[r][c] = -1; }
  for (let r = 0; r < n; r++) grid[r][sol[r]] = r;

  const total = n * n - n;
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
      if (adjacentRegions(r, c).length) out.push([r, c]);
    }
    return out;
  }

  function rec(left) {
    if (++nodes > nodeCap) return false;
    if (left === 0) return true;
    const front = frontierCells();
    if (!front.length) return false;
    // prefer the most constrained cell (fewest adjacent regions)
    front.sort((a, b) => adjacentRegions(a[0], a[1]).length - adjacentRegions(b[0], b[1]).length);
    const pickCount = Math.min(front.length, 8);
    const startIdx = Math.floor(rng() * Math.min(pickCount, 3));
    for (let fi = startIdx; fi < pickCount; fi++) {
      const [r, c] = front[fi];
      const opts = adjacentRegions(r, c);
      for (let k = opts.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        const t = opts[k]; opts[k] = opts[j]; opts[j] = t;
      }
      for (const R of opts) {
        grid[r][c] = R;
        if (countUpTo(n, grid, 2) === 1) {
          if (rec(left - 1)) return true;
        }
        grid[r][c] = -1;
      }
    }
    return false;
  }

  if (!rec(total)) return null;
  if (countUpTo(n, grid, 3) !== 1) return null;
  if (validate(n, grid, sol) !== null) return null;
  if (!connectedOK(n, grid)) return null;
  return grid;
}

module.exports = { countUpTo, validate, connectedOK, buildUnique, mulberry32, ctx, componentsOf };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '7', 10);
  const tries = parseInt(process.argv[3] || '5', 10);
  console.log('R337 queens — constructive v3 (dynamic, connected), n=' + n);
  const t0 = Date.now();
  let ok = 0;
  for (let seed = 1; seed <= tries; seed++) {
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    let grid = null;
    for (let att = 0; att < 6 && !grid; att++) {
      grid = buildUnique(n, sol, mulberry32(seed * 7919 + n * 104729 + att * 977), 300000);
    }
    if (!grid) { console.log('  seed=' + seed + ' NO MAP'); continue; }
    const exact = countUpTo(n, grid, 5);
    const page = ctx.__cs(n, grid, 5);
    const err = validate(n, grid, sol);
    const conn = connectedOK(n, grid);
    ok++;
    console.log('  seed=' + seed + ': exact=' + exact + ' page=' + page + ' err=' + err + ' connected=' + conn +
      '  (' + ((Date.now() - t0) / 1000).toFixed(2) + 's)');
  }
  console.log('n=' + n + ': ' + ok + '/' + tries + ' unique+connected, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
