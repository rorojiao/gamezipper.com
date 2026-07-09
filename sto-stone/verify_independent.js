// Sto-stone Independent Node.js Verifier
// Re-implements all game rules independently to verify levels
const fs = require('fs');
const path = require('path');

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function maxContBlack(grid, cells) {
    const cellSet = new Set(cells.map(([r,c]) => `${r},${c}`));
    const blacks = cells.filter(([r,c]) => grid[r][c] === 1);
    if (blacks.length === 0) return 0;
    const visited = new Set();
    let mx = 0;
    for (const [sr,sc] of blacks) {
        const key = `${sr},${sc}`;
        if (visited.has(key)) continue;
        const queue = [[sr,sc]];
        visited.add(key);
        let sz = 0;
        while (queue.length) {
            const [r,c] = queue.pop();
            sz++;
            for (const [dr,dc] of DIRS) {
                const nr = r+dr, nc = c+dc, nk = `${nr},${nc}`;
                if (cellSet.has(nk) && grid[nr][nc] === 1 && !visited.has(nk)) {
                    visited.add(nk);
                    queue.push([nr,nc]);
                }
            }
        }
        mx = Math.max(mx, sz);
    }
    return mx;
}

function checkCrossRoom(grid, roomGrid, R, C) {
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 1) {
                const rid = roomGrid[r][c];
                if (r+1 < R && grid[r+1][c] === 1 && roomGrid[r+1][c] !== rid) return false;
                if (c+1 < C && grid[r][c+1] === 1 && roomGrid[r][c+1] !== rid) return false;
            }
        }
    }
    return true;
}

function checkGravity(grid, R, C) {
    const half = Math.floor(R / 2);
    for (let c = 0; c < C; c++) {
        let cnt = 0;
        for (let r = 0; r < R; r++) if (grid[r][c] === 1) cnt++;
        if (cnt !== half) return false;
    }
    return true;
}

function checkClues(grid, rooms, clues) {
    for (const rid in clues) {
        const cells = rooms[String(rid)];
        if (!cells) continue;
        const expected = clues[rid];
        const actual = maxContBlack(grid, cells);
        if (actual !== expected) return false;
    }
    return true;
}

function verify(filename) {
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    let allPass = true;
    
    for (const level of data.levels) {
        const R = level.rows, C = level.cols;
        const grid = level.grid;
        const rooms = level.rooms;
        const clues = level.clues;
        const sol = level.solution;
        
        const issues = [];
        
        // 1. Check solution validity
        if (!checkCrossRoom(sol, grid, R, C)) issues.push('cross-room adjacency');
        if (!checkGravity(sol, R, C)) issues.push('gravity');
        if (!checkClues(sol, rooms, clues)) issues.push('clues');
        
        // 2. Check grid dimensions
        if (sol.length !== R || sol[0].length !== C) issues.push('dimension mismatch');
        if (grid.length !== R || grid[0].length !== C) issues.push('grid dimension');
        
        // 3. Check all rooms are valid
        for (const rid in rooms) {
            const cells = rooms[rid];
            for (const [r,c] of cells) {
                if (r < 0 || r >= R || c < 0 || c >= C) issues.push(`room ${rid} out of bounds`);
                if (String(grid[r][c]) !== String(rid)) issues.push(`room ${rid} cell mismatch`);
            }
        }
        
        const status = issues.length === 0 ? 'VALID' : 'INVALID: ' + issues.join(', ');
        console.log(`Level ${level.level} (${level.tier_name} ${R}x${C}): ${status}`);
        
        if (issues.length > 0) allPass = false;
    }
    
    return allPass;
}

const file = process.argv[2] || path.join(__dirname, 'levels.json');
console.log(`Verifying ${file}...`);
const pass = verify(file);
console.log(pass ? '\n✅ ALL LEVELS VALID' : '\n❌ SOME LEVELS INVALID');
process.exit(pass ? 0 : 1);
