// Independent verifier — re-checks every level: solvable, unique, solution matches.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function pairKey(a, b) { return a < b ? a * 100 + b : b * 100 + a; }
function dominoSet(maxVal) {
  const set = [];
  for (let a = 0; a <= maxVal; a++) for (let b = a; b <= maxVal; b++) set.push([a, b]);
  return set;
}

let pass = 0, fail = 0;
for (const lv of levels) {
  const { rows, cols, setMax, grid, solution } = lv;
  const errs = [];
  // 1. Grid size
  if (grid.length !== rows * cols) errs.push(`grid len ${grid.length} != ${rows*cols}`);
  // 2. Cell values in range
  for (const v of grid) if (v < 0 || v > setMax || !Number.isInteger(v)) errs.push(`bad value ${v}`);
  // 3. Solution: every cell covered exactly once
  const cover = new Array(rows * cols).fill(0);
  for (const [a, b] of solution) {
    if (a < 0 || a >= rows*cols || b < 0 || b >= rows*cols) { errs.push('sol idx OOB'); continue; }
    cover[a]++; cover[b]++;
    // adjacency check
    const ra = Math.floor(a/cols), ca = a%cols, rb = Math.floor(b/cols), cb = b%cols;
    const adj = (ra===rb && Math.abs(ca-cb)===1) || (ca===cb && Math.abs(ra-rb)===1);
    if (!adj) errs.push(`non-adjacent pair ${a}-${b}`);
  }
  for (let i = 0; i < cover.length; i++) if (cover[i] !== 1) errs.push(`cell ${i} covered ${cover[i]}x`);
  // 4. Solution uses exactly the domino set (no dup, full set)
  const set = dominoSet(setMax);
  const solPairs = solution.map(([a, b]) => pairKey(grid[a], grid[b]));
  if (solPairs.length !== set.length) errs.push(`sol count ${solPairs.length} != set ${set.length}`);
  const uniq = new Set(solPairs);
  if (uniq.size !== solPairs.length) errs.push('duplicate dominoes in solution');
  for (const [a, b] of set) if (!uniq.has(pairKey(a, b))) errs.push(`missing set domino ${a}-${b}`);

  // 5. UNIQUENESS: re-run independent solver counting solutions (cap 2)
  const needed = new Set(set.map(([a, b]) => pairKey(a, b)));
  const cv = new Array(rows * cols).fill(false);
  const used = new Set();
  let solCount = 0;
  function pk(a, b) { return a < b ? a*100+b : b*100+a; }
  function findFirst() { for (let i = 0; i < cv.length; i++) if (!cv[i]) return i; return -1; }
  function rec() {
    if (solCount >= 2) return;
    const i = findFirst();
    if (i === -1) { solCount++; return; }
    cv[i] = true;
    const r = Math.floor(i/cols), c = i%cols;
    const opts = [];
    if (r > 0) opts.push(i - cols);
    if (r < rows-1) opts.push(i + cols);
    if (c > 0) opts.push(i - 1);
    if (c < cols-1) opts.push(i + 1);
    const va = grid[i];
    for (const j of opts) {
      if (cv[j]) continue;
      const vb = grid[j];
      const k = pk(va, vb);
      if (used.has(k) || !needed.has(k)) continue;
      used.add(k); cv[j] = true;
      rec();
      cv[j] = false; used.delete(k);
      if (solCount >= 2) break;
    }
    cv[i] = false;
  }
  rec();
  if (solCount !== 1) errs.push(`uniqueness FAIL: ${solCount} solutions`);

  if (errs.length === 0) { pass++; }
  else { fail++; console.log(`✗ Level ${lv.level} (${lv.tier} #${lv.idx}): ${errs.join('; ')}`); }
}
console.log(`\n=== Verification: ${pass} pass, ${fail} fail out of ${levels.length} ===`);
process.exit(fail === 0 ? 0 : 1);
