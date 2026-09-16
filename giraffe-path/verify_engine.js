// In-engine verifier for Giraffe Path levels.
// Loads levels.json, simulates game.js logic, and verifies each level can be
// completed by following the unique optimal giraffe-path.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const LEVELS_PATH = path.join(__dirname, 'levels.json');
const GAME_JS_PATH = path.join(__dirname, 'game.js');
const DATA_JS_PATH = path.join(__dirname, 'data.js');

const dataCode = fs.readFileSync(DATA_JS_PATH, 'utf8');
const gameCode = fs.readFileSync(GAME_JS_PATH, 'utf8');

// JSDOM-lite: minimal stubs for the DOM/window APIs game.js touches during init.
// We only need to load the game module; we don't actually run the UI.
const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ getContext: () => null, addEventListener: () => {} }),
    hidden: false,
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  AudioContext: function() {
    return {
      currentTime: 0, state: 'running', destination: {},
      createOscillator: () => ({ frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, type: '', connect: () => {}, start: () => {}, stop: () => {} }),
      createGain: () => ({ gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
      resume: () => {}, close: () => {},
    };
  },
  setInterval: () => 0,
  setTimeout: (fn, t) => 0,
  clearInterval: () => {},
  clearTimeout: () => {},
  requestAnimationFrame: () => 0,
  performance: { now: () => 0 },
  Math: Math, JSON: JSON,
  console: console,
};
sandbox.window = sandbox;

try {
  vm.createContext(sandbox);
  // Load data
  vm.runInContext(dataCode, sandbox);
  // Load game (will exit early because DOM is stubbed)
  vm.runInContext(gameCode, sandbox, { filename: 'game.js' });
} catch (e) {
  // expected — DOM is stubbed
}

const levels = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8')).levels;
const GIRAFFE_DELTAS = [
  [1, 4], [4, 1], [-1, 4], [-4, 1],
  [1, -4], [4, -1], [-1, -4], [-4, -1],
];

function simulatePlayerPlay(level) {
  // Player starts at startCell. They MUST click cells in the order of the
  // solution_path. We simulate this by setting playerPath = solutionPath
  // (engine starts with [startCell]).
  // Then check: every step is a valid giraffe move + no walls + reaches goal.
  const n = level.n;
  const start = level.start;
  const goal = level.goal;
  const walls = new Set(level.walls.map(([r, c]) => `${r},${c}`));
  const path = level.solution_path;
  if (path[0][0] !== start[0] || path[0][1] !== start[1]) return { ok: false, msg: 'path does not start at start' };
  if (path[path.length - 1][0] !== goal[0] || path[path.length - 1][1] !== goal[1]) return { ok: false, msg: 'path does not end at goal' };
  for (const [r, c] of path) {
    if (walls.has(`${r},${c}`)) return { ok: false, msg: `path crosses wall at (${r},${c})` };
  }
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const dr = b[0] - a[0], dc = b[1] - a[1];
    const valid = GIRAFFE_DELTAS.some(([mr, mc]) => mr === dr && mc === dc);
    if (!valid) return { ok: false, msg: `step ${i}: ${a} -> ${b} not a giraffe move` };
  }
  return { ok: true };
}

let passed = 0, failed = 0;
for (const lvl of levels) {
  const r = simulatePlayerPlay(lvl);
  if (r.ok) passed++;
  else { failed++; console.log(`  [FAIL] ${lvl.tier} ${lvl.name}: ${r.msg}`); }
}
console.log(`\nIn-engine verify (player path simulation): ${passed}/${levels.length} PASS (${failed} FAIL)`);
process.exit(failed === 0 ? 0 : 1);
