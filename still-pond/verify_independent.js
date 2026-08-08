// Method 2: Independent Node verifier — for each level, brute-force all
// completions of the given partial grid; check exactly ONE completion is a
// still-life, and that completion matches the stored solution.

const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8')).LEVELS;

const NEIGHBORS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function applyStep(grid, n) {
  const out = new Array(n*n).fill(0);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (const [dr, dc] of NEIGHBORS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr*n + nc]) cnt++;
      }
      if (grid[r*n + c]) {
        out[r*n + c] = (cnt === 2 || cnt === 3) ? 1 : 0;
      } else {
        out[r*n + c] = (cnt === 3) ? 1 : 0;
      }
    }
  }
  return out;
}

function isStillLife(grid, n) {
  const s = applyStep(grid, n);
  for (let i = 0; i < n*n; i++) if (s[i] !== grid[i]) return false;
  return true;
}

function solve(n, givens) {
  // givens: list of [r, c, v]
  const state = new Array(n*n).fill(-1);
  for (const [r, c, v] of givens) state[r*n + c] = v;
  const blanks = [];
  for (let i = 0; i < n*n; i++) if (state[i] === -1) blanks.push(i);

  const results = [];
  const maxResults = 5; // we want to know if >1 solution exists

  function bt(idx) {
    if (results.length >= maxResults) return;
    if (idx === blanks.length) {
      if (isStillLife(state, n)) {
        results.push(state.slice());
      }
      return;
    }
    for (const v of [0, 1]) {
      state[blanks[idx]] = v;
      bt(idx + 1);
      state[blanks[idx]] = -1;
    }
  }
  bt(0);
  return results;
}

let pass = 0;
let fails = [];
for (const lv of data) {
  const n = lv.N;
  const sols = solve(n, lv.g);
  const expected = lv.s;
  const matchesExpected = sols.filter(s => s.every((v, i) => v === expected[i]));
  if (sols.length === 1 && matchesExpected.length === 1) {
    pass++;
  } else {
    fails.push(`L${lv.i+1}: sols=${sols.length} matchesExpected=${matchesExpected.length} n=${n} blanks=${n*n - lv.g.length}`);
  }
}

console.log(`${pass}/${data.length} levels UNIQUE`);
if (fails.length) {
  console.log('Failures:');
  for (const f of fails.slice(0, 5)) console.log(' ', f);
  process.exit(1);
}
process.exit(0);
