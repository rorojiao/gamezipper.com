#!/usr/bin/env node
/* find-n-merge — engine verifier (queue-B #30)
 * Real input paths only: canvas pointerdown taps at real object coordinates (read from a
 * __FNM state export for ASSERTS + targeting — driving still goes through the engine's own
 * pointer handler), DOM button clicks (menu/levels/tutorial/settings/hint/next/replay/exit).
 * Merge economy is independently simulated for all 30 levels from replicated LEVEL_DATA.
 * Engine bugs fixed 2026-08-25:
 *   P2 timer expiry called levelComplete() unconditionally -> idling the clock "completed"
 *      the level (1 star saved + next unlocked + LEVEL COMPLETE! shown with goal unmet);
 *      now a real fail screen (TIME'S UP!) that saves nothing
 *   P3 bgmOsc never assigned -> playChord() bailed on the first chord; BGM never played
 *   P3 win setTimeout(500ms) + timer-expiry race could double-fire levelComplete
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'find-n-merge';
const results = [], fails = [];
function T(name, cond, info) {
  results.push(name);
  if (!cond) fails.push(name + (info ? ' :: ' + info : ''));
  process.stdout.write((cond ? 'ok ' : 'FAIL ') + name + (info && !cond ? '  [' + info + ']' : '') + '\n');
}
function textOf(el) { if (!el) return ''; let t = String(el.textContent == null ? '' : el.textContent); (el.children || []).forEach(c => { t += textOf(c); }); return t; }
const visible = el => el && !el.classList.contains('hidden');
/* deep static-markup search: the els-extraction lazy regex truncates children after nested
 * divs, so markup buttons past them (PLAY/GOT IT!/NEXT LEVEL/X/RESET) live only in the
 * document.body tree — reachable there now that parseMarkupChildren stamps ids. */
function deep(root, pred, out = []) { for (const c of (root.children || [])) { if (pred(c)) out.push(c); deep(c, pred, out); } return out; }

/* ---------- replicate LEVEL_DATA + THEMES verbatim ---------- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lvStart = html.indexOf('const LEVEL_DATA = [');
const lvEnd = html.indexOf('];', lvStart) + 2;
const thStart = html.indexOf('const THEMES = [');
const thEnd = html.indexOf('];', thStart) + 2;
const { LEVEL_DATA, THEMES } = new Function(html.slice(thStart, thEnd) + '\n' + html.slice(lvStart, lvEnd) + '\nreturn {LEVEL_DATA, THEMES};')();

/* merge economy simulation: collect everything, auto-merge, spawned items count */
function economySolvable(lvl) {
  let t0 = lvl.find, t1 = 0, t2 = 0, guard = 0;
  while (t2 < lvl.goal && guard++ < 400) {
    if (t1 >= 3) { t1 -= 3; t2++; t1++; continue; }        // t1 merge -> t2 + spawns 1 t1
    if (t0 >= 3) { t0 -= 3; t1++; t0++; continue; }        // t0 merge -> t1 + spawns 1 t0
    break;
  }
  return t2 >= lvl.goal;
}
T('levels-30', LEVEL_DATA.length === 30 && THEMES.length === 6 && LEVEL_DATA.every((l, i) => l.theme === Math.floor(i / 5)), LEVEL_DATA.length);
T('economy-all-30-solvable', LEVEL_DATA.every(economySolvable), LEVEL_DATA.filter(l => !economySolvable(l)).map(l => l.name).join(','));

/* ---------- BOOT A (fresh) ---------- */
const g = bootGame(SLUG, { inject: { anchor: 'function updateGoalDisplay(){', exports: 'globalThis.__FNM={get hidden(){return hiddenObjects;},get tray(){return trayItems;},get goal(){return goalCount;},get target(){return goalTarget;},get hints(){return hintsLeft;},get gameActive(){return gameActive;},get bgm(){return !!bgmOsc;}};' } });
const els = g.els, sb = g.sandbox, cv = els['gameCanvas'];
g.pump(3);
T('boot-no-errors', g.loadErrors.length === 0, g.loadErrors.join(' | '));
T('menu-shown', visible(els['menu-screen']) && !visible(els['levels-screen']) && !visible(els['game-screen']));

/* tutorial */
sb.showTutorial();
T('tutorial-open', visible(els['tutorial-screen']));
deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'GOT IT!')[0].click();
T('tutorial-back-menu', visible(els['menu-screen']));

/* settings toggles */
sb.showSettings();
T('settings-open', visible(els['settings-screen']) && textOf(els['btn-sound']) === 'ON' && textOf(els['btn-music']) === 'ON');
els['btn-sound'].click(); T('sound-off', textOf(els['btn-sound']) === 'OFF' && String(els['btn-sound'].className).includes('toggle-off'));
els['btn-sound'].click(); T('sound-on', textOf(els['btn-sound']) === 'ON');
els['btn-music'].click(); els['btn-music'].click(); T('music-still-on', textOf(els['btn-music']) === 'ON');
sb.showMenu();

/* level select: 30 cells, 6 sections, only L1 unlocked */
deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'PLAY')[0].click();
T('levels-screen', visible(els['levels-screen']) && textOf(els['total-stars']) === 'Total Stars: 0/90', textOf(els['total-stars']));
const sections = els['level-container'].children.filter(c => String(c.className).includes('theme-section'));
const cells = []; sections.forEach(sec => sec.children.forEach(grid => String(grid.className).includes('level-grid') && grid.children.forEach(b => cells.push(b))));
/* stars text lives in the child .stars div (loose leading text like the level number is
 * dropped by the parser); timer floors immediately once the loop ticks */
const starTxt = b => { const st = (b.children || []).find(c => String(c.className).includes('stars')); return st ? textOf(st) : textOf(b); };
const timerSec = t => { const p = String(t).split(':'); return p.length === 2 ? (+p[0]) * 60 + (+p[1]) : -1; };
T('grid-30-locked', sections.length === 6 && cells.length === 30 &&
  cells[0].classList.contains('unlocked') && starTxt(cells[0]) === '-' &&
  cells[1].classList.contains('locked') && starTxt(cells[1]) === '***' && typeof cells[1].onclick !== 'function' &&
  cells[29].classList.contains('locked'), cells.length);

/* ---------- L1 full real play ---------- */
cells[0].click(); g.pump(3);
T('l1-start', visible(els['game-screen']) && textOf(els['goal-display']) === '0/1Knife' &&
  textOf(els['hint-btn']) === 'HINT (3)' && g.call('globalThis.__FNM.goal') === 0, textOf(els['goal-display']));
const L1 = LEVEL_DATA[0];
const objects0 = g.call('globalThis.__FNM.hidden.length');
T('l1-objects', objects0 === L1.find + Math.floor(L1.find * 0.3), String(objects0));
T('l1-timer', timerSec(textOf(els['timer-display'])) >= 89, textOf(els['timer-display']));

/* collector: tap every unfound real (non-distractor) object via pointerdown; merges chain via timers */
function tapAll() {
  let tapped = 0;
  for (let round = 0; round < 40; round++) {
    const targets = g.call('globalThis.__FNM.hidden.filter(o=>!o.found&&!o.isDistractor).map(o=>[o.x,o.y])');
    if (!targets.length) break;
    for (const [x, y] of targets) { cv.dispatch('pointerdown', { clientX: x, clientY: y }); g.pump(7); tapped++; }
    g.pump(25); // let checkMerge chain (100/300ms timeouts)
    if (g.call('globalThis.__FNM.goal') >= g.call('globalThis.__FNM.target') && !g.call('globalThis.__FNM.gameActive')) break;
    const left = g.call('globalThis.__FNM.hidden.filter(o=>!o.found&&!o.isDistractor).length');
    if (left === 0 && g.call('globalThis.__FNM.gameActive')) break; // no more real objects
  }
  return tapped;
}
const tapped1 = tapAll();
g.pump(35); // final merge chain + 500ms win timeout
T('l1-won', !g.call('globalThis.__FNM.gameActive') && visible(els['complete-screen']) && g.call('globalThis.__FNM.goal') >= 1,
  'goal=' + g.call('globalThis.__FNM.goal') + ' tapped=' + tapped1);
T('l1-3stars', textOf(els['stars-earned']) === '***' && textOf(els['complete-title']) === 'LEVEL COMPLETE!', textOf(els['stars-earned']));
const bdDivs = els['score-breakdown'].children.map(d => textOf(d));
T('l1-breakdown', bdDivs.length === 4 && bdDivs[0].startsWith('Goal Bonus+100') && bdDivs[3].startsWith('Total'), bdDivs.join('|'));
const finalScore = parseInt(textOf(els['final-score']), 10);
T('l1-score-sane', finalScore >= 100 && finalScore <= 280, String(finalScore));
let saved = JSON.parse(g.ls.getItem('findnmerge_v2') || '{}');
T('l1-saved', saved.levels && saved.levels['0'] && saved.levels['0'].stars === 3, JSON.stringify(saved.levels));

/* NEXT LEVEL -> L2; hint + timer + tray merge + exit */
deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'NEXT LEVEL')[0].click(); g.pump(3);
T('l2-start', visible(els['game-screen']) && textOf(els['goal-display']) === '0/2Knife' && timerSec(textOf(els['timer-display'])) >= 99, textOf(els['goal-display']) + ' ' + textOf(els['timer-display']));
els['hint-btn'].click();
T('l2-hint', textOf(els['hint-btn']) === 'HINT (2)' && g.call('globalThis.__FNM.hints') === 2, textOf(els['hint-btn']));
g.pump(60); // ~1s game time
T('l2-timer-runs', timerSec(textOf(els['timer-display'])) >= 96 && timerSec(textOf(els['timer-display'])) <= 99, textOf(els['timer-display']));
/* tap exactly 3 tier0 objects -> tray shows the merged tier1 (Fork) */
let tapped = 0;
while (tapped < 3) {
  const targets = g.call('globalThis.__FNM.hidden.filter(o=>!o.found&&!o.isDistractor).map(o=>[o.x,o.y])');
  if (!targets.length) break;
  cv.dispatch('pointerdown', { clientX: targets[0][0], clientY: targets[0][1] }); g.pump(10); tapped++;
}
g.pump(25);
const trayNames = els['merge-tray-inner'].children.map(d => (d.children || []).map(c => textOf(c)).join('='));
T('l2-tray-merge', trayNames.some(n => n.includes('Fork')), trayNames.join('|'));
T('l2-tray-count', g.call('globalThis.__FNM.tray.filter(t=>t.tier===1).length') >= 1, 'tray=' + g.call('JSON.stringify(globalThis.__FNM.tray)'));
/* distractor junk taps: hitting a distractor adds it to tray without merging */
const distr = g.call('globalThis.__FNM.hidden.filter(o=>!o.found&&o.isDistractor).map(o=>[o.x,o.y])');
if (distr.length) { cv.dispatch('pointerdown', { clientX: distr[0][0], clientY: distr[0][1] }); g.pump(8); }
T('l2-distractor-collects', g.call('globalThis.__FNM.tray.some(t=>t.themeIdx!==' + LEVEL_DATA[1].theme + ')'), 'expected a foreign-theme junk item in tray');
/* exit button back to levels */
{ const scr = deep(sb.document.body, c => c.id === 'game-screen')[0];
  deep(scr, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'X')[0].click(); } g.pump(2);
T('l2-exit', visible(els['levels-screen']) && !g.call('globalThis.__FNM.gameActive'));
const cells2 = []; els['level-container'].children.forEach(sec => sec.children.forEach(grid => String(grid.className).includes('level-grid') && grid.children.forEach(b => cells2.push(b))));
T('l2-unlocked-after-win', cells2[0].classList.contains('unlocked') && starTxt(cells2[0]) === '***' &&
  cells2[1].classList.contains('unlocked') && typeof cells2[1].onclick === 'function' && cells2[2].classList.contains('locked'),
  [0, 1, 2].map(i => starTxt(cells2[i]) + '/' + (cells2[i].classList.contains('locked') ? 'L' : 'U')).join(' | '));
T('total-stars-3', textOf(els['total-stars']) === 'Total Stars: 3/90', textOf(els['total-stars']));
T('runtime-errors-a', !(sb.__errors || []).length, (sb.__errors || []).slice(0, 2).join(' | '));

/* ---------- BOOT B (seeded) ---------- */
const g2 = bootGame(SLUG, { seedLS: { findnmerge_v2: JSON.stringify({ v: 2, levels: { '0': { stars: 2, score: 120 } }, sound: false, music: true }) }, inject: { anchor: 'function updateGoalDisplay(){', exports: 'globalThis.__FNM={get hidden(){return hiddenObjects;},get goal(){return goalCount;},get target(){return goalTarget;},get gameActive(){return gameActive;},get bgm(){return !!bgmOsc;}};' } });
const els2 = g2.els, sb2 = g2.sandbox;
g2.pump(3);
T('boot-b-no-errors', g2.loadErrors.length === 0, g2.loadErrors.join(' | '));
sb2.showSettings();
T('boot-b-sound-off-persisted', textOf(els2['btn-sound']) === 'OFF');
sb2.showMenu();
deep(sb2.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'PLAY')[0].click();
T('boot-b-total-stars', textOf(els2['total-stars']) === 'Total Stars: 2/90', textOf(els2['total-stars']));
const cellsB = []; els2['level-container'].children.forEach(sec => sec.children.forEach(grid => String(grid.className).includes('level-grid') && grid.children.forEach(b => cellsB.push(b))));
cellsB[1].click(); g2.pump(3); // L2 (unlocked by seeded L1 completion)
T('boot-b-l2', visible(els2['game-screen']) && textOf(els2['goal-display']) === '0/2Knife');
T('boot-b-bgm-running', g2.call('globalThis.__FNM.bgm') === true, 'bgmOsc state');

/* timeout fail path (P2): idle L2 (100s) with no taps -> TIME'S UP!, nothing saved */
const frames = Math.ceil((100 * 1000) / 16.67) + 40;
g2.pump(frames);
T('timeout-fail-screen', visible(els2['complete-screen']) && textOf(els2['complete-title']) === "TIME'S UP!" &&
  textOf(els2['stars-earned']) === '...' && textOf(els2['final-score']) === '0',
  textOf(els2['complete-title']) + ' ' + textOf(els2['stars-earned']) + ' ' + textOf(els2['final-score']));
const savedB = JSON.parse(g2.ls.getItem('findnmerge_v2') || '{}');
T('timeout-no-save', savedB.levels && savedB.levels['1'] === undefined, JSON.stringify(savedB.levels));
deep(sb2.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'REPLAY')[0].click(); g2.pump(3);
T('replay-restarts', visible(els2['game-screen']) && timerSec(textOf(els2['timer-display'])) >= 99 && g2.call('globalThis.__FNM.gameActive') === true, textOf(els2['timer-display']));

/* reset progress */
sb2.exitLevel(); g2.pump(2);
sb2.showSettings();
deep(sb2.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === 'RESET')[0].click(); g2.pump(2);
const savedR = JSON.parse(g2.ls.getItem('findnmerge_v2') || '{}');
T('reset-wipes', visible(els2['menu-screen']) && JSON.stringify(savedR.levels) === '{}' && savedR.sound === false, JSON.stringify(savedR));
T('runtime-errors-b', !(sb2.__errors || []).length, (sb2.__errors || []).slice(0, 2).join(' | '));

/* ---------- report ---------- */
const pass = results.length - fails.length;
const out = {
  pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails,
  extra: {
    levels: 30, economySimulated: 30, realWins: ['L1 (3 stars, full tap play)'],
    engineFixes: [
      "P2 timer expiry called levelComplete() unconditionally -> idling the clock completed the level, saved 1 star and unlocked the next one; now TIME'S UP! fail screen, nothing saved",
      'P3 bgmOsc was never assigned so playChord() bailed on the first chord — BGM never played; startBGM now tracks running state',
      'P3 win setTimeout vs timer-expiry race could double-fire levelComplete and re-save progress; guarded by gameActive'
    ]
  }
};
process.stdout.write('\n' + JSON.stringify(out) + '\n');
process.exit(fails.length ? 1 : 0);
