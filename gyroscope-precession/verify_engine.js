// In-engine verifier: loads LEVELS from index.html and runs the game's actual netPrecession logic
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
// extract the LEVELS array
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('gyroscope-precession');
// game logic (copied exactly from index.html netPrecession)
function netPrecession(dialVals, cur) {
  var s=0;
  for (var i=0;i<cur.n;i++){ s += dialVals[i]*cur.steps[i]*cur.signs[i]; }
  return ((s%cur.P)+cur.P)%cur.P;
}
let ok=0, bad=0;
for (let idx=0; idx<LEVELS.length; idx++) {
  const L = LEVELS[idx];
  const cur = {P:L[0],n:L[1],steps:L[2],signs:L[3],maxes:L[4],target:L[5],solution:L[6]};
  // set dialVals = solution and check netPrecession === target
  const dialVals = cur.solution.slice();
  const net = netPrecession(dialVals, cur);
  if (net === cur.target) { ok++; }
  else { bad++; console.log(`BAD in-engine L${idx+1}: net=${net} target=${cur.target}`); }
}
console.log(`Node in-engine: ${ok}/30 solvable (solution yields target), ${bad} bad`);
process.exit(bad>0?1:0);
