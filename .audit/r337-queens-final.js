#!/usr/bin/env node
/* R337 queens — FINAL generator v4: descent to unique + connectivity repair.
 *
 * STAGE 1 (descent) — converges reliably:
 *   A valid solution places n crowns in n DISTINCT regions and there are
 *   exactly n regions, so a valid solution uses EVERY region exactly once.
 *   Moving a cell c from region A to a different region B:
 *     - every solution USING c dies (it now has two crowns in B);
 *     - every solution NOT using c keeps its region-label multiset.
 *   So each move kills the solutions that use c. The true count is
 *   re-enumerated after each move (a previously-invalid arrangement can be
 *   repaired by a move), and the greedy picks the move with the lowest count.
 *
 * STAGE 2 (connectivity repair):
 *   The game draws each region as one contiguous blob, so every region must be
 *   CONNECTED. After stage 1 a region may be split. For each region we keep
 *   the component that holds its queen and relocate the other components,
 *   one cell at a time, into an ADJACENT region — but only when the solution
 *   count stays 1 and the receiving region stays connected.
 *
 * FINAL VERIFICATION (all independent):
 *   - our own exact counter (limit 5) == 1
 *   - the PAGE's own countSolutions() == 1
 *   - the stored solution S satisfies the rules
 *   - every region is connected and contains exactly one queen of S
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

function enumerateAll(n, regions, cap) {
  const out = [];
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (out.length >= cap) return;
    if (row === n) { out.push(placed.slice()); return; }
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
  return out;
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
function regionCells(n, regions, rid) {
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === rid) cells.push([r, c]);
  return cells;
}
function compOf(n, regions, rid, start) {
  const seen = new Set([start[0] + ',' + start[1]]);
  const st = [start]; const out = [];
  while (st.length) {
    const [r, c] = st.pop(); out.push([r, c]);
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== rid) continue;
      const k = nr + ',' + nc; if (seen.has(k)) continue; seen.add(k); st.push([nr, nc]);
    }
  }
  return out;
}
function componentsOf(n, regions, rid) {
  const cells = regionCells(n, regions, rid);
  const seen = new Set();
  const comps = [];
  for (const cell of cells) {
    const k = cell[0] + ',' + cell[1];
    if (seen.has(k)) continue;
    const comp = compOf(n, regions, rid, cell);
    for (const x of comp) seen.add(x[0] + ',' + x[1]);
    comps.push(comp);
  }
  return comps;
}
function connectedOK(n, regions) {
  for (let R = 0; R < n; R++) {
    const comps = componentsOf(n, regions, R);
    if (comps.length !== 1) return false;
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
function solveUnique(n, sol, grid0, opts) {
  const maxSteps = (opts && opts.maxSteps) || 200;
  const cap = (opts && opts.cap) || 400000;
  const topK = (opts && opts.topK) || 40;
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  let grid = grid0.map(r => r.slice());
  let sols = enumerateAll(n, grid, cap);
  const startCount = sols.length;
  for (let step = 0; step < maxSteps && sols.length > 1; step++) {
    const cover = new Map();
    for (const X of sols) for (let r = 0; r < n; r++) {
      const k = r * n + X[r];
      cover.set(k, (cover.get(k) || 0) + 1);
    }
    const cands = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (solCells.has(r + ',' + c)) continue;
      const cov = cover.get(r * n + c) || 0;
      if (cov === 0) continue;
      cands.push({ r, c, cov });
    }
    cands.sort((a, b) => b.cov - a.cov);
    let best = null;
    const limit = Math.min(cands.length, topK);
    for (let i = 0; i < limit && !best; i++) {
      const cd = cands[i];
      const R_old = grid[cd.r][cd.c];
      for (let B = 0; B < n; B++) {
        if (B === R_old) continue;
        const g = grid.map(row => row.slice());
        g[cd.r][cd.c] = B;
        if (validate(n, g, sol) !== null) continue;
        const after = enumerateAll(n, g, cap);
        if (!best || after.length < best.after.length) {
          best = { g, after };
          if (after.length === 1) break;
        }
        if (best.after.length === 1) break;
      }
    }
    if (!best) return { grid, ok: false, why: 'no candidate with coverage', sols: sols.length, startCount };
    grid = best.g; sols = best.after;
  }
  return { grid, ok: sols.length === 1, sols: sols.length, startCount };
}

/* Stage 2: restore connectivity, keeping the count at 1. */
function repairConnectivity(n, sol, grid0, cap) {
  let grid = grid0.map(r => r.slice());
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  for (let pass = 0; pass < 400; pass++) {
    let bad = null;
    for (let R = 0; R < n && !bad; R++) {
      const comps = componentsOf(n, grid, R);
      if (comps.length <= 1) continue;
      // keep the component holding R's queen
      let queenComp = null;
      for (const comp of comps) {
        if (comp.some(x => solCells.has(x[0] + ',' + x[1]))) { queenComp = comp; break; }
      }
      if (!queenComp) return { grid, ok: false, why: 'region ' + R + ' lost its queen' };
      const qset = new Set(queenComp.map(x => x[0] + ',' + x[1]));
      for (const comp of comps) {
        if (comp === queenComp) continue;
        bad = { R, comp };
        break;
      }
    }
    if (!bad) return { grid, ok: true };
    // try to move one cell of the orphan component into an adjacent region
    let moved = false;
    for (const [r, c] of bad.comp) {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        const B = grid[nr][nc];
        if (B === bad.R) continue;
        const g = grid.map(row => row.slice());
        g[r][c] = B;
        if (validate(n, g, sol) !== null) continue;
        const after = enumerateAll(n, g, cap);
        if (after.length !== 1) continue;
        // the receiving region must stay connected and keep its queen
        const compsB = componentsOf(n, g, B);
        if (compsB.length !== 1) continue;
        grid = g; moved = true; break;
      }
      if (moved) break;
    }
    if (!moved) return { grid, ok: false, why: 'orphan component ' + JSON.stringify(bad.comp) + ' could not be reattached' };
  }
  return { grid, ok: false, why: 'connectivity repair pass cap' };
}

module.exports = { enumerateAll, validate, connectedOK, blobRegions, solveUnique, repairConnectivity, mulberry32, ctx, regionCells, componentsOf };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '7', 10);
  const seeds = parseInt(process.argv[3] || '4', 10);
  console.log('R337 queens — v4 descent + connectivity repair, n=' + n);
  const t0 = Date.now();
  let ok = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    const g0 = blobRegions(n, sol, mulberry32(seed * 7919 + n * 104729));
    if (!g0) { console.log('  seed=' + seed + ' no blob'); continue; }
    const r1 = solveUnique(n, sol, g0, { maxSteps: 200 });
    if (!r1.ok) { console.log('  seed=' + seed + ' descent failed: ' + r1.why + ' (sols=' + r1.sols + ')'); continue; }
    const r2 = repairConnectivity(n, sol, r1.grid, 400000);
    if (!r2.ok) { console.log('  seed=' + seed + ' connectivity failed: ' + r2.why); continue; }
    const exact = enumerateAll(n, r2.grid, 5).length;
    const page = ctx.__cs(n, r2.grid, 5);
    const err = validate(n, r2.grid, sol);
    const conn = connectedOK(n, r2.grid);
    if (exact === 1 && page === 1 && err === null && conn) {
      ok++;
      console.log('  seed=' + seed + ': ' + r1.startCount + ' -> 1, connected  (' + ((Date.now() - t0) / 1000).toFixed(2) + 's)');
    } else {
      console.log('  seed=' + seed + ' POST-FAIL exact=' + exact + ' page=' + page + ' err=' + err + ' conn=' + conn);
    }
  }
  console.log('n=' + n + ': ' + ok + '/' + seeds + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
