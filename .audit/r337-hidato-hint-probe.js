#!/usr/bin/env node
/**
 * R337 — Hidato HINT probe (real engine, real button).
 *
 * WHY: hidato's hint() does:
 *     const idx = State.puzzle.solution.findIndex(([sr,sc]) => sr===r && sc===c);
 *     placeNumber(r, c, idx+1);
 * i.e. it reveals the number the STORED solution puts at that cell.
 *
 * checkWin() is RULE-BASED (any valid 8-adjacent chain wins), so a rival
 * solution is legal. But if a rival solution exists, the hint can reveal a
 * number that CONFLICTS with the player's (also-legal) rival chain:
 *   - placeNumber() has an autocheck branch that REJECTS a placement which
 *     is not adjacent to n-1 / n+1, and REJECTS a duplicate n.
 *   - so the hint can be CONSUMED (State.hints--) WITHOUT placing anything,
 *     or can place a number that actively breaks the player's rival chain.
 *
 * This probe measures, on the real engine:
 *   A) does a hint always place a number? (count placements vs clicks)
 *   B) does a hint ever place a number the engine's own autocheck rejects?
 *   C) does clicking the hint button consume a hint without revealing?
 *
 * It also verifies the SOLVER's rival-path hypothesis end-to-end: build a
 * RIVAL valid chain (different from the stored solution), place it, and
 * confirm checkWin() accepts it -> proving the win predicate is rule-based
 * and that the FAQ's "exactly one solution path" claim is false in-game.
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const g = bootGame('hidato', {
  inject: {
    anchor: 'function loadLevel(',
    exports: `/* R337 hint probe: expose the pieces we need to observe the
       hint path without touching the engine's behaviour. */
      (function(){ const o = document.createElement.bind(document); document.createElement = (t) => { const el = o(t); if (el) { if (!el.cloneNode) el.cloneNode = function(){ return el; }; } return el; };
        const pk = document.getElementById('picker'); if (pk) Object.defineProperty(pk, 'firstChild', { get: function(){ return (this.children || []).length ? this.children[0] : null; } }); })();
      globalThis.__T = {
        n: () => TOTAL_LEVELS,
        start: (i) => loadLevel(i, false),
        sol: () => JSON.stringify(State.puzzle.solution),
        given: () => JSON.stringify(State.puzzle.given),
        size: () => State.puzzle.size,
        cs: () => cellSize,
        won: () => State.won,
        hints: () => State.hints,
        grid: () => JSON.stringify(State.grid2d),
        place: (r,c,v) => { placeNumber(r,c,v); return true; },
        checkWin: () => checkWin(),
        findNumber: (v) => JSON.stringify(findNumber(v)),
        toast: () => (document.getElementById('toast')||{}).textContent || '',
      };`,
  },
});

const cv = g.els['cv'] || g.els['board'];
if (!cv) { console.log(JSON.stringify({ verdict: 'FAIL', reason: 'no canvas' })); process.exit(1); }
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });

const out = { levels: [], summary: {} };
const N = g.call('__T.n()');

for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const size = g.call('__T.size()');
  const sol = JSON.parse(g.call('__T.sol()'));
  const given = JSON.parse(g.call('__T.given()'));
  const cs = g.call('__T.cs()');

  // ---- A/B: click the real hint button once and see whether a number lands
  const before = JSON.parse(g.call('__T.grid()'));
  const hintsBefore = g.call('__T.hints()');
  const btn = g.els['btn-hint'];
  let hintPlaced = false, hintRejected = false, toastMsg = '';
  if (btn) {
    btn.click();
    g.pump(3);
    const after = JSON.parse(g.call('__T.grid()'));
    hintPlaced = JSON.stringify(before) !== JSON.stringify(after);
    const hintsAfter = g.call('__T.hints()');
    toastMsg = String(g.call('__T.toast()') || '');
    hintRejected = !hintPlaced && hintsAfter < hintsBefore;
  }

  // ---- C: is the win predicate rule-based? Build a RIVAL chain and check
  //    whether the engine accepts a chain that is NOT the stored solution.
  //    Strategy: shift the stored path's numbering by one position where the
  //    adjacency still holds — for a serpentine/spiral path that is generally
  //    not valid, so instead we simply verify the RULE-BASED nature directly:
  //    re-place the whole board with the stored solution values (that must
  //    win), then test a hand-built 2x2-style rival in a tiny grid.
  //    For the rule-based proof we rely on checkWin()'s source: it never
  //    compares against State.puzzle.solution. Verify that by reading the
  //    function's behaviour: replace the board with a permutation that keeps
  //    8-adjacency but differs from the stored path.

  // Build a rival: for a serpentine path, reversing the direction of a
  // 2x2 corner block yields another valid 8-adjacent chain in most cases.
  // Simpler and fully general: use the engine's own generator to make a
  // DIFFERENT path (different variant seed) and place THAT instead.
  let rivalAccepted = null, rivalDiffers = null;
  try {
    const rivalPath = g.call(`(function(){
      /* build a rival Hamiltonian path on the same grid: a different serpentine
         orientation than the stored one */
      var size = ${size};
      var path = [];
      for (var c = 0; c < size; c++) {
        if (c % 2 === 0) { for (var r = 0; r < size; r++) path.push([r,c]); }
        else { for (var r = size-1; r >= 0; r--) path.push([r,c]); }
      }
      return JSON.stringify(path);
    })()`);
    const rp = JSON.parse(rivalPath);
    const stored = sol.map(([r,c]) => r*size+c);
    const rival = rp.map(([r,c]) => r*size+c);
    rivalDiffers = JSON.stringify(stored) !== JSON.stringify(rival);
    // only meaningful if the rival agrees with the givens
    let agrees = true;
    for (let k = 0; k < rp.length; k++) {
      const [r,c] = rp[k];
      const gv = given[r][c];
      if (gv !== null && gv !== undefined && gv !== k+1) { agrees = false; break; }
    }
    if (agrees && rivalDiffers) {
      // reset the board to givens and place the rival
      g.call(`(function(){ State.grid2d = State.puzzle.given.map(function(r){return r.slice();}); State.won=false; })()`);
      let placed = 0, rejected = 0;
      for (let k = 0; k < rp.length; k++) {
        const [r,c] = rp[k];
        if (given[r][c] !== null) continue;
        g.call(`__T.place(${r},${c},${k+1})`);
        g.pump(0);
        const gg = JSON.parse(g.call('__T.grid()'));
        if (gg[r][c] === k+1) placed++; else rejected++;
      }
      rivalAccepted = g.call('__T.checkWin()') === true;
      out.levels.push({ L: i+1, size, hintPlaced, hintRejected, toastMsg, rivalDiffers, rivalPlaced: placed, rivalRejected: rejected, rivalAccepted });
    } else {
      out.levels.push({ L: i+1, size, hintPlaced, hintRejected, toastMsg, rivalDiffers, rivalAccepted: 'n/a (rival agrees with givens? ' + agrees + ')' });
    }
  } catch (e) {
    out.levels.push({ L: i+1, size, hintPlaced, hintRejected, toastMsg, rivalError: String(e && e.message) });
  }
}

const hintFail = out.levels.filter(l => l.hintRejected);
const hintNoPlace = out.levels.filter(l => l.hintPlaced === false);
const rivals = out.levels.filter(l => l.rivalAccepted === true);
const rivalsDiff = out.levels.filter(l => l.rivalAccepted === true && l.rivalDiffers === true);
out.summary = {
  levels: N,
  hintRejected: hintFail.length,
  hintPlaced: out.levels.filter(l => l.hintPlaced).length,
  hintNoPlace: hintNoPlace.length,
  rivalAcceptedCount: rivals.length,
  rivalAcceptedAndDiffers: rivalsDiff.length,
};
console.log(JSON.stringify(out.summary));
console.log('hint problems:', JSON.stringify(hintFail.map(l => ({L:l.L, toast:l.toastMsg}))));
console.log('rival-accepted levels:', JSON.stringify(rivals.map(l => l.L)));
console.log(JSON.stringify(out, null, 1).slice(0, 6000));
