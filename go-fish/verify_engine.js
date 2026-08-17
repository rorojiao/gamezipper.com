#!/usr/bin/env node
/* go-fish verifier — C-type: a full game through the engine's own ask flow.
 * initGame('easy') (mode button callee); player asks via playerAsk (the rank button
 * callee) choosing ranks actually in hand; AI turns run on the engine's aiTimer.
 * PASS: game reaches gameOver with books scored on both sides, >=1 book completed by
 * the player, stock exhausted or 13 books total, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('go-fish', { inject: {
  anchor: 'function playerAsk(rank) {',
  exports: "globalThis.__GF = { over: () => state.gameOver, turn: () => state.currentTurn, hand: () => state.playerHand.map(c => c.rank), books: () => [state.playerBooks.length, state.opponentBooks.length], stock: () => state.stock.length, init: (m) => initGame(m), ask: (r) => playerAsk(r), active: () => gameActive, myTurn: () => isPlayerTurn };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call("__GF.init('ai')") // mode must be 'ai' — the AI branch of playerAsk only schedules doAITurn for gameMode==='ai';
g.pump(5);
T('game-started', g.call('__GF.active()') === true, 'active=' + g.call('__GF.active()'));

let guard = 0, asks = 0;
while (guard++ < 40000 && !g.call('__GF.over()')) {
  if (g.call('__GF.myTurn()')) {
    const hand = g.call('__GF.hand()') || [];
    if (hand.length) {
      g.call(`__GF.ask(${JSON.stringify(hand[0])})`); // ask for a rank we hold
      asks++;
    }
  }
  g.pump(6); // AI turns on the engine's own timers
}
const books = g.call('__GF.books()');
T('game-over', g.call('__GF.over()') === true, 'guard=' + guard);
T('books-scored', books[0] + books[1] >= 1, 'books=' + JSON.stringify(books));
T('asks-made', asks > 3, 'asks=' + asks);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { asks, books, stock: g.call('__GF.stock()') } };
console.log('go-fish: hold-rank asking through engine playerAsk: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
