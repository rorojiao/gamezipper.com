// In-engine BFS solver: uses EXACT game logic from index.html
// Verifies all 30 levels are solvable using the game's rotateDial logic
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/vortex-valve/index.html', 'utf8');
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('vortex-valve');

function mod(a, n) { return ((a % n) + n) % n; }

function solveBFS(lv) {
    const K = lv.K, N = lv.N;
    const offsets = lv.o.slice();
    const links = lv.l || [];
    
    // Build linkedMap (same as game)
    const linkedMap = {};
    links.forEach(l => {
        if (!linkedMap[l[0]]) linkedMap[l[0]] = [];
        linkedMap[l[0]].push({dst: l[1], ratio: l[2]});
    });
    
    const initial = offsets.slice();
    const target = new Array(K).fill(0);
    const ik = initial.join(','), tk = target.join(',');
    
    if (ik === tk) return {solvable: true, moves: 0, unique: true};
    
    const visited = new Set([ik]);
    const queue = [{state: initial.slice(), moves: 0}];
    let maxStates = 100000;
    let foundMoves = -1;
    let solutionCount = 0;
    
    while (queue.length > 0 && visited.size < maxStates) {
        const {state, moves} = queue.shift();
        
        // Try all dial rotations
        for (let dial = 0; dial < K; dial++) {
            for (const delta of [1, -1]) {
                // Exact game logic
                const newState = state.slice();
                newState[dial] = mod(newState[dial] + delta, N);
                if (linkedMap[dial]) {
                    linkedMap[dial].forEach(lk => {
                        newState[lk.dst] = mod(newState[lk.dst] + delta * lk.ratio, N);
                    });
                }
                const nk = newState.join(',');
                if (nk === tk) {
                    if (foundMoves < 0) foundMoves = moves + 1;
                    if (moves + 1 === foundMoves) solutionCount++;
                    if (solutionCount > 5) return {solvable: true, moves: foundMoves, unique: solutionCount === 1};
                    continue; // Don't revisit target
                }
                if (!visited.has(nk)) {
                    visited.add(nk);
                    queue.push({state: newState, moves: moves + 1});
                }
            }
        }
    }
    
    return {
        solvable: foundMoves >= 0,
        moves: foundMoves,
        unique: solutionCount === 1,
        states: visited.size
    };
}

console.log('Vortex Valve — In-Engine BFS Verification');
console.log('==========================================');
let allPass = true;
LEVELS.forEach((lv, i) => {
    const result = solveBFS(lv);
    const parMatch = result.moves === lv.p;
    const status = result.solvable && parMatch ? 'PASS' : 'FAIL';
    if (status === 'FAIL') allPass = false;
    console.log(`L${String(i+1).padStart(2,'0')} T${Math.floor(i/5)+1} K=${lv.K} N=${lv.N} ` +
        `links=${(lv.l||[]).length} par=${lv.p} bfs=${result.moves} ` +
        `${result.unique ? 'UNIQUE' : 'multi'} states=${result.states} ${status}`);
});
console.log('\n' + (allPass ? 'ALL 30/30 SOLVABLE, PAR VERIFIED' : 'SOME LEVELS FAILED'));
