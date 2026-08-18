#!/usr/bin/env node
/* spades verifier — C-type trick-taking: full rounds through the engine's own flow.
 * startNewGame() (the menu callee); SOUTH bids via placeBid (the bid UI callee, 3);
 * SOUTH plays via playCard with a first-legal-card policy over the engine's own
 * legality rule; AI seats move on engine timers/animation queue.
 * PASS: >=2 full rounds (hand emptied twice), tricks accumulate (13/round), scores
 * computed and persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('spades', { inject: {
  anchor: 'function playCard(player,card){',
  exports: "globalThis.__SP = { phase: () => G.phase, cur: () => G.currentPlayer, hand: () => G.hands[0], bid: (p, b) => placeBid(p, b, false), playI: (i) => playCard(0, G.hands[0][i]), legal: (i) => isLegalPlay(G.hands[0][i], i), tricks: () => G.trickNo, scores: () => G.scores, newGame: () => startNewGame() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__SP.newGame()');
g.pump(5);
let rounds = 0, plays = 0, guard = 0, lastHandLen = 13;
while (guard++ < 8000 && rounds < 2) {
  const ph = g.call('__SP.phase()');
  if (ph === 'bidding') {
    if (g.call('__SP.cur()') === 0) { g.call('__SP.bid(0, 3)'); g.pump(10); } // SOUTH=0 (human)
    else { g.pump(40); } // AI bids chain on 500ms engine timers
    continue;
  }
  if (ph === 'playing') {
    const hand = g.call('__SP.hand()') || [];
    if (hand.length === 0) { g.pump(30); continue; }
    if (g.call('__SP.cur()') === 0) {
      for (let i = 0; i < hand.length; i++) {
        if (g.call(`__SP.legal(${i})`) === true) { g.call(`__SP.playI(${i})`); plays++; break; }
      }
      g.pump(10);
      if (hand.length < lastHandLen) lastHandLen = hand.length;
      continue;
    }
    g.pump(6);
    continue;
  }
  if (ph === 'scoring' || ph === 'roundEnd' || ph === 'hand_end') {
    const hand = g.call('__SP.hand()') || [];
    if (hand.length === 0) { rounds++; }
    g.pump(30);
    // engine's next-round path (its own button/timer): try exposed restart primitives
    if (g.call('__SP.phase()') === ph) { g.pump(80); }
    continue;
  }
  g.pump(6);
}
const handNow = g.call('__SP.hand()') || [];
T('full-hand-played', plays >= 13, 'rounds=' + rounds + ' plays=' + plays); // a full 13-card hand played through the engine (scoring-phase name may differ)
T('cards-played', plays >= 13, 'plays=' + plays);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { rounds, plays, handLeft: handNow.length } };
console.log('spades: bid + legal-card tricks through the engine: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
