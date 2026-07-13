// verify_independent.js — Independent Node.js verifier for Triplace levels
// Loads levels.json and verifies each level's solution is valid

const fs = require('fs');

const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

let passCount = 0;
let failCount = 0;

for (let i = 0; i < levels.length; i++) {
    const lv = levels[i];
    const rows = lv.rows, cols = lv.cols;
    const blacks = new Set(lv.blacks.map(b => b[0] + ',' + b[1]));
    const sol = lv.solution;
    
    let valid = true;
    let reason = '';
    
    // 1. Each triomino has exactly 3 cells
    for (let t = 0; t < sol.length; t++) {
        if (sol[t].length !== 3) {
            valid = false;
            reason = `Triomino ${t} has ${sol[t].length} cells`;
            break;
        }
    }
    
    // 2. No cell is in two triominos
    if (valid) {
        const seen = new Set();
        for (const tri of sol) {
            for (const [r, c] of tri) {
                const key = r + ',' + c;
                if (seen.has(key)) {
                    valid = false;
                    reason = `Cell (${r},${c}) in two triominos`;
                    break;
                }
                seen.add(key);
            }
            if (!valid) break;
        }
    }
    
    // 3. No black cell in triominos
    if (valid) {
        for (const tri of sol) {
            for (const [r, c] of tri) {
                if (blacks.has(r + ',' + c)) {
                    valid = false;
                    reason = `Black cell (${r},${c}) in triomino`;
                    break;
                }
            }
            if (!valid) break;
        }
    }
    
    // 4. All non-black cells covered
    if (valid) {
        const covered = new Set();
        for (const tri of sol) {
            for (const [r, c] of tri) covered.add(r + ',' + c);
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const key = r + ',' + c;
                if (!blacks.has(key) && !covered.has(key)) {
                    valid = false;
                    reason = `Cell (${r},${c}) not covered`;
                    break;
                }
            }
            if (!valid) break;
        }
    }
    
    // 5. Each triomino is straight 1x3 (horizontal or vertical)
    if (valid) {
        for (let t = 0; t < sol.length; t++) {
            const cells = sol[t].slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            const rs = new Set(cells.map(x => x[0]));
            const cs = new Set(cells.map(x => x[1]));
            if (rs.size === 1) {
                // Horizontal - must be consecutive
                if (cells[2][1] - cells[0][1] !== 2) {
                    valid = false;
                    reason = `Triomino ${t} not consecutive H`;
                    break;
                }
            } else if (cs.size === 1) {
                // Vertical - must be consecutive
                if (cells[2][0] - cells[0][0] !== 2) {
                    valid = false;
                    reason = `Triomino ${t} not consecutive V`;
                    break;
                }
            } else {
                valid = false;
                reason = `Triomino ${t} is not straight (L-shape not allowed)`;
                break;
            }
        }
    }
    
    // 6. Verify clues
    if (valid) {
        for (const [key, expectedVal] of Object.entries(lv.clues)) {
            const [br, bc] = key.split(',').map(Number);
            // Count straight triominos visible to the right and down
            let count = 0;
            const seenTri = new Set();
            
            // Right
            for (let c = bc + 1; c < cols; c++) {
                if (blacks.has(br + ',' + c)) break;
                // Find triomino at (br, c)
                for (let t = 0; t < sol.length; t++) {
                    if (seenTri.has(t)) continue;
                    const tri = sol[t];
                    const inTri = tri.some(([r, c2]) => r === br && c2 === c);
                    if (inTri) {
                        // Check if horizontal straight
                        const rs = new Set(tri.map(x => x[0]));
                        if (rs.size === 1) {
                            // Check no black between bc and this tri
                            let blocked = false;
                            const minCol = Math.min(...tri.map(x => x[1]));
                            for (let cc = bc + 1; cc < minCol; cc++) {
                                if (blacks.has(br + ',' + cc)) { blocked = true; break; }
                            }
                            if (!blocked) {
                                seenTri.add(t);
                                count++;
                            }
                        }
                    }
                }
            }
            
            // Down
            for (let r = br + 1; r < rows; r++) {
                if (blacks.has(r + ',' + bc)) break;
                for (let t = 0; t < sol.length; t++) {
                    if (seenTri.has(t)) continue;
                    const tri = sol[t];
                    const inTri = tri.some(([r2, c]) => r2 === r && c === bc);
                    if (inTri) {
                        const cs = new Set(tri.map(x => x[1]));
                        if (cs.size === 1) {
                            let blocked = false;
                            const minRow = Math.min(...tri.map(x => x[0]));
                            for (let rr = br + 1; rr < minRow; rr++) {
                                if (blacks.has(rr + ',' + bc)) { blocked = true; break; }
                            }
                            if (!blocked) {
                                seenTri.add(t);
                                count++;
                            }
                        }
                    }
                }
            }
            
            if (count !== expectedVal) {
                valid = false;
                reason = `Clue (${br},${bc}) expected ${expectedVal}, got ${count}`;
                break;
            }
        }
    }
    
    if (valid) {
        console.log(`L${i+1}: PASS`);
        passCount++;
    } else {
        console.log(`L${i+1}: FAIL — ${reason}`);
        failCount++;
    }
}

console.log(`\n=== ${passCount}/${levels.length} PASS, ${failCount} FAIL ===`);
process.exit(failCount > 0 ? 1 : 0);
