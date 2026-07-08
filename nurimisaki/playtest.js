// Playtest simulator for Nurimisaki
// Simulates playing each level: paints the solution, checks win condition fires

const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function simulatePlay(level) {
  const size = level.size;
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));
  const clueMap = {};
  const solutionSet = new Set();
  
  level.clues.forEach(c => { clueMap[c.r + ',' + c.c] = c.v; });
  level.solution.forEach(s => { solutionSet.add(s[0] + ',' + s[1]); });
  
  // Simulate painting: paint all solution cells white
  for (const [r, c] of level.solution) {
    grid[r][c] = 1;
  }
  
  let moveCount = level.solution.length;
  
  // Simulate the engine's win check
  function getRayLength(r, c, dr, dc) {
    let len = 0;
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
      len++;
      nr += dr; nc += dc;
    }
    return len;
  }
  
  // Validate
  const violations = [];
  for (const key in clueMap) {
    const [r, c] = key.split(',').map(Number);
    const val = clueMap[key];
    if (grid[r][c] !== 1) { violations.push([r, c]); continue; }
    let found = false;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      if (getRayLength(r, c, dr, dc) === val) { found = true; break; }
    }
    if (!found) violations.push([r, c]);
  }
  
  // Connectivity
  const whiteCells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === 1) whiteCells.push([r, c]);
  
  const visited = new Set();
  if (whiteCells.length > 0) {
    const queue = [whiteCells[0]];
    while (queue.length) {
      const [r, c] = queue.shift();
      const k = r + ',' + c;
      if (visited.has(k)) continue;
      visited.add(k);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1)
          queue.push([nr, nc]);
      }
    }
  }
  
  // Solution match
  let allMatch = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = r + ',' + c;
      const isWhite = grid[r][c] === 1;
      const shouldWhite = solutionSet.has(key);
      if (isWhite !== shouldWhite && !(key in clueMap)) {
        allMatch = false;
      }
    }
  }
  
  const wins = violations.length === 0 && visited.size === whiteCells.length && allMatch;
  
  return {
    win: wins,
    moves: moveCount,
    whites: whiteCells.length,
    connected: visited.size === whiteCells.length,
    violations: violations.length,
    matched: allMatch
  };
}

let pass = 0, fail = 0;
levels.forEach((level, i) => {
  const result = simulatePlay(level);
  if (result.win) {
    console.log(`✅ L${i+1} ${level.tier}: WIN after ${result.moves} moves (${result.whites} whites, connected=${result.connected})`);
    pass++;
  } else {
    console.log(`❌ L${i+1} ${level.tier}: NO WIN (violations=${result.violations}, connected=${result.connected}, matched=${result.matched})`);
    fail++;
  }
});

console.log(`\n=== PLAYTEST RESULTS ===`);
console.log(`Wins: ${pass}/${levels.length}`);
console.log(`Losses: ${fail}/${levels.length}`);
process.exit(fail > 0 ? 1 : 0);
