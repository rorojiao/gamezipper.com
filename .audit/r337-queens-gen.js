#!/usr/bin/env node
/* R337 queens — FAST unique-level generator.
 *
 * WHAT IS PROVEN (the basis of this algorithm):
 *   A valid solution places n crowns in n DISTINCT regions, and there are
 *   exactly n regions, so a valid solution uses EVERY region exactly once.
 *
 *   Reassign one cell c from region R_old to a different region R_new:
 *     - every solution X CONTAINING c dies: X had exactly one cell in R_old
 *       (namely c) and exactly one in R_new; after the move X has zero in
 *       R_old and TWO in R_new -> "one crown per region" is violated.
 *     - every solution X NOT containing c is unaffected: only c's label
 *       changed, so X's region multiset is untouched.
 *   => the survivors are exactly { X : c not in X }.
 *
 *   (A previously-INVALID arrangement can in principle become valid — e.g. one
 *   that had two cells in R_old and none in R_new — so the final result is
 *   always verified with a from-scratch exact enumeration, and the tracked
 *   solution set is re-synced from an exact enumeration every RESYNC moves.)
 *
 * MOVE PRECONDITIONS:
 *   - c is not a crown of S (so S survives),
 *   - R_old \ {c} is still CONNECTED (the game draws each region as one
 *     contiguous blob) and still contains R_old's crown of S,
 *   - R_new is a region ADJACENT to c (so R_new stays connected).
 *
 * The search is a greedy max-coverage descent: each step kills every
 * solution containing the chosen cell, so it kills the largest possible
 * fraction of the remaining set.
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

/* ---- exact enumeration of all solutions ---- */
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
function comp(n, regions, rid, start) {
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
function connectedOK(n, regions) {
  for (let R = 0; R < n; R++) {
    const cells = regionCells(n, regions, R);
    if (!cells.length) return false;
    if (comp(n, regions, R, cells[0]).length !== cells.length) return false;
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
/* connected blob growth, each region seeded at its queen */
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

/* candidate moves for cell (r,c): which region can it move into? */
function targetsFor(n, grid, r, c) {
  const R_old = grid[r][c];
  const out = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
    const R = grid[nr][nc];
    if (R !== R_old && out.indexOf(R) < 0) out.push(R);
  }
  return out;
}

/* the greedy killer */
function killToUnique(n, sol, grid0, opts) {
  const maxMoves = (opts && opts.maxMoves) || 400;
  const resyncEvery = (opts && opts.resyncEvery) || 12;
  const cap = (opts && opts.cap) || 2000000;
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  let grid = grid0.map(r => r.slice());
  let sols = enumerateAll(n, grid, cap);
  const startCount = sols.length;
  let moves = 0, resyncs = 0;

  while (sols.length > 1 && moves < maxMoves) {
    // coverage: for each candidate cell, how many surviving solutions use it
    const cover = new Map();
    for (let s = 0; s < sols.length; s++) {
      const X = sols[s];
      for (let r = 0; r < n; r++) {
        const c = X[r];
        const k = r * n + c;
        cover.set(k, (cover.get(k) || 0) + 1);
      }
    }
    // order candidates by coverage desc; skip S-crown cells
    const cands = [];
    for (const [k, cnt] of cover) {
      const r = Math.floor(k / n), c = k % n;
      if (solCells.has(r + ',' + c)) continue;
      cands.push({ r, c, cnt, k });
    }
    cands.sort((a, b) => b.cnt - a.cnt);
    let applied = false;
    for (const cand of cands) {
      const { r, c } = cand;
      const R_old = grid[r][c];
      const targets = targetsFor(n, grid, r, c);
      if (!targets.length) continue;
      // R_old must keep its S crown and stay connected without c.
      // NOTE: the connectivity test MUST run on the POST-move grid — testing it
      // on the pre-move grid still finds c and always reports "cut vertex".
      const rest = regionCells(n, grid, R_old).filter(x => x[0] !== r || x[1] !== c);
      if (!rest.length) continue;
      const gTmp = grid.map(row => row.slice());
      gTmp[r][c] = -2;                       // remove c from R_old for the test
      if (comp(n, gTmp, R_old, rest[0]).length !== rest.length) continue;  // c is a cut vertex
      let keepsCrown = false;
      for (let rr = 0; rr < n; rr++) {
        if (grid[rr][sol[rr]] !== R_old) continue;
        if (rr === r && sol[rr] === c) continue;                            // that IS c
        keepsCrown = true;
      }
      if (!keepsCrown) continue;
      for (const R_new of targets) {
        const g = grid.map(row => row.slice());
        g[r][c] = R_new;
        if (validate(n, g, sol) !== null) continue;
        if (!connectedOK(n, g)) continue;
        // survivors per the proven identity: solutions not containing c
        const survivors = [];
        for (let s = 0; s < sols.length; s++) {
          const X = sols[s];
          let has = false;
          for (let rr = 0; rr < n; rr++) if (X[rr] === c && rr === r) { has = true; break; }
          if (!has) survivors.push(X);
        }
        grid = g; sols = survivors; applied = true; moves++;
        break;
      }
      if (applied) break;
    }
    if (!applied) return { grid, ok: false, why: 'no admissible move', sols: sols.length, moves, startCount };
    // resync from an exact enumeration (catches any resurrected arrangement)
    if (moves % resyncEvery === 0) {
      const exact = enumerateAll(n, grid, cap);
      resyncs++;
      if (exact.length > sols.length) {
        return { grid, ok: false, why: 'resurrection detected (' + sols.length + ' -> ' + exact.length + ')', sols: sols.length, moves, startCount };
      }
      sols = exact;
      if (sols.length === 1) break;
    }
  }
  return { grid, ok: sols.length === 1, sols: sols.length, moves, startCount, resyncs };
}

module.exports = { enumerateAll, validate, connectedOK, blobRegions, killToUnique, mulberry32, ctx, regionCells };

if (require.main === module) {
  console.log('R337 queens — fast unique-level generator');
  for (const n of [7, 8, 9, 10, 11]) {
    const t0 = Date.now();
    let found = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
      if (!sol) continue;
      const g = blobRegions(n, sol, mulberry32(seed * 7919 + n * 104729));
      if (!g) { console.log('  n=' + n + ' seed=' + seed + ' no blob'); continue; }
      const res = killToUnique(n, sol, g, { maxMoves: 3000 });
      if (res.ok) {
        const exact = enumerateAll(n, res.grid, 5).length;
        const page = ctx.__cs(n, res.grid, 5);
        const err = validate(n, res.grid, sol);
        const conn = connectedOK(n, res.grid);
        if (exact === 1 && page === 1 && err === null && conn) {
          found++;
          console.log('  n=' + n + ' seed=' + seed + ': ' + res.startCount + ' -> 1 in ' + res.moves + ' moves (' + res.resyncs + ' resyncs)  OK');
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
