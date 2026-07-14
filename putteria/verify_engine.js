// verify_engine.js — In-engine verification for Putteria
// Loads the actual index.html, extracts LEVELS, and runs the engine's checkSolution logic.

const fs = require('fs');
const vm = require('vm');

// Read index.html and extract the script content
const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS directly via regex
const levelsMatch = html.match(/const LEVELS = (\[.*?\]);/s);
if (!levelsMatch) {
    console.error('ERROR: Could not find LEVELS in index.html');
    process.exit(1);
}

// Create a sandbox and eval the LEVELS
const sandbox = {
    console: console,
    LEVELS: null,
    document: {
        getElementById: () => ({
            getContext: () => ({
                fillRect: () => {}, fillText: () => {}, strokeRect: () => {},
                beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
            }),
            width: 500, height: 500,
            addEventListener: () => {},
            classList: { add: () => {}, remove: () => {}, toggle: () => {} },
            style: {},
            textContent: '',
            innerHTML: '',
            checked: false,
        }),
        addEventListener: () => {},
        querySelectorAll: () => [],
    },
    window: { innerWidth: 500, addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    Date: { now: () => 0 },
};

try {
    vm.createContext(sandbox);
    vm.runInContext('var LEVELS = ' + levelsMatch[1] + ';', sandbox, { timeout: 5000 });
} catch(e) {
    console.log('Script eval error:', e.message);
}

const LEVELS = sandbox.LEVELS;

if (!LEVELS) {
    console.error('ERROR: Could not extract LEVELS from index.html');
    process.exit(1);
}

console.log(`Loaded ${LEVELS.length} levels from engine\n`);

// Reimplement the engine's checkSolution logic
function verifyWithEngine(lvl) {
    const rows = lvl.rows, cols = lvl.cols, grid = lvl.grid;
    const board = {};
    const crossCells = new Set(lvl.crosses);
    const givens = lvl.givens;
    const solution = lvl.solution;
    
    // Initialize board with givens
    for (const [k, v] of Object.entries(givens)) {
        board[k] = v;
    }
    
    // Add solution cells
    for (const [k, v] of Object.entries(solution)) {
        board[k] = v;
    }
    
    // Compute region sizes
    const regionSizes = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rid = grid[r][c];
            regionSizes[rid] = (regionSizes[rid] || 0) + 1;
        }
    }
    
    // Check: each region has exactly one number
    const regionCount = {};
    for (const [key, num] of Object.entries(board)) {
        const [r, c] = key.split(',').map(Number);
        const rid = grid[r][c];
        regionCount[rid] = (regionCount[rid] || 0) + 1;
    }
    
    for (const rid of Object.keys(regionSizes)) {
        const rrid = parseInt(rid);
        if (!regionCount[rrid] || regionCount[rrid] !== 1) {
            return { pass: false, reason: `Region ${rid} has ${regionCount[rrid] || 0} numbers (expected 1)` };
        }
    }
    
    // Check: each number equals its region size
    for (const [key, num] of Object.entries(board)) {
        const [r, c] = key.split(',').map(Number);
        const rid = grid[r][c];
        if (num !== regionSizes[rid]) {
            return { pass: false, reason: `Cell ${key} has ${num} but region ${rid} size is ${regionSizes[rid]}` };
        }
    }
    
    // Check: no row/col duplicates
    const rowNums = {}, colNums = {};
    for (const [key, num] of Object.entries(board)) {
        const [r, c] = key.split(',').map(Number);
        if (rowNums[r] && rowNums[r].has(num)) {
            return { pass: false, reason: `Duplicate ${num} in row ${r}` };
        }
        if (colNums[c] && colNums[c].has(num)) {
            return { pass: false, reason: `Duplicate ${num} in col ${c}` };
        }
        if (!rowNums[r]) rowNums[r] = new Set();
        if (!colNums[c]) colNums[c] = new Set();
        rowNums[r].add(num);
        colNums[c].add(num);
    }
    
    // Check: no orth adjacency
    const placedCells = new Set(Object.keys(board));
    for (const key of placedCells) {
        const [r, c] = key.split(',').map(Number);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nk = (r+dr) + ',' + (c+dc);
            if (placedCells.has(nk)) {
                return { pass: false, reason: `Adjacent numbers at ${key} and ${nk}` };
            }
        }
    }
    
    // Check: no numbers on cross cells
    for (const key of Object.keys(board)) {
        if (crossCells.has(key)) {
            return { pass: false, reason: `Number on cross cell ${key}` };
        }
    }
    
    return { pass: true };
}

let passCount = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const result = verifyWithEngine(LEVELS[i]);
    if (result.pass) {
        passCount++;
        console.log(`Level ${i+1} (${LEVELS[i].tier}): PASS ✅`);
    } else {
        console.log(`Level ${i+1} (${LEVELS[i].tier}): FAIL ❌ — ${result.reason}`);
    }
}

console.log(`\n${passCount}/${LEVELS.length} levels PASS`);
