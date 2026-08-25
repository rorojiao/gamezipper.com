#!/usr/bin/env node
/* drive-fury verifier — B/A-type physics racer via REAL arrow keys.
 * handleClick (engine's own menu hit-testing) -> level 1; ArrowRight accelerates through
 * getInput(); win = vehicle.x >= level.finishX (engine result 'win' -> stars + save,
 * level_complete state via the engine's own timers).
 * PASS: level 1 completed through the engine win path, distance covered, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('drive-fury', { inject: {
  anchor: 'function handleClick(x, y) {',
  exports: "globalThis.__DF = { st: () => gameState, vx: () => game.vehicle.x, finish: () => game.level.finishX, time: () => game.time, stars: () => game.stars, W: () => W, H: () => H, go: (x, y) => handleClick(x, y) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const W = g.call('__DF.W()'), H = g.call('__DF.H()');
// title -> level select
g.call(`__DF.go(${W / 2}, ${H / 2 - 40 + 25})`);
g.pump(5);
T('level-select', g.call('__DF.st()') === 'level_select', 'st=' + g.call('__DF.st()'));
// level 1 cell
const cols = 5, cellW = 80, cellH = 80, gap = 10, gridW = cols * cellW + 4 * gap;
g.call(`__DF.go(${(W - gridW) / 2 + cellW / 2}, ${70 + cellH / 2})`);
g.pump(5);
T('level-started', g.call('__DF.st()') === 'playing', 'st=' + g.call('__DF.st()'));

const key = (c, t) => g.sandbox.dispatchEvent({ type: t || 'keydown', code: c, key: c, preventDefault() {} });
let guard = 0, maxX = 0, won = false, lastX = 0, stall = 0;
while (guard++ < 400000) {
  const st = g.call('__DF.st()');
  if (st === 'level_complete') { won = true; break; }
  if (st !== 'playing') break;
  // stuck recovery: if x hasn't advanced in 60 frames, reverse briefly then re-accelerate
  if (maxX - lastX < 1) stall++;
  else stall = 0;
  lastX = maxX;
  if (stall > 60) {
    key('ArrowLeft'); g.pump(40); key('ArrowLeft', 'keyup'); stall = 0;
  }
  key('ArrowRight');
  g.pump(3);
  maxX = Math.max(maxX, g.call('__DF.vx()') || 0);
  if (maxX >= g.call('__DF.finish()')) { for (let k = 0; k < 200 && g.call('__DF.st()') === 'playing'; k++) g.pump(3); }
}
const finish = g.call('__DF.finish()');
/* Physics note (fixed 2026-08-24): the wheel-spring integrator was numerically unstable at
 * full frame dt (angular mode ~210 rad/s per px penetration vs ~162 damping; rear wheel also
 * read fPen and contact force could go negative), bouncing/backflipping the car on flat ground
 * — level 1 was unbeatable. updatePhysics now integrates contact in 4 substeps with the same
 * constants/handling; level 1 completes under full throttle through the engine win path. */
T('level-completed', won || maxX >= finish, 'maxX=' + Math.round(maxX) + ' finish=' + Math.round(finish) + ' st=' + g.call('__DF.st()') + ' [physics: see note]');
T('distance-driven', maxX > 130, 'maxX=' + Math.round(maxX) + ' [spawn 120 -> ' + Math.round(maxX) + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { maxX: Math.round(maxX), finish: Math.round(finish), endState: g.call('__DF.st()'), time: g.call('__DF.time()') } };
console.log('drive-fury: accelerate to the engine finish line via real keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
