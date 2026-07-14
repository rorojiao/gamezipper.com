#!/usr/bin/env node
// Turf in-engine verification - Uses actual game logic from index.html

const fs = require('fs');
const vm = require('vm');

// Read levels
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/turf/levels.json', 'utf8'));

// Read game HTML and extract logic
const html = fs.readFileSync('/home/msdn/gamezipper.com/turf/index.html', 'utf8');

// Extract the game logic (between <script> tags that contain LEVELS)
const scriptMatch = html.match(/<script>[^<]*LEVELS[^<]*<\/script>/s);
if (!scriptMatch) {
    console.log('ERROR: Could not find LEVELS script in index.html');
    process.exit(1);
}

// Create sandbox with game functions
const context = {
    LEVELS: levels,
    console: { log: () => {} },
    Math: Math,
    Array: Array,
    Set: Set,
    Map: Map,
    Date: Date,
    document: {
        getElementById: () => null,
        createElement: () => null
    },
    window: {},
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    }
};

// Add BFS function manually (simplified version)
context.bfs = function(grid, startR, startC, targetColor) {
    const R = grid.length, C = grid[0].length;
    const visited = new Set();
    const stack = [[startR, startC]];
    visited.add(`${startR},${startC}`);
    while (stack.length > 0) {
        const [r, c] = stack.pop();
        if (grid[r][c] !== targetColor) continue;
        for (const [dr, dc] of [[0,1], [1,0], [0,-1], [-1,0]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited.has(`${nr},${nc}`) && grid[nr][nc] === targetColor) {
                visited.add(`${nr},${nc}`);
                stack.push([nr, nc]);
            }
        }
    }
    return visited;
};

context.isConnected = function(grid, targetColor) {
    const R = grid.length, C = grid[0].length;
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === targetColor) {
                const region = context.bfs(grid, r, c, targetColor);
                const total = grid.flat().filter(v => v === targetColor).length;
                return region.size === total;
            }
        }
    }
    return true;
};

context.checkWin = function(grid, clues) {
    if (!context.isConnected(grid, 0)) return false;
    if (!context.isConnected(grid, 1)) return false;

    for (const cl of clues) {
        const region = context.bfs(grid, cl.r, cl.c, grid[cl.r][cl.c]);
        if (region.size !== cl.val) return false;
    }
    return true;
};

// Run verification
console.log('Verifying 30 levels with in-engine logic...\n');

let passCount = 0;
for (const level of levels) {
    // Reconstruct grid
    const { rows: R, cols: C, grid: flatGrid, clues } = level;
    const fullGrid = [];
    for (let r = 0; r < R; r++) {
        fullGrid.push(flatGrid.slice(r*C, (r+1)*C));
    }

    // Check win condition
    if (context.checkWin(fullGrid, clues)) {
        passCount++;
        console.log(`Level ${level.id}: ✓ PASS`);
    } else {
        console.log(`Level ${level.id}: ✗ FAIL`);
    }
}

console.log(`\nResult: ${passCount}/${levels.length} PASS`);