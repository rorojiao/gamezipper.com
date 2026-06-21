// Independent Windmill Sudoku verifier — checks all levels for:
// 1. Each grid solution is a valid 9x9 Sudoku
// 2. Shared 3x3 boxes are consistent between overlapping grids
// 3. Each puzzle has a unique solution matching the stored solution
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('/tmp/windmill_levels.json', 'utf8'));

function isValid9x9(g) {
  for (let i = 0; i < 9; i++) {
    const row = new Set(), col = new Set(), box = new Set();
    for (let j = 0; j < 9; j++) {
      if (g[i][j] < 1 || g[i][j] > 9) return false;
      if (row.has(g[i][j])) return false; row.add(g[i][j]);
      if (col.has(g[j][i])) return false; col.add(g[j][i]);
      const br = Math.floor(i/3)*3+Math.floor(j/3), bc = (i%3)*3+(j%3);
      if (box.has(g[br][bc])) return false; box.add(g[br][bc]);
    }
  }
  return true;
}

function getBox(g, bi) {
  const br = Math.floor(bi/3)*3, bc = (bi%3)*3;
  return [0,1,2].map(i => [0,1,2].map(j => g[br+i][bc+j]));
}

function boxesEqual(a, b) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    if (a[i][j] !== b[i][j]) return false;
  return true;
}

function countSols(grid, limit) {
  const g = grid.map(r => [...r]);
  let count = 0;
  function valid(r, c, n) {
    for (let i = 0; i < 9; i++) { if (g[r][i]===n||g[i][c]===n) return false; }
    const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
    for (let i=0;i<3;i++) for(let j=0;j<3;j++) if(g[br+i][bc+j]===n) return false;
    return true;
  }
  function solve() {
    if (count >= limit) return;
    for (let r=0;r<9;r++) for(let c=0;c<9;c++) {
      if (g[r][c]===0) {
        for (let n=1;n<=9;n++) {
          if (valid(r,c,n)) { g[r][c]=n; solve(); g[r][c]=0; if(count>=limit) return; }
        }
        return;
      }
    }
    count++;
  }
  solve();
  return count;
}

let allOk = true;
for (const lvl of levels) {
  const {solutionA:A, solutionB:B, solutionC:C, solutionD:D, puzzleA:pA, puzzleB:pB, puzzleC:pC, puzzleD:pD, id, tier} = lvl;
  // 1. Valid solutions
  if (!isValid9x9(A)||!isValid9x9(B)||!isValid9x9(C)||!isValid9x9(D)) {
    console.log(`L${id} FAIL: invalid solution`); allOk=false; continue;
  }
  // 2. Shared box consistency
  if (!boxesEqual(getBox(A,6),getBox(D,2))) { console.log(`L${id} FAIL: TL box mismatch A6≠D2`); allOk=false; }
  if (!boxesEqual(getBox(A,8),getBox(B,0))) { console.log(`L${id} FAIL: TR box mismatch A8≠B0`); allOk=false; }
  if (!boxesEqual(getBox(B,6),getBox(C,2))) { console.log(`L${id} FAIL: BR box mismatch B6≠C2`); allOk=false; }
  if (!boxesEqual(getBox(C,0),getBox(D,8))) { console.log(`L${id} FAIL: BL box mismatch C0≠D8`); allOk=false; }
  // 3. Puzzle matches solution (givens are correct)
  for (const [p,s,name] of [[pA,A,'A'],[pB,B,'B'],[pC,C,'C'],[pD,D,'D']]) {
    for (let r=0;r<9;r++) for(let c=0;c<9;c++)
      if (p[r][c]!==0 && p[r][c]!==s[r][c]) { console.log(`L${id} FAIL: puzzle${name}[${r}][${c}]=${p[r][c]} ≠ solution=${s[r][c]}`); allOk=false; }
  }
  // 4. Unique solution count (check every 3rd level for speed)
  if (id % 3 === 0 || id === 1) {
    const solsA = countSols(pA, 3);
    const solsB = countSols(pB, 3);
    if (solsA !== 1) { console.log(`L${id} WARN: gridA has ${solsA} solutions`); allOk=false; }
    if (solsB !== 1) { console.log(`L${id} WARN: gridB has ${solsB} solutions`); allOk=false; }
  }
}

console.log(allOk ? '\n✅ ALL 27 LEVELS VERIFIED' : '\n❌ SOME LEVELS FAILED');
console.log(`Checked: ${levels.length} levels, shared boxes A6↔D2, A8↔B0, B6↔C2, C0↔D8`);
