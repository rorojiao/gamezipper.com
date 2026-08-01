// IIFE-injection harness: stub a minimal DOM, load the game script,
// then for each level apply the SOLUTION rotations and assert propagate().won === true.
"use strict";
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
// prism-path uses LEVELS_RAW = [ ... compact JSON ... ]; const LEVELS = LEVELS_RAW.map(expandLevel);
// Extract the LEVELS_RAW literal directly via balanced-bracket scanner.
function findMatching(s, i, open, close){
  let depth=1, inStr=null;
  while(i<s.length && depth>0){
    const c=s[i];
    if(inStr){
      if(c==='\\'){ i+=2; continue; }
      if(c===inStr) inStr=null;
    } else {
      if(c==='"'||c==="'"||c==='`'){ inStr=c; }
      else if(c===open) depth++;
      else if(c===close){ depth--; }
    }
    i++;
  }
  return depth===0 ? i : -1;
}
const m = html.match(/const\s+LEVELS_RAW\s*=\s*\[/);
if(!m){ console.error('LEVELS_RAW not found'); process.exit(2); }
const start = m.index + m[0].length;
const end = findMatching(html, start, '[', ']');
if(end<0){ console.error('LEVELS_RAW unterminated'); process.exit(2); }
const RAW = JSON.parse('[' + html.slice(start, end - 1) + ']');
console.log('Loaded', RAW.length, 'compact levels');

// Extract the IIFE script body. prism-path wraps logic inside (function(){...})()
// at the bottom of index.html. We grab the largest <script>...</script> block.
const sm = html.match(/<script>([\s\S]*?)<\/script>/g);
if(!sm){ console.error('No <script> block found'); process.exit(2); }
// Use largest script block (the inline IIFE).
let largest = '';
for(const tag of sm){
  const inner = tag.replace(/^<script>/, '').replace(/<\/script>$/, '');
  if(inner.length > largest.length) largest = inner;
}
let gameCode = largest;
// Append an export at the end of the IIFE: take the return / last expression.
// prism-path wraps everything in (function(){...})(). The return propagates
// `{ LEVELS, expandLevel, propagate, openSides, TYPE_NAMES, ROLE_NAMES, DIRS, TILE_BASE }`
// already (verified by inspecting the source). Capture sandbox's last expression via
// appending `;__PP = (typeof LEVELS !== "undefined") ? ({LEVELS, expandLevel, propagate, openSides, TYPE_NAMES, ROLE_NAMES, DIRS, TILE_BASE}) : null;`
// after the IIFE. If the IIFE returned a value, use that.
gameCode = gameCode + '\n;globalThis.__PP = (typeof LEVELS !== "undefined") ? {LEVELS, expandLevel, propagate, openSides, TYPE_NAMES, ROLE_NAMES, DIRS, TILE_BASE} : null;\n';

// Build a sandbox
const window = {
  innerWidth: 400, innerHeight: 700, devicePixelRatio: 1,
  AudioContext: function(){ return { createOscillator:()=>({connect(){},start(){},stop(){},frequency:{},type:{}}), createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}), currentTime:0, destination:{} }; },
  addEventListener(){},
  requestAnimationFrame(fn){ /* no-op */ },
};
const document = {
  getElementById(id){
    // return a fake element
    return {
      style:{}, classList:{ add(){}, remove(){}, toggle(){} },
      textContent:'', innerHTML:'', addEventListener(){}, onclick:null,
      getBoundingClientRect(){ return {left:0,top:0,width:400,height:700}; },
      getContext(){ return fakeCtx(); },
      width:0, height:0,
    };
  },
  createElement(){ return { className:'', innerHTML:'', textContent:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){}, onclick:null, appendChild(){} }; },
  addEventListener(){},
};
const localStorage = {
  store:{},
  getItem(k){ return this.store[k]||null; },
  setItem(k,v){ this.store[k]=String(v); },
};
const performance = { now: ()=>0 };

const sandbox = { window, document, localStorage, performance, console, Math, Date, JSON, setTimeout:()=>{}, clearTimeout:()=>{}, requestAnimationFrame:()=>{}, cancelAnimationFrame:()=>{} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

try{
  vm.runInContext(gameCode, sandbox);
}catch(e){
  console.error('Script load error:', e.message);
  process.exit(3);
}

const PP = sandbox.__PP;
if(!PP){ console.error('__PP export not found'); process.exit(4); }
console.log('Game script loaded. LEVELS count:', PP.LEVELS.length);

let pass=0, fail=0;
for(let i=0;i<PP.LEVELS.length;i++){
  const lvl = PP.LEVELS[i];
  // apply solution rotations
  const solTiles = lvl.tiles.map(t=>({...t, rot:t.sol}));
  const res = PP.propagate(solTiles);
  if(res.won){
    pass++;
  } else {
    fail++;
    console.log('Level '+(i+1)+' FAIL: satisfied='+res.satisfied.length+' of '+lvl.tiles.filter(t=>t.role==='target').length+' targets');
  }
}
console.log('\nIIFE harness result: '+pass+'/'+PP.LEVELS.length+' WIN on solution state');
if(fail===0 && pass===30){ console.log('ALL 30 PASS'); process.exit(0); }
else { console.log('FAILURES'); process.exit(1); }

function fakeCtx(){
  return new Proxy({}, { get(){ return ()=>{}; } });
}
