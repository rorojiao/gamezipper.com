#!/usr/bin/env node
/* tentai-show verifier — replay each level's embedded solution walls via the engine's
 * real edge-click handler at wall positions; win = engine checkWin (exact wall match)
 * -> G.completed. startLevel(i) is navigation-only. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tentai-show', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    solH: () => LEVELS[G.currentLevel].h,
    solV: () => LEVELS[G.currentLevel].v,
    done: () => G.completed,
    tapH: (r, c) => handleEdgeClick(G.offsetX + c * G.cellSize + G.cellSize * 0.75, G.offsetY + r * G.cellSize + G.cellSize * 0.5),
    tapV: (r, c) => handleEdgeClick(G.offsetX + c * G.cellSize + G.cellSize * 0.5, G.offsetY + r * G.cellSize + G.cellSize * 0.75),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 25, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const h = g.call('__T.solH()'), v = g.call('__T.solV()'); // solution walls to KEEP
  const solH = new Set(h.map(w => w[0] + ',' + w[1])), solV = new Set(v.map(w => w[0] + ',' + w[1]));
  const rows = g.call('G.rows'), cols = g.call('G.cols');
  // engine starts with ALL walls placed; player removes walls until only the solution
  // remains — replay = tap every edge whose key is NOT part of the solution
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols - 1; c++)
    if (!solH.has(r + ',' + c)) g.call(`__T.tapH(${r}, ${c})`);
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols; c++)
    if (!solV.has(r + ',' + c)) g.call(`__T.tapV(${r}, ${c})`);
  g.pump(3);
  if (g.call('__T.done()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not completed');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('tentai-show: ' + solved.length + '/' + N + ' levels solved via real wall-edge taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
