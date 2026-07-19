// Independent Node verifier for Compass levels.
// Re-derives N/E/S/W counts from the solution and checks every compass.
// Also checks: whites connected, blacks non-adjacent.
const fs = require('fs');
const path = require('path');
const levels = JSON.parse(fs.readFileSync(path.join(__dirname, '_levels.json'),'utf8'));

let pass = 0, fail = 0;
levels.forEach((lvl, idx) => {
  const R = lvl.rows, C = lvl.cols;
  // build grid from sol
  const grid = Array.from({length:R},()=>Array(C).fill(0));
  lvl.sol.forEach(([r,c])=>{ grid[r][c]=1; });
  const errs = [];
  // 1. blacks non-adjacent (orthogonal)
  for (let r=0;r<R;r++) for (let c=0;c<C;c++){
    if (grid[r][c]!==1) continue;
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if (0<=nr&&nr<R&&0<=nc&&nc<C&&grid[nr][nc]===1){
        errs.push(`adjacent black at (${r},${c})-(${nr},${nc})`); break;
      }
    }
  }
  // 2. whites connected (BFS)
  const whites=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++) if(grid[r][c]===0) whites.push([r,c]);
  if (whites.length){
    const seen=new Set([whites[0].join(',')]);
    const st=[whites[0]];
    while(st.length){
      const [r,c]=st.pop();
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nr=r+dr,nc=c+dc,k=nr+','+nc;
        if(0<=nr&&nr<R&&0<=nc&&nc<C&&grid[nr][nc]===0&&!seen.has(k)){seen.add(k);st.push([nr,nc]);}
      }
    }
    if(seen.size!==whites.length) errs.push(`whites not connected (${seen.size}/${whites.length})`);
  }
  // 3. compass counts
  const cnt=(r,c,dr,dc)=>{let n=0;let nr=r+dr,nc=c+dc;while(0<=nr&&nr<R&&0<=nc&&nc<C){if(grid[nr][nc]===1)n++;nr+=dr;nc+=dc;}return n;};
  lvl.compasses.forEach((cp,ci)=>{
    const N=cnt(cp.r,cp.c,-1,0),E=cnt(cp.r,cp.c,0,1),S=cnt(cp.r,cp.c,1,0),W=cnt(cp.r,cp.c,0,-1);
    if(N!==cp.n)errs.push(`compass#${ci}@(${cp.r},${cp.c}) N:${cp.n}!=${N}`);
    if(E!==cp.e)errs.push(`compass#${ci}@(${cp.r},${cp.c}) E:${cp.e}!=${E}`);
    if(S!==cp.s)errs.push(`compass#${ci}@(${cp.r},${cp.c}) S:${cp.s}!=${S}`);
    if(W!==cp.w)errs.push(`compass#${ci}@(${cp.r},${cp.c}) W:${cp.w}!=${W}`);
  });
  if(errs.length){fail++;console.log(`FAIL L${idx+1} [${lvl.tier}] ${R}x${C}: ${errs.join('; ')}`);}
  else{pass++;console.log(`PASS L${idx+1} [${lvl.tier}] ${R}x${C} — ${lvl.compasses.length} compasses, ${lvl.sol.length} black, all OK`);}
});
console.log(`\nRESULT: ${pass}/${levels.length} pass, ${fail} fail`);
process.exit(fail>0?1:0);
