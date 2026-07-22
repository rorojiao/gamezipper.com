#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const code=scripts.find(s=>/var\s+LEVELS\s*=\s*\[/.test(s)&&/function\s+checkTile/.test(s));
if(!code)throw new Error('Hop Warp game script not found');
const pre=code.slice(code.indexOf('var LEVELS=['),code.indexOf('// Audio'));
const ctx={console,Math,JSON,Array,Object,String,Number,Boolean};vm.createContext(ctx);vm.runInContext(pre,ctx,{timeout:5000});
const LEVELS=vm.runInContext('LEVELS',ctx);
if(!Array.isArray(LEVELS)||LEVELS.length!==30)throw new Error(`expected 30 levels, got ${LEVELS&&LEVELS.length}`);

const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
function encode(s){return [s.x,s.y,s.w,s.k,s.mask,s.open].join(',');}
function solve(L,limit=2){
 const R=L.h,C=L.w,stars=[],starAt=new Map(),doors=[],doorAt=new Map(),keys=[];
 let ex=-1,ey=-1;
 for(let y=0;y<R;y++)for(let x=0;x<C;x++){
  const t=L.grid[y][x];
  if(t===2){starAt.set(x+','+y,stars.length);stars.push([x,y]);}
  else if(t===3){ex=x;ey=y;}
  else if(t===4){doorAt.set(x+','+y,doors.length);doors.push([x,y]);}
  else if(t===5)keys.push([x,y]);
 }
 if(ex<0) return {count:0,error:'no exit'};
 const allStars=(1<<stars.length)-1;
 const start={x:L.px,y:L.py,w:L.warps,k:0,mask:0,open:0,path:[]};
 const keyAt=new Map(keys.map((p,i)=>[p.join(','),i]));
 const seen=new Set([encode(start)]),q=[start];let qi=0,count=0,witness=null;
 function enter(s,x,y,warp){
  const t=L.grid[y][x]; if(t===1)return null;
  let ns={...s,x,y,path:s.path.concat((warp?'W':'M')+x+':'+y)};
  const di=doorAt.get(x+','+y);
  if(di!==undefined && !(ns.open&(1<<di))){if(ns.k<=0)return null;ns.k--;ns.open|=1<<di;}
  const ki=keyAt.get(x+','+y); if(ki!==undefined)ns.k++;
  const si=starAt.get(x+','+y); if(si!==undefined)ns.mask|=1<<si;
  return ns;
 }
 while(qi<q.length){
  const s=q[qi++];
  if(s.x===ex&&s.y===ey&&s.mask===allStars){count++;if(!witness)witness=s.path;if(count>=limit)break;continue;}
  for(const [dx,dy] of dirs){
   const nx=s.x+dx,ny=s.y+dy;if(nx<0||ny<0||nx>=C||ny>=R)continue;
   const cur=L.grid[s.y][s.x],dest=L.grid[ny][nx];
   const allow=(t,ddx,ddy)=>t===6?ddx===0&&ddy===-1:t===7?ddx===0&&ddy===1:t===8?ddx===-1&&ddy===0:t===9?ddx===1&&ddy===0:true;
   if(!allow(cur,dx,dy)||!allow(dest,dx,dy))continue;
   const ns=enter(s,nx,ny,false);if(!ns)continue;const k=encode(ns);if(!seen.has(k)){seen.add(k);q.push(ns);}
  }
  if(s.w>0){
   for(let y=0;y<R;y++)for(let x=0;x<C;x++)if(x!==s.x||y!==s.y){const ns=enter({...s,w:s.w-1},x,y,true);if(!ns)continue;const k=encode(ns);if(!seen.has(k)){seen.add(k);q.push(ns);}}
  }
 }
 return {count,witness,states:seen.size,stars:stars.length,doors:doors.length,keys:keys.length};
}
let pass=0;
for(let i=0;i<LEVELS.length;i++){
 const L=LEVELS[i],r=solve(L,2);const errs=[];
 if(L.grid.length!==L.h||L.grid.some(row=>row.length!==L.w))errs.push('grid size');
 if(!Number.isInteger(L.warps)||L.warps<0)errs.push('warps');
 if(r.count===0)errs.push(r.error||'no path');
 if(errs.length)console.log(`L${String(i+1).padStart(2,'0')} FAIL ${errs.join('; ')} states=${r.states||0}`);
 else{pass++;console.log(`L${String(i+1).padStart(2,'0')} PASS solutions=${r.count}${r.count>=2?'+':''} states=${r.states} stars=${r.stars} keys=${r.keys} doors=${r.doors} steps=${r.witness.length}`);}
}
console.log(`\n${pass}/${LEVELS.length} PASS (model BFS, solution limit=2)`);process.exit(pass===LEVELS.length?0:1);
