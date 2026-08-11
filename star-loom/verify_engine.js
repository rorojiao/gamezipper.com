#!/usr/bin/env node
/**
 * Star Loom - In-engine verifier.
 *
 * Loads the actual game solver extracted from index.html and verifies each level.
 * The "engine" here is the production code that runs in the browser.
 */
const fs = require('fs');

// Load the engine solver (extracted from index.html)
const StarLoom = require('./_starloom_module.js');

function allChordsPairs(N) {
  const edges = [];
  for (let i = 0; i < N; i++) edges.push([i, (i + 1) % N]);
  for (let i = 0; i < N; i++) {
    for (let j = i + 2; j < N; j++) {
      if (!(i === 0 && j === N - 1)) edges.push([i, j]);
    }
  }
  return edges;
}

function main() {
  const data = JSON.parse(fs.readFileSync('/home/junze/gamezipper.com/star-loom/levels.json', 'utf8'));
  const levels = data.levels;
  let passed = 0;
  const failed = [];

  for (const lvl of levels) {
    const N = lvl.num_stars;
    const anchors = {};
    for (const k of Object.keys(lvl.anchors)) anchors[parseInt(k)] = lvl.anchors[k];
    const allE = allChordsPairs(N);
    const sols = StarLoom.solveUnique(allE, anchors, N, 2000);

    if (sols.length === 1) {
      const solvedEdges = [];
      for (let idx = 0; idx < allE.length; idx++) {
        if (sols[0][idx]) solvedEdges.push(allE[idx].slice().sort((a, b) => a - b));
      }
      const storedEdges = lvl.solution.map(e => e.slice().sort((a, b) => a - b));
      const storedSet = new Set(storedEdges.map(e => e.join(',')));
      const solvedSet = new Set(solvedEdges.map(e => e.join(',')));
      const sameSet = storedSet.size === solvedSet.size &&
        [...storedSet].every(e => solvedSet.has(e));
      if (sameSet) passed++;
      else failed.push({num: lvl.number, err: 'Solution mismatch'});
    } else {
      failed.push({num: lvl.number, err: `${sols.length} solutions`});
    }
  }

  console.log(`Engine verify: ${passed}/${levels.length} PASS`);
  console.log('(Used in-engine StarLoom.solveUnique extracted from index.html)');
  if (failed.length > 0) {
    for (const f of failed) console.log(`  Level ${f.num} FAIL: ${f.err}`);
    process.exit(1);
  }
}

main();