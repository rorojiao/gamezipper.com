
// In-engine test: simulate gameplay for Akichiwake
const fs = require('fs');

// Load levels
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/akichiwake/levels.json', 'utf8')).levels;

let passCount = 0;
let failCount = 0;

for (const level of levels) {
    const { rows, cols, solution, clues, tier, level: lvlNum } = level;
    
    // Simulate: fill grid with the solution (mapped to game values)
    // Game: 0=empty, 1=shaded(black), 2=unshaded(white)
    // Solution: 0=white, 1=black
    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(solution[r][c] === 1 ? 1 : 2);
        }
        grid.push(row);
    }
    
    // Check all clues
    const clueMap = {};
    clues.forEach(cl => { clueMap[cl.r + '_' + cl.c] = cl; });
    
    let cluesOk = true;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = r + '_' + c;
            if (!clueMap[key]) continue;
            const cl = clueMap[key];
            const val = grid[r][c];
            let same = 0;
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (grid[nr][nc] === val) same++;
                }
            }
            if (same !== cl.v) {
                cluesOk = false;
                console.log(`  FAIL ${tier} #${lvlNum}: clue (${r},${c}) expected ${cl.v} got ${same}`);
            }
        }
    }
    
    // Check connectivity (using game values 1 and 2)
    function isConnected(val) {
        let start = null;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
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
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === val) {
                    const key = nr + ',' + nc;
                    if (!visited.has(key)) {
                        visited.add(key); count++; queue.push([nr, nc]);
                    }
                }
            }
        }
        let total = 0;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === val) total++;
        return count === total;
    }
    
    const connOk = isConnected(1) && isConnected(2);
    
    if (cluesOk && connOk) {
        console.log(`PASS ${tier} #${lvlNum}: ${rows}x${cols} - all clues satisfied, both regions connected`);
        passCount++;
    } else {
        failCount++;
    }
}

console.log(`\n${passCount}/${levels.length} levels passed in-engine simulation`);
process.exit(failCount > 0 ? 1 : 0);
