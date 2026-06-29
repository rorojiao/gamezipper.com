// Pulley Lift — Independent Node.js BFS Verifier
// Re-implements the game's settle + win logic from scratch (no shared code with HTML)
// and confirms every level is solvable at its declared par with a UNIQUE minimal path.
//
// Usage: node verify_independent.js [levels_compact.json]
const fs = require('fs');

const file = process.argv[2] || 'levels_compact.json';
const levels = JSON.parse(fs.readFileSync(file, 'utf8'));

// Independent settle: engaged branches snap to floor(avg of engaged heights), floored at 0.
function settle(heights, engagedMask) {
  const n = heights.length;
  const eIdx = [];
  for (let i = 0; i < n; i++) if ((engagedMask >> i) & 1) eIdx.push(i);
  if (eIdx.length <= 1) return heights.slice();
  let sum = 0;
  for (const i of eIdx) sum += heights[i];
  let avg = Math.floor(sum / eIdx.length);
  if (avg < 0) avg = 0;
  const nv = heights.slice();
  for (const i of eIdx) nv[i] = avg;
  return nv;
}

function solve(level) {
  const n = level.n, H = level.H, target = level.target, loadIdx = level.loadIdx;
  const startH = settle(level.start.slice(), level.startMask);
  if (startH[loadIdx] === target) return { minMoves: 0, numMinimalPaths: 1 };
  const visited = new Map();
  const pathsAt = new Map();
  const key0 = startH.join(',') + '|' + level.startMask;
  visited.set(key0, 0);
  pathsAt.set(key0, 1);
  const queue = [{ h: startH, m: level.startMask }];
  let foundDist = null, foundPaths = 0;
  const depthCap = target * 4 + 12;
  while (queue.length) {
    const st = queue.shift();
    const stKey = st.h.join(',') + '|' + st.m;
    const d = visited.get(stKey);
    if (foundDist !== null && d + 1 > foundDist) continue;
    if (d + 1 > depthCap) continue;
    for (let i = 0; i < n; i++) {
      const newM = st.m ^ (1 << i);
      const newH = settle(st.h.slice(), newM);
      let bad = false;
      for (let k = 0; k < n; k++) if (newH[k] < 0 || newH[k] > H) { bad = true; break; }
      if (bad) continue;
      if (newH[loadIdx] === target) {
        if (foundDist === null || d + 1 < foundDist) { foundDist = d + 1; foundPaths = pathsAt.get(stKey); }
        else if (d + 1 === foundDist) foundPaths += pathsAt.get(stKey);
        continue;
      }
      const key = newH.join(',') + '|' + newM;
      if (visited.has(key)) {
        if (visited.get(key) === d + 1) pathsAt.set(key, pathsAt.get(key) + pathsAt.get(stKey));
        continue;
      }
      visited.set(key, d + 1);
      pathsAt.set(key, pathsAt.get(stKey));
      queue.push({ h: newH, m: newM });
    }
  }
  if (foundDist === null) return { minMoves: null, numMinimalPaths: 0 };
  return { minMoves: foundDist, numMinimalPaths: foundPaths };
}

let allOk = true, uniqueCount = 0, validCount = 0;
console.log(`Verifying ${levels.length} levels...`);
for (const lvl of levels) {
  const res = solve(lvl);
  const solvable = res.minMoves !== null;
  const matchesPar = solvable && res.minMoves === lvl.par;
  const unique = solvable && res.numMinimalPaths === 1;
  if (solvable) validCount++;
  if (unique) uniqueCount++;
  const status = (solvable && matchesPar && unique) ? 'OK' : 'FAIL';
  if (status === 'FAIL') allOk = false;
  console.log(`#${String(lvl.id).padStart(2)} T${lvl.tier} "${lvl.name}" n=${lvl.n} H=${lvl.H} tgt=${lvl.target} par=${lvl.par} -> minMoves=${res.minMoves} paths=${res.numMinimalPaths} [${status}]`);
}
console.log('---');
console.log(`Solvable: ${validCount}/${levels.length}`);
console.log(`Unique-min-path: ${uniqueCount}/${levels.length}`);
console.log(allOk && validCount === levels.length && uniqueCount === levels.length
  ? 'ALL 30 LEVELS UNIQUE + VALID' : 'SOME LEVELS FAILED');
process.exit(allOk && validCount === levels.length && uniqueCount === levels.length ? 0 : 1);
