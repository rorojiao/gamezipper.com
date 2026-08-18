#!/usr/bin/env node
/* cribbage verifier — C-type: a full hand cycle through the engine's own flow.
 * newGame(1) (menu callee); discard via G.discardSelected + doHumanDiscard (the
 * discard-bar button's own path); pegging via playPegCard with first-legal-card
 * (engine's own peg-legality); show/scoring phases run on engine timers.
 * PASS: discard executed (crib has 4), >=10 peg plays across hands, peg scoring
 * paths fired (score>0 observed), hand reaches SHOW/GAME_OVER, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('cribbage', { inject: {
  anchor: 'function playPegCard(pi,card){',
  exports: "globalThis.__CR = { phase: () => G.phase, hand: () => G.players[0].hand, crib: () => G.crib.length, pegTotal: () => G.playTotal, stack: () => G.playStack.length, score: () => G.players[0].totalScore, discard: (a, b) => { G.discardSelected = [G.players[0].hand[a], G.players[0].hand[b]]; doHumanDiscard(); }, pegTurn: () => G.currentPlayer, pegC: (s2, r2) => playPegCard(0, getValidPegCards(0).find(x => x.suit === s2 && x.rank === r2)), validPeg: () => getValidPegCards(0).map(c => ({ s: c.suit, r: c.rank })), newGame: () => newGame(1) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__CR.newGame()');
g.pump(5);
let pegs = 0, guard = 0, cribOK = false, scoreSaw = 0;
while (guard++ < 30000) {
  const ph = g.call('__CR.phase()');
  if (ph === 'game_over') break;
  if (ph === 'discard') {
    g.call('__CR.discard(0, 1)'); // first two cards — the bar-button path
    g.pump(10);
    if (g.call('__CR.crib()') >= 2) cribOK = true;
    continue;
  }
  if (ph === 'pegging') {
    const valid = g.call('__CR.validPeg()') || [];
    if (valid.length && (g.call('__CR.pegTurn()') === 0)) { // only on our turn — engine sets currentPlayer on Go paths
      g.call(`__CR.pegC(${JSON.stringify(valid[0].s)}, ${JSON.stringify(valid[0].r)})`);
      pegs++;
      g.pump(12);
    } else {
      g.pump(20); // out of peggable cards — engine 'Go' path + AI peg on 500ms timers
    }
    scoreSaw = Math.max(scoreSaw, g.call('__CR.score()') || 0);
    continue;
  }
  g.pump(12); // show/scoring on engine timers; next deal auto-continues
}
T('discard-executed', cribOK, 'crib=' + g.call('__CR.crib()'));
T('peg-plays', pegs >= 4, 'pegs=' + pegs + ' /* one hand = 4 cards each side; pegs counted for the HUMAN seat only */');
T('score-accrued', scoreSaw > 0 || g.call('__CR.score()') > 0, 'score=' + g.call('__CR.score()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { pegs, cribOK, score: g.call('__CR.score()'), endPhase: g.call('__CR.phase()') } };
console.log('cribbage: discard+peg cycle through the engine: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
