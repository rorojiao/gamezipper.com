// Independent Node.js verifier for pentomino/levels.json
// Different implementation from gen.py — re-validates that each stored solution
// (a) uses each listed piece exactly once,
// (b) each piece's cells form a valid orientation of that pentomino,
// (c) cells exactly tile (rows*cols - blocks) cells with no overlaps.

const fs = require('fs');

// Canonical pentominoes (cells as [r,c]) — defined independently here
const BASE = {
  F: [[0,1],[1,0],[1,1],[1,2],[2,2]],
  I: [[0,0],[1,0],[2,0],[3,0],[4,0]],
  L: [[0,0],[1,0],[2,0],[3,0],[3,1]],
  N: [[0,1],[1,1],[2,0],[2,1],[3,0]],
  P: [[0,0],[0,1],[1,0],[1,1],[2,0]],
  T: [[0,0],[0,1],[0,2],[1,1],[2,1]],
  U: [[0,0],[0,2],[1,0],[1,1],[1,2]],
  V: [[0,0],[1,0],[2,0],[2,1],[2,2]],
  W: [[0,0],[1,0],[1,1],[2,1],[2,2]],
  X: [[0,1],[1,0],[1,1],[1,2],[2,1]],
  Y: [[0,1],[1,0],[1,1],[2,1],[3,1]],
  Z: [[0,0],[0,1],[1,1],[2,1],[2,2]],
};

function norm(cells) {
  const mr = Math.min(...cells.map(c=>c[0]));
  const mc = Math.min(...cells.map(c=>c[1]));
  return cells.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}
function key(cells) { return cells.map(c=>c.join(',')).join('|'); }
function rot(cells){ return cells.map(([r,c])=>[c,-r]); }
function flip(cells){ return cells.map(([r,c])=>[r,-c]); }

function allOrientations(cells) {
  const seen = new Set();
  const out = [];
  const variants = [cells, flip(cells)];
  for (const v of variants) {
    let cur = v;
    for (let i=0;i<4;i++) {
      const n = norm(cur);
      const k = key(n);
      if (!seen.has(k)) { seen.add(k); out.push(n); }
      cur = rot(cur);
    }
  }
  return out;
}

const ORI = {};
for (const [L,C] of Object.entries(BASE)) ORI[L] = allOrientations(C);

// Build set of valid piece signatures per letter
const VALID_SIGS = {};
for (const [L, oris] of Object.entries(ORI)) {
  VALID_SIGS[L] = new Set(oris.map(key));
}

function verify(level) {
  const errors = [];
  const { rows, cols, pieces, blocks, solution } = level;
  // 1. Each listed piece must be in solution
  for (const L of pieces) {
    if (!solution[L]) errors.push(`missing piece ${L} in solution`);
  }
  for (const L of Object.keys(solution)) {
    if (!pieces.includes(L)) errors.push(`extra piece ${L} in solution`);
  }
  // 2. Each piece's cells must form a valid orientation
  for (const [L, cells] of Object.entries(solution)) {
    if (cells.length !== 5) errors.push(`${L}: ${cells.length} cells (need 5)`);
    const n = norm(cells.map(c=>[c[0],c[1]]));
    if (!VALID_SIGS[L].has(key(n))) {
      errors.push(`${L}: cells ${key(cells)} not a valid orientation`);
    }
    // Cells on-board
    for (const [r,c] of cells) {
      if (r<0||r>=rows||c<0||c>=cols) errors.push(`${L}: cell (${r},${c}) off-board`);
    }
  }
  // 3. No overlaps & complete coverage
  const allCells = new Map();
  for (const [L, cells] of Object.entries(solution)) {
    for (const [r,c] of cells) {
      const k = `${r},${c}`;
      if (allCells.has(k)) errors.push(`overlap at (${r},${c}): ${allCells.get(k)} & ${L}`);
      else allCells.set(k, L);
    }
  }
  // Compute expected free cells
  const blockSet = new Set(blocks.map(b=>`${b[0]},${b[1]}`));
  const expected = rows*cols - blockSet.size;
  if (allCells.size !== expected) {
    errors.push(`coverage: ${allCells.size} cells covered, expected ${expected}`);
  }
  // Verify no solution cell is a blocked cell
  for (const [k,L] of allCells) {
    if (blockSet.has(k)) errors.push(`${L} covers blocked cell (${k})`);
  }
  return errors;
}

const data = JSON.parse(fs.readFileSync('pentomino/levels.json','utf8'));
console.log(`Verifying ${data.count} levels (independent Node.js verifier)...`);
let pass = 0, fail = 0;
for (const L of data.levels) {
  const errs = verify(L);
  if (errs.length === 0) {
    pass++;
    if (process.env.VERBOSE) console.log(`  ✓ L${String(L.id).padStart(2,'0')} ${L.tier.padEnd(8)} ${L.rows}x${L.cols} pieces=${L.pieces.join(',')}`);
  } else {
    fail++;
    console.log(`  ✗ L${String(L.id).padStart(2,'0')} ${L.tier} — ${errs.length} errors:`);
    errs.forEach(e=>console.log(`      ${e}`));
  }
}
console.log(`\nResult: ${pass}/${data.count} levels VALID, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
