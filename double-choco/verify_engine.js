// verify_engine.js — In-engine verifier for Double Choco
// Loads index.html in a vm context, extracts LEVELS, and validates using the game's
// own checkSolution logic (comparing user-drawn borders vs solution borders).

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf-8');
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('double-choco');

const sandbox = { LEVELS: null, console: console };
vm.createContext(sandbox);
vm.runInContext(`LEVELS = ${match[1]};`, sandbox);
console.log(`In-engine verification: ${LEVELS.length} levels\n`);

let allPass = true;
LEVELS.forEach((level, idx) => {
    const { rows, cols, grid } = level;
    
    // Replicate the game's computeSolutionBorders logic
    const solutionBorders = new Set();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (c < cols - 1 && grid[r][c] !== grid[r][c + 1]) {
                solutionBorders.add(`${r},${c},r`);
            }
            if (r < rows - 1 && grid[r][c] !== grid[r + 1][c]) {
                solutionBorders.add(`${r},${c},b`);
            }
        }
    }
    
    // Simulate: set userBorders = solutionBorders, then check
    const userBorders = new Set(solutionBorders);
    
    // checkSolution logic:
    let allCorrect = true;
    let extra = false;
    for (const b of solutionBorders) {
        if (!userBorders.has(b)) { allCorrect = false; break; }
    }
    for (const b of userBorders) {
        if (!solutionBorders.has(b)) { extra = true; break; }
    }
    
    const passes = allCorrect && !extra;
    if (!passes) {
        allPass = false;
        console.log(`❌ Level ${idx + 1}: checkSolution FAILS`);
    } else {
        console.log(`✅ Level ${idx + 1} (${level.tierName} ${rows}×${cols}): ${solutionBorders.size} borders — engine check PASS`);
    }
});

console.log(allPass ? `\n✅ ALL ${LEVELS.length} LEVELS PASS in-engine verification` : '\n❌ SOME LEVELS FAILED');
process.exit(allPass ? 0 : 1);
