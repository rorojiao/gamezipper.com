#!/usr/bin/env node
/* creek verifier — 27 Creek puzzles: each level's solution string is replayed through
 * real canvas taps (cycleCell: -1 -> 0 black -> 1 white); win = engine isSolved/onWin. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('creek', { inject: {
  anchor: 'function cycleCell(r,c){',
  exports: `globalThis.__C = {
    n: () => LEVELS.length,
    load: (i) => loadLevel(i),
    sol: () => LEVELS[curLvl][2],
    dims: () => ({ W, H }),
    cells: () => cells.map(r => r.slice()),
    solved: () => solved,
    geom: () => { const gr = gridGeom(); return { cell: gr.cell, ox: gr.ox, oy: gr.oy }; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.board;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__C.n()');
T('levels-exist', N === 27, 'n=' + N);

const tapCell = (r, c) => {
  const geo = g.call('__C.geom()');
  const x = geo.ox + c * geo.cell + geo.cell / 2, y = geo.oy + r * geo.cell + geo.cell / 2;
  cv().dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
};

const solvedList = [];
for (let i = 0; i < N; i++) {
  g.call(`__C.load(${i})`); g.pump(2);
  const sol = g.call('__C.sol()');
  const { W: w, H: h } = g.call('__C.dims()');
  if (sol.length !== w * h) { fails.push('L' + (i + 1) + ' sol len ' + sol.length + ' != ' + (w * h)); continue; }
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const sv = sol.charCodeAt(r * w + c) - 48;
    if (sv === 0) tapCell(r, c); // -1 -> 0
    else if (sv === 1) { tapCell(r, c); tapCell(r, c); } // -1 -> 0 -> 1
  }
  g.pump(5);
  if (g.call('__C.solved()')) solvedList.push(i + 1); else fails.push('L' + (i + 1) + ' not solved');
}
T('levels-solved', solvedList.length === N, solvedList.length + '/' + N + ' solved:[' + solvedList.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solvedList.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solvedList.length + '/' + N } };
console.log('creek: ' + solvedList.length + '/' + N + ' creek puzzles solved via embedded-solution taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
