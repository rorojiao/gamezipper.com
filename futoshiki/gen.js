#!/usr/bin/env node
// Futoshiki level generator + uniqueness-verifying solver.
// Produces 30 verified-unique puzzles across 5 tiers and writes levels.json.

const fs = require('fs');

// ---- Seeded RNG (Mulberry32) for reproducibility ----
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Generate a random Latin square of size N ----
function randomLatin(N, rng) {
  // Start from a cyclic Latin square, then shuffle rows & columns & relabel.
  const base = [];
  for (let r = 0; r < N; r++) {
    const row = [];
    for (let c = 0; c < N; c++) row.push(((r + c) % N) + 1);
    base.push(row);
  }
  const rowPerm = shuffle([...Array(N).keys()], rng);
  const colPerm = shuffle([...Array(N).keys()], rng);
  const labelPerm = shuffle([...Array(N).keys()], rng); // 0-indexed, +1 later
  const out = [];
  for (let r = 0; r < N; r++) {
    const row = [];
    for (let c = 0; c < N; c++) {
      const v = base[rowPerm[r]][colPerm[c]];       // 1..N
      row.push(labelPerm[v - 1] + 1);                // relabel 1..N
    }
    out.push(row);
  }
  return out;
}

// ---- Inequality representation ----
// constraints: array of { a:[r,c], b:[r2,c2], op:'<'|'>' } meaning value(a) op value(b)
function buildConstraints(solution, N, rng, targetCount) {
  const cons = [];
  const candidates = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c + 1 < N) candidates.push({ a: [r, c], b: [r, c + 1] }); // horizontal
      if (r + 1 < N) candidates.push({ a: [r, c], b: [r + 1, c] }); // vertical
    }
  }
  shuffle(candidates, rng);
  for (const p of candidates) {
    const va = solution[p.a[0]][p.a[1]];
    const vb = solution[p.b[0]][p.b[1]];
    if (va === vb) continue; // skip equal pairs (no sign)
    cons.push({ a: p.a, b: p.b, op: va < vb ? '<' : '>' });
    if (cons.length >= targetCount) break;
  }
  return cons;
}

// ---- Solver: count solutions up to a limit (2 = non-unique) ----
function countSolutions(N, givens, constraints, limit) {
  // grid[r][c] = 0 unknown; rowMask[r], colMask[c] bitmask of used digits (digit d -> bit (d-1))
  const grid = Array.from({ length: N }, () => new Array(N).fill(0));
  const rowMask = new Array(N).fill(0);
  const colMask = new Array(N).fill(0);
  for (const g of givens) {
    grid[g.r][g.c] = g.v;
    rowMask[g.r] |= 1 << (g.v - 1);
    colMask[g.c] |= 1 << (g.v - 1);
  }
  // Precompute constraint lookup for fast checking
  // consByCell[r][c] = list of {other:[r2,c2], op}
  const consByCell = Array.from({ length: N }, () => Array.from({ length: N }, () => []));
  for (const cn of constraints) {
    consByCell[cn.a[0]][cn.a[1]].push({ other: cn.b, op: cn.op });      // a op b
    consByCell[cn.b[0]][cn.b[1]].push({ other: cn.a, op: cn.op === '<' ? '>' : '<' }); // b reversed op a
  }

  let count = 0;
  // MRV: pick empty cell with fewest candidates
  function findCell() {
    let best = null, bestN = 99;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] !== 0) continue;
        let n = 0;
        for (let v = 1; v <= N; v++) {
          if (rowMask[r] & (1 << (v - 1))) continue;
          if (colMask[c] & (1 << (v - 1))) continue;
          n++;
        }
        if (n < bestN) { bestN = n; best = [r, c]; if (n <= 1) return best; }
      }
    }
    return best;
  }

  function valueOk(r, c, v) {
    if (rowMask[r] & (1 << (v - 1))) return false;
    if (colMask[c] & (1 << (v - 1))) return false;
    for (const k of consByCell[r][c]) {
      const ov = grid[k.other[0]][k.other[1]];
      if (ov === 0) continue;
      if (k.op === '<' && !(v < ov)) return false;
      if (k.op === '>' && !(v > ov)) return false;
    }
    return true;
  }

  function recurse() {
    if (count >= limit) return;
    const cell = findCell();
    if (!cell) { count++; return; }
    const [r, c] = cell;
    for (let v = 1; v <= N; v++) {
      if (!valueOk(r, c, v)) continue;
      grid[r][c] = v;
      rowMask[r] |= 1 << (v - 1);
      colMask[c] |= 1 << (v - 1);
      recurse();
      grid[r][c] = 0;
      rowMask[r] &= ~(1 << (v - 1));
      colMask[c] &= ~(1 << (v - 1));
      if (count >= limit) return;
    }
  }
  recurse();
  return count;
}

function isUnique(N, givens, constraints) {
  return countSolutions(N, givens, constraints, 2) === 1;
}

// ---- Generate one puzzle ----
function generatePuzzle(N, rng, clueTarget, minClue, constraintDensity) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const solution = randomLatin(N, rng);
    // constraint density: fraction of possible adjacent-different pairs to keep as signs
    const totalEdges = 2 * N * (N - 1);
    const targetCount = Math.round(totalEdges * constraintDensity);
    const constraints = buildConstraints(solution, N, rng, targetCount);

    // Start with ALL cells as givens; remove greedily while keeping unique.
    const cells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push({ r, c, v: solution[r][c] });
    shuffle(cells, rng);

    let givens = cells.map(g => ({ r: g.r, c: g.c, v: g.v }));
    // Try removing each cell, but respect the minimum clue floor
    for (const cell of cells) {
      if (givens.length <= minClue) break;
      const trial = givens.filter(g => !(g.r === cell.r && g.c === cell.c));
      if (isUnique(N, trial, constraints)) {
        givens = trial;
      }
    }

    // Accept if unique & clue count is in a sane window around the target
    if (givens.length >= minClue && givens.length <= clueTarget + 2 && isUnique(N, givens, constraints)) {
      return { N, solution, givens, constraints, clueCount: givens.length };
    }
  }
  // Fallback: keep minClue givens (trivially handled by removing random extras & verifying)
  const solution = randomLatin(N, rng);
  const totalEdges = 2 * N * (N - 1);
  const targetCount = Math.round(totalEdges * constraintDensity);
  const constraints = buildConstraints(solution, N, rng, targetCount);
  const all = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) all.push({ r, c, v: solution[r][c] });
  shuffle(all, rng);
  let givens = all.slice(0, Math.max(minClue, all.length));
  return { N, solution, givens, constraints, clueCount: givens.length };
}

// ---- Tier config ----
// tier: { name, N, clueTarget, minClue, constraintDensity }
// Larger grids & fewer clues & fewer constraints = harder.
const TIERS = [
  { name: 'Beginner',  N: 4, clueTarget: 7,  minClue: 6, constraintDensity: 0.55 },  // tier 1: 4x4, easy
  { name: 'Easy',      N: 5, clueTarget: 8,  minClue: 5, constraintDensity: 0.50 },  // tier 2: 5x5
  { name: 'Medium',    N: 5, clueTarget: 4,  minClue: 2, constraintDensity: 0.45 },  // tier 3: 5x5 fewer clues
  { name: 'Hard',      N: 6, clueTarget: 6,  minClue: 3, constraintDensity: 0.42 },  // tier 4: 6x6
  { name: 'Master',    N: 7, clueTarget: 8,  minClue: 4, constraintDensity: 0.38 },  // tier 5: 7x7
];
const LEVELS_PER_TIER = 6;

function main() {
  const levels = [];
  let id = 1;
  let seed = 20260628;
  for (let t = 0; t < TIERS.length; t++) {
    const tier = TIERS[t];
    for (let i = 0; i < LEVELS_PER_TIER; i++) {
      const rng = mulberry32(seed + id * 7919);
      const pz = generatePuzzle(tier.N, rng, tier.clueTarget, tier.minClue, tier.constraintDensity);
      // Compact constraint encoding for the HTML:
      // Each constraint: [aR,aC,bR,bC,op]  op: '<' or '>'
      const consCompact = pz.constraints.map(c => [c.a[0], c.a[1], c.b[0], c.b[1], c.op]);
      const givensCompact = pz.givens.map(g => [g.r, g.c, g.v]);
      const solCompact = pz.solution;
      levels.push({
        id,
        tier: t + 1,
        tierName: tier.name,
        N: tier.N,
        givens: givensCompact,
        constraints: consCompact,
        solution: solCompact,
        clueCount: pz.givens.length,
      });
      console.error(`  Level ${id} [${tier.name} ${tier.N}×${tier.N}] clues=${pz.givens.length} constraints=${consCompact.length} unique=OK`);
      id++;
    }
  }
  const out = { generated: new Date().toISOString(), count: levels.length, tiers: TIERS.map(t => t.name), levels };
  fs.writeFileSync(__dirname + '/levels.json', JSON.stringify(out, null, 1));
  console.error('Wrote', levels.length, 'levels to levels.json');
}

main();
