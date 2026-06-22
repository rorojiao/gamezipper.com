// Generate all 27 levels with guaranteed unique solutions
const SHAPES = {
    F: [[0,1,1],[1,1,0],[0,1,0]],
    I: [[1,1,1,1,1]],
    L: [[1,0],[1,0],[1,0],[1,1]],
    P: [[1,1],[1,1],[1,0]],
    N: [[1,0],[1,0],[0,1],[0,1]],
    T: [[1,1,1],[0,1,0],[0,1,0]],
    U: [[1,0,1],[1,1,1]],
    V: [[1,0,0],[1,0,0],[1,1,1]],
    W: [[1,0,0],[1,1,0],[0,1,1]],
    X: [[0,1,0],[1,1,1],[0,1,0]],
    Y: [[0,1],[1,1],[0,1],[0,1]],
    Z: [[1,1,0],[0,1,0],[0,1,1]]
};

function rotateShape(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = [];
    for (let col = 0; col < cols; col++) {
        rotated[col] = [];
        for (let row = rows - 1; row >= 0; row--) {
            rotated[col][rows - 1 - row] = shape[row][col];
        }
    }
    return rotated;
}

function flipShape(shape) {
    return shape.map(row => [...row].reverse());
}

function canPlace(shape, grid, gx, gy, gridW, gridH) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = gx + col;
                const y = gy + row;
                if (x < 0 || y < 0 || x >= gridW || y >= gridH) return false;
                if (grid[y][x] !== 0) return false;
            }
        }
    }
    return true;
}

function placeShape(shape, grid, gx, gy, value) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                grid[gy + row][gx + col] = value;
            }
        }
    }
}

function solve(grid, shapes, gridW, gridH, depth = 0) {
    if (shapes.length === 0) return true;
    
    // Find first empty cell
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            if (grid[y][x] === 0) {
                // Try each shape
                for (let si = 0; si < shapes.length; si++) {
                    const shapeName = shapes[si];
                    let shape = SHAPES[shapeName];
                    
                    // Try all rotations and flips
                    for (let rot = 0; rot < 4; rot++) {
                        for (let flip = 0; flip < 2; flip++) {
                            if (canPlace(shape, grid, x, y, gridW, gridH)) {
                                placeShape(shape, grid, x, y, 1);
                                const remaining = [...shapes.slice(0, si), ...shapes.slice(si + 1)];
                                if (solve(grid, remaining, gridW, gridH, depth + 1)) {
                                    return true;
                                }
                                placeShape(shape, grid, x, y, 0);
                            }
                            shape = flipShape(shape);
                        }
                        shape = rotateShape(shape);
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function countSolutions(grid, shapes, gridW, gridH, maxSolutions = 2) {
    if (shapes.length === 0) return 1;
    
    let count = 0;
    
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            if (grid[y][x] === 0) {
                for (let si = 0; si < shapes.length; si++) {
                    const shapeName = shapes[si];
                    let shape = SHAPES[shapeName];
                    
                    for (let rot = 0; rot < 4; rot++) {
                        for (let flip = 0; flip < 2; flip++) {
                            if (canPlace(shape, grid, x, y, gridW, gridH)) {
                                placeShape(shape, grid, x, y, 1);
                                const remaining = [...shapes.slice(0, si), ...shapes.slice(si + 1)];
                                count += countSolutions(grid, remaining, gridW, gridH, maxSolutions - count);
                                placeShape(shape, grid, x, y, 0);
                                
                                if (count >= maxSolutions) return count;
                            }
                            shape = flipShape(shape);
                        }
                        shape = rotateShape(shape);
                    }
                }
                return count;
            }
        }
    }
    return count;
}

// Generate levels
const LEVELS = [
    // Beginner: 6x10
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    
    // Easy: 5x12
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    
    // Medium: 8x8 with 4 blocked
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[0,0],[7,7],[0,7],[7,0]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[3,3],[4,3],[3,4],[4,4]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[0,3],[0,4],[7,3],[7,4]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[3,0],[4,0],[3,7],[4,7]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[1,1],[6,1],[1,6],[6,6]]},
    
    // Hard: 10x10 with 40 blocked
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: generateBlocked(10,10,40)},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: generateBlocked(10,10,40)},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: generateBlocked(10,10,40)},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: generateBlocked(10,10,40)},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: generateBlocked(10,10,40)},
    
    // Expert: 4x15
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    
    // Master: 6x10
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []}
];

function generateBlocked(w, h, count) {
    const blocked = [];
    const seen = new Set();
    while (blocked.length < count) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        const key = `${x},${y}`;
        if (!seen.has(key)) {
            seen.add(key);
            blocked.push([x, y]);
        }
    }
    return blocked;
}

console.log('Generating and verifying 27 levels...\n');

let uniqueCount = 0;
let invalidCount = 0;

LEVELS.forEach((config, i) => {
    const grid = [];
    for (let y = 0; y < config.gridH; y++) {
        grid[y] = [];
        for (let x = 0; x < config.gridW; x++) {
            grid[y][x] = config.blocked.some(([bx, by]) => bx === x && by === y) ? -1 : 0;
        }
    }
    
    const shapeNames = Object.keys(SHAPES);
    
    // Check if grid has exactly 60 fillable cells
    let fillable = 0;
    for (let y = 0; y < config.gridH; y++) {
        for (let x = 0; x < config.gridW; x++) {
            if (grid[y][x] === 0) fillable++;
        }
    }
    
    if (fillable !== 60) {
        console.log(`❌ Level ${i+1} (${config.tier}): INVALID - ${fillable} cells (expected 60)`);
        invalidCount++;
        return;
    }
    
    // Check uniqueness (max 2 solutions)
    const solutions = countSolutions(
        grid.map(row => [...row]),
        shapeNames,
        config.gridW,
        config.gridH,
        2
    );
    
    if (solutions === 1) {
        console.log(`✅ Level ${i+1} (${config.tier}): UNIQUE (${config.gridW}x${config.gridH}, ${config.blocked.length} blocked)`);
        uniqueCount++;
    } else if (solutions === 0) {
        console.log(`❌ Level ${i+1} (${config.tier}): NO SOLUTION`);
        invalidCount++;
    } else {
        console.log(`⚠️  Level ${i+1} (${config.tier}): ${solutions} SOLUTIONS (not unique)`);
        invalidCount++;
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Unique: ${uniqueCount}/27`);
console.log(`Invalid: ${invalidCount}/27`);

if (uniqueCount === 27) {
    console.log('\n✅ ALL LEVELS VERIFIED UNIQUE!');
} else {
    console.log('\n❌ Some levels invalid - regenerate blocked cells');
}
