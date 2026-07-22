#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const code = scripts.find(s => /var\s+LEVELS\s*=\s*\[\s*\]/.test(s) && /function\s+checkWin/.test(s));
if (!code) throw new Error('production game script not found');

function element() {
  return {
    textContent:'', innerHTML:'', className:'', style:{}, onclick:null,
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return[];},
    getBoundingClientRect(){return{left:0,top:0,width:480,height:640};},
    getContext(){return new Proxy({canvas:{width:480,height:640}}, {get(t,p){if(p in t)return t[p];return function(){return {addColorStop(){}};};},set(){return true;}});}
  };
}
const store = new Map();
const document = {readyState:'loading',hidden:false,getElementById(){return element();},querySelectorAll(){return[];},createElement(){return element();},addEventListener(){},body:element(),head:element()};
const window = {innerWidth:480,innerHeight:640,devicePixelRatio:1,addEventListener(){},removeEventListener(){},AudioContext:function(){},webkitAudioContext:function(){}};
const sandbox = {
  console, document, window, screen:{width:480,height:640}, performance:{now:()=>0},
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
  Math,JSON,Array,Object,String,Number,Boolean,Set,Map,Date
};
window.localStorage=sandbox.localStorage; window.requestAnimationFrame=sandbox.requestAnimationFrame; window.cancelAnimationFrame=sandbox.cancelAnimationFrame;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, {filename:'pin-pull-puzzle/index.inline.js',timeout:5000});
vm.runInContext("canvas=document.getElementById('gameCanvas');ctx=canvas.getContext('2d');", sandbox);
const count = vm.runInContext('LEVELS.length', sandbox);
if (count !== 30) throw new Error(`expected 30 production levels, got ${count}`);

let pass = 0;
for (let i=0;i<count;i++) {
  store.clear();
  const result = vm.runInContext(`(()=>{
    loadLevel(${i+1});
    const L=LEVELS[${i}];
    const pre={level:state.level,moves:state.moves,pins:state.pins.length,loot:state.loot.length,complete:state.levelComplete};
    const beforeUndo={pin:state.pins[0].pulled,lootX:state.loot[0].x,lootY:state.loot[0].y,moves:state.moves};
    saveState();state.pins[0].pulled=true;state.loot[0].x+=17;state.loot[0].y+=23;state.moves=1;undo();
    const undoOk=state.pins[0].pulled===beforeUndo.pin&&state.loot[0].x===beforeUndo.lootX&&state.loot[0].y===beforeUndo.lootY&&state.moves===0;
    state.moves=L.par;
    state.loot.forEach(l=>{l.collected=true;});
    checkWin();
    const saved=localStorage.getItem('pinpull_progress');
    const won=state.levelComplete===true && state.stars===3;
    return {pre,undoOk,won,saved,maxLevel:state.maxLevel};
  })()`, sandbox);
  const ok = result.pre.level===i+1 && result.pre.moves===0 && result.pre.pins>0 && result.pre.loot>0 && result.pre.complete===false && result.undoOk && result.won;
  if (ok) { pass++; console.log(`L${String(i+1).padStart(2,'0')} ENGINE PASS pins=${result.pre.pins} loot=${result.pre.loot} saved=${result.saved}`); }
  else console.log(`L${String(i+1).padStart(2,'0')} ENGINE FAIL ${JSON.stringify(result)}`);
}
console.log(`\n${pass}/${count} IN-ENGINE PASS (loadLevel + production checkWin + save path)`);
process.exit(pass===count?0:1);
