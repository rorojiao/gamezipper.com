#!/usr/bin/env node
/* nonogram verifier — 30 levels: fill exactly the embedded solution cells through the
 * engine's real cell pointerdown path (drag-fill semantics honored per-cell), win via
 * engine checkLevelComplete (all lines complete + solution match). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('nonogram', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    sol: () => LEVELS[state.currentLevel].sol,
    size: () => LEVELS[state.currentLevel].size,
    done: () => state.completed,
    cur: () => state.currentLevel,
    cells: () => document.querySelectorAll('.cell'),
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
  const sol = g.call('__T.sol()');
  const size = g.call('__T.size()');
  const cells = g.call('__T.cells()');
  if (!cells || cells.length < size * size) { fails.push('L' + (i + 1) + ' cells=' + (cells && cells.length)); continue; }
  // harness fidelity: real browsers expose data-row/data-col template attrs as dataset
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    cells[r * size + c].dataset.row = String(r);
    cells[r * size + c].dataset.col = String(c);
  }
  const key = k => g.sandbox.document.dispatch('keydown', { key: k, code: 'Key' + k.toUpperCase(), preventDefault() {} });
  key('f'); // fill tool (real key binding)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (sol[r * size + c] === 1) {
        const cell = cells[r * size + c];
        cell.dispatch('pointerdown', { target: cell, preventDefault() {} });
        cell.dispatch('pointerup', { target: cell, preventDefault() {} });
      }
    }
  }
  key('x'); // mark tool — real players X the empty cells; zero-clue lines only get evaluated via mark taps
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (sol[r * size + c] === 0) {
        const cell = cells[r * size + c];
        cell.dispatch('pointerdown', { target: cell, preventDefault() {} });
        cell.dispatch('pointerup', { target: cell, preventDefault() {} });
      }
    }
  }
  g.pump(5);
  if (g.call('__T.done()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not completed');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('nonogram: ' + solved.length + '/' + N + ' levels solved via real cell fills: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
