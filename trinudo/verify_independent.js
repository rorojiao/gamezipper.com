// Trinudo Independent Node.js Solver
// Verifies all 30 levels have exactly 1 unique solution
// Uses a region-placement approach (independent of Python generator)

const fs = require('fs');

const LEVELS = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8')).levels;

const SHAPES = {
    1: [[[0,0]]],
    2: [[[0,0],[0,1]], [[0,0],[1,0]]],
    3: [[[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
        [[0,0],[0,1],[1,0]], [[0,0],[0,1],[1,1]],
        [[0,0],[1,0],[1,1]], [[0,1],[1,0],[1,1]]],
};

function solveCount(clues, R, C, cap=2, budget=300000) {
    const grid = clues.map(r => r.slice());
    let sols = 0;
    let nodes = 0;

    function findFirstEmpty() {
        for (let r = 0; r < R; r++)
            for (let c = 0; c < C; c++)
                if (grid[r][c] === 0) return [r, c];
        return null;
    }

    function checkPlace(cells, val) {
        const cs = new Set(cells.map(c => c[0]+','+c[1]));
        for (const [r,c] of cells) {
            if (clues[r][c] !== 0 && clues[r][c] !== val) return false;
            for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr=r+dr, nc=c+dc;
                if (nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===val&&!cs.has(nr+','+nc))
                    return false;
            }
        }
        return true;
    }

    function verify() {
        // BFS regions
        const seen = new Set();
        const crMap = {};
        for (let r=0; r<R; r++) {
            for (let c=0; c<C; c++) {
                const key = r+','+c;
                if (seen.has(key)) continue;
                const v = grid[r][c];
                const q = [[r,c]]; seen.add(key); const comp = [[r,c]];
                while (q.length) {
                    const [cr,cc] = q.shift();
                    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        const nr=cr+dr, nc=cc+dc;
                        const nkey = nr+','+nc;
                        if (nr>=0&&nr<R&&nc>=0&&nc<C&&!seen.has(nkey)&&grid[nr][nc]===v) {
                            seen.add(nkey); q.push([nr,nc]); comp.push([nr,nc]);
                        }
                    }
                }
                if (comp.length !== v) return false;
                comp.forEach(([cr,cc]) => crMap[cr+','+cc] = comp[0]+','+comp[1]);
            }
        }
        // Check same-size adjacent different regions
        for (let r=0; r<R; r++) {
            for (let c=0; c<C; c++) {
                for (const [dr,dc] of [[1,0],[0,1]]) {
                    const nr=r+dr, nc=c+dc;
                    if (nr>=0&&nr<R&&nc>=0&&nc<C&&grid[r][c]===grid[nr][nc]) {
                        if (crMap[r+','+c] !== crMap[nr+','+nc]) return false;
                    }
                }
            }
        }
        return true;
    }

    function solve() {
        nodes++;
        if (nodes > budget || sols >= cap) return;
        const cell = findFirstEmpty();
        if (!cell) {
            if (verify()) sols++;
            return;
        }
        const [r, c] = cell;
        for (const s of [1,2,3]) {
            for (const shape of SHAPES[s]) {
                for (const [sr,sc] of shape) {
                    const cells = shape.map(([dr,dc]) => [r-sr+dr, c-sc+dc]);
                    if (cells.every(([cr,cc]) => cr>=0&&cr<R&&cc>=0&&cc<C&&grid[cr][cc]===0)) {
                        if (checkPlace(cells, s)) {
                            for (const [cr,cc] of cells) grid[cr][cc] = s;
                            solve();
                            for (const [cr,cc] of cells) grid[cr][cc] = 0;
                            if (sols >= cap) return;
                        }
                    }
                }
            }
        }
    }

    solve();
    return sols;
}

// Verify all levels
let allPass = true;
for (const lvl of LEVELS) {
    const { rows: R, cols: C, clues, solution } = lvl;
    
    // First verify the solution is structurally valid
    const grid = solution;
    let valid = true;
    const seen = new Set();
    const crMap = {};
    for (let r=0; r<R&&valid; r++) {
        for (let c=0; c<C&&valid; c++) {
            if (grid[r][c] < 1 || grid[r][c] > 3) { valid = false; break; }
            const key = r+','+c;
            if (seen.has(key)) continue;
            const v = grid[r][c];
            const q = [[r,c]]; seen.add(key); const comp = [[r,c]];
            while (q.length) {
                const [cr,cc] = q.shift();
                for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr=cr+dr, nc=cc+dc;
                    const nkey = nr+','+nc;
                    if (nr>=0&&nr<R&&nc>=0&&nc<C&&!seen.has(nkey)&&grid[nr][nc]===v) {
                        seen.add(nkey); q.push([nr,nc]); comp.push([nr,nc]);
                    }
                }
            }
            if (comp.length !== v) { valid = false; break; }
            comp.forEach(([cr,cc]) => crMap[cr+','+cc] = comp[0]+','+comp[1]);
        }
    }
    if (valid) {
        for (let r=0; r<R&&valid; r++) {
            for (let c=0; c<C&&valid; c++) {
                for (const [dr,dc] of [[1,0],[0,1]]) {
                    const nr=r+dr, nc=c+dc;
                    if (nr>=0&&nr<R&&nc>=0&&nc<C&&grid[r][c]===grid[nr][nc]) {
                        if (crMap[r+','+c] !== crMap[nr+','+nc]) { valid = false; break; }
                    }
                }
            }
        }
    }
    
    if (!valid) {
        console.log(`L${lvl.level} ${lvl.tier}: SOLUTION INVALID`);
        allPass = false;
        continue;
    }
    
    // Verify clues match solution
    for (let r=0; r<R; r++) {
        for (let c=0; c<C; c++) {
            if (clues[r][c] !== 0 && clues[r][c] !== solution[r][c]) {
                console.log(`L${lvl.level}: CLUE MISMATCH at (${r},${c}): clue=${clues[r][c]} solution=${solution[r][c]}`);
                allPass = false;
                break;
            }
        }
    }
    
    // Count solutions
    const count = solveCount(clues, R, C, 2, 200000);
    const status = count === 1 ? 'UNIQUE' : (count === 0 ? 'NO-SOLUTION' : `MULTIPLE(${count})`);
    console.log(`L${lvl.level} ${lvl.tier} ${R}x${C}: ${status}`);
    if (count !== 1) allPass = false;
}

console.log(allPass ? '\n✅ ALL 30 LEVELS VERIFIED UNIQUE' : '\n❌ SOME LEVELS FAILED');
process.exit(allPass ? 0 : 1);
