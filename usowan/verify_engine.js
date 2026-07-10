#!/usr/bin/env node
/**
 * Usowan In-Engine Verifier
 * Loads the actual LEVELS from index.html, then verifies each level's solution
 * using the same logic the game's checkSolution() function uses.
 * Uses vm.runInContext to evaluate the HTML's script.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read the HTML file
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract the LEVELS variable
const levelsMatch = html.match(/var LEVELS=(\[.*?\]);/s);
if (!levelsMatch) {
    console.error('ERROR: Could not extract LEVELS from index.html');
    process.exit(1);
}

const levelsCode = levelsMatch[1];
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('var LEVELS = ' + levelsCode + ';', sandbox);
const LEVELS = sandbox.LEVELS;

console.log(`Loaded ${LEVELS.length} levels from index.html`);

const DIRS4 = [[-1,0],[1,0],[0,-1],[0,1]];

function countBlackNeighbors(grid, r, c, R, C) {
    let cnt = 0;
    for (const [dr, dc] of DIRS4) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1) cnt++;
    }
    return cnt;
}

// Replicate the game's checkSolution logic exactly
function engineCheckSolution(lv) {
    const R = lv.rows, C = lv.cols;
    const grid = lv.solution.map(row => row.slice());
    const rooms = lv.rooms;
    const clues = lv.clues;

    // Build room map (same as game)
    const rmap = {};
    for (let i = 0; i < rooms.length; i++) {
        const rm = rooms[i];
        for (let r = rm[0]; r <= rm[2]; r++)
            for (let c = rm[1]; c <= rm[3]; c++)
                rmap[r + ',' + c] = i;
    }

    // Check 1: Adjacency (no two blacks touching) — game checks dirs 0,1 (up,left)
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 1) {
                for (let d = 0; d < 2; d++) {
                    const nr = r + DIRS4[d][0], nc = c + DIRS4[d][1];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1) {
                        return { pass: false, reason: 'Black cells cannot touch' };
                    }
                }
            }
        }
    }

    // Check 2: White connectivity (game's isWhiteConnected)
    const ws = [];
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (grid[r][c] !== 1) ws.push([r, c]);
    if (ws.length > 0) {
        const vis = {};
        const q = [ws[0]];
        vis[ws[0][0] + ',' + ws[0][1]] = true;
        let cnt = 1;
        while (q.length > 0) {
            const p = q.shift();
            for (let d = 0; d < 4; d++) {
                const nr = p[0] + DIRS4[d][0], nc = p[1] + DIRS4[d][1];
                const k = nr + ',' + nc;
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] !== 1 && !vis[k]) {
                    vis[k] = true;
                    q.push([nr, nc]);
                    cnt++;
                }
            }
        }
        if (cnt !== ws.length) return { pass: false, reason: 'White cells not connected' };
    }

    // Check 3: Liar constraint per room (game's checkSolution room loop)
    for (let ri = 0; ri < rooms.length; ri++) {
        let wrong = 0;
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (rmap[r + ',' + c] === ri && clues[r + ',' + c] !== undefined) {
                    if (countBlackNeighbors(grid, r, c, R, C) !== clues[r + ',' + c]) wrong++;
                }
            }
        }
        if (wrong !== 1) return { pass: false, reason: `Room ${ri}: ${wrong} wrong clues` };
    }

    return { pass: true };
}

// Verify all levels
let allPass = true;
let passCount = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    const result = engineCheckSolution(lv);
    if (result.pass) {
        passCount++;
        console.log(`✅ Level ${lv.level} [${lv.tier}] ${lv.rows}x${lv.cols}: engine checkSolution PASSES`);
    } else {
        allPass = false;
        console.log(`❌ Level ${lv.level} [${lv.tier}]: FAILS - ${result.reason}`);
    }
}

console.log(`\n${passCount}/${LEVELS.length} levels pass in-engine verification`);
if (allPass) {
    console.log('ALL LEVELS PASS IN-ENGINE VERIFICATION ✓');
    process.exit(0);
} else {
    console.log('SOME LEVELS FAIL IN-ENGINE ✗');
    process.exit(1);
}
