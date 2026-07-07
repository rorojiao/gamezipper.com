// Flow Free — Quick playtest simulation
// Verifies that game logic works for a sample of levels (1 easy, 1 hard).
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const gameCode = scriptMatch[1];

const sandbox = {
  console,
  document: {
    addEventListener: () => {},
    createElement: () => ({ classList: { add: () => {} }, appendChild: () => {}, style: {} }),
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

const mockCanvas = {
  width: 400, height: 400,
  style: { width: '400px', height: '400px' },
  _ctx: null,
  getContext: function() {
    if (!this._ctx) {
      this._ctx = {
        setTransform: () => {}, clearRect: () => {}, fillRect: () => {},
        beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
        fill: () => {}, arc: () => {}, closePath: () => {},
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
    textContent: '', innerHTML: '', style: {}, onclick: null,
  };
};

vm.createContext(sandbox);

try {
  vm.runInContext(`
    ${gameCode}
    globalThis.__game = { STATE, LEVELS, loadLevel, startOrUpdatePipe, liftPipe, checkWin, countFilledCells };
  `, sandbox);
} catch (e) {
  console.error('Game load failed:', e.message);
  process.exit(1);
}

const gameApi = sandbox.__game;
const STATE = gameApi.STATE;
const LEVELS = gameApi.LEVELS;
if (!Array.isArray(LEVELS)) {
  console.error('LEVELS not array');
  process.exit(1);
}

console.log(`Loaded ${LEVELS.length} levels from game engine`);

// Playtest sample levels: 1 (easy), 15 (medium), 30 (hard)
const samples = [1, 15, 30];
let allPassed = true;

for (const id of samples) {
  const lvl = LEVELS.find(l => l.id === id);
  if (!lvl) { console.log(`Level ${id} not found`); allPassed = false; continue; }

  STATE.currentLevel = id;
  STATE.grid = lvl.grid.map(row => row.slice());
  STATE.pipes = {};
  STATE.currentPipe = null;
  STATE.undoStack = [];
  STATE.moves = 0;
  STATE.screen = 'playing';

  if (!lvl.runs || lvl.runs.length === 0) {
    console.log(`Level ${id}: no runs, skipping`);
    continue;
  }

  // Play by following runs
  for (let pid = 0; pid < lvl.runs.length; pid++) {
    const run = lvl.runs[pid];
    for (const idx of run) {
      const r = Math.floor(idx / lvl.C);
      const c = idx % lvl.C;
      gameApi.startOrUpdatePipe(r, c);
    }
    gameApi.liftPipe();
  }

  gameApi.checkWin();

  const totalCells = lvl.R * lvl.C;
  let totalFilled = 0;
  for (const path of Object.values(STATE.pipes)) totalFilled += path.length;

  const status = (totalFilled === totalCells && STATE.screen === 'won') ? 'PASS ✓' : 'FAIL ✗';
  console.log(`Level ${id} (${lvl.R}x${lvl.C}, ${lvl.num_pairs}p): ${status} (${totalFilled}/${totalCells} cells, screen=${STATE.screen})`);

  if (totalFilled !== totalCells || STATE.screen !== 'won') allPassed = false;
}

if (!allPassed) {
  console.log('\nPLAYTEST FAILED');
  process.exit(1);
}
console.log('\nPLAYTEST PASSED ✓');