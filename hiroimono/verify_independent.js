#!/usr/bin/env node
'use strict';
const fs=require('fs');
const levels=JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));
function validate(level, route){
 const stones=new Set(level.stones.map(p=>p.join(','))), remaining=new Set(stones);
 if(route.length!==stones.size) return {ok:false,reason:'route length'};
 for(let i=0;i<route.length;i++){
  const cur=route[i], key=cur.join(',');
  if(!remaining.has(key)) return {ok:false,reason:`step ${i+1} removed/nonstone`};
  if(i){
   const prev=route[i-1]; if(prev[0]!==cur[0]&&prev[1]!==cur[1]) return {ok:false,reason:`step ${i+1} diagonal`};
   if(i>=2){const before=route[i-2],incoming=[prev[0]-before[0],prev[1]-before[1]],out=[cur[0]-prev[0],cur[1]-prev[1]];if((incoming[0]&&out[0]&&incoming[0]*out[0]<0)||(incoming[1]&&out[1]&&incoming[1]*out[1]<0))return {ok:false,reason:`step ${i+1} reverse`}}
   const dr=Math.sign(cur[0]-prev[0]),dc=Math.sign(cur[1]-prev[1]);let r=prev[0]+dr,c=prev[1]+dc;
   while(r!==cur[0]||c!==cur[1]){if(remaining.has(r+','+c))return {ok:false,reason:`step ${i+1} skips ${r},${c}`};r+=dr;c+=dc}
  }
  remaining.delete(key);
 }
 return {ok:remaining.size===0,reason:remaining.size?'remaining':''};
}
let ok=0;levels.forEach((l,i)=>{const v=validate(l,l.solution);if(!v.ok)throw new Error(`L${i+1} ${v.reason}`);if(new Set(l.stones.map(String)).size!==l.stones.length)throw new Error(`L${i+1} duplicate`);console.log(`L${String(i+1).padStart(2,'0')}: ${l.size}x${l.size} ${l.stones.length} stones PASS`);ok++});
console.log(`INDEPENDENT_NODE: ${ok}/${levels.length} PASS`);
