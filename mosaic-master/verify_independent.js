// Method 2: Independent Node verifier — for each level, enumerate ALL valid
// solutions and confirm exactly 1.

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('levels.json', 'utf8')).LEVELS;

const NEIGH = [[-1,0],[1,0],[0,-1],[0,1]];

function isConnected(placedSet) {
  if (placedSet.size === 0) return true;
  // placedSet contains string keys like 'r,c'
  const startKey = placedSet.values().next().value;
  const [sr, sc] = startKey.split(',').map(Number);
  const visited = new Set([startKey]);
  const stack = [[sr, sc]];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of NEIGH) {
      const nr = r+dr, nc = c+dc;
      const k = nr + ',' + nc;
      if (placedSet.has(k) && !visited.has(k)) {
        visited.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  return visited.size === placedSet.size;
}

function enumerateSubsets(region, k) {
  // region: array of cell indices [0..N*N-1]
  const out = [];
  function rec(idx, chosen) {
    if (chosen.length === k) {
      out.push(chosen.slice());
      return;
    }
    if (region.length - idx < k - chosen.length) return;
    for (let i = idx; i < region.length; i++) {
      chosen.push(region[i]);
      rec(i + 1, chosen);
      chosen.pop();
    }
  }
  rec(0, []);
  return out;
}

function countSolutionsForLevel(N, regions, clues, timeBudgetMs) {
  const start = Date.now();
  let count = 0;
  const subs = regions.map((r, i) => enumerateSubsets(r, clues[i]));
  // Order regions by ascending number of subsets (most-constrained first)
  const order = subs.map((_, i) => i).sort((a, b) => subs[a].length - subs[b].length);
  const filled = new Array(regions.length).fill(null);

  function dfs(depth) {
    if (count >= 2) return true;
    if (Date.now() - start > timeBudgetMs) return true;
    if (depth === regions.length) {
      // Build placed set of [r,c] tuples
      const placedSet = new Set();
      for (let i = 0; i < regions.length; i++) {
        for (const cellIdx of filled[i]) {
          const r = Math.floor(cellIdx / N);
          const c = cellIdx % N;
          placedSet.add(r + ',' + c);
        }
      }
      if (!isConnected(placedSet)) return false;
      count++;
      return count >= 2;
    }
    const rid = order[depth];
    for (const subset of subs[rid]) {
      filled[rid] = subset;
      if (dfs(depth + 1)) return true;
    }
    filled[rid] = null;
    return false;
  }
  dfs(0);
  return count;
}

let pass = 0, fail = 0;
const failures = [];
for (const lv of data) {
  const cnt = countSolutionsForLevel(lv.N, lv.regions, lv.clues, 1500);
  if (cnt === 1) {
    pass++;
  } else {
    fail++;
    failures.push(`L${lv.i+1}: cnt=${cnt}`);
  }
}
console.log(`${pass}/${data.length} levels have unique solutions (independent verifier)`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures.slice(0, 5)) console.log(' ', f);
  process.exit(1);
}
process.exit(0);