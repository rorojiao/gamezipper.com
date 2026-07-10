/**
 * Yin-Yang — Independent Node.js Verifier
 * Reimplements the rules independently from the Python generator:
 *   1. Solution board: white group connected, black group connected, no mono 2x2.
 *   2. All clues match the solution.
 *   3. Puzzle (clues only) has EXACTLY ONE solution.
 */
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function connected(grid, R, C, color) {
  const cells = [];
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) if (grid[r][c]===color) cells.push([r,c]);
  if (cells.length===0) return false;
  const seen = new Set();
  const key=(r,c)=>r*C+c;
  const st=[cells[0]]; seen.add(key(cells[0][0],cells[0][1]));
  while(st.length){
    const [r,c]=st.pop();
    for(const [dr,dc] of DIRS){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===color&&!seen.has(key(nr,nc))){
        seen.add(key(nr,nc)); st.push([nr,nc]);
      }
    }
  }
  return seen.size===cells.length;
}

function monoBlock(grid,R,C){
  for(let r=0;r<R-1;r++) for(let c=0;c<C-1;c++){
    const v=grid[r][c];
    if(grid[r][c+1]===v&&grid[r+1][c]===v&&grid[r+1][c+1]===v) return true;
  }
  return false;
}

function boardValid(grid,R,C){
  if(monoBlock(grid,R,C)) return false;
  return connected(grid,R,C,0)&&connected(grid,R,C,1);
}

// Independent solver: propagation (2x2) + connectivity prune + backtracking.
function countSolutions(R,C,clues,cap=2,nodeLimit=3000000){
  const grid=Array.from({length:R},()=>Array(C).fill(null));
  for(const [k,v] of Object.entries(clues)){const [r,c]=k.split(',').map(Number); grid[r][c]=v;}
  let sol=0, nodes=0;

  function propagate(queue){
    const added=[];
    while(queue.length){
      const [r,c]=queue.shift();
      for(let dr=-1;dr<=0;dr++) for(let dc=-1;dc<=0;dc++){
        const r0=r+dr,c0=c+dc;
        if(r0<0||c0<0||r0>=R-1||c0>=C-1) continue;
        const cells=[[r0,c0],[r0,c0+1],[r0+1,c0],[r0+1,c0+1]];
        const vals=cells.map(([a,b])=>grid[a][b]);
        const filled=vals.filter(v=>v!==null);
        if(filled.length===4&&filled[0]===filled[1]&&filled[1]===filled[2]&&filled[2]===filled[3]) return {ok:false,added};
        const noneCount=vals.filter(v=>v===null).length;
        if(noneCount===1){
          const nn=vals.filter(v=>v!==null);
          if(nn[0]===nn[1]&&nn[1]===nn[2]){
            const idx=vals.indexOf(null);
            const [er,ec]=cells[idx];
            grid[er][ec]=1-nn[0]; added.push([er,ec]); queue.push([er,ec]);
          }
        }
      }
    }
    return {ok:true,added};
  }

  function connFeasible(){
    for(const color of [0,1]){
      const placed=[];
      for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(grid[r][c]===color) placed.push([r,c]);
      if(placed.length===0) continue;
      const seen=new Set(); const key=(r,c)=>r*C+c;
      const st=[placed[0]]; seen.add(key(placed[0][0],placed[0][1]));
      while(st.length){
        const [r,c]=st.pop();
        for(const [dr,dc] of DIRS){
          const nr=r+dr,nc=c+dc;
          if(nr>=0&&nr<R&&nc>=0&&nc<C&&!seen.has(key(nr,nc))&&(grid[nr][nc]===color||grid[nr][nc]===null)){
            seen.add(key(nr,nc)); st.push([nr,nc]);
          }
        }
      }
      for(const [r,c] of placed) if(!seen.has(key(r,c))) return false;
    }
    return true;
  }

  function pick(){
    let best=null;
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){
      if(grid[r][c]===null){
        let adj=0;
        for(const [dr,dc] of DIRS){const nr=r+dr,nc=c+dc; if(nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]!==null) adj++;}
        if(adj>0&&(best===null||adj>best[0])) best=[adj,r,c];
      }
    }
    if(best) return [best[1],best[2]];
    for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(grid[r][c]===null) return [r,c];
    return null;
  }

  function finalOk(){ return boardValid(grid,R,C); }

  const seeds=[];
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(grid[r][c]!==null) seeds.push([r,c]);
  const init=propagate(seeds.slice());
  if(!init.ok){ for(const [r,c] of init.added) grid[r][c]=null; return {sol:0,nodes}; }

  function bt(){
    if(sol>=cap) return;
    nodes++; if(nodes>nodeLimit) return;
    if(!connFeasible()) return;
    const cell=pick();
    if(cell===null){ if(finalOk()) sol++; return; }
    const [r,c]=cell;
    for(const v of [0,1]){
      grid[r][c]=v;
      const {ok,added}=propagate([[r,c]]);
      if(ok) bt();
      for(const [rr,cc] of added) grid[rr][cc]=null;
      grid[r][c]=null;
      if(sol>=cap) return;
    }
  }
  bt();
  return {sol,nodes};
}

console.log('\n=== Yin-Yang Independent Verification ===');
console.log('Total levels:', data.levels.length, '\n');
let allPass=true, checked=0;
for(const lv of data.levels){
  const {rows:R,cols:C,solution,clues,level}=lv;
  // 1. solution valid
  const bv=boardValid(solution,R,C);
  // 2. clues match solution
  let cluesMatch=true;
  for(const [k,v] of Object.entries(clues)){
    const [r,c]=k.split(',').map(Number);
    if(solution[r][c]!==v){ cluesMatch=false; break; }
  }
  // 3. unique solution
  const {sol}=countSolutions(R,C,clues,2,3000000);
  const unique = sol===1;
  const ok = bv&&cluesMatch&&unique;
  if(!ok) allPass=false;
  checked++;
  console.log(`  ${ok?'✅':'❌'} L${level} ${R}x${C} ${lv.difficulty} — ${Object.keys(clues).length} clues — board:${bv?'OK':'FAIL'} clues:${cluesMatch?'OK':'FAIL'} unique:${unique?'OK':('FAIL('+sol+')')}`);
}
console.log(`\n=== RESULT: ${allPass?('ALL '+checked+' LEVELS VALID ✅'):'SOME FAILED ❌'} ===`);
process.exit(allPass?0:1);
