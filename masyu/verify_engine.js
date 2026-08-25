#!/usr/bin/env node
/* masyu verifier — 30 procedurally-generated levels: replay each level's generated
 * solution edges via real canvas pointerdown at edge midpoints; win = engine
 * validateSolution (closed loop + pearl rules) -> winLevel -> won flag. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('masyu', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LV.length,
    start: (i) => startLevel(i),
    sol: () => solution,
    won: () => won,
    mid: (key) => edgeMidpoint(key),
    state: () => state,
    tutBtn: () => { // real dismiss: tap "Got it!" on the first-run tutorial overlay
      var bw = Math.min(340, W * 0.85), bh = 320, bx = (W - bw) / 2, by = (H - bh) / 2;
      return { x: bx + bw / 2, y: by + bh - 44 + 17 };
    },
    tut: () => showTut,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['c'];
const tapEdge = key => { const p = g.call(`__T.mid(${JSON.stringify(key)})`);
  cv().dispatch('pointerdown', { clientX: p.x, clientY: p.y, button: 0, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  if (g.call('__T.tut()')) { // L0 raises the tutorial; it blocks all board input until dismissed
    const b = g.call('__T.tutBtn()');
    cv().dispatch('pointerdown', { clientX: b.x, clientY: b.y, button: 0, preventDefault() {} });
  }
  const sol = g.call('__T.sol()');
  for (const key of sol) tapEdge(key);
  g.pump(3);
  if (g.call('__T.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('masyu: ' + solved.length + '/' + N + ' levels solved via real edge taps (loop rule-checked): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
