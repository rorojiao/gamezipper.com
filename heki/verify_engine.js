// verify_engine.js — Method 3: In-engine verification via vm.runInContext
// Loads heki/index.html, extracts the engine code, runs checkWin() against each level's solution.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the <script> block that contains the engine (between <script> after LEVELS and </script>)
// The main engine script is the one containing "const LEVELS" and "function checkWin"
const scriptMatch = html.match(/<script>([\s\S]*?const LEVELS[\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('ERROR: Could not find engine script block');
  process.exit(1);
}
let engineCode = scriptMatch[1];

// Strip the external script includes at the bottom (gz-analytics etc.)
engineCode = engineCode.replace(/<script[\s\S]*$/,'');

// Also strip init() call at the end — we don't want DOMContentLoaded side effects
engineCode = engineCode.replace(/init\(\);[\s\S]*$/, '');

// Create a sandbox with stubs for browser APIs
const windowStub = {
  innerWidth: 800, innerHeight: 800,
  addEventListener: () => {},
  AudioContext: function() { return { createOscillator:()=>({connect:()=>{},frequency:{},type:'',start:()=>{},stop:()=>{}}), createGain:()=>({connect:()=>{},gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}), destination:{}, currentTime:0, close:()=>{} }; },
  webkitAudioContext: undefined,
};
const documentStub = {
  getElementById: () => ({ getContext: () => ({ clearRect:()=>{},fillRect:()=>{},strokeRect:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{},arc:()=>{},fill:()=>{},fillText:()=>{},fillStyle:'',strokeStyle:'',lineWidth:0,lineCap:'',textBaseline:'',textAlign:'',font:'',shadowColor:'',shadowBlur:0,width:500,height:500,style:{},classList:{toggle:()=>{},add:()=>{},remove:()=>{},contains:()=>false}, animate:()=>{} }), classList:{toggle:()=>{},add:()=>{},remove:()=>{},contains:()=>false}, style:{}, textContent:'', innerHTML:'', addEventListener:()=>{} }),
  addEventListener: () => {},
  hidden: false,
};
const localStorageStub = {
  getItem: () => null,
  setItem: () => {},
};
const canvasStub = { width: 500, height: 500, getBoundingClientRect: () => ({left:0,top:0,width:500,height:500}), getContext: () => ({ clearRect:()=>{},fillRect:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{},arc:()=>{},fill:()=>{},fillText:()=>{},fillStyle:'',strokeStyle:'',lineWidth:0,lineCap:'',textBaseline:'',textAlign:'',font:'',shadowColor:'',shadowBlur:0 }) };

const sandbox = {
  window: windowStub,
  document: documentStub,
  localStorage: localStorageStub,
  console: console,
  setTimeout: () => {}, clearTimeout: () => {}, setInterval: () => {}, clearInterval: () => {},
  Date: { now: () => 0 },
  Math: Math,
  JSON: JSON,
  Object: Object,
  Array: Array,
  Set: Set,
  Map: Map,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Error: Error,
};
sandbox.globalThis = sandbox;
sandbox.window.document = documentStub;
sandbox.window.localStorage = localStorageStub;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(engineCode, ctx, { timeout: 5000 });
} catch(e) {
  console.error('Engine code eval error:', e.message);
  process.exit(1);
}

// Now access LEVELS (declared with const at script scope — use runInContext to read)
const levelsCount = vm.runInContext('LEVELS.length', ctx);
console.log(`Loaded ${levelsCount} levels from engine`);

let pass = 0, fail = 0;
for (let i = 0; i < levelsCount; i++) {
  // Load the level into engine state, then apply solution borders, then checkWin
  vm.runInContext(`loadLevel(${i});`, ctx);
  // apply solution borders directly — inline the array to avoid const re-declaration
  const solArr = vm.runInContext(`LEVELS[${i}].solution_borders`, ctx);
  vm.runInContext(`
    state.borders = {};
    state.clues = Object.assign({}, LEVELS[${i}].clues);
    settings.autocheck = false;
    won = false;
  `, ctx);
  for (const k of solArr) {
    vm.runInContext(`state.borders[${JSON.stringify(k)}] = true;`, ctx);
  }
  // call checkWin(false) — returns true/false (autocheck off so no win() side effect)
  const ok = vm.runInContext('checkWin(false)', ctx);
  if (ok) { pass++; console.log(`L${i+1} ${LEVELS_tier(i)}: PASS`); }
  else { fail++; console.log(`L${i+1} ${LEVELS_tier(i)}: FAIL — checkWin returned false`); }
}

function LEVELS_tier(i) {
  return vm.runInContext(`LEVELS[${i}].tier + ' ' + LEVELS[${i}].R + 'x' + LEVELS[${i}].C`, ctx);
}

console.log(`\n=== RESULT: ${pass}/${levelsCount} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
