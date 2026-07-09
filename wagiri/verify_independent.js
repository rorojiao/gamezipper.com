// Independent verifier for wagiri levels.json
// Re-implements solver using shortest-path enumeration, verifies each puzzle
// has exactly 1 solution.
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/wagiri/levels.json', 'utf8'));
const LEVELS = data.levels;
console.log(`Loaded ${LEVELS.length} levels`);

function neighbors(r, c, R, C) {
  const out = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r+dr, nc = c+dc;
    if (0<=nr && nr<R && 0<=nc && nc<C) out.push([nr, nc]);
  }
  return out;
}

// Enumerate ALL shortest paths from a to b avoiding blocked (Set of "r,c" strings)
function enumerateShortestPaths(a, b, blocked, R, C, maxLen, cap) {
  if (a[0]===b[0] && a[1]===b[1]) return [[a]];
  const blockedSet = new Set(blocked);
  const dist = new Map();
  dist.set(`${a[0]},${a[1]}`, 0);
  const queue = [a];
  let foundDist = null;
  while (queue.length) {
    const newQueue = [];
    for (const cur of queue) {
      const curDist = dist.get(`${cur[0]},${cur[1]}`);
      if (foundDist !== null && curDist >= foundDist) continue;
      for (const nxt of neighbors(cur[0], cur[1], R, C)) {
        const key = `${nxt[0]},${nxt[1]}`;
        if (blockedSet.has(key)) continue;
        const newD = curDist + 1;
        if (newD > maxLen) continue;
        if (dist.has(key) && dist.get(key) <= newD) continue;
        dist.set(key, newD);
        if (nxt[0]===b[0] && nxt[1]===b[1]) {
          foundDist = newD;
        } else {
          newQueue.push(nxt);
        }
      }
    }
    queue.length = 0;
    queue.push(...newQueue);
  }
  const endKey = `${b[0]},${b[1]}`;
  if (!dist.has(endKey)) return [];
  const targetDist = dist.get(endKey);
  if (targetDist > maxLen) return [];

  const paths = [];
  const path = [a];
  const visited = new Set([`${a[0]},${a[1]}`]);

  function dfs(cur) {
    if (paths.length >= cap) return;
    if (cur[0]===b[0] && cur[1]===b[1]) {
      paths.push(path.slice());
      return;
    }
    const curDist = dist.get(`${cur[0]},${cur[1]}`);
    if (curDist >= targetDist) return;
    for (const nxt of neighbors(cur[0], cur[1], R, C)) {
      const key = `${nxt[0]},${nxt[1]}`;
      if (blockedSet.has(key)) continue;
      if (dist.get(key) !== curDist + 1) continue;
      if (visited.has(key)) continue;
      visited.add(key);
      path.push(nxt);
      dfs(nxt);
      path.pop();
      visited.delete(key);
      if (paths.length >= cap) return;
    }
  }
  dfs(a);
  return paths;
}

function solveCount(circles, R, C, cap) {
  const N = circles.length / 2;
  const count = [0];
  const stop = [false];
  const maxLen = R * C;

  function back(pairIdx, usedCells) {
    if (stop[0]) return;
    if (pairIdx === N) {
      count[0]++;
      if (count[0] >= cap) stop[0] = true;
      return;
    }
    const a = circles[pairIdx];
    const b = circles[pairIdx + N];
    const blocked = new Set(usedCells);
    for (let i = 0; i < circles.length; i++) {
      if (i === pairIdx || i === pairIdx + N) continue;
      blocked.add(`${circles[i][0]},${circles[i][1]}`);
    }
    const paths = enumerateShortestPaths(a, b, blocked, R, C, maxLen, cap);
    for (const p of paths) {
      if (stop[0]) return;
      const newUsed = new Set(usedCells);
      for (const c of p) newUsed.add(`${c[0]},${c[1]}`);
      back(pairIdx + 1, newUsed);
    }
  }
  back(0, []);
  return count[0];
}

let allValid = true;
for (const L of LEVELS) {
  const [R, C] = L.size;
  const circles = L.circles;
  const n = solveCount(circles, R, C, 3);
  if (n !== 1) {
    console.log(`L${L.id} (${L.tier} ${R}x${C}): solutions=${n} ❌`);
    allValid = false;
  } else {
    console.log(`L${L.id} (${L.tier} ${R}x${C}): 1 unique solution ✓ circles=${circles.length}`);
  }
}

console.log(`\n${allValid ? 'ALL VALID (unique solutions)' : 'SOME INVALID'}`);
process.exit(allValid ? 0 : 1);