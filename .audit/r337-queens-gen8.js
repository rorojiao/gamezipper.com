#!/usr/bin/env node
/* R337 queens — generator v8: v7 + INCREMENTAL region-size pruning.
 *
 * WHY v7 WAS TOO SLOW (measured: n=10 seed=1 took 57s and FAILED, n=11 never
 * finished): v7 checked the min/max region-size bounds ONLY at the very end
 * (when every cell had been assigned). The search therefore explored the
 * entire space of cell->region assignments before discovering that a region
 * had grown too big or too small.
 *
 * v8 prunes as it goes:
 *   (a) MAX — assigning (r,c) to region R is rejected immediately when
 *       size[R]+1 > maxRegionSize.
 *   (b) MIN — a state is rejected when the number of still-unassigned cells
 *       is smaller than the sum of the deficits (minRegionSize - size[R])
 *       over all regions: those cells can no longer be enough to lift every
 *       region to its minimum size.
 *
 * Both prunes are SOUND (they only remove branches that provably cannot
 * satisfy the size constraints) and they do not touch the uniqueness logic,
 * which is unchanged from v7: the solution set is tracked incrementally and
 * a branch is dropped as soon as the set has more than one element (the
 * monotonicity argument in v7's header).
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
      if (row > 0 && Math.abs(placed[row - 1] - c) <= 1) continue;
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
      if (row > 0 && Math.abs(placed[row - 1] - c) <= 1) continue;
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

  const size = new Array(n).fill(1);
  let sols = [sol.slice()];
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
  /* MIN feasibility: can the remaining `left` cells still lift every region
   * to minRegionSize? */
  function minFeasible(left) {
    let deficit = 0;
    for (let R = 0; R < n; R++) {
      const d = minRegionSize - size[R];
      if (d > 0) deficit += d;
    }
    return deficit <= left;
  }

  function rec(left) {
    if (++nodes > nodeCap) return false;
    if (left === 0) {
      if (exactCount(n, grid, 3) !== 1) return false;
      if (validate(n, grid, sol) !== null) return false;
      if (!connectedOK(n, grid)) return false;
      for (let R = 0; R < n; R++) {
        let k = 0;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] === R) k++;
        if (k < minRegionSize) return false;
        if (k > maxRegionSize) return false;
      }
      return true;
    }
    if (!minFeasible(left)) return false;      // (b) MIN prune
    const front = frontierCells();
    if (!front.length) return false;
    front.sort((a, b) => a[2].length - b[2].length);
    const pick = Math.min(front.length, 6);
    const start = Math.floor(rng() * Math.min(pick, 3));
    for (let i = start; i < pick; i++) {
      const [r, c] = front[i];
      const opts = adjacentRegions(r, c);
      opts.sort((x, y) => size[x] - size[y]);
      for (let k = opts.length - 1; k >= 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        const t = opts[k]; opts[k] = opts[j]; opts[j] = t;
      }
      for (const R of opts) {
        if (size[R] + 1 > maxRegionSize) continue;   // (a) MAX prune
        const survivors = sols.filter(s => s[r] !== c);
        const newcomers = solutionsWithCrownAt(n, grid, r, c, R, 3);
        const merged = survivors.concat(newcomers);
        if (merged.length > 1) continue;
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
  const n = parseInt(process.argv[2] || '10', 10);
  const tries = parseInt(process.argv[3] || '3', 10);
  const MIN = parseInt(process.argv[4] || '1', 10);
  const MAX = parseInt(process.argv[5] || '99', 10);
  console.log('R337 queens v8 n=' + n + ' bounds ' + MIN + '..' + MAX);
  const t0 = Date.now();
  let ok = 0;
  for (let seed = 1; seed <= tries; seed++) {
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) { console.log('  seed=' + seed + ' NO PLACEMENT'); continue; }
    let grid = null, att = 0;
    const t1 = Date.now();
    while (!grid && att < 8) {
      grid = buildUnique(n, sol, mulberry32(seed * 7919 + n * 104729 + att * 977), 400000, MIN, MAX);
      att++;
    }
    if (!grid) { console.log('  seed=' + seed + ' NO MAP after ' + att + ' (' + (Date.now() - t1) + 'ms)'); continue; }
    const sizes = [];
    for (let R = 0; R < n; R++) { let k = 0; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] === R) k++; sizes.push(k); }
    ok++;
    console.log('  seed=' + seed + ': exact=' + exactCount(n, grid, 5) + ' page=' + ctx.__cs(n, grid, 5) +
      ' err=' + validate(n, grid, sol) + ' conn=' + connectedOK(n, grid) +
      ' sizes=' + Math.min(...sizes) + '..' + Math.max(...sizes) +
      ' (' + (Date.now() - t1) + 'ms, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's total)');
  }
  console.log('n=' + n + ': ' + ok + '/' + tries);
}
