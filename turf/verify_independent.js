#!/usr/bin/env node
// Turf level verification - FIX 2: Only mark visited when color matches

const fs = require('fs');

function bfs(grid, startR, startC, targetColor, R, C) {
    const visited = new Set();
    const queue = [[startR, startC]];
    visited.add(`${startR},${startC}`);
    let count = 0;

    while (queue.length > 0) {
        const [r, c] = queue.shift();
        
        if (grid[r][c] !== targetColor) continue;
        count++;

        for (const [dr, dc] of [[0,1], [1,0], [0,-1], [-1,0]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited.has(`${nr},${nc}`)) {
                visited.add(`${nr},${nc}`);
                queue.push([nr, nc]);
            }
        }
    }
    return { count, visited };
}

// Alternative BFS that only marks matching colors
function bfsStrict(grid, startR, startC, targetColor, R, C) {
    const visited = new Set();
    const queue = [[startR, startC]];
    visited.add(`${startR},${startC}`);
    let count = 0;

    if (grid[startR][startC] !== targetColor) {
        return { count: 0, visited };
    }

    while (queue.length > 0) {
        const [r, c] = queue.shift();
        count++;

        for (const [dr, dc] of [[0,1], [1,0], [0,-1], [-1,0]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && 
                !visited.has(`${nr},${nc}`) && 
                grid[nr][nc] === targetColor) {
                visited.add(`${nr},${nc}`);
                queue.push([nr, nc]);
            }
        }
    }
    return { count, visited };
}

function isConnected(grid, targetColor, R, C) {
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === targetColor) {
                const { count } = bfsStrict(grid, r, c, targetColor, R, C);
                const total = grid.flat().filter(v => v === targetColor).length;
                return count === total;
            }
        }
    }
    return true;
}

function getRegions(grid, R, C) {
    const visited = new Set();
    const regions = [];

    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (!visited.has(`${r},${c}`)) {
                const { visited: regionVisited } = bfsStrict(grid, r, c, grid[r][c], R, C);
                for (const key of regionVisited) {
                    visited.add(key);
                }
                regions.push(regionVisited);
            }
        }
    }
    return regions;
}

function verifyLevel(level) {
    const { rows: R, cols: C, grid, clues } = level;

    // Reconstruct grid
    const fullGrid = [];
    for (let r = 0; r < R; r++) {
        fullGrid.push(grid.slice(r*C, (r+1)*C));
    }

    // Check connectivity
    if (!isConnected(fullGrid, 0, R, C)) {
        return { valid: false, reason: 'White cells not connected' };
    }
    if (!isConnected(fullGrid, 1, R, C)) {
        return { valid: false, reason: 'Black cells not connected' };
    }

    // Check region size clues
    const regions = getRegions(fullGrid, R, C);

    for (const cl of clues) {
        if (cl.type !== 'size') continue;

        const { r, c, val } = cl;
        
        // Find region
        let regionSize = 0;
        for (const region of regions) {
            if (region.has(`${r},${c}`)) {
                regionSize = region.size;
                break;
            }
        }

        if (regionSize !== val) {
            return { valid: false, reason: `Size clue mismatch at (${r},${c}): region=${regionSize}, clue=${val}` };
        }
    }

    // Each region needs size clue
    let regionsWithClue = 0;
    for (const region of regions) {
        for (const cl of clues) {
            if (cl.type === 'size' && region.has(`${cl.r},${cl.c}`)) {
                regionsWithClue++;
                break;
            }
        }
    }

    if (regionsWithClue !== regions.length) {
        return { valid: false, reason: 'Region without size clue' };
    }

    return { valid: true };
}

// Run verification
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/turf/levels.json', 'utf8'));

console.log(`Verifying ${levels.length} levels...`);

let passCount = 0;
for (const level of levels) {
    const result = verifyLevel(level);
    if (result.valid) {
        passCount++;
        console.log(`Level ${level.id}: ✓ PASS`);
    } else {
        console.log(`Level ${level.id}: ✗ FAIL - ${result.reason}`);
    }
}

console.log(`\nResult: ${passCount}/${levels.length} PASS`);