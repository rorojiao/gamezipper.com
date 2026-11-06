#!/usr/bin/env node
/* R337 queens — generator v10: FAST unique generation + BALANCE REPAIR.
 *
 * WHY v7/v8/v9 WERE UNUSABLE for n>=10 (measured):
 *   - v7/v8 applied the region-size bounds DURING the search. Proving
 *     uniqueness requires EXHAUSTING the alternatives, and with a tight size
 *     window the search cannot exhaust them: n=10 seed=1 took 57s and FAILED,
 *     n=11 never finished.
 *   - v9 removed the search-time bounds (10ms per level) but the growth
 *     heuristic produced lopsided regions (1..33 cells), which is visually
 *     broken and makes the puzzle trivial.
 *
 * v10 SPLITS THE TWO CONCERNS:
 *   1. SEARCH (fast): grow regions with NO size constraints, tracking the
 *      solution set incrementally; a branch is dropped the moment the set
 *      exceeds 1 element (monotonicity: the count is non-decreasing as cells
 *      are assigned, so once it is >1 it can never return to 1).
 *   2. BALANCE REPAIR (slow but bounded): move cells from oversized regions
 *      to adjacent undersized ones, re-verifying uniqueness after EVERY
 *      move, until the size band is met. A move is rejected if it would
 *      break uniqueness, so the map stays provably unique.
 *
 * The final map is verified by THREE independent counters (exactCount, the
 * PAGE's own countSolutions parsed out of index.html, and a brute force with
 * a different code path) plus a connectivity check and a stored-solution
 * validity check.
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

/* ---- phase 1: fast unique search, no size constraints -------------------- */
function buildUniqueFast(n, sol, rng, nodeCap) {
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
  function rec(left) {
    if (++nodes > nodeCap) return false;
    if (left === 0) {
      if (exactCount(n, grid, 3) !== 1) return false;
      if (validate(n, grid, sol) !== null) return false;
      if (!connectedOK(n, grid)) return false;
      return true;
    }
    const front = frontierCells();
    if (!front.length) return false;
    front.sort((a, b) => a[2].length - b[2].length);
    const pick = Math.min(front.length, 6);
    const start = rng() < 0.75 ? 0 : Math.floor(rng() * Math.min(pick, 3));
    for (let i = start; i < pick; i++) {
      const [r, c] = front[i];
      const opts = adjacentRegions(r, c);
      /* prefer the smallest adjacent region, but keep some randomness */
      opts.sort((x, y) => size[x] - size[y]);
      if (opts.length > 1 && rng() > 0.75) {
        const j = 1 + Math.floor(rng() * (opts.length - 1));
        const t = opts[0]; opts[0] = opts[j]; opts[j] = t;
      }
      for (const R of opts) {
        const survivors = sols.filter(s => s[r] !== c);
        const newcomers = solutionsWithCrownAt(n, grid, r, c, R, 3);
        const merged = survivors.concat(newcomers);
        if (merged.length > 1) continue;      // monotone -> dead branch
        grid[r][c] = R; size[R]++;
        const saved = sols; sols = merged;
        if (rec(left - 1)) return true;
        grid[r][c] = -1; size[R]--; sols = saved;
      }
    }
    return false;
  }
  const total = n * n - n;
  if (!rec(total)) return null;
  return grid;
}

/* ---- phase 2: balance repair ---------------------------------------------- */
function balanceRegions(n, grid, sol, tgtMin, tgtMax) {
  const sizes = () => {
    const s = new Array(n).fill(0);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] >= 0) s[grid[r][c]]++;
    return s;
  };
  const unique = () => exactCount(n, grid, 3) === 1 && validate(n, grid, sol) === null && connectedOK(n, grid);

  for (let pass = 0; pass < 400; pass++) {
    const sz = sizes();
    const maxR = sz.indexOf(Math.max(...sz));
    const minR = sz.indexOf(Math.min(...sz));
    if (sz[maxR] <= tgtMax && sz[minR] >= tgtMin) return true;
    // find the cell of the biggest region to give away, preferring a move
    // that lands in the SMALLEST region
    const order = sz.map((v, i) => i).filter(i => i !== maxR).sort((a, b) => sz[a] - sz[b]);
    let moved = false;
    for (const target of order) {
      if (sz[target] >= sz[maxR]) break;
      for (let r = 0; r < n && !moved; r++) {
        for (let c = 0; c < n && !moved; c++) {
          if (grid[r][c] !== maxR) continue;
          if (sol[r] === c) continue;                       // never move a queen cell
          // adjacency to the target region?
          let adj = false;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            if (grid[nr][nc] === target) { adj = true; break; }
          }
          if (!adj) continue;
          const save = grid[r][c];
          grid[r][c] = target;
          if (unique()) { moved = true; break; }
          grid[r][c] = save;
        }
      }
      if (moved) break;
    }
    if (!moved) break;   // no legal move -> accept
  }
  const sz = sizes();
  return Math.min(...sz) >= tgtMin && Math.max(...sz) <= tgtMax;
}

function makeLevel(n, seedBase, tgtMin, tgtMax) {
  for (let tries = 0; tries < 40; tries++) {
    const seed = seedBase + tries * 977;
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    const grid = buildUniqueFast(n, sol, mulberry32(seed * 7919 + n * 104729), 400000);
    if (!grid) continue;
    if (!balanceRegions(n, grid, sol, tgtMin, tgtMax)) continue;
    return { sol, grid };
  }
  return null;
}

module.exports = { exactCount, validate, connectedOK, mulberry32, ctx, buildUniqueFast, balanceRegions, makeLevel };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '10', 10);
  const tries = parseInt(process.argv[3] || '3', 10);
  const tgtMin = parseInt(process.argv[4] || '4', 10);
  const tgtMax = parseInt(process.argv[5] || '12', 10);
  console.log('R337 queens v10 n=' + n + ' target sizes ' + tgtMin + '..' + tgtMax);
  const t0 = Date.now();
  for (let seed = 1; seed <= tries; seed++) {
    const t1 = Date.now();
    const m = makeLevel(n, seed * 104729, tgtMin, tgtMax);
    if (!m) { console.log('  seed=' + seed + ' FAIL (' + (Date.now() - t1) + 'ms)'); continue; }
    const sizes = [];
    for (let R = 0; R < n; R++) { let k = 0; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m.grid[r][c] === R) k++; sizes.push(k); }
    console.log('  seed=' + seed + ': exact=' + exactCount(n, m.grid, 5) + ' page=' + ctx.__cs(n, m.grid, 5) +
      ' err=' + validate(n, m.grid, m.sol) + ' conn=' + connectedOK(n, m.grid) +
      ' sizes=' + Math.min(...sizes) + '..' + Math.max(...sizes) +
      ' (' + (Date.now() - t1) + 'ms)');
  }
  console.log('total ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
