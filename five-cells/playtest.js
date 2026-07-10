/**
 * Five Cells — Playtest Simulation
 * Extracts the game's checkWin logic and runs it against the correct solution
 * for each level. Verifies that applying the solution edges triggers a WIN.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract LEVELS
const match = html.match(/(?:const|var|let)\s+LEVELS\s*=\s*(\[.*?\]);/s);
const sandbox2 = {};
vm.createContext(sandbox2);
vm.runInContext('var LEVELS = ' + match[1] + ';', sandbox2);
const LEVELS = sandbox2.LEVELS;

console.log(`\n=== Five Cells Playtest Simulation ===`);
console.log(`Testing ${LEVELS.length} levels\n`);

let allPass = true;
let checked = 0;

for (let idx = 0; idx < LEVELS.length; idx++) {
    const lv = LEVELS[idx];
    const R = lv.r, C = lv.c;
    const sol = lv.sol;
    
    // Build the correct edge state from solution
    // hEdges[r][c] = true if there's a border between (r-1,c) and (r,c)
    // hEdges: dimensions [R+1][C], hEdges[0] and hEdges[R] = outer frame (true)
    const hEdges = [];
    for (let r = 0; r <= R; r++) {
        hEdges.push(new Array(C).fill(false));
        if (r === 0 || r === R) hEdges[r].fill(true);
    }
    for (let r = 1; r < R; r++) {
        for (let c = 0; c < C; c++) {
            hEdges[r][c] = (sol[r-1][c] !== sol[r][c]);
        }
    }
    
    // vEdges[r][c] = true if border between (r,c-1) and (r,c)  
    // vEdges: dimensions [R][C+1]
    const vEdges = [];
    for (let r = 0; r < R; r++) {
        vEdges.push(new Array(C+1).fill(false));
        vEdges[r][0] = true;
        vEdges[r][C] = true;
        for (let c = 1; c < C; c++) {
            vEdges[r][c] = (sol[r][c-1] !== sol[r][c]);
        }
    }
    
    // Simulate checkWin logic
    function getBorderCount(r, c) {
        let count = 0;
        if (hEdges[r][c]) count++;        // top
        if (hEdges[r+1][c]) count++;      // bottom
        if (vEdges[r][c]) count++;        // left
        if (vEdges[r][c+1]) count++;      // right
        return count;
    }
    
    function getRegions() {
        // Compute connected components from non-border edges
        const visited = Array(R).fill(null).map(() => Array(C).fill(false));
        const regions = [];
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (visited[r][c]) continue;
                const region = [];
                const q = [[r, c]];
                visited[r][c] = true;
                while (q.length > 0) {
                    const [cr, cc] = q.shift();
                    region.push([cr, cc]);
                    // Check 4 neighbors — connected if NO border between them
                    // Top neighbor
                    if (cr > 0 && !hEdges[cr][cc] && !visited[cr-1][cc]) {
                        visited[cr-1][cc] = true;
                        q.push([cr-1, cc]);
                    }
                    // Bottom neighbor
                    if (cr < R-1 && !hEdges[cr+1][cc] && !visited[cr+1][cc]) {
                        visited[cr+1][cc] = true;
                        q.push([cr+1, cc]);
                    }
                    // Left neighbor
                    if (cc > 0 && !vEdges[cr][cc] && !visited[cr][cc-1]) {
                        visited[cr][cc-1] = true;
                        q.push([cr, cc-1]);
                    }
                    // Right neighbor
                    if (cc < C-1 && !vEdges[cr][cc+1] && !visited[cr][cc+1]) {
                        visited[cr][cc+1] = true;
                        q.push([cr, cc+1]);
                    }
                }
                regions.push(region);
            }
        }
        return regions;
    }
    
    // Run checkWin simulation
    function checkWin() {
        const regions = getRegions();
        for (let i = 0; i < regions.length; i++) {
            if (regions[i].length !== 5) return false;
        }
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (lv.cl[r][c] !== null) {
                    if (getBorderCount(r, c) !== lv.cl[r][c]) return false;
                }
            }
        }
        return true;
    }
    
    const won = checkWin();
    const regions = getRegions();
    const allSize5 = regions.every(reg => reg.length === 5);
    
    if (!won) allPass = false;
    
    const status = won ? '✅' : '❌';
    console.log(`  ${status} Level ${idx+1}: ${R}x${C} ${lv.t} — checkWin: ${won ? 'WIN' : 'FAIL'}, regions all size 5: ${allSize5}, ${regions.length} regions`);
    checked++;
}

console.log(`\n=== RESULT: ${allPass ? 'ALL ' + checked + ' LEVELS WIN ✅' : 'SOME LEVELS FAILED ❌'} ===`);
process.exit(allPass ? 0 : 1);
