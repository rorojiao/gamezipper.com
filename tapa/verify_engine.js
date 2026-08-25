#!/usr/bin/env node
/* tapa verifier — 30 levels: replay embedded sol via real canvas mousedown toggles
 * (shade tool) on playable cells; win = engine checkWin -> onWin -> G.completed. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tapa', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    ids: () => LEVELS.map(l => l.id),
    start: (id) => startLevel(id, false),
    sol: () => G.level.sol,
    size: () => G.level.size,
    playable: (r, c) => isPlayable(r, c),
    done: () => G.completed,
    geo: () => [gridOffX, gridOffY, cellSize],
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['canvas'] || g.els['gameCanvas'] || g.els['board'];
const tap = (r, c) => { const [ox, oy, cs] = g.call('__T.geo()');
  cv().dispatch('mousedown', { clientX: ox + c * cs + cs / 2, clientY: oy + r * cs + cs / 2, button: 0, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);
T('canvas-found', !!cv(), 'ids=' + Object.keys(g.els).filter(k => /canvas|board/i.test(k)).join(','));

const ids = g.call('__T.ids()');
const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${JSON.stringify(ids[i])})`);
  g.pump(2);
  const sol = g.call('__T.sol()'), n = g.call('__T.size()');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (g.call(`__T.playable(${r}, ${c})`) && sol[r][c] === 1) tap(r, c); // shade exactly the solution cells
  }
  // checkWin only fires on a value change; degenerate levels (all sol cells pre-shaded)
  // need one real toggle on/off to trigger the engine's own check — exactly what a player does
  if (!g.call('__T.done()')) {
    outer: for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (g.call(`__T.playable(${r}, ${c})`)) { tap(r, c); tap(r, c); break outer; }
    }
  }
  g.pump(3);
  if (g.call('__T.done()')) solved.push(i + 1); else fails.push('L' + ids[i] + ' not completed');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' + ids.filter((x, k) => !solved.includes(k + 1)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('tapa: ' + solved.length + '/' + N + ' levels solved via real canvas shade toggles: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
