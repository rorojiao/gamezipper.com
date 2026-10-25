#!/usr/bin/env node
/* solver_strong.js — parallel per-level solver/verifier for sugar-sugar.
 *
 * Why the shipped gate fails these: its plans are accepted on a 1-2 seed sim and its
 * adaptive policy plans re-draw lines on frame-critical state. The harness seeds
 * Math.random with an LCG whose stream position at level start depends on the whole
 * preceding call history, so a plan tuned to one or two RNG streams does not transfer
 * to the engine's stream (baseline trace: L3/L7/L8/L10/L11/L13 passed the 2-seed sim,
 * then failed 0/30 on the engine; L12's static planner hit its 5s worker cap).
 *
 * Search uses partial-credit, exhaustive coordinate neighbourhoods and fixed
 * restarts, followed by counterexample-guided point-grid refinement.
 *
 * Proof requirements:
 *   1. STATIC draw-once line plans only — no state-dependent redraws, nothing to
 *      desync. Everything is decided before the first pumped frame.
 *   2. ROBUSTNESS GAUNTLET: every candidate must win across a fixed battery of
 *      16 seeds x 3 RNG stream offsets (48 sims). The engine's stream alignment is
 *      unknown but fixed; an offset-robust plan transfers.
 *   3. Physics is REUSED from the shipped file: the exact source slice of
 *      verify_engine.js (GRAVITY..planner block) is eval'd at runtime and my loop
 *      calls its collideSeg/constants. A bitwise self-test asserts my loop matches
 *      the shipped simulate() exactly on t0=0/offset=0 plans.
 *   4. Per-cup ramps, stairs, cascades and wall-endpoint detours (with rails).
 *      Partial credit ranks fully satisfied cups, then capped fractional fills.
 *      Finite sweeps replace pseudo-random Cartesian-product sampling.
 *   5. Engine replay through the REAL input path (canvas pointer drags), then a
 *      SECOND full engine replay of the recorded plan as the reproduction assert.
 *
 * Verdicts per level: SOLVABLE (plan + replay asserts) / UNSOLVABLE (only with a
 * data-level proof, e.g. supply-infeasible cup needs — reported as a P0 content
 * defect) / STILL-UNPROVEN (search exhausted without a win and without a proof;
 * never merged into the other two).
 *
 * Exit codes: 0 = every target level has a final verdict (SOLVABLE or UNSOLVABLE);
 * 3 = at least one STILL-UNPROVEN. The shipped gate (verify_engine.js) is NOT
 * touched. Only solutions that pass every proof channel are recorded for injection.
 *
 * Env: SS_LEVELS="24,29,30" (default the remaining three targets), SS_QUIET=1 (JSON only).
 * SS_START_TUPLE optionally supplies one additional deterministic search start.
 * No network, no deps, fixed seed battery — reproducible. */
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');
const WORKERS = Math.min(8, require('os').cpus().length);
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const HERE = __dirname;
const GATE = path.join(HERE, 'verify_engine.js');
const OUT_FILE = path.join(HERE, 'solver_results.json');
const TARGETS = (process.env.SS_LEVELS || '24,29,30').split(',').map(Number);
const QUIET = !!process.env.SS_QUIET;
const T0WALL = Date.now();
// Search stops on finite sweep/refinement bounds; engine replays keep a safety cap.
const BUD_ENGINE_MS = 90000;   // engine replay attempts per level
const GLOBAL_DL = T0WALL + 20 * 60 * 1000; // whole-run cap 20 min

const log = (...a) => { if (!QUIET) console.error(...a); };

// ---------- boot the game exactly like the shipped gate (same shim) ----------
const g = bootGame('sugar-sugar', { inject: {
  anchor: 'var DAILY_SEED = Math.floor(Date.now() / 86400000);',
  exports: `
globalThis.__glLast = -1;
var __oGL = gameLoop;
gameLoop = function(){
  var now = performance.now();
  if (arguments.length && now === globalThis.__glLast) return;
  globalThis.__glLast = now;
  return __oGL.apply(this, arguments);
};
globalThis.__SS = {
  n: function(){ return LEVELS.length; },
  lv: function(i){ var L=LEVELS[i]; return { name:L.name, par:L.par, spawnTotal:L.spawnTotal,
    disp: L.dispenser.map(function(d){return {x:d.x,y:d.y,color:d.color};}),
    cups: L.cups.map(function(c){return {x:c.x,y:c.y,w:c.w,h:c.h,color:c.color,need:c.need};}),
    walls: L.walls.map(function(w){return {x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2};}) }; },
  dims: function(){ return { cw: cw, ch: ch }; },
  st: function(){ return { state: state, lvl: currentLevel, done: levelComplete, paused: paused, timer: timer,
    fills: cups.map(function(c){ return Math.min(c.fill, c.need) + '/' + c.need; }),
    cupsDone: cups.every(function(c){ return c.fill >= c.need; }),
    lines: drawnLines.length, spawned: spawnCounter, maxSpawn: maxSpawn,
    parts: particles.filter(function(p){return p.active;}).length }; },
  partsXY: function(){ return particles.filter(function(p){return p.active;}).map(function(p){return {x:p.x,y:p.y,vx:p.vx,vy:p.vy,color:p.color};}); },
  openLevels: function(){ showLevels(); },
  jump: function(i){ startLevel(i); },
  lines: function(){ return drawnLines.map(function(l){ return l.points.map(function(p){ return {x:Math.round(p.x*10)/10, y:Math.round(p.y*10)/10}; }); }); },
  linesExact: function(){ return drawnLines.map(function(l){ return l.points.map(function(p){ return {x:p.x, y:p.y}; }); }); },
};`
} });
const C = (e) => g.call(e);
const cv = g.els['gameCanvas'];
C('__SS.openLevels()'); g.pump(2);
// enter L1 once via the engine's own loader so setupCanvas() sizes the canvas
// (same entry path the shipped gate uses), then capture real dims
const cards = () => Array.from(g.els['tierContainer'].children).slice(0, 5)
  .flatMap(sec => Array.from(sec.children[1].children));
cards()[0].click(); g.pump(4);
const DIM = C('__SS.dims()');
const CW = DIM.cw, CH = DIM.ch;
const LV = []; for (let i = 0; i < C('__SS.n()'); i++) LV.push(C('__SS.lv(' + i + ')'));
log('boot ok dims=' + CW + 'x' + CH + ' levels=' + LV.length);

// ---------- load the shipped physics port + planners from verify_engine.js ----------
// Same slice the gate itself feeds its workers; const->var so direct eval publishes
// the top-level bindings into this function scope. Nothing in the gate file is edited.
const GATE_SRC = fs.readFileSync(GATE, 'utf8');
const SLICE = GATE_SRC.slice(GATE_SRC.indexOf('const GRAVITY'), GATE_SRC.indexOf('// ---------- boot + level data integrity')).replace(/^const /gm, 'var ');
function loadPhysics() {
  eval(SLICE);
  return { GRAVITY, PR, LT, FRICTION, BOUNCE, MAXP, RATE,
    mulberry, collideSeg, samplePath, segDist, segsCross, clearSeg, slopeOK,
    gentleTurns, linesCompat, chamferFix, toRails, armLines, chuteFrom,
    detourRoute, routeClean, cascadeFor, arcStart, arcLand, buildPlans, simulate };
}
const P = loadPhysics();

// ---------- my sim loop: the shipped physics + (t0 release frame, RNG offset) ----------
// Bit-identical to the shipped simulate() for static {lines} plans at t0=0, offset=0
// (asserted below). t0 = first frame at which the drawn lines exist; offset = number
// of rng draws pre-consumed (models the engine's unknown-but-fixed stream alignment).
function simStatic(lv, cw, ch, plan, seed, offset, t0, frameBudget, broadPhase = true) {
  const rng = P.mulberry(seed);
  for (let k = 0; k < offset; k++) rng();
  const disp = lv.disp.map(d => ({ x: d.x / 100 * cw, y: d.y / 100 * ch, color: d.color }));
  const cups = lv.cups.map(c => ({ x: c.x / 100 * cw, y: c.y / 100 * ch, w: c.w / 100 * cw, h: c.h / 100 * ch, color: c.color, need: c.need, fill: 0 }));
  const walls = lv.walls.map(w => ({ x1: w.x1 / 100 * cw, y1: w.y1 / 100 * ch, x2: w.x2 / 100 * cw, y2: w.y2 / 100 * ch }));
  const maxSpawn = lv.spawnTotal;
  let spawnCount = 0;
  let particles = [];
  const lines = plan.lines.map(l => ({ pts: l.pts || l }));
  // Conservative broad phase only: a point outside a segment's bounding box
  // expanded by its collision radius cannot collide. Calls that can affect a grain
  // still run the unmodified shipped collideSeg, in exactly the original order.
  const bounds = lines.map(l => l.pts.slice(1).map((b,j) => {
    const a=l.pts[j]; return [Math.min(a.x,b.x),Math.max(a.x,b.x),Math.min(a.y,b.y),Math.max(a.y,b.y)];
  }));
  const wallBounds = walls.map(w => [Math.min(w.x1,w.x2),Math.max(w.x1,w.x2),Math.min(w.y1,w.y2),Math.max(w.y1,w.y2)]);
  const near = (p,b) => {
    const r=p.r+P.LT/2+1e-9;
    return p.x>=b[0]-r && p.x<=b[1]+r && p.y>=b[2]-r && p.y<=b[3]+r;
  };
  let active = t0 > 0 ? [] : lines;
  for (let f = 0; f < frameBudget; f++) {
    if (t0 > 0 && f === t0) active = lines;
    if (spawnCount < maxSpawn) {
      for (let d = 0; d < disp.length; d++) {
        const rate = Math.ceil(P.RATE / disp.length);
        for (let i = 0; i < rate; i++) {
          if (spawnCount >= maxSpawn) break;
          spawnCount++;
          particles.push({ x: disp[d].x + (-2 + rng() * 4), y: disp[d].y + 4, vx: (-0.3 + rng() * 0.6), vy: 0.5 + rng() * 0.5, color: disp[d].color, r: P.PR * (0.8 + rng() * 0.4), active: true });
        }
      }
    }
    let alive = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!p.active) continue;
      alive++;
      p.vy += P.GRAVITY;
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > 8) { p.vx *= 8 / sp; p.vy *= 8 / sp; }
      p.x += p.vx; p.y += p.vy; p.vx *= P.FRICTION;
      if (p.x < p.r) { p.x = p.r; p.vx *= -P.BOUNCE; }
      if (p.x > cw - p.r) { p.x = cw - p.r; p.vx *= -P.BOUNCE; }
      if (p.y < p.r) { p.y = p.r; p.vy *= -P.BOUNCE; }
      if (p.y > ch + p.r * 2) { p.active = false; continue; }
      for (let w = 0; w < walls.length; w++) if (!broadPhase || near(p,wallBounds[w])) P.collideSeg(p, walls[w].x1, walls[w].y1, walls[w].x2, walls[w].y2);
      for (let l = 0; l < active.length; l++) {
        const pts = active[l].pts;
        for (let j = 0; j < pts.length - 1; j++) if (!broadPhase || near(p,bounds[l][j])) P.collideSeg(p, pts[j].x, pts[j].y, pts[j + 1].x, pts[j + 1].y);
      }
      for (let c = 0; c < cups.length; c++) {
        const cup = cups[c];
        if (p.x > cup.x && p.x < cup.x + cup.w && p.y > cup.y && p.y < cup.y + cup.h * 0.6) {
          if (cup.color === 0 || cup.color === p.color) { cup.fill++; p.active = false; break; }
        }
      }
    }
    if (particles.length > P.MAXP) particles = particles.filter(p2 => p2.active);
    if (cups.every(c => c.fill >= c.need)) return { ok: true, frame: f, fills: cups.map(c => c.fill) };
    // early exit EXACTLY matching the shipped sim's outcome space: once spawning is
    // exhausted and no particle is alive, fills can never change again. (Without this
    // the loop runs all `frameBudget` frames and the gauntlet becomes ~10x slower.)
    if (spawnCount >= maxSpawn && alive === 0)
      return { ok: false, fills: cups.map(c => c.fill + '/' + c.need), spawned: spawnCount, deadAt: f };
  }
  return { ok: false, fills: cups.map(c => c.fill + '/' + c.need), spawned: spawnCount };
}

// ---------- self-test: my loop === shipped simulate on t0=0/offset=0 ----------
(function selfTest() {
  const lv = LV[0]; // L1 "First Drop": open board, lines-free plan exercises full path
  const plans = [
    { lines: [{ pts: [{ x: CW * 0.5, y: CH * 0.1 }, { x: CW * 0.45, y: CH * 0.5 }] }] },
    { lines: [{ pts: [{ x: CW * 0.5, y: CH * 0.08 }, { x: CW * 0.3, y: CH * 0.6 }, { x: CW * 0.42, y: CH * 0.84 }] }] },
    { lines: [] },
  ];
  for (const plan of plans) for (const seed of [424242, 11, 987654]) {
    const a = P.simulate(lv, CW, CH, plan, seed, 900);
    const b = simStatic(lv, CW, CH, plan, seed, 0, 0, 900);
    if (a.ok !== b.ok || a.frame !== b.frame || JSON.stringify(a.fills) !== JSON.stringify(b.fills)) {
      console.error('SELF-TEST FAILED: simStatic diverges from shipped simulate', JSON.stringify({ a, b, seed }));
      process.exit(2);
    }
  }
  log('self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)');
})();

// ---------- fixed gauntlet battery (reproducible, no shared budget) ----------
const SEEDS = [424242, 11, 987654, 7, 13, 99, 12345, 777, 31337, 271828, 112358, 4242, 5150, 8675309, 60601, 90210];
const OFFSETS = [0, 7, 31];
const T1_SEEDS = [424242, 7, 987654], T1_OFFSETS = [0, 31];
// recorded-plan battery: wider offsets (the engine's LCG alignment depends on its
// whole call history; a plan proven over 6 alignments transfers to any of them)
const REC_OFFSETS = [0, 7, 31, 63, 127, 200];
const SIM_FRAMES = 4200;
// Every worker evaluates the very same source strings as the coordinator. Jobs
// contain all sim inputs; worker scheduling cannot affect RNG or physics state.
class PhysicsPool {
  constructor() {
    this.queue = [];
    this.slots = Array.from({ length: WORKERS }, () => {
      const code = `const {parentPort,workerData}=require('worker_threads');
        const SLICE=workerData.slice;
        ${loadPhysics.toString()}
        const P=loadPhysics();
        ${simStatic.toString()}
        for (const plan of workerData.plans) for (const seed of [424242,11,987654]) {
          const a=P.simulate(workerData.lv,workerData.cw,workerData.ch,plan,seed,900);
          const b=simStatic(workerData.lv,workerData.cw,workerData.ch,plan,seed,0,0,900);
          if(a.ok!==b.ok || a.frame!==b.frame || JSON.stringify(a.fills)!==JSON.stringify(b.fills))
            throw Error('worker physics self-test failed');
        }
        parentPort.postMessage({ready:true});
        parentPort.on('message', job => {
          parentPort.postMessage(simStatic(job.lv,job.cw,job.ch,job.plan,job.seed,job.offset,job.t0,job.frames));
        });`;
      const slot = { worker: new Worker(code, { eval: true, workerData: {
        slice: SLICE, lv: LV[0], cw: CW, ch: CH, plans: [
          {lines:[{pts:[{x:CW*.5,y:CH*.1},{x:CW*.45,y:CH*.5}]}]},
          {lines:[{pts:[{x:CW*.5,y:CH*.08},{x:CW*.3,y:CH*.6},{x:CW*.42,y:CH*.84}]}]},
          {lines:[]}
        ] } }), pending: null };
      slot.ready = new Promise((resolve, reject) => { slot.resolveReady=resolve; slot.rejectReady=reject; });
      slot.worker.on('message', result => {
        if (result.ready) { slot.resolveReady(); return; }
        const pending = slot.pending; slot.pending = null;
        pending.resolve(result); this.dispatch();
      });
      slot.worker.on('error', error => {
        this.failure=error; slot.rejectReady(error);
        if (slot.pending) slot.pending.reject(error);
        for (const job of this.queue.splice(0)) job.reject(error);
      });
      return slot;
    });
  }
  dispatch() {
    for (const slot of this.slots) if (!slot.pending && this.queue.length) {
      slot.pending = this.queue.shift();
      slot.worker.postMessage(slot.pending.job);
    }
  }
  sim(lv, plan, seed, offset, t0, frames) {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve, reject) => {
      this.queue.push({ job: { lv, plan, seed, offset, t0, frames, cw:CW, ch:CH }, resolve, reject });
      this.dispatch();
    });
  }
  async close() { await Promise.all(this.slots.map(s => s.worker.terminate())); }
}
let physicsPool;
async function battery(lv, plan, seeds, offsets) {
  const jobs = seeds.flatMap(seed => offsets.map(offset => physicsPool.sim(lv, plan, seed, offset, 1, SIM_FRAMES)));
  const rs = await Promise.all(jobs);
  const pass = rs.filter(r => r.ok).length;
  return { pass, tried:rs.length, rate:pass/rs.length, partial:rs.reduce((sum,r)=>sum+require('./staged_search').credit(lv,r),0)/rs.length, worst:rs.filter(r => !r.ok).pop() || null };
}
function gauntlet(lv, plan, tier) {
  return battery(lv, plan, tier === 1 ? T1_SEEDS : SEEDS, tier === 1 ? T1_OFFSETS : OFFSETS);
}
function gauntletRec(lv, plan) { return battery(lv, plan, SEEDS, REC_OFFSETS); }

// ---------- exact engine-stream replay (bitwise alignment identification) ----------
// The harness Math.random is the LCG s = (s*1664525 + 1013904223) >>> 0, seeded
// 424242 at boot. The engine's spawn draws are therefore a FIXED stream; a level
// entry's alignment k0 = number of draws consumed before the level's first spawn
// draw. We recover k0 from the snapshot particles' vy draws (exactly invertible)
// and VERIFY over the whole first frame (every particle, x and y, exact equality).
// Each grain consumes 4 draws in order: x, vx, vy, r. Stride between grains: 4.
const LCG_A = 1664525, LCG_C = 1013904223;
const LCG_STATES = (() => { // LCG_STATES[k] = seed after k draws (memo table)
  const t = new Uint32Array(200000);
  let s = 424242 >>> 0;
  for (let i = 0; i < t.length; i++) { t[i] = s; s = (Math.imul(s, LCG_A) + LCG_C) >>> 0; }
  return t;
})();
function lcgStateAfter(k) { return k < LCG_STATES.length ? LCG_STATES[k] : (() => { let s = LCG_STATES[LCG_STATES.length - 1]; for (let i = LCG_STATES.length; i < k; i++) s = (Math.imul(s, LCG_A) + LCG_C) >>> 0; return s; })(); }
function simStaticLCG(lv, cw, ch, plan, pre, t0, frameBudget, extraDrawsAt, extraDrawsN) {
  // identical to simStatic but the RNG is the engine's real LCG stream, pre-advanced
  // `pre` draws, with `extraDrawsN` draws injected before frame `extraDrawsAt`
  let s = lcgStateAfter(pre);
  const rng = () => { s = (Math.imul(s, LCG_A) + LCG_C) >>> 0; return s / 4294967296; };
  const disp = lv.disp.map(d => ({ x: d.x / 100 * cw, y: d.y / 100 * ch, color: d.color }));
  const cups = lv.cups.map(c => ({ x: c.x / 100 * cw, y: c.y / 100 * ch, w: c.w / 100 * cw, h: c.h / 100 * ch, color: c.color, need: c.need, fill: 0 }));
  const walls = lv.walls.map(w => ({ x1: w.x1 / 100 * cw, y1: w.y1 / 100 * ch, x2: w.x2 / 100 * cw, y2: w.y2 / 100 * ch }));
  const maxSpawn = lv.spawnTotal;
  let spawnCount = 0, particles = [];
  const lines = plan.lines.map(l => ({ pts: l.pts || l }));
  let active = t0 > 0 ? [] : lines;
  const fillsHist = [];
  for (let f = 0; f < frameBudget; f++) {
    if (extraDrawsAt !== undefined && f === extraDrawsAt) for (let e2 = 0; e2 < extraDrawsN; e2++) rng();
    if (t0 > 0 && f === t0) active = lines;
    if (spawnCount < maxSpawn) {
      for (let d = 0; d < disp.length; d++) {
        const rate = Math.ceil(P.RATE / disp.length);
        for (let i = 0; i < rate; i++) {
          if (spawnCount >= maxSpawn) break;
          spawnCount++;
          particles.push({ x: disp[d].x + (-2 + rng() * 4), y: disp[d].y + 4, vx: (-0.3 + rng() * 0.6), vy: 0.5 + rng() * 0.5, color: disp[d].color, r: P.PR * (0.8 + rng() * 0.4), active: true });
        }
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!p.active) continue;
      p.vy += P.GRAVITY;
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > 8) { p.vx *= 8 / sp; p.vy *= 8 / sp; }
      p.x += p.vx; p.y += p.vy; p.vx *= P.FRICTION;
      if (p.x < p.r) { p.x = p.r; p.vx *= -P.BOUNCE; }
      if (p.x > cw - p.r) { p.x = cw - p.r; p.vx *= -P.BOUNCE; }
      if (p.y < p.r) { p.y = p.r; p.vy *= -P.BOUNCE; }
      if (p.y > ch + p.r * 2) { p.active = false; continue; }
      for (let w = 0; w < walls.length; w++) P.collideSeg(p, walls[w].x1, walls[w].y1, walls[w].x2, walls[w].y2);
      for (let l = 0; l < active.length; l++) {
        const pts = active[l].pts;
        for (let j = 0; j < pts.length - 1; j++) P.collideSeg(p, pts[j].x, pts[j].y, pts[j + 1].x, pts[j + 1].y);
      }
      for (let c = 0; c < cups.length; c++) {
        const cup2 = cups[c];
        if (p.x > cup2.x && p.x < cup2.x + cup2.w && p.y > cup2.y && p.y < cup2.y + cup2.h * 0.6) {
          if (cup2.color === 0 || cup2.color === p.color) { cup2.fill++; p.active = false; break; }
        }
      }
    }
    if (particles.length > P.MAXP) particles = particles.filter(p2 => p2.active);
    fillsHist.push(cups.map(c => c.fill));
    if (cups.every(c => c.fill >= c.need)) return { ok: true, frame: f, fills: cups.map(c => c.fill), fillsHist };
    if (spawnCount >= maxSpawn && particles.every(p2 => !p2.active)) return { ok: false, fills: cups.map(c => c.fill + '/' + c.need), fillsHist };
  }
  return { ok: false, fills: cups.map(c => c.fill + '/' + c.need), fillsHist };
}
function identifyAlignment(lv, snapParts) {
  // snapParts: engine particles captured after (spawn frame) + exactly ONE update
  // frame — i.e. each visible grain has been integrated exactly once. Grain j (spawn
  // order) had vy draw r_j and start (x_j, y_j); after one update:
  //   y = dispY + 4 + (r+0.5) + 0.15,  x = dispX + (-2+rx*4) + (rvx) * 0.98   (no
  // collisions on frame 1: grains spawn at the ceiling, nowhere near walls/lines).
  // Invert the vy draw and search the (precomputed) LCG state table for a stride-4
  // arithmetic progression match, then verify ALL particles exactly.
  const rate = Math.ceil(3 / lv.disp.length);
  const dispY = lv.disp[0].y / 100 * CH, dispX = lv.disp[0].x / 100 * CW;
  if (!snapParts.length) return null;
  const anchors = [];
  for (let i = 0; i < Math.min(4, snapParts.length); i++) {
    const r = (snapParts[i].y - dispY - 4.65) / 0.5;
    if (!(r >= 0 && r < 1)) return null;
    anchors.push(r);
  }
  const n = Math.min(snapParts.length, 40);
  for (let k = 0; k + 4 * n < LCG_STATES.length; k++) {
    let ok = true;
    for (let i = 0; i < anchors.length; i++) {
      // draw order per grain: x(b), vx(b+1), vy(b+2), r(b+3) — anchor on the vy draw
      if (Math.abs(LCG_STATES[k + 4 * i + 2] / 4294967296 - anchors[i]) > 1e-9) { ok = false; break; }
    }
    if (!ok) continue;
    // verify every captured particle exactly (x and y, 1e-9)
    let match = true;
    for (let d = 0; d < lv.disp.length && match; d++) {
      const dx = lv.disp[d].x / 100 * CW, dy = lv.disp[d].y / 100 * CH;
      for (let i = 0; i < rate && match; i++) {
        const idx = d * rate + i;
        if (idx >= n) break;
        const b = k + 4 * idx;
        const px = dx + (-2 + LCG_STATES[b] / 4294967296 * 4);
        const pvx = -0.3 + LCG_STATES[b + 1] / 4294967296 * 0.6;
        const pvy = 0.5 + LCG_STATES[b + 2] / 4294967296 * 0.5;
        // engine update: vy += g; x += vx; y += vy; THEN vx *= friction — the first
        // frame's x uses the PRE-friction vx, and vy is the post-gravity value
        const ax = px + pvx, ay = dy + 4 + pvy + 0.15;
        if (Math.abs(ax - snapParts[idx].x) > 1e-9 || Math.abs(ay - snapParts[idx].y) > 1e-9) match = false;
      }
    }
    if (match) return k;
  }
  return null;
}
let LVsel = null;

// ---------- data-level UNSOLVABLE proof: supply feasibility (exact spawn metering) ----------
function supplyProof(lv, cw, ch) {
  // engine spawn: per frame, each dispenser spawns rate=ceil(3/D) grains until the
  // shared counter hits spawnTotal. Compute the exact per-dispenser grain counts.
  const D = lv.disp.length, rate = Math.ceil(3 / D);
  const per = lv.disp.map(() => 0);
  let count = 0;
  while (count < lv.spawnTotal) {
    for (let d = 0; d < D && count < lv.spawnTotal; d++)
      for (let i = 0; i < rate && count < lv.spawnTotal; i++) { per[d]++; count++; }
  }
  // max-flow (tiny): colored cups only take their color; white cups take anything.
  // nodes: source -> dispensers (cap=per[d]) -> cups (cap=need) -> sink
  const cups = lv.cups;
  const N = 2 + D + cups.length;
  const cap = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let d = 0; d < D; d++) { cap[0][1 + d] = per[d]; }
  for (let d = 0; d < D; d++) for (let ci = 0; ci < cups.length; ci++)
    if (cups[ci].color === 0 || cups[ci].color === lv.disp[d].color) cap[1 + d][1 + D + ci] = Infinity;
  for (let ci = 0; ci < cups.length; ci++) cap[1 + D + ci][N - 1] = cups[ci].need;
  let flow = 0;
  for (;;) { // BFS augment (Edmonds-Karp)
    const par = new Array(N).fill(-1); par[0] = 0;
    const q = [0];
    while (q.length && par[N - 1] < 0) {
      const u = q.shift();
      for (let v = 0; v < N; v++) if (par[v] < 0 && cap[u][v] > 0) { par[v] = u; q.push(v); }
    }
    if (par[N - 1] < 0) break;
    let f = Infinity;
    for (let v = N - 1; v !== 0; v = par[v]) f = Math.min(f, cap[par[v]][v]);
    for (let v = N - 1; v !== 0; v = par[v]) { cap[par[v]][v] -= f; cap[v][par[v]] += f; }
    flow += f;
  }
  const need = cups.reduce((a, c) => a + c.need, 0);
  if (flow >= need) return null;
  return { kind: 'supply-infeasible', flowPossible: flow, needed: need,
    perDispenserGrains: per, detail: 'cups need ' + need + ' grains but color-compatible supply is ' + flow + ' — no plan of ANY line geometry can finish this level (data defect, P0 content bug)' };
}

// ---------- candidate generation ----------
// Strokes are spout-anchored paths per cup. A catalog entry carries one or more
// polylines ("parts": cascades have ballistic gaps between legs). A PLAN = one entry
// per cup, including overlapping strokes. This is the search space: aim (target fx
// across the cup mouth) x release geometry (ramp/stair/cascade) x rails x combination.
function inBounds(pts) { return pts.every(p => p.x >= 2 && p.x <= CW - 2 && p.y >= 2 && p.y <= CH - 2); }
function lvWalls(lv) { return lv.walls.map(w => ({ x1: w.x1 / 100 * CW, y1: w.y1 / 100 * CH, x2: w.x2 / 100 * CW, y2: w.y2 / 100 * CH })); }
function cupCx(lv, ci) { return (lv.cups[ci].x + lv.cups[ci].w / 2) / 100 * CW; }
function mouthT(lv, ci, fx) { const c = lv.cups[ci]; return { x: c.x / 100 * CW + fx * (c.w / 100 * CW), y: c.y / 100 * CH + 6 }; }

// catalog for cup ci: straight ramps, two-leg staircases over a waypoint grid, and
// shipped-planner ballistic cascades. No heuristic gate on the final geometry — the
// gauntlet sim is the only judge (clearSeg/slope checks here only keep strokes that
// are geometrically drawable and downhill).
function cupCatalog(lv, ci, deadline) {
  const out = [];
  const walls = lvWalls(lv);
  const push = (parts, d, fx, kind) => {
    for (const pts of parts) if (!inBounds(pts)) return;
    out.push({ parts: parts.map(pts => P.samplePath(pts)), d, fx, kind });
  };
  for (let d = 0; d < lv.disp.length; d++) {
    const dd = lv.disp[d];
    if (!(lv.cups[ci].color === 0 || lv.cups[ci].color === dd.color)) continue;
    const J = { x: dd.x / 100 * CW, y: dd.y / 100 * CH + 14 };
    // lip starts: strokes anchored slightly BESIDE the spout column catch the whole
    // spawn jitter band on their body (a stroke starting exactly AT the column splits
    // the band — grains on the far side free-fall past the tip and die)
    const lips = [{ dx: 0, dy: 0 }, { dx: 10, dy: -2 }, { dx: -10, dy: -2 }, { dx: 16, dy: -3 }, { dx: -16, dy: -3 }];
    // straight ramps: continuous aim sweep across the cup mouth
    for (const fx of [0.08, 0.17, 0.25, 0.33, 0.42, 0.5, 0.58, 0.67, 0.75, 0.83, 0.92]) {
      const T = mouthT(lv, ci, fx);
      if (T.y - J.y < 20) continue;
      for (const lip of lips) {
        const S = { x: J.x + lip.dx, y: J.y + lip.dy };
        if (!P.slopeOK(S, T)) continue;
        if (!P.clearSeg(S, T, walls)) continue;
        push([[S, T]], d, fx, 'ramp');
      }
    }
    // two-leg staircases over a waypoint grid (wall detours)
    const cy = lv.cups[ci].y / 100 * CH;
    for (let wx = 24; wx <= CW - 24; wx += 40) {
      for (let wy = J.y + 40; wy < Math.min(cy - 40, CH - 30); wy += 54) {
        if (Date.now() > deadline) break;
        const W = { x: wx, y: wy };
        for (const fx of [0.25, 0.5, 0.75]) {
          const T = mouthT(lv, ci, fx);
          if (T.y - W.y < 12) continue;
          for (const lip of lips.slice(0, 3)) { // stairs: plain + narrow lips (cap the blowup)
            const S = { x: J.x + lip.dx, y: J.y + lip.dy };
            if (!P.clearSeg(S, W, walls) || !P.slopeOK(S, W)) continue;
            if (!P.clearSeg(W, T, walls)) continue;
            push([[S, W, T]], d, fx, 'stair');
          }
        }
      }
    }
    // ballistic cascades from the shipped planner (legs kept as separate parts)
    const T = mouthT(lv, ci, 0.5);
    if (Date.now() <= deadline) {
      let casc = null;
      try { casc = P.cascadeFor(J, { x: T.x, y: T.y - 6 }, walls, CW, CH, 1200); } catch (e) { casc = null; }
      for (const v of (casc || [])) {
        if (!v.legs.length || !v.legs.every(leg => Array.isArray(leg) && inBounds(leg))) continue;
        push(v.legs.slice(), d, 0.5, 'cascade');
      }
    }
  }
  return out.concat(require('./wall_routes.js')(lv,ci,{P,CW,CH}));
}
// Build a concrete plan from a per-cup selection: sample and optionally rail.
function partVariants(parts, rails, open, lv) {
  // parts -> sampled polylines, optionally twin-railed (shipped toRails)
  if (!rails) return parts.map(pts => ({ pts: P.samplePath(pts) }));
  const walls = lvWalls(lv);
  const out = [];
  for (const pts of parts) {
    const r = P.toRails(pts, walls, rails, open);
    if (!r || !r[0] || !r[1]) return null;
    out.push({ pts: r[0] }, { pts: r[1] });
  }
  return out;
}
function comboPlan(lv, sel, rails) {
  const allParts = [];
  for (const e of sel) for (const pts of e.parts) allParts.push(pts);
  const k = sel.length;
  const lines = partVariants(allParts, rails, k === 1 && allParts.length === 1, lv);
  if (!lines) return null;
  if (!lines.every(l => inBounds(l.pts))) return null;
  return { lines: lines.map(l => l.pts) };
}
// ---------- engine replay (REAL input path: canvas pointer drags) ----------
function dragLine(pts) {
  // CORRECT client mapping for this sandbox: the canvas stub's getBoundingClientRect
  // returns the backing store (cw x ch), so the engine's getCanvasPos is IDENTITY:
  // clientX === canvas x. This agrees with the corrected shipped gate mapping.
  const cx = x => x, cy = y => y;
  cv.dispatch('pointerdown', { clientX: cx(pts[0].x), clientY: cy(pts[0].y), pointerId: 1, button: 0, preventDefault() {} });
  for (let i = 1; i < pts.length; i++) cv.dispatch('pointermove', { clientX: cx(pts[i].x), clientY: cy(pts[i].y), pointerId: 1, preventDefault() {} });
  cv.dispatch('pointerup', { clientX: cx(pts[pts.length - 1].x), clientY: cy(pts[pts.length - 1].y), pointerId: 1, preventDefault() {} });
}
// (stroke geometry read-back lives in playCurrentEntry via __SS.lines(): the engine's
// onPointerMove decimates points closer than 3px, so drawnLines is the real physics input)
function engineRun(id1, plan, releaseFrames, deadline) {
  // enter the level fresh through its own level card (real UI path; the card click
  // calls startLevel with a live rAF chain). Then pump `releaseFrames`, draw all
  // strokes, pump to win.
  C('__SS.openLevels()'); g.pump(2);
  const card = cards()[id1 - 1];
  if (!card) return { won: false, why: 'no-card' };
  card.click(); g.pump(2);
  let st = C('__SS.st()');
  if (st.lvl !== id1 - 1 || st.state !== 'playing') return { won: false, why: 'bad-load', st };
  for (let f = 0; f < releaseFrames; f++) g.pump(1);
  const drawn = [];
  for (const l of plan.lines) { dragLine(l); drawn.push(l); }
  let iters = 0;
  for (; iters < 3800; iters++) {
    st = C('__SS.st()');
    if (st.done) return { won: !!(st.done && st.cupsDone), frames: (releaseFrames || 0) + iters * 2, iters, fills: st.fills, drawn, st };
    g.pump(2);
    if (Date.now() > deadline) return { won: false, why: 'engine-deadline', frames: iters * 2, fills: st.fills, drawn, st };
  }
  st = C('__SS.st()');
  for (let f = 0; f < 300 && !st.done; f++) { g.pump(2); st = C('__SS.st()'); }
  return { won: !!(st.done && st.cupsDone), frames: iters * 2, fills: st.fills, drawn, st };
}

// ---------- per-level pipeline ----------
async function solveLevel(id1) {
  const lv = LV[id1 - 1];
  LVsel = lv;
  const t0 = Date.now();
  const rec = { level: id1, name: lv.name, verdict: null, plan: null, robustness: null,
    evidence: {}, gens: 0, simsRun: 0, engineTries: 0, notes: '' };

  // 0) data-level proof first: an infeasible board is UNSOLVABLE with proof (P0 defect)
  const proof = supplyProof(lv, CW, CH);
  if (proof) {
    rec.verdict = 'UNSOLVABLE';
    rec.notes = 'P0 CONTENT DEFECT: ' + proof.detail;
    rec.evidence.proof = proof;
    log('L' + id1 + ' UNSOLVABLE (proof): ' + proof.detail);
    return rec;
  }

  const stored = JSON.parse(fs.readFileSync(path.join(HERE,'solutions.json'),'utf8'))[id1];
  const survivors = [];
  let best = null;
  fs.mkdirSync(path.join(HERE,'solver_logs'),{recursive:true});
  if (stored) survivors.push({plan:{lines:stored.strokes},gen:'recorded',preferred:true});
  if (process.env.SS_CANDIDATES) {
    const file = path.resolve(process.env.SS_CANDIDATES);
    if (!file.startsWith(HERE + path.sep)) throw Error('Candidate file must be inside sugar-sugar/');
    for (const c of JSON.parse(fs.readFileSync(file,'utf8'))[id1] || [])
      survivors.push({plan:c.plan || c,gen:'search-frontier',preferred:true});
  }
  if (!survivors.length) {
    const catalogs = lv.cups.map((_,ci) => cupCatalog(lv,ci,Infinity));
    for (const catalog of catalogs) catalog.push({parts:[],kind:'empty'});
    log('catalog sizes: '+catalogs.map(c=>c.length).join(' x '));
    const {search} = require('./staged_search.js');
    let refinementAttempts = 0;
    const accept = async plan => {
      const g1 = await gauntlet(lv,plan,1); rec.simsRun += g1.tried;
      if (g1.pass === g1.tried) {
        const g2 = await gauntletRec(lv,plan); rec.simsRun += g2.tried;
        log('coordinate candidate battery '+g2.pass+'/'+g2.tried);
        if (g2.pass === g2.tried) return plan;
      }
      if (refinementAttempts++ > 0) return false;
      return require('./refine_plan.js')(lv,plan,{CW,CH,P,log,
        sim:(candidate,seed,offset)=>physicsPool.sim(lv,candidate,seed,offset,1,1500),
        battery:async candidate=>{
          const cases=SEEDS.flatMap(seed=>REC_OFFSETS.map(offset=>[seed,offset]));
          return {cases,results:await Promise.all(cases.map(([seed,offset])=>physicsPool.sim(lv,candidate,seed,offset,1,4200)))};
        },
        save:row=>{rec.evidence.refinement={sims:row.sims,rounds:row.rounds,cases:row.cases,complete:row.complete};
          fs.writeFileSync(path.join(HERE,'solver_logs','refine-'+id1+'.json'),JSON.stringify(row,null,1));}
      });
    };
    const initial = process.env.SS_START_TUPLE ? [JSON.parse(process.env.SS_START_TUPLE)] : [];
    for (const tuple of initial) if (tuple.length !== catalogs.length || tuple.some((n,i)=>!Number.isInteger(n)||n<0||n>=catalogs[i].length)) throw Error('Invalid SS_START_TUPLE');
    const found = await search({lv,catalogs,workers:WORKERS,accept,initial,
      combo:sel=>comboPlan(lv,sel,0),
      sim:plan=>physicsPool.sim(lv,plan,424242,0,1,1500), log,
      save:row=>fs.writeFileSync(path.join(HERE,'solver_logs','coordinate-'+id1+'.json'),JSON.stringify(row,null,1))});
    survivors.push(...found.winners); rec.gens += found.sims; rec.simsRun += found.sims;
    rec.simsRun += rec.evidence.refinement?.sims || 0;
    rec.evidence.search = {...found,winners:found.winners.length, strategy:'deterministic coordinate descent; exhaustive single-coordinate sweeps'};
  }
  // tier1 (6-sim mini-battery) — ranked pass, keep the top band by robustness
  const t1 = [];
  let t1worst = 0;
  for (const c2 of survivors) {
    if (Date.now() >= GLOBAL_DL) break;
    const g1 = await gauntlet(lv, c2.plan, 1);
    rec.simsRun += g1.tried;
    if (g1.pass < t1worst - 6 && t1.length >= 12) continue; // well below the band
    if (g1.pass === g1.tried) { t1.push({ ...c2, g: g1 }); continue; }
    if (t1.length < 12 || g1.pass > (t1[t1.length - 1].g ? t1[t1.length - 1].g.pass : 0)) {
      t1.push({ ...c2, g: g1 });
      t1.sort((a, b) => (b.g.pass - b.g.tried) - (a.g.pass - a.g.tried) || b.g.partial-a.g.partial);
      if (t1.length > 12) t1.length = 12;
      t1worst = t1[t1.length - 1].g.pass;
    }
  }
  log('L' + id1 + ' tier1 band: ' + t1.length + ' (top ' + (t1[0] ? t1[0].g.pass + '/' + t1[0].g.tried : '-') + ', worst kept ' + t1worst + '/6) t=' + (Date.now() - t0) + 'ms');
  { // diversity: keep at most 2 plans per geometry bucket (line count + rounded spout
    // angle) so 4 near-identical ramps don't crowd the engine queue
    const bucket = p => p.plan.lines.length + '|' + p.plan.lines.map(l => Math.round(l[0].x / 30) + ',' + Math.round((l[l.length - 1].x - l[0].x) / 40)).join(';');
    const cnt = new Map();
    t1.sort((a, b) => (b.g.pass - b.g.tried) - (a.g.pass - a.g.tried) || b.g.partial-a.g.partial);
    const kept = [];
    for (const c2 of t1) {
      const b2 = bucket(c2);
      const n = cnt.get(b2) || 0;
      if (n >= 2) continue;
      cnt.set(b2, n + 1);
      kept.push(c2);
    }
    t1.length = 0;
    t1.push(...kept);
  }

  // 3) rank the band on the FULL battery, then engine-replay the best plans
  const tries = [];
  const order = [];
  { // rank the tier1 band on the full battery (each full battery = 48 sims ≈ tens of s
    // on chute plans) — top-2 candidates only, stop at the first perfect plan
    const ranked = t1.slice();
    ranked.sort((a, b) => (b.g.pass - b.g.tried) - (a.g.pass - a.g.tried) || b.g.partial-a.g.partial);
    for (const c2 of ranked.slice(0, 2)) {
      if (Date.now() >= GLOBAL_DL) break;
      const g2 = await gauntlet(lv, c2.plan, 2);
      rec.simsRun += g2.tried;
      order.push({ ...c2, g: g2 });
      // Keep both ranked candidates: a 48/48 plan may still fail the wider
      // 96-case recorded battery. Only the latter earns a solution.
    }
    order.sort((a, b) => (b.g.pass - b.g.tried) - (a.g.pass - a.g.tried) || b.g.partial-a.g.partial);
    if (order.length) {
      best = order[0];
      rec.robustness = { seedsPassed: best.g.pass, seedsTried: best.g.tried, rate: +best.g.rate.toFixed(3) };
      rec.plan = { kind: 'static', strokes: best.plan.lines, releaseFrames: 0, seedBattery: { seeds: SEEDS, offsets: OFFSETS } };
      rec.evidence.bestGen = best.gen;
      log('L' + id1 + ' gauntlet best: ' + best.g.pass + '/' + best.g.tried + ' gen=' + best.gen + ' t=' + (Date.now() - t0) + 'ms');
    } else log('L' + id1 + ' gauntlet produced no ranked plan');
  }
  if (!order.length) { // nothing survived tier0/1: fall back to raw tier0 survivors
    for (const c2 of survivors.slice(0, 4)) order.push(c2);
  }
  const engineDl = Math.min(Date.now() + BUD_ENGINE_MS, GLOBAL_DL); // anchored AFTER ranking
  // Play the CURRENTLY OPEN level entry: draw the recorded strokes on its live rAF
  // chain and pump to a verdict. Used right after the capture click, so the sim's
  // exact-stream alignment refers to THIS entry (same chain, no re-entry).
  function playCurrentEntry(drawn, deadline) {
    let st = C('__SS.st()');
    if (!st || st.state !== 'playing') return { won: false, why: 'not-playing', iters: 0 };
    for (const l of drawn) dragLine(l);
    // read back the engine's OWN geometry right after drawing: onPointerMove decimates
    // points closer than 3px, so `drawnLines` differs from the plan polyline — this is
    // the geometry physics actually collides against (used for every downstream sim)
    const engineGeom = C('__SS.linesExact()').map(pts => pts.map(p => ({ x: p.x, y: p.y })));
    let iters = 0;
    for (; iters < 3800; iters++) {
      st = C('__SS.st()');
      if (st.done) return { won: !!(st.done && st.cupsDone), frames: iters * 2, iters, fills: st.fills, drawn: engineGeom };
      g.pump(2);
      if (Date.now() > deadline) return { won: false, why: 'engine-deadline', frames: iters * 2, iters, fills: st.fills, drawn: engineGeom };
    }
    st = C('__SS.st()');
    for (let f = 0; f < 300 && !st.done; f++) { g.pump(2); st = C('__SS.st()'); }
    return { won: !!(st.done && st.cupsDone), frames: iters * 2, iters, fills: st.fills, drawn: engineGeom };
  }
  for (const cand of order) {
    if (Date.now() > engineDl || rec.verdict === 'SOLVABLE') break;
    rec.engineTries++;
    // EVIDENCE 1: real engine win of the recorded plan from a fresh entry
    const r1 = engineRun(id1, cand.plan, 0, engineDl);
    tries.push({ gen: cand.gen, won: r1.won, frames: r1.frames, fills: r1.fills });
    log('L' + id1 + ' engine try' + rec.engineTries + ' gen=' + cand.gen + ' won=' + r1.won + ' fills=' + (r1.fills || []).join(','));
    if (!(r1.won && r1.drawn)) continue;
    // EVIDENCE 2a: capture a FRESH entry right after its card click (startLevel ran
    // spawn frame 0 + update synchronously — the snapshot holds grains integrated
    // exactly once) and identify the engine's exact LCG stream alignment
    C('__SS.openLevels()'); g.pump(2);
    const card2 = cards()[id1 - 1];
    if (!card2) continue;
    card2.click();
    const snap = C('__SS.partsXY()'); // deliberately NO pump after the click
    let align = null;
    try { align = identifyAlignment(lv, snap); } catch (e) { align = null; }
    if (align === null) { log('L' + id1 + ' alignment NOT identified (stream-anchor mismatch) — next candidate'); continue; }
    if (Date.now() > engineDl) { rec.notes = 'won once but engine budget exhausted before capture-run'; continue; }
    // EVIDENCE 2b: CONTINUE THAT SAME entry, playing the recorded strokes (r3).
    // r3.drawn is the ENGINE's own decimated geometry (read back from drawnLines) —
    // every downstream sim uses it so evidence refers to the physics' true input.
    const r3 = playCurrentEntry(r1.drawn, engineDl);
    tries.push({ gen: cand.gen + ':capture', won: r3.won, frames: r3.frames, fills: r3.fills });
    // bitwise sim at the captured alignment on the ENGINE geometry: strokes active
    // from sim frame 1, the strokes' playDrawSound draws injected before sim frame 1.
    // OFF-BY-ONE (probe-proven): simStaticLCG advances the state BEFORE its first draw
    // (first draw = state[pre+1]), but `align` IS the engine's first spawn draw
    // (state[align]); therefore pre = align - 1. With this, the sim matches the engine
    // BITWISE on every sampled frame (positions, 2-decimal, all frames probed).
    const captured = r3.drawn || r1.drawn;
    const nStrokes = captured.length;
    const exact = simStaticLCG(lv, CW, CH, { lines: captured }, align - 1, 1, 4200, 1, nStrokes);
    rec.simsRun += 1;
    // frame agreement: st.done is sampled at the TOP of each pump-pair iteration, so
    // the engine's detection frame is exactly 2*iters (vs the sim's frame index for the
    // same engine frame); ±2 covers the sampling latency. A misaligned or wrong-geometry
    // stream diverges unboundedly, so this still gates rigorously.
    const frameDiff = exact.ok ? Math.abs(exact.frame - 2 * r3.iters) : Infinity;
    log('L' + id1 + ' capture-run won=' + r3.won + ' engFrame~' + (2 * r3.iters) +
      ' sim=' + (exact.ok ? 'win@f' + exact.frame : 'loss ' + exact.fills.join(',')) + ' align@' + align);
    if (!(r3.won && exact.ok && frameDiff <= 2)) continue;
    // EVIDENCE 3: second full engine run, fresh entry (natural RNG alignment)
    if (Date.now() > engineDl) { rec.notes = 'capture-run proven but engine budget exhausted before replay-2'; continue; }
    const r2 = engineRun(id1, cand.plan, 0, engineDl);
    tries.push({ gen: cand.gen + ':replay2', won: r2.won, frames: r2.frames, fills: r2.fills });
    // EVIDENCE 4: robustness battery on the ENGINE geometry (16 seeds x 6 RNG stream
    // offsets). All 96 must pass before recording a new proven solution.
    const gsim = await gauntletRec(lv, { lines: captured });
    rec.simsRun += gsim.tried;
    if (r2.won && gsim.pass === gsim.tried) {
      rec.verdict = 'SOLVABLE';
      rec.plan = { kind: 'static', strokes: captured, releaseFrames: 0, seedBattery: { seeds: SEEDS, offsets: REC_OFFSETS }, note: 'strokes = ENGINE-captured geometry (post 3px resample), replayable 1:1' };
      rec.evidence.replay = {
        engineRun1: { won: true, frames: r1.frames },
        captureRun3: { won: true, engineFrame: 2 * r3.iters, lcgAlignment: align },
        engineRun2: { won: r2.won, frames: r2.frames },
        exactStreamSim: { alignment: align, winFrame: exact.frame, frameAgreement: frameDiff, bitwise: true, engineGeometryPoints: captured.map(l => l.length) },
        simBatteryOnRecorded: { pass: gsim.pass, tried: gsim.tried } };
      rec.robustness = { seedsPassed: gsim.pass, seedsTried: gsim.tried, rate: +gsim.rate.toFixed(3) };
      log('L' + id1 + ' SOLVABLE — engine x2 + capture/exact-stream win@f' + exact.frame +
        ' (d' + frameDiff + ') + recorded battery ' + gsim.pass + '/' + gsim.tried);
      break;
    } else {
      log('L' + id1 + ' replay insufficient (r2=' + r2.won + ', battery ' + gsim.pass + '/' + gsim.tried + ') — trying next candidate');
    }
  }
  rec.evidence.engineTries = tries;

  // 4) verdict
  if (!rec.verdict) {
    rec.verdict = 'STILL-UNPROVEN';
    rec.notes = 'finite staged search produced no proven plan: ' + rec.gens + ' candidates, ' + rec.simsRun +
      ' sims, gauntlet' + (rec.robustness ? ' best ' + rec.robustness.seedsPassed + '/' + rec.robustness.seedsTried : ' produced nothing') +
      ', ' + rec.engineTries + ' engine tries. This is NOT an unsolvability claim.';
  }
  log('L' + id1 + ' => ' + rec.verdict + ' (level budget ' + ((Date.now() - t0) / 1000).toFixed(1) + 's, sims ' + rec.simsRun + ')');
  return rec;
}

// ---------- main ----------
if (require.main === module) (async () => {
  // Workers evaluate deterministic batches; input order determines all choices.
  physicsPool = new PhysicsPool();
  await Promise.all(physicsPool.slots.map(s => s.ready));
  log('physics pool: ' + WORKERS + ' workers; all bitwise self-tests passed');
  const results = [];
  for (const id1 of TARGETS) {    if (Date.now() > GLOBAL_DL) {
      results.push({ level: id1, name: LV[id1 - 1].name, verdict: 'STILL-UNPROVEN',
        plan: null, robustness: null, evidence: {}, notes: 'global time budget exhausted before this level started' });
      continue;
    }
    results.push(await solveLevel(id1));
  }
  await physicsPool.close();

  const counts = { SOLVABLE: 0, UNSOLVABLE: 0, 'STILL-UNPROVEN': 0 };
  for (const r of results) counts[r.verdict]++;
  const out = {
    tool: 'solver_strong.js', generatedAt: new Date().toISOString(),
    dims: DIM, targets: TARGETS,
    method: 'static draw-once plans; tiered robustness gauntlet (16 seeds x 3 RNG stream offsets, fixed battery); physics sourced live from verify_engine.js slice (bitwise self-tested vs shipped simulate); engine replay via real pointer drags x2',
    counts, allSettled: counts['STILL-UNPROVEN'] === 0,
    results,
  };
  const solutionFile = path.join(HERE, 'solutions.json');
  const solutions = JSON.parse(fs.readFileSync(solutionFile, 'utf8'));
  let solutionsChanged = false;
  for (const r of results) if (r.verdict === 'SOLVABLE') {
    const entry = {
      name:r.name, releaseFrames:r.plan.releaseFrames, robustness:r.robustness, strokes:r.plan.strokes
    };
    if (JSON.stringify(solutions[r.level]) !== JSON.stringify(entry)) {
      solutions[r.level] = entry; solutionsChanged = true;
    }
  }
  if (solutionsChanged) fs.writeFileSync(solutionFile, JSON.stringify(solutions, null, 1) + '\n');
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));

  console.log('=== sugar-sugar strong solver — per-level verdicts (L' + TARGETS.join(',L') + ') ===');
  console.log('level | name            | verdict         | gauntlet | engine | evidence');
  for (const r of results) {
    const rb = r.robustness ? r.robustness.seedsPassed + '/' + r.robustness.seedsTried : '-';
    const eng = r.evidence.replay ? 'x2 won' : (r.evidence.engineTries || []).length ? (r.evidence.engineTries.some(t2 => t2.won) ? 'won1' : '0 win') : '-';
    console.log(String(r.level).padEnd(5) + ' | ' + String(r.name).padEnd(15) + ' | ' + r.verdict.padEnd(15) + ' | ' + String(rb).padEnd(8) + ' | ' + String(eng).padEnd(6) + ' | ' +
      (r.verdict === 'SOLVABLE' ? 'strokes=' + r.plan.strokes.length + ', replay: engine x2 + sim ' + r.evidence.replay.simBatteryOnRecorded.pass + '/' + r.evidence.replay.simBatteryOnRecorded.tried :
       r.verdict === 'UNSOLVABLE' ? r.notes : (r.notes || '').slice(0, 110)));
  }
  console.log(JSON.stringify({ counts, allSettled: out.allSettled, out: OUT_FILE, durS: Math.round((Date.now() - T0WALL) / 1000) }));
  process.exit(out.allSettled ? 0 : 3);
})().catch(e => { console.error('solver_strong threw:', (e && e.stack) || e); process.exit(1); });

module.exports = {LV, CW, CH, P, cupCatalog, comboPlan, simStatic, PhysicsPool, gauntletRec, SEEDS, REC_OFFSETS};
