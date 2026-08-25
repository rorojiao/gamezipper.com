#!/usr/bin/env node
/* number-nexus end-to-end verifier (QA round 2026-08-25).
 * Real input paths only: UI navigation via real button clicks, board play via real
 * canvas pointerdown events (geometry replicated engine-exact from onIn), state
 * read back through a read-only __NN export injected into the engine IIFE scope.
 * Covers: menu/chapter/level navigation + locks, tutorial, invalid taps, full
 * solution play for sz4/5/6/8 boards, win modal (stars/best/save), next/retry/wrap,
 * daily challenge (no next button, ddDone save), hint/undo/clear/pause, stats,
 * sound toggle, back navigation, seeded-save unlocks (chapter>=5 stars, prev level),
 * plus an offline sweep of all 50 levels + today's daily (Hamiltonian path validity,
 * sol/puz/ig consistency, engine-exact vmoves win-replay, determinism).
 * Output: last stdout line is compact JSON {"pass":N,"fail":M,...}; exit 0 iff PASS. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'number-nexus';
let pass = 0, fail = 0; const fails = [];
function T(name, ok, note) {
  if (ok) { pass++; } else { fail++; fails.push(name + (note ? ' | ' + note : '')); }
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : (note ? '  << ' + note : '')));
}

/* ---------- offline sweep: extract RNG / mkPath / mkPuzzle / CH verbatim ---------- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const rngChunk = html.slice(html.indexOf('function RNG(s){'), html.indexOf('// --- Chapters'));
const pathChunk = html.slice(html.indexOf('function mkPath'), html.indexOf('// --- Save'));
const chChunk = html.slice(html.indexOf('var CH=['), html.indexOf('// --- Hamiltonian'));
const Off = new Function(rngChunk + pathChunk + chChunk + '\nreturn {RNG:RNG,mkPath:mkPath,mkPuzzle:mkPuzzle,CH:CH};')();

function boardOK(p, note) {
  if (!p) return note + ': null puzzle';
  const sz = p.sz, tot = sz * sz;
  if (p.path.length !== tot) return note + ': path length ' + p.path.length;
  const seen = new Set();
  for (let i = 0; i < tot; i++) {
    const [r, c] = p.path[i];
    if (r < 0 || r >= sz || c < 0 || c >= sz) return note + ': cell oob';
    seen.add(r + ',' + c);
    if (p.sol[r][c] !== i + 1) return note + ': sol mismatch at ' + i;
    const isG = p.puz[r][c] > 0;
    if (isG !== p.ig[i] || (isG && p.puz[r][c] !== i + 1)) return note + ': puz/ig mismatch at ' + i;
    if (i > 0) {
      const [pr, pc] = p.path[i - 1];
      if (Math.abs(r - pr) + Math.abs(c - pc) !== 1) return note + ': path not adjacent at ' + i;
    }
  }
  if (seen.size !== tot) return note + ': path not unique/covering';
  if (!p.ig[0] || !p.ig[tot - 1]) return note + ': endpoints not given';
  let givens = 0; for (let i = 0; i < tot; i++) if (p.ig[i]) givens++;
  if (givens < 4) return note + ': only ' + givens + ' givens';
  /* engine-exact win replay: place next missing number on its sol cell; each placement
   * must land on an empty cell adjacent (manhattan 1) to the cell holding nxt-1 */
  const grid = p.puz.map(row => row.slice());
  const findNxt = () => { for (let i = 1; i <= tot; i++) { let f = false; for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) if (grid[r][c] === i) f = true; if (!f) return i; } return tot + 1; };
  const cellOf = v => { for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) if (grid[r][c] === v) return [r, c]; return null; };
  let placed = 0, guard = 0;
  for (;;) {
    const nxt = findNxt();
    if (nxt > tot) break;
    let tc = null;
    for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) if (p.sol[r][c] === nxt) tc = [r, c];
    if (!tc) return note + ': no sol cell for ' + nxt;
    if (grid[tc[0]][tc[1]] !== 0) return note + ': sol cell ' + nxt + ' occupied (unsolvable by design?)';
    if (nxt > 1) { const pv = cellOf(nxt - 1); if (!pv || Math.abs(pv[0] - tc[0]) + Math.abs(pv[1] - tc[1]) !== 1) return note + ': sol cell ' + nxt + ' not adjacent to ' + (nxt - 1); }
    grid[tc[0]][tc[1]] = nxt; placed++;
    if (++guard > tot + 2) return note + ': replay runaway';
  }
  if (placed !== tot - givens) return note + ': placed ' + placed + ' expected ' + (tot - givens);
  return null;
}
(function offlineSweep() {
  const errs = [];
  for (let lv = 0; lv < 50; lv++) {
    const ch = Math.floor(lv / 10), l = lv % 10, sz = Off.CH[ch].size;
    const gp = Math.max(0.2, Off.CH[ch].given - l * 0.008);
    const e = boardOK(Off.mkPuzzle(sz, gp, lv * 7919 + 42), 'L' + (lv + 1));
    if (e) errs.push(e);
  }
  const d = new Date();
  const dSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const de = boardOK(Off.mkPuzzle(6, 0.35, dSeed), 'daily');
  if (de) errs.push(de);
  T('offline-51-boards-valid', errs.length === 0, errs.slice(0, 3).join('; '));

  /* determinism: same seed -> identical puzzle (the sort comparator draws from the
   * seeded RNG; V8 sort is deterministic, so mkPuzzle must be reproducible) */
  const det = [0, 10, 20, 30, 40].every(lv => {
    const a = Off.mkPuzzle(Off.CH[Math.floor(lv / 10)].size, 0.35, lv * 7919 + 42);
    const b = Off.mkPuzzle(Off.CH[Math.floor(lv / 10)].size, 0.35, lv * 7919 + 42);
    return JSON.stringify(a) === JSON.stringify(b);
  }) && JSON.stringify(Off.mkPuzzle(6, 0.35, dSeed)) === JSON.stringify(Off.mkPuzzle(6, 0.35, dSeed));
  T('offline-deterministic', det);
})();

/* ---------- boot A: fresh save, full journey ---------- */
const EXPORTS = 'globalThis.__NN={get scr(){return scr},get G(){return G},get SD(){return SD},get curLv(){return curLv},get isDly(){return isDly},get selCh(){return selCh},get cvW(){return cvs.width},get cvH(){return cvs.height},get auOn(){return Au.on},get dd(){return dlyD()}};';
const g = bootGame(SLUG, { inject: { anchor: "var cvs=document.getElementById('game-canvas')", exports: EXPORTS } });
const els = g.els;
const hidden = id => els[id].classList.contains('hidden');

function geo() {
  const w = g.call('__NN.cvW'), h = g.call('__NN.cvH'), sz = g.call('__NN.G.sz');
  let cs = Math.floor(Math.min((w - 24) / sz, (h - 24) / sz)); cs = Math.max(cs, 24);
  const gw = cs * sz;
  return { cs, ox: (w - gw) / 2, oy: (h - gw) / 2 };
}
function tap(r, c) {
  const o = geo();
  els['game-canvas'].dispatch('pointerdown', { clientX: o.ox + c * o.cs + o.cs / 2, clientY: o.oy + r * o.cs + o.cs / 2 });
}
function solCell(n) {
  return JSON.parse(g.call('(function(){var S=__NN.G.sol,z=__NN.G.sz;for(var r=0;r<z;r++)for(var c=0;c<z;c++)if(S[r][c]===' + n + ')return JSON.stringify([r,c]);return \'null\';})()'));
}
function solveAll(label) {
  let guard = 0;
  while (g.call('__NN.G.nxt') <= g.call('__NN.G.tot')) {
    const nxt = g.call('__NN.G.nxt');
    const cell = solCell(nxt);
    if (!cell) return label + ': no sol cell for ' + nxt;
    tap(cell[0], cell[1]);
    if (g.call('__NN.G.grid[' + cell[0] + '][' + cell[1] + ']') !== nxt) return label + ': tap at ' + cell + ' did not place ' + nxt;
    if (!(g.call('__NN.G.nxt') > nxt)) return label + ': nxt did not advance after ' + nxt;
    g.pump(1);
    if (++guard > 200) return label +': runaway';
  }
  return null;
}
function clickId(id) { g.call('document.getElementById("' + id + '").click()'); }

T('a-boot-clean', g.loadErrors.length === 0 && g.call('__NN.scr') === 'menu' && !hidden('menu-screen') && hidden('chapter-screen') && hidden('level-screen') && hidden('game-screen'), g.loadErrors.join('; '));
T('a-menu-labels', !!els['btn-play'] && !!els['btn-daily'] && !!els['btn-stats'] && !!els['btn-pause'] && !!els['btn-hint'] && !!els['btn-undo'] && !!els['btn-clear'] && hidden('tutorial-box') && !els['modal'].classList.contains('active'));

els['btn-play'].click();
const cards = els['chapter-grid'].children;
T('a-chapter-cards', g.call('__NN.scr') === 'chapter' && cards.length === 5 &&
  !cards[0].className.includes('locked') && [1, 2, 3, 4].every(i => cards[i].className.includes('locked')) &&
  cards[0].innerHTML.includes('Beginner') && cards[0].innerHTML.includes('0 / 30'), 'cards=' + cards.length);
cards[1].click();
T('a-locked-card-inert', g.call('__NN.scr') === 'chapter');
cards[0].click();
const lvBtns = els['level-grid'].children;
T('a-level-list', g.call('__NN.scr') === 'level' && g.call('__NN.selCh') === 0 && lvBtns.length === 10 &&
  !lvBtns[0].className.includes('locked') && [1, 2, 3, 4, 5, 6, 7, 8, 9].every(i => lvBtns[i].className.includes('locked')) &&
  els['level-title'].textContent.includes('Beginner'), 'btns=' + lvBtns.length);

lvBtns[0].click();
const G1 = () => g.call('JSON.stringify(__NN.G)');
T('a-start-l1', g.call('__NN.scr') === 'game' && g.call('__NN.curLv') === 0 && g.call('__NN.G.sz') === 4 &&
  g.call('__NN.G.tot') === 16 && g.call('__NN.G.hints') === 5 && g.call('__NN.G.run') === true &&
  els['level-label'].textContent === 'Level 1' && String(els['next-num'].textContent) === String(g.call('__NN.G.nxt')) &&
  String(els['hint-remain'].textContent) === '5');
T('a-tutorial-shows', !hidden('tutorial-box') && String(els['tutorial-box'].getAttribute('data-step')) === '0' &&
  els['tutorial-title'].textContent === 'Welcome to Number Nexus!' && els['tutorial-btn'].textContent === 'Next');
els['tutorial-btn'].click(); els['tutorial-btn'].click();
T('a-tutorial-step2', String(els['tutorial-box'].getAttribute('data-step')) === '2' && els['tutorial-btn'].textContent === 'Got it!');
els['tutorial-btn'].click();
const savedA = JSON.parse(g.ls.getItem('number_nexus_save_v2'));
T('a-tutorial-done-persisted', hidden('tutorial-box') && savedA.tut === true && g.call('__NN.SD.played') === 1);

const og = geo();
T('a-geometry', g.call('__NN.cvW') === 480 && g.call('__NN.cvH') === 640 && og.cs === 114 && og.ox === 12 && og.oy === 92,
  'w=' + g.call('__NN.cvW') + ' h=' + g.call('__NN.cvH') + ' cs=' + og.cs);

/* invalid taps: a given cell, and a valid-empty-but-not-adjacent cell */
const puzA = JSON.parse(g.call('JSON.stringify(__NN.G.puz)'));
let givenCell = null, farCell = null;
for (let r = 0; r < 4 && (!givenCell || !farCell); r++) for (let c = 0; c < 4; c++) {
  if (!givenCell && puzA[r][c] > 0) givenCell = [r, c];
  if (!farCell && puzA[r][c] === 0 && g.call('__NN.G.sol[' + r + '][' + c + ']') !== g.call('__NN.G.nxt')) farCell = [r, c];
}
const gridBefore = g.call('JSON.stringify(__NN.G.grid)');
const nxtBefore = g.call('__NN.G.nxt');
tap(givenCell[0], givenCell[1]);
const shk1 = g.call('__NN.G.shk');
tap(farCell[0], farCell[1]);
T('a-bad-taps-rejected', g.call('JSON.stringify(__NN.G.grid)') === gridBefore && shk1 === 1 && g.call('__NN.G.shk') === 1 &&
  g.call('__NN.G.nxt') === nxtBefore,
  'shk=' + shk1 + ' nxt=' + g.call('__NN.G.nxt') + ' want ' + nxtBefore);

const solvedA = solveAll('a-solve-l1');
T('a-solve-l1-by-taps', solvedA === null && g.call('__NN.G.nxt') === 17, solvedA || '');
g.pump(16); /* 200ms -> onWin fires, tick() stamps final time */
T('a-timer-format', /^\d+:\d\d$/.test(String(els['timer-display'].textContent)), String(els['timer-display'].textContent));
T('a-l1-won', g.call('__NN.G.run') === false && g.call('__NN.SD.done[0]') === true &&
  g.call('__NN.SD.stars[0]') === 3 && g.call('__NN.SD.best[0]') < 19 && g.call('__NN.SD.ts') === 3,
  'stars=' + g.call('__NN.SD.stars[0]') + ' best=' + g.call('__NN.SD.best[0]'));
g.pump(45); /* 700ms -> modal */
T('a-l1-win-modal', els['modal'].classList.contains('active') && els['modal-box'].innerHTML.includes('Puzzle Complete!') &&
  els['modal-box'].innerHTML.includes('Time: 0:0') && els['modal-box'].innerHTML.includes('id="m-next"'));
clickId('m-next');
T('a-next-goes-l2', g.call('__NN.curLv') === 1 && g.call('__NN.G.run') === true && g.call('__NN.G.sz') === 4 &&
  g.call('__NN.G.hints') === 5 && els['level-label'].textContent === 'Level 2' && g.call('__NN.SD.played') === 2);

/* hint */
els['btn-hint'].click();
const nxtBeforeHint = g.call('__NN.G.nxt');
const hc = JSON.parse(g.call('JSON.stringify(__NN.G.hc)'));
T('a-hint-highlights-sol-cell', g.call('__NN.G.hints') === 4 && String(els['hint-remain'].textContent) === '4' &&
  hc.length === 1 && g.call('__NN.G.sol[' + hc[0][0] + '][' + hc[0][1] + ']') === nxtBeforeHint, 'hc=' + JSON.stringify(hc));

/* undo: place two, undo one (values captured — nxt may skip givens between them) */
const v1 = g.call('__NN.G.nxt'); const u1 = solCell(v1); tap(u1[0], u1[1]);
const v2 = g.call('__NN.G.nxt'); const u2 = solCell(v2); tap(u2[0], u2[1]);
const trailBeforeUndo = JSON.parse(g.call('JSON.stringify(__NN.G.trail)')).length;
els['btn-undo'].click();
T('a-undo-restores', g.call('__NN.G.grid[' + u2[0] + '][' + u2[1] + ']') === 0 &&
  g.call('__NN.G.grid[' + u1[0] + '][' + u1[1] + ']') === v1 &&
  g.call('__NN.G.nxt') === v2 &&
  JSON.parse(g.call('JSON.stringify(__NN.G.trail)')).length === trailBeforeUndo - 1, 'nxt=' + g.call('__NN.G.nxt') + ' v2=' + v2);

/* pause: input frozen, resume preserves elapsed */
els['btn-pause'].click();
const elAtPause = g.call('__NN.G.el');
const pCell = solCell(g.call('__NN.G.nxt'));
const gridAtPause = g.call('JSON.stringify(__NN.G.grid)');
tap(pCell[0], pCell[1]);
T('a-pause-freezes-input', g.call('__NN.G.pau') === true && els['modal-box'].innerHTML.includes('Paused') &&
  g.call('JSON.stringify(__NN.G.grid)') === gridAtPause);
g.pump(10);
clickId('m-res');
T('a-resume-keeps-elapsed', g.call('__NN.G.pau') === false && !els['modal'].classList.contains('active') &&
  Math.abs(g.call('__NN.G.el') - elAtPause) < 0.001 && g.call('__NN.G.run') === true,
  'el=' + g.call('__NN.G.el') + ' vs ' + elAtPause);

/* clear: back to givens */
els['btn-clear'].click();
const puzStr = g.call('JSON.stringify(__NN.G.puz)');
T('a-clear-resets-to-givens', g.call('JSON.stringify(__NN.G.grid)') === puzStr &&
  JSON.parse(g.call('JSON.stringify(__NN.G.undo)')).length === 0 &&
  String(els['next-num'].textContent) === String(g.call('__NN.G.nxt')));

const solvedL2 = solveAll('a-solve-l2');
g.pump(16);
T('a-l2-won-3star', solvedL2 === null && g.call('__NN.SD.done[1]') === true && g.call('__NN.SD.stars[1]') === 3 &&
  g.call('__NN.SD.ts') === 6 && g.call('__NN.SD.played') === 2, solvedL2 || ('stars=' + g.call('__NN.SD.stars[1]')));
g.pump(45);
clickId('m-menu');
T('a-l2-menu-return', g.call('__NN.scr') === 'menu');

/* daily challenge */
els['btn-daily'].click();
T('a-daily-start', g.call('__NN.isDly') === true && g.call('__NN.curLv') === -1 && g.call('__NN.G.sz') === 6 &&
  g.call('__NN.G.tot') === 36 && g.call('__NN.G.hints') === 5 && els['level-label'].textContent === 'Daily Challenge');
const solvedD = solveAll('a-daily-solve');
g.pump(16);
const dstr = g.call('__NN.dd'); /* sandbox clock is epoch-based; use the engine's own dlyD */
T('a-daily-won', solvedD === null && g.call('__NN.SD.ddDone') === true && g.call('__NN.SD.dd') === dstr &&
  g.call('JSON.stringify(__NN.SD.stars)') === JSON.stringify({ 0: 3, 1: 3 }) &&
  g.call('__NN.SD.best[-1]') === undefined,
  'ddDone=' + g.call('__NN.SD.ddDone') + ' dd=' + g.call('__NN.SD.dd') + ' want ' + dstr + ' stars=' + g.call('JSON.stringify(__NN.SD.stars)') + ' best=' + g.call('JSON.stringify(__NN.SD.best)'));
g.pump(45);
T('a-daily-no-next-btn', els['modal-box'].innerHTML.includes('Puzzle Complete!') &&
  !els['modal-box'].innerHTML.includes('m-next') && els['modal-box'].innerHTML.includes('m-retry'));
clickId('m-menu');

/* stats */
els['btn-stats'].click();
T('a-stats-modal', els['modal'].classList.contains('active') && els['modal-box'].innerHTML.includes('Statistics') &&
  els['modal-box'].innerHTML.includes('Levels Completed') && g.call('__NN.SD.played') === 3 &&
  g.call('(Object.keys(__NN.SD.done).length)') === 2);
clickId('m-sc');
T('a-stats-close', !els['modal'].classList.contains('active'));

/* sound toggle */
els['btn-sound'].click();
const sndOff = g.call('__NN.auOn') === false && g.call('__NN.SD.snd') === false && els['toast'].classList.contains('show');
els['btn-sound'].click();
T('a-sound-toggle', sndOff && g.call('__NN.auOn') === true && g.call('__NN.SD.snd') === true);

/* back navigation from an active game */
els['btn-play'].click(); els['chapter-grid'].children[0].click(); els['level-grid'].children[0].click();
els['btn-game-back'].click();
T('a-game-back-to-levels', g.call('__NN.scr') === 'level' && g.call('__NN.G.run') === false);
els['btn-level-back'].click();
T('a-level-back-to-chapters', g.call('__NN.scr') === 'chapter');
els['btn-chapter-back'].click();
T('a-chapter-back-to-menu', g.call('__NN.scr') === 'menu');
const savedA2 = JSON.parse(g.ls.getItem('number_nexus_save_v2'));
T('a-save-shape', savedA2.v === 2 && savedA2.tut === true && savedA2.ddDone === true && savedA2.dd === dstr &&
  savedA2.played === 4 && savedA2.stars['0'] === 3 && savedA2.stars['1'] === 3 && savedA2.done['0'] === true && savedA2.done['1'] === true,
  JSON.stringify({ v: savedA2.v, tut: savedA2.tut, ddDone: savedA2.ddDone, dd: savedA2.dd, want: dstr, played: savedA2.played, stars: savedA2.stars, done: savedA2.done }));

/* ---------- boot B: seeded mid-progress save ---------- */
const seedB = { v: 2, done: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true }, best: { 0: 12.5, 1: 13.5 }, stars: { 0: 3, 1: 3 }, ts: 6, played: 9, tut: true, dd: '', ddDone: false, snd: true };
const gb = bootGame(SLUG, { seedLS: { number_nexus_save_v2: JSON.stringify(seedB) }, inject: { anchor: "var cvs=document.getElementById('game-canvas')", exports: EXPORTS } });
const eb = gb.els;
function geoB() {
  const w = gb.call('__NN.cvW'), h = gb.call('__NN.cvH'), sz = gb.call('__NN.G.sz');
  let cs = Math.floor(Math.min((w - 24) / sz, (h - 24) / sz)); cs = Math.max(cs, 24);
  const gw = cs * sz; return { cs, ox: (w - gw) / 2, oy: (h - gw) / 2 };
}
function tapB(r, c) { const o = geoB(); eb['game-canvas'].dispatch('pointerdown', { clientX: o.ox + c * o.cs + o.cs / 2, clientY: o.oy + r * o.cs + o.cs / 2 }); }
function solCellB(n) { return JSON.parse(gb.call('(function(){var S=__NN.G.sol,z=__NN.G.sz;for(var r=0;r<z;r++)for(var c=0;c<z;c++)if(S[r][c]===' + n + ')return JSON.stringify([r,c]);return \'null\';})()')); }
function solveAllB(label) {
  let guard = 0;
  while (gb.call('__NN.G.nxt') <= gb.call('__NN.G.tot')) {
    const nxt = gb.call('__NN.G.nxt'); const cell = solCellB(nxt);
    if (!cell) return label + ': no sol cell ' + nxt;
    tapB(cell[0], cell[1]);
    if (gb.call('__NN.G.grid[' + cell[0] + '][' + cell[1] + ']') !== nxt) return label + ': tap failed at ' + nxt;
    gb.pump(1);
    if (++guard > 200) return label + ': runaway';
  }
  return null;
}
T('b-boot-clean', gb.loadErrors.length === 0 && gb.call('__NN.scr') === 'menu' && gb.call('__NN.SD.played') === 9, gb.loadErrors.join('; '));
eb['btn-play'].click();
const bcards = eb['chapter-grid'].children;
T('b-chapter-unlocks', bcards.length === 5 && !bcards[0].className.includes('locked') && !bcards[1].className.includes('locked') &&
  [2, 3, 4].every(i => bcards[i].className.includes('locked')) && bcards[0].innerHTML.includes('6 / 30'));
bcards[1].click();
const bBtns = eb['level-grid'].children;
T('b-easy-level-locks', gb.call('__NN.selCh') === 1 && bBtns.length === 10 &&
  !bBtns[0].className.includes('locked') && [1, 2, 3, 4, 5, 6, 7, 8, 9].every(i => bBtns[i].className.includes('locked')) &&
  eb['level-title'].textContent.includes('Easy'));
bBtns[0].click(); /* idx 10: 5x5, 4 hints */
T('b-l11-start', gb.call('__NN.curLv') === 10 && gb.call('__NN.G.sz') === 5 && gb.call('__NN.G.tot') === 25 &&
  gb.call('__NN.G.hints') === 4 && hidden('tutorial-box') && eb['level-label'].textContent === 'Level 11');
const solvedB = solveAllB('b-l11-solve');
gb.pump(16);
T('b-l11-won', solvedB === null && gb.call('__NN.SD.done[10]') === true && gb.call('__NN.SD.stars[10]') === 3, solvedB || '');
gb.pump(45);
gb.call('document.getElementById("m-next").click()');
T('b-l11-next-unlocks-l12', gb.call('__NN.curLv') === 11 && gb.call('__NN.G.run') === true && gb.call('__NN.G.sz') === 5);
eb['btn-game-back'].click(); eb['btn-level-back'].click(); eb['btn-chapter-back'].click();
eb['btn-play'].click(); eb['chapter-grid'].children[1].click();
T('b-l12-now-unlocked', !eb['level-grid'].children[1].className.includes('locked') && eb['level-grid'].children[2].className.includes('locked'));

/* ---------- boot C: seeded full progress — Expert 8x8, retry + last-level wrap ---------- */
const doneC = {}, starsC = {}; for (let i = 0; i < 49; i++) doneC[i] = true; for (let i = 0; i < 50; i++) starsC[i] = i < 49 ? 2 : 0;
const ddC = g.call('__NN.dd'); /* sandbox clock = epoch; every boot starts at __now 0 */
const seedC = { v: 2, done: doneC, best: { 0: 30 }, stars: starsC, ts: 98, played: 100, tut: true, dd: ddC, ddDone: true, snd: true };
const gc = bootGame(SLUG, { seedLS: { number_nexus_save_v2: JSON.stringify(seedC) }, inject: { anchor: "var cvs=document.getElementById('game-canvas')", exports: EXPORTS } });
const ec = gc.els;
function geoC() {
  const w = gc.call('__NN.cvW'), h = gc.call('__NN.cvH'), sz = gc.call('__NN.G.sz');
  let cs = Math.floor(Math.min((w - 24) / sz, (h - 24) / sz)); cs = Math.max(cs, 24);
  const gw = cs * sz; return { cs, ox: (w - gw) / 2, oy: (h - gw) / 2 };
}
function tapC(r, c) { const o = geoC(); ec['game-canvas'].dispatch('pointerdown', { clientX: o.ox + c * o.cs + o.cs / 2, clientY: o.oy + r * o.cs + o.cs / 2 }); }
function solCellC(n) { return JSON.parse(gc.call('(function(){var S=__NN.G.sol,z=__NN.G.sz;for(var r=0;r<z;r++)for(var c=0;c<z;c++)if(S[r][c]===' + n + ')return JSON.stringify([r,c]);return \'null\';})()')); }
function solveAllC(label) {
  let guard = 0;
  while (gc.call('__NN.G.nxt') <= gc.call('__NN.G.tot')) {
    const nxt = gc.call('__NN.G.nxt'); const cell = solCellC(nxt);
    if (!cell) return label + ': no sol cell ' + nxt;
    tapC(cell[0], cell[1]);
    if (gc.call('__NN.G.grid[' + cell[0] + '][' + cell[1] + ']') !== nxt) return label + ': tap failed at ' + nxt;
    gc.pump(1);
    if (++guard > 200) return label + ': runaway';
  }
  return null;
}
T('c-boot-clean-daily-badge', gc.loadErrors.length === 0 && ec['btn-daily'].innerHTML.includes('daily-badge'), gc.loadErrors.join('; ') + ' | daily=[' + ec['btn-daily'].innerHTML + '] seed dd=' + ddC);
ec['btn-play'].click();
const ccards = ec['chapter-grid'].children;
T('c-all-chapters-unlocked', ccards.length === 5 && ccards.every(cd => !cd.className.includes('locked')));
ccards[4].click();
const cBtns = ec['level-grid'].children;
T('c-expert-levels', ec['level-title'].textContent.includes('Expert') && cBtns.length === 10 && cBtns.every(b => !b.className.includes('locked')));
cBtns[9].click(); /* idx 49: 8x8, 3 hints, "Level 50" */
T('c-l50-start', gc.call('__NN.curLv') === 49 && gc.call('__NN.G.sz') === 8 && gc.call('__NN.G.tot') === 64 &&
  gc.call('__NN.G.hints') === 3 && ec['level-label'].textContent === 'Level 50');
const solvedC1 = solveAllC('c-l50-solve');
gc.pump(16);
T('c-l50-won', solvedC1 === null && gc.call('__NN.SD.done[49]') === true && gc.call('__NN.SD.stars[49]') === 3, solvedC1 || '');
gc.pump(45);
gc.call('document.getElementById("m-retry").click()');
T('c-retry-fresh-board', gc.call('__NN.curLv') === 49 && gc.call('__NN.G.run') === true &&
  gc.call('JSON.stringify(__NN.G.grid)') === gc.call('JSON.stringify(__NN.G.puz)') && !ec['modal'].classList.contains('active'));
const solvedC2 = solveAllC('c-l50-solve2');
gc.pump(16); gc.pump(45);
gc.call('document.getElementById("m-next").click()');
T('c-last-level-next-wraps', solvedC2 === null && gc.call('__NN.curLv') === 49 && gc.call('__NN.G.run') === true &&
  gc.call('JSON.stringify(__NN.G.grid)') === gc.call('JSON.stringify(__NN.G.puz)'), 'curLv=' + gc.call('__NN.curLv'));

const extra = { boots: 3, boardsOffline: 51, tapsReal: true };
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
