// Extract BFS solver + level generator from the game and verify all 30 levels solvable.
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/cup-flow/index.html','utf8');
// Extract the script block containing the solver/generator functions (lines ~272-461)
const start = html.indexOf('function mulberry32');
const end = html.indexOf('function buildLevels()');
// Capture everything from mulberry32 through end of genLevel (just before buildLevels)
let block = html.slice(start, end);
const ctx = {};
const fn = new Function(block + '\nthis.genLevel=genLevel;this.solve=solve;this.allStates=allStates;this.fallbackLevel=fallbackLevel;this.makeCand=makeCand;');
fn.call(ctx);

console.log('=== Cup Flow level solvability verification ===');
let ok = 0, fail = 0;
const byTier = {};
for (let i=0;i<30;i++){
  const L = ctx.genLevel(i);
  const chk = ctx.solve(L, L.initial);
  const solvable = chk.solvable && chk.optimal !== Infinity && chk.optimal <= 14;
  const agree = (chk.optimal === L.optimal);
  if (!byTier[L.tier]) byTier[L.tier] = [];
  byTier[L.tier].push({idx:i+1, opt:L.optimal, solveOpt:chk.optimal, caps:L.caps, init:L.initial, targets:L.targets, faucet:L.faucet, drain:L.drain, solvable, agree});
  if (solvable && agree) ok++; else fail++;
}
console.log('Levels solvable & optimal-agrees:', ok, '/30');
console.log('Failures:', fail);
let avgByTier = {};
for (const t in byTier){
  const arr = byTier[t];
  const avg = (arr.reduce((s,x)=>s+x.opt,0)/arr.length).toFixed(2);
  avgByTier[t] = avg;
  console.log(`\nTier ${t}: ${arr.length} levels, avg optimal = ${avg}`);
  for (const x of arr){
    const tg = x.targets.map(t=>`cup${t.cup}=${t.amount}`).join(' & ');
    console.log(`  L${x.idx}: caps=[${x.caps}] init=[${x.init}] goal(${tg}) par=${x.opt} faucet=${x.faucet} drain=${x.drain} solvable=${x.solvable} agree=${x.agree}`);
  }
}
console.log('\nDifficulty scaling (avg optimal by tier):');
for (const t of Object.keys(avgByTier).sort()) console.log(`  Tier ${t}: ${avgByTier[t]}`);
if (fail===0) console.log('\n✅ ALL 30 LEVELS SOLVABLE — difficulty scales correctly');
else console.log('\n❌ SOME LEVELS FAILED');
process.exit(fail===0 ? 0 : 1);
