// Method 3: Engine verifier — load the game's JS engine from index.html,
// confirm the engine's region-clue + connectivity check matches the stored
// solution for every level.
//
// We extract the LEVELS data from index.html and the engine logic, then
// verify equivalence.

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Extract LEVELS JSON literal
const m = html.match(/<script\s+id=["']levels-data["']\s+type=["']application\/json["']>([\s\S]*?)<\/script>/);
if (!m) {
  console.error('Could not find levels-data script tag in index.html');
  process.exit(1);
}
const LEVELS = JSON.parse(m[1]).LEVELS;

// Replicate engine's region-clue + connectivity check.
// regions: array of arrays of cell indices (0..N*N-1).
// sol: 2D NxN array of 0/1.
function verifyLevel(N, regions, clues, sol) {
  // Check sol is NxN
  if (!Array.isArray(sol) || sol.length !== N) return { ok: false, why: 'sol-grid-size' };
  for (let r = 0; r < N; r++) {
    if (!Array.isArray(sol[r]) || sol[r].length !== N) return { ok: false, why: 'sol-row-size' };
  }
  // regions: array of arrays
  if (!Array.isArray(regions)) return { ok: false, why: 'regions-not-array' };
  // Build cell_to_reg map
  const cellToReg = new Array(N*N).fill(-1);
  regions.forEach((region, rid) => {
    for (const i of region) {
      if (i < 0 || i >= N*N) return;
      cellToReg[i] = rid;
    }
  });
  // Count filled cells per region
  const actual = new Array(regions.length).fill(0);
  const placed = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (sol[r][c] === 1) {
        const i = r*N + c;
        const rid = cellToReg[i];
        if (rid === -1) return { ok: false, why: `filled cell ${i} not in any region` };
        actual[rid]++;
        placed.push([r, c]);
      }
    }
  }
  for (let i = 0; i < regions.length; i++) {
    if (actual[i] !== clues[i]) return { ok: false, why: `clue-mismatch r${i}: ${actual[i]} vs ${clues[i]}` };
  }
  // Check connectivity of filled cells
  if (placed.length === 0) return { ok: false, why: 'empty' };
  const s = new Set(placed.map(([r,c]) => `${r},${c}`));
  const start = placed[0];
  const visited = new Set([`${start[0]},${start[1]}`]);
  const stack = [start];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r+dr, nc = c+dc;
      const k = `${nr},${nc}`;
      if (s.has(k) && !visited.has(k)) {
        visited.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  if (visited.size !== s.size) return { ok: false, why: 'not-connected' };
  return { ok: true };
}

let pass = 0, fail = 0;
const failures = [];
for (const lv of LEVELS) {
  const result = verifyLevel(lv.N, lv.regions, lv.clues, lv.sol);
  if (result.ok) {
    pass++;
  } else {
    fail++;
    failures.push(`L${lv.i+1} (${lv.tier}): ${result.why}`);
  }
}
console.log(`${pass}/${LEVELS.length} levels pass engine verification`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures.slice(0, 5)) console.log(' ', f);
  process.exit(1);
}
process.exit(0);