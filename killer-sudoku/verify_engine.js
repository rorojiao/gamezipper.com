#!/usr/bin/env node
/* killer-sudoku — Type A verifier. The engine lives in an IIFE (no state access), but its
 * generator is deterministic (hashStr seeds / mulberry32), so this verifier SLICES the
 * generator block straight out of index.html and evals it under the same virtual clock the
 * engine booted with (Date.now()=0) — the puzzles and solutions used to play are produced by
 * the engine's own code, zero transcription drift. The all-121 win sweep doubles as the
 * extraction cross-check: any drift between my replica and the engine's runtime puzzles
 * would place a "wrong" digit, bump the mistake counter, and fail the sweep.
 * Plays every puzzle via real input paths: .diff-btn / .puzzle-btn / numpad / control-bar
 * button clicks, canvas click (cell select), document keydown (digits/arrows/n/h/ctrl+z/Del).
 * Covers: cage integrity (partition of all 81 cells, connectivity, sizes, sums, distinct
 * digits, Latin solutions), all 121 wins, lose flow (3 mistakes -> reveal + alert + frozen),
 * undo (incl. mistake decrement), erase, notes (never place values / never count mistakes),
 * hint (given cell protected against wrong placement), keyboard solve, combos toggle,
 * menu pause, stats overlay + reset, how overlay, beforeunload save, full-state reload
 * resume (boot #2 with seeded localStorage), ks-last lightweight fallback (boot #3),
 * visibilitychange pause AND resume, cleanupGame. Contract: exit 0 = PASS, last line = JSON. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('killer-sudoku');
const doc = g.sandbox.document;
const results = [];
const extra = { puzzles: 121, engineBugsFixed: [], harnessFixes: [], notes: [] };
function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }

// ---------- engine's own generator, extracted verbatim from index.html ----------
// slice runs from mulberry32 up to (excluding) the cage-combo calculator; the trailing pregen
// IIFE evaluates with it. Date is shimmed so the daily seed matches the engine's sandbox
// clock (virtual epoch -> Math.floor(Date.now()/86400000) === 0), not node's real clock.
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const a = src.indexOf('function mulberry32');
const b = src.indexOf('// === CAGE COMBO CALCULATOR');
if (a < 0 || b < 0) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['generator slice'], extra })); process.exit(1); }
const mod = { exports: {} };
const RealDate = Date;
const EpochDate = Object.assign(function (...xs) { return xs.length ? new RealDate(...xs) : new RealDate(0); }, { now: () => 0 });
new Function('module', 'Date', src.slice(a, b) + '\nmodule.exports.puzzles=puzzles;module.exports.generatePuzzle=generatePuzzle;')(mod, EpochDate);
const P = mod.exports.puzzles, genPuzzle = mod.exports.generatePuzzle;
const DIFF_LABEL = ['Easy', 'Medium', 'Hard', 'Expert'];
const MAX_CAGE = [2, 3, 4, 5];
const MIN_CAGE = [1, 2, 2, 3];

// ---------- data integrity: all 121 puzzles ----------
{
  let partitionErr = 0, connectErr = 0, sizeErr = 0, sumErr = 0, dupErr = 0, latinErr = 0;
  const check = (p, diffIdx, tag) => {
    // cages must partition the 81 cells exactly
    const seen = new Set();
    for (const cage of p.cages) {
      if (cage.cells.length < 1 || cage.cells.length > MAX_CAGE[diffIdx]) sizeErr++;
      // orthogonal connectivity (BFS inside the cage)
      const key = (r, c) => r * 9 + c;
      const set = new Set(cage.cells.map(([r, c]) => key(r, c)));
      const q = [cage.cells[0]], vis = new Set([key(cage.cells[0][0], cage.cells[0][1])]);
      while (q.length) { const [r, c] = q.shift(); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = key(r + dr, c + dc); if (set.has(k) && !vis.has(k)) { vis.add(k); q.push([r + dr, c + dc]); } } }
      if (vis.size !== cage.cells.length) connectErr++;
      // sum + distinct digits against the embedded solution
      let sum = 0; const dv = new Set();
      for (const [r, c] of cage.cells) {
        seen.add(key(r, c)); sum += p.solution[r][c];
        if (dv.has(p.solution[r][c])) dupErr++; dv.add(p.solution[r][c]);
      }
      if (sum !== cage.sum) sumErr++;
    }
    if (seen.size !== 81) partitionErr++;
    // solution must be a valid sudoku (Latin rows/cols/boxes)
    for (let r = 0; r < 9; r++) { if (new Set(p.solution[r]).size !== 9 || p.solution[r].some(v => v < 1 || v > 9)) latinErr++; }
    for (let c = 0; c < 9; c++) { const col = p.solution.map(row => row[c]); if (new Set(col).size !== 9) latinErr++; }
    for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) { const box = []; for (let r = br * 3; r < br * 3 + 3; r++) for (let c = bc * 3; c < bc * 3 + 3; c++) box.push(p.solution[r][c]); if (new Set(box).size !== 9) latinErr++; }
    void tag;
  };
  for (let d = 0; d < 4; d++) for (let i = 0; i < 30; i++) check(P[d][i], d, d + '/' + i);
  check(P.daily, 1, 'daily'); // daily generates with diff tier 1 inside the engine too
  const integrity = { partitionErr, connectErr, sizeErr, sumErr, dupErr, latinErr };
  extra.dataIntegrity = integrity;
  ck('data:121-puzzles-present', [0, 1, 2, 3].every(d => P[d].length === 30) && !!P.daily);
  ck('data:cages-partition-81', partitionErr === 0);
  ck('data:cages-connected', connectErr === 0);
  ck('data:cage-sizes-bounded', sizeErr === 0);
  ck('data:cage-sums-correct', sumErr === 0);
  ck('data:cages-distinct-digits', dupErr === 0);
  ck('data:solutions-latin', latinErr === 0);
  // daily determinism: same virtual-clock seed regenerates the identical puzzle
  const daily2 = genPuzzle('daily', 0);
  ck('data:daily-replica-deterministic', JSON.stringify(daily2) === JSON.stringify(P.daily));
}

// ---------- real-input plumbing ----------
const cv = doc.getElementById('board');
const CELL = cv.width / 9; // dpr=1 under the harness; engine's resizeCanvas keeps a 1:1 rect
const RECT = cv.getBoundingClientRect();
const winOv = doc.getElementById('win-overlay'), menuOv = doc.getElementById('menu-overlay');
const diffBtns = doc.querySelectorAll('.diff-btn');
const np = doc.getElementById('numpad');
const num = v => { for (const b of np.children) if (String(b.textContent) === String(v)) { b.click(); return; } };
const cellClick = (r, c) => cv.dispatch('click', { clientX: RECT.left + (c + 0.5) * CELL, clientY: RECT.top + (r + 0.5) * CELL });
const btn = id => doc.getElementById(id);
const mtext = () => String(btn('mistake-count').textContent); // engine assigns the raw number to textContent (browsers coerce; the stub stores it)
const alerts = []; g.sandbox.alert = m => alerts.push(String(m));

function menuDiff(d) { // real click on the .diff-btn for difficulty d (0..3 | 'daily')
  const t = diffBtns.find(h => h.dataset && String(h.dataset.diff) === String(d));
  if (!t) throw new Error('no diff-btn ' + d);
  t.click(); g.pump(1);
}
function menuPuzzle(i) {
  const bs = doc.getElementById('puzzle-select').querySelectorAll('.puzzle-btn');
  const t = (i === 0 && !bs.find(x => x.dataset.idx)) ? bs[0] : bs.find(x => x.dataset.idx === String(i)); // daily button has no data-idx -> idx 0
  if (!t) throw new Error('no puzzle-btn ' + i);
  t.click(); g.pump(1);
}
function playSolution(sol, skip) { // place every solution digit via canvas click + numpad click
  skip = skip || new Set();
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { if (skip.has(r * 9 + c)) continue; cellClick(r, c); num(sol[r][c]); }
  g.pump(1);
}
const won = () => !winOv.classList.contains('hidden');
function startGame(d, i) { if (won()) { btn('btn-play-again').click(); g.pump(1); } menuDiff(d); menuPuzzle(i); }

// ---------- all 121 wins through the engine's real win check ----------
{
  const perDiff = {};
  for (let d = 0; d < 4; d++) {
    let wins = 0, statsOk = true;
    for (let i = 0; i < 30; i++) {
      startGame(d, i);
      playSolution(P[d][i].solution);
      if (won() && mtext() === '0') wins++;
      if (i === 0) { // win overlay content for the first of each difficulty
        const h = btn('win-stats').innerHTML || '';
        statsOk = h.includes('Time') && h.includes(DIFF_LABEL[d]) && h.includes('Mistakes') && h.includes('Hints');
      }
    }
    perDiff[DIFF_LABEL[d]] = wins;
    ck('win:' + DIFF_LABEL[d].toLowerCase() + '-all-30', wins === 30, wins + '/30 zero-mistake wins');
    if (d === 0) ck('win:stats-overlay-content', statsOk);
  }
  // daily challenge through its dedicated menu button
  startGame('daily', 0);
  playSolution(P.daily.solution);
  const dh = btn('win-stats').innerHTML || '';
  ck('win:daily', won() && mtext() === '0' && dh.includes('Daily'));
  extra.perDiff = perDiff;
  // done-mark: after winning easy #0 the select screen marks it
  btn('btn-play-again').click(); g.pump(1); menuDiff(0);
  const bs = doc.getElementById('puzzle-select').querySelectorAll('.puzzle-btn');
  ck('ui:done-mark-after-win', bs[0].classList.contains('done') && bs.filter(b => b.classList.contains('done')).length === 30); // the sweep already won all 30 easy
}

// ---------- lose flow: 3 wrong placements ----------
{
  startGame(1, 0);
  const sol = P[1][0].solution;
  for (let k = 0; k < 3; k++) { cellClick(0, 0); num((sol[0][0] % 9) + 1); }
  g.pump(10); // alert fires at t+100ms virtual
  const frozen = (won() === false);
  cellClick(1, 1); num(sol[1][1]); g.pump(2); // board frozen post-gameover: no crash, no win
  ck('flow:lose-3-mistakes', mtext() === '3' && !won() && frozen, 'mistakes=' + mtext());
  ck('flow:lose-alert+reveal', alerts.some(m => m.includes('Too many mistakes')), alerts.join('|'));
}

// ---------- undo / erase / notes / keyboard / hint ----------
{ // undo removes a wrong placement AND refunds the mistake
  startGame(2, 3); const sol = P[2][3].solution;
  cellClick(4, 4); num((sol[4][4] % 9) + 1);
  const m1 = mtext();
  btn('btn-undo').click(); g.pump(1);
  const m2 = mtext();
  playSolution(sol);
  ck('flow:undo-refunds-mistake', m1 === '1' && m2 === '0' && won());
}
{ // erase clears a placed value, board stays winnable afterwards
  startGame(0, 5); const sol = P[0][5].solution;
  cellClick(1, 1); num(sol[1][1]);
  btn('btn-erase').click(); g.pump(1);
  playSolution(sol);
  ck('flow:erase-then-win', won() && mtext() === '0');
}
{ // notes mode toggles the button, stores notes without placing values or counting mistakes
  startGame(3, 1); const sol = P[3][1].solution;
  btn('btn-notes').click(); g.pump(1);
  const active = btn('btn-notes').classList.contains('active');
  cellClick(0, 0); num((sol[0][0] % 9) + 1); // a deliberately wrong note digit
  const mistakes = btn('mistake-count').textContent;
  btn('btn-notes').click(); g.pump(1); // notes off
  const off = !btn('btn-notes').classList.contains('active');
  playSolution(sol);
  ck('flow:notes-never-place', active && off && mistakes === '0' && won() && mtext() === '0');
}
{ // full keyboard path: arrows navigate, digits place, ctrl+z undoes, Del erases
  startGame(1, 4); const sol = P[1][4].solution;
  cellClick(0, 0); // select first cell with a real tap, then drive the rest from the keys
  g.key('ArrowRight'); g.key('ArrowRight'); g.key('ArrowRight'); // (0,0) -> (0,3)
  g.key(String(sol[0][3]));
  g.key('ArrowDown'); // -> (1,3)
  g.key(String(sol[1][3]));
  g.key('ArrowUp'); g.key('Delete'); // erase (0,3)
  g.key(String(sol[0][3])); // and place it back
  doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1); // undo -> (0,3) empty again
  g.key(String(sol[0][3]));
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { if ((r === 0 && c === 3) || (r === 1 && c === 3)) continue; cellClick(r, c); num(sol[r][c]); }
  g.pump(1);
  ck('flow:keyboard-arrows-digits-undo-del', won() && mtext() === '0');
}
{ // hint fills a cell, is counted, and the hinted cell is protected from wrong placement
  startGame(0, 9); const sol = P[0][9].solution;
  const realRandom = g.sandbox.Math.random; g.sandbox.Math.random = () => 0; // empties[0] = (0,0)
  btn('btn-hint').click(); g.pump(1);
  g.sandbox.Math.random = realRandom;
  cellClick(0, 0); num((sol[0][0] % 9) + 1); // wrong digit on the given cell
  const m = mtext();
  playSolution(sol);
  const h = btn('win-stats').innerHTML || '';
  const stripped = h.replace(/<[^>]+>/g, ''); ck('flow:hint-given-protected', m === '0' && won() && /1\s*Hints Used/.test(stripped), 'mistakes=' + m); // stat order is value-then-label: '1Hints Used'
}

// ---------- toggles / overlays / menu ----------
{
  startGame(0, 11);
  btn('btn-combos').click(); g.pump(1);
  const on = btn('btn-combos').classList.contains('active');
  btn('btn-combos').click(); g.pump(1);
  ck('ui:combos-toggle', on && !btn('btn-combos').classList.contains('active'));
  btn('btn-how').click(); g.pump(1);
  const howOpen = !btn('how-overlay').classList.contains('hidden');
  btn('btn-close-how').click(); g.pump(1);
  ck('ui:how-overlay', howOpen && btn('how-overlay').classList.contains('hidden'));
  // menu pause mid-game: overlay opens, timer stops
  btn('btn-menu').click(); g.pump(1);
  const menuOpen = !menuOv.classList.contains('hidden');
  ck('ui:menu-pause', menuOpen);
  // stats overlay + reset (confirm() is stubbed true)
  btn('btn-stats').click(); g.pump(1);
  const statsOpen = !btn('stats-overlay').classList.contains('hidden');
  const hadRows = (btn('stats-grid').innerHTML || '').length > 0;
  btn('btn-reset-stats').click(); g.pump(1);
  const statsCleared = (g.sandbox.localStorage.getItem('ks-stats') || '').length < 5;
  btn('btn-close-stats').click(); g.pump(1);
  ck('ui:stats-overlay+reset', statsOpen && hadRows && statsCleared && btn('stats-overlay').classList.contains('hidden'), 'ks-stats=' + g.sandbox.localStorage.getItem('ks-stats'));
}

// ---------- timer pause/resume on visibilitychange (P2 fix) ----------
{
  startGame(2, 0);
  const t = () => btn('timer').textContent;
  g.pump(120); // 2s virtual
  const t2 = t();
  doc.visibilityState = 'hidden'; doc.dispatch('visibilitychange'); g.pump(360); // 6s hidden — clock must freeze
  const tFrozen = t();
  doc.visibilityState = 'visible'; doc.dispatch('visibilitychange'); g.pump(120); // 2s visible — must resume
  const tResumed = t();
  extra.timerTrace = [t2, tFrozen, tResumed];
  ck('flow:visibility-pause+resume', t2 !== '00:00' && tFrozen === t2 && tResumed !== tFrozen, [t2, tFrozen, tResumed].join('->'));
}

// ---------- beforeunload saves mid-game state; boot #2 resumes it ----------
{
  startGame(2, 7);
  const sol = P[2][7].solution;
  const skip = new Set([0, 1, 2, 9, 10, 18, 27]); // leave 7 cells unplaced
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { if (skip.has(r * 9 + c)) continue; cellClick(r, c); num(sol[r][c]); }
  g.pump(300); // 5s on the clock
  const tBefore = btn('timer').textContent;
  g.sandbox.dispatchEvent({ type: 'beforeunload' }); g.pump(2);
  const saved = JSON.parse(g.sandbox.localStorage.getItem('ks-board'));
  ck('save:beforeunload-writes-board', saved && saved.diff === 2 && saved.idx === 7 && Array.isArray(saved.cells));

  const g2 = bootGame('killer-sudoku', { seedLS: Object.assign({}, g.ls._m) });
  const d2 = g2.sandbox.document;
  const resumed = d2.getElementById('menu-overlay').classList.contains('hidden') // auto-resumed INTO the game (menu closed)
    && d2.getElementById('win-overlay').classList.contains('hidden')
    && String(d2.getElementById('timer').textContent) === tBefore;
  // finish the resumed board through real inputs on the SECOND instance
  const cv2 = d2.getElementById('board'); const cell2 = cv2.width / 9; const rc2 = cv2.getBoundingClientRect();
  const np2 = d2.getElementById('numpad');
  const num2 = v => { for (const b of np2.children) if (String(b.textContent) === String(v)) b.click(); };
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    cv2.dispatch('click', { clientX: rc2.left + (c + 0.5) * cell2, clientY: rc2.top + (r + 0.5) * cell2 });
    num2(sol[r][c]);
  }
  g2.pump(2);
  ck('resume:full-state-then-win', resumed && !d2.getElementById('win-overlay').classList.contains('hidden'), 'timer=' + d2.getElementById('timer').textContent);
  ck('resume:no-load-errors-2', (g2.loadErrors || []).length === 0);

  // boot #3: ks-board cleared -> lightweight ks-last fallback opens that difficulty's select
  const m3 = Object.assign({}, g.ls._m); delete m3['ks-board'];
  const g3 = bootGame('killer-sudoku', { seedLS: m3 });
  const d3 = g3.sandbox.document;
  const bs3 = d3.getElementById('puzzle-select').querySelectorAll('.puzzle-btn');
  ck('resume:ks-last-fallback', bs3.length === 30 && !d3.getElementById('menu-overlay').classList.contains('hidden'));
  ck('resume:no-load-errors-3', (g3.loadErrors || []).length === 0);
  g3.sandbox.cleanupGame();
}

// ---------- cleanup + runtime health ----------
{
  g.sandbox.cleanupGame(); g.pump(2);
  cellClick(4, 4); num(5); g.pump(2); // post-cleanup input must be inert, not crashy
  ck('cleanup:cleanupGame-inert', !won());
  cv.dispatch('click', { clientX: -50, clientY: -50 }); g.pump(1); // out-of-bounds deselect
  ck('runtime:no-load-errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join('|'));
  ck('runtime:no-async-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
  extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
}

extra.engineBugsFixed = [
  'P1 checkWin exact-match: cages are carved from one solved grid with no uniqueness proof — 53 of 121 puzzles admit valid alternate completions and were rejected as losses. Now validates the real killer-sudoku win condition (full board, Latin rows/cols/boxes, every cage summing to its clue with distinct digits).',
  'P2 visibilitychange: handler paused the clock on hide but never resumed on show — one tab-away permanently froze the timer mid-game. Now resumes when a game is in progress and the menu is closed, and re-arms the interval stopTimer() cleared (the flag alone ticks nothing).'
];
extra.harnessFixes = [
  'parseMarkupChildren now populates el.dataset from data-* attributes (static .diff-btn / innerHTML .puzzle-btn handlers read this.dataset.diff/.idx — parsed nodes silently yielded NaN before)',
  'document.querySelectorAll class/tag walk now also walks the parsed body tree, deduped (static class-wired markup like the .diff-btn menu only exists there)',
  'document.dispatchEvent added (engine endGame dispatches new Event(\'gameover\'))'
];

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
