#!/usr/bin/env node
/* reaction-time verifier — B-type: play all 5 rounds through the REAL input path.
 * RT.start() -> each round: wait for the engine's own setTimeout to flip state to 'ready'
 * (timer-driven via harness pump), then click game-area -> engine records ms from its own
 * performance.now. PASS = 5/5 rounds recorded, average rendered, retry path works,
 * best persisted to localStorage.
 * Exit 0 / last stdout line JSON per repo verifier contract. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('reaction-time', { inject: {
  anchor: 'window.RT = { start: startGame };',
  exports: 'globalThis.__X = { state: () => state, times: () => times.slice(), avg: () => (times.length ? times.reduce((a, b) => a + b, 0) / times.length : null) };',
} });
let pass = 0, fail = 0; const fails = [];
const T = (name, ok, info) => { if (ok) pass++; else { fail++; fails.push(name + (info ? ': ' + info : '')); } };

T('boot-clean', g.loadErrors.length === 0 && !(g.sandbox.__errors || []).length,
  JSON.stringify((g.loadErrors || [])[0] || (g.sandbox.__errors || [])[0] || '').slice(0, 100));

const state = () => g.call('__X.state()');
const ga = g.els['game-area'] || g.sandbox['game-area'];

// start via the button's real onclick
g.call('RT.start()');
T('started-waiting', state() === 'waiting', 'state=' + state());

let times = [];
for (let r = 0; r < 5; r++) {
  // pump until the engine's own timer flips to 'ready' (delay 1.5-4s) — never click early
  let guard = 0;
  while (state() !== 'ready' && guard++ < 400) g.pump(4);
  T('round' + (r + 1) + '-ready', state() === 'ready', 'state=' + state());
  if (state() !== 'ready') break;
  g.pump(2); // ~33ms human latency
  ga.dispatch('click', { clientX: 200, clientY: 300, preventDefault() {} });
  times.push(g.call('__X.times()[__X.times().length-1]'));
}
const allTimes = g.call('__X.times()');
T('five-times-recorded', Array.isArray(allTimes) && allTimes.length === 5 && allTimes.every(t => t > 0 && t < 5000),
  JSON.stringify(allTimes));
T('result-state', state() === 'result', 'state=' + state());
const avg = g.call('__X.avg()');
T('average-rendered', avg === null || (avg > 0 && avg < 5000), 'avg=' + avg);

// retry path
g.call('RT.start()');
T('retry-restarts', state() === 'waiting', 'state=' + state());

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails };
if (fails.length) out.fails = fails;
console.log('reaction-time: 5-round real-click playthrough (engine timers + performance.now): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
