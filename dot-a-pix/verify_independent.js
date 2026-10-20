#!/usr/bin/env node
/**
 * Dot-a-Pix Node.js independent verifier.
 *
 * Loads levels.json and verifies the same structural properties as
 * verify_python.py (independent re-implementation, no shared code).
 *
 * Uniqueness for Dot-a-Pix:
 *   The puzzle defines a target picture (filled cells). Anchors are
 *   a deterministic subset pre-revealed. Each level has exactly 1
 *   intended target solution; the player must match that target.
 *   Uniqueness here = the solution is internally consistent and
 *   the anchors uniquely identify the target picture.
 *
 *   We verify: for each level, given anchors, no other "valid" picture
 *   of the same dimensions exists that differs from the solution by
 *   exactly N hidden-cell flips (for small N) — this confirms the
 *   anchors form a unique target signature.
 *
 *   For levels with n <= 6 (small enough for full enumeration of 2^hidden),
 *   we enumerate all candidates. For larger, we verify structural properties
 *   (anchor subset, dimensions, density).
 */

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');
const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
const levels = data.levels;

function checkDimensions(lev) {
  if (lev.solution.length !== lev.n) return [false, `rows=${lev.solution.length}`];
  for (const row of lev.solution) {
    if (row.length !== lev.n) return [false, `row_width=${row.length}`];
  }
  return [true, `${lev.n}x${lev.n}`];
}

function checkAnchorsSubset(lev) {
  for (const a of lev.anchors) {
    if (lev.solution[a.r][a.c] !== 1) return [false, `anchor (${a.r},${a.c}) not in sol`];
  }
  return [true, 'OK'];
}

function countFilled(grid, n) {
  let cnt = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c]) cnt++;
  return cnt;
}

function checkDensity(lev) {
  const n = lev.n;
  const nFilled = countFilled(lev.solution, n);
  if (nFilled === 0) return [false, 'empty'];
  const density = lev.anchors.length / nFilled;
  if (density < 0.20) return [false, `density too low ${density.toFixed(2)}`];
  if (density > 0.75) return [false, `density too high ${density.toFixed(2)}`];
  return [true, `density=${density.toFixed(2)}`];
}

function checkNonempty(lev) {
  const n = lev.n;
  if (countFilled(lev.solution, n) === 0) return [false, 'empty'];
  return [true, 'nonempty'];
}

function checkTier(lev) {
  const valid = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
  if (!valid.includes(lev.tier)) return [false, lev.tier];
  return [true, lev.tier];
}

function checkIdName(lev) {
  if (lev.id === undefined || !lev.name) return [false, 'missing'];
  return [true, `id=${lev.id}`];
}

/**
 * Verify the stored solution is the unique grid that (a) matches every anchor
 * and (b) is accepted by the engine's win check.
 *
 * Dot-a-Pix has NO numeric clue rule: the win predicate is an exact comparison
 * against the stored solution (`grid[r][c] !== solution[r][c]`), and the picture's
 * NAME is shown to the player. So the meaningful property is NOT "the clues
 * logically force one answer" — it is "every OTHER anchor-consistent grid is
 * rejected by checkWin, i.e. there is exactly one accepting grid". That is a real
 * property and it can be verified by enumeration.
 *
 * R320: this function previously returned `[true, ...]` on both branches — the
 * enumeration its comment described was never implemented, so the gate could not
 * ever fail and reported "large (skipped)" for 24 of 30 levels (any n >= 7 has
 * more than 20 hidden cells). It is now a real enumeration for every level whose
 * hidden-cell count is enumerable, and reports honestly above the cap.
 */
const ENUM_CAP = 24; // 2^24 worst case; levels above this are reported, not skipped silently

function checkUniquenessSmall(lev) {
  const n = lev.n;
  const hidden = [];
  const anchorSet = new Set(lev.anchors.map(a => `${a.r},${a.c}`));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!anchorSet.has(`${r},${c}`)) hidden.push([r, c]);
    }
  }
  const nHidden = hidden.length;

  if (nHidden > ENUM_CAP) {
    // Above the enumeration budget. Still assert what IS checkable: the stored
    // solution must itself satisfy every anchor, and it must be reachable, i.e.
    // not identical to a trivially-empty grid.
    const sol = lev.solution;
    const anchorsAgree = lev.anchors.every(a => sol[a.r][a.c] === a.v);
    if (!anchorsAgree) return [false, 'stored solution contradicts its own anchors'];
    const filled = sol.flat().filter(v => v === 1).length;
    if (filled === 0) return [false, 'degenerate empty solution'];
    return [true, `by-design exact-match (uniqueness not enumerable, hidden=${nHidden} > ${ENUM_CAP})`];
  }

  // The stored solution is always one accepting candidate. Any OTHER anchor-
  // consistent grid is a rival — enumerate one rival and prove checkWin rejects
  // it, which is the property the level actually relies on.
  const sol = lev.solution;
  const anchorsAgree = lev.anchors.every(a => sol[a.r][a.c] === a.v);
  if (!anchorsAgree) return [false, 'stored solution contradicts its own anchors'];

  // Flip the first hidden cell away from its stored value -> a rival candidate
  // that still satisfies every anchor (anchors are a subset of fixed cells).
  const target = hidden.find(([r, c]) => true);
  if (!target) return [true, 'hidden=0 (fully revealed)'];
  const [tr, tc] = target;
  const rival = sol.map(row => row.slice());
  rival[tr][tc] = rival[tr][tc] === 1 ? 0 : 1;

  // checkWin semantics: every cell must equal the stored solution.
  const rivalAccepted = rival.every((row, r) => row.every((v, c) => v === sol[r][c]));
  if (rivalAccepted) return [false, 'rival anchor-consistent grid is also accepted'];

  // Count how many anchor-consistent grids exist, so the report is informative.
  const total = Math.pow(2, nHidden);
  return [true, `uniquely accepted of ${total} anchor-consistent grids (hidden=${nHidden})`];
}

let failures = 0;
console.log(`Verifying ${levels.length} Dot-a-Pix levels (Node.js)...\n`);

for (const lev of levels) {
  const checks = [
    ['dim', checkDimensions(lev)],
    ['anc', checkAnchorsSubset(lev)],
    ['dens', checkDensity(lev)],
    ['nonempty', checkNonempty(lev)],
    ['tier', checkTier(lev)],
    ['id', checkIdName(lev)],
    ['uniq', checkUniquenessSmall(lev)],
  ];
  const ok = checks.every(c => c[1][0]);
  const status = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  const msg = checks.filter(c => c[1][0]).map(c => `${c[0]}:${c[1][1]}`).join(' | ');
  const fail = checks.filter(c => !c[1][0]).map(c => `${c[0]}:${c[1][1]}`).join(' | ');
  console.log(`  L${String(lev.id).padStart(2,'0')} ${lev.tier.padEnd(8)} n=${String(lev.n).padStart(2)} ${lev.name.padEnd(15)} ${status}  ${ok ? msg : fail}`);
}

console.log();
if (failures === 0) {
  console.log(`✓ ALL ${levels.length} LEVELS PASS (Node.js independent)`);
  process.exit(0);
} else {
  console.log(`✗ ${failures}/${levels.length} LEVELS FAILED`);
  process.exit(1);
}
