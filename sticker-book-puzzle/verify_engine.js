#!/usr/bin/env node
/* sticker-book-puzzle — engine verifier (queue-B #27)
 * Drives REAL input paths only: canvas mousedown/mousemove/mouseup drags (tray grab ->
 * play-area drop), button clicks (hint/undo/rotate/menu), level-select cell clicks.
 * Level geometry is replicated independently by extracting makeLevels() source and
 * evaluating it standalone, so target coordinates/tray layouts are derived, not read
 * from engine state. Expected win condition per level: all z>=0 stickers placed.
 * Engine bugs fixed 2026-08-25 (all verified below):
 *   P1 visibilitychange resume guard referenced non-existent `gameState` -> frozen canvas after tab switch
 *   P2 win setTimeout(400ms) race: Undo inside window still celebrated + recorded progress
 *   P3 nextLevel after L30 replayed L29 instead of returning to menu
 *   P3 stars-val HUD pill never updated (showed 0 forever)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'sticker-book-puzzle';
const CANVAS_W = 560, CANVAS_H = 560, TRAY_H = 110, PLAY_H = CANVAS_H - TRAY_H;
const results = [], fails = [];
function T(name, cond, info) {
  results.push(name);
  if (!cond) fails.push(name + (info ? ' :: ' + info : ''));
  process.stdout.write((cond ? 'ok ' : 'FAIL ') + name + (info && !cond ? '  [' + info + ']' : '') + '\n');
}

/* ---------- independent level data: extract makeLevels() verbatim ---------- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const mStart = html.indexOf('function makeLevels()');
const mEnd = html.indexOf('return levels;', mStart);
const mBrace = html.indexOf('}', mEnd);
const makeSrc = html.slice(mStart, mBrace + 1);
const LEVELS = new Function('CANVAS_W', 'CANVAS_H', 'PLAY_H', 'TRAY_H', makeSrc + '\nreturn makeLevels();')(CANVAS_W, CANVAS_H, PLAY_H, TRAY_H);

/* ---------- sanity of replicated data ---------- */
(function () {
  let ok = LEVELS.length === 30;
  let why = 'n=' + LEVELS.length;
  for (let li = 0; li < LEVELS.length && ok; li++) {
    const lv = LEVELS[li];
    if (!lv.name || !lv.stickers.length || !(lv.timeMul > 0)) { ok = false; why = 'L' + (li + 1) + ' meta'; break; }
    let zPos = 0;
    for (const s of lv.stickers) {
      const fin = [s.x, s.y, s.size, s.rotation, s.z].every(Number.isFinite);
      if (!fin) { ok = false; why = 'L' + (li + 1) + ' NaN field ' + JSON.stringify(s); break; }
      if (s.z >= 0) {
        zPos++;
        if (s.size <= 0) { ok = false; why = 'L' + (li + 1) + ' z>=0 size<=0'; break; }
        if (!(s.x >= 0 && s.x <= CANVAS_W && s.y >= 0 && s.y < PLAY_H)) { ok = false; why = 'L' + (li + 1) + ' target out of play area ' + s.x + ',' + s.y; break; }
      }
    }
    if (ok && zPos === 0) { ok = false; why = 'L' + (li + 1) + ' no placeable sticker'; }
  }
  T('levels-sane-30', ok, why);
  const bg = LEVELS.map((l, i) => l.stickers.filter(s => s.z < 0).length ? i + 1 : 0).filter(Boolean);
  T('levels-bg-list', bg.join(',') === '17,19,20,26,29', 'bg levels ' + bg.join(','));
})();

/* ---------- helpers ---------- */
function textOf(el) { if (!el) return ''; let t = String(el.textContent == null ? '' : el.textContent); (el.children || []).forEach(c => { t += textOf(c); }); return t; }

const g = bootGame(SLUG, { inject: { anchor: 'function _cleanup(){', exports: 'globalThis.__RC={get raf(){return _rafId;}};' } });
const els = g.els, sb = g.sandbox, c = els['game-canvas'];
const winModal = els['win-modal'];
const shown = el => el.classList.contains('show');
g.pump(2); // boot rafs (init resize + loop start)

let rect = null;
function ev(p) { return { clientX: p.x * rect.width / CANVAS_W + rect.left, clientY: p.y * rect.height / CANVAS_H + rect.top }; }

/* my independent placement model (engine tray = every unplaced sticker, laid out evenly) */
let placedArr = [];
function trayModel() {
  const un = placedArr.map((p, i) => (!p ? i : -1)).filter(i => i >= 0);
  if (!un.length) return [];
  const spacing = Math.min(80, (CANVAS_W - 40) / un.length);
  const startX = CANVAS_W / 2 - spacing * (un.length - 1) / 2;
  return un.map((si, k) => ({ si, x: startX + k * spacing, y: PLAY_H + TRAY_H / 2 }));
}
function dragTo(si, tx, ty, snap) {
  const items = trayModel();
  const k = items.findIndex(o => o.si === si);
  if (k < 0) throw new Error('sticker ' + si + ' not in tray model');
  const gp = { x: items[k].x - 30, y: items[k].y }; // 30<37 hit half-box; >=37 away from all higher-index slots
  c.dispatch('mousedown', ev(gp));
  c.dispatch('mousemove', ev({ x: (gp.x + tx) / 2, y: (gp.y + ty) / 2 }));
  c.dispatch('mousemove', ev({ x: tx, y: ty }));
  c.dispatch('mouseup', ev({ x: tx, y: ty }));
  if (snap !== false) placedArr[si] = true; // snap=false -> engine rejects (wrong spot), stays in tray
}
function dragAll(li) { // place every z>=0 sticker not already placed in my model
  LEVELS[li].stickers.forEach((s, i) => { if (s.z >= 0 && !placedArr[i]) dragTo(i, s.x, s.y); });
}
function loadLevelReset(li) { placedArr = LEVELS[li].stickers.map(() => false); }
function lvName(li) { return 'L' + (li + 1) + ': ' + LEVELS[li].name; }
function winTotal(li) { return LEVELS[li].stickers.length; }
function zPosCount(li) { return LEVELS[li].stickers.filter(s => s.z >= 0).length; }

/* ---------- BOOT A: fresh session ---------- */
T('boot-a-no-errors', g.loadErrors.length === 0, g.loadErrors.join(' | '));
T('menu-stats-init', textOf(els['menu-stats']).indexOf('Progress: 0 / 30') === 0, textOf(els['menu-stats']));

/* how-to + settings modals */
sb.startHowTo ? null : null;
els['menu-screen'].querySelector('#x'); // no-op touch of qs cache
sb.openHowTo(); T('howto-open', shown(els['howto-modal']));
sb.closeModal('howto-modal'); T('howto-close', !shown(els['howto-modal']));
sb.openSettings(); T('settings-open', shown(els['settings-modal']));
els['guide-toggle'].checked = false; sb.toggleGuides(); // real onchange path body
els['sfx-toggle'].checked = false; sb.toggleSfx();
els['bgm-toggle'].checked = false; sb.toggleBgm();
els['haptic-toggle'].checked = false; sb.toggleHaptic();
els['guide-toggle'].checked = true; sb.toggleGuides();
els['sfx-toggle'].checked = true; sb.toggleSfx();
els['bgm-toggle'].checked = true; sb.toggleBgm();
els['haptic-toggle'].checked = true; sb.toggleHaptic();
T('settings-toggles-ok', !g.loadErrors.length && !sb.__errors);
sb.closeModal('settings-modal'); T('settings-close', !shown(els['settings-modal']));

/* level select fresh: 5 tier dividers + 30 cells, only L1 unlocked */
sb.openLevelSelect();
const grid = els['level-select-grid'];
const divs = (grid.children || []).filter(x => String(x.className).includes('tier-divider'));
const cells = (grid.children || []).filter(x => String(x.className).includes('level-cell'));
T('lsel-cells-30', cells.length === 30 && divs.length === 5, cells.length + ' cells ' + divs.length + ' dividers');
T('lsel-l1-unlocked', typeof cells[0].onclick === 'function' && textOf(cells[0]).indexOf('1') === 0 && textOf(cells[0]).indexOf('🔒') < 0, textOf(cells[0]));
T('lsel-l2-locked', typeof cells[1].onclick !== 'function' && textOf(cells[1]).indexOf('🔒') >= 0, textOf(cells[1]));
cells[2].click(); // locked -> nothing happens
T('lsel-locked-click-noop', els['menu-screen'].style.display !== 'none' && !shown(els['levelselect-modal']) === false, 'modal still open');
sb.closeModal('levelselect-modal');

/* controls bar buttons wired */
const ctrls = els['controls-bar'].children;
T('controls-wired-4', ctrls.length === 4 && [0, 1, 2, 3].every(i => typeof ctrls[i].onclick === 'function'), ctrls.length);
const btnHint = ctrls[0], btnUndo = ctrls[1], btnRotate = ctrls[2], btnMenu = ctrls[3];

/* start L1 */
sb.startGame(); g.pump(13); // 200ms: first timer tick writes timer-val
rect = c.getBoundingClientRect();
T('start-l1', els['menu-screen'].style.display === 'none' && els['game-screen'].style.display === 'flex' &&
  textOf(els['level-name']) === lvName(0) && textOf(els['placed-val']) === '0/' + winTotal(0), textOf(els['level-name']) + ' ' + textOf(els['placed-val']));
T('start-l1-hud', textOf(els['hints-left']) === '3' && textOf(els['stars-val']) === '0' && textOf(els['timer-val']) === '0:00',
  textOf(els['hints-left']) + '|' + textOf(els['stars-val']) + '|' + textOf(els['timer-val']));
loadLevelReset(0);

/* L1: full real-drag win, fast -> 3 stars */
dragAll(0);
T('l1-placed-all', textOf(els['placed-val']) === zPosCount(0) + '/' + winTotal(0), textOf(els['placed-val']));
g.pump(26); // 400ms win timeout
T('l1-win-modal', shown(winModal), 'modal hidden');
T('l1-win-title', textOf(els['win-title']).indexOf('Sunny Day Complete!') >= 0, textOf(els['win-title']));
T('l1-win-3stars', textOf(els['win-stars']) === '★★★', textOf(els['win-stars']));
T('l1-win-time', textOf(els['win-time']).indexOf('Time: 0:') === 0, textOf(els['win-time']));
let saved = JSON.parse(g.ls.getItem('stickerBookPuzzle_v1') || '{}');
T('l1-ls-saved', JSON.stringify(saved.completed) === '[0]' && saved.stars[0] === 3 && saved.level === 1, JSON.stringify(saved));

/* L2: burn ~41s virtual -> 2 stars by time */
sb.nextLevel(); loadLevelReset(1); g.pump(2450); dragAll(1); g.pump(26);
T('l2-name', textOf(els['level-name']) === lvName(1) && !shown(winModal) === false, textOf(els['level-name']));
T('l2-2stars', shown(winModal) && textOf(els['win-stars']) === '★★☆', textOf(els['win-stars']));

/* L3: burn ~70s -> 1 star */
sb.nextLevel(); loadLevelReset(2); g.pump(4200); dragAll(2); g.pump(26);
T('l3-1star', shown(winModal) && textOf(els['win-stars']) === '★☆☆', textOf(els['win-stars']));

/* L4: hint (3->2), wrong drop, empty undo, then win => 2 stars */
sb.nextLevel(); loadLevelReset(3); g.pump(2);
T('l4-name', textOf(els['level-name']) === lvName(3), textOf(els['level-name']));
btnHint.click();
T('l4-hint', textOf(els['hints-left']) === '2' && textOf(els['status-line']).indexOf('💡') === 0, textOf(els['hints-left']) + ' ' + textOf(els['status-line']));
btnUndo.click();
T('l4-undo-empty', textOf(els['status-line']) === 'Nothing to undo' && String(els['status-line'].className).includes('warn'), textOf(els['status-line']));
dragTo(0, 40, 30, false); // wrong spot far from every L4 target -> engine rejects
T('l4-wrong-drop', textOf(els['status-line']).indexOf('Not quite') === 0 && String(els['status-line'].className).includes('warn') &&
  textOf(els['placed-val']) === '0/' + winTotal(3), textOf(els['status-line']) + ' ' + textOf(els['placed-val']));
dragAll(3); g.pump(26);
T('l4-win-2stars-hint', shown(winModal) && textOf(els['win-stars']) === '★★☆', textOf(els['win-stars']));

/* L5: win-race — place last sticker then Undo inside the 400ms window */
sb.nextLevel(); loadLevelReset(4); g.pump(2);
T('l5-name', textOf(els['level-name']) === lvName(4), textOf(els['level-name']));
LEVELS[4].stickers.forEach((s, i) => { if (s.z >= 0 && i < 3) dragTo(i, s.x, s.y); });
dragTo(3, LEVELS[4].stickers[3].x, LEVELS[4].stickers[3].y); // last one -> win scheduled
btnUndo.click(); // inside 400ms window
placedArr[3] = false; // engine un-placed it; mirror in my tray model
g.pump(30);
T('l5-race-undo-nowin', !shown(winModal) && textOf(els['placed-val']) === '3/' + winTotal(4), shown(winModal) + ' ' + textOf(els['placed-val']));
dragTo(3, LEVELS[4].stickers[3].x, LEVELS[4].stickers[3].y); g.pump(26);
T('l5-win-after-race', shown(winModal) && textOf(els['win-title']).indexOf('My House Complete!') >= 0, textOf(els['win-title']));

/* L6: rotate with nothing selected */
sb.nextLevel(); loadLevelReset(5); g.pump(2);
btnRotate.click();
T('l6-rotate-noselect', textOf(els['status-line']) === 'Tap a sticker in the tray first', textOf(els['status-line']));
dragAll(5); g.pump(26);
T('l6-win', shown(winModal) && textOf(els['win-stars']) === '★★★', textOf(els['win-stars'])); // stays

/* L7: back-modal stay + leave */
sb.nextLevel(); loadLevelReset(6); g.pump(2);
T('l7-name', textOf(els['level-name']) === lvName(6), textOf(els['level-name']));
btnMenu.click();
T('l7-back-modal', shown(els['back-modal']));
sb.closeModal('back-modal');
T('l7-back-stay', !shown(els['back-modal']) && textOf(els['level-name']) === lvName(6));
btnMenu.click(); sb.backToMenu();
T('l7-menu', els['menu-screen'].style.display === 'flex' && els['game-screen'].style.display === 'none' && !shown(winModal));
T('l7-menu-stats', textOf(els['menu-stats']).indexOf('Progress: 6 / 30') === 0, textOf(els['menu-stats']));

/* resume via level select: click L7 cell, win it */
sb.openLevelSelect();
const cells2 = (els['level-select-grid'].children || []).filter(x => String(x.className).includes('level-cell'));
cells2[6].click();
T('lsel-l7-click', textOf(els['level-name']) === lvName(6) && els['game-screen'].style.display === 'flex' && !shown(els['levelselect-modal']), textOf(els['level-name']));
loadLevelReset(6); dragAll(6); g.pump(26);
T('l7-win', shown(winModal) && textOf(els['win-stars']) === '★★★', textOf(els['win-stars']));

/* L8: rotation flow — leaf needs 4 quarter-turns before it can snap */
sb.nextLevel(); loadLevelReset(7); g.pump(2);
rect = c.getBoundingClientRect();
T('l8-name', textOf(els['level-name']) === lvName(7) && textOf(els['placed-val']) === '0/' + winTotal(7), textOf(els['level-name']) + ' ' + textOf(els['placed-val']));
const leaf = 4; // L8 sticker 4 = leaf rot 0.3 (needsRotation)
const items8 = trayModel();
const g8 = items8.find(o => o.si === leaf);
c.dispatch('mousedown', ev({ x: g8.x - 30, y: g8.y })); // grab (sets selectedTrayIdx)
btnRotate.click(); // currentRotation = PI/2
c.dispatch('mousemove', ev({ x: LEVELS[7].stickers[leaf].x, y: LEVELS[7].stickers[leaf].y }));
c.dispatch('mouseup', ev({ x: LEVELS[7].stickers[leaf].x, y: LEVELS[7].stickers[leaf].y }));
T('l8-rot-fail', textOf(els['status-line']).indexOf('Rotate the sticker') === 0 && String(els['status-line'].className).includes('warn') &&
  textOf(els['placed-val']) === '0/' + winTotal(7), textOf(els['status-line']) + ' ' + textOf(els['placed-val']));
btnRotate.click(); btnRotate.click(); btnRotate.click(); // 4 quarters total = 2PI
dragTo(leaf, LEVELS[7].stickers[leaf].x, LEVELS[7].stickers[leaf].y);
T('l8-rot-snap', textOf(els['placed-val']) === '1/' + winTotal(7), textOf(els['placed-val']));
dragAll(7); g.pump(26);
T('l8-win', shown(winModal) && textOf(els['win-stars']) === '★★★' && textOf(els['win-time']).indexOf('Time: 0:') === 0, textOf(els['win-stars']));

/* sweep L9..L30 with real drags; L9 also exercises Replay */
let sweepOk = true, sweepWhy = '';
for (let li = 8; li < 30; li++) {
  sb.nextLevel(); loadLevelReset(li); g.pump(2);
  if (textOf(els['level-name']) !== lvName(li)) { sweepOk = false; sweepWhy = 'L' + (li + 1) + ' name ' + textOf(els['level-name']); break; }
  if (textOf(els['stars-val']) !== String((JSON.parse(g.ls.getItem('stickerBookPuzzle_v1') || '{}').stars || [])[li] || 0)) { sweepOk = false; sweepWhy = 'L' + (li + 1) + ' stars-val ' + textOf(els['stars-val']); break; }
  dragAll(li);
  if (textOf(els['placed-val']) !== zPosCount(li) + '/' + winTotal(li)) { sweepOk = false; sweepWhy = 'L' + (li + 1) + ' placed ' + textOf(els['placed-val']); break; }
  g.pump(26);
  if (!shown(winModal)) { sweepOk = false; sweepWhy = 'L' + (li + 1) + ' no win modal'; break; }
  if (li === 8) { // replay resets the level, then win again
    sb.replayLevel(); loadLevelReset(li); g.pump(2);
    if (textOf(els['placed-val']) !== '0/' + winTotal(li) || shown(winModal)) { sweepOk = false; sweepWhy = 'L9 replay state ' + textOf(els['placed-val']); break; }
    if (textOf(els['stars-val']) !== '3') { sweepOk = false; sweepWhy = 'L9 replay stars-val ' + textOf(els['stars-val']); break; }
    dragAll(li); g.pump(26);
    if (!shown(winModal)) { sweepOk = false; sweepWhy = 'L9 replay no win'; break; }
  }
  if (li === 16 || li === 18 || li === 19 || li === 25 || li === 28) { // bg-sticker levels: win ignores z<0
    const t = textOf(els['placed-val']);
    if (t !== zPosCount(li) + '/' + winTotal(li)) { sweepOk = false; sweepWhy = 'L' + (li + 1) + ' bg placed ' + t; break; }
  }
}
T('sweep-l9-l30', sweepOk, sweepWhy);
T('l30-title', textOf(els['win-title']).indexOf('You Beat All Levels!') >= 0, textOf(els['win-title']));

/* visibilitychange DURING GAME (game-screen visible): hide pauses render loop, show must resume it */
g.pump(2);
const rafBefore = g.call('globalThis.__RC.raf');
sb.document.hidden = true; sb.document.dispatch('visibilitychange', {});
const rafHidden = g.call('globalThis.__RC.raf');
sb.document.hidden = false; sb.document.dispatch('visibilitychange', {});
const rafShown = g.call('globalThis.__RC.raf');
T('vis-pause-ingame', !!rafBefore && (rafHidden === null || rafHidden === undefined), JSON.stringify([rafBefore, rafHidden]));
T('vis-resume-ingame', !!rafShown, 'raf after show: ' + rafShown);
g.pump(5);
T('vis-no-errors', !(sb.__errors || []).length, (sb.__errors || []).slice(0, 2).join(' | '));

/* after final win, Next returns to menu (was: silently replayed L29) */
sb.nextLevel();
T('l30-next-menu', els['menu-screen'].style.display === 'flex' && els['game-screen'].style.display === 'none' && !shown(winModal) &&
  textOf(els['menu-stats']).indexOf('Progress: 30 / 30') === 0, textOf(els['menu-stats']));

/* tab hidden AT MENU, shown again (loop stays paused — menu is DOM-only, correct),
 * then Continue must restart the dead loop (stale-lastRAF freeze, P1 part 2) */
sb.document.hidden = true; sb.document.dispatch('visibilitychange', {});
sb.document.hidden = false; sb.document.dispatch('visibilitychange', {});
const rafAtMenu = g.call('globalThis.__RC.raf');
sb.startGame(); g.pump(2);
const rafAfterContinue = g.call('globalThis.__RC.raf');
T('vis-continue-restarts', !rafAtMenu && !!rafAfterContinue && els['game-screen'].style.display === 'flex' &&
  textOf(els['level-name']) === lvName(29), JSON.stringify([rafAtMenu, rafAfterContinue]));
sb.backToMenu();

/* final persistence state */
saved = JSON.parse(g.ls.getItem('stickerBookPuzzle_v1') || '{}');
T('final-ls-complete', JSON.stringify(saved.completed) === JSON.stringify(Array.from({ length: 30 }, (_, i) => i)), JSON.stringify(saved.completed));
T('final-ls-stars', saved.level === 30 && saved.stars[0] === 3 && saved.stars[1] === 2 && saved.stars[2] === 1 && saved.stars[3] === 2 &&
  saved.stars[6] === 3 && saved.stars[7] === 3 && saved.stars[29] === 3, JSON.stringify(saved.stars));
T('runtime-errors-a', !(sb.__errors || []).length, (sb.__errors || []).slice(0, 3).join(' | '));

/* ---------- BOOT B: seeded persistence resume ---------- */
const g2 = bootGame(SLUG, { seedLS: { stickerBookPuzzle_v1: g.ls.getItem('stickerBookPuzzle_v1') } });
g2.pump(2);
T('boot-b-no-errors', g2.loadErrors.length === 0, g2.loadErrors.join(' | '));
T('resume-stats', textOf2(g2, 'menu-stats').indexOf('Progress: 30 / 30') === 0, textOf2(g2, 'menu-stats'));
g2.sandbox.startGame(); g2.pump(2);
T('resume-l30', textOf2(g2, 'level-name') === lvName(29) && textOf2(g2, 'stars-val') === '3' && textOf2(g2, 'placed-val') === '0/' + winTotal(29), // stays
  textOf2(g2, 'level-name') + '|' + textOf2(g2, 'stars-val') + '|' + textOf2(g2, 'placed-val'));
g2.sandbox.backToMenu(); // hmm: backToMenu from game
g2.sandbox.openLevelSelect();
const cellsB = (g2.els['level-select-grid'].children || []).filter(x => String(x.className).includes('level-cell'));
T('resume-lsel-all-unlocked', cellsB.length === 30 && cellsB.every(x => typeof x.onclick === 'function'));
T('resume-lsel-stars', textOf(cellsB[0]) === '1★★★' && textOf(cellsB[1]) === '2★★☆' && textOf(cellsB[2]) === '3★☆☆' && textOf(cellsB[29]) === '30★★★',
  [0, 1, 2, 29].map(i => textOf(cellsB[i])).join(' | '));
T('runtime-errors-b', !(g2.sandbox.__errors || []).length, (g2.sandbox.__errors || []).slice(0, 3).join(' | '));

function textOf2(api, id) { return textOf(api.els[id]); }

/* ---------- report ---------- */
const pass = results.length - fails.length;
const out = { pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { levels: 30, engineFixes: ['P1 visibilitychange gameState-undefined freeze', 'P2 win-race undo in 400ms window', 'P3 nextLevel-after-L30 replayed-L29', 'P3 stars-val HUD never updated'] } };
process.stdout.write('\n' + JSON.stringify(out) + '\n');
process.exit(fails.length ? 1 : 0);
