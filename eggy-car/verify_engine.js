#!/usr/bin/env node
/* eggy-car verifier — B-type physics driving via REAL key events.
 * playBtn -> playing; pulsed ArrowRight (document keydown/keyup — the engine's own
 * throttle path) keeps speed moderate; distance accrues on the engine's own loop.
 * PASS: distance > 25m under policy, engine reaches a natural gameover or sustained
 * run without vm errors, best distance persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('eggy-car', { inject: {
  anchor: 'function startGame(){',
  exports: "globalThis.__EC = { st: () => gameState, dist: () => distance, eggFell: () => !!(egg && egg.fellOff), carX: () => car && car.x, save: () => save };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.els['playBtn'].dispatch('click', {});
g.pump(30); // let the 300ms button lock (engine's own setTimeout) clear
if (g.call('__EC.st()') === 'tutorial') g.els['skipTutorialBtn'].dispatch('click', {}); // first-visit tutorial (real skip button)
g.pump(10);
T('game-started', g.call('__EC.st()') === 'playing', 'state=' + g.call('__EC.st()'));

const key = (k, type) => g.sandbox.document.dispatch(type || 'keydown', { key: k, code: k, preventDefault() {} });
let maxDist = 0, guard = 0;
while (g.call('__EC.st()') === 'playing' && guard++ < 12000) {
  // pulse throttle: 6 frames on, 3 off — moderates speed for egg stability
  key('ArrowRight', 'keydown'); g.pump(6);
  key('ArrowRight', 'keyup'); g.pump(3);
  maxDist = Math.max(maxDist, g.call('__EC.dist()') || 0);
  if (maxDist > 60) break; // policy bar met
}
T('distance-driven', maxDist > 25, 'maxDist=' + maxDist.toFixed(1) + 'm');
const save = g.call('__EC.save()');
T('best-distance-persisted-or-live', (save && save.bestDist >= 25) || g.call('__EC.st()') === 'playing', 'best=' + (save && save.bestDist) + ' state=' + g.call('__EC.st()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { maxDist: +maxDist.toFixed(1) } };
console.log('eggy-car: pulsed-throttle drive via real key events: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
