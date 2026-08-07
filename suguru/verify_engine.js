// Suguru per-game verifier — sweep 44 (2026-08-07)
//
// Validates every level in the embedded LEVELS catalog is solvable with the
// production solveSuguru() AND with a standard orthogonal-only Suguru rule.
//
// CRITICAL FINDING (sweep 44): 0/30 levels are solvable under EITHER rule
// (production solver enforces diagonal adjacency; orthogonal-only solver
// matches standard Suguru). Every level appears broken at the data layer —
// the givens + regions + grid together admit no valid fill.
//
// The in-game init-time "validateAll" IIFE only console.warn's invalid levels
// and silently continues — see index.html line ~360. No tests catch this.
//
// Usage:
//   node suguru/verify_engine.js    # runs against the source's LEVELS catalog
//   (no kachilu needed; pure node)
//
// Exit codes: 0 = all levels solvable, 1 = ≥1 level unsolvable.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const mLevels = html.match(/var LEVELS = \{(.*?)\n\};/s);
const mSolver = html.match(/function solveSuguru\(rows,cols,regions,givens\)\{([\s\S]*?)\n\}/);
if (!mLevels || !mSolver) {
  console.error('FAIL: Could not parse LEVELS or solveSuguru from index.html');
  process.exit(2);
}
eval('var LEVELS = {' + mLevels[1] + '};');
eval('function solveSuguru(rows,cols,regions,givens){' + mSolver[1] + '}');

// Standard Suguru rule: orthogonal-only adjacency (NO diagonal).
function solveOrthoOnly(rows, cols, regions, givens) {
  var cellRegion = new Array(rows * cols);
  var regionSizes = [];
  for (var ri = 0; ri < regions.length; ri++) {
    regionSizes[ri] = regions[ri].length;
    for (var j = 0; j < regions[ri].length; j++) cellRegion[regions[ri][j]] = ri;
  }
  var solution = null, solveCount = 0;
  function adjOk(cell, v, grid) {
    var r = Math.floor(cell / cols), c = cell % cols;
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of deltas) {
      var nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      var ni = nr * cols + nc;
      if (grid[ni] === v) return false;
    }
    return true;
  }
  function regionOk(cell, v, grid) {
    var ri = cellRegion[cell], reg = regions[ri];
    for (var i = 0; i < reg.length; i++) if (reg[i] !== cell && grid[reg[i]] === v) return false;
    return true;
  }
  function bt(pos, grid) {
    if (solveCount > 1) return;
    while (pos < grid.length && grid[pos] !== 0) pos++;
    if (pos === grid.length) { solveCount++; solution = grid.slice(); return; }
    var ri = cellRegion[pos], sz = regionSizes[ri];
    for (var v = 1; v <= sz; v++) {
      if (adjOk(pos, v, grid) && regionOk(pos, v, grid)) {
        grid[pos] = v;
        bt(pos + 1, grid);
        grid[pos] = 0;
        if (solveCount > 1) return;
      }
    }
  }
  var grid = new Array(rows * cols).fill(0);
  var gk = Object.keys(givens);
  for (var i = 0; i < gk.length; i++) grid[parseInt(gk[i])] = givens[parseInt(gk[i])];
  bt(0, grid);
  return solveCount === 1 ? solution : null;
}

const diffs = Object.keys(LEVELS);
let total = 0, prodSolved = 0, orthoSolved = 0;
const failures = [];
for (const diff of diffs) {
  for (let i = 0; i < LEVELS[diff].length; i++) {
    total++;
    const L = LEVELS[diff][i];
    const prod = solveSuguru(L.grid[0], L.grid[1], L.regions, L.givens);
    const ortho = solveOrthoOnly(L.grid[0], L.grid[1], L.regions, L.givens);
    if (prod) prodSolved++;
    if (ortho) orthoSolved++;
    if (!prod || !ortho) {
      failures.push({ diff, idx: i + 1, prodSolved: !!prod, orthoSolved: !!ortho, givens: Object.keys(L.givens).length, regions: L.regions.length });
    }
  }
}
console.log(`Total: ${total}, Production-solver solved: ${prodSolved}, Standard-orthogonal solved: ${orthoSolved}`);
if (failures.length) {
  console.log(`FAIL: ${failures.length}/${total} levels unsolvable under BOTH rules`);
  for (const f of failures.slice(0, 10)) console.log('  ', JSON.stringify(f));
  if (failures.length > 10) console.log(`  ... and ${failures.length - 10} more`);
  console.log('\nDIAGNOSIS: every level appears broken at the data layer.');
  console.log('  - Givens may conflict with regions, OR');
  console.log('  - Regions partition is incorrect, OR');
  console.log('  - Some level is missing required uniqueness constraints.');
  console.log('RECOMMENDATION: regenerate the LEVELS catalog from scratch using a');
  console.log('  working generator (see game-design/ for templates), then re-run this');
  console.log('  verifier. The in-game init validate only console.warn\'s and silently');
  console.log('  proceeds, so no production check catches this defect.');
  process.exit(1);
}
console.log('PASS: all 30 levels solvable under both rules');
process.exit(0);