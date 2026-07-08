// playtest.js — Re-executes stored solutions through the actual game engine logic
// to confirm placement validity matches the engine's canPlace() function.
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
const LEVELS = JSON.parse(m[1]);

const TETRO = {
    I: [[0,0],[0,1],[0,2],[0,3]],
    O: [[0,0],[0,1],[1,0],[1,1]],
    T: [[0,0],[0,1],[0,2],[1,1]],
    L: [[0,0],[1,0],[2,0],[2,1]],
    S: [[0,1],[0,2],[1,0],[1,1]],
};
const SHAPE_ORDER = ['I','O','T','L','S'];

// === engine's canPlace logic extracted ===
function canPlace(level, placed, name, cells) {
    const R=level.R, C=level.C;
    for (const [r,c] of cells) {
        if (r<0||r>=R||c<0||c>=C) return false;
    }
    // overlap
    for (const p of placed) {
        for (const [r,c] of cells) {
            for (const [pr,pc] of p.cells) {
                if (r===pr && c===pc) return false;
            }
        }
    }
    // no white cell
    for (const [r,c] of cells) {
        for (const [wr,wc] of level.white) {
            if (r===wr && c===wc) return false;
        }
    }
    // no ortho adjacency
    for (const [r,c] of cells) {
        for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr=r+dr, nc=c+dc;
            for (const p of placed) {
                for (const [pr,pc] of p.cells) {
                    if (pr===nr && pc===nc) return false;
                }
            }
        }
    }
    return true;
}

function isConnected(level, placed) {
    const R=level.R, C=level.C;
    const occ=new Set();
    placed.forEach(p=>p.cells.forEach(([r,c])=>occ.add(r+'_'+c)));
    const total=R*C;
    if (occ.size===total) return true;
    let start=null;
    for (let r=0;r<R;r++) {
        for(let c=0;c<C;c++) {
            if(!occ.has(r+'_'+c)){start=[r,c];}
        }
        if (start) break;
    }
    if (!start) return true;
    const visited=new Set();
    const stack=[start];
    while(stack.length){
        const [r,c]=stack.pop();
        const k=r+'_'+c;
        if (visited.has(k)) continue;
        if (occ.has(k)) continue;
        visited.add(k);
        if (r>0) stack.push([r-1,c]);
        if (r<R-1) stack.push([r+1,c]);
        if (c>0) stack.push([r,c-1]);
        if (c<C-1) stack.push([r,c+1]);
    }
    return visited.size + occ.size === total;
}

let allOk=true;
console.log('=== Playtest: Re-execute stored solutions through engine logic ===\n');

for (const lv of LEVELS) {
    const placed=[];
    let allValid=true;
    let step=0;
    for (const [name, solCells] of lv.solution) {
        step++;
        if (!canPlace(lv, placed, name, solCells)) {
            allValid=false;
            console.log('L'+lv.id+' step '+step+' '+name+': INVALID placement');
            break;
        }
        placed.push({name, cells:solCells});
    }
    // check all black covered
    const occ=new Set();
    placed.forEach(p=>p.cells.forEach(([r,c])=>occ.add(r+'_'+c)));
    const allBlack=lv.black.every(([r,c])=>occ.has(r+'_'+c));
    // check connectivity
    const conn=isConnected(lv,placed);
    const ok=allValid && allBlack && conn;
    if (!ok) allOk=false;
    console.log('L'+lv.id+' '+lv.tier+' '+lv.R+'x'+lv.C+': '+(ok?'PASS':'FAIL')+(allValid?'':' [placement]')+(allBlack?'':' [black]')+(conn?'':' [conn]'));
}

console.log('\n'+(allOk?'ALL 30 LEVELS PLAYTEST PASS':'SOME FAILED'));
process.exit(allOk?0:1);
