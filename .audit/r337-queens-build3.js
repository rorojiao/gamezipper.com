#!/usr/bin/env node
/* R337 queens — PRODUCTION level builder (parallel, best-of-N per level).
 *
 * Builds a NEW PUZZLE_DATA catalog where every level is:
 *   - UNIQUELY SOLVABLE (exactly ONE solution, proven by 3 independent counters)
 *   - CONNECTED (every region 4-connected)
 *   - BALANCED (region sizes inside a band, so no region swallows the board
 *     and no region is a 1-cell giveaway)
 *
 * ALGORITHM (see r337-queens-gen11.js for the generator itself):
 *   phase 1  fast unique search  (no size constraints -> ~10ms/level)
 *   phase 2  hill-climb balance   (moves cells between regions, re-verifying
 *            uniqueness after EVERY move)
 *
 * Each level is attempted with up to SEEDS different random seeds; the
 * attempt whose size distribution best fits the band wins. Levels are built
 * in parallel worker threads (one worker per level).
 *
 * THREE-WAY VERIFICATION (all must say count === 1):
 *   1. exactCount   — our own assumption-free enumeration
 *   2. countSolutions — the PAGE's own function, parsed verbatim from
 *                      queens/index.html (so the shipped engine agrees)
 *   3. bruteCount   — a leaf-only adjacency check (a different code path)
 */
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const HERE = __dirname;
const G = require('./r337-queens-gen11.js');

/* assumption-free brute force (leaf-only adjacency check) */
function bruteCount(n, regions, limit) {
  let count = 0;
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (count >= limit) return;
    if (row === n) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 && Math.abs(placed[i] - placed[j]) <= 1) return;
      }
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(placed[row - 1] - c) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}

/* size band per grid size — derived from the SHIPPED catalog, widened a little
 * where the uniqueness proof makes the tight band unreachable.
 *   shipped: n=7 4..9   n=8 5..11  n=9 6..12  n=10 8..14  n=11 8..14
 * The lower bound matters most (a 1-cell region gives the queen position away
 * for free); the upper bound is cosmetic (a huge region makes the puzzle
 * easier but is not broken). */
const BAND = {
  7: { min: 4, max: 9 },
  8: { min: 4, max: 11 },
  9: { min: 4, max: 12 },
  10: { min: 3, max: 15 },
  11: { min: 3, max: 16 },
};
const SEEDS = 40;

function buildOne(n, id, seedBase) {
  const band = BAND[n];
  const avg = n;
  let best = null, bestScore = Infinity;
  for (let s = 0; s < SEEDS; s++) {
    const seed = seedBase + s * 7919;
    const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n));
    if (!sol) continue;
    const grid = G.buildUniqueFast(n, sol, G.mulberry32(seed * 7919 + n * 104729), 400000);
    if (!grid) continue;
    G.balanceRegions(n, grid, sol, 400);
    const sizes = new Array(n).fill(0);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] >= 0) sizes[grid[r][c]]++;
    const mn = Math.min(...sizes), mx = Math.max(...sizes);
    // score: 0 when the band is met, otherwise how far outside it is
    const score = Math.max(0, band.min - mn) + Math.max(0, mx - band.max);
    if (score < bestScore) {
      bestScore = score; best = { sol, grid, sizes, mn, mx };
    }
    if (score === 0) break;      // band met -> good enough, stop early
  }
  if (!best) return { id, n, error: 'no unique map in ' + SEEDS + ' seeds' };

  const exact = G.exactCount(n, best.grid, 5);
  const page = G.ctx.__cs(n, best.grid, 5);
  const brute = bruteCount(n, best.grid, 5);
  const err = G.validate(n, best.grid, best.sol);
  const conn = G.connectedOK(n, best.grid);
  const pass = (exact === 1 && page === 1 && brute === 1 && err === null && conn &&
                best.mn >= band.min && best.mx <= band.max);
  return {
    id, n, pass, exact, page, brute, err, conn,
    mn: best.mn, mx: best.mx, band,
    levels: pass ? { id, n, solution: best.sol, regions: best.grid } : null,
  };
}

if (!isMainThread) {
  parentPort.postMessage(buildOne(workerData.n, workerData.id, workerData.seedBase));
} else {
  /* buildLevelSelect() renders tier t as gridSize (t+7) for level indexes
   * t*6 .. t*6+5, so SIZES MUST be grouped 6x7, 6x8, 6x9, 6x10, 6x11. */
  const SIZES = [];
  for (const n of [7, 8, 9, 10, 11]) for (let k = 0; k < 6; k++) SIZES.push(n);
  const t0 = Date.now();
  const results = new Array(SIZES.length).fill(null);
  let done = 0;
  const CONCURRENCY = 12;
  let next = 0;
  const live = [];
  function launch() {
    while (next < SIZES.length && live.length < CONCURRENCY) {
      const i = next++;
      const n = SIZES[i];
      const w = new Worker(__filename, { workerData: { n, id: i + 1, seedBase: 1000 + i * 37 } });
      live.push(w);
      w.on('message', m => {
        results[i] = m; done++;
        live.splice(live.indexOf(w), 1);
        if (m.error) console.log('L' + m.id + ' n=' + m.n + ' ERROR: ' + m.error);
        else if (!m.pass) console.log('L' + m.id + ' n=' + m.n + ' FAIL exact=' + m.exact + ' page=' + m.page + ' brute=' + m.brute + ' err=' + m.err + ' conn=' + m.conn + ' sizes=' + m.mn + '..' + m.mx + ' band=' + m.band.min + '..' + m.band.max);
        else console.log('L' + m.id + ' n=' + m.n + ' OK  sizes=' + m.mn + '..' + m.mx + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
        w.terminate();
      });
      w.on('error', e => { console.log('L' + (i + 1) + ' worker error: ' + e.message); done++; });
    }
  }
  launch();
  const iv = setInterval(() => {
    launch();
    if (done >= SIZES.length) {
      clearInterval(iv);
      const bad = results.filter(r => !r || !r.pass);
      if (bad.length) {
        console.error('FAILED levels: ' + bad.length + ' -> ' + bad.map(b => b && b.id).join(','));
        process.exit(1);
      }
      const out = results.map(r => r.levels);
      fs.writeFileSync(path.join(HERE, 'queens-puzzle-data.new.js'), 'var PUZZLE_DATA=' + JSON.stringify(out) + ';');
      console.log('---');
      console.log('wrote ' + out.length + ' levels in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
    }
  }, 300);
}
