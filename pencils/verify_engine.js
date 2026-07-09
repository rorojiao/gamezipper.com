// In-engine verification: loads actual LEVELS from index.html and verifies solutions
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the main script
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
let mainScript = null;
for (const m of scripts) {
    const fullTag = m[0];
    const openingTag = fullTag.match(/<script[^>]*>/)[0];
    if (openingTag.includes('src=')) continue;
    if (m[1].includes('const LEVELS')) { mainScript = m[1]; break; }
}
if (!mainScript) {
    console.log('ERROR: no main script found');
    process.exit(1);
}

// Use globalThis to expose LEVELS
mainScript = mainScript.replace('const LEVELS', 'globalThis.LEVELS');

// Create a VM context with full browser stubs
const noopEl = {
    style: {},
    classList: { toggle: function(){}, add: function(){}, remove: function(){}, contains: function(){return false;} },
    getContext: function(){ return null; },
    addEventListener: function(){},
    offsetHeight: 0,
    innerHTML: '',
    appendChild: function(){},
};
const sandbox = {
    globalThis: {},
    window: {
        addEventListener: function(){},
        AudioContext: function(){ return {}; },
        innerHeight: 800,
    },
    document: {
        addEventListener: function(){},
        getElementById: function(){ return noopEl; },
        createElement: function(){ return noopEl; },
    },
    canvas: noopEl,
    ctx: null,
    localStorage: { getItem: function(){return null;}, setItem: function(){} },
    console: console,
    setTimeout: function(){},
    setInterval: function(){return 0;},
    clearInterval: function(){},
    AudioContext: function(){ return {}; },
};
sandbox.globalThis = sandbox;
sandbox.window.globalThis = sandbox;

vm.createContext(sandbox);

try {
    vm.runInContext(mainScript, sandbox);
} catch(e) {
    console.log('Script execution error:', e.message);
    // Continue anyway - LEVELS may have been defined before the error
}

const LEVELS_DATA = sandbox.LEVELS;
if (!LEVELS_DATA) {
    console.log('ERROR: LEVELS not found in script');
    process.exit(1);
}

console.log(`Loaded ${LEVELS_DATA.length} levels from index.html\n`);

let allValid = true;
let passCount = 0;

for (let i = 0; i < LEVELS_DATA.length; i++) {
    const lv = LEVELS_DATA[i];
    const errors = [];
    
    // Determine field names (support both abbreviated and full)
    const pencils = lv.p || lv.pencils;
    if (!pencils) {
        console.log(`Level ${lv.lvl}: no pencils field! Keys: ${Object.keys(lv).join(',')}`);
        continue;
    }
    
    const R = lv.r || lv.rows;
    const C = lv.c || lv.cols;
    
    // Build grid
    const grid = Array(R).fill(null).map(() => Array(C).fill(-1));
    
    for (let pi = 0; pi < pencils.length; pi++) {
        const p = pencils[pi];
        const num = p.n || p.number;
        const body = p.body;
        const sol = p.sol || p.solution_line;
        const tip = p.tip;
        
        // Check body cells
        for (const c of body) {
            if (c[0] < 0 || c[0] >= R || c[1] < 0 || c[1] >= C) {
                errors.push(`P${pi}: body cell [${c[0]},${c[1]}] out of bounds`);
            } else if (grid[c[0]][c[1]] !== -1) {
                errors.push(`P${pi}: body cell [${c[0]},${c[1]}] overlap`);
            } else {
                grid[c[0]][c[1]] = pi;
            }
        }
        
        // Check line cells
        for (const c of sol) {
            if (c[0] < 0 || c[0] >= R || c[1] < 0 || c[1] >= C) {
                errors.push(`P${pi}: line cell [${c[0]},${c[1]}] out of bounds`);
            } else if (grid[c[0]][c[1]] !== -1) {
                errors.push(`P${pi}: line cell [${c[0]},${c[1]}] overlap`);
            } else {
                grid[c[0]][c[1]] = pi;
            }
        }
        
        if (sol.length !== num) errors.push(`P${pi}: line length ${sol.length} != number ${num}`);
        if (body.length !== num) errors.push(`P${pi}: body length ${body.length} != number ${num}`);
        if (body[0][0] !== tip[0] || body[0][1] !== tip[1]) errors.push(`P${pi}: tip mismatch`);
        
        // Check line is simple path
        const solSet = new Set(sol.map(c => `${c[0]},${c[1]}`));
        if (solSet.size !== sol.length) errors.push(`P${pi}: line has duplicate cells`);
        for (let li = 1; li < sol.length; li++) {
            const dr = Math.abs(sol[li][0] - sol[li-1][0]);
            const dc = Math.abs(sol[li][1] - sol[li-1][1]);
            if (dr + dc !== 1) errors.push(`P${pi}: line cells ${li-1} and ${li} not adjacent`);
        }
        
        // Check line starts adjacent to tip
        if (sol.length > 0) {
            const dr = Math.abs(sol[0][0] - tip[0]);
            const dc = Math.abs(sol[0][1] - tip[1]);
            if (dr + dc !== 1) errors.push(`P${pi}: line start not adjacent to tip`);
        }
        
        // Check body is straight
        if (body.length > 1) {
            const sameRow = body.every(c => c[0] === body[0][0]);
            const sameCol = body.every(c => c[1] === body[0][1]);
            if (!sameRow && !sameCol) errors.push(`P${pi}: body not straight`);
            for (let bi = 1; bi < body.length; bi++) {
                const dr = Math.abs(body[bi][0] - body[bi-1][0]);
                const dc = Math.abs(body[bi][1] - body[bi-1][1]);
                if (dr + dc !== 1) errors.push(`P${pi}: body cells not contiguous`);
            }
        }
    }
    
    // Check full coverage
    let uncovered = 0;
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === -1) uncovered++;
        }
    }
    if (uncovered > 0) errors.push(`${uncovered} cells uncovered`);
    
    if (errors.length === 0) {
        passCount++;
        console.log(`Level ${lv.lvl} (${lv.tier} ${R}x${C}): ✅ VALID`);
    } else {
        allValid = false;
        console.log(`Level ${lv.lvl} (${lv.tier} ${R}x${C}): ❌ INVALID`);
        errors.forEach(e => console.log(`  ${e}`));
    }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passCount}/${LEVELS_DATA.length} levels valid`);
if (allValid) {
    console.log('✅ ALL LEVELS VALID (in-engine)');
} else {
    console.log('❌ SOME LEVELS INVALID');
    process.exit(1);
}
