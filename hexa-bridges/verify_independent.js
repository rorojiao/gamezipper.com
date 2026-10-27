#!/usr/bin/env node
/*
 * Hexa-Bridges independent verifier (R338 rewrite).
 *
 * WHY THIS FILE WAS REWRITTEN (2026-10-27): the previous version enumerated
 * spanning-tree edge sets with a 30s-per-level wall-clock budget and reported
 * "expected exactly 1 solution, got 0" whenever the budget ran out. That is
 * the R323 Pitfall #70 shape: a counting gate that returns a bare integer
 * CANNOT distinguish "search timed out" from "no solution exists", so it
 * fails hardest on exactly the tightest (i.e. best) levels. Measured on the
 * shipped 5x4 catalog: 3 of 12 Expert/Hard levels exhausted the 30s budget
 * and were reported as UNSOLVABLE, and the whole script never terminated
 * (EXIT=124) — a P1 test-gate defect, since the gate could not complete
 * inside a sweep at all.
 *
 * THIS version:
 *   1. enumerates spanning trees by PARENT ASSIGNMENT, which generates every
 *      tree exactly once (a rooted tree's parent function is unique) instead
 *      of enumerating all C(edges, n-1) edge subsets;
 *   2. prunes with the degree constraints read from the engine, plus a
 *      "can this anchor still reach its clue?" feasibility bound;
 *   3. returns a TRI-STATE {count, exhausted} — "exhausted" (budget spent)
 *      is reported separately from 0 solutions, and any unproven level makes
 *      the script exit NON-ZERO (a gate that cannot fail is not a gate);
 *   4. keeps the SAME rule semantics as the shipped engine (checkWin):
 *        - each anchor cell has EXACTLY the stated number of bridges;
 *        - each non-anchor cell has 0, 1 or 2 bridges;
 *        - all bridges form a single connected tree (no loops).
 *
 * Rules are read from the shipped engine, never from the level key names.
 *
 * Usage: node verify_independent.js [path/to/levels.json]
 * Exit 0 = PASS, 1 = FAIL, 2 = setup error, 3 = indeterminate (not proven).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const FILE = process.argv[2] || path.join(__dirname, 'levels.json');

/* hex-grid neighbours in axial coordinates (q,r) — same table as the engine */
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function buildGrid(Q, R) {
  const idx = new Map();
  const cells = [];
  for (let q = 0; q < Q; q++) {
    for (let r = 0; r < R; r++) {
      idx.set(q + ',' + r, cells.length);
      cells.push([q, r]);
    }
  }
  const nbrs = Array.from({ length: cells.length }, () => []);
  for (let q = 0; q < Q; q++) {
    for (let r = 0; r < R; r++) {
      const me = idx.get(q + ',' + r);
      for (const [dq, dr] of DIRS) {
        const nq = q + dq, nr = r + dr;
        if (nq < 0 || nq >= Q || nr < 0 || nr >= R) continue;
        nbrs[me].push(idx.get(nq + ',' + nr));
      }
    }
  }
  return { cells, idx, nbrs };
}

/**
 * Count spanning trees satisfying the engine's rules.
 *
 * ALGORITHM — parent assignment:
 *   root = cell 0. Every other cell v picks exactly one PARENT among its
 *   neighbours. A parent assignment with no cycle is automatically a
 *   spanning tree (n-1 edges, acyclic, all vertices reachable from the root
 *   because every non-root has a parent chain that must terminate at the
 *   root). Each rooted tree is produced EXACTLY ONCE, because a tree's
 *   parent function is unique.
 *
 * PRUNES:
 *   P1 CYCLE: parent[v] must be in a different union-find component than v
 *      (otherwise the edge closes a cycle).
 *   P2 DEGREE CAP: an anchor may not exceed its clue; a non-anchor may not
 *      exceed 2.
 *   P3 FEASIBILITY: an anchor that still needs `k` more bridges must have at
 *      least k remaining incident edges available, else the branch is dead.
 *
 * Returns {count, exhausted}. `exhausted` means the node budget ran out
 * before the space was fully explored — NOT "no solution".
 */
function countSolutions(Q, R, anchors, maxSols, nodeBudget) {
  const { cells, idx, nbrs } = buildGrid(Q, R);
  const n = cells.length;
  const ROOT = 0;

  // max degree per cell: anchor -> exact clue, non-anchor -> 2
  const maxDeg = new Array(n).fill(2);
  const isAnchor = new Array(n).fill(false);
  for (const key of Object.keys(anchors)) {
    const c = idx.get(key);
    if (c === undefined) return { count: 0, exhausted: false, error: 'anchor ' + key + ' is not a cell' };
    isAnchor[c] = true;
    maxDeg[c] = anchors[key];
  }

  // Process order: anchors first (their degree is the tightest constraint),
  // then the rest. Root is processed last (it never gets a parent).
  const order = [];
  for (let c = 0; c < n; c++) if (c !== ROOT && isAnchor[c]) order.push(c);
  for (let c = 0; c < n; c++) if (c !== ROOT && !isAnchor[c]) order.push(c);

  const deg = new Array(n).fill(0);
  const parentUF = new Int32Array(n);
  for (let i = 0; i < n; i++) parentUF[i] = i;
  function find(x) { while (parentUF[x] !== x) { parentUF[x] = parentUF[parentUF[x]]; x = parentUF[x]; } return x; }

  const assigned = new Array(n).fill(false);
  let count = 0;
  let nodes = 0;
  let exhausted = false;

  // feasibility: for every anchor, can it still reach its clue?
  function feasible() {
    for (let c = 0; c < n; c++) {
      if (!isAnchor[c]) continue;
      const need = maxDeg[c] - deg[c];
      if (need <= 0) continue;
      let avail = 0;
      for (const u of nbrs[c]) {
        if (!assigned[u]) avail++;        // u may still pick c as its parent
        else if (deg[u] < maxDeg[u] && !assigned[c]) avail++;  // c may still pick u
      }
      if (avail < need) return false;
    }
    return true;
  }

  function step(k) {
    if (count >= maxSols) return;
    if (++nodes > nodeBudget) { exhausted = true; return; }
    if (k === order.length) {
      // every non-root has a parent; the forest is acyclic by construction
      if (!feasible()) return;
      for (let c = 0; c < n; c++) {
        if (isAnchor[c]) { if (deg[c] !== maxDeg[c]) return; }
        else if (deg[c] > 2) return;
      }
      count++;
      return;
    }
    const v = order[k];
    if (!feasible()) return;
    for (const p of nbrs[v]) {
      if (deg[v] >= maxDeg[v]) break;                 // v is full -> no parent fits
      if (deg[p] >= maxDeg[p]) continue;
      const rv = find(v), rp = find(p);
      if (rv === rp) continue;                         // P1 cycle
      deg[v]++; deg[p]++;
      parentUF[rv] = rp;
      assigned[v] = true;
      step(k + 1);
      assigned[v] = false;
      deg[v]--; deg[p]--;
      // restore union-find (undo the merge)
      for (let i = 0; i < n; i++) parentUF[i] = i;
      rebuild(k);
      if (exhausted || count >= maxSols) return;
    }
  }

  // rebuild the union-find partition from the assignments made so far
  const stack = [];
  function rebuild(k) {
    for (let i = 0; i < n; i++) parentUF[i] = i;
    for (const s of stack) {
      const [v, p] = s;
      const rv = find(v), rp = find(p);
      if (rv !== rp) parentUF[rv] = rp;
    }
  }

  // stack-aware version of step()
  function step2(k) {
    if (count >= maxSols) return;
    if (++nodes > nodeBudget) { exhausted = true; return; }
    if (k === order.length) {
      if (!feasible()) return;
      for (let c = 0; c < n; c++) {
        if (isAnchor[c]) { if (deg[c] !== maxDeg[c]) return; }
        else if (deg[c] > 2) return;
      }
      count++;
      return;
    }
    const v = order[k];
    if (!feasible()) return;
    for (const p of nbrs[v]) {
      if (deg[v] >= maxDeg[v]) break;
      if (deg[p] >= maxDeg[p]) continue;
      const rv = find(v), rp = find(p);
      if (rv === rp) continue;
      deg[v]++; deg[p]++;
      parentUF[rv] = rp;
      assigned[v] = true;
      stack.push([v, p]);
      step2(k + 1);
      stack.pop();
      assigned[v] = false;
      deg[v]--; deg[p]--;
      for (let i = 0; i < n; i++) parentUF[i] = i;
      rebuild(k);
      if (exhausted || count >= maxSols) return;
    }
  }

  step2(0);
  return { count, exhausted, nodes };
}

/* ---- stored-solution check (independent of the search) ---------------- */
function checkStored(lv) {
  const Q = lv.size[0], R = lv.size[1];
  const { cells, idx, nbrs } = buildGrid(Q, R);
  const edgeKey = new Set();
  for (let c = 0; c < cells.length; c++) {
    for (const u of nbrs[c]) {
      if (u <= c) continue;
      const a = cells[c].join(','), b = cells[u].join(',');
      edgeKey.add(a < b ? a + '|' + b : b + '|' + a);
    }
  }
  const deg = new Array(cells.length).fill(0);
  const parent = new Int32Array(cells.length);
  for (let i = 0; i < cells.length; i++) parent[i] = i;
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  for (const [a, b] of lv.solution) {
    const ka = a.join(','), kb = b.join(',');
    const key = ka < kb ? ka + '|' + kb : kb + '|' + ka;
    if (!edgeKey.has(key)) return 'stored edge ' + key + ' is not a hex-grid edge';
    const ia = idx.get(ka), ib = idx.get(kb);
    deg[ia]++; deg[ib]++;
    const ra = find(ia), rb = find(ib);
    if (ra === rb) return 'stored solution contains a cycle';
    parent[ra] = rb;
  }
  const n = cells.length;
  if (lv.solution.length !== n - 1) return 'stored solution has ' + lv.solution.length + ' edges, expected ' + (n - 1);
  // anchor cells: degree must EQUAL the clue (an anchor may exceed 2)
  const anchorIdx = new Set();
  for (const key of Object.keys(lv.anchors)) {
    const c = idx.get(key);
    if (c === undefined) return 'anchor ' + key + ' is not a cell';
    anchorIdx.add(c);
    if (deg[c] !== lv.anchors[key]) return 'anchor ' + key + ' has degree ' + deg[c] + ', expected ' + lv.anchors[key];
  }
  // non-anchor cells: degree must be <= 2 (engine rule, read from checkWin)
  for (let c = 0; c < n; c++) {
    if (anchorIdx.has(c)) continue;
    if (deg[c] > 2) return 'non-anchor cell ' + cells[c].join(',') + ' has degree ' + deg[c];
  }
  const root = find(0);
  for (let c = 1; c < n; c++) if (find(c) !== root) return 'stored solution is not connected';
  return null;
}

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const levels = data.levels;
  const NODE_BUDGET = 20000000;

  let pass = 0, fail = 0, indet = 0;
  const failures = [];
  const indeterminates = [];
  const t0 = Date.now();

  for (let i = 0; i < levels.length; i++) {
    const lv = levels[i];
    const id = lv.number !== undefined ? lv.number : (i + 1);
    const storedErr = checkStored(lv);
    if (storedErr) { fail++; failures.push([id, 'stored solution invalid: ' + storedErr]); continue; }
    const r = countSolutions(lv.size[0], lv.size[1], lv.anchors, 2, NODE_BUDGET);
    if (r.error) { fail++; failures.push([id, r.error]); continue; }
    if (r.exhausted) { indet++; indeterminates.push([id, 'search budget exhausted (not proven)']); continue; }
    if (r.count !== 1) { fail++; failures.push([id, 'expected exactly 1 solution, got ' + r.count]); continue; }
    pass++;
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('verify_independent: ' + pass + '/' + levels.length + ' UNIQUE in ' + secs + 's');
  for (const [id, err] of failures) console.log('  Level ' + id + ': ' + err);
  for (const [id, msg] of indeterminates) console.log('  Level ' + id + ': INDETERMINATE — ' + msg);

  /* A gate that cannot distinguish "not proven" from "proven false" is not a
   * gate (R323 Pitfall #70). Any unproven level exits NON-ZERO. */
  if (indet > 0) {
    console.log('VERDICT: INDETERMINATE (' + indet + ' level(s) not proven)');
    process.exit(3);
  }
  if (failures.length || pass !== levels.length) {
    console.log('VERDICT: FAIL');
    process.exit(1);
  }
  console.log('VERDICT: PASS');
}

main();
