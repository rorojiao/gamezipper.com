#!/usr/bin/env node
/* kakurasu verifier — replay embedded solution via real canvas pointerdown at cell
 * centers (hitTestPlay -> toggleCell); win = engine isSolved -> onWin -> scene='win'.
 * initLevel(i) is navigation-only. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('kakurasu', { inject: {
  anchor: 'function initLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => initLevel(i),
    sol: () => LEVELS[curLevel].solution,
    sz: () => LEVELS[curLevel].n,
    scene: () => scene,
    ctr: (r, c) => { const M = gridMetrics(); return { x: M.ox + c * M.cell + M.cell / 2, y: M.oy + r * M.cell + M.cell / 2 }; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['game'];
const tap = (r, c) => { const p = g.call(`__T.ctr(${r}, ${c})`);
  cv().dispatch('pointerdown', { clientX: p.x, clientY: p.y, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N > 0, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const sol = g.call('__T.sol()'), n = g.call('__T.sz()');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (sol[r][c] === 1) tap(r, c);
  g.pump(3);
  if (g.call('__T.scene()') === 'win') solved.push(i + 1); else fails.push('L' + (i + 1) + ' scene=' + g.call('__T.scene()'));
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('kakurasu: ' + solved.length + '/' + N + ' levels solved via real cell taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
