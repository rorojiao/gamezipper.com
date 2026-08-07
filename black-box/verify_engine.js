// Static verifier for black-box (sweep 45, 2026-08-08).
// Re-implements Tatham's blackbox ray-tracing algorithm and verifies that
// each level's `clues` (ray outcomes from each of the 4N entry ports) match
// the level's `atoms` (the hidden solution). 27/27 PASS confirmed 2026-08-08.
//
// Usage: node black-box/verify_engine.js
// Exit 0 = all clues match, exit 1 = mismatch

'use strict';
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = HTML.match(/const LEVELS=(\[[\s\S]*?\]);/);
if (!m) { console.error('cannot find LEVELS'); process.exit(1); }
const LEVELS = eval(m[1]);
console.log(`Loaded ${LEVELS.length} levels`);

// Constants from black-box/index.html
const DXDY = [[0,-1],[1,0],[0,1],[-1,0]]; // up, right, down, left
const HIT = -1, REFLECT = -2;
const FWD = 1, LFT = 0, RGT = 2;

function buildPorts(N) {
  const ports = [];
  const c2p = new Map();
  for (let x = 1; x <= N; x++) {
    ports.push({ x, y: 0, dir: 2 }); // down
    c2p.set(`${x},0`, ports.length - 1);
  }
  for (let y = 1; y <= N; y++) {
    ports.push({ x: N+1, y, dir: 3 }); // left
    c2p.set(`${N+1},${y}`, ports.length - 1);
  }
  for (let x = N; x >= 1; x--) {
    ports.push({ x, y: N+1, dir: 0 }); // up
    c2p.set(`${x},${N+1}`, ports.length - 1);
  }
  for (let y = N; y >= 1; y--) {
    ports.push({ x: 0, y, dir: 1 }); // right
    c2p.set(`0,${y}`, ports.length - 1);
  }
  return { ports, c2p };
}

function isBall(occ, N, x, y, dir, look) {
  let nx = x + DXDY[dir][0];
  let ny = y + DXDY[dir][1];
  if (look === LFT) {
    const d = (dir + 3) % 4;
    nx += DXDY[d][0]; ny += DXDY[d][1];
  } else if (look === RGT) {
    const d = (dir + 1) % 4;
    nx += DXDY[d][0]; ny += DXDY[d][1];
  }
  if (nx < 0 || nx > N+1 || ny < 0 || ny > N+1) return false;
  return occ[ny][nx];
}

function fireRay(occ, N, ports, c2p, idx) {
  const e = ports[idx];
  let x = e.x, y = e.y, dir = e.dir;
  if (isBall(occ, N, x, y, dir, FWD)) return HIT;
  if (isBall(occ, N, x, y, dir, LFT) || isBall(occ, N, x, y, dir, RGT)) return REFLECT;
  x += DXDY[dir][0]; y += DXDY[dir][1];
  let guard = 0;
  while (guard++ < 8*N*N + 64) {
    if (x < 1 || x > N || y < 1 || y > N) {
      const ex = c2p.get(`${x},${y}`);
      return ex === undefined ? REFLECT : (ex === idx ? REFLECT : ex);
    }
    if (isBall(occ, N, x, y, dir, FWD)) return HIT;
    if (isBall(occ, N, x, y, dir, LFT)) { dir = (dir + 1) % 4; continue; }
    if (isBall(occ, N, x, y, dir, RGT)) { dir = (dir + 3) % 4; continue; }
    x += DXDY[dir][0]; y += DXDY[dir][1];
  }
  return REFLECT;
}

function verifyLevel(lv) {
  const N = lv.N;
  const atoms = lv.atoms;
  const clues = lv.clues;
  const { ports, c2p } = buildPorts(N);
  if (ports.length !== clues.length) {
    return { ok: false, msg: `port count mismatch: ${ports.length} vs ${clues.length}` };
  }
  const occ = [];
  for (let y = 0; y <= N+1; y++) occ.push(new Array(N+2).fill(false));
  for (const [ax, ay] of atoms) occ[ay][ax] = true;
  for (let i = 0; i < clues.length; i++) {
    const actual = fireRay(occ, N, ports, c2p, i);
    if (actual !== clues[i]) {
      return { ok: false, msg: `port ${i}: expected ${clues[i]}, got ${actual}` };
    }
  }
  return { ok: true };
}

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const r = verifyLevel(LEVELS[i]);
  if (r.ok) pass++;
  else { fail++; console.error(`FAIL level idx=${i} id=${LEVELS[i].id || i+1}: ${r.msg}`); }
}
console.log(`PASS ${pass}/${LEVELS.length}`);
process.exit(fail > 0 ? 1 : 0);