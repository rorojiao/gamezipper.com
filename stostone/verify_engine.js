#!/usr/bin/env node
/* stostone verifier — replay each level's embedded sol via the engine's own pointerdown
 * handler (handleClick) with real-shaped events at cell centers; win = engine checkWin
 * (column counts + region clues + adjacency + connectivity) -> win() -> winScreen active.
 * The engine bound listeners to its own (harness-orphaned) canvas var; we invoke the same
 * handler those listeners call, and pin a 1:1 rect (unstyled canvas: CSS size == attr size). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('stostone', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    sol: () => LEVELS[curLevel].s,
    sz: () => LEVELS[curLevel].n,
    won: () => document.getElementById('winScreen').classList.contains('active'),
    tap: (r, c) => {
      if (!canvas.__p) { canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: canvasW, height: canvasH }); canvas.__p = 1; }
      handleClick({ preventDefault() {}, clientX: c * cellSize + cellSize / 2 + 1, clientY: r * cellSize + cellSize / 2 + 1 });
    },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
g.call('init()'); // engine binds input listeners in init on document-DOMContentLoaded (harness fires window-level only)
T('no-vm-errors-early', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 26, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const sol = g.call('__T.sol()'), n = g.call('__T.sz()');
  for (let idx = 0; idx < n * n; idx++) if (sol[idx] === 1) g.call(`__T.tap(${Math.floor(idx / n)}, ${idx % n})`);
  g.pump(3);
  if (g.call('__T.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('stostone: ' + solved.length + '/' + N + ' levels solved via real pointerdown handler path: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
