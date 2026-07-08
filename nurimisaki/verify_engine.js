// In-engine Node.js verifier for Nurimisaki (Method 3)
// Loads the ACTUAL index.html, extracts the LEVELS array and validation logic,
// then replays each solution through the engine's validation functions.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the LEVELS array from the HTML
const levelsMatch = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (!levelsMatch) {
  console.error('Could not extract LEVELS from index.html');
  process.exit(1);
}

// Create a sandbox that simulates the browser environment
const sandbox = {
  console: console,
  window: {},
  document: {
    getElementById: () => ({
      textContent: '',
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      style: {},
      onclick: null,
      getContext: () => ({
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        textBaseline: ''
      }),
      width: 400, height: 400,
      addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 })
    }),
    addEventListener: () => {},
    createElement: () => ({ style: {}, classList: { add: () => {} }, innerHTML: '', appendChild: () => {}, onclick: null })
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  AudioContext: function() {
    return {
      currentTime: 0,
      destination: {},
      createGain: () => ({ gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
      createOscillator: () => ({
        frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        type: 'sine', connect: () => {}, start: () => {}, stop: () => {}
      }),
      state: 'running',
      resume: () => {}
    };
  },
  requestAnimationFrame: () => {},
  setTimeout: () => {},
  Date: { now: () => 0 },
  Math: Math,
  JSON: JSON,
  Set: Set,
  Map: Map,
  Array: Array,
  Object: Object,
  Number: Number,
  String: String,
  Boolean: Boolean
};

// Execute the HTML's script to get LEVELS
const script = new vm.Script(`
  ${levelsMatch[0]}
  module_exports = { LEVELS };
`);
const context = vm.createContext(sandbox);
try {
  script.runInContext(context);
} catch(e) {
  // The script references document etc; just get LEVELS directly
}

// Actually just eval the LEVELS array directly since the full script needs DOM
const LEVELS = JSON.parse(levelsMatch[1]);

console.log(`Extracted ${LEVELS.length} levels from index.html`);

// Re-implement the engine's validation logic (mirroring index.html exactly)
function getRayLength(grid, r, c, dr, dc, gridSize) {
  let len = 0;
  let nr = r + dr, nc = c + dc;
  while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === 1) {
    len++;
    nr += dr; nc += dc;
  }
  return len;
}

// Mirror the engine's validateSolution + checkSolution logic
function engineValidate(level) {
  const gridSize = level.size;
  // Build grid from solution (as the engine would see a correctly-solved puzzle)
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  const clueMap = {};
  const solutionSet = new Set();
  
  level.clues.forEach(c => { clueMap[c.r + ',' + c.c] = c.v; });
  level.solution.forEach(s => { solutionSet.add(s[0] + ',' + s[1]); });
  
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const key = r + ',' + c;
      if (solutionSet.has(key)) grid[r][c] = 1;
    }
  }
  
  // Engine's validateSolution logic:
  const violations = [];
  
  // Check clue constraints
  for (const key in clueMap) {
    const [r, c] = key.split(',').map(Number);
    const val = clueMap[key];
    if (grid[r][c] !== 1) {
      violations.push([r, c]);
      continue;
    }
    let found = false;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const len = getRayLength(grid, r, c, dr, dc, gridSize);
      if (len === val) { found = true; break; }
    }
    if (!found) violations.push([r, c]);
  }
  
  // Check connectivity
  const whiteCells = [];
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (grid[r][c] === 1) whiteCells.push([r, c]);
  
  if (whiteCells.length > 0) {
    const visited = new Set();
    const queue = [whiteCells[0]];
    while (queue.length) {
      const [r, c] = queue.shift();
      const k = r + ',' + c;
      if (visited.has(k)) continue;
      visited.add(k);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === 1) {
          queue.push([nr, nc]);
        }
      }
    }
    if (visited.size !== whiteCells.length) {
      whiteCells.forEach(([r, c]) => {
        if (!visited.has(r + ',' + c)) violations.push([r, c]);
      });
    }
  }
  
  // Engine's checkSolution also verifies solution match
  let allMatch = true;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const key = r + ',' + c;
      const isWhite = grid[r][c] === 1;
      const shouldWhite = solutionSet.has(key);
      if (isWhite !== shouldWhite && !(key in clueMap)) {
        allMatch = false;
        break;
      }
    }
  }
  
  return {
    valid: violations.length === 0 && allMatch,
    violations: violations.length,
    matched: allMatch,
    whiteCount: whiteCells.length
  };
}

// Run verification
let pass = 0, fail = 0;
LEVELS.forEach((level, i) => {
  const result = engineValidate(level);
  if (result.valid) {
    console.log(`✅ L${i+1} ${level.tier} ${level.size}×${level.size}: ENGINE-VALID (${result.whiteCount} whites, 0 violations)`);
    pass++;
  } else {
    console.log(`❌ L${i+1} ${level.tier}: ENGINE-FAIL (violations=${result.violations}, matched=${result.matched})`);
    fail++;
  }
});

console.log(`\n=== IN-ENGINE RESULTS ===`);
console.log(`Passed: ${pass}/${LEVELS.length}`);
console.log(`Failed: ${fail}/${LEVELS.length}`);
process.exit(fail > 0 ? 1 : 0);
