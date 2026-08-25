#!/usr/bin/env node
/* color-cars-parking verifier — 50 click-order puzzle levels solved by BFS over the
 * engine's own sequential semantics (click car -> auto-drive whole path; per-step
 * collision vs parked cars + active blocks; switch clicks toggle target blocks),
 * then replayed through REAL input: canvas pointerdown on car/switch cells, engine
 * crash -> real result-restart button; win = engine winLevel (result-overlay.active
 * with result-content.win). Sequential play: each car finishes before the next click. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('color-cars-parking', { inject: {
  anchor: 'function updateCars(dt){',
  exports: `globalThis.__P = {
    n: () => LEVELS.length,
    start: (i) => startGame(i),
    state: () => ({ lvl: gameState.levelIdx, cars: gameState.cars.map(c => ({ xi: c.xi, yi: c.yi, done: c.done, moving: c.moving, pi: c.pathIndex })),
      blocks: gameState.blocks.map(b => ({ x: b.x, y: b.y, active: b.active })),
      sw: gameState.switches.map(s => ({ x: s.x, y: s.y, on: s.on, t: s.targets })),
      failed: gameState.failed, complete: gameState.complete, w: gameState.lvl.w, h: gameState.lvl.h }),
    paths: () => LEVELS[gameState.levelIdx].cars.map(c => c.path.map(p => [p.x, p.y])),
    geo: () => { var cs = getCellSize(); var cw = canvas.width / window.devicePixelRatio; return { cs, ox: (cw - cs * LEVELS[currentLevel].w) / 2, oy: (cw - cs * LEVELS[currentLevel].h) / 2 }; },
    won: () => document.getElementById('result-overlay').classList.contains('active') && document.getElementById('result-content').className === 'win',
    crashed: () => gameState.failed,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.gameCanvas;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__P.n()');
T('levels-exist', N === 50, 'n=' + N);

function cellClick(gx, gy) { // real pointerdown on a grid cell (car or switch)
  const geo = g.call('__P.geo()');
  const px = geo.ox + gx * geo.cs + geo.cs / 2, py = geo.oy + gy * geo.cs + geo.cs / 2;
  cv().dispatch('pointerdown', { clientX: px, clientY: py, preventDefault() {} });
}
function settle() { for (let f = 0; f < 400; f++) { g.pump(2); if (!g.call('__P.state()').cars.some(c => c.moving)) break; } g.pump(25); }

// ---- engine-exact frame simulator (pump dt=0.0167, ANIM_SPEED=3 -> ap+=0.05/frame;
// per-step collision when a segment completes; click-time check only guards the car's
// own start cell, so the real timing puzzle is the chase: pursueer legal once the
// leader is >=0.8 into the segment) ----
function makeSim(paths0, blocks0, sws0) {
  return { paths: paths0, cars: paths0.map((p, i) => ({ xi: p[0][0], yi: p[0][1], pi: 0, ap: 0, moving: false, done: p.length === 1 })), blocks: blocks0.map(b => ({ ...b })), sws: sws0.map(s2 => ({ on: true })), failed: false };
}
function simKey(s2) { return s2.cars.map(c => c.pi + ',' + (c.moving ? 1 : 0) + ',' + c.done + ',' + Math.round(c.ap * 1000)).join('|') + '#' + s2.blocks.map(b => b.active ? 1 : 0).join('') + '#' + s2.sws.map(x => x.on ? 1 : 0).join(''); }
function simClickOK(s2, ci) { // click-time check (next = own start cell, pathIndex 0)
  const car = s2.cars[ci];
  if (car.moving || car.done) return false;
  const nx = s2.paths[ci][0][0], ny = s2.paths[ci][0][1];
  for (let j = 0; j < s2.cars.length; j++) {
    if (j === ci) continue;
    const o = s2.cars[j];
    if (o.moving && o.pi < s2.paths[j].length) { // engine: moving other on/into my start cell with ap<0.8 -> click crashes
      const ox = o.pi > 0 ? s2.paths[j][o.pi - 1][0] : s2.paths[j][0][0], oy = o.pi > 0 ? s2.paths[j][o.pi - 1][1] : s2.paths[j][0][1];
      const onx = s2.paths[j][o.pi][0], ony = s2.paths[j][o.pi][1];
      if (((ox === nx && oy === ny) || (onx === nx && ony === ny)) && o.ap < 0.8) return false;
    }
    if (!o.done && o.xi === nx && o.yi === ny) return false;
  }
  for (const b of s2.blocks) if (b.active && b.x === nx && b.y === ny) return false;
  return true;
}
function simStepCollision(s2, ci) { // engine checkCollision at segment boundaries
  const car = s2.cars[ci];
  if (car.pi >= s2.paths[ci].length - 1) return false;
  const nx = s2.paths[ci][car.pi][0], ny = s2.paths[ci][car.pi][1];
  for (let j = 0; j < s2.cars.length; j++) {
    if (j === ci) continue;
    const o = s2.cars[j];
    if (o.moving && o.pi < s2.paths[j].length) {
      const ox = o.pi > 0 ? s2.paths[j][o.pi - 1][0] : s2.paths[j][0][0];
      const oy = o.pi > 0 ? s2.paths[j][o.pi - 1][1] : s2.paths[j][0][1];
      const onx = s2.paths[j][o.pi][0], ony = s2.paths[j][o.pi][1];
      if ((ox === nx && oy === ny) || (onx === nx && ony === ny)) { if (o.ap < 0.8) return true; }
    }
    if (!o.done && o.xi === nx && o.yi === ny && !(o.moving && o.ap >= 0.8)) return true; // P0-fixed semantics: 80%-out cars are passable
  }
  for (const b of s2.blocks) if (b.active && b.x === nx && b.y === ny) return true;
  return false;
}
let G_budget = 0;
function simFrame(s2) { // one pump: ap += 0.05, boundaries resolve in engine order
  G_budget--;
  s2.cars.forEach((car, idx) => {
    if (!car.moving || s2.failed) return;
    car.ap += 0.05;
    if (car.ap >= 1) {
      car.ap = 0; car.pi++;
      if (car.pi >= s2.paths[idx].length) { car.moving = false; car.done = true; car.xi = s2.paths[idx][s2.paths[idx].length - 1][0]; car.yi = s2.paths[idx][s2.paths[idx].length - 1][1]; }
      else { car.xi = s2.paths[idx][car.pi - 1][0]; car.yi = s2.paths[idx][car.pi - 1][1]; if (simStepCollision(s2, idx)) { s2.failed = true; car.moving = false; } }
    }
  });
  return s2;
}
function simAllDone(s2) { return s2.cars.every(c => c.done); }

// plan: enumerate click ORDERS (permutations, incl. switch toggles in sequence) x
// click TIMES (offsets from the previous action). Timing is the real puzzle: the
// click-time collision check only guards a car's own cell, so a pursuing car clicked
// too early crashes mid-drive; clicked once the leader is >=0.8 into the shared
// segment the chain cascades. Each candidate is validated by running the sim to
// completion (no crash, all done) before it is accepted.
function perms(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach(p => out.push([x, ...p])));
  return out;
}
const OFFS = [0, 16, 20, 40, 80, 12, 8, 4, 2, 60]; // MUST mirror fix-color-cars-levels.js: levels are validated with exactly this offset set
const clone = (sim) => ({ paths: sim.paths, cars: sim.cars.map(c => ({ ...c })), blocks: sim.blocks.map(b => ({ ...b })), sws: sim.sws.map(x => ({ ...x })), failed: sim.failed });
function runOut(sim) { let f = 0; while (!simAllDone(sim) && !sim.failed && f++ < 900 && G_budget > 0) simFrame(sim); return simAllDone(sim) && !sim.failed; }
function simToggleOK(sim, si) { // getClickedCar wins the cell if any not-done car sits/ends a segment on it
  const sx = G_sws[si].x, sy = G_sws[si].y;
  return !sim.cars.some(c => !c.done && c.xi === sx && c.yi === sy);
}
function simToggle(sim, si) {
  sim.sws[si].on = !sim.sws[si].on;
  for (const t of G_sws[si].t) { const b = sim.blocks.find(x => x.x === t.x && x.y === t.y); if (b) b.active = sim.sws[si].on; }
}
function searchSeq(seq, deadline) { // seq: array of {kind:'car'|'sw', i}
  G_budget = 60000; // per-sequence node+frame budget (mirrors the fixer)
  const rec = (sim, k, acts) => {
    G_budget--; // a rec node costs budget even at offset 0
    if (sim.failed || G_budget <= 0 || Date.now() > deadline) return null;
    if (k >= seq.length) { const s2 = clone(sim); return runOut(s2) ? acts : null; }
    for (const off of OFFS) {
      const s2 = clone(sim);
      let ok = true;
      for (let i = 0; i < off; i++) { simFrame(s2); if (s2.failed) { ok = false; break; } }
      if (!ok) continue;
      const a = seq[k];
      if (a.kind === 'car') {
        const ci = a.i;
        if (s2.cars[ci].moving || s2.cars[ci].done || !simClickOK(s2, ci)) continue;
        s2.cars[ci].moving = true; s2.cars[ci].pi = 1; s2.cars[ci].ap = 0;
        const r = rec(s2, k + 1, acts.concat(Array(off).fill({ t: 'wait' }), [{ t: 'car', i: ci }]));
        if (r) return r;
      } else {
        if (!simToggleOK(s2, a.i)) continue;
        simToggle(s2, a.i);
        const r = rec(s2, k + 1, acts.concat(Array(off).fill({ t: 'wait' }), [{ t: 'sw', i: a.i, x: G_sws[a.i].x, y: G_sws[a.i].y }]));
        if (r) return r;
      }
    }
    return null;
  };
  return rec(makeSim(G_paths, G_blocks, G_sws), 0, []);
}
let G_paths, G_blocks, G_sws, G_planMs;
function plan(paths0, blocks0, sws0) {
  G_paths = paths0; G_blocks = blocks0; G_sws = sws0;
  const cars = paths0.map((_, i) => i);
  // sequences: all interleavings of car clicks with at most one toggle per switch
  const seqs = [];
  const baseSeqs = perms(cars).map(o => o.map(i => ({ kind: 'car', i })));
  for (const bs of baseSeqs) {
    seqs.push(bs);
    for (let si = 0; si < sws0.length; si++) for (const pos of [0, bs.length]) seqs.push([...bs.slice(0, pos), { kind: 'sw', i: si }, ...bs.slice(pos)]);
  }
  const deadline = Date.now() + (G_planMs || 1500); // per-level search budget (mirrors the fixer's 1500ms validation window)
  // abort only on the time deadline (mirrors the fixer): searchSeq resets G_budget per
  // sequence, so one budget-exhausting sequence must NOT abandon the remaining ones
  for (const seq of seqs) { const acts = searchSeq(seq, deadline); if (acts) return acts; if (Date.now() > deadline) return null; }
  return null;
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__P.start(${i})`); g.pump(3); // level must be live: plan() reads engine paths/state
  const paths = g.call('__P.paths()');
  const s0 = g.call('__P.state()');
  const acts = plan(paths, s0.blocks.map(b => ({ ...b })), s0.sw); console.error('planned L' + (i + 1) + ': ' + (acts ? acts.length : 'none'));
  if (!acts) { fails.push('L' + (i + 1) + ' no plan'); continue; }
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    if (attempt > 0) { g.call(`__P.start(${i})`); g.pump(3); }
    for (const a of acts) {
      if (a.t === 'wait') { g.pump(1); continue; } // exact frame timing from the plan
      const st = g.call('__P.state()');
      if (a.t === 'car') cellClick(st.cars[a.i].xi, st.cars[a.i].yi); else cellClick(a.x, a.y);
      if (g.call('__P.crashed()')) break; // engine disagrees with the plan (shouldn't: deterministic)
    }
    settle(); g.pump(30); // let stragglers finish + winLevel 300ms timer
    if (g.call('__P.won()')) ok = true;
    else g.els['result-restart'].dispatch('click', {}); // real restart for the retry
  }
  if (ok) solved.push(i + 1); else fails.push('L' + (i + 1) + ' replay failed acts=' + JSON.stringify(acts));
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' [' + fails.slice(0, 3).join(' | ') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { solved: solved.length + '/' + N, note: 'BFS plans over engine sequential semantics, replayed via real canvas pointerdown clicks; crashes handled by real result-restart button' } };
console.log('color-cars-parking: ' + solved.length + '/' + N + ' levels driven via real clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
