#!/usr/bin/env node
/* compass verifier — 24 Nikoli compass puzzles: shade the embedded solution (lvl.sol)
 * through real canvas taps (toggleCell), press CHECK; win = engine doCheck/winLevel. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('compass', { inject: {
  anchor: 'function doCheck(){',
  exports: `globalThis.__P = {
    n: () => LEVELS.length,
    load: (i) => { loadLevel(i); showScreen('game'); },
    sol: () => LEVELS[G.levelIdx].sol,
    dims: () => ({ rows: LEVELS[G.levelIdx].rows, cols: LEVELS[G.levelIdx].cols }),
    won: () => G.won,
    geo: () => ({ cs: G.cellSize, ox: G.offsetX, oy: G.offsetY }),
    isCompass: (r, c) => isCompass(r, c),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.board;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__P.n()');
T('levels-exist', N === 24, 'n=' + N);

const tapCell = (r, c) => {
  const geo = g.call('__P.geo()');
  const x = geo.ox + c * geo.cs + geo.cs / 2, y = geo.oy + r * geo.cs + geo.cs / 2;
  cv().dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
};

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__P.load(${i})`); g.pump(5);
  const sol = g.call('__P.sol()');
  for (const [r, c] of sol) {
    if (g.call(`__P.isCompass(${r}, ${c})`)) continue;
    tapCell(r, c);
    g.pump(1);
  }
  g.els['btn-check'].dispatch('click', {});
  g.pump(50); // winLevel shows the win screen via a 700ms timer
  if (g.call('__P.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' check failed');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('compass: ' + solved.length + '/' + N + ' compass puzzles solved via solution taps + CHECK: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
