#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function extract(name){const m=new RegExp('(?:const|let|var)\\s+'+name+'\\s*=\\s*\\[').exec(html);if(!m)throw Error(name+' not found');let s=html.indexOf('[',m.index),d=0,q=null,e=false;for(let i=s;i<html.length;i++){let c=html[i],n=html[i+1];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='/'&&n==='/'){i=html.indexOf('\n',i);continue}if(c==='/'&&n==='*'){i=html.indexOf('*/',i+2)+1;continue}if(c==='[')d++;else if(c===']'&&--d===0)return html.slice(s,i+1)}throw Error('unbalanced')}
const levels=vm.runInNewContext(extract('LEVELS'));
function verify(L){
 const n=L.n,N=n*n;if(!Number.isInteger(n)||L.sol.length!==N)return 'size';
 const groups=new Map();for(let i=0;i<N;i++){const g=L.sol[i];if(!Number.isInteger(g)||g<0)return 'region-id';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(i)}
 const clues=new Map(L.clues.map(([r,c,v])=>[r*n+c,v]));let seen=0;
 for(const cells of groups.values()){
  seen+=cells.length;const set=new Set(cells),st=[cells[0]],vis=new Set();
  while(st.length){const x=st.pop();if(vis.has(x))continue;vis.add(x);const r=Math.floor(x/n),c=x%n;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc,y=rr*n+cc;if(rr>=0&&rr<n&&cc>=0&&cc<n&&set.has(y)&&!vis.has(y))st.push(y)}}
  if(vis.size!==cells.length)return 'disconnected';
  const vals=cells.filter(x=>clues.has(x)).map(x=>clues.get(x));if(vals.length!==2)return 'clue-count';
  const area=cells.length,mx=Math.max(...vals),sum=vals[0]+vals[1];if(!(area>mx&&area<sum))return 'area';
 }
 return seen===N?null:'coverage';
}
let bad=[];levels.forEach((L,i)=>{const e=verify(L);if(e)bad.push(`${i+1}:${e}`)});
console.log(`Araf: ${levels.length} levels; independent rule/clue/solution verification: ${levels.length-bad.length}/${levels.length} PASS`);
if(bad.length){console.error(bad.join('\n'));process.exit(1)}
