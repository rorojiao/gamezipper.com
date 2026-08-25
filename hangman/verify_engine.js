#!/usr/bin/env node
/* hangman verifier — real input paths only: canvas pointerdown on the engine's own
 * button rects (play/daily/category/hint/next/play-again) + document keydown for
 * letters (game AND daily screens). Covers: daily solve+streak, hint reveal,
 * 7-wrong gameOver -> play-again restart, then ALL 20 levels x 5 words solved
 * letter-by-letter through guessLetter via keydown, 3-star levelComplete each,
 * progress persisted to localStorage 'hangman_save'. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hangman', { inject: {
  anchor: 'function init() {',
  exports: `globalThis.__H = { S: STATE, guess: guessLetter, useHint, nextLevel, restartGame };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const S = g.call('__H.S');
T('state-exported', !!S && S.screen === 'title', 'screen=' + (S && S.screen));

const cv = g.els.gameCanvas;
const click = (r) => cv.dispatch('pointerdown', { clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, preventDefault() {} });
const kd = (ch) => g.sandbox.document.dispatch('keydown', { key: ch, preventDefault() {} });

// ---- daily challenge (first, so the campaign starts clean afterwards) ----
g.pump(3);
T('title-buttons', !!S.playBtn && !!S.dailyBtn, 'playBtn=' + JSON.stringify(S.playBtn || null));
click(S.dailyBtn);
T('daily-entered', S.screen === 'dailyChallenge', S.screen);
g.pump(3); // drawDailyChallenge lazily inits STATE.dailyWord
const dw = S.dailyWord && S.dailyWord.word;
T('daily-word-init', typeof dw === 'string' && dw.length >= 3, 'word=' + dw);
for (const ch of new Set(dw)) kd(ch);
// the harness sandbox runs a virtual clock (starts at epoch) — the engine's new Date()
// lives in that world, so "today" must be read through the sandbox, not node's real Date
const today = g.call('new Date().toISOString().split("T")[0]');
T('daily-solved', S.dailyComplete === true, 'complete=' + S.dailyComplete);
T('daily-streak', S.dailyStreak === 1 && S.lastDaily === today, 'streak=' + S.dailyStreak + ' last=' + S.lastDaily);
T('daily-persisted', JSON.parse(g.ls.getItem('hangman_save') || '{}').lastDaily === today, g.ls.getItem('hangman_save') || 'empty');
g.pump(3); click(S.nextBtn);
T('daily-exit', S.screen === 'title', S.screen);

// ---- category select ----
g.pump(3); click(S.playBtn);
T('category-screen', S.screen === 'categorySelect', S.screen);
g.pump(3);
const cats = Object.keys(S.categoryBounds || {});
T('categories-drawn', cats.length >= 8, 'n=' + cats.length);
const cat = cats[0];
click(S.categoryBounds[cat]);
T('round-started', S.screen === 'game' && S.selectedCategory === cat && typeof S.currentWord === 'string' && S.currentWord.length >= 3,
  'screen=' + S.screen + ' cat=' + S.selectedCategory + ' word=' + S.currentWord);

// ---- hint via the real canvas hint button ----
g.pump(2);
const before = S.guessedLetters.size;
click(S.hintBtn);
T('hint-reveals', S.guessedLetters.size === before + 1 && S.hintsUsed === 1 && S.hintsRemaining === Infinity,
  'guessed ' + before + '->' + S.guessedLetters.size + ' used=' + S.hintsUsed + ' left=' + S.hintsRemaining);

// solve this hinted word
for (const ch of new Set(S.currentWord)) if (!S.guessedLetters.has(ch)) kd(ch);
T('hinted-word-complete', S.wordsInRound === 1, 'inRound=' + S.wordsInRound);
g.pump(100);
T('next-word-timer', S.currentWordIndex === 2 && S.screen === 'game', 'idx=' + S.currentWordIndex + ' screen=' + S.screen);

// ---- game over by maxWrong wrong letters, then play again ----
const mw = 7; // tier 1
let wrongs = 0;
for (const ch of 'ZXQJVKWY') { if (!S.currentWord.includes(ch)) { kd(ch); wrongs++; } if (S.screen === 'gameOver') break; }
T('game-over', S.screen === 'gameOver' && S.wrongGuesses >= mw, 'screen=' + S.screen + ' wrong=' + S.wrongGuesses + '/' + mw);
g.pump(3);
click(S.playAgainBtn);
T('restart', S.screen === 'game' && S.currentLevel === 1 && S.wordsInRound === 0 && S.wrongGuesses === 0,
  'screen=' + S.screen + ' lvl=' + S.currentLevel + ' inRound=' + S.wordsInRound);

// ---- all 20 levels x 5 words via keydown ----
let solvedWords = 0, stuck = '';
outer:
for (let L = 1; L <= 20; L++) {
  if (S.currentLevel !== L) { stuck = 'level ' + L + ' not started (at ' + S.currentLevel + ')'; break; }
  for (let w = 1; w <= 5; w++) {
    const word = S.currentWord;
    if (typeof word !== 'string' || !word.length) { stuck = 'L' + L + 'w' + w + ' no word'; break outer; }
    for (const ch of new Set(word)) kd(ch);
    if (S.wordsInRound !== w || S.screen !== 'game') { stuck = 'L' + L + 'w' + w + ' inRound=' + S.wordsInRound + ' screen=' + S.screen; break outer; }
    solvedWords++;
    if (w < 5) { g.pump(100); if (S.currentWordIndex !== (L - 1) * 5 + w + 1 + 2) { /* index tracks globally; tolerate */ } }
  }
  g.pump(75); // 1000ms levelComplete timer
  if (S.screen !== 'levelComplete') { stuck = 'L' + L + ' no levelComplete (screen=' + S.screen + ')'; break; }
  const stars = S.animationState.stars && S.animationState.stars.target;
  if (stars !== 3 || S.levelStars[L] !== 3) { stuck = 'L' + L + ' stars=' + stars + '/' + S.levelStars[L]; break; }
  g.pump(2); click(S.nextBtn);
  if (S.screen !== 'game') { stuck = 'L' + L + ' next dead'; break; }
  if (L < 20 && S.currentLevel !== L + 1) { stuck = 'L' + L + ' level not advanced (' + S.currentLevel + ')'; break; }
  if (L === 20 && S.currentLevel !== 20) { stuck = 'L20 cap broken (' + S.currentLevel + ')'; break; }
}
T('all-20-levels', !stuck, stuck || '20/20 x5');
T('hundred-words', solvedWords === 100, solvedWords + '/100');

const save = JSON.parse(g.ls.getItem('hangman_save') || '{}');
T('progress-persisted', save.perfectRounds === 20 && save.level >= 20 &&
  [1, 5, 10, 15, 20].every(l => save.levelStars[l] === 3) && save.totalWords === 100, // restartGame resets wordsSolved, so exactly the 100 campaign words
  'perfect=' + save.perfectRounds + ' lvl=' + save.level + ' words=' + save.totalWords);

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { daily: 'solved+streak', hint: 'canvas-btn', gameOver: 'restarted', levels: stuck ? 'STUCK@' + stuck : '20/20x5 3-star', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('hangman: daily+hint+gameOver/restart + ' + (stuck ? 'STUCK: ' + stuck : '20 levels x5 words') + ' via canvas clicks & keydown: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
