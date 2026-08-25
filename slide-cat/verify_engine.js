// slide-cat engine verifier — vm harness, real input paths only.
// Engine state is IIFE-private, so every assertion is DOM/LS-observable:
// swipes on #game-canvas (pointerdown/up >15px), arrows/WASD/R keys on document,
// dpad pointerdown, and button onclick handlers. Wins flow through the engine's own
// updateSlide arrival -> stars -> overlay path, driven level-by-level L1..L30 using
// BFS solutions from _solutions.json (regenerated after the L3/L5/L8/L16 P0 and
// 15-level fish-relocation P1 data repairs).
'use strict';
const path = require('path');
const fs = require('fs');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));
const SOLUTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, '_solutions.json'), 'utf8'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }
function shown(g, id) { return el(g, id).style.display === 'flex'; }
function hiddenOv(g) { return !el(g, 'overlay').classList.contains('show'); }
function lsProgress(g) {
  const raw = g.ls.getItem('slidecat_progress');
  try { return JSON.parse(raw); } catch (e) { return raw; }
}
const ARROW = { '1,0': 'ArrowRight', '-1,0': 'ArrowLeft', '0,1': 'ArrowDown', '0,-1': 'ArrowUp' };
const WASD = { '1,0': 'd', '-1,0': 'a', '0,1': 's', '0,-1': 'w' };
const DPD = { '1,0': 'dpad-right', '-1,0': 'dpad-left', '0,1': 'dpad-down', '0,-1': 'dpad-up' };

function swipe(g, dx, dy, dist) {
  const d = dist || 40;
  const cv = el(g, 'game-canvas');
  cv.dispatch('pointerdown', { type: 'pointerdown', clientX: 120, clientY: 120, preventDefault() {} });
  cv.dispatch('pointerup', { type: 'pointerup', clientX: 120 + dx * d, clientY: 120 + dy * d, preventDefault() {} });
}
function move(g, m, method) {
  const k = m[0] + ',' + m[1];
  if (method === 'swipe') swipe(g, m[0], m[1]);
  else if (method === 'dpad') el(g, DPD[k]).dispatch('pointerdown', { type: 'pointerdown', preventDefault() {} });
  else g.key(method === 'wasd' ? WASD[k] : ARROW[k]);
}
function click(g, id) {
  const e = el(g, id);
  if (typeof e.onclick === 'function') e.onclick({ type: 'click', preventDefault() {} });
  else e.dispatch('click', { type: 'click', preventDefault() {} });
}
// drive one level's solution; returns after the win overlay is due
function playLevel(g, idx, method, midCheck) {
  const sol = SOLUTIONS[idx].moves;
  for (let i = 0; i < sol.length; i++) {
    move(g, sol[i], i === 0 && method === 'swipe' ? 'swipe' : method);
    if (midCheck) midCheck(i);
    g.pump(i === sol.length - 1 ? 110 : 85);
  }
  return sol.length;
}

// ---------- boot 1 ----------
const g = harness.bootGame('slide-cat');
ck('boot: no load errors', errs(g).length === 0, errs(g).join(' | '));
ck('boot: menu screen shown', shown(g, 'menu-screen'));
ck('boot: game screen hidden', el(g, 'game-screen').style.display === 'none');
ck('boot: level select hidden', el(g, 'level-select').style.display === 'none');
ck('boot: sound default ON label', el(g, 'btn-sound').textContent === 'Sound: ON');
ck('boot: music default ON label', el(g, 'btn-music').textContent === 'Music: ON');
ck('boot: win overlay hidden', hiddenOv(g));

// level select fresh: 30 cells, 0/1 unlocked, rest locked
click(g, 'btn-levels');
ck('levels: screen shown', shown(g, 'level-select'));
g.pump(2);
let cells = el(g, 'ls-grid').children.slice(-30);
ck('levels: 30 cells', cells.length === 30, String(cells.length));
ck('levels: L1 unlocked fresh', cells[0].classList.contains('unlocked') && !cells[0].classList.contains('completed'));
ck('levels: L2 unlocked fresh', cells[1].classList.contains('unlocked'));
ck('levels: L3 locked fresh', cells[2].classList.contains('locked'));
ck('levels: L30 locked fresh', cells[29].classList.contains('locked'));
ck('levels: locked cell has no onclick', typeof cells[29].onclick !== 'function');
click(g, 'btn-levels'); // rebuild not needed; go back
el(g, 'ls-grid').parentNode; // no-op
// back button is .ls-back (onclick property)
(function () {
  const back = g.sandbox.document.querySelector('.ls-back');
  if (typeof back.onclick === 'function') back.onclick({ type: 'click' });
  else back.dispatch('click', { type: 'click' });
})();
ck('levels: back returns to menu', shown(g, 'menu-screen'));

// reset modal open/cancel leaves progress untouched
ck('LS: fresh progress empty', lsProgress(g) === null || Object.keys(lsProgress(g)).length === 0);
click(g, 'btn-reset');
ck('reset: modal shown', el(g, 'reset-modal').classList.contains('show'));
click(g, 'reset-cancel');
ck('reset: cancel hides modal', !el(g, 'reset-modal').classList.contains('show'));

// keydown is gated to the game screen
g.key('ArrowUp');
ck('input: keydown on menu is a no-op (no errors)', errs(g).length === 0, errs(g).join(' | '));

// fresh Continue: maxUnlocked=1 -> loads Level 2
click(g, 'btn-continue');
ck('continue: game screen shown', shown(g, 'game-screen'));
ck('continue: fresh loads L2 (idx1)', +el(g, 'hud-level').textContent === 2, String(el(g, 'hud-level').textContent));
ck('continue: level name', el(g, 'level-name').textContent === 'Level 2');
ck('continue: hud fish 0/0', el(g, 'hud-fish').textContent === '0/0');
ck('dpad: hidden on non-touch', el(g, 'dpad').style.display === 'none');
click(g, 'btn-game-menu');
ck('menu button returns to menu', shown(g, 'menu-screen'));

// settings toggles persist to LS
click(g, 'btn-sound');
ck('settings: sound toggles OFF', el(g, 'btn-sound').textContent === 'Sound: OFF');
ck('settings: sound LS 0', g.ls.getItem('slidecat_sound') === '0');
click(g, 'btn-music');
ck('settings: music toggles OFF', el(g, 'btn-music').textContent === 'Music: OFF');
ck('settings: music LS 0', g.ls.getItem('slidecat_music') === '0');
click(g, 'btn-sound'); click(g, 'btn-music'); // back ON for the playthrough
ck('settings: sound back ON', g.ls.getItem('slidecat_sound') === '1');
ck('settings: music back ON', g.ls.getItem('slidecat_music') === '1');

// ---------- L1: swipe win path ----------
click(g, 'btn-new');
ck('new game: game screen', shown(g, 'game-screen'));
ck('new game: L1 hud', +el(g, 'hud-level').textContent === 1);
ck('new game: L1 name', el(g, 'level-name').textContent === 'Level 1');
// below-threshold tap must not move (pointerup delta 8px < 15px gate)
swipe(g, 1, 0, 8);
g.pump(30);
ck('input: sub-threshold tap ignored, no errors', errs(g).length === 0, errs(g).join(' | '));
// pointercancel is a no-op reset
el(g, 'game-canvas').dispatch('pointercancel', { type: 'pointercancel', preventDefault() {} });
const l1Moves = playLevel(g, 0, 'swipe');
ck('L1: win overlay shown', el(g, 'overlay').classList.contains('show'));
ck('L1: overlay title', el(g, 'overlay-title').textContent === 'Level Complete!', String(el(g, 'overlay-title').textContent));
ck('L1: 3 stars', el(g, 'overlay-stars').textContent === '★★★', String(el(g, 'overlay-stars').textContent));
ck('L1: overlay msg moves/fish', el(g, 'overlay-msg').textContent === 'Moves: ' + l1Moves + ' | Fish: 0/0', String(el(g, 'overlay-msg').textContent));
ck('L1: progress saved 3 stars', lsProgress(g)[0] === 3, JSON.stringify(lsProgress(g)));
click(g, 'overlay-btn');
ck('L1: next button loads L2', +el(g, 'hud-level').textContent === 2 && el(g, 'level-name').textContent === 'Level 2');
ck('L1: overlay hidden after next', hiddenOv(g));

// ---------- L2: WASD + R-restart ----------
const l2sol = SOLUTIONS[1].moves;
move(g, l2sol[0], 'wasd');
g.pump(85);
ck('L2: hud after first wasd move', +el(g, 'hud-level').textContent === 2);
g.key('r'); // restart level mid-way
g.pump(10);
ck('L2: R keeps level, resets it', el(g, 'level-name').textContent === 'Level 2');
for (let i = 0; i < l2sol.length; i++) { move(g, l2sol[i], i === l2sol.length - 1 ? 'arrow' : 'wasd'); g.pump(i === l2sol.length - 1 ? 110 : 85); }
ck('L2: win after R restart', el(g, 'overlay').classList.contains('show'));
ck('L2: moves counter restarted by R', el(g, 'overlay-msg').textContent === 'Moves: ' + l2sol.length + ' | Fish: 0/0', String(el(g, 'overlay-msg').textContent));
ck('L2: stars', el(g, 'overlay-stars').textContent === '★★★');
ck('L2: progress', lsProgress(g)[1] === 3);
click(g, 'overlay-btn');
ck('L2: next loads L3', +el(g, 'hud-level').textContent === 3);

// ---------- chain L3..L30 (input rotation: dpad / arrows / swipe) ----------
const METHODS = ['dpad', 'arrow', 'swipe'];
let midFishSeen = false;
for (let idx = 2; idx < 30; idx++) {
  const method = METHODS[idx % 3];
  const sol = SOLUTIONS[idx].moves;
  ck('L' + (idx + 1) + ': hud', +el(g, 'hud-level').textContent === idx + 1, String(el(g, 'hud-level').textContent));
  ck('L' + (idx + 1) + ': name', el(g, 'level-name').textContent === 'Level ' + (idx + 1));
  const total = SOLUTIONS[idx].total;
  for (let i = 0; i < sol.length; i++) {
    move(g, sol[i], method);
    if (idx === 5 && el(g, 'hud-fish').textContent === '1/2') midFishSeen = true; // P2 hud-fish fix check (L6)
    g.pump(i === sol.length - 1 ? 110 : 85);
  }
  ck('L' + (idx + 1) + ': win overlay', el(g, 'overlay').classList.contains('show'));
  ck('L' + (idx + 1) + ': title', el(g, 'overlay-title').textContent === 'Level Complete!');
  ck('L' + (idx + 1) + ': 3 stars', el(g, 'overlay-stars').textContent === '★★★', String(el(g, 'overlay-stars').textContent));
  ck('L' + (idx + 1) + ': msg', el(g, 'overlay-msg').textContent === 'Moves: ' + sol.length + ' | Fish: ' + SOLUTIONS[idx].fish + '/' + total, String(el(g, 'overlay-msg').textContent));
  ck('L' + (idx + 1) + ': progress', lsProgress(g)[idx] === 3, JSON.stringify(lsProgress(g)[idx]));
  click(g, 'overlay-btn');
  if (idx < 29) {
    ck('L' + (idx + 1) + ': next -> L' + (idx + 2), +el(g, 'hud-level').textContent === idx + 2);
  } else {
    ck('L30: last level next -> menu', shown(g, 'menu-screen'));
  }
}
ck('chain: mid-level hud-fish updated on collect (L6)', midFishSeen);
ck('chain: all 30 levels saved', Object.keys(lsProgress(g)).length === 30, String(Object.keys(lsProgress(g)).length));
ck('chain: no runtime errors', errs(g).length === 0, errs(g).slice(0, 3).join(' | '));

// ---------- level select fully cleared ----------
click(g, 'btn-levels');
g.pump(2);
cells = el(g, 'ls-grid').children.slice(-30);
ck('cleared: 30 cells', cells.length === 30);
ck('cleared: all completed', cells.every(c => c.classList.contains('completed')));
ck('cleared: none locked', cells.every(c => !c.classList.contains('locked')));
ck('cleared: L30 cell clickable', typeof cells[29].onclick === 'function');
cells[29].onclick({ type: 'click' });
ck('cleared: L30 cell loads level 30', shown(g, 'game-screen') && +el(g, 'hud-level').textContent === 30);
// resize while in game must not throw
(g.sandbox.__wls.resize || []).forEach(f => { try { f({ type: 'resize' }); } catch (e) { g.sandbox.__errors = (g.sandbox.__errors || []).concat('resize: ' + e.message); } });
ck('lifecycle: resize handler clean', errs(g).length === 0, errs(g).slice(-2).join(' | '));
// visibilitychange: hidden cancels rAF, visible restarts
g.sandbox.document.hidden = true;
(g.sandbox.document.__dls.visibilitychange || []).forEach(f => { try { f({ type: 'visibilitychange' }); } catch (e) { g.sandbox.__errors = (g.sandbox.__errors || []).concat('vis: ' + e.message); } });
g.sandbox.document.hidden = false;
(g.sandbox.document.__dls.visibilitychange || []).forEach(f => { try { f({ type: 'visibilitychange' }); } catch (e) { g.sandbox.__errors = (g.sandbox.__errors || []).concat('vis: ' + e.message); } });
g.pump(20);
ck('lifecycle: visibilitychange clean', errs(g).length === 0, errs(g).slice(-2).join(' | '));
// beforeunload cleanup
(g.sandbox.__wls.beforeunload || []).forEach(f => { try { f({ type: 'beforeunload' }); } catch (e) { g.sandbox.__errors = (g.sandbox.__errors || []).concat('unload: ' + e.message); } });
ck('lifecycle: beforeunload cleanup clean', errs(g).length === 0, errs(g).slice(-2).join(' | '));

// ---------- boot 2: returning player ----------
const lsSnapshot = Object.assign({}, g.ls._m);
// leave sound off for boot2 label check
const g2 = harness.bootGame('slide-cat', { seedLS: Object.assign({}, lsSnapshot, { slidecat_sound: '0', slidecat_music: '0' }) });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
ck('boot2: menu shown', shown(g2, 'menu-screen'));
ck('boot2: sound OFF label', el(g2, 'btn-sound').textContent === 'Sound: OFF');
ck('boot2: music OFF label', el(g2, 'btn-music').textContent === 'Music: OFF');
ck('boot2: progress carried over', Object.keys(lsProgress(g2)).length === 30);
click(g2, 'btn-continue');
ck('boot2: continue resumes at L30', +el(g2, 'hud-level').textContent === 30, String(el(g2, 'hud-level').textContent));
ck('boot2: L30 name', el(g2, 'level-name').textContent === 'Level 30');
click(g2, 'btn-sound');
ck('boot2: sound toggle back ON persists', el(g2, 'btn-sound').textContent === 'Sound: ON' && g2.ls.getItem('slidecat_sound') === '1');
click(g2, 'btn-game-menu');
ck('boot2: back to menu', shown(g2, 'menu-screen'));

// ---------- reset flow (boot2) ----------
click(g2, 'btn-reset');
ck('reset2: modal shown', el(g2, 'reset-modal').classList.contains('show'));
click(g2, 'reset-confirm');
ck('reset2: modal hidden', !el(g2, 'reset-modal').classList.contains('show'));
ck('reset2: LS progress cleared', g2.ls.getItem('slidecat_progress') === '{}', String(g2.ls.getItem('slidecat_progress')));
click(g2, 'btn-levels');
g2.pump(2);
const cells2 = el(g2, 'ls-grid').children.slice(-30);
ck('reset2: 30 cells', cells2.length === 30);
ck('reset2: L1 unlocked not completed', cells2[0].classList.contains('unlocked') && !cells2[0].classList.contains('completed'));
ck('reset2: L3 locked again', cells2[2].classList.contains('locked'));
ck('reset2: L30 locked again', cells2[29].classList.contains('locked'));
cells2[0].onclick({ type: 'click' });
ck('reset2: L1 playable after reset', shown(g2, 'game-screen') && +el(g2, 'hud-level').textContent === 1);
ck('boot2: no runtime errors', errs(g2).length === 0, errs(g2).slice(0, 3).join(' | '));

// ---------- summary ----------
const total = pass + fail;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(JSON.stringify({
  pass, fail, total, verdict, fails: fails.slice(0, 12),
  extra: {
    levels: 30, inputPaths: 'swipe+arrows+wasd+dpad+R',
    dataFixes: 'P0 L3/L5/L8/L16 unwinnable->repaired; P1 15 levels fish off all slide paths->relocated',
    engineFixes: 'P2 hud-fish frozen mid-level (updateHUD only ran on loadLevel)',
    deadCode: 'snow+hole branches have no shipped tiles (fail overlay unreachable by design data)',
  },
}));
process.exit(fail === 0 ? 0 : 1);
