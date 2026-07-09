#!/usr/bin/env node
/**
 * Canal View — In-Engine Verifier
 * Loads the actual index.html, extracts LEVELS, and verifies uniqueness
 * using the engine's own game rules (clue satisfaction, 2x2, connectivity).
 */

const fs = require('fs');
const vm = require('vm');

// Read and parse index.html to extract LEVELS
const html = fs.readFileSync('index.html', 'utf8');

// Extract the LEVELS variable from the script
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
if (!levelsMatch) {
  console.error('ERROR: Could not extract LEVELS from index.html');
  process.exit(1);
}

// Create a sandbox and evaluate LEVELS
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('var LEVELS = ' + levelsMatch[1] + '; this.LEVELS = LEVELS;', sandbox);
const LEVELS = sandbox.LEVELS;

console.log('Loaded ' + LEVELS.length + ' levels from index.html\n');

// Now verify each level using the engine's rules
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
  if (canal.length === 0) return false;
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

// Solver using engine rules (clue satisfaction + 2x2 + connectivity)
function solve(clueGrid, R, C, shownMask, maxSolutions, maxNodes) {
  maxSolutions = maxSolutions || 2;
  maxNodes = maxNodes || 300000;
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
      // All cells assigned — verify engine win conditions
      // 1. All clues satisfied
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (shownMask[r][c]) {
            if (countCanalNb(r, c, g, R, C) !== clueGrid[r][c]) return;
          }
        }
      }
      // 2. No 2x2
      if (has2x2(g, R, C)) return;
      // 3. Connected
      if (!isConnectedCanal(g, R, C)) return;
      solutions.push(g.map(row => row.slice()));
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

// Verify all levels
let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i];
  const R = level.R, C = level.C;
  const clues = level.clues;
  const shown = level.shown;
  const sol = level.sol;
  
  // 1. Verify stored solution is valid
  let solValid = true;
  // Check clues
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (countCanalNb(r, c, sol, R, C) !== clues[r][c]) {
        console.log(`L${level.n}: CLUE MISMATCH at (${r},${c})`);
        solValid = false;
      }
    }
  }
  if (has2x2(sol, R, C)) {
    console.log(`L${level.n}: SOLUTION HAS 2x2`);
    solValid = false;
  }
  if (!isConnectedCanal(sol, R, C)) {
    console.log(`L${level.n}: SOLUTION NOT CONNECTED`);
    solValid = false;
  }
  
  // 2. Verify uniqueness using engine rules
  const { solutions, nodes } = solve(clues, R, C, shown, 2, 300000);
  const shownCnt = shown.flat().filter(v => v).length;
  
  if (solutions.length !== 1) {
    console.log(`L${String(level.n).padStart(2)}: ${R}x${C} ${level.tier.padEnd(10)} FAIL — ${solutions.length} solutions`);
    allPass = false;
  } else {
    // Check solution matches stored
    const match = solutions[0].every((row, r) => row.every((v, c) => v === sol[r][c]));
    if (!match) {
      console.log(`L${String(level.n).padStart(2)}: ${R}x${C} SOLUTION MISMATCH`);
      allPass = false;
    } else {
      console.log(`L${String(level.n).padStart(2)}: ${R}x${C} ${level.tier.padEnd(10)} clues=${shownCnt}/${R*C} UNIQUE ✓ (nodes=${nodes})`);
    }
  }
}

console.log(`\n=== ${LEVELS.length} LEVELS (IN-ENGINE): ${allPass ? 'ALL PASS ✓' : 'FAILURES ✗'} ===`);
process.exit(allPass ? 0 : 1);
