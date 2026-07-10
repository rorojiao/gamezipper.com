// Independent Node.js verifier for Nurimeizu levels
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json','utf8'));

function verify(lv) {
  const h = lv.h, w = lv.w;
  const rooms = lv.rooms;
  const blackIds = new Set(lv.solution);
  const [sr,sc] = lv.s, [gr,gc] = lv.g;
  
  const gridBlack = Array(h).fill(null).map(()=>Array(w).fill(false));
  for (const rid of blackIds) {
    for (const [r,c] of rooms[rid]) gridBlack[r][c] = true;
  }
  
  if (gridBlack[sr][sc] || gridBlack[gr][gc]) return {ok:false,msg:'S/G black'};
  
  for (let r=0;r<h-1;r++) for (let c=0;c<w-1;c++) {
    const b=[gridBlack[r][c],gridBlack[r][c+1],gridBlack[r+1][c],gridBlack[r+1][c+1]];
    if (b.every(x=>x) || !b.some(x=>x)) return {ok:false,msg:'2x2 same color at '+r+','+c};
  }
  
  const white=[];
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) if(!gridBlack[r][c]) white.push([r,c]);
  if (!white.length) return {ok:false,msg:'no white'};
  
  const vis=new Set([white[0].join(',')]);
  const q=[white[0]];
  while(q.length){
    const [r,c]=q.shift();
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<h&&nc>=0&&nc<w&&!gridBlack[nr][nc]&&!vis.has(nr+','+nc)){
        vis.add(nr+','+nc);q.push([nr,nc]);
      }
    }
  }
  if(vis.size!==white.length) return {ok:false,msg:'white disconnected'};
  
  let edges=0;
  for(let r=0;r<h;r++) for(let c=0;c<w;c++){
    if(!gridBlack[r][c]){
      if(r+1<h&&!gridBlack[r+1][c]) edges++;
      if(c+1<w&&!gridBlack[r][c+1]) edges++;
    }
  }
  if(edges>=white.length) return {ok:false,msg:'white has loop edges='+edges+' nodes='+white.length};
  
  const dist={};dist[sr+','+sc]=0;
  const q2=[[sr,sc]];
  while(q2.length){
    const [r,c]=q2.shift();
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<h&&nc>=0&&nc<w&&!gridBlack[nr][nc]&&!(nr+','+nc in dist)){
        dist[nr+','+nc]=dist[r+','+c]+1;q2.push([nr,nc]);
      }
    }
  }
  if(!(gr+','+gc in dist)) return {ok:false,msg:'no path S->G'};
  
  const td=dist[gr+','+gc];
  const distG={};distG[gr+','+gc]=0;
  const q3=[[gr,gc]];
  while(q3.length){
    const [r,c]=q3.shift();
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<h&&nc>=0&&nc<w&&!gridBlack[nr][nc]&&!(nr+','+nc in distG)){
        distG[nr+','+nc]=distG[r+','+c]+1;q3.push([nr,nc]);
      }
    }
  }
  const onPath=new Set();
  for(const k in dist){
    if(k in distG&&dist[k]+distG[k]===td) onPath.add(k);
  }
  
  for(const [r,c] of lv.circles){
    if(!onPath.has(r+','+c)) return {ok:false,msg:'circle ('+r+','+c+') not on path'};
  }
  for(const [r,c] of lv.triangles){
    if(onPath.has(r+','+c)) return {ok:false,msg:'triangle ('+r+','+c+') on path'};
  }
  
  const roomGrid = lv.roomGrid;
  for (const [r,c] of [[sr,sc],[gr,gc],...lv.circles,...lv.triangles]) {
    if (blackIds.has(roomGrid[r][c])) return {ok:false,msg:'marker room black at ('+r+','+c+')'};
  }
  
  return {ok:true,msg:'OK'};
}

let allOk = true;
for (const lv of levels) {
  const r = verify(lv);
  if (!r.ok) { allOk = false; }
  console.log('L'+String(lv.num).padStart(2)+' '+lv.tierName.padEnd(10)+' '+lv.h+'x'+lv.w+' '+
    'R='+lv.rooms.length+'(B'+lv.solution.length+') C'+lv.circles.length+' T'+lv.triangles.length+' '+
    (r.ok?'PASS':'FAIL '+r.msg));
}
console.log(allOk?'\nALL 30/30 PASS':'\nSOME FAILED');
process.exit(allOk?0:1);
