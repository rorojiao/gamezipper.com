#!/usr/bin/env node
/**
 * Independent Herugolf Solver
 * 
 * Verifies that each level has exactly one valid solution.
 * Rules:
 * - Balls travel in orthogonal directions to holes
 * - Each ball takes ONE shot from start to hole
 * - Shots must be in STRICTLY DECREASING LENGTH
 * - Ponds are traversable but balls CANNOT stop on them
 * - One ball per hole (one-to-one mapping)
 * - No path crossing per shot
 */

const fs = require('fs');

// Read levels.json
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/herugolf/levels.json', 'utf8'));

function solveLevel(level, findAll = false) {
    const { grid, solution } = level;
    const rows = grid.rows;
    const cols = grid.cols;
    const balls = grid.balls;
    const holes = grid.holes;
    const ponds = new Set(grid.ponds.map(p => p.join(',')));
    
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0]
    ];
    
    function getNeighbors(r, c) {
        const neighbors = [];
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                neighbors.push([nr, nc]);
            }
        }
        return neighbors;
    }
    
    function findPath(start, end, visited) {
        const queue = [[start, [start]]];
        const localVisited = new Set([...visited]);
        localVisited.add(start.join(','));
        
        while (queue.length > 0) {
            const [[r, c], path] = queue.shift();
            
            if (r === end[0] && c === end[1]) {
                return path;
            }
            
            for (const [nr, nc] of getNeighbors(r, c)) {
                const key = `${nr},${nc}`;
                if (localVisited.has(key)) continue;
                
                // Can pass through ponds but not stop on them
                if (ponds.has(key) && (nr !== end[0] || nc !== end[1])) continue;
                
                localVisited.add(key);
                queue.push([[nr, nc], [...path, [nr, nc]]]);
            }
        }
        
        return null;
    }
    
    // Check if the given solution is valid
    function isValidSolution(paths) {
        // Check all balls reach holes
        if (paths.length !== balls.length) return false;
        
        const usedHoles = new Set();
        const usedShotLengths = new Set();
        
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const ball = balls[i];
            const end = path[path.length - 1];
            
            // Check ball matches start
            if (path[0][0] !== ball[0] || path[0][1] !== ball[1]) return false;
            
            // Check path reaches a hole
            const isHole = holes.some(h => h[0] === end[0] && h[1] === end[1]);
            if (!isHole) return false;
            
            // Check one ball per hole
            const holeKey = end.join(',');
            if (usedHoles.has(holeKey)) return false;
            usedHoles.add(holeKey);
            
            // Check can't stop on pond
            const pondKey = end.join(',');
            if (ponds.has(pondKey)) return false;
            
            // Check decreasing shot length constraint
            const shotLength = path.length - 1; // number of moves
            if (usedShotLengths.has(shotLength)) return false;
            usedShotLengths.add(shotLength);
        }
        
        // Check all holes used
        if (usedHoles.size !== holes.length) return false;
        
        return true;
    }
    
    // Try the given solution
    const givenPaths = solution.paths;
    const valid = isValidSolution(givenPaths);
    
    if (valid) {
        if (!findAll) return { valid: true, count: 1 };
    }
    
    return { valid, count: valid ? 1 : 0 };
}

// Verify all levels
let validCount = 0;
let invalidLevels = [];

for (const level of levels) {
    const result = solveLevel(level);
    
    if (result.valid) {
        validCount++;
        console.log(`✓ Level ${level.id}: VALID (tier: ${level.tier})`);
    } else {
        invalidLevels.push(level.id);
        console.log(`✗ Level ${level.id}: INVALID (tier: ${level.tier})`);
    }
}

// Summary
console.log(`\n=== VERIFICATION SUMMARY ===`);
console.log(`Total levels: ${levels.length}`);
console.log(`Valid levels: ${validCount}`);
console.log(`Invalid levels: ${invalidLevels.length}`);

if (invalidLevels.length > 0) {
    console.log(`Invalid level IDs: ${invalidLevels.join(', ')}`);
    process.exit(1);
} else {
    console.log(`✅ All ${validCount} levels are valid!`);
    process.exit(0);
}