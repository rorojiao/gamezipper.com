#!/usr/bin/env node
/* mastermind verifier — real input only: palette color buttons (closure listeners),
 * canvas pointerdown on the engine's own computed slot positions, real Submit/Undo/New
 * buttons, real difficulty buttons. Independent two-pass feedback oracle on node side.
 * Covers: win on easy (feedback oracle on a deliberate wrong guess first), lose by
 * maxGuesses, undo, medium+hard wins (palette rebuild), stats persisted to mm_stats. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mastermind', { inject: {
  anchor: 'function init(){',
  exports: `globalThis.__MM = { secret: () => secret, guesses: () => guesses, cur: () => currentCode,
    st: () => ({ gameOver, gameWon, difficulty, sel: selectedColor, submitLock, animating }),
    stats: () => stats, lay: () => getBoardLayout(), maxG: () => DIFFICULTIES[difficulty].maxGuesses };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const els = g.els;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

// tutorial overlay auto-opens at 500ms on first visit — let it fire, then close it
g.pump(35);
if (els.tutOverlay && els.tutOverlay.classList.contains('open')) { g.call("closeOverlay('tutOverlay')"); g.pump(2); }
T('booted-not-over', g.call('__MM.st().gameOver') === false && g.call('__MM.secret()').length === 4, 'secret=' + JSON.stringify(g.call('__MM.secret()')));

// independent standard mastermind feedback (two-pass)
const fb = (guess, secret) => {
  const s = secret.slice(), q = guess.slice(); let b = 0, w = 0;
  for (let i = 0; i < 4; i++) if (q[i] === s[i]) { b++; s[i] = -1; q[i] = -2; }
  for (let i = 0; i < 4; i++) { if (q[i] < 0) continue; const j = s.indexOf(q[i]); if (j >= 0) { w++; s[j] = -1; } }
  return { black: b, white: w };
};

const clickSlot = (i) => {
  const lay = g.call('__MM.lay()');
  const row = g.call('__MM.guesses()').length;
  els.board.dispatch('pointerdown', { clientX: lay.pegPositions[i], clientY: 12 + row * 48 + 24, preventDefault() {} });
};
const pickColor = (c) => { els.palette.children[c].dispatch('click', {}); };
const submit = () => { els.btnSubmit.dispatch('click', {}); g.pump(95); };

// ---- game 1 (easy): deliberate wrong guess w/ feedback oracle, undo probe, then win ----
const secret = g.call('__MM.secret()').slice();
let wrongGuess = [(secret[0] + 1) % 4, (secret[0] + 1) % 4, (secret[0] + 1) % 4, (secret[0] + 1) % 4];
if (JSON.stringify(wrongGuess) === JSON.stringify(secret)) wrongGuess = [0, 1, 2, 3].map(x => (x + 1) % 4);
for (let i = 0; i < 4; i++) { pickColor(wrongGuess[i]); clickSlot(i); }
T('slots-filled', JSON.stringify(g.call('__MM.cur()')) === JSON.stringify(wrongGuess), 'cur=' + JSON.stringify(g.call('__MM.cur()')));
els.btnUndo.dispatch('click', {});
T('undo-clears-one', JSON.stringify(g.call('__MM.cur()')) === JSON.stringify([wrongGuess[0], wrongGuess[1], wrongGuess[2], null]),
  'cur=' + JSON.stringify(g.call('__MM.cur()'))); // undo removes only the last placed peg (by design)
for (let i = 0; i < 4; i++) { pickColor(wrongGuess[i]); clickSlot(i); }
submit();
const g1 = g.call('__MM.guesses()');
const exp = fb(wrongGuess, secret);
T('feedback-oracle', g1.length === 1 && g1[0].feedback.black === exp.black && g1[0].feedback.white === exp.white,
  'engine=' + JSON.stringify(g1[0] && g1[0].feedback) + ' expected=' + JSON.stringify(exp));

for (let i = 0; i < 4; i++) { pickColor(secret[i]); clickSlot(i); }
submit();
T('bootdiff-won', g.call('__MM.st().gameWon') === true, 'st=' + JSON.stringify(g.call('__MM.st()')));
g.pump(80); // win overlay timer (1200ms)
T('win-overlay', els.gameOverOverlay.classList.contains('open') && els.resultTitle.textContent === 'Code Cracked!', els.resultTitle.textContent);
T('score-shown', /^Score: \d+/.test(els.resultScore.textContent || ''), els.resultScore.textContent);
g.call("closeOverlay('gameOverOverlay')"); g.pump(2);

// ---- game 2: lose by maxGuesses wrong submissions (on the boot difficulty) ----
const MAXG = g.call('__MM.maxG()');
els.btnNew.dispatch('click', {}); g.pump(3);
const secret2 = g.call('__MM.secret()').slice();
let bad = [0, 0, 0, 0];
if (JSON.stringify(bad) === JSON.stringify(secret2)) bad = [1, 1, 1, 1];
for (let r = 0; r < MAXG; r++) {
  for (let i = 0; i < 4; i++) { pickColor(bad[i]); clickSlot(i); }
  submit();
  if (g.call('__MM.st().gameOver')) break;
}
g.pump(60); // lose overlay timer (800ms)
T('lost', g.call('__MM.st().gameOver') === true && g.call('__MM.st().gameWon') === false &&
  g.call('__MM.guesses()').length === MAXG, 'guesses=' + g.call('__MM.guesses()').length + ' maxG=' + MAXG);
T('lose-overlay', els.gameOverOverlay.classList.contains('open') && els.resultTitle.textContent === 'Code Unbroken', els.resultTitle.textContent);
g.call("closeOverlay('gameOverOverlay')"); g.pump(2);

// ---- win on every difficulty via the real difficulty buttons ----
for (const [idx, name, nc] of [[0, 'easy', 4], [1, 'medium', 6], [2, 'hard', 8]]) {
  els.diffBtns.children[idx].dispatch('click', {}); g.pump(3);
  T(name + '-palette', els.palette.children.length === nc, 'n=' + els.palette.children.length);
  const s = g.call('__MM.secret()').slice();
  for (let i = 0; i < 4; i++) { pickColor(s[i]); clickSlot(i); }
  submit();
  T(name + '-won', g.call('__MM.st().gameWon') === true && g.call('__MM.guesses()')[0].feedback.black === 4,
    'fb=' + JSON.stringify(g.call('__MM.guesses()')[0] && g.call('__MM.guesses()')[0].feedback));
  g.pump(80); g.call("closeOverlay('gameOverOverlay')"); g.pump(2);
}

const st = g.call('__MM.stats()');
T('stats', st.played === 5 && st.wins === 4 && st.streak === 3 && st.bestStreak >= 3 && st.totalGuesses === 5,
  JSON.stringify({ played: st.played, wins: st.wins, streak: st.streak, best: st.bestStreak, tg: st.totalGuesses }));
const saved = JSON.parse(g.ls.getItem('mm_stats') || '{}');
T('stats-persisted', saved.played === 5 && saved.wins === 4, 'saved=' + JSON.stringify({ p: saved.played, w: saved.wins }));

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { games: 'win(boot)+lose+win-easy/medium/hard', oracle: 'independent 2-pass', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('mastermind: easy win+oracle, lose-by-10, medium+hard wins via real buttons: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
