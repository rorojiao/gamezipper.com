#!/usr/bin/env node
// Meowdoku Level Generator v2
// Generates 30 levels with verified unique solutions
// Strategy: generate a valid cat placement first, then build regions around it

// === Seeded PRNG (mulberry32) ===
function createRNG(seed) {
  let s = seed | 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// === Generate valid cat placement (one per row/col, no adjacency) ===
function generatePlacement(size, rng) {
  const usedCols = new Set();
  const cols = [];

  function bt(row) {
    if (row === size) return true;
    const order = shuffle([...Array(size).keys()], rng);
    for (const col of order) {
      if (usedCols.has(col)) continue;
      // Check adjacency with ALL previously placed cats
      let adj = false;
      for (let pr = 0; pr < row; pr++) {
        if (Math.abs(row - pr) <= 1 && Math.abs(col - cols[pr]) <= 1) {
          adj = true;
          break;
        }
      }
      if (adj) continue;
      usedCols.add(col);
      cols.push(col);
      if (bt(row + 1)) return true;
      cols.pop();
      usedCols.delete(col);
    }
    return false;
  }

  if (bt(0)) {
    return cols.map((c, r) => [r, c]);
  }
  return null;
}

// === Build regions around a known solution ===
function buildRegions(size, solution, rng) {
  const grid = Array.from({ length: size }, () => Array(size).fill(-1));
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Place seeds at solution positions
  for (let i = 0; i < solution.length; i++) {
    grid[solution[i][0]][solution[i][1]] = i;
  }

  // Initialize frontiers
  const frontiers = Array.from({ length: size }, () => []);

  function addFrontier(r, c, region) {
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
        frontiers[region].push([nr, nc]);
      }
    }
  }

  for (let i = 0; i < size; i++) {
    addFrontier(solution[i][0], solution[i][1], i);
  }

  let assigned = size;
  const total = size * size;
  let iterations = 0;

  while (assigned < total && iterations < total * 100) {
    iterations++;
    // Pick a random region with available frontier
    const available = [];
    for (let i = 0; i < size; i++) {
      if (frontiers[i].length > 0) available.push(i);
    }
    if (available.length === 0) break;

    const region = available[Math.floor(rng() * available.length)];
    const fi = Math.floor(rng() * frontiers[region].length);
    const [r, c] = frontiers[region][fi];
    frontiers[region].splice(fi, 1);

    if (grid[r][c] !== -1) continue;

    grid[r][c] = region;
    assigned++;
    addFrontier(r, c, region);
  }

  if (assigned < total) return null;

  // Verify all regions present
  const regionSet = new Set();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      regionSet.add(grid[r][c]);

  return regionSet.size === size ? grid : null;
}

// === Solver: count solutions (up to maxCount) ===
function countSolutions(size, regions, maxCount = 2) {
  const usedCols = new Set();
  const usedRegions = new Set();
  const placed = [];
  let count = 0;

  function bt(row) {
    if (count >= maxCount) return;
    if (row === size) { count++; return; }
    for (let col = 0; col < size; col++) {
      if (usedCols.has(col)) continue;
      const reg = regions[row][col];
      if (usedRegions.has(reg)) continue;
      let adj = false;
      for (const p of placed) {
        if (Math.abs(row - p[0]) <= 1 && Math.abs(col - p[1]) <= 1) {
          adj = true; break;
        }
      }
      if (adj) continue;
      usedCols.add(col);
      usedRegions.add(reg);
      placed.push([row, col]);
      bt(row + 1);
      placed.pop();
      usedRegions.delete(reg);
      usedCols.delete(col);
      if (count >= maxCount) return;
    }
  }

  bt(0);
  return count;
}

// === Level Definitions ===
const LEVEL_DEFS = [
  { id: 1, name: "First Steps", difficulty: "easy", gridSize: 5, parTime: 60 },
  { id: 2, name: "Getting Started", difficulty: "easy", gridSize: 5, parTime: 55 },
  { id: 3, name: "Paws & Think", difficulty: "easy", gridSize: 5, parTime: 50 },
  { id: 4, name: "Cat Nap", difficulty: "easy", gridSize: 5, parTime: 45 },
  { id: 5, name: "Kitten Play", difficulty: "easy", gridSize: 5, parTime: 40 },
  { id: 6, name: "Whisker Way", difficulty: "medium", gridSize: 6, parTime: 75 },
  { id: 7, name: "Cat Walk", difficulty: "medium", gridSize: 6, parTime: 70 },
  { id: 8, name: "Purr-fect", difficulty: "medium", gridSize: 6, parTime: 65 },
  { id: 9, name: "Meow Maze", difficulty: "medium", gridSize: 6, parTime: 60 },
  { id: 10, name: "Feline Fine", difficulty: "medium", gridSize: 6, parTime: 55 },
  { id: 11, name: "Cat's Cradle", difficulty: "medium", gridSize: 6, parTime: 50 },
  { id: 12, name: "Kitty Corner", difficulty: "medium", gridSize: 6, parTime: 50 },
  { id: 13, name: "Tail Chaser", difficulty: "hard", gridSize: 7, parTime: 90 },
  { id: 14, name: "Paw Print", difficulty: "hard", gridSize: 7, parTime: 85 },
  { id: 15, name: "Cat Burglar", difficulty: "hard", gridSize: 7, parTime: 80 },
  { id: 16, name: "Litter Logic", difficulty: "hard", gridSize: 7, parTime: 75 },
  { id: 17, name: "Fur Ball", difficulty: "hard", gridSize: 7, parTime: 70 },
  { id: 18, name: "Catfish", difficulty: "hard", gridSize: 7, parTime: 70 },
  { id: 19, name: "Scratch Post", difficulty: "hard", gridSize: 7, parTime: 65 },
  { id: 20, name: "Hairball Alley", difficulty: "hard", gridSize: 7, parTime: 65 },
  { id: 21, name: "Catnip Dreams", difficulty: "expert", gridSize: 8, parTime: 120 },
  { id: 22, name: "Feline Fury", difficulty: "expert", gridSize: 8, parTime: 110 },
  { id: 23, name: "Claw Machine", difficulty: "expert", gridSize: 8, parTime: 100 },
  { id: 24, name: "Cat's Eye", difficulty: "expert", gridSize: 8, parTime: 95 },
  { id: 25, name: "Nine Lives", difficulty: "expert", gridSize: 8, parTime: 90 },
  { id: 26, name: "Lion's Den", difficulty: "master", gridSize: 9, parTime: 150 },
  { id: 27, name: "Tiger's Domain", difficulty: "master", gridSize: 9, parTime: 140 },
  { id: 28, name: "Panther's Shadow", difficulty: "master", gridSize: 9, parTime: 130 },
  { id: 29, name: "Cat Almighty", difficulty: "master", gridSize: 9, parTime: 120 },
  { id: 30, name: "Meowster Mind", difficulty: "master", gridSize: 9, parTime: 120 },
];

const TUTORIALS = [
  "Each row needs exactly 1 cat. Tap a cell in row 1 to place your first cat!",
  "Great! Now remember: each column also needs exactly 1 cat. No two cats can share a column.",
  "One more rule: each colored region needs exactly 1 cat, and cats can't touch each other, even diagonally!",
];

function generateLevel(def) {
  const baseSeed = def.id * 7919 + 42;

  for (let attempt = 0; attempt < 500; attempt++) {
    const seed = baseSeed + attempt * 65537;
    const rng = createRNG(seed);

    // Step 1: Generate a valid cat placement
    const solution = generatePlacement(def.gridSize, rng);
    if (!solution) continue;

    // Step 2: Build regions around the solution
    const rng2 = createRNG(seed + attempt * 31);
    const regions = buildRegions(def.gridSize, solution, rng2);
    if (!regions) continue;

    // Step 3: Verify unique solution
    const numSolutions = countSolutions(def.gridSize, regions, 2);
    if (numSolutions === 1) {
      return {
        id: def.id,
        name: def.name,
        difficulty: def.difficulty,
        gridSize: def.gridSize,
        regions: regions,
        solution: solution,
        maxHearts: 3,
        parTime: def.parTime,
        tutorial: def.id <= 3 ? TUTORIALS[def.id - 1] : null,
      };
    }
  }

  console.error(`FAILED level ${def.id} (${def.gridSize}x${def.gridSize})`);
  return null;
}

// === Main ===
console.log("Generating 30 Meowdoku levels...\n");

const levels = [];
let failed = 0;
const startTime = Date.now();

for (const def of LEVEL_DEFS) {
  const level = generateLevel(def);
  if (level) {
    levels.push(level);
    const sol = level.solution.map(s => `[${s[0]},${s[1]}]`).join(', ');
    console.log(`✓ Level ${level.id} (${level.gridSize}x${level.gridSize} ${level.difficulty}): "${level.name}" - ${sol}`);
  } else {
    failed++;
    levels.push(null);
  }
}

const elapsed = Date.now() - startTime;

if (failed > 0) {
  console.error(`\n${failed} levels FAILED!`);
  process.exit(1);
}

console.log(`\nAll ${levels.length} levels generated in ${elapsed}ms`);

const fs = require('fs');

// Write full JSON
fs.writeFileSync('/tmp/meowdoku-levels.json', JSON.stringify(levels.filter(Boolean), null, 2));

// Write compact JS
const compact = levels.filter(Boolean).map(l => ({
  i: l.id, n: l.name, d: l.difficulty, s: l.gridSize,
  r: l.regions, sol: l.solution, h: l.maxHearts, t: l.parTime, tut: l.tutorial,
}));
const jsCode = `const LEVEL_DATA=${JSON.stringify(compact)};`;
fs.writeFileSync('/tmp/meowdoku-levels.js', jsCode);
console.log(`Compact JS: ${(jsCode.length / 1024).toFixed(1)} KB`);
