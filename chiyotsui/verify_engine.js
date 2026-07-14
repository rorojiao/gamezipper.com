// verify_engine.js — In-engine verification using vm.runInContext
// Method 3 of 3-method verification
// Loads the actual index.html engine code and tests checkWin() against solutions

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const levelsJson = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

// Extract the script content from the HTML
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Could not find main script tag');
  process.exit(1);
}
const engineCode = scriptMatch[1];

// Create a sandbox that simulates the browser environment
const sandbox = {
  console: console,
  window: { addEventListener: () => {}, AudioContext: function() { return { currentTime: 0, createOscillator: () => ({frequency:{},type:'',connect:()=>{},start:()=>{},stop:()=>{}}), createGain: () => ({gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}},connect:()=>{}}), connect: () => {}, destination: {}, close: () => {} }; }, webkitAudioContext: null },
  document: {
    getElementById: (id) => {
      const el = {
        style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        textContent: '', innerHTML: '', onclick: null, width: 0, height: 0,
        getContext: () => ({
          fillRect: () => {}, strokeRect: () => {}, beginPath: () => {}, moveTo: () => {},
          lineTo: () => {}, stroke: () => {}, fillText: () => {}, fill: () => {},
          fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: '', textBaseline: '',
          globalAlpha: 1
        }),
        addEventListener: () => {}, appendChild: () => {}, clientWidth: 560,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 })
      };
      return el;
    },
    addEventListener: () => {},
    createElement: (tag) => ({
      className: '', innerHTML: '', textContent: '', onclick: null,
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      style: {}, appendChild: () => {}
    }),
    querySelector: () => null
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: (fn) => { try { fn(); } catch(e) {} return 0; },
  AudioContext: null,
  webkitAudioContext: null,
  JSON: JSON,
  Math: Math,
  Date: Date,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp,
  Error: Error,
  Set: Set,
  Map: Map,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
};

// Create context and run engine code
const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(engineCode, ctx);
} catch (e) {
  console.error('Engine code error:', e.message);
  process.exit(1);
}

// Now test each level
let pass = 0;
for (const lv of levelsJson) {
  // Set up the state for this level
  const idx = lv.num - 1;
  
  // Use vm.runInContext to access and modify state
  try {
    // Init the level
    vm.runInContext(`initLevel(${idx});`, ctx);
    
    // Set the grid to the solution
    const solJson = JSON.stringify(lv.solution);
    vm.runInContext(`
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          state.grid[r][c] = ${solJson}[r][c];
        }
      }
    `, ctx);
    
    // Call checkWin
    const result = vm.runInContext('checkWin()', ctx);
    
    if (result) {
      pass++;
      console.log(`L${lv.num}: PASS`);
    } else {
      console.log(`L${lv.num}: FAIL — checkWin returned false for solution`);
      // Debug: check what's different
      const gridStr = vm.runInContext('JSON.stringify(state.grid)', ctx);
      console.log(`  Engine grid: ${gridStr.substring(0, 200)}...`);
      console.log(`  Solution:    ${solJson.substring(0, 200)}...`);
    }
  } catch (e) {
    console.log(`L${lv.num}: ERROR — ${e.message}`);
  }
}

console.log(`\n${pass}/${levelsJson.length} PASS`);
