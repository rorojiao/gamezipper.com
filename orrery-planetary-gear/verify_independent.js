// Independent Node.js BFS verifier for Orrery Planetary Gear
// Does NOT use the game engine — pure standalone BFS over (s,r,c) state.
const fs = require('fs');
const LEVELS = JSON.parse(fs.readFileSync(__dirname + '/levels_compact.json', 'utf8'));
// OPTIMAL press counts (from gen_levels.py output)
const OPTIMAL = [3,2,2,2,4,2,3,3,6,3,6,4,4,5,7,4,6,3,6,5,2,6,2,5,2,5,3,5,5,2];

function bfsMinSolutions(N, dials, start) {
  // Enumerate bounded multisets (combinations_with_replacement) up to cap
  const startT = start.slice();
  const K = dials.length;
  const stateMin = new Map();
  const stateSols = new Map(); // state-key -> Set of canonical multisets
  const key = s => s.join(',');
  const sk = key(startT);
  stateMin.set(sk, 0);
  stateSols.set(sk, new Set(['']));
  const CAP = 12;
  function rec(length, combo, st) {
    // combo is array of dial indices non-decreasing
    const k = key(st);
    const have = stateMin.get(k);
    if (have === undefined || length < have) {
      stateMin.set(k, length);
      stateSols.set(k, new Set([combo.join(',')]));
    } else if (length === have) {
      stateSols.get(k).add(combo.join(','));
    }
    if (length >= CAP) return;
    const lastIdx = combo.length ? combo[combo.length - 1] : 0;
    for (let i = lastIdx; i < K; i++) {
      const d = dials[i];
      combo.push(i);
      rec(length + 1, combo, [(st[0] + d[0]) % N, (st[1] + d[1]) % N, (st[2] + d[2]) % N]);
      combo.pop();
    }
  }
  rec(0, [], startT.slice());
  return { stateMin, stateSols, key };
}

function isAligned(s) { return s[0] === s[1] && s[1] === s[2]; }

let allPass = true;
LEVELS.forEach((L, i) => {
  const { stateMin, stateSols, key } = bfsMinSolutions(L.n, L.d, L.s);
  // find aligned states
  const aligned = [];
  for (const [k, v] of stateMin) {
    const s = k.split(',').map(Number);
    if (isAligned(s)) aligned.push({ s, presses: v });
  }
  if (aligned.length === 0) {
    console.log(`L${i+1} FAIL: no aligned state reachable`);
    allPass = false; return;
  }
  const best = Math.min(...aligned.map(a => a.presses));
  // collect all minimal solutions
  const sols = new Set();
  for (const a of aligned) {
    if (a.presses === best) {
      const k = key(a.s);
      for (const sol of stateSols.get(k)) sols.add(sol);
    }
  }
  const uniq = sols.size === 1;
  const optOk = best === OPTIMAL[i];
  const status = uniq && optOk ? 'OK' : 'FAIL';
  if (!uniq || !optOk) allPass = false;
  console.log(`L${(i+1).toString().padStart(2)} N=${L.n} K=${L.d.length} start=[${L.s}] best=${best} opt=${OPTIMAL[i]} unique=${uniq} ${status}`);
});
console.log('\n' + (allPass ? '✅ ALL 30 LEVELS UNIQUE+VALID (independent Node BFS)' : '❌ SOME LEVELS FAILED'));
process.exit(allPass ? 0 : 1);
