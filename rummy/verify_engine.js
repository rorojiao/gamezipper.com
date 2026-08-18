#!/usr/bin/env node
/* rummy verifier — C-type: full turn cycles through the engine's own actions.
 * newGame(); human draws via playerDrawFromStock (the stock-pile click callee),
 * discards via playerDiscard (the discard-button callee after selecting); AI turns
 * run on engine timers.
 * PASS: >=8 draw+discard cycles, hand stays 7-8 (engine legality), stock shrinks,
 * game continues past AI turns, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('rummy', { inject: {
  anchor: 'function playerDrawFromStock(){',
  exports: "globalThis.__RM = { state: () => G.state, turn: () => G.turn, phase: () => G.phase, hand: () => G.playerHand.length, stock: () => G.stock.length, draw: () => playerDrawFromStock(), discard: () => { G.selected.add(0); playerDiscard(); }, newGame: () => newGame() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__RM.newGame()');
g.pump(5);
let cycles = 0, guard = 0;
const stock0 = g.call('__RM.stock()') || 0;
while (guard++ < 20000 && cycles < 10) {
  if (g.call('__RM.state()') !== 'playing') break;
  if (g.call('__RM.turn()') === 'player') {
    if (g.call('__RM.phase()') === 'draw') { g.call('__RM.draw()'); g.pump(5); continue; }
    if (g.call('__RM.phase()') === 'play') { g.call('__RM.discard()'); cycles++; g.pump(10); continue; }
  }
  g.pump(12); // AI on timers
}
const handNow = g.call('__RM.hand()') || 0;
T('turn-cycles', cycles >= 8, 'cycles=' + cycles);
T('hand-legal-size', handNow >= 6 && handNow <= 9, 'hand=' + handNow);
T('stock-shrank', g.call('__RM.stock()') < stock0, stock0 + '->' + g.call('__RM.stock()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { cycles, hand: handNow, stock: g.call('__RM.stock()') } };
console.log('rummy: draw+discard turns through engine actions: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
