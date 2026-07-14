// In-engine verification: load actual index.html, apply each level's stored
// solution to the engine state, then call the engine's checkWin().
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the main game <script> block (the one without src, containing LEVELS)
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let code = null;
for (const m of scriptMatches) {
  if (m[1].includes('LEVELS') || m[1].includes('const LEVELS') || m[1].includes('function checkWin')) {
    code = m[1];
    break;
  }
}
if (!code) {
  console.error('Could not find main game script block with LEVELS/checkWin');
  process.exit(2);
}

// Strip auto-init: remove DOMContentLoaded wrapper, beforeunload, resize listeners.
// Replace the entire DOMContentLoaded addEventListener block (it spans many lines
// with nested callbacks) up to its matching close. Easiest: cut everything from
// the "// ============== INIT" marker to end, since verification doesn't need init.
const initIdx = code.indexOf('// ============== INIT');
if (initIdx !== -1) code = code.slice(0, initIdx);
code = code.replace(/window\.addEventListener[\s\S]*?\}\);/g, '');
// const/let bindings are block-scoped in vm and don't attach to the sandbox
// global object. Transform top-level const/let to var so they leak to global.
code = code.replace(/\bconst\s+(LEVELS|state|COLORS|REGION_COLORS|CELL|DIRS)\b/g, 'var $1');
code = code.replace(/\blet\s+(audioCtx|musicNodes)\b/g, 'var $1');

// Set up a sandbox with stubs for DOM/canvas
const sandbox = {
  console,
  Math,
  Date,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Map,
  Set,
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    getElementById: () => ({
      getContext: () => ({
        fillRect: () => {}, strokeRect: () => {}, clearRect: () => {},
        beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
        fillText: () => {}, arc: () => {}, fill: () => {}, save: () => {}, restore: () => {},
        translate: () => {}, rotate: () => {},
        set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){},
        set font(v){}, set textAlign(v){}, set textBaseline(v){}, set lineCap(v){},
      }),
      width: 0, height: 0,
      style: {}, addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      appendChild: () => {}, removeChild: () => {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      set textContent(v){}, set innerHTML(v){},
      querySelector: () => ({ remove: () => {} }),
    }),
    createElement: () => ({
      style: {}, addEventListener: () => {}, set textContent(v){}, set innerHTML(v){},
      appendChild: () => {}, classList: { add: () => {}, remove: () => {} },
      onclick: null,
    }),
    body: { appendChild: () => {}, removeChild: () => {} },
    addEventListener: () => {},
  },
  window: { innerWidth: 800, innerHeight: 800, addEventListener: () => {} },
  AudioContext: function(){ return { createOscillator:()=>({connect:()=>{},start:()=>{},stop:()=>{},frequency:{},type:{},detune:{}}), createGain:()=>({connect:()=>{},gain:{}}), destination:{}, resume:()=>{}, close:()=>{}, state:'running' }; },
  setTimeout, setInterval, clearInterval, clearTimeout,
  alert: () => {},
};

const ctx = vm.createContext(sandbox);
vm.runInContext(code, ctx);

// The engine defines LEVELS, state, checkWin, regionAt, key, etc.
const L = sandbox.LEVELS;
const checkWin = sandbox.checkWin;
const keyFn = sandbox.key;
const regionAt = sandbox.regionAt;
console.log(`Loaded ${L.length} levels from engine.\n`);
console.log('=== In-Engine checkWin() Verification ===\n');

let pass = 0, fail = 0;
for (let i = 0; i < L.length; i++) {
  const level = L[i];
  // Set up state for this level like loadLevel does
  ctx.state.level = i;
  ctx.state.rows = level.rows;
  ctx.state.cols = level.cols;
  ctx.state.regionMap = level.regionMap;
  ctx.state.clues = level.clues;
  ctx.state.blackCells = new Set();
  ctx.state.hintCells = new Set();
  // Apply stored solution
  for (const cell of level.solution) {
    ctx.state.blackCells.add(keyFn(cell[0], cell[1]));
  }
  const result = checkWin.call(ctx);
  if (result.allValid) {
    console.log(`L${String(i+1).padStart(2,'0')} ${level.rows}x${level.cols}: PASS`);
    pass++;
  } else {
    console.log(`L${String(i+1).padStart(2,'0')} ${level.rows}x${level.cols}: FAIL`);
    for (const e of (result.errors||[])) console.log(`      - ${JSON.stringify(e)}`);
    fail++;
  }
}
console.log(`\n=== ${pass}/${L.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
