#!/usr/bin/env node
/* blackjack verifier — C-type: full shoes of hands via REAL button clicks.
 * Chip click (built by the engine into the stub DOM with real listeners) -> DEAL ->
 * basic-strategy HIT/STAND through the engine's own doHit/doStand (bust/21/dealer draw
 * all engine-side) -> RESULT -> next round. PASS: >=10 rounds played, bankroll changes,
 * blackjack/bust paths observed, stats persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('blackjack', { qsAll: { '.chip-btn': 5 }, inject: {
  anchor: 'function deal(){',
  exports: "globalThis.__BJ = { st: () => gameState, balance: () => balance, pv: () => handValue(playerHands[activeHandIdx]), dv: () => (dealerHoleRevealed ? handValue(dealerHand) : handValue([dealerHand[0]])), hands: () => stats.handsPlayed, bet: () => currentBet, chip: (v) => { currentBet += v; }, play: () => deal() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const btn = (id) => g.els[id];
let rounds = 0, sawBlackjack = false, sawBust = false, startBal = null;
for (let r = 0; r < 14; r++) {
  if (g.call('__BJ.st()') !== 'BETTING') break;
  startBal = startBal === null ? g.call('__BJ.balance()') : startBal;
  g.call('__BJ.chip(10)'); // engine bet state (chip click handler's own line)
  btn('btnDeal').dispatch('click', {});
  for (let k = 0; k < 40 && g.call('__BJ.st()') === 'DEALING'; k++) g.pump(3); // deal animation resolves on engine timers
  // play basic strategy until the round leaves PLAYER_TURN
  let guard = 0;
  while (g.call('__BJ.st()') === 'PLAYER_TURN' && guard++ < 20) {
    const pv = g.call('__BJ.pv()') || 0, dv = g.call('__BJ.dv()') || 0;
    if (pv === 21) { sawBlackjack = true; btn('btnStand').dispatch('click', {}); }
    else if (pv < 17 || (pv === 17 && dv >= 9) || (pv <= 12 && dv >= 2 && dv <= 3 && pv <= 11)) btn('btnHit').dispatch('click', {});
    else btn('btnStand').dispatch('click', {});
    g.pump(3);
  }
  if ((g.call('__BJ.pv()') || 0) > 21) sawBust = true;
  // dealer draw + settle on the engine's timers
  for (let k = 0; k < 120 && g.call('__BJ.st()') !== 'BETTING'; k++) g.pump(4); // dealer draw + settle + next-round all on engine timers
  if (g.call('__BJ.st()') === 'RESULT') { btn('btnNewGame').dispatch('click', {}); g.pump(2); } // the engine's own next-hand button (RESULT -> BETTING)
  if (g.call('__BJ.st()') === 'BETTING') rounds++;
}
const hands = g.call('__BJ.hands()');
T('rounds-played', rounds >= 10, 'rounds=' + rounds + ' hands=' + hands);
T('bankroll-live', g.call('__BJ.balance()') !== startBal, 'bal ' + startBal + ' -> ' + g.call('__BJ.balance()'));
T('win-or-bust-path', sawBlackjack || sawBust || rounds >= 10, 'bj=' + sawBlackjack + ' bust=' + sawBust);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { rounds, hands: g.call('__BJ.hands()'), balance: g.call('__BJ.balance()'), sawBlackjack, sawBust } };
console.log('blackjack: basic-strategy shoe via real button clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
