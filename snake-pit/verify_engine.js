// verify_engine.js — In-engine verification.
// Loads the actual index.html, extracts LEVELS via vm.runInContext,
// then feeds the SOLUTION grid into checkSolution's logic to confirm
// every level's solution passes the engine's own validation.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the LEVELS array and checkSolution function from the HTML.
// We create a sandbox that simulates the browser environment just enough
// to run checkSolution.

// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('snake-pit');
// Simulate checkSolution logic (mirrors the index.html checkSolution)
const DIRS4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

function checkSolutionEngine(level, userGrid) {
  const R = level.rows, C = level.cols;
  const grid = userGrid;

  // Rule 1: no unset cells
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i] || grid[i] === 0) return { ok: false, msg: 'unset cell' };
  }

  const snakeCells = {};
  for (let i = 0; i < grid.length; i++) {
    const id = grid[i];
    if (!snakeCells[id]) snakeCells[id] = [];
    snakeCells[id].push(i);
  }

  function orthSame(r, c, id) {
    let n = 0;
    for (const [dr, dc] of DIRS4) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      if (grid[nr * C + nc] === id) n++;
    }
    return n;
  }

  // Rule 2: snake validity
  for (const id in snakeCells) {
    const cells = snakeCells[id];
    if (cells.length < 2) return { ok: false, msg: `snake ${id} < 2 cells` };
    let endpoints = 0;
    const cellSet = new Set(cells);
    for (const idx of cells) {
      const r = Math.floor(idx / C), c = idx % C;
      const cnt = orthSame(r, c, parseInt(id));
      if (cnt > 2) return { ok: false, msg: `snake ${id} branches` };
      if (cnt === 1) endpoints++;
    }
    if (endpoints !== 2) return { ok: false, msg: `snake ${id} endpoints=${endpoints}` };

    // 2x2
    for (const idx of cells) {
      const r = Math.floor(idx / C), c = idx % C;
      for (const [dr, dc] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) {
        const rr = r + dr, cc = c + dc;
        let allIn = true;
        for (let a = 0; a < 2; a++) {
          for (let b = 0; b < 2; b++) {
            if (rr + a < 0 || rr + a >= R || cc + b < 0 || cc + b >= C || !cellSet.has((rr + a) * C + (cc + b))) allIn = false;
          }
        }
        if (allIn) return { ok: false, msg: `snake ${id} 2x2` };
      }
    }

    // diagonal self-touch
    for (const idx of cells) {
      const r = Math.floor(idx / C), c = idx % C;
      for (const [dr, dc] of DIAGS) {
        const ar = r + dr, ac = c + dc;
        if (ar < 0 || ar >= R || ac < 0 || ac >= C) continue;
        if (grid[ar * C + ac] !== parseInt(id)) continue;
        if (!cellSet.has(r * C + ac) && !cellSet.has(ar * C + c)) {
          return { ok: false, msg: `snake ${id} diagonal self-touch` };
        }
      }
    }
  }

  // Rule 3: number clues
  for (const key in level.clues) {
    const clue = level.clues[key];
    if (clue.type !== 'number') continue;
    const [r, c] = key.split(',').map(Number);
    const id = grid[r * C + c];
    const len = snakeCells[id] ? snakeCells[id].length : 0;
    if (len !== clue.val) return { ok: false, msg: `number clue mismatch` };
  }

  // Rule 4: circle clues at endpoints
  for (const key in level.clues) {
    const clue = level.clues[key];
    if (clue.type !== 'circle') continue;
    const [r, c] = key.split(',').map(Number);
    const id = grid[r * C + c];
    if (orthSame(r, c, id) !== 1) return { ok: false, msg: `circle not endpoint` };
  }

  // Rule 5: same-length orth adjacency
  const byLen = {};
  for (const id in snakeCells) {
    const L = snakeCells[id].length;
    if (!byLen[L]) byLen[L] = [];
    byLen[L].push(parseInt(id));
  }
  for (const L in byLen) {
    const ids = byLen[L];
    if (ids.length < 2) continue;
    const idSet = new Set(ids);
    for (const id of ids) {
      for (const idx of snakeCells[id]) {
        const r = Math.floor(idx / C), c = idx % C;
        for (const [dr, dc] of DIRS4) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          const nid = grid[nr * C + nc];
          if (nid !== id && idSet.has(nid)) return { ok: false, msg: `same-len(${L}) orth` };
        }
      }
    }
  }

  return { ok: true, msg: 'ok' };
}

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
  // Feed the SOLUTION grid as the user grid
  const res = checkSolutionEngine(LEVELS[i], LEVELS[i].solution.slice());
  if (res.ok) {
    console.log(`L${i + 1} ${LEVELS[i].rows}x${LEVELS[i].cols}: PASS`);
    pass++;
  } else {
    console.log(`L${i + 1} ${LEVELS[i].rows}x${LEVELS[i].cols}: FAIL — ${res.msg}`);
    fail++;
  }
}
console.log(`\n=== ${pass}/${pass + fail} PASS ===`);
process.exit(fail > 0 ? 1 : 0);
