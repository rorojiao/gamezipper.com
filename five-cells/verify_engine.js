/**
 * Five Cells — In-Engine Verifier
 * Loads index.html, extracts LEVELS via vm.runInContext, and verifies
 * that each level's solution is valid: regions are exactly 5 cells,
 * clue border counts match.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the LEVELS const from the embedded script
const match = html.match(/(?:const|var|let)\s+LEVELS\s*=\s*(\[.*?\]);/s);
if (!match) {
    console.error('Could not find LEVELS in index.html');
    process.exit(1);
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('var LEVELS = ' + match[1] + ';', sandbox);
const LEVELS = sandbox.LEVELS;

console.log(`\n=== Five Cells In-Engine Verification ===`);
console.log(`Levels extracted from index.html: ${LEVELS.length}\n`);

let allPass = true;
let checked = 0;

for (let idx = 0; idx < LEVELS.length; idx++) {
    const level = LEVELS[idx];
    const R = level.r, C = level.c;
    const sol = level.sol;  // 2D solution grid (region IDs)
    const cl = level.cl;    // 2D clue grid (null or number)
    const lvl = idx + 1;
    
    // 1. Verify region sizes
    const visited = Array(R).fill(null).map(() => Array(C).fill(false));
    let sizesOk = true;
    let regionCount = 0;
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (visited[r][c]) continue;
            const rid = sol[r][c];
            let size = 0;
            const q = [[r,c]];
            visited[r][c] = true;
            while (q.length > 0) {
                const [cr, cc] = q.shift();
                size++;
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = cr+dr, nc = cc+dc;
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited[nr][nc] && sol[nr][nc] === rid) {
                        visited[nr][nc] = true;
                        q.push([nr,nc]);
                    }
                }
            }
            if (size !== 5) sizesOk = false;
            regionCount++;
        }
    }
    
    // 2. Verify clue border counts match
    let cluesOk = true;
    let clueCount = 0;
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (cl[r][c] === null || cl[r][c] === undefined) continue;
            clueCount++;
            const expected = cl[r][c];
            let cnt = 0;
            if (r === 0 || sol[r-1][c] !== sol[r][c]) cnt++;
            if (r === R-1 || sol[r+1][c] !== sol[r][c]) cnt++;
            if (c === 0 || sol[r][c-1] !== sol[r][c]) cnt++;
            if (c === C-1 || sol[r][c+1] !== sol[r][c]) cnt++;
            if (cnt !== expected) {
                console.log(`  ❌ Level ${lvl}: clue at (${r},${c}) expected ${expected}, computed ${cnt}`);
                cluesOk = false;
                allPass = false;
            }
        }
    }
    
    // 3. Verify expected number of regions
    const expectedRegions = (R * C) / 5;
    const regionCountOk = regionCount === expectedRegions;
    
    if (!sizesOk || !cluesOk || !regionCountOk) allPass = false;
    
    const status = sizesOk && cluesOk && regionCountOk ? '✅' : '❌';
    console.log(`  ${status} Level ${lvl}: ${R}x${C} ${level.t} — ${clueCount} clues, ${regionCount}/${expectedRegions} regions ${sizesOk?'✓':'✗'} ${cluesOk?'✓':'✗'}`);
    checked++;
}

console.log(`\n=== RESULT: ${allPass ? 'ALL ' + checked + ' LEVELS VALID ✅' : 'FAILED ❌'} ===`);
process.exit(allPass ? 0 : 1);
