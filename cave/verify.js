// Independent verifier for cave/levels.json
// Validates: (1) clue numbers match stored solution visibility count
//            (2) white region is connected
//            (3) black region touches grid edge (no enclosed black)
const fs = require('fs');

function neighbors4(r, c, rows, cols){
  const out = [];
  for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const nr=r+dr, nc=c+dc;
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols) out.push([nr,nc]);
  }
  return out;
}
function isConnected(cells, rows, cols){
  if(cells.length === 0) return true;
  const set = new Set(cells.map(c=>c[0]+','+c[1]));
  const start = cells[0];
  const seen = new Set([start[0]+','+start[1]]);
  const q = [start];
  while(q.length){
    const [r,c] = q.shift();
    for(const [nr,nc] of neighbors4(r,c,rows,cols)){
      const k = nr+','+nc;
      if(set.has(k) && !seen.has(k)){ seen.add(k); q.push([nr,nc]); }
    }
  }
  return seen.size === cells.length;
}
function blackTouchesEdge(whiteSet, rows, cols){
  const allCells = [];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) allCells.push([r,c]);
  const black = allCells.filter(([r,c])=>!whiteSet.has(r+','+c));
  if(black.length === 0) return true;
  const blackSet = new Set(black.map(c=>c[0]+','+c[1]));
  const edge = black.filter(([r,c])=>r===0||c===0||r===rows-1||c===cols-1);
  if(edge.length === 0) return false;
  const seen = new Set(edge.map(c=>c[0]+','+c[1]));
  const q = [...edge];
  while(q.length){
    const [r,c] = q.shift();
    for(const [nr,nc] of neighbors4(r,c,rows,cols)){
      const k = nr+','+nc;
      if(blackSet.has(k) && !seen.has(k)){ seen.add(k); q.push([nr,nc]); }
    }
  }
  return seen.size === black.length;
}
function visibility(whiteSet, rows, cols, cell){
  const [r,c] = cell;
  if(!whiteSet.has(r+','+c)) return 0;
  let count = 1;
  for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
    let nr=r+dr, nc=c+dc;
    while(nr>=0&&nr<rows&&nc>=0&&nc<cols && whiteSet.has(nr+','+nc)){
      count++; nr+=dr; nc+=dc;
    }
  }
  return count;
}

const data = JSON.parse(fs.readFileSync('cave/levels.json','utf8'));
let pass=0, fail=0;
for(const L of data.levels){
  const errs = [];
  const whiteSet = new Set(L.white.map(c=>c[0]+','+c[1]));
  // 1. white connected
  if(!isConnected(L.white, L.rows, L.cols)) errs.push('white not connected');
  // 2. black touches edge
  if(!blackTouchesEdge(whiteSet, L.rows, L.cols)) errs.push('black not edge-connected');
  // 3. clue numbers correct
  for(const [k, v] of Object.entries(L.clues)){
    const [r,c] = k.split(',').map(Number);
    const actual = visibility(whiteSet, L.rows, L.cols, [r,c]);
    if(actual !== v) errs.push(`clue ${k}=${v} but actual=${actual}`);
  }
  // 4. all clue cells are white
  for(const k of Object.keys(L.clues)){
    if(!whiteSet.has(k)) errs.push(`clue cell ${k} is not white`);
  }
  if(errs.length === 0){ pass++; }
  else { fail++; console.log(`  ✗ L${L.id} ${L.tier}: ${errs.length} errors: ${errs.slice(0,3).join('; ')}`); }
}
console.log(`\nResult: ${pass}/${data.count} VALID, ${fail} failed`);
process.exit(fail===0 ? 0 : 1);
