// In-engine verifier for Bishop Path
// Loads game.js, calls validateSolutionPath for each level

const fs = require('fs');
const vm = require('vm');

// Read game.js
let gameJs;
try {
  gameJs = fs.readFileSync(__dirname + '/game.js', 'utf8');
} catch (e) {
  console.error('Could not read game.js:', e.message);
  process.exit(1);
}

// Stub browser globals
const sandbox = {
  window: {},
  document: {
    getElementById: () => {
      // Return a stub element with classList and addEventListener
      return {
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        addEventListener: () => {},
        removeEventListener: () => {},
        appendChild: () => {},
        style: {},
        dataset: {},
        innerHTML: '',
        textContent: '',
        querySelectorAll: () => [],
        getContext: () => ({ clearRect: () => {}, fillRect: () => {}, drawImage: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fillText: () => {}, fill: () => {}, save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {}, arc: () => {} }),
        width: 600,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 }),
      };
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    body: { appendChild: () => {} },
    createElement: () => ({ getContext: () => ({}), style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }, addEventListener: () => {}, appendChild: () => {} }),
    readyState: 'loading',
    hidden: false,
    dispatchEvent: () => {},
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  AudioContext: function() {
    return {
      createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '' }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, }),
      destination: {},
      currentTime: 0,
      resume: () => Promise.resolve(),
      close: () => Promise.resolve(),
    };
  },
  requestAnimationFrame: () => 1,
  setInterval: () => 1,
  setTimeout: () => 1,
  clearInterval: () => {},
  clearTimeout: () => {},
  performance: { now: () => Date.now() },
  navigator: { userAgent: 'Node.js' },
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1024,
  innerHeight: 768,
  console,
  Math,
  JSON,
  Array,
  String,
  Number,
  Set,
  Map,
  Promise,
  Date,
  RegExp,
  isNaN,
  parseInt,
  parseFloat,
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;

// Stub window.BISHOP_PATH_DATA with the levels data
const levelsData = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
sandbox.BISHOP_PATH_DATA = levelsData;

try {
  vm.createContext(sandbox);
  vm.runInContext(gameJs, sandbox);
} catch (e) {
  console.error('Error loading game.js:', e.message);
  console.error(e.stack);
  process.exit(1);
}

// Find the validateSolutionPath function
const ctx = sandbox;

if (typeof ctx.bishoppath !== 'object' || typeof ctx.bishoppath.validateSolutionPath !== 'function') {
  console.error('Could not find window.bishoppath.validateSolutionPath');
  process.exit(1);
}

const validateFn = ctx.bishoppath.validateSolutionPath;
console.log('Found validateSolutionPath');

// Run validation on all levels
const levels = levelsData.levels;
console.log(`\nIn-engine verifying ${levels.length} levels...`);

let passed = 0, failed = 0;

for (const lv of levels) {
  try {
    const result = validateFn(lv);
    if (result === true) {
      passed++;
    } else {
      console.log(`  ❌ L${lv.id}: validator returned ${result}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ L${lv.id}: validator threw: ${e.message}`);
    failed++;
  }
}

console.log(`\nRESULT: ${passed}/${levels.length} PASS, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
