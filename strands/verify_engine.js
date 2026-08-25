#!/usr/bin/env node
/* strands verifier — all 35 puzzles completed via REAL canvas pointer drags: for every
 * theme word and the spangram, pointerdown at the path's first cell, pointermove along
 * the embedded path (wp/sp), pointerup -> engine submitWord; puzzle solved = engine's own
 * save.solved[idx] entry (set only by its checkWin when all words + spangram found). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('strands', { inject: {
  anchor: 'function submitWord(){',
  exports: `globalThis.__S = {
    n: () => PUZZLES.length,
    start: (i) => { startPuzzle(i); setupCanvas(); },
    geo: () => ({ cs: cellSize, ox: gridOffsetX, oy: gridOffsetY }),
    solved: (i) => !!save.solved[i],
    themeLeft: (i) => PUZZLES[i].w.filter(w => !foundWords[w]).length,
    spangramLeft: () => !foundSpangram,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__S.n()');
T('puzzles-exist', N >= 30, 'n=' + N);

const cv = () => g.els.gameCanvas;
const center = (idx) => {
  const geo = g.call('__S.geo()');
  const col = idx % 6, row = Math.floor(idx / 6);
  return [geo.ox + col * geo.cs + geo.cs / 2, geo.oy + row * geo.cs + geo.cs / 2];
};
const drag = (path) => {
  const [x0, y0] = center(path[0]);
  cv().dispatch('pointerdown', { clientX: x0, clientY: y0, preventDefault() {} });
  for (let k = 1; k < path.length; k++) {
    const [x, y] = center(path[k]);
    cv().dispatch('pointermove', { clientX: x, clientY: y, preventDefault() {} });
  }
  cv().dispatch('pointerup', { clientX: 0, clientY: 0, preventDefault() {} });
};

const solved = [];
for (let i = 0; i < N; i++) {
  const paths = g.call(`(function(){ var p=PUZZLES[${i}]; return {wp:Object.values(p.wp), sp:p.sp}; })()`);
  g.call(`__S.start(${i})`); g.pump(3);
  for (const path of paths.wp) { drag(path); g.pump(2); }
  drag(paths.sp); g.pump(20);
  if (g.call(`__S.solved(${i})`)) solved.push(i + 1);
  else fails.push('P' + (i + 1) + ' unsolved: themeLeft=' + g.call(`__S.themeLeft(${i})`) + ' spangramLeft=' + g.call('__S.spangramLeft()'));
}
T('puzzles-solved', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('strands: ' + solved.length + '/' + N + ' puzzles completed via real pointer drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
