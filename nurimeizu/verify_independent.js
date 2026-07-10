// Independent Node.js verifier for Nurimeizu levels
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/nurimeizu/levels.json','utf8'));

function verifyMaze(colors, R, C) {
  const white = new Set();
  for (let r=0;r<R;r++) for(let c=0;c<C;c++) if(colors[r][c]===1) white.add(r+','+c);
  if(white.size===0) return [false,'no white cells'];
  const s = [...white][0].split(',').map(Number);
  const vis = new Set([s[0]+','+s[1]]);
  const q = [[...s]];
  while(q.length){
    const [r,c]=q.shift();
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const key=(r+dr)+','+(c+dc);
      if(white.has(key)&&!vis.has(key)){vis.add(key);q.push([r+dr,c+dc]);}
    }
  }
  if(vis.size!==white.size) return [false,'white not connected '+vis.size+'/'+white.size];
  let edges=0;
  for(const cell of white){
    const [r,c]=cell.split(',').map(Number);
    for(const [dr,dc] of [[1,0],[0,1]]){
      if(white.has((r+dr)+','+(c+dc))) edges++;
    }
  }
  if(edges!==white.size-1) return [false,'cycles: edges='+edges+' expected='+(white.size-1)];
  for(let r=0;r<R-1;r++) for(let c=0;c<C-1;c++){
    const v=colors[r][c];
    if(colors[r+1][c]===v&&colors[r][c+1]===v&&colors[r+1][c+1]===v)
      return [false,'2x2 block at '+r+','+c];
  }
  return [true,'OK'];
}

function bfsShortest(whiteSet, start, goal){
  const vis=new Set([start.join(',')]);
  const q=[[start,[start]]];
  while(q.length){
    const [pos,path]=q.shift();
    if(pos[0]===goal[0]&&pos[1]===goal[1]) return path;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=pos[0]+dr,nc=pos[1]+dc;
      const key=nr+','+nc;
      if(whiteSet.has(key)&&!vis.has(key)){vis.add(key);q.push([[nr,nc],[...path,[nr,nc]]]);}
    }
  }
  return null;
}

let pass=0, fail=0;
levels.forEach((lv,i)=>{
  const R=lv.rows, C=lv.cols, colors=lv.solution;
  const [ok,msg]=verifyMaze(colors,R,C);
  if(!ok){console.log('FAIL L'+(i+1)+': maze '+msg);fail++;return;}
  const whiteSet=new Set();
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(colors[r][c]===1) whiteSet.add(r+','+c);
  const s=lv.start, g=lv.goal;
  if(!whiteSet.has(s[0]+','+s[1])){console.log('FAIL L'+(i+1)+': S not white');fail++;return;}
  if(!whiteSet.has(g[0]+','+g[1])){console.log('FAIL L'+(i+1)+': G not white');fail++;return;}
  for(const c of lv.circles) if(!whiteSet.has(c[0]+','+c[1])){console.log('FAIL L'+(i+1)+': circle not white');fail++;return;}
  for(const t of lv.triangles) if(!whiteSet.has(t[0]+','+t[1])){console.log('FAIL L'+(i+1)+': triangle not white');fail++;return;}
  const spath=bfsShortest(whiteSet,s,g);
  if(!spath){console.log('FAIL L'+(i+1)+': no S-G path');fail++;return;}
  const spathSet=new Set(spath.map(p=>p[0]+','+p[1]));
  for(const c of lv.circles) if(!spathSet.has(c[0]+','+c[1])){console.log('FAIL L'+(i+1)+': circle not on shortest path');fail++;return;}
  for(const t of lv.triangles) if(spathSet.has(t[0]+','+t[1])){console.log('FAIL L'+(i+1)+': triangle on shortest path');fail++;return;}
  for(const room of lv.rooms){
    if(!room||room.length===0){console.log('FAIL L'+(i+1)+': empty room');fail++;return;}
    const c0=colors[room[0][0]][room[0][1]];
    for(const cell of room) if(colors[cell[0]][cell[1]]!==c0){console.log('FAIL L'+(i+1)+': room not monochromatic');fail++;return;}
  }
  console.log('PASS L'+(i+1)+' ('+R+'x'+C+' rooms='+lv.rooms.length+' circles='+lv.circles.length+' tri='+lv.triangles.length+')');
  pass++;
});
console.log('\n'+pass+'/'+levels.length+' PASSED'+(fail?' ('+fail+' failed)':''));
