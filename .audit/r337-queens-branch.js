#!/usr/bin/env node
/* R337 queens — BRANCH-MOVE unique-level generator.
 *
 * THE IDENTITY (proved):
 *   A valid solution places n crowns in n DISTINCT regions and there are
 *   exactly n regions, so a valid solution uses EVERY region exactly once.
 *   Reassigning a cell c from region R_old to a different region R_new:
 *     - every solution USING c dies (c's region label changed -> two crowns in
 *       R_new or none in R_old -> "one crown per region" violated);
 *     - every solution NOT using c keeps its region multiset -> survives.
 *
 * THE MOVE (branch move):
 *   Move a CONNECTED branch B of R_old (B contains a cell adjacent to R_new)
 *   into R_new. Both regions stay connected:
 *     - R_new ∪ B is connected (c ∈ B is adjacent to R_new, B is connected);
 *     - R_old \ B is connected (B never passes THROUGH an articulation point
 *       of R_old).
 *   Every solution using ANY cell of B dies -> strictly more coverage than a
 *   single-cell move.
 *
 * RESURRECTION:
 *   A previously-INVALID arrangement can become valid (one that had two cells
 *   in R_old and none in R_new). So the solution count is re-enumerated from
 *   scratch after every accepted move, and the count is the objective.
 *
 * PRECONDITION: no cell of B may be a crown of the intended solution S.
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
function comp(n, regions, rid, start, skipArtic) {
  const seen = new Set([start[0] + ',' + start[1]]);
  const st = [start]; const out = [];
  while (st.length) {
    const [r, c] = st.pop(); out.push([r, c]);
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== rid) continue;
      if (skipArtic && skipArtic.has(nr + ',' + nc)) continue;
      const k = nr + ',' + nc; if (seen.has(k)) continue; seen.add(k); st.push([nr, nc]);
    }
  }
  return out;
}
function connectedOK(n, regions) {
  for (let R = 0; R < n; R++) {
    const cells = regionCells(n, regions, R);
    if (!cells.length) return false;
    if (comp(n, regions, R, cells[0]).length !== cells.length) return false;
  }
  return true;
}
/* articulation points of a region's cell graph (4-neighbourhood) */
function articulationPoints(n, regions, rid) {
  const cells = regionCells(n, regions, rid);
  const idx = new Map();
  cells.forEach((c, i) => idx.set(c[0] + ',' + c[1], i));
  const adj = cells.map(() => []);
  cells.forEach(([r, c], i) => {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      const k = nr + ',' + nc;
      if (idx.has(k)) adj[i].push(idx.get(k));
    }
  });
  const disc = new Array(cells.length).fill(-1);
  const low = new Array(cells.length).fill(0);
  const isArt = new Array(cells.length).fill(false);
  let timer = 0;
  function dfs(u, parent) {
    disc[u] = low[u] = timer++;
    let children = 0;
    for (const v of adj[u]) {
      if (v === parent) continue;
      if (disc[v] !== -1) { low[u] = Math.min(low[u], disc[v]); continue; }
      children++;
      dfs(v, u);
      low[u] = Math.min(low[u], low[v]);
      if (parent !== -1 && low[v] >= disc[u]) isArt[u] = true;
    }
    if (parent === -1 && children > 1) isArt[u] = true;
  }
  for (let i = 0; i < cells.length; i++) if (disc[i] === -1) dfs(i, -1);
  const out = new Set();
  cells.forEach(([r, c], i) => { if (isArt[i]) out.add(r + ',' + c); });
  return out;
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

/* all branch moves from the current grid */
function branchMoves(n, grid, solCells) {
  const moves = [];
  for (let R_old = 0; R_old < n; R_old++) {
    const arts = articulationPoints(n, grid, R_old);
    const cells = regionCells(n, grid, R_old);
    for (const seed of cells) {
      if (solCells.has(seed[0] + ',' + seed[1])) continue;
      // branch = component of R_old containing seed, NOT passing through an
      // articulation point (so R_old \ branch stays connected)
      const B = comp(n, grid, R_old, seed, arts);
      // the branch must not contain any S crown
      if (B.some(x => solCells.has(x[0] + ',' + x[1]))) continue;
      // R_old \ B must be non-empty and connected
      const rest = cells.filter(x => !B.some(y => y[0] === x[0] && y[1] === x[1]));
      if (!rest.length) continue;
      if (comp(n, grid, R_old, rest[0], arts).length !== rest.length) continue;
      // target: a region adjacent to some cell of B
      const targets = new Set();
      for (const [br, bc] of B) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = br + dr, nc = bc + dc;
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
          const R = grid[nr][nc];
          if (R !== R_old) targets.add(R);
        }
      }
      for (const R_new of targets) {
        moves.push({ R_old, R_new, B });
      }
    }
  }
  return moves;
}

function killToUnique(n, sol, grid0, opts) {
  const maxMoves = (opts && opts.maxMoves) || 200;
  const cap = (opts && opts.cap) || 3000000;
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  let grid = grid0.map(r => r.slice());
  let sols = enumerateAll(n, grid, cap);
  const startCount = sols.length;
  let moves = 0;
  while (sols.length > 1 && moves < maxMoves) {
    // coverage per cell
    const cover = new Map();
    for (const X of sols) for (let r = 0; r < n; r++) {
      const k = r * n + X[r];
      cover.set(k, (cover.get(k) || 0) + 1);
    }
    const movesList = branchMoves(n, grid, solCells);
    if (!movesList.length) return { grid, ok: false, why: 'no branch move', sols: sols.length, moves, startCount };
    let best = null;
    for (const mv of movesList) {
      const g = grid.map(row => row.slice());
      for (const [br, bc] of mv.B) g[br][bc] = mv.R_new;
      if (validate(n, g, sol) !== null) continue;
      if (!connectedOK(n, g)) continue;
      // cheap coverage estimate = how many solutions use a cell of B
      let cov = 0;
      const bset = new Set(mv.B.map(x => x[0] + ',' + x[1]));
      for (const X of sols) {
        let hit = false;
        for (let r = 0; r < n; r++) if (bset.has(r + ',' + X[r])) { hit = true; break; }
        if (hit) cov++;
      }
      if (!best || cov > best.cov) best = { mv, g, cov };
    }
    if (!best) return { grid, ok: false, why: 'no admissible branch move', sols: sols.length, moves, startCount };
    const after = enumerateAll(n, best.g, cap);
    if (after.length >= sols.length) {
      // this move does not help -> try the next-best
      // (fall back to trying all moves in order)
      let applied = false;
      for (const mv of movesList) {
        const g = grid.map(row => row.slice());
        for (const [br, bc] of mv.B) g[br][bc] = mv.R_new;
        if (validate(n, g, sol) !== null) continue;
        if (!connectedOK(n, g)) continue;
        const a2 = enumerateAll(n, g, cap);
        if (a2.length < sols.length) { grid = g; sols = a2; moves++; applied = true; break; }
      }
      if (!applied) return { grid, ok: false, why: 'no move reduces the count', sols: sols.length, moves, startCount };
    } else {
      grid = best.g; sols = after; moves++;
    }
  }
  return { grid, ok: sols.length === 1, sols: sols.length, moves, startCount };
}

module.exports = { enumerateAll, validate, connectedOK, blobRegions, killToUnique, mulberry32, ctx, branchMoves, articulationPoints, regionCells };

if (require.main === module) {
  console.log('R337 queens — BRANCH-move unique-level generator');
  for (const n of [7, 8, 9, 10, 11]) {
    const t0 = Date.now();
    let found = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
      if (!sol) continue;
      const g = blobRegions(n, sol, mulberry32(seed * 7919 + n * 104729));
      if (!g) { console.log('  n=' + n + ' seed=' + seed + ' no blob'); continue; }
      const res = killToUnique(n, sol, g, { maxMoves: 400 });
      if (res.ok) {
        const exact = enumerateAll(n, res.grid, 5).length;
        const page = ctx.__cs(n, res.grid, 5);
        const err = validate(n, res.grid, sol);
        const conn = connectedOK(n, res.grid);
        if (exact === 1 && page === 1 && err === null && conn) {
          found++;
          console.log('  n=' + n + ' seed=' + seed + ': ' + res.startCount + ' -> 1 in ' + res.moves + ' moves  OK');
          continue;
        }
        console.log('  n=' + n + ' seed=' + seed + ' POST-FAIL exact=' + exact + ' page=' + page + ' err=' + err + ' conn=' + conn);
      } else {
        console.log('  n=' + n + ' seed=' + seed + ' FAILED: ' + res.why + ' (sols=' + res.sols + ' moves=' + res.moves + ')');
      }
    }
    console.log('  == n=' + n + ': ' + found + ' unique maps, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
}
