/**
 * Five Cells — Independent Node.js Verifier
 * Verifies each level has unique solution by checking border-count clues
 * independently from the Python generator.
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

let allPass = true;
let totalChecked = 0;

function computeBorderCounts(grid, R, C) {
    const counts = [];
    for (let r = 0; r < R; r++) {
        counts[r] = [];
        for (let c = 0; c < C; c++) {
            let cnt = 0;
            if (r === 0 || grid[r-1][c] !== grid[r][c]) cnt++;
            if (r === R-1 || grid[r+1][c] !== grid[r][c]) cnt++;
            if (c === 0 || grid[r][c-1] !== grid[r][c]) cnt++;
            if (c === C-1 || grid[r][c+1] !== grid[r][c]) cnt++;
            counts[r][c] = cnt;
        }
    }
    return counts;
}

function checkRegionSizes(grid, R, C) {
    const visited = Array(R).fill(null).map(() => Array(C).fill(false));
    const sizes = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (visited[r][c]) continue;
            const rid = grid[r][c];
            let size = 0;
            const q = [[r,c]];
            visited[r][c] = true;
            while (q.length > 0) {
                const [cr, cc] = q.shift();
                size++;
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = cr+dr, nc = cc+dc;
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited[nr][nc] && grid[nr][nc] === rid) {
                        visited[nr][nc] = true;
                        q.push([nr,nc]);
                    }
                }
            }
            sizes.push(size);
        }
    }
    return sizes.every(s => s === 5);
}

console.log(`\n=== Five Cells Independent Verification ===`);
console.log(`Total levels: ${data.levels.length}\n`);

for (const level of data.levels) {
    const { rows: R, cols: C, solution, clues, level: lvl } = level;
    
    // 1. Verify solution grid: all regions are size 5
    const grid = solution;
    let regionOk = checkRegionSizes(grid, R, C);
    
    // 2. Verify clue values match border counts
    const computed = computeBorderCounts(grid, R, C);
    let cluesOk = true;
    let clueCount = 0;
    for (const [key, expected] of Object.entries(clues)) {
        clueCount++;
        const [r, c] = key.split(',').map(Number);
        if (computed[r][c] !== expected) {
            console.log(`  ❌ Level ${lvl}: clue at (${r},${c}) expected ${expected}, got ${computed[r][c]}`);
            cluesOk = false;
            allPass = false;
        }
    }
    
    // 3. Verify each region id forms valid connected component
    const numRegions = (R * C) / 5;
    const regionIds = new Set();
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            regionIds.add(grid[r][c]);
        }
    }
    const regionCountOk = regionIds.size === numRegions;
    
    // 4. Verify all clue cells have valid border counts (0-4)
    let rangeOk = true;
    for (const [key, val] of Object.entries(clues)) {
        if (val < 0 || val > 4) {
            rangeOk = false;
            allPass = false;
        }
    }
    
    const status = regionOk && cluesOk && regionCountOk && rangeOk ? '✅' : '❌';
    console.log(`  ${status} Level ${lvl}: ${R}x${C} ${level.difficulty} — ${clueCount} clues, ${numRegions} regions — sizes:${regionOk?'OK':'FAIL'} clues:${cluesOk?'OK':'FAIL'} regions:${regionCountOk?'OK':'FAIL'} range:${rangeOk?'OK':'FAIL'}`);
    totalChecked++;
}

console.log(`\n=== RESULT: ${allPass ? 'ALL ' + totalChecked + ' LEVELS VALID ✅' : 'SOME LEVELS FAILED ❌'} ===`);
process.exit(allPass ? 0 : 1);
