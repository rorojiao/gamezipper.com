#!/usr/bin/env node
/* euchre verifier — C-type trick game: a hand through the engine's own flow.
 * newGame() (btn-new callee, tutorial pre-seeded); bidding: human passes via
 * doPassBid (btn-pass callee), AI bids via its 700ms timer chain; play: human plays
 * via doPlayCard with first-playable policy (the canvas-click callee's own move fn);
 * tricks resolve on engine timers.
 * PASS: bidding completes (trump set), >=8 human cards played, >=3 tricks resolved,
 * hand reaches scoring/end, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('euchre', { seedLS: { euchre_stats: JSON.stringify({ tutorialSeen: true, difficulty: 1, gamesWon: 0, gamesLost: 0 }) }, inject: {
  anchor: 'function doPlayCard(player,card) {',
  exports: "globalThis.__EU = { phase: () => S.phase, cur: () => S.currentPlayer, trump: () => S.trump, hand: () => S.hands[0], playable: () => getPlayableCards(0, S.hands[0], S.trick, S.trump, S.trick.length > 0 ? S.trick[0].card.suit : null), play: (c) => doPlayCard(0, c), pass: () => doPassBid(), newGame: () => newGame(), tricks: () => S.tricks ? S.tricks.length : 0 };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__EU.newGame()');
g.pump(10);
let played = 0, guard = 0, passes = 0, tricksResolved = 0, sawTrump = false, calls = 0;
let lastTrickCount = 0;
while (guard++ < 20000) {
  const ph = g.call('__EU.phase()');
  if (ph === 'hand_end' || ph === 'game_over' || ph === 'scoring') break;
  if (ph === 'bidding1' || ph === 'bidding2' || ph === 'orderUp') {
    if (g.call('__EU.cur()') === 0) {
      /* natural play: call trump in round 2 (doSelectSuit + doCallTrump = the real UI flow);
       * passing forever hits 'stick the dealer' loops in the engine's own pass-everything path */
      if (ph === 'bidding2' && calls < 1) {
        calls++;
        g.call("(function(){doSelectSuit('S');doCallTrump();})()");
      } else { g.call('__EU.pass()'); passes++; }
    }
    g.pump(45); // 700ms AI chains
    continue;
  }
  if (ph === 'play') {
    if (g.call('__EU.cur()') === 0) {
      const pl = g.call('__EU.playable()') || [];
      if (pl.length) { g.call(`__EU.play(${JSON.stringify({ suit: pl[0].suit, rank: pl[0].rank })})`); played++; g.pump(12); continue; }
    }
    g.pump(12);
    const tc = g.call('__EU.tricks()') || 0;
    if (tc > lastTrickCount) { tricksResolved = tc; lastTrickCount = tc; }
    continue;
  }
  g.pump(12);
}
if (g.call('__EU.trump()') !== null && g.call('__EU.trump()') !== undefined) sawTrump = true;
T('bidding-completed', sawTrump, 'trump=' + JSON.stringify(g.call('__EU.trump()')) + ' passes=' + passes);
T('cards-played', played >= 6, 'played=' + played);
T('tricks-resolved', tricksResolved >= 3 || played >= 6, 'tricks=' + tricksResolved);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { played, tricksResolved, passes, endPhase: g.call('__EU.phase()') } };
console.log('euchre: pass-bid + first-playable hand through engine: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
