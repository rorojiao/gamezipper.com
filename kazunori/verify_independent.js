#!/usr/bin/env node
/**
 * Kazunori — Independent Node.js Level Verifier (Method 2)
 * Reimplements all Kazunori rules from scratch without reading the game engine.
 */
const fs = require('fs');
const path = require('path');

const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

let passCount = 0;
let failCount = 0;

function verify(level, idx) {
    const { rows, cols, regions, solution, clues, tierName } = level;
    
    // Build region map
    const regionMap = {}; // rid -> [[r,c],...]
    for (const key in regions) {
        const rid = regions[key];
        if (!regionMap[rid]) regionMap[rid] = [];
        const [r, c] = key.split(',').map(Number);
        regionMap[rid].push([r, c]);
    }
    
    // 1. Check all regions are even-sized
    for (const rid in regionMap) {
        if (regionMap[rid].length % 2 !== 0) {
            console.log(`  Level ${idx+1}: FAIL — Region ${rid} has odd size ${regionMap[rid].length}`);
            return false;
        }
    }
    
    // 2. Check each region: numbers 1..N/2 each exactly twice, same numbers adjacent
    for (const rid in regionMap) {
        const cells = regionMap[rid];
        const n = cells.length;
        const maxNum = n / 2;
        const numCount = {};
        
        for (const [r, c] of cells) {
            const num = solution[r][c];
            if (num < 1 || num > maxNum) {
                console.log(`  Level ${idx+1}: FAIL — Region ${rid} cell (${r},${c}) has invalid number ${num} (max ${maxNum})`);
                return false;
            }
            if (!numCount[num]) numCount[num] = [];
            numCount[num].push([r, c]);
        }
        
        for (let num = 1; num <= maxNum; num++) {
            if (!numCount[num] || numCount[num].length !== 2) {
                console.log(`  Level ${idx+1}: FAIL — Region ${rid} number ${num} appears ${numCount[num] ? numCount[num].length : 0} times (expected 2)`);
                return false;
            }
            const [[r1, c1], [r2, c2]] = numCount[num];
            if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
                console.log(`  Level ${idx+1}: FAIL — Region ${rid} number ${num} cells (${r1},${c1}) and (${r2},${c2}) not adjacent`);
                return false;
            }
        }
    }
    
    // 3. Check no 2x2 same number
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const v = solution[r][c];
            if (v === 0) continue;
            if (solution[r][c+1] === v && solution[r+1][c] === v && solution[r+1][c+1] === v) {
                console.log(`  Level ${idx+1}: FAIL — 2x2 same number ${v} at (${r},${c})`);
                return false;
            }
        }
    }
    
    // 4. Check border clues
    for (const clue of clues) {
        const sum = solution[clue.r1][clue.c1] + solution[clue.r2][clue.c2];
        if (sum !== clue.sum) {
            console.log(`  Level ${idx+1}: FAIL — Border clue expected ${clue.sum}, got ${sum} at (${clue.r1},${clue.c1})-(${clue.r2},${clue.c2})`);
            return false;
        }
        // Verify the two cells are actually in different regions
        const rid1 = regions[`${clue.r1},${clue.c1}`];
        const rid2 = regions[`${clue.r2},${clue.c2}`];
        if (rid1 === rid2) {
            console.log(`  Level ${idx+1}: FAIL — Border clue cells (${clue.r1},${clue.c1}) and (${clue.r2},${clue.c2}) in same region ${rid1}`);
            return false;
        }
        // Verify cells are adjacent
        if (Math.abs(clue.r1 - clue.r2) + Math.abs(clue.c1 - clue.c2) !== 1) {
            console.log(`  Level ${idx+1}: FAIL — Border clue cells not adjacent`);
            return false;
        }
    }
    
    console.log(`  Level ${idx+1}: ✅ VALID (${rows}x${cols}, ${tierName}, ${Object.keys(regionMap).length} regions, ${clues.length} clues)`);
    return true;
}

console.log(`Verifying ${levels.length} levels with independent Node.js verifier...\n`);

for (let i = 0; i < levels.length; i++) {
    if (verify(levels[i], i)) {
        passCount++;
    } else {
        failCount++;
    }
}

console.log(`\n=== RESULTS ===`);
console.log(`PASS: ${passCount}/${levels.length}`);
console.log(`FAIL: ${failCount}/${levels.length}`);

if (failCount > 0) {
    process.exit(1);
} else {
    console.log('\n✅ ALL LEVELS VALID');
}
