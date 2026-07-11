// Phase 6 Method 3: In-engine verification
// Loads the actual index.html engine and verifies checkWin() returns true for every level's solution.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the LEVELS data and engine functions from the embedded <script>
// The engine has: LEVELS array, level object, grid array, checkWin function, draw function

// Strategy: extract the full <script> block, run it in a sandbox with shims for DOM/canvas,
// then call checkWin for each level.

// Create a sandbox with minimal DOM shims
const sandbox = {
  console: console,
  window: {},
  document: {
    getElementById: () => ({
      style: {},
      getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
      }),
      width: 500, height: 500,
      addEventListener: () => {},
      classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
      appendChild: () => {},
    }),
    addEventListener: () => {},
    createElement: () => ({
      className: '', style: {}, animate: () => {}, remove: () => {},
    }),
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
  AudioContext: function() {
    return {
      currentTime: 0,
      state: 'running',
      resume: () => {},
      createGain: () => ({ gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
      createOscillator: () => ({ type: '', frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }),
      destination: {},
    };
  },
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {},
  navigator: {},
};

vm.createContext(sandbox);

// Extract all <script> content (non-JSON-LD scripts)
const scriptRegex = /<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scriptCount = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1].trim();
  if (code.length < 10) continue;
  try {
    vm.runInContext(code, sandbox);
    scriptCount++;
  } catch(e) {
    // Some scripts may fail (analytics, etc.) — that's OK
  }
}

console.log(`Loaded ${scriptCount} script blocks. LEVELS available: ${sandbox.LEVELS ? sandbox.LEVELS.length : 'NONE'}\n`);

// If LEVELS isn't on sandbox (const block-scoping), try evaluating it directly
if (!sandbox.LEVELS || sandbox.LEVELS.length === 0) {
  try {
    sandbox.LEVELS = vm.runInContext('LEVELS', sandbox);
  } catch(e) {
    console.error('ERROR: LEVELS not accessible in engine context:', e.message);
    process.exit(1);
  }
}

// Also make checkWin, isLineSatisfied, level, grid accessible
try { sandbox.checkWin = vm.runInContext('checkWin', sandbox); } catch(e) {}
try { sandbox.isLineSatisfied = vm.runInContext('isLineSatisfied', sandbox); } catch(e) {}

console.log(`LEVELS count: ${sandbox.LEVELS.length}`);
console.log(`checkWin available: ${typeof sandbox.checkWin === 'function'}`);
console.log(`isLineSatisfied available: ${typeof sandbox.isLineSatisfied === 'function'}\n`);

// Now verify each level using the engine's checkWin function
let allPass = true;
for (let i = 0; i < sandbox.LEVELS.length; i++) {
  const lv = sandbox.LEVELS[i];
  const N = lv.N;

  // Set up engine state via runInContext (so the script-scope vars are set correctly)
  const setupCode = `
    level = LEVELS[${i}];
    grid = Array.from({length: ${N}}, () => Array(${N}).fill(0));
    for (let r = 0; r < ${N}; r++) {
      for (let c = 0; c < ${N}; c++) {
        grid[r][c] = level.s[r][c];
      }
    }
  `;
  vm.runInContext(setupCode, sandbox);

  // Call checkWin and isLineSatisfied via runInContext
  const result = vm.runInContext('checkWin()', sandbox);
  const status = result ? '✅' : '❌';

  // Also verify the solution matches clues via the engine's isLineSatisfied
  let allLinesSatisfied = true;
  for (let r = 0; r < N; r++) {
    const sat = vm.runInContext(`isLineSatisfied('row', ${r})`, sandbox);
    if (!sat) allLinesSatisfied = false;
  }
  for (let c = 0; c < N; c++) {
    const sat = vm.runInContext(`isLineSatisfied('col', ${c})`, sandbox);
    if (!sat) allLinesSatisfied = false;
  }

  console.log(`L${String(lv.n).padStart(2)} [${lv.tier.padEnd(8)}] ${N}x${N}: ${status} checkWin=${result}, lines=${allLinesSatisfied ? 'ALL SATISFIED' : 'SOME UNSATISFIED'}`);

  if (!result || !allLinesSatisfied) allPass = false;
}

console.log(`\n${allPass ? 'ALL PASS' : 'SOME FAILED'}: ${sandbox.LEVELS.length}/${sandbox.LEVELS.length} levels`);
process.exit(allPass ? 0 : 1);
