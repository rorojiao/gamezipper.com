// Independent Node.js Koburin verifier — reimplements rules from scratch.
// Does NOT load the game HTML; reads levels.json directly.
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const levels = data.levels;

function neighbors4(r, c, R, C) {
  const out = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([nr, nc]);
  }
  return out;
}

function verifyLevel(lvl) {
  const R = lvl.R, C = lvl.C;
  const blacks = new Set(lvl.blacks.map(b => b.join(',')));
  const clues = {};
  for (const [k, v] of Object.entries(lvl.clues)) clues[k] = v;
  const loop = lvl.solution_loop.map(c => c.join(','));

  // 1. blacks: no two orth-adjacent
  for (const bk of blacks) {
    const [r, c] = bk.split(',').map(Number);
    for (const [nr, nc] of neighbors4(r, c, R, C)) {
      if (blacks.has(`${nr},${nc}`)) return { ok: false, reason: `adjacent blacks ${bk} ${nr},${nc}` };
    }
  }

  // 2. clues not on black
  for (const k of Object.keys(clues)) {
    if (blacks.has(k)) return { ok: false, reason: `clue on black ${k}` };
  }

  // 3. clue values correct
  for (const [k, expected] of Object.entries(clues)) {
    const [r, c] = k.split(',').map(Number);
    let cnt = 0;
    for (const [nr, nc] of neighbors4(r, c, R, C)) {
      if (blacks.has(`${nr},${nc}`)) cnt++;
    }
    if (cnt !== expected) return { ok: false, reason: `clue ${k}=${expected} actual ${cnt}` };
  }

  // 4. loop is a valid Hamiltonian cycle on (all cells - blacks)
  //    Clue cells ARE on the loop (simplified-valid Koburin variant).
  const whiteCells = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const k = `${r},${c}`;
      if (!blacks.has(k)) whiteCells.push(k);  // includes clue cells
    }
  }
  const whiteSet = new Set(whiteCells);
  if (loop.length !== whiteCells.length) {
    return { ok: false, reason: `loop length ${loop.length} != white cells ${whiteCells.length}` };
  }
  const loopSet = new Set(loop);
  for (const wc of whiteCells) {
    if (!loopSet.has(wc)) return { ok: false, reason: `white cell ${wc} not in loop` };
  }
  if (loopSet.size !== loop.length) return { ok: false, reason: 'loop has duplicates' };

  // check consecutive adjacency + cycle closure
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    const [ar, ac] = a.split(',').map(Number);
    const [br, bc] = b.split(',').map(Number);
    if (Math.abs(ar - br) + Math.abs(ac - bc) !== 1) {
      return { ok: false, reason: `non-adjacent loop cells ${a} -> ${b} at index ${i}` };
    }
  }

  // 5. (clue cells are on the loop in this variant — no extra check needed)
  return { ok: true };
}

let pass = 0, fail = 0;
for (const lvl of levels) {
  const result = verifyLevel(lvl);
  if (result.ok) {
    pass++;
  } else {
    fail++;
    console.log(`L${lvl.id} (${lvl.tier}): FAIL — ${result.reason}`);
  }
}
console.log(`\nResult: ${pass}/${levels.length} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
