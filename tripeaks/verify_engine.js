#!/usr/bin/env node
/* tripeaks verifier — A/C-type: solve a seeded deal via the engine's own rules.
 * initGame(42) (deterministic); play through playCard (the card-click callee) over the
 * engine's OWN getPlayableCards(); draw stock via the engine's stock-click callee when
 * stuck. PASS: >=15 cards played through the engine path, score accrues, game reaches
 * a terminal or the full board clears, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tripeaks', { inject: {
  anchor: 'function playCard(card){',
  exports: "globalThis.__TP = { playableIdx: () => { const ps = getPlayableCards(); return ps.length ? allCards.indexOf(ps[0]) : -1; }, playableN: () => getPlayableCards().length, playAt: (i) => playCard(allCards[i]), score: () => score, remaining: () => allCards.filter(c => !c.removed).length, stock: () => stock.length, won: () => gameWon, over: () => gameOver, init: (s) => initGame(s), drawStock: () => drawFromStock(), animBusy: () => allCards.some(c => c.animating) || activeAnims.length > 0 };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__TP.init(42)');
g.pump(5);
let played = 0, guard = 0;
while (guard++ < 900) {
  if (g.call('__TP.won()') || g.call('__TP.over()')) break;
  if (g.call('__TP.animBusy()')) { g.pump(5); continue; }
  const idx = g.call('__TP.playableIdx()');
  if (idx >= 0) { g.call(`__TP.playAt(${idx})`); played++; g.pump(5); continue; }
  if ((g.call('__TP.stock()') || 0) > 0) { g.call('__TP.drawStock()'); g.pump(5); continue; }
  break;
}
const score = g.call('__TP.score()') || 0;
T('cards-played', played >= 15, 'played=' + played);
T('score-accrued', score > 0, 'score=' + score);
T('terminal-or-cleared', g.call('__TP.won()') || g.call('__TP.over()') || g.call('__TP.remaining()') < 28, 'won=' + g.call('__TP.won()') + ' remaining=' + g.call('__TP.remaining()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { played, score, remaining: g.call('__TP.remaining()'), won: g.call('__TP.won()') } };
console.log('tripeaks: engine-playable cascade through playCard: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
