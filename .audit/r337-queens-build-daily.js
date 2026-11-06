#!/usr/bin/env node
/* R337 queens — DAILY PUZZLE POOL builder.
 *
 * WHY: the in-page daily generator (generatePuzzle) is 100% broken —
 * tryMakeRegions() grows regions greedily and the result is essentially
 * never uniquely solvable, so countSolutions() never returns 1 and the
 * function ALWAYS falls through to its "not unique" fallback. Measured over
 * 60 daily seeds: 0 unique, 60 non-unique.
 *
 * The constructive algorithm (gen7 buildUnique) is correct but too slow to
 * run in the browser (2-28 s per puzzle for n=7..11 under load). So the
 * daily pool is generated OFFLINE here and shipped in the page, exactly like
 * the level catalog.
 *
 * Every puzzle is verified by THREE independent implementations:
 *   1. exactCount  (assumption-free enumeration)
 *   2. the PAGE's own countSolutions()
 *   3. bruteCount  (leaf-only adjacency check — a different code path)
 * plus: stored solution accepted by the engine predicate, every region
 * connected, region sizes sane.
 */
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const HERE = __dirname;
const G = require('./r337-queens-gen7.js');

/* ---- assumption-free brute force (separate implementation) ---- */
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
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}

const MINREG = 3, MAXREG = 24;

function buildOne(n, id, seedBase) {
  let made = null, madeSol = null, tries = 0;
  let seed = seedBase;
  while (!made && tries < 900) {
    tries++;
    seed++;
    const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n));
    if (!sol) continue;
    for (let att = 0; att < 8 && !made; att++) {
      const g = G.buildUnique(n, sol, G.mulberry32(seed * 7919 + n * 104729 + att * 977), 150000, MINREG, MAXREG);
      if (!g) continue;
      made = g; madeSol = sol;
    }
  }
  if (!made) return { id, n, error: 'no map after ' + tries + ' tries' };
  const exact = G.exactCount(n, made, 5);
  const page = G.ctx.__cs(n, made, 5);
  const brute = bruteCount(n, made, 5);
  const err = G.validate(n, made, madeSol);
  const conn = G.connectedOK(n, made);
  const sizes = [];
  for (let R = 0; R < n; R++) {
    let k = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (made[r][c] === R) k++;
    sizes.push(k);
  }
  const minS = Math.min(...sizes), maxS = Math.max(...sizes);
  const pass = (exact === 1 && page === 1 && brute === 1 && err === null && conn && minS >= MINREG && maxS <= MAXREG);
  return {
    id, n, pass, exact, page, brute, err, conn, minS, maxS, tries,
    levels: pass ? { id, n, solution: madeSol, regions: made } : null,
  };
}

if (!isMainThread) {
  const r = buildOne(workerData.n, workerData.id, workerData.seedBase);
  parentPort.postMessage(r);
} else {
  /* The daily uses n = 8 + (seed % 4) -> 8,9,10,11. Ship a pool covering
     all four sizes, 8 each = 32 daily puzzles (a month+ of unique dailies
     before the pool repeats). */
  const SIZES = [];
  for (let k = 0; k < 8; k++) for (const n of [8, 9, 10, 11]) SIZES.push(n);
  const CONCURRENCY = 3;   // keep the main level build's 6 workers headroom
  const t0 = Date.now();
  const results = [];
  let done = 0, next = 0;
  function launch() {
    while (next < SIZES.length && results.filter(Boolean).length - next < CONCURRENCY) {
      const i = next++;
      const n = SIZES[i];
      const w = new Worker(__filename, { workerData: { n, id: i + 1, seedBase: 500000 + i * 911 } });
      w.on('message', m => {
        results[i] = m; done++;
        if (m.error) console.log('D' + m.id + ' n=' + m.n + ' ERROR: ' + m.error);
        else if (!m.pass) console.log('D' + m.id + ' n=' + m.n + ' VERIFY FAIL exact=' + m.exact + ' page=' + m.page + ' brute=' + m.brute + ' err=' + m.err + ' conn=' + m.conn + ' minS=' + m.minS);
        else console.log('D' + m.id + ' n=' + m.n + ' OK  regionSize ' + m.minS + '..' + m.maxS + '  tries=' + m.tries + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
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
      if (bad.length) { console.error('FAILED daily levels: ' + bad.length); process.exit(1); }
      const out = results.map(r => r.levels);
      const js = 'var DAILY_PUZZLE_DATA=' + JSON.stringify(out) + ';';
      fs.writeFileSync(path.join(HERE, 'queens-daily-data.new.js'), js);
      console.log('---');
      console.log('wrote ' + out.length + ' daily puzzles (' + js.length + ' bytes) in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
      process.exit(0);
    }
  }, 300);
}
