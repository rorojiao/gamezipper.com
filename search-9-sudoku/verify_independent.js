#!/usr/bin/env node
// Independent verifier for Search-9 Sudoku levels.
// Uses a DIFFERENT solver implementation (constraint propagation + DFS) to
// cross-check uniqueness. Confirms:
//   1. Solution is valid standard Sudoku (rows/cols/boxes each 1..N)
//   2. Position clues match the solution
//   3. Puzzle givens match the solution
//   4. Puzzle + clues has exactly 1 solution (the provided solution)
// 
// Usage: node verify_independent.js [levels.json]

const fs = require('fs');
const path = require('path');

const levelsFile = process.argv[2] || path.join(__dirname, 'levels.json');
const data = JSON.parse(fs.readFileSync(levelsFile, 'utf8'));
const levels = data.levels;

let passCount = 0, failCount = 0;
const failures = [];

function boxIndex(r, c, N) {
  const br = N === 9 ? 3 : 2;
  const bc = N === 9 ? 3 : 3;
  return Math.floor(r / br) * br + Math.floor(c / bc);
}

// Validate a full solution against standard Sudoku rules
function validateSolution(sol, N) {
  for (let r = 0; r < N; r++) {
    const seen = new Set();
    for (let c = 0; c < N; c++) {
      const v = sol[r][c];
      if (v < 1 || v > N) return `Invalid value ${v} at (${r},${c})`;
      if (seen.has(v)) return `Duplicate ${v} in row ${r}`;
      seen.add(v);
    }
  }
  for (let c = 0; c < N; c++) {
    const seen = new Set();
    for (let r = 0; r < N; r++) {
      const v = sol[r][c];
      if (seen.has(v)) return `Duplicate ${v} in col ${c}`;
      seen.add(v);
    }
  }
  const numBoxes = N === 9 ? 9 : 6;
  for (let b = 0; b < numBoxes; b++) {
    const seen = new Set();
    const br = N === 9 ? 3 : 2;
    const bc = N === 9 ? 3 : 3;
    const br0 = Math.floor(b / (N / br)) * br;
    const bc0 = (b % (N / bc)) * bc;
    for (let i = 0; i < br; i++) {
      for (let j = 0; j < bc; j++) {
        const v = sol[br0 + i][bc0 + j];
        if (seen.has(v)) return `Duplicate ${v} in box ${b}`;
        seen.add(v);
      }
    }
  }
  return null;
}

// Validate position clues against solution
function validateClues(sol, N, clues) {
  for (let r = 0; r < N; r++) {
    let pos9 = -1;
    for (let c = 0; c < N; c++) {
      if (sol[r][c] === N) { pos9 = c; break; }
    }
    if (pos9 === -1) return `Row ${r} missing digit ${N}`;
    if (clues.L[r] !== pos9 + 1) return `Row ${r} left clue ${clues.L[r]} != actual ${pos9 + 1}`;
  }
  for (let c = 0; c < N; c++) {
    let pos9 = -1;
    for (let r = 0; r < N; r++) {
      if (sol[r][c] === N) { pos9 = r; break; }
    }
    if (pos9 === -1) return `Col ${c} missing digit ${N}`;
    if (clues.T[c] !== pos9 + 1) return `Col ${c} top clue ${clues.T[c]} != actual ${pos9 + 1}`;
  }
  return null;
}

// Validate puzzle givens match solution
function validateGivens(puzzle, sol, N) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (puzzle[r][c] !== 0 && puzzle[r][c] !== sol[r][c]) {
        return `Given at (${r},${c}) = ${puzzle[r][c]} != solution ${sol[r][c]}`;
      }
    }
  }
  return null;
}

// Independent solver: constraint propagation + DFS with bitmask candidates
// Pre-fills N-positions from clues, then solves standard Sudoku
function countSolutionsIndependent(puzzle, N, clues, limit) {
  // Build working grid: copy puzzle, pre-fill clue positions
  const grid = [];
  for (let r = 0; r < N; r++) {
    grid.push(puzzle[r].slice());
  }
  // Pre-fill N-positions from clues
  for (let r = 0; r < N; r++) {
    const c = clues.L[r] - 1;
    if (grid[r][c] === 0) grid[r][c] = N;
  }
  for (let c = 0; c < N; c++) {
    const r = clues.T[c] - 1;
    if (grid[r][c] === 0) grid[r][c] = N;
  }

  // Bitmask constraints: for each row, col, box track used digits
  const rowMask = new Array(N).fill(0);
  const colMask = new Array(N).fill(0);
  const boxMask = new Array(N).fill(0);
  const br = N === 9 ? 3 : 2;
  const bc = N === 9 ? 3 : 3;

  function getBox(r, c) {
    return Math.floor(r / br) * (N / bc) + Math.floor(c / bc);
  }

  // Initialize masks from grid
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = grid[r][c];
      if (v !== 0) {
        rowMask[r] |= (1 << v);
        colMask[c] |= (1 << v);
        boxMask[getBox(r, c)] |= (1 << v);
      }
    }
  }

  let count = 0;

  function solve() {
    if (count >= limit) return;

    // Find empty cell with fewest candidates (MRV)
    let bestR = -1, bestC = -1, bestCands = null;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] !== 0) continue;
        const b = getBox(r, c);
        const used = rowMask[r] | colMask[c] | boxMask[b];
        let cands = [];
        for (let v = 1; v <= N; v++) {
          if (!(used & (1 << v))) cands.push(v);
        }
        if (cands.length === 0) return; // dead end
        if (bestCands === null || cands.length < bestCands.length) {
          bestCands = cands;
          bestR = r;
          bestC = c;
          if (cands.length === 1) break;
        }
      }
      if (bestCands && bestCands.length === 1) break;
    }

    if (bestR === -1) {
      // No empty cells → found a solution
      count++;
      return;
    }

    const b = getBox(bestR, bestC);
    for (const v of bestCands) {
      grid[bestR][bestC] = v;
      rowMask[bestR] |= (1 << v);
      colMask[bestC] |= (1 << v);
      boxMask[b] |= (1 << v);

      solve();

      grid[bestR][bestC] = 0;
      rowMask[bestR] &= ~(1 << v);
      colMask[bestC] &= ~(1 << v);
      boxMask[b] &= ~(1 << v);

      if (count >= limit) return;
    }
  }

  solve();
  return count;
}

// Main verification loop
console.log(`=== SEARCH-9 SUDOKU — INDEPENDENT VERIFICATION ===`);
console.log(`Verifying ${levels.length} levels from ${path.basename(levelsFile)}\n`);

for (const lvl of levels) {
  const N = lvl.N;
  const issues = [];

  // 1. Validate solution
  const solErr = validateSolution(lvl.s, N);
  if (solErr) issues.push(`Solution: ${solErr}`);

  // 2. Validate clues
  const clueErr = validateClues(lvl.s, N, lvl.clues);
  if (clueErr) issues.push(`Clues: ${clueErr}`);

  // 3. Validate givens
  const givenErr = validateGivens(lvl.p, lvl.s, N);
  if (givenErr) issues.push(`Givens: ${givenErr}`);

  // 4. Count solutions (independent solver)
  const numSolutions = countSolutionsIndependent(lvl.p, N, lvl.clues, 2);
  if (numSolutions !== 1) {
    issues.push(`Uniqueness: found ${numSolutions} solutions (expected 1)`);
  }

  // 5. Count givens
  let givenCount = 0;
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (lvl.p[r][c] !== 0) givenCount++;

  if (issues.length === 0) {
    console.log(`✅ Level ${lvl.id} (${lvl.tier}): ${givenCount} givens, ${numSolutions} solution — PASS`);
    passCount++;
  } else {
    console.log(`❌ Level ${lvl.id} (${lvl.tier}): FAIL`);
    issues.forEach(i => console.log(`   ${i}`));
    failCount++;
    failures.push({ id: lvl.id, tier: lvl.tier, issues });
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total: ${levels.length} | PASS: ${passCount} | FAIL: ${failCount}`);

if (failCount > 0) {
  console.log(`\nFAILED LEVELS:`);
  failures.forEach(f => console.log(`  Level ${f.id} (${f.tier}): ${f.issues.join('; ')}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${levels.length} LEVELS VERIFIED — unique solutions confirmed by independent solver.`);
}
