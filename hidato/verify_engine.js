#!/usr/bin/env node
/* hidato verifier — 30 generated levels (deterministic seeds): fill every non-given cell
 * with its solution number in ascending order through the real input path (canvas
 * pointerdown to open the number picker, then a real picker-cell click); win =
 * checkWin -> onWin -> State.won. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const fs = require('fs');
const LOG = '/tmp/hidato-progress.log';
fs.writeFileSync(LOG, '');
const trace = (m) => fs.appendFileSync(LOG, m + '\n');
const g = bootGame('hidato', { inject: {
  anchor: 'function loadLevel(',
  exports: `/* harness fidelity: stub createElement elements lack cloneNode; engine's openPicker
     calls grid.cloneNode(true) on dead code (result discarded) — satisfy it */
  (function(){ const o = document.createElement.bind(document); document.createElement = (t) => { const el = o(t); if (el) { if (!el.cloneNode) el.cloneNode = function(){ return el; }; if (!el.replaceWith) el.replaceWith = function(){}; } return el; };
    const pg = document.getElementById('picker-grid'); if (pg && !pg.replaceWith) pg.replaceWith = function(){};
    const pk = document.getElementById('picker'); if (pk) Object.defineProperty(pk, 'firstChild', { get: function(){ return (this.children || []).length ? this.children[0] : null; } }); /* harness firstChild returns a text stub when empty; engine's while(firstChild) removeChild loop would spin forever */ })();
  globalThis.__T = {
    n: () => TOTAL_LEVELS,
    start: (i) => loadLevel(i, false),
    sol: () => JSON.stringify(State.puzzle.solution),
    given: () => JSON.stringify(State.puzzle.given),
    size: () => State.puzzle.size,
    cs: () => cellSize,
    won: () => State.won,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);
const cv = g.els['cv'] || g.els['board'];
T('canvas-found', !!cv, 'no canvas');
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });

const solved = [];
for (let i = 0; i < N; i++) {
  trace('L' + (i + 1) + ' start');
  g.call(`__T.start(${i})`);
  trace('L' + (i + 1) + ' loaded');
  g.pump(2);
  trace('L' + (i + 1) + ' pumped');
  const sol = JSON.parse(g.call('__T.sol()'));       // sol[k] = [r,c] holding number k+1
  const given = JSON.parse(g.call('__T.given()'));   // given[r][c] = clue number | null
  const cs = g.call('__T.cs()');
  for (let k = 0; k < sol.length; k++) {
    const [r, c] = sol[k], v = k + 1;
    if (given[r][c] !== null) continue;
    cv.dispatch('pointerdown', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2, preventDefault() {} });
    const picker = g.els['picker'];
    const grid = picker.children[1]; // [title, number-grid, cancel]
    const cell = grid.children[v - 1];
    if (!cell) { fails.push('L' + (i + 1) + ' picker missing number ' + v); break; }
    cell.dispatch('click', {});
    g.pump(2);
  }
  g.pump(5);
  if (g.call('__T.won()')) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' not won');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('hidato: ' + solved.length + '/' + N + ' levels solved via real cell-tap + picker clicks (chain-validity win-checked): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
