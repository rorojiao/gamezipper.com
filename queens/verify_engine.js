// Queens (LinkedIn style) verifier
// Game has PUZZLE_DATA[].n + solution[] + regions[][] for 30 levels
// checkWin() requires:
//   - exactly n crowns
//   - one per row (rows unique)
//   - one per col (cols unique)
//   - one per region (regs unique)
//   - no 8-N adjacency (including diagonals)

const fs = require('fs');

const html = fs.readFileSync('/home/junze/gamezipper.com/queens/index.html', 'utf8');

// Extract PUZZLE_DATA via balanced-bracket extractor
function extractPUZZLE_DATA(html) {
  const m = html.match(/var PUZZLE_DATA\s*=\s*\[/);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 1;
  let start = i;
  while (i < html.length && depth > 0) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') depth--;
    i++;
  }
  return html.slice(start, i - 1);
}

const pzStr = extractPUZZLE_DATA(html);
if (!pzStr) { console.error('PUZZLE_DATA not found'); process.exit(1); }
const PUZZLE_DATA = eval('(' + '[' + pzStr + ']' + ')');
console.log('PUZZLE_DATA extracted:', PUZZLE_DATA.length);

// Solve constraint: place queen at column= solution[r] for each row r
// Verify:
function verify(p) {
  const n = p.n;
  const sol = p.solution;
  const regions = p.regions;
  if (!Array.isArray(sol) || sol.length !== n) return { ok: false, reason: 'solution.length != n' };
  // Check sol is a permutation
  const seen = new Set();
  for (let r = 0; r < n; r++) {
    if (sol[r] < 0 || sol[r] >= n) return { ok: false, reason: 'sol[' + r + ']=' + sol[r] + ' out of bounds' };
    if (seen.has(sol[r])) return { ok: false, reason: 'col ' + sol[r] + ' duplicate' };
    seen.add(sol[r]);
  }
  // Verify regions is valid nxn with values 0..numRegions-1
  const regs = new Set();
  for (let r = 0; r < n; r++) {
    if (!Array.isArray(regions[r]) || regions[r].length !== n) return { ok: false, reason: 'regions[' + r + '] malformed' };
    for (let c = 0; c < n; c++) regs.add(regions[r][c]);
  }
  // Check solution satisfies all 4 constraints
  const usedRows = new Set();
  const usedCols = new Set();
  const usedRegs = new Set();
  for (let r = 0; r < n; r++) {
    const c = sol[r];
    if (usedRows.has(r)) return { ok: false, reason: 'row ' + r + ' already has crown' };
    usedRows.add(r);
    if (usedCols.has(c)) return { ok: false, reason: 'col ' + c + ' has 2 crowns' };
    usedCols.add(c);
    const reg = regions[r][c];
    if (usedRegs.has(reg)) return { ok: false, reason: 'region ' + reg + ' has 2 crowns' };
    usedRegs.add(reg);
    // Adjacency: 8-neighborhood (including diagonals)
    for (let r2 = 0; r2 < n; r2++) {
      if (r2 === r) continue;
      const c2 = sol[r2];
      const dr = Math.abs(r2 - r);
      const dc = Math.abs(c2 - c);
      if (dr <= 1 && dc <= 1) return { ok: false, reason: 'queens (' + r + ',' + c + ') and (' + r2 + ',' + c2 + ') adjacent' };
    }
  }
  return { ok: true };
}

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < PUZZLE_DATA.length; i++) {
  const p = PUZZLE_DATA[i];
  const r = verify(p);
  if (r.ok) pass++;
  else { fail++; fails.push({ id: p.id, reason: r.reason }); }
}
console.log(`Queens: ${pass}/${PUZZLE_DATA.length} levels have valid stored solution`);
if (fail > 0) {
  console.log('FAILS:');
  fails.forEach(f => console.log(`  Level ${f.id}: ${f.reason}`));
}
console.log(`VERDICT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
process.exit(fail === 0 ? 0 : 1);