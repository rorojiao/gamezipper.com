#!/usr/bin/env node
/*
 * Independent verifier for Pancake Sort levels (Phase 6).
 * Re-derives the BFS minimum flip distance for every level and asserts:
 *   - BFS-min == stored `par`
 *   - par <= 10
 *   - stack is a permutation of 1..N (each size exactly once)
 *   - N matches the tier
 * Prints `30/30 OK` on success, exits non-zero on any failure.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TIERS = ['Beginner', 'Easy', 'Medium', 'Hard', 'Master'];
const EXPECTED_N_BY_TIERIDX = { 0: [3, 4], 1: [5, 6], 2: [6, 7], 3: [7, 8], 4: [8, 9, 10] };

function bfsMin(start, n) {
  const target = [];
  for (let i = 1; i <= n; i++) target.push(i);
  const targetKey = target.join(',');
  const startKey = start.join(',');
  if (startKey === targetKey) return 0;
  const visited = Object.create(null);
  visited[startKey] = 0;
  const queue = [start.slice()];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const ck = cur.join(',');
    const d = visited[ck];
    if (d >= 11) continue;
    for (let k = 2; k <= n; k++) {
      const next = cur.slice();
      for (let i = 0, j = k - 1; i < j; i++, j--) {
        const t = next[i]; next[i] = next[j]; next[j] = t;
      }
      const nk = next.join(',');
      if (visited[nk] === undefined) {
        const nd = d + 1;
        if (nk === targetKey) return nd;
        visited[nk] = nd;
        queue.push(next);
      }
    }
  }
  return -1;
}

function main() {
  const dataPath = path.join(__dirname, 'levels.json');
  if (!fs.existsSync(dataPath)) {
    console.error('MISSING levels.json at ' + dataPath);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const levels = data.levels;
  if (!Array.isArray(levels) || levels.length !== 30) {
    console.error('Expected 30 levels, got ' + (levels ? levels.length : 'none'));
    process.exit(1);
  }
  let ok = 0;
  for (const lvl of levels) {
    const n = lvl.n;
    // 1. permutation of 1..N
    const counts = {};
    for (const v of lvl.stack) counts[v] = (counts[v] || 0) + 1;
    for (let i = 1; i <= n; i++) {
      if (counts[i] !== 1) {
        console.error(`Lv ${lvl.id}: size ${i} count is ${counts[i] || 0} (expected 1)`);
        process.exit(1);
      }
    }
    if (lvl.stack.length !== n) {
      console.error(`Lv ${lvl.id}: stack length ${lvl.stack.length} != N ${n}`);
      process.exit(1);
    }
    // 2. BFS-min == par
    const minD = bfsMin(lvl.stack, n);
    if (minD !== lvl.par) {
      console.error(`Lv ${lvl.id}: BFS-min ${minD} != stored par ${lvl.par}`);
      process.exit(1);
    }
    // 3. par <= 10
    if (lvl.par > 10) {
      console.error(`Lv ${lvl.id}: par ${lvl.par} > 10`);
      process.exit(1);
    }
    if (lvl.par < 1) {
      console.error(`Lv ${lvl.id}: par ${lvl.par} < 1 (stack already sorted?)`);
      process.exit(1);
    }
    // 4. N matches tier
    const tierIdx = TIERS.indexOf(lvl.tier);
    if (tierIdx < 0) {
      console.error(`Lv ${lvl.id}: unknown tier "${lvl.tier}"`);
      process.exit(1);
    }
    if (lvl.tierIdx !== tierIdx) {
      console.error(`Lv ${lvl.id}: tierIdx ${lvl.tierIdx} != indexOf "${lvl.tier}" (${tierIdx})`);
      process.exit(1);
    }
    const allowedN = EXPECTED_N_BY_TIERIDX[tierIdx];
    if (allowedN.indexOf(n) < 0) {
      console.error(`Lv ${lvl.id}: N=${n} not allowed for tier ${lvl.tier} (expected one of ${allowedN.join(',')})`);
      process.exit(1);
    }
    ok++;
  }
  console.log(`${ok}/30 OK`);
}

main();
