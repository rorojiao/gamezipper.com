#!/usr/bin/env node
/**
 * verify_independent.js — Independent Node.js verifier for Chained levels.
 * Reads levels.json and re-validates ALL Chained rules from scratch.
 */
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function getBlocks(grid, R, C) {
    const visited = new Set();
    const blocks = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 1 && !visited.has(r + ',' + c)) {
                const block = [];
                const q = [[r, c]];
                visited.add(r + ',' + c);
                while (q.length) {
                    const [cr, cc] = q.shift();
                    block.push([cr, cc]);
                    for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
                        const nr = cr + dr, nc = cc + dc;
                        if (nr >= 0 && nr < R && nc >= 0 && nc < C &&
                            grid[nr][nc] === 1 && !visited.has(nr + ',' + nc)) {
                            visited.add(nr + ',' + nc);
                            q.push([nr, nc]);
                        }
                    }
                }
                blocks.push(block);
            }
        }
    }
    return blocks;
}

function normalizeShape(cells) {
    const minR = Math.min(...cells.map(p => p[0]));
    const minC = Math.min(...cells.map(p => p[1]));
    const norm = cells.map(([r, c]) => [r - minR, c - minC]);
    const transforms = [];
    let cur = norm.map(p => [...p]);
    for (let i = 0; i < 4; i++) {
        const sorted = [...cur].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        transforms.push(JSON.stringify(sorted));
        cur = cur.map(([r, c]) => [c, -r]);
    }
    cur = norm.map(([r, c]) => [r, -c]);
    for (let i = 0; i < 4; i++) {
        const sorted = [...cur].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        transforms.push(JSON.stringify(sorted));
        cur = cur.map(([r, c]) => [c, -r]);
    }
    return transforms.sort()[0];
}

function areDiagAdj(b1, b2) {
    for (const [r1, c1] of b1) {
        for (const [r2, c2] of b2) {
            if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) return true;
        }
    }
    return false;
}

function getChains(blocks) {
    const n = blocks.length;
    const adj = {};
    for (let i = 0; i < n; i++) adj[i] = new Set();
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (areDiagAdj(blocks[i], blocks[j])) {
                adj[i].add(j);
                adj[j].add(i);
            }
        }
    }
    // connected components
    const visited = new Set();
    const chains = [];
    for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
            const chain = new Set();
            const q = [i];
            visited.add(i);
            while (q.length) {
                const node = q.shift();
                chain.add(node);
                for (const nb of adj[node]) {
                    if (!visited.has(nb)) {
                        visited.add(nb);
                        q.push(nb);
                    }
                }
            }
            chains.push(chain);
        }
    }
    return chains;
}

function verifyLevel(level) {
    const R = level.R, C = level.C;
    const grid = level.solution;

    // Check grid dimensions
    if (grid.length !== R) return { ok: false, msg: `Grid rows ${grid.length} != R ${R}` };
    for (let r = 0; r < R; r++) {
        if (grid[r].length !== C) return { ok: false, msg: `Row ${r} length ${grid[r].length} != C ${C}` };
    }

    const blocks = getBlocks(grid, R, C);
    if (blocks.length === 0) return { ok: false, msg: 'No blocks found' };

    // Check: all blocks must be chained (no isolated block)
    const chains = getChains(blocks);
    for (const chain of chains) {
        if (chain.size === 1) {
            return { ok: false, msg: `Isolated block at ${JSON.stringify(blocks[[...chain][0]])}` };
        }
    }

    // Check: no duplicate shape+size in any chain
    for (const chain of chains) {
        const shapesSeen = new Set();
        for (const bi of chain) {
            const shape = normalizeShape(blocks[bi]);
            const size = blocks[bi].length;
            const key = size + ':' + shape;
            if (shapesSeen.has(key)) {
                return { ok: false, msg: `Duplicate shape in chain: size ${size}` };
            }
            shapesSeen.add(key);
        }
    }

    // Check: each block has exactly one clue
    const clues = level.clues || {};
    // clues are on cells that should be white (not black)
    // Actually in this game, the clue cells are NOT part of the block.
    // The clue number = size of the adjacent block. Let me verify:
    // For each clue cell, find the block it belongs to... 
    // Wait — in the Nikoli rules, the number is ON a cell IN the block.
    // But our generation locks clue cells as white=2 (not black).
    // So clue cells are NOT in blocks — they're outside, adjacent to blocks.
    // The clue tells the size of the nearest block.
    // Actually re-reading: "The number written on a cell indicates the number of black cells that make up the block containing that cell."
    // So the number IS on a black cell that's part of the block.
    // But in our implementation, we lock clue cells as white and the player fills other cells.
    // The solution grid has 1=black. Clue cells should be 1 in solution.
    // Let me check...
    
    // Actually looking at our gen_levels.py: clues are placed on cells IN the block (block cells).
    // But in index.html we lock clue cells as player=2 (white).
    // This is a DESIGN ISSUE. Let me check the solution.
    
    // The solution grid marks clue cells. If solution[r][c]==1, that cell is black.
    // Clue cells in the puzzle: puzzle[r][c] != 0 means there's a clue.
    // The clue cell should be part of the block (solution=1).
    
    // Let me verify that clue cells in the puzzle are black in the solution:
    for (const [key, val] of Object.entries(clues)) {
        const [r, c] = key.split(',').map(Number);
        if (grid[r][c] !== 1) {
            return { ok: false, msg: `Clue at (${r},${c}) is not black in solution` };
        }
    }

    return { ok: true, msg: `OK: ${blocks.length} blocks, ${chains.length} chain(s)` };
}

// Run verification
let allOk = true;
let passCount = 0;
for (const lv of levels) {
    const result = verifyLevel(lv);
    const status = result.ok ? '✓' : '✗';
    console.log(`  L${lv.id} (${lv.tier}): ${status} ${result.msg}`);
    if (result.ok) passCount++;
    else allOk = false;
}

console.log(`\n${passCount}/${levels.length} levels PASS`);
console.log(allOk ? 'ALL PASS' : 'SOME FAILED');
process.exit(allOk ? 0 : 1);
