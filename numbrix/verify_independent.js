#!/usr/bin/env node
// Independent Numbrix verifier (pure JS, re-solves each level from scratch).
// Verifies: (1) given solution is a valid orthogonal Hamiltonian path,
//           (2) all clue numbers match the solution,
//           (3) the puzzle has EXACTLY ONE solution under the clues.
//
// NOTE: uses a visited[] array (not a bitmask) because JS bitwise ops coerce
// to Int32 and overflow past 32 cells (5x5 works, 6x6+ breaks). Python's
// arbitrary-precision ints in gen.py are unaffected.
//
// Usage: node verify_independent.js [levels.json]

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'levels.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const levels = data.levels;
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

let allOk = true;
let t0 = Date.now();

for (const lv of levels) {
  const R = lv.rows, C = lv.cols, NCELLS = R*C;
  const sol = lv.solution;
  // 1. validate solution is a permutation 1..NCELLS
  const seen = new Array(NCELLS+1).fill(false);
  let permOk = true;
  for (let r=0;r<R;r++) for (let c=0;c<C;c++){
    const v = sol[r][c];
    if (v<1||v>NCELLS||seen[v]){permOk=false;}
    seen[v]=true;
  }
  // 2. consecutive numbers must be orthogonally adjacent
  const posOf = new Array(NCELLS+1);
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) posOf[sol[r][c]]=[r,c];
  let adjOk = true;
  for (let k=1;k<NCELLS;k++){
    const [r1,c1]=posOf[k], [r2,c2]=posOf[k+1];
    if (Math.abs(r1-r2)+Math.abs(c1-c2)!==1){adjOk=false;}
  }
  // 3. clues match solution
  let clueOk = true;
  const clueNumToCell = {};
  for (const [r,c,n] of lv.clues){
    if (sol[r][c]!==n) clueOk=false;
    clueNumToCell[n] = r*C+c;
  }
  // 4. count solutions <= 2 via backtracking (visited array, not bitmask)
  let count=0, nodes=0; const CAP=2, NODECAP=20_000_000;
  const visited = new Uint8Array(NCELLS);
  const start = clueNumToCell[1] !== undefined ? clueNumToCell[1] : -1;
  function rec(num, cell){
    if (count>=CAP || nodes>NODECAP) return;
    nodes++;
    if (num>NCELLS){count++; return;}
    if (clueNumToCell[num]!==undefined){
      const t=clueNumToCell[num];
      if (visited[t]) return;
      const r1=Math.floor(cell/C), c1=cell%C, r2=Math.floor(t/C), c2=t%C;
      if (Math.abs(r1-r2)+Math.abs(c1-c2)===1){ visited[t]=1; rec(num+1, t); visited[t]=0; }
      return;
    }
    const r=Math.floor(cell/C), c=cell%C;
    for (const [dr,dc] of DIRS){
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<R&&nc>=0&&nc<C){
        const nc2=nr*C+nc;
        if (!visited[nc2]){ visited[nc2]=1; rec(num+1, nc2); visited[nc2]=0; }
      }
    }
  }
  if (start>=0){ visited[start]=1; rec(2, start); visited[start]=0; }
  else { for (let cell=0;cell<NCELLS;cell++){ if(count>=CAP)break; visited[cell]=1; rec(2, cell); visited[cell]=0; } }
  const unique = count===1;
  const ok = permOk && adjOk && clueOk && unique;
  if (!ok) allOk=false;
  console.log(`L${String(lv.index).padStart(2,'0')} ${lv.tier.padEnd(9)} ${R}x${C} clues=${String(lv.clueCount).padStart(2)} sols=${count} nodes=${String(nodes).padStart(7)} ${ok?'✅':'❌'}`);
}
console.log(`\n${allOk?'✅ ALL '+levels.length+' LEVELS UNIQUE + VALID':'❌ FAILURES DETECTED'} (${levels.length} levels, ${Date.now()-t0}ms)`);
process.exit(allOk?0:1);
