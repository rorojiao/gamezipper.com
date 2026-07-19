// verify_engine.js — In-engine verification using vm.runInContext
// Loads actual index.html, extracts LEVELS and checkWin, verifies each level.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS constant
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('evolomino');
// Extract the main script block
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const mainScript = scripts.find(s => s[1].includes('checkWin'));
if (!mainScript) { console.error('Could not find main script with checkWin'); process.exit(1); }

// Build sandbox: mock DOM + load mainScript
const sandbox = {
    window: {
        addEventListener: () => {},
    },
    document: {
        getElementById: () => ({
            textContent: '', innerHTML: '',
            classList: { toggle: () => {}, add: () => {}, remove: () => {} },
            appendChild: () => {}, removeChild: () => {},
            style: {},
            addEventListener: () => {},
            onclick: null,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
            width: 100, height: 100,
            getContext: () => ({
                fillRect: () => {}, strokeRect: () => {},
                fillText: () => {},
                set fillStyle(v) {}, get fillStyle() { return ''; },
                set font(v) {}, get font() { return ''; },
                set textAlign(v) {}, get textAlign() { return ''; },
                set textBaseline(v) {}, get textBaseline() { return ''; },
                set strokeStyle(v) {}, get strokeStyle() { return ''; },
                set lineWidth(v) {}, get lineWidth() { return 1; },
            }),
        }),
        createElement: () => ({
            className: '', innerHTML: '', style: {},
            classList: { toggle: () => {}, add: () => {}, remove: () => {} },
            querySelectorAll: () => [],
            appendChild: () => {},
            onclick: null,
        }),
        body: { addEventListener: () => {} },
        addEventListener: () => {},
    },
    localStorage: {
        getItem: () => '{}', setItem: () => {},
    },
    AudioContext: function() { return { createGain: () => ({ gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {} }), createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0, exponentialRampToValueAtTime: () => {} }, type: '' }), destination: {}, currentTime: 0 }; },
    setInterval: () => 0, clearInterval: () => {},
    setTimeout: () => 0, clearTimeout: () => {},
    Math: Math, Date: Date, JSON: JSON,
};
sandbox.window.AudioContext = sandbox.AudioContext;

vm.createContext(sandbox);
try {
    vm.runInContext(mainScript[1], sandbox);
} catch (e) {
    console.error('Script error:', e.message);
    process.exit(1);
}

// Access globals via sandbox (const declarations may or may not be exposed)
// In Node.js vm module, const/let inside a script become accessible via context
// but only if assigned to global properties. Let's eval them:
const LEVELS_EVAL = vm.runInContext('LEVELS', sandbox);
const checkWin = vm.runInContext('checkWin', sandbox);
const loadLevel = vm.runInContext('loadLevel', sandbox);

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS_EVAL.length; i++) {
    // Set curLevel and player to solution (must be in context's lexical scope)
    vm.runInContext(`curLevel = ${i}; player = LEVELS[${i}].solution.map(r => r.slice());`, sandbox);
    try {
        const ok = checkWin();
        if (ok) pass++;
        else {
            fail++;
            console.error(`Level ${LEVELS_EVAL[i].id} (${LEVELS_EVAL[i].tier}): checkWin FAILED on solution`);
        }
    } catch (e) {
        fail++;
        console.error(`Level ${LEVELS_EVAL[i].id} (${LEVELS_EVAL[i].tier}): checkWin threw ${e.message}`);
    }
    // Test wrong cell — level 1 only
    if (i === 0) {
        vm.runInContext(`const _orig = LEVELS[0].solution.map(r => r.slice()); _orig[0][0] = _orig[0][0] === 1 ? 0 : 1; player = _orig;`, sandbox);
        const shouldFail = !checkWin();
        if (!shouldFail) {
            console.error(`Level ${LEVELS_EVAL[i].id}: checkWin WRONGLY accepted modified solution`);
            fail++;
        }
    }
}

console.log(`In-engine verify: ${pass}/${pass+fail} levels pass checkWin on solution`);
if (fail > 0) process.exit(1);
