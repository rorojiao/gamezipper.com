// Independent verifier for makaro/levels.json
// Validates, for each level:
//   (1) The stored solution satisfies all room constraints (1..N per room)
//   (2) The stored solution satisfies all arrow clues
//   (3) The stored solution satisfies cross-room adjacency (no equal adj across rooms)
//   (4) The puzzle (givens + arrows) has exactly ONE solution (independent solver)
const fs = require('fs');

function neighbors4(r, c, rows, cols) {
  const out = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
  }
  return out;
}

const DIR_DELTA = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };

// ---- Independent uniqueness solver (MRV backtracking) ----
function countSolutions(level, limit, nodeLimit) {
  limit = limit || 2;
  nodeLimit = nodeLimit || 60000;
  const { rows, cols, rooms, givens, arrows } = level;
  const N = rows * cols;
  const idx = (r, c) => r * cols + c;
  const roomOf = new Array(N);
  const roomSize = rooms.map(r => r.length);
  const roomCells = rooms.map(() => []);
  rooms.forEach((room, ri) => {
    room.forEach(([r, c]) => {
      const i = idx(r, c);
      roomOf[i] = ri;
      roomCells[ri].push(i);
    });
  });
  const cellNb = new Array(N);
  const cellDiffNb = new Array(N);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = idx(r, c);
      const nbs = neighbors4(r, c, rows, cols).map(([nr, nc]) => idx(nr, nc));
      cellNb[i] = nbs;
      cellDiffNb[i] = nbs.filter(j => roomOf[j] !== roomOf[i]);
    }
  }
  const sol = new Array(N).fill(0);
  for (const k in givens) {
    const [r, c] = k.split(',').map(Number);
    sol[idx(r, c)] = givens[k];
  }
  // Validate givens
  for (let ri = 0; ri < rooms.length; ri++) {
    let seen = 0;
    for (const ci of roomCells[ri]) {
      const v = sol[ci];
      if (v) {
        if (v > roomSize[ri] || (seen & (1 << v))) return 0;
        seen |= (1 << v);
      }
    }
  }
  // Arrow preprocessing
  const arrowList = [];
  for (const k in arrows) {
    const [r, c] = k.split(',').map(Number);
    const i = idx(r, c);
    const [dr, dc] = DIR_DELTA[arrows[k]];
    const tr = r + dr, tc = c + dc;
    if (tr < 0 || tr >= rows || tc < 0 || tc >= cols) return 0;
    const tgt = idx(tr, tc);
    arrowList.push({ tgt, nbs: cellNb[i] });
  }
  const cellToArrows = {};
  arrowList.forEach((a, ai) => {
    a.nbs.forEach(nb => {
      if (!cellToArrows[nb]) cellToArrows[nb] = [];
      cellToArrows[nb].push(ai);
    });
  });

  let count = 0, nodes = 0, gaveUp = false;

  function candidates(i) {
    const ri = roomOf[i];
    const n = roomSize[ri];
    let mask = 0;
    for (const ci of roomCells[ri]) if (sol[ci]) mask |= (1 << sol[ci]);
    for (const j of cellDiffNb[i]) if (sol[j]) mask |= (1 << sol[j]);
    const out = [];
    for (let v = 1; v <= n; v++) if (!(mask & (1 << v))) out.push(v);
    return out;
  }
  function arrowViolated(ai) {
    const { tgt, nbs } = arrowList[ai];
    for (const j of nbs) if (sol[j] === 0) return null;
    const tv = sol[tgt];
    for (const j of nbs) if (j !== tgt && sol[j] >= tv) return true;
    return false;
  }
  function pickMRV() {
    let best = -1, bestLen = 999, bestVals = null;
    for (let i = 0; i < N; i++) {
      if (sol[i] === 0) {
        const cv = candidates(i);
        if (cv.length < bestLen) {
          bestLen = cv.length; best = i; bestVals = cv;
          if (bestLen === 0) return [i, cv];
        }
      }
    }
    return [best, bestVals];
  }
  function bt() {
    if (count >= limit || gaveUp) return;
    if (++nodes > nodeLimit) { gaveUp = true; return; }
    const [i, vals] = pickMRV();
    if (i < 0) {
      for (let ai = 0; ai < arrowList.length; ai++) if (arrowViolated(ai)) return;
      count++; return;
    }
    for (const v of vals) {
      sol[i] = v;
      let ok = true;
      const arr = cellToArrows[i];
      if (arr) {
        for (const ai of arr) { if (arrowViolated(ai) === true) { ok = false; break; } }
      }
      if (ok) {
        bt();
        if (count >= limit || gaveUp) { sol[i] = 0; return; }
      }
      sol[i] = 0;
    }
  }
  bt();
  return gaveUp ? -1 : count;
}

function verifySolution(level) {
  const { rows, cols, rooms, arrows, solution } = level;
  // (1) Room constraint: each room size N has exactly 1..N
  for (const room of rooms) {
    const vals = room.map(([r, c]) => solution[r][c]);
    const n = room.length;
    const seen = new Set(vals);
    if (seen.size !== n) return `Room has duplicate/missing values: ${JSON.stringify(vals)}`;
    for (let v = 1; v <= n; v++) {
      if (!seen.has(v)) return `Room missing value ${v} (size ${n})`;
    }
    for (const v of vals) {
      if (v < 1 || v > n) return `Value ${v} out of range for room size ${n}`;
    }
  }
  // Build room lookup
  const roomGrid = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  rooms.forEach((room, ri) => room.forEach(([r, c]) => { roomGrid[r][c] = ri; }));
  // (3) Cross-room adjacency: different rooms, adjacent, cannot share value
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = solution[r][c];
      const ri = roomGrid[r][c];
      for (const [nr, nc] of neighbors4(r, c, rows, cols)) {
        if (roomGrid[nr][nc] !== ri && solution[nr][nc] === v) {
          return `Cross-room adjacency violation at (${r},${c})&(${nr},${nc}): both ${v}`;
        }
      }
    }
  }
  // (2) Arrow clues: arrow points to strictly-max neighbor
  for (const k in arrows) {
    const [r, c] = k.split(',').map(Number);
    const dir = arrows[k];
    const [dr, dc] = DIR_DELTA[dir];
    const tr = r + dr, tc = c + dc;
    const nbs = neighbors4(r, c, rows, cols);
    const tv = solution[tr][tc];
    for (const [nr, nc] of nbs) {
      if ((nr !== tr || nc !== tc) && solution[nr][nc] >= tv) {
        return `Arrow at (${r},${c}) pointing ${dir}: target ${tv} not strictly max (neighbor (${nr},${nc})=${solution[nr][nc]})`;
      }
    }
  }
  return null;
}

function main() {
  const raw = fs.readFileSync(__dirname + '/levels.json', 'utf8');
  const data = JSON.parse(raw);
  const levels = data.levels;
  let pass = 0, fail = 0;
  console.log(`Verifying ${levels.length} Makaro levels...\n`);
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    const tag = `[${i + 1}] ${lvl.tier}/${lvl.name} ${lvl.rows}x${lvl.cols}`;
    // (1)+(2)+(3) solution validity
    const solErr = verifySolution(lvl);
    if (solErr) {
      console.log(`FAIL ${tag}\n     solution: ${solErr}`);
      fail++; continue;
    }
    // (4) uniqueness via independent solver
    const cnt = countSolutions(lvl, 2, 80000);
    if (cnt !== 1) {
      console.log(`FAIL ${tag}\n     uniqueness: expected 1 solution, got ${cnt}`);
      fail++; continue;
    }
    console.log(`PASS ${tag}  (givens=${Object.keys(lvl.givens).length}, arrows=${Object.keys(lvl.arrows).length})`);
    pass++;
  }
  console.log(`\n=== ${pass}/${levels.length} PASSED, ${fail} FAILED ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
