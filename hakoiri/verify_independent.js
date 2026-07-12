// Independent Node.js verifier for Hakoiri levels
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/var LEVELS=\[([\s\S]*?)\];/);
if (!m) { console.log('ERROR: Cannot find LEVELS array'); process.exit(1); }

const levelsStr = '[' + m[1] + ']';
let LEVELS;
try { LEVELS = eval(levelsStr); } catch(e) { console.log('EVAL ERROR:', e.message); process.exit(1); }

const D4 = [[-1,0],[0,-1],[0,1],[1,0]];
const D8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

let pass = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    const rows = lv.r, cols = lv.c;
    const rg = lv.rg, sol = lv.s;
    const errors = [];
    
    // Region extraction
    const regionCells = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rid = rg[r][c];
            if (!regionCells[rid]) regionCells[rid] = [];
            regionCells[rid].push([r, c]);
        }
    }
    
    // Rule 1: One of each symbol per region
    for (const rid in regionCells) {
        const counts = {1:0, 2:0, 3:0};
        for (const [r, c] of regionCells[rid]) {
            if (sol[r][c] > 0) counts[sol[r][c]]++;
        }
        if (counts[1] !== 1 || counts[2] !== 1 || counts[3] !== 1) {
            errors.push(`Region ${rid}: ${JSON.stringify(counts)}`);
        }
    }
    
    // Rule 2: King adjacency
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (sol[r][c] > 0) {
                for (const [dr, dc] of D8) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && sol[nr][nc] === sol[r][c]) {
                        errors.push(`Adj (${r},${c})-(${nr},${nc})`);
                    }
                }
            }
        }
    }
    
    // Rule 3: Connectivity
    const syms = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (sol[r][c] > 0) syms.push([r, c]);
        }
    }
    const visited = new Set();
    visited.add(syms[0].join(','));
    const queue = [syms[0]];
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        for (const [dr, dc] of D4) {
            const nr = r + dr, nc = c + dc;
            const key = nr + ',' + nc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key) && sol[nr][nc] > 0) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }
    if (visited.size !== syms.length) errors.push(`Not connected: ${visited.size}/${syms.length}`);
    
    if (errors.length > 0) {
        console.log(`L${i+1}: FAIL - ${errors[0]}`);
    } else {
        pass++;
    }
}
console.log(`\nNode.js independent verification: ${pass}/${LEVELS.length} PASS`);
