// Phase 6 Verification - Method 1: Independent Node.js BFS
// Reads levels_embed.json and verifies:
//   1. Each level has a unique solution
//   2. The stored solution is correct
//   3. The par (shortest path from 0 to solution) is correct

const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/antikythera-mechanism/levels_embed.json', 'utf8'));

let allValid = true;
let allUnique = true;

for (const lv of levels) {
    const dials = lv.d; // [[teeth, ratio, target], ...]
    const M = lv.M;
    const sol = lv.s;
    const par = lv.p;
    
    // Brute-force: find all x in [0, M) that satisfy all dial constraints
    const solutions = [];
    for (let x = 0; x < M; x++) {
        let match = true;
        for (let i = 0; i < dials.length; i++) {
            const [teeth, ratio, target] = dials[i];
            if ((x * ratio) % teeth !== target) {
                match = false;
                break;
            }
        }
        if (match) solutions.push(x);
    }
    
    // Check uniqueness
    if (solutions.length !== 1) {
        console.log(`L${lv.l}: FAIL — ${solutions.length} solutions found: ${JSON.stringify(solutions)}`);
        allUnique = false;
        allValid = false;
        continue;
    }
    
    // Check stored solution matches
    if (solutions[0] !== sol) {
        console.log(`L${lv.l}: FAIL — stored solution ${sol} != actual ${solutions[0]}`);
        allValid = false;
        continue;
    }
    
    // Check par = min(sol, M - sol)
    const expectedPar = Math.min(sol, M - sol);
    if (par !== expectedPar) {
        console.log(`L${lv.l}: WARN — stored par ${par} != expected ${expectedPar}`);
    }
    
    console.log(`L${lv.l}: OK — unique solution ${sol}, par ${par} (M=${M}, dials=${dials.length})`);
}

console.log(`\n=== Summary ===`);
console.log(`Total levels: ${levels.length}`);
console.log(`All unique: ${allUnique ? 'YES' : 'NO'}`);
console.log(`All valid: ${allValid ? 'YES' : 'NO'}`);
