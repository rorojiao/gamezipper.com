/**
 * Square Jam — Independent Node.js Verifier (Phase 6, Method 2)
 *
 * This verifier INDEPENDENTLY checks each level's structural validity
 * without relying on the Python generator's logic.
 */

const fs = require('fs');

const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

let pass = 0, fail = 0;

levels.forEach(lv => {
    const rows = lv.rows;
    const cols = lv.cols;
    const regions = lv.regions;
    const clues = lv.clues;
    const errors = [];

    // 1. Check grid dimensions
    if (regions.length !== rows || regions[0].length !== cols) {
        errors.push(`Grid dimension mismatch`);
    }

    // 2. Find all regions
    const regionMap = {}; // rid -> cells
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rid = regions[r][c];
            if (!regionMap[rid]) regionMap[rid] = [];
            regionMap[rid].push([r, c]);
        }
    }

    // 3. Each region must be a square
    const regionSizes = {};
    for (const rid in regionMap) {
        const cells = regionMap[rid];
        const rs = cells.map(c => c[0]);
        const cs = cells.map(c => c[1]);
        const rmin = Math.min(...rs);
        const rmax = Math.max(...rs);
        const cmin = Math.min(...cs);
        const cmax = Math.max(...cs);
        const h = rmax - rmin + 1;
        const w = cmax - cmin + 1;

        if (h !== w) {
            errors.push(`Region ${rid} is not square: ${h}x${w}`);
            continue;
        }

        // Check all cells within bounds are present
        if (cells.length !== h * w) {
            errors.push(`Region ${rid} has ${cells.length} cells but needs ${h*w}`);
            continue;
        }

        // Verify every cell in the bounding box belongs to this region
        for (let r = rmin; r <= rmax; r++) {
            for (let c = cmin; c <= cmax; c++) {
                if (regions[r][c] != rid) {
                    errors.push(`Region ${rid} has hole at (${r},${c})`);
                }
            }
        }

        regionSizes[rid] = h;
    }

    // 4. Check clue validity: clue = region side length
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (clues[r][c] > 0) {
                const rid = regions[r][c];
                if (clues[r][c] !== regionSizes[rid]) {
                    errors.push(`Clue (${r},${c})=${clues[r][c]} != region ${rid} size ${regionSizes[rid]}`);
                }
            }
        }
    }

    // 5. Tatami rule: no four region corners at any vertex
    const vertexRegions = {};
    for (const rid in regionMap) {
        const cells = regionMap[rid];
        const rs = cells.map(c => c[0]);
        const cs = cells.map(c => c[1]);
        const rmin = Math.min(...rs);
        const rmax = Math.max(...rs);
        const cmin = Math.min(...cs);
        const cmax = Math.max(...cs);
        const corners = [[rmin, cmin], [rmin, cmax + 1], [rmax + 1, cmin], [rmax + 1, cmax + 1]];
        for (const [vr, vc] of corners) {
            const key = `${vr},${vc}`;
            if (!vertexRegions[key]) vertexRegions[key] = new Set();
            vertexRegions[key].add(rid);
        }
    }

    for (const key in vertexRegions) {
        if (vertexRegions[key].size >= 4) {
            errors.push(`Tatami violation at vertex (${key}): ${vertexRegions[key].size} regions`);
        }
    }

    // 6. Full tiling: every cell belongs to a region
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!regions[r][c] || regions[r][c] === 0) {
                errors.push(`Cell (${r},${c}) has no region`);
            }
        }
    }

    if (errors.length === 0) {
        pass++;
        console.log(`Level ${lv.level} (${lv.tierName}, ${rows}x${cols}): ✅ PASS`);
    } else {
        fail++;
        console.log(`Level ${lv.level} (${lv.tierName}): ❌ FAIL`);
        errors.forEach(e => console.log(`    ${e}`));
    }
});

console.log(`\n${pass}/${pass + fail} levels PASSED`);
if (fail > 0) {
    process.exit(1);
} else {
    console.log('✅ All levels verified independently');
}
