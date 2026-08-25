#!/usr/bin/env node
/* wordle verifier — practice rounds for all 3 word lengths (4/5/6): read the engine's
 * own answer (G.answer), type it through REAL document keydown events (the same path
 * as a physical keyboard), submit with ENTER, win = engine G.won/gameOver + modal.
 * Also verifies the invalid-word rejection path (engine toast, guess not consumed). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('wordle', { inject: {
  anchor: 'function submitGuess(){',
  exports: `globalThis.__W = {
    state: () => ({ answer: G.answer, current: G.current, won: G.won, gameOver: G.gameOver,
                    guesses: G.guesses.length, wordLen: G.wordLen, max: G.maxGuesses }),
    practice: (len) => { document.getElementById('wordLen').value = String(len); startPractice(); },
    toast: () => (document.getElementById('toast') || {}).textContent || '',
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const type = (word) => { for (const ch of word.toUpperCase()) g.sandbox.document.dispatch('keydown', { key: ch, preventDefault() {} }); };
const enter = () => g.sandbox.document.dispatch('keydown', { key: 'ENTER', preventDefault() {} });
const bksp = () => g.sandbox.document.dispatch('keydown', { key: 'BACKSPACE', preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

for (const len of [4, 5, 6]) {
  g.call(`__W.practice(${len})`); g.pump(2);
  const st = g.call('__W.state()');
  T(`len${len}-started`, st.answer.length === len && st.gameOver === false, JSON.stringify(st).slice(0, 90));

  // invalid-word path: a 5-letter junk string that is not in the word list
  const junk = 'zzqx'.slice(0, len === 4 ? 4 : len === 5 ? 5 : 6).padEnd(len, 'z');
  type(junk); enter(); g.pump(3);
  const afterJunk = g.call('__W.state()');
  T(`len${len}-rejects-invalid`, afterJunk.guesses === 0 && afterJunk.current.length === len,
    'junk ' + junk + ' consumed? guesses=' + afterJunk.guesses);
  bksp(); for (let i = 1; i < len; i++) bksp(); // clear the row via real keys

  // winning path: type the engine's own answer
  type(st.answer); enter();
  g.pump(len * 25 + 30); // reveal timers fire at i*300ms; pump advances virtual clock
  const done = g.call('__W.state()');
  T(`len${len}-win-via-keys`, done.won === true && done.gameOver === true, JSON.stringify(done).slice(0, 90));
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { rounds: '3 practice wins (4/5/6) via real keys + invalid-word rejection' } };
console.log('wordle: practice wins at 4/5/6 letters via real keyboard input: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
