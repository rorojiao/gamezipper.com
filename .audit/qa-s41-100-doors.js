#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const slugDir = path.join(__dirname, '..', '100-doors');
const html = fs.readFileSync(path.join(slugDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const main = scripts.find(s => s.includes('function makeLevels()') && s.includes('function handleGameTap'));
if (!main) throw new Error('100-doors main inline script not found');

function noOp() {}
function gradient() { return { addColorStop: noOp }; }
const ctx2d = new Proxy({
  createLinearGradient: gradient,
  createRadialGradient: gradient,
  measureText: () => ({ width: 0 }),
  getImageData: () => ({ data: new Uint8ClampedArray(4) }),
}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return noOp;
  },
  set() { return true; },
});
const canvas = {
  width: 1280, height: 577, style: {},
  getContext: () => ctx2d,
  addEventListener: noOp,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 577 }),
};
const elements = new Map([['gc', canvas]]);
function el(id) {
  if (!elements.has(id)) elements.set(id, {
    id, style: {}, offsetHeight: 44, classList: { add: noOp, remove: noOp, toggle: noOp, contains: () => false },
    addEventListener: noOp, querySelectorAll: () => [], textContent: '', innerHTML: '',
  });
  return elements.get(id);
}
const storage = new Map();
const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Uint8ClampedArray,
  localStorage: { getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)) },
  document: {
    getElementById: el,
    addEventListener: noOp,
    dispatchEvent: noOp,
    readyState: 'complete',
    querySelectorAll: () => [],
  },
  CustomEvent: function(type, options) { this.type = type; this.detail = options && options.detail; },
  setInterval: () => 0, clearInterval: noOp,
  setTimeout: fn => { if (typeof fn === 'function') fn(); return 0; }, clearTimeout: noOp,
  requestAnimationFrame: () => 1, cancelAnimationFrame: noOp,
};
sandbox.window = sandbox;
sandbox.window.innerWidth = 1280;
sandbox.window.innerHeight = 577;
sandbox.window.devicePixelRatio = 1;
sandbox.window.addEventListener = noOp;
sandbox.window.AudioContext = function() {};

const context = vm.createContext(sandbox);
vm.runInContext(main, context, { filename: '100-doors/index.inline.js', timeout: 5000 });

const driver = String.raw`
(function(){
  var pass=[], fail=[];
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function mark(lid,ok,detail){(ok?pass:fail).push({level:lid,pt:levelData.pt,name:levelData.name,detail:detail});}
  function allTrue(o){for(var k in o)if(!o[k])return false;return true;}
  for(var lid=1;lid<=ALL_LEVELS.length;lid++){
    initLevel(lid);
    var L=levelData, ok=false, detail='';
    try{
      switch(L.pt){
        case LT.TAP:
        case LT.KEY:
        case LT.SLIDE:
        case LT.DRAG:
        case LT.PUZZLE:
        case LT.TIMING:
          ok = L.solution===true || typeof L.solution==='string';
          detail='production mechanic has finite goal and solvePuzzle path';
          break;
        case LT.NUMCODE:
        case LT.MATH:
        case LT.CIPHER:
        case LT.COUNT:
          codeInput=String(L.solution); checkCodeSolution(); ok=puzzleSolved; detail='code='+L.solution;
          break;
        case LT.COLOR:
        case LT.ORDER:
        case LT.SYMBOL:
        case LT.PATH:
        case LT.MIRROR:
        case LT.LIGHT:
        case LT.MEMORY:
        case LT.SIMON:
          lvlState.flashing=false; lvlState.input=L.solution.slice(); checkSequenceSolution(); ok=puzzleSolved; detail='sequence='+L.solution.join(',');
          break;
        case LT.ROTATE:
        case LT.DIAL:
          if(Array.isArray(L.solution)){lvlState.dialPos=L.solution.slice(); checkDialSolution();}
          else {lvlState.dialPos[0]=L.solution; checkDialSolution();}
          ok=puzzleSolved; detail='dial='+JSON.stringify(L.solution);
          break;
        case LT.SWITCH:
          lvlState.input=L.solution.slice(); L.solution.forEach(function(id){lvlState.leverPulled[id]=true;}); checkSwitchSolution(); ok=puzzleSolved; detail='switch='+L.solution.join(',');
          break;
        case LT.RATCHET:
          lvlState.gearPos=L.solution; ok=(lvlState.gearPos===L.solution); if(ok)solvePuzzle(); detail='gear='+L.solution;
          break;
        case LT.VALVE:
          lvlState.valvePos=L.solution.slice(); checkValveSolution(); ok=puzzleSolved; detail='valves='+L.solution.join(',');
          break;
        case LT.COLORFLIP:
          L.objects.forEach(function(o){if(o.type==='tile')lvlState.flipped[o.id]=(o.color!==o.target);}); checkColorFlip(); ok=puzzleSolved; detail='tile target parity';
          break;
        case LT.WIRE:
          var sol=JSON.parse(JSON.stringify(L.solution));
          for(var a in sol){var b=sol[a];lvlState.wireConns[a]=b;lvlState.wireConns[b]=a;}
          ok=Object.keys(sol).every(function(a){return lvlState.wireConns[a]===sol[a];});
          if(ok)solvePuzzle(); detail='wire='+JSON.stringify(sol);
          break;
        case LT.GRID:
          // Production win condition is all cells on. Prove a finite Lights-Out path by brute force all click masks.
          var initial=L.objects.map(function(o){return !!lvlState.gridState[L.objects.indexOf(o)];});
          var n=L.objects.length, found=-1;
          for(var mask=0;mask<(1<<n);mask++){
            var state=initial.slice();
            for(var i=0;i<n;i++)if(mask&(1<<i)){
              var o=L.objects[i]; state[i]=!state[i];
              var ds=[[0,1],[0,-1],[1,0],[-1,0]];
              for(var d=0;d<ds.length;d++)for(var j=0;j<n;j++)if(L.objects[j].row===o.row+ds[d][0]&&L.objects[j].col===o.col+ds[d][1])state[j]=!state[j];
            }
            if(state.every(Boolean)){found=mask;break;}
          }
          ok=found>=0; if(ok)solvePuzzle(); detail='lights-out-mask='+found;
          break;
        default: detail='unhandled puzzle type '+L.pt;
      }
      mark(lid,!!ok,detail);
    }catch(e){mark(lid,false,'EX:'+e.message);}
  }
  return JSON.stringify({total:ALL_LEVELS.length,pass:pass.length,fail:fail.length,failures:fail,types:Array.from(new Set(ALL_LEVELS.map(function(L){return L.pt;}))).sort(function(a,b){return a-b;})});
})()`;

const result = JSON.parse(vm.runInContext(driver, context, { timeout: 30000 }));
console.log(JSON.stringify(result, null, 2));
if (result.total !== 50 || result.pass !== 50 || result.fail !== 0) process.exit(1);
