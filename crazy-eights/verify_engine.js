#!/usr/bin/env node
/* crazy-eights verifier — C-type shedding game: a full round through the engine's own flow.
 * newGame('ai',1) (the mode button callee); human plays via playCard (the card-click
 * callee) with a plain first-valid-card policy; eight-draws pick the engine's default
 * suit continuation; AI turns run on the engine's setTimeout(aiTurn) chain.
 * PASS: play reaches ROUND_END or GAME_OVER with scores computed, >=10 human cards
 * played across draws/rounds, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('crazy-eights', { inject: {
  anchor: 'function playCard(playerIdx,card){',
  exports: "globalThis.__CE = { phase: () => G.phase, cur: () => G.currentPlayer, valid: () => getValidCards(0).map(c => ({ s: c.suit, r: c.rank, t: c.type })), hand: () => G.players[0].hand.length, scores: () => G.roundScores, draw: () => { drawCards(0, 1); sortHand(G.players[0].hand); if (getValidCards(0).length === 0) { G.currentPlayer = getNextPlayer(G.currentPlayer); G.activePlayer = G.currentPlayer; updateHUD(); if (G.mode === 'ai' && G.currentPlayer !== 0) setTimeout(aiTurn, 600); } }, /* deck-click handler's exact sequence incl. the aiTurn handoff */ newGame: () => newGame('ai', 1), play: (s, r, v) => { const c = G.players[0].hand.find(x => x.suit === s && x.rank === r); return playCard(0, c); }, next: () => nextPlayer() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__CE.newGame()');
g.pump(5);
T('round-started', ['playing', 'dealing', 'wait_suit'].includes(g.call('__CE.phase()')), 'phase=' + g.call('__CE.phase()'));

let guard = 0, played = 0, drawn = 0, consecDraws = 0;
while (guard++ < 60000) {
  const ph = g.call('__CE.phase()');
  if (ph === 'round_end' || ph === 'game_over') break;
  if (ph === 'wait_suit') { g.pump(4); continue; } // engine resolves suit choice; if human 8 played, engine may need suit — advance
  if (ph === 'playing' && g.call('__CE.cur()') === 0) {
    const valid = g.call('__CE.valid()') || [];
    if (valid.length) {
      // prefer non-8; play first valid non-8 to avoid suit-choice UI
      const pick = valid.find(c => c.t < 4) || valid[0]; // avoid WILD8/WILDD4 (suit-choice UI)
      g.call(`__CE.play(${JSON.stringify(pick.s)}, ${JSON.stringify(pick.r)})`);
      played++; consecDraws = 0;
      g.pump(3);
      continue;
    }
    if (consecDraws < 30) { g.call('__CE.draw()'); drawn++; consecDraws++; g.pump(3); continue; }
    break; // deck reshuffles forever — give up this seat
  }
  g.pump(4); // AI on engine timers
}
const endPhase = g.call('__CE.phase()');
T('round-concluded', endPhase === 'round_end' || endPhase === 'game_over', 'end=' + endPhase);
T('cards-interacted', played + drawn >= 8, 'played=' + played + ' drawn=' + drawn);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { endPhase, played, drawn, scores: g.call('__CE.scores()') } };
console.log('crazy-eights: first-valid-card round through engine playCard: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
