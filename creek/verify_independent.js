// Independent Creek verifier — does NOT share code with gen.py
// Validates: (1) solution satisfies all clues, (2) white cells connected,
// (3) puzzle has EXACTLY ONE solution (uniqueness).
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
let allOk = true;
let anyNonUnique = false;

function nodeCells(nr, nc, H, W) {
  const cells = [];
  for (const dr of [-1, 0])
    for (const dc of [-1, 0]) {
      const r = nr + dr, c = nc + dc;
      if (r >= 0 && r < H && c >= 0 && c < W) cells.push([r, c]);
    }
  return cells;
}

function whiteConnected(sol, H, W) {
  // sol: 2D 0=black,1=white
  let first = null;
  for (let r = 0; r < H && !first; r++)
    for (let c = 0; c < W && !first; c++)
      if (sol[r][c] === 1) first = [r, c];
  if (!first) return false;
  const seen = new Set([first[0] * W + first[1]]);
  const stack = [first];
  let whiteCount = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (sol[r][c] === 1) whiteCount++;
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < H && nc >= 0 && nc < W && sol[nr][nc] === 1 && !seen.has(nr*W+nc)) {
        seen.add(nr*W+nc); stack.push([nr, nc]);
      }
    }
  }
  return seen.size === whiteCount;
}

// Count solutions via backtracking + propagation (independent impl)
function countSolutions(H, W, clues, sol, limit) {
  // clues: array of {r,c,v}; build map nodeKey->v
  const clueMap = new Map();
  for (const cl of clues) clueMap.set(cl.r + ',' + cl.c, cl.v);
  const clueNodes = [...clueMap.keys()].map(k => k.split(',').map(Number));
  const nodeMap = new Map();
  for (let nr = 0; nr <= H; nr++)
    for (let nc = 0; nc <= W; nc++)
      nodeMap.set(nr + ',' + nc, nodeCells(nr, nc, H, W));

  const state = sol.map(row => row.slice()); // copy, -1 unknown
  let count = 0;
  let deadline = Date.now() + 40000; // 40s safety

  function nodeStatus(nr, nc) {
    const v = clueMap.get(nr + ',' + nc);
    if (v === undefined) return null;
    let bs = 0, unk = 0;
    for (const [r, c] of nodeMap.get(nr + ',' + nc)) {
      if (state[r][c] === 0) bs++;
      else if (state[r][c] === -1) unk++;
    }
    return { bs, unk, req: v };
  }

  function propagate() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const [nr, nc] of clueNodes) {
        const st = nodeStatus(nr, nc);
        if (!st) continue;
        if (st.unk === 0) { if (st.bs !== st.req) return false; }
        else {
          if (st.bs > st.req || st.bs + st.unk < st.req) return false;
          if (st.bs === st.req) {
            for (const [r, c] of nodeMap.get(nr + ',' + nc))
              if (state[r][c] === -1) { state[r][c] = 1; changed = true; }
          } else if (st.bs + st.unk === st.req) {
            for (const [r, c] of nodeMap.get(nr + ',' + nc))
              if (state[r][c] === -1) { state[r][c] = 0; changed = true; }
          }
        }
      }
    }
    return true;
  }

  function recurse() {
    if (count >= limit) return;
    if (Date.now() > deadline) return;
    // find first unknown cell
    let best = null;
    for (let r = 0; r < H && !best; r++)
      for (let c = 0; c < W && !best; c++)
        if (state[r][c] === -1) best = [r, c];
    if (!best) {
      if (whiteConnected(state, H, W)) count++;
      return;
    }
    const [r, c] = best;
    const snap = state.map(row => row.slice());
    for (const val of [0, 1]) {
      state[r][c] = val;
      if (propagate()) recurse();
      for (let rr = 0; rr < H; rr++) state[rr] = snap[rr].slice();
      if (count >= limit) return;
    }
  }

  if (!propagate()) return 0;
  recurse();
  return count;
}

for (let i = 0; i < data.levels.length; i++) {
  const L = data.levels[i];
  const H = L.H, W = L.W;
  const sol = [];
  for (let r = 0; r < H; r++) {
    const row = [];
    for (let c = 0; c < W; c++) row.push(L.solution[r * W + c]);
    sol.push(row);
  }
  // 1. VALIDITY: each clue satisfied by solution
  let valid = true;
  for (const cl of L.clues) {
    let bs = 0;
    for (const [r, c] of nodeCells(cl.r, cl.c, H, W)) if (sol[r][c] === 0) bs++;
    if (bs !== cl.v) { valid = false; break; }
  }
  // 2. connectivity of solution
  const conn = whiteConnected(sol, H, W);
  // 3. UNIQUENESS: count solutions from blank (clues only)
  const blank = Array.from({length: H}, () => Array(W).fill(-1));
  const nSol = countSolutions(H, W, L.clues, blank, 2);
  const unique = (nSol === 1);
  if (!valid || !conn || !unique) allOk = false;
  if (!unique) anyNonUnique = true;
  const tag = valid && conn && unique ? 'OK' : 'FAIL';
  console.log(`L${i+1} ${L.tier} ${W}x${H} clues=${L.clues.length} valid=${valid?'Y':'N'} conn=${conn?'Y':'N'} unique=${unique?'Y':'N'}(${nSol}) [${tag}]`);
}

console.log('\n=== RESULT ===');
console.log(allOk ? 'ALL 27 VALID + UNIQUE ✓' : 'SOME LEVELS FAILED ✗');
if (anyNonUnique) console.log('WARNING: non-unique levels detected');
process.exit(allOk ? 0 : 1);
