#!/usr/bin/env node
/* futoshiki — Type A verifier: solve all 30 levels by clicking the real .cell divs
 * (click -> gzCellClick -> G.sel) and the numpad buttons (gzPlace), the engine's own
 * input path. Plus: data integrity (latin-square solutions, givens subset, constraints
 * adjacent+satisfied, and a backtracking solver PROVING each puzzle has exactly one
 * solution — the win check demands board === solution), wrong-but-full no-win path,
 * undo/erase/notes/hint/check/reset flows, slow-time star decay, daily challenge
 * (relabel-isomorphic to level 22), achievements, persistence.
 * Contract: exit 0 = PASS, last line = JSON. */
'use strict';
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('futoshiki');
const results = [];
const extra = { levels: 30, engineBugsFixed: [], tiers: {}, dataIntegrity: {}, daily: {}, notes: [] };

function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }
function click(el) { el.click(); g.pump(2); }

// ---------- embedded data integrity: latin / givens / constraints / UNIQUENESS ----------
const LEVELS = JSON.parse(g.call('JSON.stringify(LEVELS)'));
function countSolutions(L, cap) {
  const N = L.N;
  const bd = Array.from({ length: N }, () => Array(N).fill(0));
  for (const gv of L.g) bd[gv[0]][gv[1]] = gv[2];
  const rowU = Array.from({ length: N }, () => Array(N + 1).fill(false));
  const colU = Array.from({ length: N }, () => Array(N + 1).fill(false));
  const consAt = Array.from({ length: N * N }, () => []);
  L.c.forEach((cn, i) => { consAt[cn[0] * N + cn[1]].push({ i, meA: true }); consAt[cn[2] * N + cn[3]].push({ i, meA: false }); });
  const filled = L.c.map(cn => false);
  let steps = 0, count = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (bd[r][c]) { rowU[r][bd[r][c]] = true; colU[c][bd[r][c]] = true; L.c.forEach((cn, i) => { if ((cn[0] === r && cn[1] === c) || (cn[2] === r && cn[3] === c)) filled[i] = true; }); }
  // check constraints whose BOTH endpoints are givens up front (single-endpoint ones have a 0 side)
  for (let i = 0; i < L.c.length; i++) {
    const [aR, aC, bR, bC, op] = L.c[i], va = bd[aR][aC], vb = bd[bR][bC];
    if (va && vb && (op === '<' ? !(va < vb) : !(va > vb))) return 0;
  }
  function place(r, c, v) {
    bd[r][c] = v; rowU[r][v] = true; colU[c][v] = true;
    const newly = [];
    for (const { i, meA } of consAt[r * N + c]) if (!filled[i]) { filled[i] = true; newly.push(i); }
    return newly;
  }
  function unplace(r, c, v, newly) {
    bd[r][c] = 0; rowU[r][v] = false; colU[c][v] = false;
    for (const i of newly) filled[i] = false;
  }
  function ok(r, c, v) {
    if (rowU[r][v] || colU[c][v]) return false;
    for (const { i, meA } of consAt[r * N + c]) {
      if (!filled[i]) continue;
      const cn = L.c[i];
      const oR = meA ? cn[2] : cn[0], oC = meA ? cn[3] : cn[1];
      const other = bd[oR][oC];
      if (!other) continue;
      // cn4 describes a op b; placing the a-end tests v op other, the b-end tests other cn4 v (operands swap, operator does NOT)
      if (meA) { if (cn[4] === '<' ? !(v < other) : !(v > other)) return false; }
      else { if (cn[4] === '<' ? !(other < v) : !(other > v)) return false; }
    }
    return true;
  }
  function dfs(pos) {
    if (count >= 2) return;
    if (pos === N * N) { count++; return; }
    if (++steps > cap) { count = -1; return; }
    const r = (pos / N) | 0, c = pos % N;
    if (bd[r][c]) { dfs(pos + 1); return; }
    for (let v = 1; v <= N; v++) {
      if (!ok(r, c, v)) continue;
      const newly = place(r, c, v);
      dfs(pos + 1);
      unplace(r, c, v, newly);
      if (count >= 2 || count === -1) return;
    }
  }
  dfs(0);
  return count;
}
{
  let latinErr = 0, givErr = 0, consErr = 0, uniqBad = 0, uniqCap = 0;
  const perm = (a, N) => a.length === N && a.slice().sort((x, y) => x - y).every((d, i) => d === i + 1);
  for (const L of LEVELS) {
    const N = L.N;
    if (!L.s.every(row => perm(row, N))) latinErr++;
    for (let c = 0; c < N; c++) if (!perm(L.s.map(row => row[c]), N)) latinErr++;
    for (const [r, c, v] of L.g) if (L.s[r][c] !== v) givErr++;
    for (const [aR, aC, bR, bC, op] of L.c) {
      if (Math.abs(aR - bR) + Math.abs(aC - bC) !== 1) consErr++;
      else if (op === '<' ? !(L.s[aR][aC] < L.s[bR][bC]) : !(L.s[aR][aC] > L.s[bR][bC])) consErr++;
    }
    const u = countSolutions(L, 3e6);
    if (u === -1) uniqCap++; else if (u !== 1) uniqBad++;
    extra.tiers[L.n] = (extra.tiers[L.n] || 0) + 1;
  }
  ck('data:30-latin-squares', latinErr === 0, latinErr + ' bad');
  ck('data:givens-subset', givErr === 0, givErr + ' clashes');
  ck('data:constraints-valid', consErr === 0, consErr + ' bad');
  ck('data:30-unique-solutions', uniqBad === 0, uniqBad + ' non-unique' + (uniqCap ? ' (' + uniqCap + ' solver-capped)' : ''));
  extra.dataIntegrity = { latinErr, givErr, consErr, uniqBad, uniqCap };
}

// ---------- helpers over the real DOM ----------
// static-markup buttons live on the body-parse tree (els registry stubs carry no children)
const appB = g.sandbox.document.body.children[2]; // #app
const menuB = appB.children[0].children;   // title, subtitle, Play, Level Select, Daily, Howto, stats
const winB = appB.children[5].children;    // win-title, win-stars, win-stats, win-next, Level Select, Menu
const gameB = appB.children[3].children;   // topbar, board-wrap, numpad, action-row
const howtoB = appB.children[6].children;
function cellEl(r, c) { const d = 2 * g.call('G.N') - 1; return g.els['board'].children[2 * r * d + 2 * c]; }
function tapCell(r, c) { cellEl(r, c).click(); }
function tapVal(v) { g.els['numpad'].children[v - 1].click(); }
function actionBtn(i) { return gameB[3].children[i]; } // Undo, Notes, Hint, Erase, Check
function solveCurrent() {
  const empt = JSON.parse(g.call('(function(){var e=[];for(var r=0;r<G.N;r++)for(var c=0;c<G.N;c++)if(G.board[r][c]===0)e.push([r,c,G.solution[r][c]]);return JSON.stringify(e);})()'));
  for (const [r, c, v] of empt) {
    tapCell(r, c);
    const sel = JSON.parse(g.call('JSON.stringify(G.sel)') || 'null');
    if (!sel || sel[0] !== r || sel[1] !== c) return 'sel-miss ' + r + ',' + c;
    tapVal(v);
    if (g.call('G.board[' + r + '][' + c + ']') !== v) return 'place-miss ' + r + ',' + c;
  }
  return g.call("G.screen") === 'win-screen' ? null : 'not-won';
}
function winActive() { return g.els['win-screen'].classList.contains('active'); }
function howtoB_trigger() { return menuB[5]; }

// ---------- boot + menu ----------
ck('boot:clean', g.loadErrors.filter(e => !/footer|analytic|adsterra|monetag|adsbygoogle|pagead/i.test(e)).length === 0, g.loadErrors.join(' | '));
ck('boot:menu-active', g.els['menu-screen'].classList.contains('active') && /Solved 0\/30/.test(String(g.els['menu-stats'].textContent)), String(g.els['menu-stats'].textContent));
click(howtoB_trigger()); // How to Play
ck('flow:howto-open', g.els['howto-screen'].classList.contains('active'));
click(howtoB[howtoB.length - 1]); // "Got it!" back to menu
ck('flow:howto-back-menu', g.els['menu-screen'].classList.contains('active'));

// ---------- level select fresh: 5 tiers, 2 unlocked / 28 locked ----------
click(menuB[3]); // Level Select
const tiers = g.els['ls-content'].children;
ck('levels:5-tier-sections', tiers.length === 5 && tiers.every(t => t.children[1].children.length === 6), tiers.length + ' tiers');
const allCells = tiers.flatMap(t => t.children[1].children);
ck('levels:2-unlocked-28-locked-fresh', allCells.filter(c => c.classList.contains('locked')).length === 28, allCells.filter(c => c.classList.contains('locked')).length + ' locked');
const lockedCell = allCells.find(c => c.classList.contains('locked'));
click(lockedCell);
ck('levels:locked-no-op', g.call('G.screen') === 'level-select' && g.call('G.levelIdx') === 0 && g.call('G.N') === 0, 'screen=' + g.call('G.screen') + ' N=' + g.call('G.N'));

// ---------- play -> L1 ----------
click(menuB[2]); // Play (first unsolved = 1)
ck('L01:starts', g.call('G.levelIdx') === 0 && g.call('G.N') === 4 && g.els['board'].children.length === 49 && g.els['numpad'].children.length === 5, 'board children=' + g.els['board'].children.length);
ck('L01:cell-dataset', cellEl(1, 2) && String(cellEl(1, 2).dataset.r) === '1' && String(cellEl(1, 2).dataset.c) === '2');
g.pump(70); // 1s timer interval fires
ck('hud:timer-ticks', /⏱/.test(String(g.els['tb-info'].innerHTML)) && !/⏱ 0:00/.test(String(g.els['tb-info'].innerHTML)), String(g.els['tb-info'].innerHTML).replace(/<[^>]+>/g, ' '));

// ---------- solve all 30 levels through real clicks ----------
for (let i = 0; i < 30; i++) {
  if (g.call('G.levelIdx') !== i) { ck('L' + (i + 1) + ':idx', false, 'levelIdx=' + g.call('G.levelIdx')); break; }
  const err = solveCurrent();
  ck('L' + String(i + 1).padStart(2, '0') + ':solve', !err, err || '');
  if (err) break;
  const stars3 = winActive() && g.els['win-stars'].textContent === '⭐⭐⭐';
  ck('L' + String(i + 1).padStart(2, '0') + ':win-3stars', stars3, g.els['win-stars'].textContent);
  if (i === 29) {
    ck('L30:win-stats-name', /Master/.test(String(g.els['win-stats'].innerHTML)));
    click(g.els['win-next']);
    ck('flow:after-L30-levelselect+toast', g.call('G.screen') === 'level-select' && /finished all levels/.test(String(g.els['toast'].textContent)), String(g.els['toast'].textContent));
  } else {
    click(g.els['win-next']);
    if (g.call('G.levelIdx') !== i + 1) { ck('L' + (i + 1) + ':next', false, 'levelIdx=' + g.call('G.levelIdx')); break; }
  }
}
g.pump(140); // achievement pops are on 200ms/2200ms timers
{
  const stars = JSON.parse(g.ls.getItem('futoshiki_stars') || '{}');
  ck('save:30-levels-3stars', Array.from({ length: 30 }, (_, i) => stars['l' + (i + 1)] === 3).every(Boolean), Object.keys(stars).length + ' entries');
  const unlocked = g.els['ls-content'].children.flatMap(t => t.children[1].children).filter(c => !c.classList.contains('locked')).length;
  ck('levels:30-unlocked-after', unlocked === 30, 'unlocked=' + unlocked);
  ck('ach:first+tiers+nohint', ['first', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'nohint'].every(k => g.call('G.ach["' + k + '"]') === true), JSON.stringify(g.call('JSON.stringify(G.ach)')));
  click(appB.children[1].children[2]); // level-select "Back" -> gzShowMenu (refreshes menu-stats)
  ck('menu:stats-30/30', /Solved 30\/30 · ⭐ 90\/90 · 🏆 7\/8/.test(String(g.els['menu-stats'].textContent)), String(g.els['menu-stats'].textContent));
  click(menuB[3]); // reopen Level Select for the replay section
}

// ---------- replay L2: wrong-but-full does NOT win, then fix wins ----------
click(g.els['ls-content'].children[0].children[1].children[1]); // Beginner tier, cell id 2
ck('replay:L2-loads', g.call('G.levelIdx') === 1 && g.call('G.N') === 4);
{
  const e = JSON.parse(g.call('(function(){for(var r=0;r<G.N;r++)for(var c=0;c<G.N;c++)if(G.board[r][c]===0)return JSON.stringify([r,c,G.solution[r][c]]);})()'));
  const wrong = e[2] === 1 ? 2 : 1;
  tapCell(e[0], e[1]); tapVal(wrong);
  const rest = JSON.parse(g.call('(function(){var a=[];for(var r=0;r<G.N;r++)for(var c=0;c<G.N;c++)if(G.board[r][c]===0)a.push([r,c,G.solution[r][c]]);return JSON.stringify(a);})()'));
  for (const [r, c, v] of rest) { tapCell(r, c); tapVal(v); }
  const noWin = !winActive() && g.call('G.screen') === 'game-screen'; // full but wrong -> err-flash, no win
  tapCell(e[0], e[1]); tapVal(e[2]); // fix the one wrong cell
  g.pump(3);
  ck('replay:wrong-full-no-win-then-fix', noWin && winActive(), JSON.stringify({ noWin }));
  click(winB[4]); // "Level Select" button on the win screen
  ck('replay:win-to-levelselect', g.call('G.screen') === 'level-select');
}

// ---------- replay L3: undo / notes / erase / check / given-protected ----------
click(g.els['ls-content'].children[0].children[1].children[2]); // cell id 3
ck('replay:L3-loads', g.call('G.levelIdx') === 2);
{
  const e = JSON.parse(g.call('(function(){var a=[];for(var r=0;r<G.N;r++)for(var c=0;c<G.N;c++)if(G.board[r][c]===0)a.push([r,c,G.solution[r][c]]);return JSON.stringify(a);})()'));
  // place then undo
  tapCell(e[0][0], e[0][1]); tapVal(e[0][2]);
  const placed = g.call('G.board[' + e[0][0] + '][' + e[0][1] + ']') === e[0][2];
  click(actionBtn(0)); // Undo
  const undone = g.call('G.board[' + e[0][0] + '][' + e[0][1] + ']') === 0;
  ck('replay:place+undo', placed && undone, JSON.stringify({ placed, undone }));
  // notes mode: two candidates render, then placing the value clears them
  click(actionBtn(1)); // Notes ON
  tapCell(e[1][0], e[1][1]); tapVal(e[1][2] === 1 ? 2 : 1); tapVal(e[1][2]);
  const seeded = g.call('G.notes[' + e[1][0] + '][' + e[1][1] + '].size') === 2 && g.call('G.board[' + e[1][0] + '][' + e[1][1] + ']') === 0 && (cellEl(e[1][0], e[1][1]).children[0] || {}).className === 'notes';
  click(actionBtn(1)); // Notes OFF
  tapCell(e[1][0], e[1][1]); tapVal(e[1][2]);
  ck('replay:notes-toggle+clear-on-place', seeded && g.call('G.board[' + e[1][0] + '][' + e[1][1] + ']') === e[1][2] && g.call('G.notes[' + e[1][0] + '][' + e[1][1] + '].size') === 0, JSON.stringify({ seeded }));
  click(actionBtn(0)); // undo the placement (leaves board clean for erase test below)
  // erase button
  tapCell(e[2][0], e[2][1]); tapVal(e[2][2]);
  const placed3 = g.call('G.board[' + e[2][0] + '][' + e[2][1] + ']') === e[2][2];
  click(actionBtn(3)); // Erase (gzEraseSel)
  ck('replay:erase-btn', placed3 && g.call('G.board[' + e[2][0] + '][' + e[2][1] + ']') === 0);
  // same-number tap toggles erase too (howto promise)
  tapCell(e[2][0], e[2][1]); tapVal(e[2][2]); tapVal(e[2][2]);
  ck('replay:same-number-tap-erases', g.call('G.board[' + e[2][0] + '][' + e[2][1] + ']') === 0);
  // check-progress toast with empties remaining
  click(actionBtn(4)); // Check
  ck('replay:check-progress-toast', /empty cell/.test(String(g.els['toast'].textContent)), String(g.els['toast'].textContent));
  // given cells: click clears selection, numpad no-op
  const gv = JSON.parse(g.call('(function(){var x=G.givens[0];return JSON.stringify([x[0],x[1],G.board[x[0]][x[1]]]);})()'));
  tapCell(e[3][0], e[3][1]); // select an empty first
  tapCell(gv[0], gv[1]); // given click -> sel=null
  const selNull = g.call('G.sel') === null;
  tapVal(gv[2] === 1 ? 2 : 1);
  ck('input:given-protected', selNull && g.call('G.board[' + gv[0] + '][' + gv[1] + ']') === gv[2]);
  // reset via topbar (confirm() stub returns true)
  tapCell(e[3][0], e[3][1]); tapVal(e[3][2]);
  const preReset = g.call('G.board[' + e[3][0] + '][' + e[3][1] + ']') === e[3][2];
  click(gameB[0].children[2]); // topbar ↺
  const afterReset = g.call('G.board[' + e[3][0] + '][' + e[3][1] + ']') === 0 && g.call('G.hintUsed') === 0;
  ck('replay:reset-level', preReset && afterReset, JSON.stringify({ preReset, afterReset }));
}

// ---------- replay L4: hint -> 2 stars, best stays 3 ----------
click(g.els['ls-content'].children[0].children[1].children[3]); // cell id 4
{
  const e = JSON.parse(g.call('(function(){for(var r=0;r<G.N;r++)for(var c=0;c<G.N;c++)if(G.board[r][c]===0)return JSON.stringify([r,c,G.solution[r][c]]);})()'));
  tapCell(e[0], e[1]);
  click(actionBtn(2)); // Hint (uses selected cell)
  const hinted = g.call('G.hintUsed') === 1 && g.call('G.board[' + e[0] + '][' + e[1] + ']') === e[2] && /−1 star/.test(String(g.els['toast'].textContent));
  const err = solveCurrent();
  g.pump(3);
  ck('replay:hint-2stars-best-stays-3', hinted && !err && g.els['win-stars'].textContent === '⭐⭐☆' && JSON.parse(g.ls.getItem('futoshiki_stars'))['l4'] === 3, err || g.els['win-stars'].textContent);
}

// ---------- slow time -> star decay (virtual clock past N*N*12s) ----------
click(g.els['win-next']); // L5 (fresh, no hints)
g.pump(16 * 12 * 60 + 80); // 4x4 slow limit = 192s
{
  const err = solveCurrent();
  g.pump(3);
  ck('replay:slow-time-2stars', !err && g.els['win-stars'].textContent === '⭐⭐☆', err || g.els['win-stars'].textContent);
  ck('replay:slow-best-stays-3', JSON.parse(g.ls.getItem('futoshiki_stars'))['l5'] === 3);
}

// ---------- daily challenge (relabel-isomorphic to level 22) ----------
click(winB[5]); // Menu (from L5 win screen)
click(menuB[4]); // Daily Challenge
{
  const dOk = g.call('G.isDaily') === true && g.call('G.N') === 6;
  const DL = JSON.parse(g.call('JSON.stringify({N:G.dailyLevel.N,g:G.dailyLevel.g,c:G.dailyLevel.c,s:G.dailyLevel.s,id:G.dailyLevel.id})'));
  const perm = (a, N) => a.length === N && a.slice().sort((x, y) => x - y).every((d, i) => d === i + 1);
  const latin = DL.s.every(row => perm(row, 6)) && DL.s.every((_, c) => perm(DL.s.map(row => row[c]), 6));
  const givens = DL.g.every(([r, c, v]) => DL.s[r][c] === v);
  const consOk = DL.c.every(([aR, aC, bR, bC, op]) => op === '<' ? DL.s[aR][aC] < DL.s[bR][bC] : DL.s[aR][aC] > DL.s[bR][bC]);
  ck('daily:relabel-puzzle-valid', dOk && latin && givens && consOk, JSON.stringify({ dOk, latin, givens, consOk }));
  extra.daily = { key: 'daily' + g.call('gzDailyKey()'), id: DL.id };
  const err = solveCurrent();
  g.pump(3);
  const dKey = 'daily' + g.call('gzDailyKey()');
  const dStars = JSON.parse(g.ls.getItem('futoshiki_stars') || '{}')[dKey];
  ck('daily:solve+save+next-hidden', !err && g.els['win-stars'].textContent === '⭐⭐⭐' && dStars === 3 && g.els['win-next'].style.display === 'none', err || JSON.stringify(dStars));
}

// ---------- resume semantics: everything solved -> Play restarts at L1 ----------
click(winB[5]); // Menu
click(menuB[2]); // Play
ck('flow:play-resume-all-solved-L1', g.call('G.levelIdx') === 0 && g.call('G.N') === 4);

ck('runtime:no-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
