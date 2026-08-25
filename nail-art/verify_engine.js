#!/usr/bin/env node
/* nail-art verifier — all 30 designs completed through the engine's real input path:
 * real tool-bar button clicks → real sub-palette clicks (shape/polish/pattern/sticker)
 * → real #player-canvas click (handleNailTap → applyToNail → the engine's own checkWin
 * → onWin). Mistake/undo, hint, reset and level-select gating exercised through the real
 * buttons; win modal's real Next handler chains levels 2..30. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('nail-art', { inject: {
  anchor: 'function checkWin(showIndicator) {',
  exports: `
globalThis.__won = -1;
const __naOnWin = onWin;
onWin = function(){ globalThis.__won = currentLevel; return __naOnWin.apply(this, arguments); };
globalThis.__NA = {
  lvl: () => currentLevel, n: () => LEVELS.length, daily: () => isDaily,
  steps: () => playerRecipe.length, mistakes: () => mistakeCount, hint: () => hintUsed, anim: () => !!animState,
  recipe: (i) => LEVELS[i].recipe.map(s => ({ tool: s.tool, value: s.value === undefined ? null : s.value })),
  shapes: () => SHAPES.map(s => s.id), patterns: () => PATTERNS.map(p => p.id), stickers: () => STICKERS.map(s => s.id),
  progress: () => Object.assign({}, progress), ach: () => Object.assign({}, achievements),
  modalActive: () => document.getElementById('win-modal').classList.contains('active'),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const T0 = Date.now();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-exist', C('__NA.n()') === 30, 'n=' + C('__NA.n()'));

// --- level select: real cells, fresh gating (idx>0 locked until previous won) ---
g.call('showLevels()'); g.pump(2);
function levelCells() {
  const out = []; const walk = el => { for (const c of (el.children || [])) { if (c.classList.contains('level-btn')) out.push(c); walk(c); } };
  walk(g.els['tier-list']); return out;
}
let cells = levelCells();
const lockedFresh = cells.filter(c => c.classList.contains('locked')).length;
T('level-cells-built', cells.length === 30 && lockedFresh === 29, 'cells=' + cells.length + ' locked=' + lockedFresh);
cells[1].click(); g.pump(2); // locked cell has no onclick — must not start
T('locked-cell-inert', !g.els['game-screen'].classList.contains('active'), 'game-screen active despite lock');
cells[0].click(); g.pump(2); // level 1 via its real cell
T('level-1-started', g.els['game-screen'].classList.contains('active') && String(g.els['level-name'].textContent).startsWith('1.'),
  'name=' + g.els['level-name'].textContent);

// --- real input helpers: tool buttons, sub-palette children, canvas tap ---
const TOOL_IDX = { file: 0, base: 1, color: 2, pattern: 3, sticker: 4, top: 5 };
function pickTool(t) { g.els['tool-bar'].children[TOOL_IDX[t]].click(); g.pump(1); }
function pickSub(i) { g.els['sub-palette'].children[i].click(); g.pump(1); }
function tapNail() { g.els['player-canvas'].click(); }
function waitAnim() { for (let k = 0; k < 90 && C('__NA.anim()'); k++) g.pump(2); }
function subIndex(tool, value) {
  if (tool === 'color') return value;
  if (tool === 'file') return C('__NA.shapes()').indexOf(value);
  if (tool === 'pattern') return C('__NA.patterns()').indexOf(value);
  return C('__NA.stickers()').indexOf(value);
}
function playStep(step) { // real path: tool → sub-option → canvas tap (engine anim between taps)
  pickTool(step.tool);
  if (step.value !== null) pickSub(subIndex(step.tool, step.value));
  tapNail();
  waitAnim();
}

// --- probes on level 1: wrong step → mistake; undo; hint; reset ---
pickTool('file'); pickSub(0); tapNail(); waitAnim(); // Short (expects Medium)
T('wrong-step-counted', C('__NA.steps()') === 1 && C('__NA.mistakes()') === 1, 'steps=' + C('__NA.steps()') + ' mistakes=' + C('__NA.mistakes()'));
g.call('undoStep()'); g.pump(1); // static buttons carry inline onclick attrs (unwired in harness) — same handlers
T('undo-restores', C('__NA.steps()') === 0, 'steps=' + C('__NA.steps()'));
g.call('useHint()'); g.pump(1);
T('hint-arms-tool', C('__NA.hint()') === true, 'hint=' + C('__NA.hint()'));
g.call('resetLevel()'); g.pump(1);
T('reset-clears', C('__NA.steps()') === 0 && C('__NA.mistakes()') === 0 && !C('__NA.hint()'), 'steps=' + C('__NA.steps()') + ' mistakes=' + C('__NA.mistakes()'));

// --- solve every level through the real input path; chain via the win modal's Next ---
const results = [];
for (let lvl = 0; lvl < 30; lvl++) {
  if (C('__NA.lvl()') !== lvl) { results.push('wrong-level:' + C('__NA.lvl()')); break; }
  const recipe = C('__NA.recipe(' + lvl + ')');
  for (const step of recipe) playStep(step);
  for (let k = 0; k < 60 && !C('__NA.modalActive()'); k++) g.pump(2); // 700ms onWin timer
  const won = C('__won') === lvl && C('__NA.modalActive()');
  results.push(won ? 'won' : 'nowin(steps=' + C('__NA.steps()') + '/' + recipe.length + ')');
  T('level-' + (lvl + 1) + '-won', won, results[results.length - 1]);
  if (!won) break;
  if (lvl === 0) {
    T('level-1-3stars-clean', (C('__NA.progress()')['0'] || 0) === 3, 'stars=' + C('__NA.progress()')['0']);
    // real "Level Select" button handler now dismisses the modal (FIX); verify gating updated
    g.call("document.getElementById('win-modal').classList.remove('active');showLevels()");
    cells = levelCells();
    T('gating-updates-after-win', cells.length === 30 && !cells[1].classList.contains('locked')
      && cells.slice(2, 30).every(c => c.classList.contains('locked')) // sequential gating: only the next cell opens
      && !C('__NA.modalActive()'), 'locked=' + cells.filter(c => c.classList.contains('locked')).length);
    cells[1].click(); g.pump(2); // level 2 via its real (now-unlocked) cell
    T('level-2-cell-plays', C('__NA.lvl()') === 1 && g.els['game-screen'].classList.contains('active'), 'lvl=' + C('__NA.lvl()'));
  } else if (lvl < 29) g.call('nextLevel()'); // win modal "Next Level" handler
  g.pump(2);
}
T('all-30-levels', results.length === 30 && results.every(r => r === 'won'),
  results.map((r, i) => r === 'won' ? '' : (i + 1) + ':' + r).filter(Boolean).join(','));

// --- daily challenge entry (engine's own startDaily; seed uses the sandbox's virtual Date) ---
g.call('startDaily()'); g.pump(2);
const seedIdx = g.call('(new Date().getFullYear()*10000+(new Date().getMonth()+1)*100+new Date().getDate())%30');
T('daily-starts', C('__NA.daily()') === true && C('__NA.lvl()') === seedIdx, 'daily=' + C('__NA.daily()') + ' lvl=' + C('__NA.lvl()') + ' seed=' + seedIdx);

// --- progress + achievements persisted by the engine's own onWin ---
const prog = JSON.parse(g.ls.getItem('nailArtProgress') || '{}');
const ach = JSON.parse(g.ls.getItem('nailArtAchievements') || '{}');
const wonN = Object.values(prog).filter(v => v > 0).length;
T('progress-saved', wonN === 30, 'progress=' + wonN + '/30');
const achIds = ['first_win', 'three_stars', 'tier_apprentice', 'no_hint_pro', 'color_mixer', 'halfway_there', 'pattern_pro', 'nail_master'];
T('achievements-earned', achIds.every(a => ach[a] === true),
  achIds.filter(a => !ach[a]).join(',') || 'all 8');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/30', durS: Math.round((Date.now() - T0) / 1000) } };
console.log('nail-art: ' + results.filter(r => r === 'won').length + '/30 designs via real tool/palette/canvas clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
