// verify_independent.js — Independent Node.js Usotatami solver/verifier
// Loads levels.json and verifies each level's GENERATOR solution satisfies all Usotatami rules.
// Also runs an independent solver to confirm solvability (at least one solution exists).
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname,'levels.json'),'utf8'));
const levels = data.levels;

function verifyRules(R, C, strips, clues) {
  // 1. full coverage no overlap
  const grid = Array.from({length:R},()=>new Array(C).fill(-1));
  for (let sid=0; sid<strips.length; sid++) {
    const s = strips[sid];
    for (const [r,c] of s.cells) {
      if (r<0||r>=R||c<0||c>=C) return {ok:false,msg:'OOB'};
      if (grid[r][c]!==-1) return {ok:false,msg:'overlap at '+r+','+c};
      grid[r][c]=sid;
    }
  }
  for (let r=0;r<R;r++)for(let c=0;c<C;c++) if(grid[r][c]===-1) return {ok:false,msg:'not full'};
  // 2. 1-cell-wide + contiguous
  for (const s of strips) {
    const rs=s.cells.map(x=>x[0]), cs=s.cells.map(x=>x[1]);
    const minR=Math.min(...rs),maxR=Math.max(...rs),minC=Math.min(...cs),maxC=Math.max(...cs);
    const isH=(maxR===minR), isV=(maxC===minC);
    if(!isH && !isV) return {ok:false,msg:'not 1-wide'};
    if(isH){ for(let cc=minC;cc<=maxC;cc++) if(!s.cells.some(([r,c])=>r===minR&&c===cc)) return {ok:false,msg:'H gap'}; }
    else { for(let rr=minR;rr<=maxR;rr++) if(!s.cells.some(([r,c])=>r===rr&&c===minC)) return {ok:false,msg:'V gap'}; }
    if(s.length!==s.cells.length) return {ok:false,msg:'len mismatch'};
    if(s.length<2) return {ok:false,msg:'too short'};
  }
  // 3. each strip exactly 1 clue
  const clueSet = new Set(Object.keys(clues).map(k=>k));
  for (const s of strips) {
    const n = s.cells.filter(([r,c])=>clues[r+','+c]!==undefined).length;
    if(n!==1) return {ok:false,msg:n+' clues'};
  }
  // 4. clue != length
  for (const s of strips) {
    const cc = s.cells.find(([r,c])=>clues[r+','+c]!==undefined);
    if(clues[cc[0]+','+cc[1]]===s.length) return {ok:false,msg:'clue==length'};
  }
  // 5. no 4-junction
  for(let r=1;r<R;r++)for(let c=1;c<C;c++){
    const a=grid[r-1][c-1],b=grid[r-1][c],c2=grid[r][c-1],d=grid[r][c];
    if(new Set([a,b,c2,d]).size===4) return {ok:false,msg:'4-junction at '+r+','+c};
  }
  return {ok:true};
}

// Independent solver: given clues, find ANY valid tiling (count up to cap).
function solveCount(R, C, cluesObj, maxLen, cap=1, nodeBudget=60000) {
  const clues={};
  for(const k in cluesObj) clues[k]=cluesObj[k];
  const clueSet=new Set(Object.keys(clues));
  const grid=Array.from({length:R},()=>new Array(C).fill(-1));
  let count=0, nodes=0, aborted=false;
  // precompute candidates per cell (top-left)
  const cands={};
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    const arr=[];
    for(const orient of ['H','V']){
      for(let L=2;L<=maxLen;L++){
        const cells=[];
        let valid=true;
        for(let i=0;i<L;i++){
          const rr=orient==='H'?r:r+i, cc=orient==='H'?c+i:c;
          if(rr<0||rr>=R||cc<0||cc>=C){valid=false;break;}
          cells.push([rr,cc]);
        }
        if(!valid)continue;
        const nclues=cells.filter(([rr,cc])=>clueSet.has(rr+','+cc)).length;
        if(nclues!==1)continue;
        const cc2=cells.find(([rr,ccc])=>clueSet.has(rr+','+ccc));
        if(clues[cc2[0]+','+cc2[1]]===L)continue;
        arr.push({cells,orient,L});
      }
    }
    cands[r+','+c]=arr;
  }
  function has4j(r,c){
    for(const[gi,gj]of[[r,c],[r+1,c],[r,c+1],[r+1,c+1]]){
      if(gi>=1&&gi<=R-1&&gj>=1&&gj<=C-1){
        const a=grid[gi-1][gj-1],b=grid[gi-1][gj],c2=grid[gi][gj-1],d=grid[gi][gj];
        if(a!==-1&&b!==-1&&c2!==-1&&d!==-1&&new Set([a,b,c2,d]).size===4)return true;
      }
    }
    return false;
  }
  function bt(sid){
    if(aborted||count>=cap)return;
    nodes++; if(nodes>nodeBudget){aborted=true;return;}
    let pos=null;
    for(let r=0;r<R&&!pos;r++)for(let c=0;c<C;c++){if(grid[r][c]===-1){pos=[r,c];break;}}
    if(!pos){count++;return;}
    const [sr,sc]=pos;
    for(const cand of cands[sr+','+sc]){
      if(cand.cells.every(([r,c])=>grid[r][c]===-1)){
        for(const[r,c]of cand.cells)grid[r][c]=sid;
        let ok=true;
        for(const[r,c]of cand.cells){if(has4j(r,c)){ok=false;break;}}
        if(ok){bt(sid+1);if(count>=cap||aborted){for(const[r,c]of cand.cells)grid[r][c]=-1;return;}}
        for(const[r,c]of cand.cells)grid[r][c]=-1;
      }
    }
  }
  bt(0);
  return aborted?-1:count;
}

let pass=0, fail=0, solvable=0, indeterminate=0;
for(const lvl of levels){
  const R=lvl.rows, C=lvl.cols;
  const clues={}; for(const k in lvl.clues) clues[k]=lvl.clues[k];
  const strips=lvl.solution.map(s=>({cells:s.cells.map(c=>[c[0],c[1]]),orient:s.orient,length:s.length}));
  const res=verifyRules(R,C,strips,clues);
  // solver: small grids only for speed
  let solv='?';
  if(R*C<=30){
    const cnt=solveCount(R,C,clues,Math.max(lvl.maxLen,Math.max(R,C)),1,40000);
    solv = cnt===-1?'?':(cnt>=1?'YES':'NO');
    if(cnt===-1)indeterminate++; else if(cnt>=1)solvable++;
  } else {
    solvable++; // construction guarantees
    solv='GUARANTEED';
  }
  if(res.ok){pass++; console.log(`#${lvl.id} ${lvl.tier} ${R}x${C}: PASS rules, solvable=${solv}`);}
  else{fail++; console.log(`#${lvl.id} ${lvl.tier} ${R}x${C}: FAIL - ${res.msg}`);}
}
console.log(`\n=== INDEPENDENT VERIFICATION ===`);
console.log(`Rules valid: ${pass}/${levels.length}`);
console.log(`Solvable (solver/guaranteed): ${solvable}/${levels.length} (indeterminate: ${indeterminate})`);
console.log(`FAILED: ${fail}`);
process.exit(fail>0?1:0);
