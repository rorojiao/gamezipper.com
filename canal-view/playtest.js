#!/usr/bin/env node
/**
 * Canal View — Playtest Simulator
 * Replays the stored solution through the engine's game logic
 * to confirm the win condition triggers correctly.
 */

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('var LEVELS = ' + levelsMatch[1] + '; this.LEVELS = LEVELS;', sandbox);
const LEVELS = sandbox.LEVELS;

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function countCanalNb(r, c, grid, R, C) {
  let cnt = 0;
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1) cnt++;
  }
  return cnt;
}

function has2x2(grid, R, C) {
  for (let r = 0; r < R - 1; r++)
    for (let c = 0; c < C - 1; c++)
      if (grid[r][c]===1 && grid[r+1][c]===1 && grid[r][c+1]===1 && grid[r+1][c+1]===1) return true;
  return false;
}

function isConnectedCanal(grid, R, C) {
  const canal = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 1) canal.push([r, c]);
  if (canal.length === 0) return false;
  const visited = new Set([`${canal[0][0]},${canal[0][1]}`]);
  const queue = [canal[0]];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr>=0 && nr<R && nc>=0 && nc<C && grid[nr][nc]===1 && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return visited.size === canal.length;
}

// Simulate the engine's checkWin function
function engineCheckWin(player, clues, shown, R, C) {
  // All cells filled
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (player[r][c] === -1) return { win: false, reason: 'incomplete' };
  
  // All clues satisfied
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (!shown[r][c]) continue;
      const clue = clues[r][c];
      let cnt = 0;
      for (const [dr, dc] of DIRS) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0 && nr<R && nc>=0 && nc<C && player[nr][nc]===1) cnt++;
      }
      if (cnt !== clue) return { win: false, reason: `clue(${r},${c})=${clue} actual=${cnt}` };
    }
  }
  
  // No 2x2
  if (has2x2(player, R, C)) return { win: false, reason: '2x2 block' };
  
  // Connected
  if (!isConnectedCanal(player, R, C)) return { win: false, reason: 'not connected' };
  
  return { win: true };
}

let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i];
  const R = level.R, C = level.C;
  const sol = level.sol;
  
  // Simulate: player fills all cells with solution values
  const player = sol.map(row => row.slice());
  
  const result = engineCheckWin(player, level.clues, level.shown, R, C);
  
  if (result.win) {
    console.log(`L${String(level.n).padStart(2)}: ${R}x${C} ${level.tier.padEnd(10)} PLAYTEST WIN ✓`);
  } else {
    console.log(`L${String(level.n).padStart(2)}: ${R}x${C} ${level.tier.padEnd(10)} PLAYTEST FAIL — ${result.reason}`);
    allPass = false;
  }
}

console.log(`\n=== PLAYTEST: ${LEVELS.length} LEVELS — ${allPass ? 'ALL WIN ✓' : 'FAILURES ✗'} ===`);
process.exit(allPass ? 0 : 1);
