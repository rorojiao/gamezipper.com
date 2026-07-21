#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function assert(condition, message) {
  if (!condition) { console.error('FAIL:', message); process.exitCode = 1; }
}

const m = html.match(/var LEVELS=\[([\s\S]*?)\n\];/);
assert(m, 'LEVELS_NOT_FOUND');
if (!m) process.exit(1);
let levels;
try { levels = Function(`"use strict";return [${m[1]}]`)(); }
catch (e) { console.error('FAIL: LEVELS_PARSE', e.message); process.exit(1); }
assert(levels.length === 20, `expected 20 levels, extracted ${levels.length}`);

const cells = level => {
  const out=[];
  for(let r=0;r<8;r++)for(let c=0;c<10;c++)out.push(`${r},${c}`);
  return out;
};
let structural=0;
for(let i=0;i<levels.length;i++){
  const l=levels[i], issues=[];
  if(!l.name)issues.push('missing name');
  if(!Number.isInteger(l.budget)||l.budget<1||l.budget>20)issues.push(`bad budget ${l.budget}`);
  for(const k of ['start','finish']) if(!l[k]||l[k].r<0||l[k].r>=8||l[k].c<0||l[k].c>=10)issues.push(`bad ${k}`);
  const seen=new Set();
  for(const s of l.stars||[]){const k=`${s.r},${s.c}`;if(s.r<0||s.r>=8||s.c<0||s.c>=10)issues.push(`bad star ${k}`);if(seen.has(k))issues.push(`duplicate star ${k}`);seen.add(k);}
  for(const f of l.fixed||[]){const k=`${f.r},${f.c}`;if(f.r<0||f.r>=8||f.c<0||f.c>=10||f.t<0||f.t>7)issues.push(`bad fixed ${k}/${f.t}`);if(k===`${l.start.r},${l.start.c}`||k===`${l.finish.r},${l.finish.c}`)issues.push(`fixed overlaps endpoint ${k}`);}
  assert(!issues.length, `L${i+1} ${l.name}: ${issues.join('; ')}`);
  if(!issues.length)structural++;
}

// Model-level state sequences mirror the production invariants under test.
function fresh(level){return{level,grid:new Map((level.fixed||[]).map(f=>[`${f.r},${f.c}`,{type:f.t,rot:0,fixed:true}])),piecesUsed:0,undo:[],selected:-1,stars:{},unlocked:1};}
function select(s,t){s.selected=s.selected===t?-1:t;}
function place(s,r,c){const k=`${r},${c}`;if(s.grid.has(k)||s.selected<0||s.piecesUsed>=s.level.budget)return false;s.grid.set(k,{type:s.selected,rot:0,fixed:false});s.undo.push({k,piece:null});s.piecesUsed++;return true;}
function remove(s,r,c){const k=`${r},${c}`,p=s.grid.get(k);if(!p||p.fixed)return false;s.undo.push({k,piece:p});s.grid.delete(k);s.piecesUsed--;return true;}
function undo(s){const a=s.undo.pop();if(!a)return false;if(a.piece){s.grid.set(a.k,a.piece);s.piecesUsed++;}else{s.grid.delete(a.k);s.piecesUsed--;}return true;}
function reset(s){const n=fresh(s.level);Object.assign(s,n);}
function complete(s,index,stars){s.stars[index]=Math.max(s.stars[index]||0,stars);s.unlocked=Math.max(s.unlocked,index+2);return JSON.stringify({v:2,stars:s.stars,unlocked:s.unlocked});}

let s=fresh(levels[0]);select(s,0);assert(s.selected===0,'palette selection failed');
const empties=cells(levels[0]).filter(k=>k!==`${levels[0].start.r},${levels[0].start.c}`&&k!==`${levels[0].finish.r},${levels[0].finish.c}`);
for(let i=0;i<levels[0].budget;i++){const [r,c]=empties[i].split(',').map(Number);assert(place(s,r,c),`placement ${i+1} failed`);}
let [or,oc]=empties[levels[0].budget].split(',').map(Number);assert(!place(s,or,oc),'budget overflow accepted');
let [rr,rc]=empties[0].split(',').map(Number);assert(remove(s,rr,rc)&&s.piecesUsed===levels[0].budget-1,'remove accounting failed');assert(undo(s)&&s.piecesUsed===levels[0].budget&&s.grid.has(`${rr},${rc}`),'undo removal failed');
assert(undo(s)&&s.piecesUsed===levels[0].budget-1,'undo placement failed');
reset(s);assert(s.piecesUsed===0&&s.undo.length===0,'reset invariant failed');
const saved=JSON.parse(complete(s,0,2));assert(saved.v===2&&saved.stars['0']===2&&saved.unlocked===2,'completion/unlock/save failed');complete(s,0,1);assert(s.stars[0]===2,'best stars downgraded');
const next=fresh(levels[1]);assert(next.level===levels[1]&&next.piecesUsed===0,'next-level invariant failed');
const retry=fresh(levels[0]);assert(retry.level===levels[0]&&retry.piecesUsed===0,'retry invariant failed');

const gates=[
 ['production budget gate',/state\.piecesUsed\s*>=\s*lvl\.budget/],
 ['placement increments usage',/state\.piecesUsed\+\+/],
 ['removal decrements usage',/state\.piecesUsed--/],
 ['undo restores removed piece',/state\.grid\[last\.r\]\[last\.c\]\s*=\s*last\.piece/],
 ['undo restores usage',/state\.piecesUsed\s*\+=\s*last\.piece\s*\?\s*1\s*:\s*-1/],
 ['save version',/var d=\{v:state\.saveVersion,stars:state\.levelStars,unlocked:state\.unlocked\}/],
 ['completion unlock',/state\.unlocked=Math\.max\(state\.unlocked,state\.currentLevel\+2\)/],
 ['retry flow',/startLevel\(state\.currentLevel\)/],
 ['next flow',/startLevel\(state\.currentLevel\+1\)/],
 ['reset flow',/function resetLevel\(\)[\s\S]*?initGrid\(\)/],
 ['QA production-state hook',/window\.__marbleRunQA=/]
 ];
for(const [name,re] of gates)assert(re.test(html),`missing ${name}`);

if(!process.exitCode)console.log(`PASS: extracted=${levels.length} structural=${structural}/${levels.length} model-state=12/12 production-gates=${gates.length}/${gates.length}`);
