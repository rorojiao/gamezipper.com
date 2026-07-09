#!/usr/bin/env node
/**
 * Canal View — Independent Node.js BFS Solver/Verifier
 * Verifies all 30 levels have unique solutions using an independent implementation.
 * 
 * Usage: node verify_independent.js
 */

const fs = require('fs');

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function neighbors4(r, c, R, C) {
  const result = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C) result.push([nr, nc]);
  }
  return result;
}

function countCanalNb(r, c, grid, R, C) {
  let cnt = 0;
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1) cnt++;
  }
  return cnt;
}

function has2x2(grid, R, C) {
  for (let r = 0; r < R - 1; r++) {
    for (let c = 0; c < C - 1; c++) {
      if (grid[r][c]===1 && grid[r+1][c]===1 && grid[r][c+1]===1 && grid[r+1][c+1]===1) return true;
    }
  }
  return false;
}

function isConnectedCanal(grid, R, C) {
  let canal = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 1) canal.push([r, c]);
  if (canal.length === 0) return true;
  const start = canal[0];
  const visited = new Set();
  visited.add(`${start[0]},${start[1]}`);
  const queue = [start];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [nr, nc] of neighbors4(r, c, R, C)) {
      const key = `${nr},${nc}`;
      if (grid[nr][nc] === 1 && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return visited.size === canal.length;
}

function solve(clueGrid, R, C, shownMask, maxSolutions = 2, maxNodes = 200000) {
  const solutions = [];
  let nodes = 0;
  const grid = Array.from({length: R}, () => new Array(C).fill(-1));
  
  const nbCache = {};
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      nbCache[`${r},${c}`] = neighbors4(r, c, R, C);
  
  function propagate(g) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (!shownMask[r][c]) continue;
          const clue = clueGrid[r][c];
          const nbs = nbCache[`${r},${c}`];
          const unknown = [];
          let canalCnt = 0;
          for (const [nr, nc] of nbs) {
            if (g[nr][nc] === 1) canalCnt++;
            else if (g[nr][nc] === -1) unknown.push([nr, nc]);
          }
          const need = clue - canalCnt;
          if (need < 0 || need > unknown.length) return false;
          if (need === 0 && unknown.length > 0) {
            for (const [nr, nc] of unknown) { g[nr][nc] = 0; changed = true; }
          } else if (need === unknown.length && unknown.length > 0) {
            for (const [nr, nc] of unknown) {
              g[nr][nc] = 1; changed = true;
              for (const dr2 of [-1, 0]) {
                for (const dc2 of [-1, 0]) {
                  const r0 = nr + dr2, c0 = nc + dc2;
                  if (r0 >= 0 && r0 < R - 1 && c0 >= 0 && c0 < C - 1) {
                    if (g[r0][c0]===1 && g[r0+1][c0]===1 && g[r0][c0+1]===1 && g[r0+1][c0+1]===1)
                      return false;
                  }
                }
              }
            }
          }
        }
      }
    }
    return true;
  }
  
  function backtrack(g) {
    if (solutions.length >= maxSolutions) return;
    nodes++;
    if (nodes > maxNodes) return;
    if (!propagate(g)) return;
    
    let target = null;
    for (let r = 0; r < R && !target; r++) {
      for (let c = 0; c < C; c++) {
        if (g[r][c] === -1) { target = [r, c]; break; }
      }
    }
    
    if (target === null) {
      const final = g.map(row => row.map(v => v === 1 ? 1 : 0));
      if (isConnectedCanal(final, R, C)) {
        solutions.push(final);
      }
      return;
    }
    
    const [r, c] = target;
    for (const val of [1, 0]) {
      const g2 = g.map(row => row.slice());
      g2[r][c] = val;
      if (val === 1) {
        let bad = false;
        for (const dr2 of [-1, 0]) {
          for (const dc2 of [-1, 0]) {
            const r0 = r + dr2, c0 = c + dc2;
            if (r0 >= 0 && r0 < R - 1 && c0 >= 0 && c0 < C - 1) {
              if (g2[r0][c0]===1 && g2[r0+1][c0]===1 && g2[r0][c0+1]===1 && g2[r0+1][c0+1]===1) {
                bad = true; break;
              }
            }
          }
          if (bad) break;
        }
        if (bad) continue;
      }
      backtrack(g2);
    }
  }
  
  backtrack(grid);
  return { solutions, nodes };
}

function main() {
  const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
  const levels = data.levels;
  
  let allPass = true;
  let totalNodes = 0;
  
  for (const level of levels) {
    const [R, C] = level.size;
    const grid = level.grid;
    const clues = level.clues;
    const shown = level.shown;
    
    // 1. Verify clue correctness
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const actual = countCanalNb(r, c, grid, R, C);
        if (actual !== clues[r][c]) {
          console.log(`L${level.number}: CLUE MISMATCH at (${r},${c}) expected=${clues[r][c]} actual=${actual}`);
          allPass = false;
        }
      }
    }
    
    // 2. Verify no 2x2
    if (has2x2(grid, R, C)) {
      console.log(`L${level.number}: HAS 2x2 BLOCK`);
      allPass = false;
    }
    
    // 3. Verify connectivity
    if (!isConnectedCanal(grid, R, C)) {
      console.log(`L${level.number}: NOT CONNECTED`);
      allPass = false;
    }
    
    // 4. Verify uniqueness
    const { solutions, nodes } = solve(clues, R, C, shown, 2, 300000);
    totalNodes += nodes;
    const shownCnt = shown.flat().filter(v => v).length;
    
    if (solutions.length !== 1) {
      console.log(`L${level.number}: ${R}x${C} ${level.tier} FAIL — ${solutions.length} solutions (nodes=${nodes})`);
      allPass = false;
    } else {
      // Verify solution matches
      const sol = solutions[0];
      let match = true;
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (sol[r][c] !== grid[r][c]) { match = false; break; }
        }
        if (!match) break;
      }
      if (!match) {
        console.log(`L${level.number}: SOLUTION MISMATCH`);
        allPass = false;
      } else {
        console.log(`L${String(level.number).padStart(2)}: ${R}x${C} ${level.tier.padEnd(10)} clues=${shownCnt}/${R*C} UNIQUE OK (nodes=${nodes})`);
      }
    }
  }
  
  console.log(`\nTotal nodes explored: ${totalNodes}`);
  console.log(`\n=== ${levels.length} LEVELS: ${allPass ? 'ALL PASS ✓' : 'FAILURES ✗'} ===`);
  process.exit(allPass ? 0 : 1);
}

main();
