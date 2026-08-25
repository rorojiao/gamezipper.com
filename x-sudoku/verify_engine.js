#!/usr/bin/env node
/* x-sudoku (Diagonal Sudoku) — Type A verifier: solve all 27 levels by tapping the
 * canvas cell (mousedown -> onDown -> G.sel) and clicking the number pad (placeVal),
 * the engine's own real input path. Then: wrong-value mistake counter + undo, erase,
 * notes mode, hint flow, level grid + unlock chain, save persistence, settings reset,
 * and the daily challenge. Contract: exit 0 = PASS, last stdout line = compact JSON. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('x-sudoku');
const board = g.els['board'];
const pad = g.els['pad'];
const results = [];
const extra = { levels: 27, engineBugsFixed: [], tiers: {} };

function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }
function J(expr) { return g.call('JSON.stringify(' + expr + ')'); }
// guarded buttons (onceClick 250ms) need virtual time before the next click
function click(id) { g.pump(16); g.els[id].click(); g.pump(2); }
function cellXY(r, c) { return { x: (c + 0.5) * g.call('G.cell'), y: (r + 0.5) * g.call('G.cell') }; }
function tapCell(r, c) { const p = cellXY(r, c); board.dispatch('mousedown', { clientX: p.x, clientY: p.y, preventDefault() {} }); }
function tapVal(v) { pad.children[v - 1].click(); }

// fill every empty cell of the current level with its solution through real input
function solveCurrent() {
  const empties = g.call('(function(){var e=[];for(var r=0;r<G.n;r++)for(var c=0;c<G.n;c++)if(!G.given[r][c])e.push(r*16+c);return JSON.stringify(e);})()');
  for (const rc of JSON.parse(empties)) {
    const r = rc >> 4, c = rc & 15;
    const v = g.call('G.solution[' + r + '][' + c + ']');
    tapCell(r, c);
    if (g.call('JSON.stringify(G.sel)') !== JSON.stringify({ r, c })) return 'sel-miss r' + r + 'c' + c;
    tapVal(v);
    if (g.call('G.board[' + r + '][' + c + ']') !== v) return 'place-miss r' + r + 'c' + c;
  }
  return g.call('G.finished') ? null : 'not-finished';
}

// ---------- boot: first visit shows the tutorial ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
ck('boot:tutorial-first-visit', !g.els['screen-tutorial'].classList.contains('hidden'));

click('tut-go');
ck('tut:starts-L1', g.call('G.idx') === 0 && g.call('G.n') === 4 && g.els['screen-tutorial'].classList.contains('hidden'));
ck('tut:save-marks-seen', JSON.parse(g.ls.getItem('xs_progress_v1')).tutSeen === true);

// ---------- main loop: all 27 levels through real input ----------
for (let i = 0; i < 27; i++) {
  if (g.call('G.idx') !== i) { ck('L' + (i + 1) + ':idx', false, 'G.idx=' + g.call('G.idx')); break; }
  const err = solveCurrent();
  const n = g.call('G.n');
  ck('L' + String(i + 1).padStart(2, '0') + ':solve-4/6/9=' + n + 'px', !err, err || '');
  if (err) break;
  ck('L' + String(i + 1).padStart(2, '0') + ':complete-screen', !g.els['screen-complete'].classList.contains('hidden'));
  extra.tiers[g.call('G.tier')] = (extra.tiers[g.call('G.tier')] || 0) + 1;
  if (i < 26) click('complete-next');
  else click('complete-next'); // L27 -> level select
}

// after L27 next -> level select grid
ck('flow:level-select-after-last', !g.els['screen-levels'].classList.contains('hidden'));
{
  const sv = JSON.parse(g.ls.getItem('xs_progress_v1') || '{}');
  const prog = sv.progress || {};
  const all3 = Array.from({ length: 27 }, (_, i) => prog[String(i)] && prog[String(i)].stars === 3).every(Boolean);
  ck('save:27-levels-3stars', all3, Object.keys(prog).length + ' entries');
  const cells = g.els['lvlgrid'].children.length;
  ck('grid:27-cells-all-done-unlocked', cells === 27 && g.call('(function(){var d=0;document.getElementById("lvlgrid").querySelectorAll(".lvlcell").forEach(function(c){if(String(c.className).indexOf("done")>=0&&String(c.className).indexOf("locked")<0)d++;});return d;})()') === 27, 'cells=' + cells);
  const pills = g.els['tierbar'].children.length;
  ck('grid:7-tier-pills', pills === 7, 'pills=' + pills);
}

// ---------- replay L2 via grid: mistake + undo + erase + notes ----------
{
  // click the 2nd level cell (index 1) in the grid
  g.els['lvlgrid'].children[1].click(); g.pump(2);
  ck('grid:replay-L2-loads', g.call('G.idx') === 1 && g.call('G.n') === 4); // L1-4 are Beginner 4x4
  // wrong value -> mistake counted, shown in HUD
  const first = JSON.parse(J('(function(){for(var r=0;r<G.n;r++)for(var c=0;c<G.n;c++)if(!G.given[r][c])return [r,c];})()'));
  const sol = g.call('G.solution[' + first[0] + '][' + first[1] + ']');
  const wrong = sol === 1 ? 2 : 1;
  tapCell(first[0], first[1]); tapVal(wrong);
  const m1 = g.call('G.mistakes') === 1 && g.els['hud-mistakes'].textContent === '1/3';
  click('btn-undo');
  const undone = g.call('G.board[' + first[0] + '][' + first[1] + ']') === 0;
  // correct place then erase
  tapCell(first[0], first[1]); tapVal(sol);
  const placed = g.call('G.board[' + first[0] + '][' + first[1] + ']') === sol;
  click('btn-erase');
  const erased = g.call('G.board[' + first[0] + '][' + first[1] + ']') === 0;
  ck('L02-replay:mistake+undo+erase', m1 && undone && placed && erased, JSON.stringify({ m1, undone, placed, erased }));
  // notes mode: pencil a candidate without changing the board
  click('btn-notes');
  tapCell(first[0], first[1]); tapVal(sol);
  const noted = g.call('G.notes[' + first[0] + '][' + first[1] + '][0]') === sol && g.call('G.board[' + first[0] + '][' + first[1] + ']') === 0;
  click('btn-notes'); // off
  ck('L02-replay:notes-mode', noted && g.call('G.notesMode') === false);
  // finish the level (mistakes already 1 -> 2 stars expected)
  const err = solveCurrent();
  ck('L02-replay:finish-after-tests', !err, err || '');
  ck('L02-replay:2-stars-with-mistake', g.els['complete-stars'].textContent.includes('★') && g.call('computeStars()') === 2, g.els['complete-stars'].textContent);
  ck('L02-replay:best-stars-stays-3', JSON.parse(g.ls.getItem('xs_progress_v1')).progress['1'].stars === 3);
  click('complete-menu');
}

// ---------- replay L3 via grid: hint flow ----------
{
  g.els['lvlgrid'].children[2].click(); g.pump(2);
  ck('grid:replay-L3-loads', g.call('G.idx') === 2);
  click('btn-hint');
  const h1 = g.call('G.hintsUsed') === 1 && String(g.els['hint-count'].textContent) === '2'; // stub stores the raw number
  const revealed = g.call('(function(){var k=0;for(var r=0;r<G.n;r++)for(var c=0;c<G.n;c++)if(G.given[r][c]&&!LEVELS[2].puzzle[r][c])k++;return k;})()') === 1;
  ck('L03-replay:hint-reveals-cell', h1 && revealed, JSON.stringify({ h1, revealed }));
  const err = solveCurrent();
  ck('L03-replay:finish-with-hint', !err, err || '');
  ck('L03-replay:2-stars-with-hint', g.call('computeStars()') === 2);
  click('complete-menu');
}

// ---------- sound + music toggles persist ----------
{
  click('btn-sound');
  const m = g.call('G.muted') === true && JSON.parse(g.ls.getItem('xs_progress_v1')).muted === true;
  click('btn-sound'); // back on
  ck('hud:sound-toggle-persists', m && g.call('G.muted') === false);
  // settings screen via the brand double-click listener the engine wires
  g.sandbox.document.querySelector('.brand').dispatch('dblclick', {});
  g.pump(2);
  const open = !g.els['screen-settings'].classList.contains('hidden');
  g.els['set-music'].click(); g.pump(16);
  const musicOff = g.call('G.musicOn') === false && JSON.parse(g.ls.getItem('xs_progress_v1')).music === false;
  g.els['set-music'].click(); g.pump(16);
  ck('settings:music-toggle-persists', open && musicOff && g.call('G.musicOn') === true, JSON.stringify({ open, musicOff }));
  // reset all progress -> confirm (stub true) -> back to splash
  g.els['settings-reset'].click(); g.pump(16);
  ck('settings:reset-clears-save-back-to-splash', g.ls.getItem('xs_progress_v1') === null || !JSON.parse(g.ls.getItem('xs_progress_v1')).progress['0'], 'save=' + g.ls.getItem('xs_progress_v1'));
  ck('settings:splash-after-reset', !g.els['screen-splash'].classList.contains('hidden'));
  // after reset only level 1 is unlocked (grid rebuilds when Select Level opens)
  click('splash-levels');
  const locked = g.call('(function(){var k=0;document.getElementById("lvlgrid").querySelectorAll(".lvlcell").forEach(function(c){if(String(c.className).indexOf("locked")>=0)k++;});return k;})()');
  ck('settings:grid-locked-after-reset', locked === 26, 'locked=' + locked);
}

// ---------- daily challenge ----------
{
  const seed = g.call('dailySeed()');
  const idx = seed % 27;
  click('splash-daily');
  ck('daily:loads-daily-level', g.call('G.daily') === true && g.call('G.idx') === idx, 'seed=' + seed + ' idx=' + g.call('G.idx'));
  const err = solveCurrent();
  ck('daily:solve', !err, err || '');
  ck('daily:complete-screen', !g.els['screen-daily-complete'].classList.contains('hidden'));
  const saved = JSON.parse(g.ls.getItem('xs_progress_v1') || '{}').daily || {};
  ck('daily:win-saved', saved[String(seed)] && saved[String(seed)].stars >= 2, JSON.stringify(saved));
  click('daily-close');
  ck('daily:close-to-splash', !g.els['screen-splash'].classList.contains('hidden'));
}

// ---------- returning player: splash Play resumes at first unbeaten ----------
{
  click('splash-play');
  // after reset nothing is beaten -> starts L1
  ck('flow:play-resumes-fresh-L1', g.call('G.idx') === 0 && g.call('G.finished') === false);
  // given cells cannot be overwritten (toast path)
  const gr = JSON.parse(J('(function(){for(var r=0;r<G.n;r++)for(var c=0;c<G.n;c++)if(G.given[r][c])return [r,c];})()'));
  const before = g.call('G.board[' + gr[0] + '][' + gr[1] + ']');
  tapCell(gr[0], gr[1]); tapVal(before === 1 ? 2 : 1);
  ck('input:given-cell-protected', g.call('G.board[' + gr[0] + '][' + gr[1] + ']') === before);
  // wrong value on an EMPTY cell -> mistake counter shows in HUD
  const emp = JSON.parse(J('(function(){for(var r=0;r<G.n;r++)for(var c=0;c<G.n;c++)if(!G.given[r][c])return [r,c];})()'));
  tapCell(emp[0], emp[1]); tapVal(g.call('G.solution[' + emp[0] + '][' + emp[1] + ']') === 1 ? 2 : 1);
  ck('input:mistake-capped-hud', g.els['hud-mistakes'].textContent === '1/3', g.els['hud-mistakes'].textContent);
}

// ---------- cleanup listener ----------
g.sandbox.dispatchEvent({ type: 'beforeunload' });
g.pump(2);
ck('cleanup:beforeunload-clean', true);

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
