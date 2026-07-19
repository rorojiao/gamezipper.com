#!/usr/bin/env node
// IDDFS solver for code-robot L27 (Spiral Trap). Prints short program if exists.
const path = require('path');
const extract = require(path.join(__dirname, 'gz-extract-levels.js'));
const lv = extract('code-robot')[26];
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

function genUseful(maxLen) {
  const out = [];
  const rec = (p) => {
    if (p.length === maxLen) {
      if (p.includes('LIT') && p.some(c => c === 'FWD' || c === 'JMP')) out.push(p.join(','));
      return;
    }
    for (const c of BASE) rec(p.concat(c));
  };
  rec([]);
  return out;
}
const p1Str = genUseful(lv.p1);
const p2Str = genUseful(lv.p2);
console.error('P1 useful:', p1Str.length, 'P2 useful:', p2Str.length);

const LTS_CACHE = new Map();
function buildLTS(seqStr) {
  if (LTS_CACHE.has(seqStr)) return LTS_CACHE.get(seqStr);
  const seq = seqStr.split(',');
  const map = new Map();
  for (let r = 0; r < lv.gridH; r++) for (let c = 0; c < lv.gridW; c++)
    if (lv.grid[r][c] !== 'X' && lv.grid[r][c] !== 'H')
      for (let d = 0; d < 4; d++) for (let m = 0; m <= allMask; m++) {
        let st = { r, c, d, m }, ok = true;
        for (const cmd of seq) { const ns = trans(st, cmd, li); if (!ns) { ok = false; break; } st = ns; }
        if (ok) map.set(r + ',' + c + ',' + d + ',' + m, st);
      }
  LTS_CACHE.set(seqStr, map);
  return map;
}

function solve(st, depth, path) {
  if (lv.grid[st.r][st.c] === 'G' && st.m === allMask) return path;
  if (depth === 0) return null;
  for (const cmd of BASE) {
    const ns = trans(st, cmd, li);
    if (!ns) continue;
    const r = solve(ns, depth - 1, path.concat(cmd));
    if (r) return r;
  }
  for (const seqStr of p1Str) {
    const lts = buildLTS(seqStr);
    const ns = lts.get(st.r + ',' + st.c + ',' + st.d + ',' + st.m);
    if (!ns) continue;
    const r = solve(ns, depth - 1, path.concat('P1[' + seqStr + ']'));
    if (r) return r;
  }
  for (const seqStr of p2Str) {
    const lts = buildLTS(seqStr);
    const ns = lts.get(st.r + ',' + st.c + ',' + st.d + ',' + st.m);
    if (!ns) continue;
    const r = solve(ns, depth - 1, path.concat('P2[' + seqStr + ']'));
    if (r) return r;
  }
  return null;
}

const start = { r: sr, c: sc, d: lv.startDir, m: 0 };
const t0 = Date.now();
for (let d = 1; d <= lv.slots; d++) {
  console.error('Trying depth', d, '...');
  const t1 = Date.now();
  const sol = solve(start, d, []);
  console.error('  took', (Date.now() - t1) + 'ms');
  if (sol) {
    console.log('SOLUTION depth', d, ':', sol.join(' | '));
    process.exit(0);
  }
  if (Date.now() - t0 > 55000) { console.error('soft timeout'); process.exit(1); }
}
console.log('NO SOL');
