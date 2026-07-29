// In-engine verifier: loads LEVELS from index.html and runs the game's actual netPrecession logic
const { runIndependentVerifier } = require('../.audit/gz-production-engine.js');
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
  const cur = LEVELS[idx];
  // set dialVals = solution and check netPrecession === target
  const dialVals = cur.solution.slice();
  const net = netPrecession(dialVals, cur);
  if (net === cur.target) { ok++; }
  else { bad++; console.log(`BAD in-engine L${idx+1}: net=${net} target=${cur.target}`); }
}
console.log(`Node in-engine: ${ok}/30 solvable (solution yields target), ${bad} bad`);
if (bad) process.exit(1);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
