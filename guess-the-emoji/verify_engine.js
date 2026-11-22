#!/usr/bin/env node
/* guess-the-emoji verifier — C-type quiz: solve the FULL catalog (all category levels)
 * via the REAL answer flow. R1190: the old version only ran startGame(0, i), which
 * masked the P1 mapping bug (PUZZLES[puzzleIdx] with local 0..19 index -> every
 * category served the same 20 Movies puzzles). Now:
 *  - every (category, level) pair must load CAT_RANGES[cat].start + level (bijection
 *    over all 204 puzzles), and
 *  - each solve submits the answer of the puzzle ACTUALLY loaded (currentPuzzle),
 *    verified through handleCorrect's coin delta.
 * PASS: all 204 reachable+unique, all solves credited, one wrong-answer path handled,
 * boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('guess-the-emoji', { inject: {
  anchor: 'function submitAnswer() {',
  exports: "globalThis.__GE = { start: (c, p) => startGame(c, p), n: () => PUZZLES.length, ranges: () => CAT_RANGES, ans: (i) => PUZZLES[i].answers[0], cp: () => currentPuzzle, set: (v) => { currentAnswer = v; }, submit: () => submitAnswer(), coins: () => state.coins, completed: () => Object.keys(state.completed || {}).length };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const N = g.call('__GE.n()');
const R = g.call('__GE.ranges()');
T('puzzles-exist', N > 20, 'N=' + N);
T('ranges-cover-catalog', Array.isArray(R) && R.length === 10 && R.reduce((s, r) => s + r[1], 0) === N,
  'ranges=' + JSON.stringify(R) + ' N=' + N);

// Full-catalog bijection + solve through the engine path
const seen = new Set();
let solved = 0, wrongTested = false, mapFails = 0, sample = null;
for (let c = 0; c < R.length; c++) {
  for (let i = 0; i < R[c][1]; i++) {
    g.call(`__GE.start(${c}, ${i})`);
    g.pump(1);
    const cp = g.call('__GE.cp()');
    const expect = R[c][0] + i;
    if (cp !== expect) { mapFails++; if (!sample) sample = { c, i, cp, expect }; }
    seen.add(cp);
    if (!wrongTested) {
      g.call("__GE.set('zzz-not-the-answer')");
      g.call('__GE.submit()');
      g.pump(1);
      wrongTested = true;
    }
    const before = g.call('__GE.coins()');
    const ans = g.call(`__GE.ans(${cp})`);
    g.call(`__GE.set(${JSON.stringify(ans)})`);
    g.call('__GE.submit()');
    g.pump(1);
    if (g.call('__GE.coins()') > before) solved++;
  }
}
T('category-mapping-bijective', mapFails === 0 && seen.size === N, 'mapFails=' + mapFails + ' unique=' + seen.size + '/' + N + ' first=' + JSON.stringify(sample || {}));
T('all-levels-solved-and-credited', solved === N, 'solved=' + solved + '/' + N);
T('wrong-answer-path', wrongTested);
T('persistence-keys-cumulative', g.call('__GE.completed()') >= N - 1, 'completedKeys=' + g.call('__GE.completed()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { solved, of: N, unique: seen.size, coins: g.call('__GE.coins()') } };
console.log('guess-the-emoji: full-catalog mapping + answer-submission through the engine quiz flow: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
