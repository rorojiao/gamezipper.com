// verify_independent.js — Independent Node.js BFS solver for Hex Tessellation levels
// This is a SEPARATE implementation from gen_levels.py to cross-verify uniqueness.
const fs = require('fs');
const path = require('path');

const NEIGHBORS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];

function key(q, r) { return `${q},${r}`; }
function unkey(s) { return s.split(',').map(Number); }

function hexNeighbors(q, r) {
    return NEIGHBORS.map(([dq,dr]) => [q+dq, r+dr]);
}

// Canonical form: translate so min-q,min-r is at origin
function canonical(piece) {
    const arr = [...piece];
    const minQ = Math.min(...arr.map(c => c[0]));
    const minR = Math.min(...arr.map(c => c[1]));
    return new Set(arr.map(([q,r]) => key(q-minQ, r-minR)));
}

// Rotate piece by 60°: (q,r) -> (-r, q+r)
function rotate(piece, times) {
    let result = piece.map(c => [...c]);
    for (let i = 0; i < (times % 6); i++) {
        result = result.map(([q,r]) => [-r, q+r]);
    }
    return result;
}

function flipPiece(piece) {
    // Axial reflection: (q,r) -> (-q, r+q)
    return piece.map(([q, r]) => [-q, r + q]);
}

// All 6 rotations + 2 flips (dedup by canonical form)
function allOrientations(piece) {
    const seen = new Set();
    const result = [];
    for (const flip of [false, true]) {
        const base = flip ? flipPiece(piece) : piece;
        for (let rot = 0; rot < 6; rot++) {
            const rotated = rotate(base, rot);
            const canon = [...canonical(rotated)].sort().join('|');
            if (!seen.has(canon)) {
                seen.add(canon);
                result.push(rotated);
            }
        }
    }
    return result;
}

// Exhaustive BFS to find all solutions (cap at 3)
function bfsSolve(targetCells, pieces) {
    const target = new Set(targetCells.map(([q,r]) => key(q,r)));
    const n = pieces.length;
    const orientations = pieces.map(p => allOrientations(p));
    const solutions = [];
    const MAX = 3;

    function findAnchor(occupied) {
        // Sort numerically by (q, r) — NOT string sort
        const sorted = [...target].map(s => s.split(',').map(Number)).sort((a, b) => a[0]-b[0] || a[1]-b[1]);
        for (const [q, r] of sorted) {
            const cell = q + ',' + r;
            if (!occupied.has(cell)) return cell;
        }
        return null;
    }

    function backtrack(idx, occupied, placement) {
        if (solutions.length >= MAX) return;
        if (idx === n) {
            if (occupied.size === target.size) {
                solutions.push([...placement].sort());
            }
            return;
        }
        const anchor = findAnchor(occupied);
        if (!anchor) return;
        const [aq, ar] = unkey(anchor);

        for (const orient of orientations[idx]) {
            for (const [pq, pr] of orient) {
                const offQ = aq - pq;
                const offR = ar - pr;
                const placed = [];
                let valid = true;
                for (const [q, r] of orient) {
                    const cell = key(q+offQ, r+offR);
                    if (!target.has(cell) || occupied.has(cell)) {
                        valid = false;
                        break;
                    }
                    placed.push(cell);
                }
                if (valid) {
                    const newOccupied = new Set(occupied);
                    for (const c of placed) newOccupied.add(c);
                    placement.push(new Set(placed));
                    backtrack(idx+1, newOccupied, placement);
                    placement.pop();
                    if (solutions.length >= MAX) return;
                }
            }
        }
    }

    backtrack(0, new Set(), []);
    return solutions.length;
}

// Main
function main() {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
    let allPass = true;
    let results = [];

    for (const level of data.levels) {
        const target = level.cells;
        const pieces = level.pieces;
        const count = bfsSolve(target, pieces);
        const status = count === 1 ? 'UNIQUE' : (count === 0 ? 'UNSOLVABLE' : `MULTI(${count})`);
        const pass = count === 1;
        if (!pass) allPass = false;
        results.push({ level: level.level, tier: level.tier, cells: target.length, pieces: pieces.length, solutions: count, status, pass });
        console.log(`Level ${level.level} (T${level.tier}): ${target.length} cells, ${pieces.length} pieces → ${status} ${pass ? '✓' : '✗'}`);
    }

    console.log('\n=== SUMMARY ===');
    const passed = results.filter(r => r.pass).length;
    console.log(`${passed}/${results.length} levels UNIQUE+VALID`);
    console.log(allPass ? '✅ ALL PASS (independent Node.js BFS)' : '❌ SOME FAILED');

    process.exit(allPass ? 0 : 1);
}

main();
