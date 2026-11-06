#!/usr/bin/env node
/* R337 queens — DAILY PUZZLE POOL builder.
 *
 * WHY: the in-page daily generator (generatePuzzle) is 100% broken.
 * tryMakeRegions() grows regions greedily and the result is essentially never
 * uniquely solvable, so countSolutions() never returns 1 and the function
 * ALWAYS falls through to its "not unique" fallback. Measured over 20 daily
 * seeds: 0 unique, 20 non-unique. The page advertised a unique-solution
 * daily it never delivered, and the fallback path also cost 2-28s per puzzle
 * (a visible freeze on the daily button).
 *
 * The constructive generator is correct but too slow to run in the browser
 * (2-28s per puzzle for n=7..11 under load), so the daily pool is generated
 * OFFLINE here and shipped in the page, exactly like the level catalog.
 *
 * The pool holds 14 puzzles (2 weeks) at n=9..11 so consecutive dailies do
 * not repeat. Every puzzle is verified by THREE independent counters plus a
 * connectivity and stored-solution check.
 */
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const HERE = __dirname;
const G = require('./r337-queens-gen11.js');

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

const BAND = { 9: { min: 4, max: 12 }, 10: { min: 3, max: 15 }, 11: { min: 3, max: 16 } };
const SEEDS = 60;

function buildOne(n, id, seedBase) {
  const band = BAND[n];
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
    const score = Math.max(0, band.min - mn) + Math.max(0, mx - band.max);
    if (score < bestScore) { bestScore = score; best = { sol, grid, mn, mx }; }
    if (score === 0) break;
  }
  if (!best) return { id, n, error: 'no unique map' };
  const exact = G.exactCount(n, best.grid, 5);
  const page = G.ctx.__cs(n, best.grid, 5);
  const brute = bruteCount(n, best.grid, 5);
  const err = G.validate(n, best.grid, best.sol);
  const conn = G.connectedOK(n, best.grid);
  const pass = (exact === 1 && page === 1 && brute === 1 && err === null && conn &&
                best.mn >= band.min && best.mx <= band.max);
  return {
    id, n, pass, exact, page, brute, err, conn, mn: best.mn, mx: best.mx,
    levels: pass ? { id: 'daily' + id, n, solution: best.sol, regions: best.grid } : null,
  };
}

if (!isMainThread) {
  parentPort.postMessage(buildOne(workerData.n, workerData.id, workerData.seedBase));
} else {
  /* 14 dailies: 5 x n=9, 5 x n=10, 4 x n=11 */
  const SIZES = [];
  for (const n of [9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 11, 11, 11, 11]) SIZES.push(n);
  const t0 = Date.now();
  const results = new Array(SIZES.length).fill(null);
  let done = 0;
  const CONCURRENCY = 14;
  let next = 0;
  const live = [];
  function launch() {
    while (next < SIZES.length && live.length < CONCURRENCY) {
      const i = next++;
      const n = SIZES[i];
      const w = new Worker(__filename, { workerData: { n, id: i + 1, seedBase: 500000 + i * 613 } });
      live.push(w);
      w.on('message', m => {
        results[i] = m; done++;
        live.splice(live.indexOf(w), 1);
        if (m.error) console.log('D' + m.id + ' n=' + m.n + ' ERROR: ' + m.error);
        else if (!m.pass) console.log('D' + m.id + ' n=' + m.n + ' FAIL exact=' + m.exact + ' page=' + m.page + ' brute=' + m.brute + ' err=' + m.err + ' conn=' + m.conn + ' sizes=' + m.mn + '..' + m.mx);
        else console.log('D' + m.id + ' n=' + m.n + ' OK sizes=' + m.mn + '..' + m.mx + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
        w.terminate();
      });
      w.on('error', e => { console.log('D' + (i + 1) + ' worker error: ' + e.message); done++; });
    }
  }
  launch();
  const iv = setInterval(() => {
    launch();
    if (done >= SIZES.length) {
      clearInterval(iv);
      const bad = results.filter(r => !r || !r.pass);
      if (bad.length) {
        console.error('FAILED dailies: ' + bad.length + ' -> ' + bad.map(b => b && b.id).join(','));
        process.exit(1);
      }
      const out = results.map(r => r.levels);
      fs.writeFileSync(path.join(HERE, 'queens-daily-data.new.js'), 'var DAILY_PUZZLE_DATA=' + JSON.stringify(out) + ';');
      console.log('---');
      console.log('wrote ' + out.length + ' daily puzzles in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
    }
  }, 300);
}
