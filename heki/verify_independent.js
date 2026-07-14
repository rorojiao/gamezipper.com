// verify_independent.js — Method 2: Independent Node.js solver for Heki
// Loads levels.json, independently verifies each level's solution satisfies all Heki rules.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function verifySolution(level) {
  const R = level.R, C = level.C;
  const clues = level.clues;
  const borders = new Set(level.solution_borders);
  // Union-Find
  const parent = {};
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) parent[r+','+c] = r+','+c;
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function union(a,b) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (r+1 < R && !borders.has('h_'+r+'_'+c)) union(r+','+c, (r+1)+','+c);
      if (c+1 < C && !borders.has('v_'+r+'_'+c)) union(r+','+c, r+','+(c+1));
    }
  }
  // group cells by region
  const regions = {};
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const root = find(r+','+c);
      if (!regions[root]) regions[root] = [];
      regions[root].push([r,c]);
    }
  }
  // Rule 1: every region has exactly 6 cells
  for (const root in regions) {
    if (regions[root].length !== 6) {
      return { ok: false, msg: `region at ${regions[root][0]} has size ${regions[root].length} != 6` };
    }
  }
  // Rule 2 + 3: every region has exactly 2 clues, each clue matches in-region orth-neighbour count
  const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const root in regions) {
    const cells = regions[root];
    const cellsSet = new Set(cells.map(c => c[0]+','+c[1]));
    let clueCount = 0;
    for (const [r,c] of cells) {
      const k = r+','+c;
      if (clues[k] !== undefined) {
        clueCount++;
        let ncnt = 0;
        for (const [dr,dc] of DIRS) {
          if (cellsSet.has((r+dr)+','+(c+dc))) ncnt++;
        }
        if (ncnt !== clues[k]) {
          return { ok: false, msg: `clue at (${r},${c}) = ${clues[k]} but in-region neighbours = ${ncnt}` };
        }
      }
    }
    if (clueCount !== 2) {
      return { ok: false, msg: `region at ${cells[0]} has ${clueCount} clues != 2` };
    }
  }
  return { ok: true };
}

let pass = 0, fail = 0;
for (let i = 0; i < levels.length; i++) {
  const res = verifySolution(levels[i]);
  if (res.ok) { pass++; console.log(`L${i+1} ${levels[i].tier} ${levels[i].R}x${levels[i].C}: PASS`); }
  else { fail++; console.log(`L${i+1} ${levels[i].tier} ${levels[i].R}x${levels[i].C}: FAIL — ${res.msg}`); }
}
console.log(`\n=== RESULT: ${pass}/${levels.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
