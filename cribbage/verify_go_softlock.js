#!/usr/bin/env node
/* cribbage Go-softlock regression (2026-11-11 R1133):
 * P1 softlock: human pegging turn with no playable card had NO Go path → freeze.
 * Layer 1 (static): doHumanGoCheck wired at every human-turn scheduling site.
 * Layer 2 (dynamic): build human-unplayable pegging state, invoke the engine's
 * own scheduling chain; the freeze must resolve and the Go point must be awarded
 * to the player who played the last card (AI). Pre-fix build: ReferenceError. */
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };

// ---- Layer 1: static wiring ----
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const wire = (re, n, why) => { const m = src.match(re); T('wire-' + n, !!m, why); return m ? m.length : 0; };
wire(/G\.currentPlayer=0;\s*render\(\);\s*setTimeout\(doHumanGoCheck/, 1, 'playPegCard pi===1 nextValid=0 branch must schedule doHumanGoCheck');
wire(/else\{\s*G\.currentPlayer=0;\s*render\(\);\s*setTimeout\(doHumanGoCheck/, 2, 'doAIPegg AI-Go else must schedule doHumanGoCheck');
wire(/setTimeout\(doAIPegg,600\);\s*\n\s*else setTimeout\(doHumanGoCheck,600\);/, 3, 'afterDiscards/startPegging human-first must schedule doHumanGoCheck');
wire(/setTimeout\(doAIPegg,500\);\s*\n\s*else\{render\(\);setTimeout\(doHumanGoCheck,500\);\}/, 4, 'endPeggingRound human-first must schedule doHumanGoCheck');
T('wire-go-points', /var goPlayer=lastPlayer;/.test(src), 'Go point must go to lastPlayer (rule: one for go belongs to last player who played)');

// ---- Layer 2: dynamic engine chain ----
const g = bootGame('cribbage', { inject: {
  anchor: 'function playPegCard(pi,card){',
  exports: "globalThis.__T = { setup: () => { G.phase = 'pegging'; G.dealer = 0; G.starter = { suit: 'S', rank: 10, value: 10 }; G.playStack = [{ card: { suit: 'S', rank: 10, value: 10 } }]; G.playTotal = 10; G.goCount = 0; G.currentPlayer = 0; G.players[0].hand = ['S', 'H', 'D', 'C'].map(s => ({ suit: s, rank: 13, value: 10 })); G.players[1].hand = ['S', 'H', 'D'].map(s => ({ suit: s, rank: 4, value: 4 })); G.players[0].totalScore = 0; G.players[1].totalScore = 0; }, humanTurn: () => G.currentPlayer, total: () => G.playTotal, stack: () => G.playStack.length, ai: () => G.players[1].totalScore, you: () => G.players[0].totalScore, ph: () => G.phase, goCheck: () => doHumanGoCheck(), handLen: () => G.players[0].hand.length, aiHand: () => G.players[1].hand.length, newGame: () => newGame(1), setTotal: (t) => { G.playTotal = t; }, goCount: () => G.goCount, isHuman: () => !!G.players[0].isHuman, turn: () => G.currentPlayer };",
} });
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 120));

g.call('__T.newGame()');
g.pump(5);
g.call('__T.setup()');
// human has only kings (10-valued), total=10 → wait: K is 10, 10+10=20<=31 playable!
// make human UNPLAYABLE: total must be >= 22 for tens, but kings are 10-valued.
// kings value=10 → playable at total<=21. Force unplayable via rank-13 kings only:
// playTotal=22 scenario: AI plays 4+4 first. Simpler: human hand of rank-13 with
// value 10 and total=25: 25+10=35 > 31 → unplayable.
g.call("__T.setup()");
g.call("__T.setTotal(25)");
g.call('__T.goCheck()'); // engine's own human-Go entry
console.log('timers queued:', g.timers.length);
console.log('after goCheck: goCount=' + g.call('__T.goCount()') + ' turn=' + g.call('__T.turn()') + ' isHuman=' + g.call('__T.isHuman()') + ' ph=' + g.call('__T.ph()'));
for (let pf = 0; pf < 60; pf++) {
  g.pump(50); // 50 frames ≈ 833ms virtual — engine chain: human Go -> doAIPegg(700ms) -> playPegCard(500ms)
  if (g.call('__T.aiHand()') < 3 || g.call('__T.stack()') !== 1 || g.call('__T.ph()') !== 'pegging') break;
}
console.log('ERRS', JSON.stringify((g.sandbox.__errors||[]).slice(-6)));
console.log('after wait: goCount=' + g.call('__T.goCount()') + ' turn=' + g.call('__T.turn()') + ' aiHand=' + g.call('__T.aiHand()') + ' stack=' + g.call('__T.stack()') + ' ph=' + g.call('__T.ph()'));

// after human Go (goCount=1): AI must peg (hand shrinks) or round must end.
const aiHandAfter = g.call('__T.aiHand()');
const stackAfter = g.call('__T.stack()');
const progressed = (aiHandAfter < 3) || (stackAfter === 0) || (g.call('__T.ai()') > 0) || (g.call('__T.ph()') !== 'pegging');
T('human-go-resolves-freeze', progressed, `FROZEN: aiHand=${aiHandAfter} stack=${stackAfter} ai=${g.call('__T.ai()')} ph=${g.call('__T.ph()')}`);

// If chain ran to endPeggingRound (both sides stuck), Go point must be the AI's
// (AI played last in this constructed state — it is the lastPlayer side).
const aiScore = g.call('__T.ai()'), youScore = g.call('__T.you()');
const goPointSane = !(youScore === 1 && aiScore === 0); // human said Go twice ⇒ +1 must NOT be the human's
T('go-point-not-misdirected', goPointSane, `Go point went to human (${youScore}) though human said Go (ai=${aiScore})`);

console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail ? 'FAIL' : 'PASS', fails, aiScore, youScore, aiHandAfter, stackAfter }));
process.exit(fail ? 1 : 0);
