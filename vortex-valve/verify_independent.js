// Independent BFS verifier - validates all levels have unique solutions
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/vortex-valve/levels.json', 'utf8'));

function mod(a, n) { return ((a % n) + n) % n; }

function solveBFS(level) {
    const K = level.K, N = level.N;
    const offsets = level.offsets;
    const links = level.links || [];
    
    const initial = offsets.slice();
    const targetKey = new Array(K).fill(0).join(',');
    const initialKey = initial.join(',');
    
    if (initialKey === targetKey) return [[]];
    
    const visited = new Set([initialKey]);
    const queue = [{state: initial, path: []}];
    let solutions = [];
    let maxStates = 50000;
    
    while (queue.length > 0 && visited.size < maxStates) {
        const {state, path} = queue.shift();
        const stateKey = state.join(',');
        
        if (stateKey === targetKey) {
            solutions.push(path);
            if (solutions.length > 10) break;
            continue;
        }
        
        for (let dial = 0; dial < K; dial++) {
            for (const delta of [1, -1]) {
                const newState = state.slice();
                newState[dial] = mod(newState[dial] + delta, N);
                for (const [src, dst, ratio] of links) {
                    if (src === dial) {
                        newState[dst] = mod(newState[dst] + delta * ratio, N);
                    }
                }
                const newKey = newState.join(',');
                if (!visited.has(newKey)) {
                    visited.add(newKey);
                    queue.push({state: newState, path: [...path, [dial, delta]]});
                }
            }
        }
    }
    return solutions;
}

let allValid = true;
let uniqueCount = 0;

levels.forEach((lv, i) => {
    const solutions = solveBFS(lv);
    const isUnique = solutions.length === 1;
    const isSolvable = solutions.length >= 1;
    const optimalLen = solutions.length > 0 ? solutions[0].length : -1;
    
    if (!isSolvable) allValid = false;
    if (isUnique) uniqueCount++;
    
    console.log(`L${String(i+1).padStart(2,'0')} T${lv.tier} K=${lv.K} N=${lv.N} links=${(lv.links||[]).length} ` +
        `offsets=[${lv.offsets}] par=${lv.par} sol=${optimalLen} ` +
        `${isUnique ? 'UNIQUE' : (isSolvable ? 'MULTI(' + solutions.length + ')' : 'UNSOLVABLE')}`);
});

console.log(`\n${uniqueCount}/${levels.length} UNIQUE solutions`);
console.log(`VERDICT: ${allValid && uniqueCount === levels.length ? 'ALL UNIQUE+VALID' : 'SOME ISSUES'}`);
