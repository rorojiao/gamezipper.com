#!/usr/bin/env node
/* trivia-crack engine verifier — real input paths only:
   canvas click spins, option buttons clicked as qOpts children, power-up buttons,
   crown overlay category buttons, daily buttons. Deterministic via sandbox Math.random
   queue (spin target / AI outcome); answers derived by matching qText.textContent
   against the QUESTIONS bank (the verifier knows the quiz bank, never the engine vars).
   Every AI turn is explicitly scripted (default rand 0.99 would land AI on the Crown
   segment and stall the turn on the challenge overlay). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note }); if (!ok) console.error('  FAIL: ' + name + (note ? ' — ' + note : '')); };
const S = 25;

const g = bootGame('trivia-crack', {
  inject: {
    anchor: 'function onSpinResult(idx){',
    exports: `window.__TC = {
      phase: () => state.phase, turn: () => state.isPlayerTurn,
      pc: () => state.playerCrowns, ac: () => state.aiCrowns,
      pu: () => state.pu, diff: () => difficulty,
      timeLeft: () => timeLeft, ds: () => dailyState,
      qbank: () => QUESTIONS, usedQ: () => state.usedQuestions };`,
  },
});
const E = (id) => g.sandbox.document.getElementById(id);
const st = () => g.call('window.__TC');
const wait = (expr, maxFrames) => { let n = 0; while (n < maxFrames && !g.call(expr)) { g.pump(S); n += S; } return g.call(expr); };
const deepBtns = (el) => { const out = []; const walk = (n) => (n.children || []).forEach(c => { if (String(c.tagName).toUpperCase() === 'BUTTON') out.push(c); walk(c); }); walk(el); return out; };

T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('tutorial-shown', !E('overlay').classList.contains('hidden'), 'overlay visible first visit');
E('btn-tutorial-ok').dispatch('click', {});
g.pump(2);
T('tutorial-dismissed', E('overlay').classList.contains('hidden') && g.sandbox.localStorage.getItem('tc_tutorial_done') === '1');

// quiz bank integrity
const bank = st().qbank();
const cats = Object.keys(bank);
T('bank-6cats', cats.length === 6, cats.join(','));
let bankOk = true, nQ = 0;
for (const c of cats) for (const q of bank[c]) {
  nQ++;
  if (!(Array.isArray(q.options) && q.options.length === 4) || !(q.answer >= 0 && q.answer <= 3) || typeof q.q !== 'string' || !q.q) bankOk = false;
}
T('bank-questions-valid', bankOk && nQ >= 200, nQ + ' questions');

// deterministic RNG: default 0.99 (AI wrong, last pool question); scripted queues below
const rngQ = [];
g.sandbox.Math.random = () => (rngQ.length ? rngQ.shift() : 0.99);
const spinTo = (idx) => { rngQ.push(idx / 7 + 0.001, 0.5, 0.5); E('game-canvas').dispatch('click', {}); };
// aiSpin consumes 3 (target,totalSpin,duration) + aiAnswerQuestion 2 (q,thinkTime) + 1 (isCorrect)
const aiTurn = (idx, correct) => { rngQ.push(idx / 7 + 0.001, 0.5, 0.5, 0.99, 0.99, correct ? 0.01 : 0.99); };

const answerFor = () => {
  const text = String(E('q-text').textContent).trim();
  for (const c of cats) { const q = bank[c].find(q => q.q === text); if (q) return q.answer; }
  return -1;
};
const optBtns = () => E('q-options').children.filter(c => c.classList.contains('option-btn'));
const answer = (i) => { optBtns()[i].dispatch('click', {}); };
const backToPlayer = () => wait('window.__TC.turn()===true && window.__TC.phase()==="spinning"', 2600);

// difficulty buttons: engine bound listeners to the querySelectorAll('.diff-btn') stubs;
// markup buttons carry data-diff — supply it on the stub the engine actually bound to.
const diffBtns = g.sandbox.document.querySelectorAll('.diff-btn');
diffBtns[0].dataset.diff = 'easy';
diffBtns[0].dispatch('click', {});
g.pump(1);
T('diff-select', st().diff() === 'easy', st().diff());
diffBtns[1].dataset.diff = 'medium';
diffBtns[1].dispatch('click', {});
g.pump(1);

// ---- VS Computer game ----
E('btn-play').dispatch('click', {});
g.pump(2);
T('game-start', st().phase() === 'spinning' && st().turn() === true, st().phase());
T('crowns-display', E('player-crowns').children.length === 6 && E('ai-crowns').children.length === 6);

// normal correct answer (Art) — no crown from a non-crown question
spinTo(0);
T('question-shown', wait('window.__TC.phase()==="question"', 300), st().phase());
T('question-ui', String(E('q-text').textContent).length > 5 && optBtns().length === 4 && !E('question-section').classList.contains('hidden'));
let ai = answerFor();
T('answer-derivable', ai >= 0, 'qText matched bank');
answer(ai);
T('correct-no-crown', yieldToAIrest(), 'streak++ then AI turn');
T('no-crown-from-plain', Object.values(st().pc()).every(v => !v), JSON.stringify(st().pc()));

// 50/50 removes exactly 2 wrong buttons, never the correct one (P1 regression)
spinTo(1);
wait('window.__TC.phase()==="question"', 300);
ai = answerFor();
E('pu-5050').dispatch('click', {});
g.pump(2);
const dis = optBtns().map((b, i) => b.classList.contains('disabled') ? i : -1).filter(i => i >= 0);
T('5050-two-wrong-removed', dis.length === 2 && !dis.includes(ai), 'disabled=' + dis + ' correct=' + ai);
T('5050-count', st().pu()['5050'] === 2);
E('pu-time').dispatch('click', {});
g.pump(2);
T('time-powerup', st().timeLeft() > 10, 'timeLeft=' + st().timeLeft().toFixed(1));
answer(ai);
T('after-5050-turn', yieldToAIrest());

// wrong answer path
spinTo(2);
wait('window.__TC.phase()==="question"', 300);
answer((answerFor() + 1) % 4);
T('wrong-to-ai', yieldToAIrest());

// timeout path (10s virtual, no answer)
spinTo(3);
wait('window.__TC.phase()==="question"', 300);
T('timeout-counted-wrong', yieldToAIrest(700), 'no answer for 10s virtual');

// skip power-up (counts as wrong; P2: phase must leave 'question' immediately)
spinTo(4);
wait('window.__TC.phase()==="question"', 300);
E('pu-skip').dispatch('click', {});
g.pump(2);
T('skip-phase-lock', st().phase() !== 'question' && st().pu().skip === 2, st().phase());
E('pu-skip').dispatch('click', {}); // second tap must be a no-op
T('skip-not-double', st().pu().skip === 2, 'double-tap re-entry');
aiTurn(0, false);
T('skip-to-ai', backToPlayer(), 'AI turn then back');

// helper defined after use via hoisting
function yieldToAIrest(maxQ) {
  const turned = wait('window.__TC.turn()===false', maxQ || 200);
  aiTurn(0, false);
  return turned && backToPlayer();
}

// ---- crown challenges: the only way to earn crowns ----
const earnCrown = () => {
  spinTo(6); // Crown segment
  wait('!document.getElementById("overlay").classList.contains("hidden")', 300);
  deepBtns(E('overlay-content'))[0].dispatch('click', {}); // first unearned category
  g.pump(2);
  wait('window.__TC.phase()==="question"', 300);
  answer(answerFor());
  // correct crown answer -> checkWin -> switchToAI takes an unscripted turn unless queued
  const mid = wait('window.__TC.phase()==="gameOver" || window.__TC.turn()===false', 2600);
  if (!mid) return false;
  if (g.call('window.__TC.phase()') === 'gameOver') return true; // 6/6 crowns
  aiTurn(0, false);
  return backToPlayer();
};
for (let i = 0; i < 6; i++) {
  earnCrown();
  const earned = Object.values(st().pc()).filter(Boolean).length;
  if (earned !== i + 1) { T('crown-' + (i + 1), false, 'earned=' + earned); break; }
}
T('crowns-all-6', Object.values(st().pc()).every(Boolean), JSON.stringify(st().pc()));
T('win-overlay', wait('window.__TC.phase()==="gameOver"', 400) && String(E('overlay-content').innerHTML).includes('You Win!'), 'player win endgame');
T('win-stats', (() => { const s = JSON.parse(g.sandbox.localStorage.getItem('tc_stats')); return s.gamesPlayed === 1 && s.gamesWon === 1 && s.streak === 1; })(), g.sandbox.localStorage.getItem('tc_stats'));

// play again
E('btn-play-again').dispatch('click', {});
g.pump(2);
T('play-again', st().phase() === 'spinning' && Object.values(st().pc()).every(v => !v) && st().pu()['5050'] === 3);

// ---- AI crown + AI win path ----
spinTo(0);
wait('window.__TC.phase()==="question"', 300);
answer((answerFor() + 1) % 4);
wait('window.__TC.turn()===false', 200);
aiTurn(6, true); // AI lands Crown, answers correctly
wait('!document.getElementById("overlay").classList.contains("hidden")', 2600);
const oc2 = deepBtns(E('overlay-content'));
T('ai-crown-overlay', oc2.length >= 1, oc2.length + ' category buttons');
oc2[0].dispatch('click', {});
T('ai-crown-earned', wait('window.__TC.ac()["' + cats[0] + '"]===true', 2600), JSON.stringify(st().ac()));
T('back-to-player-after-ai-crown', backToPlayer());

let aiAll = true;
for (let i = 0; i < 5; i++) {
  spinTo(0);
  wait('window.__TC.phase()==="question"', 300);
  answer((answerFor() + 1) % 4);
  wait('window.__TC.turn()===false', 200);
  aiTurn(6, true);
  wait('!document.getElementById("overlay").classList.contains("hidden")', 2600);
  const btns = deepBtns(E('overlay-content'));
  if (!btns.length) { aiAll = false; break; }
  // overlay lists categories the PLAYER lacks (engine design); the AI needs its own
  // first-missing category or it re-earns the same crown forever
  const ac0 = st().ac();
  const need = cats.find(c => !ac0[c]);
  const btn = btns.find(b => String(b.textContent).trim() === need) || btns[0];
  btn.dispatch('click', {});
  if (!wait('window.__TC.phase()==="gameOver" || (window.__TC.turn()===true && window.__TC.phase()==="spinning")', 2600)) { aiAll = false; break; }
  if (st().phase() === 'gameOver') break;
}
T('ai-crowns-all-6', Object.values(st().ac()).every(Boolean) && aiAll, JSON.stringify(st().ac()));
T('ai-win-overlay', st().phase() === 'gameOver' && String(E('overlay-content').innerHTML).includes('AI Wins!'));
T('ai-win-stats', (() => { const s = JSON.parse(g.sandbox.localStorage.getItem('tc_stats')); return s.gamesPlayed === 2 && s.gamesWon === 1 && s.streak === 0; })(), g.sandbox.localStorage.getItem('tc_stats'));

// quit-during-AI-turn guard: yield, leave to menu before AI acts
E('btn-play-again').dispatch('click', {}); g.pump(2);
spinTo(0); wait('window.__TC.phase()==="question"', 300);
answer((answerFor() + 1) % 4);
wait('window.__TC.turn()===false', 200);
E('btn-menu-back').dispatch('click', {});
g.pump(320); // let every pending AI timer fire
T('quit-no-zombie-ai', st().phase() === 'menu', st().phase());

// ---- Daily challenge (deterministic LCG shuffle) ----
E('btn-daily').dispatch('click', {});
g.pump(2);
T('daily-start', !E('daily-screen').classList.contains('hidden') && st().ds().questions.length === 10, st().ds().questions.length + ' questions');
let dailyOk = true;
for (let qi = 0; qi < 10; qi++) {
  const ds = st().ds();
  if (ds.current !== qi) { dailyOk = false; break; }
  const opts = E('daily-options').children.filter(c => c.classList.contains('option-btn'));
  if (opts.length !== 4) { dailyOk = false; break; }
  if (qi === 1) { g.pump(700); continue; } // Q2 times out (10s timer + 1s advance)
  const ans = ds.questions[qi].answer;
  opts[ans].dispatch('click', {});
  g.pump(80); // 1200ms advance to next question
}
T('daily-run', dailyOk, '10 questions, Q2 via timeout');
T('daily-score', st().ds().score === 9, 'score=' + st().ds().score + ' (9 correct + 1 timeout)');
T('daily-result', String(E('daily-result-title').textContent).includes('Excellent'), E('daily-result-title').textContent);
const st1 = JSON.parse(g.sandbox.localStorage.getItem('tc_stats'));
T('daily-persisted', Array.isArray(st1.dailyScores) && st1.dailyScores.some(d => d.score === 9 && d.total === 10), JSON.stringify(st1.dailyScores));

// stats screen reflects everything
E('daily-back').dispatch('click', {}); g.pump(1);
E('btn-stats').dispatch('click', {}); g.pump(1);
T('stats-screen', !E('stats-screen').classList.contains('hidden') && String(E('stats-grid').innerHTML).includes('2'));
T('stats-history', String(E('daily-history').innerHTML).includes('/10'));

const pass = results.filter(r => r.ok).length;
const fails = results.filter(r => !r.ok).map(r => r.name);
console.log('trivia-crack: spin->question->crown chain, power-ups, AI opponent, daily: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { fixes: 'P1 5050-removes-correct-answer, P2 skip-double-tap, P2 quit-zombie-AI, P2 daily-back-timer' } }));
process.exit(fails.length ? 1 : 0);
