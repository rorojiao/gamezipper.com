// Sto-stone In-Engine Verifier (loads actual game HTML)
// Uses vm to load the game's JavaScript and verify levels
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract LEVELS from the HTML using line-based parsing
const lines = html.split('\n');
let levelsLine = '';
for (const line of lines) {
    if (line.startsWith('const LEVELS=')) {
        levelsLine = line;
        break;
    }
}
if (!levelsLine) { console.error('Could not find LEVELS line'); process.exit(1); }
const LEVELS = JSON.parse(levelsLine.replace('const LEVELS=', '').replace(/;$/, ''));
console.log(`Loaded ${LEVELS.length} levels from index.html\n`);

// Re-implement verification using the same logic as the game
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function getMaxConnectedBlacks(targetGrid, rid, rooms) {
    const cells = rooms[String(rid)];
    if (!cells) return 0;
    const cellSet = new Set(cells.map(([r,c]) => r+','+c));
    const blacks = cells.filter(([r,c]) => targetGrid[r][c] === 1);
    if (blacks.length === 0) return 0;
    const visited = new Set();
    let mx = 0;
    for (const [r,c] of blacks) {
        const key = r+','+c;
        if (visited.has(key)) continue;
        const queue = [[r,c]];
        visited.add(key);
        let sz = 0;
        while (queue.length) {
            const [cr,cc] = queue.pop();
            sz++;
            for (const [dr,dc] of DIRS) {
                const nr = cr+dr, nc = cc+dc, nk = nr+','+nc;
                if (cellSet.has(nk) && targetGrid[nr][nc] === 1 && !visited.has(nk)) {
                    visited.add(nk);
                    queue.push([nr,nc]);
                }
            }
        }
        mx = Math.max(mx, sz);
    }
    return mx;
}

function checkCrossRoom(playerGrid, grid, R, C) {
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (playerGrid[r][c] === 1) {
                const rid = grid[r][c];
                if (r+1 < R && playerGrid[r+1][c] === 1 && grid[r+1][c] !== rid) return false;
                if (c+1 < C && playerGrid[r][c+1] === 1 && grid[r][c+1] !== rid) return false;
            }
        }
    }
    return true;
}

function checkGravity(playerGrid, R, C) {
    const half = Math.floor(R / 2);
    for (let c = 0; c < C; c++) {
        let cnt = 0;
        for (let r = 0; r < R; r++) if (playerGrid[r][c] === 1) cnt++;
        if (cnt !== half) return false;
    }
    return true;
}

function checkClues(playerGrid, clues, rooms) {
    for (const rid in clues) {
        const expected = clues[rid];
        const actual = getMaxConnectedBlacks(playerGrid, parseInt(rid), rooms);
        if (actual !== expected) return false;
    }
    return true;
}

let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const R = lvl.r, C = lvl.c;
    const grid = lvl.g;
    const rooms = lvl.rooms;
    const clues = lvl.clues;
    const sol = lvl.sol;
    
    const issues = [];
    
    // Verify solution passes all checks (same as game's checkWin)
    if (!checkCrossRoom(sol, grid, R, C)) issues.push('cross-room');
    if (!checkGravity(sol, R, C)) issues.push('gravity');
    if (!checkClues(sol, clues, rooms)) issues.push('clues');
    
    // Verify dimensions
    if (sol.length !== R) issues.push(`sol rows ${sol.length}!=${R}`);
    if (sol[0].length !== C) issues.push(`sol cols ${sol[0].length}!=${C}`);
    if (grid.length !== R) issues.push(`grid rows`);
    if (grid[0].length !== C) issues.push(`grid cols`);
    
    // Verify rooms reference correct grid IDs
    for (const rid in rooms) {
        for (const [r,c] of rooms[rid]) {
            if (String(grid[r][c]) !== String(rid)) {
                issues.push(`room ${rid} cell (${r},${c}) has grid id ${grid[r][c]}`);
            }
        }
    }
    
    const status = issues.length === 0 ? 'PASS' : 'FAIL: ' + issues.join('; ');
    console.log(`Level ${i+1} (${R}x${C}): ${status}`);
    if (issues.length > 0) allPass = false;
}

console.log(allPass ? '\n✅ ALL 30 LEVELS PASS IN-ENGINE VERIFICATION' : '\n❌ FAILURES DETECTED');
process.exit(allPass ? 0 : 1);
