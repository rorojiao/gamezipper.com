// Independent Node.js BFS verifier for Tateboo-Yokoboo levels
// Reads levels.json and verifies each level has exactly 1 solution

const fs = require('fs');
const path = require('path');

const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

const DIRS4 = [[-1,0],[1,0],[0,-1],[0,1]];

function blackEndpoints(R, C, grid, dirs, br, bc) {
    let count = 0;
    for (const [dr, dc] of DIRS4) {
        const nr = br + dr, nc = bc + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        if (grid[nr][nc] === 1) continue;
        const nd = dirs[nr][nc];
        if (nd && ((dc !== 0 && nd === 'H') || (dr !== 0 && nd === 'V'))) count++;
    }
    return count;
}

function computeSegments(R, C, grid, dirs) {
    const visited = Array(R).fill(null).map(() => new Array(C).fill(false));
    const segments = [];
    const segId = Array(R).fill(null).map(() => new Array(C).fill(-1));
    
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 1 || visited[r][c]) continue;
            const d = dirs[r][c];
            if (!d || d === '?') continue;
            const seg = [];
            if (d === 'H') {
                let cc = c;
                while (cc >= 0 && grid[r][cc] === 0 && dirs[r][cc] === 'H') cc--;
                cc++;
                while (cc < C && grid[r][cc] === 0 && dirs[r][cc] === 'H') { seg.push([r, cc]); cc++; }
            } else {
                let rr = r;
                while (rr >= 0 && grid[rr][c] === 0 && dirs[rr][c] === 'V') rr--;
                rr++;
                while (rr < R && grid[rr][c] === 0 && dirs[rr][c] === 'V') { seg.push([rr, c]); rr++; }
            }
            const sid = segments.length;
            for (const [sr, sc] of seg) { visited[sr][sc] = true; segId[sr][sc] = sid; }
            segments.push(seg);
        }
    }
    return { segments, segId };
}

function check(R, C, grid, dirs, wcList, bcList) {
    const { segments, segId } = computeSegments(R, C, grid, dirs);
    
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 0 && !['H','V'].includes(dirs[r][c])) return false;
        }
    }
    
    const seenSeg = {};
    for (const [r, c, v] of wcList) {
        const sid = segId[r][c];
        if (sid < 0) return false;
        if (segments[sid].length !== v) return false;
        if (seenSeg[sid]) return false;
        seenSeg[sid] = true;
    }
    
    for (const [r, c, v] of bcList) {
        if (blackEndpoints(R, C, grid, dirs, r, c) !== v) return false;
    }
    return true;
}

function countSolutions(R, C, grid, wcList, bcList, limit, timeout) {
    limit = limit || 2;
    timeout = timeout || 200000;
    
    const whiteCells = [];
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (grid[r][c] === 0) whiteCells.push([r, c]);
    
    const n = whiteCells.length;
    
    // Precompute black clue neighbor info
    const bcData = bcList.map(([br, bcc, val]) => {
        const nbrs = [];
        for (const [dr, dc] of DIRS4) {
            const nr = br + dr, nc = bcc + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 0) {
                nbrs.push([nr, nc, dr, dc]);
            }
        }
        return { br, bcc, val, nbrs };
    });
    
    // Map: cell -> list of black clue indices that care about it
    const cellToBC = {};
    bcData.forEach((bd, bi) => {
        for (const [nr, nc] of bd.nbrs) {
            const key = nr + ',' + nc;
            if (!cellToBC[key]) cellToBC[key] = [];
            cellToBC[key].push(bi);
        }
    });
    
    const dirs = Array(R).fill(null).map(() => new Array(C).fill(null));
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (grid[r][c] === 1) dirs[r][c] = 'B';
    
    const solutions = [];
    let nodes = 0;
    
    function canSatisfyBlack(bi) {
        const bd = bcData[bi];
        let confirmed = 0, possible = 0;
        for (const [nr, nc, dr, dc] of bd.nbrs) {
            const d = dirs[nr][nc];
            if (d === null) possible++;
            else if ((dc !== 0 && d === 'H') || (dr !== 0 && d === 'V')) { confirmed++; possible++; }
        }
        return confirmed <= bd.val && bd.val <= possible;
    }
    
    function solve(idx) {
        if (solutions.length >= limit) return;
        nodes++;
        if (nodes > timeout) return;
        
        if (idx === n) {
            if (check(R, C, grid, dirs, wcList, bcList)) {
                solutions.push(dirs.map(row => row.slice()));
            }
            return;
        }
        
        const [r, c] = whiteCells[idx];
        for (const d of ['H', 'V']) {
            dirs[r][c] = d;
            
            let prune = false;
            const bcIndices = cellToBC[r + ',' + c];
            if (bcIndices) {
                for (const bi of bcIndices) {
                    if (!canSatisfyBlack(bi)) { prune = true; break; }
                }
            }
            
            if (!prune) solve(idx + 1);
        }
        dirs[r][c] = null;
    }
    
    solve(0);
    return solutions;
}

// Verify all levels
let pass = 0, fail = 0;
for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    const { rows: R, cols: C, grid, whiteClues: wcList, blackClues: bcList, solution } = lvl;
    
    // 1. Verify stored solution is valid
    const solValid = check(R, C, grid, solution, wcList, bcList);
    
    // 2. Verify uniqueness
    const timeout = R <= 6 ? 500000 : (R <= 7 ? 20000000 : 50000000);
    const sols = countSolutions(R, C, grid, wcList, bcList, 2, timeout);
    const unique = sols.length === 1;
    
    if (solValid && unique) {
        pass++;
        console.log(`L${i+1} ${R}x${C} PASS (sols=${sols.length})`);
    } else {
        fail++;
        console.log(`L${i+1} ${R}x${C} FAIL (solValid=${solValid}, sols=${sols.length})`);
    }
}

console.log(`\n${pass}/${levels.length} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
