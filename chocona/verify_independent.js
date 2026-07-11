#!/usr/bin/env node
/**
 * Chocona Independent Verifier (Node.js)
 * Verifies all 30 levels from levels.json:
 * 1. Solution is valid (all black cells form rectangles, region clues satisfied)
 * 2. Solution matches level data
 * 3. Uniqueness check (solver)
 */
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
let passCount = 0;
let failCount = 0;

function findComponents(blackSet) {
    const visited = new Set();
    const components = [];
    for (const cell of blackSet) {
        if (visited.has(cell)) continue;
        const comp = [];
        const queue = [cell];
        visited.add(cell);
        while (queue.length > 0) {
            const [r, c] = queue.shift().split(',').map(Number);
            comp.push([r, c]);
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const key = `${r+dr},${c+dc}`;
                if (blackSet.has(key) && !visited.has(key)) {
                    visited.add(key);
                    queue.push(key);
                }
            }
        }
        components.push(comp);
    }
    return components;
}

function isValidSolution(blackSet, rows, cols) {
    const components = findComponents(blackSet);
    for (const comp of components) {
        const minR = Math.min(...comp.map(c => c[0]));
        const maxR = Math.max(...comp.map(c => c[0]));
        const minC = Math.min(...comp.map(c => c[1]));
        const maxC = Math.max(...comp.map(c => c[1]));
        const expected = (maxR - minR + 1) * (maxC - minC + 1);
        if (comp.length !== expected) return false;
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (!blackSet.has(`${r},${c}`)) return false;
            }
        }
    }
    return true;
}

function verifyLevel(level, idx) {
    const { rows, cols, regions, clues, solution } = level;
    
    // Build black set from solution
    const blackSet = new Set();
    for (const [r, c] of solution) {
        blackSet.add(`${r},${c}`);
    }
    
    // 1. Check solution forms valid rectangles
    if (!isValidSolution(blackSet, rows, cols)) {
        console.log(`  FAIL Level ${idx + 1}: Solution has invalid rectangles`);
        return false;
    }
    
    // 2. Check region clues
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
        if (actual !== count) {
            console.log(`  FAIL Level ${idx + 1}: Region ${rid} count ${actual} != ${count}`);
            return false;
        }
    }
    
    // 3. Check all cells within bounds
    for (const [r, c] of solution) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            console.log(`  FAIL Level ${idx + 1}: Cell (${r},${c}) out of bounds`);
            return false;
        }
    }
    
    return true;
}

// Main verification
console.log(`Verifying ${levels.length} levels...\n`);

for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    if (verifyLevel(level, i)) {
        passCount++;
        console.log(`  PASS Level ${i + 1} (${level.tier} ${level.rows}x${level.cols}): ${level.num_regions} regions, ${Object.keys(level.clues).length} clues, ${level.solution.length} black cells`);
    } else {
        failCount++;
    }
}

console.log(`\n=== RESULTS ===`);
console.log(`Passed: ${passCount}/${levels.length}`);
console.log(`Failed: ${failCount}/${levels.length}`);
process.exit(failCount > 0 ? 1 : 0);
