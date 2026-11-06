#!/usr/bin/env node
/* R337 queens — production catalog builder (parallel workers).
 *
 * Builds a NEW PUZZLE_DATA catalog where EVERY level is UNIQUELY SOLVABLE
 * (exactly one solution), CONNECTED, and has sane region sizes.
 *
 * THREE-WAY VERIFICATION (all must agree on count === 1):
 *   1. exactCount   — assumption-free enumeration (our own)
 *   2. page's countSolutions() — parsed verbatim out of queens/index.html
 *   3. bruteCount   — leaf-only adjacency check (a different code path)
 * plus: stored solution valid under the rules, every region 4-connected.
 *
 * Region-size bounds are derived from the SHIPPED catalog so the new levels
 * keep the same visual character:
 *   n=7 -> 4..9   n=8 -> 5..11   n=9 -> 6..12   n=10 -> 8..14   n=11 -> 8..14
 * (tight bounds matter: a loose bound gives the uniqueness DFS a huge
 *  branching factor and the search cannot EXHAUST the alternatives, which is
 *  exactly what is required to PROVE uniqueness.)
 */
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const HERE = __dirname;
const G = require('./r337-queens-gen7.js');

/* ---- assumption-free brute force (leaf-only adjacency check) ---- */
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

/* region-size bounds taken from the shipped catalog */
const BOUNDS = { 7: [4, 9], 8: [5, 11], 9: [6, 12], 10: [8, 14], 11: [8, 14] };

function buildOne(n, id, seedBase) {
  const [MINREG, MAXREG] = BOUNDS[n];
  let made = null, madeSol = null, tries = 0;
  let seed = seedBase;
  while (!made && tries < 4000) {
    tries++;
    seed++;
    const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n));
    if (!sol) continue;
    for (let att = 0; att < 6 && !made; att++) {
      const g = G.buildUnique(n, sol, G.mulberry32(seed * 7919 + n * 104729 + att * 977), 400000, MINREG, MAXREG);
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
  const pass = (exact === 1 && page === 1 && brute === 1 && err === null && conn &&
                minS >= MINREG && maxS <= MAXREG);
  return {
    id, n, pass, exact, page, brute, err, conn, minS, maxS, tries,
    levels: pass ? { id, n, solution: madeSol, regions: made } : null,
  };
}

if (!isMainThread) {
  const r = buildOne(workerData.n, workerData.id, workerData.seedBase);
  parentPort.postMessage(r);
} else {
  /* buildLevelSelect() renders tier t as gridSize (t+7) for level indexes
   * t*6 .. t*6+5, so the SIZES array MUST be grouped 6x7, 6x8, 6x9, 6x10,
   * 6x11 in that exact order. */
  const SIZES = [];
  for (const n of [7, 8, 9, 10, 11]) for (let k = 0; k < 6; k++) SIZES.push(n);
  const t0 = Date.now();
  const results = new Array(SIZES.length).fill(null);
  let done = 0;
  const CONCURRENCY = 10;
  let next = 0;
  const live = [];
  function launch() {
    while (next < SIZES.length && live.length < CONCURRENCY) {
      const i = next++;
      const n = SIZES[i];
      const w = new Worker(__filename, { workerData: { n, id: i + 1, seedBase: 1000 + i * 37 } });
      live.push(w);
      w.on('message', m => {
        results[i] = m;
        done++;
        live.splice(live.indexOf(w), 1);
        if (m.error) console.log('L' + m.id + ' n=' + m.n + ' ERROR: ' + m.error);
        else if (!m.pass) console.log('L' + m.id + ' n=' + m.n + ' VERIFY FAIL exact=' + m.exact + ' page=' + m.page + ' brute=' + m.brute + ' err=' + m.err + ' conn=' + m.conn + ' minS=' + m.minS + ' maxS=' + m.maxS);
        else console.log('L' + m.id + ' n=' + m.n + ' OK  regionSize ' + m.minS + '..' + m.maxS + '  tries=' + m.tries + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
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
      const js = 'var PUZZLE_DATA=' + JSON.stringify(out) + ';';
      fs.writeFileSync(path.join(HERE, 'queens-puzzle-data.new.js'), js);
      console.log('---');
      console.log('wrote ' + out.length + ' levels (' + js.length + ' bytes) in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
    }
  }, 300);
}
