#!/usr/bin/env node
/**
 * Usowan Independent Node.js Verifier
 * Reimplements the Usowan rules from scratch and verifies all 30 levels.
 * 
 * Rules:
 * 1. Numbered cells cannot be shaded
 * 2. Each number = count of orthogonal shaded neighbors
 * 3. In each room, exactly ONE clue is wrong (liar)
 * 4. Shaded cells cannot be orthogonally adjacent
 * 5. All unshaded cells must be connected
 */

const fs = require('fs');
const path = require('path');

const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

const DIRS4 = [[-1,0],[1,0],[0,-1],[0,1]];

function countBlackNeighbors(grid, r, c, R, C) {
    let cnt = 0;
    for (const [dr, dc] of DIRS4) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1) cnt++;
    }
    return cnt;
}

function hasAdjacentBlack(grid, R, C) {
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 1) {
                for (const [dr, dc] of DIRS4) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1) return true;
                }
            }
        }
    }
    return false;
}

function isWhiteConnected(grid, R, C) {
    const whites = [];
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (grid[r][c] === 0) whites.push([r, c]);
    if (whites.length === 0) return true;
    const visited = new Set();
    const queue = [whites[0]];
    visited.add(`${whites[0][0]},${whites[0][1]}`);
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        for (const [dr, dc] of DIRS4) {
            const nr = r + dr, nc = c + dc;
            const key = `${nr},${nc}`;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 0 && !visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }
    return visited.size === whites.length;
}

function verifyLevel(level) {
    const R = level.rows, C = level.cols;
    const grid = level.solution;
    const rooms = level.rooms;
    const clues = level.clues;

    // 1. Check solution matches: clue cells not black
    for (const [key, val] of Object.entries(clues)) {
        const [r, c] = key.split(',').map(Number);
        if (grid[r][c] === 1) return { valid: false, reason: `Clue cell (${r},${c}) is black in solution` };
    }

    // 2. Check no adjacent black
    if (hasAdjacentBlack(grid, R, C)) return { valid: false, reason: 'Adjacent black cells found' };

    // 3. Check white connectivity
    if (!isWhiteConnected(grid, R, C)) return { valid: false, reason: 'White cells not connected' };

    // 4. Check liar constraint per room
    for (let ri = 0; ri < rooms.length; ri++) {
        const [r1, c1, r2, c2] = rooms[ri];
        let wrongCount = 0;
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                const key = `${r},${c}`;
                if (clues[key] !== undefined) {
                    const actual = countBlackNeighbors(grid, r, c, R, C);
                    if (actual !== clues[key]) wrongCount++;
                }
            }
        }
        if (wrongCount !== 1) return { valid: false, reason: `Room ${ri}: ${wrongCount} wrong clues (need 1)` };
    }

    return { valid: true };
}

// Verify all levels
let allPass = true;
let passCount = 0;
for (const level of levels) {
    const result = verifyLevel(level);
    if (result.valid) {
        passCount++;
        console.log(`✅ Level ${level.level} [${level.tier}] ${level.rows}x${level.cols}: VALID`);
    } else {
        allPass = false;
        console.log(`❌ Level ${level.level} [${level.tier}]: INVALID - ${result.reason}`);
    }
}

console.log(`\n${passCount}/${levels.length} levels passed`);
if (allPass) {
    console.log('ALL LEVELS VERIFIED ✓');
    process.exit(0);
} else {
    console.log('SOME LEVELS FAILED ✗');
    process.exit(1);
}
