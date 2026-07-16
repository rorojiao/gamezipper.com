#!/usr/bin/env node
// In-engine verifier: loads index.html, extracts LEVELS + checkSolution, and runs
// each level's solution against the actual game logic.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract LEVELS
const mLevels = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (!mLevels) { console.error('No LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(mLevels[1]);

// Extract the engine script (between markers)
const engineStart = html.indexOf('// ============================================================\n// Nuranaito game engine');
if (engineStart === -1) { console.error('No engine'); process.exit(1); }
const engineEnd = html.indexOf('// ---------- init ----------', engineStart);
const engineSrc = html.substring(engineStart, engineEnd + '// ---------- init ----------'.length);
const initSrc = html.substring(engineEnd + '// ---------- init ----------'.length);
const fullInit = initSrc.substring(0, initSrc.indexOf('</script>'));

// Include LEVELS const in engine scope
const engineWithLevels = `const LEVELS = ${JSON.stringify(LEVELS)};\n${engineSrc}`;

// Mock browser environment
const mockWindow = {
  addEventListener: () => {},
  innerWidth: 1280,
  innerHeight: 800,
};
global.window = mockWindow;
mockWindow.window = mockWindow;
const mockDocument = {
  getElementById: (id) => {
    if (id === 'board' || id === 'confetti') {
      return {
        textContent: '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        appendChild: () => {},
        innerHTML: '',
        style: {},
        onclick: null,
        onchange: null,
        addEventListener: () => {},
        dataset: {},
        parentElement: { clientWidth: 600 },
        width: 600,
        height: 600,
        getContext: () => ({
          clearRect: () => {},
          fillRect: () => {},
          fillText: () => {},
          fillStyle: '',
          font: '',
          textAlign: '',
          textBaseline: '',
          strokeStyle: '',
          lineWidth: 0,
          strokeRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          arc: () => {},
          fill: () => {},
        }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 }),
      };
    }
    return {
      textContent: '',
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      appendChild: () => {},
      innerHTML: '',
      style: {},
      onclick: null,
      onchange: null,
      addEventListener: () => {},
      dataset: {},
      parentElement: { clientWidth: 600 },
    };
  },
  querySelectorAll: () => [],
  createElement: () => ({
    textContent: '', className: '', classList: { add: () => {} }, appendChild: () => {},
    innerHTML: '', style: {}, onclick: null, addEventListener: () => {},
  }),
  body: { appendChild: () => {} },
  addEventListener: () => {},
};
const mockLocalStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = v; },
};
const mockAudioContext = function() {
  return {
    currentTime: 0,
    destination: {},
    createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0 }, type: '' }),
    createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
    close: () => Promise.resolve(),
  };
};
const sandbox = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockLocalStorage,
  AudioContext: mockAudioContext,
  webkitAudioContext: mockAudioContext,
  console: console,
  requestAnimationFrame: () => {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math,
  Date: Date,
  JSON: JSON,
  Array: Array,
  Object: Object,
  Map: Map,
  Set: Set,
  Error: Error,
  parseInt: parseInt,
  parseFloat: parseFloat,
  String: String,
  Number: Number,
  Boolean: Boolean,
};
sandbox.global = sandbox;

vm.createContext(sandbox);
try {
  vm.runInContext(engineWithLevels, sandbox);
  vm.runInContext(fullInit, sandbox);
} catch (e) {
  console.error('Error loading engine:', e.message);
  process.exit(1);
}

// Now run each level
let pass = 0;
for (const level of LEVELS) {
  try {
    // Load the level
    vm.runInContext(`loadLevel(${level.i});`, sandbox);
    // Get the solution from level.blacks and place it on the grid
    const N = level.N;
    // Build a 2D grid of expected values
    const expectedGrid = [];
    const blacks = new Set(level.b.map(idx => idx));
    for (let r = 0; r < N; r++) {
      const row = [];
      for (let c = 0; c < N; c++) {
        row.push(blacks.has(r * N + c) ? 1 : 0);
      }
      expectedGrid.push(row);
    }
    const result = vm.runInContext(`
      JSON.stringify((() => {
        const K = lv.N;
        // Set grid[r][c] for non-clue cells from expected
        const expected = ${JSON.stringify(expectedGrid)};
        for (let r = 0; r < K; r++) {
          for (let c = 0; c < K; c++) {
            if (givensMap[r][c] !== null) continue;
            grid[r][c] = expected[r][c];
          }
        }
        // Run checkSolution
        return checkSolution();
      })())
    `, sandbox);
    const parsed = JSON.parse(result);
    const ok = parsed.ok;
    console.log(`Level ${level.i + 1} (${level.t}, ${level.N}x${level.N}): ${ok ? 'PASS' : 'FAIL — ' + parsed.reason}`);
    if (ok) pass++;
  } catch (e) {
    console.log(`Level ${level.i + 1}: ERROR — ${e.message}`);
  }
}
console.log(`\nResult: ${pass}/${LEVELS.length} PASS`);
process.exit(pass === LEVELS.length ? 0 : 1);
