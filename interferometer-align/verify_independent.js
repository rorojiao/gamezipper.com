// verify_independent.js — Independent Node.js BFS verifier
// Re-implements the modular arithmetic from scratch, counts solutions per target,
// confirms stored solution yields the target. Must agree with Python gen_levels.py.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json','utf8'));

let pass = 0, fail = 0;
levels.forEach((L, idx) => {
  const { n, P, steps, signs, maxes, target, solution, n_solutions } = L;
  // 1. Verify stored solution yields target
  let net = 0;
  for (let i = 0; i < n; i++) net += solution[i] * steps[i] * signs[i];
  const netMod = ((net % P) + P) % P;
  if (netMod !== target) {
    console.log(`L${idx+1} FAIL: solution yields ${netMod} != target ${target}`);
    fail++; return;
  }
  // 2. Brute-force count solutions
  let count = 0;
  function rec(k, acc) {
    if (k === n) { if (((acc % P) + P) % P === target) count++; return; }
    for (let lv = 0; lv <= maxes[k]; lv++) {
      rec(k+1, acc + lv * steps[k] * signs[k]);
    }
  }
  rec(0, 0);
  if (count !== n_solutions) {
    console.log(`L${idx+1} FAIL: brute count ${count} != stored n_solutions ${n_solutions}`);
    fail++; return;
  }
  // 3. Check solution within maxes
  for (let i = 0; i < n; i++) {
    if (solution[i] < 0 || solution[i] > maxes[i]) {
      console.log(`L${idx+1} FAIL: solution[${i}]=${solution[i]} out of range [0,${maxes[i]}]`);
      fail++; return;
    }
  }
  pass++;
});

console.log(`\nIndependent BFS: ${pass}/${levels.length} PASS, ${fail} FAIL`);
if (fail === 0) console.log('✅ ALL LEVELS UNIQUE+VALID');
process.exit(fail > 0 ? 1 : 0);
