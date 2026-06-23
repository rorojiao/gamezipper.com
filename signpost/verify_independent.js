// Independent Signpost verifier (different implementation from gen.py)
// Confirms each level has exactly ONE valid 1..N chain under the arrow rule.
const fs = require('fs');
const DIRS = [[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1]];

function rayCells(cell, d, w, h){
  const r0=Math.floor(cell/w), c0=cell%w; const [dr,dc]=DIRS[d]; const out=[];
  let s=1;
  while(true){ const nr=r0+dr*s, nc=c0+dc*s;
    if(!(nr>=0&&nr<h&&nc>=0&&nc<w)) break; out.push(nr*w+nc); s++; }
  return out;
}

function countSolutions(path, arrows, givens, w, h, cap=2){
  const n=w*h;
  const givenNum=new Map();              // cell -> position (1-based)
  for(let pos=1;pos<=n;pos++){ const cell=path[pos-1]; if(givens.has(cell)) givenNum.set(cell,pos); }
  const startCell=path[0], endCell=path[n-1];
  const rays=new Array(n);
  for(let cell=0;cell<n;cell++){ rays[cell]= arrows[cell]>=0 ? rayCells(cell,arrows[cell],w,h) : []; }
  const used=new Array(n).fill(false);
  let sols=0;

  function deadEndOk(){
    for(let cell=0;cell<n;cell++){
      if(used[cell]||cell===endCell) continue;
      let ok=false;
      for(const nb of rays[cell]){ if(!used[nb]){ok=true;break;} }
      if(!ok) return false;
    }
    return true;
  }
  function rec(cell,pos,remaining){
    if(sols>=cap) return;
    if(givenNum.has(cell) && givenNum.get(cell)!==pos) return;
    used[cell]=true; remaining--;
    if(remaining===0){ if(cell===endCell) sols++; used[cell]=false; return; }
    if(!deadEndOk()){ used[cell]=false; return; }
    for(const nb of rays[cell]){
      if(used[nb]) continue;
      if(givenNum.has(nb) && givenNum.get(nb)!==pos+1) continue;
      rec(nb,pos+1,remaining);
      if(sols>=cap) break;
    }
    used[cell]=false;
  }
  rec(startCell,1,n);
  return sols;
}

function main(){
  const data=JSON.parse(fs.readFileSync('levels.json','utf8'));
  const levels=data.levels;
  let allOk=true, bad=[];
  // validate structure + uniqueness
  for(let i=0;i<levels.length;i++){
    const L=levels[i]; const {w,h,path,arrows,givens,tier}=L; const n=w*h;
    // structural checks
    const errs=[];
    if(path.length!==n) errs.push(`path len ${path.length}!=${n}`);
    if(new Set(path).size!==n) errs.push('path not a permutation');
    if(arrows.length!==n) errs.push('arrows len');
    // last path cell must have no arrow (-1)
    if(arrows[path[n-1]]!==-1) errs.push('end cell has arrow');
    // every non-end cell arrow must point along a straight line to its successor
    for(let pos=1;pos<n;pos++){
      const cell=path[pos-1], nxt=path[pos];
      const dr=Math.floor(nxt/w)-Math.floor(cell/w), dc=(nxt%w)-(cell%w);
      const d=arrows[cell];
      const [edr,edc]=DIRS[d];
      // direction must match sign and dr/dc must be on the ray
      const ok = (d>=0) && (Math.sign(dr)===Math.sign(edr)||edr===0&&dr===0) && (Math.sign(dc)===Math.sign(edc)||edc===0&&dc===0) && (edr!==0?Math.abs(dr)%Math.abs(edr||1)===0||Math.abs(dr)===Math.abs(dr):true) && ((edr===0)?dr===0:true) && ((edc===0)?dc===0:true);
      if(!ok){ errs.push(`arrow mismatch pos ${pos}`); break; }
    }
    // givens must include start (1) and end (N)
    const gset=new Set(givens);
    if(!gset.has(path[0])) errs.push('start not given');
    if(!gset.has(path[n-1])) errs.push('end not given');
    const c=countSolutions(path,arrows,gset,w,h);
    if(c!==1) errs.push(`solutions=${c}`);
    if(errs.length){ allOk=false; bad.push({i,tier,errs}); }
    process.stdout.write('.');
  }
  console.log('');
  console.log(`Verified ${levels.length} levels: ${bad.length===0?'ALL UNIQUE + VALID ✅':(bad.length+' FAILED ❌')}`);
  if(bad.length){
    for(const b of bad) console.log(`  #${b.i} ${b.tier}: ${b.errs.join('; ')}`);
    process.exit(1);
  }
}
main();
