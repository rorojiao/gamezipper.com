// Profile 9x9 countSolutions speed
const fs = require('fs');
const gen = fs.readFileSync(__dirname+'/gen.js','utf8');
const libCode = gen.replace(/\nmain\(\);\s*$/,'').replace(/^#!.*\n/,'');
fs.writeFileSync('/tmp/gen-lib.js', libCode + '\nmodule.exports={patternSolution,buildPeers,deriveMarginalCandidates,pickMarginalSubset,buildMarginalSets,buildForbidden,countSolutions,digPuzzle,boxSize,TIERS,mulberry32,shuffle};\n');
const M = require('/tmp/gen-lib.js');
const r = M.mulberry32(424242);
const N=9, K=3;
const peers = M.buildPeers(N);
const sol = M.patternSolution(N, r);
console.log('sol[0..8]:', Array.from(sol.slice(0,9)).join(' '));
const cands = M.deriveMarginalCandidates(sol, N, K);
console.log('left for row 0:', cands.left[0]);
const subset = M.pickMarginalSubset(cands, N, 18, r);
const margSets = M.buildMarginalSets(subset, N);
const forbidden = M.buildForbidden(N, K, margSets);
console.log('forbidden[0] size:', forbidden[0].size, 'forbidden[40] size:', forbidden[40].size);

const t0 = Date.now();
const empty = new Int8Array(N*N);
const cnt = M.countSolutions(empty, N, peers, forbidden, 2);
console.log('count on empty+marg (limit 2):', cnt, 'in', Date.now()-t0, 'ms');

const t1 = Date.now();
const p1 = new Int8Array(empty); p1[0]=sol[0];
const cnt1 = M.countSolutions(p1, N, peers, forbidden, 2);
console.log('count after 1 given:', cnt1, 'in', Date.now()-t1, 'ms');

// Time a full dig
const t2 = Date.now();
const puzzle = M.digPuzzle(sol, N, r, peers, forbidden, 8000);
console.log('digPuzzle done in', Date.now()-t2, 'ms, givens:', puzzle.filter(x=>x!==0).length);
const t3 = Date.now();
const finalCnt = M.countSolutions(puzzle, N, peers, forbidden, 2);
console.log('final count:', finalCnt, 'in', Date.now()-t3, 'ms');
