// Independent Node.js BFS verifier for Camshaft Timing.
// Re-derives sub-chains from idlers, computes valid phase sets per chain,
// counts total solutions. Must equal 1 for UNIQUE.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));

function validPhasesForChain(chainPatterns, thetaStar, P) {
  let valid = new Set();
  for (let i=0;i<P;i++) valid.add(i);
  for (const pat of chainPatterns) {
    const lobeIdx = [];
    for (let j=0;j<P;j++) if (pat[j]===1) lobeIdx.push(j);
    const camValid = new Set();
    for (const j of lobeIdx) camValid.add(((thetaStar - j)%P+P)%P);
    const next = new Set();
    for (const v of valid) if (camValid.has(v)) next.add(v);
    valid = next;
    if (valid.size===0) return valid;
  }
  return valid;
}

let allOk = true;
for (const lvl of levels) {
  const {N,P,theta_star,idlers,patterns} = lvl;
  const idlerSet = new Set(idlers);
  const chains = [];
  let cur = [];
  for (let i=0;i<N;i++) {
    cur.push(patterns[i]);
    if (idlerSet.has(i) || i===N-1) { chains.push(cur); cur=[]; }
  }
  let total = 1;
  const perChain = [];
  for (const ch of chains) {
    const v = validPhasesForChain(ch, theta_star, P);
    perChain.push([...v].sort((a,b)=>a-b));
    total *= v.size;
  }
  const ok = total===1;
  if (!ok) allOk=false;
  console.log(`L${String(lvl.level).padStart(2)} ${lvl.tier} N=${N} P=${P} chains=${chains.length} sols=${total} ${ok?'UNIQUE+VALID':'FAIL'}`);
}
console.log(allOk ? '\n30/30 UNIQUE+VALID ✅' : '\nSOME FAILED ❌');
process.exit(allOk?0:1);
