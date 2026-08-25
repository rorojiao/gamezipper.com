#!/usr/bin/env node
// save-the-doge engine verifier (vm harness, real input paths only)
// Engine bugs fixed (root-caused 2026-08-25):
//  P0: the win check lived INSIDE the hazard loop after `if(!h.alive)continue` — deflecting
//      every hazard off-screen (the natural result of good play) meant the loop body never
//      ran, so no level could EVER complete: timer filled to 100% and GS stayed 'simulating'
//      forever. Win check re-sited after the loop.
//  P1: chapter tabs captured the loop var (`for(var c=1..5) tab.onclick=...currentChapter=c-1`)
//      — after the loop c===6, so EVERY tab opened chapter 5 (out of range → empty level grid,
//      levels screen soft-locked until a level was won). Tabs now capture per-iteration value.
// Verified mechanics: ink drawing (budget/undo), GO simulation, hazard physics, win/lose,
// star economy (ink <40% = 3*, <70% = 2*), hint persistence, settings, save/restore, 30 levels.
'use strict';
const path = require('path');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let PASS = 0, FAIL = 0; const FAILS = [];
function ck(name, ok, got) {
  if (ok) { PASS++; } else { FAIL++; FAILS.push(name + (got !== undefined ? ' :: ' + got : '')); }
}
const el = (g, id) => g.els[id];
const vis = (g, id) => !el(g, id).classList.contains('hidden');
function clickBody(g, label, root) { // static buttons live in the canonical body tree
  let b = null;
  const walk = (n) => { for (const c of (n.children || [])) { if (String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === label) { b = c; return; } walk(c); } };
  walk(root || g.sandbox.document.body);
  if (b) b.dispatch('click', { type: 'click' });
  return !!b;
}

// Per-level barrier plans (offline-verified with an exact physics mirror):
// hazard crossing x at the intercept band, +/-25px stroke, ink 50 < 0.4*inkMax -> 3 stars.
const PLANS = { 9: [[385, 238, 288]], 14: [[455, 275, 325]], 16: [[385, 238, 288]], 19: [[385, 238, 288]],
  21: [[385, 256, 306]], 22: [[385, 200, 250]], 23: [[385, 250, 300]], 25: [[385, 238, 288]],
  27: [[385, 256, 306]], 29: [[385, 275, 325]] }; // keyed by level index (0-based)

// ---------- boot 1 ----------
const g = harness.bootGame('save-the-doge');
ck('boot: no load errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join(' | '));
// harness stub: the game-footer mirror reports offsetHeight 640 (element default), so
// the engine's footer-aware resize() collapses the play area to its 200px floor
// (171x200) — in a real browser the footer is ~40px and levels run at 480x560 (their
// authored geometry). Patch the mirror and fire a real window resize event.
g.els['game-footer'].offsetHeight = 40;
g.sandbox.window.dispatchEvent({ type: 'resize' });
ck('boot: title shown', vis(g, 'screen-title') && !vis(g, 'screen-levels'));
ck('boot: canvas sized', el(g, 'c').width === 480 && el(g, 'c').height === 560, el(g, 'c').width + 'x' + el(g, 'c').height);

// settings round-trip
ck('nav: Settings', clickBody(g, 'Settings'));
ck('settings: shown', vis(g, 'screen-settings'));
ck('settings: sound ON default', String(el(g, 'snd-btn').textContent) === 'Sound ON');
ck('settings: toggle sound', clickBody(g, 'Sound ON') && String(el(g, 'snd-btn').textContent) === 'Sound OFF');
ck('settings: toggle music', clickBody(g, 'Music ON') && String(el(g, 'mus-btn').textContent) === 'Music OFF');
ck('settings: saved off', JSON.parse(g.ls.getItem('std_v1')).sound === false && JSON.parse(g.ls.getItem('std_v1')).music === false);
clickBody(g, 'Sound ON'); clickBody(g, 'Music ON'); // canonical tree keeps static labels; engine toggles via onclick
ck('settings: back on', String(el(g, 'snd-btn').textContent) === 'Sound ON' && String(el(g, 'mus-btn').textContent) === 'Music ON');
ck('settings: Back', clickBody(g, 'Back') && vis(g, 'screen-title'));

// level select
ck('nav: Play', clickBody(g, 'Play'));
ck('levelsel: shown', vis(g, 'screen-levels'));
const nav = el(g, 'chapter-nav'), grid = el(g, 'level-grid');
ck('levelsel: 5 tabs', nav.children.length === 5, String(nav.children.length));
ck('levelsel: ch1 6 cells', grid.children.length === 6, String(grid.children.length));
ck('levelsel: L1 unlocked', grid.children[0].classList.contains('unlocked'));
ck('levelsel: L2 locked inert', !grid.children[1].classList.contains('unlocked') && typeof grid.children[1].onclick !== 'function');
grid.children[1].dispatch('click', { type: 'click' });
ck('levelsel: locked click ignored', el(g, 'go-btn-wrap').style.display === 'none');
// P1 fix proof: tabs actually switch chapters now (previously every tab -> ch5 empty grid)
nav.children[2].dispatch('click', { type: 'click' });
ck('tabs: ch3 shows 6 cells (P1 fix)', grid.children.length === 6 && String(grid.children[0].textContent) === '13', String(grid.children[0] && grid.children[0].textContent));
ck('tabs: ch3 L13 locked', !grid.children[0].classList.contains('unlocked'));
nav.children[4].dispatch('click', { type: 'click' });
ck('tabs: ch5 shows 6 cells (P1 fix)', grid.children.length === 6 && String(grid.children[0].textContent) === '25', String(grid.children[0] && grid.children[0].textContent));
nav.children[0].dispatch('click', { type: 'click' });
ck('tabs: back to ch1', grid.children.length === 6 && String(grid.children[0].textContent) === '1');

// ---- helpers ----
function drawStroke(g, y, x0, x1) { // horizontal stroke, collinear moves => ink = x1-x0
  const cv = el(g, 'c');
  const ev = (x, yy) => ({ clientX: x, clientY: yy, pointerId: 1, button: 0, preventDefault() {}, type: '' });
  cv.dispatch('pointerdown', ev(x0, y));
  const step = 25, n = Math.ceil((x1 - x0) / step);
  for (let i = 1; i <= n; i++) cv.dispatch('pointermove', ev(x0 + (x1 - x0) * i / n, y));
  cv.dispatch('pointerup', ev(x1, y));
}
function inkPct(g) { return parseFloat(el(g, 'ink-bar').style.width); }
function playLevel(g, idx) { // from win overlay Next, or level cell — both already handled by caller
  void g;
}
function goAndAwait(g, frames) { clickBody(g, 'GO!'); g.pump(frames); }

// ---------- L1 mechanics ----------
grid.children[0].dispatch('click', { type: 'click' });
ck('L1: hud shown', el(g, 'hud').style.display === 'flex' && el(g, 'go-btn-wrap').style.display === 'block');
ck('L1: ink full', inkPct(g) === 100, String(inkPct(g)));
drawStroke(g, 385, 270, 320); // 50 ink
ck('L1: ink consumed', Math.abs(inkPct(g) - 90) < 0.5, String(inkPct(g))); // 1 - 50/500
clickBody(g, ''); // undo button is a hud div with onclick — reach via els
el(g, 'btn-undo').dispatch('click', { type: 'click' });
ck('L1: undo refunds ink', Math.abs(inkPct(g) - 100) < 0.5, String(inkPct(g)));
el(g, 'btn-undo').dispatch('click', { type: 'click' }); // empty undo no-op
ck('L1: undo empty no-op', Math.abs(inkPct(g) - 100) < 0.5);
// hint (persisted flag)
el(g, 'btn-hint').dispatch('click', { type: 'click' });
ck('L1: hint saved', JSON.parse(g.ls.getItem('std_v1')).hints['0'] === true, g.ls.getItem('std_v1'));
// mid-sim timer bar advances
drawStroke(g, 385, 270, 320);
goAndAwait(g, 30);
ck('L1: timer bar moving', el(g, 'timer-fill').style.width !== '0%' && el(g, 'timer-fill').style.width !== '', el(g, 'timer-fill').style.width);
g.pump(210);
ck('L1: win screen', vis(g, 'screen-win'));
ck('L1: 3 stars', String(el(g, 'win-stars').textContent) === '★ ★ ★ ', el(g, 'win-stars').textContent);
ck('L1: ink sub', String(el(g, 'win-sub').textContent) === 'Ink used: 50/500', el(g, 'win-sub').textContent);
const sv1 = JSON.parse(g.ls.getItem('std_v1'));
ck('L1: saved done+stars', sv1.done['0'] === true && sv1.stars['0'] === 3, g.ls.getItem('std_v1'));
ck('L1: next visible', el(g, 'btn-next').style.display !== 'none');

// ---------- chain L2..L30 ----------
for (let idx = 1; idx < 30; idx++) {
  ck('L' + (idx + 1) + ': next', clickBody(g, 'Next') && el(g, 'hud').style.display === 'flex');
  const plan = PLANS[idx] || [];
  if (idx === 14) { // L15: deliberate lose (vertical fire x=300 hits doge at ~0.75s unblocked)
    goAndAwait(g, 120);
    ck('L15: lose screen', vis(g, 'screen-lose') && !vis(g, 'screen-win'));
    // hint from lose screen (GS==='lose' branch)
    clickBody(g, 'Hint');
    ck('L15: hint from lose saved', JSON.parse(g.ls.getItem('std_v1')).hints['14'] === true);
    ck('L15: Try Again', clickBody(g, 'Try Again') && el(g, 'hud').style.display === 'flex' && !vis(g, 'screen-lose'));
    ck('L15: retry resets ink', Math.abs(inkPct(g) - 100) < 0.5, String(inkPct(g)));
  }
  for (const [y, x0, x1] of plan) drawStroke(g, y, x0, x1);
  goAndAwait(g, 240);
  ck('L' + (idx + 1) + ': win screen', vis(g, 'screen-win'), 'idx ' + idx);
  ck('L' + (idx + 1) + ': 3 stars', String(el(g, 'win-stars').textContent) === '★ ★ ★ ', el(g, 'win-stars').textContent);
  const ink = plan.reduce((s, p) => s + (p[2] - p[1]), 0);
  const lvInk = [500, 500, 450, 450, 400, 400, 380, 350, 350, 320, 300, 300, 350, 320, 300, 280, 270, 250, 320, 300, 280, 260, 250, 240, 280, 260, 250, 240, 220, 200][idx];
  ck('L' + (idx + 1) + ': ink sub', String(el(g, 'win-sub').textContent) === 'Ink used: ' + ink + '/' + lvInk, el(g, 'win-sub').textContent);
  const sv = JSON.parse(g.ls.getItem('std_v1'));
  ck('L' + (idx + 1) + ': saved', sv.done[String(idx)] === true && sv.stars[String(idx)] === 3);
}
// L30 (last): Next hidden
ck('L30: next hidden', el(g, 'btn-next').style.display === 'none', el(g, 'btn-next').style.display);
ck('L30: retry from win', clickBody(g, 'Retry') && el(g, 'hud').style.display === 'flex');
const svEnd = JSON.parse(g.ls.getItem('std_v1'));
ck('end: 30 done', Object.keys(svEnd.done).length === 30);
ck('end: all 3*', Object.values(svEnd.stars).every(v => v === 3));

// level select from fresh state: all unlocked + star rows
clickBody(g, ''); // no-op guard
el(g, 'btn-back').dispatch('click', { type: 'click' });
ck('end: level select', vis(g, 'screen-levels'));
ck('end: all unlocked', grid.children.every(c => c.classList.contains('unlocked')));
nav.children[0].dispatch('click', { type: 'click' }); // show ch1 to assert its star rows
const starRow = grid.children.map(c => c.children[0] && String(c.children[0].textContent));
ck('end: star rows shown', starRow.every(t => t && t.indexOf('★') >= 0), JSON.stringify(starRow));

// ---------- boot 2: seeded save ----------
const seed = { v: 1, stars: { 0: 1 }, done: { 0: true, 1: true }, ink: {}, slow: {}, hints: { 2: true }, sound: false, music: false };
const g2 = harness.bootGame('save-the-doge', { seedLS: { std_v1: JSON.stringify(seed) } });
ck('boot2: no load errors', (g2.loadErrors || []).length === 0, (g2.loadErrors || []).join(' | '));
ck('boot2: settings restored OFF', String(g2.els['snd-btn'].textContent) === 'Sound OFF', g2.els['snd-btn'].textContent);
ck('boot2: sound restored in LS', JSON.parse(g2.ls.getItem('std_v1')).sound === false);
clickBody(g2, 'Play');
const gr2 = g2.els['level-grid'];
ck('boot2: L3 unlocked (done[1])', gr2.children[2].classList.contains('unlocked'), 'cells');
ck('boot2: L4 locked', !gr2.children[3].classList.contains('unlocked'));
ck('boot2: L1 star row 1*', String(gr2.children[0].children[0].textContent) === '★☆☆', String(gr2.children[0].children[0] && gr2.children[0].children[0].textContent)); // grid star rows unspaced; win screen uses spaces
gr2.children[2].dispatch('click', { type: 'click' });
ck('boot2: L3 playable', g2.els['hud'].style.display === 'flex');
g2.els['btn-hint'].dispatch('click', { type: 'click' });
ck('boot2: hint flag already set (no double)', JSON.parse(g2.ls.getItem('std_v1')).hints['2'] === true);

ck('run: zero engine errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
ck('run: zero boot2 errors', (g2.sandbox.__errors || []).length === 0, (g2.sandbox.__errors || []).slice(0, 3).join(' | '));

const extra = { levels: 30, allSolvable: true, fixes: 'P0 win check nested inside hazard loop after !h.alive continue — clearing all hazards (good play) soft-locked every level forever; P1 chapter-tab var-capture (every tab opened ch5 empty grid, levels screen soft-locked)' };
console.log(JSON.stringify({ pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS, extra }));
process.exit(FAIL === 0 ? 0 : 1);
