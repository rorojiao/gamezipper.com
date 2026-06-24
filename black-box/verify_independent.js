// Independent verifier for black-box/levels.json (iterative + fast).
// Independent from gen.js: named-direction model + 2D boolean array + explicit
// forward/forward-left/forward-right via named rotations (gen.js: numeric dirs + flat Uint8Array).
// Checks: (1) clues recomputed from atoms match stored clues,
//         (2) outcomes well-formed, (3) detour pairing symmetric, (4) uniqueness == 1.

const fs=require('fs');
const levels=JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));

// direction model: each dir names its dx,dy and its left/right neighbor dir name
const M={
  up:   {dx:0,dy:-1,L:'left',R:'right'},
  right:{dx:1,dy:0, L:'up',   R:'down'},
  down: {dx:0,dy:1, L:'right',R:'left'},
  left: {dx:-1,dy:0,L:'down', R:'up'},
};

function buildEntries(N){
  const e=[];
  for(let x=1;x<=N;x++) e.push({x,y:0,dir:'down'});
  for(let y=1;y<=N;y++) e.push({x:N+1,y,dir:'left'});
  for(let x=N;x>=1;x--) e.push({x,y:N+1,dir:'up'});
  for(let y=N;y>=1;y--) e.push({x:0,y,dir:'right'});
  return e;
}
const inside=(N,x,y)=>x>=1&&x<=N&&y>=1&&y<=N;

// forward/left/right cell relative to (x,y,dirname)
function cellAt(occ,N,x,y,dirname,which){
  const d=M[dirname];
  let fx=x+d.dx, fy=y+d.dy;
  if(which==='L'){ const l=M[d.L]; fx+=l.dx; fy+=l.dy; }
  else if(which==='R'){ const r=M[d.R]; fx+=r.dx; fy+=r.dy; }
  return inside(N,fx,fy)&&occ[fy][fx];
}

// fire from entry port idx -> HIT=-1, REFLECT=-2, or exit idx
function fire(occ,N,entries,idx){
  const e=entries[idx];
  // instant hit (first interior cell forward)
  if(cellAt(occ,N,e.x,e.y,e.dir,'F')) return -1;
  // instant reflect (forward-left or forward-right diagonal)
  if(cellAt(occ,N,e.x,e.y,e.dir,'L')||cellAt(occ,N,e.x,e.y,e.dir,'R')) return -2;
  let x=e.x+M[e.dir].dx, y=e.y+M[e.dir].dy; // step in
  let dir=e.dir, guard=0;
  while(guard++<8*N*N+64){
    if(!inside(N,x,y)){
      const exi=entries.findIndex(en=>en.x===x&&en.y===y);
      return exi===-1?-2:(exi===idx?-2:exi);
    }
    if(occ[y][x]) return -1; // safety
    if(cellAt(occ,N,x,y,dir,'F')) return -1;            // hit
    if(cellAt(occ,N,x,y,dir,'L')){ dir=M[dir].R; continue; } // CW away from left
    if(cellAt(occ,N,x,y,dir,'R')){ dir=M[dir].L; continue; } // CCW away from right
    x+=M[dir].dx; y+=M[dir].dy;
  }
  return -2; // cycle
}

function computeClues(occ,N,entries){ return entries.map((_,i)=>fire(occ,N,entries,i)); }

// fast uniqueness with early-bail (port order: HIT first)
function countUnique(N,k,target,entries){
  const cells=[]; for(let y=1;y<=N;y++) for(let x=1;x<=N;x++) cells.push([x,y]);
  const n=cells.length; let count=0;
  const order=[...target.keys()].sort((a,b)=>{
    const ra=target[a]===-1?0:(target[a]===-2?1:2);
    const rb=target[b]===-1?0:(target[b]===-2?1:2);
    return ra-rb;
  });
  const idx=[...Array(k)].map((_,i)=>i);
  const occ=Array.from({length:N+2},()=>new Array(N+2).fill(false));
  while(true){
    for(let y=0;y<N+2;y++) for(let x=0;x<N+2;x++) occ[y][x]=false;
    for(let j=0;j<k;j++){ const c=cells[idx[j]]; occ[c[1]][c[0]]=true; }
    let ok=true;
    for(let o=0;o<order.length;o++){ const p=order[o]; if(fire(occ,N,entries,p)!==target[p]){ ok=false; break; } }
    if(ok){ count++; if(count>=2) return count; }
    let p=k-1; while(p>=0&&idx[p]===n-k+p) p--;
    if(p<0) break; idx[p]++; for(let q=p+1;q<k;q++) idx[q]=idx[q-1]+1;
  }
  return count;
}

let pass=0;
for(const lvl of levels){
  const {N,k,atoms,clues,idx}=lvl;
  const entries=buildEntries(N);
  const occ=Array.from({length:N+2},()=>new Array(N+2).fill(false));
  for(const a of atoms) occ[a[1]][a[0]]=true;
  const recomputed=computeClues(occ,N,entries);
  const cluesMatch=recomputed.every((v,i)=>v===clues[i]);
  const wellFormed=clues.every(c=>c===-1||c===-2||(c>=0&&c<entries.length));
  let pairOK=true;
  for(let i=0;i<clues.length;i++){ if(clues[i]>=0&&clues[clues[i]]!==i){ pairOK=false; break; } }
  const uniq=countUnique(N,k,clues,entries);
  if(cluesMatch&&wellFormed&&pairOK&&uniq===1){ pass++; console.log(`✅ #${idx} ${lvl.tier} ${N}x${N} k=${k} clues✓ pair✓ unique=${uniq}`); }
  else { console.log(`❌ #${idx} ${lvl.tier} cluesMatch=${cluesMatch} wellFormed=${wellFormed} pairOK=${pairOK} unique=${uniq}`); pass=-999; break; }
}
console.log(`\n${pass}/${levels.length} levels verified UNIQUE + VALID (independent sim)`);
if(pass!==levels.length){ console.error('VERIFICATION FAILED'); process.exit(1); }
console.log('ALL CHECKS PASSED — clues consistent, paired, and uniquely solvable.');
