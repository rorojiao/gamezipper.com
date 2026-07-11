// verify_independent.js — Independent Node.js BFS verifier for Round Trip levels
// Method 2 of 3-method verification

const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function verifyLevel(lv) {
  const { rows: R, cols: C, grid, clues } = lv;
  const errors = [];

  // 1. Check Eulerian circuit: all visited cells degree 2, single component
  const visitedCells = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] > 0) visitedCells.push([r, c]);
    }
  }

  if (visitedCells.length === 0) {
    errors.push('No cells in solution');
    return { valid: false, errors };
  }

  // Build adjacency
  const adj = {};
  for (const [r, c] of visitedCells) {
    const key = r * C + c;
    adj[key] = [];
    const t = grid[r][c];
    const hasH = t === 1 || t === 3 || t === 4;
    const hasV = t === 2 || t === 3 || t === 4;
    if (hasH && c + 1 < C && (grid[r][c+1] === 1 || grid[r][c+1] === 3 || grid[r][c+1] === 4))
      adj[key].push(r * C + c + 1);
    if (hasH && c - 1 >= 0 && (grid[r][c-1] === 1 || grid[r][c-1] === 3 || grid[r][c-1] === 4))
      adj[key].push(r * C + c - 1);
    if (hasV && r + 1 < R && (grid[r+1][c] === 2 || grid[r+1][c] === 3 || grid[r+1][c] === 4))
      adj[key].push((r+1) * C + c);
    if (hasV && r - 1 >= 0 && (grid[r-1][c] === 2 || grid[r-1][c] === 3 || grid[r-1][c] === 4))
      adj[key].push((r-1) * C + c);
  }

  // Check all degrees are 2
  for (const [r, c] of visitedCells) {
    const key = r * C + c;
    if (adj[key].length !== 2) {
      errors.push(`Cell (${r},${c}) has degree ${adj[key].length}, expected 2`);
    }
  }

  // Check single connected component
  const start = visitedCells[0][0] * C + visitedCells[0][1];
  const comp = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const n = queue.shift();
    for (const nb of (adj[n] || [])) {
      if (!comp.has(nb)) { comp.add(nb); queue.push(nb); }
    }
  }
  if (comp.size !== visitedCells.length) {
    errors.push(`Disconnected: ${comp.size}/${visitedCells.length} cells connected`);
  }

  // 2. Verify clues match solution
  function getNearestHSeg(r, side) {
    let len = 0;
    if (side === 'left') {
      for (let c = 0; c < C; c++) {
        if (grid[r][c] === 1 || grid[r][c] === 3) len++;
        else if (len > 0) break;
      }
    } else {
      for (let c = C - 1; c >= 0; c--) {
        if (grid[r][c] === 1 || grid[r][c] === 3) len++;
        else if (len > 0) break;
      }
    }
    return len;
  }

  function getNearestVSeg(c, side) {
    let len = 0;
    if (side === 'top') {
      for (let r = 0; r < R; r++) {
        if (grid[r][c] === 2 || grid[r][c] === 3) len++;
        else if (len > 0) break;
      }
    } else {
      for (let r = R - 1; r >= 0; r--) {
        if (grid[r][c] === 2 || grid[r][c] === 3) len++;
        else if (len > 0) break;
      }
    }
    return len;
  }

  for (let r = 0; r < R; r++) {
    const leftSeg = getNearestHSeg(r, 'left');
    const rightSeg = getNearestHSeg(r, 'right');
    if (clues.row_left[r] > 0 && leftSeg !== clues.row_left[r])
      errors.push(`Row ${r} left clue: expected ${clues.row_left[r]}, got ${leftSeg}`);
    if (clues.row_right[r] > 0 && rightSeg !== clues.row_right[r])
      errors.push(`Row ${r} right clue: expected ${clues.row_right[r]}, got ${rightSeg}`);
  }

  for (let c = 0; c < C; c++) {
    const topSeg = getNearestVSeg(c, 'top');
    const botSeg = getNearestVSeg(c, 'bottom');
    if (clues.col_top[c] > 0 && topSeg !== clues.col_top[c])
      errors.push(`Col ${c} top clue: expected ${clues.col_top[c]}, got ${topSeg}`);
    if (clues.col_bottom[c] > 0 && botSeg !== clues.col_bottom[c])
      errors.push(`Col ${c} bottom clue: expected ${clues.col_bottom[c]}, got ${botSeg}`);
  }

  return { valid: errors.length === 0, errors, cells: visitedCells.length };
}

console.log(`Verifying ${levels.length} Round Trip levels (independent Node.js BFS)...\n`);

let validCount = 0;
for (const lv of levels) {
  const result = verifyLevel(lv);
  const status = result.valid ? '✅ VALID' : '❌ INVALID';
  console.log(`  L${String(lv.level).padStart(2,'0')} ${lv.tierName.padEnd(10)} ${lv.rows}x${lv.cols} cells=${result.cells || '?'} ${status}`);
  if (!result.valid) {
    result.errors.forEach(e => console.log(`       ${e}`));
  } else {
    validCount++;
  }
}

console.log(`\n${validCount}/${levels.length} levels valid`);
process.exit(validCount === levels.length ? 0 : 1);
