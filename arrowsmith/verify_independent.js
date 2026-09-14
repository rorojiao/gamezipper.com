#!/usr/bin/env node
/* Independent Node.js verifier for Arrowsmith.
 * Re-implements the structural + uniqueness checks in JS.
 * Reads levels.json and verifies:
 *   1. Counts match arrows
 *   2. Anchors are consistent with arrows
 *   3. The puzzle is uniquely solvable from anchors
 *
 * Usage:  node verify_independent.js
 * Exits 0 if all 30 levels are uniquely solvable, else 1.
 */

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

const DIRS = [0, 1, 2, 3];
const OPPOSITE = {0: 2, 1: 3, 2: 0, 3: 1};
const DELTAS = {0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1]};

function computeCounts(n, arrows) {
  const counts = [];
  for (let r = 0; r < n; r++) counts.push(new Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const d of DIRS) {
        const [dr, dc] = DELTAS[d];
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
          if (arrows[nr][nc] === OPPOSITE[d]) counts[r][c]++;
        }
      }
    }
  }
  return counts;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Array.isArray(a[i])) {
      if (!arraysEqual(a[i], b[i])) return false;
    } else if (a[i] !== b[i]) return false;
  }
  return true;
}

function solveUnique(n, counts, anchors, timeLimit = 5.0) {
  const arrows = [];
  for (let r = 0; r < n; r++) arrows.push(new Array(n).fill(0));
  const assigned = [];
  for (let r = 0; r < n; r++) assigned.push(new Array(n).fill(false));
  for (const [r, c, a] of anchors) {
    arrows[r][c] = a;
    assigned[r][c] = true;
  }
  const free = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!assigned[r][c]) free.push([r, c]);
    }
  }
  const solutions = [];
  const t0 = Date.now();

  function checkCell(r, c) {
    const target = counts[r][c];
    let s = 0;
    let u = 0;
    for (const d of DIRS) {
      const [dr, dc] = DELTAS[d];
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
        if (assigned[nr][nc]) {
          if (arrows[nr][nc] === OPPOSITE[d]) s++;
        } else {
          u++;
        }
      }
    }
    if (s > target) return false;
    if (s + u < target) return false;
    return true;
  }

  function propagate(r, c) {
    const targets = [[r, c]];
    for (const d of DIRS) {
      const [dr, dc] = DELTAS[d];
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) targets.push([nr, nc]);
    }
    for (const [nr, nc] of targets) {
      if (!checkCell(nr, nc)) return false;
    }
    return true;
  }

  function back(idx) {
    if (solutions.length >= 3) return;
    if ((Date.now() - t0) / 1000 > timeLimit) return;
    if (idx === free.length) {
      solutions.push(arrows.map(row => row.slice()));
      return;
    }
    const [r, c] = free[idx];
    for (const a of DIRS) {
      arrows[r][c] = a;
      assigned[r][c] = true;
      if (propagate(r, c)) back(idx + 1);
      assigned[r][c] = false;
      if (solutions.length >= 3) return;
    }
  }
  back(0);
  return { nSols: solutions.length, sol: solutions[0] || null };
}

function main() {
  const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const levels = data.levels;
  console.log(`=== Arrowsmith Independent Node.js Verifier ===`);
  console.log(`Verifying ${levels.length} levels...\n`);

  let passed = 0, failed = 0;

  for (const lvl of levels) {
    const idx = lvl.id;
    const n = lvl.n;
    const arrows = lvl.arrows;
    const counts = lvl.counts;
    const anchors = lvl.anchors;

    // Check 1: counts match arrows
    const actualCounts = computeCounts(n, arrows);
    if (!arraysEqual(actualCounts, counts)) {
      console.log(`  L${idx} ${lvl.name}: FAIL — counts mismatch`);
      failed++;
      continue;
    }

    // Check 2: anchors consistent
    let anchorOk = true;
    for (const [r, c, a] of anchors) {
      if (arrows[r][c] !== a) { anchorOk = false; break; }
    }
    if (!anchorOk) {
      console.log(`  L${idx} ${lvl.name}: FAIL — anchor mismatch`);
      failed++;
      continue;
    }

    // Check 3: uniqueness
    const { nSols, sol } = solveUnique(n, counts, anchors, 5.0);
    if (nSols !== 1) {
      console.log(`  L${idx} ${lvl.name}: FAIL — ${nSols} solutions (expected 1)`);
      failed++;
      continue;
    }

    // Check 4: solution matches stored
    if (!arraysEqual(sol, arrows)) {
      console.log(`  L${idx} ${lvl.name}: FAIL — solution differs`);
      failed++;
      continue;
    }

    console.log(`  L${idx} ${lvl.name}: PASS (n=${n}, anchors=${anchors.length})`);
    passed++;
  }

  console.log(`\n=== ${passed}/${passed + failed} levels PASSED ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
