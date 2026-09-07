#!/usr/bin/env node
/**
 * Independent Node.js solver for Number Maze levels.
 * Verifies that each level has EXACTLY ONE valid path through checkpoints in order.
 *
 * Algorithm: DFS with checkpoint sequence constraint.
 * For each level, find all paths from checkpoints[0] to checkpoints[k-1] (end),
 * where consecutive checkpoints are visited in order. Counts solutions.
 * Must equal 1 for uniqueness.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

function hasWall(walls, r1, c1, r2, c2) {
  if (r1 < 0 || r1 >= walls.length || c1 < 0 || c1 >= walls.length) return true;
  if (r2 < 0 || r2 >= walls.length || c2 < 0 || c2 >= walls.length) return true;
  if (r2 === r1 - 1 && c2 === c1) return !!(walls[r1][c1] & 1);
  if (r2 === r1 && c2 === c1 + 1) return !!(walls[r1][c1] & 2);
  if (r2 === r1 + 1 && c2 === c1) return !!(walls[r1][c1] & 4);
  if (r2 === r1 && c2 === c1 - 1) return !!(walls[r1][c1] & 8);
  return true;
}

function findPaths(walls, n, checkpoints) {
  const paths = [];
  const ckSet = new Set(checkpoints.map(c => c.join(',')));
  const ckIndices = checkpoints.map(c => c.join(','));

  function dfs(idx, r, c, visited, path) {
    if (idx === checkpoints.length) {
      paths.push([...path]);
      return;
    }
    const targetKey = ckIndices[idx];
    if (`${r},${c}` === targetKey) {
      dfs(idx + 1, r, c, visited, path);
      return;
    }
    const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (hasWall(walls, r, c, nr, nc)) continue;
      // Allow passing through other checkpoint cells (we'll re-check at exact match)
      visited.add(key);
      path.push([nr, nc]);
      dfs(idx, nr, nc, visited, path);
      path.pop();
      visited.delete(key);
    }
  }

  const start = checkpoints[0];
  dfs(1, start[0], start[1], new Set([start.join(',')]), [start]);
  return paths;
}

function validateLevel(lvl) {
  const n = lvl.n;
  const k = lvl.k;
  const walls = lvl.walls;
  const checkpoints = lvl.checkpoints.map(c => [c[0], c[1]]);

  // Find all valid paths
  const paths = findPaths(walls, n, checkpoints);
  return { paths };
}

function main() {
  const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const levels = data.levels;
  console.log(`Independent solver: validating ${levels.length} levels for unique-solution property...`);

  let passed = 0;
  let failed = 0;
  for (const lvl of levels) {
    const { paths } = validateLevel(lvl);
    if (paths.length === 1) {
      passed++;
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}]: PASS (1 unique solution, length ${paths[0].length})`);
    } else {
      failed++;
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}]: FAIL (${paths.length} solutions found)`);
    }
  }

  console.log('');
  console.log(`Result: ${passed}/${levels.length} UNIQUE, ${failed}/${levels.length} NON-UNIQUE`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
