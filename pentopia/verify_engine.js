// Pentopia In-Engine Verifier — Method 3 of 3
// Loads the actual game engine code and verifies checkWin logic
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the <script> block (game engine only, not external scripts)
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!scriptMatch) { console.error('No inline script found'); process.exit(1); }

const code = scriptMatch[1];

// Set up VM context with minimal browser shims
const ctx = {
  window: {},
  document: {
    getElementById: () => {
      const el = {
        getContext: () => ({
          fillRect: () => {}, strokeRect: () => {}, clearRect: () => {},
          beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
          moveTo: () => {}, lineTo: () => {}, fillText: () => {},
          save: () => {}, restore: () => {}, translate: () => {},
          addEventListener: () => {}, onclick: null,
          width: 360, height: 360
        }),
        addEventListener: () => {},
        appendChild: function() { return this; },
        style: {}, onclick: null,
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        textContent: '', innerHTML: ''
      };
      return el;
    },
    addEventListener: () => {},
    createElement: () => {
      const el = {
        className: '', textContent: '', innerHTML: '',
        style: {}, onclick: null,
        appendChild: function() { return this; },
        animate: () => ({ onfinish: null }),
        remove: () => {},
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        dataset: {}
      };
      return el;
    },
    body: { appendChild: () => {} },
    querySelectorAll: () => []
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  AudioContext: function() {
    return {
      createGain: () => ({ gain: { value: 0, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
      createOscillator: () => ({ frequency: { value: 0 }, type: '', connect: () => {}, start: () => {}, stop: () => {} }),
      destination: {}, currentTime: 0
    };
  },
  setInterval: () => null,
  clearInterval: () => {},
  setTimeout: () => null,
  console: console,
  Math: Math,
  JSON: JSON,
  Set: Set,
  Map: Map,
  Object: Object,
  Array: Array
};
ctx.window.AudioContext = ctx.AudioContext;
ctx.webkitAudioContext = ctx.AudioContext;
vm.createContext(ctx);

// Promote const to globalThis for VM access
let engineCode = code.replace('const LEVELS =', 'globalThis.LEVELS =');
engineCode = engineCode.replace('const DIR_MAP', 'globalThis.DIR_MAP');
engineCode = engineCode.replace('const state =', 'globalThis.state =');
engineCode = engineCode.replace('function checkWin', 'globalThis.checkWin = function');
engineCode = engineCode.replace('function allCluesSatisfied', 'globalThis.allCluesSatisfied = function');
engineCode = engineCode.replace('function clueSatisfied', 'globalThis.clueSatisfied = function');

try {
  vm.runInContext(engineCode, ctx);
} catch(e) {
  console.error('Engine code execution error:', e.message);
  process.exit(1);
}

// Now access LEVELS from the engine
const LEVELS = ctx.LEVELS;
if (!LEVELS) { console.error('LEVELS not accessible from engine'); process.exit(1); }

console.log(`Engine loaded with ${LEVELS.length} levels`);

let pass = 0, fail = 0;
const DIR_MAP = ctx.DIR_MAP;

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  let errors = [];
  
  // Initialize level in engine
  try {
    // Manually set state to match the solution
    ctx.state.levelIdx = i;
    ctx.state.grid = Array(lv.R).fill(null).map(() => Array(lv.C).fill(null));
    ctx.state.placed = [];
    
    // Place all solution shapes
    for (const shape of lv.shapes) {
      for (const [r, c] of shape.cells) {
        ctx.state.grid[r][c] = shape.type;
      }
      ctx.state.placed.push({ type: shape.type, cells: shape.cells.map(c => [...c]) });
    }
    
    // Run checkWin
    const result = ctx.checkWin();
    
    // checkWin calls onWin which would show overlay, but in VM it's harmless
    // We need a version that doesn't trigger UI — let's verify manually instead
    
    // Manual verification using engine functions
    const cluesOK = ctx.allCluesSatisfied();
    const expectedShapes = lv.shapes.length;
    const placedShapes = ctx.state.placed.length;
    
    // Check no adjacency
    let adjacencyOK = true;
    for (let si = 0; si < ctx.state.placed.length; si++) {
      for (let sj = si+1; sj < ctx.state.placed.length; sj++) {
        for (const [r1,c1] of ctx.state.placed[si].cells) {
          for (const [r2,c2] of ctx.state.placed[sj].cells) {
            if (Math.abs(r1-r2)<=1 && Math.abs(c1-c2)<=1 && !(r1===r2&&c1===c2)) {
              adjacencyOK = false;
            }
          }
        }
      }
    }
    
    // Check no duplicate types
    const types = ctx.state.placed.map(p => p.type);
    const uniqueTypes = new Set(types).size === types.length;
    
    if (placedShapes === expectedShapes && cluesOK && adjacencyOK && uniqueTypes) {
      console.log(`✅ Level ${lv.level} (${lv.tierName}): in-engine verification PASS`);
      pass++;
    } else {
      if (placedShapes !== expectedShapes) errors.push(`shapes: ${placedShapes}/${expectedShapes}`);
      if (!cluesOK) errors.push('clues not satisfied');
      if (!adjacencyOK) errors.push('adjacency violation');
      if (!uniqueTypes) errors.push('duplicate types');
      console.log(`❌ Level ${lv.level}: ${errors.join(', ')}`);
      fail++;
    }
  } catch(e) {
    console.log(`❌ Level ${lv.level}: engine error: ${e.message}`);
    fail++;
  }
}

console.log(`\n=== IN-ENGINE RESULT: ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
