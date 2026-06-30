#!/usr/bin/env node
/**
 * Independent BFS Verifier for Ratchet Escapement
 * Reads levels.json and verifies each: solvable + unique minimal solution
 * This mirrors the Python gen_levels.py logic independently in JS.
 */
'use strict';
const fs = require('fs');

function bfsSolve(nTeeth, pawls, goalPos) {
  // pawls: array of slot positions that have a pawl
  // state: [pos, maskBitmask] where mask bit i = 1 if pawl[i] is DOWN
  const nPawls = pawls.length;
  const posToIdx = {};
  for (let i = 0; i < nPawls; i++) posToIdx[pawls[i]] = i;

  const initMask = (1 << nPawls) - 1;  // all DOWN
  const start = `0,${initMask}`;
  if (goalPos === 0) return { par: 0, nPaths: 1 };

  const dist = new Map();
  const paths = new Map();
  dist.set(start, 0);
  paths.set(start, 1);
  const queue = [start];
  let foundDist = null;
  const MAX = 200000;

  while (queue.length > 0) {
    const state = queue.shift();
    const d = dist.get(state);
    if (foundDist !== null && d >= foundDist) continue;
    if (dist.size > MAX) return { par: null, nPaths: null };

    const [posStr, maskStr] = state.split(',');
    const pos = parseInt(posStr);
    const mask = parseInt(maskStr);

    // Action 1: ADVANCE CW
    const npos1 = (pos + 1) % nTeeth;
    const ns1 = `${npos1},${mask}`;
    if (!dist.has(ns1)) {
      dist.set(ns1, d + 1); paths.set(ns1, paths.get(state));
      if (npos1 === goalPos) foundDist = foundDist === null ? d + 1 : Math.min(foundDist, d + 1);
      else queue.push(ns1);
    } else if (dist.get(ns1) === d + 1) {
      paths.set(ns1, paths.get(ns1) + paths.get(state));
    }

    // Action 2: RETRACT CCW (if no DOWN pawl at current pos)
    const piHere = posToIdx[pos];
    let blocked = false;
    if (piHere !== undefined && (mask & (1 << piHere))) blocked = true;
    if (!blocked) {
      const npos2 = (pos - 1 + nTeeth) % nTeeth;
      const ns2 = `${npos2},${mask}`;
      if (!dist.has(ns2)) {
        dist.set(ns2, d + 1); paths.set(ns2, paths.get(state));
        if (npos2 === goalPos) foundDist = foundDist === null ? d + 1 : Math.min(foundDist, d + 1);
        else queue.push(ns2);
      } else if (dist.get(ns2) === d + 1) {
        paths.set(ns2, paths.get(ns2) + paths.get(state));
      }
    }

    // Action 3: TOGGLE pawl at current pos (if exists)
    if (piHere !== undefined) {
      const nmask = mask ^ (1 << piHere);
      const ns3 = `${pos},${nmask}`;
      if (!dist.has(ns3)) {
        dist.set(ns3, d + 1); paths.set(ns3, paths.get(state));
        queue.push(ns3);
      } else if (dist.get(ns3) === d + 1) {
        paths.set(ns3, paths.get(ns3) + paths.get(state));
      }
    }
  }

  if (foundDist === null) return { par: null, nPaths: 0 };
  let total = 0;
  for (const [state, d] of dist) {
    if (d === foundDist && parseInt(state.split(',')[0]) === goalPos) {
      total += paths.get(state);
    }
  }
  return { par: foundDist, nPaths: total };
}

function main() {
  const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
  let allOk = true;
  let allUnique = true;
  console.log('Verifying ' + data.length + ' levels...');
  for (const lvl of data) {
    const r = bfsSolve(lvl.teeth, lvl.pawls, lvl.goal);
    const ok = r.par !== null && r.par === lvl.par;
    const uniq = r.nPaths === 1;
    if (!ok) allOk = false;
    if (!uniq) allUnique = false;
    const mark = ok && uniq ? '✓' : '✗';
    console.log(`L${String(lvl.id).padStart(2)} T${lvl.teeth} P${lvl.pawls.length} goal=${String(lvl.goal).padStart(2)} par=${String(lvl.par).padStart(2)}(expected) vs ${r.par===null?'NULL':r.par}(verified) nPaths=${r.nPaths} ${mark}`);
  }
  console.log('\nAll solvable & par matches: ' + allOk);
  console.log('All unique: ' + allUnique);
  console.log('PASS: ' + (allOk && allUnique));
  process.exit(allOk && allUnique ? 0 : 1);
}

main();
