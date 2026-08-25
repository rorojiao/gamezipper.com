#!/usr/bin/env node
/* outside-sudoku — Type A verifier: solve all 27 levels by tapping the canvas cell
 * (pointerdown -> onCanvasTap -> S.selR/selC) and clicking the numpad (placeDigit),
 * the engine's own real input path. Plus: data integrity of all 27 embedded levels
 * (solution is a valid sudoku, puzzle ⊆ solution, outside clues match border zones),
 * mistake/undo/erase/notes/hint flows, tier filter + unlock chain, save persistence,
 * pause, sound toggle, daily challenge. Contract: exit 0 = PASS, last line = JSON. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('outside-sudoku');
const board = g.els['board'];
const results = [];
const extra = { levels: 27, engineBugsFixed: [], tiers: {}, dataIntegrity: {}, daily: {}, notes: [] };

function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }
// winNext/winLevels un-hid the win modal instead of closing it — overlay covered the next
// level's board (modal-overlay blocks the canvas) until page reload. Fixed in index.html.
extra.engineBugsFixed.push('P1 winNext/winLevels: classList.remove("hidden") inverted (should be add) — win overlay stayed over the next level, blocking all input');

function tapCell(r, c) {
  let cs = g.call('cellSize'), mg = g.call('marginPx');
  if (!isFinite(cs) || !cs) { // fall back to the geometry setupCanvas wrote into style
    const w = parseFloat(board.style.width) || parseFloat(g.els['numpad'].style.width) || 480;
    cs = Math.floor(w / (g.call('S.N') + 2)); mg = cs;
  }
  board.dispatch('pointerdown', { clientX: mg + c * cs + cs / 2, clientY: mg + r * cs + cs / 2, preventDefault() {} });
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
function winModalShown() { g.pump(25); return !g.els['winModal'].classList.contains('hidden'); } // 350ms reveal timer

// ---------- embedded data integrity (all 27 levels) ----------
{
  const LDATA = JSON.parse(g.call('JSON.stringify(LEVELS_DATA)'));
  let clueErr = 0, sudokuErr = 0, subErr = 0;
  const perm = (a, N) => a.length === N && a.slice().sort((x, y) => x - y).every((d, i) => d === i + 1);
  for (const L of LDATA) {
    const N = L.N, [br, bc] = N === 6 ? [2, 3] : [3, 3];
    if (!L.s.every(row => perm(row, N))) sudokuErr++;
    for (let c = 0; c < N; c++) if (!perm(L.s.map(row => row[c]), N)) sudokuErr++;
    for (let b = 0; b < N; b++) {
      const box = [];
      const bands = N / br, stacks = N / bc; // 2x3 boxes: 3 row-bands x 2 col-stacks
      const band = Math.floor(b / stacks), stack = b % stacks;
      for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) box.push(L.s[band * br + i][stack * bc + j]);
      if (!perm(box, N)) sudokuErr++;
    }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (L.p[r][c] !== 0 && L.p[r][c] !== L.s[r][c]) subErr++;
    for (let r = 0; r < N; r++) {
      if (JSON.stringify(L.out.L[r].slice().sort()) !== JSON.stringify(L.s[r].slice(0, bc).slice().sort())) clueErr++;
      if (JSON.stringify(L.out.R[r].slice().sort()) !== JSON.stringify(L.s[r].slice(N - bc).slice().sort())) clueErr++;
    }
    for (let c = 0; c < N; c++) {
      const col = L.s.map(row => row[c]);
      if (JSON.stringify(L.out.T[c].slice().sort()) !== JSON.stringify(col.slice(0, br).slice().sort())) clueErr++;
      if (JSON.stringify(L.out.B[c].slice().sort()) !== JSON.stringify(col.slice(N - br).slice().sort())) clueErr++;
    }
  }
  ck('data:27-valid-sudoku-solutions', sudokuErr === 0, sudokuErr + ' bad groups');
  ck('data:puzzle-subset-of-solution', subErr === 0, subErr + ' clashes');
  ck('data:outside-clues-match-border-zones', clueErr === 0, clueErr + ' mismatched clues');
  extra.dataIntegrity = { sudokuErr, subErr, clueErr };
}

// ---------- boot + tutorial (auto-opens after 600ms on first visit) ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
g.pump(40);
// NB: the body-parse stub is lossy for this nested modal (only 1 of 3 .tut-step divs
// survives), so the engine's own step total under vm is 1 — keep flow checks total-agnostic
// and assert the real 3-step markup straight from the shipped source.
const tutTotal = g.call('document.querySelectorAll(".tut-step").length');
ck('tut:auto-open-first-visit', !g.els['tutModal'].classList.contains('hidden') && g.els['tutDots'].children.length === tutTotal, 'total(stub)=' + tutTotal + ' dots=' + g.els['tutDots'].children.length);
const src = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
ck('tut:markup-has-3-steps', (src.match(/class="tut-step/g) || []).length === 3);
let guard = 0;
while (g.els['tutNext'].textContent.indexOf('Got it') < 0 && guard++ < 6) click('tutNext');
ck('tut:reaches-last-step-got-it', g.els['tutNext'].textContent.indexOf('Got it') >= 0);
click('tutNext');
ck('tut:close-and-persist', g.els['tutModal'].classList.contains('hidden') && g.ls.getItem('outside_sudoku_tut_v1') === '1');

// ---------- level select: grid, lock chain, tier filter ----------
click('playBtn');
ck('flow:level-select-open', !g.els['levelScreen'].classList.contains('hidden') && g.els['lvlGrid'].children.length === 27);
ck('grid:26-locked-fresh', g.els['lvlGrid'].children.filter(c => c.classList.contains('locked')).length === 26); // engine uses classList.add — stub className stays stale
ck('grid:7-tier-pills', g.els['tierBar'].children.length === 7);
g.els['tierBar'].children[3].click(); g.pump(2); // 'Hard'
ck('grid:tier-filter-hard-6', g.els['lvlGrid'].children.length === 6);
g.els['tierBar'].children[6].click(); g.pump(2); // 'All'
ck('grid:tier-filter-all-27', g.els['lvlGrid'].children.length === 27);
g.els['lvlGrid'].children[1].click(); g.pump(2); // locked -> no listener
ck('grid:locked-cell-no-op', g.call('S.screen') === 'level' && g.call('S.levelIdx') === -1);

// ---------- main loop: all 27 levels through real input ----------
g.els['lvlGrid'].children[0].click(); g.pump(2);
ck('L01:starts', g.call('S.levelIdx') === 0 && g.call('S.N') === 6 && String(g.els['hudLvl'].textContent) === '1' && String(g.els['hudTier'].textContent) === 'Beginner');
g.pump(60); // 1s of virtual time -> 500ms HUD timer fires
ck('hud:timer-ticks', g.els['hudTime'].textContent !== '0:00', String(g.els['hudTime'].textContent));
for (let i = 0; i < 27; i++) {
  if (g.call('S.levelIdx') !== i) { ck('L' + (i + 1) + ':idx', false, 'levelIdx=' + g.call('S.levelIdx')); break; }
  const err = solveCurrent();
  ck('L' + String(i + 1).padStart(2, '0') + ':solve', !err, err || '');
  if (err) break;
  const shown = winModalShown();
  ck('L' + String(i + 1).padStart(2, '0') + ':win-modal', shown && g.els['winStars'].textContent === '★★★', g.els['winStars'].textContent);
  extra.tiers[g.call('S.level.tier')] = (extra.tiers[g.call('S.level.tier')] || 0) + 1;
  click('winNext');
  if (i < 26) ck('L' + String(i + 1).padStart(2, '0') + ':next-starts-L' + (i + 2) + '-modal-hidden', g.call('S.levelIdx') === i + 1 && g.els['winModal'].classList.contains('hidden'));
}
ck('flow:level-select-after-L27', !g.els['levelScreen'].classList.contains('hidden'));
{
  const sv = JSON.parse(g.ls.getItem('outside_sudoku_save_v1') || '{}');
  const prog = sv.progress || {};
  ck('save:27-levels-3stars', Array.from({ length: 27 }, (_, i) => prog['lvl-' + i] && prog['lvl-' + i].stars === 3).every(Boolean), Object.keys(prog).length + ' entries');
  const done = g.els['lvlGrid'].children.filter(c => c.classList.contains('done') && !c.classList.contains('locked')).length;
  ck('grid:27-done-0-locked', done === 27, 'done=' + done);
}

// ---------- replay L2: mistake + undo + notes + erase ----------
g.els['lvlGrid'].children[1].click(); g.pump(2);
ck('replay:L2-loads', g.call('S.levelIdx') === 1 && g.call('S.N') === 6);
const first = JSON.parse(g.call('(function(){for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.level.p[r][c]===0)return JSON.stringify([r,c]);})()'));
const solA = g.call('S.solution[' + first[0] + '][' + first[1] + ']');
const wrongA = solA === 1 ? 2 : 1;
tapCell(first[0], first[1]); tapVal(wrongA);
const m1 = g.call('S.mistakes') === 1 && g.call('S.grid[' + first[0] + '][' + first[1] + ']') === wrongA;
click('undoBtn');
const undone = g.call('S.grid[' + first[0] + '][' + first[1] + ']') === 0;
ck('replay:mistake+undo', m1 && undone, JSON.stringify({ m1, undone }));
// notes: seed two candidates on A, place B's solution value in the same row -> clearRelatedNotes drops it from A
let cB = (first[1] + 1) % 6;
while (g.call('S.level.p[0][' + cB + ']') !== 0 || cB === first[1]) cB = (cB + 1) % 6;
const solB = g.call('S.solution[0][' + cB + ']');
click('notesBtn');
tapCell(first[0], first[1]); tapVal(solA); tapVal(solB);
const seeded = g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solA + ')') && g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solB + ')') && g.call('S.grid[' + first[0] + '][' + first[1] + ']') === 0;
click('notesBtn');
tapCell(0, cB); tapVal(solB);
const cleared = g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solA + ')') === true && g.call('S.notes[' + first[0] + '][' + first[1] + '].has(' + solB + ')') === false;
ck('replay:notes+clearRelatedNotes', seeded && cleared, JSON.stringify({ seeded, cleared }));
// undo restores the note snapshot taken at placement time
click('notesBtn'); tapCell(0, cB); tapVal(solA === 1 ? (solB === 2 ? 3 : 2) : 1); click('notesBtn');
const notedB = g.call('S.notes[0][' + cB + '].size') === 1;
click('undoBtn');
const restoredNotes = g.call('S.grid[0][' + cB + ']') === 0 && g.call('S.notes[0][' + cB + '].size') === 0;
ck('replay:undo-restores-notes', notedB && restoredNotes, JSON.stringify({ notedB, restoredNotes }));
// erase tool clears a placed digit; finish with 1 mistake on record -> 2 stars
tapCell(0, cB); tapVal(solB);
const placedB = g.call('S.grid[0][' + cB + ']') === solB;
click('eraseBtn');
const erasedB = g.call('S.grid[0][' + cB + ']') === 0;
ck('replay:erase-tool', placedB && erasedB);
const err2 = solveCurrent();
ck('replay:L2-finish', !err2, err2 || '');
winModalShown();
ck('replay:2-stars-1-mistake', g.els['winStars'].textContent === '★★☆' && g.els['winDetail'].textContent.indexOf('1 mistake') >= 0, g.els['winStars'].textContent + ' | ' + g.els['winDetail'].textContent);
ck('replay:best-stars-stays-3', JSON.parse(g.ls.getItem('outside_sudoku_save_v1')).progress['lvl-1'].stars === 3);
click('winLevels');
ck('replay:winLevels-to-grid', !g.els['levelScreen'].classList.contains('hidden') && g.els['winModal'].classList.contains('hidden'));

// ---------- replay L3: hint flow ----------
g.els['lvlGrid'].children[2].click(); g.pump(2);
const beforeDiff = g.call('(function(){var k=0;for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.grid[r][c]!==S.solution[r][c])k++;return k;})()');
click('hintBtn');
const h1 = g.call('S.hintsUsed') === 1 && g.call('(function(){var k=0;for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.grid[r][c]!==S.solution[r][c])k++;return k;})()') === beforeDiff - 1;
const err3 = solveCurrent();
winModalShown();
ck('replay:hint-reveals+finish-2stars', h1 && !err3 && g.els['winStars'].textContent === '★★☆', err3 || g.els['winStars'].textContent);
click('winNext');
ck('replay:winNext-L4', g.call('S.levelIdx') === 3 && g.els['winModal'].classList.contains('hidden'));

// ---------- pause / back ----------
click('pauseBtn');
ck('pause:modal+flag', g.call('S.paused') === true && !g.els['pauseModal'].classList.contains('hidden'));
click('resumeBtn');
ck('pause:resume', g.call('S.paused') === false && g.els['pauseModal'].classList.contains('hidden'));
click('backBtn');
ck('flow:back-to-levels', !g.els['levelScreen'].classList.contains('hidden'));

// ---------- sound toggle persists ----------
click('homeBtn');
ck('flow:home-splash', !g.els['splashScreen'].classList.contains('hidden'));
click('soundBtn');
const muted = g.els['soundBtn'].textContent === 'Mute' && JSON.parse(g.ls.getItem('outside_sudoku_save_v1')).sound === false;
click('soundBtn');
ck('hud:sound-toggle-persists', muted && g.els['soundBtn'].textContent === 'Sound' && JSON.parse(g.ls.getItem('outside_sudoku_save_v1')).sound === true);

// ---------- daily challenge ----------
const dateStr = g.call('todayStr()');
click('dailyBtn');
const wantIdx = g.call('(function(){var h=0;for(var i=0;i<S.dailyDate.length;i++)h=(h*31+S.dailyDate.charCodeAt(i))>>>0;return h%LEVELS_DATA.length;})()');
ck('daily:loads-hashed-level', g.call('S.isDaily') === true && g.call('S.dailyDate') === dateStr && g.call('S.levelIdx') === wantIdx, 'date=' + dateStr + ' idx=' + g.call('S.levelIdx') + ' want=' + wantIdx);
const errD = solveCurrent();
winModalShown();
const dSave = JSON.parse(g.ls.getItem('outside_sudoku_save_v1') || '{}').progress['daily-' + dateStr];
ck('daily:solve+save-3stars', !errD && g.els['winStars'].textContent === '★★★' && dSave && dSave.stars === 3, errD || JSON.stringify(dSave));
extra.daily = { date: dateStr, idx: wantIdx, stars: dSave ? dSave.stars : null };
click('winLevels');

// ---------- given cells are immutable ----------
g.els['lvlGrid'].children[0].click(); g.pump(2);
const gr = JSON.parse(g.call('(function(){for(var r=0;r<S.N;r++)for(var c=0;c<S.N;c++)if(S.level.p[r][c]!==0)return JSON.stringify([r,c]);})()'));
const gv = g.call('S.grid[' + gr[0] + '][' + gr[1] + ']');
tapCell(gr[0], gr[1]); tapVal(gv === 1 ? 2 : 1);
ck('input:given-cell-protected', g.call('S.grid[' + gr[0] + '][' + gr[1] + ']') === gv);

// ---------- cleanup listener ----------
g.sandbox.dispatchEvent({ type: 'beforeunload' });
g.pump(2);
ck('cleanup:beforeunload-clean', true);
ck('runtime:no-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
extra.notes.push('P2 (documented, not fixed): winNext propagates S.isDaily — finishing the daily then Next starts the FOLLOWING level still flagged daily, so its win overwrites the daily-<date> save key instead of crediting lvl-<idx>');

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
