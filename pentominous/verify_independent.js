// Phase 6: Independent Node.js Level Verification for Pentominous (CORRECTED)
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/pentominous/index.html', 'utf8');

// Extract LEVELS from the HTML
const levelsMatch = html.match(/var LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!levelsMatch) { console.log('ERROR: Could not extract LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(levelsMatch[1]);
console.log(`Found ${LEVELS.length} levels\n`);

// VERIFIED CORRECT pentomino definitions
const PENTOMINO_BASE = {
    'I': [[0,0],[0,1],[0,2],[0,3],[0,4]],
    'L': [[0,0],[0,1],[0,2],[0,3],[1,0]],
    'Y': [[0,0],[0,1],[0,2],[0,3],[1,1]],
    'P': [[0,0],[0,1],[0,2],[1,0],[1,1]],
    'U': [[0,0],[0,1],[0,2],[1,0],[1,2]],
    'V': [[0,0],[0,1],[0,2],[1,0],[2,0]],
    'T': [[0,0],[0,1],[0,2],[1,1],[2,1]],
    'N': [[0,0],[0,1],[0,2],[1,2],[1,3]],
    'F': [[0,0],[0,1],[1,1],[1,2],[2,1]],
    'Z': [[0,0],[0,1],[1,1],[1,2],[2,2]],
    'W': [[0,0],[0,1],[1,1],[2,1],[2,2]],
    'X': [[0,1],[1,0],[1,1],[1,2],[2,1]],
};

function normalize(cells) {
    const minR = Math.min(...cells.map(c => c[0]));
    const minC = Math.min(...cells.map(c => c[1]));
    return cells.map(([r,c]) => [r-minR, c-minC]).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
}
function rotate(cells) { return cells.map(([r,c]) => [c, -r]); }
function reflect(cells) { return cells.map(([r,c]) => [r, -c]); }
function allOrientations(cells) {
    const seen = new Set();
    const result = [];
    let current = [...cells];
    for (let rot = 0; rot < 4; rot++) {
        const norm = normalize(current);
        const key = JSON.stringify(norm);
        if (!seen.has(key)) { seen.add(key); result.push(norm); }
        const refl = normalize(reflect(current));
        const rkey = JSON.stringify(refl);
        if (!seen.has(rkey)) { seen.add(rkey); result.push(refl); }
        current = rotate(current);
    }
    return result;
}

const ALL_ORI = {};
for (const [name, cells] of Object.entries(PENTOMINO_BASE)) {
    ALL_ORI[name] = allOrientations(cells);
}

function identifyPentomino(cells) {
    const norm = normalize(cells.map(c => [...c]));
    for (const [name, orientations] of Object.entries(ALL_ORI)) {
        for (const ori of orientations) {
            if (JSON.stringify(ori) === JSON.stringify(norm)) return name;
        }
    }
    return null;
}

function getRegions(grid, rows, cols) {
    const visited = new Set();
    const regions = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = r + ',' + c;
            if (visited.has(key)) continue;
            const type = grid[r][c];
            if (!type) continue;
            const region = [];
            const queue = [[r, c]];
            while (queue.length > 0) {
                const [cr, cc] = queue.shift();
                const ck = cr + ',' + cc;
                if (visited.has(ck)) continue;
                visited.add(ck);
                if (grid[cr][cc] !== type) continue;
                region.push([cr, cc]);
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    if (!visited.has(nr + ',' + nc) && grid[nr][nc] === type) queue.push([nr, nc]);
                }
            }
            if (region.length > 0) regions.push({ type, cells: region });
        }
    }
    return regions;
}

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    const issues = [];
    const expectedCells = lv.r * lv.c;
    if (expectedCells % 5 !== 0) issues.push(`Grid ${lv.r}x${lv.c}=${expectedCells} not div by 5`);
    
    // Build solution grid
    const grid = [];
    for (let r = 0; r < lv.r; r++) grid.push(new Array(lv.c).fill(null));
    for (const [key, type] of Object.entries(lv.solution)) {
        const [r, c] = key.split(',').map(Number);
        grid[r][c] = type;
    }
    
    // Check all cells filled
    for (let r = 0; r < lv.r; r++)
        for (let c = 0; c < lv.c; c++)
            if (!grid[r][c]) issues.push(`Cell ${r},${c} no solution`);
    
    // Get regions
    const regions = getRegions(grid, lv.r, lv.c);
    const expectedPieces = expectedCells / 5;
    if (regions.length !== expectedPieces) issues.push(`Expected ${expectedPieces} regions, got ${regions.length}`);
    
    // Check region size = 5
    for (let j = 0; j < regions.length; j++)
        if (regions[j].cells.length !== 5) issues.push(`Region ${j} has ${regions[j].cells.length} cells`);
    
    // Check shape matches type
    for (let j = 0; j < regions.length; j++) {
        const identified = identifyPentomino(regions[j].cells);
        if (identified !== regions[j].type)
            issues.push(`Region ${j} type ${regions[j].type} but shape is ${identified}`);
    }
    
    // Check no same-type adjacent
    for (let j = 0; j < regions.length; j++)
        for (let k = j + 1; k < regions.length; k++)
            if (regions[j].type === regions[k].type) {
                const s1 = new Set(regions[j].cells.map(([r,c]) => r+','+c));
                for (const [r, c] of regions[k].cells)
                    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]])
                        if (s1.has((r+dr)+','+(c+dc)))
                            issues.push(`Regions ${j},${k} (${regions[j].type}) share edge`);
            }
    
    // Check clue consistency
    for (const [key, clueType] of Object.entries(lv.clues))
        if (lv.solution[key] !== clueType)
            issues.push(`Clue ${key}: ${clueType} vs sol ${lv.solution[key]}`);
    
    const status = issues.length === 0 ? 'PASS' : 'FAIL';
    console.log(`Level ${i+1} (T${lv.t}, ${lv.r}x${lv.c}): ${status} (${regions.length} regions, ${Object.keys(lv.clues).length} clues)`);
    if (issues.length > 0) issues.forEach(iss => console.log(`  - ${iss}`));
    issues.length === 0 ? pass++ : fail++;
}
console.log(`\n=== RESULT: ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
