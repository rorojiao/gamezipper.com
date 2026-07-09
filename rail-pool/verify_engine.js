// verify_engine.js — verify using the game's actual logic by loading HTML
// Extracts LEVELS_DATA from the index.html and verifies each level's loop.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS_DATA
const m = html.match(/const LEVELS_DATA = (\{[\s\S]*?\});/);
if (!m) {
  console.error('Could not find LEVELS_DATA in index.html');
  process.exit(1);
}

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(`LEVELS_DATA = ${m[1]};`, sandbox);
const LEVELS_DATA = sandbox.LEVELS_DATA;

const N = 'N', E = 'E', S = 'S', W = 'W';
const OPPOSITE = { N: S, S: N, E: W, W: E };
const DELTA = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

function inBounds(r, c, R, C) {
  return r >= 0 && r < R && c >= 0 && c < C;
}

// Same as the engine's computeSegments
function computeSegments(path, R, C, solEntry, solExit) {
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
    else dir = null;
    if (prevDir === null) {
      prevDir = dir;
    }
    if (dir === prevDir) {
      current.push([cr, cc]);
    } else {
      if (current.length >= 2) segments.push(current);
      current = [[cr, cc]];
      prevDir = dir;
    }
  }
  // Wrap-around check
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
      // First push current (does NOT include path[0])
      if (current.length >= 2) segments.push(current);
      // Then build wrapSeg starting from path[0] in wrap direction
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
        else nd = null;
        if (nd === d) wrapSeg.push([cr, cc]);
        else break;
      }
      if (wrapSeg.length >= 2) segments.push(wrapSeg);
    } else {
      if (current.length >= 2) segments.push(current);
    }
  } else {
    if (current.length >= 2) segments.push(current);
  }
  return segments;
}

function verifyLevel(lvl) {
  const [R, C] = lvl.size;
  const solEntry = lvl.solution_entry;
  const solExit  = lvl.solution_exit;
  const regions = lvl.regions;
  const clues = lvl.clues;

  // Walk from (0,0)
  let cr = 0, cc = 0;
  const path = [];
  const visited = new Set();
  for (let i = 0; i < R * C * 4; i++) {
    if (visited.has(cr + ',' + cc)) break;
    visited.add(cr + ',' + cc);
    path.push([cr, cc]);
    const exit = solExit[cr][cc];
    if (!exit) break;
    const [dr, dc] = DELTA[exit];
    if (!inBounds(cr + dr, cc + dc, R, C)) {
      return { valid: false, error: `Exit ${exit} from (${cr},${cc}) leaves grid` };
    }
    cr += dr; cc += dc;
  }

  if (path.length !== R * C) {
    return { valid: false, error: `Path covers ${path.length}/${R*C} cells` };
  }
  if (!(cr === 0 && cc === 0)) {
    return { valid: false, error: `Loop did not close (ended at ${cr},${cc})` };
  }

  const segments = computeSegments(path, R, C, solEntry, solExit);

  for (const clue of clues) {
    const clueRid = regions[clue.r][clue.c];
    const validLens = new Set();
    for (const seg of segments) {
      const rids = new Set(seg.map(([r, c]) => regions[r][c]));
      if (rids.size === 1) {
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
          error: `Clue (${clue.r},${clue.c}) = ${v} not satisfied in region ${clueRid} (segments: ${[...validLens].join(',')})`,
        };
      }
    }
  }

  return { valid: true, segmentCount: segments.length, pathLength: path.length };
}

const levels = LEVELS_DATA.levels;
let pass = 0, fail = 0;
for (let i = 0; i < levels.length; i++) {
  const r = verifyLevel(levels[i]);
  if (r.valid) {
    pass++;
    console.log(`  Level ${levels[i].number} (${levels[i].tier}): VALID (${r.segmentCount} segments)`);
  } else {
    fail++;
    console.log(`  Level ${levels[i].number} (${levels[i].tier}): INVALID - ${r.error}`);
  }
}
console.log(`\n${pass}/${levels.length} levels passed in-engine verification`);
process.exit(fail > 0 ? 1 : 0);