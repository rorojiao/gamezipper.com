#!/usr/bin/env node
/* fill-a-pix verifier — 30 levels: replay each embedded grid solution through the
 * engine's real DOM input (mode-fill/mode-mark button clicks + cell pointerdown),
 * win via the engine's auto-check timer path, plus explicit btn-check on L1.
 * Golden rule respected: S.completed only flips via engine onWin. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('fill-a-pix', { inject: {
  anchor: 'function initLevel(',
  exports: `globalThis.__T = {
    n: () => LV.length,
    sol: () => S.solution,
    grid: () => S.grid,
    done: () => S.completed,
    cell: (r, c) => S.cellEls[r][c],
    cur: () => S.curLevel,
    screen: () => document.getElementById('game-screen').style.display,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);

// real boot path: menu -> NEW GAME
g.els['btn-new'].dispatch('click', {});
g.pump(5);
T('screen-game', g.call('__T.screen()') === 'flex', g.call('__T.screen()'));

const solved = [];
for (let i = 0; i < N; i++) {
  const sol = g.call('__T.sol()');
  const rows = sol.length, cols = sol[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sol[r][c] === 1) g.els['mode-fill'].dispatch('click', {});
      else g.els['mode-mark'].dispatch('click', {});
      g.call(`__T.cell(${r}, ${c})`).dispatch('pointerdown', {});
    }
  }
  g.pump(10); // auto-win timer (50ms) fires inside pump
  if (i === 0) g.els['btn-check'].dispatch('click', {}); // explicit CHECK on L1 (no-op after win)
  if (g.call('__T.done()')) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' not won');
  if (i < N - 1) { g.els['btn-next'].dispatch('click', {}); g.pump(5); }
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' won: missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('next-chain-correct-level', g.call('__T.cur()') === N - 1, 'cur=' + g.call('__T.cur()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('fill-a-pix: ' + solved.length + '/' + N + ' levels solved via real cell taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
