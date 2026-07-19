// In-engine verifier: loads index.html in a VM, sets solution edges, calls checkSolution.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
// Extract the main <script> block (the game logic)
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('dotchi-loop');
let code = scriptMatch[0].replace(/<\/?script>/g, '');

// Extract LEVELS
const lvMatch = html.match(/const LEVELS=(\[.*?\]);/s);
if (!lvMatch) { console.log('Could not find LEVELS'); process.exit(1); }

// Minimal DOM/window shims
const ctx = {
  window: {},
  document: {
    getElementById: () => ({
      textContent: '', innerHTML: '', classList: { add(){}, remove(){}, toggle(){} },
      style: {}, appendChild(){}, onclick: null,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
    }),
    addEventListener: () => {},
    createElement: () => ({ className:'', style:{}, appendChild(){}, }),
    querySelectorAll: () => [],
    body: { appendChild(){}, addEventListener(){} },
  },
  console,
  JSON, Math, Date, Set, Map, Object, Array, String, Number, Boolean,
  parseInt, parseFloat, isNaN, setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {},
  localStorage: { getItem: () => null, setItem: () => {} },
  AudioContext: function(){ this.createGain=()=>({connect(){},gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}); this.destination={}; this.createOscillator=()=>({connect(){},start(){},stop(){},frequency:{value:0},type:''}); this.currentTime=0; },
};
ctx.window = ctx;
vm.createContext(ctx);

try {
  vm.runInContext(code, ctx);
} catch (e) {
  console.log('Script load error:', e.message);
  // Continue — we mainly need LEVELS, edges, checkSolution
}

// Now verify each level by setting edges = solution and calling checkSolution
const levels = JSON.parse(lvMatch[1]);
let pass = 0, fail = 0;
for (let i = 0; i < levels.length; i++) {
  const lv = levels[i];
  // Build edge set from solution
  const solEdges = new Set();
  for (const e of lv.solution) {
    const a = e[0] * 1000 + e[1], b = e[2] * 1000 + e[3];
    solEdges.add(a < b ? a + '-' + b : b + '-' + a);
  }
  try {
    // Set engine state
    vm.runInContext(`curLevel=${i}; edges = new Set(${JSON.stringify([...solEdges])});`, ctx);
    const result = vm.runInContext('checkSolution(true);', ctx);
    if (result) { pass++; }
    else { fail++; console.log(`L${lv.num} FAIL: checkSolution returned false`); }
  } catch (e) {
    fail++;
    console.log(`L${lv.num} ERROR: ${e.message}`);
  }
}
console.log(`\nIn-engine verifier: ${pass}/${levels.length} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
