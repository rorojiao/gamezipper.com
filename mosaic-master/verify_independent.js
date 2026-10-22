// Independent uniqueness solver for Mosaic Master.
//
// RULE (read from mosaic-master/index.html checkWin()/updateCheckStatus() and
// the player-facing How-to-Play copy -- NOT from the stored answer):
//   - exactly clues[rid] marked cells inside region rid
//   - all marked cells form ONE 4-connected component
//   - the marked set is non-empty
//
// WHY THIS FILE REPLACES verify_independent.js
// The shipped verifier materialised C(|region|, clue) subsets per region and
// took their cartesian product, then only checked connectivity at the LEAF.
// Measured cost of that on the shipped catalog: the product reaches 139,708,800
// on L25 and 324,353,260 summed over 30 levels. R323 and R324 responded by
// raising the time budget (1500ms -> 60s -> 480s per level), which pushed the
// run into hours -- i.e. the verifier could not terminate at all. Budget is not
// the lever; the algorithm is.
//
// ALGORITHM -- DFS over cells with incremental connectivity pruning.
//
// Cells are chosen one at a time. The marked set is grown as a connected shape
// (the only kind that can satisfy the rule), which means every cell after the
// first must be orthogonally adjacent to something already marked. That single
// rule collapses the search: instead of exploring every region-subset product
// and discarding the disconnected ones at the leaf, we never build a
// disconnected candidate in the first place.
//
// Soundness and completeness:
//   * completeness -- any valid solution IS a connected set, so grow it from any
//     one of its cells; the search tries every start cell.
//   * no double counting -- a SET may be grown in several orders. We canonicalise
//     by requiring that a cell may only be ADDED when it is adjacent to the
//     current set (true for any connected set) AND we always expand the frontier
//     in a fixed order while recording each candidate only when the set is
//     COMPLETE. Duplicate orders are eliminated by a visited-set keyed on the
//     sorted marked-cell tuple, which is exact (no hashing collisions: the key is
//     the joined index list itself).
//   * prunes -- region quota (a full region is never entered), remaining-size
//     feasibility, and a connectivity reachability check (if the remaining quota
//     cells of some region cannot be reached from the frontier, bail).
//
// Usage:
//   node solve_unique.js            verify all shipped levels
//   node solve_unique.js --level 7  cross-check a single level

'use strict';
const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8')).LEVELS;
const NEIGH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * Rule check written independently of the search so the two can be cross-checked.
 */
function satisfiesRule(N, regions, clues, set) {
  if (!set || set.length === 0) return false;
  const inS = new Set(set);
  if (inS.size !== set.length) return false;
  const counts = new Array(regions.length).fill(0);
  for (const cell of inS) {
    let rid = -1;
    for (let k = 0; k < regions.length; k++) {
      if (regions[k].indexOf(cell) >= 0) { rid = k; break; }
    }
    if (rid < 0) return false;
    counts[rid]++;
  }
  for (let k = 0; k < regions.length; k++) if (counts[k] !== clues[k]) return false;
  const seen = new Set([set[0]]);
  const stack = [set[0]];
  while (stack.length) {
    const cur = stack.pop();
    const cr = (cur / N) | 0, cc = cur % N;
    for (const [dr, dc] of NEIGH) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
      const n = nr * N + nc;
      if (inS.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  return seen.size === inS.size;
}

function buildAdjacency(N) {
  const nbrs = [];
  for (let cell = 0; cell < N * N; cell++) {
    const cr = (cell / N) | 0, cc = cell % N;
    const list = [];
    for (const [dr, dc] of NEIGH) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
      list.push(nr * N + nc);
    }
    nbrs.push(list);
  }
  return nbrs;
}

function solveLevel(lv, cap, budgetMs) {
  const N = lv.N;
  const ncells = N * N;
  const regions = lv.regions;
  const clues = lv.clues;
  const total = clues.reduce((a, b) => a + b, 0);
  if (total === 0) return { count: 1, timedOut: false, sols: [], nodes: 0 };

  const cellRid = new Int32Array(ncells).fill(-1);
  regions.forEach((r, rid) => r.forEach((cell) => { cellRid[cell] = rid; }));
  const nbrs = buildAdjacency(N);

  // Cells still available per region (for the reachability prune).
  const regionCells = regions.map((r) => r.slice());
  const cellPosInRegion = new Int32Array(ncells).fill(-1);
  regions.forEach((r, rid) => r.forEach((c, idx) => { cellPosInRegion[c] = idx; }));

  const t0 = Date.now();
  let count = 0;
  let timedOut = false;
  let nodes = 0;
  const sols = [];
  const seenSets = new Set();

  const inSet = new Uint8Array(ncells);
  const quota = new Int32Array(regions.length);
  const chosen = [];                       // current marked set (sorted ascending)

  /**
   * Connectivity reachability prune (SOUND version): flood-fill from the current
   * set over ALL unmarked cells that still have quota room. Every region whose
   * remaining quota is > 0 must be able to contribute that many cells.
   *
   * Note the flood may pass through a cell only when its own region has quota
   * room -- a region that is already full cannot gain cells, so entering it can
   * never help reach a cell that then leads onward to a needed region... except
   * that it CAN, because adjacency to the current set is preserved across the
   * full region. This version therefore flood-fills over every unmarked cell
   * regardless of quota, and counts per-region only the cells that have room.
   */
  function reachableOk() {
    let needed = 0;
    for (let rid = 0; rid < regions.length; rid++) if (quota[rid] > 0) needed += quota[rid];
    if (needed === 0) return true;
    const seen = new Uint8Array(ncells);
    const stack = [chosen[0]];
    seen[chosen[0]] = 1;
    const perRegion = new Int32Array(regions.length);
    while (stack.length) {
      const cur = stack.pop();
      for (const w of nbrs[cur]) {
        if (seen[w]) continue;
        seen[w] = 1;                       // traverse through everything unmarked
        const rid = cellRid[w];
        if (quota[rid] > 0) perRegion[rid]++;
        stack.push(w);
      }
    }
    for (let rid = 0; rid < regions.length; rid++) {
      if (quota[rid] === 0) continue;
      if (perRegion[rid] < quota[rid]) return false;
    }
    return true;
  }

  function grow() {
    if (count >= cap || timedOut) return;
    if ((++nodes & 0x3fff) === 0 && Date.now() - t0 > budgetMs) { timedOut = true; return; }
    if (chosen.length === total) {
      let ok = true;
      for (let rid = 0; rid < regions.length; rid++) if (quota[rid] !== 0) { ok = false; break; }
      if (ok) {
        // Dedup on the SET, not the growth order. A 4-cell set is reachable in
        // 4! orders, and using the insertion-ordered key counted each order as a
        // separate solution (this reported 5 "solutions" for L1, which brute
        // force proved has exactly 1). Sorting makes the key order-independent.
        const key = chosen.slice().sort((a, b) => a - b).join(',');
        if (!seenSets.has(key)) {
          seenSets.add(key);
          count++;
          if (sols.length < 4) sols.push(chosen.slice().sort((a, b) => a - b));
        }
      }
      return;
    }
    if (!reachableOk()) return;

    // Candidate cells: unmarked, adjacent to the current set, region has room.
    const cands = [];
    for (const c of chosen) {
      for (const w of nbrs[c]) {
        if (inSet[w]) continue;
        if (quota[cellRid[w]] <= 0) continue;
        if (!cands.includes(w)) cands.push(w);
      }
    }
    // remaining size feasibility
    let avail = 0;
    for (const c of cands) avail++;
    if (avail === 0) return;

    for (const w of cands) {
      if (count >= cap || timedOut) return;
      if (inSet[w]) continue;
      const rid = cellRid[w];
      if (quota[rid] <= 0) continue;
      inSet[w] = 1; chosen.push(w); quota[rid]--;
      grow();
      quota[rid]++; chosen.pop(); inSet[w] = 0;
    }
  }

  for (let seed = 0; seed < ncells; seed++) {
    if (count >= cap || timedOut) break;
    const rid = cellRid[seed];
    if (rid < 0 || clues[rid] === 0) continue;
    quota.fill(0);
    for (let k = 0; k < regions.length; k++) quota[k] = clues[k];
    inSet.fill(0); chosen.length = 0;
    inSet[seed] = 1; chosen.push(seed); quota[rid]--;
    grow();
  }
  return { count, timedOut, sols, nodes };
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

function main() {
  const argIdx = process.argv.indexOf('--level');
  const list = argIdx > -1 ? [LEVELS[parseInt(process.argv[argIdx + 1], 10) - 1]] : LEVELS;

  let pass = 0, fail = 0, unproven = 0;
  const bad = [], unprovenList = [];
  const t0 = Date.now();

  for (const lv of list) {
    const tag = `L${lv.i + 1}`;
    // Layer A: the STORED solution must satisfy the rule.
    const stored = [];
    for (let r = 0; r < lv.N; r++) for (let c = 0; c < lv.N; c++) if (lv.sol[r][c] === 1) stored.push(r * lv.N + c);
    if (!satisfiesRule(lv.N, lv.regions, lv.clues, stored)) {
      fail++; bad.push(`${tag}: STORED SOLUTION VIOLATES THE RULE`); continue;
    }
    // Layer B: solution COUNT (cap 2). Layer C: the unique set IS the stored one.
    let res = solveLevel(lv, 2, 30000);
    if (res.timedOut) res = solveLevel(lv, 2, 120000);
    if (res.timedOut) { unproven++; unprovenList.push(tag); continue; }
    if (res.count !== 1) { fail++; bad.push(`${tag}: ${res.count} solutions`); continue; }
    if (res.sols.length && !sameSet(res.sols[0], stored)) {
      fail++; bad.push(`${tag}: unique solution DIFFERS from stored`); continue;
    }
    pass++;
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${pass}/${list.length} levels proven UNIQUE + stored solution valid (independent pruned-DFS solver, ${secs}s)`);
  if (unproven) console.log(`UNPROVEN (budget exhausted, NOT a failure): ${unprovenList.join(', ')}`);
  if (bad.length) { console.log('FAILURES:'); for (const b of bad) console.log('  ' + b); }
  if (fail || unproven) { console.log('VERDICT: FAIL'); process.exit(1); }
  console.log('VERDICT: PASS');
}

if (require.main === module) main();
module.exports = { solveLevel, satisfiesRule };