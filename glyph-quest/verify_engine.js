// Glyph Quest verifier - run the production generator + isSolved() check for all 50 levels
// Strategy: load inline JS in a VM context with stubs, then re-run generateVerifiedLevel
// for each LEVEL_CONFIGS, then verify isSolved on the solution state.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/junze/gamezipper.com/glyph-quest/index.html', 'utf8');

// Extract inline <script>...</script> (game logic) - find the main script block
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
if (!scriptMatch) { console.error('No inline script found'); process.exit(1); }

// The main game script is the longest one (or the one with generateVerifiedLevel)
let mainScript = null;
for (const sm of scriptMatch) {
  const code = sm.replace(/<\/?script>/g, '');
  if (code.includes('generateVerifiedLevel') && code.includes('function isSolved')) {
    mainScript = code;
    break;
  }
}
if (!mainScript) { console.error('Main script not found'); process.exit(1); }

console.log('Main script length:', mainScript.length);

// Create a sandbox with stubs
const sandbox = {
  console,
  Math,
  Date,
  Set,
  Map,
  Array,
  Object,
  JSON,
  String,
  Number,
  Boolean,
  Error,
  Promise,
  Image: function() { return { onload: null, src: '', addEventListener: () => {}, complete: false }; },
  Audio: function() { return { play: () => {}, pause: () => {}, addEventListener: () => {} }; },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  // Browser stubs
  window: { addEventListener: () => {}, devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720 },
  document: {
    getElementById: () => ({ getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, fillText: () => {}, drawImage: () => {},
      save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
      beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, arc: () => {}, fill: () => {}, stroke: () => {}, closePath: () => {},
      measureText: () => ({ width: 0 }), getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData: () => {},
      set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set font(v){}, set globalAlpha(v){}, set textAlign(v){}, set textBaseline(v){}
    }), addEventListener: () => {}, style: {}, width: 0, height: 0, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false } }),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, fillText: () => {}, drawImage: () => {},
      save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
      beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, arc: () => {}, fill: () => {}, stroke: () => {}, closePath: () => {}
    }), addEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
    addEventListener: () => {},
    body: { appendChild: () => {} }
  },
  localStorage: {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; }
  },
  AudioContext: function() { return { createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {} }), createGain: () => ({ connect: () => {}, gain: { value: 0 } }), destination: {}, currentTime: 0 }; }
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);

try {
  vm.runInContext(mainScript, ctx, { timeout: 30000 });
  console.log('Script loaded into VM');
} catch (e) {
  console.error('Script load error:', e.message);
  process.exit(1);
}

// Check LEVELS
const LEVELS = ctx.LEVELS || sandbox.LEVELS;
if (!LEVELS) { console.error('LEVELS not in context'); process.exit(1); }
console.log('LEVELS extracted:', LEVELS.length);

const isSolved = ctx.isSolved || sandbox.isSolved;
if (!isSolved) { console.error('isSolved not in context'); process.exit(1); }

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lvl = LEVELS[i];
  try {
    // Set every hex to its solution state
    const grid = lvl.grid;
    lvl.allHexes.forEach(k => {
      const c = grid[k];
      if (c) c.rotation = c.solutionRotation;
    });
    const solved = isSolved(lvl);
    if (solved) pass++;
    else { fail++; fails.push({ idx: i, gridSize: lvl.cols + 'x' + lvl.rows }); }
  } catch (e) {
    fail++; fails.push({ idx: i, reason: e.message });
  }
}
console.log(`Glyph Quest: ${pass}/${LEVELS.length} levels solvable via isSolved() at solution state`);
if (fail > 0) {
  console.log('FAILS (first 10):');
  fails.slice(0, 10).forEach(f => console.log(`  L${f.idx + 1}${f.gridSize ? ' (' + f.gridSize + ')' : ''}: ${f.reason || 'isSolved=false'}`));
}
console.log(`VERDICT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
process.exit(fail === 0 ? 0 : 1);