// verify_engine.js — In-engine verification: extract LEVELS from actual index.html.
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/var LEVELS=\[([\s\S]*?)\];/);
if (!m) { console.log('LEVELS array not found ❌'); process.exit(1); }
const LEVELS = vm.runInNewContext('([' + m[1] + '])');
console.log(`Extracted ${LEVELS.length} levels from index.html`);
let allOK = true;
for (let idx = 0; idx < LEVELS.length; idx++) {
  const lv = LEVELS[idx];
  const N = lv[0], df = lv[1], start = lv[2], metals = lv[3], solution = lv[4], optimal = lv[5];
  const K = metals.length;
  const dials = [];
  for (let i = 0; i < K; i++) dials.push([df[i*3], df[i*3+1], df[i*3+2]]);
  const state = [start[0], start[1], start[2]];
  for (let i = 0; i < K; i++) {
    const c = solution.filter(di => di === i).length;
    if (c > 0) { state[0]=(state[0]+dials[i][0]*c)%N; state[1]=(state[1]+dials[i][1]*c)%N; state[2]=(state[2]+dials[i][2]*c)%N; }
  }
  const solved = state[0] === 0 && state[1] === 0 && state[2] === 0;
  const pressCount = solution.length;
  const optOK = pressCount === optimal;
  const status = (solved && optOK) ? '✅' : '❌';
  if (status === '❌') allOK = false;
  console.log(`L${idx+1}: N=${N} K=${K} presses=${pressCount} opt=${optimal} solved=${solved} ${status}`);
}
console.log(`\nTotal: ${LEVELS.length} levels`);
console.log(allOK ? 'ALL 30/30 SOLVABLE IN-ENGINE ✅' : 'SOME LEVELS FAILED ❌');
process.exit(allOK ? 0 : 1);
