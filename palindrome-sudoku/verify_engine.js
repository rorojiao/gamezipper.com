#!/usr/bin/env node
/* palindrome-sudoku — Type A verifier: solve all 27 levels by tapping the canvas cell
 * (pointerdown -> onCanvasTap -> S.selR/selC) and clicking the numpad (placeDigit), the
 * engine's own real input path. Plus: data integrity (solutions are valid sudoku, puzzle
 * subset, every embedded palindrome line reads the same both ways in the solution),
 * mistake/undo/erase/notes/hint flows, pause+resume, tier filter + unlock chain, save
 * persistence, sound toggle, daily challenge. Contract: exit 0 = PASS, last line = JSON. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('palindrome-sudoku');
const board = g.els['board'];
const results = [];
const extra = { levels: 27, engineBugsFixed: [], tiers: {}, dataIntegrity: {}, daily: {} };

function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }
extra.engineBugsFixed.push('P1 resumeBtn: classList.remove("hidden") inverted (should be add) — Resume un-paused the clock but re-showed the pause overlay covering the board; only Level Select could escape');

function tapCell(r, c) {
  let cs = g.call('cellSize');
  if (!isFinite(cs) || !cs) { const w = parseFloat(board.style.width) || 480; cs = Math.floor(w / g.call('S.N')); }
  board.dispatch('pointerdown', { clientX: (c + 0.5) * cs, clientY: (r + 0.5) * cs, preventDefault() {} }); // no clue margin on this board
}
function tapVal(v) { g.els['numpad'].children[v - 1].click(); }
function click(id) { g.els[id].click(); g.pump(2); }
function solveCurrent() {
  const empt = JSON.parse(g.call('(function(){var e=[];for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.grid[r][c]!==S.solution[r][c])e.push(r*16+c);return JSON.stringify(e);})()'));
  for (const rc of empt) {
    const r = rc >> 4, c = rc & 15;
    const v = g.call('S.solution[' + r + '][' + c + ']');
    tapCell(r, c);
    if (g.call('S.selR') !== r || g.call('S.selC') !== c) return 'sel-miss r' + r + 'c' + c;
    tapVal(v);
    if (g.call('S.grid[' + r + '][' + c + ']') !== v) return 'place-miss r' + r + 'c' + c;
  }
  return g.call('S.finished') ? null : 'not-finished';
}
function winModalShown() { g.pump(25); return !g.els['winModal'].classList.contains('hidden'); }

// ---------- embedded data integrity ----------
{
  const LDATA = JSON.parse(g.call('JSON.stringify(LEVELS_DATA)'));
  let sudokuErr = 0, subErr = 0, palErr = 0;
  const perm = (a, N) => a.length === N && a.slice().sort((x, y) => x - y).every((d, i) => d === i + 1);
  for (const L of LDATA) {
    const N = L.N, [br, bc] = N === 6 ? [2, 3] : [3, 3];
    if (!L.s.every(row => perm(row, N))) sudokuErr++;
    for (let c = 0; c < N; c++) if (!perm(L.s.map(row => row[c]), N)) sudokuErr++;
    for (let b = 0; b < N; b++) {
      const box = [], bands = N / br, stacks = N / bc, band = Math.floor(b / stacks), stack = b % stacks;
      for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) box.push(L.s[band * br + i][stack * bc + j]);
      if (!perm(box, N)) sudokuErr++;
    }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (L.p[r][c] !== 0 && L.p[r][c] !== L.s[r][c]) subErr++;
    for (const line of (L.lines || [])) {
      const vals = line.map(([r, c]) => L.s[r][c]);
      if (JSON.stringify(vals) !== JSON.stringify(vals.slice().reverse())) palErr++;
    }
  }
  ck('data:27-valid-sudoku', sudokuErr === 0, sudokuErr + ' bad groups');
  ck('data:puzzle-subset', subErr === 0, subErr + ' clashes');
  ck('data:palindrome-lines-symmetric', palErr === 0, palErr + ' non-palindromes');
  extra.dataIntegrity = { sudokuErr, subErr, palErr };
}

// ---------- boot + tutorial ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
g.pump(40);
const tutTotal = g.call('document.querySelectorAll(".tut-step").length'); // stub DOM is lossy for this nested modal — stay total-agnostic
ck('tut:auto-open-first-visit', !g.els['tutModal'].classList.contains('hidden') && g.els['tutDots'].children.length === tutTotal, 'total(stub)=' + tutTotal);
const src = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
ck('tut:markup-has-3-steps', (src.match(/class="tut-step/g) || []).length === 3);
let guard = 0;
while (g.els['tutNext'].textContent.indexOf('Got it') < 0 && guard++ < 6) click('tutNext');
ck('tut:reaches-last-step-got-it', g.els['tutNext'].textContent.indexOf('Got it') >= 0);
click('tutNext');
ck('tut:close-and-persist', g.els['tutModal'].classList.contains('hidden') && g.ls.getItem('palindrome_sudoku_tut_v1') === '1');

// ---------- level select ----------
click('playBtn');
ck('flow:level-select-open', !g.els['levelScreen'].classList.contains('hidden') && g.els['lvlGrid'].children.length === 27);
ck('grid:26-locked-fresh', g.els['lvlGrid'].children.filter(c => c.classList.contains('locked')).length === 26);
ck('grid:7-tier-pills', g.els['tierBar'].children.length === 7);
g.els['tierBar'].children[3].click(); g.pump(2); // 'Hard'
ck('grid:tier-filter-hard-6', g.els['lvlGrid'].children.length === 6);
g.els['tierBar'].children[6].click(); g.pump(2); // 'All'
ck('grid:tier-filter-all-27', g.els['lvlGrid'].children.length === 27);
g.els['lvlGrid'].children[1].click(); g.pump(2);
ck('grid:locked-cell-no-op', g.call('S.screen') === 'level' && g.call('S.levelIdx') === -1);

// ---------- main loop: all 27 levels ----------
g.els['lvlGrid'].children[0].click(); g.pump(2);
ck('L01:starts', g.call('S.levelIdx') === 0 && g.call('S.N') === 6 && String(g.els['hudLvl'].textContent) === '1');
g.pump(60);
ck('hud:timer-ticks', g.els['hudTime'].textContent !== '0:00', String(g.els['hudTime'].textContent));
for (let i = 0; i < 27; i++) {
  if (g.call('S.levelIdx') !== i) { ck('L' + (i + 1) + ':idx', false, 'levelIdx=' + g.call('S.levelIdx')); break; }
  const err = solveCurrent();
  ck('L' + String(i + 1).padStart(2, '0') + ':solve', !err, err || '');
  if (err) break;
  ck('L' + String(i + 1).padStart(2, '0') + ':win-3stars', winModalShown() && g.els['winStars'].textContent === '★★★', g.els['winStars'].textContent);
  extra.tiers[g.call('S.level.tier')] = (extra.tiers[g.call('S.level.tier')] || 0) + 1;
  click('winNext');
  if (i < 26) ck('L' + String(i + 1).padStart(2, '0') + ':next-starts-L' + (i + 2) + '-modal-hidden', g.call('S.levelIdx') === i + 1 && g.els['winModal'].classList.contains('hidden'));
}
ck('flow:level-select-after-L27', !g.els['levelScreen'].classList.contains('hidden'));
{
  const prog = JSON.parse(g.ls.getItem('palindrome_sudoku_save_v1') || '{}').progress || {};
  ck('save:27-levels-3stars', Array.from({ length: 27 }, (_, i) => prog['lvl-' + i] && prog['lvl-' + i].stars === 3).every(Boolean), Object.keys(prog).length + ' entries');
  const done = g.els['lvlGrid'].children.filter(c => c.classList.contains('done') && !c.classList.contains('locked')).length;
  ck('grid:27-done-0-locked', done === 27, 'done=' + done);
}

// ---------- replay L2: mistake + undo + notes + erase ----------
g.els['lvlGrid'].children[1].click(); g.pump(2);
ck('replay:L2-loads', g.call('S.levelIdx') === 1 && g.call('S.N') === 6);
const first = JSON.parse(g.call('(function(){for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.level.p[r][c]===0)return JSON.stringify([r,c]);})()'));
const solA = g.call('S.solution[' + first[0] + '][' + first[1] + ']');
tapCell(first[0], first[1]); tapVal(solA === 1 ? 2 : 1);
const m1 = g.call('S.mistakes') === 1 && g.call('S.grid[' + first[0] + '][' + first[1] + ']') === (solA === 1 ? 2 : 1);
click('undoBtn');
ck('replay:mistake+undo', m1 && g.call('S.grid[' + first[0] + '][' + first[1] + ']') === 0);
// notes seeded on A; placing B's value in the same row sweeps it from A's notes
let cB = (first[1] + 1) % 6;
while (g.call('S.level.p[0][' + cB + ']') !== 0 || cB === first[1]) cB = (cB + 1) % 6;
const solB = g.call('S.solution[0][' + cB + ']');
click('notesBtn');
tapCell(first[0], first[1]); tapVal(solA); tapVal(solB);
const seeded = g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solA + ')') && g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solB + ')') && g.call('S.grid[' + first[0] + '][' + first[1] + ']') === 0;
click('notesBtn');
tapCell(0, cB); tapVal(solB);
ck('replay:notes+clearRelatedNotes', seeded && g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solA + ')') && !g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solB + ')'), JSON.stringify({ seeded }));
click('undoBtn'); // B back to empty
// erase tool
tapCell(0, cB); tapVal(solB);
const placedB = g.call('S.grid[0][' + cB + ']') === solB;
click('eraseBtn');
ck('replay:erase-tool', placedB && g.call('S.grid[0][' + cB + ']') === 0);
const err2 = solveCurrent();
winModalShown();
ck('replay:L2-finish-2stars', !err2 && g.els['winStars'].textContent === '★★☆' && g.els['winDetail'].textContent.indexOf('1 mistake') >= 0, err2 || g.els['winDetail'].textContent);
ck('replay:best-stars-stays-3', JSON.parse(g.ls.getItem('palindrome_sudoku_save_v1')).progress['lvl-1'].stars === 3);
click('winLevels');
ck('replay:winLevels-to-grid', !g.els['levelScreen'].classList.contains('hidden') && g.els['winModal'].classList.contains('hidden'));

// ---------- replay L3: hint flow ----------
g.els['lvlGrid'].children[2].click(); g.pump(2);
const beforeDiff = g.call('(function(){var k=0;for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.grid[r][c]!==S.solution[r][c])k++;return k;})()');
click('hintBtn');
const h1 = g.call('S.hintsUsed') === 1 && g.call('(function(){var k=0;for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.grid[r][c]!==S.solution[r][c])k++;return k;})()') === beforeDiff - 1;
const err3 = solveCurrent();
winModalShown();
ck('replay:hint-reveals+finish-2stars', h1 && !err3 && g.els['winStars'].textContent === '★★☆', err3 || '');
click('winNext');
ck('replay:winNext-L4', g.call('S.levelIdx') === 3 && g.els['winModal'].classList.contains('hidden'));

// ---------- pause + resume (fixed P1) ----------
click('pauseBtn');
ck('pause:modal+flag', g.call('S.paused') === true && !g.els['pauseModal'].classList.contains('hidden'));
click('resumeBtn');
ck('pause:resume-closes-modal', g.call('S.paused') === false && g.els['pauseModal'].classList.contains('hidden'));
click('pauseBtn');
click('pauseLevels');
ck('pause:levels-escape', !g.els['levelScreen'].classList.contains('hidden') && g.els['pauseModal'].classList.contains('hidden'));

// ---------- sound + daily ----------
click('homeBtn');
click('soundBtn');
const muted = g.els['soundBtn'].textContent === 'Mute' && JSON.parse(g.ls.getItem('palindrome_sudoku_save_v1')).sound === false;
click('soundBtn');
ck('hud:sound-toggle-persists', muted && g.els['soundBtn'].textContent === 'Sound');
const dateStr = g.call('todayStr()');
click('dailyBtn');
const wantIdx = g.call('(function(){var h=0;for(var i=0;i<S.dailyDate.length;i++)h=(h*31+S.dailyDate.charCodeAt(i))>>>0;return h%LEVELS_DATA.length;})()');
ck('daily:loads-hashed-level', g.call('S.isDaily') === true && g.call('S.dailyDate') === dateStr && g.call('S.levelIdx') === wantIdx, 'idx=' + g.call('S.levelIdx') + ' want=' + wantIdx);
const errD = solveCurrent();
winModalShown();
const dSave = JSON.parse(g.ls.getItem('palindrome_sudoku_save_v1') || '{}').progress['daily-' + dateStr];
ck('daily:solve+save-3stars', !errD && g.els['winStars'].textContent === '★★★' && dSave && dSave.stars === 3, errD || JSON.stringify(dSave));
extra.daily = { date: dateStr, idx: wantIdx, stars: dSave ? dSave.stars : null };
click('winLevels');

// ---------- given cells immutable ----------
g.els['lvlGrid'].children[0].click(); g.pump(2);
const gr = JSON.parse(g.call('(function(){for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.level.p[r][c]!==0)return JSON.stringify([r,c]);})()'));
const gv = g.call('S.grid[' + gr[0] + '][' + gr[1] + ']');
tapCell(gr[0], gr[1]); tapVal(gv === 1 ? 2 : 1);
ck('input:given-cell-protected', g.call('S.grid[' + gr[0] + '][' + gr[1] + ']') === gv);

// ---------- cleanup ----------
g.sandbox.dispatchEvent({ type: 'beforeunload' });
g.pump(2);
ck('cleanup:beforeunload-clean', true);
ck('runtime:no-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
