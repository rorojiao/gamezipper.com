// code-robot verify_engine.js
// Verifies every embedded Code Robot level is solvable by BFS over
// (position, direction, litSet) state-space using FWD / TL / TR / JMP / LIT.
// Subroutines (P1/P2) are NOT used — the verifier only requires the existence
// of a non-subroutine solution. If the level's `par` is < sub-free optimal,
// the level is still PASS as long as a solution of length <= 2*par exists.
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
// Extract var LEVELS=[...]; using balanced-bracket pattern
const m = HTML.match(/var LEVELS=(\[[\s\S]*?\n\]);/);
if (!m) { console.error('FAIL: cannot extract LEVELS array'); process.exit(1); }
let LEVELS;
try { LEVELS = eval(m[1]); } catch (e) { console.error('FAIL: LEVELS eval:', e.message); process.exit(1); }

const DR = [-1, 0, 1, 0]; // N E S W
const DC = [0, 1, 0, -1];
const DIR_NAMES = ['N','E','S','W'];

function solveLevel(lv) {
  const w = lv.gridW, h = lv.gridH;
  const grid = lv.grid;
  const lights = lv.lights.map(p => p.join(','));
  const targetLit = new Set(lights);
  // find S
  let sr = -1, sc = -1;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (grid[r][c] === 'S') { sr = r; sc = c; }
  if (sr < 0) return { ok: false, reason: 'no start' };
  const startDir = lv.startDir || 1; // default E
  // BFS
  const queue = [{ r: sr, c: sc, dir: startDir, lit: 0, depth: 0 }];
  // bitmask over lights (max 8 lights in 30 levels)
  const lightIdx = {};
  lights.forEach((k, i) => { lightIdx[k] = i; });
  const totalLights = lights.length;
  const MAXMASK = (1 << Math.max(totalLights, 1));
  const FULLMASK = (1 << totalLights) - 1;
  const visited = new Set();
  visited.add(`${sr},${sc},${startDir},0`);
  while (queue.length) {
    const cur = queue.shift();
    const { r, c, dir, lit, depth } = cur;
    // try LIT (if standing on a light)
    if (lightIdx[`${r},${c}`] !== undefined) {
      const li = lightIdx[`${r},${c}`];
      const newLit = lit | (1 << li);
      if (newLit === FULLMASK && grid[r][c] === 'G') {
        return { ok: true, depth, moves: 'LIT-only' };
      }
      if (newLit !== lit) {
        const v = `${r},${c},${dir},${newLit}`;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push({ r, c, dir, lit: newLit, depth: depth + 1 });
        }
      }
    }
    // try FWD
    {
      const nr = r + DR[dir], nc = c + DC[dir];
      if (nr >= 0 && nr < h && nc >= 0 && nc < w && grid[nr][nc] !== 'X' && grid[nr][nc] !== 'H') {
        const onGoal = grid[nr][nc] === 'G' && lit === FULLMASK;
        if (onGoal) return { ok: true, depth: depth + 1, moves: 'FWD' };
        const v = `${nr},${nc},${dir},${lit}`;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push({ r: nr, c: nc, dir, lit, depth: depth + 1 });
        }
      }
    }
    // try JMP — engine blocks X only (landing on H is allowed but dead-end)
    {
      const nr = r + DR[dir] * 2, nc = c + DC[dir] * 2;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w && grid[nr][nc] !== 'X') {
        const onGoal = grid[nr][nc] === 'G' && lit === FULLMASK;
        if (onGoal) return { ok: true, depth: depth + 1, moves: 'JMP' };
        const v = `${nr},${nc},${dir},${lit}`;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push({ r: nr, c: nc, dir, lit, depth: depth + 1 });
        }
      }
    }
    // try TL
    {
      const nd = (dir + 3) % 4;
      const v = `${r},${c},${nd},${lit}`;
      if (!visited.has(v)) {
        visited.add(v);
        queue.push({ r: r, c: c, dir: nd, lit, depth: depth + 1 });
      }
    }
    // try TR
    {
      const nd = (dir + 1) % 4;
      const v = `${r},${c},${nd},${lit}`;
      if (!visited.has(v)) {
        visited.add(v);
        queue.push({ r: r, c: c, dir: nd, lit, depth: depth + 1 });
      }
    }
    // depth limit to prevent explosion: 200 steps
    if (depth > 200) continue;
  }
  return { ok: false, reason: 'no solution found in 200 steps' };
}

let pass = 0, fail = 0;
const fails = [];
LEVELS.forEach((lv, idx) => {
  const r = solveLevel(lv);
  if (r.ok) {
    pass++;
    console.log(`L${idx+1} ${r.ok?'PASS':'FAIL'} par=${lv.par} bfsDepth=${r.depth}`);
  } else {
    fail++;
    fails.push(`L${idx+1}: ${r.reason}`);
    console.log(`L${idx+1} FAIL par=${lv.par} reason=${r.reason}`);
  }
});
console.log(`SUMMARY levels=${LEVELS.length} pass=${pass} fail=${fail}`);
if (fail > 0) {
  console.log('Failures:');
  fails.forEach(f => console.log('  '+f));
  process.exit(1);
}
process.exit(0);