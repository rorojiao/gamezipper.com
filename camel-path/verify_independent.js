#!/usr/bin/env node
// Independent Node.js verifier for Camel Path levels.
// Reads data.js (window.CAMEL_PATH_DATA), verifies unique shortest camel path.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIRS = [[1,3],[3,1],[1,-3],[3,-1],[-1,3],[-3,1],[-1,-3],[-3,-1]];

// Load data.js in a sandboxed vm context
const dataJs = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataJs, sandbox);
const DATA = sandbox.window.CAMEL_PATH_DATA;
const levels = DATA.levels;

function bfsShortest(n, wallsSet, start, goal) {
  if (start[0] === goal[0] && start[1] === goal[1]) return [0, [start]];
  const sk = (r, c) => `${r},${c}`;
  const visited = new Map();
  visited.set(sk(start[0], start[1]), { parent: null, len: 0 });
  const queue = [[start[0], start[1]]];
  let found = null;
  while (queue.length) {
    const [r, c] = queue.shift();
    const curLen = visited.get(sk(r, c)).len;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (!(nr >= 0 && nr < n && nc >= 0 && nc < n)) continue;
      if (wallsSet.has(sk(nr, nc))) continue;
      if (visited.has(sk(nr, nc))) continue;
      visited.set(sk(nr, nc), { parent: [r, c], len: curLen + 1 });
      if (nr === goal[0] && nc === goal[1]) {
        found = [nr, nc];
        queue.length = 0;
        break;
      }
      queue.push([nr, nc]);
    }
    if (found) break;
  }
  if (!found) return [null, null];
  const path = [];
  let cur = found;
  while (cur) {
    path.push(cur);
    const v = visited.get(sk(cur[0], cur[1]));
    cur = v.parent;
  }
  path.reverse();
  return [visited.get(sk(found[0], found[1])).len, path];
}

function findAllShortest(n, wallsSet, start, goal) {
  if (start[0] === goal[0] && start[1] === goal[1]) return [[start]];
  const sk = (r, c) => `${r},${c}`;
  const visited = new Map();
  const parents = new Map();
  visited.set(sk(start[0], start[1]), 0);
  parents.set(sk(start[0], start[1]), []);
  const layers = [[start]];
  let foundLen = null;
  while (true) {
    const lastLayer = layers[layers.length - 1];
    const nextLayer = [];
    if (lastLayer.length === 0) break;
    for (const [r, c] of lastLayer) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (!(nr >= 0 && nr < n && nc >= 0 && nc < n)) continue;
        if (wallsSet.has(sk(nr, nc))) continue;
        if (!visited.has(sk(nr, nc))) {
          visited.set(sk(nr, nc), visited.get(sk(r, c)) + 1);
          parents.set(sk(nr, nc), [[r, c]]);
          nextLayer.push([nr, nc]);
          if (nr === goal[0] && nc === goal[1]) {
            foundLen = visited.get(sk(nr, nc));
          }
        }
      }
    }
    if (nextLayer.length === 0) break;
    layers.push(nextLayer);
    if (foundLen !== null) break;
  }
  if (foundLen === null) return [];
  const allPaths = [];
  function build(cur, path) {
    if (cur[0] === start[0] && cur[1] === start[1]) {
      allPaths.push([...path.slice().reverse(), cur]);
      return;
    }
    const ps = parents.get(sk(cur[0], cur[1])) || [];
    for (const p of ps) build(p, [cur, ...path]);
  }
  build(goal, []);
  return allPaths;
}

function verifyStoredPath(n, wallsSet, start, goal, storedPath) {
  if (storedPath[0][0] !== start[0] || storedPath[0][1] !== start[1]) return [false, 'start mismatch'];
  if (storedPath[storedPath.length-1][0] !== goal[0] || storedPath[storedPath.length-1][1] !== goal[1]) return [false, 'goal mismatch'];
  for (let i = 0; i < storedPath.length - 1; i++) {
    const [r1, c1] = storedPath[i];
    const [r2, c2] = storedPath[i+1];
    const dr = r2 - r1, dc = c2 - c1;
    const sorted = [Math.abs(dr), Math.abs(dc)].sort((a,b) => a-b);
    if (sorted[0] !== 1 || sorted[1] !== 3) return [false, `invalid camel step ${JSON.stringify(storedPath[i])} -> ${JSON.stringify(storedPath[i+1])}`];
    if (wallsSet.has(`${r2},${c2}`)) return [false, `wall at ${r2},${c2}`];
  }
  return [true, 'OK'];
}

let passed = 0, failed = 0;
for (const lv of levels) {
  const n = lv.n;
  const start = lv.start;
  const goal = lv.goal;
  const wallsSet = new Set(lv.walls.map(([r,c]) => `${r},${c}`));
  const storedPath = lv.solution_path.map(p => [p[0], p[1]]);
  if (wallsSet.has(`${start[0]},${start[1]}`) || wallsSet.has(`${goal[0]},${goal[1]}`)) {
    console.log(`  ❌ L${lv.id}: start/goal in walls`); failed++; continue;
  }
  const [valid, reason] = verifyStoredPath(n, wallsSet, start, goal, storedPath);
  if (!valid) { console.log(`  ❌ L${lv.id}: stored path INVALID: ${reason}`); failed++; continue; }
  const [length, path] = bfsShortest(n, wallsSet, start, goal);
  if (length === null) { console.log(`  ❌ L${lv.id}: NO path`); failed++; continue; }
  if (storedPath.length - 1 !== length) { console.log(`  ❌ L${lv.id}: stored len ${storedPath.length-1} != shortest ${length}`); failed++; continue; }
  const allPaths = findAllShortest(n, wallsSet, start, goal);
  if (allPaths.length !== 1) { console.log(`  ❌ L${lv.id}: ${allPaths.length} shortest paths (not unique)`); failed++; continue; }
  passed++;
}

console.log(`\n=== NODE INDEPENDENT VERIFY: ${passed}/${levels.length} PASS, ${failed} FAIL ===`);
process.exit(failed === 0 ? 0 : 1);