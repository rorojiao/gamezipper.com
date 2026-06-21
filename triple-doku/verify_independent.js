#!/usr/bin/env node
/**
 * Triple Doku Independent Verification
 * — Different implementation than gen.py (bitmask DFS + MRV heuristic)
 * — Verifies all 27 levels:
 *   1. Each grid (A, B, C) independently has EXACTLY 1 solution
 *   2. Shared stacks consistent: A cols 6-8 == B cols 0-2 AND B cols 6-8 == C cols 0-2
 *   3. Puzzle givens match solution
 *   4. Solutions are valid Sudoku (rows, cols, boxes all 1-9)
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('triple-doku/levels.json', 'utf8'));
const levels = data.levels;

// ---------- Bitmask Sudoku solver (count solutions up to limit) ----------
function countSolutions(grid, limit = 2) {
    const rows = new Array(9).fill(0);
    const cols = new Array(9).fill(0);
    const boxes = new Array(9).fill(0);
    const board = grid.map(r => r.slice());

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = board[r][c];
            if (v) {
                const bit = 1 << v;
                rows[r] |= bit;
                cols[c] |= bit;
                boxes[Math.floor(r/3)*3 + Math.floor(c/3)] |= bit;
            }
        }
    }

    let solutions = 0;

    function dfs() {
        if (solutions >= limit) return;

        // MRV: find empty cell with fewest candidates
        let bestR = -1, bestC = -1, bestCands = null, bestLen = 10;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const used = rows[r] | cols[c] | boxes[Math.floor(r/3)*3 + Math.floor(c/3)];
                    const cands = [];
                    for (let v = 1; v <= 9; v++) {
                        if (!(used & (1 << v))) cands.push(v);
                    }
                    if (cands.length < bestLen) {
                        bestLen = cands.length;
                        bestR = r; bestC = c; bestCands = cands;
                        if (bestLen === 0) return;
                        if (bestLen === 1) break;
                    }
                }
            }
            if (bestLen === 1) break;
        }

        if (bestR === -1) {
            solutions++;
            return;
        }

        const bIdx = Math.floor(bestR/3)*3 + Math.floor(bestC/3);
        for (const v of bestCands) {
            const bit = 1 << v;
            board[bestR][bestC] = v;
            rows[bestR] |= bit;
            cols[bestC] |= bit;
            boxes[bIdx] |= bit;

            dfs();

            board[bestR][bestC] = 0;
            rows[bestR] &= ~bit;
            cols[bestC] &= ~bit;
            boxes[bIdx] &= ~bit;

            if (solutions >= limit) return;
        }
    }

    dfs();
    return solutions;
}

function solveUnique(grid) {
    return countSolutions(grid, 2);
}

// ---------- Verification ----------
let allPass = true;
let results = [];

for (const lvl of levels) {
    const issues = [];

    // 1. Grid A unique
    const nA = solveUnique(lvl.puzzleA);
    if (nA !== 1) issues.push(`Grid A has ${nA} solutions (expected 1)`);

    // 2. Grid B unique
    const nB = solveUnique(lvl.puzzleB);
    if (nB !== 1) issues.push(`Grid B has ${nB} solutions (expected 1)`);

    // 3. Grid C unique
    const nC = solveUnique(lvl.puzzleC);
    if (nC !== 1) issues.push(`Grid C has ${nC} solutions (expected 1)`);

    // 4. Shared stack consistency AB (A cols 6-8 == B cols 0-2)
    for (let r = 0; r < 9; r++) {
        for (let k = 0; k < 3; k++) {
            if (lvl.puzzleA[r][6+k] !== lvl.puzzleB[r][k]) {
                issues.push(`Shared AB mismatch puzzle: A[${r}][${6+k}]=${lvl.puzzleA[r][6+k]} vs B[${r}][${k}]=${lvl.puzzleB[r][k]}`);
            }
            if (lvl.solutionA[r][6+k] !== lvl.solutionB[r][k]) {
                issues.push(`Shared AB mismatch solution: A[${r}][${6+k}]=${lvl.solutionA[r][6+k]} vs B[${r}][${k}]=${lvl.solutionB[r][k]}`);
            }
        }
    }

    // 5. Shared stack consistency BC (B cols 6-8 == C cols 0-2)
    for (let r = 0; r < 9; r++) {
        for (let k = 0; k < 3; k++) {
            if (lvl.puzzleB[r][6+k] !== lvl.puzzleC[r][k]) {
                issues.push(`Shared BC mismatch puzzle: B[${r}][${6+k}]=${lvl.puzzleB[r][6+k]} vs C[${r}][${k}]=${lvl.puzzleC[r][k]}`);
            }
            if (lvl.solutionB[r][6+k] !== lvl.solutionC[r][k]) {
                issues.push(`Shared BC mismatch solution: B[${r}][${6+k}]=${lvl.solutionB[r][6+k]} vs C[${r}][${k}]=${lvl.solutionC[r][k]}`);
            }
        }
    }

    // 6. Puzzle givens match solution
    for (const [name, puz, sol] of [['A', lvl.puzzleA, lvl.solutionA], ['B', lvl.puzzleB, lvl.solutionB], ['C', lvl.puzzleC, lvl.solutionC]]) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puz[r][c] !== 0 && puz[r][c] !== sol[r][c]) {
                    issues.push(`${name}[${r}][${c}] given ${puz[r][c]} != solution ${sol[r][c]}`);
                }
            }
        }
    }

    // 7. Solution validity (A, B, C are valid Sudoku)
    for (const [name, sol] of [['A', lvl.solutionA], ['B', lvl.solutionB], ['C', lvl.solutionC]]) {
        for (let r = 0; r < 9; r++) {
            const rowSet = new Set(sol[r]);
            if (rowSet.size !== 9 || rowSet.has(0)) issues.push(`${name} row ${r} invalid`);
        }
        for (let c = 0; c < 9; c++) {
            const colSet = new Set();
            for (let r = 0; r < 9; r++) colSet.add(sol[r][c]);
            if (colSet.size !== 9 || colSet.has(0)) issues.push(`${name} col ${c} invalid`);
        }
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const boxSet = new Set();
                for (let dr = 0; dr < 3; dr++)
                    for (let dc = 0; dc < 3; dc++)
                        boxSet.add(sol[br*3+dr][bc*3+dc]);
                if (boxSet.size !== 9 || boxSet.has(0)) issues.push(`${name} box ${br},${bc} invalid`);
            }
        }
    }

    const status = issues.length === 0 ? 'PASS' : 'FAIL';
    if (issues.length > 0) allPass = false;
    results.push(`  #${lvl.id} ${lvl.tier}: ${status} (A=${lvl.givensA}, B=${lvl.givensB}, C=${lvl.givensC})${issues.length ? ' — ' + issues.join('; ') : ''}`);
}

console.log('=== Triple Doku Independent Verification ===');
console.log(`Levels: ${levels.length}`);
console.log(results.join('\n'));
console.log(`\n${allPass ? 'ALL 27/27 PASS — UNIQUE + VALID' : 'FAILURES DETECTED'}`);
process.exit(allPass ? 0 : 1);
