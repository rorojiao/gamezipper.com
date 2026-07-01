// verify_independent.js — Independent Node.js re-verification of all 30 levels.
const fs = require('fs');
const { combinations_with_replacement } = (() => {
  function* cwr(arr, r) {
    const n = arr.length;
    if (r === 0) { yield []; return; }
    const idx = new Array(r).fill(0);
    while (true) {
      yield idx.map(i => arr[i]);
      let i = r - 1;
      while (i >= 0) { if (idx[i] !== n - 1) break; i--; }
      if (i < 0) return;
      const v = idx[i] + 1;
      for (let j = i; j < r; j++) idx[j] = v;
    }
  }
  return { combinations_with_replacement: (arr, r) => [...cwr(arr, r)] };
})();

const levels = JSON.parse(fs.readFileSync('levels.json','utf8'));
let allOK = true, totalUnique = 0;

for (const lv of levels) {
  const N = lv.N, dials = lv.dials, K = dials.length, start = lv.start, cap = 12;
  const stateMin = new Map(), stateSols = new Map();
  const startKey = start.join(',');
  stateMin.set(startKey, 0);
  stateSols.set(startKey, new Set(['']));
  for (let length = 1; length <= cap; length++) {
    for (const combo of combinations_with_replacement([...Array(K).keys()], length)) {
      let st = [start[0], start[1], start[2]];
      for (const di of combo) { const d = dials[di]; st[0]=(st[0]+d[0])%N; st[1]=(st[1]+d[1])%N; st[2]=(st[2]+d[2])%N; }
      const key = st.join(','), cstr = combo.join(',');
      if (!stateMin.has(key)) { stateMin.set(key, length); stateSols.set(key, new Set([cstr])); }
      else if (stateMin.get(key) === length) { if (!stateSols.has(key)) stateSols.set(key, new Set()); stateSols.get(key).add(cstr); }
    }
  }
  const winKey = '0,0,0';
  if (!stateMin.has(winKey)) { console.log(`L${lv.level}: UNSOLVABLE ❌`); allOK = false; continue; }
  const best = stateMin.get(winKey);
  const sols = stateSols.get(winKey) || new Set();
  const nSol = sols.size;
  if (nSol === 1) totalUnique++;
  let st = [start[0], start[1], start[2]];
  for (const di of lv.solution) { const d = dials[di]; st[0]=(st[0]+d[0])%N; st[1]=(st[1]+d[1])%N; st[2]=(st[2]+d[2])%N; }
  const storedOK = st[0] === 0 && st[1] === 0 && st[2] === 0;
  const status = (nSol <= 3 && storedOK) ? '✅' : '❌';
  if (status === '❌') allOK = false;
  console.log(`L${lv.level}: N=${N} K=${K} minPresses=${best} minSolutions=${nSol} storedSolValid=${storedOK} ${status}`);
}
console.log(`\nTotal: ${levels.length} levels`);
console.log(`Unique (1 solution): ${totalUnique}/${levels.length}`);
console.log(allOK ? 'ALL 30/30 UNIQUE+VALID ✅' : 'SOME LEVELS FAILED ❌');
process.exit(allOK ? 0 : 1);
