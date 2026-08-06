#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const main = scripts.find(s => s.includes('function makeLevels()') && s.includes('function handleGameTap'));
if (!main) throw new Error('Main inline engine not found');

function noOp() {}
const context2d = new Proxy({
  createLinearGradient: () => ({ addColorStop: noOp }),
  createRadialGradient: () => ({ addColorStop: noOp }),
  measureText: () => ({ width: 0 }),
}, { get: (t, p) => p in t ? t[p] : noOp, set: () => true });
const canvas = { width: 1280, height: 577, style: {}, getContext: () => context2d,
  addEventListener: noOp, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 577 }) };
const elements = new Map([['gc', canvas]]);
const el = id => {
  if (!elements.has(id)) elements.set(id, { id, style: {}, offsetHeight: 44,
    classList: { add: noOp, remove: noOp, toggle: noOp, contains: () => false },
    addEventListener: noOp, querySelectorAll: () => [], textContent: '', innerHTML: '' });
  return elements.get(id);
};
const storage = new Map();
const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite,
  localStorage: { getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)) },
  document: { getElementById: el, addEventListener: noOp, dispatchEvent: noOp, readyState: 'complete', querySelectorAll: () => [] },
  CustomEvent: function(type, opts) { this.type = type; this.detail = opts && opts.detail; },
  setInterval: () => 0, clearInterval: noOp, setTimeout: fn => { if (fn) fn(); return 0; }, clearTimeout: noOp,
  requestAnimationFrame: () => 1, cancelAnimationFrame: noOp,
};
sandbox.window = sandbox;
Object.assign(sandbox.window, { innerWidth: 1280, innerHeight: 577, devicePixelRatio: 1, addEventListener: noOp, AudioContext: function() {} });
const ctx = vm.createContext(sandbox);
vm.runInContext(main, ctx, { filename: '100-doors/index.inline.js', timeout: 5000 });

const result = JSON.parse(vm.runInContext(`(function(){
  var pass=0, failures=[];
  function done(lid,ok,msg){if(ok)pass++;else failures.push('L'+lid+': '+msg);}
  for(var lid=1;lid<=ALL_LEVELS.length;lid++){
    initLevel(lid); var L=levelData, ok=false;
    try{
      switch(L.pt){
        case LT.TAP: case LT.KEY: case LT.SLIDE: case LT.DRAG: case LT.PUZZLE: case LT.TIMING:
          ok=L.solution===true||typeof L.solution==='string'; break;
        case LT.NUMCODE: case LT.MATH: case LT.CIPHER: case LT.COUNT:
          codeInput=String(L.solution); checkCodeSolution(); ok=puzzleSolved; break;
        case LT.COLOR: case LT.ORDER: case LT.SYMBOL: case LT.PATH: case LT.MIRROR:
        case LT.LIGHT: case LT.MEMORY: case LT.SIMON:
          lvlState.flashing=false; lvlState.input=L.solution.slice(); checkSequenceSolution(); ok=puzzleSolved; break;
        case LT.ROTATE: case LT.DIAL:
          lvlState.dialPos=Array.isArray(L.solution)?L.solution.slice():[L.solution]; checkDialSolution(); ok=puzzleSolved; break;
        case LT.SWITCH:
          lvlState.input=L.solution.slice(); L.solution.forEach(function(id){lvlState.leverPulled[id]=true;}); checkSwitchSolution(); ok=puzzleSolved; break;
        case LT.RATCHET: lvlState.gearPos=L.solution; ok=lvlState.gearPos===L.solution; break;
        case LT.VALVE: lvlState.valvePos=L.solution.slice(); checkValveSolution(); ok=puzzleSolved; break;
        case LT.COLORFLIP:
          L.objects.forEach(function(o){if(o.type==='tile')lvlState.flipped[o.id]=(o.color!==o.target);}); checkColorFlip(); ok=puzzleSolved; break;
        case LT.WIRE:
          ok=Object.keys(L.solution).every(function(a){return L.objects.some(function(o){return o.id===a;})&&L.objects.some(function(o){return o.id===L.solution[a];});}); break;
        case LT.GRID:
          var initial=L.objects.map(function(o,i){return !!lvlState.gridState[i];}), n=L.objects.length;
          for(var mask=0;mask<(1<<n)&&!ok;mask++){
            var s=initial.slice();
            for(var i=0;i<n;i++)if(mask&(1<<i)){
              var o=L.objects[i];s[i]=!s[i];var ds=[[0,1],[0,-1],[1,0],[-1,0]];
              for(var d=0;d<ds.length;d++)for(var j=0;j<n;j++)if(L.objects[j].row===o.row+ds[d][0]&&L.objects[j].col===o.col+ds[d][1])s[j]=!s[j];
            }
            ok=s.every(Boolean);
          } break;
      }
      done(lid,!!ok,'type '+L.pt+' did not accept embedded solution');
    }catch(e){done(lid,false,e.message);}
  }
  return JSON.stringify({total:ALL_LEVELS.length,pass:pass,fail:failures.length,failures:failures});
})()`, ctx, { timeout: 30000 }));

console.log(JSON.stringify(result, null, 2));
if (result.total !== 50 || result.pass !== 50 || result.fail) process.exit(1);