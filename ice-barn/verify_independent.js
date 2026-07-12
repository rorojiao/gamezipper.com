#!/usr/bin/env node
/**
 * Ice Barn — Independent Node.js verifier.
 * Reimplements all rules from scratch (no shared code with gen_levels.py).
 * Verifies each level's solution path.
 */
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json','utf8'));

const DIR_VEC = {R:[0,1],D:[1,0],L:[0,-1],U:[-1,0]};

function computeIceAreas(grid, R, C){
  const visited = Array(R).fill(0).map(()=>Array(C).fill(false));
  const areas = [];
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){
    if(grid[r][c] && !visited[r][c]){
      const area = [];
      const q = [[r,c]]; visited[r][c]=true;
      while(q.length){
        const [cr,cc] = q.shift();
        area.push([cr,cc]);
        for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]){
          const nr=cr+dr,nc=cc+dc;
          if(nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]&&!visited[nr][nc]){
            visited[nr][nc]=true; q.push([nr,nc]);
          }
        }
      }
      areas.push(area);
    }
  }
  return areas;
}

function verify(level, idx){
  const R = level.rows, C = level.cols;
  const ice = level.ice;
  const entry = level.entry, exitP = level.exit;
  const sol = level.solution;
  const arrows = level.arrows || [];
  const errors = [];

  // 1. Entry/exit
  if(sol[0][0]!==entry[0]||sol[0][1]!==entry[1]) errors.push(`L${idx+1}: path doesn't start at entry`);
  if(sol[sol.length-1][0]!==exitP[0]||sol[sol.length-1][1]!==exitP[1]) errors.push(`L${idx+1}: path doesn't end at exit`);

  // 2. Adjacency
  for(let i=1;i<sol.length;i++){
    const [pr,pc]=sol[i-1],[cr,cc]=sol[i];
    if(Math.abs(pr-cr)+Math.abs(pc-cc)!==1) errors.push(`L${idx+1}: non-adjacent step at ${i}`);
  }

  // 3. Ice turn constraint
  for(let i=1;i<sol.length-1;i++){
    const [r,c]=sol[i];
    if(ice[r][c]){
      const [pr,pc]=sol[i-1],[nr,nc]=sol[i+1];
      if((r-pr)!==(nr-r)||(c-pc)!==(nc-c)){
        errors.push(`L${idx+1}: ice turn violation at [${r},${c}]`);
      }
    }
  }

  // 4. White cell no revisit
  const seenWhite = new Set();
  for(const [r,c] of sol){
    if(!ice[r][c]){
      const k = r+','+c;
      if(seenWhite.has(k)) errors.push(`L${idx+1}: white cell [${r},${c}] revisited`);
      seenWhite.add(k);
    }
  }

  // 5. All arrows satisfied
  for(const ar of arrows){
    const [ar2,ac2]=ar.pos;
    let ok = false;
    for(let i=0;i<sol.length;i++){
      if(sol[i][0]===ar2&&sol[i][1]===ac2&&i>0){
        const d = DIR_VEC[ar.dir];
        const dd = [sol[i][0]-sol[i-1][0], sol[i][1]-sol[i-1][1]];
        if(d[0]===dd[0]&&d[1]===dd[1]) ok = true;
      }
    }
    if(!ok) errors.push(`L${idx+1}: arrow at [${ar2},${ac2}] dir ${ar.dir} not satisfied`);
  }

  // 6. All ice areas visited
  const areas = computeIceAreas(ice, R, C);
  const solSet = new Set(sol.map(p=>p[0]+','+p[1]));
  for(let ai=0;ai<areas.length;ai++){
    const hit = areas[ai].some(([r,c])=>solSet.has(r+','+c));
    if(!hit) errors.push(`L${idx+1}: ice area ${ai} not visited`);
  }

  return errors;
}

let allOk = true;
for(let i=0;i<levels.length;i++){
  const errs = verify(levels[i], i);
  if(errs.length){
    allOk = false;
    errs.forEach(e=>console.error(e));
  } else {
    console.log(`L${i+1} [${levels[i].tier}]: PASS (${levels[i].solution.length} steps, ${levels[i].arrows.length} arrows)`);
  }
}
console.log(allOk ? `\n✅ ALL ${levels.length} LEVELS VERIFIED` : `\n❌ VERIFICATION FAILED`);
process.exit(allOk?0:1);
