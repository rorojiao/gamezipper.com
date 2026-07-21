#!/usr/bin/env node
// In-engine verifier for chocona: load index.html in vm sandbox, inject each level's solution
// into userBlack, call validateCurrent() which is the production checkWin path.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'chocona';
const html = fs.readFileSync(path.join('/home/msdn/gamezipper.com', SLUG, 'index.html'), 'utf8');

// Extract inline game scripts (no src, not ld+json)
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

const extractLevels = require('./gz-extract-levels.js');
const LEVELS = extractLevels(SLUG);
if (!LEVELS || LEVELS.length === 0) { console.error('LEVELS not extracted'); process.exit(1); }

const sandbox = {
  console,
  Math, Date, JSON, Array, Object, Set, Map,
  document: {
    getElementById: () => ({
      addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      textContent: '', innerHTML: '', style: {}, getContext: () => ({
        fillRect: () => {}, strokeRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
        arc: () => {}, fill: () => {}, stroke: () => {}, fillText: () => {}, clearRect: () => {},
        save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
      }),
      parentElement: { clientWidth: 500, clientHeight: 500 },
      width: 0, height: 0,
      appendChild: () => {},
    }),
    addEventListener: () => {},
    createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} }, animate: () => ({ onfinish: null }), remove: () => {}, appendChild: () => {}, querySelectorAll: () => [], textContent:'', innerHTML:'' }),
    body: { appendChild: () => {} },
    querySelector: () => null, querySelectorAll: () => [],
    hidden: false,
  },
  window: { AudioContext: function(){ return { createOscillator:()=>({connect:()=>{},frequency:{},start:()=>{},stop:()=>{},type:''}), createGain:()=>({connect:()=>{},gain:{setValueAtTime:()=>{}}}), currentTime:0, destination:{}, state:'running', resume:()=>{} }; }, innerWidth:1280, innerHeight:720, addEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} },
  setInterval: () => 0, clearInterval: () => {}, setTimeout: (fn) => fn && fn(), clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
};
sandbox.window.AudioContext = sandbox.window.AudioContext;

const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('engine load error:', e.message); process.exit(1); }

// Drive: loadLevel(idx), inject solution into userBlack, call validateCurrent
let pass = 0, fail = 0, fails = [];
const driver = `
  (function(){
    let pass=0, fail=0, fails=[];
    for(let i=0;i<LEVELS.length;i++){
      const L = LEVELS[i];
      currentLevelIdx = i;
      currentLevel = L;
      userBlack = new Set();
      for(const [r,c] of L.solution) userBlack.add(r+','+c);
      // Populate violationCells and satisfiedRegions
      const v = validateCurrent();
      const expected = L.solution.length;
      const ok = v.cluesOK && v.rectsOK;
      if(ok) pass++;
      else { fail++; fails.push('L'+(i+1)+':'+L.tier+':'+JSON.stringify(v)); }
    }
    return JSON.stringify({pass, fail, fails: fails.slice(0,5), total: LEVELS.length});
  })()
`;

const result = JSON.parse(vm.runInContext(driver, ctx));
console.log(`chocona in-engine: ${result.pass}/${result.total} PASS`);
if (result.fail > 0) {
  console.log('Fails:', result.fails);
}
process.exit(result.fail === 0 ? 0 : 1);
