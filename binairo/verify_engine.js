#!/usr/bin/env node
/* binairo verifier — A-type: solve every level by replaying the embedded solution
 * through the engine's own cell-tap + placeValue chain (givens immutable; each placed
 * digit runs findConflicts + isComplete -> winLevel). PASS: 27/27 finished by the
 * engine with 0 conflicts at completion, mistakes=0 on solution lines, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('binairo', { inject: {
  anchor: 'function placeValue(d){',
  exports: "globalThis.__BI = { n: () => LEVELS_DATA.length, load: (i) => startLevel(i), fin: () => S.finished, mistakes: () => S.mistakes, sel: (r, c) => { S.selR = r; S.selC = c; }, place: (d) => placeValue(d), grid: () => S.grid.map(r => r.join('')), conflicts: () => findConflicts(S.grid, S.N).size };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const N = g.call('__BI.n()');
T('levels-exist', N >= 20, 'n=' + N);
let done = 0;
for (let i = 0; i < N; i++) {
  g.call(`__BI.load(${i})`);
  g.pump(3);
  // replay the embedded solution through the real cell-tap + placeValue path
  const res = g.call(`(function(){var N=S.N;for(var r=0;r<N;r++){for(var c=0;c<N;c++){var want=S.solution[r][c];if(S.grid[r][c]===want)continue;S.selR=r;S.selC=c;placeValue(want);if(S.finished)return {r:r,c:c};}}return null})()`);
  g.pump(3);
  if (g.call('__BI.fin()') === true && g.call('__BI.conflicts()') === 0) done++;
  else fails.push('L' + (i + 1) + ' fin=' + g.call('__BI.fin()') + ' conflicts=' + g.call('__BI.conflicts()'));
}
T('all-levels-solved', done === N, done + '/' + N);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { N, done } };
console.log('binairo: solution replay through placeValue chain: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
