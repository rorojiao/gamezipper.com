#!/usr/bin/env node
/* typing-speed verifier — B-type: real typing through the engine's own input handler.
 * restartBtn click -> reset; simulated typist sets input.value and fires REAL 'input'
 * events (handleInput consumes them char-by-char — tick sounds, word-complete, green-line
 * effects all execute); the 30s countdown runs on the engine's own recursive timer.
 * NOTE engine fix (2026-08-17): playCountdown was called but never defined — the
 * ReferenceError froze the countdown at 5s and the game never reached endGame.
 * PASS: correct counter grows, endGame fires, result card renders, restart works. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('typing-speed', { inject: {
  anchor: 'function handleInput(){',
  exports: "globalThis.__TS = { correct: () => correct, finished: () => finished, text: () => text };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const input = g.els['inputArea'];
T('input-wired', !!input);

g.els['restartBtn'].dispatch('click', {});
T('reset-clean', g.call('__TS.correct()') === 0);

let typed = 0, guard = 0, maxCorrect = 0;
while (!g.call('__TS.finished()') && guard++ < 5000) {
  g.pump(2);
  const t = g.call('__TS.text()') || '';
  if (typed < 400 && typed < t.length) {
    typed = Math.min(t.length, typed + 2);
    input.value = t.slice(0, typed);
    input.dispatch('input', { isComposing: false });
    maxCorrect = Math.max(maxCorrect, g.call('__TS.correct()'));
  }
}
T('typing-registered', maxCorrect >= 50, 'maxCorrect=' + maxCorrect);
T('game-finished', g.call('__TS.finished()') === true);
const rChars = g.els['rChars'], rWpm = g.els['rWpm'];
T('result-rendered', /\d/.test(String(rChars.textContent)) && /\d/.test(String(rWpm.textContent)),
  'rChars=' + rChars.textContent + ' rWpm=' + rWpm.textContent);
T('result-card-shown', g.call("document.getElementById('resultCard').style.display") === 'block');

g.els['restartBtn'].dispatch('click', {});
T('restart-works', g.call('__TS.finished()') === false && g.call('__TS.correct()') === 0);

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { maxCorrect, finalWpm: rWpm.textContent } };
console.log('typing-speed: real-input typing session over the engine 30s timer: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
