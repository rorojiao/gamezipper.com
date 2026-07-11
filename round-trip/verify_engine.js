// verify_engine.js — In-engine verification using actual index.html game logic
// Method 3 of 3-method verification

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<!--/);
if (!scriptMatch) {
  console.log('ERROR: Could not find main script in index.html');
  process.exit(1);
}

let code = scriptMatch[1];
// Expose internal vars for testing
code += '\n;this.__LEVELS = LEVELS;';

const ctx = {
  console: console,
  setTimeout: () => {}, setInterval: () => {},
  clearInterval: () => {}, clearTimeout: () => {},
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
  },
  AudioContext: function() {
    return {
      createGain: () => ({ gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
      createOscillator: () => ({ type: '', frequency: { value: 0 }, connect: () => {}, start: () => {}, stop: () => {} }),
      currentTime: 0, destination: {}
    };
  },
  requestAnimationFrame: () => {},
  document: {
    getElementById: () => ({
      getContext: () => ({
        setTransform: () => {}, fillRect: () => {}, strokeRect: () => {},
        beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
        arc: () => {}, arcTo: () => {}, closePath: () => {},
        fill: () => {}, stroke: () => {}, fillText: () => {},
        save: () => {}, restore: () => {}, clearRect: () => {},
      }),
      style: {}, addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    }),
  },
  addEventListener: () => {},
};

ctx.window = ctx;
vm.createContext(ctx);

try {
  vm.runInContext(code, ctx);
} catch(e) {
  console.log('ERROR running engine code:', e.message);
  console.log(e.stack);
  process.exit(1);
}

const LEVELS = ctx.__LEVELS;
console.log(`Verifying ${LEVELS.length} levels via engine checkWin logic...\n`);

let validCount = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const R = lv.rows, C = lv.cols;

  // Build a test script that:
  // 1. Calls initLevel(i) to set up state array
  // 2. Fills state with the solution
  // 3. Calls checkWin()
  const gridJson = JSON.stringify(lv.grid);
  const testCode = `
    initLevel(${i});
    for (let r = 0; r < ${R}; r++) {
      for (let c = 0; c < ${C}; c++) {
        state[r][c] = ${gridJson}[r][c];
      }
    }
    checkWin();
  `;

  let result;
  try {
    result = vm.runInContext(testCode, ctx);
  } catch(e) {
    console.log(`  L${String(lv.level).padStart(2,'0')} ERROR: ${e.message}`);
    continue;
  }

  const status = result ? '✅ SOLVED' : '❌ NOT SOLVED';
  console.log(`  L${String(lv.level).padStart(2,'0')} ${lv.tierName.padEnd(10)} ${R}x${C} ${status}`);

  if (result) validCount++;
}

console.log(`\n${validCount}/${LEVELS.length} levels solvable via engine logic`);
process.exit(validCount === LEVELS.length ? 0 : 1);
