#!/usr/bin/env node
/**
 * Zebra Path — Independent Node.js verification.
 * Re-implements the zebra (2,3) leaper BFS from scratch (no shared code with gen_levels.py).
 * Validates each level has a unique shortest zebra path.
 */

const fs = require('fs');

const DIRS = [[2,3],[3,2],[2,-3],[3,-2],[-2,3],[-3,2],[-2,-3],[-3,-2]];

function bfsShortest(n, wallsSet, start, goal) {
  if (start[0] === goal[0] && start[1] === goal[1]) return { length: 0, path: [start] };
  const visited = new Map();
  visited.set(start.join(','), { parent: null, len: 0 });
  const queue = [start];
  let found = null;
  while (queue.length) {
    const cur = queue.shift();
    const curLen = visited.get(cur.join(','));
    for (const [dr, dc] of DIRS) {
      const nr = cur[0] + dr, nc = cur[1] + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const key = nr + ',' + nc;
      if (wallsSet.has(key)) continue;
      if (visited.has(key)) continue;
      visited.set(key, { parent: cur, len: curLen.len + 1 });
      if (nr === goal[0] && nc === goal[1]) { found = [nr, nc]; queue.length = 0; break; }
      queue.push([nr, nc]);
    }
    if (found) break;
  }
  if (!found) return null;
  const path = [];
  let cur = found;
  while (cur) {
    path.push(cur);
    cur = visited.get(cur.join(','))?.parent;
  }
  return { length: visited.get(found.join(',')).len, path: path.reverse() };
}

function findAllShortest(n, wallsSet, start, goal) {
  if (start[0] === goal[0] && start[1] === goal[1]) return [[start]];
  const visited = new Map();
  const parents = new Map();
  visited.set(start.join(','), 0);
  parents.set(start.join(','), []);
  const layers = [[start]];
  let foundLen = null;
  while (true) {
    const last = layers[layers.length - 1];
    const nxt = [];
    if (!last.length) break;
    for (const cur of last) {
      const curLen = visited.get(cur.join(','));
      for (const [dr, dc] of DIRS) {
        const nr = cur[0] + dr, nc = cur[1] + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        const key = nr + ',' + nc;
        if (wallsSet.has(key)) continue;
        if (!visited.has(key)) {
          visited.set(key, curLen + 1);
          parents.set(key, [cur]);
          nxt.push([nr, nc]);
          if (nr === goal[0] && nc === goal[1]) foundLen = curLen + 1;
        } else if (visited.get(key) === curLen + 1) {
          parents.get(key).push(cur);
        }
      }
    }
    if (!nxt.length) break;
    layers.push(nxt);
    if (foundLen !== null) break;
  }
  if (foundLen === null) return [];
  const allPaths = [];
  function build(cur, path) {
    if (cur[0] === start[0] && cur[1] === start[1]) {
      allPaths.push([...path, cur].reverse());
      return;
    }
    for (const p of parents.get(cur.join(',')) || []) {
      build(p, [...path, cur]);
    }
  }
  build(goal, []);
  return allPaths;
}

function main() {
  const data = JSON.parse(fs.readFileSync('levels.json', 'utf-8'));
  const levels = data.levels;
  let passCount = 0;
  const failures = [];

  for (const lvl of levels) {
    const n = lvl.n;
    const start = lvl.start;
    const goal = lvl.goal;
    const wallsSet = new Set(lvl.walls.map(w => w.join(',')));

    // Verify claimed solution_path
    const claimedPath = lvl.solution_path;

    // Check starts at S, ends at G
    if (claimedPath[0][0] !== start[0] || claimedPath[0][1] !== start[1]) {
      failures.push(`L${lvl.id} path doesn't start at S`); continue;
    }
    if (claimedPath[claimedPath.length-1][0] !== goal[0] || claimedPath[claimedPath.length-1][1] !== goal[1]) {
      failures.push(`L${lvl.id} path doesn't end at G`); continue;
    }

    // Check no walls crossed
    let wallCrossed = false;
    for (const p of claimedPath) {
      if (wallsSet.has(p.join(','))) { wallCrossed = true; break; }
    }
    if (wallCrossed) { failures.push(`L${lvl.id} path crosses wall`); continue; }

    // Check all hops are valid zebra (2,3) leaper
    let badHop = false;
    const seen = new Set();
    for (const p of claimedPath) {
      const k = p.join(',');
      if (seen.has(k)) { badHop = true; break; }
      seen.add(k);
    }
    if (badHop) { failures.push(`L${lvl.id} path has duplicate cell`); continue; }
    for (let i = 0; i < claimedPath.length - 1; i++) {
      const dr = Math.abs(claimedPath[i+1][0] - claimedPath[i][0]);
      const dc = Math.abs(claimedPath[i+1][1] - claimedPath[i][1]);
      const hops = new Set([dr, dc]);
      if (!(hops.size === 2 && hops.has(2) && hops.has(3))) {
        badHop = true; break;
      }
    }
    if (badHop) { failures.push(`L${lvl.id} bad hop in path`); continue; }

    // Check path is shortest (independent BFS)
    const bfsRes = bfsShortest(n, wallsSet, start, goal);
    if (!bfsRes) { failures.push(`L${lvl.id} unreachable`); continue; }
    if (bfsRes.length !== lvl.length) {
      failures.push(`L${lvl.id} claimed length=${lvl.length} but BFS=${bfsRes.length}`); continue;
    }

    // Check uniqueness
    const allPaths = findAllShortest(n, wallsSet, start, goal);
    if (allPaths.length !== 1) {
      failures.push(`L${lvl.id} has ${allPaths.length} shortest paths (need 1)`); continue;
    }

    passCount++;
  }

  console.log(`Node independent: ${passCount}/${levels.length} UNIQUE`);
  if (failures.length) {
    failures.forEach(f => console.log(`  FAIL: ${f}`));
    process.exit(1);
  }
  if (passCount === levels.length) {
    console.log('All 30 levels verified UNIQUE (independent BFS implementation).');
    process.exit(0);
  }
  process.exit(1);
}

main();