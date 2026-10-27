#!/usr/bin/env node
/**
 * R337 — DECISIVE Hidato test (uses the shared, CALIBRATED counter).
 *
 * QUESTIONS:
 *  Q1 (gameplay): is checkWin() rule-based (any valid 8-adjacent chain wins)
 *      or a solution-compare (only the STORED path wins)?
 *        - rule-based      -> a rival path is a legitimate win; the game is
 *                            FINE and only the COPY claim is wrong (Toichika
 *                            pattern, Pitfall #51).
 *        - solution-compare -> a rival path permanently marks a correct player
 *                            WRONG -> P0 (Pitfall #59).
 *  Q2 (UX): the hint reveals the STORED solution's number for a random empty
 *      cell. On a MULTI-solution level a player may legitimately be on a
 *      rival chain; the stored number can then be REJECTED by placeNumber()'s
 *      autocheck (not adjacent to n-1/n+1) or be a DUPLICATE of a number the
 *      player already placed. Does the hint still get CONSUMED (State.hints--)
 *      even though nothing was revealed?
 *
 * CALIBRATION (mandatory):
 *  - POSITIVE: the stored solution, placed through the REAL input path,
 *    must win (checkWin()===true). If it does not, the harness is wrong.
 *  - NEGATIVE: a rival that is INVALID under the engine's own rule must NOT
 *    win (proves the probe can say "no").
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const fs = require('fs');
const path = require('path');
const { loadEngine, countSolutions, calibrate, validate } = require('./r337-hidato-counter.js');

const ROOT = path.resolve(__dirname, '..');
const generatePuzzle = loadEngine();

console.log('=== CALIBRATION ===');
const cal = calibrate(generatePuzzle);
for (const c of cal.checks) console.log('  ' + (c.ok ? 'PASS' : 'FAIL') + '  ' + c.name + (c.info ? '  (' + c.info + ')' : ''));
if (!cal.pass) { console.log('ABORT'); process.exit(3); }

const TIERS = [
  { name: 'Easy', size: 5, count: 8, fillRatio: 0.55 },
  { name: 'Medium', size: 7, count: 8, fillRatio: 0.45 },
  { name: 'Hard', size: 9, count: 8, fillRatio: 0.38 },
  { name: 'Expert', size: 10, count: 6, fillRatio: 0.32 },
];

const g = bootGame('hidato', {
  inject: {
    anchor: 'function loadLevel(',
    exports: `/* R337 decisive probe */
      (function(){ const o = document.createElement.bind(document); document.createElement = (t) => { const el = o(t); if (el) { if (!el.cloneNode) el.cloneNode = function(){ return el; }; } return el; };
        const pk = document.getElementById('picker'); if (pk) Object.defineProperty(pk, 'firstChild', { get: function(){ return (this.children || []).length ? this.children[0] : null; } }); })();
      globalThis.__T = {
        start: (i) => loadLevel(i, false),
        sol: () => JSON.stringify(State.puzzle.solution),
        given: () => JSON.stringify(State.puzzle.given),
        size: () => State.puzzle.size,
        won: () => State.won,
        hints: () => State.hints,
        grid: () => JSON.stringify(State.grid2d),
        place: (r,c,v) => { placeNumber(r,c,v); return true; },
        checkWin: () => checkWin(),
        reset: () => { State.grid2d = State.puzzle.given.map(function(r){return r.slice();}); State.won=false; State.history=[]; State.hints=3; State.hintsTotal=3; },
        toast: () => (document.getElementById('toast')||{}).textContent || '',
      };`,
  },
});

function placePath(puz, cells, label) {
  g.call('__T.reset()'); g.pump(1);
  let placed = 0, rejected = 0;
  for (let k = 0; k < cells.length; k++) {
    const cell = cells[k], r = (cell / puz.size) | 0, c = cell % puz.size;
    if (puz.given[r][c] !== null) continue;
    const before = JSON.parse(g.call('__T.grid()'));
    g.call(`__T.place(${r},${c},${k + 1})`); g.pump(0);
    const after = JSON.parse(g.call('__T.grid()'));
    if (after[r][c] === k + 1) placed++; else rejected++;
  }
  g.pump(2);
  return { placed, rejected, wins: g.call('__T.checkWin()') === true };
}

const results = [];
const posOK = [], rivalWin = [], hintBad = [];

for (let i = 0; i < 30; i++) {
  let acc = 0, cfg = null;
  for (const t of TIERS) { if (i < acc + t.count) { cfg = { tier: t }; break; } acc += t.count; }
  const seed = (i + 1) * 1009 + 7;
  const puz = generatePuzzle(cfg.tier.size, cfg.tier.fillRatio, seed);
  const stored = puz.solution.map(([r, c]) => r * puz.size + c);
  const e = countSolutions(puz, { cap: 3, budgetMs: 25000 });

  const rec = { L: i + 1, tier: cfg.tier.name, size: puz.size, solsFound: e.sols.length, timedOut: e.timedOut };

  if (!e.sols.length) { rec.note = e.timedOut ? 'UNPROVEN' : 'no second solution found'; results.push(rec); continue; }

  // ---- POSITIVE CONTROL: the stored solution must win through the real path
  g.call(`__T.start(${i})`); g.pump(2);
  const pos = placePath(puz, stored, 'stored');
  rec.storedPlaced = pos.placed; rec.storedRejected = pos.rejected; rec.storedWins = pos.wins;
  if (pos.wins) posOK.push(i + 1);

  // ---- Q1: pick a VALID rival (validated by the independent validator)
  const rival = e.sols.find(s => JSON.stringify(s) !== JSON.stringify(stored) && validate(puz, s) === null);
  if (!rival) { rec.note = 'no distinct valid rival'; results.push(rec); continue; }
  rec.rivalExists = true;

  g.call(`__T.start(${i})`); g.pump(2);
  const rv = placePath(puz, rival, 'rival');
  rec.rivalPlaced = rv.placed; rec.rivalRejected = rv.rejected; rec.rivalWins = rv.wins;
  if (rv.wins) rivalWin.push(i + 1);

  // ---- Q2: hint on a rival chain
  {
    const hBefore = g.call('__T.hints()');
    const gBefore = g.call('__T.grid()');
    const btn = g.els['btn-hint'];
    if (btn) {
      btn.click(); g.pump(3);
      const hAfter = g.call('__T.hints()');
      const gAfter = g.call('__T.grid()');
      rec.hintChangedBoard = gBefore !== gAfter;
      rec.hintConsumed = hAfter < hBefore;
      rec.hintConsumedWithoutReveal = rec.hintConsumed && !rec.hintChangedBoard;
      rec.hintToast = String(g.call('__T.toast()') || '').slice(0, 60);
      if (rec.hintConsumedWithoutReveal) hintBad.push(i + 1);
    }
  }

  // ---- Q2b: hint on a PARTIAL rival chain (a realistic mid-solve moment)
  {
    g.call(`__T.start(${i})`); g.pump(2);
    g.call('__T.reset()'); g.pump(1);
    const half = Math.floor(rival.length / 2);
    for (let k = 0; k < half; k++) {
      const cell = rival[k], r = (cell / puz.size) | 0, c = cell % puz.size;
      if (puz.given[r][c] !== null) continue;
      g.call(`__T.place(${r},${c},${k + 1})`); g.pump(0);
    }
    const hBefore = g.call('__T.hints()');
    const gBefore = g.call('__T.grid()');
    const btn = g.els['btn-hint'];
    if (btn) {
      btn.click(); g.pump(3);
      const hAfter = g.call('__T.hints()');
      const gAfter = g.call('__T.grid()');
      rec.partialHintChangedBoard = gBefore !== gAfter;
      rec.partialHintConsumed = hAfter < hBefore;
      rec.partialHintConsumedWithoutReveal = rec.partialHintConsumed && !rec.partialHintChangedBoard;
      rec.partialHintToast = String(g.call('__T.toast()') || '').slice(0, 60);
      if (rec.partialHintConsumedWithoutReveal) hintBad.push('L' + (i + 1) + '/partial');
    }
  }

  results.push(rec);
  console.log('L' + String(i + 1).padStart(2) + ' ' + cfg.tier.name.padEnd(8) + puz.size + 'x' + puz.size +
    ' | storedWins=' + rec.storedWins + ' | rivalWins=' + rec.rivalWins +
    ' (placed ' + rec.rivalPlaced + ', rejected ' + rec.rivalRejected + ')' +
    ' | hintConsumedNoReveal=' + rec.hintConsumedWithoutReveal);
}

console.log('\n=== SUMMARY ===');
console.log('POSITIVE control (stored solution wins)      : ' + posOK.length + '/30');
console.log('RIVAL solution ACCEPTED by checkWin()        : ' + rivalWin.length + ' levels -> ' + JSON.stringify(rivalWin));
console.log('=> win predicate is ' + (rivalWin.length
  ? 'RULE-BASED (Toichika pattern, Pitfall #51) — a rival path is a legitimate WIN, so gameplay is FINE and only the COPY claim is wrong'
  : 'a SOLUTION-COMPARE — a rival path permanently marks a correct player WRONG (P0)'));
console.log('hint consumed WITHOUT revealing              : ' + hintBad.length + ' -> ' + JSON.stringify(hintBad));
fs.writeFileSync(path.join(ROOT, '.audit/r337-hidato-decisive.json'), JSON.stringify({ results, posOK, rivalWin, hintBad }, null, 1));
console.log('WROTE .audit/r337-hidato-decisive.json');
