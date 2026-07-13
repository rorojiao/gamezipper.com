#!/usr/bin/env node
'use strict';
/**
 * Independent Node.js BFS verifier for Hanare levels.
 * Verifies all 30 levels by extracting LEVELS from index.html and validating:
 * 1. Each region has exactly 1 number in solution
 * 2. Number = region size
 * 3. Distance constraint holds
 * 4. Solution uniqueness (brute-force backtracking)
 */

const fs = require('fs');
const vm = require('vm');

const htmlPath = process.argv[2] || '/home/msdn/gamezipper.com/hanare/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract LEVELS from the HTML
const match = html.match(/var\s+LEVELS\s*=\s*\[([\s\S]*?)\];/);
if (!match) {
    console.error('ERROR: Could not find LEVELS array in HTML');
    process.exit(1);
}

// Evaluate in a sandbox
const ctx = { LEVELS: null };
vm.createContext(ctx);
vm.runInContext('var LEVELS=[' + match[1] + '];', ctx);
const LEVELS = ctx.LEVELS;

console.log(`Extracted ${LEVELS.length} levels from ${htmlPath}\n`);

let allPass = true;
const tierNames = ['Beginner','Easy','Medium','Hard','Expert'];

for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    const w = lv.w, h = lv.h;
    const tier = tierNames[Math.floor(i / 6)] || 'Unknown';
    
    // Build region cells
    const regionCells = lv.r.map(r => {
        const cells = [];
        for (let j = 0; j < r.length; j += 2) cells.push([r[j], r[j+1]]);
        return cells;
    });
    const sizes = regionCells.map(r => r.length);
    const nRegions = regionCells.length;
    
    // Solution
    const sol = lv.s;
    const solCells = Object.keys(sol).map(k => {
        const [x, y] = k.split(',').map(Number);
        return { x, y, v: sol[k] };
    });
    
    const errors = [];
    
    // Check 1: Each region has exactly 1 number
    for (let ri = 0; ri < nRegions; ri++) {
        const numsInRegion = regionCells[ri].filter(c => 
            solCells.some(s => s.x === c[0] && s.y === c[1]));
        if (numsInRegion.length !== 1) {
            errors.push(`Region ${ri} has ${numsInRegion.length} numbers (expected 1)`);
        }
    }
    
    // Check 2: Number = region size
    for (const s of solCells) {
        const ri = regionCells.findIndex(r => 
            r.some(c => c[0] === s.x && c[1] === s.y));
        if (ri >= 0 && s.v !== sizes[ri]) {
            errors.push(`Cell (${s.x},${s.y}) has value ${s.v} but region ${ri} size is ${sizes[ri]}`);
        }
    }
    
    // Check 3: Distance constraint (rows)
    const numMap = {};
    for (const s of solCells) numMap[`${s.x},${s.y}`] = s.v;
    
    for (let y = 0; y < h; y++) {
        const rowNums = solCells.filter(s => s.y === y).sort((a,b) => a.x - b.x);
        for (let j = 0; j < rowNums.length - 1; j++) {
            const gap = rowNums[j+1].x - rowNums[j].x - 1;
            const diff = Math.abs(rowNums[j].v - rowNums[j+1].v);
            if (gap !== diff) {
                errors.push(`Row ${y}: gap=${gap} but diff=${diff} between (${rowNums[j].x},${y}) and (${rowNums[j+1].x},${y})`);
            }
        }
    }
    
    // Check 3b: Distance constraint (columns)
    for (let x = 0; x < w; x++) {
        const colNums = solCells.filter(s => s.x === x).sort((a,b) => a.y - b.y);
        for (let j = 0; j < colNums.length - 1; j++) {
            const gap = colNums[j+1].y - colNums[j].y - 1;
            const diff = Math.abs(colNums[j].v - colNums[j+1].v);
            if (gap !== diff) {
                errors.push(`Col ${x}: gap=${gap} but diff=${diff} between (${x},${colNums[j].y}) and (${x},${colNums[j+1].y})`);
            }
        }
    }
    
    // Check 4: Solution uniqueness via backtracking
    let solutionCount = 0;
    const placement = {};
    const order = regionCells.map((_, i) => i).sort((a,b) => regionCells[a].length - regionCells[b].length);
    
    function checkPartial() {
        const rows = {}, cols = {};
        for (const [k, v] of Object.entries(placement)) {
            const [x, y] = k.split(',').map(Number);
            if (!rows[y]) rows[y] = [];
            if (!cols[x]) cols[x] = [];
            rows[y].push([x, v]);
            cols[x].push([y, v]);
        }
        for (const [y, nums] of Object.entries(rows)) {
            nums.sort((a,b) => a[0] - b[0]);
            for (let i = 0; i < nums.length - 1; i++) {
                if (Math.abs(nums[i][1] - nums[i+1][1]) !== nums[i+1][0] - nums[i][0] - 1) return false;
            }
        }
        for (const [x, nums] of Object.entries(cols)) {
            nums.sort((a,b) => a[0] - b[0]);
            for (let i = 0; i < nums.length - 1; i++) {
                if (Math.abs(nums[i][1] - nums[i+1][1]) !== nums[i+1][0] - nums[i][0] - 1) return false;
            }
        }
        return true;
    }
    
    function backtrack(idx) {
        if (solutionCount >= 2) return;
        if (idx === nRegions) { solutionCount++; return; }
        const ri = order[idx];
        const value = sizes[ri];
        for (const cell of regionCells[ri]) {
            const key = `${cell[0]},${cell[1]}`;
            placement[key] = value;
            if (checkPartial()) backtrack(idx + 1);
            delete placement[key];
            if (solutionCount >= 2) return;
        }
    }
    backtrack(0);
    
    if (errors.length > 0) {
        allPass = false;
        console.log(`L${String(i+1).padStart(2,'0')} (${tier.padStart(8)}) ${w}x${h}: FAIL - ${errors.length} errors`);
        errors.slice(0,3).forEach(e => console.log(`    ${e}`));
    } else if (solutionCount !== 1) {
        allPass = false;
        console.log(`L${String(i+1).padStart(2,'0')} (${tier.padStart(8)}) ${w}x${h}: FAIL - ${solutionCount} solutions (expected 1)`);
    } else {
        console.log(`L${String(i+1).padStart(2,'0')} (${tier.padStart(8)}) ${w}x${h}: VALID (unique, ${nRegions} regions)`);
    }
}

console.log(`\n${allPass ? 'ALL 30 LEVELS VALID' : 'SOME LEVELS FAILED'}`);
process.exit(allPass ? 0 : 1);
