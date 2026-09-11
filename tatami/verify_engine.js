// Tatami Verifier — validate all 30 levels
// Rules:
//   1. Every cell in solution_tiling is non-zero (covered)
//   2. Each tile (in tiles array) covers exactly 2 axis-adjacent cells
//   3. All tile IDs in solution_tiling appear exactly twice
//   4. No 2x2 sub-block has 4 distinct tile IDs (no 4-corner-meet)
//   5. Anchors (in anchors array) are valid tiles from the tiling
//   6. Uniqueness: independent solve from anchors finds exactly 1 valid tiling

const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = LEVELS.levels;

function verifyStored(idx, lvl) {
  const n = lvl.n, m = lvl.m;
  const sol = lvl.solution_tiling;
  const tiles = lvl.tiles;
  const anchors = lvl.anchors;
  const errors = [];

  // Rule 1: all cells covered
  for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
    if (!sol[r][c]) errors.push(`(${r+1},${c+1}) empty`);
  }

  // Rule 2: tile shapes
  const tileMap = new Map(); // tile_id -> {head, foot}
  for (const t of tiles) {
    const h = t.head, f = t.foot;
    const dr = f[0] - h[0], dc = f[1] - h[1];
    const ok = (dr === 0 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && dc === 0);
    if (!ok) errors.push(`tile ${h}->${f} not 1x2 or 2x1`);
  }

  // Rule 3: each tile_id appears exactly twice
  const counts = {};
  for (const row of sol) for (const v of row) {
    counts[v] = (counts[v] || 0) + 1;
  }
  for (const [tid, cnt] of Object.entries(counts)) {
    if (cnt !== 2) errors.push(`tile_id ${tid} has ${cnt} cells (expected 2)`);
  }

  // Rule 4: no 2x2 has 4 distinct tile IDs
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < m - 1; c++) {
      const ids = new Set([sol[r][c], sol[r][c+1], sol[r+1][c], sol[r+1][c+1]]);
      if (ids.size === 4) errors.push(`4-corner meet at (${r+1},${c+1})`);
    }
  }

  // Rule 5: anchors are valid
  const solMap = new Map();
  for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
    solMap.set(r+','+c, sol[r][c]);
  }
  for (const anc of anchors) {
    const h = anc.head, f = anc.foot;
    if (solMap.get(h[0]+','+h[1]) !== solMap.get(f[0]+','+f[1])) {
      errors.push(`anchor ${h}->${f} not paired in solution`);
    }
  }

  return errors;
}

function solveUniqueness(idx, lvl) {
  const n = lvl.n, m = lvl.m;
  const anchors = lvl.anchors;
  const anchorMap = new Map();
  for (const anc of anchors) {
    anchorMap.set(anc.head[0]+','+anc.head[1], anc.foot);
    anchorMap.set(anc.foot[0]+','+anc.foot[1], anc.head);
  }
  const grid = Array.from({ length: n }, () => new Array(m).fill(0));
  for (const anc of anchors) {
    grid[anc.head[0]][anc.head[1]] = 1;
    grid[anc.foot[0]][anc.foot[1]] = 1;
  }
  let solutions = [];
  let maxSol = 2;
  let iterCount = 0;
  const MAX_ITER = 500000;

  function checkViolation(r, c) {
    for (let rr = Math.max(0, r-1); rr <= Math.min(n-2, r); rr++) {
      for (let cc = Math.max(0, c-1); cc <= Math.min(m-2, c); cc++) {
        const ids = new Set([
          grid[rr][cc], grid[rr][cc+1],
          grid[rr+1][cc], grid[rr+1][cc+1],
        ]);
        if (!ids.has(0) && ids.size === 4) return false;
      }
    }
    return true;
  }

  function dfs(idx) {
    if (solutions.length >= maxSol) return;
    if (++iterCount > MAX_ITER) return;
    if (idx === n * m) {
      // Verify all filled
      for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
        if (grid[r][c] !== 1) return;
      }
      // Verify no violation
      for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < m - 1; c++) {
          const ids = new Set([grid[r][c], grid[r][c+1], grid[r+1][c], grid[r+1][c+1]]);
          if (ids.size === 4) return;
        }
      }
      const sol = grid.map(row => row.slice());
      solutions.push(sol);
      return;
    }
    const r = Math.floor(idx / m), c = idx % m;
    if (grid[r][c] !== 0) { dfs(idx + 1); return; }
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (!(nr >= 0 && nr < n && nc >= 0 && nc < m)) continue;
      if (grid[nr][nc] !== 0) continue;
      let okAnchor = true;
      for (const [cell, partner] of [[[r, c], [nr, nc]], [[nr, nc], [r, c]]]) {
        const k = cell[0] + ',' + cell[1];
        if (anchorMap.has(k)) {
          const exp = anchorMap.get(k);
          if (exp[0] !== partner[0] || exp[1] !== partner[1]) {
            okAnchor = false; break;
          }
        }
      }
      if (!okAnchor) continue;
      grid[r][c] = 1;
      grid[nr][nc] = 1;
      if (checkViolation(r, c) && checkViolation(nr, nc)) {
        dfs(idx + 1);
      }
      grid[r][c] = 0;
      grid[nr][nc] = 0;
      if (solutions.length >= maxSol) return;
    }
  }

  dfs(0);
  return { count: solutions.length, iterCount, solutions };
}

let totalErrors = 0;
let totalUnique = 0;
let totalMulti = 0;
let totalUnsolvable = 0;
const issues = [];

for (let i = 0; i < levels.length; i++) {
  const lvl = levels[i];
  const errors = verifyStored(i, lvl);
  const uniq = solveUniqueness(i, lvl);
  if (errors.length > 0) {
    totalErrors += errors.length;
    issues.push({ level: i, tier: lvl.tier, type: 'stored_solution_invalid', errors });
  } else if (uniq.count === 0) {
    totalUnsolvable++;
    issues.push({ level: i, tier: lvl.tier, type: 'unsolvable' });
  } else if (uniq.count > 1) {
    totalMulti++;
    issues.push({ level: i, tier: lvl.tier, type: 'multi_solution', count: uniq.count });
  } else {
    totalUnique++;
  }
}

console.log(JSON.stringify({
  total: levels.length,
  stored_valid: totalErrors === 0,
  unique: totalUnique,
  multi: totalMulti,
  unsolvable: totalUnsolvable,
  invalid: totalErrors,
  issues
}, null, 2));
