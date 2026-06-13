// Level solvability solver for Maze Paint
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/maze-paint/index.html', 'utf8');

// Extract LEVELS array
const startMarker = 'const LEVELS = [';
const startIdx = html.indexOf(startMarker);
// Find the matching close bracket
let depth = 0;
let endIdx = startIdx + startMarker.length - 1;
for (let i = startIdx + startMarker.length - 1; i < html.length; i++) {
  if (html[i] === '[') depth++;
  if (html[i] === ']') depth--;
  if (depth === 0 && i > startIdx + startMarker.length) {
    endIdx = i;
    break;
  }
}
const levelsStr = html.substring(startIdx, endIdx + 2); // includes "const LEVELS = [...]"
const LEVELS = eval(levelsStr.split(' = ')[1]);

function solveLevel(level) {
  const grid = level.grid.map(r => r.slice());
  const rows = grid.length, cols = grid[0].length;
  let totalCells = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === 0) totalCells++;
  
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const [sr, sc] = level.start;
  
  function paintedKey(painted) {
    let parts = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (painted[r][c]) parts.push(r*cols+c);
    return parts.join(',');
  }
  
  const initPainted = Array(rows).fill(null).map(() => Array(cols).fill(false));
  initPainted[sr][sc] = true;
  
  const visited = new Set();
  const queue = [{r: sr, c: sc, painted: initPainted, moves: 0}];
  visited.add(sr + ',' + sc + ':' + paintedKey(initPainted));
  
  let maxIter = 200000;
  
  while (queue.length > 0) {
    if (visited.size > maxIter) return { solvable: 'timeout', states: visited.size };
    const cur = queue.shift();
    
    let paintedCount = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (cur.painted[r][c]) paintedCount++;
    
    if (paintedCount === totalCells) return { solvable: true, moves: cur.moves };
    
    for (const [dr, dc] of dirs) {
      let r = cur.r, c = cur.c;
      const newPainted = cur.painted.map(row => row.slice());
      let moved = false;
      while (true) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
        if (grid[nr][nc] === 1) break;
        r = nr; c = nc;
        newPainted[r][c] = true;
        moved = true;
      }
      if (!moved) continue;
      const key = r + ',' + c + ':' + paintedKey(newPainted);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({r, c, painted: newPainted, moves: cur.moves + 1});
      }
    }
  }
  return { solvable: false, states: visited.size };
}

console.log('Testing', LEVELS.length, 'levels...');
let solvable = 0, unsolvable = 0;
LEVELS.forEach((lv, i) => {
  const result = solveLevel(lv);
  const status = result.solvable === true ? '✅' : result.solvable === false ? '❌' : '⏳';
  if (result.solvable === true) solvable++;
  else unsolvable++;
  console.log(status + ' Level ' + (i+1) + ' "' + lv.name + '" (' + lv.grid.length + 'x' + lv.grid[0].length + ', ' + result.moves + ' moves): ' + (result.solvable === true ? 'SOLVABLE' : result.solvable === false ? 'UNSOLVABLE' : 'TIMEOUT'));
});
console.log('\nSolvable: ' + solvable + '/' + LEVELS.length + ', Failed: ' + unsolvable);
