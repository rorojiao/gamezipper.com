#!/usr/bin/env node
/* link-a-pix verifier — 30 levels: replay every embedded pair path (pair.p) through
 * real canvas drag input (pointerdown at a, pointermove cell-by-cell to twin b);
 * path completion is the engine's own connect logic; win via real Enter key ->
 * checkSolution -> state.completed. nextLevel() is navigation-only. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('link-a-pix', { inject: {
  anchor: 'function loadLevel(idx)',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    lv: () => { var L = getCurrentLevel(); return { r: L.r, c: L.c, p: L.p.map(function(x){ return { a: x.a, b: x.b, n: x.n, p: x.p }; }) }; },
    done: () => state.completed,
    cur: () => state.lv,
    client: (r, c) => { var rect = canvas.getBoundingClientRect();
      var p = cellToPx(r, c);
      return { clientX: rect.left + p.x * rect.width / canvas.width, clientY: rect.top + p.y * rect.height / canvas.height }; },
    paths: () => Object.keys(state.paths).length,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['game-canvas'];
const pe = (type, r, c) => { const p = g.call(`__T.client(${r}, ${c})`); cv().dispatch(type, { clientX: p.clientX, clientY: p.clientY, pointerId: 1, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  const lv = g.call('__T.lv()');
  let drawn = 0;
  for (const pair of lv.p) {
    // real drag: down on a, move through interior cells, move onto twin b
    pe('pointerdown', pair.a[0], pair.a[1]);
    for (let k = 1; k < pair.p.length; k++) pe('pointermove', pair.p[k][0], pair.p[k][1]);
    pe('pointerup', pair.b[0], pair.b[1]);
    drawn++;
  }
  if (g.call('__T.paths()') !== lv.p.length) fails.push('L' + (i + 1) + ' paths=' + g.call('__T.paths()') + '/' + lv.p.length);
  g.sandbox.document.dispatch('keydown', { key: 'Enter', code: 'Enter', preventDefault() {} }); // engine binds keydown on document; harness g.key() misses document-level listeners
  g.pump(3);
  if (g.call('__T.done()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not completed');
  if (i < N - 1) { g.call('nextLevel()'); g.pump(2); }
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('level-chain-advanced', g.call('__T.cur()') === N - 1, 'cur=' + g.call('__T.cur()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('link-a-pix: ' + solved.length + '/' + N + ' levels solved via real canvas drags + Enter-check: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
