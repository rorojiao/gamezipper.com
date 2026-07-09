
const fs = require('fs');

function solve(R, C, seeds, targets, maxSolutions) {
    const numRegions = seeds.length;
    const grid = new Int8Array(R * C).fill(-1);
    
    for (let i = 0; i < seeds.length; i++) {
        grid[seeds[i][0] * C + seeds[i][1]] = i;
    }
    
    const neighbors = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            const idx = r * C + c;
            const nbrs = [];
            if (r > 0) nbrs.push((r-1) * C + c);
            if (r < R-1) nbrs.push((r+1) * C + c);
            if (c > 0) nbrs.push(r * C + (c-1));
            if (c < C-1) nbrs.push(r * C + (c+1));
            neighbors.push(nbrs);
        }
    }
    
    const seedSet = new Set();
    for (const s of seeds) seedSet.add(s[0] * C + s[1]);
    
    // Row-major ordering of non-seed cells
    const cellsToAssign = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            const idx = r * C + c;
            if (!seedSet.has(idx)) cellsToAssign.push(idx);
        }
    }
    
    const solutions = [];
    let nodes = 0;
    const NODE_LIMIT = 50000000;
    
    // Incremental border tracking
    // borderCount[rid] = current border cell count for region rid
    const borderCount = new Int32Array(numRegions);
    // isBorder[i] = 1 if cell i is currently a border cell
    const isBorder = new Uint8Array(R * C);
    
    function checkBorder(cellIdx) {
        const rid = grid[cellIdx];
        if (rid < 0) return false;
        const r = (cellIdx / C) | 0;
        const c = cellIdx % C;
        // Grid edge check
        if (r === 0 || r === R-1 || c === 0 || c === C-1) return true;
        // Adjacent different region check
        for (const nb of neighbors[cellIdx]) {
            if (grid[nb] >= 0 && grid[nb] !== rid) return true;
        }
        return false;
    }
    
    function recalcBorders() {
        borderCount.fill(0);
        for (let i = 0; i < R * C; i++) {
            if (grid[i] >= 0) {
                const b = checkBorder(i);
                isBorder[i] = b ? 1 : 0;
                if (b) borderCount[grid[i]]++;
            }
        }
    }
    
    function updateBordersAfterAssign(cellIdx) {
        // Cell was just assigned. Update borders for itself and all assigned neighbors.
        const cellsToUpdate = [cellIdx];
        for (const nb of neighbors[cellIdx]) {
            if (grid[nb] >= 0) cellsToUpdate.push(nb);
        }
        for (const ci of cellsToUpdate) {
            const wasB = isBorder[ci];
            const isB = checkBorder(ci);
            if (wasB && !isB) {
                borderCount[grid[ci]]--;
                isBorder[ci] = 0;
            } else if (!wasB && isB) {
                borderCount[grid[ci]]++;
                isBorder[ci] = 1;
            }
        }
    }
    
    function isRegionConnected(rid) {
        let startCell = -1, count = 0;
        for (let i = 0; i < R * C; i++) {
            if (grid[i] === rid) { if (startCell === -1) startCell = i; count++; }
        }
        if (count === 0) return true;
        const visited = new Uint8Array(R * C);
        visited[startCell] = 1;
        const q = [startCell];
        let qh = 0, vcount = 1;
        while (qh < q.length) {
            const cur = q[qh++];
            for (const nb of neighbors[cur]) {
                if (grid[nb] === rid && !visited[nb]) {
                    visited[nb] = 1; vcount++; q.push(nb);
                }
            }
        }
        return vcount === count;
    }
    
    recalcBorders();
    
    function backtrack(idx) {
        nodes++;
        if (nodes > NODE_LIMIT) return;
        if (solutions.length >= maxSolutions) return;
        
        if (idx === cellsToAssign.length) {
            // Check border counts
            for (let i = 0; i < numRegions; i++) {
                if (borderCount[i] !== targets[i]) return;
            }
            // Check connectivity
            for (let i = 0; i < numRegions; i++) {
                if (!isRegionConnected(i)) return;
            }
            solutions.push(Array.from(grid));
            return;
        }
        
        const cellIdx = cellsToAssign[idx];
        
        // Get adjacent regions (feasible regions)
        const feasible = new Set();
        for (const nb of neighbors[cellIdx]) {
            if (grid[nb] >= 0) feasible.add(grid[nb]);
        }
        
        for (const rid of feasible) {
            grid[cellIdx] = rid;
            const savedBorders = new Map();
            
            // Update borders incrementally
            const cellsAffected = [cellIdx];
            for (const nb of neighbors[cellIdx]) {
                if (grid[nb] >= 0) cellsAffected.push(nb);
            }
            for (const ci of cellsAffected) {
                savedBorders.set(ci, [isBorder[ci], grid[ci] >= 0 ? borderCount[grid[ci]] : 0]);
            }
            updateBordersAfterAssign(cellIdx);
            
            // Prune: if any border count exceeds target, skip
            let prune = false;
            for (let i = 0; i < numRegions; i++) {
                if (borderCount[i] > targets[i]) { prune = true; break; }
            }
            
            if (!prune) {
                backtrack(idx + 1);
            }
            
            // Undo
            grid[cellIdx] = -1;
            for (const ci of cellsAffected) {
                const [wasB] = savedBorders.get(ci);
                const nowB = checkBorder(ci);
                if (wasB && !nowB) {
                    borderCount[grid[ci]]--;
                    isBorder[ci] = 0;
                } else if (!wasB && nowB) {
                    borderCount[grid[ci]]++;
                    isBorder[ci] = 1;
                }
            }
            // Re-check cellIdx after unassigning
            isBorder[cellIdx] = 0;
            
            if (solutions.length >= maxSolutions) return;
        }
    }
    
    backtrack(0);
    return { solutions, nodes };
}

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const { seeds, targets, R, C, solution } = input;

const t0 = Date.now();
const { solutions, nodes } = solve(R, C, seeds, targets, 2);
const dt = Date.now() - t0;

let matches = false;
if (solutions.length > 0) {
    matches = JSON.stringify(solutions[0]) === JSON.stringify(solution.flat());
}

console.log(JSON.stringify({
    numSolutions: solutions.length,
    nodes,
    timeMs: dt,
    matchesKnown: matches
}));
