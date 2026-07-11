// Phase 6 Method 2: Node.js independent verification
// Reimplements the solver in JS independently from the Python version.

const fs = require('fs');

function deriveClues(grid, N) {
  const rc = [];
  for (let r = 0; r < N; r++) {
    const g = []; let cur = [];
    for (let c = 0; c < N; c++) {
      if (grid[r][c] > 0) cur.push(grid[r][c]);
      else { if (cur.length > 0) { g.push(cur.reduce((a,b)=>a+b,0)); cur = []; } }
    }
    if (cur.length > 0) g.push(cur.reduce((a,b)=>a+b,0));
    rc.push(g);
  }
  const cc = [];
  for (let c = 0; c < N; c++) {
    const g = []; let cur = [];
    for (let r = 0; r < N; r++) {
      if (grid[r][c] > 0) cur.push(grid[r][c]);
      else { if (cur.length > 0) { g.push(cur.reduce((a,b)=>a+b,0)); cur = []; } }
    }
    if (cur.length > 0) g.push(cur.reduce((a,b)=>a+b,0));
    cc.push(g);
  }
  return [rc, cc];
}

function enumerateLine(clues, N) {
  const results = [];
  const MAX = 10000;

  function solve(pos, line, used, gidx, gsum, started) {
    if (results.length > MAX) return;
    if (pos === N) {
      if (gidx === clues.length && !started) results.push([...line]);
      return;
    }
    // Empty cell
    if (started) {
      if (gsum === clues[gidx]) {
        line.push(0);
        solve(pos + 1, line, used, gidx + 1, 0, false);
        line.pop();
      }
    } else {
      if (gidx <= clues.length) {
        line.push(0);
        solve(pos + 1, line, used, gidx, 0, false);
        line.pop();
      }
    }
    // Digit
    if (gidx < clues.length) {
      const target = clues[gidx];
      for (let d = 1; d <= N; d++) {
        if (used.has(d)) continue;
        const ns = gsum + d;
        if (ns > target) continue;
        line.push(d);
        if (ns === target) {
          const u2 = new Set(used); u2.add(d);
          solve(pos + 1, line, u2, gidx + 1, 0, false);
        } else {
          const u2 = new Set(used); u2.add(d);
          solve(pos + 1, line, u2, gidx, ns, true);
        }
        line.pop();
      }
    }
  }

  solve(0, [], new Set(), 0, 0, false);
  return results;
}

function countSolutions(rowClues, colClues, N, limit = 2, timeoutMs = 5000) {
  const start = Date.now();
  const rowPats = [];
  const colPats = [];
  for (let r = 0; r < N; r++) rowPats.push(enumerateLine(rowClues[r], N));
  for (let c = 0; c < N; c++) colPats.push(enumerateLine(colClues[c], N));

  for (let r = 0; r < N; r++) if (rowPats[r].length === 0) return 0;
  for (let c = 0; c < N; c++) if (colPats[c].length === 0) return 0;

  const colValSets = [];
  for (let c = 0; c < N; c++) {
    const cvs = {};
    colPats[c].forEach((cp, cpIdx) => {
      for (let r = 0; r < N; r++) {
        const key = r + ',' + cp[r];
        if (!cvs[key]) cvs[key] = [];
        cvs[key].push(cpIdx);
      }
    });
    colValSets.push(cvs);
  }

  const grid = Array.from({length: N}, () => Array(N).fill(null));
  let rowActive = [];
  let colActive = [];
  for (let r = 0; r < N; r++) rowActive.push(rowPats[r].map((_, i) => i));
  for (let c = 0; c < N; c++) colActive.push(colPats[c].map((_, i) => i));
  const count = [0];

  function solve() {
    if (count[0] >= limit) return;
    if (Date.now() - start > timeoutMs) return;

    let best = null;
    let bestDomain = null;
    let bestSize = N + 2;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] !== null) continue;
        const rowVals = new Set();
        for (const pi of rowActive[r]) rowVals.add(rowPats[r][pi][c]);
        const colVals = new Set();
        for (const pi of colActive[c]) colVals.add(colPats[c][pi][r]);
        const domain = new Set();
        for (const v of rowVals) if (colVals.has(v)) domain.add(v);
        if (domain.size === 0) return;
        if (domain.size < bestSize) {
          bestSize = domain.size;
          best = [r, c];
          bestDomain = domain;
          if (bestSize === 1) break;
        }
      }
      if (bestSize === 1) break;
    }
    if (best === null) {
      count[0]++;
      return;
    }
    const [r, c] = best;
    const vals = [...bestDomain].sort((a, b) => a - b);
    for (const val of vals) {
      if (Date.now() - start > timeoutMs) return;
      const oldRA = [...rowActive[r]];
      const oldCA = [...colActive[c]];
      rowActive[r] = rowActive[r].filter(pi => rowPats[r][pi][c] === val);
      colActive[c] = colActive[c].filter(pi => colPats[c][pi][r] === val);
      if (rowActive[r].length > 0 && colActive[c].length > 0) {
        grid[r][c] = val;
        solve();
        grid[r][c] = null;
      }
      rowActive[r] = oldRA;
      colActive[c] = oldCA;
      if (count[0] >= limit) return;
    }
  }

  solve();
  if (Date.now() - start > timeoutMs) return -1;
  return count[0];
}

// Main
const levelsData = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const levels = levelsData.levels;
console.log(`Verifying ${levels.length} levels (Node.js independent)...\n`);

let allPass = true;
for (const lv of levels) {
  const N = lv.N;
  const sol = lv.solution;
  const rc = lv.rowClues;
  const cc = lv.colClues;

  // 1. Verify clues
  const [drc, dcc] = deriveClues(sol, N);
  const cluesMatch = JSON.stringify(drc) === JSON.stringify(rc) && JSON.stringify(dcc) === JSON.stringify(cc);

  // 2. Verify uniqueness
  const nsol = countSolutions(rc, cc, N, 2, 5000);
  const unique = nsol === 1;

  const status = cluesMatch && unique ? '✅' : '❌';
  const issues = [];
  if (!cluesMatch) issues.push('clues mismatch');
  if (!unique) issues.push(`solutions=${nsol}`);

  console.log(`L${String(lv.num).padStart(2)} [${lv.tier.padEnd(8)}] ${N}x${N}: ${status} ${issues.length ? issues.join(' ') : 'VALID'}`);

  if (!cluesMatch || !unique) allPass = false;
}

console.log(`\n${allPass ? 'ALL PASS' : 'SOME FAILED'}: ${levels.length}/${levels.length} levels`);
process.exit(allPass ? 0 : 1);
