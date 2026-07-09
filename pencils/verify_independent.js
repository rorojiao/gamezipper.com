// Independent Node.js verifier for Pencils puzzle levels
// Loads levels.json and verifies all 30 levels using independent logic
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

let allValid = true;
let passCount = 0;

for (const level of levels) {
    const { rows, cols, pencils, level: lvlNum, tier } = level;
    const errors = [];
    
    // Build coverage grid
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    // Check each pencil
    for (let pi = 0; pi < pencils.length; pi++) {
        const p = pencils[pi];
        const [tipR, tipC] = p.tip;
        const body = p.body;
        const line = p.solution_line;
        const num = p.number;
        
        // Check tip is first body cell
        if (body.length === 0 || body[0][0] !== tipR || body[0][1] !== tipC) {
            errors.push(`Pencil ${pi}: tip [${tipR},${tipC}] must be body[0] [${body[0] ? body[0].join(',') : 'none'}]`);
        }
        
        // Check body is straight (all same row or all same col)
        let straight = true;
        if (body.length > 1) {
            const sameRow = body.every(c => c[0] === body[0][0]);
            const sameCol = body.every(c => c[1] === body[0][1]);
            straight = sameRow || sameCol;
        }
        if (!straight) {
            errors.push(`Pencil ${pi}: body is not straight`);
        }
        
        // Check body cells are contiguous
        if (body.length > 1) {
            for (let i = 1; i < body.length; i++) {
                const dr = Math.abs(body[i][0] - body[i-1][0]);
                const dc = Math.abs(body[i][1] - body[i-1][1]);
                if (dr + dc !== 1) {
                    errors.push(`Pencil ${pi}: body cells ${i-1} and ${i} not adjacent`);
                }
            }
        }
        
        // Check body length = number
        if (body.length !== num) {
            errors.push(`Pencil ${pi}: body length ${body.length} != number ${num}`);
        }
        
        // Check line length = number
        if (line.length !== num) {
            errors.push(`Pencil ${pi}: line length ${line.length} != number ${num}`);
        }
        
        // Check line starts adjacent to tip (not along body direction)
        if (line.length > 0) {
            const [lr, lc] = line[0];
            const dr = Math.abs(lr - tipR);
            const dc = Math.abs(lc - tipC);
            if (dr + dc !== 1) {
                errors.push(`Pencil ${pi}: line start [${lr},${lc}] not adjacent to tip [${tipR},${tipC}]`);
            }
        }
        
        // Check line is a simple path (no self-intersection, no branching)
        const lineSet = new Set(line.map(c => `${c[0]},${c[1]}`));
        if (lineSet.size !== line.length) {
            errors.push(`Pencil ${pi}: line has duplicate cells`);
        }
        if (line.length > 1) {
            for (let i = 1; i < line.length; i++) {
                const dr = Math.abs(line[i][0] - line[i-1][0]);
                const dc = Math.abs(line[i][1] - line[i-1][1]);
                if (dr + dc !== 1) {
                    errors.push(`Pencil ${pi}: line cells ${i-1} and ${i} not adjacent`);
                }
            }
        }
        
        // Check line doesn't overlap with body
        for (const c of line) {
            for (const bc of body) {
                if (c[0] === bc[0] && c[1] === bc[1]) {
                    errors.push(`Pencil ${pi}: line overlaps body at [${c[0]},${c[1]}]`);
                }
            }
        }
        
        // Mark body cells
        for (const c of body) {
            const [r, col] = c;
            if (r < 0 || r >= rows || col < 0 || col >= cols) {
                errors.push(`Pencil ${pi}: body cell [${r},${col}] out of bounds`);
            } else if (grid[r][col] !== null) {
                errors.push(`Pencil ${pi}: body cell [${r},${col}] already occupied by pencil ${grid[r][col]}`);
            } else {
                grid[r][col] = `body-${pi}`;
            }
        }
        
        // Mark line cells
        for (const c of line) {
            const [r, col] = c;
            if (r < 0 || r >= rows || col < 0 || col >= cols) {
                errors.push(`Pencil ${pi}: line cell [${r},${col}] out of bounds`);
            } else if (grid[r][col] !== null) {
                errors.push(`Pencil ${pi}: line cell [${r},${col}] already occupied by ${grid[r][col]}`);
            } else {
                grid[r][col] = `line-${pi}`;
            }
        }
    }
    
    // Check full coverage
    let uncovered = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === null) uncovered++;
        }
    }
    if (uncovered > 0) {
        errors.push(`${uncovered} cells uncovered`);
    }
    
    const status = errors.length === 0 ? 'VALID' : 'INVALID';
    if (errors.length > 0) {
        allValid = false;
        console.log(`Level ${lvlNum} (${tier} ${rows}x${cols}): ${status}`);
        errors.forEach(e => console.log(`  ❌ ${e}`));
    } else {
        passCount++;
        console.log(`Level ${lvlNum} (${tier} ${rows}x${cols}): ✅ ${status} — ${pencils.length} pencils, full coverage`);
    }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passCount}/${levels.length} levels valid`);
if (allValid) {
    console.log('✅ ALL LEVELS VALID');
} else {
    console.log('❌ SOME LEVELS INVALID');
    process.exit(1);
}
