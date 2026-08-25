// tangram engine verifier — vm harness, real input paths only.
// Wins flow through the engine's own snapPiece -> checkWin -> completeLevel
// path, driven by REAL canvas pointer events (down at piece center, br/bf
// orientation buttons, move to slot px, up -> snap) level by level L1..L30,
// using the per-piece solution slots carried in LVLS[i].q (regenerated with
// exact-tiling level data after the 3 engine P0s: wrong parallelogram shape,
// untileable silhouettes, no snap).
// Also covers: undo, reset, drop-outside-sil, double-tap rotate, wrong-rot
// rejection + br-snap recovery, hint exact slot, drag-placed-back-out, menu
// mid-level, title settings toggles + persistence, boot2 LS carry-over,
// gzConfirm progress reset.
'use strict';
const path = require('path');
const fs = require('fs');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }
// visible unless explicitly display:none ('' = stylesheet default = visible overlay)
function vis(g, id) { return el(g, id).style.display !== 'none'; }
function click(g, id) {
  const e = el(g, id);
  if (typeof e.onclick === 'function') e.onclick({ type: 'click', preventDefault() {} });
  else e.dispatch('click', { type: 'click', preventDefault() {} });
}
const cv = g => el(g, 'c');
function down(g, x, y) { cv(g).dispatch('pointerdown', { type: 'pointerdown', clientX: x, clientY: y, preventDefault() {} }); }
function move(g, x, y) { cv(g).dispatch('pointermove', { type: 'pointermove', clientX: x, clientY: y, preventDefault() {} }); }
function up(g, x, y) { cv(g).dispatch('pointerup', { type: 'pointerup', clientX: x, clientY: y, preventDefault() {} }); }

// slot px target for piece idx in the CURRENT level, straight from engine data
function slot(g, idx) {
  return g.call('(function(){var q=LVLS[curLevel].q[' + idx + '];return [cx+q[0]*U,cy+q[1]*U,q[2],q[3]===1]})()');
}
// grab the topmost unplaced piece by tapping tray points topmost-first; returns
// the grabbed piece's idx or -1 (a shadowing PLACED piece is released in place)
function grabUnplaced(g) {
  const pts = g.call('(function(){var o=[];for(var i=pieces.length-1;i>=0;i--){var p=pieces[i];if(!p.placed)o.push([p.x,p.y])}return o})()');
  for (const pt of pts) {
    down(g, pt[0], pt[1]);
    const got = g.call('(dragPiece&&!dragPiece.placed)?dragPiece.idx:-1');
    if (got >= 0) return got;
    up(g, pt[0], pt[1]); // release the placed piece where it lies (no-op snap)
    g.pump(1);
  }
  return -1;
}
// with dragPiece held: rotate/flip to target orientation, move to slot, drop.
// dragOff is 0 because down() landed exactly on the piece center.
function dropHeldAtSlot(g, idx, wrongRotOff) {
  const s = slot(g, idx);
  const cur = g.call('[dragPiece.rot,dragPiece.flip]');
  let want = s[2];
  if (wrongRotOff) want = (s[2] + wrongRotOff) % 8;
  for (let i = 0; i < (want - cur[0] + 8) % 8; i++) click(g, 'br');
  if (!!cur[1] !== (wrongRotOff ? !!cur[1] : !!s[3])) click(g, 'bf');
  move(g, s[0], s[1]);
  up(g, s[0], s[1]);
}
// full normal solve of the current level via real drags; returns checks
function solveLevel(g, skip) {
  let guard = 0;
  while (g.call('pieces.filter(function(p){return !p.placed}).length') > 0) {
    if (guard++ > 12) throw new Error('solve stuck L' + (g.call('curLevel') + 1));
    const idx = grabUnplaced(g);
    if (idx < 0) throw new Error('grab failed');
    if (skip && skip.indexOf(idx) >= 0) { up(g, 20, 20); g.pump(1); continue; } // shouldn't happen
    dropHeldAtSlot(g, idx, 0);
    g.pump(1);
  }
}

// ---------- boot 1 ----------
const g = harness.bootGame('tangram');
ck('boot1: no load errors', errs(g).length === 0, errs(g).join(' | '));
ck('boot1: 30 levels', g.call('LVLS.length') === 30, String(g.call('LVLS.length')));
ck('boot1: every level has 7 slots', g.call('LVLS.every(function(l){return l.q.length===7&&l.s.length>=4})') === true);
ck('boot1: title visible', vis(g, 'ts'));
ck('boot1: fresh save', g.call('Object.keys(st.completed).length') === 0);

// settings from title (was P2-unreachable before the bset button)
click(g, 'bset');
ck('settings: opens from title', vis(g, 'ss'));
ck('settings: sound toggle sync', el(g, 'tgs').className === 'tg on', el(g, 'tgs').className);
click(g, 'tgs');
ck('settings: sound off class', el(g, 'tgs').className === 'tg');
ck('settings: sound persisted', JSON.parse(g.ls.getItem('tangram_save_v2')).s.settings.sound === false);
click(g, 'tgm');
ck('settings: music off persisted', JSON.parse(g.ls.getItem('tangram_save_v2')).s.settings.music === false);
click(g, 'bbs');
ck('settings: back re-shows title (was black screen)', vis(g, 'ts') && !vis(g, 'ss'));
click(g, 'tgs'); // sound back ON (panel hidden — handler still toggles+p persists)
click(g, 'bset'); click(g, 'tgm'); // re-open syncs classes; music back ON
ck('settings: restored on defaults', el(g, 'tgs').className === 'tg on' && el(g, 'tgm').className === 'tg on');
click(g, 'bbs');

// level select
click(g, 'bp');
ck('levels: grid shown', vis(g, 'ls') && !vis(g, 'ts'));
function cells(g) {
  const out = [];
  (function walk(e) { (e.children || []).forEach(c => { if ((c.className || '').indexOf('lc') >= 0) out.push(c); walk(c); }); })(el(g, 'lco'));
  return out;
}
const cs1 = cells(g);
ck('levels: 30 cells', cs1.length === 30, String(cs1.length));
ck('levels: L1 unlocked L2 locked', cs1[0].className.indexOf('lk') < 0 && cs1[1].className.indexOf('lk') >= 0);

// ---------- L1: input-path toolbox ----------
cs1[0].onclick({ type: 'click', preventDefault() {} });
ck('L1: started', g.call('levelActive') === true && g.call('curLevel') === 0 && vis(g, 'hud'));
ck('L1: 7 pieces in tray', g.call('pieces.length') === 7 && g.call('pieces.every(function(p){return !p.placed&&p.x===p.trayX&&p.y===p.trayY})') === true);
ck('L1: hud level number', String(el(g, 'hl').textContent) === '1');

// double-tap rotates without dragging
const before = g.call('pieces[6].rot');
down(g, g.call('pieces[6].x'), g.call('pieces[6].y'));
down(g, g.call('pieces[6].x'), g.call('pieces[6].y')); // same VDate frame => <350ms
up(g, g.call('pieces[6].x'), g.call('pieces[6].y'));
ck('L1: double-tap rotates piece', g.call('pieces[6].rot') === (before + 1) % 8, g.call('pieces[6].rot') + ' vs ' + before);
g.pump(2);

// drop far outside silhouette -> back to tray, unplaced
{
  const idx = grabUnplaced(g);
  ck('L1: grab works', idx >= 0);
  move(g, 15, 15); up(g, 15, 15);
  g.pump(2);
  ck('L1: outside drop returns to tray', g.call('pieces.filter(function(p){return p.placed}).length') === 0 &&
    g.call('pieces.every(function(p){return p.x===p.trayX&&p.y===p.trayY})') === true);
}

// place one piece then undo
{
  const idx = grabUnplaced(g);
  dropHeldAtSlot(g, idx, 0);
  g.pump(2);
  ck('L1: piece placed+snapped', g.call('(function(){var p=pieces.filter(function(q){return q.idx===' + idx + '})[0];var s=[' + slot(g, idx).join(',') + '];return p.placed&&Math.abs(p.x-s[0])<1e-6&&Math.abs(p.y-s[1])<1e-6})()') === true);
  click(g, 'bu');
  ck('L1: undo returns piece to tray', g.call('pieces.filter(function(p){return p.placed}).length') === 0);
}

// reset button restores pristine state after two placements
{
  const a = grabUnplaced(g); dropHeldAtSlot(g, a, 0);
  const b = grabUnplaced(g); dropHeldAtSlot(g, b, 0);
  g.pump(2);
  click(g, 'bx');
  ck('L1: reset clears placements+orientation', g.call('pieces.every(function(p){return !p.placed&&p.rot===0&&!p.flip&&p.x===p.trayX&&p.y===p.trayY})') === true &&
    g.call('undoStack.length') === 0);
}

// wrong orientation at the exact slot must NOT win; br on the placed piece
// snaps it and wins (tests rejection + recovery through real buttons)
{
  // place 6 correctly
  let n = 0;
  while (g.call('pieces.filter(function(p){return !p.placed}).length') > 1) {
    const idx = grabUnplaced(g);
    dropHeldAtSlot(g, idx, 0);
    g.pump(1); n++;
  }
  ck('L1: 6 placed', n >= 6);
  const lastIdx = grabUnplaced(g);
  dropHeldAtSlot(g, lastIdx, 1); // one rotation off, dropped at exact slot px
  g.pump(45); // > 150ms checkWin + 500ms overlay window
  ck('L1: wrong rotation rejected (no win)', !vis(g, 'cs'));
  const s = slot(g, lastIdx);
  const need = (s[2] - g.call('(function(){for(var i=pieces.length-1;i>=0;i--)if(pieces[i].placed)return pieces[i].rot})()') + 8) % 8;
  for (let i = 0; i < need; i++) { click(g, 'br'); g.pump(1); }
  g.pump(45);
  ck('L1: br on placed piece snaps -> win', vis(g, 'cs') === true && el(g, 'cs').style.display === 'flex');
  ck('L1: 3 stars', (el(g, 'cst').innerHTML.match(/#ffdd00/g) || []).length === 3, el(g, 'cst').innerHTML);
  ck('L1: score breakdown shown', el(g, 'sb').innerHTML.indexOf('1000') >= 0);
  ck('L1: achievements first+speed+nohint', g.call('st.achievements.first===true&&st.achievements.speed===true&&st.achievements.nohint===true') === true);
  ck('L1: saved', JSON.parse(g.ls.getItem('tangram_save_v2')).s.completed['0'] === true);
}

// ---------- L2..L30 chain ----------
click(g, 'bn');
ck('L2: next starts', g.call('curLevel') === 1 && String(el(g, 'hl').textContent) === '2');

// menu mid-level then re-enter
click(g, 'bm');
ck('L2: menu mid-level', vis(g, 'ls') && !vis(g, 'hud') && g.call('levelActive') === false);
{
  const c2 = cells(g);
  const cell2 = c2.filter(c => String(c.getAttribute && c.getAttribute('data-lv')) === '1')[0] || c2[1];
  cell2.onclick({ type: 'click', preventDefault() {} });
}
ck('L2: re-entered fresh', g.call('levelActive') === true && g.call('pieces.every(function(p){return !p.placed})') === true);

// hint places the next piece at its EXACT slot (P1 fix: was random pos/rot)
{
  const h0 = g.call('st.hints');
  const hu0 = g.call('hintsUsed');
  click(g, 'bh');
  g.pump(2);
  const pl = g.call('(function(){var q=pieces.filter(function(p){return p.placed});if(q.length!==1)return null;var p=q[0],s=LVLS[curLevel].q[p.idx];return [p.idx,p.x,p.y,p.rot,p.flip,s]})()');
  ck('L2: hint placed exactly one piece', pl !== null);
  ck('L2: hint at exact slot (idx ' + (pl ? pl[0] : '?') + ')', pl !== null &&
    Math.abs(pl[1] - (g.call('cx') + pl[5][0] * 50)) < 1e-6 &&
    Math.abs(pl[2] - (g.call('cy') + pl[5][1] * 50)) < 1e-6 &&
    pl[3] === pl[5][2] && pl[4] === (pl[5][3] === 1));
  ck('L2: hint budget decremented', g.call('st.hints') === h0 - 1 && g.call('hintsUsed') === hu0 + 1);
}
solveLevel(g);
g.pump(45);
ck('L2: win overlay', el(g, 'cs').style.display === 'flex');
ck('L2: 3 stars despite 1 hint', (el(g, 'cst').innerHTML.match(/#ffdd00/g) || []).length === 3);

for (let lv = 2; lv < 30; lv++) {
  click(g, 'bn');
  if (g.call('curLevel') !== lv) { ck('L' + (lv + 1) + ': started', false, 'curLevel=' + g.call('curLevel')); break; }
  ck('L' + (lv + 1) + ': started', true);
  ck('L' + (lv + 1) + ': hud number', String(el(g, 'hl').textContent) === String(lv + 1));
  if (lv === 14) {
    // drag a PLACED piece back out to the tray mid-solve
    const idx = grabUnplaced(g); dropHeldAtSlot(g, idx, 0); g.pump(1);
    const idx2 = grabUnplaced(g); dropHeldAtSlot(g, idx2, 0); g.pump(25); // >350ms: avoid the double-tap branch
    const px = g.call('(function(){var q=pieces.filter(function(p){return p.placed});return [q[q.length-1].x,q[q.length-1].y]})()');
    down(g, px[0], px[1]);
    const got = g.call('dragPiece?dragPiece.idx:-1');
    move(g, 40, 520); up(g, 40, 520); g.pump(2);
    ck('L15: placed piece draggable back out', g.call('(function(){var p=pieces.filter(function(q){return q.idx===' + got + '})[0];return !p.placed&&p.x===p.trayX&&p.y===p.trayY})()') === true);
  }
  solveLevel(g);
  g.pump(45);
  ck('L' + (lv + 1) + ': win overlay', el(g, 'cs').style.display === 'flex', el(g, 'cs').style.display);
  ck('L' + (lv + 1) + ': 3 stars', (el(g, 'cst').innerHTML.match(/#ffdd00/g) || []).length === 3);
  // every piece exactly snapped at its slot
  ck('L' + (lv + 1) + ': exact tiling state', g.call('(function(){for(var i=0;i<7;i++){var p=pieces[i],q=LVLS[curLevel].q[p.idx];if(!p.placed)return false;if(Math.abs(p.x-(cx+q[0]*U))>1e-6||Math.abs(p.y-(cy+q[1]*U))>1e-6)return false;if(p.rot!==q[2]||p.flip!==(q[3]===1))return false}return true})()') === true);
}

// after L30 win, Next -> level select with everything unlocked
click(g, 'bn');
ck('L30: Next -> level select', vis(g, 'ls'));
const csEnd = cells(g);
ck('all 30 unlocked', csEnd.every(c => c.className.indexOf('lk') < 0));
ck('all 30 starred', ((el(g, 'lco').innerHTML.match(/&#9733;/g) || []).length >= 30));
ck('progress: 30 completed + master achievement', g.call('Object.keys(st.completed).length===30&&st.achievements.master===true') === true);
ck('progress: totalScore > 0', g.call('st.totalScore') > 0);

// ---------- boot 2: returning player ----------
const snap = Object.assign({}, g.ls._m);
const g2 = harness.bootGame('tangram', { seedLS: snap });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
ck('boot2: title first', vis(g2, 'ts'));
click(g2, 'bp');
const csB2 = cells(g2);
ck('boot2: progress carried (30 unlocked)', csB2.every(c => c.className.indexOf('lk') < 0));
ck('boot2: save intact', g2.call('Object.keys(st.completed).length') === 30);

// ---------- reset flow (boot2, gzConfirm dynamic dialog) ----------
click(g2, 'bbt');
click(g2, 'bset');
click(g2, 'brp');
function findYes(node) {
  let out = null;
  (function walk(e) {
    (e.children || []).forEach(c => {
      if (c.textContent === 'Yes' && typeof c.onclick === 'function') out = c;
      walk(c);
    });
  })(node);
  return out;
}
const yesBtn = findYes(g2.sandbox.document.body);
ck('reset: confirm dialog Yes button found', !!yesBtn);
if (yesBtn) yesBtn.onclick({ type: 'click', preventDefault() {} });
g2.pump(2);
ck('reset: progress cleared', g2.call('Object.keys(st.completed).length') === 0 && g2.call('st.hints') === 3);
ck('reset: level select shown fresh', vis(g2, 'ls'));
const csR = cells(g2);
ck('reset: L2 locked again', csR[0].className.indexOf('lk') < 0 && csR[1].className.indexOf('lk') >= 0);

// replay L1 after reset still wins (engine fully reusable)
csR[0].onclick({ type: 'click', preventDefault() {} });
solveLevel(g2);
g2.pump(45);
ck('post-reset: L1 replay wins', el(g2, 'cs').style.display === 'flex');

// ---------- summary ----------
const extra = {
  levels: 30, stars3: g.call('(function(){var n=0;for(var k in st.stars)if(st.stars[k]>=3)n++;return n})()'),
  completed: g.call('Object.keys(st.completed).length'),
};
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
