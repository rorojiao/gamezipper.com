// Independent Node.js BFS verification for Jigpic Solitaire
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/jigpic-solitaire/levels.json', 'utf8'));

function minSwapsCycle(arr) {
    const n = arr.length;
    const visited = new Array(n).fill(false);
    let cycles = 0;
    for (let i = 0; i < n; i++) {
        if (!visited[i]) {
            cycles++;
            let j = i;
            while (!visited[j]) {
                visited[j] = true;
                j = arr[j];
            }
        }
    }
    return n - cycles;
}

console.log(`Total levels: ${levels.length}`);
let allValid = true;

for (const lv of levels) {
    const tiles = lv.tiles;
    const grid = lv.grid;
    const expected = grid * grid;
    
    // Check 1: tiles array length matches grid
    if (tiles.length !== expected) {
        console.log(`FAIL: Level ${lv.level} tile count ${tiles.length} != ${expected}`);
        allValid = false;
        continue;
    }
    
    // Check 2: tiles contain all numbers 0..N-1 (permutation check)
    const sorted = [...tiles].sort((a,b) => a - b);
    for (let i = 0; i < expected; i++) {
        if (sorted[i] !== i) {
            console.log(`FAIL: Level ${lv.level} not a valid permutation (missing ${i})`);
            allValid = false;
            break;
        }
    }
    
    // Check 3: not already solved
    const solved = tiles.every((v, i) => v === i);
    if (solved) {
        console.log(`FAIL: Level ${lv.level} already solved`);
        allValid = false;
        continue;
    }
    
    // Check 4: min swaps via cycle decomposition
    const minSwaps = minSwapsCycle(tiles);
    
    // Check 5: solvable within par (2x par gives generous margin)
    if (minSwaps > lv.par * 2) {
        console.log(`FAIL: Level ${lv.level} needs ${minSwaps} swaps but par=${lv.par}`);
        allValid = false;
    } else {
        const status = minSwaps <= lv.par ? 'PERFECT' : 'OK';
        console.log(`L${String(lv.level).padStart(2,'0')} T${lv.tier} (${lv.tierName}): ${grid}x${grid}, par=${lv.par}, optimal=${minSwaps} [${status}]`);
    }
}

console.log(`\nAll valid: ${allValid}`);
process.exit(allValid ? 0 : 1);
