#!/usr/bin/env node
/* eslint-disable */
"use strict";
/*
  Constructive Dosun-Fuwari generator (gen2).
  Random region/wall layouts almost always have ZERO solutions because balloons
  must stack from a ceiling and irons from a floor. So we CONSTRUCT a guaranteed-
  valid solution, partition the cells into regions around it, then verify
  uniqueness with the backtracking solver.

  Solution model (vertical segments):
    Walls split each column into vertical segments. In any segment of length L:
      - balloons occupy the TOP cells (contiguous from the ceiling),
      - irons   occupy the BOTTOM cells (contiguous from the floor),
      - middle cells are empty.
    Setting a=1 per segment (L>=2) => 1 balloon at the very top, 1 iron at the
    very bottom, gap empty. This is always physics-valid and self-consistent.
    Total balloons == total irons == number of length>=2 segments == #regions.

  Region partition:
    Each balloon is matched to one iron. For TUTORIAL/EASY we match within the
    same column (vertical regions -> trivially forced -> easy). For HARD tiers
    we match across columns (L / horizontal regions -> genuine deduction).
    Each matched pair is connected by a shortest path through empty cells; the
    remaining empty cells are flooded to the nearest region.
*/
var G=require('./gen_dosun.js');
var solve=G.solve, verify=G.verify, makeRng=G.makeRng;

function rc(i,C){return [(i/C)|0, i-((i/C)|0)*C];}
function idx(r,c,C){return r*C+c;}
function neighbors4(i,R,C){var r=(i/C)|0,c=i-r*C,o=[];if(r>0)o.push(i-C);if(r<R-1)o.push(i+C);if(c>0)o.push(i-1);if(c<C-1)o.push(i+1);return o;}

// ---- place walls so every column segment has length>=2 (clean), count in [wMin,wMax]
function placeWalls(R,C,rng,wMin,wMax){
  var N=R*C;
  // candidate wall cells: avoid row0 and row(R-1)? Keep simple: any cell, but
  // we will validate segment lengths afterwards.
  for(var attempt=0;attempt<60;attempt++){
    var target=rng.int(wMin,wMax);
    var walls=[];
    var used={};
    var tries=0;
    while(walls.length<target && tries<target*8){
      tries++;
      var i=rng.int(0,N-1);
      if(used[i])continue;
      used[i]=true;
      walls.push(i);
    }
    if(validateSegments(R,C,walls)) return walls.sort(function(a,b){return a-b;});
  }
  // fallback: sparse walls
  return [];
}
// ensure every vertical segment (per column) has length>=2 (no lone cell)
function validateSegments(R,C,walls){
  var isW={};walls.forEach(function(w){isW[w]=true;});
  for(var c=0;c<C;c++){
    var run=0;
    for(var r=0;r<R;r++){
      if(isW[idx(r,c,C)]){ if(run===1) return false; run=0; }
      else run++;
    }
    if(run===1) return false; // lone cell at bottom
  }
  return true;
}

// ---- build solution via segment model (a=1 per length>=2 segment) ----
function buildSolution(R,C,walls){
  var N=R*C;
  var isW=new Array(N).fill(false);
  walls.forEach(function(w){isW[w]=true;});
  var sol=new Array(N).fill(0);
  for(var w=0;w<N;w++) if(isW[w]) sol[w]=3;
  var balloons=[], irons=[];
  for(var c=0;c<C;c++){
    // collect segments in this column
    var segStart=0;
    for(var r=0;r<=R;r++){
      var atWall = (r===R)||isW[idx(r,c,C)];
      if(atWall){
        var segLen=r-segStart;
        if(segLen>=2){
          var top=idx(segStart,c,C);
          var bot=idx(r-1,c,C);
          sol[top]=1; balloons.push(top);
          sol[bot]=2; irons.push(bot);
          // middle stays empty
        }
        segStart=r+1;
      }
    }
  }
  return {sol:sol, balloons:balloons, irons:irons};
}

// ---- greedy matching balloons<->irons ----
// mode: 'same' prefer same column (easy), 'cross' prefer different column (hard), 'any' nearest
function matchPairs(balloons,irons,R,C,rng,mode){
  var P=balloons.length;
  if(irons.length!==P) return null;
  var balAvail=balloons.slice();
  var ironAvail=irons.slice();
  var pairs=[];
  var bPos=balloons.map(function(i){return rc(i,C);});
  while(pairs.length<P){
    // pick first available balloon
    var bi=balAvail[0];
    var bxy=rc(bi,C);
    // score each available iron
    var best=-1,bestScore=1e9;
    for(var k=0;k<ironAvail.length;k++){
      var ixy=rc(ironAvail[k],C);
      var man=Math.abs(bxy[0]-ixy[0])+Math.abs(bxy[1]-ixy[1]);
      var sameCol = (bxy[1]===ixy[1])?0:1;
      var score=man*10 + (mode==='same'? sameCol*100 : (mode==='cross'? -sameCol*5+ (sameCol?0: -3) : 0)) + rng.int(0,3);
      if(mode==='cross' && sameCol===1) score-=8; // prefer cross
      if(score<bestScore){bestScore=score;best=k;}
    }
    if(best<0) return null;
    pairs.push([bi, ironAvail[best]]);
    balAvail.shift();
    ironAvail.splice(best,1);
  }
  return pairs;
}

// ---- BFS shortest path a->b through empty cells only, return list of cell idxs ----
function pathThrough(a,b,R,C,isWall,sol,claimed){
  if(a===b) return [a];
  var N=R*C;
  var prev=new Array(N).fill(-2);
  var q=[a]; prev[a]=-1; var head=0;
  while(head<q.length){
    var cur=q[head++];
    if(cur===b) break;
    var ns=neighbors4(cur,R,C);
    for(var k=0;k<ns.length;k++){
      var nx=ns[k];
      if(prev[nx]!==-2) continue;
      if(isWall[nx]) continue;
      // allow stepping on empty (sol==0) or the target b (ball) or source a
      if(sol[nx]!==0 && nx!==b) continue;
      if(claimed[nx]>=0 && nx!==b) continue;
      prev[nx]=cur; q.push(nx);
    }
  }
  if(prev[b]===-2) return null;
  // reconstruct
  var path=[]; var cur=b;
  while(cur!==-1){ path.push(cur); cur=prev[cur]; }
  path.reverse();
  return path;
}

// ---- partition all non-wall cells into regions, each pair = 1 region ----
function partition(R,C,walls,pairs,sol){
  var N=R*C;
  var isWall=new Array(N).fill(false);
  walls.forEach(function(w){isWall[w]=true;});
  var owner=new Array(N).fill(-1); // region id
  // claim pair paths
  for(var p=0;p<pairs.length;p++){
    var a=pairs[p][0], b=pairs[p][1];
    // temporarily allow endpoints
    var path=pathThrough(a,b,R,C,isWall,sol,owner);
    if(!path) return null;
    for(var k=0;k<path.length;k++){ owner[path[k]]=p; }
  }
  // flood remaining empty cells to nearest owned cell (multi-source BFS)
  var q=[];
  for(var i=0;i<N;i++) if(owner[i]>=0 && !isWall[i]) q.push(i);
  var head=0;
  while(head<q.length){
    var cur=q[head++];
    var ns=neighbors4(cur,R,C);
    for(var k=0;k<ns.length;k++){
      var nx=ns[k];
      if(isWall[nx]) continue;
      if(owner[nx]>=0) continue;
      owner[nx]=owner[cur]; q.push(nx);
    }
  }
  // any unowned non-wall cell? (disconnected component) -> fail
  for(var i=0;i<N;i++) if(!isWall[i] && owner[i]<0) return null;
  // build regions
  var regs=[];
  for(var i=0;i<N;i++){
    if(isWall[i]) continue;
    var o=owner[i];
    if(!regs[o]) regs[o]=[];
    regs[o].push(i);
  }
  // verify each region has exactly 1 balloon + 1 iron
  for(var o=0;o<regs.length;o++){
    var bc=0,ic=0;
    regs[o].forEach(function(i){ if(sol[i]===1)bc++; else if(sol[i]===2)ic++; });
    if(bc!==1||ic!==1) return null;
  }
  return regs;
}

// ---- generate one level ----
function genConstruct(cfg,rng){
  var R=cfg.R,C=cfg.C;
  for(var attempt=0;attempt<cfg.tries;attempt++){
    var walls=placeWalls(R,C,rng,cfg.wallMin,cfg.wallMax);
    if(walls.length===0 && cfg.wallMin>0) { /* allowed 0 walls */ }
    var bs=buildSolution(R,C,walls);
    if(bs.balloons.length<cfg.minRegions) continue;
    var mode=cfg.mode||'any';
    var pairs=matchPairs(bs.balloons,bs.irons,R,C,rng,mode);
    if(!pairs) continue;
    var regs=partition(R,C,walls,pairs,bs.sol);
    if(!regs) continue;
    if(regs.length<cfg.minRegions) continue;
    var level={R:R,C:C,walls:walls,regions:regs};
    // confirm our constructed solution verifies
    if(!verify(level,bs.sol)) continue;
    // uniqueness
    var res=solve(level,2);
    if(res.count===1){
      level.sol=bs.sol;
      return level;
    }
  }
  return null;
}

function harvest(name,count,cfgs,seedStart){
  var out=[]; var seed=seedStart; var tries=0;
  while(out.length<count && tries<60000){
    var cfg=cfgs[out.length%cfgs.length];
    var rng=makeRng(seed++);
    var lvl=genConstruct(cfg,rng);
    tries++;
    if(lvl){
      var sig=JSON.stringify({w:lvl.walls,r:lvl.regions});
      var dup=false;
      for(var j=0;j<out.length;j++){if(JSON.stringify({w:out[j].walls,r:out[j].regions})===sig){dup=true;break;}}
      if(!dup){lvl.tier=name;out.push(lvl);}
    }
  }
  console.error(name+": "+out.length+" (tries="+tries+")");
  return out;
}

if(require.main===module){
  var t0=Date.now();
  var tiers=[
    {name:"Tutorial",count:8,cfgs:[{R:5,C:5,wallMin:0,wallMax:2,minRegions:4,mode:'same',tries:60}],seed:100},
    {name:"Easy",count:8,cfgs:[{R:6,C:6,wallMin:1,wallMax:3,minRegions:5,mode:'same',tries:80}],seed:200},
    {name:"Medium",count:8,cfgs:[{R:7,C:7,wallMin:2,wallMax:4,minRegions:6,mode:'any',tries:120}],seed:300},
    {name:"Hard",count:10,cfgs:[{R:8,C:8,wallMin:3,wallMax:7,minRegions:7,mode:'cross',tries:160}],seed:400},
    {name:"Expert",count:6,cfgs:[
       {R:9,C:9,wallMin:4,wallMax:9,minRegions:8,mode:'cross',tries:200},
       {R:8,C:8,wallMin:5,wallMax:9,minRegions:9,mode:'cross',tries:200}],seed:500},
    {name:"Daily",count:12,cfgs:[
       {R:7,C:7,wallMin:2,wallMax:5,minRegions:6,mode:'cross',tries:160},
       {R:8,C:8,wallMin:3,wallMax:7,minRegions:7,mode:'cross',tries:160}],seed:600},
  ];
  var all=[];
  tiers.forEach(function(t){
    var lvls=harvest(t.name,t.count,t.cfgs,t.seed);
    all=all.concat(lvls);
  });
  // final verify
  var bad=0;
  all.forEach(function(l){var res=solve(l,3);if(res.count!==1||!verify(l,res.solution)){bad++;console.error("FAIL",JSON.stringify({R:l.R,C:l.C,w:l.walls}));}});
  console.error("TOTAL="+all.length+" bad="+bad+" time="+(Date.now()-t0)+"ms");
  var main=all.filter(function(l){return l.tier!=="Daily";});
  var daily=all.filter(function(l){return l.tier==="Daily";});
  process.stdout.write(JSON.stringify({main:main,daily:daily}));
}
module.exports={genConstruct:genConstruct,buildSolution:buildSolution,placeWalls:placeWalls};
