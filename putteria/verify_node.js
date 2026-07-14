// Method 2: Node independent level verifier for Putteria
// Independent implementation - does NOT share code with Python verifier or game engine
const fs = require('fs');

function verifyLevel(lv) {
    const errors = [];
    const R = lv.rows, C = lv.cols;
    const grid = lv.grid;
    const sol = lv.solution || {};
    const cross = new Set(lv.crosses || []);
    const givens = lv.givens || {};
    const rs = lv.region_sizes || {};
    
    // Build regions
    const regions = {};
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            const rid = grid[r][c];
            if (rid === -1) continue;
            if (!regions[rid]) regions[rid] = [];
            regions[rid].push([r, c]);
        }
    }
    
    // Check 1: Each region has exactly one solution number = its size
    for (const [rid, cells] of Object.entries(regions)) {
        const size = cells.length;
        const ridNum = parseInt(rid);
        if (rs[String(ridNum)] !== undefined && rs[String(ridNum)] !== size) {
            errors.push(`Region ${rid}: region_sizes[${rid}]=${rs[String(ridNum)]} but actual size=${size}`);
        }
        let placedInRegion = 0;
        for (const [r, c] of cells) {
            const key = `${r},${c}`;
            if (sol[key] !== undefined) {
                placedInRegion++;
                if (sol[key] !== size) {
                    errors.push(`Region ${rid}: solution at (${r},${c})=${sol[key]} but size=${size}`);
                }
            }
        }
        if (placedInRegion !== 1) {
            errors.push(`Region ${rid}: has ${placedInRegion} solution numbers, expected 1`);
        }
    }
    
    // Check 2: No number repeats in any row or column
    const rowUsed = {}, colUsed = {};
    for (const [key, val] of Object.entries(sol)) {
        const [r, c] = key.split(',').map(Number);
        const rk = `${r}_${val}`, ck = `${c}_${val}`;
        if (rowUsed[rk]) errors.push(`Row ${r}: number ${val} repeats at (${r},${c}) and (${rowUsed[rk]})`);
        if (colUsed[ck]) errors.push(`Col ${c}: number ${val} repeats at (${r},${c}) and (${colUsed[ck]})`);
        rowUsed[rk] = key;
        colUsed[ck] = key;
    }
    
    // Check 3: Numbered cells not orthogonally adjacent
    const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
    for (const key of Object.keys(sol)) {
        const [r, c] = key.split(',').map(Number);
        for (let d = 0; d < 4; d++) {
            const nr = r + DR[d], nc = c + DC[d];
            const nkey = `${nr},${nc}`;
            if (sol[nkey] !== undefined) {
                errors.push(`Adjacency: (${r},${c}) and (${nr},${nc}) both have numbers`);
            }
        }
    }
    
    // Check 4: Cross cells have no numbers
    for (const x of cross) {
        if (sol[x] !== undefined) {
            errors.push(`Cross cell (${x}) has a solution number`);
        }
    }
    
    // Check 5: Given numbers match solution
    for (const [key, val] of Object.entries(givens)) {
        if (sol[key] === undefined) {
            errors.push(`Given at (${key})=${val} not in solution`);
        } else if (sol[key] !== val) {
            errors.push(`Given at (${key})=${val} but solution=${sol[key]}`);
        }
    }
    
    // Check 6: Solution cells within bounds and not on cross cells
    for (const key of Object.keys(sol)) {
        const [r, c] = key.split(',').map(Number);
        if (r < 0 || r >= R || c < 0 || c >= C) {
            errors.push(`Solution (${key}) out of bounds`);
        } else if (cross.has(key)) {
            errors.push(`Solution (${key}) on cross cell`);
        }
    }
    
    return { ok: errors.length === 0, errors };
}

// Main
const data = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/putteria/levels.json', 'utf8'));
const levels = data.levels;
let allOk = true;

levels.forEach((lv, i) => {
    const { ok, errors } = verifyLevel(lv);
    const status = ok ? 'PASS' : 'FAIL';
    console.log(`Level ${lv.level || (i+1)} [${lv.tier || '?'}]: ${status}`);
    if (!ok) {
        allOk = false;
        errors.forEach(e => console.log(`  - ${e}`));
    }
});

console.log(`\n${'='.repeat(40)}`);
console.log(`Total: ${levels.length} levels`);
console.log(`Result: ${allOk ? 'ALL PASS' : 'SOME FAILED'}`);

process.exit(allOk ? 0 : 1);
