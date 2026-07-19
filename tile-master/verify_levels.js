#!/usr/bin/env node
/**
 * Complete Tile Master level verifier.
 * Loads the canonical pack through the shared balanced-bracket extractor, checks
 * structural invariants, and proves every level has a legal clear sequence with
 * an exhaustive memoized solver (tray capacity 7, stack coverage, auto-triples).
 */
"use strict";
const path=require("path");
const extractLevels=require(path.join(__dirname,"..",".audit","gz-extract-levels.js"));
const LEVELS=extractLevels("tile-master");
if(!Array.isArray(LEVELS)||LEVELS.length!==30){
  console.error(`FAIL: expected 30 levels, extracted ${Array.isArray(LEVELS)?LEVELS.length:"non-array"}`);
  process.exit(1);
}
let expanded=0,memoHits=0,maxMemo=0;
function keyFor(cleared,tray){return cleared.toString(36)+"|"+tray.slice().sort((a,b)=>a-b).join(",")}
function solve(lv){
  const n=lv.tiles.length;
  if(n>120)throw new Error("level too large for BigInt solver");
  const stacks=new Map();
  for(let i=0;i<n;i++){
    const t=lv.tiles[i],k=t.r+","+t.c;
    if(!stacks.has(k))stacks.set(k,[]);
    stacks.get(k).push(i);
  }
  const above=Array(n).fill(0n);
  for(const ids of stacks.values())for(const i of ids)for(const j of ids)
    if(lv.tiles[j].l>lv.tiles[i].l)above[i]|=1n<<BigInt(j);
  const all=(1n<<BigInt(n))-1n,memo=new Set();
  function dfs(cleared,tray){
    if(cleared===all)return true;
    if(tray.length>=7)return false;
    const k=keyFor(cleared,tray);
    if(memo.has(k)){memoHits++;return false}
    memo.add(k);
    const counts={};for(const t of tray)counts[t]=(counts[t]||0)+1;
    const visible=[];
    for(let i=0;i<n;i++)if(!(cleared&(1n<<BigInt(i)))&&(above[i]&~cleared)===0n)visible.push(i);
    visible.sort((a,b)=>(counts[lv.tiles[b].t]||0)-(counts[lv.tiles[a].t]||0));
    for(const i of visible){
      expanded++;
      const type=lv.tiles[i].t;let nextTray=tray.concat(type);
      if(nextTray.filter(x=>x===type).length>=3){
        let remove=3;nextTray=nextTray.filter(x=>x!==type||remove--<=0);
      }
      if(dfs(cleared|(1n<<BigInt(i)),nextTray))return true;
    }
    return false;
  }
  const ok=dfs(0n,[]);maxMemo=Math.max(maxMemo,memo.size);return{ok,states:memo.size};
}
const failures=[];
for(const lv of LEVELS){
  const problems=[];
  if(lv.tiles.length!==lv.total)problems.push(`total ${lv.total} != ${lv.tiles.length}`);
  if(lv.total%3)problems.push("total not divisible by 3");
  const counts={};
  for(const t of lv.tiles){
    if(t.t<0||t.t>=lv.emojis.length)problems.push(`type ${t.t} out of range`);
    counts[t.t]=(counts[t.t]||0)+1;
  }
  for(const [type,count] of Object.entries(counts))if(count%3)problems.push(`type ${type} count ${count} not multiple of 3`);
  const result=solve(lv);
  if(!result.ok)problems.push(`exhaustive solver unsolvable (${result.states} states)`);
  if(problems.length)failures.push({level:lv.id,problems});
  console.log(`L${String(lv.id).padStart(2,"0")} ${result.ok?"PASS":"FAIL"} tiles=${lv.total} states=${result.states}`);
}
console.log(`SUMMARY levels=${LEVELS.length} failures=${failures.length} expanded=${expanded} memoHits=${memoHits} maxMemo=${maxMemo}`);
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exit(1)}
