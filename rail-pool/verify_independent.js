// verify_independent.js — independent Node.js BFS verifier for Rail Pool
// Re-implements the puzzle rules from scratch to confirm each level has a valid solution.

const fs = require('fs');

const N = 'N', E = 'E', S = 'S', W = 'W';
const OPPOSITE = { N: S, S: N, E: W, W: E };
const DELTA = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

function inBounds(r, c, R, C) {
  return r >= 0 && r < R && c >= 0 && c < C;
}

// Verify a level: build a valid loop visiting every cell, check clues
function verifyLevel(lvl) {
  const [R, C] = lvl.size;
  const regions = lvl.regions;
  const clues = lvl.clues;
  const solEntry = lvl.solution_entry;
  const solExit  = lvl.solution_exit;

  // Find a cell where the entry/exit defines a valid edge traversal. We'll just try
  // walking from each cell and see if we return to it after R*C steps.
  let startR = -1, startC = -1;
  // Try starting from (0,0)
  startR = 0; startC = 0;

  // Walk the loop from start. At each cell, follow the EXIT edge.
  const visited = new Set();
  const path = [];
  let cr = startR, cc = startC;
  let stepCount = 0;
  const maxSteps = R * C * 4;

  while (stepCount < maxSteps) {
    const key = `${cr},${cc}`;
    if (visited.has(key)) {
      // Loop closure check
      if (path.length === R * C && cr === startR && cc === startC) {
        break; // closed
      }
      return { valid: false, error: `Self-intersection at (${cr},${cc}) after ${path.length} cells (need ${R*C})` };
    }
    visited.add(key);
    path.push([cr, cc]);

    const exit = solExit[cr][cc];
    if (!exit || exit === null) {
      if (path.length < R * C) {
        return { valid: false, error: `Dead end at (${cr},${cc}) after ${path.length}/${R*C} cells` };
      }
      break;
    }
    const [dr, dc] = DELTA[exit];
    const nr = cr + dr, nc = cc + dc;
    if (!inBounds(nr, nc, R, C)) {
      return { valid: false, error: `Exit ${exit} from (${cr},${cc}) leaves grid` };
    }
    cr = nr; cc = nc;
    stepCount++;
  }

  if (path.length !== R * C) {
    return { valid: false, error: `Path covers ${path.length}/${R*C} cells` };
  }

  // Compute segments
  const segments = computeSegments(path, R, C, solEntry, solExit);

  // For each clue, verify at least one segment in the same region has that length
  for (const clue of clues) {
    const clueRid = regions[clue.r][clue.c];
    const validLens = new Set();
    for (const seg of segments) {
      const rids = new Set(seg.map(([r, c]) => regions[r][c]));
      if (rids.size === 1 && seg[0]) {
        const rid = regions[seg[0][0]][seg[0][1]];
        if (rid === clueRid) {
          validLens.add(seg.length);
        }
      }
    }
    for (const v of clue.vals) {
      if (!validLens.has(v)) {
        return {
          valid: false,
          error: `Clue (${clue.r},${clue.c}) = ${v} not satisfied (region ${clueRid} segments: ${[...validLens].join(',')})`,
        };
      }
    }
  }

  return { valid: true, segmentCount: segments.length, pathLength: path.length };
}

function computeSegments(path, R, C, solEntry, solExit) {
  // Walk the path, splitting at direction changes
  const segments = [];
  if (path.length < 2) return segments;
  let current = [path[0]];
  let prevDir = null;
  for (let i = 1; i < path.length; i++) {
    const [pr, pc] = path[i-1];
    const [cr, cc] = path[i];
    let dir;
    if (cr === pr + 1) dir = S;
    else if (cr === pr - 1) dir = N;
    else if (cc === pc + 1) dir = E;
    else if (cc === pc - 1) dir = W;
    else return []; // shouldn't happen
    if (i === 1) prevDir = dir;
    if (dir === prevDir) {
      current.push([cr, cc]);
    } else {
      if (current.length >= 2) segments.push(current);
      current = [[cr, cc]];
      prevDir = dir;
    }
  }
  // Final segment
  if (current.length >= 2) segments.push(current);

  // Wrap-around: check if path[last] to path[0] continues the last segment
  if (path.length >= 2) {
    const [lr, lc] = path[path.length - 1];
    const [sr, sc] = path[0];
    let wrapDir;
    if (sr === lr + 1) wrapDir = S;
    else if (sr === lr - 1) wrapDir = N;
    else if (sc === lc + 1) wrapDir = E;
    else if (sc === lc - 1) wrapDir = W;
    else wrapDir = null;
    if (wrapDir === prevDir && segments.length > 0) {
      // Extend last segment
      const last = segments[segments.length - 1];
      // Need to verify last's direction is wrapDir
      // last starts at path[?] — figure out which one
      // Simpler: just merge wraparound segment
      let wrapSeg = [path[0]];
      let d = wrapDir;
      for (let i = 1; i < path.length; i++) {
        const [pr, pc] = path[i-1];
        const [cr, cc] = path[i];
        let nd;
        if (cr === pr + 1) nd = S;
        else if (cr === pr - 1) nd = N;
        else if (cc === pc + 1) nd = E;
        else if (cc === pc - 1) nd = W;
        if (nd === d) wrapSeg.push([cr, cc]);
        else break;
      }
      if (wrapSeg.length >= 2) segments.push(wrapSeg);
    }
  }
  return segments;
}

// ===== Main =====
const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const levels = data.levels;
let pass = 0, fail = 0;
const failures = [];
for (let i = 0; i < levels.length; i++) {
  const r = verifyLevel(levels[i]);
  if (r.valid) {
    pass++;
    console.log(`  Level ${levels[i].number} (${levels[i].tier}): VALID (${r.segmentCount} segments, ${r.pathLength} cells)`);
  } else {
    fail++;
    console.log(`  Level ${levels[i].number} (${levels[i].tier}): INVALID - ${r.error}`);
    failures.push({ num: levels[i].number, error: r.error });
  }
}
console.log(`\n${pass}/${levels.length} levels passed independent verification`);
process.exit(fail > 0 ? 1 : 0);