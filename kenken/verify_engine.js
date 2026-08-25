#!/usr/bin/env node
/* kenken — Type A verifier. The generator is SEEDED (seed = n*1000+level, LCG temporarily
 * replacing Math.random), so this verifier slices it verbatim out of index.html and evals it
 * — the grids and cages used to play are produced by the engine's own code, zero
 * transcription drift. Every input flows through real paths: menu buttons (static markup
 * with inline onclick handlers, fired as real element clicks), level-select buttons
 * (runtime-built), canvas pointerdown (cell select), numpad button clicks, control-bar
 * buttons, and document keydown (digits/Delete/ctrl+z/ctrl+y).
 * Covers: cage integrity for all 65 levels + today's daily (partition of n^2 cells,
 * connectivity, op/target consistency against the embedded solution, Latin solutions),
 * uniqueness of all 66 via the engine's own solvePuzzle, all 66 wins, the P0 entry-gate fix
 * (Latin-violating entries bounce + count mistakes; solution-replay always wins), undo/redo
 * (button + ctrl+z/y), erase (button/Clear/Delete), pencil notes never place values, hint
 * (counter + score penalty), next/replay/new navigation, daily flow, menu/stats/settings/
 * tutorial overlays, timer pause AND resume on visibilitychange (P2 fix), beforeunload save,
 * progress reload (boot #2), cleanup. Contract: exit 0 = PASS, last line = JSON. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('kenken');
const doc = g.sandbox.document;
const results = [];
const extra = { levels: 65, engineBugsFixed: [], notes: [] };
function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }

// ---------- engine's own generator + solver, extracted verbatim ----------
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const a = src.indexOf('const GRID_SIZES');
const b = src.indexOf('const canvas=');
if (a < 0 || b < 0) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['generator slice'], extra })); process.exit(1); }
const mod = { exports: {} };
new Function('module', src.slice(a, b) + '\nmodule.exports={GRID_SIZES:GRID_SIZES,generatePuzzle:generatePuzzle,solvePuzzle:solvePuzzle};')(mod);
const { GRID_SIZES, generatePuzzle, solvePuzzle } = mod.exports;

// ---------- data integrity: 65 levels + daily ----------
const LEVELS = []; // {n, level, grid, cages}
for (const n of [4, 5, 6, 7]) for (let i = 0; i < GRID_SIZES[n].levels; i++) { const p = generatePuzzle(n, i); LEVELS.push({ n, level: i, grid: p.grid, cages: p.cages }); }
// engine daily: seed = y*10000+(m+1)*100+d from new Date() — sandbox clock is virtual epoch
const vd = new Date(g.call('Date.now()'));
const dseed = vd.getFullYear() * 10000 + (vd.getMonth() + 1) * 100 + vd.getDate();
const dn = 4 + Math.floor(dseed % 4), dlevel = dseed % GRID_SIZES[dn].levels;
const daily = generatePuzzle(dn, dlevel);
{
  let partitionErr = 0, connectErr = 0, opErr = 0, targetErr = 0, latinErr = 0, nonUnique = [];
  const opResult = (vals, op) => {
    if (op === 'none') return vals[0];
    if (op === '+') return vals.reduce((x, y) => x + y, 0);
    if (op === '-') return Math.abs(vals[0] - vals[1]);
    if (op === 'x') return vals.reduce((x, y) => x * y, 1);
    if (op === '/') return Math.max(vals[0], vals[1]) / Math.min(vals[0], vals[1]);
    return NaN;
  };
  const check = (n, grid, cages, tag) => {
    const seen = new Set();
    for (const cage of cages) {
      if (!((cage.op === 'none' && cage.cells.length === 1) || (['-', '/'].includes(cage.op) && cage.cells.length === 2) || (['+', 'x'].includes(cage.op) && cage.cells.length >= 2))) opErr++;
      const key = (r, c) => r * n + c;
      const set = new Set(cage.cells.map(cl => key(cl.r, cl.c)));
      const q = [cage.cells[0]], vis = new Set([key(cage.cells[0].r, cage.cells[0].c)]);
      while (q.length) { const cl = q.shift(); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = key(cl.r + dr, cl.c + dc); if (set.has(k) && !vis.has(k)) { vis.add(k); q.push({ r: cl.r + dr, c: cl.c + dc }); } } }
      if (vis.size !== cage.cells.length) connectErr++;
      const vals = cage.cells.map(cl => grid[cl.r][cl.c]);
      if (opResult(vals, cage.op) !== cage.target) targetErr++;
      for (const k of set) { if (seen.has(k)) partitionErr++; seen.add(k); }
    }
    if (seen.size !== n * n) partitionErr++;
    for (let r = 0; r < n; r++) if (new Set(grid[r]).size !== n || grid[r].some(v => v < 1 || v > n)) latinErr++;
    for (let c = 0; c < n; c++) if (new Set(grid.map(row => row[c])).size !== n) latinErr++;
    // the engine's own uniqueness counter (stops at 2 solutions)
    if (!solvePuzzle(n, grid.map(r => [...r]), cages, null)) nonUnique.push(tag);
  };
  for (const L of LEVELS) check(L.n, L.grid, L.cages, L.n + '_' + L.level);
  check(dn, daily.grid, daily.cages, 'daily');
  extra.dataIntegrity = { partitionErr, connectErr, opErr, targetErr, latinErr, nonUnique };
  ck('data:65-levels-present', [4, 5, 6, 7].every(n => LEVELS.filter(L => L.n === n).length === GRID_SIZES[n].levels));
  ck('data:cages-partition', partitionErr === 0);
  ck('data:cages-connected', connectErr === 0);
  ck('data:cage-ops-valid', opErr === 0);
  ck('data:cage-targets-correct', targetErr === 0);
  ck('data:solutions-latin', latinErr === 0);
  ck('data:all-puzzles-unique', nonUnique.length === 0, nonUnique.slice(0, 5).join(','));
}

// ---------- real-input plumbing ----------
const cv = doc.getElementById('board');
const np2 = doc.getElementById('numpad');
const winModal = doc.getElementById('win-modal');
const cellClick = (n, r, c) => { const cell = cv.width / n, rect = cv.getBoundingClientRect(); cv.dispatch('pointerdown', { clientX: rect.left + (c + 0.5) * cell, clientY: rect.top + (r + 0.5) * cell, preventDefault() {} }); };
const num = v => { for (const btn of np2.children) if (String(btn.textContent) === String(v)) { btn.click(); return; } };
const clearBtn = () => { for (const btn of np2.children) if (String(btn.textContent) === 'Clear') btn.click(); };
// static markup buttons carry compiled inline onclick handlers — find by handler source
const findBtn = (txt) => { const walk = (el) => { for (const c of (el.children || [])) { if (String(c.tagName).toLowerCase() === 'button' && (typeof c.onclick === 'function' ? c.onclick.toString() : '').includes(txt)) return c; const r = walk(c); if (r) return r; } return null; }; return walk(doc.body); };
const won = () => winModal.classList.contains('show');
const mtext = id => String(doc.getElementById(id).textContent);
function openLevel(n, i) { // menu -> size -> level, all real clicks
  if (won()) { doc.getElementById('win-next').click(); g.pump(1); } // dismiss a stale win modal like a user would
  findBtn(`showLevelSelect(${n})`).click(); g.pump(1);
  doc.getElementById('level-grid').children[i].click(); g.pump(2);
}
function playGrid(n, grid) { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { cellClick(n, r, c); num(grid[r][c]); } g.pump(2); }
function closeWin(next) { (next ? doc.getElementById('win-next') : findBtn('restartLevel()')).click(); g.pump(2); }

// ---------- all 65 wins + daily ----------
{
  const perSize = {};
  for (const n of [4, 5, 6, 7]) {
    let wins = 0;
    for (let i = 0; i < GRID_SIZES[n].levels; i++) {
      openLevel(n, i);
      playGrid(n, LEVELS.find(L => L.n === n && L.level === i).grid);
      if (won() && mtext('mistakes') === '0') wins++;
      if (i < GRID_SIZES[n].levels - 1) closeWin(true); // Next Level from the win modal
    }
    perSize[n + 'x' + n] = wins;
  }
  extra.perSize = perSize;
  ck('win:4x4-all-30', perSize['4x4'] === 30);
  ck('win:5x5-all-20', perSize['5x5'] === 20);
  ck('win:6x6-all-10', perSize['6x6'] === 10);
  ck('win:7x7-all-5', perSize['7x7'] === 5);
  // win modal content sanity (from the last win): fast clear = 3 stars
  ck('win:modal-content', mtext('win-time').startsWith('Time:') && mtext('win-stars').startsWith('***') && mtext('win-score').startsWith('Score:'));
  // completed keys in save
  const sv = JSON.parse(g.sandbox.localStorage.getItem('kenken_progress_v1'));
  const need = []; for (const n of [4, 5, 6, 7]) for (let i = 0; i < GRID_SIZES[n].levels; i++) need.push(`${n}_${i}`);
  ck('save:all-completed-keys', need.every(k => sv.completed.includes(k)), sv.completed.length + ' keys');
  ck('save:streak-counts', sv.streak >= 65, 'streak=' + sv.streak);
  // daily via its real menu button
  findBtn('startDailyPuzzle()').click(); g.pump(2);
  const dailyOk = mtext('game-info') === `${dn}x${dn} ${GRID_SIZES[dn].name}`;
  playGrid(dn, daily.grid);
  ck('win:daily', dailyOk && won(), 'n=' + dn + ' level=' + dlevel);
  const sv2 = JSON.parse(g.sandbox.localStorage.getItem('kenken_progress_v1'));
  ck('save:daily-key', sv2.completed.includes(`${dn}_${dlevel}`));
  closeWin(false); // Replay from the daily win -> restarts same level
  ck('nav:replay-restarts', !won() && mtext('game-info') === `${dn}x${dn} ${GRID_SIZES[dn].name}`);
}

// ---------- entry-gate behavior (P0 fix) ----------
{
  openLevel(4, 0);
  const L = LEVELS.find(x => x.n === 4 && x.level === 0);
  // Latin violation: same digit twice in a row must bounce and count a mistake
  cellClick(4, 0, 0); num(L.grid[0][0]);
  cellClick(4, 0, 1); num(L.grid[0][0]);
  const bounced = mtext('mistakes') === '1';
  // the bounce left no value: completing the board minus (0,1) must NOT win, then placing
  // the solution digit at (0,1) must win
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if (r === 0 && c === 1) continue; cellClick(4, r, c); num(L.grid[r][c]); }
  g.pump(2);
  const noWinWithHole = !won();
  cellClick(4, 0, 1); num(L.grid[0][1]); g.pump(2);
  ck('fix:latin-gate-bounces+winpath', bounced && noWinWithHole && won());
}

// ---------- undo / redo / erase / pencil / hint ----------
{
  openLevel(4, 2);
  const L = LEVELS.find(x => x.n === 4 && x.level === 2);
  // place (0,0), undo via ctrl+z, redo via ctrl+y — then fill the REST: win proves redo restored it
  cellClick(4, 0, 0); num(L.grid[0][0]);
  g.key('z', 'keydown'); // no ctrl — must NOT undo (guard check)
  doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1);
  doc.dispatch('keydown', { key: 'y', ctrlKey: true, preventDefault() {} }); g.pump(1);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if (r === 0 && c === 0) continue; cellClick(4, r, c); num(L.grid[r][c]); }
  g.pump(2);
  ck('flow:undo-redo-ctrl', won());
}
{
  // A) button undo: place (0,0), undo it, fill the REST — the hole must block the win
  openLevel(5, 0);
  const L = LEVELS.find(x => x.n === 5 && x.level === 0);
  cellClick(5, 0, 0); num(L.grid[0][0]);
  findBtn('undoMove()').click(); g.pump(1); // button undo empties (0,0)
  let hole = !won();
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { if (r === 0 && c === 0) continue; cellClick(5, r, c); num(L.grid[r][c]); }
  g.pump(2); hole = hole && !won(); // undo really removed the digit: board minus (0,0) can't win
  cellClick(5, 0, 0); num(L.grid[0][0]); g.pump(2);
  const undoWin = won();
  // B) fresh board (openLevel also exercises the stale-modal dismissal): erase via the Clear
  //    numpad button, no-op Delete on an empty cell, refill
  openLevel(5, 0);
  cellClick(5, 1, 1); num(L.grid[1][1]); // place the victim cell first
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { if ((r === 1 && c === 1) || (r === 0 && c === 0)) continue; cellClick(5, r, c); num(L.grid[r][c]); }
  g.pump(1); // (0,0) still empty, so this partial board cannot win
  cellClick(5, 1, 1); // re-select the victim (the fill loop left selection at (4,4))
  clearBtn(); // Clear erases the selected (1,1)
  g.key('Delete'); // selected cell already empty — no-op path
  const erased = !won();
  // re-select (0,0) first — pointerdown on the still-selected (1,1) would just DEselect it
  cellClick(5, 0, 0); num(L.grid[0][0]); cellClick(5, 1, 1); num(L.grid[1][1]); g.pump(2);
  ck('flow:undo-button+erase-clear', hole && undoWin && erased && won());
}
{
  openLevel(6, 0);
  const L = LEVELS.find(x => x.n === 6 && x.level === 0);
  // pencil mode: notes on three cells must not place values or count mistakes
  findBtn('togglePencil()').click(); g.pump(1);
  const hintCount0 = mtext('hint-count');
  cellClick(6, 0, 0); num(L.grid[0][0]); cellClick(6, 0, 1); num(5); cellClick(6, 0, 2); num(L.grid[0][2]); // 5 is a note digit, not a value
  const mistakes0 = mtext('mistakes');
  findBtn('togglePencil()').click(); g.pump(1);
  // completing the board (notes present on 3 cells) still wins — notes never blocked values
  playGrid(6, L.grid);
  ck('flow:pencil-notes-inert', hintCount0 === '0' && mistakes0 === '0' && won());
}
{
  openLevel(4, 3);
  const L = LEVELS.find(x => x.n === 4 && x.level === 3);
  cellClick(4, 2, 2);
  findBtn('useHint()').click(); g.pump(1);
  const h = mtext('hint-count') === '1';
  playGrid(4, L.grid);
  const scoreTxt = mtext('win-score'); // 100*1*2 - 50 = 150 with one hint
  ck('flow:hint-counted+penalty', h && won() && scoreTxt.includes('150'), scoreTxt);
}

// ---------- navigation / overlays / settings / stats / tutorial ----------
{
  // menu via a real Menu button (several exist: game screen + win modal)
  findBtn('showMenu()').click(); g.pump(1);
  ck('nav:menu-screen', doc.getElementById('menu-screen').style.display === 'flex');
  // level-select marks completed levels (all 30 of the 4x4 run were won above)
  findBtn('showLevelSelect(4)').click(); g.pump(1);
  const lg = doc.getElementById('level-grid').children;
  ck('nav:level-select-marks-done', lg.filter(b => b.classList.contains('completed')).length === 30);
  // stats modal
  findBtn('showStats()').click(); g.pump(1);
  const statsOpen = doc.getElementById('stats-modal').classList.contains('show') && doc.getElementById('stats-grid').children.length >= 8;
  findBtn('closeStats()').click(); g.pump(1);
  ck('ui:stats-modal', statsOpen && !doc.getElementById('stats-modal').classList.contains('show'));
  // settings modal: toggle timer off -> persists in save
  findBtn('showSettings()').click(); g.pump(1);
  doc.getElementById('toggle-timer').click(); g.pump(1);
  const timerOff = !JSON.parse(g.sandbox.localStorage.getItem('kenken_progress_v1')).settings.timer;
  doc.getElementById('toggle-timer').click(); g.pump(1); // back on
  findBtn('closeSettings()').click(); g.pump(1);
  ck('ui:settings-toggle-persists', timerOff && JSON.parse(g.sandbox.localStorage.getItem('kenken_progress_v1')).settings.timer);
  // tutorial walkthrough: prev/next through all steps, last one starts a 4x4 game
  findBtn('startTutorial()').click(); g.pump(1);
  const tutOpen = doc.getElementById('tutorial-overlay').classList.contains('show');
  let guard = 0;
  while (String(doc.getElementById('tutorial-next').textContent) !== 'Start Game' && guard++ < 20) { g.sandbox.tutorialNext(); }
  const lastLabel = String(doc.getElementById('tutorial-next').textContent);
  g.sandbox.tutorialNext(); g.pump(2);
  ck('ui:tutorial-walkthrough', tutOpen && lastLabel === 'Start Game' && doc.getElementById('game-screen').style.display === 'flex' && mtext('game-info') === '4x4 Easy');
}

// ---------- timer pause/resume on visibilitychange (P2 fix) ----------
{
  g.sandbox.startGame(4, 5); g.pump(2);
  g.pump(120); // 2s
  const t1 = mtext('timer');
  doc.hidden = true; doc.dispatch('visibilitychange'); g.pump(360);
  const t2 = mtext('timer');
  doc.hidden = false; doc.dispatch('visibilitychange'); g.pump(120);
  const t3 = mtext('timer');
  extra.timerTrace = [t1, t2, t3];
  ck('flow:visibility-pause+resume', t1 !== '00:00' && t2 === t1 && t3 !== t2, [t1, t2, t3].join('->'));
}

// ---------- beforeunload + reload persistence (boot #2) ----------
{
  g.sandbox.dispatchEvent({ type: 'beforeunload' }); g.pump(1);
  const saved = JSON.parse(g.sandbox.localStorage.getItem('kenken_progress_v1'));
  // the daily's key is `${dn}_${dlevel}` — it aliases the regular level it reuses (5_1 under
  // the epoch clock), so unique completed keys = 65 while totalWins counts every win
  ck('save:beforeunload', saved && saved.completed.length === 65 && saved.totalWins >= 71, 'keys=' + saved.completed.length + ' wins=' + saved.totalWins);
  const g2 = bootGame('kenken', { seedLS: Object.assign({}, g.ls._m) });
  const d2 = g2.sandbox.document;
  const prog = String(d2.getElementById('menu-stats').textContent);
  g2.sandbox.showLevelSelect(4); g2.pump(1);
  const doneCount = Array.from(d2.getElementById('level-grid').children).filter(b => b.classList.contains('completed')).length;
  ck('resume:progress-reloads', prog.includes('65 puzzles completed') && doneCount === 30, prog + ' | ' + doneCount);
  ck('resume:no-load-errors-2', (g2.loadErrors || []).length === 0);
  g2.sandbox.cleanup(); g2.pump(1);
}

// ---------- cleanup + runtime health ----------
{
  g.sandbox.cleanup(); g.pump(2);
  g.sandbox.dispatchEvent({ type: 'resize' }); g.pump(1); // resize handler must not crash post-cleanup
  ck('cleanup:no-crash', true);
  ck('runtime:no-load-errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join('|'));
  ck('runtime:no-async-errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
  extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
}

extra.engineBugsFixed = [
  'P0 placeNumber blocked EVERY numpad/keypad placement: the guard `state.solution[r][c]!==0` is always true (solution is a complete Latin square), so playError() fired on every entry and the game was 100% unwinnable. Entries now gate on the Latin constraint (row/col duplicate) with a live mistakes counter; checkWin still validates cages + full board + Latin.',
  'P2 visibilitychange: stopTimer() left timerRunning=true, so the resume guard never fired after a tab-away — the interval was cleared but the flag said running and the clock stayed dead. stopTimer now clears the flag, and resume re-arms the interval in place (old code called startTimer(), which reset the elapsed time to 00:00).',
  'P1 interval leak: startTimer overwrote timerInterval without stopping a live one — every game abandoned mid-run leaked a 1s interval that kept incrementing state.timer (N abandonments = N-times-fast clock + N zombie callbacks). startTimer stops first.',
  'P1 tutorial: renderTutorialCanvas only illustrated steps 0-2 of 4 — step 4 threw on undefined ex.text and left the tutorial overlay stuck with Start Game unreachable. Added the step-4 illustration.',
  'P2 stale win modal: the modal kept its show class across Win -> Menu -> new level and reappeared covering the fresh game (its Next/Replay then acted on the new game). startGame now hides it.'
];

// ---------- tally ----------
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(results.map(r => (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.info ? '  [' + r.info + ']' : '')).join('\n'));
console.log(JSON.stringify({ pass, fail, total: results.length, verdict, fails: results.filter(r => !r.ok).map(r => r.name + (r.info ? ': ' + r.info : '')), extra }));
process.exit(fail === 0 ? 0 : 1);
