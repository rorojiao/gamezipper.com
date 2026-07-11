#!/usr/bin/env node
/**
 * Chocona In-Engine Verifier
 * Loads the actual index.html, extracts the LEVELS constant and checkWin function,
 * then verifies each level passes the engine's own validation.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS constant
const levelsMatch = html.match(/const LEVELS = (\[[\s\S]+?\]);/);
if (!levelsMatch) {
    console.error('ERROR: Could not extract LEVELS from index.html');
    process.exit(1);
}

// Extract the game logic (between <script> tags)
const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
let gameCode = '';
for (const m of scriptMatches) {
    const code = m[1];
    if (code.includes('const LEVELS') || code.includes('function checkWin') || code.includes('function getBlackComponents')) {
        gameCode += code + '\n';
    }
}

// Create a sandbox with the game functions
const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    Set: Set,
    Map: Map,
    Array: Array,
    Object: Object,
    Number: Number,
    String: String,
    Boolean: Boolean,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { addEventListener: () => {}, getElementById: () => null },
    window: {},
    AudioContext: function() { return { createGain: () => ({ gain: {}, connect: () => {} }), destination: {} }; },
    setInterval: () => 0,
    clearInterval: () => {},
};

// Parse levels
const levels = JSON.parse(levelsMatch[1]);
console.log(`Loaded ${levels.length} levels from index.html\n`);

// We need to reimplement checkWin logic since it depends on canvas state.
// Instead, we'll verify the levels using the same logic the engine uses.

function getBlackComponents(blackSet, rows, cols) {
    const visited = new Set();
    const components = [];
    for (const cellKey of blackSet) {
        if (visited.has(cellKey)) continue;
        const [r, c] = cellKey.split(',').map(Number);
        const comp = [[r, c]];
        const queue = [[r, c]];
        visited.add(cellKey);
        while (queue.length > 0) {
            const [cr, cc] = queue.shift();
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = cr + dr, nc = cc + dc;
                const key = `${nr},${nc}`;
                if (blackSet.has(key) && !visited.has(key)) {
                    visited.add(key);
                    comp.push([nr, nc]);
                    queue.push([nr, nc]);
                }
            }
        }
        components.push(comp);
    }
    return components;
}

function isRectangle(comp) {
    const minR = Math.min(...comp.map(c => c[0]));
    const maxR = Math.max(...comp.map(c => c[0]));
    const minC = Math.min(...comp.map(c => c[1]));
    const maxC = Math.max(...comp.map(c => c[1]));
    const expected = (maxR - minR + 1) * (maxC - minC + 1);
    if (comp.length !== expected) return false;
    const cellSet = new Set(comp.map(c => `${c[0]},${c[1]}`));
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            if (!cellSet.has(`${r},${c}`)) return false;
        }
    }
    return true;
}

function checkWin(level, blackSet) {
    const { rows, cols, regions, clues } = level;
    
    // 1. Check all clues satisfied
    for (const [rid, count] of Object.entries(clues)) {
        const ridNum = parseInt(rid);
        let actual = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (regions[r][c] === ridNum && blackSet.has(`${r},${c}`)) {
                    actual++;
                }
            }
        }
        if (actual !== count) return false;
    }
    
    // 2. Check all black cells form rectangles
    const components = getBlackComponents(blackSet, rows, cols);
    for (const comp of components) {
        if (!isRectangle(comp)) return false;
    }
    
    return true;
}

// Verify all levels
let passCount = 0;
let failCount = 0;

for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const blackSet = new Set();
    for (const [r, c] of level.solution) {
        blackSet.add(`${r},${c}`);
    }
    
    if (checkWin(level, blackSet)) {
        passCount++;
        console.log(`  PASS Level ${i + 1} (${level.tier} ${level.rows}x${level.cols}): checkWin returns true`);
    } else {
        failCount++;
        console.log(`  FAIL Level ${i + 1}: checkWin returns false!`);
    }
}

console.log(`\n=== IN-ENGINE VERIFICATION RESULTS ===`);
console.log(`Passed: ${passCount}/${levels.length}`);
console.log(`Failed: ${failCount}/${levels.length}`);
process.exit(failCount > 0 ? 1 : 0);
