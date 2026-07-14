// Detour Independent Verifier (Node.js)
// Validates all 30 levels: Hamiltonian cycle + turn-count clues
const fs = require('fs');

const levelsRaw = fs.readFileSync('/home/msdn/gamezipper.com/detour/levels.json', 'utf8');
const LEVELS = JSON.parse(levelsRaw);

const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

function verifyLevel(level) {
    const { rows, cols, regions, clues, solution } = level;
    
    // 1. Check solution is a valid Hamiltonian cycle
    // Every cell must have exactly 2 connections
    const visited = new Set();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const conns = solution[r][c];
            if (conns.length !== 2) {
                return { valid: false, reason: `Cell (${r},${c}) has ${conns.length} connections, expected 2` };
            }
            // Verify connections are valid (within bounds)
            for (const d of conns) {
                const nr = r + DR[d], nc = c + DC[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                    return { valid: false, reason: `Cell (${r},${c}) connection out of bounds: dir ${d}` };
                }
                // Check reciprocal connection
                const opp = (d + 2) % 4;
                if (!solution[nr][nc].includes(opp)) {
                    return { valid: false, reason: `Connection mismatch: (${r},${c})→${d} but (${nr},${nc}) has no ${opp}` };
                }
            }
        }
    }
    
    // 2. Check it forms a single cycle (trace the loop)
    let current = [0, 0];
    let prevDir = null;
    const cellsVisited = new Set();
    cellsVisited.add('0,0');
    
    for (let step = 0; step < rows * cols; step++) {
        const [r, c] = current;
        const conns = solution[r][c];
        // Pick the direction that's not where we came from
        let nextDir = null;
        for (const d of conns) {
            if (d !== prevDir || conns.length === 1) {
                // This is a valid outgoing direction
                // Actually we need to trace properly
            }
        }
        // Simpler: pick a direction and follow
        if (step === 0) {
            nextDir = conns[0];
        } else {
            // The direction we came FROM is (prevDir + 2) % 4
            const cameFrom = (prevDir + 2) % 4;
            nextDir = conns.find(d => d !== cameFrom);
            if (nextDir === undefined) nextDir = conns[0];
        }
        
        const nr = r + DR[nextDir], nc = c + DC[nextDir];
        current = [nr, nc];
        prevDir = nextDir;
        cellsVisited.add(`${nr},${nc}`);
    }
    
    if (cellsVisited.size !== rows * cols) {
        return { valid: false, reason: `Loop visits ${cellsVisited.size} cells, expected ${rows * cols}` };
    }
    
    // Check it closes back
    if (current[0] !== 0 || current[1] !== 0) {
        return { valid: false, reason: `Loop doesn't close back to start: ended at (${current[0]},${current[1]})` };
    }
    
    // 3. Verify turn counts per region
    const turnCounts = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const conns = solution[r][c];
            // Sort to check if it's a turn or straight
            const sorted = [...conns].sort();
            // Straight: [0,2] (N-S) or [1,3] (E-W)
            // Turn: any other combination
            const isTurn = !(sorted[0] + 2 === sorted[1]);
            if (isTurn) {
                const rid = regions[r][c];
                turnCounts[rid] = (turnCounts[rid] || 0) + 1;
            }
        }
    }
    
    // Check against clues
    for (const [rid, clue] of Object.entries(clues)) {
        if (clue !== null) {
            const actual = turnCounts[rid] || 0;
            if (actual !== clue) {
                return { valid: false, reason: `Region ${rid}: clue says ${clue} turns, actual ${actual}` };
            }
        }
    }
    
    return { valid: true, cellsVisited: cellsVisited.size, turnCounts };
}

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const result = verifyLevel(LEVELS[i]);
    if (result.valid) {
        pass++;
        console.log(`L${i+1} T${LEVELS[i].tier}: PASS (${LEVELS[i].rows}x${LEVELS[i].cols}, ${result.cellsVisited} cells)`);
    } else {
        fail++;
        console.log(`L${i+1} T${LEVELS[i].tier}: FAIL - ${result.reason}`);
    }
}

console.log(`\n${pass}/${LEVELS.length} PASS${fail ? ` (${fail} FAILED)` : ''}`);
