#!/usr/bin/env node
/* R337 queens — max-coverage killer (corrected).
 *
 * IDENTITY (the basis of a convergent algorithm):
 *   A valid solution places n crowns in n DISTINCT regions and there are
 *   exactly n regions -> a valid solution uses EVERY region exactly once.
 *   Reassigning a cell c from region R_old to a different region R_new:
 *     - every solution CONTAINING c dies (c's region label changed, so it now
 *       has two crowns in R_new or none in R_old);
 *     - every solution NOT containing c keeps the same region multiset and
 *       stays valid.
 *   => survivors after the move = { X : c not in X } (plus possible extra
 *      kills from the cells that travel with c).
 *
 *   A move can also RESURRECT a previously-invalid arrangement (e.g. one that
 *   had two crowns in R_old and none in R_new), so the survivor set is always
 *   re-enumerated and a move that does not strictly reduce the count is
 *   reverted.
 *
 * CONNECTIVITY (the bug in the previous attempt):
 *   Removing c from R_old splits R_old into two parts: the part containing
 *   R_old's S-crown (the ANCHOR part) and the part containing c (the TRAVEL
 *   part). The TRAVEL part must move with c into R_new; c is adjacent to
 *   R_new, so R_new stays connected, and the ANCHOR part stays connected and
 *   keeps the S-crown. Moving the ANCHOR part instead (the previous bug)
 *   disconnected the region and broke S.
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

/* Try one move: move cell c (plus the TRAVEL part of its old region) into an
 * adjacent region. Returns the new grid or null. */
function tryMove(n, grid, solCells, r, c) {
  const R_old = grid[r][c];
  // TRAVEL part = component of R_old containing c
  const travel = component(n, grid, R_old, [r, c]);
  // it must not carry an S crown
  if (travel.some(x => solCells.has(x[0] + ',' + x[1]))) return null;
  // ANCHOR part must still hold the S crown of R_old and stay connected
  const oldCells = regionCells(n, grid, R_old);
  const travelSet = new Set(travel.map(x => x[0] + ',' + x[1]));
  const anchor = oldCells.find(x => !travelSet.has(x[0] + ',' + x[1]));
  if (!anchor) return null;                    // R_old would vanish entirely
  if (!solCells.has(anchor[0] + ',' + anchor[1])) return null;  // anchor must hold an S crown
  // find an adjacent target region
  let R_new = -1;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
    const R = grid[nr][nc];
    if (R !== R_old) { R_new = R; break; }
  }
  if (R_new < 0) return null;
  const g = grid.map(row => row.slice());
  for (const [tr, tc] of travel) g[tr][tc] = R_new;
  return g;
}

function killToUnique(n, sol, grid0, maxMoves, maxTrialsPerStep) {
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  let grid = grid0.map(r => r.slice());
  let sols = enumerateAll(n, grid, 500000);
  const startCount = sols.length;
  let moves = 0;
  while (sols.length > 1 && moves < maxMoves) {
    // coverage
    const cover = new Map();
    for (const X of sols) {
      for (let r = 0; r < n; r++) {
        const c = X[r];
        if (solCells.has(r + ',' + c)) continue;
        const k = r + ',' + c;
        cover.set(k, (cover.get(k) || 0) + 1);
      }
    }
    const cands = [...cover.entries()].sort((a, b) => b[1] - a[1]);
    let applied = false;
    for (const [k] of cands) {
      if (maxTrialsPerStep && moves >= 0) { /* bounded below */ }
      const [r, c] = k.split(',').map(Number);
      const g = tryMove(n, grid, solCells, r, c);
      if (!g) continue;
      if (validate(n, g, sol) !== null) continue;
      if (!connectedOK(n, g)) continue;
      const after = enumerateAll(n, g, 500000);
      if (after.length >= sols.length) continue;   // no strict decrease -> revert
      grid = g; sols = after; applied = true; moves++;
      break;
    }
    if (!applied) return { grid, ok: false, why: 'no productive move', sols: sols.length, moves, startCount };
  }
  return { grid, ok: sols.length === 1, sols: sols.length, moves, startCount };
}

module.exports = { enumerateAll, validate, connectedOK, blobRegions, killToUnique, mulberry32, ctx, tryMove };

if (require.main === module) {
  console.log('R337 queens — corrected max-coverage killer');
  for (const n of [7, 8, 9, 10, 11]) {
    const t0 = Date.now();
    let found = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
      if (!sol) continue;
      const g = blobRegions(n, sol, mulberry32(seed * 7919 + n * 104729));
      if (!g) { console.log('  n=' + n + ' seed=' + seed + ' no blob'); continue; }
      const res = killToUnique(n, sol, g, 2000);
      if (res.ok) {
        const ours = enumerateAll(n, res.grid, 3).length;
        const page = ctx.__cs(n, res.grid, 3);
        const err = validate(n, res.grid, sol);
        const conn = connectedOK(n, res.grid);
        if (ours === 1 && page === 1 && err === null && conn) {
          found++;
          console.log('  n=' + n + ' seed=' + seed + ': ' + res.startCount + ' -> 1 in ' + res.moves + ' moves  OK');
          continue;
        }
        console.log('  n=' + n + ' seed=' + seed + ' POST-FAIL ours=' + ours + ' page=' + page + ' err=' + err + ' conn=' + conn);
      } else {
        console.log('  n=' + n + ' seed=' + seed + ' FAILED: ' + res.why + ' (sols=' + res.sols + ', moves=' + res.moves + ')');
      }
    }
    console.log('  == n=' + n + ': ' + found + ' unique maps, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
}
