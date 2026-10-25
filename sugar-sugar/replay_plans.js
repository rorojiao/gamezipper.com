#!/usr/bin/env node
/* replay_plans.js — standalone REPLAY verifier for solver_strong.js results.
 * Loads ONLY the recorded plans from solver_results.json (no search) and, for every
 * SOLVABLE level, re-asserts the win through BOTH channels:
 *   1. the REAL engine (canvas pointer drags through the level-card entry path), and
 *   2. the engine's OWN RNG stream: capture entry -> identify the exact LCG alignment
 *      from the frame-0 particle snapshot -> simStaticLCG on the recorded strokes
 *      (engine geometry) must win within ±2 frames of the engine run (bitwise-equal
 *      trajectories were probe-verified; the window only covers sampling latency).
 * plus 3. the robustness battery (16 seeds x 6 stream offsets, mulberry) >= 90%.
 * The physics slice is asserted bitwise-equal to the gate's simulate() on every run.
 * Exit 0 iff every SOLVABLE level reproduces; 4 otherwise. Fixed battery, no network.
 */
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const HERE = __dirname;
const GATE = path.join(HERE, 'verify_engine.js');
const RES = JSON.parse(fs.readFileSync(path.join(HERE, 'solver_results.json'), 'utf8'));

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
  lv: function(i){ var L=LEVELS[i]; return { name:L.name, spawnTotal:L.spawnTotal,
    disp: L.dispenser.map(function(d){return {x:d.x,y:d.y,color:d.color};}),
    cups: L.cups.map(function(c){return {x:c.x,y:c.y,w:c.w,h:c.h,color:c.color,need:c.need};}),
    walls: L.walls.map(function(w){return {x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2};}) }; },
  dims: function(){ return { cw: cw, ch: ch }; },
  st: function(){ return { state: state, lvl: currentLevel, done: levelComplete,
    fills: cups.map(function(c){ return Math.min(c.fill, c.need) + '/' + c.need; }),
    cupsDone: cups.every(function(c){ return c.fill >= c.need; }),
    lines: drawnLines.length, spawned: spawnCounter, maxSpawn: maxSpawn }; },
  partsXY: function(){ return particles.filter(function(p){return p.active;}).map(function(p){return {x:p.x,y:p.y,vx:p.vx,vy:p.vy,color:p.color};}); },
  openLevels: function(){ showLevels(); },
};`
} });
const C = (e) => g.call(e);
const cv = g.els['gameCanvas'];
C('__SS.openLevels()'); g.pump(2);
const cards = () => Array.from(g.els['tierContainer'].children).slice(0, 5)
  .flatMap(sec => Array.from(sec.children[1].children));
cards()[0].click(); g.pump(4);
const DIM = C('__SS.dims()'); const CW = DIM.cw, CH = DIM.ch;
globalThis.CW = CW; globalThis.CH = CH; // lifted solver helpers resolve these dynamically

// shipped physics + self-test (bitwise equality with the gate's own simulate)
const GATE_SRC = fs.readFileSync(GATE, 'utf8');
const SLICE = GATE_SRC.slice(GATE_SRC.indexOf('const GRAVITY'), GATE_SRC.indexOf('// ---------- boot + level data integrity')).replace(/^const /gm, 'var ');
const P = (function(){ eval(SLICE); return { mulberry, collideSeg, GRAVITY: 0.15, PR: 3, LT: 4, FRICTION: 0.98, BOUNCE: 0.4, MAXP: 300, RATE: 3, simulate }; })();

// lift identifyAlignment + simStaticLCG (and their LCG tables) from the solver text
const solverSrc = fs.readFileSync(path.join(HERE, 'solver_strong.js'), 'utf8');
const lstart = solverSrc.indexOf('const LCG_A');
const lend = solverSrc.indexOf('let LVsel');
if (lstart < 0 || lend < 0 || lend <= lstart) { console.error('lift failed'); process.exit(1); }
const lifted = solverSrc.slice(lstart, lend).replace(/^const LCG_A/m, 'var LCG_A');
(0, eval)(lifted + '\nthis.identifyAlignment = identifyAlignment; this.simStaticLCG = simStaticLCG;');
const { identifyAlignment, simStaticLCG } = globalThis;
globalThis.P = P; // lifted simStaticLCG resolves P.<physics> dynamically

function simStatic(lv, cw, ch, plan, seed, offset, t0, frameBudget) {
  const rng = P.mulberry(seed);
  for (let k = 0; k < offset; k++) rng();
  const disp = lv.disp.map(d => ({ x: d.x / 100 * cw, y: d.y / 100 * ch, color: d.color }));
  const cups = lv.cups.map(c => ({ x: c.x / 100 * cw, y: c.y / 100 * ch, w: c.w / 100 * cw, h: c.h / 100 * ch, color: c.color, need: c.need, fill: 0 }));
  const walls = lv.walls.map(w => ({ x1: w.x1 / 100 * cw, y1: w.y1 / 100 * ch, x2: w.x2 / 100 * cw, y2: w.y2 / 100 * ch }));
  const maxSpawn = lv.spawnTotal;
  let spawnCount = 0, particles = [];
  const lines = plan.lines.map(l => ({ pts: l.pts || l }));
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
    if (cups.every(c => c.fill >= c.need)) return { ok: true, frame: f, fills: cups.map(c => c.fill) };
  }
  return { ok: false, fills: cups.map(c => c.fill + '/' + c.need) };
}

// boot-time bitwise self-test: my simStatic === shipped simulate (t0=0/offset=0)
{
  const lv0 = C('__SS.lv(9)');
  const plans = [
    { lines: [{ pts: [{ x: 100, y: 100 }, { x: 200, y: 140 }] }] },
    { lines: [{ pts: [{ x: 60, y: 300 }, { x: 200, y: 260 }, { x: 360, y: 300 }] }] },
    { lines: [{ pts: [{ x: 90, y: 180 }, { x: 180, y: 150 }] }, { pts: [{ x: 280, y: 320 }, { x: 380, y: 340 }] }] },
  ];
  for (const pl of plans) for (const sd of [424242, 7, 123456789]) {
    const a = simStatic(lv0, CW, CH, pl, sd, 0, 0, 800);
    const b = P.simulate(lv0, CW, CH, pl, sd, 800);
    const same = a.ok === b.ok && (!a.ok || (a.frame === b.frame && JSON.stringify(a.fills) === JSON.stringify(b.fills)));
    if (!same) { console.error('SELF-TEST FAIL: simStatic !== shipped simulate'); process.exit(2); }
  }
  console.log('self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)');
}

function dragLine(pts) {
  // identity client mapping (canvas stub rect == backing store; see solver_strong.js)
  cv.dispatch('pointerdown', { clientX: pts[0].x, clientY: pts[0].y, pointerId: 1, button: 0, preventDefault() {} });
  for (let i = 1; i < pts.length; i++) cv.dispatch('pointermove', { clientX: pts[i].x, clientY: pts[i].y, pointerId: 1, preventDefault() {} });
  cv.dispatch('pointerup', { clientX: pts[pts.length - 1].x, clientY: pts[pts.length - 1].y, pointerId: 1, preventDefault() {} });
}

console.log('replay_plans: asserting ' + RES.results.filter(r => r.verdict === 'SOLVABLE').length + ' SOLVABLE plans from solver_results.json');
const MAX_TRIES = 4; // per-level attempts: the capture click produces naturally
// different grain folds per attempt, so a plan whose first fill-landing fold can
// genuinely flip may need try 2 — exactly what the solver itself does.
let okAll = true;
for (const rec of RES.results) {
  if (rec.verdict !== 'SOLVABLE' || !rec.plan) continue;
  const id1 = rec.level;
  const lv = C('__SS.lv(' + (id1 - 1) + ')');
  const plan = { lines: rec.plan.strokes };
  // ONE capture entry per attempt drives BOTH channels (a fresh entry has a different
  // RNG alignment, so cross-entry frame comparison would be meaningless):
  //   channel 1: engine win by playing the recorded strokes on this entry
  //   channel 2: exact-stream sim at THIS entry's identified alignment
  let engOK = false, exactOK = false, align = null, exWin = -1, engWinFrame = -1, st = null;
  let ok = false, pass = 0, tried = 0;
  for (let attempt = 1; attempt <= MAX_TRIES && !ok; attempt++) {
    C('__SS.openLevels()'); g.pump(2);
    cards()[id1 - 1].click();
    const st0 = C('__SS.st()');
    if (st0.lvl !== id1 - 1 || st0.state !== 'playing') { console.log('L' + id1 + ' REPLAY-FAIL: bad-load'); okAll = false; break; }
    const snap = C('__SS.partsXY()'); // NO pump (grains integrated exactly once)
    align = identifyAlignment(lv, snap);
    for (const l of plan.lines) dragLine(l);
    let won = false, winIter = -1;
    for (let iters = 0; iters < 2100; iters++) {
      const s2 = C('__SS.st()');
      if (s2.done) { won = s2.done && s2.cupsDone; winIter = iters; break; }
      g.pump(2);
    }
    st = C('__SS.st()');
    engOK = won;
    engWinFrame = 2 * winIter;
    // channel 2 (off-by-one probe-proven: simStaticLCG advances the state BEFORE its
    // first draw, align IS the first draw slot)
    exactOK = false; exWin = -1;
    if (align !== null) {
      const ex = simStaticLCG(lv, CW, CH, plan, align - 1, 1, 4200, 1, plan.lines.length);
      exWin = ex.ok ? ex.frame : -1;
      exactOK = ex.ok && Math.abs(ex.frame - engWinFrame) <= 2;
    }
    // channel 3 (battery): run once, on the first attempt only
    if (attempt === 1) {
      for (const sd of rec.plan.seedBattery.seeds) for (const of2 of rec.plan.seedBattery.offsets) {
        tried++;
        if (simStatic(lv, CW, CH, plan, sd, of2, 1, 4200).ok) pass++;
      }
    }
    ok = engOK && exactOK && pass / tried >= 0.9;
    if (!ok && attempt < MAX_TRIES) console.log('L' + id1 + ' attempt ' + attempt + ' insufficient (engine ' + (engOK ? 'WON' : 'FAIL ' + st.fills.join(',')) + ', exact ' + (exactOK ? 'ok' : 'mismatch') + ') — retrying');
  }
  if (!ok) okAll = false;
  console.log('L' + id1 + ' "' + lv.name + '" | engine: ' + (engOK ? 'WON f' + engWinFrame : 'FAIL ' + (st ? st.fills.join(',') : '-')) +
    ' | exact-stream: ' + (exactOK ? 'win@f' + exWin + ' align@' + align : (align === null ? 'NO-ALIGN' : 'MISMATCH f' + exWin)) +
    ' | battery: ' + pass + '/' + tried + ' | ' + (ok ? 'REPLAY-OK' : 'REPLAY-FAIL'));
}
console.log(okAll ? 'ALL REPLAYS OK' : 'REPLAY FAILURES PRESENT');
process.exit(okAll ? 0 : 4);
