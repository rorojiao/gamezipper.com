#!/usr/bin/env node
/* eslint-disable */
"use strict";
/*
  Dosun-Fuwari solver + level generator.

  RULES (Nikoli-verified):
    - Grid R x C. Some cells are WALLS (black, belong to no region).
    - Non-wall cells are partitioned into contiguous REGIONS.
    - Each region must contain exactly ONE balloon (floats up) and ONE iron (sinks down).
    - BALLOON float rule: a balloon at (r,c) is valid iff the cell directly above
      (r-1,c) is: the top edge (r==0), OR a wall, OR another balloon.
    - IRON sink rule: an iron at (r,c) is valid iff the cell directly below
      (r+1,c) is: the bottom edge (r==R-1), OR a wall, OR another iron.
    - Puzzle has a UNIQUE solution.

  SOLVER: backtracking with unit-propagation.
    Placing a balloon at i forces (via the float rule) the cell above it to also
    be a balloon, unless it is the top edge / a wall / already a balloon. That
    cascade is sound (the rule demands it) and prunes massively. Same for iron
    downward. Region counts (exactly 1 balloon + 1 iron) are enforced inline.
    We count solutions up to a cap (2) so we can verify uniqueness quickly.
*/

// ---------- small helpers ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function makeRng(seed){var r=mulberry32(seed);return {next:r,int:function(lo,hi){return lo+Math.floor(r()*(hi-lo+1));},pick:function(arr){return arr[Math.floor(r()*arr.length)];},shuffle:function(arr){for(var i=arr.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}};}

// ---------- SOLVER ----------
// level = {R,C, walls:[idx...], regions:[[idx...],...]}
// returns {count, solution} where count is min(actual, cap)
function solve(level, cap){
  cap = cap||2;
  var R=level.R, C=level.C, N=R*C;
  var wall=new Array(N).fill(false);
  for(var w=0;w<level.walls.length;w++) wall[level.walls[w]]=true;
  var cellRegion=new Array(N).fill(-1);
  for(var ri=0;ri<level.regions.length;ri++){
    var cells=level.regions[ri];
    for(var k=0;k<cells.length;k++) cellRegion[cells[k]]=ri;
  }
  var nReg=level.regions.length;
  // assign: 0 empty,1 balloon,2 iron,3 wall
  var assign=new Array(N).fill(0);
  for(var i=0;i<N;i++) if(wall[i]) assign[i]=3;
  var balCnt=new Array(nReg).fill(0);
  var ironCnt=new Array(nReg).fill(0);
  var trail=[]; // {i,prev,ri,dB,dI}

  function undoTo(mark){
    while(trail.length>mark){
      var e=trail.pop();
      assign[e.i]=e.prev;
      balCnt[e.ri]-=e.dB;
      ironCnt[e.ri]-=e.dI;
    }
  }

  // doForce: set cell i to v (1 balloon / 2 iron), update counts, push trail & queue.
  // returns false on conflict.
  function doForce(i,v,q){
    if(assign[i]===v) return true;
    if(assign[i]!==0) return false; // wall or other ball
    assign[i]=v;
    var ri=cellRegion[i];
    trail.push({i:i,prev:0,ri:ri,dB:v===1?1:0,dI:v===2?1:0});
    if(v===1){ balCnt[ri]++; if(balCnt[ri]>1) return false; }
    else { ironCnt[ri]++; if(ironCnt[ri]>1) return false; }
    q.push([i,v]);
    return true;
  }

  // propagate a queue of [i,v] placements through float/sink support.
  function propagate(q){
    var head=0;
    while(head<q.length){
      var iv=q[head++]; var i=iv[0], v=iv[1];
      var r=(i/C)|0, c=i-r*C;
      if(v===1){ // balloon needs support directly above
        if(r>0){
          var up=i-C;
          if(assign[up]!==1 && assign[up]!==3){ // not balloon, not wall
            if(assign[up]===2) return false;    // iron above -> conflict
            if(!doForce(up,1,q)) return false;
          }
        }
      } else { // iron needs support directly below
        if(r<R-1){
          var dn=i+C;
          if(assign[dn]!==2 && assign[dn]!==3){
            if(assign[dn]===1) return false;
            if(!doForce(dn,2,q)) return false;
          }
        }
      }
    }
    return true;
  }

  var count=0, solution=null;
  function onSolution(){
    count++;
    if(count===1 && cap>=1){
      solution=assign.slice();
      // normalise walls back to 3 in copy (already 3)
    }
  }

  function search(){
    if(count>=cap) return;
    // find a region missing a balloon or an iron
    var t=-1, needBal=false;
    for(var ri=0;ri<nReg;ri++){
      if(balCnt[ri]===0){ t=ri; needBal=true; break; }
      if(ironCnt[ri]===0){ t=ri; needBal=false; break; }
    }
    if(t===-1){ onSolution(); return; }
    var cs=level.regions[t];
    var v=needBal?1:2;
    for(var k=0;k<cs.length;k++){
      var i=cs[k];
      if(assign[i]!==0) continue;
      var mark=trail.length;
      // place
      assign[i]=v;
      trail.push({i:i,prev:0,ri:t,dB:v===1?1:0,dI:v===2?1:0});
      if(v===1){ balCnt[t]++; if(balCnt[t]>1){ undoTo(mark); continue; } }
      else { ironCnt[t]++; if(ironCnt[t]>1){ undoTo(mark); continue; } }
      if(propagate([[i,v]])){
        search();
      }
      undoTo(mark);
      if(count>=cap) return;
    }
  }

  search();
  return {count:count, solution:solution};
}

// ---------- REGION GENERATION ----------
function neighbors(i,R,C){
  var r=(i/C)|0, c=i-r*C; var out=[];
  if(r>0) out.push(i-C);
  if(r<R-1) out.push(i+C);
  if(c>0) out.push(i-1);
  if(c<C-1) out.push(i+1);
  return out;
}

// Grow contiguous polyomino regions over non-wall cells. Ensures size>=2 by merging.
function genRegions(R,C,walls,rng,minSize,maxSize){
  var N=R*C;
  var isWall=new Array(N).fill(false);
  for(var i=0;i<walls.length;i++) isWall[walls[i]]=true;
  var region=new Array(N).fill(-1);
  for(var i=0;i<N;i++) if(isWall[i]) region[i]=-2;
  var free=[];
  for(var i=0;i<N;i++) if(!isWall[i]) free.push(i);
  rng.shuffle(free);
  var rid=0;
  for(var f=0;f<free.length;f++){
    var s=free[f];
    if(region[s]!==-1) continue;
    region[s]=rid;
    var blob=[s];
    var target=rng.int(minSize,maxSize);
    var guard=0;
    while(blob.length<target && guard++<200){
      // pick random blob cell, add a random free neighbor
      var bi=blob[rng.int(0,blob.length-1)];
      var ns=neighbors(bi,R,C).filter(function(n){return region[n]===-1;});
      if(ns.length===0) continue;
      var n=rng.pick(ns);
      region[n]=rid; blob.push(n);
    }
    rid++;
  }
  // build regions
  var regs=[];
  for(var i=0;i<N;i++) if(region[i]>=0){ if(!regs[region[i]]) regs[region[i]]=[]; regs[region[i]].push(i); }
  // merge size-1 regions into a neighbor region
  var changed=true, safety=0;
  while(changed && safety++<100){
    changed=false;
    for(var ri=0;ri<regs.length;ri++){
      if(!regs[ri]) continue;
      if(regs[ri].length===1){
        var cell=regs[ri][0];
        var ns=neighbors(cell,R,C).filter(function(n){return region[n]>=0 && region[n]!==ri;});
        if(ns.length){
          var dest=region[ns[0]];
          region[cell]=dest;
          regs[dest].push(cell);
          regs[ri]=null;
          changed=true;
        }
      }
    }
  }
  // compact
  var out=[];
  for(var i=0;i<N;i++) if(region[i]>=0) region[i]=-1;
  var next=0;
  for(var ri=0;ri<regs.length;ri++){
    if(!regs[ri]) continue;
    for(var k=0;k<regs[ri].length;k++){ region[regs[ri][k]]=next; }
    out.push(regs[ri]);
    next++;
  }
  // sanity: any unassigned non-wall cell? (shouldn't happen) -> drop
  return out;
}

function nonWallIsolated(R,C,walls){
  // returns true if any non-wall cell has zero non-wall neighbors (would be unusable)
  var N=R*C;
  var isWall=new Array(N).fill(false);
  for(var i=0;i<walls.length;i++) isWall[walls[i]]=true;
  for(var i=0;i<N;i++){
    if(isWall[i]) continue;
    var ns=neighbors(i,R,C);
    var ok=false;
    for(var k=0;k<ns.length;k++) if(!isWall[ns[k]]){ok=true;break;}
    if(!ok) return true;
  }
  return false;
}

// ---------- LEVEL GENERATOR ----------
// config: {R,C,wallMin,wallMax,minSize,maxSize,minRegions}
function genLevel(cfg,rng){
  var R=cfg.R, C=cfg.C, N=R*C;
  var attempts=0;
  while(attempts++<400){
    // choose walls
    var nWalls=rng.int(cfg.wallMin,cfg.wallMax);
    var allIdx=[]; for(var i=0;i<N;i++) allIdx.push(i);
    rng.shuffle(allIdx);
    var walls=allIdx.slice(0,nWalls).sort(function(a,b){return a-b;});
    if(nonWallIsolated(R,C,walls)) continue;
    var regions=genRegions(R,C,walls,rng,cfg.minSize,cfg.maxSize);
    if(regions.length<cfg.minRegions) continue;
    // every region must be size>=2
    var ok=true;
    for(var ri=0;ri<regions.length;ri++) if(regions[ri].length<2){ok=false;break;}
    if(!ok) continue;
    var level={R:R,C:C,walls:walls,regions:regions};
    var res=solve(level,2);
    if(res.count===1 && res.solution){
      // verify solution truly satisfies (defensive)
      if(verify(level,res.solution)){
        level.sol=res.solution;
        return level;
      }
    }
  }
  return null;
}

// ---------- VERIFY (independent check of a full assignment) ----------
function verify(level,sol){
  var R=level.R,C=level.C,N=R*C;
  var wall=new Array(N).fill(false);
  for(var i=0;i<level.walls.length;i++) wall[level.walls[i]]=true;
  // region counts
  var balCnt={}, ironCnt={};
  for(var ri=0;ri<level.regions.length;ri++){balCnt[ri]=0;ironCnt[ri]=0;}
  var cellRegion=new Array(N).fill(-1);
  for(var ri=0;ri<level.regions.length;ri++) for(var k=0;k<level.regions[ri].length;k++) cellRegion[level.regions[ri][k]]=ri;
  for(var i=0;i<N;i++){
    if(wall[i]){ if(sol[i]!==3 && sol[i]!==0) return false; continue; }
    if(sol[i]===1){ if(cellRegion[i]<0) return false; balCnt[cellRegion[i]]++; }
    else if(sol[i]===2){ if(cellRegion[i]<0) return false; ironCnt[cellRegion[i]]++; }
    else if(sol[i]!==0) return false;
  }
  for(var ri=0;ri<level.regions.length;ri++){ if(balCnt[ri]!==1||ironCnt[ri]!==1) return false; }
  // float / sink
  for(var i=0;i<N;i++){
    if(sol[i]===1){
      var r=(i/C)|0;
      if(r>0){ var up=i-C; if(!(sol[up]===1||sol[up]===3)) return false; }
    } else if(sol[i]===2){
      var r2=(i/C)|0;
      if(r2<R-1){ var dn=i+C; if(!(sol[dn]===2||sol[dn]===3)) return false; }
    }
  }
  return true;
}

// ---------- HARVEST ----------
function harvest(name,count,cfgs,baseSeed){
  var out=[];
  var seed=baseSeed;
  var tries=0;
  while(out.length<count && tries<20000){
    var cfg=cfgs[out.length%cfgs.length];
    var rng=makeRng(seed++);
    var lvl=genLevel(cfg,rng);
    tries++;
    if(lvl){
      // uniqueness re-check already done; dedupe by signature
      var sig=JSON.stringify({w:lvl.walls,r:lvl.regions});
      var dup=false;
      for(var j=0;j<out.length;j++){ if(JSON.stringify({w:out[j].walls,r:out[j].regions})===sig){dup=true;break;} }
      if(!dup){
        lvl.tier=name;
        out.push(lvl);
      }
    }
  }
  return out;
}

function main(){
  var tiers=[
    {name:"Tutorial", count:8, cfgs:[{R:5,C:5,wallMin:0,wallMax:2,minSize:2,maxSize:4,minRegions:4}]},
    {name:"Easy",     count:8, cfgs:[{R:6,C:6,wallMin:1,wallMax:3,minSize:2,maxSize:4,minRegions:5}]},
    {name:"Medium",   count:8, cfgs:[{R:7,C:7,wallMin:2,wallMax:5,minSize:2,maxSize:5,minRegions:6}]},
    {name:"Hard",     count:10,cfgs:[{R:8,C:8,wallMin:3,wallMax:7,minSize:2,maxSize:5,minRegions:7}]},
    {name:"Expert",   count:6, cfgs:[{R:9,C:9,wallMin:4,wallMax:9,minSize:2,maxSize:6,minRegions:8},{R:8,C:8,wallMin:5,wallMax:9,minSize:2,maxSize:5,minRegions:9}]},
    {name:"Daily",    count:12,cfgs:[{R:7,C:7,wallMin:2,wallMax:5,minSize:2,maxSize:5,minRegions:6},{R:8,C:8,wallMin:3,wallMax:7,minSize:2,maxSize:5,minRegions:8}]}
  ];
  var seed=1234567;
  var all=[];
  tiers.forEach(function(t){
    var lvls=harvest(t.name,t.count,t.cfgs,seed);
    seed+=100000;
    if(lvls.length<t.count){
      console.error("WARN: tier "+t.name+" only got "+lvls.length+"/"+t.count);
    }
    // attach tier + index
    lvls.forEach(function(l){ l.tier=t.name; });
    all=all.concat(lvls);
    console.error("tier "+t.name+": "+lvls.length);
  });

  // final independent verification of every level
  var bad=0;
  all.forEach(function(l){
    var res=solve(l,3);
    if(res.count!==1 || !verify(l,res.solution)){ bad++; console.error("UNIQUENESS FAIL", JSON.stringify(l)); }
  });
  console.error("total levels:", all.length, "bad:", bad);

  // split: main tiers (everything except Daily) for the level select; Daily separate
  var main=all.filter(function(l){return l.tier!=="Daily";});
  var daily=all.filter(function(l){return l.tier==="Daily";});

  var out={main:main, daily:daily};
  process.stdout.write(JSON.stringify(out));
}

if(require.main===module) main();
module.exports={solve:solve, verify:verify, genLevel:genLevel, makeRng:makeRng, genRegions:genRegions, nonWallIsolated:nonWallIsolated, neighbors:neighbors};
