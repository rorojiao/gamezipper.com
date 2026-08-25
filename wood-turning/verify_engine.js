#!/usr/bin/env node
/* wood-turning verifier — all 30 levels completed through the engine's real input
 * path: real canvas pointerdown/pointerup strokes dispatched at the exact (x, y)
 * that the engine's own handlePointer math maps onto each segment's target depth
 * (depth = (y-surfaceY)/(maxR*1.7) clamped [0,0.9]; carve is monotonic per segment;
 * every target value is <=0.85 so exact reach), then the engine's own Check button
 * path (checkMatch -> calcMatch -> 1.5s timer -> showWinScreen, stars 70/85/95).
 * Undo/reset/undo-cap-30/level-select gating/locked-card inertness/daily
 * challenge/achievements/localStorage persistence all through real handlers. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('wood-turning', { inject: {
  anchor: '// --- Init ---',
  exports: `
globalThis.__winInfo = null;
var __oSW = showWinScreen;
showWinScreen = function(p, s){ globalThis.__winInfo = { lvl: state.dailyMode ? -1 : state.level + 1, pct: p, stars: s }; return __oSW.apply(this, arguments); };
drawGame = function(){}; // draw-only (gradients/grain/particles/reveal) — stubbed to keep the loop cheap; zero game logic lives in draw
globalThis.__WT = {
  n: function(){ return LEVELS.length; },
  lv: function(i){ return { name: LEVELS[i].name, n: LEVELS[i].n, target: LEVELS[i].target.slice() }; },
  st: function(){ return { lvl: state.level, carved: state.carved.slice(), target: state.target.slice(), undo: state.undoStack.length, daily: state.dailyMode }; },
  geo: function(){ return { cw: cw, ch: ch, padL: padL, padR: padR, padT: padT, padB: padB }; },
  match: function(){ return calcMatch(); },
  save: function(){ return JSON.parse(JSON.stringify(save)); },
};`
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game-canvas'];
const T0 = Date.now();

// ---------- boot + level data integrity ----------
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30', C('__WT.n()') === 30, 'n=' + C('__WT.n()'));
const LV = [];
for (let i = 0; i < 30; i++) LV.push(C('__WT.lv(' + i + ')'));
let integ = [];
LV.forEach((l, i) => {
  const wantN = 16 + 4 * Math.floor(i / 6); // tiers 1..5 => 16/20/24/28/32 segments
  if (l.n !== wantN) integ.push('L' + (i + 1) + ':n' + l.n + '!=' + wantN);
  if (l.target.length !== l.n) integ.push('L' + (i + 1) + ':len' + l.target.length);
  if (l.target.some(v => v < 0 || v > 0.85)) integ.push('L' + (i + 1) + ':range');
  if (l.target.some(v => v > 0.9)) integ.push('L' + (i + 1) + ':uncarvable'); // carve caps at 0.9
});
T('level-data-integrity', integ.length === 0, integ.join(',').slice(0, 120));

// ---------- menu + level-select gating (real markup-built cards) ----------
T('menu-initial', g.els['menu-screen'].classList.contains('active'), 'menu not active at boot');
C('renderLevelSelect()');
const cards = () => Array.from(g.els['ls-grid'].children);
T('level-select-built', cards().length === 30, 'cards=' + cards().length);
T('fresh-gating', cards().filter(c => c.classList.contains('locked')).length === 29,
  'locked=' + cards().filter(c => c.classList.contains('locked')).length);
cards()[7].click(); // locked cell: engine wires no handler on it
T('locked-card-inert', g.els['menu-screen'].classList.contains('active'), 'locked card started the game');

// ---------- enter level 1 via the real Play handler + geometry ----------
C('startGame()');
const geo = C('__WT.geo()');
const maxR = (geo.ch - geo.padT - geo.padB) / 2;
const profW = geo.cw - geo.padL - geo.padR;
T('level-1-loaded', C('__WT.st().lvl') === 0 && g.els['game-screen'].classList.contains('active'), 'lvl=' + C('__WT.st().lvl'));
T('geometry-sane', geo.cw >= 300 && profW > 100 && maxR > 50, JSON.stringify(geo));

// ---------- real-stroke carving + input-path calibration ----------
function pev(type, x, y) {
  cv.dispatch(type, { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
}
function segX(i, n) { return geo.padL + profW * (i + 0.5) / n; }
function depthY(d) { return geo.padT + d * maxR * 1.7; }
// probe A: derive any client->canvas rect offset
pev('pointerdown', segX(3, 16), depthY(0.4)); pev('pointerup', segX(3, 16), depthY(0.4));
let st = C('__WT.st()');
const obsSeg = st.carved.findIndex(v => v > 0.01);
const obsD = obsSeg >= 0 ? st.carved[obsSeg] : 0;
const offX = obsSeg === 3 ? 0 : segX(3, 16) - segX(obsSeg, 16);
const offY = obsSeg >= 0 ? depthY(0.4) - depthY(obsD) : 0;
// probe B: corrected stroke must hit segment 8 at depth 0.7 and nothing else
const preB = st.carved.slice();
pev('pointerdown', segX(8, 16) + offX, depthY(0.7) + offY); pev('pointerup', segX(8, 16) + offX, depthY(0.7) + offY);
st = C('__WT.st()');
T('input-calibrated', obsSeg >= 0 && Math.abs(st.carved[8] - 0.7) < 0.02 && st.carved.every((v, i) => i === 8 || Math.abs(v - preB[i]) < 1e-9),
  'obsSeg=' + obsSeg + ' obsD=' + obsD.toFixed(3) + ' B8=' + st.carved[8].toFixed(3));

function strokeSeg(i, n, d) { // one real stroke placing segment i at exact depth d
  const x = segX(i, n) + offX, y = depthY(d) + offY;
  pev('pointerdown', x, y); pev('pointerup', x, y);
}

// only-remove rule: a shallower stroke must not restore wood
strokeSeg(8, 16, 0.3);
const c8 = C('__WT.st().carved[8]');
T('carve-monotonic', Math.abs(c8 - 0.7) < 0.02, 'c8=' + c8.toFixed(3));
// undo restores the pre-stroke snapshot (real Undo handler)
strokeSeg(5, 16, 0.6);
C('undoCarve()');
T('undo-restores', C('__WT.st().carved[5]') === 0, 'c5=' + C('__WT.st().carved[5]'));
for (let k = 0; k < 8; k++) C('undoCarve()'); // exhaust the stack + empty-stack toast path
T('undo-empty-safe', C('__WT.st().undo') === 0, 'undo=' + C('__WT.st().undo'));
strokeSeg(6, 16, 0.8);
C('resetLevel()'); // real Reset handler
st = C('__WT.st()');
T('reset-works', st.carved.every(v => v === 0) && st.undo === 2, 'undo=' + st.undo); // seg-6 stroke push + reset's own push
C('loadLevel(0)'); // clean slate for the scored run

// ---------- all 30 levels: exact carving -> engine's own Check -> win screen ----------
const chain = [];
let threeStars = 0;
for (let id = 1; id <= 30; id++) {
  if (Date.now() > T0 + 100000) { chain.push(id + ':deadline'); T('level-' + id + '-won', false, 'deadline'); break; }
  st = C('__WT.st()');
  if (st.lvl !== id - 1) { chain.push(id + ':bad-load' + st.lvl); T('level-' + id + '-won', false, 'bad-load lvl=' + st.lvl); break; }
  const target = st.target, n = target.length;
  let strokes = 0;
  for (let i = 0; i < n; i++) if (target[i] > 1e-9) { strokeSeg(i, n, target[i]); strokes++; }
  if (id === 1) T('undo-one-per-stroke', C('__WT.st().undo') === strokes, 'undo=' + C('__WT.st().undo') + '/' + strokes);
  if (id === 26) { // first 32-segment level: 32 downs push past the 30-snapshot cap
    const un = C('__WT.st().undo');
    T('undo-cap-30', un === Math.min(strokes, 30), 'undo=' + un + ' strokes=' + strokes);
    if (un === 30) { // pop the last snapshot (re-carve the segment it reverts)
      C('undoCarve()');
      const t2 = C('__WT.st().target');
      strokeSeg(t2.length - 1, t2.length, t2[t2.length - 1]);
    }
  }
  const pct = C('__WT.match()');
  if (id === 1) T('match-meter-updates', g.els['match-pct'].textContent === '100%', 'txt=' + g.els['match-pct'].textContent);
  C('__winInfo = null');
  C('checkMatch()'); // the real Check button handler
  g.pump(160); // 1.5s win timer + star-ding timers + toast
  const w = C('__winInfo');
  const sv = C('__WT.save()');
  const ok = w && w.lvl === id && w.stars === 3 && sv.stars[id - 1] === 3 && pct >= 99.9;
  if (ok) threeStars++;
  chain.push(ok ? '' + id : id + ':pct' + pct.toFixed(1));
  T('level-' + id + '-won', ok, 'pct=' + pct.toFixed(2) + ' win=' + JSON.stringify(w) + ' saved=' + sv.stars[id - 1]);
  if (id === 1) {
    T('win-screen-shown', g.els['win-screen'].classList.contains('active') && g.els['win-match'].textContent === '100%',
      'active=' + g.els['win-screen'].classList.contains('active') + ' match=' + g.els['win-match'].textContent);
    T('ach-first-carve', C('__WT.save().achievements.first_carve') === true && C('__WT.save().achievements.three_star') === true,
      JSON.stringify(C('__WT.save().achievements')));
  }
  if (id === 6) T('ach-tier1', C('__WT.save().achievements.tier1') === true, 'tier1=' + C('__WT.save().achievements.tier1'));
  if (!ok) break;
  if (id < 30) { g.els['win-next'].click(); g.pump(4); } // real Next button (onclick rewired by showWinScreen)
}
T('all-30-levels', chain.length === 30 && chain.every(x => !x.includes(':')),
  chain.filter(x => x.includes(':')).join(',').slice(0, 200) || 'all');
if (chain.length === 30 && chain.every(x => !x.includes(':'))) {
  T('ach-all-done', C('__WT.save().achievements.all_done') === true, 'all_done=' + C('__WT.save().achievements.all_done'));
  T('ach-perfect', C('__WT.save().achievements.perfect') === true, 'perfect=' + C('__WT.save().achievements.perfect'));
}

// ---------- daily challenge (date-seeded, real Daily handler) ----------
C('showDaily()');
st = C('__WT.st()');
T('daily-loaded', st.daily === true && st.lvl === -1 && st.target.length === 24, 'lvl=' + st.lvl + ' n=' + st.target.length);
for (let i = 0; i < 24; i++) if (st.target[i] > 1e-9) strokeSeg(i, 24, st.target[i]);
const dpct = C('__WT.match()');
C('__winInfo = null');
C('checkMatch()');
g.pump(160);
const dw = C('__winInfo');
T('daily-won', dw && dw.lvl === -1 && dw.stars === 3 && dpct >= 99.9, 'pct=' + dpct.toFixed(2) + ' win=' + JSON.stringify(dw));
T('daily-persisted', C('__WT.save().dailyDate') === C('new Date().toDateString()') && C('__WT.save().achievements.daily') === true,
  'date=' + JSON.stringify(C('__WT.save().dailyDate'))); // sandbox clock is frozen at epoch; compare against the engine's own today

// ---------- level select after full clear + replay via a real card ----------
C('renderLevelSelect()');
const cs = cards();
T('level-select-all-done', cs.length === 30 && cs.every(c => !c.classList.contains('locked')) && cs.every(c => c.classList.contains('completed')),
  'n=' + cs.length + ' locked=' + cs.filter(c => c.classList.contains('locked')).length + ' done=' + cs.filter(c => c.classList.contains('completed')).length);
cs[29].click(); g.pump(4);
T('card-30-replays', C('__WT.st().lvl') === 29 && C('__WT.st().target.length') === 32, 'lvl=' + C('__WT.st().lvl'));

// ---------- persistence ----------
const raw = JSON.parse(g.ls.getItem('woodturning_save_v1') || '{}');
const svals = Object.values(raw.stars || {});
T('save-persisted', Object.keys(raw.stars || {}).length === 30 && svals.every(v => v === 3), 'keys=' + Object.keys(raw.stars || {}).length);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: chain.filter(x => !x.includes(':')).length + '/30', stars3: threeStars, durS: Math.round((Date.now() - T0) / 1000),
    notes: 'all levels 100% match via exact-depth real pointer strokes (engine depth=(y-surfaceY)/(maxR*1.7), targets<=0.85<=carve cap); ' +
      'daily challenge won+persisted; P2 (documented, unfixed): Speed Carver + Comeback Kid achievements unobtainable (carveStartTime recorded but never checked; undo usage not tracked); ' +
      'checkMatch lets sub-70% runs advance via Next with 0 stars saved — casual design, no softlock (findNextLevel returns to unstarred levels)' } };
console.log('wood-turning: ' + chain.filter(x => !x.includes(':')).length + '/30 levels + daily via real pointer strokes: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
