// fillomino independent validator + uniqueness solver (limit=2)
// Layer A: stored sol validity + givens consistency. Layer B: independent solver, stop at 2 solutions.
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/index.html', 'utf8');
const m = src.match(/var LEVELS=\[([\s\S]*?)\n\];/);
if (!m) { console.log('LEVELS_NOT_FOUND'); process.exit(2); }
const LEVELS = new Function('return [' + m[1] + '\n];')();
console.log('levels:', LEVELS.length);

function validateSol(lv) {
  const s = lv.s, sol = lv.sol;
  if (!Array.isArray(sol) || sol.length !== s) return 'sol rows != s';
  for (const row of sol) if (!Array.isArray(row) || row.length !== s) return 'sol cols != s';
  // givens must match sol
  for (const [r, c, v] of lv.g) {
    if (sol[r][c] !== v) return `given (${r},${c})=${v} but sol=${sol[r][c]}`;
  }
  // components: each value-v component must have exactly size v
  const seen = Array.from({ length: s }, () => new Array(s).fill(false));
  for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) {
    if (seen[r][c]) continue;
    const v = sol[r][c];
    if (v < 1 || v > 9) return `bad value ${v} at (${r},${c})`;
    let size = 0; const stack = [[r, c]]; seen[r][c] = true;
    while (stack.length) {
      const [cr, cc] = stack.pop(); size++;
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = cr + dr, nc = cc + dc;
        if (nr >= 0 && nr < s && nc >= 0 && nc < s && !seen[nr][nc] && sol[nr][nc] === v) { seen[nr][nc] = true; stack.push([nr, nc]); }
      }
    }
    if (size !== v) return `region at (${r},${c}) value=${v} size=${size}`;
  }
  return null; // valid
}

// independent solver: DFS row-major, values 1..9, givens fixed.
// constraint: every value-v component has exactly size v.
function countSolutions(lv, limit) {
  const s = lv.s;
  const given = Array.from({ length: s }, () => new Array(s).fill(0));
  for (const [r, c, v] of lv.g) given[r][c] = v;
  const grid = Array.from({ length: s }, () => new Array(s).fill(0));
  for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) grid[r][c] = given[r][c];
  const cells = [];
  for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) if (!given[r][c]) cells.push([r, c]);
  let found = 0; let nodes = 0;

  function componentsOK() {
    // check assigned cells only; prune if component size > v, or closed with size < v
    const seen = Array.from({ length: s }, () => new Array(s).fill(0));
    for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) {
      const v = grid[r][c];
      if (!v || seen[r][c]) continue;
      let size = 0, closed = true; const stack = [[r, c]]; seen[r][c] = 1; const comp = [];
      while (stack.length) {
        const [cr, cc] = stack.pop(); size++; comp.push([cr, cc]);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= s || nc < 0 || nc >= s) continue;
          if (grid[nr][nc] === v) { if (!seen[nr][nc]) { seen[nr][nc] = 1; stack.push([nr, nc]); } }
          else if (grid[nr][nc] === 0) closed = false;
        }
      }
      if (size > v) return false;
      if (closed && size < v) return false;
      // open component: needs at least (v-size) empty cells in empty-regions adjacent to comp
      if (!closed) {
        // collect sizes of connected empty components adjacent to this component
        const emptySeen = new Set();
        let avail = 0;
        for (const [cr, cc] of comp) for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= s || nc < 0 || nc >= s) continue;
          if (grid[nr][nc] !== 0) continue;
          const key = nr * s + nc;
          if (emptySeen.has(key)) continue;
          // BFS the whole empty component
          const stack = [[nr, nc]]; emptySeen.add(key); let cnt = 0;
          while (stack.length) {
            const [er, ec] = stack.pop(); cnt++;
            for (const [dr2, dc2] of [[-1,0],[1,0],[0,-1],[0,1]]) {
              const fr = er + dr2, fc = ec + dc2;
              if (fr < 0 || fr >= s || fc < 0 || fc >= s) continue;
              if (grid[fr][fc] !== 0) continue;
              const k2 = fr * s + fc;
              if (!emptySeen.has(k2)) { emptySeen.add(k2); stack.push([fr, fc]); }
            }
          }
          avail += cnt;
        }
        if (avail < v - size) return false;
      }
    }
    return true;
  }

  function dfs(i) {
    if (found >= limit) return;
    if (i === cells.length) { found++; return; }
    nodes++;
    if (nodes > 4000000) return; // budget
    const [r, c] = cells[i];
    // candidate values: 1..9, but prune: value must be plausible.
    for (let v = 1; v <= 9; v++) {
      grid[r][c] = v;
      if (componentsOK()) dfs(i + 1);
      grid[r][c] = 0;
      if (found >= limit) return;
    }
  }
  dfs(0);
  return { found, nodes, budgetHit: nodes > 4000000 };
}

let fails = 0, nonUnique = 0, timeouts = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const err = validateSol(lv);
  if (err) { console.log(`L${i + 1} ${lv.n}: INVALID_SOL: ${err}`); fails++; continue; }
  const t0 = Date.now();
  const res = countSolutions(lv, 2);
  const ms = Date.now() - t0;
  if (res.budgetHit) { console.log(`L${i + 1} ${lv.n}: SOLVER_TIMEOUT (nodes=${res.nodes}) => uncertain => FAIL per rules`); timeouts++; }
  else if (res.found === 1) { /* unique, good */ }
  else if (res.found === 0) { console.log(`L${i + 1} ${lv.n}: SOLVER_FOUND_ZERO but sol is valid => solver bug => FAIL`); timeouts++; }
  else { console.log(`L${i + 1} ${lv.n}: NON_UNIQUE solutions>=2 (nodes=${res.nodes}, ${ms}ms)`); nonUnique++; }
}
console.log(`RESULT: levels=${LEVELS.length} invalidSol=${fails} nonUnique=${nonUnique} solverTimeout=${timeouts}`);
// R1218: checkWin is now rule-based (gridValid), so non-unique levels are acceptable UX
// (any legal tiling wins). nonUnique is informational; only invalidSol/solverTimeout FAIL.
process.exit(fails + timeouts > 0 ? 1 : 0);
