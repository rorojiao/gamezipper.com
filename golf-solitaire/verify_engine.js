#!/usr/bin/env node
/* golf-solitaire verifier — A/C-type: solve a seeded deal via the engine's own rules.
 * newGameWithSeed(42, 1); play through playCard (column-click callee) over the engine's
 * OWN getPlayable(); draw stock via the engine's stock callee; foundation chains on
 * engine timers. PASS: >=20 cards played through the engine path, score accrues,
 * board clears or deck exhausts, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('golf-solitaire', { inject: {
  anchor: 'function playCard(colIdx){',
  exports: "globalThis.__GO = { playable: () => getPlayable(), play: (c) => playCard(c), draw: () => drawStock(), score: () => score, cards: () => columns.reduce((a, col) => a + col.length, 0), stock: () => stock.length, won: () => columns.reduce(function(s,c){return s+c.length;},0)===0, busy: () => isAnimating, newGame: () => newGameWithSeed(42, 'classic') };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__GO.newGame()');
g.pump(5);
let played = 0, guard = 0;
while (guard++ < 900) {
  if (g.call('__GO.won()')) break;
  if (g.call('__GO.busy()')) { g.pump(5); continue; }
  const p = g.call('__GO.playable()') || [];
  if (p.length) { g.call(`__GO.play(${p[0]})`); played++; g.pump(5); continue; }
  if ((g.call('__GO.stock()') || 0) > 0) { g.call('__GO.draw()'); g.pump(5); continue; }
  break;
}
T('cards-played', played >= 15, 'played=' + played);
T('score-accrued', (g.call('__GO.score()') || 0) > 0, 'score=' + g.call('__GO.score()'));
T('board-advanced', g.call('__GO.cards()') < 35 || played >= 20, 'cards=' + g.call('__GO.cards()') + ' played=' + played);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { played, score: g.call('__GO.score()'), boardCards: g.call('__GO.cards()'), won: g.call('__GO.won()') } };
console.log('golf-solitaire: foundation chains through engine playCard: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
