
const fs = require('fs');

function solve(R, C, seeds, targets, maxSolutions) {
    const numRegions = seeds.length;
    const grid = new Int8Array(R * C).fill(-1);
    
    // Place seeds
    for (let i = 0; i < seeds.length; i++) {
        grid[seeds[i][0] * C + seeds[i][1]] = i;
    }
    
    // Precompute neighbors
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
    
    // BFS ordering from seeds
    const dist = new Int32Array(R * C).fill(-1);
    const queue = [];
    for (let i = 0; i < seeds.length; i++) {
        const idx = seeds[i][0] * C + seeds[i][1];
        dist[idx] = 0;
        queue.push(idx);
    }
    let qHead = 0;
    while (qHead < queue.length) {
        const cur = queue[qHead++];
        for (const nb of neighbors[cur]) {
            if (dist[nb] === -1) {
                dist[nb] = dist[cur] + 1;
                queue.push(nb);
            }
        }
    }
    
    // Cells to assign (non-seed cells), sorted by distance
    const seedSet = new Set();
    for (const s of seeds) seedSet.add(s[0] * C + s[1]);
    
    const cellsToAssign = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            const idx = r * C + c;
            if (!seedSet.has(idx)) cellsToAssign.push(idx);
        }
    }
    cellsToAssign.sort((a, b) => dist[a] - dist[b]);
    
    const solutions = [];
    let nodes = 0;
    const NODE_LIMIT = 10000000;
    
    function countBorders() {
        const counts = new Int32Array(numRegions);
        for (let i = 0; i < R * C; i++) {
            const rid = grid[i];
            if (rid < 0) continue;
            let isBorder = false;
            const nbrs = neighbors[i];
            const r = Math.floor(i / C);
            const c = i % C;
            // Check if on grid edge
            if (r === 0 || r === R-1 || c === 0 || c === C-1) {
                isBorder = true;
            }
            if (!isBorder) {
                for (const nb of nbrs) {
                    if (grid[nb] >= 0 && grid[nb] !== rid) {
                        isBorder = true;
                        break;
                    }
                }
            }
            if (isBorder) counts[rid]++;
        }
        return counts;
    }
    
    function isRegionConnected(rid) {
        let startCell = -1;
        let count = 0;
        for (let i = 0; i < R * C; i++) {
            if (grid[i] === rid) {
                if (startCell === -1) startCell = i;
                count++;
            }
        }
        if (count === 0) return true;
        const visited = new Set([startCell]);
        const q = [startCell];
        let qh = 0;
        while (qh < q.length) {
            const cur = q[qh++];
            for (const nb of neighbors[cur]) {
                if (grid[nb] === rid && !visited.has(nb)) {
                    visited.add(nb);
                    q.push(nb);
                }
            }
        }
        return visited.size === count;
    }
    
    function backtrack(idx) {
        nodes++;
        if (nodes > NODE_LIMIT) return;
        if (solutions.length >= maxSolutions) return;
        
        if (idx === cellsToAssign.length) {
            const counts = countBorders();
            for (let i = 0; i < numRegions; i++) {
                if (counts[i] !== targets[i]) return;
            }
            // Check connectivity
            for (let i = 0; i < numRegions; i++) {
                if (!isRegionConnected(i)) return;
            }
            solutions.push(Array.from(grid));
            return;
        }
        
        const cellIdx = cellsToAssign[idx];
        const r = Math.floor(cellIdx / C);
        const c = cellIdx % C;
        
        // Feasible: adjacent assigned regions + any region reachable through unassigned
        const feasible = new Set();
        for (const nb of neighbors[cellIdx]) {
            if (grid[nb] >= 0) feasible.add(grid[nb]);
        }
        
        // Check reachable through unassigned cells
        for (let rid = 0; rid < numRegions; rid++) {
            if (feasible.has(rid)) continue;
            // BFS through assigned-same + unassigned to reach seed
            const seedIdx = seeds[rid][0] * C + seeds[rid][1];
            const vis = new Set([cellIdx]);
            const q = [cellIdx];
            let qh = 0;
            let found = false;
            while (qh < q.length && !found) {
                const cur = q[qh++];
                if (cur === seedIdx) { found = true; break; }
                for (const nb of neighbors[cur]) {
                    if (!vis.has(nb) && (grid[nb] === rid || grid[nb] === -1)) {
                        vis.add(nb);
                        q.push(nb);
                    }
                }
            }
            if (found) feasible.add(rid);
        }
        
        const sortedFeasible = Array.from(feasible).sort((a, b) => a - b);
        for (const rid of sortedFeasible) {
            grid[cellIdx] = rid;
            backtrack(idx + 1);
            grid[cellIdx] = -1;
            if (solutions.length >= maxSolutions) return;
        }
    }
    
    backtrack(0);
    return { solutions, nodes };
}

// Read levels from stdin
const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const { seeds, targets, R, C, solution } = input;

const t0 = Date.now();
const { solutions, nodes } = solve(R, C, seeds, targets, 2);
const dt = Date.now() - t0;

// Verify
let matches = false;
if (solutions.length > 0) {
    const solArr = solution.flat();
    matches = JSON.stringify(Array.from(solutions[0])) === JSON.stringify(solArr);
}

console.log(JSON.stringify({
    numSolutions: solutions.length,
    nodes,
    timeMs: dt,
    matchesKnown: matches
}));
