#!/usr/bin/env node
/* R337 queens — PRODUCTION level generator (parallel, one worker per level).
 *
 * Writes .audit/queens-puzzle-data.new.js with a new PUZZLE_DATA catalog where
 * EVERY level is UNIQUELY SOLVABLE and CONNECTED.
 *
 * INDEPENDENT VERIFICATION — three separate implementations must agree:
 *   1. our own exact enumerator (exactCount, limit=5)
 *   2. the PAGE's own countSolutions() (parsed out of queens/index.html)
 *   3. an assumption-free brute force written from the engine's rule list
 * Plus: every region connected, region size sane, stored solution valid.
 */
const fs = require('fs');
const path = require('path');
const G = require('./r337-queens-gen7.js');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const HERE = __dirname;

/* assumption-free brute force — separate implementation */
function bruteCount(n, regions) {
  let count = 0;
  const colHas = new Array(n).fill(false);
  const regHas = new Map();
  const placed = new Array(n).fill(-1);
  function pairwiseValid() {
    const rows = new Set(), cols = new Set(), regs = new Set();
    for (let r = 0; r < n; r++) {
      const c = placed[r];
      if (c < 0) return false;
      if (rows.has(r)) return false; rows.add(r);
      if (cols.has(c)) return false; cols.add(c);
      const reg = regions[r][c];
      if (regs.has(reg)) return false; regs.add(reg);
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 && Math.abs(placed[i] - placed[j]) <= 1) return false;
    }
    return true;
  }
  (function bt(row) {
    if (count >= 5) return;
    if (row === n) { if (pairwiseValid()) count++; return; }
    for (let c = 0; c < n; c++) {
      if (colHas[c]) continue;
      const reg = regions[row][c];
      if (regHas.get(reg)) continue;
      if (row > 0 && Math.abs(placed[row - 1] - c) <= 1) continue;
      placed[row] = c; colHas[c] = true; regHas.set(reg, true);
      bt(row + 1);
      colHas[c] = false; regHas.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}

function buildOne(n, id, seedBase) {
  const MINREG = 3;
  const MAXREG = 24;
  let made = null, madeSol = null, tries = 0;
  let seed = seedBase;
  while (!made && tries < 600) {
    tries++;
    seed++;
    const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n));
    if (!sol) continue;
    for (let att = 0; att < 8 && !made; att++) {
      const g = G.buildUnique(n, sol, G.mulberry32(seed * 7919 + n * 104729 + att * 977), 120000, MINREG, MAXREG);
      if (!g) continue;
      made = g; madeSol = sol;
    }
  }
  if (!made) return { id, n, error: 'no map after ' + tries + ' tries' };
  const exact = G.exactCount(n, made, 5);
  const page = G.ctx.__cs(n, made, 5);
  const brute = bruteCount(n, made);
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
  // 5 tiers x 6 levels. buildLevelSelect() in index.html renders tier t as
  // gridSize (t+7) for level indexes t*6 .. t*6+5, so the SIZES array MUST be
  // grouped 6x7, 6x8, 6x9, 6x10, 6x11 in that exact order.
  const SIZES = [];
  for (const n of [7, 8, 9, 10, 11]) for (let k = 0; k < 6; k++) SIZES.push(n);
  const t0 = Date.now();
  const results = [];
  let done = 0;
  const CONCURRENCY = 6;
  let next = 0;
  function launch() {
    while (next < SIZES.length && results.filter(Boolean).length - next < CONCURRENCY) {
      const i = next++;
      const n = SIZES[i];
      const w = new Worker(__filename, { workerData: { n, id: i + 1, seedBase: 1000 + i * 37 } });
      w.on('message', m => {
        results[i] = m;
        done++;
        if (m.error) console.log('L' + m.id + ' n=' + m.n + ' ERROR: ' + m.error);
        else if (!m.pass) console.log('L' + m.id + ' n=' + m.n + ' VERIFY FAIL exact=' + m.exact + ' page=' + m.page + ' brute=' + m.brute + ' err=' + m.err + ' conn=' + m.conn + ' minS=' + m.minS);
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
      if (bad.length) { console.error('FAILED levels: ' + bad.length); process.exit(1); }
      const out = results.map(r => r.levels);
      const js = 'var PUZZLE_DATA=' + JSON.stringify(out) + ';';
      fs.writeFileSync(path.join(HERE, 'queens-puzzle-data.new.js'), js);
      console.log('---');
      console.log('wrote ' + out.length + ' levels (' + js.length + ' bytes) in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
    }
  }, 300);
}
