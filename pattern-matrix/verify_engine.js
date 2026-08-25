#!/usr/bin/env node
/* pattern-matrix engine verifier — real input paths only: every interaction is a click/
   pointerdown on the element the engine bound (markup buttons via their compiled inline
   onclick, choice cards and level buttons via their addEventListener). The answer is
   derived INDEPENDENTLY from the shown items (period/step extrapolation over the engine
   palette, or row+col rule fit for matrix levels) — the verifier solves each puzzle,
   never reads correctIndex to play. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note: note === undefined ? '' : String(note) }); if (!ok) console.error('  FAIL: ' + name + (note !== undefined ? ' — ' + note : '')); };

const g = bootGame('pattern-matrix', {});
const E = (id) => g.sandbox.document.getElementById(id);
const st = () => g.call('state');
const COLORS = () => g.call('COLORS');
const SHAPES = () => g.call('SHAPES');
const t0 = Date.now();

// inline-onclick markup buttons live in the parsed body tree — walk its descendants
const findAll = (pred) => {
  const out = [];
  const w = (n) => { if (pred(n)) out.push(n); (n.children || []).forEach(w); };
  w(g.sandbox.document.body);
  return out;
};
const mbtn = (code, label) => findAll((n) => typeof n.onclick === 'function' && String(n.onclick).includes(code) && String(n.textContent).trim() === label)[0];

// ---- independent solver (mirrors the engine's itemsEqual tolerance) ----
const eq = (a, b) => !!a && !!b && a.shape === b.shape && a.color === b.color &&
  Math.abs((a.rotation || 0) - (b.rotation || 0)) <= 1 && Math.abs((a.size || 1) - (b.size || 1)) <= 0.05 &&
  (a.count || 1) === (b.count || 1) && Math.abs((a.offsetX || 0) - (b.offsetX || 0)) <= 0.01 && Math.abs((a.offsetY || 0) - (b.offsetY || 0)) <= 0.01;
const nextInSeq = (vals, mod) => { // periodic recurrence first, then constant difference
  const n = vals.length;
  for (let P = 1; P <= n - 1; P++) {
    let ok = true;
    for (let i = 0; i + P < n; i++) if (vals[i + P] !== vals[i]) { ok = false; break; }
    if (ok) return vals[n - P];
  }
  const d = mod ? (vals[1] - vals[0] + mod) % mod : vals[1] - vals[0];
  for (let i = 0; i + 1 < n; i++) {
    const dd = mod ? (vals[i + 1] - vals[i] + mod) % mod : vals[i + 1] - vals[i];
    if (dd !== d) return undefined;
  }
  return mod ? (vals[n - 1] + d) % mod : vals[n - 1] + d;
};
function deriveAnswer(p, level) {
  const its = p.items;
  if (its.some((i) => i.gridPos)) { // matrix: row+column rules, fit from shown cells
    const gs = its[0].gridPos[2];
    const L = 3 + Math.floor(level / 6);
    const cands = [];
    const colOk = its.every((i) => i.color === COLORS()[((i.gridPos[0] + i.gridPos[1])) % L]);
    if (colOk) cands.push({ shape: its[0].shape, color: COLORS()[(2 * (gs - 1)) % L], size: 1, rotation: 0, count: 1, filled: true });
    const shpOk = its.every((i) => i.shape === SHAPES()[(i.gridPos[0] * gs + i.gridPos[1]) % L]);
    if (shpOk) cands.push({ shape: SHAPES()[((gs - 1) * gs + (gs - 1)) % L], color: its[0].color, size: 1, rotation: 0, count: 1, filled: true });
    const rotOk = its.every((i) => i.rotation === (i.gridPos[0] * 90 + i.gridPos[1] * 45) % 360);
    if (rotOk) cands.push({ shape: its[0].shape, color: its[0].color, size: 1, rotation: ((gs - 1) * 90 + (gs - 1) * 45) % 360, count: 1, filled: true });
    return cands;
  }
  const out = { shape: its[0].shape, color: its[0].color, size: its[0].size, rotation: its[0].rotation, count: its[0].count, filled: true };
  const n = its.length;
  const ci = its.map((i) => COLORS().indexOf(i.color));
  const si = its.map((i) => SHAPES().indexOf(i.shape));
  const L = 3 + Math.floor(level / 6);
  if (new Set(ci).size > 1) { const nx = nextInSeq(ci, L); if (nx === undefined) return []; out.color = COLORS()[nx]; }
  if (new Set(si).size > 1) { const nx = nextInSeq(si, L); if (nx === undefined) return []; out.shape = SHAPES()[nx]; }
  if (new Set(its.map((i) => i.rotation)).size > 1) { const nx = nextInSeq(its.map((i) => i.rotation), 360); if (nx === undefined) return []; out.rotation = nx; }
  if (new Set(its.map((i) => i.size)).size > 1) { const nx = nextInSeq(its.map((i) => i.size)); if (nx === undefined) return []; out.size = nx; }
  if (new Set(its.map((i) => i.count)).size > 1) { const nx = nextInSeq(its.map((i) => i.count)); if (nx === undefined) return []; out.count = nx; }
  if (its[0].offsetX !== undefined) {
    const ox = nextInSeq(its.map((i) => i.offsetX)); const oy = nextInSeq(its.map((i) => i.offsetY));
    if (ox === undefined || oy === undefined) return [];
    out.offsetX = ox; out.offsetY = oy;
  }
  return [out];
}

const cards = () => E('choices-grid').children.filter((c) => c.classList.contains('choice-card'));
const tapCard = (i) => cards()[i].dispatch('pointerdown', {});
const lvlBtns = () => E('lvlContainer').children;

// ---- boot / tutorial / settings ----
T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('menu-shown', E('menu-screen').style.display === 'flex' && E('game-screen').style.display === 'none' && st().screen === 'menu');
T('tutorial-first-visit', E('tutorial-overlay').style.display === 'flex');
mbtn('closeTutorial', 'Got it!').dispatch('click', {});
g.pump(2);
T('tutorial-dismissed', E('tutorial-overlay').style.display === 'none' && g.sandbox.localStorage.getItem('pattern-matrix-tutorial-seen') === '1');
mbtn('showTutorial', 'How to Play').dispatch('click', {});
g.pump(1);
T('tutorial-reopens', E('tutorial-overlay').style.display === 'flex');
mbtn('closeTutorial', 'Got it!').dispatch('click', {});
g.pump(1);
E('sound-btn').dispatch('click', {});
E('sound-btn').dispatch('click', {});
g.pump(1);
T('sound-toggle-persisted', g.sandbox.localStorage.getItem('pattern-matrix-sound') === '1' && String(E('sound-btn').textContent).includes('ON'));
E('music-btn').dispatch('click', {});
E('music-btn').dispatch('click', {});
T('music-toggle-persisted', g.sandbox.localStorage.getItem('pattern-matrix-music') === '1' && String(E('music-btn').textContent).includes('ON'));

// ---- level select: locked levels inert, unlocked playable ----
mbtn('showLevelSelect', 'Level Select').dispatch('click', {});
g.pump(1);
T('level-select-open', st().screen === 'level-select' && E('level-select').style.display === 'block');
T('30-level-buttons', lvlBtns().length === 30, lvlBtns().length);
lvlBtns()[2].dispatch('pointerdown', {});
g.pump(2);
T('locked-level-ignored', st().screen === 'level-select' && st().currentLevel === 0, st().screen);
mbtn('closeLevelSelect', 'Back').dispatch('click', {});
g.pump(1);
T('back-to-menu', st().screen === 'menu');

// ---- game start via Continue ----
mbtn('startGame', 'Continue / New Game').dispatch('click', {});
g.pump(2);
T('level1-started', st().screen === 'game' && st().currentLevel === 0 && !st().answered, st().screen + ' lvl=' + st().currentLevel);
T('hud-level-1', String(E('hud-level').textContent) === '1' && String(E('hud-score').textContent) === '0');
T('4-choice-cards', cards().length === 4);

// solve-every-level helper: derive, assert unique, tap
let solvableAll = true;
const solveTap = () => {
  const p = st().currentPattern;
  const cands = deriveAnswer(p, st().currentLevel);
  if (cands.length !== 1 || !eq(cands[0], p.answer)) { solvableAll = false; return { ok: false, why: 'derivation mismatch (level ' + st().currentLevel + ')' }; }
  const hits = p.choices.filter((c) => eq(c, cands[0])).length;
  if (hits !== 1) { solvableAll = false; return { ok: false, why: hits + ' choices match the derived answer (ambiguous)' }; }
  tapCard(p.choices.findIndex((c) => eq(c, cands[0])));
  return { ok: true };
};

// ---- level 1: correct path + double-tap guard ----
{
  const r = solveTap();
  T('level1-solvable', r.ok, r.why);
  g.pump(2);
  const s = st();
  T('level1-correct', s.answered && s.score === 100 && s.streak === 1 && s.totalScore === 100, 'score=' + s.score + ' streak=' + s.streak);
  T('level1-card-marked', cards()[s.currentPattern.correctIndex].classList.contains('correct'));
  T('level1-msg', String(E('msg').textContent).includes('Correct! +100'), E('msg').textContent);
  tapCard((s.currentPattern.correctIndex + 1) % 4); // answered=true must block the second tap
  g.pump(2);
  T('double-tap-guarded', st().score === 100 && st().selectedChoice === s.currentPattern.correctIndex);
  g.pump(50); // 800ms -> level-complete modal
  T('level1-modal', E('modal-overlay').style.display === 'flex' && String(E('modal-title').textContent) === 'Correct!' &&
    String(E('modal-stars').textContent) === '★★★' && String(E('modal-score-text').textContent) === '+100 points');
  E('modal-next-btn').dispatch('click', {});
  g.pump(2);
  T('level2-started', st().currentLevel === 1 && !st().answered && st().unlockedLevel === 1);
}

// ---- level 2: hint path (2 wrong eliminated, -50, 2 stars) ----
{
  findAll((n) => typeof n.onclick === 'function' && String(n.onclick).includes('useHint'))[0].dispatch('click', {});
  g.pump(2);
  const s = st();
  const ci = s.currentPattern.correctIndex;
  const elims = s.eliminatedChoices;
  T('hint-eliminates-2-wrong', elims.length === 2 && elims.every((i) => i !== ci), JSON.stringify(elims) + ' correct=' + ci);
  T('hint-cards-marked', cards().filter((c) => c.classList.contains('eliminated')).length === 2);
  T('hint-flag', s.hintUsed && String(E('msg').textContent).includes('-50'));
  tapCard(elims[0]); // eliminated card must be inert
  g.pump(2);
  T('eliminated-tap-ignored', !st().answered && st().selectedChoice === -1);
  const r = solveTap();
  T('level2-solvable-after-hint', r.ok, r.why);
  g.pump(50);
  const s2 = st();
  T('level2-hint-score', s2.score === 100 + 1 * 20 - 50 && s2.totalScore === 100 + 70, 'score=' + s2.score + ' total=' + s2.totalScore);
  T('level2-modal-2stars', String(E('modal-stars').textContent) === '★★☆' && String(E('modal-score-text').textContent) === '+70 points');
  E('modal-next-btn').dispatch('click', {});
  g.pump(2);
}

// ---- level 3 (idx2): wrong path, retry regenerates, skip still unlocks ----
{
  const s = st();
  const ci = s.currentPattern.correctIndex;
  const wrong = (ci + 1) % 4;
  tapCard(wrong);
  g.pump(2);
  T('wrong-marked', st().answered && cards()[wrong].classList.contains('wrong') && cards()[ci].classList.contains('correct'));
  T('wrong-streak-reset', st().streak === 0 && st().score === 0);
  g.pump(90); // 1500ms -> modal
  T('wrong-modal', String(E('modal-title').textContent) === 'Not Quite...' && String(E('modal-stars').textContent) === '★☆☆' &&
    String(E('modal-next-btn').textContent) === 'Skip to Next');
  mbtn('retryLevel', 'Retry').dispatch('click', {});
  g.pump(2);
  T('retry-regenerates', st().currentLevel === 2 && !st().answered && !st().hintUsed && st().eliminatedChoices.length === 0 && E('modal-overlay').style.display === 'none' && cards().length === 4);
  // fail again, then Skip to Next
  const ci2 = st().currentPattern.correctIndex;
  tapCard((ci2 + 2) % 4);
  g.pump(90);
  E('modal-next-btn').dispatch('click', {});
  g.pump(2);
  T('skip-unlocks-next', st().currentLevel === 3 && st().unlockedLevel === 3, 'lvl=' + st().currentLevel + ' unlocked=' + st().unlockedLevel);
  T('fail-saved-1star', st().completedLevels[2] && st().completedLevels[2].stars === 1, JSON.stringify(st().completedLevels[2]));
}

// ---- levels 4..30 (idx 3..29): all correct via derived answers ----
let expTotal = st().totalScore, expBest = 0, runOk = true, lastStreak = st().streak;
for (let lvl = st().currentLevel; lvl < 30 && runOk; lvl++) {
  if (st().currentLevel !== lvl) { T('order-level-' + lvl, false, 'at ' + st().currentLevel); runOk = false; break; }
  const r = solveTap();
  if (!r.ok) { T('solvable-level-' + lvl, false, r.why); runOk = false; break; }
  g.pump(2);
  const earned = 100 + lastStreak * 20;
  const s = st();
  if (s.score !== earned || s.streak !== lastStreak + 1) { T('score-level-' + lvl, false, 'score=' + s.score + ' want ' + earned); runOk = false; break; }
  expTotal += earned; lastStreak = s.streak; expBest = Math.max(expBest, lastStreak);
  if (s.totalScore !== expTotal) { T('total-level-' + lvl, false, s.totalScore + ' vs ' + expTotal); runOk = false; break; }
  g.pump(50);
  const stars3 = String(E('modal-stars').textContent) === (lvl === 29 ? '★★★' : '★★★');
  if (!stars3 || String(E('modal-title').textContent) !== 'Correct!') { T('modal-level-' + lvl, false, E('modal-stars').textContent); runOk = false; break; }
  if (lvl < 29) { E('modal-next-btn').dispatch('click', {}); g.pump(2); }
}
T('all-levels-solvable', solvableAll && runOk);
T('final-streak-score', st().totalScore === expTotal && st().bestStreak === expBest, 'total=' + st().totalScore + '/' + expTotal + ' best=' + st().bestStreak + '/' + expBest);
T('finish-button', String(E('modal-next-btn').textContent) === 'Finish');
E('modal-next-btn').dispatch('click', {}); // level 30 Finish -> game complete
g.pump(2);
T('game-complete', String(E('modal-title').textContent) === 'Master Complete!' && String(E('modal-score-text').textContent) === 'Total Score: ' + expTotal &&
  String(E('modal-message').textContent).includes('all 30 levels'));
E('modal-next-btn').dispatch('click', {}); // Back to Menu
g.pump(2);
T('back-to-menu-final', st().screen === 'menu' && E('modal-overlay').style.display === 'none');
T('menu-progress-100', String(E('menu-progress-text').textContent) === '30 / 30 levels (100%)', E('menu-progress-text').textContent);
T('menu-total-score', String(E('menu-total-score').textContent) === String(expTotal));

// stars recorded: idx0=3, idx1=2 (hint), idx2=1 (failed), rest 3
{
  let starsOk = st().completedLevels[0].stars === 3 && st().completedLevels[1].stars === 2 && st().completedLevels[2].stars === 1;
  for (let i = 3; i < 30; i++) if (st().completedLevels[i].stars !== 3) starsOk = false;
  T('stars-recorded', starsOk && Object.keys(st().completedLevels).length === 30);
}
mbtn('showLevelSelect', 'Level Select').dispatch('click', {});
g.pump(1);
T('all-unlocked', lvlBtns().every((b) => !b.classList.contains('locked')) && lvlBtns()[29].classList.contains('completed')); // completed outranks current in the engine's class chain
T('stars-rendered', String(lvlBtns()[1].innerHTML).includes('★★') && String(lvlBtns()[2].innerHTML).includes('★<'));
mbtn('closeLevelSelect', 'Back').dispatch('click', {});
g.pump(1);

// ---- persistence round-trip ----
const save = JSON.parse(g.sandbox.localStorage.getItem('pattern-matrix-save'));
T('save-structure', save.version === 1 && save.unlockedLevel === 29 && save.totalScore === expTotal && Object.keys(save.completedLevels).length === 30);
{
  const g2 = bootGame('pattern-matrix', { seedLS: Object.fromEntries(Object.entries(g.sandbox.localStorage._m)) });
  g2.pump(1);
  T('reload-progress', String(g2.sandbox.document.getElementById('menu-progress-text').textContent) === '30 / 30 levels (100%)' &&
    g2.call('state.unlockedLevel') === 29 && g2.call('state.totalScore') === expTotal && g2.call('state.bestStreak') === expBest);
  T('reload-sound-setting', String(g2.sandbox.document.getElementById('sound-btn').textContent).includes('ON'));
  g2.sandbox.document.getElementById('menu-total-score'); // settings loaded at init
  // reset progress (confirm() -> true in sandbox)
  const resetBtn = (() => { const out = []; const w = (n) => { if (typeof n.onclick === 'function' && String(n.onclick).includes('resetProgress')) out.push(n); (n.children || []).forEach(w); }; w(g2.sandbox.document.body); return out[0]; })();
  resetBtn.dispatch('click', {});
  g2.pump(1);
  T('reset-progress', g2.sandbox.localStorage.getItem('pattern-matrix-save') === null && g2.call('state.unlockedLevel') === 0 &&
    String(g2.sandbox.document.getElementById('menu-progress-text').textContent).includes('0 / 30'));
}

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok).map((r) => r.name);
console.log('pattern-matrix: 30 levels solved by independent rule derivation + hint/retry/skip/persistence: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { durS: ((Date.now() - t0) / 1000).toFixed(1), harness: 'added inline-onclick compilation (markup handlers)' } }));
process.exit(fails.length ? 1 : 0);
