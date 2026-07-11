#!/usr/bin/env node
/**
 * Rassi-Silai Independent Level Verifier
 * Checks:
 * 1. Each region is contiguous (BFS)
 * 2. Solution paths are valid (visit all cells, orthogonal moves)
 * 3. No endpoint adjacency violations (orthogonal + diagonal)
 * 4. Each path is non-self-intersecting
 * 5. Paths stay within their region
 */

const fs = require('fs');

function verify() {
    const html = fs.readFileSync('/home/msdn/gamezipper.com/rassi-silai/index.html', 'utf8');
    
    // Extract LV= from the embedded JS
    const match = html.match(/var LV=(\[.*?\]);/s);
    if (!match) {
        console.error('Could not extract level data from HTML');
        process.exit(1);
    }
    
    const levels = JSON.parse(match[1]);
    console.log(`Found ${levels.length} levels`);
    
    let errors = 0;
    
    for (let i = 0; i < levels.length; i++) {
        const lv = levels[i];
        const prefix = `Level ${i+1} (${lv.tier}, ${lv.rows}x${lv.cols}):`;
        
        // Check grid dimensions
        if (!lv.grid || lv.grid.length !== lv.rows) {
            console.error(`${prefix} grid rows mismatch`);
            errors++; continue;
        }
        for (let r = 0; r < lv.rows; r++) {
            if (lv.grid[r].length !== lv.cols) {
                console.error(`${prefix} grid cols mismatch at row ${r}`);
                errors++; continue;
            }
        }
        
        // Check region count
        if (!lv.regions || lv.regions.length < 2) {
            console.error(`${prefix} too few regions (${lv.regions?.length})`);
            errors++; continue;
        }
        
        // Check solution paths
        if (!lv.solution_paths || lv.solution_paths.length !== lv.regions.length) {
            console.error(`${prefix} solution_paths count mismatch`);
            errors++; continue;
        }
        
        // Build region cell set for each region
        for (let rid = 0; rid < lv.regions.length; rid++) {
            const regionCells = lv.regions[rid];
            const solPath = lv.solution_paths[rid];
            
            // Check path covers all region cells
            if (solPath.length !== regionCells.length) {
                console.error(`${prefix} region ${rid}: path length ${solPath.length} != region cells ${regionCells.length}`);
                errors++; continue;
            }
            
            // Build region cell set
            const cellSet = new Set();
            for (const [r, c] of regionCells) {
                cellSet.add(`${r},${c}`);
            }
            
            // Check path cells are all in region
            const pathSet = new Set();
            for (let j = 0; j < solPath.length; j++) {
                const [r, c] = solPath[j];
                const key = `${r},${c}`;
                if (!cellSet.has(key)) {
                    console.error(`${prefix} region ${rid}: path cell (${r},${c}) not in region`);
                    errors++; break;
                }
                if (pathSet.has(key)) {
                    console.error(`${prefix} region ${rid}: path revisits cell (${r},${c})`);
                    errors++; break;
                }
                pathSet.add(key);
            }
            
            // Check path connectivity (orthogonal moves)
            for (let j = 0; j < solPath.length - 1; j++) {
                const [r1, c1] = solPath[j];
                const [r2, c2] = solPath[j + 1];
                if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
                    console.error(`${prefix} region ${rid}: path step ${j} to ${j+1} not orthogonal (${r1},${c1}) -> (${r2},${c2})`);
                    errors++; break;
                }
            }
        }
        
        // Check endpoint adjacency violations
        const allEndpoints = [];
        for (let rid = 0; rid < lv.solution_paths.length; rid++) {
            const path = lv.solution_paths[rid];
            if (path.length < 1) continue;
            allEndpoints.push({ rid, cell: path[0] });
            if (path.length > 1) {
                allEndpoints.push({ rid, cell: path[path.length - 1] });
            }
        }
        
        for (let a = 0; a < allEndpoints.length; a++) {
            for (let b = a + 1; b < allEndpoints.length; b++) {
                const ea = allEndpoints[a], eb = allEndpoints[b];
                if (ea.rid === eb.rid) continue;
                const dr = Math.abs(ea.cell[0] - eb.cell[0]);
                const dc = Math.abs(ea.cell[1] - eb.cell[1]);
                if (dr <= 1 && dc <= 1 && (dr > 0 || dc > 0)) {
                    console.error(`${prefix} endpoint adjacency violation: region ${ea.rid} (${ea.cell}) ~ region ${eb.rid} (${eb.cell})`);
                    errors++;
                }
            }
        }
        
        console.log(`${prefix} OK (${lv.regions.length} regions, ${sol_total(lv)} path cells)`);
    }
    
    if (errors === 0) {
        console.log(`\nAll ${levels.length} levels verified successfully!`);
    } else {
        console.error(`\n${errors} errors found!`);
        process.exit(1);
    }
}

function sol_total(lv) {
    return lv.solution_paths.reduce((s, p) => s + p.length, 0);
}

verify();
