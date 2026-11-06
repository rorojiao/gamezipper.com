#!/usr/bin/env node
/* R337 queens — WHICH region shape makes a unique puzzle reachable?
 *
 * The shipped levels have 48..134,950 solutions each, so the puzzle is
 * nowhere near unique. This measures the SOLUTION COUNT for four region-map
 * strategies at each board size, to find a family whose counts are low enough
 * that a local "kill one rival" descent can reach exactly 1.
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
vm.runInContext(src + '\nthis.__pq=tryPlaceQueens;', ctx);

function countExact(n, regions, cap) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  let count = 0;
  (function bt(row) {
    if (count >= cap) return;
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function regionsFromIds(n, ids) {
  const g = [];
  for (let r = 0; r < n; r++) { g.push([]); for (let c = 0; c < n; c++) g[r][c] = ids[r][c]; }
  return g;
}
/* A: blob BFS growth (what the page ships) */
function blobRegions(n, sol, rng) {
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let c = 0; c < n; c++) grid[r][c] = -1; }
  for (let r = 0; r < n; r++) grid[r][sol[r]] = r;
  const fr = []; for (let r = 0; r < n; r++) fr.push([]);
  const push = (R, r, c) => {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (grid[nr][nc] !== -1) continue;
      fr[R].push([nr, nc]);
    }
  };
  for (let r = 0; r < n; r++) push(r, r, sol[r]);
  let un = n * n - n, guard = 0;
  while (un > 0 && guard++ < n * n * 20) {
    const act = []; for (let R = 0; R < n; R++) if (fr[R].length) act.push(R);
    if (!act.length) return null;
    const R = act[Math.floor(rng() * act.length)];
    const fi = Math.floor(rng() * fr[R].length);
    const cell = fr[R][fi];
    if (grid[cell[0]][cell[1]] !== -1) { fr[R].splice(fi, 1); continue; }
    grid[cell[0]][cell[1]] = R; un--; fr[R].splice(fi, 1); push(R, cell[0], cell[1]);
  }
  return un > 0 ? null : grid;
}
/* B: Voronoi by Manhattan distance to the nearest queen (ties broken randomly) */
function voronoiRegions(n, sol, rng) {
  const queens = [];
  for (let r = 0; r < n; r++) queens.push([r, sol[r]]);
  const g = [];
  for (let r = 0; r < n; r++) {
    g.push([]);
    for (let c = 0; c < n; c++) {
      let best = 0, bestD = Infinity, ties = 0;
      for (let k = 0; k < n; k++) {
        const d = Math.abs(queens[k][0] - r) + Math.abs(queens[k][1] - c);
        if (d < bestD) { bestD = d; best = k; ties = 1; }
        else if (d === bestD) { ties++; if (rng() < 1 / ties) best = k; }
      }
      g[r][c] = best;
    }
  }
  return g;
}
/* C: snake growth — each region is a thin random walk */
function snakeRegions(n, sol, rng) {
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let c = 0; c < n; c++) grid[r][c] = -1; }
  for (let r = 0; r < n; r++) grid[r][sol[r]] = r;
  const heads = [];
  for (let r = 0; r < n; r++) heads.push([r, sol[r]]);
  const un = n * n - n;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let step = 0; step < un; step++) {
    // try each region in random order, extend the first that can
    const order = [];
    for (let R = 0; R < n; R++) order.push(R);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
    let placed = false;
    for (const R of order) {
      const [hr, hc] = heads[R];
      const cand = [];
      for (const [dr, dc] of dirs) {
        const nr = hr + dr, nc = hc + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        if (grid[nr][nc] !== -1) continue;
        cand.push([nr, nc]);
      }
      if (!cand.length) continue;
      const [nr, nc] = cand[Math.floor(rng() * cand.length)];
      grid[nr][nc] = R; heads[R] = [nr, nc]; placed = true; break;
    }
    if (!placed) return null;
  }
  return grid;
}

console.log('R337 queens — solution count by region shape (cap 200000)');
for (const n of [7, 8, 9, 10, 11]) {
  const sol = ctx.__pq(n, mulberry32(n * 97 + 5));
  const line = [];
  for (const [name, fn] of [['blob', blobRegions], ['voronoi', voronoiRegions], ['snake', snakeRegions]]) {
    let sum = 0, mx = 0, ok = 0, tries = 4;
    for (let s = 0; s < tries; s++) {
      const g = fn(n, sol, mulberry32(s * 31 + n * 7 + 1));
      if (!g) continue;
      const c = countExact(n, g, 200000);
      sum += c; mx = Math.max(mx, c); ok++;
    }
    line.push(name + ': avg=' + (ok ? Math.round(sum / ok) : '-') + ' max=' + mx);
  }
  console.log('  n=' + n + '  ' + line.join('  |  '));
}
