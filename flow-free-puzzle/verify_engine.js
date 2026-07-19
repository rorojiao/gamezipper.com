// Flow Free — In-Engine BFS Verifier
// Loads the actual game engine (extracted from index.html) and runs it via vm.runInContext.
// Then verifies each level is solvable using the SAME logic as the game uses for the player.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
// Extract the <script> with the game code
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('flow-free-puzzle');
const gameCode = scriptMatch[1];

// Mock browser environment
const sandbox = {
  console,
  document: {
    getElementById: () => ({
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: () => {},
      textContent: '',
      innerHTML: '',
      style: {},
      onclick: null,
    }),
    addEventListener: () => {},
    createElement: () => ({ classList: { add: () => {} }, style: {}, appendChild: () => {} }),
  },
  window: {
    addEventListener: () => {},
    devicePixelRatio: 1,
    AudioContext: function() { return { state: 'running', resume: () => {}, currentTime: 0, createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0 }, type: '' }), createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }), destination: {} }; },
    webkitAudioContext: null,
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, Promise, setTimeout, setInterval, clearTimeout, clearInterval,
};
sandbox.global = sandbox;

// Create canvas object accessible via document.getElementById('game')
const mockCanvas = {
  width: 400, height: 400,
  style: { width: '400px', height: '400px' },
  _ctx: null,
  getContext: function(type) {
    if (!this._ctx) {
      this._ctx = {
        setTransform: () => {},
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        closePath: () => {},
        fillStyle: '', strokeStyle: '', lineWidth: 0, lineCap: '', lineJoin: '', globalAlpha: 1,
        save: () => {}, restore: () => {},
      };
    }
    return this._ctx;
  },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
  addEventListener: () => {},
};

sandbox.document.getElementById = function(id) {
  if (id === 'game') return mockCanvas;
  return {
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    textContent: '',
    innerHTML: '',
    style: {},
    onclick: null,
  };
};

vm.createContext(sandbox);

try {
  // Wrap to expose const declarations via globalThis
  const wrappedCode = `
    ${gameCode}
    globalThis.__game = { STATE, LEVELS, loadLevel, startOrUpdatePipe, liftPipe, checkWin, countFilledCells, getCellFromXY };
  `;
  vm.runInContext(wrappedCode, sandbox);
} catch (e) {
  console.error('Game code failed to load:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

// Access STATE and LEVELS via the exposed __game object
const gameApi = sandbox.__game;
const STATE = gameApi && gameApi.STATE;
if (!STATE || !LEVELS) {
  console.error('STATE or LEVELS not exposed');
  process.exit(1);
}
const LEVELS_ARR = LEVELS;  // already an array in engine
if (!Array.isArray(LEVELS_ARR)) {
  console.error('LEVELS is not an array:', typeof LEVELS_ARR);
  process.exit(1);
}

// Helper: simulate the game's drawing/loading logic
// Use the game's actual functions to "play" a level and verify solvability.

function loadLevelForVerify(id) {
  STATE.currentLevel = id;
  // Find level in LEVELS_ARR by id
  const lvl = LEVELS_ARR.find(l => l.id === id);
  if (!lvl) throw new Error(`Level ${id} not found`);
  STATE.grid = lvl.grid.map(row => row.slice());
  STATE.pipes = {};
  STATE.currentPipe = null;
  STATE.undoStack = [];
  STATE.moves = 0;
  STATE.screen = 'playing';
}

// Simulate a known solution: from the generator, we know the Hamiltonian path
// Let's just call the game functions to attempt to solve.

let totalSolvable = 0;
const failures = [];

for (let i = 0; i < LEVELS_ARR.length; i++) {
  const lvl = LEVELS_ARR[i];
  loadLevelForVerify(lvl.id);

  if (!STATE.grid || STATE.grid.length !== lvl.R) {
    failures.push({ id: lvl.id, reason: 'grid load failed' });
    console.log(`Level ${lvl.id}: LOAD FAILED ✗`);
    continue;
  }

  // Try to simulate playing the level via the game's pipe-laying functions.
  // We construct the constructive solution: for each pair, place pipes along
  // the path we KNOW exists (since the generator guarantees it).
  // But we don't store the path; we can simulate a snake from the endpoints
  // by computing the cell sequence ourselves.
  //
  // Simpler approach: walk the grid using the startOrUpdatePipe game function.
  // For each pair, take its two endpoints and connect them via Manhattan path
  // (which is one valid solution for the generated levels).

  let playSuccess = true;
  try {
    // Use the constructive solution stored in lvl.runs
    if (!lvl.runs || lvl.runs.length === 0) {
      // Fallback to BFS-based approach (may not cover all cells)
      throw new Error('No runs in level data');
    }

    // Reset pipes
    STATE.pipes = {};
    STATE.currentPipe = null;
    STATE.moves = 0;

    for (let pid = 0; pid < lvl.runs.length; pid++) {
      const run = lvl.runs[pid];
      const cells = run.map(idx => {
        const r = Math.floor(idx / lvl.C);
        const c = idx % lvl.C;
        return [r, c];
      });
      // Place each cell in sequence via game API
      for (const [r, c] of cells) {
        gameApi.startOrUpdatePipe(r, c);
      }
      gameApi.liftPipe();
    }

    // After placing all pairs, check win
    gameApi.checkWin();
    // Verify: STATE.pipes covers all cells
    let totalFilled = 0;
    for (const path of Object.values(STATE.pipes)) totalFilled += path.length;
    const totalCells = lvl.R * lvl.C;
    if (totalFilled !== totalCells) {
      playSuccess = false;
      console.log(`  Coverage: ${totalFilled}/${totalCells}`);
    }

    // Also verify win modal was triggered (STATE.screen === 'won')
    if (STATE.screen !== 'won') {
      playSuccess = false;
    }
  } catch (e) {
    playSuccess = false;
    console.log(`  Exception: ${e.message}`);
  }

  if (!playSuccess) {
    failures.push({ id: lvl.id, reason: 'play simulation failed' });
    console.log(`Level ${lvl.id} (${lvl.R}x${lvl.C}, ${lvl.num_pairs}p): PLAY SIM FAILED ✗`);
    continue;
  }

  totalSolvable++;
  console.log(`Level ${lvl.id} (${lvl.R}x${lvl.C}, ${lvl.num_pairs}p): SOLVABLE ✓ (engine playtest won)`);
}

console.log(`\n=== IN-ENGINE VERIFY SUMMARY ===`);
console.log(`Total: ${LEVELS_ARR.length}`);
console.log(`Loaded OK: ${totalSolvable}/${LEVELS_ARR.length}`);
if (failures.length > 0) {
  console.log(`FAILURES:`, failures);
  process.exit(1);
}
console.log(`\nALL LEVELS LOADED IN ENGINE ✓`);