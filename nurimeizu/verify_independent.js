#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const levelsPath = path.join(__dirname, 'levels.json');
const raw = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
const levels = Array.isArray(raw) ? raw : raw.levels;
if (!Array.isArray(levels) || levels.length !== 30) throw new Error(`expected 30 levels in ${levelsPath}, got ${levels && levels.length}`);

function verify(lv) {
  const h = lv.h, w = lv.w, rooms = lv.rooms;
  const blackIds = new Set(lv.solution);
  const [sr,sc] = lv.s, [gr,gc] = lv.g;
  const gridBlack = Array.from({length:h},()=>Array(w).fill(false));
  for (const rid of blackIds) {
    if (!Number.isInteger(rid) || rid < 0 || rid >= rooms.length) return {ok:false,msg:'black room id out of range'};
    for (const [r,c] of rooms[rid]) gridBlack[r][c] = true;
  }
  if (gridBlack[sr][sc] || gridBlack[gr][gc]) return {ok:false,msg:'S/G black'};
  for (let r=0;r<h-1;r++) for (let c=0;c<w-1;c++) {
    const b=[gridBlack[r][c],gridBlack[r][c+1],gridBlack[r+1][c],gridBlack[r+1][c+1]];
    if (b.every(Boolean) || !b.some(Boolean)) return {ok:false,msg:`2x2 same color at ${r},${c}`};
  }
  const white=[];
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) if(!gridBlack[r][c]) white.push([r,c]);
  if (!white.length) return {ok:false,msg:'no white'};
  const vis=new Set([white[0].join(',')]), q=[white[0]];
  while(q.length){const [r,c]=q.shift();for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const nr=r+dr,nc=c+dc,k=nr+','+nc;if(nr>=0&&nr<h&&nc>=0&&nc<w&&!gridBlack[nr][nc]&&!vis.has(k)){vis.add(k);q.push([nr,nc]);}}}
  if(vis.size!==white.length) return {ok:false,msg:'white disconnected'};
  let edges=0;
  for(let r=0;r<h;r++)for(let c=0;c<w;c++)if(!gridBlack[r][c]){if(r+1<h&&!gridBlack[r+1][c])edges++;if(c+1<w&&!gridBlack[r][c+1])edges++;}
  if(edges!==white.length-1) return {ok:false,msg:`white maze is not a tree edges=${edges} nodes=${white.length}`};
  const dist={}, q2=[[sr,sc]];dist[sr+','+sc]=0;
  while(q2.length){const [r,c]=q2.shift();for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const nr=r+dr,nc=c+dc,k=nr+','+nc;if(nr>=0&&nr<h&&nc>=0&&nc<w&&!gridBlack[nr][nc]&&!(k in dist)){dist[k]=dist[r+','+c]+1;q2.push([nr,nc]);}}}
  const target=gr+','+gc;if(!(target in dist))return{ok:false,msg:'no path S->G'};
  const distG={},q3=[[gr,gc]];distG[target]=0;
  while(q3.length){const [r,c]=q3.shift();for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const nr=r+dr,nc=c+dc,k=nr+','+nc;if(nr>=0&&nr<h&&nc>=0&&nc<w&&!gridBlack[nr][nc]&&!(k in distG)){distG[k]=distG[r+','+c]+1;q3.push([nr,nc]);}}}
  const onPath=new Set(Object.keys(dist).filter(k=>k in distG&&dist[k]+distG[k]===dist[target]));
  for(const [r,c] of lv.circles)if(!onPath.has(r+','+c))return{ok:false,msg:`circle ${r},${c} not on path`};
  for(const [r,c] of lv.triangles)if(onPath.has(r+','+c))return{ok:false,msg:`triangle ${r},${c} on path`};
  for(const [r,c] of [[sr,sc],[gr,gc],...lv.circles,...lv.triangles])if(blackIds.has(lv.roomGrid[r][c]))return{ok:false,msg:`marker room black at ${r},${c}`};
  return {ok:true};
}
let pass=0;
for(const lv of levels){const r=verify(lv);if(r.ok)pass++;console.log(`L${String(lv.num).padStart(2,'0')} ${r.ok?'PASS':'FAIL '+r.msg}`);}
console.log(`\n${pass}/${levels.length} INDEPENDENT PASS`);process.exit(pass===levels.length?0:1);
