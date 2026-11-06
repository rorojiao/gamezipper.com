#!/usr/bin/env node
/* R337 queens — v5: exact-count descent WITH connectivity-preserving moves.
 *
 * Combines the two things that each worked alone:
 *   - the EXACT-count descent (v3) converges: a move that reassigns a cell c
 *     from region A to region B kills every solution that USES c (a valid
 *     solution uses every region exactly once, so c's old region loses its
 *     only crown and B gains a second) and leaves every solution that does
 *     not use c untouched;
 *   - the CONNECTIVITY preconditions, which are what v3 lacked:
 *       * the target region must be 4-ADJACENT to the moved cell, so the
 *         receiving region stays one contiguous blob;
 *       * the moved cell must not be an ARTICULATION POINT of its own region,
 *         so the source region does not split in two.
 *   The earlier stall of this combination was caused by a CAPPED count
 *   (limit 4), which made every large map look identical to the search; the
 *   count is now exact.
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
  const seen = new Set(); const comps = [];
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

/* candidate moves that preserve connectivity */
function connMoves(n, grid, sol, solCells) {
  const out = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (solCells.has(r + ',' + c)) continue;
    const R_old = grid[r][c];
    // target regions: adjacent to (r,c)
    const targets = [];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const R = grid[nr][nc];
      if (R !== R_old && targets.indexOf(R) < 0) targets.push(R);
    }
    if (!targets.length) continue;
    // source must not split: (r,c) must not be an articulation point
    const cells = regionCells(n, grid, R_old);
    const gTmp = grid.map(row => row.slice());
    gTmp[r][c] = -3;
    const rest = cells.filter(x => x[0] !== r || x[1] !== c);
    if (!rest.length) continue;
    if (compOf(n, gTmp, R_old, rest[0]).length !== rest.length) continue;
    // and R_old must keep its queen
    let keepsQueen = false;
    for (let rr = 0; rr < n; rr++) {
      if (grid[rr][sol[rr]] !== R_old) continue;
      if (rr === r && sol[rr] === c) continue;
      keepsQueen = true;
    }
    if (!keepsQueen) continue;
    out.push({ r, c, R_old, targets });
  }
  return out;
}

function solveUnique(n, sol, grid0, opts) {
  const maxSteps = (opts && opts.maxSteps) || 200;
  const cap = (opts && opts.cap) || 400000;
  const topK = (opts && opts.topK) || 60;
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  let grid = grid0.map(r => r.slice());
  let sols = enumerateAll(n, grid, cap);
  const startCount = sols.length;
  const history = [];
  for (let step = 0; step < maxSteps && sols.length > 1; step++) {
    const cover = new Map();
    for (const X of sols) for (let r = 0; r < n; r++) {
      const k = r * n + X[r];
      cover.set(k, (cover.get(k) || 0) + 1);
    }
    const cands = connMoves(n, grid, sol, solCells);
    if (!cands.length) return { grid, ok: false, why: 'no connectivity-preserving move available', sols: sols.length, history, startCount };
    cands.sort((a, b) => (cover.get(b.r * n + b.c) || 0) - (cover.get(a.r * n + a.c) || 0));
    let best = null;
    const limit = Math.min(cands.length, topK);
    for (let i = 0; i < limit && !best; i++) {
      const cd = cands[i];
      for (const R_new of cd.targets) {
        const g = grid.map(row => row.slice());
        g[cd.r][cd.c] = R_new;
        if (validate(n, g, sol) !== null) continue;
        if (!connectedOK(n, g)) continue;
        const after = enumerateAll(n, g, cap);
        if (!best || after.length < best.after.length) {
          best = { g, after };
          if (after.length === 1) break;
        }
        if (best.after.length === 1) break;
      }
    }
    if (!best) return { grid, ok: false, why: 'no move reduces the count', sols: sols.length, history, startCount };
    history.push(sols.length + '->' + best.after.length);
    grid = best.g; sols = best.after;
  }
  return { grid, ok: sols.length === 1, sols: sols.length, history, startCount };
}

module.exports = { enumerateAll, validate, connectedOK, blobRegions, solveUnique, mulberry32, ctx, regionCells, componentsOf, connMoves };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '7', 10);
  const seeds = parseInt(process.argv[3] || '4', 10);
  console.log('R337 queens — v5 exact-count descent WITH connectivity, n=' + n);
  const t0 = Date.now();
  let ok = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    const g0 = blobRegions(n, sol, mulberry32(seed * 7919 + n * 104729));
    if (!g0) { console.log('  seed=' + seed + ' no blob'); continue; }
    const res = solveUnique(n, sol, g0, { maxSteps: 300 });
    if (res.ok) {
      const exact = enumerateAll(n, res.grid, 5).length;
      const page = ctx.__cs(n, res.grid, 5);
      const err = validate(n, res.grid, sol);
      const conn = connectedOK(n, res.grid);
      if (exact === 1 && page === 1 && err === null && conn) {
        ok++;
        console.log('  seed=' + seed + ': ' + res.startCount + ' -> 1 in ' + res.history.length + ' steps, CONNECTED  (' + ((Date.now() - t0) / 1000).toFixed(2) + 's)');
      } else {
        console.log('  seed=' + seed + ' POST-FAIL exact=' + exact + ' page=' + page + ' err=' + err + ' conn=' + conn);
      }
    } else {
      console.log('  seed=' + seed + ' FAILED: ' + res.why + ' (sols=' + res.sols + ') ' + res.history.slice(-6).join(' '));
    }
  }
  console.log('n=' + n + ': ' + ok + '/' + seeds + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
