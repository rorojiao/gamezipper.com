#!/usr/bin/env node
/* kurodoko verifier — 30 levels: replay embedded solution_grid via real cell clicks
 * (toggle black), then real btn-check click; win = engine checkSolution (row/col white
 * counts + no 2x2 black + white connectivity) -> G.solved + modal-complete. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('kurodoko', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    sol: () => LEVELS[G.curIdx].solution_grid,
    rows: () => LEVELS[G.curIdx].rows,
    cols: () => LEVELS[G.curIdx].cols,
    grid: () => G.grid,
    solved: () => G.solved,
    status: () => el["status"].textContent,
    modal: () => el["modal-complete"].style.display,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const sol = g.call('__T.sol()'), rows = g.call('__T.rows()'), cols = g.call('__T.cols()');
  const board = g.els['board'];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (sol[r][c] === 1) {
      const cell = board.children[r * cols + c];
      cell.dispatch('click', { target: cell });
    }
  }
  g.pump(2);
  g.els['btn-check'].dispatch('click', {});
  g.pump(3);
  if (g.call('__T.solved()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' status="' + g.call('__T.status()').slice(0, 60) + '"');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('kurodoko: ' + solved.length + '/' + N + ' levels solved via real cell clicks + Check: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
