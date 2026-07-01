// Independent Node.js BFS verifier — re-derives the mechanic from scratch.
// Mechanic: r_i = (s_i + s_{i-1}) mod 8, s_0 = W_ext (external wind).
// Counts solutions by exhaustive search (K<=4) and analytic uniqueness for all K.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels_embed.json', 'utf8'));
const DIRS = 8;

function countSolutionsBrute(K, Wext, targets) {
  let count = 0;
  let sol = null;
  function rec(i, prev, acc) {
    if (i === K) { count++; sol = acc.slice(); return; }
    // s_i can be 0..7, but reading r_i = (s_i + prev) % 8 must == targets[i]
    // => s_i = (targets[i] - prev) % 8 — unique
    const si = ((targets[i] - prev) % DIRS + DIRS) % DIRS;
    acc.push(si);
    rec(i + 1, si, acc);
    acc.pop();
  }
  rec(0, Wext, []);
  return { count, sol };
}

function bruteForceAll(K, Wext, targets) {
  // true bruteforce (for K<=4): try all 8^K combinations
  let count = 0; let firstSol = null;
  const total = Math.pow(DIRS, K);
  for (let code = 0; code < total; code++) {
    const s = [];
    let c = code;
    for (let i = 0; i < K; i++) { s.push(c % DIRS); c = Math.floor(c / DIRS); }
    let prev = Wext, ok = true;
    for (let i = 0; i < K; i++) {
      if ((s[i] + prev) % DIRS !== targets[i]) { ok = false; break; }
      prev = s[i];
    }
    if (ok) { count++; if (!firstSol) firstSol = s; }
  }
  return { count, sol: firstSol };
}

let allPass = true;
console.log(`Independent Node.js BFS verification of ${levels.length} levels`);
levels.forEach((lv, idx) => {
  const [K, Wext, targets, expectedSol] = lv;
  // analytic
  const { count: anCount, sol: anSol } = countSolutionsBrute(K, Wext, targets);
  // bruteforce for small K
  let bruteOk = true;
  if (K <= 4) {
    const { count: bCount, sol: bSol } = bruteForceAll(K, Wext, targets);
    bruteOk = (bCount === 1) && (JSON.stringify(bSol) === JSON.stringify(expectedSol));
  }
  const match = (anCount === 1) && (JSON.stringify(anSol) === JSON.stringify(expectedSol)) && bruteOk;
  if (!match) {
    console.log(`  L${idx+1}: FAIL (analytic count=${anCount}, expected sol match=${JSON.stringify(anSol)===JSON.stringify(expectedSol)}, brute=${bruteOk})`);
    allPass = false;
  } else {
    console.log(`  L${idx+1}: K=${K} UNIQUE+VALID ✓`);
  }
});
console.log(allPass ? '\n✅ All 30 levels UNIQUE+VALID (independent Node BFS)' : '\n❌ VERIFICATION FAILED');
process.exit(allPass ? 0 : 1);
