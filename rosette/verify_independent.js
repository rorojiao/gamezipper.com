#!/usr/bin/env node
/**
 * Method 2: Independent Node.js verification (no shared Python code).
 * Re-implements the puzzle rules + solver in pure JS.
 * For each level: count exact solutions; verify exactly one solution exists.
 *
 * Uses (n_petals, color_counts, dists, anchors) → enforces:
 *   - color_counts[c] cells of color c, 0 ≤ c < 4
 *   - no two cells at any distance in `dists` share a color (ring topology)
 *   - anchored cells must equal specified color
 *
 * Output: PASS N/30 — only count matters (we don't compare to stored solution).
 */

'use strict';

const fs = require('fs');

const MAX_SOLS = 100;

function* genAllSolutions(n, cc, dists, cellColors, countsLeft) {
  let i = 0;
  while (i < n && cellColors[i] !== null) i++;
  if (i === n) {
    yield cellColors.slice();
    return;
  }
  for (let c = 0; c < 4; c++) {
    if (countsLeft[c] < 1) continue;
    let ok = true;
    for (const d of dists) {
      const a = (i - d + n) % n, b = (i + d) % n;
      if (cellColors[a] === c || cellColors[b] === c) { ok = false; break; }
    }
    if (!ok) continue;
    cellColors[i] = c;
    countsLeft[c]--;
    yield* genAllSolutions(n, cc, dists, cellColors, countsLeft);
    countsLeft[c]++;
    cellColors[i] = null;
  }
}

function countSolutions(n, cc, dists, anchors) {
  const cellColors = new Array(n).fill(null);
  const countsLeft = cc.slice();
  for (const [i, c] of Object.entries(anchors)) {
    const idx = parseInt(i);
    if (cellColors[idx] !== null && cellColors[idx] !== c) return 0;
    cellColors[idx] = c;
    countsLeft[c]--;
  }
  let cnt = 0;
  for (const _ of genAllSolutions(n, cc, dists, cellColors, countsLeft)) {
    cnt++;
    if (cnt >= MAX_SOLS) return cnt;
  }
  return cnt;
}

function main() {
  const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
  let pass = 0, fail = 0;
  const failures = [];
  for (const lv of data.LEVELS) {
    const n = lv.n_petals;
    const cc = lv.color_counts;
    const dists = lv.dists;
    const anchors = {};
    for (const [k, v] of Object.entries(lv.anchors)) {
      anchors[k] = v;
    }
    const sols = countSolutions(n, cc, dists, anchors);
    if (sols === 1) {
      pass++;
    } else {
      fail++;
      failures.push({id: lv.id, sols});
    }
  }
  console.log(`PASS ${pass}/${data.LEVELS.length}`);
  if (fail > 0) {
    console.log("FAILURES:", JSON.stringify(failures));
    process.exit(1);
  }
}

main();
