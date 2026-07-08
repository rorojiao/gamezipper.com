// Independent Node.js BFS verifier for Nurimisaki levels
// Method 2: Standalone BFS — does NOT use the game engine
// Reads levels.json and verifies each level:
//   1. Solution matches clue constraints (ray visibility)
//   2. All white cells are connected
//   3. Clue cells are white

const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function getRayLength(grid, r, c, dr, dc, size) {
  let len = 0;
  let nr = r + dr, nc = c + dc;
  while (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
    len++;
    nr += dr; nc += dc;
  }
  return len;
}

function buildGrid(level) {
  const size = level.size;
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));
  const solSet = new Set(level.solution.map(s => s[0] + ',' + s[1]));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solSet.has(r + ',' + c)) grid[r][c] = 1;
    }
  }
  return grid;
}

function verifyLevel(level) {
  const size = level.size;
  const grid = buildGrid(level);
  const errors = [];
  
  // Check 1: Clue cells must be white
  for (const clue of level.clues) {
    if (grid[clue.r][clue.c] !== 1) {
      errors.push(`Clue at (${clue.r},${clue.c})=${clue.v} is not white in solution`);
    }
  }
  
  // Check 2: Each clue must have exactly val consecutive whites in at least one direction
  for (const clue of level.clues) {
    const rays = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const len = getRayLength(grid, clue.r, clue.c, dr, dc, size);
      if (len > 0) rays.push(len);
    }
    const hasValid = rays.some(len => len === clue.v);
    if (!hasValid) {
      errors.push(`Clue (${clue.r},${clue.c})=${clue.v}: no direction has exactly ${clue.v} whites (rays: [${rays.join(',')}])`);
    }
  }
  
  // Check 3: All white cells connected (BFS)
  const whiteCells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === 1) whiteCells.push([r, c]);
  
  if (whiteCells.length === 0) {
    errors.push('No white cells in solution');
  } else {
    const visited = new Set();
    const queue = [whiteCells[0]];
    while (queue.length) {
      const [r, c] = queue.shift();
      const k = r + ',' + c;
      if (visited.has(k)) continue;
      visited.add(k);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
          queue.push([nr, nc]);
        }
      }
    }
    if (visited.size !== whiteCells.length) {
      errors.push(`White cells not connected: ${visited.size}/${whiteCells.length} reachable`);
    }
  }
  
  return errors;
}

// Run verification
let passCount = 0;
let failCount = 0;

levels.forEach((level, i) => {
  const errors = verifyLevel(level);
  if (errors.length === 0) {
    console.log(`✅ L${i+1} ${level.tier} ${level.size}×${level.size}: VALID`);
    passCount++;
  } else {
    console.log(`❌ L${i+1} ${level.tier}: FAIL`);
    errors.forEach(e => console.log(`   ${e}`));
    failCount++;
  }
});

console.log(`\n=== RESULTS ===`);
console.log(`Passed: ${passCount}/${levels.length}`);
console.log(`Failed: ${failCount}/${levels.length}`);
process.exit(failCount > 0 ? 1 : 0);
