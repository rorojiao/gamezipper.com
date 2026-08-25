#!/usr/bin/env node
/* lits verifier — 30 procedurally-generated levels: replay each level's generated
 * solution (state.solution) via real canvas pointerdown toggles; win = engine checkWin
 * (4-per-region tetromino + adjacent-shape + connectivity + no-2x2) -> onWin -> winOverlay. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('lits', { inject: {
  anchor: 'function getLevel(',
  exports: `globalThis.__T = {
    n: () => 30,
    start: (i) => startLevel(i),
    sol: () => state.solution,
    size: () => state.size,
    cs: () => state.cellSize,
    won: () => document.getElementById('winOverlay').classList.contains('show'),
    genok: (i) => !!getLevel(i),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['board'];
const tap = (r, c) => { const cs = g.call('__T.cs()');
  cv().dispatch('pointerdown', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2, button: 0, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);
let genBad = 0;
for (let i = 0; i < N; i++) if (!g.call(`__T.genok(${i})`)) genBad++;
T('all-levels-generate', genBad === 0, genBad + ' failed');

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(3);
  const sol = g.call('__T.sol()'); // [{cat, cells:[[r,c],...]}, ...] per region
  if (!sol) { fails.push('L' + (i + 1) + ' no solution object'); continue; }
  for (const piece of sol) for (const cell of piece.cells) { tap(cell[0], cell[1]); g.pump(1); }
  g.pump(3);
  if (g.call('__T.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
  g.call('hideWin()');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('lits: ' + solved.length + '/' + N + ' levels solved via real canvas shade toggles (rule-checked): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
