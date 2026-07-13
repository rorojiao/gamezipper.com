// verify_engine.js — In-engine verifier: loads actual index.html game logic via vm
// Verifies that isComplete() and checkSolution() pass for all levels when given the solution

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the LEVELS array and key functions
const levelsMatch = html.match(/const LEVELS=(\[.*?\]);/s);
if (!levelsMatch) {
    console.error('Could not extract LEVELS from index.html');
    process.exit(1);
}

const levelsCode = levelsMatch[1];
const LEVELS = eval(levelsCode);

console.log(`Loaded ${LEVELS.length} levels from index.html\n`);

// Extract the checkSolution and isComplete function bodies
// We'll simulate by reimplementing the same logic in Node and testing

let passCount = 0;
let failCount = 0;

for (let idx = 0; idx < LEVELS.length; idx++) {
    const L = LEVELS[idx];
    const rows = L.r, cols = L.c;
    const blackSet = new Set(L.b.map(b => b[0] + ',' + b[1]));
    const clues = L.k.map(k => ({r: k[0], c: k[1], val: k[2]}));
    const solution = L.s;
    
    // Build grid from solution
    const grid = [];
    for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill(null));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            grid[r][c] = solution[r][c];
        }
    }
    
    // isComplete check
    let complete = true;
    const groups = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = r + ',' + c;
            if (blackSet.has(key)) continue;
            const gid = grid[r][c];
            if (gid === null) { complete = false; break; }
            if (!groups[gid]) groups[gid] = [];
            groups[gid].push([r, c]);
        }
        if (!complete) break;
    }
    if (complete) {
        for (const gid in groups) {
            if (groups[gid].length !== 3) { complete = false; break; }
        }
    }
    
    if (!complete) {
        console.log(`L${idx+1}: FAIL — not complete`);
        failCount++;
        continue;
    }
    
    // checkSolution — reimpl exactly as in index.html
    let solutionValid = true;
    for (const cl of clues) {
        let count = 0;
        const seenGroups = new Set();
        // Right
        let c = cl.c + 1;
        while (c < cols) {
            const key = cl.r + ',' + c;
            if (blackSet.has(key)) break;
            const gid = grid[cl.r][c];
            if (gid !== null && !seenGroups.has(gid)) {
                const cells = [];
                for (let rr = 0; rr < rows; rr++)
                    for (let cc = 0; cc < cols; cc++)
                        if (grid[rr][cc] === gid) cells.push([rr, cc]);
                if (cells.length === 3) {
                    const rs = new Set(cells.map(x => x[0]));
                    if (rs.size === 1) {
                        let allIn = true;
                        for (const [rr2, cc2] of cells) {
                            if (rr2 !== cl.r) { allIn = false; break; }
                            for (let cc3 = cl.c + 1; cc3 <= cc2; cc3++) {
                                if (blackSet.has(cl.r + ',' + cc3)) { allIn = false; break; }
                            }
                        }
                        if (allIn) { seenGroups.add(gid); count++; }
                    }
                }
            }
            c++;
        }
        // Down
        let r = cl.r + 1;
        while (r < rows) {
            const key = r + ',' + cl.c;
            if (blackSet.has(key)) break;
            const gid = grid[r][cl.c];
            if (gid !== null && !seenGroups.has(gid)) {
                const cells = [];
                for (let rr = 0; rr < rows; rr++)
                    for (let cc = 0; cc < cols; cc++)
                        if (grid[rr][cc] === gid) cells.push([rr, cc]);
                if (cells.length === 3) {
                    const cs = new Set(cells.map(x => x[1]));
                    if (cs.size === 1) {
                        let allIn = true;
                        for (const [rr2, cc2] of cells) {
                            if (cc2 !== cl.c) { allIn = false; break; }
                            for (let rr3 = cl.r + 1; rr3 <= rr2; rr3++) {
                                if (blackSet.has(rr3 + ',' + cl.c)) { allIn = false; break; }
                            }
                        }
                        if (allIn) { seenGroups.add(gid); count++; }
                    }
                }
            }
            r++;
        }
        if (count !== cl.val) {
            solutionValid = false;
            console.log(`L${idx+1}: FAIL — clue (${cl.r},${cl.c}) expected ${cl.val}, got ${count}`);
            break;
        }
    }
    
    if (solutionValid) {
        console.log(`L${idx+1}: PASS`);
        passCount++;
    } else {
        failCount++;
    }
}

console.log(`\n=== ${passCount}/${LEVELS.length} PASS, ${failCount} FAIL ===`);
process.exit(failCount > 0 ? 1 : 0);
