#!/usr/bin/env node
/* twiddle verifier — 27 levels: each level ships its authoring solution [[r,c,dir]...];
 * replay it through the real canvas pointerdown path (button 2 = CCW), waiting out the
 * engine's own 170ms rotation anim between moves; win fires in the engine's rAF loop
 * (isSolved -> onWin -> save.solved[id]). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('twiddle', { inject: {
  anchor: 'function loadLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => loadLevel(i),
    id: (i) => LEVELS[i].id,
    sol: (i) => JSON.stringify(LEVELS[i].solution),
    geom: () => [geom.pad, geom.cs],
    won: (id) => !!save.solved[id],
    solvedNow: () => isSolved(board),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 27, 'n=' + N);
const cv = g.els['cv'];
T('canvas-found', !!cv, 'no cv');
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });
g.pump(3); // draw() publishes geom.pad/geom.cs

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(3);
  const sol = JSON.parse(g.call(`__T.sol(${i})`));
  const [pad, cs] = g.call('__T.geom()');
  for (const [r, c, dir] of sol) {
    cv.dispatch('pointerdown', { clientX: pad + c * cs + cs / 2, clientY: pad + r * cs + cs / 2, button: dir < 0 ? 2 : 0, pointerType: 'mouse' });
    g.pump(16); // 170ms rotation anim must finish before next move is accepted
  }
  g.pump(70); // onWin runs in rAF after anim; winOverlay on 650ms setTimeout
  if (g.call(`__T.won(__T.id(${i}))`)) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' not won (solvedNow=' + g.call('__T.solvedNow()') + ', moves=' + sol.length + ')');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('twiddle: ' + solved.length + '/' + N + ' levels solved via real canvas pointerdowns (author solution replay, anim-serialized): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
