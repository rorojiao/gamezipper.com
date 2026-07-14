#!/usr/bin/env node
// verify_engine.js — In-engine Node.js verifier for Scrin
// Loads the actual index.html game JS via vm.runInContext, applies solution borders
// to engine's state, and verifies checkWin() returns true.
//
// This is the strongest test: it exercises the EXACT code that runs in the browser.

const fs = require('fs');
const vm = require('vm');

const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const LEVELS = data;

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>\s*\/\/ =+\s*\n\s*\/\/ Scrin[\s\S]*?<\/script>/);
if (!scriptMatch) {
    console.error('Could not find main script in index.html');
    process.exit(1);
}
const scriptText = scriptMatch[0]
    .replace(/^<script>/, '')
    .replace(/<\/script>$/, '');

// Mock browser globals
const handlers = {};
const ctx = {
    window: {},
    document: {
        getElementById: () => ({
            getContext: () => new Proxy({}, { get: () => () => ({ frequency: { setTargetAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }) }),
            addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false },
            style: {}, textContent: '', innerHTML: '', checked: false,
            clientWidth: 600, clientHeight: 800, width: 600, height: 800
        }),
        addEventListener: (ev, h) => { handlers[ev] = h; },
    },
    addEventListener: (ev, h) => { handlers[ev] = h; },
    localStorage: { getItem: () => null, setItem: () => {} },
    AudioContext: function() { return new Proxy({}, { get: () => () => ({ frequency: { setTargetAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }) }); },
    setInterval: () => 0, clearInterval: () => {},
    Math: Math, JSON: JSON, Set: Set, Map: Map, Proxy: Proxy, Number: Number, Boolean: Boolean,
    console: console,
};
ctx.window.AudioContext = ctx.AudioContext;
ctx.window.addEventListener = () => {};
vm.createContext(ctx);

try {
    vm.runInContext(scriptText, ctx);
} catch (e) {
    console.error('Error loading game script:', e.message);
    process.exit(1);
}

// Run the DOMContentLoaded handler
try {
    if (handlers.DOMContentLoaded) handlers.DOMContentLoaded();
} catch (e) {}

// Now find the engine functions. Since 'use strict' + const/let = block scoped,
// we need to access them via the script context's bindings. We can re-eval
// the relevant code in a way that exposes the functions.

// Approach: append "globalThis._checkWin = checkWin; globalThis._computeRegions = computeRegions;" to script
const exposedScript = scriptText + '\nglobalThis._checkWin = checkWin;\nglobalThis._computeRegions = computeRegions;\nglobalThis._state = state;\nglobalThis._LEVELS = LEVELS;\nglobalThis._loadLevel = loadLevel;\n';

// Re-run with exposed globals
const ctx2 = {
    window: {},
    document: ctx.document,
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    AudioContext: ctx.AudioContext,
    setInterval: () => 0, clearInterval: () => {},
    Math: Math, JSON: JSON, Set: Set, Map: Map, Proxy: Proxy, Number: Number, Boolean: Boolean,
    console: console, globalThis: {}
};
ctx2.window.AudioContext = ctx.AudioContext;
ctx2.window.addEventListener = () => {};
ctx2.globalThis = ctx2;  // circular but works
vm.createContext(ctx2);
try {
    vm.runInContext(exposedScript, ctx2);
} catch (e) {
    console.error('Error re-loading:', e.message);
    process.exit(1);
}

const checkWin = ctx2._checkWin;
const state = ctx2._state;

if (typeof checkWin !== 'function') {
    console.error('Could not find _checkWin in engine');
    process.exit(1);
}

function applySolution(L) {
    // Border convention (matches engine):
    //   h_r_c = border between (r, c) and (r+1, c)
    //   v_r_c = border between (r, c) and (r, c+1)
    // For rect (r0, c0, r1, c1):
    //   top: h_(r0-1)_c for c in [c0, c1] (only if r0 > 0; top of grid is implicit)
    //   bottom: h_r1_c for c in [c0, c1]
    //   left: v_r_(c0-1) for r in [r0, r1] (only if c0 > 0; left of grid is implicit)
    //   right: v_r_c1 for r in [r0, r1]
    const borders = {};
    for (const rect of L.solution) {
        const { r0, c0, r1, c1 } = rect;
        if (r0 > 0) for (let c = c0; c <= c1; c++) borders['h_' + (r0 - 1) + '_' + c] = true;
        for (let c = c0; c <= c1; c++) borders['h_' + r1 + '_' + c] = true;
        if (c0 > 0) for (let r = r0; r <= r1; r++) borders['v_' + r + '_' + (c0 - 1)] = true;
        for (let r = r0; r <= r1; r++) borders['v_' + r + '_' + c1] = true;
    }
    return borders;
}

let fails = 0;
for (const L of LEVELS) {
    state.rows = L.rows;
    state.cols = L.cols;
    state.clues = L.clues;
    state.borders = applySolution(L);

    let won = false;
    try {
        const result = checkWin();
        won = result && result.allValid;
    } catch (e) {
        console.error(`L${L.id} error:`, e.message);
    }

    const marker = won ? '✓' : '✗';
    if (!won) fails++;
    console.log(`  L${String(L.id).padStart(2)} [${L.tier.padEnd(8)}] ${L.rows}x${L.cols} : solution wins ${marker}`);
}
console.log(`\nResult: ${LEVELS.length - fails}/${LEVELS.length} winning solutions, ${fails} failures`);
process.exit(fails === 0 ? 0 : 1);
