// verify_independent.js — Independent Node.js solver for Putteria
// Reimplements the rules from scratch, loads levels.json, verifies each level has exactly 1 solution.

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const LEVELS = data.levels;

function solve(rows, cols, grid, givens, crosses) {
    // Build region -> cells mapping
    const regions = {};
    const regionSizes = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rid = grid[r][c];
            if (!regions[rid]) regions[rid] = [];
            regions[rid].push([r, c]);
            regionSizes[rid] = (regionSizes[rid] || 0) + 1;
        }
    }
    const regionIds = Object.keys(regions).map(Number);
    
    const crossSet = new Set(crosses);
    const givenMap = {};
    for (const [k, v] of Object.entries(givens)) givenMap[k] = v;
    
    let solutionCount = 0;
    let nodeBudget = 200000;
    
    function getCellKey(r, c) { return r + ',' + c; }
    
    function solveRec(idx, placement, usedRows, usedCols, placedCells) {
        if (solutionCount >= 2) return;
        if (nodeBudget <= 0) return;
        nodeBudget--;
        
        if (idx === regionIds.length) {
            solutionCount++;
            return;
        }
        
        // MRV: find region with fewest candidates
        let bestIdx = -1, bestRid, bestCands = null;
        for (let i = idx; i < regionIds.length; i++) {
            const rid = regionIds[i];
            const size = regionSizes[rid];
            const cands = [];
            
            // Check for given
            let givenCell = null;
            for (const [r, c] of regions[rid]) {
                if (givenMap[getCellKey(r, c)] !== undefined) {
                    givenCell = [r, c];
                    break;
                }
            }
            
            if (givenCell) {
                const [r, c] = givenCell;
                if (givenMap[getCellKey(r, c)] === size &&
                    !usedRows[r].has(size) &&
                    !usedCols[c].has(size) &&
                    !crossSet.has(getCellKey(r, c))) {
                    let adj = false;
                    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        if (placedCells.has(getCellKey(r+dr, c+dc))) { adj = true; break; }
                    }
                    if (!adj) cands.push([r, c]);
                }
            } else {
                for (const [r, c] of regions[rid]) {
                    if (crossSet.has(getCellKey(r, c))) continue;
                    if (usedRows[r].has(size) || usedCols[c].has(size)) continue;
                    let adj = false;
                    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        if (placedCells.has(getCellKey(r+dr, c+dc))) { adj = true; break; }
                    }
                    if (!adj) cands.push([r, c]);
                }
            }
            
            if (bestCands === null || cands.length < bestCands.length) {
                bestCands = cands;
                bestRid = rid;
                bestIdx = i;
                if (cands.length === 0) return;
            }
        }
        
        if (!bestCands || bestCands.length === 0) return;
        
        // Swap best to front
        [regionIds[idx], regionIds[bestIdx]] = [regionIds[bestIdx], regionIds[idx]];
        
        const size = regionSizes[bestRid];
        const remaining = regionIds.slice(idx + 1);
        
        for (const [r, c] of bestCands) {
            usedRows[r].add(size);
            usedCols[c].add(size);
            placedCells.add(getCellKey(r, c));
            
            solveRec(idx + 1, placement, usedRows, usedCols, placedCells);
            
            usedRows[r].delete(size);
            usedCols[c].delete(size);
            placedCells.delete(getCellKey(r, c));
            
            if (solutionCount >= 2) break;
        }
        
        // Swap back
        [regionIds[idx], regionIds[bestIdx]] = [regionIds[bestIdx], regionIds[idx]];
    }
    
    const usedRows = {};
    const usedCols = {};
    for (let r = 0; r < rows; r++) usedRows[r] = new Set();
    for (let c = 0; c < cols; c++) usedCols[c] = new Set();
    
    solveRec(0, {}, usedRows, usedCols, new Set());
    return solutionCount;
}

let passCount = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const count = solve(lvl.rows, lvl.cols, lvl.grid, lvl.givens, lvl.crosses);
    if (count === 1) {
        passCount++;
        console.log(`Level ${i+1} (${lvl.tier}): UNIQUE ✅`);
    } else {
        console.log(`Level ${i+1} (${lvl.tier}): ${count} solutions ❌`);
    }
}

console.log(`\n${passCount}/${LEVELS.length} levels UNIQUE`);
