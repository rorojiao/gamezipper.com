
// Independent Node.js verifier for Akichiwake puzzle levels
// Loads levels.json and verifies all 30 levels
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/akichiwake/levels.json', 'utf8')).levels;

let allValid = true;
let passCount = 0;

for (const level of levels) {
    const { rows, cols, solution, clues, tier, level: lvlNum } = level;
    const errors = [];
    
    // Check dimensions
    if (!Array.isArray(solution) || solution.length !== rows) {
        errors.push(`solution has ${solution ? solution.length : 'null'} rows, expected ${rows}`);
    }
    
    // Check solution values (0 or 1)
    let blackCount = 0, whiteCount = 0;
    for (let r = 0; r < rows; r++) {
        if (!Array.isArray(solution[r]) || solution[r].length !== cols) {
            errors.push(`solution row ${r} has wrong length`);
            continue;
        }
        for (let c = 0; c < cols; c++) {
            if (solution[r][c] !== 0 && solution[r][c] !== 1) {
                errors.push(`solution[${r}][${c}] = ${solution[r][c]} (must be 0 or 1)`);
            }
            if (solution[r][c] === 1) blackCount++;
            else whiteCount++;
        }
    }
    
    // Check no empty regions
    if (blackCount === 0) errors.push('No black cells');
    if (whiteCount === 0) errors.push('No white cells');
    
    // Check connectivity of black cells
    function isConnected(grid, val, R, C) {
        let start = null;
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (grid[r][c] === val) { start = [r, c]; break; }
            }
            if (start) break;
        }
        if (!start) return false;
        const visited = new Set();
        const queue = [start];
        visited.add(start[0] + ',' + start[1]);
        let count = 1;
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === val) {
                    const key = nr + ',' + nc;
                    if (!visited.has(key)) {
                        visited.add(key);
                        count++;
                        queue.push([nr, nc]);
                    }
                }
            }
        }
        let total = 0;
        for (let r = 0; r < R; r++)
            for (let c = 0; c < C; c++)
                if (grid[r][c] === val) total++;
        return count === total;
    }
    
    if (!isConnected(solution, 0, rows, cols)) errors.push('White region not connected');
    if (!isConnected(solution, 1, rows, cols)) errors.push('Black region not connected');
    
    // Verify clues
    for (const cl of clues) {
        const { r, c, v } = cl;
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            errors.push(`Clue at (${r},${c}) out of bounds`);
            continue;
        }
        const color = solution[r][c];
        let same = 0;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (solution[nr][nc] === color) same++;
            }
        }
        if (same !== v) {
            errors.push(`Clue at (${r},${c}): expected ${v}, got ${same}`);
        }
    }
    
    if (errors.length > 0) {
        console.log(`FAIL ${tier} #${lvlNum}: ${errors.join('; ')}`);
        allValid = false;
    } else {
        console.log(`PASS ${tier} #${lvlNum}: ${rows}x${cols} black=${blackCount} white=${whiteCount} clues=${clues.length}`);
        passCount++;
    }
}

console.log(`\n${passCount}/${levels.length} levels passed`);
process.exit(allValid ? 0 : 1);
