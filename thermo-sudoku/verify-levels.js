// Phase 6 verifier: parse embedded LEVELS from index.html, re-check:
//  (1) givens subset of solution, (2) thermos orthogonally-connected & strictly increasing in solution,
//  (3) base solution is a valid Sudoku (rows/cols/boxes), (4) UNIQUE solution via independent solver.
const fs=require('fs');
const path=require('path');

let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
let m=html.match(/var LEVELS = (\[[\s\S]*?\]);\s*\/\* ============ STATE/);
if(!m){ // fallback: match up to the next semicolon-newline
  m=html.match(/var LEVELS = (\[[\s\S]*?\]);/);
}
if(!m){console.error('FAIL: could not extract LEVELS'); process.exit(1);}
let LEVELS;
try{ LEVELS=JSON.parse(m[1]); }catch(e){ console.error('FAIL: LEVELS not valid JSON', e.message); process.exit(1); }
console.log('Extracted levels:', LEVELS.length);

function validGrid(G,n,br,bc){
  const rows=Array.from({length:n},()=>new Set()), cols=Array.from({length:n},()=>new Set());
  const boxes=Array.from({length:Math.ceil(n/br)+1},()=>Array.from({length:Math.ceil(n/bc)+1},()=>new Set()));
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const v=G[r][c]; if(v<1||v>n)return false;
    if(rows[r].has(v)||cols[c].has(v))return false;
    if(boxes[Math.floor(r/br)][Math.floor(c/bc)].has(v))return false;
    rows[r].add(v);cols[c].add(v);boxes[Math.floor(r/br)][Math.floor(c/bc)].add(v);
  }
  return true;
}
function adj(r,c,n){const o=[];[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{const nr=r+dr,nc=c+dc;if(nr>=0&&nc>=0&&nr<n&&nc<n)o.push([nr,nc]);});return o;}
function thermoValid(t,sol,n){
  if(t.length<2)return false;
  for(let i=0;i<t.length;i++){
    if(i>0){
      const [pr,pc]=t[i-1],[r,c]=t[i];
      if(Math.abs(pr-r)+Math.abs(pc-c)!==1)return false; // not adjacent
      if(sol[r][c]<=sol[pr][pc])return false; // not strictly increasing
    }
  }
  return true;
}

// Independent thermo-aware Sudoku solver, count solutions up to limit
function countSolutions(puzzle,n,br,bc,thermos,limit=2,cap=1500000){
  const pos={}; thermos.forEach((t,ti)=>t.forEach((cell,pi)=>{pos[cell[0]+','+cell[1]]=[ti,pi];}));
  const grid=puzzle.map(r=>r.slice());
  const rowc=Array.from({length:n},()=>new Set(range(n))), colc=Array.from({length:n},()=>new Set(range(n)));
  const boxc=Array.from({length:n},()=>new Set(range(n)));
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){const v=grid[r][c]; if(v){rowc[r].delete(v);colc[c].delete(v);boxc[boxId(r,c,br,bc)].delete(v);}}
  function range(n){const o=[];for(let i=1;i<=n;i++)o.push(i);return o;}
  let sols=0,nodes=0,capped=false;
  function thermoOK(r,c,v){
    const inf=pos[r+','+c]; if(!inf)return true;
    const [ti,pi]=inf; const t=thermos[ti];
    if(pi>0){const [pr,pc]=t[pi-1]; if(grid[pr][pc]&&grid[pr][pc]>=v)return false;}
    if(pi<t.length-1){const [nr,nc]=t[pi+1]; if(grid[nr][nc]&&grid[nr][nc]<=v)return false;}
    return true;
  }
  function solve(){
    if(capped||sols>=limit)return;
    nodes++; if(nodes>cap){capped=true;return;}
    let best=null,bestLen=99,bestCand=null;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      if(grid[r][c])continue;
      let cand=[];
      rowc[r].forEach(v=>{ if(colc[c].has(v)&&boxc[boxId(r,c,br,bc)].has(v)&&thermoOK(r,c,v))cand.push(v);});
      if(cand.length<bestLen){bestLen=cand.length;best=[r,c];bestCand=cand; if(bestLen===0)break; if(bestLen===1)break;}
    }
    if(!best){sols++;return;}
    if(bestLen===0)return;
    const [r,c]=best; const bid=boxId(r,c,br,bc);
    for(const v of bestCand){
      grid[r][c]=v; rowc[r].delete(v);colc[c].delete(v);boxc[bid].delete(v);
      solve();
      grid[r][c]=0; rowc[r].add(v);colc[c].add(v);boxc[bid].add(v);
      if(sols>=limit||capped)return;
    }
  }
  solve();
  return capped?-1:sols;
}
function boxId(r,c,br,bc){return Math.floor(r/br)*(Math.ceil(0)+ (Math.floor(c/bc)));} // placeholder fixed below

// proper boxId
function boxIdx(r,c,br,bc,nbc){return Math.floor(r/br)*nbc+Math.floor(c/bc);}

// re-implement countSolutions with proper box indexing
function countSolutions2(puzzle,n,br,bc,thermos,limit=2,cap=2000000){
  const nbc=Math.floor(n/bc), nbr=Math.floor(n/br);
  const pos={}; thermos.forEach((t,ti)=>t.forEach((cell,pi)=>{pos[cell[0]+','+cell[1]]=[ti,pi];}));
  const grid=puzzle.map(r=>r.slice());
  const rowc=Array.from({length:n},()=>{const s=new Set();for(let i=1;i<=n;i++)s.add(i);return s;});
  const colc=Array.from({length:n},()=>{const s=new Set();for(let i=1;i<=n;i++)s.add(i);return s;});
  const boxc=Array.from({length:nbr*nbc},()=>{const s=new Set();for(let i=1;i<=n;i++)s.add(i);return s;});
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){const v=grid[r][c]; if(v){rowc[r].delete(v);colc[c].delete(v);boxc[boxIdx(r,c,br,bc,nbc)].delete(v);}}
  let sols=0,nodes=0,capped=false;
  function thermoOK(r,c,v){
    const inf=pos[r+','+c]; if(!inf)return true;
    const [ti,pi]=inf; const t=thermos[ti];
    if(pi>0){const [pr,pc]=t[pi-1]; if(grid[pr][pc]&&grid[pr][pc]>=v)return false;}
    if(pi<t.length-1){const [nr,nc]=t[pi+1]; if(grid[nr][nc]&&grid[nr][nc]<=v)return false;}
    return true;
  }
  function solve(){
    if(capped||sols>=limit)return;
    nodes++; if(nodes>cap){capped=true;return;}
    let best=null,bestLen=99,bestCand=null;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      if(grid[r][c])continue;
      let cand=[];
      rowc[r].forEach(v=>{ if(colc[c].has(v)&&boxc[boxIdx(r,c,br,bc,nbc)].has(v)&&thermoOK(r,c,v))cand.push(v);});
      if(cand.length<bestLen){bestLen=cand.length;best=[r,c];bestCand=cand; if(bestLen===0)break; if(bestLen===1)break;}
    }
    if(!best){sols++;return;}
    if(bestLen===0)return;
    const [r,c]=best; const bid=boxIdx(r,c,br,bc,nbc);
    for(const v of bestCand){
      grid[r][c]=v; rowc[r].delete(v);colc[c].delete(v);boxc[bid].delete(v);
      solve();
      grid[r][c]=0; rowc[r].add(v);colc[c].add(v);boxc[bid].add(v);
      if(sols>=limit||capped)return;
    }
  }
  solve();
  return capped?-1:sols;
}

let fail=0;
LEVELS.forEach((L,i)=>{
  const n=L.n, br=L.boxR, bc=L.boxC;
  const errs=[];
  if(!validGrid(L.solution,n,br,bc))errs.push('solution not valid sudoku');
  // givens subset
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){ if(L.givens[r][c] && L.givens[r][c]!==L.solution[r][c]) errs.push('given mismatch at '+r+','+c);}
  // thermos
  (L.thermos||[]).forEach((t,ti)=>{ if(!thermoValid(t,L.solution,n)) errs.push('thermo '+ti+' invalid (adjacency/increasing)'); });
  // uniqueness
  const cnt=countSolutions2(L.givens,n,br,bc,L.thermos||[],2);
  if(cnt!==1) errs.push('solutions='+cnt+' (NOT UNIQUE)');
  if(errs.length){ fail++; console.log('❌ L'+(i+1)+' ['+L.tier+'] '+n+'x'+n+': '+errs.join('; ')); }
  else console.log('✅ L'+(i+1)+' ['+L.tier+'] '+n+'x'+n+' clues='+countGivens(L)+' thermos='+L.thermos.length+' UNIQUE ok');
});
function countGivens(L){let c=0;L.givens.forEach(r=>r.forEach(v=>{if(v)c++;}));return c;}
console.log('\n=== Phase 6: '+(LEVELS.length-fail)+'/'+LEVELS.length+' levels fully verified ===');
if(fail>0){console.error('VERIFICATION FAILED'); process.exit(1);} else {console.log('ALL LEVELS VERIFIED UNIQUE + VALID');}
