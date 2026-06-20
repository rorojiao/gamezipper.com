#!/usr/bin/env node
// INDEPENDENT verifier for consecutive-sudoku levels — separate solver implementation
// to cross-check the generator's uniqueness claims.
const fs=require('fs');
const data=JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

function verify(level){
  const N=level.N, g=level.puzzle.map(r=>r.slice());
  const sol=level.solution;
  const bars=new Set(level.bars.map(b=>b[0]+','+b[1]+'|'+b[2]+','+b[3]));
  // 1. solution must satisfy sudoku
  for(let r=0;r<N;r++){ const seen=new Set(); for(let c=0;c<N;c++){ if(seen.has(sol[r][c])) return {ok:false,reason:`row ${r} dup ${sol[r][c]}`}; seen.add(sol[r][c]); } }
  for(let c=0;c<N;c++){ const seen=new Set(); for(let r=0;r<N;r++){ if(seen.has(sol[r][c])) return {ok:false,reason:`col ${c} dup`}; seen.add(sol[r][c]); } }
  const [br,bc]=boxSize(N);
  for(let bi=0;bi<N;bi+=br)for(let bj=0;bj<N;bj+=bc){ const seen=new Set(); for(let i=0;i<br;i++)for(let j=0;j<bc;j++){ if(seen.has(sol[bi+i][bj+j])) return {ok:false,reason:`box dup`}; seen.add(sol[bi+i][bj+j]); } }
  // 2. givens must match solution
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){ if(g[r][c]!==0 && g[r][c]!==sol[r][c]) return {ok:false,reason:`given mismatch ${r},${c}`}; }
  // 3. bars must be consistent with solution
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(c+1<N){ const consec=Math.abs(sol[r][c]-sol[r][c+1])===1; const hasBar=bars.has(`${r},${c}|${r},${c+1}`); if(consec!==hasBar) return {ok:false,reason:`bar mismatch ${r},${c}-${r},${c+1}: consec=${consec} bar=${hasBar}`}; }
    if(r+1<N){ const consec=Math.abs(sol[r][c]-sol[r+1][c])===1; const hasBar=bars.has(`${r},${c}|${r+1},${c}`); if(consec!==hasBar) return {ok:false,reason:`bar mismatch ${r},${c}-${r+1},${c}`}; }
  }
  // 4. INDEPENDENT uniqueness solver (different style: candidates + DFS)
  const grid=g.map(r=>r.slice());
  const peers=[];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const p=new Set();
    for(let i=0;i<N;i++){ if(i!==c)p.add(r*N+i); if(i!==r)p.add(i*N+c); }
    const br0=Math.floor(r/br)*br,bc0=Math.floor(c/bc)*bc;
    for(let i=0;i<br;i++)for(let j=0;j<bc;j++){ const rr=br0+i,cc=bc0+j; if(rr!==r||cc!==c)p.add(rr*N+cc); }
    peers[r*N+c]=[...p];
  }
  function consecOK(r,c,v){
    const check=(r2,c2,key)=>{
      const nv=grid[r2][c2];
      if(nv===0) return true;
      const consec=Math.abs(v-nv)===1;
      return bars.has(key)===consec;
    };
    if(c+1<N && !check(r,c+1,`${r},${c}|${r},${c+1}`)) return false;
    if(c-1>=0 && !check(r,c-1,`${r},${c-1}|${r},${c}`)) return false;
    if(r+1<N && !check(r+1,c,`${r},${c}|${r+1},${c}`)) return false;
    if(r-1>=0 && !check(r-1,c,`${r-1},${c}|${r},${c}`)) return false;
    return true;
  }
  function canPlace(r,c,v){
    for(const p of peers[r*N+c]) if(grid[Math.floor(p/N)][p%N]===v) return false;
    return consecOK(r,c,v);
  }
  let solutions=0;
  function dfs(){
    if(solutions>=2) return;
    let mr=-1,mc=-1,mbest=null;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      if(grid[r][c]===0){
        const cand=[]; for(let v=1;v<=N;v++) if(canPlace(r,c,v)) cand.push(v);
        if(cand.length===0) return;
        if(mbest===null||cand.length<mbest.length){ mbest=cand; mr=r; mc=c; if(cand.length===1) break; }
      }
    }
    if(mr===-1){ solutions++; return; }
    for(const v of mbest){ grid[mr][mc]=v; dfs(); grid[mr][mc]=0; if(solutions>=2) return; }
  }
  dfs();
  return {ok:solutions===1, reason:solutions===1?'unique':`${solutions} solutions`, clues:level.puzzle.flat().filter(x=>x!==0).length, bars:level.bars.length};
}

let allOk=true;
let t0=Date.now();
for(const lvl of data.levels){
  const res=verify(lvl);
  const mark=res.ok?'✓':'✗';
  if(!res.ok) allOk=false;
  console.log(`${mark} ${lvl.tier.padEnd(10)} #${String(lvl.id).padStart(2)} N=${lvl.N} clues=${res.clues||lvl.clues} bars=${res.bars||lvl.bars.length} — ${res.reason||''}`);
}
console.log(`\n${allOk?'✅ ALL 27 LEVELS VERIFIED UNIQUE & VALID':'✗ FAILURES DETECTED'} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
process.exit(allOk?0:1);
