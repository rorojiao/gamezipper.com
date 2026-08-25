#!/usr/bin/env node
/* windmill-sudoku (4 overlapping 9x9 grids on a 21x21 pinwheel board) — Type A verifier:
 * solve all 27 levels by tapping the canvas cell (pointerdown -> getCellFromPoint ->
 * G.selected) and pressing palette digits (placeValue), the engine's own real input path.
 * placeValue debounces 60ms via virtual performance.now -> pump(4) between placements.
 * Plus: composite-board data integrity (per-grid sudoku validity, puzzle subset, shared
 * corner regions agree across grids), mistakes/3 -> lose modal -> restart, undo, notes +
 * clearNotesAround, check, hint, keyboard input, level select, resume, mute. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('windmill-sudoku');
const board = g.els['board'];
const results = [];
const extra = { levels: 27, engineBugsFixed: [], tiers: {}, dataIntegrity: {}, flow: {}, notes: ['P3 (documented, not fixed): placeValue only re-checks mistakes>=3 AFTER incrementing — a tap within the 400ms before the lose modal appears logs a 4th mistake (toast "4/3"); modal still opens and restart recovers'] };

function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }
function pump4() { g.pump(4); } // 66.7ms virtual > 60ms placeValue debounce
function geom() {
  const r = board.getBoundingClientRect(); // stub rect: 480x640 (offsetW/H defaults) — engine scales each axis separately
  return { cell: g.call('CANVAS_CELL'), w: g.call('canvas.width'), h: g.call('canvas.height'), rw: r.width, rh: r.height };
}
function tapCell(br, bc, Gm) {
  const px = 16 + (bc + 0.5) * Gm.cell, py = 16 + (br + 0.5) * Gm.cell;
  board.dispatch('pointerdown', { clientX: px * Gm.rw / Gm.w, clientY: py * Gm.rh / Gm.h, preventDefault() {} });
}
function pressVal(n) { g.els['palette'].children[n - 1].dispatch('pointerdown', { preventDefault() {} }); }
function click(id) { g.els[id].click(); g.pump(2); }

// ---------- data integrity of all 27 embedded levels ----------
const LDATA = JSON.parse(g.call('JSON.stringify(LEVELS)'));
const ORIG = { A: [0, 6], B: [6, 12], C: [12, 6], D: [6, 0] };
{
  let sudokuErr = 0, subErr = 0, sharedErr = 0, givenClash = 0;
  const perm = (a) => a.length === 9 && a.slice().sort((x, y) => x - y).every((d, i) => d === i + 1);
  for (const L of LDATA) {
    for (const tag of ['A', 'B', 'C', 'D']) {
      const S = L['solution' + tag], P = L['puzzle' + tag];
      if (!S.every(row => perm(row))) sudokuErr++;
      for (let c = 0; c < 9; c++) if (!perm(S.map(row => row[c]))) sudokuErr++;
      for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
        const box = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box.push(S[br * 3 + r][bc * 3 + c]);
        if (!perm(box)) sudokuErr++;
      }
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (P[r][c] !== 0 && P[r][c] !== S[r][c]) subErr++;
    }
    // rebuild the 21x21 composite exactly like initLevel; last write must agree
    const cells = Array.from({ length: 21 }, () => Array(21).fill(null));
    for (const tag of ['A', 'B', 'C', 'D']) {
      const [r0, c0] = ORIG[tag], S = L['solution' + tag], P = L['puzzle' + tag];
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const br = r0 + r, bc = c0 + c;
        if (!cells[br][bc]) cells[br][bc] = { sol: 0, given: 0 };
        const cell = cells[br][bc];
        if (cell.sol !== 0 && cell.sol !== S[r][c]) sharedErr++;
        cell.sol = S[r][c];
        if (P[r][c] !== 0) {
          if (cell.given !== 0 && cell.given !== P[r][c]) givenClash++;
          cell.given = P[r][c];
        }
      }
    }
  }
  ck('data:108-valid-sudoku-grids', sudokuErr === 0, sudokuErr + ' bad groups');
  ck('data:108-puzzles-subset', subErr === 0, subErr + ' clashes');
  ck('data:shared-corners-agree', sharedErr === 0 && givenClash === 0, 'sol=' + sharedErr + ' given=' + givenClash);
  extra.dataIntegrity = { sudokuErr, subErr, sharedErr, givenClash };
  for (const L of LDATA) extra.tiers[L.tier] = (extra.tiers[L.tier] || 0) + 1;
}

// ---------- boot ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
ck('boot:L1-loaded', g.call('G.levelIdx') === 0 && String(g.els['lvl-num'].textContent) === '1' && String(g.els['lvl-tier'].textContent) === 'Beginner');
ck('board:288-cells', g.call('(function(){var n=0;for(var r=0;r<21;r++)for(var c=0;c<21;c++)if(G.cells[r][c])n++;return n;})()') === 288, '4x81 - 4x9 shared');
ck('board:36-shared-cells', g.call('(function(){var n=0;for(var r=0;r<21;r++)for(var c=0;c<21;c++){var x=G.cells[r][c];if(x&&x.grids.size===2)n++;}return n;})()') === 36);

// ---------- solve all 27 levels through real input ----------
let solvedAll = true;
for (let i = 0; i < 27; i++) {
  if (g.call('G.levelIdx') !== i) { ck('L' + (i + 1) + ':idx', false, 'levelIdx=' + g.call('G.levelIdx')); solvedAll = false; break; }
  const Gm = geom();
  const empt = JSON.parse(g.call('(function(){var e=[];for(var br=0;br<21;br++)for(var bc=0;bc<21;bc++){var c=G.cells[br]&&G.cells[br][bc];if(c&&c.value!==c.solution)e.push([br*32+bc,c.solution]);}return JSON.stringify(e);})()'));
  let err = null;
  g.pump(5); // virtual clock starts at 0 with G._lastInputAt=0 — first press needs now-last>=60ms
  for (const [rc, v] of empt) {
    const br = rc >> 5, bc = rc & 31;
    tapCell(br, bc, Gm);
    const sel = JSON.parse(g.call('JSON.stringify(G.selected)') || 'null');
    if (!sel || sel.br !== br || sel.bc !== bc) { err = 'sel-miss ' + br + ',' + bc; break; }
    pump4(); pressVal(v);
    if (g.call('G.cells[' + br + '][' + bc + '].value') !== v) { err = 'place-miss ' + br + ',' + bc; break; }
    pump4();
  }
  if (!err && !g.call('G.done')) err = 'not-done';
  ck('L' + String(i + 1).padStart(2, '0') + ':solve-' + empt.length + 'cells', !err, err || '');
  if (err) { solvedAll = false; break; }
  g.pump(40); // 600ms win reveal
  const win = g.els['win-modal'].classList.contains('show');
  ck('L' + String(i + 1).padStart(2, '0') + ':win-3stars', win && g.els['win-stars'].textContent === '★★★', g.els['win-stars'].textContent);
  click('win-next');
  if (i === 26) ck('flow:last-level-toast', g.els['toast'].textContent.indexOf('All 27 levels complete') >= 0, g.els['toast'].textContent);
}
{
  const prog = JSON.parse(g.ls.getItem('windmillSudoku_progress_v1') || '{}');
  ck('save:27-completed', (prog.completed || []).length === 27 && Array.from({ length: 27 }, (_, i) => (prog.completed || []).includes(LDATA[i].id)).every(Boolean), JSON.stringify((prog.completed || []).length));
  ck('save:27-best-times', Object.keys(prog.bestTimes || {}).length === 27);
}

// ---------- level select ----------
click('btn-levels');
ck('levels:modal-27-all-done', g.els['levels-modal'].classList.contains('show') && g.els['level-grid'].children.length === 27 && g.els['level-grid'].children.filter(c => c.classList.contains('done')).length === 27);
g.els['level-grid'].children[0].click(); g.pump(2);
ck('levels:replay-L1', g.call('G.levelIdx') === 0 && g.call('G.mistakes') === 0);

// ---------- given cells immutable ----------
{
  const gr = JSON.parse(g.call('(function(){for(var r=0;r<21;r++)for(var c=0;c<21;c++){var x=G.cells[r][c];if(x&&x.given)return JSON.stringify([r,c,x.value]);}return "null";})()'));
  const Gm = geom();
  tapCell(gr[0], gr[1], Gm);
  pressVal(gr[2] === 1 ? 2 : 1); pump4();
  ck('input:given-protected', g.call('G.cells[' + gr[0] + '][' + gr[1] + '].value') === gr[2]);
}

// ---------- keyboard digit placement (real input path) ----------
{
  const Gm = geom();
  const e = JSON.parse(g.call('(function(){for(var r=0;r<21;r++)for(var c=0;c<21;c++){var x=G.cells[r][c];if(x&&!x.given&&x.value===0)return JSON.stringify([r,c,x.solution]);}return "null";})()'));
  tapCell(e[0], e[1], Gm);
  pump4(); // clear the 60ms input debounce before the keypress
  g.key(String(e[2]));
  ck('input:keyboard-digit', g.call('G.cells[' + e[0] + '][' + e[1] + '].value') === e[2]);
  g.call('undo()'); // clean up (engine's own undo via direct call — keyboard path covered by 'n' below)
}

// ---------- notes + clearNotesAround ----------
{
  const Gm = geom();
  // pick cell A and a same-row peer P inside the same grid with P.sol !== A.sol
  const pick = JSON.parse(g.call('(function(){for(var tag of ["A","B","C","D"]){var o={A:[0,6],B:[6,12],C:[12,6],D:[6,0]}[tag];for(var lr=0;lr<9;lr++){var rowEmpty=[];for(var lc=0;lc<9;lc++){var x=G.cells[o[0]+lr][o[1]+lc];if(x&&!x.given&&x.value===0)rowEmpty.push([o[0]+lr,o[1]+lc,x.solution]);}if(rowEmpty.length>=2){for(var i=0;i<rowEmpty.length;i++)for(var j=0;j<rowEmpty.length;j++){if(i!==j&&rowEmpty[i][2]!==rowEmpty[j][2])return JSON.stringify({A:rowEmpty[i],P:rowEmpty[j]});}}}}return "null";})()'));
  click('btn-notes'); // notes mode on
  tapCell(pick.A[0], pick.A[1], Gm); pump4();
  pressVal(pick.A[2]); pump4(); pressVal(pick.P[2]); pump4();
  const seeded = g.call('G.cells[' + pick.A[0] + '][' + pick.A[1] + '].notes.has(' + pick.A[2] + ')') && g.call('G.cells[' + pick.A[0] + '][' + pick.A[1] + '].notes.has(' + pick.P[2] + ')') && g.call('G.cells[' + pick.A[0] + '][' + pick.A[1] + '].value') === 0;
  click('btn-notes'); // off
  tapCell(pick.P[0], pick.P[1], Gm); pump4();
  pressVal(pick.P[2]); pump4(); // correct placement in same row -> clearNotesAround sweeps peers
  const cleared = !g.call('G.cells[' + pick.A[0] + '][' + pick.A[1] + '].notes.has(' + pick.P[2] + ')') && g.call('G.cells[' + pick.A[0] + '][' + pick.A[1] + '].notes.has(' + pick.A[2] + ')');
  ck('notes:seed+clearRelatedNotes', seeded && cleared, JSON.stringify({ seeded, cleared }));
  // undo restores the pre-placement snapshot (P back to empty, A notes intact)
  click('btn-undo');
  const undid = g.call('G.cells[' + pick.P[0] + '][' + pick.P[1] + '].value') === 0 && g.call('G.cells[' + pick.A[0] + '][' + pick.A[1] + '].notes.has(' + pick.A[2] + ')');
  ck('notes:undo-restores-snapshot', undid);
}

// ---------- mistake + toast + undo ----------
{
  const Gm = geom();
  const m = JSON.parse(g.call('(function(){for(var r=0;r<21;r++)for(var c=0;c<21;c++){var x=G.cells[r][c];if(x&&!x.given&&x.value===0)return JSON.stringify([r,c,x.solution]);}return "null";})()'));
  const wrong = m[2] === 1 ? 2 : 1;
  tapCell(m[0], m[1], Gm); pump4(); pressVal(wrong); pump4();
  const m1 = g.call('G.mistakes') === 1 && g.call('G.cells[' + m[0] + '][' + m[1] + '].value') === wrong && String(g.els['err-count'].textContent) === '1' && g.els['toast'].textContent.indexOf('1/3') >= 0;
  click('btn-check');
  const checked = g.els['toast'].textContent.indexOf('1 mistake') >= 0;
  click('btn-undo');
  const undone = g.call('G.cells[' + m[0] + '][' + m[1] + '].value') === 0 && g.call('G.mistakes') === 1;
  ck('flow:mistake+check+undo', m1 && checked && undone, JSON.stringify({ m1, checked, undone }));
}

// ---------- 3 mistakes -> lose modal -> restart (on a FRESH level so the count is exact) ----------
{
  click('btn-levels'); g.els['level-grid'].children[0].click(); g.pump(2); // fresh L1, mistakes=0
  const Gm = geom();
  const spots = JSON.parse(g.call('(function(){var e=[];for(var r=0;r<21;r++)for(var c=0;c<21;c++){var x=G.cells[r][c];if(x&&!x.given&&x.value===0)e.push([r,c,x.solution]);}return JSON.stringify(e.slice(0,3));})()'));
  for (const [r, c, sol] of spots) { tapCell(r, c, Gm); pump4(); pressVal(sol === 1 ? 2 : 1); pump4(); }
  g.pump(30); // 400ms lose reveal
  const lost = g.call('G.mistakes') === 3 && g.els['lose-modal'].classList.contains('show');
  click('lose-restart');
  const restarted = g.call('G.mistakes') === 0 && g.call('G.done') === false && !g.els['lose-modal'].classList.contains('show');
  ck('flow:lose-at-3+restart', lost && restarted, JSON.stringify({ lost, restarted }));
}

// ---------- hint then full solve -> 2 stars ----------
{
  click('btn-hint');
  const hints = g.call('G.hintsLeft') === 2 && String(g.els['hint-count'].textContent) === '2';
  const Gm = geom();
  const empt = JSON.parse(g.call('(function(){var e=[];for(var br=0;br<21;br++)for(var bc=0;bc<21;bc++){var c=G.cells[br]&&G.cells[br][bc];if(c&&c.value!==c.solution)e.push([br*32+bc,c.solution]);}return JSON.stringify(e);})()'));
  let err = null;
  for (const [rc, v] of empt) {
    const br = rc >> 5, bc = rc & 31;
    tapCell(br, bc, Gm);
    pump4(); pressVal(v); pump4();
    if (g.call('G.cells[' + br + '][' + bc + '].value') !== v) { err = 'miss ' + br + ',' + bc; break; }
  }
  g.pump(40);
  ck('flow:hint-solve-2stars', hints && !err && g.els['win-modal'].classList.contains('show') && g.els['win-stars'].textContent === '★★☆' && g.els['win-msg'].textContent.indexOf('1 hint') >= 0, err || g.els['win-stars'].textContent);
  click('win-next');
  ck('flow:win-next-L2', g.call('G.levelIdx') === 1);
}

// ---------- mute toggle ----------
click('btn-mute');
const muted = g.call('G.muted') === true && g.els['btn-mute'].textContent === 'Muted';
click('btn-mute');
ck('hud:mute-toggle', muted && g.els['btn-mute'].textContent === 'Sound');

// ---------- save/resume structure (boot() reuses initLevel(idx, loadSave())) ----------
{
  const Gm = geom();
  const e = JSON.parse(g.call('(function(){var o=[];for(var r=0;r<21&&o.length<3;r++)for(var c=0;c<21&&o.length<3;c++){var x=G.cells[r][c];if(x&&!x.given&&x.value===0)o.push([r,c,x.solution]);}return JSON.stringify(o);})()'));
  for (const [r, c, v] of e) { tapCell(r, c, Gm); pressVal(v); pump4(); }
  const sv = JSON.parse(g.ls.getItem('windmillSudoku-save-v1') || 'null');
  const structured = sv && sv.levelIdx === 1 && Array.isArray(sv.cells) && sv.cells[e[0][0]][e[0][1]] && sv.cells[e[0][0]][e[0][1]].v === e[0][2];
  g.call('initLevel(1, loadSave())'); // exact boot() resume call with the real saved blob
  const resumed = g.call('G.cells[' + e[0][0] + '][' + e[0][1] + '].user') === e[0][2] && g.call('G.cells[' + e[1][0] + '][' + e[1][1] + '].user') === e[1][2];
  ck('save:resume-restores-user-cells', structured && resumed, JSON.stringify({ structured, resumed }));
}

// ---------- cleanup ----------
g.sandbox.dispatchEvent({ type: 'beforeunload' });
g.pump(2);
ck('cleanup:exports+beforeunload', typeof g.call('window.__windmillSudokuCleanup') === 'function');
ck('runtime:no-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
