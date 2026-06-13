// Guaranteed-solvable Maze Paint level generator
// Uses verified corridor/snake patterns only

const fs = require('fs');

// Pattern: Horizontal snake (boustrophedon)
// The ball moves across each row, connecting to the next row at alternating ends
function horizontalSnake(rows, cols) {
  // rows and cols include borders
  const g = Array(rows).fill(null).map(() => Array(cols).fill(0));
  // Border
  for (let c = 0; c < cols; c++) { g[0][c] = 1; g[rows-1][c] = 1; }
  for (let r = 0; r < rows; r++) { g[r][0] = 1; g[r][cols-1] = 1; }
  
  // Fill walls between every other row, leaving a gap
  // Row 1 is open, row 2 is wall (with gap), row 3 is open, etc.
  for (let r = 2; r < rows - 1; r += 2) {
    for (let c = 1; c < cols - 1; c++) {
      g[r][c] = 1;
    }
    // Gap at alternating ends
    const gapSide = (Math.floor(r/2) % 2 === 0) ? cols - 2 : 1;
    g[r][gapSide] = 0;
  }
  return { grid: g, start: [1, 1] };
}

// Pattern: Vertical snake
function verticalSnake(rows, cols) {
  const g = Array(rows).fill(null).map(() => Array(cols).fill(0));
  for (let c = 0; c < cols; c++) { g[0][c] = 1; g[rows-1][c] = 1; }
  for (let r = 0; r < rows; r++) { g[r][0] = 1; g[r][cols-1] = 1; }
  
  for (let c = 2; c < cols - 1; c += 2) {
    for (let r = 1; r < rows - 1; r++) {
      g[r][c] = 1;
    }
    const gapSide = (Math.floor(c/2) % 2 === 0) ? rows - 2 : 1;
    g[gapSide][c] = 0;
  }
  return { grid: g, start: [1, 1] };
}

// Pattern: Spiral corridor
function spiralCorridor(size) {
  const g = Array(size).fill(null).map(() => Array(size).fill(0));
  for (let c = 0; c < size; c++) { g[0][c] = 1; g[size-1][c] = 1; }
  for (let r = 0; r < size; r++) { g[r][0] = 1; g[r][size-1] = 1; }
  
  // Create spiral walls
  let layer = 1;
  while (layer < size / 2 - 0.5) {
    const s = layer; // inner start
    const e = size - 1 - layer; // inner end
    if (s >= e) break;
    
    // Add wall one cell inside the current layer
    const ws = layer + 1;
    const we = size - 2 - layer;
    
    if (ws < we) {
      // Top wall
      for (let c = ws; c <= we; c++) g[ws][c] = 1;
      // Right wall  
      for (let r = ws; r <= we; r++) g[r][we] = 1;
      // Bottom wall
      for (let c = ws; c <= we; c++) g[we][c] = 1;
      // Left wall
      for (let r = ws; r <= we; r++) g[r][ws] = 1;
      
      // Leave one gap per layer (rotate gap position)
      const gapPos = layer % 4;
      if (gapPos === 0) g[ws][Math.floor((ws + we) / 2)] = 0; // top gap
      else if (gapPos === 1) g[Math.floor((ws + we) / 2)][we] = 0; // right gap
      else if (gapPos === 2) g[we][Math.floor((ws + we) / 2)] = 0; // bottom gap
      else g[Math.floor((ws + we) / 2)][ws] = 0; // left gap
    }
    layer += 2;
  }
  return { grid: g, start: [1, 1] };
}

// Pattern: Snake with internal pillars (adds variety)
function snakeWithPillars(rows, cols) {
  const base = horizontalSnake(rows, cols);
  const g = base.grid;
  // Add some pillar walls in open rows (not affecting solvability since 
  // the ball slides around them - but actually pillars CAN break solvability
  // so we skip this pattern and just use plain snakes)
  return base;
}

// Solver to verify and get optimal moves
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
  
  let maxStates = 200000;
  
  while (queue.length > 0) {
    if (visited.size > maxStates) return { solvable: 'timeout', moves: 0 };
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
  return { solvable: false, moves: 0 };
}

// Generate 30 levels with increasing difficulty
const levels = [];
const configs = [
  // [type, rows, cols, name, tutorial]
  ['h', 7, 7, 'First Steps', 'Swipe to move! The ball slides until it hits a wall, painting cells as it goes.'],
  ['h', 7, 7, 'Getting Warmer', 'Paint every cell to complete the level! Try different directions.'],
  ['h', 9, 9, 'S-Swipe', 'Plan your path! Every move counts toward your star rating.'],
  ['v', 9, 9, 'Turning Point', 'Great! Now try a vertical pattern.'],
  ['h', 9, 9, 'The Wanderer', ''],
  ['h', 9, 11, 'Expanding', ''],
  ['v', 11, 9, 'Skyward', ''],
  ['h', 9, 9, 'Spiral Path', 'Follow the spiral to paint every cell!'],
  ['h', 11, 11, 'Double Helix', ''],
  ['v', 11, 11, 'Tower Climb', ''],
  ['h', 11, 11, 'Maze Runner', ''],
  ['h', 11, 11, 'Inward Spiral', ''],
  ['h', 11, 13, 'Wide World', ''],
  ['v', 13, 11, 'Deep Dive', ''],
  ['h', 11, 13, 'Stretch Out', ''],
  ['h', 11, 11, 'Double Spiral', ''],
  ['h', 13, 13, 'Grand Tour', ''],
  ['v', 13, 13, 'Ascension', ''],
  ['h', 13, 13, 'The Expedition', ''],
  ['h', 13, 13, 'Spiral Mastery', ''],
  ['h', 13, 13, 'Circuit Master', ''],
  ['v', 13, 13, 'Vertical Limit', ''],
  ['h', 13, 13, 'Path Finder', ''],
  ['h', 13, 13, 'Vortex', ''],
  ['h', 13, 13, 'Marathon', ''],
  ['v', 13, 13, 'Skywalker', ''],
  ['h', 13, 13, 'Endurance', ''],
  ['h', 13, 13, 'Galaxy', ''],
  ['h', 13, 13, 'Final Frontier', ''],
  ['h', 13, 13, 'Legendary', ''],
];

for (const [type, rows, cols, name, tutorial] of configs) {
  let lv;
  if (type === 'h') lv = horizontalSnake(rows, cols);
  else if (type === 'v') lv = verticalSnake(rows, cols);
  else if (type === 'h') lv = spiralCorridor(rows);
  
  lv.name = name;
  if (tutorial) lv.tutorial = tutorial;
  levels.push(lv);
}

// Verify and set par
console.log('Verifying ' + levels.length + ' levels...');
let allGood = true;
levels.forEach((lv, i) => {
  const result = solveLevel(lv);
  if (result.solvable === true) {
    lv.par = result.moves;
    console.log('✅ L' + (i+1) + ' "' + lv.name + '" (' + lv.grid.length + 'x' + lv.grid[0].length + '): ' + result.moves + ' moves');
  } else {
    allGood = false;
    console.log('❌ L' + (i+1) + ' "' + lv.name + '": ' + result.solvable);
  }
});

if (allGood) {
  // Output JS code for the levels
  let jsLevels = levels.map(lv => {
    const gridStr = lv.grid.map(row => '    [' + row.join(',') + ']').join(',\n');
    let extra = '';
    if (lv.tutorial) extra = ', tutorial: "' + lv.tutorial + '"';
    return '  { name: "' + lv.name + '", grid: [\n' + gridStr + '\n  ], start: [' + lv.start.join(',') + '], par: ' + lv.par + extra + ' }';
  }).join(',\n');
  
  fs.writeFileSync('/tmp/valid_levels.js', 'const LEVELS = [\n' + jsLevels + '\n];\n');
  console.log('\n✅ ALL ' + levels.length + ' LEVELS SOLVABLE!');
  console.log('Written to /tmp/valid_levels.js');
} else {
  console.log('\n❌ Some levels failed!');
  process.exit(1);
}
