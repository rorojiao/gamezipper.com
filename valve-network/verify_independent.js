#!/usr/bin/env node
'use strict';
/**
 * Valve Network — Independent Solution Verifier
 * Re-implements the flow simulation in Node.js (no shared code with gen_levels.py)
 * and verifies all 30 levels are: VALID (solvable) + have a UNIQUE OPTIMAL solution.
 *
 * Usage: node valve-network/verify_independent.js
 * Exit code 0 = all pass, 1 = any fail.
 */
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, 'levels.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));

/**
 * Simulate flow from sources through open valves (BFS).
 * @returns {Map<nodeId, Set<color>>}
 */
function simulate(nodes, edges, sources, valveState) {
  const adj = new Map();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const isOpen = !e.valve || valveState.get(i) === true;
    if (!isOpen) continue;
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a).push(e.b);
    adj.get(e.b).push(e.a);
  }
  const reached = new Map();
  for (const n of nodes) reached.set(n.id, new Set());
  const queue = [];
  for (const [sid, color] of sources) {
    if (!reached.has(sid)) continue;
    if (!reached.get(sid).has(color)) {
      reached.get(sid).add(color);
      queue.push([sid, color]);
    }
  }
  while (queue.length > 0) {
    const [nid, color] = queue.shift();
    const nbrs = adj.get(nid);
    if (!nbrs) continue;
    for (const nbr of nbrs) {
      if (!reached.get(nbr).has(color)) {
        reached.get(nbr).add(color);
        queue.push([nbr, color]);
      }
    }
  }
  return reached;
}

/**
 * Check if a valve configuration wins.
 */
function checkWin(nodes, edges, sources, targets, deadEnds, valveState) {
  const reached = simulate(nodes, edges, sources, valveState);
  // overflow check: dead-ends must not receive fluid
  for (const de of deadEnds) {
    if (reached.has(de) && reached.get(de).size > 0) return false;
  }
  // target check: each target must receive its required color
  const targetMap = new Map();
  for (const [tid, tcolor] of targets) targetMap.set(tid, tcolor);
  for (const [tid, tcolor] of targets) {
    if (!reached.has(tid) || !reached.get(tid).has(tcolor)) return false;
  }
  // contamination check: target nodes must only have their required color
  for (const [nid, colors] of reached) {
    if (targetMap.has(nid)) {
      const req = targetMap.get(nid);
      if (colors.size > 0) {
        for (const c of colors) {
          if (c !== req) return false;
        }
      }
    }
  }
  return true;
}

/**
 * Enumerate all winning valve configs.
 * Returns { solutions, optimalSolutions, minOpen }
 */
function findAllSolutions(level) {
  const { nodes, edges, sources, targets, deadEnds } = level;
  const valveIndices = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].valve) valveIndices.push(i);
  }
  const n = valveIndices.length;
  if (n > 20) return { error: 'too many valves to enumerate', n };

  const solutions = [];
  let minOpen = Infinity;

  for (let bits = 0; bits < (1 << n); bits++) {
    const state = new Map();
    let openCount = 0;
    for (let j = 0; j < n; j++) {
      if (bits & (1 << j)) {
        state.set(valveIndices[j], true);
        openCount++;
      }
    }
    if (checkWin(nodes, edges, sources, targets, deadEnds, state)) {
      solutions.push({ bits, openCount });
      if (openCount < minOpen) minOpen = openCount;
    }
  }

  const optimalSolutions = solutions.filter(s => s.openCount === minOpen);
  return { solutions, optimalSolutions, minOpen, n };
}

// ---- Run verification ----
let pass = 0, fail = 0;
const results = [];

console.log('=== Valve Network — Independent Solution Verification ===\n');
console.log('ID  Tier  Name                 Par  Valves  Solutions  Optimal  Status');
console.log('--- ----  -------------------  ---  ------  ----------  -------  ------');

for (const level of levels) {
  const res = findAllSolutions(level);
  if (res.error) {
    console.log(`L${String(level.id).padStart(2)}  T${level.tier}   ${level.name.padEnd(20)} SKIP (${res.error})`);
    fail++;
    results.push({ id: level.id, status: 'SKIP', reason: res.error });
    continue;
  }

  const valid = res.solutions.length > 0;
  const uniqueOptimal = res.optimalSolutions.length === 1;
  const parMatches = res.minOpen === level.par;
  const status = valid && uniqueOptimal && parMatches ? 'UNIQUE+VALID' : 'FAIL';

  if (status === 'UNIQUE+VALID') {
    pass++;
  } else {
    fail++;
  }

  const line = `L${String(level.id).padStart(2)}  T${level.tier}   ${level.name.padEnd(20)} ${String(level.par).padStart(3)}  ${String(res.n).padStart(6)}  ${String(res.solutions.length).padStart(10)}  ${String(res.optimalSolutions.length).padStart(7)}  ${status}`;
  console.log(line);
  results.push({
    id: level.id,
    status,
    valid,
    uniqueOptimal,
    parMatches,
    numSolutions: res.solutions.length,
    numOptimal: res.optimalSolutions.length,
    computedMinOpen: res.minOpen,
    declaredPar: level.par,
  });
}

console.log('\n=== Summary ===');
console.log(`PASS (UNIQUE+VALID): ${pass}/${levels.length}`);
console.log(`FAIL:                ${fail}/${levels.length}`);
console.log(`Result:              ${pass === levels.length ? '✅ ALL 30/30 UNIQUE+VALID' : '❌ SOME FAILED'}`);

if (fail > 0) {
  console.log('\nFailures:');
  for (const r of results.filter(r => r.status !== 'UNIQUE+VALID')) {
    console.log(`  L${r.id}: ${r.status} — valid=${r.valid} uniqueOptimal=${r.uniqueOptimal} parMatches=${r.parMatches}`);
  }
  process.exit(1);
}

console.log('\n✅ All levels verified: each has exactly one optimal valve configuration.');
process.exit(0);
