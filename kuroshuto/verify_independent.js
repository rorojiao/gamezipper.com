// verify_independent.js — Independent Node.js verifier for Kuroshuto
// 1. Loads levels.json
// 2. Validates stored solution against rules
// 3. For each level: runs BFS solver to confirm unique solution (where tractable)
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function neighbors4(r, c, R, C) {
  const res = [];
  if (r > 0) res.push([r-1, c]);
  if (r < R-1) res.push([r+1, c]);
  if (c > 0) res.push([r, c-1]);
  if (c < C-1) res.push([r, c+1]);
  return res;
}

function cellsAtDistance(r, c, d, R, C) {
  const res = [];
  if (r-d >= 0) res.push([r-d, c]);
  if (r+d < R) res.push([r+d, c]);
  if (c-d >= 0) res.push([r, c-d]);
  if (c+d < C) res.push([r, c+d]);
  return res;
}

function isConnected(blackSet, R, C) {
  const white = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (!blackSet.has(r+','+c)) white.push([r,c]);
  if (white.length === 0) return true;
  const visited = new Set([white[0].join(',')]);
  const q = [white[0]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [nr, nc] of neighbors4(r, c, R, C)) {
      const k = nr+','+nc;
      if (!blackSet.has(k) && !visited.has(k)) { visited.add(k); q.push([nr,nc]); }
    }
  }
  return visited.size === white.length;
}

function validateSolution(level) {
  const { R, C, clues, solution } = level;
  const black = new Set(solution);
  // clue cells not black
  for (const k of Object.keys(clues)) if (black.has(k)) return false;
  // no adj black
  for (const s of black) {
    const [r, c] = s.split(',').map(Number);
    for (const [nr, nc] of neighbors4(r, c, R, C))
      if (black.has(nr+','+nc)) return false;
  }
  // clues satisfied
  for (const [k, d] of Object.entries(clues)) {
    const [r, c] = k.split(',').map(Number);
    const cands = cellsAtDistance(r, c, d, R, C);
    if (cands.filter(([br,bc]) => black.has(br+','+bc)).length !== 1) return false;
  }
  // connected
  if (!isConnected(black, R, C)) return false;
  return true;
}

function solve(clues, R, C, maxSolutions = 2, nodeLimit = 500000) {
  const clueList = Object.entries(clues).map(([k, d]) => {
    const [r, c] = k.split(',').map(Number);
    return { r, c, d };
  });
  const clueCells = new Set(Object.keys(clues));
  const free = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (!clueCells.has(r+','+c)) free.push([r, c]);
  const solutions = [];
  let nodes = 0;

  function bt(idx, black) {
    if (solutions.length >= maxSolutions) return;
    if (++nodes > nodeLimit) return;
    if (idx === free.length) {
      // verify
      for (const cl of clueList) {
        const cands = cellsAtDistance(cl.r, cl.c, cl.d, R, C);
        if (cands.filter(([br,bc]) => black.has(br+','+bc)).length !== 1) return;
      }
      if (!isConnected(black, R, C)) return;
      solutions.push(new Set(black));
      return;
    }
    const [r, c] = free[idx];
    // white
    bt(idx+1, black);
    // black (if no adj)
    const adj = neighbors4(r, c, R, C);
    if (!adj.some(([nr,nc]) => black.has(nr+','+nc))) {
      black.add(r+','+c);
      bt(idx+1, black);
      black.delete(r+','+c);
    }
  }
  bt(0, new Set());
  return { solutions, nodes };
}

let allValid = true;
for (const lvl of levels) {
  const valid = validateSolution(lvl);
  if (!valid) {
    console.log(`❌ L${lvl.level_num} (${lvl.R}x${lvl.C}): solution INVALID`);
    allValid = false;
    continue;
  }
  // Try uniqueness for smaller grids
  const total = lvl.R * lvl.C;
  if (total <= 49) {
    const { solutions, nodes } = solve(lvl.clues, lvl.R, lvl.C, 2, 500000);
    if (solutions.length === 1) {
      console.log(`✅ L${lvl.level_num} (${lvl.R}x${lvl.C}, ${Object.keys(lvl.clues).length} clues): UNIQUE (nodes=${nodes})`);
    } else if (solutions.length === 0) {
      console.log(`⚠️  L${lvl.level_num} (${lvl.R}x${lvl.C}): 0 solutions (bug?)`);
    } else {
      console.log(`⚠️  L${lvl.level_num} (${lvl.R}x${lvl.C}): ${solutions.length}+ solutions`);
    }
  } else {
    console.log(`✅ L${lvl.level_num} (${lvl.R}x${lvl.C}, ${Object.keys(lvl.clues).length} clues): valid (solver skip)`);
  }
}
console.log(`\n${allValid ? '✅ All solutions valid' : '❌ Some invalid'}`);
