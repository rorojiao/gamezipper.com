#!/usr/bin/env node
// Independent Kurodoko verifier — confirms all 30 levels have unique solutions
// AND the stored solution_grid satisfies all rules.
// This is a FRESH implementation (not the generator's solver) to catch rule-blindness bugs.
'use strict';
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('kurodoko/levels_final.json','utf8'));

function no2x2(grid, rows, cols) {
  for (let r = 0; r < rows-1; r++)
    for (let c = 0; c < cols-1; c++)
      if (grid[r][c]&&grid[r+1][c]&&grid[r][c+1]&&grid[r+1][c+1]) return false;
  return true;
}

function whiteConnected(grid, rows, cols) {
  let start = null;
  for (let r = 0; r < rows && !start; r++)
    for (let c = 0; c < cols && !start; c++) if (!grid[r][c]) start = [r,c];
  if (!start) return false;
  const seen = new Set();
  seen.add(start[0]*cols+start[1]);
  const stack = [start];
  let whiteCount = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!grid[r][c]) whiteCount++;
  while (stack.length) {
    const [r,c] = stack.pop();
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&!grid[nr][nc]&&!seen.has(nr*cols+nc)) {
        seen.add(nr*cols+nc); stack.push([nr,nc]);
      }
    }
  }
  return seen.size === whiteCount;
}

function verifySolutionRules(level) {
  // Verify the STORED solution satisfies all rules independently.
  const {rows, cols, row_hints, col_hints, solution_grid} = level;
  // 1. grid matches rows/cols
  if (solution_grid.length !== rows) return 'solution_grid rows mismatch';
  for (const row of solution_grid) if (row.length !== cols) return 'solution_grid cols mismatch';
  // 2. all values 0 or 1
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (solution_grid[r][c] !== 0 && solution_grid[r][c] !== 1) return `invalid cell value at ${r},${c}`;
  // 3. build boolean grid (1=black)
  const grid = solution_grid.map(row => row.map(v => v === 1));
  // 4. no 2x2 black
  if (!no2x2(grid, rows, cols)) return '2x2 black area found';
  // 5. white connected
  if (!whiteConnected(grid, rows, cols)) return 'white cells not connected';
  // 6. row hints match
  for (let r = 0; r < rows; r++) {
    let white = 0;
    for (let c = 0; c < cols; c++) if (!grid[r][c]) white++;
    if (white !== row_hints[r]) return `row ${r}: white=${white} != hint=${row_hints[r]}`;
  }
  // 7. col hints match
  for (let c = 0; c < cols; c++) {
    let white = 0;
    for (let r = 0; r < rows; r++) if (!grid[r][c]) white++;
    if (white !== col_hints[c]) return `col ${c}: white=${white} != hint=${col_hints[c]}`;
  }
  return null; // null = valid
}

// Count solutions (fresh CP solver)
const WHITE_DOM = 1, BLACK_DOM = 2, BOTH_DOM = 3;
function countSolutions(rows, cols, rowHints, colHints, limit) {
  const dom = new Uint8Array(rows*cols).fill(BOTH_DOM);
  let count = 0;
  function propagate() {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < rows; r++) {
        let kw=0, unk=[];
        for (let c = 0; c < cols; c++) { const d=dom[r*cols+c]; if(d===WHITE_DOM)kw++; else if(d===BOTH_DOM)unk.push(c); }
        if (kw > rowHints[r]) return false;
        if (kw === rowHints[r] && unk.length) { for(const c of unk){if(dom[r*cols+c]&BLACK_DOM){dom[r*cols+c]=BLACK_DOM;changed=true;}else return false;} }
        if (kw+unk.length === rowHints[r] && unk.length) { for(const c of unk){if(dom[r*cols+c]&WHITE_DOM){dom[r*cols+c]=WHITE_DOM;changed=true;}else return false;} }
        if (kw+unk.length < rowHints[r]) return false;
      }
      for (let c = 0; c < cols; c++) {
        let kw=0, unk=[];
        for (let r = 0; r < rows; r++) { const d=dom[r*cols+c]; if(d===WHITE_DOM)kw++; else if(d===BOTH_DOM)unk.push(r); }
        if (kw > colHints[c]) return false;
        if (kw === colHints[c] && unk.length) { for(const r of unk){if(dom[r*cols+c]&BLACK_DOM){dom[r*cols+c]=BLACK_DOM;changed=true;}else return false;} }
        if (kw+unk.length === colHints[c] && unk.length) { for(const r of unk){if(dom[r*cols+c]&WHITE_DOM){dom[r*cols+c]=WHITE_DOM;changed=true;}else return false;} }
        if (kw+unk.length < colHints[c]) return false;
      }
      for (let r = 0; r < rows-1; r++) for (let c = 0; c < cols-1; c++) {
        const ids = [r*cols+c, r*cols+c+1, (r+1)*cols+c, (r+1)*cols+c+1];
        let b=0, ui=-1;
        for (let i=0;i<4;i++){ if(dom[ids[i]]===BLACK_DOM)b++; else if(dom[ids[i]]===BOTH_DOM){if(ui>=0){ui=-2;break;}ui=i;} }
        if (b===3 && ui>=0) { if(dom[ids[ui]]&WHITE_DOM){dom[ids[ui]]=WHITE_DOM;changed=true;}else return false; }
      }
    }
    return true;
  }
  function isFull(){for(let i=0;i<dom.length;i++)if(dom[i]===BOTH_DOM)return false;return true;}
  function verify(){
    const grid=[];for(let r=0;r<rows;r++){const row=[];for(let c=0;c<cols;c++)row.push(dom[r*cols+c]===BLACK_DOM);grid.push(row);}
    for(let r=0;r<rows;r++){let w=0;for(let c=0;c<cols;c++)if(!grid[r][c])w++;if(w!==rowHints[r])return false;}
    for(let c=0;c<cols;c++){let w=0;for(let r=0;r<rows;r++)if(!grid[r][c])w++;if(w!==colHints[c])return false;}
    if(!no2x2(grid,rows,cols))return false;
    return whiteConnected(grid,rows,cols);
  }
  function search(){
    if (count>=limit) return;
    const saved=new Uint8Array(dom);
    if(!propagate()){dom.set(saved);return;}
    if(count>=limit){dom.set(saved);return;}
    if(isFull()){if(verify())count++;dom.set(saved);return;}
    let bi=-1,bs=Infinity;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      if(dom[r*cols+c]===BOTH_DOM){
        let rk=0;for(let cc=0;cc<cols;cc++)if(dom[r*cols+cc]!==BOTH_DOM)rk++;
        let ck=0;for(let rr=0;rr<rows;rr++)if(dom[rr*cols+c]!==BOTH_DOM)ck++;
        const sc=-(rk+ck);if(sc<bs){bs=sc;bi=r*cols+c;}
      }
    }
    if(bi===-1){dom.set(saved);return;}
    dom[bi]=WHITE_DOM;search();
    if(count>=limit){dom.set(saved);return;}
    dom[bi]=BLACK_DOM;search();
    dom.set(saved);
  }
  search();
  return count;
}

// Run verification
let allValid = true;
let allUnique = true;
for (let i = 0; i < levels.length; i++) {
  const lvl = levels[i];
  const ruleErr = verifySolutionRules(lvl);
  if (ruleErr) {
    console.log(`FAIL [${i}] ${lvl.id}: RULE VIOLATION: ${ruleErr}`);
    allValid = false;
    continue;
  }
  const n = countSolutions(lvl.rows, lvl.cols, lvl.row_hints, lvl.col_hints, 2);
  if (n !== 1) {
    console.log(`FAIL [${i}] ${lvl.id}: ${n} solutions (not unique)`);
    allUnique = false;
  } else {
    console.log(`OK   [${i}] ${lvl.id} (${lvl.rows}x${lvl.cols}): UNIQUE + VALID`);
  }
}
console.log('\n=== SUMMARY ===');
console.log(`Rules valid: ${allValid ? 'ALL PASS' : 'FAILURES'}`);
console.log(`Unique: ${allUnique ? 'ALL PASS' : 'FAILURES'}`);
console.log(allValid && allUnique ? '\n✅ ALL 30 LEVELS VERIFIED' : '\n❌ VERIFICATION FAILED');
process.exit(allValid && allUnique ? 0 : 1);
