#!/usr/bin/env node
/* R337 queens — generator v11: fast unique search + HILL-CLIMB balance.
 *
 * v10's balance repair failed because it only tried to move cells OUT of the
 * biggest region INTO the smallest one, and those two regions were often not
 * adjacent (measured: 19 of 20 candidate cells of the biggest region were
 * not adjacent to the smallest region). A region stuck at size 1 could
 * therefore never grow.
 *
 * v11 uses a general hill-climb instead:
 *   - candidate move: take a NON-queen cell (r,c) and move it to any of its
 *     4-adjacent regions;
 *   - accept the move only when the map stays (a) uniquely solvable,
 *     (b) fully connected, and (c) the stored solution still valid;
 *   - accept only when it improves the BALANCE metric
 *     sum((size - avg)^2), i.e. it moves the size distribution toward even.
 *
 * The stored solution is never touched (queen cells are excluded), so the
 * level's answer is stable across the whole repair.
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
      opts.sort((x, y) => size[x] - size[y]);
      if (opts.length > 1 && rng() > 0.75) {
        const j = 1 + Math.floor(rng() * (opts.length - 1));
        const t = opts[0]; opts[0] = opts[j]; opts[j] = t;
      }
      for (const R of opts) {
        const survivors = sols.filter(s => s[r] !== c);
        const newcomers = solutionsWithCrownAt(n, grid, r, c, R, 3);
        const merged = survivors.concat(newcomers);
        if (merged.length > 1) continue;
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

/* ---- hill-climb balance ---------------------------------------------------- */
function balanceRegions(n, grid, sol, maxPasses) {
  const DIR = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const sizes = () => {
    const s = new Array(n).fill(0);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] >= 0) s[grid[r][c]]++;
    return s;
  };
  const metric = (s) => { let m = 0; const avg = (n * n) / n; for (let i = 0; i < n; i++) m += (s[i] - avg) * (s[i] - avg); return m; };
  const ok = () => exactCount(n, grid, 3) === 1 && validate(n, grid, sol) === null && connectedOK(n, grid);

  let cur = sizes();
  let curM = metric(cur);
  for (let pass = 0; pass < (maxPasses || 300); pass++) {
    let improved = false;
    for (let r = 0; r < n && !improved; r++) {
      for (let c = 0; c < n && !improved; c++) {
        const from = grid[r][c];
        if (from < 0) continue;
        if (sol[r] === c) continue;             // never move a queen cell
        for (const [dr, dc] of DIR) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
          const to = grid[nr][nc];
          if (to < 0 || to === from) continue;  // must move INTO an adjacent region
          grid[r][c] = to;
          const ns = sizes();
          const nm = metric(ns);
          if (nm < curM - 1e-9 && ok()) {
            cur = ns; curM = nm; improved = true; break;
          }
          grid[r][c] = from;
        }
      }
    }
    if (!improved) break;
  }
  return { sizes: sizes(), metric: curM };
}

function makeLevel(n, seedBase, opt) {
  const minS = opt.minSize, maxS = opt.maxSize;
  for (let tries = 0; tries < 60; tries++) {
    const seed = seedBase + tries * 977;
    const sol = ctx.__pq(n, mulberry32(seed * 31 + n));
    if (!sol) continue;
    const grid = buildUniqueFast(n, sol, mulberry32(seed * 7919 + n * 104729), 400000);
    if (!grid) continue;
    balanceRegions(n, grid, sol, 400);
    const s = (() => { const a = new Array(n).fill(0); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] >= 0) a[grid[r][c]]++; return a; })();
    const mn = Math.min(...s), mx = Math.max(...s);
    if (mn < minS || mx > maxS) continue;         // band not reached -> next seed
    if (exactCount(n, grid, 3) !== 1) continue;
    if (validate(n, grid, sol) !== null) continue;
    if (!connectedOK(n, grid)) continue;
    return { sol, grid, sizes: s };
  }
  return null;
}

module.exports = { exactCount, validate, connectedOK, mulberry32, ctx, buildUniqueFast, balanceRegions, makeLevel };

if (require.main === module) {
  const n = parseInt(process.argv[2] || '10', 10);
  const tries = parseInt(process.argv[3] || '3', 10);
  const minS = parseInt(process.argv[4] || '4', 10);
  const maxS = parseInt(process.argv[5] || '12', 10);
  console.log('R337 queens v11 n=' + n + ' band ' + minS + '..' + maxS);
  const t0 = Date.now();
  for (let seed = 1; seed <= tries; seed++) {
    const t1 = Date.now();
    const m = makeLevel(n, seed * 104729, { minSize: minS, maxSize: maxS });
    if (!m) { console.log('  seed=' + seed + ' FAIL (' + (Date.now() - t1) + 'ms)'); continue; }
    console.log('  seed=' + seed + ': exact=' + exactCount(n, m.grid, 5) + ' page=' + ctx.__cs(n, m.grid, 5) +
      ' err=' + validate(n, m.grid, m.sol) + ' conn=' + connectedOK(n, m.grid) +
      ' sizes=' + Math.min(...m.sizes) + '..' + Math.max(...m.sizes) +
      ' (' + (Date.now() - t1) + 'ms)');
  }
  console.log('total ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
