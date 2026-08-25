#!/usr/bin/env node
/* seating-puzzle — Type A verifier: replay the engine solver's full solution through
 * REAL canvas pointer drags (pointerdown on the tray card / seated guest, pointermove,
 * pointerup snapped onto the target chair) for all 25 levels + the daily challenge,
 * then walk the UI flow: victory modal, NEXT/RETRY, undo, hint, reset, quit, level
 * select grid, settings toggles, tray pan + wheel scroll, resize, save persistence.
 * Contract: exit 0 = PASS, last stdout line = compact JSON. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('seating-puzzle');
const cv = g.els['game'];
const results = [];
const extra = { levels: 0, constraintsCleared: [], typeCensus: {}, engineBugsFixed: [], daily: null };

function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }
function S() { return g.call('JSON.stringify({st:gameState,lvl:currentLevel,daily:isDaily,won:won,moves:moves,par:par,tray:trayOrder.length,hints:hintsLeft,placed:Object.keys(assignment).length,complete:(typeof isComplete==="function"&&L)?isComplete():false})'); }

// the full body-parse tree holds the real nested buttons (els stubs' markup parse
// truncates at the first nested close-tag); engine state toggles the els stubs.
function bodyFind(id) { let r = null; (function w(e) { for (const c of (e.children || [])) { if (c.id === id) r = c; w(c); } })(g.sandbox.document.body); return r; }
function deepButtons(id) { const out = []; const root = bodyFind(id) || bodyFindAlt(id); (function w(e) { for (const c of (e.children || [])) { if (String(c.tagName || '').toUpperCase() === 'BUTTON') out.push(c); w(c); } })(root || { children: [] }); return out; }
function bodyFindAlt(id) { let r = null; (function w(e) { for (const c of (e.children || [])) { if (c.id === id) r = c; w(c); } })(g.els.hud && g.els.hud.parentNode ? g.els.hud.parentNode : { children: [] }); return r; }

function pev(type, x, y, more) { cv.dispatch(type, Object.assign({ clientX: x, clientY: y, pointerId: 1, button: 0, buttons: 1 }, more || {})); }

// tray card center for guest gid, from the engine's own tray geometry + live scroll
function cardXY(gid) {
  return JSON.parse(g.call('(function(){var cw=cardW(),ty=H-trayH+10,ch=trayH-18,total=trayContentWidth(),sx=total<(W-24)?(W-total)/2:12,i=trayOrder.indexOf("' + gid + '");if(i<0)return null;return JSON.stringify({x:sx+i*(cw+8)-trayScroll+cw/2,y:ty+ch/2});})()'));
}
function chairXY(cid) { return JSON.parse(g.call('(function(){var c=chairById["' + cid + '"];return c?JSON.stringify({x:c.x,y:c.y}):null;})()')); }
// a point in the play area far from every chair (drop-to-tray target)
function deadXY() {
  return JSON.parse(g.call('(function(){var best=null,bd=-1;for(var px=20;px<W-20;px+=40){for(var py=playTop+14;py<playTop+40;py+=12){var d=Infinity;L.chairs.forEach(function(c){d=Math.min(d,dist2(px,py,c.x,c.y));});if(d>bd){bd=d;best={x:px,y:py};}}}return JSON.stringify(best);})()'));
}
// REAL drag: tray card (or seated guest) -> pointer path -> pointerup at the chair
function dragTo(from, to) {
  pev('pointerdown', from.x, from.y);
  g.pump(1);
  pev('pointermove', (from.x + to.x) / 2, (from.y + to.y) / 2);
  pev('pointermove', to.x, to.y);
  g.pump(1);
  pev('pointerup', to.x, to.y);
  g.pump(1);
}
function placeViaDrag(gid, cid) { dragTo(cardXY(gid), chairXY(cid)); }
// solve with the engine's own backtracking solver (honours current fixed placement)
function solve() { const s = g.call('JSON.stringify(solveLevel(L,assignment))'); return s ? JSON.parse(s) : null; }
function snap() { return JSON.parse(S()); }

// solve the current level fully through real drags; asserts win + modal + returns stars
function playLevelToWin(tag) {
  const sol = solve();
  if (!sol) { ck(tag + ':engine-solver', false, 'solveLevel returned null'); return false; }
  ck(tag + ':engine-solver', true);
  // constraints survived validateLevel? (fallback clears every guest's constraints)
  const cleared = g.call('L.guests.every(function(g){return g.constraints.length===0;})');
  if (cleared && !snap().daily) extra.constraintsCleared.push(tag);
  g.call('L.guests.forEach(function(g){g.constraints.forEach(function(c){})})');
  for (;;) {
    const st = snap();
    if (st.won) break;
    const gid = g.call('trayOrder[0]');
    if (!gid) break;
    const cid = sol[gid];
    if (!cid) { ck(tag + ':replay', false, 'solution missing chair for ' + gid); return false; }
    const before = st.placed;
    placeViaDrag(gid, cid);
    const now = snap();
    if (now.placed !== before + 1) { ck(tag + ':replay', false, 'drag did not place ' + gid + ' at ' + cid); return false; }
    if (g.call('assignment["' + gid + '"]') !== cid) { ck(tag + ':replay', false, gid + ' landed on ' + g.call('assignment["' + gid + '"]')); return false; }
  }
  const fin = snap();
  ck(tag + ':drag-replay+win', fin.won && fin.complete, JSON.stringify(fin));
  g.pump(72); // celebration timer (1100ms) -> showVictory
  const modalShown = !g.els.victoryModal.classList.contains('hidden');
  ck(tag + ':victory-modal', modalShown);
  return modalShown;
}

// ---------- boot ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
ck('boot:title-visible', g.call('gameState') === 'menu' && !g.els.titleScreen.classList.contains('hidden'));
ck('boot:no-unsolvable', !(g.sandbox.__errors || []).some(e => /UNSOLVABLE/.test(e)), (g.sandbox.__errors || []).join(' | '));

// ---------- PLAY -> L1 ----------
deepButtons('titleScreen')[0].click();
g.pump(2);
{
  const st = snap();
  ck('play:starts-L1-playing', st.st === 'playing' && st.lvl === 0 && st.tray === g.call('L.guests.length'), S());
  ck('play:tutorial-hintbox', g.els.hintBox.classList.contains('show')); // tier-0 shows tutorial text
}
{
  // resize mid-level keeps geometry sane (real window resize listener)
  g.sandbox.dispatchEvent({ type: 'resize' }); g.pump(2);
  const ok = g.call('L.chairs.every(function(c){return isFinite(c.x)&&c.x>=-c.r&&c.x<=W+c.r&&isFinite(c.y)&&c.y>=playTop-c.r&&c.y<=H-trayH+c.r;})');
  ck('resize:chairs-in-bounds', ok);
}

if (playLevelToWin('L01')) {
  ck('L01:stars-3-saved', g.call('saveData.levelStars[1]') === 3 && g.call('saveData.bestScores[1]') >= 100);
  g.els.modalNext.click(); g.pump(2);
}

// ---------- L2: retry path + drag-miss + seated-pickup + undo ----------
if (snap().lvl === 1 && snap().st === 'playing') {
  // 1) drop in dead space -> card returns to tray
  const gid = g.call('trayOrder[0]');
  dragTo(cardXY(gid), deadXY());
  ck('L02:drag-miss-returns-to-tray', g.call('trayOrder.indexOf("' + gid + '")>=0') && g.call('!("' + gid + '" in assignment)'));
  // 2) place, then pick the SEATED guest back out to dead space -> tray
  const sol = solve();
  const first = Object.keys(sol)[0];
  placeViaDrag(first, sol[first]);
  const seatedOk = g.call('assignment["' + first + '"]') === sol[first];
  dragTo(chairXY(sol[first]), deadXY());
  ck('L02:seated-pickup-to-tray', seatedOk && g.call('!("' + first + '" in assignment)') && g.call('trayOrder.indexOf("' + first + '")>=0'));
  // 3) undo: two placements then two undos restore exactly (relative to the
  //    move count already on the board from the pickup test above)
  const m0 = snap().moves;
  const ids = [g.call('trayOrder[0]'), g.call('trayOrder[1]')];
  dragTo(cardXY(ids[0]), chairXY(sol[ids[0]]));
  dragTo(cardXY(ids[1]), chairXY(sol[ids[1]]));
  const twoPlaced = snap().moves === m0 + 2;
  g.els.undoBtn.click(); g.pump(1);
  const oneLeft = snap().moves === m0 + 1 && g.call('trayOrder.indexOf("' + ids[1] + '")>=0') && g.call('assignment["' + ids[0] + '"]');
  g.els.undoBtn.click(); g.pump(1);
  const zeroLeft = snap().moves === m0 && g.call('Object.keys(assignment).length===0');
  ck('L02:undo-restores', twoPlaced && oneLeft && zeroLeft, JSON.stringify({ twoPlaced, oneLeft, zeroLeft }));
  // 4) win, then RETRY re-runs the same level, win again, then NEXT
  if (playLevelToWin('L02')) {
    const retryBtn = deepButtons('victoryModal')[0]; // RETRY
    retryBtn.click(); g.pump(2);
    const rs = snap();
    ck('L02:retry-resets-level', rs.st === 'playing' && rs.lvl === 1 && rs.moves === 0 && rs.placed === 0, S());
    if (playLevelToWin('L02-retry')) { g.els.modalNext.click(); g.pump(2); }
  }
}

// ---------- L4: hint ----------
if (snap().lvl === 3 && snap().st === 'playing') {
  const before = snap();
  g.els.hintBtn.click(); g.pump(2);
  const after = snap();
  const noVio = !g.call('anyViolation(assignment)');
  const persisted = g.call('(saveData.hintsUsed||{})[4]') === 1;
  ck('L04:hint-places-one-consistently', after.placed === before.placed + 1 && after.hints === before.hints - 1 && noVio && persisted,
    JSON.stringify({ before: before.placed, after: after.placed, hints: after.hints, noVio, persisted }));
}

// ---------- L9: tray pan + wheel scroll ----------
if (snap().lvl === 8 && snap().st === 'playing') {
  const overflow = g.call('trayContentWidth()-(W-24)');
  if (overflow > 0) {
    // press in the 8px gap between card0 and card1 -> pan gesture
    const gap = JSON.parse(g.call('(function(){var cw=cardW(),ty=H-trayH+10,ch=trayH-18,total=trayContentWidth(),sx=total<(W-24)?(W-total)/2:12;return JSON.stringify({x:sx+cw+4,y:ty+ch/2});})()'));
    pev('pointerdown', gap.x, gap.y);
    pev('pointermove', gap.x - 300, gap.y);
    pev('pointerup', gap.x - 300, gap.y);
    g.pump(1);
    const panTarget = g.call('trayScrollTarget');
    // wheel inside the tray band scrolls too
    pev('wheel', 200, g.call('H-trayH+30'), { deltaY: 40 });
    g.pump(1);
    const wheelTarget = g.call('trayScrollTarget');
    // pan back to origin so the leftmost card is visible again
    pev('pointerdown', gap.x, gap.y);
    pev('pointermove', gap.x + 400, gap.y);
    pev('pointerup', gap.x + 400, gap.y);
    g.pump(1);
    const back = g.call('trayScrollTarget');
    ck('L09:tray-pan+wheel', panTarget > 0 || wheelTarget > 0, JSON.stringify({ overflow: Math.round(overflow), panTarget, wheelTarget, back }));
  } else ck('L09:tray-pan+wheel', false, 'no overflow to scroll (guests=' + snap().tray + ')');
}

// ---------- main loop L3..L25 (levels not yet finished above) ----------
for (let guard = 0; guard < 40; guard++) {
  const st = snap();
  if (st.st === 'won') { // level finished by aux blocks above
    if (!g.els.victoryModal.classList.contains('hidden')) { g.els.modalNext.click(); g.pump(2); continue; }
    g.pump(72);
    if (!g.els.victoryModal.classList.contains('hidden')) { g.els.modalNext.click(); g.pump(2); continue; }
    break;
  }
  if (st.st !== 'playing') break;
  const n = st.lvl + 1;
  const tag = 'L' + (n < 10 ? '0' + n : n);
  const done = playLevelToWin(tag);
  if (!done) break;
  g.els.modalNext.click(); g.pump(2);
}

// after L25 NEXT -> level select
{
  const st = snap();
  ck('flow:all-25-levels-done', st.st === 'levelSelect' && g.call('saveData.unlockedLevel') === 25, S());
  ck('flow:modalNext-says-LEVELS-on-last', g.els.modalNext.textContent === 'LEVELS', g.els.modalNext.textContent);
  // save persistence
  const raw = g.ls.getItem('seatingPuzzleSave');
  let sv = null; try { sv = JSON.parse(raw); } catch (e) {}
  const starsOk = sv && Array.from({ length: 25 }, (_, i) => sv.levelStars[i + 1] === 3).every(Boolean);
  const bestOk = sv && Array.from({ length: 25 }, (_, i) => typeof sv.bestScores[i + 1] === 'number').every(Boolean);
  ck('save:persisted-25-levels-3stars', !!sv && sv.unlockedLevel === 25 && starsOk && bestOk, raw ? 'unlocked=' + sv.unlockedLevel : 'no save');
  // grid: 25 buttons, all unlocked+completed
  const grid = g.call('(function(){var bs=[];(function w(e){for(var i=0;i<(e.children||[]).length;i++){var c=e.children[i];if(c.tagName==="BUTTON"&&String(c.className).indexOf("level-btn")>=0)bs.push(String(c.className));w(c);}})(document.getElementById("tierContainer"));return JSON.stringify(bs);})()');
  const cls = JSON.parse(grid);
  ck('grid:25-buttons-all-completed', cls.length === 25 && cls.every(c => /completed/.test(c)), grid.slice(0, 120));
}

// ---------- level select -> replay L10 via grid button ----------
{
  const ok = g.call('(function(){var btns=[];(function w(e){for(var i=0;i<(e.children||[]).length;i++){var c=e.children[i];if(c.tagName==="BUTTON"&&String(c.className).indexOf("level-btn")>=0)btns.push(c);w(c);}})(document.getElementById("tierContainer"));if(btns[9]&&typeof btns[9].onclick==="function"){btns[9].click();return true;}return false;})()');
  g.pump(2);
  const st = snap();
  ck('grid:click-L10-starts-level', ok && st.st === 'playing' && st.lvl === 9, S());
  if (st.st !== 'playing' || st.lvl !== 9) { ck('L10:reset-clears-board', false, 'L10 not started'); ck('L10:quit-to-levelselect', false, 'L10 not started'); }
  else {
  // reset mid-level
  const gid = g.call('trayOrder[0]');
  const sol = solve();
  placeViaDrag(gid, sol[gid]);
  const placedOne = snap().moves === 1;
  const resetBtn = deepButtons('hud')[3]; // ⟳ reset (no id)
  resetBtn.click(); g.pump(2);
  const rs = snap();
  ck('L10:reset-clears-board', placedOne && rs.st === 'playing' && rs.moves === 0 && rs.placed === 0 && rs.tray === g.call('L.guests.length'), JSON.stringify({ placedOne, rs }));
  // quit -> back to level select
  deepButtons('hud')[0].click(); g.pump(2); // ≡ menu
  ck('L10:quit-to-levelselect', snap().st === 'levelSelect');
  }
}

// ---------- settings toggles ----------
{
  deepButtons('levelSelect')[0].click(); g.pump(1); // BACK -> title
  deepButtons('titleScreen')[3].click(); g.pump(1); // SETTINGS
  const open = !g.els.settingsScreen.classList.contains('hidden');
  const s0 = g.call('sfxOn');
  bodyFind('sfxToggle').click();
  const s1 = g.call('sfxOn');
  const persisted = JSON.parse(g.ls.getItem('seatingPuzzleSave')).sfxMuted === true;
  bodyFind('sfxToggle').click(); // restore
  const s2 = g.call('sfxOn');
  deepButtons('settingsScreen').slice(-1)[0].click(); g.pump(1); // CLOSE -> title
  ck('settings:sfx-toggle-persists', open && s0 === true && s1 === false && persisted && s2 === true, JSON.stringify({ open, s0, s1, s2, persisted }));
}

// ---------- returning player: PLAY resumes at highest unlocked (L25) ----------
{
  deepButtons('titleScreen')[0].click(); g.pump(2); // PLAY
  const st = snap();
  ck('flow:play-resumes-at-L25', st.st === 'playing' && st.lvl === 24, S());
  const muteBtn = g.els.muteBtn; // els stub carries the compiled onclick
  const m0 = g.call('musOn'); muteBtn.click(); const m1 = g.call('musOn'); muteBtn.click(); const m2 = g.call('musOn');
  ck('hud:mute-quick-toggle', m0 === true && m1 === false && m2 === true, JSON.stringify({ m0, m1, m2 }));
  deepButtons('hud')[0].click(); g.pump(2); // ≡ back to level select
}

// ---------- daily challenge ----------
{
  deepButtons('titleScreen')[1].click(); g.pump(2); // DAILY CHALLENGE
  const st = snap();
  ck('daily:starts-playing', st.st === 'playing' && g.call('isDaily') === true, S());
  ck('daily:constraints-survived', !g.call('L.guests.every(function(g){return g.constraints.length===0;})'), 'daily fell back to constraint-clear');
  const won = playLevelToWin('DAILY');
  const dn = g.call('dailyKey()');
  const saved = g.call('JSON.stringify(saveData.daily)');
  const dsv = JSON.parse(saved);
  ck('daily:win-saved', won && dsv && dsv.date === dn && dsv.stars === 3, saved);
  if (!g.els.victoryModal.classList.contains('hidden')) {
    ck('daily:modalNext-says-LEVELS', g.els.modalNext.textContent === 'LEVELS');
    g.els.modalNext.click(); g.pump(2);
    ck('daily:next-to-levelselect', snap().st === 'levelSelect');
  }
  extra.daily = dsv;
}

// ---------- constraint-type census across the session ----------
{
  const census = JSON.parse(g.call('(function(){var t={};SPECS.forEach(function(sp,i){t["L"+(i+1)]=sp.allow?Object.keys(sp.allow).filter(function(k){return sp.allow[k];}):[];});return JSON.stringify(t);})()'));
  extra.specCensus = census;
  const all = ['next', 'notnext', 'face', 'tablenum', 'tabletype', 'near'];
  const seen = new Set(Object.values(census).flat());
  ck('specs:all-6-constraint-types-used', all.every(t => seen.has(t)), JSON.stringify([...seen]));
}

// ---------- cleanup listener does not crash ----------
{
  g.sandbox.dispatchEvent({ type: 'beforeunload' });
  g.pump(2);
  ck('cleanup:beforeunload-clean', true);
}

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
extra.levels = 25;
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
