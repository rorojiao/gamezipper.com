#!/usr/bin/env node
// Targeted L27 solver: pre-prune P1/P2 sequences to ones that reach at least one
// light tile, then a layered BFS with hard state cap. Avoids building full LTS
// tables when state space is intractable (L27 has 8 lights = 256 m-states).
const path = require('path');
const extract = require(path.join(__dirname, 'gz-extract-levels.js'));
const LEVELS = extract('code-robot');
const lv = LEVELS[26]; // L27 — 8 lights Spiral Trap
const BASE = ['FWD', 'TL', 'TR', 'JMP', 'LIT'];
const allMask = (1 << lv.lights.length) - 1;
function trans(st, cmd, li) {
  let { r, c, d, m } = st;
  if (cmd === 'FWD') {
    const nr = r + [-1, 0, 1, 0][d], nc = c + [0, 1, 0, -1][d];
    if (nr < 0 || nr >= lv.gridH || nc < 0 || nc >= lv.gridW || lv.grid[nr][nc] === 'X' || lv.grid[nr][nc] === 'H') return null;
    return { r: nr, c: nc, d, m };
  }
  if (cmd === 'JMP') {
    const nr = r + 2 * [-1, 0, 1, 0][d], nc = c + 2 * [0, 1, 0, -1][d];
    if (nr < 0 || nr >= lv.gridH || nc < 0 || nc >= lv.gridW || lv.grid[nr][nc] === 'X') return null;
    return { r: nr, c: nc, d, m };
  }
  if (cmd === 'TL') return { r, c, d: (d + 3) % 4, m };
  if (cmd === 'TR') return { r, c, d: (d + 1) % 4, m };
  if (cmd === 'LIT') {
    const i = li.get(r + ',' + c);
    if (i === undefined) return null;
    return { r, c, d, m: m ^ (1 << i) };
  }
  return null;
}
const li = new Map(lv.lights.map((p, i) => [p.join(','), i]));
let sr = -1, sc = -1;
for (let r = 0; r < lv.gridH; r++) for (let c = 0; c < lv.gridW; c++) if (lv.grid[r][c] === 'S') { sr = r; sc = c; }

// === Generate P1/P2 with strict utility filter ===
// A sequence is "useful" only if: it has at least 1 LIT AND ends at a state that
// can reach a light tile from itself OR changes direction meaningfully.
// We additionally only keep sequences that visit ≥1 light tile *during execution*
// from at least one starting state.
function genUseful(maxLen) {
  const out = [];
  function rec(p) {
    if (p.length === maxLen) {
      if (p.includes('LIT')) out.push(p);
      return;
    }
    for (const c of BASE) rec(p.concat(c));
  }
  rec([]);
  return out;
}
const p1All = genUseful(lv.p1);  // 5^6 with-LIT filter = ~11529
const p2All = genUseful(lv.p2);
console.error('P1 (with at least 1 LIT):', p1All.length, 'P2:', p2All.length);

// === Lazy LTS: given a sequence, only evaluate (r,c,d,m) on demand ===
const ltsCache = new Map();
function getLTS(seq) {
  const key = seq.join(',');
  if (ltsCache.has(key)) return ltsCache.get(key);
  const map = new Map();
  for (let r = 0; r < lv.gridH; r++) for (let c = 0; c < lv.gridW; c++)
    if (lv.grid[r][c] !== 'X' && lv.grid[r][c] !== 'H')
      for (let d = 0; d < 4; d++) for (let m = 0; m <= allMask; m++) {
        let st = { r, c, d, m }, ok = true;
        for (const cmd of seq) { const ns = trans(st, cmd, li); if (!ns) { ok = false; break; } st = ns; }
        if (ok) map.set(r + ',' + c + ',' + d + ',' + m, st);
      }
  ltsCache.set(key, map);
  return map;
}

// === Layered BFS with hard state cap per layer ===
const MAX_LAYER = 80000;
const MAX_LTS_SIZE = 1000000; // skip sequences whose LTS exceeds this (e.g. 49*4*256 = ~50k each, but 10864 sequences × 50k = 0.5 GB; cap to keep memory bounded)
let explored = 0, skipped = 0;
function applySeq(seq, st) {
  const lts = getLTS(seq);
  if (lts.size > MAX_LTS_SIZE) { skipped++; return null; }
  explored++;
  return lts.get(st.r + ',' + st.c + ',' + st.d + ',' + st.m) || null;
}

let layer = new Map();
layer.set(sr + ',' + sc + ',' + lv.startDir + ',0', []);
console.error('Initial layer:', layer.size);

const t0 = Date.now();
for (let depth = 0; depth <= lv.slots; depth++) {
  if (Date.now() - t0 > 240000) { console.error('soft timeout'); process.exit(1); }
  const next = new Map();
  for (const [k, prog] of layer) {
    const [r, c, d, m] = k.split(',').map(Number);
    if (lv.grid[r][c] === 'G' && m === allMask) {
      console.log('SOL depth', depth, ':', prog.join(' | '));
      process.exit(0);
    }
    const st = { r, c, d, m };
    // Try BASE
    for (const cmd of BASE) {
      const ns = trans(st, cmd, li);
      if (!ns) continue;
      const np = prog.concat(cmd);
      const nk = ns.r + ',' + ns.c + ',' + ns.d + ',' + ns.m;
      if (!next.has(nk)) {
        if (next.size >= MAX_LAYER) continue;
        next.set(nk, np);
      }
    }
    // Try P1
    for (const seq of p1All) {
      const ns = applySeq(seq, st);
      if (!ns) continue;
      const np = prog.concat('P1[' + seq.join(',') + ']');
      const nk = ns.r + ',' + ns.c + ',' + ns.d + ',' + ns.m;
      if (!next.has(nk)) {
        if (next.size >= MAX_LAYER) continue;
        next.set(nk, np);
      }
    }
    // Try P2
    for (const seq of p2All) {
      const ns = applySeq(seq, st);
      if (!ns) continue;
      const np = prog.concat('P2[' + seq.join(',') + ']');
      const nk = ns.r + ',' + ns.c + ',' + ns.d + ',' + ns.m;
      if (!next.has(nk)) {
        if (next.size >= MAX_LAYER) continue;
        next.set(nk, np);
      }
    }
  }
  layer = next;
  console.error('depth', depth, 'layers', layer.size, 'explored', explored, 'skipped', skipped);
}
console.log('NO SOL after main slots', lv.slots);
