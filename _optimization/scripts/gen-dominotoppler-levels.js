#!/usr/bin/env node
/* Domino Toppler level regenerator (wave-A3).
 * ROOT CAUSE: original levels assumed turn mechanics that do not exist in the engine —
 * a wave propagates strictly in its incoming direction (processSimStep: addToSim with
 * step.dir only); direction changes ONLY at fixed SPLITTER cells, and a TARGET absorbs
 * the wave (returns without propagating). Original data placed targets off every
 * reachable wave line (e.g. L11 targets (12,3)/(12,11) with only row7/col6 reachable)
 * and multiple targets on one line (L2) — unwinnable by construction.
 * This generator builds levels by turtle-walking wave-legal paths (runs + splitter
 * turns + booster gap-jumps), computes the exact player domino placement, validates it
 * with an exact mirror of the engine simulator, then re-simulates with walls added on
 * never-entered cells. Output replaces the level block in domino-toppler/index.html.
 * Usage: node _optimization/scripts/gen-dominotoppler-levels.js   (writes in place) */
'use strict';
const fs = require('fs');
const path = require('path');
const N = 14;
const EMPTY = 0, D = 1, T = 2, S = 4, B = 5, X = 6, W = 7;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const CH2T = { '.': EMPTY, D: D, T: T, S: S, B: B, X: X, W: W };
const NAMES = ['First Push', 'Double Target', 'Going Down', 'Fill the Gaps', 'Twin Lines',
  'L-Turn', 'Z-Path', 'U-Turn', 'Staircase', 'Square Loop',
  'Split Decision', 'Triple Split', 'Fan Out', 'Vertical Split', 'Star Pattern',
  'Around the Wall', 'Pillars', 'Obstacle Maze', 'Blocked Split', 'Gauntlet',
  'Boost', 'Double Boost', 'Boost and Turn', 'Boost Split', 'Boost Highway',
  'Master Mix', 'Grand Split', 'Spiral', 'Cross Roads', 'Final Challenge'];

function lcg(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* exact engine simulator mirror (processSimStep/addToSim/startSimulation) */
function simulate(types, startX, startY, startDir, placement) {
  const ty = types.slice();
  for (const i of placement) ty[i] = D;
  const fell = new Uint8Array(N * N);
  let total = 0; for (let i = 0; i < ty.length; i++) if (ty[i] === T) total++;
  const q = [];
  const push = (x, y, d) => {
    if (x < 0 || x >= N || y < 0 || y >= N) return;
    const i = y * N + x;
    if (fell[i]) return;
    const t = ty[i]; if (t === W) return;
    q.push([x, y, d]);
  };
  push(startX, startY, startDir);
  let hit = 0; const entered = new Set();
  let guard = 0;
  while (q.length) {
    if (++guard > 5000) throw new Error('sim guard');
    const [x, y, d] = q.shift();
    const i = y * N + x;
    if (fell[i]) continue;
    fell[i] = 1; entered.add(i);
    const t = ty[i];
    if (t === EMPTY) continue;
    if (t === T) { hit++; continue; }
    if (t === W) continue;
    if (t === S) {
      push(x + DX[(d + 1) % 4], y + DY[(d + 1) % 4], (d + 1) % 4);
      push(x + DX[(d + 3) % 4], y + DY[(d + 3) % 4], (d + 3) % 4);
      push(x + DX[d], y + DY[d], d);
      continue;
    }
    if (t === B) {
      for (let b = 1; b <= 3; b++) {
        const bx = x + DX[d] * b, by = y + DY[d] * b;
        if (bx < 0 || bx >= N || by < 0 || by >= N) break;
        const bt = ty[by * N + bx];
        if (bt !== EMPTY && bt !== W) { push(bx, by, d); break; }
      }
      continue;
    }
    push(x + DX[d], y + DY[d], d);
  }
  return { hit, total, entered, fell };
}

/* turtle-construct one level; returns null on failure */
function build(rng, idx) {
  const tier = Math.floor(idx / 5) + 1;
  const pieces = new Map(); // idx -> 'X'|'D'|'T'|'S'|'B'
  const placement = [];     // cells needing player dominoes
  const occupied = new Set();
  const fixed = new Set();  // cells that must stay EMPTY (gaps)
  const targets = [];
  const DIR = { E: 1, S: 2, N: 0, W: 3 };
  let sx, sy, dir;
  const vertical = rng() < 0.4;
  if (vertical) { sx = 2 + Math.floor(rng() * 10); sy = 1 + Math.floor(rng() * 3); dir = DIR.S; }
  else { sx = 1 + Math.floor(rng() * 3); sy = 2 + Math.floor(rng() * 10); dir = DIR.E; }
  const si = sy * N + sx;
  pieces.set(si, 'X'); occupied.add(si);
  // decide shape by tier
  let nSplit = [0, 0, 1, 2, 1, 1, 2, 2, 3, 2, 1][tier] !== undefined ? [0, 0, 1, 2, 1, 2][tier] : 2;
  if (tier === 5) nSplit = rng() < 0.5 ? 0 : 1;
  if (tier === 6) nSplit = 1 + Math.floor(rng() * 2);
  let nBoost = tier === 5 ? 1 + (rng() < 0.5 ? 1 : 0) : (tier === 6 ? 1 : 0);
  let nWall = tier === 4 ? 4 + Math.floor(rng() * 4) : (tier === 6 ? 3 + Math.floor(rng() * 3) : 0);

  const maxRuns = 1 + nSplit;          // main + per-split continuation
  const usedSplit = { n: 0 }, usedBoost = { n: 0 };
  let guard = 0;
  const targetsWanted = Math.min(4, 1 + nSplit + (nBoost ? 1 : 0));

  function runOne(h) {
    /* extend head by one run; returns 'T' | 'S' | 'B' | null(fail) */
    const len = 3 + Math.floor(rng() * 4);
    let x = h.x, y = h.y, d = h.dir;
    const cells = [];
    for (let k = 1; k <= len; k++) {
      const nx = x + DX[d] * k, ny = y + DY[d] * k;
      if (nx < 1 || nx > N - 2 || ny < 1 || ny > N - 2) return null;
      const i = ny * N + nx;
      if (occupied.has(i)) return null;
      cells.push(i);
    }
    cells.forEach(i => occupied.add(i));
    // end piece choice
    let end = 'T';
    if (usedSplit.n < nSplit && rng() < 0.75) end = 'S';
    else if (usedBoost.n < nBoost && rng() < 0.6) end = 'B';
    // maybe pre-place a D or two on the run (fixed dominoes)
    for (let k = 0; k < cells.length - 1; k++) {
      if (rng() < 0.12) pieces.set(cells[k], 'D');
      else placement.push(cells[k]);
    }
    const endI = cells[cells.length - 1];
    pieces.set(endI, end);
    if (end === 'T') targets.push(endI);
    return { endI, x: endI % N, y: (endI / N) | 0, d };
  }

  // process: grow tree until all heads ended in T or fails
  const queue = [{ x: sx, y: sy, dir }];
  const leaves = [];
  while (queue.length) {
    if (++guard > 40) return null;
    const h = queue.shift();
    const r = runOne(h);
    if (!r) { // retry shorter run
      const r2 = (() => {
        const len = 2;
        let x = h.x, y = h.y, d = h.dir;
        const cells = [];
        for (let k = 1; k <= len; k++) {
          const nx = x + DX[d] * k, ny = y + DY[d] * k;
          if (nx < 1 || nx > N - 2 || ny < 1 || ny > N - 2) return null;
          const i = ny * N + nx;
          if (occupied.has(i)) return null;
          cells.push(i);
        }
        cells.forEach(i => occupied.add(i));
        for (let k = 0; k < cells.length - 1; k++) { if (rng() < 0.12) pieces.set(cells[k], 'D'); else placement.push(cells[k]); }
        let end = 'T';
        if (usedSplit.n < nSplit && rng() < 0.5) end = 'S';
        const endI = cells[cells.length - 1];
        pieces.set(endI, end);
        if (end === 'T') targets.push(endI);
        return { endI, x: endI % N, y: (endI / N) | 0, d };
      })();
      if (!r2) return null;
      if (pieces.get(r2.endI) === 'T') { leaves.push(r2); continue; }
      usedSplit.n++;
      const d = r2.d;
      const branches = [(d + 1) % 4, (d + 3) % 4, d].filter(() => true);
      const nd = branches[Math.floor(rng() * 3)];
      queue.push({ x: r2.x, y: r2.y, dir: nd });
      continue;
    }
    const end = pieces.get(r.endI);
    if (end === 'T') { leaves.push(r); continue; }
    if (end === 'S') {
      usedSplit.n++;
      const d = r.d;
      const nd = [(d + 1) % 4, (d + 3) % 4, d][Math.floor(rng() * 3)];
      queue.push({ x: r.x, y: r.y, dir: nd });
      // side branch from splitter occasionally → extra target
      if (targetsWanted > leaves.length + queue.length && rng() < 0.6) {
        queue.push({ x: r.x, y: r.y, dir: (nd + 1) % 4 });
      }
      continue;
    }
    if (end === 'B') {
      usedBoost.n++;
      // gap of 2 empty cells, landing 3 ahead
      const d = r.d;
      const lx = r.x + DX[d] * 3, ly = r.y + DY[d] * 3;
      if (lx < 1 || lx > N - 2 || ly < 1 || ly > N - 2) return null;
      const g1 = (r.y + DY[d]) * N + (r.x + DX[d]);
      const g2 = (r.y + DY[d] * 2) * N + (r.x + DX[d] * 2);
      const li = ly * N + lx;
      if (occupied.has(g1) || occupied.has(g2) || occupied.has(li)) return null;
      occupied.add(g1); occupied.add(g2); occupied.add(li);
      fixed.add(g1); fixed.add(g2); // must stay EMPTY
      // landing piece: fixed D or player domino (if upgraded to S/T below, pull it back
      // out of placement — fixed cells are not player-placeable, keep cost accounting exact)
      if (rng() < 0.5) pieces.set(li, 'D'); else placement.push(li);
      const unplace = () => { const k = placement.indexOf(li); if (k >= 0) placement.splice(k, 1); };
      // landing continues: next run starts there
      let nd = d;
      if (usedSplit.n < nSplit && rng() < 0.6) {
        unplace(); pieces.set(li, 'S'); usedSplit.n++;
        nd = [(d + 1) % 4, (d + 3) % 4, d][Math.floor(rng() * 3)];
      } else if (rng() < 0.35) {
        unplace(); pieces.set(li, 'T'); targets.push(li); leaves.push({ x: lx, y: ly, d });
        continue;
      }
      queue.push({ x: lx, y: ly, dir: nd });
      continue;
    }
  }
  if (targets.length < 1 || targets.length > 4) return null;
  if (tier >= 2 && targets.length < 2) return null;      // turns/split tiers: branch out
  if (tier >= 3 && usedSplit.n < 1) return null;          // splitter tiers must split
  if (tier === 5 && usedBoost.n < 1) return null;         // booster tiers must boost
  if (tier >= 6 && usedBoost.n < 1) return null;
  // assemble types
  const types = new Uint8Array(N * N);
  for (const [i, ch] of pieces) types[i] = CH2T[ch];
  // walls on never-entered cells
  const res = simulate(types, sx, sy, dir, placement);
  if (res.hit !== res.total || res.total === 0) return null;
  let walls = 0; const wallTries = 200;
  for (let t = 0; t < wallTries && walls < nWall; t++) {
    const i = Math.floor(rng() * N * N);
    if (occupied.has(i) || res.entered.has(i) || fixed.has(i)) continue;
    const x = i % N, y = (i / N) | 0;
    // keep away from start row/col edges visually
    if (Math.abs(x - sx) + Math.abs(y - sy) < 2) continue;
    types[i] = W; walls++;
  }
  const res2 = simulate(types, sx, sy, dir, placement);
  if (res2.hit !== res2.total) return null;
  const slack = tier <= 2 ? 2 : (tier <= 4 ? 1 : 0);
  const budget = placement.length + slack;
  const par = placement.length;
  return { types, sx, sy, dir, budget, par, targets: res2.total, walls };
}

function emit() {
  const out = [];
  out.push('/* Generate level grids */');
  out.push('var levels=[];');
  for (let i = 0; i < 30; i++) {
    let lvl = null; let lastErr = '';
    for (let seed = 1; seed <= 4000 && !lvl; seed++) {
      try { lvl = build(lcg(7919 * (i + 1) + seed * 104729), i); } catch (e) { lvl = null; lastErr = e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e); }
    }
    if (!lvl) { console.error('FAILED level ' + (i + 1) + ' lastErr=' + lastErr); process.exit(1); }
    // verify once more
    const chk = simulate(lvl.types, lvl.sx, lvl.sy, lvl.dir, []);
    let s = '';
    const chMap = {}; chMap[EMPTY] = '.'; chMap[D] = 'D'; chMap[T] = 'T'; chMap[S] = 'S'; chMap[B] = 'B'; chMap[X] = 'X'; chMap[W] = 'W';
    for (let k = 0; k < N * N; k++) s += chMap[lvl.types[k]];
    // reconstruct placement-cells for validation output
    const v = `levels.push({grid:${JSON.stringify(s)},budget:${lvl.budget},startDir:${lvl.dir},startX:${lvl.sx},startY:${lvl.sy},tier:${Math.floor(i / 5) + 1},name:'${NAMES[i]}',par:${lvl.par}});`;
    out.push(`/* Level ${i + 1}: ${NAMES[i]} — ${lvl.targets} target(s), ${lvl.walls} wall(s), min ${lvl.par} dominoes */`);
    out.push(v);
    console.log(`L${i + 1} ${NAMES[i]}: targets=${lvl.targets} walls=${lvl.walls} par=${lvl.par} budget=${lvl.budget} start=(${lvl.sx},${lvl.sy}) dir=${lvl.dir}`);
  }
  out.push("console.log('Levels loaded:',levels.length);");
  return out.join('\n');
}

const block = emit();
const file = path.join(__dirname, '..', '..', 'domino-toppler', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const startA = html.indexOf('/* Generate level grids */');
const endA = html.indexOf("console.log('Levels loaded:',levels.length);");
if (startA < 0 || endA < 0 || endA < startA) { console.error('anchors not found'); process.exit(1); }
const patched = html.slice(0, startA) + block + html.slice(endA + "console.log('Levels loaded:',levels.length);".length);
fs.writeFileSync(file, patched);
console.log('PATCHED ' + file);
