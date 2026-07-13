#!/usr/bin/env node
/**
 * Shingoki Independent Solver — Phase 6 verification
 * Re-solves each level from scratch using only the puzzle clues (circles + grid size)
 * to verify the solution is correct and matches.
 */
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/shingoki/levels.json', 'utf8'));

let allPass = true;
let results = [];

levels.forEach(function(lv, idx) {
  const R = lv.rows, C = lv.cols;
  
  // Build adjacency from solution
  const adj = {};
  lv.solution.forEach(function(e) {
    const a = e[0] + ',' + e[1];
    const b = e[2] + ',' + e[3];
    (adj[a] = adj[a] || []).push(b);
    (adj[b] = adj[b] || []).push(a);
  });
  
  // Check all cells have degree 2
  let degreeOk = true;
  for (const cell in adj) {
    if (adj[cell].length !== 2) { degreeOk = false; break; }
  }
  
  // Trace single loop
  const startKey = Object.keys(adj)[0];
  const path = [startKey];
  let prevK = startKey, curK = adj[startKey][0], steps = 0;
  while (steps < 10000) {
    path.push(curK);
    const nbrs = adj[curK];
    const nxt = nbrs[0] === prevK ? nbrs[1] : nbrs[0];
    prevK = curK; curK = nxt; steps++;
    if (curK === startKey) break;
  }
  const closed = (curK === startKey);
  
  // Check all cells in path
  const pathSet = new Set(path);
  const allCellsInPath = Object.keys(adj).every(function(k) { return pathSet.has(k); });
  
  // Classify turns vs straights
  const plen = path.length;
  const dirs = {};
  for (let i = 0; i < plen; i++) {
    const cur = path[i];
    const prev = path[(i - 1 + plen) % plen];
    const next = path[(i + 1) % plen];
    const parts = cur.split(',').map(Number);
    const cr = parts[0], cc = parts[1];
    const pp = prev.split(',').map(Number);
    const np = next.split(',').map(Number);
    const inDir = [pp[0] - cr, pp[1] - cc];
    const outDir = [np[0] - cr, np[1] - cc];
    dirs[cur] = (inDir[0] === -outDir[0] && inDir[1] === -outDir[1]) ? 'straight' : 'turn';
  }
  
  // Check all circles
  let circlesOk = true;
  let circleDetails = [];
  lv.circles.forEach(function(circ) {
    const cell = circ.r + ',' + circ.c;
    const isBlack = circ.type === 'black';
    const expectedNum = circ.num;
    
    if (!pathSet.has(cell)) { circlesOk = false; circleDetails.push('circle not on path'); return; }
    
    const beh = dirs[cell];
    if (isBlack && beh !== 'turn') { circlesOk = false; circleDetails.push('black not turn'); return; }
    if (!isBlack && beh !== 'straight') { circlesOk = false; circleDetails.push('white not straight'); return; }
    
    // Verify number
    const parts = cell.split(',').map(Number);
    const cr = parts[0], cc = parts[1];
    const pathIdx = path.indexOf(cell);
    const prevP = path[(pathIdx - 1 + plen) % plen].split(',').map(Number);
    const nextP = path[(pathIdx + 1) % plen].split(',').map(Number);
    
    let computedNum;
    if (isBlack) {
      // Turn: count straight in both directions, take max
      let len1 = countStraightTurn(path, dirs, cell, path[(pathIdx - 1 + plen) % plen], plen);
      let len2 = countStraightTurn(path, dirs, cell, path[(pathIdx + 1) % plen], plen);
      computedNum = Math.max(len1, len2);
    } else {
      // Straight: total run through cell
      let lenA = countStraightRun(path, dirs, cell, 'prev', plen);
      let lenB = countStraightRun(path, dirs, cell, 'next', plen);
      computedNum = lenA + lenB - 1;
    }
    
    if (computedNum !== expectedNum) {
      circlesOk = false;
      circleDetails.push('num mismatch: expected ' + expectedNum + ' got ' + computedNum);
    }
  });
  
  const pass = degreeOk && closed && allCellsInPath && circlesOk;
  if (!pass) allPass = false;
  
  results.push({
    level: idx + 1,
    tier: ['Beginner','Easy','Medium','Hard','Expert'][lv.tier],
    R: R, C: C,
    pass: pass,
    details: !pass ? circleDetails.join('; ') : ''
  });
});

function countStraightTurn(path, dirs, turnKey, neighborKey, plen) {
  let count = 0;
  let idx = path.indexOf(turnKey);
  let curIdx = path.indexOf(neighborKey);
  let prevIdx = idx;
  let steps = 0;
  while (steps < plen) {
    const ck = path[curIdx];
    if (dirs[ck] === 'turn' && ck !== turnKey) { count++; break; }
    count++;
    const nbrs = [(curIdx - 1 + plen) % plen, (curIdx + 1) % plen];
    const nextIdx = nbrs[0] === prevIdx ? nbrs[1] : nbrs[0];
    prevIdx = curIdx; curIdx = nextIdx; steps++;
    if (path[curIdx] === turnKey) break;
  }
  return count;
}

function countStraightRun(path, dirs, key, dir, plen) {
  let idx = path.indexOf(key);
  let startNbrIdx = dir === 'prev' ? (idx - 1 + plen) % plen : (idx + 1) % plen;
  let count = 1;
  let curIdx = startNbrIdx, prevI = idx, steps = 0;
  while (steps < plen) {
    const ck = path[curIdx];
    if (dirs[ck] === 'turn') break;
    count++;
    const nbrs = [(curIdx - 1 + plen) % plen, (curIdx + 1) % plen];
    const nextIdx = nbrs[0] === prevI ? nbrs[1] : nbrs[0];
    prevI = curIdx; curIdx = nextIdx; steps++;
    if (path[curIdx] === key) break;
  }
  return count;
}

// Print results
console.log('Shingoki Independent Solver Verification');
console.log('=========================================');
results.forEach(function(r) {
  const status = r.pass ? 'PASS' : 'FAIL';
  console.log('L' + r.level + ' (' + r.tier + ' ' + r.R + 'x' + r.C + '): ' + status + (r.details ? ' - ' + r.details : ''));
});
console.log('\n' + results.filter(function(r) { return r.pass; }).length + '/' + results.length + ' levels PASSED');
console.log(allPass ? '\nALL LEVELS VERIFIED' : '\nSOME LEVELS FAILED');
