#!/usr/bin/env node
/*
 * Hexa-Bridges independent verifier.
 *
 * For each level, re-solves from scratch using a brute-force backtracking solver
 * (independent re-implementation). Verifies:
 *   1. Exactly one solution exists
 *   2. The stored solution matches the unique solution
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];

function cellNeighbors(q, r, Q, R) {
  const out = [];
  for (const [dq, dr] of DIRS) {
    const nq = q + dq, nr = r + dr;
    if (nq >= 0 && nq < Q && nr >= 0 && nr < R) out.push([nq, nr]);
  }
  return out;
}

function buildEdgeList(Q, R) {
  const seen = new Set();
  const edgeList = [];
  const cellIdx = {};
  let idx = 0;
  for (let q = 0; q < Q; q++) {
    for (let r = 0; r < R; r++) {
      cellIdx[q + ',' + r] = idx++;
      for (const [nq, nr] of cellNeighbors(q, r, Q, R)) {
        if (nq > q || (nq === q && nr > r)) {
          const key = q + ',' + r + '|' + nq + ',' + nr;
          if (!seen.has(key)) {
            seen.add(key);
            edgeList.push([[q, r], [nq, nr]]);
          }
        }
      }
    }
  }
  return { edgeList, cellIdx };
}

function countSolutions(anchors, Q, R, maxSols, timeLimitMs) {
  const start = Date.now();
  const cells = [];
  const cellIdx = {};
  let idx = 0;
  for (let q = 0; q < Q; q++) for (let r = 0; r < R; r++) {
    cells.push([q, r]);
    cellIdx[q + ',' + r] = idx++;
  }
  const n = cells.length;
  const { edgeList } = buildEdgeList(Q, R);
  const nEdges = edgeList.length;
  const edgeIdx = edgeList.map(e => [cellIdx[e[0].join(',')], cellIdx[e[1].join(',')]]);

  const targetDeg = {};
  for (const k in anchors) targetDeg[cellIdx[k]] = anchors[k];
  const anchorSet = new Set(Object.keys(targetDeg).map(Number));

  const solutions = [];
  let foundMask = null;

  function checkFull(mask) {
    const deg = new Array(n).fill(0);
    for (let ei = 0; ei < nEdges; ei++) {
      if (mask[ei]) {
        const [a, b] = edgeIdx[ei];
        deg[a]++;
        deg[b]++;
      }
    }
    for (const cStr in targetDeg) {
      if (deg[+cStr] !== targetDeg[cStr]) return false;
    }
    for (let c = 0; c < n; c++) {
      if (!anchorSet.has(c) && deg[c] > 2) return false;
    }
    const parent = Array.from({ length: n }, (_, i) => i);
    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }
    for (let ei = 0; ei < nEdges; ei++) {
      if (mask[ei]) {
        const [a, b] = edgeIdx[ei];
        const ra = find(a), rb = find(b);
        if (ra === rb) return false;
        parent[ra] = rb;
      }
    }
    const roots = new Set();
    for (let c = 0; c < n; c++) roots.add(find(c));
    return roots.size === 1;
  }

  function recurse(idx, chosenCount, deg, chosenSet) {
    if (Date.now() - start > timeLimitMs) return;
    if (solutions.length >= maxSols) return;
    if (chosenCount === n - 1) {
      const mask = new Array(nEdges).fill(0);
      for (const ei of chosenSet) mask[ei] = 1;
      if (checkFull(mask)) {
        solutions.push(mask.slice());
        if (foundMask === null) foundMask = mask.slice();
      }
      return;
    }
    if (idx >= nEdges) return;
    const remaining = nEdges - idx;
    const needed = (n - 1) - chosenCount;
    if (remaining < needed) return;

    const [a, b] = edgeIdx[idx];
    let canOne = true;
    if (anchorSet.has(a) && deg[a] + 1 > targetDeg[a]) canOne = false;
    else if (anchorSet.has(b) && deg[b] + 1 > targetDeg[b]) canOne = false;
    else if (!anchorSet.has(a) && deg[a] + 1 > 2) canOne = false;
    else if (!anchorSet.has(b) && deg[b] + 1 > 2) canOne = false;
    if (canOne) {
      deg[a]++; deg[b]++;
      chosenSet.add(idx);
      recurse(idx + 1, chosenCount + 1, deg, chosenSet);
      chosenSet.delete(idx);
      deg[a]--; deg[b]--;
      if (solutions.length >= maxSols) return;
    }
    recurse(idx + 1, chosenCount, deg, chosenSet);
  }

  recurse(0, 0, new Array(n).fill(0), new Set());
  return { solutions: solutions.length, foundMask };
}

function checkLevel(lv) {
  const Q = lv.size[0], R = lv.size[1];
  const anchors = lv.anchors;

  const { solutions, foundMask } = countSolutions(anchors, Q, R, 2, 30000);
  if (solutions !== 1) return `expected exactly 1 solution, got ${solutions}`;
  if (!foundMask) return 'no solution found';

  const { edgeList } = buildEdgeList(Q, R);
  const storedKeys = new Set();
  for (const [a, b] of lv.solution) {
    const s1 = a.join(',');
    const s2 = b.join(',');
    storedKeys.add(s1 < s2 ? s1 + '|' + s2 : s2 + '|' + s1);
  }
  const foundKeys = new Set();
  for (let ei = 0; ei < edgeList.length; ei++) {
    if (foundMask[ei]) {
      const e = edgeList[ei];
      const s1 = e[0].join(',');
      const s2 = e[1].join(',');
      foundKeys.add(s1 < s2 ? s1 + '|' + s2 : s2 + '|' + s1);
    }
  }
  if (storedKeys.size !== foundKeys.size) return `stored ${storedKeys.size} edges, found ${foundKeys.size}`;
  for (const k of storedKeys) {
    if (!foundKeys.has(k)) return `stored edge ${k} not in solution`;
  }
  return null;
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
  const levels = data.levels;
  let pass = 0, fail = 0;
  const failures = [];
  for (let i = 0; i < levels.length; i++) {
    const err = checkLevel(levels[i]);
    if (err === null) pass++;
    else { fail++; failures.push([i+1, err]); }
  }
  console.log(`verify_independent: ${pass}/${levels.length} UNIQUE`);
  if (failures.length) {
    for (const [lv, err] of failures) console.log(`  Level ${lv}: ${err}`);
    process.exit(1);
  }
  if (pass !== levels.length) process.exit(1);
}

main();
