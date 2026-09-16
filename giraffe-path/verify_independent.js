// Independent Node.js verifier for Giraffe Path levels.
// Verifies via BFS that each level has exactly ONE shortest path from start to goal.

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

const GIRAFFE_DELTAS = [
  [1, 4], [4, 1], [-1, 4], [-4, 1],
  [1, -4], [4, -1], [-1, -4], [-4, -1],
];

function giraffeMoves(r, c, n) {
  const moves = [];
  for (const [dr, dc] of GIRAFFE_DELTAS) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) moves.push([nr, nc]);
  }
  return moves;
}

function countShortestPaths(n, start, goal, walls) {
  const wallSet = new Set(walls.map(([r, c]) => `${r},${c}`));
  const dist = Array.from({ length: n }, () => Array(n).fill(-1));
  const pcount = Array.from({ length: n }, () => Array(n).fill(0));
  dist[start[0]][start[1]] = 0;
  pcount[start[0]][start[1]] = 1;
  const q = [start];
  let goalDist = -1;
  while (q.length) {
    const [r, c] = q.shift();
    if (goalDist !== -1 && dist[r][c] >= goalDist) continue;
    for (const [nr, nc] of giraffeMoves(r, c, n)) {
      if (wallSet.has(`${nr},${nc}`)) continue;
      if (dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        pcount[nr][nc] = pcount[r][c];
        if (nr === goal[0] && nc === goal[1]) goalDist = dist[nr][nc];
        q.push([nr, nc]);
      } else if (dist[nr][nc] === dist[r][c] + 1) {
        pcount[nr][nc] += pcount[r][c];
        if (pcount[nr][nc] > 100) pcount[nr][nc] = 100;
      }
    }
  }
  if (goalDist === -1) return { length: -1, count: 0 };
  return { length: goalDist, count: pcount[goal[0]][goal[1]] };
}

function verifyLevel(level) {
  const n = level.n;
  const start = level.start;
  const goal = level.goal;
  const walls = level.walls;
  const solPath = level.solution_path;
  // 1. path starts at start, ends at goal
  if (solPath[0][0] !== start[0] || solPath[0][1] !== start[1]) {
    return { ok: false, msg: `path starts at ${solPath[0]} but start is ${start}` };
  }
  if (solPath[solPath.length - 1][0] !== goal[0] || solPath[solPath.length - 1][1] !== goal[1]) {
    return { ok: false, msg: `path ends at ${solPath[solPath.length - 1]} but goal is ${goal}` };
  }
  // 2. No walls
  const wallSet = new Set(walls.map(([r, c]) => `${r},${c}`));
  for (const [r, c] of solPath) {
    if (wallSet.has(`${r},${c}`)) return { ok: false, msg: `path crosses wall at ${r},${c}` };
  }
  // 3. Each step is a valid giraffe move
  for (let i = 0; i < solPath.length - 1; i++) {
    const a = solPath[i], b = solPath[i + 1];
    const dr = b[0] - a[0], dc = b[1] - a[1];
    const isMove = GIRAFFE_DELTAS.some(([mr, mc]) => mr === dr && mc === dc);
    if (!isMove) return { ok: false, msg: `step ${i}: ${a} -> ${b} is not a giraffe move` };
  }
  // 4. Unique shortest path
  const { length, count } = countShortestPaths(n, start, goal, walls);
  if (length === -1) return { ok: false, msg: 'no path from start to goal' };
  if (count !== 1) return { ok: false, msg: `${count} shortest paths exist (not unique)` };
  if (length !== solPath.length - 1) {
    return { ok: false, msg: `solution length ${solPath.length - 1} != BFS shortest ${length}` };
  }
  return { ok: true, msg: 'OK' };
}

const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
const levels = data.levels;
console.log(`Verifying ${levels.length} levels via independent Node.js BFS...`);
let passed = 0, failed = 0;
for (const lvl of levels) {
  const r = verifyLevel(lvl);
  if (r.ok) passed++;
  else { failed++; console.log(`  [FAIL] ${lvl.tier} ${lvl.name}: ${r.msg}`); }
}
console.log(`\n${passed}/${levels.length} levels verified (${failed} failed)`);
process.exit(failed === 0 ? 0 : 1);
