#!/usr/bin/env node
/**
 * Mobiriti independent solver (Node.js).
 *
 * Verifies that each level in levels.json is solvable by computing visibility
 * counts on the target black grid and checking they match the clue values.
 *
 * Independent implementation (no inheritance from gen_levels.py).
 * Uses BFS for visibility counting.
 */
const fs = require('fs');
const path = require('path');

const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

function visibilityCount(R, C, startR, startC, black, clues) {
  // BFS from (startR, startC) over white cells, not crossing black or other circles.
  const clueSet = new Set(clues.map(cl => cl.r + ',' + cl.c));
  const seen = new Set();
  const startKey = startR + ',' + startC;
  seen.add(startKey);
  const queue = [[startR, startC]];
  let count = 0;
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      const key = nr + ',' + nc;
      if (seen.has(key)) continue;
      if (black[nr][nc]) continue;
      // Is this a circle cell (and not start)?
      const clKey = nr + ',' + nc;
      if (clueSet.has(clKey) && clKey !== startKey) continue;
      seen.add(key);
      queue.push([nr, nc]);
      count++;
    }
  }
  return count;
}

let pass_count = 0;
let fail_count = 0;
for (const L of levels) {
  const R = L.rows, C = L.cols;
  const black = L.solution;  // bool[][] (true=black)
  let allValid = true;
  for (const cl of L.clues) {
    const actual = visibilityCount(R, C, cl.r, cl.c, black, L.clues);
    if (actual !== cl.n) {
      allValid = false;
      console.log(`  L${L.id} [${L.tier}]: FAIL circle (${cl.r},${cl.c}) expected ${cl.n} got ${actual}`);
      break;
    }
  }
  if (allValid) pass_count++;
  else fail_count++;
}

console.log(`\n${pass_count}/${levels.length} levels PASS independent verification.`);
if (fail_count > 0) process.exit(1);
