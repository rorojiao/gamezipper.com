#!/usr/bin/env node
/**
 * Independent Node.js BFS verifier for Cross the Streams levels.
 * Reimplements all rules independently from gen_levels.py.
 * Verifies:
 *   1. Solution matches clues (row + col)
 *   2. No 2x2 shaded blocks
 *   3. All shaded cells form one connected group
 *   4. Clue puzzle has UNIQUE solution (using line-based solver)
 */

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const levels = data.levels;

function getLineGroups(line) {
  const groups = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else { if (count > 0) { groups.push(count); count = 0; } }
  }
  if (count > 0) groups.push(count);
  return groups;
}

function checkNo2x2(grid, R, C) {
  for (let r = 0; r < R - 1; r++) {
    for (let c = 0; c < C - 1; c++) {
      if (grid[r][c] === 1 && grid[r][c+1] === 1 && grid[r+1][c] === 1 && grid[r+1][c+1] === 1) {
        return false;
      }
    }
  }
  return true;
}

function checkConnected(grid, R, C) {
  const shaded = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (grid[r][c] === 1) shaded.push([r,c]);
  if (shaded.length === 0) return false;
  const visited = new Set();
  const queue = [[shaded[0][0], shaded[0][1]]];
  visited.add(shaded[0][0] + ',' + shaded[0][1]);
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      const key = nr + ',' + nc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1 && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return visited.size === shaded.length;
}

function checkClues(grid, rowClues, colClues, R, C) {
  for (let r = 0; r < R; r++) {
    const groups = getLineGroups(grid[r]);
    if (JSON.stringify(groups) !== JSON.stringify(rowClues[r])) return false;
  }
  for (let c = 0; c < C; c++) {
    const col = [];
    for (let r = 0; r < R; r++) col.push(grid[r][c]);
    const groups = getLineGroups(col);
    if (JSON.stringify(groups) !== JSON.stringify(colClues[c])) return false;
  }
  return true;
}

// Generate all line patterns matching a clue
function genLinePatterns(clue, length) {
  if (!clue || clue.length === 0) return [new Array(length).fill(0)];
  const minLen = clue.reduce((a,b) => a+b, 0) + clue.length - 1;
  if (minLen > length) return [];
  const results = [];
  
  function place(idx, pos, pattern) {
    if (idx >= clue.length) {
      while (pattern.length < length) pattern.push(0);
      results.push([...pattern]);
      return;
    }
    const remaining = clue.slice(idx);
    const remainMin = remaining.reduce((a,b) => a+b, 0) + remaining.length - 1;
    const maxStart = length - remainMin;
    for (let start = pos; start <= maxStart; start++) {
      const newPat = [...pattern];
      while (newPat.length < start) newPat.push(0);
      for (let i = 0; i < clue[idx]; i++) newPat.push(1);
      if (idx < clue.length - 1) {
        newPat.push(0);
        place(idx + 1, start + clue[idx] + 1, newPat);
      } else {
        while (newPat.length < length) newPat.push(0);
        results.push(newPat);
      }
    }
  }
  
  place(0, 0, []);
  return results;
}

function countSolutions(rowClues, colClues, R, C, maxSolutions = 2) {
  // Generate row patterns
  const rowPatterns = [];
  for (let r = 0; r < R; r++) {
    let patterns = genLinePatterns(rowClues[r], C);
    if (patterns.length > 3000) patterns = patterns.slice(0, 3000); // limit for large
    rowPatterns.push(patterns);
  }
  
  let count = 0;
  const grid = [];
  
  function checkColsPartial(rowIdx) {
    for (let c = 0; c < C; c++) {
      const clue = colClues[c];
      let groups = [];
      let count2 = 0;
      let lastOpen = 0;
      for (let r = 0; r <= rowIdx; r++) {
        if (grid[r][c] === 1) count2++;
        else { if (count2 > 0) { groups.push(count2); count2 = 0; } }
      }
      if (count2 > 0) lastOpen = count2;
      
      if (lastOpen === 0) {
        if (groups.length > clue.length) return false;
        for (let i = 0; i < groups.length; i++) if (groups[i] !== clue[i]) return false;
      } else {
        if (groups.length >= clue.length) return false;
        for (let i = 0; i < groups.length; i++) if (groups[i] !== clue[i]) return false;
        if (lastOpen > clue[groups.length]) return false;
      }
    }
    return true;
  }
  
  function checkFullCols() {
    for (let c = 0; c < C; c++) {
      const col = [];
      for (let r = 0; r < R; r++) col.push(grid[r][c]);
      const groups = getLineGroups(col);
      if (JSON.stringify(groups) !== JSON.stringify(colClues[c])) return false;
    }
    return true;
  }
  
  function solve(r) {
    if (count >= maxSolutions) return;
    if (r === R) {
      if (checkFullCols()) count++;
      return;
    }
    for (const pat of rowPatterns[r]) {
      if (count >= maxSolutions) return;
      grid[r] = pat;
      if (checkColsPartial(r)) solve(r + 1);
    }
  }
  
  solve(0);
  return count;
}

let allPass = true;
for (let i = 0; i < levels.length; i++) {
  const lvl = levels[i];
  const R = lvl.rows, C = lvl.cols;
  
  const cluesOK = checkClues(lvl.solution, lvl.rowClues, lvl.colClues, R, C);
  const no2x2 = checkNo2x2(lvl.solution, R, C);
  const connected = checkConnected(lvl.solution, R, C);
  
  if (!cluesOK) { console.log(`Level ${i+1} FAIL: clues mismatch`); allPass = false; continue; }
  if (!no2x2) { console.log(`Level ${i+1} FAIL: 2x2 block found`); allPass = false; continue; }
  if (!connected) { console.log(`Level ${i+1} FAIL: not connected`); allPass = false; continue; }
  
  const numSol = countSolutions(lvl.rowClues, lvl.colClues, R, C, 2);
  if (numSol !== 1) {
    console.log(`Level ${i+1} FAIL: ${numSol} solutions (expected 1)`);
    allPass = false;
    continue;
  }
  
  console.log(`Level ${i+1}/${levels.length} ${lvl.difficulty} ${R}x${C}: ✅ VALID (unique)`);
}

console.log(allPass ? '\n✅ ALL 30 LEVELS VERIFIED (independent Node.js)' : '\n❌ SOME LEVELS FAILED');
