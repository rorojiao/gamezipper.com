#!/usr/bin/env node
/* impossible-quiz engine verifier — real input paths only: answer buttons are clicked
   as #answers children, click-targets as .click-target children (by dataset.id),
   escape answers as .answer-btn children (by textContent). Engine debounces taps by
   Date.now(); the harness Date is a virtual pump clock, so tap spacing is virtual:
   >=350ms of pump is primed before each game's first tap (resetS zeroes lastClick). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note }); if (!ok) console.error('  FAIL: ' + name + (note ? ' — ' + note : '')); };

const g = bootGame('impossible-quiz', {
  inject: { anchor: 'function showQuestion(){', exports: 'window.__IQ = { S: () => S, Q: () => Q }' },
});
const E = (id) => g.sandbox.document.getElementById(id);
const st = () => g.call('window.__IQ');
const S = () => st().S();
// engine debounces taps by Date.now(); harness Date is a VIRTUAL pump clock, so spacing
// is virtual too — prime 350ms of pump before each game's first tap (resetS zeroes lastClick)
const tap = (el) => { el.dispatch('click', { stopPropagation() {} }); };
const primeDebounce = () => g.pump(21);

T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));

// question bank integrity
const Q = st().Q();
T('bank-65', Q.length === 65, String(Q.length));
let bankOk = true;
Q.forEach((q, i) => {
  const types = ['mc', 'click', 'escape', 'color'];
  if (!types.includes(q.type)) bankOk = false;
  if (q.type === 'mc' || q.type === 'color' || q.type === 'escape') {
    if (!(Array.isArray(q.a) && q.a.length === 4) || !(q.c >= 0 && q.c <= 3)) bankOk = false;
  }
  if (q.type === 'click' && !(q.targets && q.targets.some(t => t.id === q.clickId))) bankOk = false;
});
T('bank-structure', bankOk, 'types/answers/clickIds valid');

// answer dispatch per type; returns true when the tap landed
const answerQ = (wantCorrect) => {
  const qi = S().qi;
  const q = Q[qi];
  if (q.type === 'click') {
    const zone = E('special-content').children.find(c => c.classList.contains('click-zone'));
    if (!zone || !zone.children.length) return false;
    const t = zone.children.find(c => c.dataset && ((c.dataset.id === q.clickId) === wantCorrect));
    if (!t) return false;
    tap(t);
    return true;
  }
  // mc / color -> #answers buttons; escape -> .answer-btn divs in special-content
  let btns = E('answers').children.filter(c => c.classList.contains('answer-btn'));
  if (!btns.length) {
    const zone = E('special-content').children.find(c => c.classList.contains('click-zone'));
    btns = zone ? zone.children.filter(c => c.classList.contains('answer-btn')) : [];
    if (wantCorrect) { const hit = btns.find(b => String(b.textContent) === q.a[q.c]); btns = hit ? btns.map(b => b) : btns; if (hit) { tap(hit); return true; } return false; }
  }
  if (!btns.length) return false;
  const idx = wantCorrect ? q.c : (q.c + 1) % 4;
  tap(btns[idx]);
  return true;
};

// ---- Game 1: three wrong answers -> game over, best saved ----
E('play-btn').dispatch('click', {});
g.pump(2); primeDebounce();
T('game1-start', !E('question-screen').classList.contains('hidden') && String(E('q-counter').textContent) === '1/65', E('q-counter').textContent);
T('game1-lives', E('lives').children.length === 3);
for (let i = 0; i < 3; i++) {
  if (!answerQ(false)) { T('game1-wrong-' + (i + 1), false, 'no button'); break; }
  g.pump(70); // 1000ms wrong-advance + possible 800ms gameOver
}
T('game1-gameover', !E('gameover-screen').classList.contains('hidden'), 'after 3 wrong');
T('game1-stats', String(E('stat-answered').textContent) === '0' && String(E('final-score').textContent) === '0');
T('game1-best-saved', String(E('go-best').textContent).includes('Best Score'), E('go-best').textContent);
T('game1-storage', (() => { const sv = JSON.parse(g.sandbox.localStorage.getItem('impossibleQuiz_v1')); return sv && sv.v === 1; })());

// ---- Game 2: skips, lives, bomb expiry ----
E('retry-btn').dispatch('click', {});
g.pump(2); primeDebounce();
let expScore = 0, expStreak = 0;
const answerCorrect = () => {
  const s = S();
  const q = Q[s.qi];
  const bonus = (q.bomb && s.bombLeft) ? Math.floor(s.bombLeft * 2) : 0;
  expScore += 10 + expStreak * 2 + bonus;
  expStreak++;
  if (!answerQ(true)) { T('g2-correct-q' + (s.qi + 1), false, 'no button'); return false; }
  g.pump(45);
  return true;
};
for (let i = 0; i < 10; i++) if (!answerCorrect()) break;
T('g2-skip-earned', String(E('skip-btn').textContent) === 'Skip (1)' && E('skip-btn').classList.contains('active'), E('skip-btn').textContent);
T('g2-score-display', String(E('score-display').textContent) === String(expScore), 'score ' + E('score-display').textContent + ' vs ' + expScore);
// skip Q11
E('skip-btn').dispatch('click', {});
g.pump(5);
T('g2-skip-used', S().qi === 11 && String(E('skip-btn').textContent) === 'Skip (0)' && !E('skip-btn').classList.contains('active'), 'qi=' + S().qi);
E('skip-btn').dispatch('click', {}); // no skips left -> no-op
g.pump(2);
T('g2-skip-noop', S().qi === 11);
// wrong Q12 -> 2 lives
answerQ(false); expStreak = 0;
g.pump(70);
T('g2-life-lost', S().lives === 2, 'lives=' + S().lives);
T('g2-lives-render', E('lives').children.filter(c => c.classList.contains('lost')).length === 1);
// Q13..Q22 correct (10 more)
for (let i = 0; i < 10; i++) if (!answerCorrect()) break;
T('g2-skip-earned-2', String(E('skip-btn').textContent) === 'Skip (1)', E('skip-btn').textContent);
// Q23 (idx22) is a bomb: let it expire -> life lost, question advanced
let qiBefore = S().qi;
g.pump(650); // 10s virtual
T('g2-bomb-expiry', S().lives === 1 && S().qi === qiBefore + 1, 'lives=' + S().lives + ' qi=' + S().qi + ' was ' + qiBefore);
T('g2-bomb-hidden', E('bomb-timer').classList.contains('hidden') || String(E('bomb-timer').textContent) === 'BOMB 10');
// skip again (avail back to 1), then one wrong -> game over
E('skip-btn').dispatch('click', {});
g.pump(5);
T('g2-skip-2nd', S().skipUsed === 2);
answerQ(false);
g.pump(70);
T('g2-gameover', !E('gameover-screen').classList.contains('hidden'));
T('g2-final', String(E('stat-answered').textContent) === '20' && String(E('final-score').textContent) === String(expScore), 'answered=' + E('stat-answered').textContent + ' score=' + E('final-score').textContent + ' vs ' + expScore);
T('g2-best-updated', JSON.parse(g.sandbox.localStorage.getItem('impossibleQuiz_v1')).best === expScore);

// ---- Game 3: perfect 65/65 run -> victory ----
E('retry-btn').dispatch('click', {});
g.pump(2); primeDebounce();
expScore = 0; expStreak = 0;
const t0 = Date.now();
let runOk = true;
for (let i = 0; i < 65; i++) {
  const s = S();
  if (s.qi !== i) { T('g3-order-q' + (i + 1), false, 'qi=' + s.qi); runOk = false; break; }
  const q = Q[i];
  const bonus = (q.bomb && s.bombLeft) ? Math.floor(s.bombLeft * 2) : 0;
  expScore += 10 + expStreak * 2 + bonus;
  expStreak++;
  if (!answerQ(true)) { T('g3-answer-q' + (i + 1), false, q.type + ' no target'); runOk = false; break; }
  g.pump(45);
}
T('g3-all-answered', runOk && S().qi === 65, 'qi=' + S().qi);
g.pump(5);
T('g3-victory', !E('victory-screen').classList.contains('hidden'), 'victory screen');
T('g3-v-stats', String(E('v-answered').textContent) === '65' && String(E('v-streak').textContent) === '65', E('v-answered').textContent + '/' + E('v-streak').textContent);
T('g3-v-score', String(E('v-score').textContent) === String(expScore), E('v-score').textContent + ' vs ' + expScore);
T('g3-best-final', JSON.parse(g.sandbox.localStorage.getItem('impossibleQuiz_v1')).best === expScore);

// play again from victory
E('replay-btn').dispatch('click', {});
g.pump(2);
T('g3-replay', !E('question-screen').classList.contains('hidden') && S().lives === 3 && S().score === 0);

const pass = results.filter(r => r.ok).length;
const fails = results.filter(r => !r.ok).map(r => r.name);
console.log('impossible-quiz: 3 full games (gameover / skip+bomb / perfect 65) via real taps: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { durS: ((Date.now() - t0) / 1000).toFixed(1), fixes: 'P1 bomb-expiry never advanced S.qi (same bomb re-armed forever, 1 life/10s death spiral)' } }));
process.exit(fails.length ? 1 : 0);
