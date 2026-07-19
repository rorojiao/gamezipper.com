const fs=require('fs');
const path=require('path');
const extractLevels=require(path.join(process.cwd(),'.audit/gz-extract-levels.js'));
const LEVELS=extractLevels('tile-master');
if(!Array.isArray(LEVELS)||LEVELS.length!==30){console.error(`FAIL: extracted ${Array.isArray(LEVELS)?LEVELS.length:'non-array'} levels`);process.exit(1)}

let expanded=0, memoHits=0, maxMemo=0;
function keyFor(cleared,tray){return cleared.toString(36)+'|'+tray.slice().sort((a,b)=>a-b).join(',')}
function solve(lv){
  const n=lv.tiles.length;
  if(n>120) throw new Error('level too large for bitmask solver');
  const typeCounts=new Map();
  const stacks=new Map();
  for(let i=0;i<n;i++){
    const t=lv.tiles[i];
    typeCounts.set(t.t,(typeCounts.get(t.t)||0)+1);
    const k=t.r+','+t.c;
    if(!stacks.has(k))stacks.set(k,[]);
    stacks.get(k).push(i);
  }
  const above=Array(n).fill(0n);
  for(const ids of stacks.values())for(const i of ids)for(const j of ids)if(lv.tiles[j].l>lv.tiles[i].l)above[i]|=1n<<BigInt(j);
  const ALL=(1n<<BigInt(n))-1n;
  const memo=new Set();
  function dfs(cleared,tray){
    if(cleared===ALL)return true;
    if(tray.length>=7)return false;
    const k=keyFor(cleared,tray); if(memo.has(k)){memoHits++;return false} memo.add(k);
    const counts={};for(const t of tray)counts[t]=(counts[t]||0)+1;
    const visible=[];
    for(let i=0;i<n;i++)if(!(cleared&(1n<<BigInt(i))) && (above[i]&~cleared)===0n)visible.push(i);
    visible.sort((a,b)=>(counts[lv.tiles[b].t]||0)-(counts[lv.tiles[a].t]||0));
    for(const i of visible){
      expanded++;
      const type=lv.tiles[i].t;let nt=tray.concat(type);
      const c=nt.filter(x=>x===type).length;
      if(c>=3){let rm=3;nt=nt.filter(x=>x!==type||rm--<=0)}
      if(dfs(cleared|(1n<<BigInt(i)),nt))return true;
    }
    return false;
  }
  const ok=dfs(0n,[]);maxMemo=Math.max(maxMemo,memo.size);return {ok,states:memo.size};
}
let failures=[];
for(const lv of LEVELS){
  const probs=[];
  if(lv.tiles.length!==lv.total)probs.push(`total ${lv.total} != ${lv.tiles.length}`);
  if(lv.total%3)probs.push('total not divisible by 3');
  const counts={};for(const t of lv.tiles){if(t.t<0||t.t>=lv.emojis.length)probs.push(`type ${t.t} out of range`);counts[t.t]=(counts[t.t]||0)+1}
  for(const [t,c] of Object.entries(counts))if(c%3)probs.push(`type ${t} count ${c} not multiple of 3`);
  const r=solve(lv);if(!r.ok)probs.push(`exhaustive solver unsolvable (${r.states} states)`);
  if(probs.length)failures.push({level:lv.id,problems:probs});
  console.log(`L${String(lv.id).padStart(2,'0')} ${r.ok?'PASS':'FAIL'} tiles=${lv.total} states=${r.states}`);
}
console.log(`SUMMARY levels=${LEVELS.length} failures=${failures.length} expanded=${expanded} memoHits=${memoHits} maxMemo=${maxMemo}`);
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exit(1)}
