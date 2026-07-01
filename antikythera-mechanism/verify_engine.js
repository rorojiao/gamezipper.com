// Phase 6 Verification - Method 3: In-engine verification
// Extracts the EXACT game logic from index.html and verifies levels are solvable

const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/antikythera-mechanism/index.html', 'utf8');

// Extract LEVELS array from HTML
const match = html.match(/var LEVELS=(\[.*?\]);/);
if (!match) {
    console.log('ERROR: Could not extract LEVELS from HTML');
    process.exit(1);
}

// Evaluate the extracted array
const LEVELS = JSON.parse(match[1]);

// Extract the getDialPosition function logic (exact copy from game)
function getDialPosition(crankPos, dialData) {
    return (crankPos * dialData[1]) % dialData[0];
}

// Extract checkWin logic
function checkWin(levelIdx, crankPos) {
    var lv = LEVELS[levelIdx];
    for (var i = 0; i < lv.d.length; i++) {
        var d = lv.d[i];
        if (getDialPosition(crankPos, d) !== d[2]) return false;
    }
    return true;
}

// BFS from 0 to find shortest path to winning position
function bfs(levelIdx) {
    var lv = LEVELS[levelIdx];
    var M = lv.M;
    var visited = new Array(M).fill(false);
    var queue = [{pos: 0, dist: 0}];
    visited[0] = true;
    
    while (queue.length > 0) {
        var node = queue.shift();
        if (checkWin(levelIdx, node.pos) && node.pos !== 0) {
            return node.dist;
        }
        // Try CW (+1) and CCW (-1)
        var next1 = (node.pos + 1) % M;
        var next2 = ((node.pos - 1) % M + M) % M;
        if (!visited[next1]) {
            visited[next1] = true;
            queue.push({pos: next1, dist: node.dist + 1});
        }
        if (!visited[next2]) {
            visited[next2] = true;
            queue.push({pos: next2, dist: node.dist + 1});
        }
    }
    return -1; // No solution found
}

let allOK = true;
for (let i = 0; i < LEVELS.length; i++) {
    var lv = LEVELS[i];
    // Verify the stored solution works
    var storedSolWorks = checkWin(i, lv.s);
    // BFS to find shortest path
    var bfsDist = bfs(i);
    
    if (!storedSolWorks) {
        console.log(`L${lv.l}: FAIL — stored solution ${lv.s} does not satisfy all dials`);
        allOK = false;
    } else if (bfsDist === -1) {
        console.log(`L${lv.l}: FAIL — BFS found no solution`);
        allOK = false;
    } else {
        var parMatch = bfsDist === lv.p;
        console.log(`L${lv.l}: SOLVABLE (BFS=${bfsDist}, stored par=${lv.p}, sol=${lv.s}) ${parMatch ? 'PAR OK' : 'PAR MISMATCH'}`);
        if (!parMatch) allOK = false;
    }
}

console.log(`\n=== In-Engine BFS Verification ===`);
console.log(`Total levels: ${LEVELS.length}`);
console.log(`All solvable with correct par: ${allOK ? 'YES' : 'NO'}`);
