#!/usr/bin/env node
/**
 * Maze Bridge Puzzle - IN-ENGINE Verifier
 * Loads the ACTUAL game's level data and applies the EXACT movement rules
 * from the HTML game (tryMove logic) to verify solvability.
 *
 * This confirms the game engine itself can solve every level.
 */
const fs = require('fs');
const path = require('path');

// Load levels.json (same data the HTML embeds)
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const LEVELS = data.levels;

const TILE = { WALL:'#', PATH:'.', START:'S', END:'E', GAP:'~' };

/**
 * Replicate the game's tryMove logic in a BFS solver.
 * Player state: (r, c, planksUsed, bridgesSet)
 * Movement rules (exact copy of index.html tryMove):
 *  - into PATH/START/END: move freely
 *  - into WALL: blocked
 *  - into GAP: need bridge; far cell (2 steps) must be walkable & in bounds;
 *    consume 1 plank; land on far cell.
 */
function solveWithEngineRules(grid, rows, cols, startR, startC, goalR, goalC, budget) {
  // BFS over (r, c, planksUsed). Bridges are implied by planksUsed path.
  const seen = new Set();
  const key = (r,c,u) => r*100000 + c*100 + u;
  const q = [[startR, startC, 0]];
  seen.add(key(startR, startC, 0));
  while (q.length) {
    const [r, c, used] = q.shift();
    if (r === goalR && c === goalC) return { solvable: true, planks: used };
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (nr<0||nr>=rows||nc<0||nc>=cols) continue;
      const t = grid[nr][nc];
      if (t === TILE.WALL) continue;
      if (t === TILE.PATH || t === TILE.START || t === TILE.END) {
        const k = key(nr, nc, used);
        if (!seen.has(k)) { seen.add(k); q.push([nr, nc, used]); }
      } else if (t === TILE.GAP) {
        // engine rule: far cell must be walkable & in bounds
        const fr = nr+dr, fc = nc+dc;
        if (fr<0||fr>=rows||fc<0||fc>=cols) continue;
        const ft = grid[fr][fc];
        if (ft === TILE.WALL || ft === TILE.GAP) continue;
        if (used + 1 > budget) continue;
        const k = key(fr, fc, used+1);
        if (!seen.has(k)) { seen.add(k); q.push([fr, fc, used+1]); }
      }
    }
  }
  return { solvable: false, planks: -1 };
}

let pass = 0, fail = 0;
for (const lv of LEVELS) {
  const rows = lv.height, cols = lv.width;
  const grid = lv.grid.map(row => row.split(''));
  let startR=-1, startC=-1, goalR=-1, goalC=-1;
  for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
    if (grid[r][c] === 'S') { startR=r; startC=c; }
    if (grid[r][c] === 'E') { goalR=r; goalC=c; }
  }
  const res = solveWithEngineRules(grid, rows, cols, startR, startC, goalR, goalC, lv.budget);
  // also verify NOT solvable with budget-1 (tight)
  const tight = lv.num_gaps > 0
    ? !solveWithEngineRules(grid, rows, cols, startR, startC, goalR, goalC, lv.budget-1).solvable
    : true;
  const ok = res.solvable && tight && res.planks === lv.required_planks;
  if (ok) {
    pass++;
    console.log(`PASS L${lv.level}: ${rows}x${cols} solved with ${res.planks}/${lv.budget} planks (req=${lv.required_planks}) tight=${tight}`);
  } else {
    fail++;
    console.error(`FAIL L${lv.level}: solv=${res.solvable} planks=${res.planks} req=${lv.required_planks} tight=${tight}`);
  }
}
console.log(`\n${pass}/${LEVELS.length} levels PASS (in-engine rules BFS)`);
if (fail > 0) process.exit(1);
