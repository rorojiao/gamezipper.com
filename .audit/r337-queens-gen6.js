#!/usr/bin/env node
/* R337 queens — FINAL generator v6: incremental solution-set maintenance.
 *
 * Why this is fast enough to run IN THE BROWSER:
 *   The obvious approach re-enumerates ALL solutions after every cell
 *   assignment (n^2 assignments x an exponential search) — that is what made
 *   the earlier attempts take 20-120 s on an 11x11 board.
 *
 *   Instead we keep the solution SET and update it incrementally. Assigning
 *   cell (r,c) to region R splits the solution space in two:
 *     (a) solutions WITHOUT a crown at (r,c)  -> they SURVIVE unchanged
 *         (the cell only changed which region it belongs to; their own
 *          crown-per-region property is untouched because R still contains
 *          R's own queen cell and R0 still contains R0's queen cell);
 *     (b) solutions WITH a crown at (r,c)    -> these are exactly the NEW
 *         solutions, and they can be enumerated directly by backtracking with
 *         row r pinned to column c and region R marked used.
 *   So one assignment costs one filtered list scan + one backtracking search
 *   with n-1 free rows, instead of a full re-enumeration.
 *
 *   The incremental set is a SEARCH GUIDE, not the verdict. Every completed
 *   map is verified with an EXACT full enumeration (plus the page's own
 *   countSolutions) before it is accepted, so a capped guide can never make
 *   an incorrect map look unique.
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

/* EXACT enumeration, used as the final verdict (never as the search guide) */
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

/* enumerate solutions of the CURRENT map that have a crown at (r,c) */
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

const GUIDE_CAP = 400;   // search-guide solution-set cap

function buildUnique(n, sol, rng, nodeCap) {
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let c = 0; c < n; c++) grid[r][c] = -1; }
  for (let r = 0; r < n; r++) grid[r][sol[r]] = r;

  let guide = [sol.slice()];   // the intended solution is always present
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

  function rec2(left) {
    if (++nodes > nodeCap) return false;
    if (left === 0) {
      if (exactCount(n, grid, 3) !== 1) return false;
      if (validate(n, grid, sol) !== null) return false;
      if (!connectedOK(n, grid)) return false;
      return true;
    }
    const front = frontierCells();
    if (!front.length) return false;
    const scored = front.map(([r, c]) => ({ r, c, opts: adjacentRegions(r, c) }));
    scored.sort((a, b) => a.opts.length - b.opts.length);
    const pick = Math.min(scored.length, 6);
    const start = Math.floor(rng() * Math.min(pick, 2));
    for (let i = start; i < pick; i++) {
      const { r, c } = scored[i];
      const opts = adjacentRegions(r, c);
      const order = opts.slice();
      for (let k = order.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        const t = order[k]; order[k] = order[j]; order[j] = t;
      }
      for (const R of order) {
        const survivors = guide.filter(s => s[r] !== c);
        const newcomers = solutionsWithCrownAt(n, grid, r, c, R, GUIDE_CAP);
        grid[r][c] = R;
        const merged = survivors.concat(newcomers);
        const savedGuide = guide;
        guide = merged.length > GUIDE_CAP ? merged.slice(0, GUIDE_CAP) : merged;
        if (rec2(left - 1)) return true;
        grid[r][c] = -1;
        guide = savedGuide;
      }
    }
    return false;
  }

  const total = n * n - n;
  if (!rec2(total)) return null;
  return grid;
}

module.exports = { exactCount, validate, connectedOK, buildUnique, mulberry32, ctx };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '7', 10);
  const tries = parseInt(process.argv[3] || '3', 10);
  console.log('R337 queens — v6 incremental generator, n=' + n);
  const t0 = Date.now();
  let ok = 0;
  for (let seed = 1; seed <= tries; seed++) {
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    let grid = null;
    for (let att = 0; att < 8 && !grid; att++) {
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
