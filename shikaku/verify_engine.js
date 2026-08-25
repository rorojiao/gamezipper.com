#!/usr/bin/env node
/* shikaku verifier — 35 levels: replay each embedded solution rectangle set via
 * real canvas drag (mousedown r1c1 -> mousemove r2c2 -> mouseup); each rect passes
 * engine isValidRect (clue==area, no overlap); win = engine checkWin -> winGame
 * (winOverlay.show). Drag coords use engine's own BOARD_PAD/CELL_SIZE geometry. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('shikaku', { inject: {
  anchor: 'function parseLvl(',
  exports: `globalThis.__T = {
    n: () => PUZZLES.length,
    start: (i) => startLevel(i),
    rects: () => PUZZLES[state.level].rects,
    rc: () => PUZZLES[state.level].rows,
    cc: () => PUZZLES[state.level].cols,
    won: () => document.getElementById('winOverlay').classList.contains('show'),
    cur: () => state.level,
    userRects: () => state.userRects.length,
    geo: () => [BOARD_PAD, CELL_SIZE],
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['board'];
const px = (r, c) => { const [pad, cs] = g.call('__T.geo()');
  return { clientX: pad + c * cs + cs / 2, clientY: pad + r * cs + cs / 2 }; };
const mev = (type, r, c) => { const p = px(r, c); cv().dispatch(type, { clientX: p.clientX, clientY: p.clientY, button: 0, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 35, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2); // resizeCanvas settles CELL_SIZE
  const rects = g.call('__T.rects()');
  let placed = 0;
  for (const rc of rects) {
    mev('mousedown', rc.r1, rc.c1);
    mev('mousemove', rc.r2, rc.c2);
    mev('mouseup', rc.r2, rc.c2);
    g.pump(1);
    if (g.call('__T.userRects()') === placed + 1) placed++;
  }
  g.pump(3);
  if (g.call('__T.won()')) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' placed=' + placed + '/' + rects.length);
  if (i < N - 1) g.call('hideWin()');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('shikaku: ' + solved.length + '/' + N + ' levels solved via real canvas rect drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
