#!/usr/bin/env node
/* contexto verifier — practice + daily rounds: put the engine's own secret word in the
 * input field (as typed) and press the real submit button; wrong guesses must rank >1
 * with temperature classes; exact word => rank 1, engine state.won + win screen timer.
 * Also: non-dictionary and duplicate guesses are ignored (guess count unchanged). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('contexto', { inject: {
  anchor: 'function submitGuess() {',
  exports: `globalThis.__C = {
    start: (m) => startGame(m),
    secret: () => state.secretWord,
    st: () => ({ won: state.won, n: state.guesses.length, last: state.guesses[state.guesses.length - 1] }),
    input: (w) => { gameInput.value = w; },
    wrong: () => { const s = state.secretWord; for (const w of ALL_WORDS) if (w !== s) return w; },
    press: () => submitBtn.dispatch('click', {}),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const input = (w) => { g.call(`__C.input(${JSON.stringify(w)})`); g.call('__C.press()'); g.pump(40); }; // win timer 500ms + isSubmitting 300ms

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

for (const mode of ['practice', 'daily']) {
  g.call(`__C.start('${mode}')`); g.pump(30);
  const secret = g.call('__C.secret()');
  T(`${mode}-secret-picked`, typeof secret === 'string' && secret.length >= 2, 'secret=' + secret);

  // non-dictionary word: ignored entirely
  input('zzqxjw');
  T(`${mode}-ignores-nonword`, g.call('__C.st()').n === 0, 'n=' + g.call('__C.st()').n);

  // wrong but real word: rank > 1, counted, has temperature
  const wrong = g.call('__C.wrong()');
  input(wrong);
  let st = g.call('__C.st()');
  T(`${mode}-wrong-ranks`, st.n === 1 && st.last.rank > 1 && !!st.last.temp.class, JSON.stringify(st.last || {}).slice(0, 90));

  // duplicate guess ignored
  input(wrong);
  T(`${mode}-duplicate-ignored`, g.call('__C.st()').n === 1, 'n=' + g.call('__C.st()').n);

  // the secret word itself: rank 1 => won
  input(secret);
  st = g.call('__C.st()');
  T(`${mode}-win`, st.won === true && st.last.rank === 1, JSON.stringify(st.last || {}).slice(0, 90));
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { modes: 'practice+daily wins via real submit button' } };
console.log('contexto: practice+daily secret words found via typed input + submit button: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
