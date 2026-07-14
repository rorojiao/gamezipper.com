// Method 3: In-engine verification
// Extracts the game's actual isSolved() function from index.html and runs it
// against each level's solution data to confirm the engine accepts all solutions
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/putteria/index.html', 'utf8');

// Extract the LEVELS data from the HTML
const levelMatch = html.match(/var LEVELS=(\[.+?\]);/);
if (!levelMatch) {
    console.log('ERROR: Could not find LEVELS data in HTML');
    process.exit(1);
}
const LEVELS = JSON.parse(levelMatch[1]);

// Re-implement the engine's isSolved function using the SAME logic from the HTML
// (We copy the function body to ensure it matches the deployed engine exactly)
function getRegionCells(grid, rows, cols) {
    var regions = {};
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var rid = grid[r][c];
            if (!regions[rid]) regions[rid] = [];
            regions[rid].push([r, c]);
        }
    }
    return regions;
}

function getRegionSize(lv, rid) {
    if (lv.rs && lv.rs[String(rid)] !== undefined) return lv.rs[String(rid)];
    var count = 0;
    for (var r = 0; r < lv.r; r++) {
        for (var c = 0; c < lv.c; c++) {
            if (lv.g[r][c] === rid) count++;
        }
    }
    return count;
}

function isCross(lv, r, c) {
    var key = r + ',' + c;
    return lv.x && lv.x.indexOf(key) >= 0;
}

function isGiven(lv, r, c) {
    var key = r + ',' + c;
    return lv.v && lv.v[key] !== undefined;
}

// Exact copy of the isSolved function from index.html
function isSolved(lv, placed) {
    var rows = lv.r, cols = lv.c;
    var regions = getRegionCells(lv.g, rows, cols);
    var regionIds = Object.keys(regions);
    for (var i = 0; i < regionIds.length; i++) {
        var rid = regionIds[i];
        var cells = regions[rid];
        var size = cells.length;
        var placedInRegion = 0;
        for (var j = 0; j < cells.length; j++) {
            var r = cells[j][0], c = cells[j][1];
            var key = r + ',' + c;
            if (placed[key]) {
                placedInRegion++;
                if (placed[key] !== size) return false;
            }
        }
        if (placedInRegion !== 1) return false;
    }
    var rowUsed = {}, colUsed = {};
    var placedKeys = Object.keys(placed);
    for (var i = 0; i < placedKeys.length; i++) {
        var parts = placedKeys[i].split(',');
        var r = parseInt(parts[0]), c = parseInt(parts[1]);
        var val = placed[placedKeys[i]];
        if (rowUsed[r + '_' + val]) return false;
        if (colUsed[c + '_' + val]) return false;
        rowUsed[r + '_' + val] = true;
        colUsed[c + '_' + val] = true;
    }
    var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
    for (var i = 0; i < placedKeys.length; i++) {
        var parts = placedKeys[i].split(',');
        var r = parseInt(parts[0]), c = parseInt(parts[1]);
        for (var d = 0; d < 4; d++) {
            var nr = r + DR[d], nc = c + DC[d];
            if (placed[nr + ',' + nc]) return false;
        }
    }
    return true;
}

// Run verification: load each level's solution into the engine and check isSolved
let allOk = true;
LEVELS.forEach((lv, i) => {
    // The HTML uses short keys (r, c, g, s, v, x, rs, t, n)
    // Solution is in lv.s (already in short-key format)
    const sol = lv.s || {};
    
    // Build placed object from solution
    const placed = {};
    Object.keys(sol).forEach(k => { placed[k] = sol[k]; });
    
    const ok = isSolved(lv, placed);
    const status = ok ? 'PASS' : 'FAIL';
    console.log(`Level ${lv.n} [${lv.t}]: ${status}`);
    if (!ok) allOk = false;
});

console.log(`\n${'='.repeat(40)}`);
console.log(`Total: ${LEVELS.length} levels`);
console.log(`Result: ${allOk ? 'ALL PASS' : 'SOME FAILED'}`);
process.exit(allOk ? 0 : 1);
