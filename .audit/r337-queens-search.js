#!/usr/bin/env node
/* R337 queens — EXACT-count uniqueness search.
 *
 * Fixes the flaw in the previous attempt: the solution count was capped at
 * LIMIT=4, so a map with 40 solutions and a map with 4 solutions both read
 * "4" and the strict-descent test `cnt < curCount` could never fire. With
 * EXACT counting the descent can actually see the decrease.
 *
 * Move operator (kills every rival that has a crown at the moved cell):
 *   A valid solution places n crowns in n DISTINCT regions and there are
 *   exactly n regions, so a valid solution uses EVERY region exactly once.
 *   Take a rival R2 and a cell c where R2 has a crown and S does not.
 *   Reassign c from its region R_old to a DIFFERENT region R_new:
 *     - R2's crown at c is now in R_new, and R2 still has its original crown
 *       in R_new -> R2 has TWO crowns in R_new -> violates "one crown per
 *       region" -> R2 is dead.
 *     - S's crown set is unchanged (c is not a crown of S) -> S survives.
 *   Removing c may orphan a piece of R_old; that piece moves with c.
 *
 * Targets are restricted to regions ADJACENT to c so the receiving region
 * stays connected (the game draws each region as one contiguous blob).
 *
 * Because a move can also resurrect a previously-invalid arrangement, the
 * search accepts the best count it can find and restarts on a plateau.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');

function grabFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf('{', m.index);
  let i = open + 1, depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '{') depth++; else if (c === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
}
const names = ['makeRNG', 'tryPlaceQueens', 'tryMakeRegions', 'countSolutions',
  'getNeighbors', 'generatePuzzle', 'fallbackSolution', 'fallbackRegions',
  'isRegionConnected', 'findNearestRegion'];
let src = '';
for (const n of names) src += grabFunction(html, n) + '\n';
const ctx = { Math, console: { log: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__cs=countSolutions; this.__pq=tryPlaceQueens;', ctx);

/* EXACT solution counter (no cap) */
function countExact(n, regions) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  let count = 0;
  (function bt(row) {
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
/* enumerate up to `limit` solutions */
function enumerate(n, regions, limit) {
  const out = [];
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (out.length >= limit) return;
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
function component(n, regions, rid, start) {
  const seen = new Set([start[0] + ',' + start[1]]);
  const stack = [start]; const out = [];
  while (stack.length) {
    const [r, c] = stack.pop();
    out.push([r, c]);
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== rid) continue;
      const k = nr + ',' + nc;
      if (seen.has(k)) continue;
      seen.add(k); stack.push([nr, nc]);
    }
  }
  return out;
}
function connectedOK(n, regions) {
  for (let R = 0; R < n; R++) {
    const cells = regionCells(n, regions, R);
    if (!cells.length) return false;
    if (component(n, regions, R, cells[0]).length !== cells.length) return false;
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
function buildConnectedRegions(n, sol, rng) {
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let c = 0; c < n; c++) grid[r][c] = -1; }
  for (let r = 0; r < n; r++) grid[r][sol[r]] = r;
  const frontier = [];
  for (let r = 0; r < n; r++) frontier.push([]);
  const push = (R, r, c) => {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (grid[nr][nc] !== -1) continue;
      frontier[R].push([nr, nc]);
    }
  };
  for (let r = 0; r < n; r++) push(r, r, sol[r]);
  let unassigned = n * n - n, guard = 0;
  while (unassigned > 0 && guard++ < n * n * 20) {
    const act = [];
    for (let R = 0; R < n; R++) if (frontier[R].length) act.push(R);
    if (!act.length) return null;
    const R = act[Math.floor(rng() * act.length)];
    const fi = Math.floor(rng() * frontier[R].length);
    const cell = frontier[R][fi];
    if (grid[cell[0]][cell[1]] !== -1) { frontier[R].splice(fi, 1); continue; }
    grid[cell[0]][cell[1]] = R;
    unassigned--;
    frontier[R].splice(fi, 1);
    push(R, cell[0], cell[1]);
  }
  return unassigned > 0 ? null : grid;
}

/* candidate cells: crown of a rival but not of S */
function candidateCells(n, grid, sol, solCells) {
  const rivals = enumerate(n, grid, 8);
  const out = [];
  const seen = new Set();
  for (const R2 of rivals) {
    for (let r = 0; r < n; r++) {
      const c = R2[r];
      if (solCells.has(r + ',' + c)) continue;   // S has a crown there too
      const k = r + ',' + c;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([r, c]);
    }
  }
  return out;
}

function applyMove(n, grid, sol, solCells, cr, cc) {
  const R_old = grid[cr][cc];
  const oldCells = regionCells(n, grid, R_old);
  const anchor = oldCells.find(x => solCells.has(x[0] + ',' + x[1])) || oldCells[0];
  const comp = component(n, grid, R_old, anchor);
  const inComp = new Set(comp.map(c => c[0] + ',' + c[1]));
  const orphan = oldCells.filter(c => !inComp.has(c[0] + ',' + c[1]));
  if (orphan.some(c => solCells.has(c[0] + ',' + c[1]))) return null;
  const targets = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = cr + dr, nc = cc + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
    const R = grid[nr][nc];
    if (R !== R_old && targets.indexOf(R) < 0) targets.push(R);
  }
  if (!targets.length) return null;
  return { R_old, targets, orphan };
}

function searchUnique(n, sol, rng, maxRestarts, maxSteps) {
  let bestGrid = null;
  for (let attempt = 0; attempt < maxRestarts; attempt++) {
    const grid = buildConnectedRegions(n, sol, rng);
    if (!grid) continue;
    const solCells = new Set(sol.map((c, r) => r + ',' + c));
    let cur = countExact(n, grid);
    for (let step = 0; step < maxSteps && cur > 1; step++) {
      const cands = candidateCells(n, grid, sol, solCells);
      if (!cands.length) break;
      let bestMove = null, bestCnt = cur;
      for (const [cr, cc] of cands) {
        const info = applyMove(n, grid, sol, solCells, cr, cc);
        if (!info) continue;
        for (const R_new of info.targets) {
          const backup = grid.map(row => row.slice());
          grid[cr][cc] = R_new;
          for (const [or_, oc] of info.orphan) grid[or_][oc] = R_new;
          if (validate(n, grid, sol) !== null || !connectedOK(n, grid)) {
            for (let r = 0; r < n; r++) grid[r] = backup[r].slice();
            continue;
          }
          const cnt = countExact(n, grid);
          if (cnt < bestCnt) { bestCnt = cnt; bestMove = { cr, cc, R_new, orphan: info.orphan }; }
          for (let r = 0; r < n; r++) grid[r] = backup[r].slice();
        }
      }
      if (!bestMove) break;          // local minimum -> restart
      grid[bestMove.cr][bestMove.cc] = bestMove.R_new;
      for (const [or_, oc] of bestMove.orphan) grid[or_][oc] = bestMove.R_new;
      cur = bestCnt;
    }
    if (cur === 1) return { grid, ok: true, attempt };
    if (!bestGrid || cur < bestGrid.count) bestGrid = { grid, count: cur };
  }
  return { grid: null, ok: false, best: bestGrid && bestGrid.count };
}

if (require.main === module) {
  console.log('R337 queens — exact-count uniqueness search');
  for (const n of [7, 8, 9, 10, 11]) {
    const t0 = Date.now();
    let found = 0, tried = 0;
    for (let seed = 1; seed <= 4; seed++) {
      tried++;
      const rng = mulberry32(seed * 7919 + n * 104729);
      const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
      if (!sol) continue;
      const res = searchUnique(n, sol, rng, 25, 400);
      if (res.ok) {
        const ours = enumerate(n, res.grid, 3).length;
        const page = ctx.__cs(n, res.grid, 3);
        const err = validate(n, res.grid, sol);
        const conn = connectedOK(n, res.grid);
        if (ours === 1 && page === 1 && err === null && conn) { found++; continue; }
        console.log('  POST-FAIL n=' + n + ' seed=' + seed + ' ours=' + ours + ' page=' + page + ' err=' + err + ' conn=' + conn);
      } else {
        console.log('  n=' + n + ' seed=' + seed + ' no unique map (best count ' + res.best + ')');
      }
    }
    console.log('  n=' + n + ': ' + found + '/' + tried + ' unique maps in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
}
module.exports = { countExact, enumerate, validate, connectedOK, buildConnectedRegions, searchUnique, ctx, mulberry32, regionCells };
