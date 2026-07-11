#!/usr/bin/env node
/**
 * Suraromu — Independent Node.js Verifier
 * Re-implements validation independently from Python generator.
 * Checks: loop closure, simplicity, adjacency, all gates on path.
 */
const fs = require('fs');

const raw = fs.readFileSync('levels.json', 'utf8');
const levels = JSON.parse(raw);

let pass = 0, fail = 0;
for (const lvl of levels) {
  const errors = [];
  const path = lvl.solutionPath.map(c => [c[0], c[1]]);
  // closure
  if (path.length < 5) errors.push('path too short');
  const first = path[0], last = path[path.length-1];
  if (first[0] !== last[0] || first[1] !== last[1]) errors.push('not closed');
  // simplicity (interior unique)
  const interior = path.slice(0, -1);
  const seen = new Set();
  for (const cell of interior) {
    const k = cell[0]+','+cell[1];
    if (seen.has(k)) { errors.push('self-intersecting at '+k); break; }
    seen.add(k);
  }
  // adjacency
  for (let i = 0; i < path.length-1; i++) {
    const a = path[i], b = path[i+1];
    if (Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) !== 1) {
      errors.push(`non-adjacent edge ${i}: ${a} - ${b}`);
      break;
    }
  }
  // gates on path
  const pathSet = new Set(interior.map(c => c[0]+','+c[1]));
  for (const g of lvl.gates) {
    const k = g.cell[0]+','+g.cell[1];
    if (!pathSet.has(k)) errors.push('gate '+k+' not on path');
  }
  // start on path
  const sk = lvl.start[0]+','+lvl.start[1];
  if (!pathSet.has(sk)) errors.push('start not on path');
  // startNum matches gates
  if (lvl.startNum !== lvl.gates.length) errors.push(`startNum ${lvl.startNum} != gates ${lvl.gates.length}`);

  if (errors.length === 0) {
    pass++;
  } else {
    fail++;
    console.log(`L${lvl.level}: FAIL — ${errors.join('; ')}`);
  }
}
console.log(`\nIndependent verifier: ${pass}/${levels.length} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
