#!/usr/bin/env node
/* fillomino verifier — 30 levels: replay embedded sol grid via palette selection
 * (selectNum — palette buttons are inline-onclick divs, selection state only) +
 * real canvas pointerdown per cell; win = engine placeNumber->checkWin->onWin
 * (winOverlay.show). Givens skipped (unwritable by design). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('fillomino', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    sol: () => (currentLevel >= 0 ? LEVELS[currentLevel] : generateDaily(dailySeed)).sol,
    s: () => (currentLevel >= 0 ? LEVELS[currentLevel] : generateDaily(dailySeed)).s,
    grid: () => grid,
    won: () => document.getElementById('winOverlay').classList.contains('show'),
    cs: () => cellSize,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['grid'];
const tap = (r, c) => { const cs = g.call('__T.cs()'); cv().dispatch('pointerdown', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const sol = g.call('__T.sol()'), s = g.call('__T.s()');
  for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) {
    if (sol[r][c] > 0) { g.call('selR=-1;selC=-1'); g.call(`selectNum(${sol[r][c]})`); tap(r, c); } // palette select (inline-onclick UI; deselect first — selectNum re-places at last cell) + real canvas placement
  }
  g.pump(4);
  if (g.call('__T.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('fillomino: ' + solved.length + '/' + N + ' levels solved via palette+canvas placements: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
