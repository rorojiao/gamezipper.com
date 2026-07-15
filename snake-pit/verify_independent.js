// verify_independent.js — Independent Node.js Snake Pit level verifier.
// Loads levels.json, reconstructs snakes from solution grid, and verifies
// all 5 Carl Worth rules. Does NOT load index.html.

const fs = require('fs');

const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const DIRS4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

function snakesFromGrid(grid, R, C) {
  const byId = {};
  for (let i = 0; i < grid.length; i++) {
    const id = grid[i];
    if (!byId[id]) byId[id] = [];
    byId[id].push([Math.floor(i / C), i % C]);
  }
  return byId;
}

function verify(level) {
  const R = level.rows, C = level.cols;
  const grid = level.solution;
  const snakes = snakesFromGrid(grid, R, C);
  const clues = level.clues;

  // Rule 1: full tiling, no zero cells
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i] || grid[i] === 0) return { ok: false, msg: 'unset cell' };
  }

  // Rule 2: each snake is a valid one-cell-wide simple path
  const cellMap = {}; // "r,c" -> id
  for (const id in snakes) {
    for (const [r, c] of snakes[id]) cellMap[r + ',' + c] = parseInt(id);
  }

  for (const id in snakes) {
    const cells = snakes[id];
    if (cells.length < 2) return { ok: false, msg: `snake ${id} too short` };
    const cellSet = new Set(cells.map(([r, c]) => r + ',' + c));

    // degree check + endpoints
    let endpoints = 0;
    for (const [r, c] of cells) {
      let deg = 0;
      for (const [dr, dc] of DIRS4) {
        if (cellSet.has((r + dr) + ',' + (c + dc))) deg++;
      }
      if (deg > 2) return { ok: false, msg: `snake ${id} branches at ${r},${c}` };
      if (deg === 1) endpoints++;
    }
    if (endpoints !== 2) return { ok: false, msg: `snake ${id} endpoints=${endpoints}` };

    // 2x2 check
    for (const [r, c] of cells) {
      for (const [dr, dc] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) {
        const rr = r + dr, cc = c + dc;
        let allIn = true;
        for (let a = 0; a < 2; a++) {
          for (let b = 0; b < 2; b++) {
            const key = (rr + a) + ',' + (cc + b);
            if (!cellSet.has(key)) allIn = false;
          }
        }
        if (allIn) return { ok: false, msg: `snake ${id} 2x2 at ${r},${c}` };
      }
    }

    // diagonal self-touch
    for (const [r, c] of cells) {
      for (const [dr, dc] of DIAGS) {
        const ar = r + dr, ac = c + dc;
        if (cellSet.has(ar + ',' + ac)) {
          if (!cellSet.has(r + ',' + ac) && !cellSet.has(ar + ',' + c)) {
            return { ok: false, msg: `snake ${id} diagonal self-touch at ${r},${c}` };
          }
        }
      }
    }
  }

  // Rule 3: number clues — clue N means snake length = N
  for (const key in clues) {
    const clue = clues[key];
    if (clue.type !== 'number') continue;
    const [r, c] = key.split(',').map(Number);
    const id = grid[r * C + c];
    const len = snakes[id] ? snakes[id].length : 0;
    if (len !== clue.val) return { ok: false, msg: `number clue ${clue.val} at ${r},${c} but snake len=${len}` };
  }

  // Rule 4: circle clues at endpoints (exactly 1 same-snake orth neighbour)
  for (const key in clues) {
    const clue = clues[key];
    if (clue.type !== 'circle') continue;
    const [r, c] = key.split(',').map(Number);
    const id = grid[r * C + c];
    const cellSet = new Set(snakes[id].map(([rr, cc]) => rr + ',' + cc));
    let cnt = 0;
    for (const [dr, dc] of DIRS4) {
      if (cellSet.has((r + dr) + ',' + (c + dc))) cnt++;
    }
    if (cnt !== 1) return { ok: false, msg: `circle at ${r},${c} not endpoint (neighbours=${cnt})` };
  }

  // Rule 5: same-length snakes not orth-adjacent
  const byLen = {};
  for (const id in snakes) {
    const L = snakes[id].length;
    if (!byLen[L]) byLen[L] = [];
    byLen[L].push(parseInt(id));
  }
  for (const L in byLen) {
    const ids = byLen[L];
    if (ids.length < 2) continue;
    const idSet = new Set(ids);
    for (const id of ids) {
      for (const [r, c] of snakes[id]) {
        for (const [dr, dc] of DIRS4) {
          const nbId = cellMap[(r + dr) + ',' + (c + dc)];
          if (nbId !== undefined && nbId !== id && idSet.has(nbId)) {
            return { ok: false, msg: `same-length(${L}) snakes ${id} & ${nbId} orth-adjacent` };
          }
        }
      }
    }
  }

  return { ok: true, msg: 'ok' };
}

let pass = 0, fail = 0;
for (let i = 0; i < levels.length; i++) {
  const res = verify(levels[i]);
  if (res.ok) {
    console.log(`L${i + 1} ${levels[i].rows}x${levels[i].cols}: PASS`);
    pass++;
  } else {
    console.log(`L${i + 1} ${levels[i].rows}x${levels[i].cols}: FAIL — ${res.msg}`);
    fail++;
  }
}
console.log(`\n=== ${pass}/${pass + fail} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
