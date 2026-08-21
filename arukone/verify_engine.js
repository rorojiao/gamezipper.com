#!/usr/bin/env node
/**
 * Arukone (Number Link) in-engine verifier.
 * Loads the LEVELS data from index.html and verifies each level's embedded solver
 * produces exactly 1 solution.
 */

const fs = require('fs');

const html = fs.readFileSync('/home/junze/gamezipper.com/arukone/index.html', 'utf-8');
// Extract LEVELS array from script tag
const match = html.match(/var LEVELS=(\[.*?\]);/s);
if (!match) {
    console.error('Could not extract LEVELS from index.html');
    process.exit(1);
}

const levelsData = JSON.parse(match[1]);

function neighbors4(r, c, N) {
    const result = [];
    const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
            result.push([nr, nc]);
        }
    }
    return result;
}

function solveInEngine(N, pairs, timeLimitMs) {
    const pairCount = pairs.length;
    const grid = [];
    for (let r = 0; r < N; r++) {
        grid.push(new Array(N).fill(-1));
    }
    for (let pid = 0; pid < pairCount; pid++) {
        const [[r1, c1], [r2, c2]] = pairs[pid];
        grid[r1][c1] = pid;
        grid[r2][c2] = pid;
    }

    const solutions = [];
    const SOL_LIMIT = 2;
    const startTime = Date.now();

    function isPathInternalOk(r, c, pid) {
        const existing = [];
        for (let rr = 0; rr < N; rr++) {
            for (let cc = 0; cc < N; cc++) {
                if (grid[rr][cc] === pid && !(rr === r && cc === c)) {
                    existing.push([rr, cc]);
                }
            }
        }
        if (existing.length === 0) return false;
        return existing.some(([er, ec]) => Math.abs(er - r) + Math.abs(ec - c) === 1);
    }

    function isPathContinuous(pid) {
        const cells = new Set();
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (grid[r][c] === pid) {
                    cells.add(`${r},${c}`);
                }
            }
        }
        if (cells.size === 0) return true;
        const a = pairs[pid][0];
        const aKey = `${a[0]},${a[1]}`;
        if (!cells.has(aKey)) return false;
        const visited = new Set([aKey]);
        const queue = [a];
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            for (const [nr, nc] of neighbors4(r, c, N)) {
                const key = `${nr},${nc}`;
                if (cells.has(key) && !visited.has(key)) {
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
        }
        return visited.size === cells.size;
    }

    const cellOrder = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            cellOrder.push([r, c]);
        }
    }

    function backtrack(idx) {
        if (solutions.length >= SOL_LIMIT) return;
        if (Date.now() - startTime > timeLimitMs) return;
        if (idx === cellOrder.length) {
            for (let pid = 0; pid < pairCount; pid++) {
                if (!isPathContinuous(pid)) return;
            }
            solutions.push(grid.map(row => [...row]));
            return;
        }
        const [r, c] = cellOrder[idx];
        if (grid[r][c] !== -1) {
            backtrack(idx + 1);
            return;
        }
        const pids = [];
        for (let i = 0; i < pairCount; i++) pids.push(i);
        for (let i = pids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pids[i], pids[j]] = [pids[j], pids[i]];
        }
        for (const pid of pids) {
            if (!isPathInternalOk(r, c, pid)) continue;
            grid[r][c] = pid;
            backtrack(idx + 1);
            grid[r][c] = -1;
            if (solutions.length >= SOL_LIMIT) return;
        }
    }

    backtrack(0);
    return solutions;
}

let passed = 0;
let failed = 0;
for (const lv of levelsData) {
    // Compact format: [i, tier, r, c, pairs, solution]
    const N = lv[2];
    const rawPairs = lv[4];
    const pairs = rawPairs.map(p => [[p[0], p[1]], [p[2], p[3]]]);
    const sols = solveInEngine(N, pairs, 8000);
    if (sols.length === 1) {
        passed++;
    } else {
        failed++;
        console.log(`L${lv[0]}: FAIL (${sols.length} solutions)`);
    }
}
console.log(`verify_engine.js: ${passed}/${levelsData.length} PASS`);
process.exit(failed === 0 ? 0 : 1);
