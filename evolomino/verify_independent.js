// Evolomino — independent Node.js verifier
// Reimplements the puzzle rules from scratch in pure JS, then verifies
// each level has exactly 1 solution. This is a different code path from
// the Python gen_levels.py, so the two together form a strong check.

const fs = require('fs');

const DIRS = {
    U: [-1, 0],
    D: [ 1, 0],
    L: [ 0,-1],
    R: [ 0, 1],
};

function inBounds(r, c, R, C) {
    return r >= 0 && r < R && c >= 0 && c < C;
}

function loadLevels() {
    const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf-8'));
    return data.levels;
}

// Re-solve the puzzle: given a grid with arrows, find ALL valid completions.
function solve(grid, maxK = 5) {
    const R = grid.length;
    const C = grid[0].length;
    const arrows = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] in DIRS) {
                arrows.push([r, c, grid[r][c]]);
            }
        }
    }

    const solutions = [];
    const MAX_SOLS = 2;

    // Precompute valid chain configs for each arrow
    const arrowConfigs = arrows.map(([arR, arC, arD]) => {
        const configs = [];
        const [dr, dc] = DIRS[arD];
        for (let k = 2; k <= maxK; k++) {
            const chain = [new Set([`${arR},${arC}`])];
            let ok = true;
            for (let i = 1; i < k; i++) {
                const size = i + 1;
                const prev = chain[chain.length - 1];
                let tail = null;
                let bestVal = -Infinity;
                for (const cell of prev) {
                    const [cr, cc] = cell.split(',').map(Number);
                    const val = cr * dr + cc * dc;
                    if (val > bestVal) { bestVal = val; tail = [cr, cc]; }
                }
                const startR = tail[0] + dr, startC = tail[1] + dc;
                if (!inBounds(startR, startC, R, C)) { ok = false; break; }
                const blk = [];
                let r = startR, c = startC;
                for (let j = 0; j < size; j++) {
                    if (!inBounds(r, c, R, C)) { ok = false; break; }
                    blk.push([r, c]);
                    r += dr; c += dc;
                }
                if (!ok) break;
                const blkSet = new Set(blk.map(([r,c]) => `${r},${c}`));
                chain.push(blkSet);
            }
            if (ok) configs.push({ k, chain });
        }
        return configs;
    });

    function backtrack(idx, occupied, chosen) {
        if (solutions.length >= MAX_SOLS) return;
        if (idx === arrows.length) {
            solutions.push(chosen.map((c) => c.map((s) => Array.from(s))));
            return;
        }
        const configs = arrowConfigs[idx];
        for (const { chain } of configs) {
            // Check arrow cell not in occupied
            const chainCells = new Set();
            let ok = true;
            for (const blk of chain) {
                for (const cell of blk) {
                    if (occupied.has(cell)) { ok = false; break; }
                    chainCells.add(cell);
                }
                if (!ok) break;
            }
            if (!ok) continue;
            // Check orth-adjacency
            for (const cell of chainCells) {
                const [cr, cc] = cell.split(',').map(Number);
                for (const d of Object.values(DIRS)) {
                    const nb = `${cr + d[0]},${cc + d[1]}`;
                    if (occupied.has(nb) && !chainCells.has(nb)) {
                        ok = false; break;
                    }
                }
                if (!ok) break;
            }
            if (!ok) continue;
            const newOcc = new Set([...occupied, ...chainCells]);
            chosen.push(chain);
            backtrack(idx + 1, newOcc, chosen);
            chosen.pop();
            if (solutions.length >= MAX_SOLS) return;
        }
    }

    backtrack(0, new Set(), []);
    return solutions;
}

function verifyLevel(level) {
    const grid = level.grid.map((row) =>
        row.map((c) => (c === '' ? null : c))
    );
    const sols = solve(grid, 5);
    if (sols.length === 0) return { ok: false, reason: 'no solution' };
    if (sols.length > 1) return { ok: false, reason: `multiple solutions (${sols.length})` };
    return { ok: true };
}

function main() {
    const levels = loadLevels();
    let pass = 0, fail = 0;
    for (const lvl of levels) {
        const result = verifyLevel(lvl);
        if (result.ok) {
            pass++;
        } else {
            fail++;
            console.error(`Level ${lvl.id} (${lvl.tier}, ${lvl.rows}x${lvl.cols}): FAIL - ${result.reason}`);
        }
    }
    console.log(`Verified ${pass}/${pass+fail} levels have exactly 1 solution.`);
    if (fail > 0) process.exit(1);
}

if (require.main === module) main();
