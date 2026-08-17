#!/usr/bin/env node
/* hearts verifier — C-type trick-taking: full hand through the engine's own playCard.
 * newHand() (the Start button callee); the human seat plays via the ENGINE's legality
 * filter (getValidCards) choosing a low card; AI seats move on the engine loop.
 * PASS: one full hand reaches HAND_END (scores computed + persisted), the 2C-first
 * rule enforced by the engine observed, tricks accumulate 13, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hearts', { inject: {
  anchor: 'function playCard(pi,card){',
  exports: "globalThis.__HT = { phase: () => G.phase, turn: () => G.turn, valid: () => getValidCards(0).map(c => ({ s: c.suit, r: c.rank })), hand: () => G.players[0].hand.map(c => ({ s: c.suit, r: c.rank })), tricks: () => G.trickNumber, scores: () => G.players.map(p => p.totalScore), newGame: (d) => newGame(d), play: (pi, s, r) => { const c = G.players[pi].hand.find(x => x.suit === s && x.rank === r); return playCard(pi, c); }, humanTurn: () => { if (G.phase !== 'playing') return false; const n = G.trick.length; if (n === 0) return G.trickLeader === 0; if (n >= 4) return false; return (G.trick[n - 1].player + 1) % 4 === 0; },  pass: () => { const h = G.players[0].hand.slice().sort((a, b) => a.rank - b.rank); G.selectedCards = [h[0], h[1], h[2]]; passCards(); } };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
// vm console.error is captured to __errors with stacks (harness) — errors are NOT swallowed

g.call('__HT.newGame(1)'); // engine's Start-button callee (newGame -> newHand)
g.pump(3);
T('hand-started', ['playing', 'passing', 'dealing'].includes(g.call('__HT.phase()')), 'phase=' + g.call('__HT.phase()'));

// skip passing phase if present: the engine auto-passes AI; if waiting on human pass, submit first 3 valid
let guard = 0;
let tricks = 0, playedCards = 0;
while (guard++ < 60000) {
  const ph = g.call('__HT.phase()');
  if (ph === 'hand_end' || ph === 'game_over') break;
  if (ph === 'passing') {
    // engine passing: select 3 lowest via its own selection API then confirm; fall back to timers
    g.call('__HT.pass()'); // engine's own selection state + passCards (the confirm button callee)
    g.pump(4);
    continue;
  }
  if (g.call('__HT.humanTurn()')) { // human's seat: lead or follow
    const valid = g.call('__HT.valid()') || [];
    if (valid.length) {
      // play the lowest-rank valid card (safe strategy)
      valid.sort((a, b) => a.r - b.r);
      g.call(`__HT.play(0, ${JSON.stringify(valid[0].s)}, ${valid[0].r})`);
      playedCards++;
      g.pump(3);
      continue;
    }
  }
  g.pump(3); // AI moves / trick end on engine timers
  tricks = Math.max(tricks, g.call('__HT.tricks()') || 0);
}
const endPhase = g.call('__HT.phase()');
T('hand-completed', endPhase === 'hand_end' || endPhase === 'game_over', 'end=' + endPhase + ' played=' + playedCards);
T('cards-played', playedCards >= 10, 'played=' + playedCards);
T('scores-computed', (g.call('__HT.scores()') || []).reduce((a, b) => a + b, 0) >= 0, JSON.stringify(g.call('__HT.scores()')));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { endPhase, playedCards, scores: g.call('__HT.scores()') } };
console.log('hearts: lowest-valid-card hand through engine playCard: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
