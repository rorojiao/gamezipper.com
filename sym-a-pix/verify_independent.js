#!/usr/bin/env node
/* Independent Node.js verifier for Sym-a-Pix levels.
 *
 * Re-implements the solver in JS, reads LEVELS from levels.json (or directly
 * from data.js after build), verifies:
 *   - structural integrity (clues match solution)
 *   - solution is point-symmetric
 *   - anchor set is symmetric
 *   - uniqueness via backtracking
 *
 * Usage:  node verify_independent.js
 * Exits 0 if all 30 levels are uniquely solvable, else 1.
 */

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

function neighbors(n, r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
        out.push([nr, nc]);
      }
    }
  }
  return out;
}

function checkStructure(level) {
  const n = level.n;
  const sol = level.solution;
  const clues = level.clues;
  const anchors = level.anchors;
  if (sol.length !== n) return `solution rows wrong`;
  for (const row of sol) if (row.length !== n) return `solution cols wrong`;
  if (clues.length !== n) return `clues rows wrong`;
  for (const row of clues) if (row.length !== n) return `clues cols wrong`;
  // symmetry
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (sol[r][c] !== sol[n - 1 - r][n - 1 - c]) {
        return `solution not point-symmetric at (${r},${c})`;
      }
    }
  }
  // clues match
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (const [nr, nc] of neighbors(n, r, c)) {
        cnt += sol[nr][nc];
      }
      if (clues[r][c] !== cnt) {
        return `clue at (${r},${c}) = ${clues[r][c]} but expected ${cnt}`;
      }
    }
  }
  // anchors are consistent + symmetric
  for (const a of anchors) {
    if (a.v !== clues[a.r][a.c]) {
      return `anchor (${a.r},${a.c})=${a.v} != clue ${clues[a.r][a.c]}`;
    }
    const rr = n - 1 - a.r, cc = n - 1 - a.c;
    if ((rr, cc) === (a.r, a.c)) continue;
    const partner = anchors.find(x => x.r === rr && x.c === cc);
    if (!partner) {
      return `anchor (${a.r},${a.c}) lacks symmetric partner`;
    }
    if (partner.v !== a.v) {
      return `anchor (${a.r},${a.c})=${a.v} but partner (${rr},${cc})=${partner.v}`;
    }
  }
  return null;
}

function solveUnique(n, anchors, cap = 2) {
  // Primary cells: (r,c) <= (n-1-r, n-1-c) lexicographically
  const primary = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const rr = n - 1 - r, cc = n - 1 - c;
      if (r < rr || (r === rr && c <= cc)) {
        primary.push([r, c]);
      }
    }
  }
  const K = primary.length;
  const idx = {};
  primary.forEach((p, i) => { idx[p[0] + ',' + p[1]] = i; });

  // Build constraints
  const constraints = [];
  for (const a of anchors) {
    const nbrIndices = [];
    for (const [nr, nc] of neighbors(n, a.r, a.c)) {
      const nrr = n - 1 - nr, ncc = n - 1 - nc;
      let key;
      if (nr < nrr || (nr === nrr && nc <= ncc)) {
        key = nr + ',' + nc;
      } else {
        key = nrr + ',' + ncc;
      }
      nbrIndices.push(idx[key]);
    }
    constraints.push({ idxs: nbrIndices.sort((x, y) => x - y), v: a.v });
  }

  const sol = new Array(K).fill(0);
  const solutions = [];
  const assigned = [];

  function prune() {
    for (const { idxs, v } of constraints) {
      let s = 0, unassigned = 0;
      for (const i of idxs) {
        if (i < assigned.length) {
          s += sol[i];
        } else {
          unassigned++;
        }
      }
      if (s > v) return false;
      if (unassigned === 0 && s !== v) return false;
    }
    return true;
  }

  function bt() {
    if (solutions.length >= cap) return;
    if (assigned.length === K) {
      let ok = true;
      for (const { idxs, v } of constraints) {
        let s = 0;
        for (const i of idxs) s += sol[i];
        if (s !== v) { ok = false; break; }
      }
      if (ok) solutions.push([...sol]);
      return;
    }
    for (const v_ of [0, 1]) {
      sol[assigned.length] = v_;
      assigned.push(null);
      if (prune()) bt();
      assigned.pop();
    }
  }

  bt();
  return solutions;
}

function main() {
  const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const levels = data.levels;
  let passed = 0, failed = 0;
  for (const lvl of levels) {
    const err = checkStructure(lvl);
    if (err) {
      failed++;
      console.log(`FAIL ${lvl.name}: ${err}`);
      continue;
    }
    const n = lvl.n;
    const anchors = lvl.anchors;
    const sols = solveUnique(n, anchors, 2);
    if (sols.length !== 1) {
      failed++;
      console.log(`FAIL ${lvl.name}: ${sols.length} solutions (expected 1)`);
      continue;
    }
    passed++;
    console.log(`PASS ${lvl.name} (${n}x${n}, ${anchors.length} anchors, 1 solution)`);
  }
  console.log(`\n${passed}/${passed + failed} PASS`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
