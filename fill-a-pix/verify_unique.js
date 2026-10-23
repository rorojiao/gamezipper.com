#!/usr/bin/env node
/* fill-a-pix independent solution counter — R332
 *
 * RULE (read from index.html computeClues L634-657, NOT from level key names):
 *   for every cell (r,c):  clue[r][c] == number of FILLED cells among its 8
 *   neighbours (self excluded: `if (dr===0 && dc===0) continue;`).
 *   The player's grid holds 0=unknown / 1=fill / 2=mark; win requires every cell
 *   non-zero AND grid value == (solution===1 ? 1 : 2)  -> a SOLUTION-COMPARE.
 *   Therefore "is the stored solution the only one?" is load-bearing.
 *
 * METHOD: row-major DFS over x[r][c] in {0,1}. After each assignment, prune when
 *   any clue cell has filled > clue, or filled + unassigned < clue.
 *   A clue of -1 is a WILDCARD (no constraint) and is skipped by the pruner.
 *
 * CALIBRATION (Pitfall #88 — a "0 defects" counter is unfalsifiable until it is
 *   checked against a reference a DIFFERENT implementation produced):
 *   BRUTE FORCE enumerates all 2^16 grids of a 4x4, computes each one's clue
 *   signature with the same rule, and counts solutions per signature. That count
 *   comes from exhaustive enumeration, not from the pruned search, so it is an
 *   independent adjudicator. The counter must agree on EVERY distinct signature.
 *   (A hand-built "known-ambiguous" control is NOT enough: my first attempt at
 *   one was itself wrong and reported a false failure — see the note at C4.)
 *
 * CONTROLS (a gate that cannot fail is not a gate — Pitfall #62/#86/#88):
 *   C1 validator: every grid the search emits is re-checked with a validator
 *      written independently from the source. exit 3 if the search emits garbage.
 *   C2 sensitivity: accumulate wildcard clues until the level goes multi-solution.
 *   C3 negative control: use clue+1 -> the stored solution must be REJECTED.
 *   C4 timeout is reported as UNPROVEN, never "unsolvable", and exits non-zero.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const code = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const m = code.match(/var LV = (\[[\s\S]*?\n\];)/);
if (!m) { console.error('FAIL: could not extract LV'); process.exit(2); }
const LV = eval('(' + m[1].replace(/;$/, '') + ')');

/* ---- independent validator, written from the rule text, not from the engine ---- */
function cluesOf(sol) {
  const rows = sol.length, cols = sol[0].length, out = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && sol[nr][nc] === 1) n++;
      }
      row.push(n);
    }
    out.push(row);
  }
  return out;
}
function valid(grid, clues) {
  if (!Array.isArray(grid) || !Array.isArray(grid[0])) return false;
  if (grid.length !== clues.length || grid[0].length !== clues[0].length) return false;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) {
    if (grid[r][c] !== 0 && grid[r][c] !== 1) return false;
  }
  const got = cluesOf(grid);
  for (let r = 0; r < clues.length; r++) for (let c = 0; c < clues[r].length; c++) {
    if (clues[r][c] < 0) continue;               // wildcard: unconstrained, not a mismatch
    if (got[r][c] !== clues[r][c]) return false;
  }
  return true;
}

/* ---- solver: count solutions with a cap and a wall-clock budget ---- */
function countSolutions(clues, limit, budgetMs) {
  const rows = clues.length, cols = clues[0].length, N = rows * cols;
  const x = new Int8Array(N);            // -1 unassigned, 0 empty, 1 filled
  const filledIn = new Int32Array(N);     // per clue-cell: assigned-filled neighbours
  const openNb = new Int32Array(N);       // per clue-cell: unassigned neighbours
  // neighbour lists (self excluded)
  const nbrs = [];
  for (let r = 0; r < rows; r++) { nbrs.push([]);
    for (let c = 0; c < cols; c++) {
      const l = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) l.push(nr * cols + nc);
      }
      nbrs[r * cols + c] = l;
    }
  }
  for (let i = 0; i < N; i++) openNb[i] = nbrs[i].length;
  const t0 = Date.now();
  let found = 0, timedOut = false, nodes = 0;

  function pruneOk() {
    for (let i = 0; i < N; i++) {
      const need = clues[Math.floor(i / cols)][i % cols];
      if (need < 0) continue;                       // wildcard: unconstrained
      if (filledIn[i] > need) return false;
      if (filledIn[i] + openNb[i] < need) return false;
    }
    return true;
  }
  // NOTE (R332 self-inflicted bug #1, caught by C1 not by reasoning): assign()
  // restores the accumulators itself when the prune fails. The first version let
  // dfs() ALSO call unassign() on that same attempt, decrementing openNb/filledIn
  // a second time. The search then "found" grids that violate the rule and the
  // independent validator rejected them. Exactly one owner per state change.
  function assign(idx, v) {
    x[idx] = v; nodes++;
    const touched = nbrs[idx];
    for (const t of touched) { if (v === 1) filledIn[t]++; openNb[t]--; }
    if (pruneOk()) return true;
    for (const t of touched) { if (v === 1) filledIn[t]--; openNb[t]++; }
    x[idx] = -1;
    return false;
  }
  function unassign(idx, v) {
    for (const t of nbrs[idx]) { if (v === 1) filledIn[t]--; openNb[t]++; }
    x[idx] = -1;
  }
  function dfs(pos) {
    if (found >= limit) return;
    if (Date.now() - t0 > budgetMs) { timedOut = true; return; }
    if (pos === N) {
      // independent validator: if the search emits a grid the validator rejects,
      // the SOLVER is wrong, not the data.
      const g = [];
      for (let r = 0; r < rows; r++) { const row = [];
        for (let c = 0; c < cols; c++) row.push(x[r * cols + c]); g.push(row); }
      if (!valid(g, clues)) { console.error('FATAL: search emitted an INVALID grid (solver bug)'); process.exit(3); }
      found++; return;
    }
    for (const v of (pos === 0 ? [1, 0] : [0, 1])) {   // try filled-first on the first cell for speed
      // Only the SUCCESSFUL branch owns the undo. Calling unassign() after a
      // failed assign() double-restored the accumulators (see assign() note).
      if (assign(pos, v)) {
        dfs(pos + 1);
        unassign(pos, v);
      }
      if (found >= limit || timedOut) return;
    }
  }
  dfs(0);
  return { count: found, timedOut, nodes, ms: Date.now() - t0 };
}

/* ================= BRUTE-FORCE REFERENCE (independent adjudicator) =================
 * Pitfall #88 in action: my first calibration was a HAND-BUILT "known ambiguous
 * 2x2 with all clues = 1". I asserted it must have >=2 solutions; it reported 0,
 * and I initially read that as "the counter is blind". Checking the arithmetic:
 * in a 2x2, clue(0,0) counts filled neighbours among {(0,1),(1,0),(1,1)}. With
 * all four clues = 1, exactly-one-fill satisfies it, but so do grids where each
 * cell sees exactly one fill — which for a 2x2 is only the 4 single-fill grids
 * AND... the solver said 0, so my arithmetic was wrong somewhere. Rather than
 * debug a hand-made example by hand, enumerate ALL of them: 2^4 = 16 grids,
 * group by clue signature, and use THAT as the reference. A control that is
 * itself generated by exhaustive enumeration cannot be mis-specified.
 */
function bruteForceReference(R, C) {
  const N = R * C, sig = new Map();
  for (let mask = 0; mask < (1 << N); mask++) {
    const g = [];
    for (let r = 0; r < R; r++) { const row = [];
      for (let c = 0; c < C; c++) row.push((mask >> (r * C + c)) & 1); g.push(row); }
    const k = JSON.stringify(cluesOf(g));
    sig.set(k, (sig.get(k) || 0) + 1);
  }
  return sig;
}

console.log('=== CALIBRATION vs exhaustive brute force (4x4 = 65536 grids enumerated) ===');
let calibOK = false, calibChecked = 0, calibAgree = 0;
const calibFail = [];
{
  const ref = bruteForceReference(4, 4);
  let multiSigs = 0, maxCount = 0;
  for (const [k, trueCount] of ref) {
    const clues = JSON.parse(k);
    const res = countSolutions(clues, trueCount + 1, 20000);
    if (res.timedOut) { calibFail.push('TIMEOUT on sig ' + k.slice(0, 50)); continue; }
    calibChecked++;
    if (res.count === trueCount) calibAgree++;
    else calibFail.push('ref=' + trueCount + ' counter=' + res.count + ' sig=' + k.slice(0, 70));
    if (trueCount >= 2) multiSigs++;
    if (trueCount > maxCount) maxCount = trueCount;
  }
  console.log('distinct clue signatures : ' + ref.size);
  console.log('signatures with >=2 sols : ' + multiSigs + '  (max solution count seen: ' + maxCount + ')');
  console.log('calibrated signatures    : ' + calibChecked + '   agree: ' + calibAgree + '   disagree: ' + calibFail.length);
  if (calibFail.length) { console.log('DISAGREEMENTS:'); calibFail.slice(0, 8).forEach(f => console.log('  ' + f)); }
  calibOK = calibFail.length === 0 && calibAgree > 0 && multiSigs > 0;
  console.log(calibOK
    ? '  -> CALIBRATED: counter matches exhaustive enumeration on every signature,'
      + ' including ' + multiSigs + ' multi-solution ones (it CAN report >1).'
    : '  -> *** NOT CALIBRATED — uniqueness results below are VOID ***');
}

/* ============================ REAL CATALOG ============================ */
const LIMIT = 2, BUDGET = 90000;
const multi = [], unproven = [], badStored = [];
let unique = 0;

LV.forEach((lvl, i) => {
  const sol = lvl.grid, clues = cluesOf(sol);
  // C0: stored solution must itself satisfy the rule
  if (!valid(sol, clues)) { badStored.push(i + 1); }
  const res = countSolutions(clues, LIMIT, BUDGET);
  const tag = 'L' + (i + 1) + ' ' + lvl.name + ' ' + sol.length + 'x' + sol[0].length;
  if (res.timedOut) { unproven.push(tag); console.log(tag + '  UNPROVEN (timeout ' + res.ms + 'ms, nodes=' + res.nodes + ')'); }
  else if (res.count >= 2) { multi.push(tag); console.log(tag + '  MULTI-SOLUTION (' + res.count + '+)'); }
  else if (res.count === 0) { console.log(tag + '  *** ZERO SOLUTIONS — UNSOLVABLE ***'); badStored.push(i + 1); }
  else { unique++; console.log(tag + '  unique (' + res.nodes + ' nodes, ' + res.ms + 'ms)'); }
});

console.log('\n=== SUMMARY ===');
console.log('levels            : ' + LV.length);
console.log('unique            : ' + unique);
console.log('multi-solution    : ' + multi.length + (multi.length ? ' -> ' + multi.join(' | ') : ''));
console.log('unproven(timeout) : ' + unproven.length + (unproven.length ? ' -> ' + unproven.join(' | ') : ''));
console.log('bad/zero-solution : ' + badStored.length + (badStored.length ? ' -> ' + badStored.join(',') : ''));

/* ---- C2 SENSITIVITY: ACCUMULATE wildcard clues until the level goes
 * multi-solution. The counter must eventually open up. v1 restored the clue
 * after each trial, so it only ever tested ONE-clue-removal and reported
 * "still unique" on all 5 levels — a test that could not fail (Pitfall #62). ---- */
console.log('\n=== C2 SENSITIVITY (accumulate wildcard clues until multi-solution) ===');
let sensOpens = 0;
for (const i of [0, 6, 12, 18, 24]) {
  if (i >= LV.length) continue;
  const sol = LV[i].grid, full = cluesOf(sol);
  const rows = full.length, cols = full[0].length;
  const cur = full.map(r => r.slice());
  let wild = 0, opened = false;
  for (let k = 0; k < rows * cols && !opened; k++) {
    cur[Math.floor(k / cols)][k % cols] = -1;    // accumulate, never restore
    wild++;
    const res = countSolutions(cur, LIMIT, 15000);
    if (res.timedOut) continue;
    if (res.count >= 2) opened = true;
  }
  if (opened) sensOpens++;
  console.log('L' + (i + 1) + ' ' + LV[i].name + ' ' + rows + 'x' + cols + ': '
    + (opened ? 'went multi-solution after wildcarding ' + wild + ' clue(s) -> SENSITIVITY OK'
              : 'STILL UNIQUE with ' + wild + '/' + (rows * cols) + ' clues wildcarded -> *** SUSPECT ***'));
}

/* ---- C3 negative control: a wrong clue must REJECT the stored solution ---- */
console.log('\n=== C3 NEGATIVE CONTROL (corrupt one clue -> stored solution must be rejected) ===');
let c3ok = false;
{
  const sol = LV[0].grid, clues = cluesOf(sol).map(r => r.slice());
  const good = valid(sol, clues);
  clues[0][0] = clues[0][0] + 1;
  const rejected = !valid(sol, clues);
  c3ok = good && rejected;
  console.log('unmodified L1 valid=' + good + ' | corrupted L1 rejected=' + rejected
    + (c3ok ? '  -> CONTROL OK' : '  -> *** CONTROL FAILED ***'));
}

const verdictOK = badStored.length === 0;
console.log('\nVERDICT: ' + (multi.length || badStored.length
  ? 'FAIL (multi=' + multi.length + ' bad=' + badStored.length + ')'
  : unproven.length ? 'INCOMPLETE (unproven=' + unproven.length + ')'
  : 'PASS (' + unique + '/' + LV.length + ' levels proven unique)'));
console.log('CONTROLS: calibration-vs-bruteforce=' + (calibOK ? 'PASS' : 'FAIL')
  + ' C3(corrupt-clue-rejected)=' + (c3ok ? 'PASS' : 'FAIL')
  + ' C2(sensitivity-opens)=' + sensOpens + '/5');

// A gate that cannot fail is not a gate.
process.exit(badStored.length === 0 && multi.length === 0 && unproven.length === 0
  && calibOK && c3ok && sensOpens > 0 ? 0 : 1);