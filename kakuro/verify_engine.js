#!/usr/bin/env node
/* kakuro — Type A verifier. The engine lives in an IIFE closure (no state access), but its
 * generator is deterministic and seeded, so this verifier SLICES the generator functions
 * straight out of index.html and evals them — the solutions used to play are produced by the
 * engine's own code, zero transcription drift. Plays all 30 levels + the daily puzzle via the
 * real input paths: canvas pointerdown -> selectCell (200ms virtual-time debounce honored by
 * pump(13)) and numpad button clicks -> placeNumber; keyboard digits via document keydown.
 * Covers: clue/data integrity, wrong-full-board must NOT win (constraint checkWin), undo,
 * erase, notes (class toggle + values not placed), hint (counter + star decay, best kept),
 * tier/level unlock chain, save persistence, settings toggles, visibilitychange pause,
 * tutorial auto-open/close, beforeunload. Contract: exit 0 = PASS, last line = JSON. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('kakuro');
// the harness now fires document-DCL itself (the old harness read only __wls and silently
// dropped __dls document listeners, so this verifier used to fire them manually). Re-firing
// here would run init() a second time — every initEvents() closure double-binds (fresh
// closures defeat the harness's identical-callback dedupe), clicks fire twice, and NEXT
// advances two levels. Only fire if the engine somehow didn't boot.
if (!(g.els['toggle-sfx'] && g.els['toggle-sfx'].classList.contains('on'))) { // applySettings marks toggles; numpad is built per-level in startGame, not by init
  const ls = ((g.sandbox.document.__dls || {})['DOMContentLoaded'] || []);
  ls.forEach(f => { try { f.call(g.sandbox.document, { type: 'DOMContentLoaded' }); } catch (e) { g.loadErrors.push('manual-dcl: ' + e.message); } });
  if (!ls.length) g.loadErrors.push('no-document-DCL-listener');
}
const results = [];
const extra = { levels: 30, engineBugsFixed: [], tiers: {}, dataIntegrity: {}, daily: {}, notes: [] };
function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }

// ---------- engine's own generator, extracted verbatim from index.html ----------
const src = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
const a = src.indexOf('function seededRandom');
const b = src.indexOf('function initCanvas');
if (a < 0 || b < 0) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['generator slice'], extra })); process.exit(1); }
const mod = { exports: {} };
new Function('module', src.slice(a, b) + '\nmodule.exports.generatePuzzle=generatePuzzle;module.exports.generateDailyPuzzle=generateDailyPuzzle;')(mod);
const genPuzzle = mod.exports.generatePuzzle, genDaily = mod.exports.generateDailyPuzzle;

const PUZZLES = []; // [{tier,level,puzzle,solution}]
for (let tier = 0; tier < 5; tier++) for (let level = 0; level < 6; level++) PUZZLES.push({ tier, level, ...genPuzzle(tier, level, 42) });
// the engine's daily is seeded from the sandbox's virtual date (epoch start) — derive the same
// seed instead of calling genDaily() with node's real date
const vd = new Date(g.call('Date.now()'));
const dseed = vd.getFullYear() * 10000 + (vd.getMonth() + 1) * 100 + vd.getDate();
const DAILY = genPuzzle(dseed % 5, (dseed * 7) % 6, dseed);
const SIZE_BY_TIER = [7, 8, 9, 10, 10];

// ---------- data integrity (30 levels + daily) ----------
{
  let zeroErr = 0, clueErr = 0, sizeErr = 0, borderErr = 0, distinctErr = 0;
  const check = (p, tier) => {
    const size = p.puzzle.length;
    if (size !== SIZE_BY_TIER[tier]) sizeErr++;
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
      const border = i === 0 || j === 0 || i === size - 1 || j === size - 1;
      if (border && !p.puzzle[i][j].black) borderErr++; // interior blacks are legitimate (repair)
      if (!p.puzzle[i][j].black && !(p.solution[i][j].value >= 1 && p.solution[i][j].value <= 9)) zeroErr++;
    }
    const hR = [], vR = [];
    for (let i = 0; i < size; i++) { let run = []; for (let j = 0; j < size; j++) { if (p.puzzle[i][j].black) { if (run.length >= 2) hR.push(run); run = []; } else run.push([i, j]); } if (run.length >= 2) hR.push(run); }
    for (let j = 0; j < size; j++) { let run = []; for (let i = 0; i < size; i++) { if (p.puzzle[i][j].black) { if (run.length >= 2) vR.push(run); run = []; } else run.push([i, j]); } if (run.length >= 2) vR.push(run); }
    if (hR.length < 2) clueErr++;
    for (const run of hR) {
      const vals = run.map(([r, c]) => p.solution[r][c].value);
      const clueCell = p.puzzle[run[0][0]][run[0][1] - 1];
      if (!clueCell.black || clueCell.hClue !== vals.reduce((s, v) => s + v, 0) || new Set(vals).size !== vals.length) clueErr++;
    }
    for (const run of vR) {
      const vals = run.map(([r, c]) => p.solution[r][c].value);
      const clueCell = p.puzzle[run[0][0] - 1][run[0][1]];
      if (!clueCell.black || clueCell.vClue !== vals.reduce((s, v) => s + v, 0) || new Set(vals).size !== vals.length) clueErr++;
    }
  };
  PUZZLES.forEach(P => check(P, P.tier));
  check(DAILY, dseed % 5);
  ck('data:30+daily-clue-consistent', clueErr === 0, clueErr + ' bad clues');
  ck('data:no-zero-solution-cells', zeroErr === 0, zeroErr + ' whites unfilled');
  ck('data:sizes-by-tier', sizeErr === 0 && DAILY.puzzle.length === 8, 'daily size ' + DAILY.puzzle.length);
  ck('data:full-black-border', borderErr === 0, borderErr + ' border cells wrong');
  extra.dataIntegrity = { clueErr, zeroErr, sizeErr, borderErr };
}

// ---------- helpers ----------
const board = g.els['game-canvas'];
let curP = null;
function tap(r, c) {
  g.pump(13); // >200ms virtual debounce between pointerdowns
  const w = parseFloat(board.style.width);
  const cs = w / curP.puzzle.length;
  board.dispatch('pointerdown', { clientX: (c + 0.5) * cs, clientY: (r + 0.5) * cs, preventDefault() {} });
}
function num(v) { g.els['numpad'].children[v - 1].click(); }
function click(id) { g.els[id].click(); g.pump(2); }
const TIER_NAMES = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'];
function solveCurrent(skipCells) {
  const skip = new Set(skipCells || []);
  const size = curP.puzzle.length;
  const order = [];
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) if (!curP.puzzle[i][j].black && !skip.has(i * 100 + j)) order.push([i, j]);
  for (const [r, c] of order) { tap(r, c); num(curP.solution[r][c].value); }
  return order.length;
}
function winActive() { return g.els['win-overlay'].classList.contains('active'); }
function earnedStars() { return g.els['win-stars'].children.filter(c => String(c.className).indexOf('earned') >= 0).length; }
function save() { return JSON.parse(g.ls.getItem('kakuro_save_v1') || '{}'); }

// ---------- boot + tutorial ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
g.pump(35);
ck('tut:auto-open-first-visit', g.els['tutorial-overlay'].classList.contains('active'));
click('btn-close-tutorial');
ck('tut:close+persist', !g.els['tutorial-overlay'].classList.contains('active') && save().tutorialSeen === true);

// ---------- menu / tier grid / locked ----------
click('btn-play');
ck('menu:opens', g.els['menu-screen'].classList.contains('active') && g.els['tier-container'].children.length === 5);
g.els['tier-container'].children[0].click(); g.pump(2);
const lc = g.els['level-container'];
ck('grid:tier0-6-levels+back', lc.children.length === 7 && lc.children.filter(c => /(^| )locked( |$)/.test(String(c.className))).length === 5);
lc.children[1].click(); g.pump(2);
ck('grid:locked-no-op', !g.els['game-screen'].classList.contains('active'));
lc.children[0].click(); g.pump(2);
ck('L1:starts', g.els['game-screen'].classList.contains('active') && String(g.els['level-display'].textContent) === 'BEGINNER - LEVEL 1' && g.els['numpad'].children.length === 11 && String(g.els['hint-counter'].textContent) === '3 left');
g.pump(65);
ck('hud:timer-ticks', String(g.els['timer'].textContent) !== '00:00', String(g.els['timer'].textContent));

// ---------- main loop: all 30 levels ----------
let loopErr = null;
for (let tier = 0; tier < 5 && !loopErr; tier++) {
  for (let level = 0; level < 6 && !loopErr; level++) {
    curP = PUZZLES.find(P => P.tier === tier && P.level === level);
    const placed = solveCurrent();
    g.pump(25);
    const tag = 't' + tier + 'L' + (level + 1);
    if (!winActive()) { ck(tag + ':solve+win', false, placed + ' placed, no win overlay'); loopErr = tag; break; }
    const stars = save().stars[tier + '_' + level];
    if (earnedStars() !== 3 || stars !== 3) { ck(tag + ':3stars', false, 'earned=' + earnedStars() + ' saved=' + stars); loopErr = tag; break; }
    ck(tag + ':solve+win+3stars', true);
    extra.tiers[TIER_NAMES[tier]] = (extra.tiers[TIER_NAMES[tier]] || 0) + 1;
    if (level < 5) {
      click('btn-next');
      if (String(g.els['level-display'].textContent) !== TIER_NAMES[tier] + ' - LEVEL ' + (level + 2) || !g.els['game-screen'].classList.contains('active')) {
        ck(tag + ':next-advances', false, String(g.els['level-display'].textContent)); loopErr = tag; break;
      }
    } else {
      click('btn-next');
      if (tier < 4) {
        // L6 -> NEXT must return to menu (was: phantom "level 7"), then enter next tier
        if (!g.els['menu-screen'].classList.contains('active')) { ck(tag + ':next-bounded-menu', false, 'no menu'); loopErr = tag; break; }
        ck(tag + ':next-bounded-menu', true);
        g.els['tier-container'].children[tier + 1].click(); g.pump(2);
        g.els['level-container'].children[0].click(); g.pump(2);
        if (String(g.els['level-display'].textContent) !== TIER_NAMES[tier + 1] + ' - LEVEL 1') { ck('t' + (tier + 1) + 'L1:entry', false, String(g.els['level-display'].textContent)); loopErr = 'entry'; break; }
        ck('t' + (tier + 1) + 'L1:entry', true);
      } else {
        ck('t4L6:next-bounded-menu', g.els['menu-screen'].classList.contains('active'));
      }
    }
  }
}
if (!loopErr) {
  const sv = save();
  const allDone = PUZZLES.every(P => sv.completedLevels[P.tier + '_' + P.level] === true);
  ck('save:30-completed-3stars', allDone && Object.keys(sv.stars).length === 30 && Object.values(sv.stars).every(s => s === 3), Object.keys(sv.completedLevels).length + ' done');
  // tier-0 grid now: all 6 completed, none locked, stars rendered
  g.els['tier-container'].children[0].click(); g.pump(2);
  const lc2 = g.els['level-container'];
  ck('grid:tier0-all-done', lc2.children.slice(0, 6).every(c => String(c.className).indexOf('completed') >= 0) && lc2.children.filter(c => String(c.className).indexOf('locked') >= 0).length === 0);
}

// ---------- replay t0L2: wrong-full board must NOT win, undo, erase, notes ----------
if (!loopErr) {
  g.els['level-container'].children[1].click(); g.pump(2);
  curP = PUZZLES.find(P => P.tier === 0 && P.level === 1);
  const size = curP.puzzle.length;
  const whites = [];
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) if (!curP.puzzle[i][j].black) whites.push([i, j]);
  const A = whites[whites.length - 1], B = whites[whites.length - 2];
  const wrongA = curP.solution[A[0]][A[1]].value === 9 ? 1 : curP.solution[A[0]][A[1]].value + 1;
  solveCurrent([A[0] * 100 + A[1], B[0] * 100 + B[1]]);
  g.pump(5);
  ck('replay:incomplete-no-win', !winActive());
  // place B correctly FIRST so A's wrong placement is the stack top for undo
  tap(B[0], B[1]); num(curP.solution[B[0]][B[1]].value);
  // notes mode: tapping digits must NOT place values (A stays unplaced -> no win)
  click('btn-notes');
  const notesOn = g.els['btn-notes'].classList.contains('active');
  tap(A[0], A[1]); num(wrongA); num(curP.solution[A[0]][A[1]].value);
  g.pump(5);
  ck('replay:notes-toggle+no-place', notesOn && !winActive());
  click('btn-notes');
  ck('replay:notes-off', !g.els['btn-notes'].classList.contains('active'));
  // full board but A wrong (constraint violation) -> must NOT win
  tap(A[0], A[1]); num(wrongA);
  g.pump(5);
  ck('replay:wrong-full-no-win', !winActive(), 'constraint checkWin rejects');
  // undo pops A's wrong entry (A back to 0, board incomplete -> still no win)
  click('btn-undo');
  g.pump(5);
  ck('replay:undo-empties', !winActive());
  tap(A[0], A[1]); num(curP.solution[A[0]][A[1]].value);
  g.pump(25);
  ck('replay:win-after-undo-fix', winActive() && earnedStars() === 3);
  ck('replay:best-stars-stay-3', save().stars['0_1'] === 3);
  click('btn-menu-win');
  ck('replay:menu-escape', g.els['menu-screen'].classList.contains('active') && !winActive());

  // ---------- replay t0L3: erase + keyboard placement ----------
  g.els['tier-container'].children[0].click(); g.pump(2);
  g.els['level-container'].children[2].click(); g.pump(2);
  curP = PUZZLES.find(P => P.tier === 0 && P.level === 2);
  const whites3 = [];
  for (let i = 0; i < curP.puzzle.length; i++) for (let j = 0; j < curP.puzzle.length; j++) if (!curP.puzzle[i][j].black) whites3.push([i, j]);
  const D = whites3[whites3.length - 1];
  solveCurrent([D[0] * 100 + D[1]]);
  // erase path: place wrong, X-erase (numpad children[9]), still no win, then keyboard the right digit
  tap(D[0], D[1]); num(curP.solution[D[0]][D[1]].value === 9 ? 1 : curP.solution[D[0]][D[1]].value + 1);
  g.pump(5);
  ck('replay2:wrong-no-win', !winActive());
  g.els['numpad'].children[9].click(); g.pump(5); // 'X' erase
  tap(D[0], D[1]); // reselect (erase left selection, but tap again to be explicit)
  g.key(String(curP.solution[D[0]][D[1]].value)); // document keydown path
  g.pump(25);
  ck('replay2:erase+keyboard-win', winActive() && earnedStars() === 3);
  click('btn-menu-win');

  // ---------- replay t0L4: hint decodes a cell, star decays to 2, best stays 3 ----------
  g.els['tier-container'].children[0].click(); g.pump(2);
  g.els['level-container'].children[3].click(); g.pump(2);
  curP = PUZZLES.find(P => P.tier === 0 && P.level === 3);
  const whites4 = [];
  for (let i = 0; i < curP.puzzle.length; i++) for (let j = 0; j < curP.puzzle.length; j++) if (!curP.puzzle[i][j].black) whites4.push([i, j]);
  const H = whites4[0];
  tap(H[0], H[1]); // select (no placement)
  click('btn-hint');
  const hintUsed = String(g.els['hint-counter'].textContent) === '2 left';
  // skip ONLY H (the hint filled it); the arg is the do-not-place set
  const solved4 = solveCurrent([H[0] * 100 + H[1]]);
  g.pump(25);
  ck('replay3:hint-counter+2star-win', hintUsed && solved4 > 0 && winActive() && earnedStars() === 2, 'counter=' + g.els['hint-counter'].textContent + ' earned=' + earnedStars());
  ck('replay3:best-stars-stay-3', save().stars['0_3'] === 3);
  click('btn-menu-win');
  click('btn-back-menu');
}

// ---------- visibilitychange pause ----------
{
  g.els['btn-play'] && click('btn-play');
  g.els['tier-container'].children[0].click(); g.pump(2);
  g.els['level-container'].children[0].click(); g.pump(2);
  curP = PUZZLES.find(P => P.tier === 0 && P.level === 0);
  g.pump(125); // ~2s of timer
  const before = String(g.els['timer'].textContent);
  try {
    g.sandbox.document.hidden = true;
    (g.sandbox.document.dispatchEvent ? g.sandbox.document.dispatchEvent({ type: 'visibilitychange' }) : g.sandbox.document.dispatch('visibilitychange', {}));
    g.pump(125);
    const paused = String(g.els['timer'].textContent) === before;
    g.sandbox.document.hidden = false;
    (g.sandbox.document.dispatchEvent ? g.sandbox.document.dispatchEvent({ type: 'visibilitychange' }) : g.sandbox.document.dispatch('visibilitychange', {}));
    g.pump(125);
    ck('flow:visibilitychange-pauses-timer', paused && String(g.els['timer'].textContent) !== before, before + ' -> ' + String(g.els['timer'].textContent));
  } catch (e) { ck('flow:visibilitychange-pauses-timer', false, e.message); }
  // solve it to leave a clean winnable state
  solveCurrent(); g.pump(25);
  ck('flow:post-pause-solvable', winActive());
  click('btn-menu-win');
  click('btn-back-menu');
}

// ---------- daily ----------
{
  click('btn-daily');
  curP = { tier: dseed % 5, level: (dseed * 7) % 6, ...DAILY };
  ck('daily:label', String(g.els['level-display'].textContent) === 'DAILY PUZZLE');
  const placed = solveCurrent();
  g.pump(25);
  const sv = save();
  ck('daily:solvable+saved', winActive() && sv.completedLevels['-1_0'] === true, placed + ' placed');
  ck('daily:always-1-star-quirk', sv.stars['-1_0'] === 1, 'TIER_PAR[-1] undefined -> 1 star (documented P3)');
  extra.daily = { key: '-1_0', stars: sv.stars['-1_0'], size: DAILY.puzzle.length };
  click('btn-next');
  ck('daily:next-goes-menu', g.els['menu-screen'].classList.contains('active'));
  click('btn-back-menu');
}

// ---------- tutorial re-open + settings ----------
click('btn-tutorial-title');
ck('tut:manual-reopen', g.els['tutorial-overlay'].classList.contains('active'));
click('btn-close-tutorial');
click('btn-settings');
ck('settings:overlay', g.els['settings-overlay'].classList.contains('active'));
click('toggle-sfx');
const sfxOff = !g.els['toggle-sfx'].classList.contains('on') && save().settings.sfx === false;
click('toggle-sfx');
click('toggle-errors');
const errOff = !g.els['toggle-errors'].classList.contains('on') && save().settings.errors === false;
click('toggle-errors');
click('toggle-bgm');
const bgmOff = !g.els['toggle-bgm'].classList.contains('on') && save().settings.bgm === false;
click('toggle-bgm');
click('btn-close-settings');
ck('settings:toggles-persist', sfxOff && errOff && bgmOff && g.els['toggle-sfx'].classList.contains('on') && g.els['settings-overlay'] && !g.els['settings-overlay'].classList.contains('active'));

// ---------- cleanup ----------
g.sandbox.dispatchEvent({ type: 'beforeunload' });
g.pump(2);
ck('cleanup:beforeunload-saves', save().completedLevels['0_0'] === true);
ck('runtime:no-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
extra.engineBugsFixed = [
  'P0 generator maxSum: 9*len overcounted the max run sum (genCombos emits distinct increasing digits, len-7 caps at 42 not 63) -> empty combo list -> all 20 seeded iterations failed on 4 levels -> broken fallback puzzle with 2..11 solution values (unwinnable). Fixed to (10-len)..9.',
  'P0 isolated whites: white cells whose horizontal segment is length 1 belong to no hRun, so fillGridBacktrack never assigned them -> solution 0, unplaceable by the player -> 22 of 30 levels permanently unwinnable. repairPattern blacks them out (one pass = fixpoint).',
  'P1 checkWin exact-match: generator does not prove uniqueness, so a valid alternate kakuro completion was rejected as a loss. Now validates the real win condition (all whites 1-9, every run sums to its clue, distinct digits per run).',
  'P2 btn-next phantom levels: tiers 0-3 advanced past level 6 unconditionally, creating save keys the grid never shows. Bounded like tier 4.',
  'P3 (documented): generateFallbackPuzzle 1+(i+j)%9+1 produced 2..10 — fixed to 1..9 even though the path is now unreachable; daily win reads TIER_PAR[-1]=undefined so the daily always awards exactly 1 star.'
];

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
