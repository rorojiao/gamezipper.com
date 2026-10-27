#!/usr/bin/env node
/**
 * R337 — Hidato hint regression gate (DETERMINISTIC).
 *
 * THE DEFECT (P2): btn-hint did
 *     placeNumber(r, c, num);
 *     State.hints--;          // <-- unconditional
 * and placeNumber() returns EARLY when its auto-check rejects the placement
 * ("Not adjacent to n-1/n+1" / "n already used"). The player then LOST one of
 * only 3 hints and the board did not change.
 *
 * It is reachable because a Hidato puzzle here can admit more than one valid
 * chain (measured: 22/30 levels), so the player may legitimately be on a
 * chain that differs from the stored solution — and the stored solution's
 * number for a cell can then be rejected.
 *
 * WHY THE FIRST VERSION OF THIS GATE WAS WRONG: the hint picks a RANDOM
 * candidate cell (`candidates[rand(candidates.length)]`), so the defect only
 * fires on some (level, random-draw) pairs. The gate therefore PASSED on the
 * PRE-FIX page — a gate that cannot fail is not a gate (Pitfall #62). This
 * version makes the trigger DETERMINISTIC:
 *   1. it reproduces the engine's own rejection rule in Node to find WHICH
 *      candidate cell would be rejected;
 *   2. it overrides Math.random so the hint picks exactly that candidate;
 *   3. it clicks the real hint button and observes the real state.
 *
 * THE GATE:
 *   A) on a FRESH board the hint must place a number and consume exactly 1 hint;
 *   B) in the defect state the hint must NOT consume a hint and must not
 *      change the board;
 *   C) counter-case: the auto-check must STILL reject an invalid placement
 *      (the fix must not have relaxed the rule to make the test pass).
 *
 * NEGATIVE CONTROL: run with the PRE-FIX page — the gate MUST FAIL there.
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const fs = require('fs');
const path = require('path');
const { loadEngine, countSolutions, calibrate } = require('./r337-hidato-counter.js');

const ROOT = path.resolve(__dirname, '..');
// The gate can be pointed at a PRE-FIX copy of the page (the negative
// control). bootGame() reads REPO/<slug>/index.html, so a different page is
// supplied by swapping the file in for the run and restoring it afterwards.
const PAGE = process.argv[2] ? path.resolve(process.argv[2]) : null;
const LABEL = process.argv[3] || (PAGE ? 'copy' : 'current');
const SLUG = 'hidato';
const TARGET = path.join(ROOT, SLUG, 'index.html');

let backup = null;
if (PAGE && path.resolve(TARGET) !== PAGE) {
  backup = fs.readFileSync(TARGET);
  fs.copyFileSync(PAGE, TARGET);
}
process.on('exit', () => { if (backup) fs.writeFileSync(TARGET, backup); });

const generatePuzzle = loadEngine();
const cal = calibrate(generatePuzzle);
if (!cal.pass) { console.log('CALIBRATION FAILED'); process.exit(3); }

const g = bootGame('hidato', {
  inject: {
    anchor: 'function loadLevel(',
    exports: `/* R337 hint gate */
      (function(){ const o = document.createElement.bind(document); document.createElement = (t) => { const el = o(t); if (el) { if (!el.cloneNode) el.cloneNode = function(){ return el; }; } return el; };
        const pk = document.getElementById('picker'); if (pk) Object.defineProperty(pk, 'firstChild', { get: function(){ return (this.children || []).length ? this.children[0] : null; } }); })();
      globalThis.__T = {
        start: (i) => loadLevel(i, false),
        sol: () => JSON.stringify(State.puzzle.solution),
        given: () => JSON.stringify(State.puzzle.given),
        size: () => State.puzzle.size,
        hints: () => State.hints,
        grid: () => JSON.stringify(State.grid2d),
        place: (r,c,v) => placeNumber(r,c,v),
        checkWin: () => checkWin(),
        autocheck: () => State.autocheck,
        reset: () => { State.grid2d = State.puzzle.given.map(function(r){return r.slice();}); State.won=false; State.history=[]; State.hints=3; State.hintsTotal=3; },
        /* force the hint's random pick: rand(n) = floor(Math.random()*n) */
        pick: (k, n) => { Math.random = function(){ return (k + 0.5) / n; }; },
        unrand: () => { Math.random = function(){ return Math.random(); }; },
      };`,
  },
});

const TIERS = [
  { name: 'Easy', size: 5, count: 8, fillRatio: 0.55 },
  { name: 'Medium', size: 7, count: 8, fillRatio: 0.45 },
  { name: 'Hard', size: 9, count: 8, fillRatio: 0.38 },
  { name: 'Expert', size: 10, count: 6, fillRatio: 0.32 },
];
const isAdj8 = (a, b) => Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && !(a[0] === b[0] && a[1] === b[1]);

let freshOk = 0, freshBad = 0;
let leakFound = 0, leakTotal = 0;
let rejectStillRejected = 0, rejectBroken = 0;
const leaks = [];

for (let i = 0; i < 30; i++) {
  let acc = 0, cfg = null;
  for (const t of TIERS) { if (i < acc + t.count) { cfg = { tier: t }; break; } acc += t.count; }
  const seed = (i + 1) * 1009 + 7;
  const puz = generatePuzzle(cfg.tier.size, cfg.tier.fillRatio, seed);
  const stored = puz.solution.map(([r, c]) => r * puz.size + c);
  const storedNum = new Int32Array(puz.size * puz.size);
  stored.forEach((cell, k) => { storedNum[cell] = k + 1; });

  // ---------- A) fresh board ----------
  g.call(`__T.start(${i})`); g.pump(2);
  const g0 = g.call('__T.grid()'); const h0 = g.call('__T.hints()');
  g.els['btn-hint'].click(); g.pump(3);
  const g1 = g.call('__T.grid()'); const h1 = g.call('__T.hints()');
  const changed = g0 !== g1, consumed = h1 < h0;
  if (changed && consumed && (h0 - h1) === 1) freshOk++;
  else { freshBad++; console.log('  A FAIL L' + (i + 1) + ' changed=' + changed + ' consumed=' + consumed + ' delta=' + (h0 - h1)); }

  // ---------- B) the defect state (deterministic) ----------
  const e = countSolutions(puz, { cap: 3, budgetMs: 20000 });
  if (e.sols.length < 2) continue;
  const rival = e.sols.find(s => JSON.stringify(s) !== JSON.stringify(stored));
  if (!rival) continue;

  g.call(`__T.start(${i})`); g.pump(2);
  g.call('__T.reset()'); g.pump(1);
  const half = Math.floor(rival.length / 2);
  const board = new Map();                       // cell -> number placed by the player
  for (let k = 0; k < half; k++) {
    const cell = rival[k], r = (cell / puz.size) | 0, c = cell % puz.size;
    if (puz.given[r][c] !== null) continue;
    g.call(`__T.place(${r},${c},${k + 1})`); g.pump(0);
    board.set(cell, k + 1);
  }
  // the board now holds givens + the rival prefix; find where each number lives
  const at = new Map();
  for (let r = 0; r < puz.size; r++) for (let c = 0; c < puz.size; c++) {
    const v = puz.given[r][c];
    if (v !== null && v !== undefined) at.set(v, [r, c]);
  }
  for (const [cell, v] of board) at.set(v, [(cell / puz.size) | 0, cell % puz.size]);

  // the hint's candidate list = empty, non-given cells, in row-major order
  const candidates = [];
  for (let r = 0; r < puz.size; r++) for (let c = 0; c < puz.size; c++) {
    if (puz.given[r][c] !== null) continue;
    if (board.has(r * puz.size + c)) continue;
    candidates.push([r, c]);
  }
  // find a candidate whose STORED number would be rejected by the auto-check
  let badIdx = -1;
  for (let k = 0; k < candidates.length; k++) {
    const [r, c] = candidates[k];
    const n = storedNum[r * puz.size + c];
    if (!n) continue;
    if (n > 1 && at.has(n - 1) && !isAdj8(at.get(n - 1), [r, c])) { badIdx = k; break; }
    if (n < puz.N && at.has(n + 1) && !isAdj8([r, c], at.get(n + 1))) { badIdx = k; break; }
    if (at.has(n)) { badIdx = k; break; }   // duplicate
  }
  if (badIdx < 0) continue;                   // no deterministic trigger on this level

  const hg0 = g.call('__T.grid()'); const hh0 = g.call('__T.hints()');
  g.call(`__T.pick(${badIdx}, ${candidates.length})`);
  g.els['btn-hint'].click(); g.pump(3);
  const hg1 = g.call('__T.grid()'); const hh1 = g.call('__T.hints()');
  const hintChanged = hg0 !== hg1, hintConsumed = hh1 < hh0;
  leakTotal++;
  if (hintConsumed && !hintChanged) { leakFound++; leaks.push('L' + (i + 1)); }

  // ---------- C) counter-case: the auto-check must STILL reject ----------
  g.call(`__T.start(${i})`); g.pump(2);
  g.call('__T.reset()'); g.pump(1);
  const p1 = puz.solution[0];
  let far = null;
  for (let r = 0; r < puz.size && !far; r++) for (let c = 0; c < puz.size && !far; c++) {
    if (puz.given[r][c] !== null) continue;
    if (Math.abs(r - p1[0]) <= 1 && Math.abs(c - p1[1]) <= 1) continue;
    far = [r, c];
  }
  if (far) {
    const before = g.call('__T.grid()');
    g.call(`__T.place(${far[0]},${far[1]},2)`); g.pump(0);
    const after = g.call('__T.grid()');
    if (before === after) rejectStillRejected++; else rejectBroken++;
  }
}

console.log('\n=== R337 HINT GATE [' + LABEL + '] ===');
console.log('A) fresh-board hint places + consumes exactly 1 : ' + freshOk + '/30 (bad ' + freshBad + ')');
console.log('B) hint consumed WITHOUT revealing (the defect) : ' + leakFound + '/' + leakTotal + ' -> ' + JSON.stringify(leaks));
console.log('C) auto-check still rejects an invalid placement: ' + rejectStillRejected + ' ok / ' + rejectBroken + ' broken');
const pass = freshBad === 0 && leakFound === 0 && rejectBroken === 0;
console.log('VERDICT: ' + (pass ? 'PASS' : 'FAIL'));
process.exit(pass ? 0 : 1);
