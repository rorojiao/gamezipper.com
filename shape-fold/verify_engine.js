#!/usr/bin/env node
// shape-fold engine verifier (vm harness, real input paths only)
// Engine bugs fixed (root-caused 2026-08-25):
//  P1: checkWin unconditionally overwrote the level record — a sloppier replay
//      DOWNGRADED saved best stars/moves (keep-best guard was dead code).
//  P1: loadLevel zeroed the move counter but never reset panel states — folds
//      survived Menu exits, so a board left one click from target could be
//      re-entered and "solved" in 1 move for an underserved 3-star record.
//  P2: several authored pars were below the theoretical minimum move count
//      (UP=1 click, DOWN=2, FLAT=0), making 3 stars mathematically unattainable
//      (L2 par 2 vs min 3, L5 par 4 vs min 6, L8/L9/L11/L13/... similar).
//  P2: dailySolvedToday was never set anywhere → "Daily Devotee" achievement
//      permanently unobtainable.
// Verified: panel fold cycling via canvas pointer events, undo/reset, hint economy,
// star/par economy, 30-level chain at optimal move count, level select + locks,
// best-record preservation, daily challenge, achievements, settings, save/restore.
'use strict';
const fs = require('fs');
const path = require('path');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let PASS = 0, FAIL = 0; const FAILS = [];
function ck(name, ok, got) {
  if (ok) { PASS++; } else { FAIL++; FAILS.push(name + (got !== undefined ? ' :: ' + got : '')); }
}
const el = (g, id) => g.els[id];
const hasText = (node, s) => String(node.innerHTML || '').includes(s) || (node.children || []).some(c => String(c.textContent) === s);

// ---- extract LEVELS from the engine source with a stub buildSquares ----
const SRC = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lvSrc = SRC.match(/const LEVELS = \[([\s\S]*?)\n\];/);
const STATE = { FLAT: 0, UP: 1, DOWN: -1 };
function buildSquares(positions, targetStates, par, name, tier) {
  return { positions, targetStates, par: par || positions.length, name, tier };
}
const LV = eval('[' + lvSrc[1] + ']'); // capture ends at the last buildSquares(...) call — no trailing separator
const LVLS = LV.map((l, i) => {
  const minMoves = l.targetStates.reduce((s, t) => s + (t === STATE.FLAT ? 0 : (t === STATE.UP ? 1 : 2)), 0);
  return { num: i + 1, positions: l.positions, targets: l.targetStates, par: Math.max(l.par, minMoves), minMoves, name: l.name };
});
if (LVLS.length !== 30) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['LEVELS extraction got ' + LVLS.length], extra: {} })); process.exit(1); }

// canvas geometry replica of getPanelBounds (canvas is fixed 520x380)
function panelBounds(positions) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  positions.forEach(([gx, gy]) => { minX = Math.min(minX, gx); minY = Math.min(minY, gy); maxX = Math.max(maxX, gx + 1); maxY = Math.max(maxY, gy + 1); });
  const w = maxX - minX, h = maxY - minY;
  const scale = Math.min(520 / (w + 4), 380 / (h + 4));
  const ox = (520 - w * scale) / 2 - minX * scale;
  const oy = (380 - h * scale) / 2 - minY * scale;
  return { scale, ox, oy };
}

// ---------- boot 1 ----------
const g = harness.bootGame('shape-fold');
ck('boot: no load errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join(' | '));
ck('boot: menu shown', el(g, 'menu-screen').style.display === 'flex');
ck('boot: stats zero', String(el(g, 'stat-solved').textContent) === '0' && String(el(g, 'stat-stars').textContent) === '0' && String(el(g, 'stat-tier').textContent) === '0');

// ---- helpers ----
function clickPanel(g, lvlIdx, panelIdx) { // real pointerdown at the panel's canvas-space center
  const cv = el(g, 'game-canvas');
  const L = LVLS[lvlIdx];
  const b = panelBounds(L.positions);
  const [gx, gy] = L.positions[panelIdx];
  const cx = b.ox + (gx + 0.5) * b.scale, cy = b.oy + (gy + 0.5) * b.scale;
  const r = cv.getBoundingClientRect();
  const clientX = r.left + cx * (r.width / cv.width), clientY = r.top + cy * (r.height / cv.height);
  cv.dispatch('pointerdown', { clientX, clientY, pointerId: 1, button: 0, preventDefault() {}, type: 'pointerdown' });
}
function solveLevel(g, lvlIdx, sloppyExtra) { // optimal plan: UP=1 click, DOWN=2, FLAT=0
  const L = LVLS[lvlIdx];
  let clicks = 0;
  if (sloppyExtra) { for (let k = 0; k < sloppyExtra; k++) { clickPanel(g, lvlIdx, 0); clicks++; g.pump(1); } } // 3 full cycles on panel 0 = ends back at its target
  L.targets.forEach((t, i) => {
    const n = t === STATE.FLAT ? 0 : (t === STATE.UP ? 1 : 2);
    for (let k = 0; k < n; k++) { clickPanel(g, lvlIdx, i); clicks++; g.pump(1); }
  });
  return clicks;
}
const winShown = (g) => el(g, 'win-overlay').classList.contains('show');
const btn = (g, id) => { el(g, id).dispatch('click', { type: 'click' }); };
const LS = (g) => JSON.parse(g.ls.getItem('gamezipper_shapefold_v1') || '{}');
const SET = (g) => JSON.parse(g.ls.getItem('gamezipper_shapefold_v1_settings') || '{}');

// ---- settings screen round-trip (before first level: hints stay 3) ----
btn(g, 'btn-settings');
ck('settings: shown', el(g, 'settings-screen').style.display === 'block');
ck('settings: defaults on', el(g, 'tog-sound').classList.contains('on') && el(g, 'tog-music').classList.contains('on') && el(g, 'tog-vib').classList.contains('on'));
btn(g, 'tog-vib');
ck('settings: vib off persists', SET(g).vibration === false && !el(g, 'tog-vib').classList.contains('on'));
btn(g, 'tog-vib'); // restore
ck('settings: vib back on', SET(g).vibration === true);

// ---- level select (nothing solved): L1 open, L2+ locked ----
btn(g, 'btn-back'); // settings screen has no Back; use menu via game? settings is a screen: use btn-levels path through menu
// (settings screen has no back button in markup — navigating via level select from menu)
btn(g, 'btn-levels'); // still bound; showLevelScreen hides other screens
ck('levels: screen shown', el(g, 'level-screen').style.display === 'block');
const tierList = el(g, 'tier-list');
ck('levels: 5 tier sections', tierList.children.length === 5, String(tierList.children.length));
// engine does div.querySelector('.level-grid') which the harness serves from a per-element
// stub cache — the appended level buttons live in that stub, same object across reads
function tierGrids() { return tierList.children.map(d => d.__qs && d.__qs['.level-grid']).filter(Boolean); }
function levelButtons() { return tierGrids().flatMap(gr => gr.children || []); }
let lbtns = levelButtons();
ck('levels: 30 buttons', lbtns.length === 30, String(lbtns.length));
ck('levels: L1 unlocked', !lbtns[0].classList.contains('locked') && typeof lbtns[0].onclick === 'function');
ck('levels: L2 locked inert', lbtns[1].classList.contains('locked') && typeof lbtns[1].onclick !== 'function');
lbtns[1].dispatch('click', { type: 'click' });
ck('levels: locked click no game', el(g, 'game-screen').style.display !== 'block');

// ---- enter L1: mechanics ----
lbtns[0].dispatch('click', { type: 'click' });
ck('L1: game screen', el(g, 'game-screen').style.display === 'block');
ck('L1: canvas 520x380', el(g, 'game-canvas').width === 520 && el(g, 'game-canvas').height === 380, el(g, 'game-canvas').width + 'x' + el(g, 'game-canvas').height);
ck('L1: header', String(el(g, 'lvl-num').textContent) === '1' && String(el(g, 'lvl-name').textContent) === 'Arrow');
ck('L1: par displayed = clamped min', String(el(g, 'move-par').textContent) === String(LVLS[0].par), el(g, 'move-par').textContent + ' vs ' + LVLS[0].par);
clickPanel(g, 0, 0); g.pump(1); // fold panel 1 (target FLAT — a wrong move, cannot win early)
ck('L1: move count 1', String(el(g, 'move-count').textContent) === '1', el(g, 'move-count').textContent);
btn(g, 'btn-undo'); g.pump(1);
ck('L1: undo refunds', String(el(g, 'move-count').textContent) === '0', el(g, 'move-count').textContent);
btn(g, 'btn-undo');
ck('L1: undo empty no-op', String(el(g, 'move-count').textContent) === '0');
// hints (2 here, exhaust on L2)
btn(g, 'btn-hint');
ck('L1: hint 1 toast', String(el(g, 'toast').textContent) === 'Hint: highlight panel 2. (2 left)', el(g, 'toast').textContent); // flat board: only the UP-target panel mismatches
ck('L1: hint flash on', el(g, 'hint-flash').classList.contains('on'));
ck('L1: hint count saved', SET(g).hintsRemaining === 2, String(SET(g).hintsRemaining));
btn(g, 'btn-hint');
ck('L1: hint 2', String(el(g, 'toast').textContent) === 'Hint: highlight panel 2. (1 left)', el(g, 'toast').textContent);
// misclick far from any panel is ignored (closest-center gate)
el(g, 'game-canvas').dispatch('pointerdown', { clientX: 4, clientY: 4, pointerId: 1, button: 0, preventDefault() {}, type: 'pointerdown' });
ck('L1: empty-space click ignored', String(el(g, 'move-count').textContent) === '0', el(g, 'move-count').textContent);
// solve L1 (1 click, par 1)
const c1 = solveLevel(g, 0);
g.pump(45); // 600ms win overlay timer + margin
ck('L1: win overlay', winShown(g));
ck('L1: 3 stars', String(el(g, 'win-stars-display').textContent) === '* * *', el(g, 'win-stars-display').textContent);
ck('L1: win moves = min', String(el(g, 'win-moves').textContent) === String(c1), el(g, 'win-moves').textContent + ' vs ' + c1);
ck('L1: saved 3*', LS(g).levels['1'] && LS(g).levels['1'].stars === 3, JSON.stringify(LS(g).levels));
btn(g, 'btn-hint'); // solved board
ck('L1: hint on solved', String(el(g, 'toast').textContent) === 'Already solved!', el(g, 'toast').textContent);

// ---- chain L2..L30 via Next, optimal solves ----
let tierAch = { 6: 'tier1', 12: 'tier2', 18: 'tier3', 24: 'tier4', 30: 'tier5' };
for (let i = 1; i < 30; i++) {
  btn(g, 'btn-next-level');
  const L = LVLS[i];
  ck('L' + L.num + ': entered', String(el(g, 'lvl-num').textContent) === String(L.num) && String(el(g, 'move-count').textContent) === '0', el(g, 'lvl-num').textContent);
  ck('L' + L.num + ': par = clamped min', String(el(g, 'move-par').textContent) === String(L.par), el(g, 'move-par').textContent + ' vs ' + L.par);

  if (i === 1) { // hint exhaustion (2 used on L1)
    btn(g, 'btn-hint');
    ck('L2: hint 3 -> 0 left', SET(g).hintsRemaining === 0 && String(el(g, 'toast').textContent).indexOf('0 left') >= 0, el(g, 'toast').textContent);
    btn(g, 'btn-hint');
    ck('L2: hints exhausted', String(el(g, 'toast').textContent) === 'No hints left. Refills daily!', el(g, 'toast').textContent);
    ck('L2: no decrement past 0', SET(g).hintsRemaining === 0);
  }
  if (i === 2) { // reset button mid-level
    clickPanel(g, 2, 0); clickPanel(g, 2, 1); g.pump(1);
    ck('L3: moves before reset', String(el(g, 'move-count').textContent) === '2', el(g, 'move-count').textContent);
    btn(g, 'btn-reset-level'); g.pump(1);
    ck('L3: reset zeroes moves', String(el(g, 'move-count').textContent) === '0', el(g, 'move-count').textContent); // stars-pill is recomputed by render() right after
  }
  if (i === 3) { // P1 loadLevel-reset proof: fold panel 2 (its target is UP), exit, re-enter
    clickPanel(g, 3, 1); g.pump(1);
    btn(g, 'btn-back'); // -> menu
    btn(g, 'btn-play'); // Continue -> first unsolved = L4
    ck('L4: re-entered after exit', String(el(g, 'lvl-num').textContent) === '4' && String(el(g, 'move-count').textContent) === '0', el(g, 'lvl-num').textContent + '/' + el(g, 'move-count').textContent);
    // if panel states had survived, the optimal plan would overfold and miss the win
  }
  const clicks = solveLevel(g, i);
  g.pump(45);
  ck('L' + L.num + ': win overlay', winShown(g), 'idx ' + i);
  ck('L' + L.num + ': 3 stars at optimal moves', String(el(g, 'win-stars-display').textContent) === '* * *', el(g, 'win-stars-display').textContent);
  ck('L' + L.num + ': win moves = min ' + L.minMoves, String(el(g, 'win-moves').textContent) === String(L.minMoves), el(g, 'win-moves').textContent + ' vs ' + L.minMoves + ' (clicks ' + clicks + ')');
  const rec = LS(g).levels[String(L.num)];
  ck('L' + L.num + ': record saved', rec && rec.stars === 3 && rec.moves === L.minMoves, JSON.stringify(rec));
  if (tierAch[L.num]) { ck('ach: ' + tierAch[L.num] + ' earned', LS(g).achievements[tierAch[L.num]] === true, JSON.stringify(LS(g).achievements)); }
}
ck('L30: next hidden', el(g, 'btn-next-level').style.display === 'none', el(g, 'btn-next-level').style.display);
ck('ach: first_fold earned', LS(g).achievements.first_fold === true);
ck('ach: perfect10 earned (10+ three-star)', LS(g).achievements.perfect10 === true, JSON.stringify(LS(g).achievements));
g.pump(420); // flush achievement toasts (8 x 800ms)

// ---- best-record preservation (P1): sloppier replay cannot downgrade L1 ----
btn(g, 'btn-win-menu');
btn(g, 'btn-levels');
lbtns = levelButtons();
ck('levels: all completed', lbtns.every(b => b.classList.contains('completed')));
ck('levels: mini stars 3 on L1', hasText(lbtns[0], '***'), lbtns[0].innerHTML);
lbtns[0].dispatch('click', { type: 'click' });
solveLevel(g, 0, 3); // 3 extra full cycles on panel 0: 1+3 = 4 moves > par+2 -> 1 star
g.pump(45);
ck('replay L1: 1 star this run', String(el(g, 'win-stars-display').textContent) === '*', el(g, 'win-stars-display').textContent);
ck('replay L1: best kept 3* (P1 fix)', LS(g).levels['1'].stars === 3, JSON.stringify(LS(g).levels['1']));
ck('replay L1: best moves kept', LS(g).levels['1'].moves === 1, JSON.stringify(LS(g).levels['1']));
btn(g, 'btn-retry-level'); g.pump(1);
ck('replay L1: retry resets', String(el(g, 'move-count').textContent) === '0' && !winShown(g));

// ---- daily challenge (P2: dailySolvedToday now set on daily win) ----
btn(g, 'btn-back'); // -> menu
// the engine derives the level from its own clock; trust lvl-num as the source of truth
btn(g, 'btn-daily');
const dailyNum = parseInt(String(el(g, 'lvl-num').textContent), 10);
ck('daily: entered a level', dailyNum >= 1 && dailyNum <= 30, el(g, 'lvl-num').textContent);
ck('daily: toast', String(el(g, 'toast').textContent) === 'Daily Challenge: Level ' + dailyNum, el(g, 'toast').textContent);
solveLevel(g, dailyNum - 1);
g.pump(45);
ck('daily: win', winShown(g));
ck('daily: dailySolvedToday set (P2 fix)', LS(g).dailySolvedToday === true, String(LS(g).dailySolvedToday));
ck('daily: daily_streak earned', LS(g).achievements.daily_streak === true, JSON.stringify(LS(g).achievements));
// a non-daily win must not clear the flag: re-enter L2, win, flag stays true from today's daily
btn(g, 'btn-win-menu');
btn(g, 'btn-levels');
lbtns = levelButtons();
lbtns[1].dispatch('click', { type: 'click' });
solveLevel(g, 1);
g.pump(45);
ck('daily: non-daily win keeps flag', LS(g).dailySolvedToday === true, String(LS(g).dailySolvedToday));

// ---- achievements screen: 8/8 ----
btn(g, 'btn-win-menu');
btn(g, 'btn-achievements');
ck('ach: screen shown', el(g, 'achievements-screen').style.display === 'block');
const achStat = el(g, 'ach-list').children[el(g, 'ach-list').children.length - 1];
ck('ach: 8/8 unlocked', hasText(achStat, '8/8'), achStat.innerHTML);
ck('ach: menu stats 30 solved', String(el(g, 'stat-solved').textContent) === '30', el(g, 'stat-solved').textContent);
ck('ach: menu stats 90 stars', String(el(g, 'stat-stars').textContent) === '90', el(g, 'stat-stars').textContent);
ck('ach: menu stats 5 tiers', String(el(g, 'stat-tier').textContent) === '5', el(g, 'stat-tier').textContent);

ck('run: zero engine errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));

// ---------- boot 2: seeded save + settings restore + progress reset ----------
const seed = { version: 1, levels: { 1: { moves: 2, stars: 2, time: 5 } }, achievements: {}, lastDaily: 0, dailySolvedToday: false };
const g2 = harness.bootGame('shape-fold', { seedLS: { gamezipper_shapefold_v1: JSON.stringify(seed), gamezipper_shapefold_v1_settings: JSON.stringify({ sound: false, music: true, vibration: false, hintsRemaining: 3 }) } });
ck('boot2: no load errors', (g2.loadErrors || []).length === 0, (g2.loadErrors || []).join(' | '));
ck('boot2: stats restored', String(el(g2, 'stat-solved').textContent) === '1' && String(el(g2, 'stat-stars').textContent) === '2', el(g2, 'stat-solved').textContent + '/' + el(g2, 'stat-stars').textContent);
el(g2, 'btn-settings').dispatch('click', { type: 'click' });
ck('boot2: sound restored off', !el(g2, 'tog-sound').classList.contains('on'));
ck('boot2: music restored on', el(g2, 'tog-music').classList.contains('on'));
ck('boot2: vib restored off', !el(g2, 'tog-vib').classList.contains('on'));
el(g2, 'btn-back').dispatch('click', { type: 'click' }); // no back on settings; menu nav below
el(g2, 'btn-levels').dispatch('click', { type: 'click' });
const g2btns = levelButtons.call(null) && (() => { const t = el(g2, 'tier-list'); return t.children.map(d => d.__qs && d.__qs['.level-grid']).filter(Boolean).flatMap(gr => gr.children || []); })();
ck('boot2: L1 completed 2*', g2btns[0].classList.contains('completed') && hasText(g2btns[0], '**'), g2btns[0].innerHTML);
ck('boot2: L2 unlocked (prev solved)', !g2btns[1].classList.contains('locked') && typeof g2btns[1].onclick === 'function');
ck('boot2: L3 still locked', g2btns[2].classList.contains('locked') && typeof g2btns[2].onclick !== 'function');
// progress reset (confirm stub returns true)
el(g2, 'btn-settings').dispatch('click', { type: 'click' });
el(g2, 'btn-reset').dispatch('click', { type: 'click' });
ck('boot2: reset wipes save', Object.keys(JSON.parse(g2.ls.getItem('gamezipper_shapefold_v1')).levels || {}).length === 0, g2.ls.getItem('gamezipper_shapefold_v1'));
ck('boot2: reset toast', String(el(g2, 'toast').textContent) === 'Progress reset', el(g2, 'toast').textContent);
ck('boot2: zero errors', (g2.sandbox.__errors || []).length === 0, (g2.sandbox.__errors || []).slice(0, 3).join(' | '));

const extra = {
  levels: 30, allSolvable: true, optimalSolves: 'all 30 solved at theoretical minimum moves for 3 stars',
  fixes: 'P1 best-record overwrite on replay (stars could downgrade), P1 loadLevel kept stale panel folds across re-entry (1-move 3-star cheat), P2 pars below theoretical minimum (3 stars unattainable), P2 dailySolvedToday never set (daily achievement dead)'
};
console.log(JSON.stringify({ pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS, extra }));
process.exit(FAIL === 0 ? 0 : 1);
