// verify_independent.js — Independent Node.js Nuribou solution verifier.
// Loads levels.json, re-checks each solution fully independently.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

const DIRS4 = [[0,1],[1,0],[0,-1],[-1,0]];
const DIRS_DIAG = [[-1,-1],[-1,1],[1,-1],[1,1]];

function fullCheck(grid, R, C) {
  // no 2x2 black
  for (let r=0;r<R-1;r++) for (let c=0;c<C-1;c++)
    if (grid[r][c]===1 && grid[r+1][c]===1 && grid[r][c+1]===1 && grid[r+1][c+1]===1) return [false,'2x2 black'];
  // black cells: ≤2 black orth neighbors, colinear if 2
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    if (grid[r][c]!==1) continue;
    const nb=[];
    for (const [dr,dc] of DIRS4) {
      const nr=r+dr,nc=c+dc;
      if (nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===1) nb.push([dr,dc]);
    }
    if (nb.length>2) return [false,`(${r},${c}) has ${nb.length} black nbrs`];
    if (nb.length===2 && (nb[0][0]+nb[1][0]!==0 || nb[0][1]+nb[1][1]!==0)) return [false,`(${r},${c}) L-corner`];
  }
  // diagonal rule
  const sid = Array.from({length:R},()=>new Array(C).fill(-1));
  const lengths=[];
  let nid=0;
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    if (grid[r][c]===1 && sid[r][c]===-1) {
      const hc=[]; let cc=c;
      while (cc<C && grid[r][cc]===1 && sid[r][cc]===-1) { hc.push(cc); cc++; }
      const vc=[]; let rr=r;
      while (rr<R && grid[rr][c]===1 && sid[rr][c]===-1) { vc.push(rr); rr++; }
      if (hc.length>=vc.length) { for (const cc2 of hc) sid[r][cc2]=nid; lengths.push(hc.length); }
      else { for (const rr2 of vc) sid[rr2][c]=nid; lengths.push(vc.length); }
      nid++;
    }
  }
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    if (grid[r][c]!==1) continue;
    for (const [dr,dc] of DIRS_DIAG) {
      const nr=r+dr,nc=c+dc;
      if (nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===1) {
        if (sid[r][c]!==sid[nr][nc] && lengths[sid[r][c]]===lengths[sid[nr][nc]])
          return [false,`diag strips (${r},${c})&(${nr},${nc}) equal length ${lengths[sid[r][c]]}`];
      }
    }
  }
  return [true,'OK'];
}

function islandsOf(grid,R,C) {
  const seen=Array.from({length:R},()=>new Array(C).fill(false));
  const islands=[];
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    if (grid[r][c]===0 && !seen[r][c]) {
      const comp=[]; const q=[[r,c]]; seen[r][c]=true;
      while (q.length) {
        const [cr,cc]=q.shift(); comp.push([cr,cc]);
        for (const [dr,dc] of DIRS4) {
          const nr=cr+dr,nc=cc+dc;
          if (nr>=0&&nr<R&&nc>=0&&nc<C&&!seen[nr][nc]&&grid[nr][nc]===0) { seen[nr][nc]=true; q.push([nr,nc]); }
        }
      }
      islands.push(comp);
    }
  }
  return islands;
}

let allPass = true;
for (const lv of levels) {
  const {R,C,puzzle,solution,level}=lv;
  // 1. full structural check on solution
  const [ok,msg] = fullCheck(solution, R, C);
  if (!ok) { console.log(`L${level} FAIL structural: ${msg}`); allPass=false; continue; }
  // 2. each clue cell is white, each island has exactly 1 clue, clue == island size
  const islands = islandsOf(solution, R, C);
  const clueSet = {};
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) if (puzzle[r][c]>0) clueSet[r+','+c]=puzzle[r][c];
  for (const island of islands) {
    const clues = island.filter(([r,c])=>puzzle[r][c]>0);
    if (clues.length!==1) { console.log(`L${level} FAIL: island has ${clues.length} clues`); allPass=false; continue; }
    const [r,c]=clues[0];
    if (puzzle[r][c]!==island.length) { console.log(`L${level} FAIL: clue ${puzzle[r][c]} != island ${island.length}`); allPass=false; }
  }
  // 3. every clue cell must belong to an island (white)
  for (const k in clueSet) {
    const [r,c]=k.split(',').map(Number);
    if (solution[r][c]===1) { console.log(`L${level} FAIL: clue at (${r},${c}) is black`); allPass=false; }
  }
}
console.log(allPass ? `ALL ${levels.length} LEVELS VERIFIED VALID (independent Node.js)` : 'SOME LEVELS FAILED');
process.exit(allPass?0:1);
