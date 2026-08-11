#!/usr/bin/env node
/**
 * Star Loom - Independent Node.js uniqueness verifier.
 *
 * Re-implements the backtracking solver from scratch (no shared code with gen_levels.py)
 * and verifies that each level has EXACTLY ONE solution.
 *
 * Usage: node verify_independent.js
 */
const fs = require('fs');

function allChordsPairs(N) {
  const edges = [];
  for (let i = 0; i < N; i++) {
    edges.push([i, (i + 1) % N]);
  }
  for (let i = 0; i < N; i++) {
    for (let j = i + 2; j < N; j++) {
      if (!(i === 0 && j === N - 1)) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

function solveUnique(allE, anchors, N, timeLimitMs = 5000) {
  const start = Date.now();
  const neighbors = Array.from({length: N}, () => []);
  for (let idx = 0; idx < allE.length; idx++) {
    const [i, j] = allE[idx];
    neighbors[i].push([j, idx]);
    neighbors[j].push([i, idx]);
  }
  const nChords = allE.length;
  const used = new Array(nChords).fill(false);
  const currentDeg = new Array(N).fill(0);
  const solutions = [];

  // Order by most-constrained first
  const order = Array.from({length: nChords}, (_, k) => k).sort((a, b) => {
    const [ai, aj] = allE[a];
    const [bi, bj] = allE[b];
    const aMin = Math.min(
      anchors[ai] !== undefined ? anchors[ai] : 99,
      anchors[aj] !== undefined ? anchors[aj] : 99
    );
    const bMin = Math.min(
      anchors[bi] !== undefined ? anchors[bi] : 99,
      anchors[bj] !== undefined ? anchors[bj] : 99
    );
    return bMin - aMin;
  });

  function feasible() {
    for (const nStr of Object.keys(anchors)) {
      const n = parseInt(nStr);
      const target = anchors[n];
      if (currentDeg[n] > target) return false;
      let remaining = 0;
      for (const [, eidx] of neighbors[n]) {
        if (!used[eidx]) remaining++;
      }
      if (currentDeg[n] + remaining < target) return false;
    }
    return true;
  }

  function backtrack(idx) {
    if (Date.now() - start > timeLimitMs) return;
    if (solutions.length >= 2) return;
    if (idx === order.length) {
      // Check all anchors satisfied
      for (const nStr of Object.keys(anchors)) {
        const n = parseInt(nStr);
        if (currentDeg[n] !== anchors[n]) return;
      }
      // Check connectivity
      const visited = new Set([0]);
      const stack = [0];
      while (stack.length > 0) {
        const cur = stack.pop();
        for (const [nb, eidx] of neighbors[cur]) {
          if (used[eidx] && !visited.has(nb)) {
            visited.add(nb);
            stack.push(nb);
          }
        }
      }
      if (visited.size === N) {
        solutions.push([...used]);
      }
      return;
    }

    const ci = order[idx];
    const [i, j] = allE[ci];

    // Include
    used[ci] = true;
    currentDeg[i]++;
    currentDeg[j]++;
    if (feasible()) backtrack(idx + 1);
    currentDeg[i]--;
    currentDeg[j]--;

    // Exclude
    const mustExclude =
      (anchors[i] !== undefined && currentDeg[i] === anchors[i]) ||
      (anchors[j] !== undefined && currentDeg[j] === anchors[j]);
    used[ci] = false;
    if (mustExclude) {
      backtrack(idx + 1);
    } else if (feasible()) {
      backtrack(idx + 1);
    }
    used[ci] = false;
  }

  backtrack(0);
  return solutions;
}

function main() {
  const data = JSON.parse(fs.readFileSync('/home/junze/gamezipper.com/star-loom/levels.json', 'utf8'));
  const levels = data.levels;
  let passed = 0;
  const failed = [];

  for (const lvl of levels) {
    const N = lvl.num_stars;
    const anchors = {};
    for (const k of Object.keys(lvl.anchors)) {
      anchors[parseInt(k)] = lvl.anchors[k];
    }
    const allE = allChordsPairs(N);
    const sols = solveUnique(allE, anchors, N, 5000);

    if (sols.length === 1) {
      // Verify solution matches stored solution
      const storedEdges = lvl.solution.map(e => e.sort((a, b) => a - b));
      const solvedEdges = [];
      for (let idx = 0; idx < allE.length; idx++) {
        if (sols[0][idx]) solvedEdges.push(allE[idx].slice().sort((a, b) => a - b));
      }
      const storedSet = new Set(storedEdges.map(e => e.join(',')));
      const solvedSet = new Set(solvedEdges.map(e => e.join(',')));
      const sameSet = storedSet.size === solvedSet.size &&
        [...storedSet].every(e => solvedSet.has(e));

      if (sameSet) {
        passed++;
      } else {
        failed.push({num: lvl.number, err: 'Solution edges mismatch'});
      }
    } else {
      failed.push({num: lvl.number, err: `Got ${sols.length} solutions, expected 1`});
    }
  }

  console.log(`Node verify: ${passed}/${levels.length} UNIQUE`);
  if (failed.length > 0) {
    for (const f of failed) {
      console.log(`  Level ${f.num} FAIL: ${f.err}`);
    }
    process.exit(1);
  } else {
    console.log('All levels UNIQUE');
  }
}

main();
