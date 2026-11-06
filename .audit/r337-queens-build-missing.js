#!/usr/bin/env node
/* R337 queens — FAST targeted builder for the levels the main build is still
 * grinding on (the n=10 / n=11 tail).
 *
 * Why this is faster than the main builder:
 *   The main builder used MAXREG=24. A region with up to 24 candidate cells
 *   gives the uniqueness DFS a huge branching factor, so the 120000-node cap
 *   was hit before the search could exhaust the alternatives — which is
 *   exactly what you need to PROVE uniqueness. Tighter region bounds (the
 *   ORIGINAL shipped catalog used regions of ~4-12 cells) make the search
 *   finish, so uniqueness is provable in seconds instead of an hour.
 *
 * Writes INCREMENTALLY to .audit/r337-q-missing.json so a partial run is
 * still usable, and prints the same three-way verification as the main
 * builder (own enumerator + the page's own countSolutions + an
 * assumption-free brute force).
 */
const fs = require('fs');
const path = require('path');
const G = require('./r337-queens-gen7.js');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const HERE = __dirname;
const OUT = path.join(HERE, 'r337-q-missing.json');

/* the 7 levels the main build has not produced yet */
const TARGETS = [
  { id: 20, n: 10 }, { id: 25, n: 11 }, { id: 26, n: 11 }, { id: 27, n: 11 },
  { id: 28, n: 11 }, { id: 29, n: 11 }, { id: 30, n: 11 }
];

/* assumption-free brute force — separate implementation (same as the main build) */
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
  /* tighter bounds than the main builder — see the header note */
  const MINREG = 3;
  const MAXREG = n >= 11 ? 14 : 13;
  let made = null, madeSol = null, tries = 0;
  let seed = seedBase;
  while (!made && tries < 4000) {
    tries++;
    seed++;
    const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n + 7777));
    if (!sol) continue;
    for (let att = 0; att < 6 && !made; att++) {
      const g = G.buildUnique(n, sol, G.mulberry32(seed * 7919 + n * 104729 + att * 977 + 31337), 400000, MINREG, MAXREG);
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
    for (let r = 0; r < n; r++) if (made[r][R] === R) k++;
    sizes.push(k);
  }
  const minS = Math.min.apply(null, sizes), maxS = Math.max.apply(null, sizes);
  const pass = exact === 1 && page === 1 && brute === 1 && !err && !conn && minS >= MINREG && maxS <= MAXREG;
  if (!pass) {
    return { id, n, error: 'verify failed exact=' + exact + ' page=' + page + ' brute=' + brute +
      ' val=' + (err || 'ok') + ' conn=' + (conn || 'ok') + ' size=' + minS + '..' + maxS };
  }
  return { id, n, tries, regionSize: minS + '..' + maxS, levels: { id, n, solution: madeSol, regions: made } };
}

if (!isMainThread) {
  const r = buildOne(workerData.n, workerData.id, workerData.seedBase);
  parentPort.postMessage(r);
  return;
}

/* ---------------- main ---------------- */
const saved = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const results = [];
let done = 0;
const t0 = Date.now();

function flush() {
  fs.writeFileSync(OUT, JSON.stringify(results.filter(Boolean), null, 1));
}

const queue = TARGETS.slice();

function launch() {
  while (queue.length) {
    const t = queue.shift();
    if (saved[t.id]) { results.push(saved[t.id]); done++; continue; }
    const w = new Worker(__filename, { workerData: { n: t.n, id: t.id, seedBase: 100000 + t.id * 5000 } });
    w.on('message', r => {
      if (r && r.levels) {
        console.log('L' + r.id + ' n=' + r.n + ' OK  regionSize ' + r.regionSize + '  tries=' + r.tries + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
        saved[t.id] = r;
      } else {
        console.log('L' + t.id + ' n=' + t.n + ' FAIL ' + (r && r.error));
      }
      results.push(r);
      done++;
      flush();
      w.terminate();
    });
    w.on('error', e => { console.log('L' + t.id + ' WORKER ERROR ' + e.message); results.push({ id: t.id, n: t.n, error: e.message }); done++; flush(); });
  }
}
launch();
const iv = setInterval(() => {
  if (done >= TARGETS.length) {
    clearInterval(iv);
    const bad = results.filter(r => !r || !r.levels);
    flush();
    if (bad.length) { console.error('FAILED levels: ' + bad.length + ' -> ' + bad.map(b => b.id).join(',')); process.exit(1); }
    console.log('---');
    console.log('wrote ' + results.length + ' levels to ' + OUT);
    process.exit(0);
  }
}, 300);
