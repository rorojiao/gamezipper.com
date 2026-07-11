#!/usr/bin/env node
/**
 * Pipelink Independent Level Verifier v2
 * Fixed loop tracing logic.
 */
const fs = require('fs');

function verify() {
    const html = fs.readFileSync('/home/msdn/gamezipper.com/pipelink/index.html', 'utf8');
    const match = html.match(/var LV=(\[.*?\]);/s);
    if (!match) { console.error('Could not extract level data'); process.exit(1); }
    
    const levels = JSON.parse(match[1]);
    console.log(`Found ${levels.length} levels`);
    
    const PIPE_DIRS = {0:[],1:['L','R'],2:['U','D'],3:['U','R'],4:['U','L'],5:['D','R'],6:['D','L'],7:['U','D','L','R']};
    const DIR_DELTA = {U:[-1,0],D:[1,0],L:[0,-1],R:[0,1]};
    const OPPOSITE = {U:'D',D:'U',L:'R',R:'L'};
    
    let errors = 0;
    
    for (let i = 0; i < levels.length; i++) {
        const lv = levels[i];
        const prefix = `Level ${i+1} (${lv.tier}, ${lv.rows}x${lv.cols}):`;
        const sol = lv.solution;
        
        // Check all cells covered
        if (Object.keys(sol).length !== lv.rows * lv.cols) {
            console.error(`${prefix} solution doesn't cover all cells`);
            errors++; continue;
        }
        
        // Check connections (each cell's connections reciprocated)
        let connErr = false;
        for (const key in sol) {
            const [r, c] = key.split(',').map(Number);
            const dirs = PIPE_DIRS[sol[key]];
            for (const d of dirs) {
                const nr = r + DIR_DELTA[d][0], nc = c + DIR_DELTA[d][1];
                if (nr < 0 || nr >= lv.rows || nc < 0 || nc >= lv.cols) {
                    console.error(`${prefix} (${r},${c}) dir ${d} out of bounds`);
                    connErr = true; errors++; break;
                }
                const nkey = `${nr},${nc}`;
                if (!(nkey in sol) || !PIPE_DIRS[sol[nkey]].includes(OPPOSITE[d])) {
                    console.error(`${prefix} (${r},${c})->(${nr},${nc}) no reciprocal`);
                    connErr = true; errors++; break;
                }
            }
            if (connErr) break;
        }
        if (connErr) continue;
        
        // Trace the loop
        const visited = {};
        const startKey = Object.keys(sol)[0];
        let curKey = startKey;
        let entryDir = null; // direction we entered FROM (null for start)
        let valid = true;
        
        for (let step = 0; step < lv.rows * lv.cols * 4 + 10; step++) {
            if (visited[curKey]) {
                // Must be back at start AND all cells visited
                if (curKey !== startKey) { valid = false; }
                break;
            }
            visited[curKey] = true;
            const [r, c] = curKey.split(',').map(Number);
            const ptype = sol[curKey];
            const dirs = PIPE_DIRS[ptype];
            
            // Determine exit direction
            let exitDir = null;
            if (ptype === 7) {
                // Cross: go straight through
                // entryDir is the direction we came FROM
                // If we entered from 'L', we exit 'R' (straight)
                if (entryDir) {
                    exitDir = OPPOSITE[entryDir]; // Go straight
                } else {
                    exitDir = dirs[0]; // Starting: pick first
                }
            } else {
                // Normal cell: exit through the direction that is NOT entryDir
                for (const d of dirs) {
                    if (d !== entryDir) {
                        exitDir = d;
                        break;
                    }
                }
            }
            
            if (!exitDir) { valid = false; break; }
            
            entryDir = OPPOSITE[exitDir]; // We enter next cell from OPPOSITE direction
            const nr = r + DIR_DELTA[exitDir][0];
            const nc = c + DIR_DELTA[exitDir][1];
            curKey = `${nr},${nc}`;
            
            if (nr < 0 || nr >= lv.rows || nc < 0 || nc >= lv.cols) { valid = false; break; }
        }
        
        if (valid && Object.keys(visited).length === lv.rows * lv.cols) {
            const numClues = Object.keys(lv.clues).length;
            console.log(`${prefix} OK (${numClues} clues)`);
        } else {
            console.error(`${prefix} not a valid single closed loop (visited ${Object.keys(visited).length}/${lv.rows*lv.cols})`);
            errors++;
        }
    }
    
    if (errors === 0) {
        console.log(`\nAll ${levels.length} levels verified!`);
    } else {
        console.error(`\n${errors} errors found!`);
        process.exit(1);
    }
}

verify();
