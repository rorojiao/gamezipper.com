#!/usr/bin/env node
/**
 * verify_engine.js — In-engine verification using vm.runInContext.
 * Loads the actual index.html, extracts LEVELS and checkWin logic,
 * then verifies each level's solution passes checkWin.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the script content (block 4 = main game script)
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const scriptMatch = scripts.find(s => s[1].includes('LEVELS'));
if (!scriptMatch) {
    console.error('Could not find main script block with LEVELS');
    process.exit(1);
}

// We need to create a sandbox with mock DOM
const sandbox = {
    window: {},
    document: {
        getElementById: () => ({
            textContent: '',
            classList: { toggle: () => {}, add: () => {}, remove: () => {} },
            appendChild: () => {},
            removeChild: () => {},
            style: {},
            addEventListener: () => {},
            onclick: null,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
            width: 100, height: 100,
            getContext: () => ({
                fillRect: () => {}, strokeRect: () => {},
                fillText: () => {}, set fillStyle(v) {}, get fillStyle() { return ''; },
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
        addEventListener: () => {},
        body: { addEventListener: () => {}, appendChild: () => {} },
    },
    AudioContext: function() {
        this.createGain = () => ({ gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} });
        this.createOscillator = () => ({ frequency: { value: 0, exponentialRampToValueAtTime: () => {} }, type: '', connect: () => {}, start: () => {}, stop: () => {} });
        this.currentTime = 0;
        this.destination = {};
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {},
    },
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    console: console,
    JSON: JSON,
    Math: Math,
    Date: Date,
};

vm.createContext(sandbox);

// Inject LEVELS into sandbox before running the script
sandbox.window = sandbox;

try {
    vm.runInContext(scriptMatch[1], sandbox);
} catch (e) {
    // Some errors are expected (DOM interactions), but functions should be defined
}

// LEVELS may be const-scoped; extract it by evaluating in the same context
let LEVELS;
try {
    LEVELS = vm.runInContext('LEVELS', sandbox);
} catch(e) {
    // LEVELS is const, not accessible. Extract from source directly.
    const levelsMatch = scriptMatch[1].match(/const LEVELS=(\[.*?\]);/s);
    if (!levelsMatch) {
        console.error('Could not extract LEVELS from source');
        process.exit(1);
    }
    LEVELS = JSON.parse(levelsMatch[1]);
    // Inject into sandbox for loadLevel to use
    vm.runInContext('var LEVELS_INJECTED = ' + JSON.stringify(LEVELS) + ';', sandbox);
}

if (typeof sandbox.checkWin !== 'function') {
    console.error('checkWin function not found');
    process.exit(1);
}

const LEVELS_DATA = LEVELS;
let passCount = 0;

for (let i = 0; i < LEVELS_DATA.length; i++) {
    const lv = LEVELS_DATA[i];
    // Set up state inside the VM context
    const setupCode = `
        curLevel = ${i};
        player = ${JSON.stringify(lv.solution)}.map(r => r.map(v => 0));
        for (let r = 0; r < ${lv.R}; r++) {
            for (let c = 0; c < ${lv.C}; c++) {
                player[r][c] = ${JSON.stringify(lv.solution)}[r][c] === 1 ? 1 : 2;
            }
        }
    `;
    vm.runInContext(setupCode, sandbox);
    
    // Check win
    const won = vm.runInContext('checkWin()', sandbox);
    const status = won ? '✓' : '✗';
    console.log(`  L${lv.id} (${lv.tier}): ${status} ${won ? 'PASS' : 'FAIL'}`);
    if (won) passCount++;
}

console.log(`\n${passCount}/${LEVELS_DATA.length} levels PASS (in-engine checkWin)`);
console.log(passCount === LEVELS_DATA.length ? 'ALL PASS' : 'SOME FAILED');
process.exit(passCount === LEVELS_DATA.length ? 0 : 1);
