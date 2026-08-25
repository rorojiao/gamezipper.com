#!/usr/bin/env node
/* easy-as-abc/verify_engine.js — E2E verifier (2026-08-25)
 * Offline: LEVELS extraction + data oracle — 30 levels, 5 tier blocks (4x4/L3,
 * 5x5/L3, 5x5/L4, 6x6/L4, 6x6/L4), Latin-with-nulls rows/cols (each letter exactly
 * once), clue arrays well-formed, stored solution satisfies all 4 clue families
 * (first-visible semantics), and a row-pattern DFS uniqueness solver proving every
 * level has EXACTLY ONE clue-satisfying completion (the engine's exact-match win
 * only rejects alternative solves if this holds).
 * Driven boots (real canvas pointerdown taps only; button onclick handlers):
 *  A fresh — howto overlay flow, geometry (cellSize/offsets), tap-cycle null->A->B->C->null,
 *    undo chain + empty-undo toast, conflict placements, clue-band taps no-op,
 *    FULL L1 win in the theoretical minimum 24 taps -> 3 stars "Perfect!" (P1 fix),
 *    win overlay/LS, winNext, level-select lock logic + locked/cur/done classes,
 *    hint -> deterministic single correct placement -> finish for 2 stars,
 *    reset, sound toggle.
 *  B seeded progress/done/howto — boots at level 5, menu reflects done set.
 *  C corrupt LS ('{bad' abc_done, 999 and -1 abc_progress, 'zzz') — P2 guards:
 *    boots level 1 playable, menu works, win rewrites abc_done cleanly.
 *  D full 30-level sweep of real tap wins, each at 3 stars, final-level Next no-op.
 * Engine fixes verified: P1 3-star thresholds unreachable on every level,
 * P2 corrupt abc_done crashed init (dead game), P2 out-of-range saved curLevel
 * crashed loadLevel. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let PASS = 0, FAIL = 0; const FAILS = [];
function ok(cond, name, detail) {
  if (cond) { PASS++; } else { FAIL++; FAILS.push(name + (detail !== undefined ? ' | ' + detail : '')); }
}
const J = (x) => JSON.stringify(x);

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lvM = /var LEVELS = (\[[\s\S]*?\]);/.exec(html);
ok(!!lvM, 'extract-LEVELS');
const LEVELS = new Function('return ' + lvM[1])();

/* ================= D-SERIES: DATA ORACLE ================= */
ok(LEVELS.length === 30, 'D1-30-levels', LEVELS.length);
const TIERS = [[4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [5, 3], [5, 3], [5, 3], [5, 3], [5, 3], [5, 3], [5, 4], [5, 4], [5, 4], [5, 4], [5, 4], [5, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4], [6, 4]];
const firstVis = (seq) => { for (const v of seq) if (v !== null) return v; return null; };
for (let i = 0; i < 30; i++) {
  const L = LEVELS[i], n = L.size, letters = 'ABCDEFGHIJ'.substring(0, L.letters).split(''), t = i + 1;
  ok(L.size === TIERS[i][0] && L.letters === TIERS[i][1], 'D1-tier-' + t, L.size + '/' + L.letters);
  ok(L.grid.length === n && L.grid.every((row) => row.length === n), 'D2-square-' + t);
  let valsOK = true;
  for (let r = 0; r < n && valsOK; r++) for (let c = 0; c < n; c++) if (L.grid[r][c] !== null && !letters.includes(L.grid[r][c])) valsOK = false;
  ok(valsOK, 'D2-values-' + t);
  let latin = true;
  for (let r = 0; r < n; r++) { const row = L.grid[r].filter((x) => x !== null); if (new Set(row).size !== L.letters || row.length !== L.letters) latin = false; }
  for (let c = 0; c < n; c++) { const col = L.grid.map((row) => row[c]).filter((x) => x !== null); if (new Set(col).size !== L.letters || col.length !== L.letters) latin = false; }
  ok(latin, 'D2-latin-' + t);
  const clueOK = ['top', 'bottom', 'left', 'right'].every((k) => Array.isArray(L[k]) && L[k].length === n && L[k].every((v) => letters.includes(v) || v === null));
  ok(clueOK, 'D3-clues-' + t);
  let sat = true;
  for (let c = 0; c < n; c++) { const col = L.grid.map((row) => row[c]); if (String(firstVis(col)) !== String(L.top[c]) || String(firstVis(col.slice().reverse())) !== String(L.bottom[c])) sat = false; }
  for (let r = 0; r < n; r++) { if (String(firstVis(L.grid[r])) !== String(L.left[r]) || String(firstVis(L.grid[r].slice().reverse())) !== String(L.right[r])) sat = false; }
  ok(sat, 'D4-solution-satisfies-clues-' + t);
}
/* duplicate-level note (not a failure): levels are handcrafted rotations of a few bases */
const dup = [];
for (let i = 0; i < 30; i++) for (let j2 = i + 1; j2 < 30; j2++) if (J(LEVELS[i]) === J(LEVELS[j2])) dup.push(j2 + 1);

/* ================= S-SERIES: UNIQUE SOLUTION ================= */
function rowPatterns(n, L) {
  const letters = 'ABCDEFGHIJ'.substring(0, L).split('');
  const out = [];
  const rec = (row, li) => {
    if (li === L) { out.push(row.slice()); return; }
    for (let p = 0; p < n; p++) { if (row[p] !== null) continue; row[p] = letters[li]; rec(row, li + 1); row[p] = null; }
  };
  rec(new Array(n).fill(null), 0);
  return out;
}
function solutionCount(lv) {
  const n = lv.size, L = lv.letters;
  const pats = rowPatterns(n, L);
  const li = (ch) => ch.charCodeAt(0) - 65;
  let count = 0;
  const grid = [];
  const colHas = Array.from({ length: n }, () => Array(L).fill(false));
  function dfs(r) {
    if (count >= 2) return;
    if (r === n) {
      for (let c = 0; c < n; c++) {
        const col = grid.map((row) => row[c]);
        if (String(firstVis(col)) !== String(lv.top[c]) || String(firstVis(col.slice().reverse())) !== String(lv.bottom[c])) return;
      }
      count++;
      return;
    }
    for (const pat of pats) {
      let okc = true;
      for (let c = 0; c < n && okc; c++) { const v = pat[c]; if (v !== null && colHas[c][li(v)]) okc = false; }
      if (!okc) continue;
      if (String(firstVis(pat)) !== String(lv.left[r])) continue;
      if (String(firstVis(pat.slice().reverse())) !== String(lv.right[r])) continue;
      let okt = true;
      for (let c = 0; c < n; c++) {
        let first = null;
        for (let r2 = 0; r2 < r; r2++) if (grid[r2][c] !== null) { first = grid[r2][c]; break; }
        if (first === null) first = pat[c];
        if (first !== null && String(first) !== String(lv.top[c])) { okt = false; break; }
      }
      if (!okt) continue;
      for (let c = 0; c < n; c++) if (pat[c] !== null) colHas[c][li(pat[c])] = true;
      grid.push(pat);
      dfs(r + 1);
      grid.pop();
      for (let c = 0; c < n; c++) if (pat[c] !== null) colHas[c][li(pat[c])] = false;
    }
  }
  dfs(0);
  return count;
}
for (let i = 0; i < 30; i++) ok(solutionCount(LEVELS[i]) === 1, 'S-unique-L' + (i + 1), solutionCount(LEVELS[i]));

/* ================= DRIVEN HELPERS ================= */
function bootA(seedLS) { return bootGame('easy-as-abc', seedLS ? { seedLS } : {}); }
const $id = (ga, id) => ga.els[id];
function tap(ga, r, c) {
  const cv = $id(ga, 'canvas');
  const offX = ga.call('gridOffsetX'), offY = ga.call('gridOffsetY'), cs = ga.call('cellSize');
  cv.dispatch('pointerdown', { clientX: offX + c * cs + cs / 2, clientY: offY + r * cs + cs / 2 });
}
function tapTo(ga, r, c, letter) { // cycle from null to the target letter
  const L = LEVELS[ga.call('curLevel')];
  const k = letter === null ? L.letters : 'ABCDEFGHIJ'.indexOf(letter) + 1;
  for (let i = 0; i < k; i++) tap(ga, r, c);
}
function solveLevelByTaps(ga) {
  const idx = ga.call('curLevel');
  const L = LEVELS[idx];
  for (let r = 0; r < L.size; r++) for (let c = 0; c < L.size; c++) if (L.grid[r][c] !== null) tapTo(ga, r, c, L.grid[r][c]);
}
const minMoves = (L) => L.size * L.letters * (L.letters + 1) / 2;

/* ================= BOOT A — fresh ================= */
{
  const ga = bootA();
  ok(ga.loadErrors.length === 0, 'a-load-errors', J(ga.loadErrors));
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 1 / 30', 'a1-label', String($id(ga, 'levelLabel').textContent));
  ga.pump(600);
  ok($id(ga, 'howto').classList.contains('show'), 'a2-howto-shows');
  $id(ga, 'howClose').dispatch('click', {});
  ok(!$id(ga, 'howto').classList.contains('show') && ga.sandbox.localStorage.getItem('abc_howto') === '1', 'a2-howto-close');
  ok(ga.call('cellSize') === 72 && ga.call('gridOffsetX') === 96 && ga.call('gridOffsetY') === 186, 'a3-geometry', ga.call('cellSize') + '/' + ga.call('gridOffsetX') + '/' + ga.call('gridOffsetY'));
  // tap cycle null->A->B->C->null at (0,0)
  tap(ga, 0, 0);
  ok(ga.call('playerGrid[0][0]') === 'A' && ga.call('moveCount') === 1, 'a4-cycle-A');
  tap(ga, 0, 0);
  ok(ga.call('playerGrid[0][0]') === 'B', 'a4-cycle-B');
  tap(ga, 0, 0);
  ok(ga.call('playerGrid[0][0]') === 'C', 'a4-cycle-C');
  tap(ga, 0, 0);
  ok(ga.call('playerGrid[0][0]') === null && ga.call('moveCount') === 4, 'a4-cycle-null');
  ok(String($id(ga, 'status').textContent).indexOf('Moves: 4') === 0, 'a4-status', String($id(ga, 'status').textContent));
  // undo chain back to empty
  for (let i = 0; i < 4; i++) $id(ga, 'btnUndo').dispatch('click', {});
  ok(ga.call('playerGrid[0][0]') === null && ga.call('moveCount') === 4, 'a5-undo-chain');
  $id(ga, 'btnUndo').dispatch('click', {});
  ga.pump(20);
  ok(String($id(ga, 'toast').textContent).indexOf('Nothing to undo') === 0 && $id(ga, 'toast').classList.contains('err'), 'a5-empty-undo-toast');
  // conflict placements draw red but persist
  tapTo(ga, 0, 0, 'A'); tapTo(ga, 0, 1, 'A');
  ok(ga.call('playerGrid[0][0]') === 'A' && ga.call('playerGrid[0][1]') === 'A', 'a6-conflict-persists');
  ok(ga.call('checkConflict(0, 1, "A")') === true && ga.call('checkConflict(1, 0, "B")') === false, 'a6-conflict-detect'); // (1,0) conflicts with the (0,0) A via the column — B is the clean letter
  // clue-band tap: y above the grid -> no cell -> no move
  const mc = ga.call('moveCount');
  const cv = $id(ga, 'canvas');
  cv.dispatch('pointerdown', { clientX: ga.call('gridOffsetX') + 36, clientY: ga.call('gridOffsetY') - 30 });
  ok(ga.call('moveCount') === mc, 'a7-clueband-noop');
  // reset
  $id(ga, 'btnReset').dispatch('click', {});
  ok(ga.call('moveCount') === 0 && ga.call('undoStack.length') === 0 && ga.call('hintsUsed') === 0, 'a11-reset');
  // sound toggle
  $id(ga, 'btnSound').dispatch('click', {});
  ok(ga.call('soundOn') === false && ga.call('musicOn') === false && String($id(ga, 'btnSound').textContent) === '♪', 'a12-sound-off', String($id(ga, 'btnSound').textContent));
  $id(ga, 'btnSound').dispatch('click', {});
  ok(ga.call('soundOn') === true && String($id(ga, 'btnSound').textContent) === '♫', 'a12-sound-on');
  // FULL L1 win in theoretical minimum 24 taps -> 3 stars (P1 fix)
  solveLevelByTaps(ga);
  ok(ga.call('moveCount') === 24, 'a8-min-24', ga.call('moveCount'));
  ok(ga.call('winShown') === true, 'a8-win-shown');
  ga.pump(60);
  ok($id(ga, 'win').classList.contains('show'), 'a8-overlay');
  ok(String($id(ga, 'winStars').textContent) === '★★★', 'a8-3stars', String($id(ga, 'winStars').textContent));
  ok(String($id(ga, 'winTitle').textContent) === 'Perfect!', 'a8-title');
  ok(String($id(ga, 'winMsg').textContent).indexOf('Solved in 24 moves') === 0, 'a8-msg', String($id(ga, 'winMsg').textContent));
  ok(ga.sandbox.localStorage.getItem('abc_done') === '{"0":true}' && ga.sandbox.localStorage.getItem('abc_progress') === '{"curLevel":0}', 'a8-ls', ga.sandbox.localStorage.getItem('abc_done'));
  // taps blocked after win
  const mc2 = ga.call('moveCount');
  tap(ga, 1, 1);
  ok(ga.call('moveCount') === mc2, 'a8-postwin-tap-blocked');
  // next level
  $id(ga, 'winNext').dispatch('click', {});
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 2 / 30' && ga.call('winShown') === false, 'a9-next');
  // level select
  $id(ga, 'btnMenu').dispatch('click', {});
  ok($id(ga, 'select').classList.contains('show'), 'a9-menu-show');
  const cells = ($id(ga, 'selGrid').children || []).filter((c2) => c2.classList.contains('selcell'));
  const tiers = ($id(ga, 'selGrid').children || []).filter((c2) => c2.classList.contains('seltier'));
  ok(cells.length === 30 && tiers.length === 5, 'a9-select-cells', cells.length + '/' + tiers.length);
  ok(cells[0].classList.contains('done') && cells[1].classList.contains('cur') && !cells[1].classList.contains('locked') && !cells[0].classList.contains('locked'), 'a9-done-cur');
  let lockedN = 0; cells.forEach((c2, i2) => { if (c2.classList.contains('locked')) lockedN++; });
  ok(lockedN === 28, 'a9-28-locked', lockedN);
  cells[5].dispatch('click', {});
  ok($id(ga, 'select').classList.contains('show') && ga.call('curLevel') === 1, 'a9-locked-click-toast', String($id(ga, 'toast').textContent));
  cells[0].dispatch('click', {});
  ok(!$id(ga, 'select').classList.contains('show') && ga.call('curLevel') === 0, 'a9-unlocked-click');
  // hint: exactly one cell gets its correct letter, hintsUsed 1
  $id(ga, 'btnHint').dispatch('click', {});
  const pg = JSON.parse(ga.call('JSON.stringify(playerGrid)'));
  const sol = LEVELS[0].grid;
  let hintCells = 0, hintRight = true;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if (pg[r][c] !== null && pg[r][c] === sol[r][c]) { hintCells++; } if (pg[r][c] !== null && pg[r][c] !== sol[r][c]) hintRight = false; }
  ok(hintCells === 1 && hintRight && ga.call('hintsUsed') === 1, 'a10-hint-one', hintCells + '/' + ga.call('hintsUsed'));
  ga.pump(30);
  ok(String($id(ga, 'hint').textContent).indexOf('Placed ') === 0, 'a10-hint-text', String($id(ga, 'hint').textContent));
  // finish with taps -> 2 stars (one hint used, moves within 2x minimum)
  solveLevelByTaps(ga);
  ga.pump(60);
  ok($id(ga, 'win').classList.contains('show') && String($id(ga, 'winStars').textContent) === '★★☆', 'a10-hint-2stars', String($id(ga, 'winStars').textContent));
}

/* ================= BOOT B — seeded progress ================= */
{
  const done = {}; for (let i = 0; i < 4; i++) done[i] = true;
  const ga = bootA({ abc_progress: '{"curLevel":4}', abc_done: JSON.stringify(done), abc_howto: '1' });
  ok(ga.loadErrors.length === 0, 'b-load-errors', J(ga.loadErrors));
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 5 / 30', 'b1-restored-l5', String($id(ga, 'levelLabel').textContent));
  ga.pump(600);
  ok(!$id(ga, 'howto').classList.contains('show'), 'b1-no-howto');
  $id(ga, 'btnMenu').dispatch('click', {});
  const cells = ($id(ga, 'selGrid').children || []).filter((c2) => c2.classList.contains('selcell'));
  ok(cells[3].classList.contains('done') && !cells[4].classList.contains('locked') && cells[4].classList.contains('cur'), 'b2-menu-done-cur');
  let lockedN = 0; cells.forEach((c2) => { if (c2.classList.contains('locked')) lockedN++; });
  ok(lockedN === 25, 'b2-25-locked', lockedN);
}

/* ================= BOOT C — corrupt LS (P2 guards) ================= */
{
  const ga = bootA({ abc_done: '{bad json', abc_progress: '{"curLevel":999}', abc_howto: '1' });
  ok(ga.loadErrors.length === 0, 'c-load-errors', J(ga.loadErrors));
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 1 / 30', 'c1-clamped', String($id(ga, 'levelLabel').textContent));
  tap(ga, 0, 0);
  ok(ga.call('playerGrid[0][0]') === 'A', 'c1-playable');
  $id(ga, 'btnMenu').dispatch('click', {});
  ok($id(ga, 'select').classList.contains('show'), 'c2-menu-opens');
  $id(ga, 'btnMenu').dispatch('click', {}); // no close handler on btnMenu; hide via cell click below
  const cells = ($id(ga, 'selGrid').children || []).filter((c2) => c2.classList.contains('selcell'));
  ok(cells.length === 30, 'c2-select-built', cells.length);
  cells[0].dispatch('click', {});
  ok(ga.call('curLevel') === 0, 'c2-cell0-click');
  solveLevelByTaps(ga);
  ga.pump(60);
  ok($id(ga, 'win').classList.contains('show'), 'c3-win');
  ok(ga.sandbox.localStorage.getItem('abc_done') === '{"0":true}', 'c3-abc-done-rewritten', ga.sandbox.localStorage.getItem('abc_done'));
}
{
  const ga = bootA({ abc_progress: '{"curLevel":-1}', abc_howto: '1' });
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 1 / 30', 'c4-negative-clamped', String($id(ga, 'levelLabel').textContent));
}
{
  const ga = bootA({ abc_progress: 'zzz', abc_howto: '1' });
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 1 / 30', 'c5-unparseable-clamped', String($id(ga, 'levelLabel').textContent));
}

/* ================= BOOT D — full 30-level sweep ================= */
{
  const ga = bootA({ abc_howto: '1' });
  let sweepErr = '';
  for (let li = 0; li < 30; li++) {
    if (ga.call('curLevel') !== li) { sweepErr = 'L' + (li + 1) + ':cur=' + ga.call('curLevel'); break; }
    solveLevelByTaps(ga);
    if (!ga.call('winShown')) { sweepErr = 'L' + (li + 1) + ':nowin'; break; }
    ga.pump(60);
    const stars = String($id(ga, 'winStars').textContent);
    if (stars !== '★★★') { sweepErr = 'L' + (li + 1) + ':stars=' + stars + ' moves=' + ga.call('moveCount'); break; }
    PASS++; // per-level credit
    if (li < 29) { $id(ga, 'winNext').dispatch('click', {}); ga.pump(20); }
  }
  ok(sweepErr === '', 'D-sweep-30', sweepErr);
  const doneObj = JSON.parse(ga.sandbox.localStorage.getItem('abc_done') || '{}');
  ok(Object.keys(doneObj).filter((k) => doneObj[k]).length === 30, 'D-ls-all-done', ga.sandbox.localStorage.getItem('abc_done'));
  ok(ga.sandbox.localStorage.getItem('abc_progress') === '{"curLevel":29}', 'D-ls-progress', ga.sandbox.localStorage.getItem('abc_progress'));
  $id(ga, 'winNext').dispatch('click', {});
  ok(String($id(ga, 'levelLabel').textContent) === 'Level 30 / 30' && !$id(ga, 'win').classList.contains('show'), 'D-final-next-stays');
}

/* ================= REPORT ================= */
const out = { pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS.slice(0, 12), extra: { engineFixes: ['P1 init() called loadLevel(0) right after loadProgress() — restored progress was dead code, every session restarted at level 1; now restores the clamped saved level', 'P1 getStars: 3 stars was unreachable on EVERY level — flawless play needs size*letters*(letters+1)/2 moves (0.67x-0.83x the old maxMoves bound) while 3 stars demanded <=0.5x; thresholds rebased on the theoretical minimum', 'P2 corrupt abc_done threw inside buildLevelSelect during init — listeners never wired, game permanently dead; loadDoneSafe() guard added', 'P2 out-of-range saved curLevel (999/-1) crashed loadLevel in init; clamped to [0, LEVELS.length)'], dataNotes: ['all 30 levels have EXACTLY ONE completion satisfying their clues (row-pattern DFS counter) — the exact-match win condition never rejects a valid solve', 'duplicate levels shipped: ' + (dup.length ? dup.join(',') : 'none')], documented: ['hint picks a RANDOM wrong/empty cell (seeded LCG in harness) — verifier asserts exactly one correct placement, not a specific cell', 'win overlay appears after a 400ms setTimeout (pump-driven); taps blocked by winShown but Undo/Reset stay live — cosmetic quirk, Next/Replay reload resets it', 'btnMenu has no close handler of its own (select closes on cell click) — shipped behavior', 'levels 1-6 are 4x4/L3, 7-12 5x5/L3, 13-18 5x5/L4, 19-30 6x6/L4'] } };
console.log(JSON.stringify(out));
process.exit(FAIL === 0 ? 0 : 1);
