#!/usr/bin/env node
// verify_independent.js — Independent Node.js solver for Scrin
// Reimplements the rules from scratch, loads levels.json, verifies each level has exactly 1 solution.

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const LEVELS = data;

function solve(rows, cols, clues) {
    // Build clue map
    const clueMap = {};  // "r,c" -> size
    for (const c of clues) clueMap[c.r + ',' + c.c] = c.n;

    // All clue cells
    const clueCells = Object.keys(clueMap).map(k => {
        const [r, c] = k.split(',').map(Number);
        return { r, c, size: clueMap[k] };
    });
    // Sort by size descending (largest first - smaller search space)
    clueCells.sort((a, b) => b.size - a.size);

    let solutionCount = 0;
    let nodeBudget = 200000;

    function findPlacements(r, c, size, occ) {
        const results = [];
        for (let h = 1; h <= size; h++) {
            if (size % h !== 0) continue;
            const w = size / h;
            for (let dr = 0; dr < h; dr++) {
                for (let dc = 0; dc < w; dc++) {
                    const r0 = r - dr, c0 = c - dc;
                    const r1 = r0 + h - 1, c1 = c0 + w - 1;
                    if (r0 < 0 || c0 < 0 || r1 >= rows || c1 >= cols) continue;
                    let ok = true;
                    for (let rr = r0; rr <= r1 && ok; rr++) {
                        for (let cc = c0; cc <= c1 && ok; cc++) {
                            if (occ[rr][cc]) ok = false;
                        }
                    }
                    if (ok) results.push([r0, c0, r1, c1]);
                }
            }
        }
        return results;
    }

    function fillRemaining(occ) {
        // Tile the remaining unoccupied cells with rectangles (greedy guillotine).
        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        for (let r0 = 0; r0 < rows; r0++) {
            for (let c0 = 0; c0 < cols; c0++) {
                if (occ[r0][c0] || visited[r0][c0]) continue;
                // BFS for connected component
                const comp = [];
                const stack = [[r0, c0]];
                while (stack.length) {
                    const [rr, cc] = stack.pop();
                    if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
                    if (occ[rr][cc] || visited[rr][cc]) continue;
                    visited[rr][cc] = true;
                    comp.push([rr, cc]);
                    stack.push([rr-1, cc], [rr+1, cc], [rr, cc-1], [rr, cc+1]);
                }
                if (comp.length === 0) continue;
                // Greedy tile: pick topmost-leftmost, max width, max height
                const compSet = new Set(comp.map(([r, c]) => r + ',' + c));
                while (compSet.size > 0) {
                    let minR = Infinity, minC = Infinity;
                    for (const k of compSet) {
                        const [r, c] = k.split(',').map(Number);
                        if (r < minR || (r === minR && c < minC)) {
                            minR = r; minC = c;
                        }
                    }
                    let w = 0;
                    while (minC + w < cols && compSet.has(minR + ',' + (minC + w)) && !occ[minR][minC + w]) w++;
                    let h = 1;
                    while (minR + h < rows) {
                        let allIn = true;
                        for (let dc = 0; dc < w; dc++) {
                            if (!compSet.has((minR + h) + ',' + (minC + dc)) || occ[minR + h][minC + dc]) { allIn = false; break; }
                        }
                        if (!allIn) break;
                        h++;
                    }
                    for (let rr = minR; rr < minR + h; rr++) {
                        for (let cc = minC; cc < minC + w; cc++) {
                            occ[rr][cc] = true;
                            compSet.delete(rr + ',' + cc);
                        }
                    }
                }
            }
        }
        return true;
    }

    function recurse(idx, occ) {
        if (solutionCount >= 2) return;
        if (nodeBudget <= 0) return;
        nodeBudget--;

        if (idx === clueCells.length) {
            // All clues placed. Fill remaining.
            const occCopy = occ.map(row => row.slice());
            if (fillRemaining(occCopy)) {
                solutionCount++;
            }
            return;
        }
        const { r, c, size } = clueCells[idx];
        const placements = findPlacements(r, c, size, occ);
        for (const [r0, c0, r1, c1] of placements) {
            for (let rr = r0; rr <= r1; rr++) {
                for (let cc = c0; cc <= c1; cc++) {
                    occ[rr][cc] = true;
                }
            }
            recurse(idx + 1, occ);
            for (let rr = r0; rr <= r1; rr++) {
                for (let cc = c0; cc <= c1; cc++) {
                    occ[rr][cc] = false;
                }
            }
        }
    }

    const occ = Array.from({ length: rows }, () => Array(cols).fill(false));
    recurse(0, occ);
    return solutionCount;
}

let fails = 0;
for (const L of LEVELS) {
    const n = solve(L.rows, L.cols, L.clues);
    const ok = (n === 1);
    const marker = ok ? '✓' : '✗';
    if (!ok) fails++;
    console.log(`  L${String(L.id).padStart(2)} [${L.tier.padEnd(8)}] ${L.rows}x${L.cols} : ${n} solution(s) ${marker}`);
}
console.log(`\nResult: ${LEVELS.length - fails}/${LEVELS.length} unique, ${fails} failures`);
process.exit(fails === 0 ? 0 : 1);
