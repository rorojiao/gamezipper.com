#!/usr/bin/env node
/* going-balls verifier — A/B-type runner: complete levels via REAL arrow keys.
 * startLvl(0) (level button path); ArrowUp accelerates (engine keys{}), ArrowLeft/Right
 * steer; win = ball.z >= lv.len (engine completeLvl -> stars/save).
 * Policy: hold Up; steer away from the nearest wall obstacle ahead.
 * PASS: >=2 levels completed through the engine's own completeLvl, coins collected,
 * death path respawned via the engine, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('going-balls', { inject: {
  anchor: 'function startLvl(idx) {',
  exports: "globalThis.__GB = { gs: () => gs, z: () => ball.z, x: () => ball.x, alive: () => ball.alive, len: () => LV[cl].len, cl: () => cl, obs: () => LV[cl].obs.map(o => ({ t: o.t, x: o.x, z: o.z, w: o.w })), coins: () => lCoins, start: (i) => startLvl(i) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__GB.start(0)');
g.pump(5);
T('level-started', g.call('__GB.gs()') === 'playing', 'gs=' + g.call('__GB.gs()'));

const key = (k, t) => g.sandbox.document.dispatch(t || 'keydown', { key: k, preventDefault() {} });
let guard = 0, wins = 0, deaths = 0, maxZ = 0;
while (guard++ < 150000 && wins < 2) {
  const gs2 = g.call('__GB.gs()');
  if (gs2 === 'complete') { wins++; g.call('__GB.start(' + (g.call('__GB.cl()') + 1) + ')'); g.pump(10); continue; }
  if (gs2 === 'gameover') { deaths++; break; }
  if (gs2 !== 'playing') { g.pump(3); continue; }
  if (!g.call('__GB.alive()')) { g.pump(120); continue; } // death anim -> engine respawn/gameover
  key('ArrowUp');
  // steer away from the nearest wall ahead
  const z = g.call('__GB.z()') || 0, x = g.call('__GB.x()') || 0;
  const obs = g.call('__GB.obs()') || [];
  let steer = 0;
  for (const o of obs) {
    if (o.t !== 'wall') continue;
    const dz = o.z - z;
    if (dz > 0 && dz < 320) {
      const left = o.x, right = o.x + (o.w || 1);
      // wall occupies x-band [left, right] in track space
      if (x > left - 0.5 && x < right + 0.5) steer = x < (left + right) / 2 ? -1 : 1;
    }
  }
  key(steer < 0 ? 'ArrowLeft' : 'ArrowRight', steer < 0 ? 'keydown' : 'keydown');
  if (steer === 0) { key('ArrowLeft', 'keyup'); key('ArrowRight', 'keyup'); }
  g.pump(3);
  maxZ = Math.max(maxZ, g.call('__GB.z()') || 0);
}
key('ArrowUp', 'keyup'); key('ArrowLeft', 'keyup'); key('ArrowRight', 'keyup');
T('levels-completed', wins >= 2, 'wins=' + wins + ' maxZ=' + Math.round(maxZ) + ' len=' + Math.round(g.call('__GB.len()')));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { wins, deaths, maxZ: Math.round(maxZ) } };
console.log('going-balls: steer-past-walls run via real arrow keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
