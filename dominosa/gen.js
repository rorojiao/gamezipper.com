// Dominosa level generator — produces 30 levels with VERIFIED UNIQUE solutions.
// Run: node dominosa/gen.js > dominosa/levels.json
// Each level: { tier, idx, rows, cols, setMax, grid (rows*cols numbers 0..setMax), solution (list of [[r1,c1],[r2,c2]]) }

// ---------- Deterministic PRNG (mulberry32) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Domino set ----------
function dominoSet(maxVal) {
  const set = [];
  for (let a = 0; a <= maxVal; a++)
    for (let b = a; b <= maxVal; b++)
      set.push([a, b]);
  return set;
}

// ---------- Random perfect matching of grid (domino tiling) ----------
// Uses randomized DFS to tile a rows×cols grid with dominoes.
function randomTiling(rows, cols, rng) {
  // cells = rows*cols (must be even)
  const total = rows * cols;
  if (total % 2 !== 0) return null;
  const covered = Array.from({length: rows}, () => new Array(cols).fill(false));
  const dominoes = [];

  function neighbors(r, c) {
    const out = [];
    if (r > 0) out.push([r-1, c]);
    if (r < rows-1) out.push([r+1, c]);
    if (c > 0) out.push([r, c-1]);
    if (c < cols-1) out.push([r, c+1]);
    return out;
  }

  // Greedy random matching — fast and almost always succeeds for our sizes.
  function tryGreedy() {
    covered.forEach(row => row.fill(false));
    dominoes.length = 0;
    // Order cells by a shuffled order
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
    // shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    for (const [r, c] of cells) {
      if (covered[r][c]) continue;
      const opts = neighbors(r, c).filter(([nr, nc]) => !covered[nr][nc]);
      if (opts.length === 0) return false; // dead end
      const [nr, nc] = opts[Math.floor(rng() * opts.length)];
      covered[r][c] = true;
      covered[nr][nc] = true;
      dominoes.push([[r, c], [nr, nc]]);
    }
    return dominoes.length === total / 2;
  }

  // Try greedy a bunch of times
  for (let attempt = 0; attempt < 200; attempt++) {
    if (tryGreedy()) return dominoes;
  }
  return null;
}

// ---------- Build number grid from tiling + random set assignment ----------
function buildGrid(rows, cols, tiling, set, rng) {
  if (tiling.length !== set.length) return null; // set must exactly cover
  const grid = Array.from({length: rows}, () => new Array(cols).fill(-1));
  // Assign each set domino to a tiling slot (random permutation)
  const perm = set.map((_, i) => i);
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < tiling.length; i++) {
    const [[r1, c1], [r2, c2]] = tiling[i];
    let [a, b] = set[perm[i]];
    // random orientation
    if (rng() < 0.5) [a, b] = [b, a];
    grid[r1][c1] = a;
    grid[r2][c2] = b;
  }
  return grid;
}

// ---------- Solver: count solutions (up to limit) via backtracking ----------
// Returns count of solutions found (capped at `limit`).
function countSolutions(rows, cols, grid, setMax, limit) {
  // Each cell value known. We need to find perfect matchings (domino tilings)
  // where each unordered pair {a,b} appears at most once (and exactly the right count
  // because the set fully covers — so each pair appears exactly once in any full tiling).
  // Wait: the constraint is that the SET of dominoes placed must equal the unique set.
  // With grid being exactly 2 × |set| cells, any perfect matching that uses each set-domino
  // at most once is automatically a full usage. So: enumerate perfect matchings with
  // the "no duplicate pair" constraint, count them.
  const set = dominoSet(setMax);
  const needed = new Map();
  for (const [a, b] of set) needed.set(a * 100 + b, 1);

  const covered = Array.from({length: rows}, () => new Array(cols).fill(false));
  const usedPairs = new Set();
  let count = 0;

  function pairKey(va, vb) {
    return va < vb ? va * 100 + vb : vb * 100 + va;
  }

  function findFirst() {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!covered[r][c]) return [r, c];
    return null;
  }

  function recurse() {
    if (count >= limit) return;
    const cell = findFirst();
    if (cell === null) {
      count++;
      return;
    }
    const [r, c] = cell;
    covered[r][c] = true;
    const va = grid[r][c];
    const opts = [];
    if (r > 0 && !covered[r-1][c]) opts.push([r-1, c]);
    if (r < rows-1 && !covered[r+1][c]) opts.push([r+1, c]);
    if (c > 0 && !covered[r][c-1]) opts.push([r, c-1]);
    if (c < cols-1 && !covered[r][c+1]) opts.push([r, c+1]);
    for (const [nr, nc] of opts) {
      const vb = grid[nr][nc];
      const key = pairKey(va, vb);
      if (usedPairs.has(key)) continue; // duplicate — skip
      if (!needed.has(key)) continue;   // not in set — skip
      usedPairs.add(key);
      covered[nr][nc] = true;
      recurse();
      covered[nr][nc] = false;
      usedPairs.delete(key);
      if (count >= limit) break;
    }
    covered[r][c] = false;
  }

  recurse();
  return count;
}

// ---------- Find one solution (for hints) ----------
function findOneSolution(rows, cols, grid, setMax) {
  const set = dominoSet(setMax);
  const needed = new Set();
  for (const [a, b] of set) needed.add(a < b ? a * 100 + b : b * 100 + a);
  const covered = Array.from({length: rows}, () => new Array(cols).fill(false));
  const usedPairs = new Set();
  const placement = [];
  function pairKey(va, vb) { return va < vb ? va * 100 + vb : vb * 100 + va; }
  function findFirst() {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!covered[r][c]) return [r, c];
    return null;
  }
  function recurse() {
    const cell = findFirst();
    if (cell === null) return true;
    const [r, c] = cell;
    covered[r][c] = true;
    const va = grid[r][c];
    const opts = [];
    if (r > 0 && !covered[r-1][c]) opts.push([r-1, c]);
    if (r < rows-1 && !covered[r+1][c]) opts.push([r+1, c]);
    if (c > 0 && !covered[r][c-1]) opts.push([r, c-1]);
    if (c < cols-1 && !covered[r][c+1]) opts.push([r, c+1]);
    for (const [nr, nc] of opts) {
      const vb = grid[nr][nc];
      const key = pairKey(va, vb);
      if (usedPairs.has(key) || !needed.has(key)) continue;
      usedPairs.add(key);
      covered[nr][nc] = true;
      placement.push([[r, c], [nr, nc]]);
      if (recurse()) return true;
      placement.pop();
      covered[nr][nc] = false;
      usedPairs.delete(key);
    }
    covered[r][c] = false;
    return false;
  }
  return recurse() ? placement : null;
}

// ---------- Tier config ----------
// rows×cols must equal 2 × |set(setMax)| = 2 × (setMax+1)(setMax+2)/2 = (setMax+1)(setMax+2)
// double-2: 3×4=12, |set|=6 ✓
// double-3: 4×5=20, |set|=10 ✓
// double-4: 5×6=30, |set|=15 ✓
// double-5: 6×7=42, |set|=21 ✓
// double-6: 7×8=56, |set|=28 ✓
const TIERS = [
  { name: 'Beginner',  rows: 3, cols: 4, setMax: 2, count: 6 },
  { name: 'Easy',      rows: 4, cols: 5, setMax: 3, count: 6 },
  { name: 'Medium',    rows: 5, cols: 6, setMax: 4, count: 6 },
  { name: 'Hard',      rows: 6, cols: 7, setMax: 5, count: 6 },
  { name: 'Master',    rows: 7, cols: 8, setMax: 6, count: 6 },
];

function generateLevel(tierCfg, seed) {
  const set = dominoSet(tierCfg.setMax);
  const rng = mulberry32(seed);
  // Try many seeds-derivations to find a unique-solution puzzle.
  for (let attempt = 0; attempt < 60; attempt++) {
    const attemptSeed = seed + attempt * 7919;
    const r = mulberry32(attemptSeed);
    const tiling = randomTiling(tierCfg.rows, tierCfg.cols, r);
    if (!tiling) continue;
    const grid = buildGrid(tierCfg.rows, tierCfg.cols, tiling, set, r);
    if (!grid) continue;
    // Verify uniqueness: expect exactly 1 solution (cap at 2)
    const solCount = countSolutions(tierCfg.rows, tierCfg.cols, grid, tierCfg.setMax, 2);
    if (solCount === 1) {
      const solution = findOneSolution(tierCfg.rows, tierCfg.cols, grid, tierCfg.setMax);
      return { rows: tierCfg.rows, cols: tierCfg.cols, setMax: tierCfg.setMax,
               grid: grid.flat(),
               solution: solution.map(([[r1,c1],[r2,c2]]) => [r1*cols(tierCfg)+c1, r2*cols(tierCfg)+c2]) };
    }
  }
  return null;
}
function cols(t){return t.cols;}

// ---------- Generate all 30 levels ----------
const levels = [];
let levelIdx = 1;
let baseSeed = 20260627;
for (let t = 0; t < TIERS.length; t++) {
  const tier = TIERS[t];
  for (let i = 0; i < tier.count; i++) {
    let level = null;
    // Try a range of seeds
    for (let s = baseSeed; s < baseSeed + 5000 && !level; s++) {
      level = generateLevel(tier, s);
      if (level) baseSeed = s + 1;
    }
    if (!level) {
      console.error('FAILED to generate level', t, i);
      process.exit(1);
    }
    levels.push({ tier: tier.name, tierIdx: t, idx: i+1, level: levelIdx++,
                  rows: level.rows, cols: level.cols, setMax: level.setMax,
                  grid: level.grid, solution: level.solution });
    process.stderr.write(`✓ Tier ${tier.name} #${i+1} (seed-based) — grid ${level.rows}x${level.cols} setMax=${level.setMax}\n`);
  }
}

console.log(JSON.stringify(levels));
process.stderr.write(`\n✓ Generated ${levels.length} levels — all verified UNIQUE solutions\n`);
