#!/usr/bin/env node
/**
 * Maze Bridge Puzzle - Playtest Simulation
 * Simulates actual gameplay: load level, auto-solve via BFS, replay moves
 * through the engine rules to confirm the game would declare a win.
 */
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));
const LEVELS = data.levels;
const TILE = { WALL:'#', PATH:'.', START:'S', END:'E', GAP:'~' };
const WALK = new Set(['.','S','E']);

// BFS that returns the move sequence
function solvePath(grid, h, w, sr, sc, er, ec, budget){
  const seen=new Map();
  const q=[[sr,sc,0,[]]];
  seen.set(sr+','+sc+',0',[]);
  while(q.length){
    const [r,c,u,path]=q.shift();
    if(r===er&&c===ec) return path;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=h||nc<0||nc>=w) continue;
      const t=grid[nr][nc];
      if(t===TILE.WALL) continue;
      if(WALK.has(t)){
        const k=nr+','+nc+','+u;
        if(!seen.has(k)){ seen.set(k,[...path,{type:'move',to:[nr,nc]}]); q.push([nr,nc,u,seen.get(k)]); }
      } else if(t===TILE.GAP){
        const fr=nr+dr,fc=nc+dc;
        if(fr<0||fr>=h||fc<0||fc>=w) continue;
        if(grid[fr][fc]===TILE.WALL||grid[fr][fc]===TILE.GAP) continue;
        if(u+1>budget) continue;
        const k=fr+','+fc+','+(u+1);
        if(!seen.has(k)){ seen.set(k,[...path,{type:'bridge',gap:[nr,nc],to:[fr,fc]}]); q.push([fr,fc,u+1,seen.get(k)]); }
      }
    }
  }
  return null;
}

// Replay: simulate the game engine processing these moves
function replay(grid, h, w, sr, sc, er, ec, budget, moves){
  let pr=sr, pc=sc, used=0;
  const bridges=new Set();
  for(const m of moves){
    if(m.type==='move'){
      // engine: target must be walkable
      const t=grid[m.to[0]][m.to[1]];
      if(!WALK.has(t)) throw new Error('invalid move to '+t);
      pr=m.to[0]; pc=m.to[1];
    } else if(m.type==='bridge'){
      const [gr,gc]=m.gap;
      if(grid[gr][gc]!==TILE.GAP) throw new Error('bridge on non-gap');
      if(used+1>budget) throw new Error('out of planks');
      bridges.add(gr+','+gc); used++;
      pr=m.to[0]; pc=m.to[1];
    }
    if(pr===er&&pc===ec) return {won:true, moves: moves.length, planks:used, bridges:[...bridges]};
  }
  return {won: pr===er&&pc===ec, moves: moves.length, planks:used};
}

let pass=0;
for(const lv of LEVELS){
  const h=lv.height,w=lv.width;
  const grid=lv.grid.map(r=>r.split(''));
  let sr=sc=er=ec=-1;
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    if(grid[r][c]==='S'){sr=r;sc=c;}
    if(grid[r][c]==='E'){er=r;ec=c;}
  }
  const path=solvePath(grid,h,w,sr,sc,er,ec,lv.budget);
  if(!path){ console.error(`L${lv.level}: NO SOLUTION PATH`); process.exit(1); }
  const res=replay(grid,h,w,sr,sc,er,ec,lv.budget,path);
  if(res.won && res.planks===lv.required_planks){
    pass++;
    console.log(`L${lv.level}: SOLVED in ${res.moves} moves, ${res.planks}/${lv.budget} planks ✅`);
  } else {
    console.error(`L${lv.level}: REPLAY FAILED won=${res.won} planks=${res.planks}`);
    process.exit(1);
  }
}
console.log(`\n✅ Playtest: ${pass}/${LEVELS.length} levels solved & replayed through engine`);
