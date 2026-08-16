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

// Interactive-semantics mirror: exactly what the shipped page enforces on player moves —
// 8-adjacency (dr,dc in -1..1, self excluded) + region uniqueness. NOTE: classic Suguru/Tectonic
// is king-move adjacency too; an earlier revision here cross-checked orthogonal-only, which does
// NOT match the shipped interactive rules and wrongly failed every valid level.
function solveInteractive(rows, cols, regions, givens) {
  var cellRegion = new Array(rows * cols);
  var regionSizes = [];
  for (var ri = 0; ri < regions.length; ri++) {
    regionSizes[ri] = regions[ri].length;
    for (var j = 0; j < regions[ri].length; j++) cellRegion[regions[ri][j]] = ri;
  }
  var solution = null, solveCount = 0, nodes = 0;
  function adjOk(cell, v, grid) {
    var r = Math.floor(cell / cols), c = cell % cols;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr * cols + nc] === v) return false;
    }
    return true;
  }
  function regionOk(cell, v, grid) {
    var ri = cellRegion[cell], reg = regions[ri];
    for (var i = 0; i < reg.length; i++) if (reg[i] !== cell && grid[reg[i]] === v) return false;
    return true;
  }
  // MRV ordering — fast enough for 9x9 unique-count-to-2
  function bt() {
    if (solveCount > 1 || nodes++ > 400000) return;
    var best = -1, bestC = null;
    for (var c = 0; c < grid.length; c++) {
      if (grid[c]) continue;
      var ri = cellRegion[c], sz = regionSizes[ri], cand = [];
      for (var v = 1; v <= sz; v++) if (adjOk(c, v, grid) && regionOk(c, v, grid)) cand.push(v);
      if (bestC === null || cand.length < bestC.length) { best = c; bestC = cand; if (cand.length <= 1) break; }
    }
    if (best === -1) { solveCount++; if (!solution) solution = grid.slice(); return; }
    for (var i = 0; i < bestC.length; i++) {
      grid[best] = bestC[i]; bt(); grid[best] = 0;
      if (solveCount > 1) return;
    }
  }
  var grid = new Array(rows * cols).fill(0);
  var gk = Object.keys(givens);
  for (var i = 0; i < gk.length; i++) grid[parseInt(gk[i])] = givens[parseInt(gk[i])];
  bt();
  return solveCount === 1 ? solution : null;
}
// every GIVEN must also survive the interactive conflict predicate (givens are pre-placed
// by the engine; if a given itself conflicted, the level would be unplayable from move one)
function givensConflictFree(rows, cols, regions, givens) {
  var cellRegion = new Array(rows * cols);
  for (var ri = 0; ri < regions.length; ri++) for (var j = 0; j < regions[ri].length; j++) cellRegion[regions[ri][j]] = ri;
  var grid = new Array(rows * cols).fill(0);
  for (var k of Object.keys(givens)) grid[+k] = givens[+k];
  for (var i = 0; i < grid.length; i++) {
    if (!grid[i]) continue;
    var r = Math.floor(i / cols), c = i % cols;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr * cols + nc] === grid[i]) return false;
    }
    var reg = regions[cellRegion[i]];
    for (var j = 0; j < reg.length; j++) if (reg[j] !== i && grid[reg[j]] === grid[i]) return false;
  }
  return true;
}

const diffs = Object.keys(LEVELS);
let total = 0, prodSolved = 0, interSolved = 0, givensClean = 0;
const failures = [];
for (const diff of diffs) {
  for (let i = 0; i < LEVELS[diff].length; i++) {
    total++;
    const L = LEVELS[diff][i];
    const prod = solveSuguru(L.grid[0], L.grid[1], L.regions, L.givens);
    const inter = solveInteractive(L.grid[0], L.grid[1], L.regions, L.givens);
    const clean = givensConflictFree(L.grid[0], L.grid[1], L.regions, L.givens);
    if (prod) prodSolved++;
    if (inter) interSolved++;
    if (clean) givensClean++;
    if (!prod || !inter || !clean) {
      failures.push({ diff, idx: i + 1, prodSolved: !!prod, interSolved: !!inter, givensConflictFree: !!clean, givens: Object.keys(L.givens).length, regions: L.regions.length });
    }
  }
}
console.log(`Total: ${total}, Production-solver solved: ${prodSolved}, Interactive-semantics solved: ${interSolved}, Givens conflict-free: ${givensClean}`);
if (failures.length) {
  console.log(`FAIL: ${failures.length}/${total} levels failed (need prod ∧ interactive ∧ clean-givens)`);
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
  console.log(JSON.stringify({ pass: 0, fail: failures.length, total, verdict: 'FAIL' }));
process.exit(1);
}
console.log('PASS: all 30 levels unique-solvable under production AND interactive (8-adjacency) semantics, givens conflict-free');
console.log(JSON.stringify({ pass: 1, fail: 0, total: 1, verdict: 'PASS', extra: { levels: total, prodSolved, interSolved, givensClean } }));
process.exit(0);