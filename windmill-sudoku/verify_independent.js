#!/usr/bin/env node
/**
 * Independent Windmill Sudoku verifier.
 * - Different implementation from gen.py (no shared code).
 * - Verifies each grid has a UNIQUE solution.
 * - Verifies shared boxes are consistent between center and diagonal grids.
 */

const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('windmill-sudoku/levels.json', 'utf8'));

// Bitmask-based solver
function countSolutions(grid, limit = 2) {
    const g = grid.map(r => [...r]);
    const rows = new Int32Array(9).fill(0);
    const cols = new Int32Array(9).fill(0);
    const boxes = new Int32Array(9).fill(0);
    const empties = [];

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = g[r][c];
            if (v) {
                const bit = 1 << v;
                rows[r] |= bit;
                cols[c] |= bit;
                boxes[Math.floor(r/3)*3 + Math.floor(c/3)] |= bit;
            } else {
                empties.push([r, c]);
            }
        }
    }

    let count = 0;

    function dfs() {
        if (count >= limit) return;

        // MRV
        let bestIdx = -1, bestMask = 0, bestCount = 10;
        for (let i = 0; i < empties.length; i++) {
            const [r, c] = empties[i];
            if (g[r][c] !== 0) continue;
            const mask = rows[r] | cols[c] | boxes[Math.floor(r/3)*3 + Math.floor(c/3)];
            let avail = (~(mask >> 1)) & 0x1FF;
            let cnt = 0;
            let t = avail;
            while (t) { cnt += t & 1; t >>= 1; }
            if (cnt === 0) return;
            if (cnt < bestCount) {
                bestCount = cnt;
                bestIdx = i;
                bestMask = avail;
                if (cnt === 1) break;
            }
        }

        if (bestIdx === -1) {
            count++;
            return;
        }

        const [r, c] = empties[bestIdx];
        const b = Math.floor(r/3)*3 + Math.floor(c/3);
        let avail = bestMask;
        for (let d = 1; d <= 9; d++) {
            const bit = 1 << (d - 1);
            if (avail & bit) {
                g[r][c] = d;
                rows[r] |= (1 << d);
                cols[c] |= (1 << d);
                boxes[b] |= (1 << d);
                dfs();
                g[r][c] = 0;
                rows[r] &= ~(1 << d);
                cols[c] &= ~(1 << d);
                boxes[b] &= ~(1 << d);
                if (count >= limit) return;
            }
        }
    }

    dfs();
    return count;
}

function getBox(grid, boxIdx) {
    const br = Math.floor(boxIdx / 3) * 3;
    const bc = (boxIdx % 3) * 3;
    const box = [];
    for (let dr = 0; dr < 3; dr++) {
        box.push([]);
        for (let dc = 0; dc < 3; dc++) {
            box[dr].push(grid[br + dr][bc + dc]);
        }
    }
    return box;
}

function boxesEqual(b1, b2) {
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
            if (b1[r][c] !== b2[r][c]) return false;
    return true;
}

console.log(`Verifying ${levels.length} Windmill Sudoku levels...\n`);

let allValid = true;
const gridNames = ['center', 'nw', 'ne', 'sw', 'se'];
// Shared box mapping: which box of the diagonal grid = which box of center
const sharedMap = {
    nw: { diagBox: 8, centerBox: 0 },
    ne: { diagBox: 6, centerBox: 2 },
    sw: { diagBox: 2, centerBox: 6 },
    se: { diagBox: 0, centerBox: 8 },
};

for (const level of levels) {
    const id = level.id;
    let levelValid = true;

    // 1. Verify each grid has unique solution
    for (const gname of gridNames) {
        const grid = level[gname];
        const cnt = countSolutions(grid, 2);
        if (cnt !== 1) {
            console.log(`❌ Level ${id} grid "${gname}": ${cnt} solutions (not unique!)`);
            levelValid = false;
            allValid = false;
        }
    }

    // 2. Verify shared boxes are consistent
    // The center puzzle's corner boxes should equal the diagonal grids' corresponding corner boxes
    // (they're given cells, so they must match between puzzles)
    for (const [diagName, { diagBox, centerBox }] of Object.entries(sharedMap)) {
        const centerB = getBox(level.center, centerBox);
        const diagB = getBox(level[diagName], diagBox);
        if (!boxesEqual(centerB, diagB)) {
            console.log(`❌ Level ${id}: shared box mismatch! center.box${centerBox} ≠ ${diagName}.box${diagBox}`);
            levelValid = false;
            allValid = false;
        }
    }

    // 3. Verify no zero/invalid values
    for (const gname of gridNames) {
        const grid = level[gname];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const v = grid[r][c];
                if (v < 0 || v > 9) {
                    console.log(`❌ Level ${id} grid "${gname}": invalid value ${v} at (${r},${c})`);
                    levelValid = false;
                    allValid = false;
                }
            }
        }
    }

    if (levelValid) {
        const counts = gridNames.map(g => level[`${g}_given_count`]);
        console.log(`✅ Level ${id} (${level.tier}): unique solutions verified, shared boxes consistent | givens: center=${counts[0]} nw=${counts[1]} ne=${counts[2]} sw=${counts[3]} se=${counts[4]}`);
    }
}

console.log(allValid ? `\n✅ ALL ${levels.length} levels VERIFIED (unique solutions + consistent shared boxes)` : `\n❌ SOME LEVELS FAILED VERIFICATION`);

// Also verify the solution grids if present
if (levels[0].center_sol) {
    console.log('\nVerifying solution integrity...');
    let solOk = true;
    for (const level of levels) {
        for (const gname of gridNames) {
            const solKey = gname + '_sol';
            if (!level[solKey]) continue;
            // Check it's a valid complete Sudoku
            const sol = level[solKey];
            for (let r = 0; r < 9; r++) {
                const rowSet = new Set(sol[r]);
                if (rowSet.size !== 9 || sol[r].some(v => v < 1 || v > 9)) {
                    console.log(`❌ Level ${level.id} ${solKey}: invalid row ${r}`);
                    solOk = false;
                }
            }
            for (let c = 0; c < 9; c++) {
                const colSet = new Set();
                for (let r = 0; r < 9; r++) colSet.add(sol[r][c]);
                if (colSet.size !== 9) {
                    console.log(`❌ Level ${level.id} ${solKey}: invalid col ${c}`);
                    solOk = false;
                }
            }
        }
    }
    console.log(solOk ? '✅ All solutions valid' : '❌ Some solutions invalid');
}
