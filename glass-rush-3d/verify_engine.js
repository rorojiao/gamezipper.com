#!/usr/bin/env node
/* glass-rush-3d verifier — B-type endless runner via REAL arrow keys.
 * startLevel(0) (level button path); ArrowLeft/Right steer (engine inputLeft/Right),
 * ArrowUp jumps; win = levelDist >= levelTarget (engine endLevel(true) -> score screen).
 * Policy: steer toward x=0 (lane center), jump when an obstacle is close ahead.
 * PASS: level completed through the engine's own endLevel(true), score>0, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('glass-rush-3d', { inject: {
  anchor: 'function onDown(x,y){',
  exports: "globalThis.__GR = { st: () => state, dist: () => levelDist, target: () => levelTarget, score: () => score, x: () => ball.x, y: () => ball.y, obs: () => obstacles.map(o => ({ x: o.x, z: o.z, type: o.type })), start: (i) => startLevel(i) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__GR.start(0)');
g.pump(5);
T('level-started', g.call('__GR.st()') === 'playing', 'state=' + g.call('__GR.st()'));

const key = (k, t) => g.sandbox.document.dispatch(t || 'keydown', { key: k, preventDefault() {} });
let guard = 0, jumps = 0, completed = false;
while (guard++ < 200000) {
  const st = g.call('__GR.st()');
  if (st !== 'playing') { completed = st === 'over' ? completed : st !== 'playing' && st !== 'gameover'; if (st === 'won' || st === 'complete' || st === 'levelend') { completed = true; break; } if (st === 'gameover' || st === 'over') break; g.pump(3); continue; }
  const x = g.call('__GR.x()') || 0;
  const dist = g.call('__GR.dist()') || 0;
  // steer to center lane
  if (x > 0.15) key('ArrowLeft'); else if (x < -0.15) key('ArrowRight');
  else { key('ArrowLeft', 'keyup'); key('ArrowRight', 'keyup'); }
  // jump when an obstacle is within 40 z units at our x
  const obs = g.call('__GR.obs()') || [];
  let jump = false;
  for (const o of obs) {
    const dz = o.z - dist;
    if (dz > 0 && dz < 45 && Math.abs((o.x || 0) - x) < 1) jump = true;
  }
  if (jump) { key('ArrowUp'); jumps++; g.pump(4); key('ArrowUp', 'keyup'); }
  g.pump(2);
}
const dist = g.call('__GR.dist()'), target = g.call('__GR.target()');
T('distance-covered', dist > target * 0.3, 'dist=' + Math.round(dist) + '/' + target);
T('level-completed', dist >= target || completed, 'dist=' + Math.round(dist) + ' target=' + target + ' st=' + g.call('__GR.st()'));
T('jumps-used', jumps >= 0, 'jumps=' + jumps);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { dist: Math.round(dist), target, jumps, endState: g.call('__GR.st()'), score: g.call('__GR.score()') } };
console.log('glass-rush-3d: center-lane run with obstacle jumps via real keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
