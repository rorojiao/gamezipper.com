#!/usr/bin/env node
/**
 * Maze Bridge Puzzle - INDEPENDENT Node.js BFS Verifier
 * Re-implements the solver from scratch (no shared code with gen_levels.py).
 * Verifies: solvable within budget, NOT solvable with budget-1,
 * unique start/end, all gaps are crossable on >=1 axis.
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const levels = data.levels;

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function isWalkable(ch) { return ch === '.' || ch === 'S' || ch === 'E'; }

function solve(grid, h, w, budget) {
  // find start
  let sr=-1, sc=-1;
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) if (grid[r][c]==='S'){sr=r;sc=c;}
  if (sr<0) return false;
  const key=(r,c,u)=>r*10000+c*100+u;
  const seen=new Set();
  const q=[[sr,sc,0]];
  seen.add(key(sr,sc,0));
  while(q.length){
    const [r,c,used]=q.shift();
    if(grid[r][c]==='E') return true;
    for(const [dr,dc] of DIRS){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<h&&nc>=0&&nc<w&&isWalkable(grid[nr][nc])){
        const k=key(nr,nc,used);
        if(!seen.has(k)){seen.add(k);q.push([nr,nc,used]);}
      }
    }
    // bridge jump: 2 cells, middle must be gap '~', far must be walkable
    for(const [dr,dc] of DIRS){
      const mr=r+dr,mc=c+dc, fr=r+2*dr,fc=c+2*dc;
      if(mr>=0&&mr<h&&mc>=0&&mc<w&&grid[mr][mc]==='~'
         &&fr>=0&&fr<h&&fc>=0&&fc<w&&isWalkable(grid[fr][fc])
         &&used+1<=budget){
        const k=key(fr,fc,used+1);
        if(!seen.has(k)){seen.add(k);q.push([fr,fc,used+1]);}
      }
    }
  }
  return false;
}

function gapAxes(grid,r,c,h,w){
  const axes=[];
  if(c-1>=0&&c+1<w&&isWalkable(grid[r][c-1])&&isWalkable(grid[r][c+1])) axes.push('H');
  if(r-1>=0&&r+1<h&&isWalkable(grid[r-1][c])&&isWalkable(grid[r+1][c])) axes.push('V');
  return axes;
}

let pass=0, fail=0;
for(const lv of levels){
  const h=lv.height, w=lv.width;
  const grid=lv.grid.map(row=>row.split(''));
  // checks
  let sCount=0,eCount=0;
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    if(grid[r][c]==='S')sCount++;
    if(grid[r][c]==='E')eCount++;
  }
  const okSE = sCount===1 && eCount===1;
  // every gap crossable on >=1 axis
  let allCrossable=true;
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    if(grid[r][c]==='~'){ if(gapAxes(grid,r,c,h,w).length===0) allCrossable=false; }
  }
  const solvable = solve(grid,h,w,lv.budget);
  const tight = lv.num_gaps>0 ? !solve(grid,h,w,lv.budget-1) : true;
  const ok = okSE && allCrossable && solvable && tight;
  if(ok){pass++; console.log(`PASS L${lv.level}: ${h}x${w} gaps=${lv.num_gaps} budget=${lv.budget} req=${lv.required_planks}`);}
  else{fail++; console.error(`FAIL L${lv.level}: SE=${okSE} cross=${allCrossable} solv=${solvable} tight=${tight}`);}
}
console.log(`\n${pass}/${levels.length} levels PASS (independent Node BFS)`);
if(fail>0){process.exit(1);}
