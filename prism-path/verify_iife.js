// IIFE-injection harness: stub a minimal DOM, load the game script,
// then for each level apply the SOLUTION rotations and assert propagate().won === true.
"use strict";
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('prism-path');
let gameCode = m[1];

// We need to expose propagate + LEVELS + expandLevel from the game scope.
// Append an export line at the end of the script.
gameCode += '\n;this.__PP = { LEVELS, expandLevel, propagate, openSides, TYPE_NAMES, ROLE_NAMES, DIRS, TILE_BASE };\n';

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

const sandbox = { window, document, localStorage, performance, console, Math, Date, JSON, setTimeout:()=>{}, clearTimeout(){}, };
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
