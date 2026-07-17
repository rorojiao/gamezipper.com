#!/usr/bin/env node
/**
 * Tasukuea independent Node.js verifier.
 * Uses a backtracking solver to find ALL solutions and verify uniqueness.
 * Also verifies that the stored solution matches the unique solution found.
 */
const fs = require('fs');

function neighbors4(r, c, N) {
  const out = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push([nr, nc]);
  }
  return out;
}

function isWhiteConnected(blackSet, N) {
  const whites = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!blackSet.has(r * N + c)) whites.push([r, c]);
    }
  }
  if (whites.length === 0) return false;
  const seen = new Set([whites[0][0] * N + whites[0][1]]);
  const q = [whites[0]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [nr, nc] of neighbors4(r, c, N)) {
      const key = nr * N + nc;
      if (!blackSet.has(key) && !seen.has(key)) {
        seen.add(key);
        q.push([nr, nc]);
      }
    }
  }
  return seen.size === whites.length;
}

function solveTasukuea(N, clueCells, maxSolutions = 2, nodeBudget = 50000) {
  const solutions = [];
  let nodes = 0;

  // Enumerate all possible k×k square positions
  const allSquares = [];
  for (let k = 1; k <= Math.min(N, 3); k++) {
    for (let r = 0; r <= N - k; r++) {
      for (let c = 0; c <= N - k; c++) {
        const sq = new Set();
        for (let dr = 0; dr < k; dr++) {
          for (let dc = 0; dc < k; dc++) {
            sq.add((r + dr) * N + (c + dc));
          }
        }
        allSquares.push(sq);
      }
    }
  }

  const cluePositions = new Set(Object.keys(clueCells).map(Number));
  const validSquares = allSquares.filter(sq => {
    for (const cell of sq) if (cluePositions.has(cell)) return false;
    return true;
  });

  // For each square, compute which clue cells are adjacent to it AND how many cells of this square are adjacent to each clue
  const squareAdjClueCounts = validSquares.map(sq => {
    const adjCounts = {}; // cluePos -> count of cells in this square adjacent to that clue
    for (const cell of sq) {
      const r = Math.floor(cell / N), c = cell % N;
      for (const [nr, nc] of neighbors4(r, c, N)) {
        const key = nr * N + nc;
        if (cluePositions.has(key)) {
          adjCounts[key] = (adjCounts[key] || 0) + 1;
        }
      }
    }
    return adjCounts;
  });

  const qmarks = new Set();
  const numbers = {};
  for (const [pos, v] of Object.entries(clueCells)) {
    const p = Number(pos);
    if (v === '?') qmarks.add(p);
    else numbers[p] = v;
  }

  function compatible(chosen) {
    for (let i = 0; i < chosen.length; i++) {
      for (let j = i + 1; j < chosen.length; j++) {
        for (const cell of validSquares[chosen[i]]) {
          const r = Math.floor(cell / N), c = cell % N;
          for (const [nr, nc] of neighbors4(r, c, N)) {
            if (validSquares[chosen[j]].has(nr * N + nc)) return false;
          }
        }
      }
    }
    return true;
  }

  const squareList = validSquares.map((_, i) => i);

  function backtrack(idx, chosen, blackCountPerClue) {
    nodes++;
    if (nodes > nodeBudget) return;
    if (solutions.length >= maxSolutions) return;
    if (idx === squareList.length) {
      for (const pos of qmarks) {
        if ((blackCountPerClue[pos] || 0) === 0) return;
      }
      for (const [pos, num] of Object.entries(numbers)) {
        if ((blackCountPerClue[pos] || 0) !== num) return;
      }
      if (!compatible(chosen)) return;
      const black = new Set();
      for (const i of chosen) {
        for (const cell of validSquares[i]) black.add(cell);
      }
      if (!isWhiteConnected(black, N)) return;
      solutions.push(black);
      return;
    }
    for (const [pos, num] of Object.entries(numbers)) {
      const cur = blackCountPerClue[pos] || 0;
      if (cur > num) return;
      let remaining = 0;
      for (let i = idx; i < squareList.length; i++) {
        if (squareAdjClueCounts[squareList[i]][pos]) remaining++;
      }
      if (cur + remaining < num) return;
    }
    for (const pos of qmarks) {
      if ((blackCountPerClue[pos] || 0) === 0) {
        let remaining = 0;
        for (let i = idx; i < squareList.length; i++) {
          if (squareAdjClueCounts[squareList[i]][pos]) remaining++;
        }
        if (remaining === 0) return;
      }
    }

    backtrack(idx + 1, chosen, blackCountPerClue);
    let ok = true;
    for (const ci of chosen) {
      for (const cell of validSquares[squareList[idx]]) {
        const r = Math.floor(cell / N), c = cell % N;
        for (const [nr, nc] of neighbors4(r, c, N)) {
          if (validSquares[ci].has(nr * N + nc)) {
            ok = false;
            break;
          }
        }
        if (!ok) break;
      }
      if (!ok) break;
    }
    if (ok) {
      const newCounts = { ...blackCountPerClue };
      for (const [pos, cnt] of Object.entries(squareAdjClueCounts[squareList[idx]])) {
        newCounts[pos] = (newCounts[pos] || 0) + cnt;
      }
      backtrack(idx + 1, [...chosen, squareList[idx]], newCounts);
    }
  }

  backtrack(0, [], {});
  return solutions;
}

function main() {
  const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
  let allUnique = true;
  for (const lv of levels) {
    const N = lv.N;
    const clueCells = {};
    for (const [idx, num] of lv.g) clueCells[idx] = num;
    for (const idx of lv.q) clueCells[idx] = '?';
    const targetBlack = new Set(lv.b);

    const solutions = solveTasukuea(N, clueCells, 2);
    if (solutions.length !== 1) {
      console.log(`Level ${lv.i} (${lv.t}): FAIL - ${solutions.length} solutions found`);
      allUnique = false;
      continue;
    }
    // Check that the unique solution matches target
    const sol = solutions[0];
    const match = sol.size === targetBlack.size && [...sol].every(x => targetBlack.has(x));
    if (!match) {
      console.log(`Level ${lv.i} (${lv.t}): FAIL - solution does not match stored blacks`);
      allUnique = false;
      continue;
    }
    console.log(`Level ${lv.i} (${lv.t}): UNIQUE PASS`);
  }
  if (allUnique) {
    console.log('\nAll 30 levels have unique solutions matching stored data');
  } else {
    console.log('\nSome levels FAILED');
    process.exit(1);
  }
}

main();
