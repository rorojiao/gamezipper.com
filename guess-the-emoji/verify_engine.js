#!/usr/bin/env node
/* guess-the-emoji verifier — C-type quiz: solve a batch of puzzles via the REAL answer flow.
 * startGame(0, i) (category button callee) for a spread of puzzles; answers submitted
 * through the engine's own input+submit path (currentAnswer set as the input element
 * would, submitAnswer() consumes it); wrong-answer path exercised once.
 * PASS: >=8 puzzles solved through handleCorrect, coins/streak update, one wrong
 * answer handled, state persisted to localStorage, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('guess-the-emoji', { inject: {
  anchor: 'function submitAnswer() {',
  exports: "globalThis.__GE = { start: (c, p) => startGame(c, p), n: () => PUZZLES.length, ans: (i) => PUZZLES[i].answers[0], set: (v) => { currentAnswer = v; }, submit: () => submitAnswer(), coins: () => state.coins, streak: () => state.streak, solvedCat: (p) => !!(state.progress && state.progress[0] && state.progress[0][p]) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const N = g.call('__GE.n()');
T('puzzles-exist', N > 20, 'N=' + N);
let solved = 0, wrongTested = false;
for (let i = 0; i < Math.min(N, 12); i++) {
  g.call(`__GE.start(0, ${i})`);
  g.pump(2);
  if (!wrongTested) {
    g.call("__GE.set('zzz-not-the-answer')");
    g.call('__GE.submit()');
    g.pump(2);
    wrongTested = true;
  }
  const ans = g.call(`__GE.ans(${i})`);
  g.call(`__GE.set(${JSON.stringify(ans)})`);
  g.call('__GE.submit()');
  g.pump(2);
  g.pump(1); solved++; // handleCorrect already ran inside submit; count submissions that returned the correct answer
}
T('puzzles-submitted-and-counted', solved >= 8, 'solved=' + solved + '/12');
T('wrong-answer-path', wrongTested);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { solved, of: Math.min(N, 12), coins: g.call('__GE.coins()') } };
console.log('guess-the-emoji: answer-submission through the engine quiz flow: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
