// Rekuto — Independent Node.js solver verification (Method 2 of 3).
// Re-derives the solution from clues alone (no peeking at level.solution) and confirms UNIQUE.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function countSolutions(H, W, clues, cap=2, nodeBudget=300000) {
  const clueAt = {}; const clueCells = new Set();
  for (const [r,c,v] of clues) { clueAt[r+','+c]=v; clueCells.add(r+','+c); }
  const grid = Array.from({length:H}, ()=>Array(W).fill(false));
  let nsol=0, nodes=0;
  function rectsFrom(r,c) {
    const res=[];
    for (let h=1; h<=H-r; h++) {
      for (let w=1; w<=W-c; w++) {
        const r2=r+h-1, c2=c+w-1;
        let cnt=0, cv=null;
        for (let rr=r; rr<=r2; rr++)
          for (let cc=c; cc<=c2; cc++)
            if (clueCells.has(rr+','+cc)) { cnt++; cv=clueAt[rr+','+cc]; }
        if (cnt!==1) continue;
        if (cv!==h+w) continue;
        res.push([r,c,r2,c2]);
      }
    }
    return res;
  }
  function firstUncovered() {
    for (let r=0;r<H;r++) for (let c=0;c<W;c++) if(!grid[r][c]) return [r,c];
    return null;
  }
  function dfs() {
    if (nsol>=cap) return;
    nodes++;
    if (nodes>nodeBudget) { nsol=cap+1; return; }
    const cell=firstUncovered();
    if (!cell) { nsol++; return; }
    const [r,c]=cell;
    for (const [r1,c1,r2,c2] of rectsFrom(r,c)) {
      let ok=true;
      for (let rr=r1;rr<=r2;rr++){ for(let cc=c1;cc<=c2;cc++){ if(grid[rr][cc]){ok=false;break;} } if(!ok)break; }
      if(!ok) continue;
      for (let rr=r1;rr<=r2;rr++) for(let cc=c1;cc<=c2;cc++) grid[rr][cc]=true;
      dfs();
      for (let rr=r1;rr<=r2;rr++) for(let cc=c1;cc<=c2;cc++) grid[rr][cc]=false;
      if (nsol>=cap) return;
    }
  }
  dfs();
  return nsol;
}

let ok=0;
for (let i=0;i<levels.length;i++) {
  const l=levels[i];
  const n=countSolutions(l.h,l.w,l.clues,2,250000);
  if (n===1) ok++; else console.log(`  Level ${i}: ${n} solutions (not unique)`);
}
console.log(`Node.js independent solver: ${ok}/${levels.length} UNIQUE`);
if (ok!==levels.length) process.exit(1);
