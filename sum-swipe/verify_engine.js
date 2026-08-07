// sum-swipe engine verifier — uses live globals from index.html
// Validates all 30 LEVELS in the catalog structurally + solution adjacency

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract inline script bodies (excluding src)
const re = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g;
let m;
const bodies = [];
while ((m = re.exec(html)) !== null) bodies.push(m[1]);

// Identify the GAME script (the long one with 'use strict' and the comment header)
const gameScript = bodies.find(b => /'use strict'/.test(b.slice(0, 200)));
if (!gameScript) {
  console.log(JSON.stringify({ verdict: 'FAIL', error: 'Game script not found' }));
  process.exit(1);
}

// Build minimal browser sandbox
function makeCanvas(id, w, h) {
  return {
    id,
    width: w,
    height: h,
    style: {},
    getContext: () => ({
      canvas: { width: w, height: h },
      save(){}, restore(){}, translate(){}, scale(){}, rotate(){},
      beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fill(){},
      arc(){}, fillRect(){}, clearRect(){}, strokeRect(){},
      fillText(){}, measureText: () => ({ width: 0 }),
      createLinearGradient: () => ({ addColorStop(){} }),
      getImageData: () => ({ data: new Uint8ClampedArray(0) }),
      putImageData(){}, drawImage(){},
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h, x: 0, y: 0, right: w, bottom: h }),
    addEventListener(){}, removeEventListener(){},
    setPointerCapture(){}, releasePointerCapture(){}, hasPointerCapture: () => false,
  };
}

const sandbox = {
  console,
  Date, Math, JSON, Number, String, Object, Array, RegExp, Error, TypeError, Map, Set, Promise,
  isFinite: (x) => Number.isFinite(x),
  parseInt: (x, r) => Number.parseInt(x, r || 10),
  parseFloat: (x) => Number.parseFloat(x),
  setTimeout: () => 0, clearTimeout: () => {},
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: (cb) => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  AudioContext: function() {
    return {
      createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0, exponentialRampToValueAtTime(){} }, type: 'sine' }),
      createGain: () => ({ connect: () => {}, disconnect: () => {}, gain: { value: 0, setValueAtTime(){}, exponentialRampToValueAtTime(){} } }),
      destination: {},
      currentTime: 0,
      state: 'suspended',
      resume: () => Promise.resolve(),
    };
  },
  document: {
    getElementById(id) {
      if (id === 'board') return makeCanvas('board', 600, 600);
      if (id === 'confetti') return makeCanvas('confetti', 1280, 577);
      if (id === 'menu-canvas') return makeCanvas('menu-canvas', 278, 278);
      return {
        id,
        innerHTML: '', textContent: '', innerText: '',
        value: '0',
        style: {},
        classList: { add(){}, remove(){}, contains: () => false, toggle(){} },
        appendChild(){}, append(){}, prepend(){},
        addEventListener(){}, removeEventListener(){},
        querySelector: () => null,
        querySelectorAll: () => [],
        children: [],
        click(){}, focus(){}, blur(){},
      };
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement(tag) {
      return {
        tagName: (tag || 'div').toUpperCase(),
        innerHTML: '', textContent: '', className: '',
        style: {},
        classList: { add(){}, remove(){}, contains: () => false },
        appendChild(){}, removeChild(){}, addEventListener(){},
        children: [], onclick: null,
      };
    },
    addEventListener(){}, removeEventListener(){},
    body: { appendChild(){}, addEventListener(){} },
  },
};
sandbox.window = {
  AudioContext: sandbox.AudioContext,
  webkitAudioContext: sandbox.AudioContext,
  performance: sandbox.performance,
  setTimeout: sandbox.setTimeout, clearTimeout: sandbox.clearTimeout,
  setInterval: sandbox.setInterval, clearInterval: sandbox.clearInterval,
  requestAnimationFrame: sandbox.requestAnimationFrame, cancelAnimationFrame: sandbox.cancelAnimationFrame,
  addEventListener: sandbox.document.addEventListener,
  gtag: () => {}, dataLayer: [],
  innerWidth: 1280, innerHeight: 577,
  devicePixelRatio: 1,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

try {
  vm.runInContext(gameScript, sandbox, { timeout: 5000 });
} catch(e) {
  console.error('Script execution error:', e.message);
  // Continue — many game scripts run partially and still expose LEVELS
}

// Pull LEVELS via vm
let LEVELS;
try { LEVELS = vm.runInContext('LEVELS', sandbox); } catch(e) {}

if (!LEVELS || !Array.isArray(LEVELS)) {
  console.log(JSON.stringify({ verdict: 'FAIL', error: 'LEVELS not exposed', sandboxKeys: Object.keys(sandbox).slice(0, 20) }, null, 2));
  process.exit(1);
}

const out = { total: LEVELS.length, passed: 0, failed: 0, levelResults: [], failReasons: [] };

function isAdjacent(a, b, cols) {
  const ra = Math.floor(a / cols), ca = a % cols;
  const rb = Math.floor(b / cols), cb = b % cols;
  return Math.max(Math.abs(ra - rb), Math.abs(ca - cb)) === 1;
}

for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const reasons = [];
  // Structural
  if (!L.rows || !L.cols) reasons.push(`rows/cols missing`);
  if (L.rows * L.cols !== L.nums.length) reasons.push(`rows*cols=${L.rows * L.cols} != nums.length=${L.nums.length}`);
  if (typeof L.target !== 'number' || L.target <= 0) reasons.push(`target=${L.target}`);
  if (!Array.isArray(L.solutions) || L.solutions.length === 0) reasons.push(`no solutions`);
  // First solution validity
  if (L.solutions && L.solutions[0]) {
    const sol = L.solutions[0];
    if (sol.length === 0) reasons.push(`empty solution`);
    let sum = 0;
    let prev = null;
    let solBad = false;
    for (let j = 0; j < sol.length; j++) {
      const idx = sol[j];
      if (typeof idx !== 'number' || idx < 0 || idx >= L.nums.length) { reasons.push(`sol[${j}]=${idx} OOB`); solBad = true; break; }
      if (prev !== null && !isAdjacent(prev, idx, L.cols)) { reasons.push(`sol[${j}]=${idx} not adjacent to ${prev}`); solBad = true; break; }
      sum += L.nums[idx];
      prev = idx;
    }
    if (!solBad && new Set(sol).size !== sol.length) reasons.push(`sol repeats cells: ${sol.join(',')}`);
    if (!solBad && sum !== L.target) reasons.push(`sol sum=${sum} != target=${L.target}`);
  }
  if (reasons.length === 0) {
    out.passed++;
    out.levelResults.push({ idx: i, ok: true, tier: L.tier, dim: `${L.rows}x${L.cols}`, target: L.target, sol_cells: L.solutions[0].length });
  } else {
    out.failed++;
    out.levelResults.push({ idx: i, ok: false, reasons });
    out.failReasons.push({ idx: i, reasons });
  }
}

out.verdict = out.failed === 0 ? `PASS ${out.passed}/${LEVELS.length}` : `FAIL ${out.failed}/${LEVELS.length}`;
console.log(JSON.stringify(out, null, 2));
process.exit(out.failed === 0 ? 0 : 1);
