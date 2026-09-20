// Independent Node.js verifier for Bishop Path levels
// Reads levels.json and verifies each level using bishop slide BFS

const fs = require('fs');

function bfsShortest(n, wallsSet, start, goal) {
  if (start[0] === goal[0] && start[1] === goal[1]) {
    return { length: 0, path: [start] };
  }
  const DIRS = [[-1,-1], [-1,1], [1,-1], [1,1]];
  const visited = new Map();
  const key = (r, c) => `${r},${c}`;
  visited.set(key(start[0], start[1]), { parent: null, len: 0 });
  const queue = [start];
  let found = null;

  while (queue.length > 0) {
    const cur = queue.shift();
    const curLen = visited.get(key(cur[0], cur[1])).len;
    for (const [dr, dc] of DIRS) {
      let step = 1;
      while (true) {
        const nr = cur[0] + dr * step;
        const nc = cur[1] + dc * step;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) break;
        if (wallsSet.has(key(nr, nc))) break;
        const nxtKey = key(nr, nc);
        if (visited.has(nxtKey)) {
          step++;
          continue;
        }
        visited.set(nxtKey, { parent: cur, len: curLen + 1 });
        if (nr === goal[0] && nc === goal[1]) {
          found = [nr, nc];
          queue.length = 0;
          break;
        }
        queue.push([nr, nc]);
        break;
      }
      if (found) break;
    }
    if (found) break;
  }

  if (!found) return { length: null, path: null };

  const path = [];
  let cur = found;
  while (cur !== null) {
    path.push(cur);
    const p = visited.get(key(cur[0], cur[1])).parent;
    cur = p;
  }
  path.reverse();
  return { length: visited.get(key(found[0], found[1])).len, path };
}

function findAllShortest(n, wallsSet, start, goal) {
  if (start[0] === goal[0] && start[1] === goal[1]) {
    return [[start]];
  }
  const DIRS = [[-1,-1], [-1,1], [1,-1], [1,1]];
  const visited = new Map();
  const parents = new Map();
  const key = (r, c) => `${r},${c}`;
  visited.set(key(start[0], start[1]), 0);
  parents.set(key(start[0], start[1]), []);
  let layers = [[start]];
  let foundLen = null;

  while (true) {
    const lastLayer = layers[layers.length - 1];
    const nextLayer = [];
    if (lastLayer.length === 0) break;
    for (const cur of lastLayer) {
      for (const [dr, dc] of DIRS) {
        let step = 1;
        while (true) {
          const nr = cur[0] + dr * step;
          const nc = cur[1] + dc * step;
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) break;
          if (wallsSet.has(key(nr, nc))) break;
          const nxtKey = key(nr, nc);
          if (!visited.has(nxtKey)) {
            visited.set(nxtKey, visited.get(key(cur[0], cur[1])) + 1);
            parents.set(nxtKey, [cur]);
            nextLayer.push([nr, nc]);
            if (nr === goal[0] && nc === goal[1]) {
              foundLen = visited.get(nxtKey);
            }
            break;
          } else {
            step++;
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
  function buildPaths(cur, path) {
    if (cur[0] === start[0] && cur[1] === start[1]) {
      allPaths.push([...path, cur].reverse());
      return;
    }
    const ps = parents.get(key(cur[0], cur[1])) || [];
    for (const p of ps) {
      buildPaths(p, [...path, cur]);
    }
  }
  buildPaths(goal, []);
  return allPaths;
}

function verifyStoredPath(n, wallsSet, start, goal, storedPath) {
  if (storedPath[0][0] !== start[0] || storedPath[0][1] !== start[1]) return { ok: false, reason: 'start mismatch' };
  if (storedPath[storedPath.length - 1][0] !== goal[0] || storedPath[storedPath.length - 1][1] !== goal[1]) return { ok: false, reason: 'goal mismatch' };
  for (let i = 0; i < storedPath.length - 1; i++) {
    const [r1, c1] = storedPath[i];
    const [r2, c2] = storedPath[i + 1];
    const dr = r2 - r1;
    const dc = c2 - c1;
    if (Math.abs(dr) !== Math.abs(dc) || dr === 0) {
      return { ok: false, reason: `non-diagonal step ${JSON.stringify(storedPath[i])} -> ${JSON.stringify(storedPath[i+1])}` };
    }
    const sr = dr > 0 ? 1 : -1;
    const sc = dc > 0 ? 1 : -1;
    const steps = Math.abs(dr);
    for (let s = 1; s < steps; s++) {
      const cr = r1 + sr * s;
      const cc = c1 + sc * s;
      if (wallsSet.has(`${cr},${cc}`)) {
        return { ok: false, reason: `wall at (${cr},${cc}) between cells` };
      }
    }
  }
  return { ok: true, reason: 'OK' };
}

function main() {
  const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
  const levels = data.levels;
  console.log(`Verifying ${levels.length} Bishop Path levels (Node.js independent)...\n`);

  let passed = 0, failed = 0;

  for (const lv of levels) {
    const n = lv.n;
    const start = lv.start;
    const goal = lv.goal;
    const wallsSet = new Set(lv.walls.map(w => `${w[0]},${w[1]}`));
    const storedPath = lv.solution_path;

    if (wallsSet.has(`${start[0]},${start[1]}`) || wallsSet.has(`${goal[0]},${goal[1]}`)) {
      console.log(`  ❌ L${lv.id}: start/goal in walls`);
      failed++;
      continue;
    }

    const validity = verifyStoredPath(n, wallsSet, start, goal, storedPath);
    if (!validity.ok) {
      console.log(`  ❌ L${lv.id}: stored path INVALID: ${validity.reason}`);
      failed++;
      continue;
    }

    const r1 = bfsShortest(n, wallsSet, start, goal);
    if (r1.length === null) {
      console.log(`  ❌ L${lv.id}: NO path from ${start} to ${goal}`);
      failed++;
      continue;
    }

    if (storedPath.length - 1 !== r1.length) {
      console.log(`  ❌ L${lv.id}: stored len ${storedPath.length - 1} != shortest ${r1.length}`);
      failed++;
      continue;
    }

    const allPaths = findAllShortest(n, wallsSet, start, goal);
    if (allPaths.length !== 1) {
      console.log(`  ❌ L${lv.id}: ${allPaths.length} shortest paths (not unique)`);
      failed++;
      continue;
    }

    const storedSet = new Set(storedPath.map(p => `${p[0]},${p[1]}`));
    const canonicalSet = new Set(allPaths[0].map(p => `${p[0]},${p[1]}`));
    if (storedSet.size !== canonicalSet.size || ![...storedSet].every(x => canonicalSet.has(x))) {
      console.log(`  ❌ L${lv.id}: stored path differs from canonical`);
      failed++;
      continue;
    }

    passed++;
  }

  console.log();
  console.log(`RESULT: ${passed}/${levels.length} PASS, ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
