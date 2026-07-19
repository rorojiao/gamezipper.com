// In-engine verification: extract LEVELS from the actual index.html and
// run BFS using the EXACT game rules (state=[(s0+d0)%N, (s1+d1)%N, (s2+d2)%N],
// win: state[0]===state[1]&&state[1]===state[2]).
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('sextant-celestial');
console.log(`Extracted ${LEVELS.length} levels from index.html`);

function verifyEngine(L){
  const N=L.n, dials=L.d, start=L.s;
  const K=dials.length;
  const sm={}, ss={};
  const sk=start.join(',');
  sm[sk]=0; ss[sk]=new Set(['']);
  // bounded non-decreasing dial-sequence enumeration (multisets)
  function rec(st, len, lastK, path){
    const key=st.join(',');
    if(!(key in sm)||sm[key]>len){sm[key]=len;}
    if(sm[key]===len){
      if(!(key in ss))ss[key]=new Set();
      ss[key].add(path);
    }
    if(len>=12)return;
    for(let k=lastK;k<K;k++){
      const ns=[(st[0]+dials[k][0])%N,(st[1]+dials[k][1])%N,(st[2]+dials[k][2])%N];
      rec(ns,len+1,k,path+k);
    }
  }
  rec(start.slice(),0,0,'');
  const aligned=Object.keys(sm).filter(k=>{const p=k.split(',').map(Number);return p[0]===p[1]&&p[1]===p[2]});
  if(aligned.length===0)return{solvable:false};
  const best=Math.min(...aligned.map(k=>sm[k]));
  let sols=new Set();
  for(const k of aligned){if(sm[k]===best){for(const s of ss[k])sols.add(s);}}
  return {solvable:true, best, unique:sols.size===1};
}

let pass=0;
LEVELS.forEach((L,i)=>{
  const r=verifyEngine(L);
  const ok=r.solvable;
  console.log(`L${(i+1).toString().padStart(2)} N=${L.n} solvable=${r.solvable} opt=${r.best||'-'} ${ok?'✅':'❌'}`);
  if(ok)pass++;
});
console.log(`\n${pass}/${LEVELS.length} SOLVABLE (in-engine exact rules)`);
if(pass<LEVELS.length)process.exit(1);
