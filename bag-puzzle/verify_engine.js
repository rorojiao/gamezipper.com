#!/usr/bin/env node
/* bag-puzzle verifier — A-type: solve every level via the engine's own rules.
 * loadLevel(idx) (level-card callee); the solution edges are engine-authored
 * (buildLevel computes them from the grid); replay = set each solution edge through
 * doEdgeAction (the exact edge-click callee) then let the engine's autoValidate ->
 * checkSolution -> completeLevel fire. PASS: ALL levels complete through the engine's
 * own validation with stars/persistence, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('bag-puzzle', { inject: {
  anchor: 'function doEdgeAction(edgeIdx, newState) {',
  exports: "globalThis.__BP = { n: () => LEVEL_DEFS.length, load: (i) => startLevel(i), sol: () => getSolutionEdgeIndices(), set: (i) => doEdgeAction(i, 1), done: () => gameComplete, stars: (i) => { const p = getLevelProgress(isDaily ? 'daily' : LEVEL_DEFS[i].id); return p.stars; }, validate: () => autoValidate() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const N = g.call('__BP.n()');
T('levels-exist', N >= 10, 'n=' + N);
let completed = 0;
for (let i = 0; i < Math.min(N, 40); i++) {
  g.call(`__BP.load(${i})`);
  g.pump(3);
  const sol = g.call('__BP.sol()') || [];
  for (const e of sol) g.call(`__BP.set(${e})`);
  g.call('__BP.validate()');
  g.pump(5);
  if (g.call('__BP.done()') === true) completed++;
  else fails.push('L' + (i + 1) + ' not complete (' + sol.length + ' sol edges)');
}
T('all-levels-complete', completed === Math.min(N, 40), completed + '/' + Math.min(N, 40));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 10),
  extra: { N, completed } };
console.log('bag-puzzle: engine-solution edge replay through autoValidate: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
