#!/usr/bin/env node
/**
 * Arukone (Number Link) verifier — Node.js independent implementation.
 *
 * Reads arukone/levels.json and verifies each level is solvable with a unique solution.
 * Uses a DIFFERENT algorithm from verify_python.py for cross-validation.
 */

const fs = require('fs');

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

function solveArukone(N, pairs, timeLimitMs) {
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
        const b = pairs[pid][1];
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
        // Shuffle pids (Fisher-Yates)
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

function main() {
    const data = JSON.parse(fs.readFileSync('/home/junze/gamezipper.com/arukone/levels.json', 'utf-8'));
    const levels = data.levels;
    let passed = 0;
    let failed = 0;
    for (const lv of levels) {
        const N = lv.r;
        const pairs = lv.p.map(p => p.map(q => [q[0], q[1]]));
        const sols = solveArukone(N, pairs, 10000);
        if (sols.length === 1) {
            passed++;
        } else {
            failed++;
            console.log(`L${lv.i}: FAIL (${sols.length} solutions)`);
        }
    }
    console.log(`verify_independent.js: ${passed}/${levels.length} PASS`);
    process.exit(failed === 0 ? 0 : 1);
}

main();
