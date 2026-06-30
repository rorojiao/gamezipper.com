// Independent Node.js BFS verifier for Sextant Celestial.
// Re-derives optimal solutions independently (not importing gen_levels.py logic).
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json','utf8'));

function verify(lv){
  const N = lv.N, dials = lv.dials, start = lv.start;
  // BFS over multisets via combinations_with_replacement equivalent
  const K = dials.length;
  const stateMin = {};
  const stateSolCount = {};
  const startKey = start.join(',');
  stateMin[startKey] = 0;
  stateSolCount[startKey] = new Set(['']);
  const maxP = 12;
  // enumerate non-decreasing dial sequences
  function rec(st, len, lastK, path){
    if(len > maxP) return;
    const key = st.join(',');
    if(!(key in stateMin) || stateMin[key] > len){
      stateMin[key] = len;
    }
    if(stateMin[key] === len){
      if(!(key in stateSolCount)) stateSolCount[key] = new Set();
      stateSolCount[key].add(path);
    }
    for(let k = lastK; k < K; k++){
      const ns = [(st[0]+dials[k][0])%N,(st[1]+dials[k][1])%N,(st[2]+dials[k][2])%N];
      rec(ns, len+1, k, path + k);
    }
  }
  // The recursion above overcounts paths; instead do bounded multiset enum directly:
  const sm2 = {}, ss2 = {};
  const sk = start.join(',');
  sm2[sk] = 0; ss2[sk] = new Set([[]]);
  // iterative by length
  function genCombos(K, maxLen){
    const results = [[]];
    for(let len=1; len<=maxLen; len++){
      const prev = results.filter(r=>r.length===len-1);
      for(const p of prev){
        const minK = p.length===0 ? 0 : p[p.length-1];
        for(let k=minK; k<K; k++) results.push([...p,k]);
      }
    }
    return results;
  }
  const combos = genCombos(K, maxP);
  for(const combo of combos){
    let st = start.slice();
    for(const k of combo){
      st = [(st[0]+dials[k][0])%N,(st[1]+dials[k][1])%N,(st[2]+dials[k][2])%N];
    }
    const key = st.join(',');
    const len = combo.length;
    if(!(key in sm2)){ sm2[key]=len; ss2[key]=new Set([combo.join('')]); }
    else if(sm2[key]===len){ ss2[key].add(combo.join('')); }
  }
  // find aligned targets
  const aligned = Object.keys(sm2).filter(k=>{const p=k.split(',').map(Number);return p[0]===p[1]&&p[1]===p[2]});
  if(aligned.length===0) return {valid:false, reason:'no aligned target reachable'};
  const best = Math.min(...aligned.map(k=>sm2[k]));
  let sols = new Set();
  for(const k of aligned){ if(sm2[k]===best){ for(const s of ss2[k]) sols.add(s); } }
  return { valid: true, best, unique: sols.size===1, numSols: sols.size };
}

let pass=0, fail=0;
levels.forEach((lv,i)=>{
  const r = verify(lv);
  const ok = r.valid && r.unique && r.best>=2;
  console.log(`L${(i+1).toString().padStart(2)} N=${lv.N} K=${lv.dials.length} opt=${r.best} unique=${r.unique} sols=${r.numSols} ${ok?'✅':'❌'}`);
  if(ok) pass++; else fail++;
});
console.log(`\n${pass}/${levels.length} UNIQUE+VALID`);
if(fail>0) process.exit(1);
