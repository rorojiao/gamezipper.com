// verify_independent.js — Independent Node.js verifier for Double Choco levels
// Extracts LEVELS from index.html and validates each level independently.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf-8');
const match = html.match(/const LEVELS = (\[.*?\]);/s);
if (!match) {
    console.error('FAIL: Could not extract LEVELS from index.html');
    process.exit(1);
}

const sandbox = { LEVELS: null };
vm.createContext(sandbox);
vm.runInContext(`LEVELS = ${match[1]};`, sandbox);
const LEVELS = sandbox.LEVELS;

console.log(`Extracted ${LEVELS.length} levels from index.html`);

// Polyomino normalization and congruence check
function normalize(cells) {
    const minR = Math.min(...cells.map(c => c[0]));
    const minC = Math.min(...cells.map(c => c[1]));
    return new Set(cells.map(([r, c]) => `${r - minR},${c - minC}`));
}

function rotate90(cells) {
    return normalize(cells.map(([r, c]) => [-c, r]));
}

function reflectH(cells) {
    return normalize(cells.map(([r, c]) => [-r, c]));
}

function allTransformations(cells) {
    const results = new Set();
    let current = normalize(cells);
    for (let i = 0; i < 4; i++) {
        results.add(setKey(current));
        results.add(setKey(reflectH([...current].map(s => s.split(',').map(Number)))));
        current = rotate90([...current].map(s => s.split(',').map(Number)));
    }
    return results;
}

function setKey(s) {
    return [...s].sort().join('|');
}

function areCongruent(shape1, shape2) {
    const s1 = shape1.map(([r, c]) => [r, c]);
    return setKey(normalize(s1)) === setKey(normalize(shape2)) || 
           allTransformations(s1).has(setKey(normalize(shape2)));
}

let allValid = true;
LEVELS.forEach((level, idx) => {
    const errors = [];
    const { rows, cols, grid, color, blocks, clues } = level;
    
    // Check all cells assigned
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === null || grid[r][c] === undefined) {
                errors.push(`Cell (${r},${c}) not assigned`);
            }
        }
    }
    
    // Check each block
    blocks.forEach((block, i) => {
        const white = block.w.map(([r, c]) => [r, c]);
        const gray = block.g.map(([r, c]) => [r, c]);
        
        // Size check
        if (white.length !== gray.length) {
            errors.push(`Block ${i}: white(${white.length}) != gray(${gray.length})`);
        }
        
        // Congruence check
        if (!areCongruent(white, gray)) {
            errors.push(`Block ${i}: shapes not congruent`);
        }
        
        // Grid consistency
        [...white, ...gray].forEach(([r, c]) => {
            if (grid[r][c] !== i) {
                errors.push(`Block ${i}: cell (${r},${c}) grid value ${grid[r][c]} != ${i}`);
            }
        });
        
        // Color consistency
        white.forEach(([r, c]) => {
            if (color[r][c] !== 0) errors.push(`Block ${i}: white cell (${r},${c}) has color ${color[r][c]}`);
        });
        gray.forEach(([r, c]) => {
            if (color[r][c] !== 1) errors.push(`Block ${i}: gray cell (${r},${c}) has color ${color[r][c]}`);
        });
    });
    
    // Clue consistency
    for (const [key, val] of Object.entries(clues)) {
        const [r, c] = key.split(',').map(Number);
        const bid = grid[r][c];
        if (bid === undefined || !blocks[bid]) {
            errors.push(`Clue at (${r},${c}): no valid block`);
            continue;
        }
        const block = blocks[bid];
        const actualSize = block.w.length;
        if (val !== actualSize) {
            errors.push(`Clue at (${r},${c}): value ${val} != block size ${actualSize}`);
        }
    }
    
    if (errors.length > 0) {
        allValid = false;
        console.log(`❌ Level ${idx + 1} (${level.tierName}): ${errors.length} errors`);
        errors.slice(0, 3).forEach(e => console.log(`    ${e}`));
    } else {
        console.log(`✅ Level ${idx + 1} (${level.tierName} ${rows}×${cols}): VALID`);
    }
});

if (allValid) {
    console.log(`\n✅ ALL ${LEVELS.length} LEVELS VALID (Node.js independent verifier)`);
} else {
    console.log(`\n❌ SOME LEVELS HAVE ERRORS`);
    process.exit(1);
}
