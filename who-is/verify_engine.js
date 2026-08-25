#!/usr/bin/env node
/* who-is verifier — 50 tap-the-answer detective levels (type A quiz).
 * Everything runs through the REAL input path: menu buttons carry inline
 * onclick (harness compiles them), gameplay is canvas pointerdown taps at
 * character/object coordinates -> the engine's own checkAnswer/revealObject
 * -> onCorrectAnswer (its own win: complete-modal + saveProgress) -> the
 * real nextLevelBtn chains all 50 levels. The bot "solves" levels by reading
 * LEVELS data (the answers are fixed puzzle data, not skill).
 * Engine bugs fixed first:
 *  P0 hit-test returned the FIRST box containing the tap; on levels 21, 31,
 *     33, 36 and 47 the answer object is drawn on top of a larger earlier box
 *     (Reflection inside the Window, Hidden Will inside the clock, Broken
 *     glass inside the Victim's box, Hidden Print on the hook, Ceiling hatch
 *     inside Walls), so the answer could never be tapped — 5 of 50 levels
 *     unwinnable. Now the smallest containing box (the specific on-top
 *     target) wins; checkAnswer itself is untouched.
 *  P1 useHint read lvl.hints but the LEVELS data declares `hint` (singular)
 *     — TypeError on all 50 levels, hint button silently dead game-wide.
 *  P2 LEVELS_PER_CHAPTER was 5 while chapters hold 10 levels (startFromChapter
 *     maps chapter n to level (n-1)*10+1) — the Level Select rendered only 25
 *     of 50 buttons, so levels 26-50 were unreachable from that screen.
 * Regression coverage: the chapter-button crash fix documented in
 * _optimization/evidence/who-is/crash-fix.md (startFromChapter(2) must land
 * on Level 11, not crash on LEVELS[51]).
 * Harness note: the 7 static menu buttons sit 4 divs deep in static markup,
 * which the harness's markup parser truncates (known limitation, documented
 * in harness-lib.js itself), so their inline onclicks never compile. The two
 * menu navigations call the exact functions those onclicks invoke
 * (startFromChapter / showLevelSelect); every dynamic button the engine
 * creates (all 50 level-select buttons, with real onclick functions) and
 * every canvas tap goes through real element clicks / pointer events. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('who-is', { inject: {
  anchor: 'function startFromChapter(chapter) {',
  exports: `globalThis.__WI = {
    gs: () => gameState, lv: () => currentLevel, nlev: () => LEVELS.length,
    data: (i) => LEVELS[i - 1],
    cwv: () => [cw, ch], moves: () => moves, hints: () => hintsLeft, coins: () => coins,
    done: () => Object.keys(completedLevels).length,
    save: () => { try { return JSON.parse(localStorage.getItem('whoIs_progress')); } catch (e) { return null; } },
    txt: (id) => document.getElementById(id).textContent,
    vis: (id) => document.getElementById(id).classList.contains('show'),
    disp: (id) => document.getElementById(id).style.display,
    nd: (sel) => document.querySelectorAll(sel).length,
    mb: (i) => document.querySelectorAll('.menu-btn')[i],
    lb: (i) => document.querySelectorAll('.level-btn')[i],
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('menu-renders', call('__WI.gs()') === 'menu' && /Progress:/.test(call("__WI.txt('menu-stats')")), 'gs=' + call('__WI.gs()'));

// ---- level data sanity: 50 levels, each with exactly one answer ----
const N = call('__WI.nlev()');
let answerless = 0, multiAnswer = 0, objLevels = [];
for (let i = 1; i <= N; i++) {
  const lvl = call('__WI.data(' + i + ')');
  const ca = lvl.chars.filter(c => c.isAnswer).length;
  const oa = (lvl.objects || []).filter(o => o.isAnswer).length;
  if (ca + oa === 0) answerless++;
  if (ca + oa > 1) multiAnswer++;
  if (oa > 0) objLevels.push(i);
}
T('data-50-winnable', N === 50 && answerless === 0 && multiAnswer === 0,
  'n=' + N + ' no-answer=' + answerless + ' multi=' + multiAnswer);

// ---- crash-fix regression: Chapter 2 loads Level 11 (was: LEVELS[51] crash) ----
g.els['gameCanvas']; // canvas exists
call('startFromChapter(2)'); g.pump(3); // == the Chapter 2 button's inline onclick
T('chapter2-crashfix', call('__WI.gs()') === 'playing' && call('__WI.lv()') === 11 &&
  call("__WI.txt('levelCounter')") === 'Level 11/50',
  'gs=' + call('__WI.gs()') + ' lv=' + call('__WI.lv()') + ' ' + call("__WI.txt('levelCounter')"));

// ---- level select shows all 50 after the P2 fix ----
call('showLevelSelect()'); g.pump(2); // == the Level Select button's inline onclick
const nBtns = call("__WI.nd('.level-btn')");
const mechLvl = (() => { // a char-answer level for the mechanics section
  for (let i = 1; i <= N; i++) { const l = call('__WI.data(' + i + ')');
    if (l.chars.length >= 2 && l.chars.filter(c => c.isAnswer).length === 1 &&
      (l.objects || []).filter(o => o.isAnswer).length === 0) return i; }
  return 1;
})();
T('level-select-50', call('__WI.gs()') === 'levelSelect' && nBtns === 50,
  'gs=' + call('__WI.gs()') + ' buttons=' + nBtns);
call('__WI.lb(25).click()'); g.pump(2); // button #26 = level 26 (unreachable before the fix)
T('level26-plays', call('__WI.gs()') === 'playing' && call('__WI.lv()') === 26, 'gs=' + call('__WI.gs()') + ' lv=' + call('__WI.lv()'));

// ---- real canvas taps: host mirror of handlePointerDown's hit-test ----
// (chars in order, then objects in order — a tap point inside an EARLIER box
// selects that earlier char/object, so pick a point that hits the target)
const RECT = g.els['gameCanvas'].getBoundingClientRect();
const [CW, CH] = call('__WI.cwv()');
function boxes(lvl) {
  const chars = lvl.chars.map(c => ({
    x0: c.x * CW - c.w * CW / 2, x1: c.x * CW + c.w * CW / 2,
    y0: c.y * CH - c.h * CH * 0.4, y1: c.y * CH + c.h * CH * 0.6 }));
  const objs = (lvl.objects || []).map(o => ({
    x0: o.x * CW - o.w * CW / 2, x1: o.x * CW + o.w * CW / 2,
    y0: o.y * CH - o.h * CH / 2, y1: o.y * CH + o.h * CH / 2 }));
  const hit = (x, y) => { // FIX(P0) mirror: smallest containing box wins
    let best = null;
    for (let i = 0; i < chars.length; i++) { const b = chars[i]; if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) { const a = (b.x1 - b.x0) * (b.y1 - b.y0); if (!best || a < best.a) best = { t: 'c', i, a }; } }
    for (let i = 0; i < objs.length; i++) { const b = objs[i]; if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) { const a = (b.x1 - b.x0) * (b.y1 - b.y0); if (!best || a < best.a) best = { t: 'o', i, a }; } }
    return best;
  };
  return { chars, objs, hit };
}
function pickPoint(lvl, type, idx) { // jittered-grid point that hits ONLY the target
  const B = boxes(lvl), tgt = type === 'c' ? B.chars[idx] : B.objs[idx];
  for (let gy = 1; gy <= 7; gy++) for (let gx = 1; gx <= 11; gx++) {
    const x = tgt.x0 + (tgt.x1 - tgt.x0) * gx / 12, y = tgt.y0 + (tgt.y1 - tgt.y0) * gy / 8;
    const h = B.hit(x, y);
    if (h && h.t === type && h.i === idx) return [x, y];
  }
  return null; // target fully shadowed by earlier boxes — engine-geometry bug
}
function tap(x, y) {
  g.els['gameCanvas'].dispatch('pointerdown', {
    clientX: RECT.left + x, clientY: RECT.top + y, preventDefault() {},
  }); g.pump(2);
}
function answerOf(lvl) { // { type, idx, point } for the level's single isAnswer
  const ci = lvl.chars.findIndex(c => c.isAnswer);
  const oi = (lvl.objects || []).findIndex(o => o.isAnswer);
  const type = ci >= 0 ? 'c' : 'o', idx = ci >= 0 ? ci : oi;
  return { type, idx, point: pickPoint(lvl, type, idx) };
}

// ---- object-answer path first (fresh session, no leftover modal): ----
// revealObject -> 600ms timer -> win, entered via REAL level-select buttons
const objLvl = objLevels[0];
g.els['backBtn'].click(); g.pump(1); g.call('showLevelSelect()'); g.pump(2);
call('__WI.lb(' + (objLvl - 1) + ').click()'); g.pump(2);
const lvlO = call('__WI.data(' + objLvl + ')');
const oAns = answerOf(lvlO);
tap(oAns.point[0], oAns.point[1]);
const preModal = call("__WI.vis('complete-modal')");
g.pump(45); // run the 600ms setTimeout chain
T('object-answer-wins', preModal === false && call("__WI.vis('complete-modal')") === true &&
  call('__WI.lv()') === objLvl && call('__WI.done()') === 1,
  'pre=' + preModal + ' modal=' + call("__WI.vis('complete-modal')") + ' lv=' + call('__WI.lv()'));
// hop to a char-answer level through the real Next Case + level-select buttons
g.els['nextLevelBtn'].click(); g.pump(2);
g.els['backBtn'].click(); g.pump(1); g.call('showLevelSelect()'); g.pump(2);
call('__WI.lb(' + (mechLvl - 1) + ').click()'); g.pump(2);

// ---- mechanics on a char-answer level ----
const lvlM = call('__WI.data(' + mechLvl + ')');
const nonAns = lvlM.chars.findIndex(c => !c.isAnswer);
const pWrong = pickPoint(lvlM, 'c', nonAns);
tap(pWrong[0], pWrong[1]);
T('char-statement-reveals', /: /.test(call("__WI.txt('clue-text')")) && call('__WI.moves()') === 1,
  'clue="' + call("__WI.txt('clue-text')").slice(0, 30) + '" moves=' + call('__WI.moves()'));
T('wrong-answer-modal', call("__WI.vis('wrong-modal')") === true &&
  /not the answer/.test(call("__WI.txt('wrong-subtitle')")), 'vis=' + call("__WI.vis('wrong-modal')"));
g.call('closeWrong()'); g.pump(1); // == the Continue button's inline onclick (button itself is past the harness's static-markup truncation)
T('close-wrong-continues', call("__WI.vis('wrong-modal')") === false, 'still shown');
g.els['hintBtn'].click(); g.pump(1);
T('hint-works', /^HINT: /.test(call("__WI.txt('clue-text')")) && call('__WI.hints()') === 2,
  'hints=' + call('__WI.hints()') + ' "' + call("__WI.txt('clue-text')").slice(0, 18) + '"');

// ---- win a level through the engine's own checkAnswer ----
const coins0 = call('__WI.coins()');
const ansM = answerOf(lvlM);
tap(ansM.point[0], ansM.point[1]); g.pump(4);
T('win-own-engine', call("__WI.vis('complete-modal')") === true && call('__WI.done()') === 2 &&
  call('__WI.coins()') > coins0,
  'modal=' + call("__WI.vis('complete-modal')") + ' done=' + call('__WI.done()') +
  ' coins ' + coins0 + '->' + call('__WI.coins()'));
const svM = call('__WI.save()');
T('save-recorded', !!(svM && svM.completedLevels[String(mechLvl)] && svM.coins > 0),
  'save=' + JSON.stringify(svM && svM.completedLevels));

// ---- chain all 50 levels via the real nextLevelBtn ----
// restart cleanly from level 1, then tap answers + click Next 50 times
g.els['backBtn'].click(); g.pump(2); // goToMenu
call('localStorage.removeItem("whoIs_progress"); loadProgress(); coins = 0; completedLevels = {}; levelStars = {};');
call('showLevelSelect();'); g.pump(2); // == the Level Select button's inline onclick
call('__WI.lb(0).click()'); g.pump(2); // REAL level-1 button (engine-assigned onclick)
let chained = 0, chainErr = '';
const tAll = Date.now();
for (let lv = 1; lv <= 50; lv++) {
  if (call('__WI.lv()') !== lv) { chainErr = 'off-track@' + lv + '(at ' + call('__WI.lv()') + ')'; break; }
  const lvl = call('__WI.data(' + lv + ')');
  const ans = answerOf(lvl);
  if (!ans.point) { chainErr = 'answer-shadowed@' + lv; break; } // no tappable point hits the answer
  tap(ans.point[0], ans.point[1]);
  if (ans.type === 'o') g.pump(45); // object answers win via a 600ms setTimeout
  g.pump(4);
  if (call("__WI.vis('complete-modal')") !== true) { chainErr = 'no-win@' + lv; break; }
  chained++;
  if (lv < 50) { g.els['nextLevelBtn'].click(); g.pump(3); }
}
T('chain-50-levels', chainErr === '' && chained === 50 && call('__WI.done()') === 50,
  chained + '/50 ' + chainErr);
T('level50-next-hidden', call("__WI.disp('nextLevelBtn')") === 'none', 'disp=' + call("__WI.disp('nextLevelBtn')"));
g.els['nextLevelBtn'].click(); g.pump(2);
T('after50-goes-menu', call('__WI.gs()') === 'menu' && call("__WI.txt('menu-stats')").indexOf('50/50') >= 0,
  'gs=' + call('__WI.gs()') + ' "' + call("__WI.txt('menu-stats')").slice(0, 34) + '"');
const svF = call('__WI.save()');
T('save-persists-50', !!(svF && Object.keys(svF.completedLevels).length === 50 &&
  Object.keys(svF.levelStars).length === 50 && svF.coins > 0),
  'done=' + (svF ? Object.keys(svF.completedLevels).length : 0) +
  ' stars=' + (svF ? Object.keys(svF.levelStars).length : 0) + ' coins=' + (svF ? svF.coins : 0));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: chained + '/50', objLevel: objLvl, secs: Math.round((Date.now() - tAll) / 1000),
    notes: chainErr ? chainErr : 'P2 fixed: level select now renders all 50 (was 25); crash-fix regression verified; 50/50 won via real taps through engine checkAnswer/revealObject' } };
console.log('who-is: ' + chained + '/50 levels via real canvas taps -> engine onCorrectAnswer: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
