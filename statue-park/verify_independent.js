// verify_independent.js — Independent BFS solver for Statue Park
// Re-implements the solver from scratch to cross-check gen_levels.py
const fs = require('fs');

const BASE = {
    I: [[0,0],[0,1],[0,2],[0,3]],
    O: [[0,0],[0,1],[1,0],[1,1]],
    T: [[0,0],[0,1],[0,2],[1,1]],
    L: [[0,0],[1,0],[2,0],[2,1]],
    S: [[0,1],[0,2],[1,0],[1,1]]
};

function normalize(cells) {
    const mr = Math.min(...cells.map(c => c[0]));
    const mc = Math.min(...cells.map(c => c[1]));
    return cells.map(c => [c[0]-mr, c[1]-mc]).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
}
function key(cells) {
    return normalize(cells).map(c => c.join(',')).join(';');
}
function rotate(cells) { return cells.map(c => [c[1], -c[0]]); }
function flip(cells) { return cells.map(c => [c[0], -c[1]]); }
function getAllOrientations(baseCells) {
    const seen = {}; const out = [];
    let cur = baseCells.slice();
    for (let r = 0; r < 4; r++) {
        const k = key(cur);
        if (!seen[k]) { seen[k] = true; out.push(normalize(cur)); }
        cur = rotate(cur);
    }
    cur = flip(baseCells);
    for (let r = 0; r < 4; r++) {
        const k = key(cur);
        if (!seen[k]) { seen[k] = true; out.push(normalize(cur)); }
        cur = rotate(cur);
    }
    return out;
}
const ORIENTATIONS = {};
Object.keys(BASE).forEach(name => { ORIENTATIONS[name] = getAllOrientations(BASE[name]); });

function isConnected(occupied, R, C) {
    // occupied is a Set of "r,c" strings
    const total = R * C;
    const occupiedCount = occupied.size;
    if (occupiedCount === total) return true;
    // find first empty cell
    let start = null;
    for (let r=0;r<R;r++)for(let c=0;c<C;c++){
        if(!occupied.has(r+','+c)){start=[r,c];break;}
    }
    if(!start) return true;
    const visited = new Set();
    const stack = [start];
    while (stack.length) {
        const [r,c] = stack.pop();
        const k=r+','+c;
        if (visited.has(k)) continue;
        if (occupied.has(k)) continue;
        visited.add(k);
        for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr=r+dr,nc=c+dc;
            if(nr>=0&&nr<R&&nc>=0&&nc<C)stack.push([nr,nc]);
        }
    }
    return visited.size + occupiedCount === total;
}

function solve(R, C, names, blackSet, whiteSet, limit = 2) {
    let solutions = 0;
    // Precompute candidates per shape: array of [Set cells, [r,c]...]
    const candidates = {};
    for (const name of names) {
        const list = [];
        for (const orient of ORIENTATIONS[name]) {
            const maxR = Math.max(...orient.map(c => c[0]));
            const maxC = Math.max(...orient.map(c => c[1]));
            for (let sr = 0; sr <= R - 1 - maxR; sr++) {
                for (let sc = 0; sc <= C - 1 - maxC; sc++) {
                    const cells = orient.map(c => [sr + c[0], sc + c[1]]);
                    let ok = true;
                    for (const [r,c] of cells) {
                        if (whiteSet.has(r+','+c)) { ok = false; break; }
                    }
                    if (ok) list.push(cells);
                }
            }
        }
        candidates[name] = list;
    }
    const order = names.map((n, i) => i).sort((a, b) => candidates[names[a]].length - candidates[names[b]].length);

    function adj(cells) {
        const s = new Set(cells.map(c=>c.join(',')));
        const out = new Set();
        for (const [r,c] of cells) {
            for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr=r+dr,nc=c+dc;
                if (nr>=0&&nr<R&&nc>=0&&nc<C) {
                    const k=nr+','+nc;
                    if (!s.has(k)) out.add(k);
                }
            }
        }
        return out;
    }

    function recurse(idx, occupied, blocked, coveredBlack) {
        if (solutions >= limit) return;
        if (idx === names.length) {
            // check all black cells covered
            for (const k of blackSet) { if (!occupied.has(k)) return; }
            if (isConnected(occupied, R, C)) solutions++;
            return;
        }
        const name = names[order[idx]];
        for (const cells of candidates[name]) {
            let bad = false;
            const cellSet = new Set();
            for (const [r,c] of cells) {
                const k=r+','+c;
                if (occupied.has(k) || blocked.has(k)) { bad = true; break; }
                cellSet.add(k);
            }
            if (bad) continue;
            const newOcc = new Set(occupied);
            cellSet.forEach(k=>newOcc.add(k));
            const newBlk = new Set(blocked);
            adj(cells).forEach(k=>newBlk.add(k));
            const newCov = new Set();
            // coveredBlack unused in solver logic, just track for completeness
            recurse(idx+1, newOcc, newBlk, null);
        }
    }
    recurse(0, new Set(), new Set(), null);
    return solutions;
}

const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/statue-park/levels.json', 'utf8'));
let allValid = true;
for (const lv of levels) {
    const R = lv.R, C = lv.C;
    const blackSet = new Set(lv.black.map(([r,c])=>r+','+c));
    const whiteSet = new Set(lv.white.map(([r,c])=>r+','+c));
    const count = solve(R, C, lv.shapes, blackSet, whiteSet, 2);
    const ok = count === 1;
    if (!ok) allValid = false;
    console.log('L'+lv.id+' '+lv.tier+' '+R+'x'+C+': '+count+' sol '+(ok?'OK':'FAIL'));
}
console.log(allValid ? '\nALL 30 LEVELS VERIFIED UNIQUE' : '\nSOME FAILED');
process.exit(allValid?0:1);
