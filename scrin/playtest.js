#!/usr/bin/env node
// playtest.js — Replays the solution through the game logic, step by step.
// Verifies that the gameplay path (place borders → checkWin → win) works.

const fs = require('fs');
const vm = require('vm');

const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const LEVELS = data;

const html = fs.readFileSync('index.html', 'utf8');
const scriptText = html.match(/<script>\s*\/\/ =+\s*\n\s*\/\/ Scrin[\s\S]*?<\/script>/)[0]
    .replace(/^<script>/, '').replace(/<\/script>$/, '');

const exposedScript = scriptText + '\nglobalThis._checkWin = checkWin;\nglobalThis._state = state;\nglobalThis._computeRegions = computeRegions;\nglobalThis._isRectangle = isRectangle;\nglobalThis._getSolution = getSolution;\nglobalThis._toggleBorder = toggleBorder;\n';
const ctx = {
    window: {},
    document: { getElementById: () => ({ getContext: () => new Proxy({}, { get: () => () => ({}) }), addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, style: {}, textContent: '', innerHTML: '', checked: false, clientWidth: 600, clientHeight: 800, width: 600, height: 800 }), addEventListener: () => {} },
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    AudioContext: function() { return new Proxy({}, { get: () => () => ({}) }); },
    setInterval: () => 0, clearInterval: () => {},
    Math: Math, JSON: JSON, Set: Set, Map: Map, Proxy: Proxy, Number: Number, Boolean: Boolean,
    console: console, globalThis: {}
};
ctx.window.AudioContext = ctx.AudioContext;
ctx.window.addEventListener = () => {};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(exposedScript, ctx);

const state = ctx._state;
const checkWin = ctx._checkWin;
const toggleBorder = ctx._toggleBorder;

// Disable audio
state.sfxOn = false;
state.musicOn = false;

function applySolution(L) {
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
    // Set engine state
    state.level = LEVELS.indexOf(L);
    state.rows = L.rows;
    state.cols = L.cols;
    state.clues = L.clues;
    state.borders = {};

    // Simulate gameplay: for each border in the solution, set it via toggleBorder
    const sol = applySolution(L);
    let stepCount = 0;
    // Play in 4 phases: top borders, then bottom, then left, then right
    const orderedKeys = Object.keys(sol);
    // Random order to simulate player play
    for (let i = orderedKeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedKeys[i], orderedKeys[j]] = [orderedKeys[j], orderedKeys[i]];
    }
    for (const key of orderedKeys) {
        const m = key.match(/^([hv])_(\d+)_(\d+)$/);
        const type = m[1], r = +m[2], c = +m[3];
        // toggleBorder sets state.borders[key] = true
        state.mode = 'place';
        toggleBorder(type, r, c);
        stepCount++;
    }

    const result = checkWin();
    const won = result && result.allValid;
    const marker = won ? '✓' : '✗';
    if (!won) fails++;
    console.log(`  L${String(L.id).padStart(2)} [${L.tier.padEnd(8)}] ${L.rows}x${L.cols} : ${stepCount} steps, win=${won} ${marker}`);
}
console.log(`\nResult: ${LEVELS.length - fails}/${LEVELS.length} playable, ${fails} failures`);
process.exit(fails === 0 ? 0 : 1);
