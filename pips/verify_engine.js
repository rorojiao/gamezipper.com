#!/usr/bin/env node
/* pips verifier — 26 levels: replay each level's derived domino tiling (dp pairs) through
 * the real drag path (tray pointerdown -> move -> up; engine canPlace/rotate fallback);
 * win = engine validateAll + checkWin -> showWinScreen -> #winOverlay.active. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('pips', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => startLevel(LEVELS[i]),
    dp: () => currentLevel.dp,
    cols: () => currentLevel.cols,
    won: () => document.getElementById('winOverlay').classList.contains('active'),
    grab: (domIdx) => { // pointerdown on tray domino (starts the drag)
      const domW = cellSize * 2, domH = cellSize * 0.8;
      const totalW = trayDominoes.length * (domW + 8);
      const startX = (W - totalW) / 2 - trayScroll;
      const trayIdx = trayDominoes.indexOf(domIdx);
      const dx = startX + trayIdx * (domW + 8), dy = trayY + 10;
      onPointerDown({ clientX: dx + domW / 2, clientY: dy + domH / 2 });
      return [dx + domW / 2, dy + domH / 2];
    },
    drop: (r, c, horizontal) => { // move so the domino's top-left lands on cell (r,c), then release
      const domW = cellSize * 2, domH = cellSize * 0.8;
      const mx = gridX + c * cellSize + 1 + domW / 2 - (horizontal ? cellSize : cellSize / 2);
      const my = gridY + r * cellSize + 1 + domH / 2 - cellSize / 2;
      onPointerMove({ clientX: mx, clientY: my });
      onPointerUp({});
    },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 26, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const dp = g.call('__T.dp()'), cols = g.call('__T.cols()');
  dp.forEach((pair, domIdx) => {
    const [a, b] = pair;
    const horizontal = Math.floor(a / cols) === Math.floor(b / cols);
    g.call(`__T.grab(${domIdx})`);
    if (!horizontal) g.sandbox.document.dispatch('keydown', { key: 'r' }); // engine's real rotate-during-drag input
    g.call(`__T.drop(${Math.floor(a / cols)}, ${a % cols}, ${horizontal})`);
  });
  g.pump(90); // showWinScreen fires on a 1200ms setTimeout
  if (g.call('__T.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
  g.call("document.getElementById('winOverlay').classList.remove('active')");
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('pips: ' + solved.length + '/' + N + ' levels solved via real tray drags (condition-validated): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
