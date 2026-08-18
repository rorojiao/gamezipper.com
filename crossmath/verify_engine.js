#!/usr/bin/env node
/* crossmath verifier — 50 levels (3x3..6x6): each level's embedded solution is entered
 * through REAL input (canvas tap selects the cell, num-pad button click places the
 * digit); win = engine checkWin/gameWon (board equals solution). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('crossmath', { inject: {
  anchor: 'function checkWin() {',
  exports: `globalThis.__X = {
    counts: () => LEVEL_COUNTS,
    start: (size, diff, level) => startLevel(size, diff, level),
    screen: () => state.screen,
    won: () => document.getElementById('win-modal').classList.contains('show'),
    sol: () => state.solution.map(r => r.slice()),
    locked: () => state.locked.map(r => r.slice()),
    board: () => board.map(r => r.slice()),
    n: () => state.gridSize,
    place: (num) => placeNumber(num),
    select: (r, c) => { state.selectedCell = { r, c }; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.board;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

function tapCell(r, c) {
  const n = g.call('__X.n()');
  const wrap = g.els['board-wrap'];
  const w = Math.min((wrap && wrap.clientWidth) || 480, 500);
  const padding = 8, gap = 4;
  const cellSize = (w - padding * 2 - gap * (n + 1)) / n;
  const x = padding + c * (cellSize + gap) + cellSize / 2;
  const y = padding + rowAdjust(r, n, w, cellSize, gap);
  cv().dispatch('click', { clientX: x, clientY: y, preventDefault() {} });
}
function rowAdjust(r, n, w, cellSize, gap) { return paddingPad(r, n, w, cellSize, gap); }
function paddingPad(r, n, w, cellSize, gap) { const padding = 8; return padding + r * (cellSize + gap) + cellSize / 2; }

function numButton(d) {
  const pad = g.els['num-pad'];
  for (const b of (pad.children || [])) if (String(b.textContent) === String(d)) return b;
  return null;
}

const counts = g.call('__X.counts()');
const combos = [];
for (const size of [3, 4, 5, 6]) for (let lv = 0; lv < counts[size]; lv++) combos.push([size, lv]);
T('levels-exist', combos.length === 50, combos.length + ' levels');

const solved = [];
for (const [size, lv] of combos) {
  g.call(`__X.start(${size}, 0, ${lv})`); g.pump(3);
  const sol = g.call('__X.sol()'), locked = g.call('__X.locked()'), n = g.call('__X.n()');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (locked[r][c]) continue;
    tapCell(r, c); g.pump(1);
    const btn = numButton(sol[r][c]);
    if (!btn) { fails.push('L' + size + '-' + (lv + 1) + ' missing num button ' + sol[r][c]); break; }
    btn.dispatch('click', {}); g.pump(1);
  }
  g.pump(30); // gameWon timer
  if (g.call('__X.won()')) solved.push(size + '-' + (lv + 1)); else fails.push('L' + size + '-' + (lv + 1) + ' not won');
}
T('levels-solved', solved.length === combos.length, solved.length + '/' + combos.length + ' solved:[' + solved.join(',') + '] missing:[' + combos.map(x => x[0] + '-' + (x[1] + 1)).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + combos.length } };
console.log('crossmath: ' + solved.length + '/' + combos.length + ' equations solved via cell taps + numpad: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
