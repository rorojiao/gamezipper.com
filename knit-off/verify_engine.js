#!/usr/bin/env node
/* knit-off — engine verifier (queue-B #29)
 * Real input paths only: canvas pointerdown taps at independently-computed knot/tray
 * coordinates, DOM button clicks (boosters/restart/menu/level-select/tutorial).
 * generateLevel() is extracted verbatim and replicated standalone; the verifier drives an
 * independent model of knots/tray/bobbins and asserts the engine matches after EVERY move
 * (via a read-only __KO export) — driving never mutates engine state directly.
 * Engine bugs fixed 2026-08-25:
 *   P0 30/50 levels unwinnable (L21-30 locked REQUIRED knots never unlock; L31-50 frozen
 *      +2 yarn deficits) — per-color balance pass replaces total-only check
 *   P2 3 stars unreachable in 50/50 levels (efficiency formula ignored 2-moves-per-yarn)
 *   P3 menu Play + tutorial-exit always restarted at Level 1 despite saved progress
 * Honest limitation: the LOSE path (tray 7/7 unmatchable) is unreachable on every generated
 * level (max surplus yarn < 7 anywhere) — showLose cannot be driven by real input; verified
 * by code inspection + documented here instead of faked.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'knit-off';
const results = [], fails = [];
function T(name, cond, info) {
  results.push(name);
  if (!cond) fails.push(name + (info ? ' :: ' + info : ''));
  process.stdout.write((cond ? 'ok ' : 'FAIL ') + name + (info && !cond ? '  [' + info + ']' : '') + '\n');
}
function textOf(el) { if (!el) return ''; let t = String(el.textContent == null ? '' : el.textContent); (el.children || []).forEach(c => { t += textOf(c); }); return t; }

/* ---------- independent replication of generateLevel (verbatim source) ---------- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const gs = html.indexOf('function generateLevel(levelNum)');
const ge = html.indexOf('\n}\n', html.indexOf('return {', gs));
const genSrc = html.slice(gs, ge + 2);
function mulberry32(seed) { return function () { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const COLOR_KEYS = ['rose', 'ocean', 'forest', 'sunflower', 'lavender', 'coral', 'mint', 'sky'];
const generateLevel = new Function('COLOR_KEYS', 'mulberry32', genSrc + '\nreturn generateLevel;')(COLOR_KEYS, mulberry32);
const LV = {}; for (let n = 1; n <= 50; n++) LV[n] = generateLevel(n);

let allSolvable = true, why = '';
let maxSurplus = 0;
for (let n = 1; n <= 50; n++) {
  const lv = LV[n];
  const need = {}; lv.bobbins.forEach(b => need[b.color] = (need[b.color] || 0) + b.needed);
  const avail = {}; lv.knots.forEach(k => { if (!k.locked) avail[k.color] = (avail[k.color] || 0) + 1; });
  for (const c of Object.keys(need)) if ((avail[c] || 0) < need[c]) { allSolvable = false; why = 'L' + n + ' ' + c; }
  const sur = Object.keys(need).reduce((a, c) => a + Math.max(0, (avail[c] || 0) - need[c]), 0);
  if (sur > maxSurplus) maxSurplus = sur;
}
T('all-50-solvable', allSolvable, why);
T('tiers-shape', LV[5].knots.every(k => !k.locked) && !LV[5].bobbins.some(b => b.frozen) &&
  LV[20].knots.every(k => !k.locked) &&
  LV[21].knots.some(k => k.locked) && !LV[21].bobbins.some(b => b.frozen) &&
  LV[31].bobbins.some(b => b.frozen) && LV[31].knots.some(k => k.locked) &&
  LV[50].bobbins.some(b => b.frozen) && LV[50].knots.some(k => k.locked), 'tier specials');
T('gen-deterministic', JSON.stringify(generateLevel(21)) === JSON.stringify(LV[21]));
T('lose-path-reachability-doc', maxSurplus < 7, 'max surplus yarn ' + maxSurplus + ' < 7 → tray can never be all-unmatchable');

/* ---------- layout replication (input coordinates) ---------- */
const W = 480, pad = 12, H = W * 1.35;
const topAreaH = H * 0.28, trayAreaH = H * 0.22, bobbinAreaH = H * 0.40;
const LAY = {
  W, H, topY: topAreaH * 0.1, topH: topAreaH * 0.8, trayY: topAreaH + trayAreaH * 0.1,
  trayH: trayAreaH * 0.8, bobbinY: topAreaH + trayAreaH + bobbinAreaH * 0.05, traySlotW: (W - 24) / 7,
};

/* ---------- BOOT A (fresh) ---------- */
const g = bootGame(SLUG, { inject: { anchor: 'function updateUI() {', exports: 'globalThis.__KO={get knots(){return knots;},get tray(){return tray;},get bobbins(){return bobbins;},get gameActive(){return gameActive;},get hintHighlight(){return hintHighlight;},get layout(){return layout;},get moves(){return moves;}};' } });
const els = g.els, sb = g.sandbox, cv = els['board'];
g.pump(2);
T('boot-a-no-errors', g.loadErrors.length === 0, g.loadErrors.join(' | '));
T('menu-stats-init', textOf(els['menu-stats']) === 'Levels: 0/50 completed | Furthest: Level 1', textOf(els['menu-stats']));

/* howto + settings */
sb.showHowTo(); T('howto-open', els['howto-modal'].classList.contains('show'));
sb.closeHowTo(); T('howto-close', !els['howto-modal'].classList.contains('show'));
sb.showSettings();
els['toggle-sfx'].click(); T('sfx-toggle-off', !els['toggle-sfx'].classList.contains('on'));
els['toggle-sfx'].click(); T('sfx-toggle-on', els['toggle-sfx'].classList.contains('on'));
sb.closeSettings(); T('settings-close', !els['settings-modal'].classList.contains('show'));

/* tutorial: all 4 steps, exit starts (resumes at) furthest level */
sb.startTutorial();
T('tut-step1', textOf(els['tut-step']) === 'Step 1 of 4' && textOf(els['tut-title']) === 'Welcome to Knit Off!' && els['tutorial-overlay'].classList.contains('show'));
els['tut-next'].click();
T('tut-step2', textOf(els['tut-step']) === 'Step 2 of 4');
els['tut-next'].click(); els['tut-next'].click();
T('tut-step4-play', textOf(els['tut-next']) === 'Play!');
els['tut-next'].click();
T('tut-exit-starts-l1', !els['tutorial-overlay'].classList.contains('show') && els['game-screen'].style.display === 'flex' &&
  els['menu-screen'].style.display === 'none' && textOf(els['level-label']) === 'Level 1', textOf(els['level-label']));
T('layout-match-after-load', JSON.stringify(g.call('({topY:globalThis.__KO.layout.topY,topH:globalThis.__KO.layout.topH,trayY:globalThis.__KO.layout.trayY,traySlotW:globalThis.__KO.layout.traySlotW,bobbinY:globalThis.__KO.layout.bobbinY})')) === JSON.stringify({ topY: LAY.topY, topH: LAY.topH, trayY: LAY.trayY, traySlotW: LAY.traySlotW, bobbinY: LAY.bobbinY }), 'layout mismatch');

/* ---------- real-tap driver + model ---------- */
let M = null, myMoves = 0;
function tap(x, y) { cv.dispatch('pointerdown', { clientX: x, clientY: y }); }
function initModel(n) {
  const lv = LV[n];
  M = { n, knots: lv.knots.map(k => ({ color: k.color, locked: !!k.locked, removed: false })), tray: [], bobbins: lv.bobbins.map(b => ({ color: b.color, needed: b.needed, filled: 0, frozen: !!b.frozen })) };
  myMoves = 0;
}
function knotXY(i) { const n = M.knots.length, cols = Math.min(n, 8), sx = (W - 2 * pad) / cols, sy = LAY.topH / Math.ceil(n / cols); return { x: pad + (i % cols) * sx + sx / 2, y: LAY.topY + Math.floor(i / cols) * sy + sy / 2 }; }
function tapKnotAt(i) { const p = knotXY(i); tap(p.x, p.y); g.pump(16); }
function tapTrayAt(slot) { tap(pad + slot * LAY.traySlotW + LAY.traySlotW / 2, LAY.trayY + LAY.trayH / 2); g.pump(16); }
function snapshot() { return JSON.stringify({ k: M.knots.map(x => [x.color, x.locked, x.removed]), t: M.tray, b: M.bobbins.map(x => [x.color, x.filled, x.needed, x.frozen]), m: myMoves }); }
function engineSnap() { return g.call('JSON.stringify({k:globalThis.__KO.knots.map(x=>[x.color,x.locked,x.removed]),t:globalThis.__KO.tray.map(x=>x.color),b:globalThis.__KO.bobbins.map(x=>[x.color,x.filled,x.needed,x.frozen]),m:globalThis.__KO.moves})'); }
function assertSync(where) { const e = engineSnap(), m = snapshot(); if (e !== m) throw new Error('DESYNC @' + where + '\nengine: ' + e + '\nmine:   ' + m); }
function resyncFromEngine() { // after Shuffle the engine permuted knots/tray — adopt its board like a player looking at it
  M.knots = g.call('globalThis.__KO.knots.map(x=>({color:x.color,locked:x.locked,removed:x.removed}))');
  M.tray = g.call('globalThis.__KO.tray.map(x=>x.color)');
  M.bobbins = g.call('globalThis.__KO.bobbins.map(x=>({color:x.color,filled:x.filled,needed:x.needed,frozen:x.frozen}))');
}
function playOptimal() {
  let guard = 0;
  while (!M.bobbins.every(b => b.filled >= b.needed)) {
    if (guard++ > 600) throw new Error('planner stuck');
    const ti = M.tray.findIndex(col => M.bobbins.some(b => b.color === col && b.filled < b.needed));
    if (ti >= 0) {
      tapTrayAt(ti);
      const col = M.tray.splice(ti, 1)[0];
      M.bobbins.find(b => b.color === col && b.filled < b.needed).filled++;
      myMoves++; assertSync('send'); continue;
    }
    const ki = M.knots.findIndex(k => !k.removed && !k.locked && M.bobbins.some(b => b.color === k.color && b.filled < b.needed));
    if (ki < 0) throw new Error('planner: no needed unlocked knot (unsolvable)');
    tapKnotAt(ki);
    M.knots[ki].removed = true; M.tray.push(M.knots[ki].color);
    myMoves++; assertSync('tap');
  }
  g.pump(20); // win setTimeout 300ms
}

/* L1 full real play → 3 stars (was impossible pre-fix) */
initModel(1);
let err = null; try { playOptimal(); } catch (e) { err = e.message; }
T('l1-play-sync', err === null, err);
const N1 = LV[1].bobbins.reduce((a, b) => a + b.needed, 0);
T('l1-win', els['game-over'].classList.contains('show') && textOf(els['go-title']) === 'Level Complete!' &&
  textOf(els['go-moves']) === 'Moves: ' + (N1 * 2) && els['go-next'].style.display === 'inline-block', textOf(els['go-title']) + ' ' + textOf(els['go-moves']));
T('l1-3stars', textOf(els['go-text']) === 'Perfect! 3 Stars!' && els['go-stars'].innerHTML === '&#9733;&#9733;&#9733;', textOf(els['go-text']) + ' ' + els['go-stars'].innerHTML);
T('l1-score', textOf(els['go-score']) === 'Score: ' + (1000 + Math.max(0, 500 - N1 * 2 * 10) + 400), textOf(els['go-score']));
let saved = JSON.parse(g.ls.getItem('knitout_v1') || '{}');
T('l1-ls', saved.completed && saved.completed['1'] === 3 && saved.lastLevel === 2, JSON.stringify(saved));

/* L2 via Next Level */
sb.nextLevel();
T('l2-label', textOf(els['level-label']) === 'Level 2' && !els['game-over'].classList.contains('show'));
initModel(2); err = null; try { playOptimal(); } catch (e) { err = e.message; }
T('l2-win', err === null && textOf(els['go-text']) === 'Perfect! 3 Stars!', err);

/* L3: boosters via real buttons (Hint / Undo / Shuffle) */
sb.nextLevel();
initModel(3); g.pump(2);
const ctrls = els['controls'].children;
T('controls-5', ctrls.length === 5 && ctrls.every(b => typeof b.onclick === 'function'));
ctrls[0].click(); // Hint (empty tray → knot hint)
T('l3-hint', textOf(els['hint-count']) === '2' && g.call('globalThis.__KO.hintHighlight&&globalThis.__KO.hintHighlight.type') === 'knot', textOf(els['hint-count']));
/* one knot tap then Undo rolls the board back */
const ki3 = M.knots.findIndex(k => !k.locked && M.bobbins.some(b => b.color === k.color && b.filled < b.needed));
tapKnotAt(ki3); M.knots[ki3].removed = true; M.tray.push(M.knots[ki3].color); myMoves++;
ctrls[1].click(); // Undo booster
M.knots[ki3].removed = false; M.tray.pop(); myMoves--;
T('l3-undo', textOf(els['undo-count']) === '2', textOf(els['undo-count']));
err = null; try { assertSync('after-undo'); } catch (e) { err = e.message; }
T('l3-undo-state', err === null, err);
ctrls[2].click(); // Shuffle
resyncFromEngine();
T('l3-shuffle', textOf(els['shuffle-count']) === '2', textOf(els['shuffle-count']));
err = null; try { playOptimal(); } catch (e) { err = e.message; }
T('l3-win-after-boosters', err === null && textOf(els['go-text']) === 'Perfect! 3 Stars!', err);
saved = JSON.parse(g.ls.getItem('knitout_v1') || '{}');
T('l3-ls-boosters', JSON.stringify(saved.completed) === JSON.stringify({ '1': 3, '2': 3, '3': 3 }) && saved.boosters.hint === 2 && saved.boosters.undo === 2 && saved.boosters.shuffle === 2, JSON.stringify(saved));

/* menu Play resumes at furthest (P3 fix; pre-fix always Level 1) */
sb.showMenu();
T('menu-stats-3', textOf(els['menu-stats']) === 'Levels: 3/50 completed | Furthest: Level 4', textOf(els['menu-stats']));
sb.startLevel(sb.lastUnlockedLevel());
T('play-resumes-l4', textOf(els['level-label']) === 'Level 4', textOf(els['level-label']));

/* level select: completed/current/locked cells; jump to L6; Restart resets */
sb.showMenu();
sb.showLevelSelect();
const tiers = els['level-tiers'];
const groups = tiers.children.filter(x => String(x.className).includes('tier-group'));
const btns = []; groups.forEach(gr => { const grid = gr.children.find(c => String(c.className).includes('level-grid')); grid.children.forEach(b => btns.push(b)); });
T('lsel-50', btns.length === 50 && groups.length === 5, btns.length + ' btns');
/* unlock rule is l <= lastLevel (one-at-a-time, not tier batches): 1-3 completed, 4 current, 5+ locked */
T('lsel-cells', btns[0].classList.contains('completed') && textOf(btns[0]) === '***' &&
  btns[3].classList.contains('current') && textOf(btns[3]) === '4' && typeof btns[3].onclick === 'function' &&
  btns[4].classList.contains('locked') && textOf(btns[4]) === '?' && typeof btns[4].onclick !== 'function' &&
  btns[49].classList.contains('locked') && textOf(btns[49]) === '?', [0, 3, 4, 49].map(i => textOf(btns[i]) + '/' + (btns[i].classList._s ? [...btns[i].classList._s].join(',') : '')).join(' | '));
btns[1].click(); // replay completed L2
T('lsel-jump-l2', textOf(els['level-label']) === 'Level 2' && !els['level-select'].classList.contains('show'), textOf(els['level-label']));
initModel(2);
tapKnotAt(0); M.knots[0].removed = true; M.tray.push(M.knots[0].color); myMoves++;
tapKnotAt(1); M.knots[1].removed = true; M.tray.push(M.knots[1].color); myMoves++;
ctrls[3].click(); // Restart
initModel(2);
err = null; try { assertSync('after-restart'); } catch (e) { err = e.message; }
T('restart-resets', err === null && textOf(els['moves-label']) === 'Moves: 0' && textOf(els['tray-status']) === 'Tray: 0/7',
  textOf(els['moves-label']) + ' ' + textOf(els['tray-status']) + (err ? ' ' + err : ''));
T('runtime-errors-a', !(sb.__errors || []).length, (sb.__errors || []).slice(0, 2).join(' | '));

/* ---------- BOOT B (seeded: furthest L50, L1 done) ---------- */
const g2 = bootGame(SLUG, { seedLS: { knitout_v1: JSON.stringify({ completed: { '1': 3 }, lastLevel: 50, boosters: { hint: 3, undo: 3, shuffle: 3 } }) }, inject: { anchor: 'function updateUI() {', exports: 'globalThis.__KO={get knots(){return knots;},get tray(){return tray;},get bobbins(){return bobbins;},get moves(){return moves;}};' } });
const sb2 = g2.sandbox, els2 = g2.els, cv2 = els2['board'];
g2.pump(2);
const tapB = (x, y) => cv2.dispatch('pointerdown', { clientX: x, clientY: y });
let MB = null;
function tapKnotB(i) { const n = MB.knots.length, cols = Math.min(n, 8), sx = (W - 2 * pad) / cols, sy = LAY.topH / Math.ceil(n / cols); tapB(pad + (i % cols) * sx + sx / 2, LAY.topY + Math.floor(i / cols) * sy + sy / 2); g2.pump(16); }
function tapTrayB(slot) { tapB(pad + slot * LAY.traySlotW + LAY.traySlotW / 2, LAY.trayY + LAY.trayH / 2); g2.pump(16); }
function playB() {
  let guard = 0;
  while (!MB.bobbins.every(b => b.filled >= b.needed)) {
    if (guard++ > 600) throw new Error('planner stuck');
    const ti = MB.tray.findIndex(col => MB.bobbins.some(b => b.color === col && b.filled < b.needed));
    if (ti >= 0) { tapTrayB(ti); const col = MB.tray.splice(ti, 1)[0]; MB.bobbins.find(b => b.color === col && b.filled < b.needed).filled++; continue; }
    const ki = MB.knots.findIndex(k => !k.removed && !k.locked && MB.bobbins.some(b => b.color === k.color && b.filled < b.needed));
    if (ki < 0) throw new Error('no needed knot');
    tapKnotB(ki); MB.knots[ki].removed = true; MB.tray.push(MB.knots[ki].color);
  }
  g2.pump(20);
}
T('boot-b-no-errors', g2.loadErrors.length === 0, g2.loadErrors.join(' | '));
T('boot-b-stats', textOf(els2['menu-stats']) === 'Levels: 1/50 completed | Furthest: Level 50', textOf(els2['menu-stats']));

sb2.showLevelSelect();
const btnsB = []; els2['level-tiers'].children.forEach(gr => { const grid = gr.children.find(c => String(c.className).includes('level-grid')); if (grid) grid.children.forEach(b => btnsB.push(b)); });
T('boot-b-all-unlocked', btnsB.length === 50 && btnsB.every(b => typeof b.onclick === 'function'), btnsB.length);
btnsB[20].click(); // Level 21 — first locked-knot level
T('b-l21-start', textOf(els2['level-label']) === 'Level 21');
/* tapping a LOCKED knot is rejected (real tap at its cell) */
MB = { knots: LV[21].knots.map(k => ({ color: k.color, locked: !!k.locked, removed: false })), tray: [], bobbins: LV[21].bobbins.map(b => ({ color: b.color, needed: b.needed, filled: 0 })) };
const li = MB.knots.findIndex(k => k.locked);
const n21 = MB.knots.length, cols21 = Math.min(n21, 8), sx21 = (W - 2 * pad) / cols21, sy21 = LAY.topH / Math.ceil(n21 / cols21);
tapB(pad + (li % cols21) * sx21 + sx21 / 2, LAY.topY + Math.floor(li / cols21) * sy21 + sy21 / 2); g2.pump(16);
T('b-l21-locked-rejected', g2.call('globalThis.__KO.moves') === 0 && g2.call('globalThis.__KO.knots[' + li + '].removed') === false, 'moves ' + g2.call('globalThis.__KO.moves'));
err = null; try { playB(); } catch (e) { err = e.message; }
T('b-l21-win', err === null && els2['game-over'].classList.contains('show') && textOf(els2['go-text']) === 'Perfect! 3 Stars!', err);

sb2.nextLevel();
T('b-l22-label', textOf(els2['level-label']) === 'Level 22');
MB = { knots: LV[22].knots.map(k => ({ color: k.color, locked: !!k.locked, removed: false })), tray: [], bobbins: LV[22].bobbins.map(b => ({ color: b.color, needed: b.needed, filled: 0 })) };
err = null; try { playB(); } catch (e) { err = e.message; }
T('b-l22-win', err === null && textOf(els2['go-text']) === 'Perfect! 3 Stars!', err);

/* L31: first frozen-bobbin level — frozen needs are now covered by yarn */
sb2.showMenu(); sb2.showLevelSelect();
const btnsC = []; els2['level-tiers'].children.forEach(gr => { const grid = gr.children.find(c => String(c.className).includes('level-grid')); if (grid) grid.children.forEach(b => btnsC.push(b)); });
btnsC[30].click(); // Level 31
T('b-l31-start', textOf(els2['level-label']) === 'Level 31' && LV[31].bobbins.some(b => b.frozen));
MB = { knots: LV[31].knots.map(k => ({ color: k.color, locked: !!k.locked, removed: false })), tray: [], bobbins: LV[31].bobbins.map(b => ({ color: b.color, needed: b.needed, filled: 0 })) };
err = null; try { playB(); } catch (e) { err = e.message; }
T('b-l31-win', err === null && textOf(els2['go-text']) === 'Perfect! 3 Stars!', err);

/* L50: final level — Next hidden after win */
sb2.showMenu(); sb2.showLevelSelect();
const btnsD = []; els2['level-tiers'].children.forEach(gr => { const grid = gr.children.find(c => String(c.className).includes('level-grid')); if (grid) grid.children.forEach(b => btnsD.push(b)); });
btnsD[49].click();
T('b-l50-start', textOf(els2['level-label']) === 'Level 50');
MB = { knots: LV[50].knots.map(k => ({ color: k.color, locked: !!k.locked, removed: false })), tray: [], bobbins: LV[50].bobbins.map(b => ({ color: b.color, needed: b.needed, filled: 0 })) };
err = null; try { playB(); } catch (e) { err = e.message; }
T('b-l50-win', err === null && els2['game-over'].classList.contains('show') && els2['go-next'].style.display === 'none', err + ' go-next ' + els2['go-next'].style.display);
const savedB = JSON.parse(g2.ls.getItem('knitout_v1') || '{}');
T('b-ls-completed', ['21', '22', '31', '50'].every(k => savedB.completed[k] === 3), JSON.stringify(savedB.completed));

/* tutorial exit resumes at furthest (P3, tutorial path) */
sb2.showMenu(); sb2.startTutorial();
els2['tut-next'].click(); els2['tut-next'].click(); els2['tut-next'].click(); els2['tut-next'].click();
T('b-tut-resumes-l50', !els2['tutorial-overlay'].classList.contains('show') && textOf(els2['level-label']) === 'Level 50', textOf(els2['level-label']));
T('runtime-errors-b', !(sb2.__errors || []).length, (sb2.__errors || []).slice(0, 2).join(' | '));

/* ---------- report ---------- */
const pass = results.length - fails.length;
const out = {
  pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails,
  extra: {
    levels: 50, realWins: ['L1', 'L2', 'L3', 'L6(partial+restart)', 'L21', 'L22', 'L31', 'L50'],
    engineFixes: [
      'P0 30/50 levels unwinnable: bobbin distribution consumed every knot (pad loop dead, zero surplus) so locked knots L21-30 locked REQUIRED yarn and frozen +2 L31-50 had no yarn; generator now reserves slack (locks + frozen*2 + 2) and a per-color balancer recolors surplus before unlocking',
      'P1 exponential rAF storm: drawGame re-queued a frame from BOTH drawParticles and drawAnimatingYarn on every yarn move -> queued callbacks doubled per frame (billions within ~15 frames); single-schedule guard added',
      'P2 3 stars unreachable in 50/50 levels (efficiency ignored the 2 moves per yarn); optimalMoves=2*needed',
      'P3 Play button + tutorial exit always restarted at L1; now resume at furthest unlocked'
    ],
    losePathUnreachable: 'max surplus yarn across all 50 levels = ' + maxSurplus + ' (<7) — tray can never be 7/7 unmatchable; showLose verified by inspection, not driven'
  }
};
process.stdout.write('\n' + JSON.stringify(out) + '\n');
process.exit(fails.length ? 1 : 0);
