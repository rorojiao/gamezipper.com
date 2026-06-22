#!/usr/bin/env node
/**
 * INDEPENDENT Nondango verifier (separate implementation from gen.py).
 * Reads ../levels.json, for each level:
 *   1. validates the stored SOLUTION (exactly-one-black-per-region +
 *      no-3-consecutive-same-color-circles in 8 dirs, empty cells break runs)
 *   2. counts solutions with givens fixed using an independent backtracking
 *      solver; requires EXACTLY ONE solution (uniqueness).
 * Prints "N/N UNIQUE + VALID" or reports failures. Exits nonzero on any failure.
 */
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, 'levels.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));

const AXES = [[0,1],[1,0],[1,1],[1,-1]];

function inb(r,c,h,w){ return r>=0&&r<h&&c>=0&&c<w; }

// independent validity check of a full coloring (solution[r][c]: 1 black,0 white,-1 empty)
function isValidSolution(grid, regions, sol, w, h) {
  const nrid = Math.max(...regions.flat()) + 1;
  // exactly one black circle per region
  const blackCount = new Array(nrid).fill(0);
  for (let r=0;r<h;r++) for (let c=0;c<w;c++){
    if (grid[r][c]!==1) continue;            // not a circle
    if (sol[r][c]===1) blackCount[regions[r][c]]++;
    if (sol[r][c]!==0 && sol[r][c]!==1) return `bad solution value @${r},${c}`;
  }
  for (let i=0;i<nrid;i++) if (blackCount[i]!==1) return `region ${i} has ${blackCount[i]} blacks`;
  // no 3 consecutive same-color CIRCLES in 8 dirs (empty breaks)
  for (let r=0;r<h;r++) for (let c=0;c<w;c++){
    if (grid[r][c]!==1) continue;
    const v = sol[r][c];
    for (const [dr,dc] of AXES){
      // window starting at (r,c): (r,c),(r+dr,c+dc),(r+2dr,c+2dc)
      const r1=r+dr,c1=c+dc,r2=r+2*dr,c2=c+2*dc;
      if (!inb(r2,c2,h,w)) continue;
      if (grid[r1][c1]===1 && grid[r2][c2]===1 &&
          sol[r1][c1]===v && sol[r2][c2]===v) {
        return `3-in-line @(${r},${c})-(${r1},${c1})-(${r2},${c2}) dir ${dr},${dc}`;
      }
    }
  }
  return null; // valid
}

// independent solver: count solutions (cap=limit) with givens fixed.
// Enforces EXACTLY one black circle per region. free = circle cells whose given is -1.
function countSolutions(grid, regions, givens, w, h, limit) {
  const nrid = Math.max(...regions.flat()) + 1;
  const color = Array.from({length:h},()=>new Array(w).fill(null));
  const regBlack = new Array(nrid).fill(0);
  const regFree = new Array(nrid).fill(0);
  // apply givens
  for (let r=0;r<h;r++) for (let c=0;c<w;c++){
    if (grid[r][c]!==1) continue;
    if (givens[r][c]!==-1){
      color[r][c]=givens[r][c];
      if (givens[r][c]===1) regBlack[regions[r][c]]++;
    } else {
      regFree[regions[r][c]]++;
    }
  }
  for (let i=0;i<nrid;i++){
    if (regBlack[i]>1) return 0;
    if (regFree[i]===0 && regBlack[i]!==1) return 0;
  }
  // check fixed triples once
  for (let r=0;r<h;r++) for (let c=0;c<w;c++){
    if (grid[r][c]!==1 || color[r][c]===null) continue;
    const v=color[r][c];
    for (const [dr,dc] of AXES){
      const r1=r+dr,c1=c+dc,r2=r+2*dr,c2=c+2*dc;
      if(!inb(r2,c2,h,w)) continue;
      if(grid[r1][c1]===1&&grid[r2][c2]===1&&color[r1][c1]===v&&color[r2][c2]===v) return 0;
    }
  }
  // free cells
  const free=[];
  for(let r=0;r<h;r++) for(let c=0;c<w;c++) if(grid[r][c]===1&&givens[r][c]===-1) free.push([r,c]);
  let count=0;
  function tripleOk(r,c,v){
    for(const [dr,dc] of AXES){
      for(let off=-2;off<=0;off++){
        const p=[[r+off*dr,c+off*dc],[r+(off+1)*dr,c+(off+1)*dc],[r+(off+2)*dr,c+(off+2)*dc]];
        if(!p.every(([pr,pc])=>inb(pr,pc,h,w))) continue;
        let vals=[],ok=true;
        for(const [pr,pc] of p){ if(grid[pr][pc]!==1||color[pr][pc]===null){ok=false;break;} vals.push(color[pr][pc]); }
        if(ok&&vals[0]===vals[1]&&vals[2]===v&&vals[0]===v) return false;
      }
    }
    return true;
  }
  function bt(i){
    if(count>=limit) return;
    if(i===free.length){ count++; return; }
    const [r,c]=free[i]; const rid=regions[r][c];
    const isLast = (regFree[rid]===1);
    let choices;
    if (isLast){ choices = (regBlack[rid]===0) ? [1] : [0]; }
    else { choices = [0,1]; }
    for(const v of choices){
      if(v===1 && regBlack[rid]>=1) continue;
      color[r][c]=v; regBlack[rid]+=v; regFree[rid]-=1;
      if(tripleOk(r,c,v)) bt(i+1);
      regBlack[rid]-=v; regFree[rid]+=1; color[r][c]=null;
      if(count>=limit) return;
    }
  }
  bt(0);
  return count;
}

let ok=0, fail=0;
for (const lv of levels){
  const {id,tier,w,h,grid,regions,givens,solution}=lv;
  const verr = isValidSolution(grid,regions,solution,w,h);
  if (verr){ console.log(`❌ #${id} ${tier} ${w}x${h}: INVALID SOLUTION: ${verr}`); fail++; continue; }
  // also verify stored solution matches givens
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    if(givens[r][c]!==-1 && solution[r][c]!==givens[r][c]){
      console.log(`❌ #${id}: given @${r},${c}=${givens[r][c]} != solution ${solution[r][c]}`); fail++; continue;
    }
  }
  const cnt = countSolutions(grid,regions,givens,w,h,2);
  if (cnt===1){ ok++; }
  else { console.log(`❌ #${id} ${tier} ${w}x${h}: ${cnt} solutions (NOT UNIQUE)`); fail++; }
}
console.log(`\n${ok}/${levels.length} UNIQUE + VALID` + (fail? ` (${fail} FAILED)`:''));
process.exit(fail? 1: 0);
