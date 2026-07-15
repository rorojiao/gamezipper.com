/**
 * Square Jam — In-Engine Verifier (Phase 6, Method 3)
 * 
 * Loads the actual index.html, extracts the game's checkSolution() function,
 * and runs it against each level's solution to verify the engine correctly
 * accepts valid solutions.
 */

const vm = require('vm');
const fs = require('fs');

// Load levels
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

// Load HTML and extract game script
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const scriptBlocks = html.match(/<script>([\s\S]*?)<\/script>/g);
let gameCode = '';
for (const block of scriptBlocks) {
    const code = block.replace(/<\/?script[^>]*>/g, '');
    if (code.length > gameCode.length) gameCode = code;
}

// Create VM context with minimal mocks
function El() {
    return {
        textContent: '', style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
        addEventListener: () => {}, removeEventListener: () => {}, appendChild: () => {}, removeChild: () => {},
        querySelectorAll: () => [], getElementById: () => El(),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
        innerHTML: '', className: '', setPointerCapture: () => {},
        width: 400, height: 400, offsetWidth: 400, offsetHeight: 400,
        getContext: () => mockCtx, dataset: {}
    };
}

var mockCtx = {
    fillRect: () => {}, strokeRect: () => {}, clearRect: () => {},
    beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
    arc: () => {}, save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {}, scale: () => {},
    fillText: () => {}, strokeText: () => {}, measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    drawImage: () => {}, putImageData: () => {}, getImageData: () => ({ data: [] }),
    setLineDash: () => {}, createPattern: () => ({}),
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
    globalAlpha: 1, lineCap: '', lineJoin: '', globalCompositeOperation: ''
};

const ctx_obj = {
    window: {
        devicePixelRatio: 1,
        addEventListener: () => {}, removeEventListener: () => {},
        localStorage: {
            getItem: (k) => null,
            setItem: (k, v) => {}
        },
        innerWidth: 500, innerHeight: 800,
        AudioContext: function() { return { createOscillator: () => ({ start: () => {}, stop: () => {}, connect: () => {}, frequency: {}, type: '', gain: {} }), createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 } }), createBuffer: () => ({ getChannelData: () => new Float32Array(100) }), createBufferSource: () => ({ start: () => {}, stop: () => {}, connect: () => {}, buffer: null, loop: false }), createBiquadFilter: () => ({ connect: () => {}, type: '', frequency: { value: 0 }, Q: { value: 0 } }), destination: {}, currentTime: 0, sampleRate: 44100, close: () => {} }; },
        webkitAudioContext: function() { return ctx_obj.window.AudioContext(); },
    },
    document: {
        getElementById: (id) => {
            if (id === 'canvas') return { width: 400, height: 400, getContext: () => mockCtx, addEventListener: () => {}, setPointerCapture: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }) };
            return El();
        },
        querySelectorAll: () => [],
        querySelector: () => El(),
        createElement: (tag) => {
            var el = El();
            if (tag === 'canvas') { el.getContext = () => mockCtx; el.width = 400; el.height = 400; }
            return el;
        },
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        readyState: 'complete',
        addEventListener: () => {},
        hidden: false
    },
    console: console,
    setTimeout: setTimeout,
    setInterval: (fn, ms) => { return 1; },
    clearInterval: () => {},
    clearTimeout: () => {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    Date: Date,
    Math: Math,
    JSON: JSON,
    parseFloat: parseFloat,
    parseInt: parseInt,
    isNaN: isNaN,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    XMLHttpRequest: function() { return { open: () => {}, send: () => {}, onload: null, onerror: null, status: 0, responseText: '' }; },
};

vm.createContext(ctx_obj);

// Inject levels data
ctx_obj.window.__LEVELS__ = levels;

// Remove DOMContentLoaded listener (we call init() manually)
gameCode = gameCode.replace(/document\.addEventListener\('DOMContentLoaded'[\s\S]*?\}\);/g, '/* DOMContentLoaded skipped */');

try {
    vm.runInContext(gameCode, ctx_obj);
} catch(e) {
    console.log('Script execution error:', e.message);
    process.exit(1);
}

// Call init to load LEVELS from window.__LEVELS__
try {
    vm.runInContext('init()', ctx_obj);
} catch(e) {
    // init() may fail on resizeCanvas etc, but LEVELS should be loaded
}

// Now test: for each level, set up the solution borders and verify checkSolution returns true
let pass = 0, fail = 0;

for (const lv of levels) {
    // Simulate loading the level and setting all solution borders
    ctx_obj.state.level = lv.level;
    
    // We need to call loadLevel to set up state
    try {
        vm.runInContext('loadLevel(' + lv.level + ');', ctx_obj);
    } catch(e) {
        console.log(`Level ${lv.level}: FAIL - loadLevel error: ${e.message}`);
        fail++;
        continue;
    }
    
    // Set solution borders (drawn = region boundaries)
    var rows = lv.rows, cols = lv.cols;
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            // Check right neighbor
            if (c + 1 < cols && lv.regions[r][c] !== lv.regions[r][c+1]) {
                var k = vm.runInContext('edgeKey(' + r + ',' + c + ',' + r + ',' + (c+1) + ')', ctx_obj);
                if (k && ctx_obj.state.borders[k] !== 'wall') {
                    ctx_obj.state.borders[k] = 'drawn';
                }
            }
            // Check bottom neighbor
            if (r + 1 < rows && lv.regions[r][c] !== lv.regions[r+1][c]) {
                var k2 = vm.runInContext('edgeKey(' + r + ',' + c + ',' + (r+1) + ',' + c + ')', ctx_obj);
                if (k2 && ctx_obj.state.borders[k2] !== 'wall') {
                    ctx_obj.state.borders[k2] = 'drawn';
                }
            }
        }
    }
    
    // Run checkSolution
    var result = vm.runInContext('checkSolution()', ctx_obj);
    if (result === true) {
        pass++;
        console.log(`Level ${lv.level} (${lv.tierName}, ${rows}x${cols}): ✅ PASS (checkSolution = true)`);
    } else {
        fail++;
        console.log(`Level ${lv.level} (${lv.tierName}): ❌ FAIL (checkSolution = ${result})`);
    }
}

console.log(`\n${pass}/${pass + fail} levels PASSED (in-engine verification)`);
if (fail > 0) process.exit(1);
else console.log('✅ All levels verified via in-engine checkSolution');
