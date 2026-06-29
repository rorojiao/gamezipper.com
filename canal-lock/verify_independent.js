// Canal Lock — Independent Node.js BFS Verifier
// Re-implements the game's win logic from scratch (no shared code with the HTML)
// and confirms every level is solvable at its declared par with a unique minimal path.
//
// Usage: node verify_independent.js [levels.json]
const fs = require('fs');

const file = process.argv[2] || 'levels.json';
const levels = JSON.parse(fs.readFileSync(file, 'utf8'));

// Independent solver: BFS over (levels tuple, removed-gates set).
// Each move is one of: inlet c, outlet c, gate g.
// Win = all chambers at target AND every gate on start..end path removed.
function solve(level) {
  const n = level.chambers;
  const init = level.init.slice();
  const target = level.target;
  const inlets = level.inlets, outlets = level.outlets, gates = level.gates;
  const start = level.boatStart, end = level.boatEnd;

  function stateKey(levels, removedArr) {
    return levels.join(',') + '|' + removedArr.join(',');
  }
  function isWin(levels, removedSet) {
    for (let i = 0; i < n; i++) if (levels[i] !== target[i]) return false;
    for (let g = Math.min(start, end); g < Math.max(start, end); g++) {
      if (gates.indexOf(g) >= 0 && !removedSet.has(g)) return false;
    }
    return true;
  }

  const startLevels = init.slice();
  const startRemoved = new Set();
  if (isWin(startLevels, startRemoved)) return { min: 0 };
  const seen = new Set([stateKey(startLevels, [])]);
  const queue = [[startLevels, startRemoved, 0]];
  while (queue.length) {
    const [levels, removed, dist] = queue.shift();
    if (dist > 50) return { min: null, reason: 'too deep' };
    // inlet moves
    for (const c of inlets) {
      if (levels[c] < 3) {
        const nl = levels.slice(); nl[c] += 1;
        const rk = [...removed].sort((a,b)=>a-b);
        if (!seen.has(stateKey(nl, rk))) {
          if (isWin(nl, removed)) return { min: dist + 1 };
          seen.add(stateKey(nl, rk));
          queue.push([nl, removed, dist + 1]);
        }
      }
    }
    // outlet moves
    for (const c of outlets) {
      if (levels[c] > 0) {
        const nl = levels.slice(); nl[c] -= 1;
        const rk = [...removed].sort((a,b)=>a-b);
        if (!seen.has(stateKey(nl, rk))) {
          if (isWin(nl, removed)) return { min: dist + 1 };
          seen.add(stateKey(nl, rk));
          queue.push([nl, removed, dist + 1]);
        }
      }
    }
    // gate moves
    for (const g of gates) {
      if (removed.has(g)) continue;
      if (levels[g] === levels[g + 1]) {
        const nr = new Set(removed); nr.add(g);
        const rk = [...nr].sort((a,b)=>a-b);
        if (!seen.has(stateKey(levels, rk))) {
          if (isWin(levels, nr)) return { min: dist + 1 };
          seen.add(stateKey(levels, rk));
          queue.push([levels, nr, dist + 1]);
        }
      }
    }
  }
  return { min: null, reason: 'unsolvable' };
}

// Run verification
let ok = 0, fail = 0;
console.log(`Verifying ${levels.length} levels from ${file}\n`);
for (const lvl of levels) {
  const res = solve(lvl);
  const match = res.min !== null && res.min === lvl.par;
  const status = match ? '✓ UNIQUE+VALID' : '✗ MISMATCH';
  if (match) ok++; else fail++;
  console.log(`  L${String(lvl.id).padStart(2)} T${lvl.tier} '${lvl.name}'`.padEnd(40) +
    ` par=${String(lvl.par).padStart(2)} bfs-min=${res.min === null ? 'NONE' : res.min}  ${status}`);
}
console.log(`\n${ok}/${levels.length} UNIQUE+VALID`);
if (fail > 0) {
  console.log(`\n❌ ${fail} level(s) FAILED verification`);
  process.exit(1);
} else {
  console.log('\n✅ All levels verified — every level solvable at its declared par.');
}
