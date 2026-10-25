'use strict';
// Finite wall-relative waypoint family. Unlike a coarse Cartesian grid, every
// horizontal shelf contributes points around both ends, above/at/below its lip.
module.exports=function wallRoutes(lv,ci,{P,CW,CH}) {
 const walls=lv.walls.map(w=>({x1:w.x1/100*CW,y1:w.y1/100*CH,x2:w.x2/100*CW,y2:w.y2/100*CH}));
 const nodes=[];
 for(const w of walls)for(const x of [Math.min(w.x1,w.x2),Math.max(w.x1,w.x2)])
  for(const dx of [-32,-20,20,32])for(const dy of [-24,0,24]){
   const p={x:x+dx,y:w.y1+dy};if(p.x>=18&&p.x<=CW-18)nodes.push(p);
  }
 const out=[],seen=new Set(),cup=lv.cups[ci];
 const add=(parts,d,fx,kind)=>{
  if(!parts.every(line=>line.every((p,i)=>p.x>=2&&p.x<=CW-2&&p.y>=2&&p.y<=CH-2&&(!i||p.y>line[i-1].y))))return;
  const key=JSON.stringify(parts);if(seen.has(key))return;seen.add(key);out.push({parts,d,fx,kind});
 };
 for(let d=0;d<lv.disp.length;d++){
  const dd=lv.disp[d];if(cup.color&&cup.color!==dd.color)continue;
  for(const fx of [.25,.5,.75])for(const lip of [-16,0,16]){
   const S={x:dd.x/100*CW+lip,y:dd.y/100*CH+14-(lip?3:0)};
   const T={x:(cup.x+cup.w*fx)/100*CW,y:cup.y/100*CH+6};
   const routes=[];
   for(const W of nodes){
    if(!P.slopeOK(S,W)||!P.slopeOK(W,T)||!P.clearSeg(S,W,walls)||!P.clearSeg(W,T,walls))continue;
    const path=[S,W,T];
    const length=Math.hypot(W.x-S.x,W.y-S.y)+Math.hypot(T.x-W.x,T.y-W.y);
    routes.push({path,length});
   }
   routes.sort((a,b)=>a.length-b.length);
   // Explicitly bounded per spout/lip/aim cell, independent of wall clock.
   for(const {path} of routes.slice(0,12)){
    add([path],d,fx,'wall-stair');
    const rails=P.toRails(path,walls,8,true);if(rails)add(rails,d,fx,'wall-stair-rails');
   }
  }
 }
 return out;
};
