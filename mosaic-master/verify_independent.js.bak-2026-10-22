// Method 2: Independent Node verifier — for each level, enumerate ALL valid
// solutions and confirm exactly 1.

const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8')).LEVELS;

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

// Returns { count, timedOut }. R323 fix: a search that exhausts its time budget is
// UNPROVEN, which is not the same as "0 solutions". The previous version returned a
// bare integer, so a timeout surfaced as cnt=0 and the caller reported it as an
// unsolvable level -- a false alarm on 10 of 30 perfectly valid levels.
function countSolutionsForLevel(N, regions, clues, timeBudgetMs) {
  const start = Date.now();
  let count = 0;
  let timedOut = false;
  const subs = regions.map((r, i) => enumerateSubsets(r, clues[i]));
  // Order regions by ascending number of subsets (most-constrained first)
  const order = subs.map((_, i) => i).sort((a, b) => subs[a].length - subs[b].length);
  const filled = new Array(regions.length).fill(null);

  function dfs(depth) {
    if (count >= 2) return true;
    if (Date.now() - start > timeBudgetMs) { timedOut = true; return true; }
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
  return { count, timedOut };
}

// Per-level budget, raised from 1500 ms. Measured on the R323 catalog: the 1.5 s
// budget could not prove the harder 7x7/R=6 levels, which is what produced the
// false "cnt=0" alarms. A timed-out level is now reported as UNPROVEN rather than
// being silently counted as a failure, and the budget is retried once at 8x.
const BASE_BUDGET_MS = 60000;
const RETRY_BUDGET_MS = 480000;

let pass = 0, fail = 0, unproven = 0;
const failures = [];
const unprovenList = [];
for (const lv of data) {
  let res = countSolutionsForLevel(lv.N, lv.regions, lv.clues, BASE_BUDGET_MS);
  if (res.timedOut) {
    res = countSolutionsForLevel(lv.N, lv.regions, lv.clues, RETRY_BUDGET_MS);
  }
  const cnt = res.count;
  if (res.timedOut) {
    unproven++;
    unprovenList.push(`L${lv.i + 1} (tier=${lv.tier})`);
  } else if (cnt === 1) {
    pass++;
  } else {
    fail++;
    failures.push(`L${lv.i + 1}: cnt=${cnt}`);
  }
}
console.log(`${pass}/${data.length} levels have unique solutions (independent verifier)`);
if (unproven > 0) {
  console.log(`UNPROVEN (search budget exhausted -- NOT a failure, raise the budget):`);
  for (const u of unprovenList.slice(0, 8)) console.log(' ', u);
}
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures.slice(0, 5)) console.log(' ', f);
  process.exit(1);
}
if (unproven > 0) {
  // A proven-unique count is what this gate exists to assert. If some levels could
  // not be proven either way, the gate has NOT passed and must not exit 0.
  console.log('VERDICT: FAIL (unproven levels)');
  process.exit(2);
}
console.log('VERDICT: PASS (every level proven unique)');