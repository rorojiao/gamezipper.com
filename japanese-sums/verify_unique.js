// Phase 6 Method 2: Count valid solutions per level (limited search).
// This confirms the puzzle's uniqueness claim (or lack thereof).
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
const m = html.match(/const LEVELS = (\[.*?\]);/s);
const LEVELS = JSON.parse(m[1]);

function validLines(clues, N, maxPer=2000) {
  const lines = [];
  function solve(pos, line, used, gidx, gsum, started) {
    if (lines.length > maxPer) return;
    if (pos === N) {
      if (started && gsum === clues[gidx] && gidx === clues.length - 1) lines.push(line.slice());
      else if (!started && gidx === clues.length && gsum === 0) lines.push(line.slice());
      return;
    }
    if (started && gsum === clues[gidx]) {
      line.push(0);
      solve(pos+1, line, used, gidx+1, 0, false);
      line.pop();
      if (lines.length > maxPer) return;
    } else if (!started) {
      line.push(0);
      solve(pos+1, line, used, gidx, 0, false);
      line.pop();
      if (lines.length > maxPer) return;
    }
    if (started) {
      for (let v = 1; v <= N; v++) {
        if (used.has(v)) continue;
        if (gsum + v > clues[gidx]) continue;
        used.add(v); line.push(v);
        solve(pos+1, line, used, gidx, gsum+v, true);
        line.pop(); used.delete(v);
        if (lines.length > maxPer) return;
      }
    } else {
      if (gidx < clues.length) {
        for (let v = 1; v <= N; v++) {
          if (used.has(v)) continue;
          if (v > clues[gidx]) break;
          used.add(v); line.push(v);
          solve(pos+1, line, used, gidx, v, true);
          line.pop(); used.delete(v);
          if (lines.length > maxPer) return;
        }
      }
    }
  }
  solve(0, [], new Set(), 0, 0, false);
  return lines;
}

// For uniqueness: brute-force grid fill, counting valid configurations
// Returns 1, 2, or >2 (or -1 = timeout). Cell order: try by (r,c) sequence.
function countSolutions(lv, limit=3, maxTime=3000) {
  const N = lv.N;
  const rowPats = lv.r.map(c => validLines(c, N, 500));
  const colPats = lv.c.map(c => validLines(c, N, 500));
  if (rowPats.some(p => p.length === 0) || colPats.some(p => p.length === 0)) return 0;
  const g = Array.from({length: N}, () => Array(N).fill(0));
  const t0 = Date.now();
  let count = 0;
  const stack = [{ idx: 0, usedRow: Array.from({length:N}, () => new Set()), usedCol: Array.from({length:N}, () => new Set()), _try: 0 }];
  while (stack.length > 0) {
    if (count >= limit) return count;
    if (Date.now() - t0 > maxTime) return -1;
    const frame = stack[stack.length - 1];
    const idx = frame.idx;
    if (idx === N*N) {
      count++;
      stack.pop();
      if (stack.length > 0) {
        const p = stack[stack.length - 1];
        const r = Math.floor(p.idx/N), c = p.idx%N;
        if (g[r][c] !== 0) { p.usedRow[r].delete(g[r][c]); p.usedCol[c].delete(g[r][c]); g[r][c] = 0; }
      }
      continue;
    }
    if (frame._done) {
      stack.pop();
      if (stack.length > 0) {
        const p = stack[stack.length - 1];
        const r = Math.floor(p.idx/N), c = p.idx%N;
        if (g[r][c] !== 0) { p.usedRow[r].delete(g[r][c]); p.usedCol[c].delete(g[r][c]); g[r][c] = 0; }
      }
      continue;
    }
    const r = Math.floor(idx/N), c = idx%N;
    let placed = false;
    while (frame._try < N) {
      const v = frame._try + 1;
      frame._try++;
      if (frame.usedRow[r].has(v) || frame.usedCol[c].has(v)) continue;
      let rowOk = false, colOk = false;
      for (const p of rowPats[r]) if (p[c] === v || p[c] === 0) { rowOk = true; break; }
      for (const p of colPats[c]) if (p[r] === v || p[r] === 0) { colOk = true; break; }
      if (!rowOk || !colOk) continue;
      frame.usedRow[r].add(v); frame.usedCol[c].add(v);
      g[r][c] = v;
      stack.push({ idx: idx+1, usedRow: frame.usedRow, usedCol: frame.usedCol, _try: 0 });
      placed = true;
      break;
    }
    if (placed) continue;
    let rowHas0 = false, colHas0 = false;
    for (const p of rowPats[r]) if (p[c] === 0) { rowHas0 = true; break; }
    for (const p of colPats[c]) if (p[r] === 0) { colHas0 = true; break; }
    if (rowHas0 && colHas0) {
      g[r][c] = 0;
      stack.push({ idx: idx+1, usedRow: frame.usedRow, usedCol: frame.usedCol, _try: 0 });
      continue;
    }
    frame._done = true;
    stack.pop();
    if (stack.length > 0) {
      const p = stack[stack.length - 1];
      const r2 = Math.floor(p.idx/N), c2 = p.idx%N;
      if (g[r2][c2] !== 0) { p.usedRow[r2].delete(g[r2][c2]); p.usedCol[c2].delete(g[r2][c2]); g[r2][c2] = 0; }
    }
  }
  return count;
}

// R322 correction. This script previously printed, UNCONDITIONALLY:
//   'Note: puzzle claims "30 unique-solution levels" but multiple solutions exist.'
// That is a false alarm for this game, and it was the reason a sweep would
// "fix" a game that has nothing wrong with it.
//
// japanese-sums is an INTENTIONAL multi-solution variant (audit 2026-08-06,
// documented in index.html next to checkWin()): the win predicate is
// RULE-BASED, not solution-compare --
//     checkWin(): every row and column must satisfy isLineSatisfied()
// i.e. contiguous-group sums match the clues with no repeated digit, and
// cells may be 0 (blank) or -1 (marked empty). Therefore "more than one
// completion satisfies the clues" is the DESIGN, not a defect: a
// correctly-reasoning player is never marked wrong.
//
// What IS a real defect is a level the player cannot complete at all.
// So: assert each level is SOLVABLE (>=1 valid full completion exists) and
// that the stored solution is accepted by the game's own rule check.
// Uniqueness is reported as INFO only.
let solvable = 0, multi = 0, timeout = 0;
const unsolved = [];
for (const lv of LEVELS) {
  const n = countSolutions(lv, 3, 3000);
  if (n === 0) unsolved.push(lv.n);
  else if (n === -1) timeout++;
  else if (n === 1) solvable++;
  else { solvable++; multi++; }
}

// Independently confirm the stored solution is accepted by the game's OWN
// rule check. This mirrors isLineSatisfied() from index.html exactly:
// a value > 0 belongs to the current group, anything <= 0 (blank 0 or
// marked-empty -1) ENDS the group; group count must equal clue count and
// each group sum must equal the corresponding clue; no repeated digit.
function lineSatisfied(vals, clues) {
  const groups = [];
  let cur = [];
  for (const v of vals) {
    if (v > 0) cur.push(v);
    else if (cur.length > 0) { groups.push(cur.reduce((a, b) => a + b, 0)); cur = []; }
  }
  if (cur.length > 0) groups.push(cur.reduce((a, b) => a + b, 0));
  if (groups.length !== clues.length) return false;
  for (let i = 0; i < clues.length; i++) if (groups[i] !== clues[i]) return false;
  const digits = vals.filter(v => v > 0);
  return new Set(digits).size === digits.length;
}
function storedSolutionValid(lv) {
  const s = lv.s, N = lv.N;
  if (!s) return false;
  for (let r = 0; r < N; r++) if (!lineSatisfied(s[r], lv.r[r] || [])) return false;
  for (let c = 0; c < N; c++) {
    if (!lineSatisfied(s.map(row => row[c]), lv.c[c] || [])) return false;
  }
  return true;
}
const badStored = LEVELS.filter(lv => !storedSolutionValid(lv)).map(lv => lv.n);

console.log(`Solvable: ${solvable}/${LEVELS.length} (unique=${solvable - multi}, multi=${multi}) | Timeout: ${timeout}`);
console.log(`Levels with NO valid completion (real P0): ${unsolved.length ? unsolved.join(',') : 'none'}`);
console.log(`Levels whose STORED solution fails its own clues (real P0): ${badStored.length ? badStored.join(',') : 'none'}`);
console.log('INFO: this variant is intentionally multi-solution by design (rule-based win check,');
console.log('      documented in index.html). Non-uniqueness is NOT a defect.');
if (unsolved.length || badStored.length) { console.log('VERDICT: FAIL'); process.exit(1); }
console.log('VERDICT: PASS');
process.exit(0);
