#!/usr/bin/env node
/* bonsai-prune verifier — 24 levels: tap the seed to grow (branches bend toward suns
 * through the engine's own growth simulation), re-tap while budget remains, and prune
 * wandering limbs with real drag gestures when they block the completion check —
 * the game's own core mechanic. Win = engine modal (flowers >= target). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('bonsai-prune', { inject: {
  anchor: 'function onPointerDown(e){',
  exports: `globalThis.__P = {
    n: () => LEVELS.length,
    load: (i) => startLevel(LEVELS[i]),
    st: () => state,
    flowers: () => flowersBloomed,
    target: () => cur.target,
    seed: () => seeds[0],
    tips: () => tree ? tree.limbs.filter(L => L.growing && !L.cut).map(L => ({ x: L.tipX, y: L.tipY })) : [],
    budget: () => budgetLeft,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.game;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__P.n()');
T('levels-exist', N === 24, 'n=' + N);

const drag = (x1, y1, x2, y2) => {
  const c = cv();
  c.dispatch('pointerdown', { clientX: x1, clientY: y1, preventDefault() {} });
  for (let k = 0; k <= 6; k++) c.dispatch('pointermove', { clientX: x1 + (x2 - x1) * k / 6, clientY: y1 + (y2 - y1) * k / 6, preventDefault() {} });
  c.dispatch('pointerup', { clientX: x2, clientY: y2, preventDefault() {} });
};

function play(i) {
  g.call(`__P.load(${i})`); g.pump(2);
  const seed = g.call('__P.seed()');
  const tap = () => cv().dispatch('pointerdown', { clientX: seed.x, clientY: seed.y, preventDefault() {} });
  for (let round = 0; round < 14; round++) {
    if (g.call('__P.st()') === 'modal') return true;
    if (g.call('__P.flowers()') >= g.call('__P.target()')) {
      for (let f = 0; f < 150 && g.call('__P.st()') !== 'modal'; f++) g.pump(1);
      if (g.call('__P.st()') === 'modal') return true;
      // wandering limbs keep growing and block checkEnd — prune them (real drags)
      const tips = g.call('__P.tips()');
      for (const t of tips.slice(0, 3)) { drag(t.x - 18, t.y - 18, t.x + 18, t.y + 18); g.pump(30); if (g.call('__P.st()') === 'modal') return true; }
      continue;
    }
    tap();
    for (let f = 0; f < 700; f++) { g.pump(1); if (g.call('__P.st()') === 'modal') return true; }
  }
  return g.call('__P.st()') === 'modal';
}

const solved = [];
for (let i = 0; i < N; i++) { if (play(i)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not completed (flowers ' + g.call('__P.flowers()') + '/' + g.call('__P.target()') + ')'); }
T('levels-completed', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('bonsai-prune: ' + solved.length + '/' + N + ' levels bloomed via seed taps + prune drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
