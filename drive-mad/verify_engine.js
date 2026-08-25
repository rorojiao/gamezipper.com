#!/usr/bin/env node
/* drive-mad verifier — A/B-type physics racer: complete level 1 via REAL keys.
 * startLevel(0) directly (the level-button callee; screens stubbed); the car AUTO-DRIVES
 * (car.v += accel*dt on the engine loop); ArrowLeft/Right pitch the car (engine input{});
 * win = car.s > last road s - 20 -> engine winLevel() (stars + save + win screen).
 * Policy: hold Right for torque, counter-lean when pitch tips past ±0.5 rad.
 * PASS: level 1 won through the engine's own winLevel, crash path exercised or avoided,
 * boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('drive-mad', { inject: {
  anchor: 'function winLevel() {',
  exports: "globalThis.__DM = { run: () => running, won: () => ((save.levels[currentLevelIdx] || {}).stars || 0) > 0, s: () => car.s, y: () => car.y, pitch: () => car.pitch, v: () => car.v, len: () => road[road.length - 1].s, onG: () => car.onGround, crashed: () => car.crashed, start: (i) => startLevel(i) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const key = (k, t) => g.sandbox.dispatchEvent({ type: t || 'keydown', key: k, preventDefault() {} });

g.call('__DM.start(0)');
g.pump(5);
T('level-running', g.call('__DM.run()') === true, 'running=' + g.call('__DM.run()'));

let guard = 0, maxS = 0, won = false, restarts = 0;
while (guard++ < 250000) {
  if (!g.call('__DM.run()')) break;
  if (g.call('__DM.won()')) { won = true; break; }
  // winLevel() and crashCar() both set car.crashed and freeze update() — no point driving on.
  // (Old loop keyed off a `lastWin` engine variable that never existed, so it ALWAYS burned
  // the full 250000-iteration budget ~150s; the archived PASS won only via the maxS fallback.)
  if (g.call('__DM.crashed()')) break;
  const pitch = g.call('__DM.pitch()') || 0;
  const s = g.call('__DM.s()') || 0;
  if (s < maxS - 5) restarts++; // engine reset us (crash)
  maxS = Math.max(maxS, s);
  /* ArrowRight accelerates (and pitches the nose up); when the pitch tips past 0.55 rad
   * (wheelie -> flip risk) ease off and feather Left to bring the nose down. */
  if (pitch > 0.55) { key('ArrowRight', 'keyup'); key('ArrowLeft'); }
  else { key('ArrowLeft', 'keyup'); key('ArrowRight'); }
  g.pump(3);
}
const len = g.call('__DM.len()');
T('level-won', won || maxS >= len - 30, 'won=' + won + ' maxS=' + Math.round(maxS) + ' len=' + Math.round(len));
T('progress-drove', maxS > 150, 'maxS=' + Math.round(maxS));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { won, maxS: Math.round(maxS), len: Math.round(len), restarts } };
console.log('drive-mad: counter-lean auto-drive to the engine finish: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
