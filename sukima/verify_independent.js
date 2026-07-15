// verify_independent.js — Independent Node.js solver for Sukima
// Reimplements the solver from scratch (no shared code with gen_levels.py)
const fs = require('fs');
const vm = require('vm');

// Load levels from index.html
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const m = html.match(/const LEVELS = (\[.+?\]);/s);
if (!m) { console.error('Could not extract LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

// Triomino shapes (same as gen_levels.py)
const SHAPES = [
    [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
    [[0,0],[0,1],[1,0]], [[0,0],[0,1],[1,1]],
    [[0,0],[1,0],[1,1]], [[0,1],[1,0],[1,1]],
];

function getTriominosAt(r, c, R, C, blockedSet) {
    const results = [];
    for (const shape of SHAPES) {
        for (const [dr, dc] of shape) {
            const baseR = r - dr;
            const baseC = c - dc;
            const cells = shape.map(([sdr, sdc]) => [baseR + sdr, baseC + sdc]);
            if (cells.every(([cr, cc]) => cr >= 0 && cr < R && cc >= 0 && cc < C)) {
                if (!cells.some(([cr, cc]) => blockedSet.has(cr + ',' + cc))) {
                    results.push(cells);
                }
            }
        }
    }
    // Deduplicate
    const seen = new Set();
    return results.filter(cells => {
        const key = cells.map(c => c.join(',')).sort().join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function countSolutions(circles, R, C, blockedSet, cap = 2, nodeBudget = 500000) {
    const circleSet = new Set(Object.keys(circles));
    const circleList = [...circleSet];
    const solutions = [0];
    const nodes = [0];
    const n = circleList.length;

    // Precompute options per circle
    const optionsPerCircle = [];
    for (const key of circleList) {
        const [cr, cc] = key.split(',').map(Number);
        const opts = getTriominosAt(cr, cc, R, C, blockedSet);
        const valid = opts.filter(tri => {
            return !tri.some(([r, c]) => {
                const k = r + ',' + c;
                return circleSet.has(k) && k !== key;
            });
        });
        optionsPerCircle.push(valid);
    }

    // MRV sort
    const order = [...Array(n).keys()].sort((a, b) => optionsPerCircle[a].length - optionsPerCircle[b].length);
    const orderedOptions = order.map(i => optionsPerCircle[i]);

    const usedCells = new Set();

    function check2x2(cellsToAdd) {
        for (const [r, c] of cellsToAdd) {
            for (let dr = -1; dr <= 0; dr++) {
                for (let dc = -1; dc <= 0; dc++) {
                    const r2 = r + dr, c2 = c + dc;
                    if (r2 >= 0 && r2 <= R - 2 && c2 >= 0 && c2 <= C - 2) {
                        if (usedCells.has(r2+','+c2) && usedCells.has(r2+','+(c2+1)) &&
                            usedCells.has((r2+1)+','+c2) && usedCells.has((r2+1)+','+(c2+1))) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function solve(idx) {
        if (solutions[0] >= cap) return;
        nodes[0]++;
        if (nodes[0] > nodeBudget) return;
        if (idx === n) { solutions[0]++; return; }

        for (const tri of orderedOptions[idx]) {
            if (tri.some(([r, c]) => usedCells.has(r + ',' + c))) continue;
            tri.forEach(([r, c]) => usedCells.add(r + ',' + c));
            if (!check2x2(tri)) solve(idx + 1);
            tri.forEach(([r, c]) => usedCells.delete(r + ',' + c));
            if (solutions[0] >= cap) return;
        }
    }

    solve(0);
    return solutions[0];
}

// Verify all levels
let allPass = true;
let passCount = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const blockedSet = new Set(lvl.blocked);
    const n = countSolutions(lvl.circles, lvl.R, lvl.C, blockedSet, 2, 500000);
    const status = n === 1 ? 'UNIQUE' : `FAIL(${n})`;
    if (n !== 1) allPass = false; else passCount++;
    console.log(`L${i+1} (${lvl.tier}): ${lvl.R}x${lvl.C} — ${status}`);
}

console.log(`\n${allPass ? '✅ ALL ' + passCount + '/' + LEVELS.length + ' UNIQUE' : '❌ SOME FAILED'}`);
process.exit(allPass ? 0 : 1);
