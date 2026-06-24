// verify_independent.js — Independent Inertia level verifier (pure JS, no shared code with gen.py).
// Re-implements the slide mechanic + BFS solver from scratch and confirms every level is solvable.
// Also confirms: grid is well-formed, start/exit present, gems/mines inside grid, and the stored
// solution actually reaches the exit with all gems (independent confirmation).
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = data.levels;
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]; // up,down,left,right

function slide(grid, n, r, c, dr, dc, mineSet) {
  const cells = [];
  let cr = r, cc = c, dead = false;
  for (;;) {
    const nr = cr + dr, nc = cc + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) break;
    if (grid[nr * n + nc] === '#') break;
    cr = nr; cc = nc;
    cells.push([cr, cc]);
    if (mineSet.has(cr * n + cc)) { dead = true; break; }
    if (grid[cr * n + cc] === 'E') break;
  }
  return { fr: cr, fc: cc, cells, dead };
}

function bfs(grid, n, start, exitPos, gems, mines) {
  const gidx = new Map();
  gems.forEach((g, i) => gidx.set(g[0] * n + g[1], i));
  const full = (1 << gems.length) - 1;
  const mineSet = new Set(mines.map(m => m[0] * n + m[1]));
  const startState = start[0] * 1000 + start[1] * 10 + 0; // encoding r,c,mask via map below
  const seen = new Set();
  const key = (r, c, m) => r * n * (full + 1) + c * (full + 1) + m;
  seen.add(key(start[0], start[1], 0));
  const q = [[start[0], start[1], 0, []]];
  let head = 0;
  while (head < q.length) {
    const [r, c, mask, p] = q[head++];
    for (let di = 0; di < 4; di++) {
      const [dr, dc] = DIRS[di];
      const res = slide(grid, n, r, c, dr, dc, mineSet);
      if (res.dead) continue;
      if (res.fr === r && res.fc === c) continue;
      let nmask = mask;
      for (const [gr, gc] of res.cells) {
        const gi = gidx.get(gr * n + gc);
        if (gi !== undefined) nmask |= (1 << gi);
      }
      const k = key(res.fr, res.fc, nmask);
      if (seen.has(k)) continue;
      seen.add(k);
      const np = p.concat([di]);
      if (res.fr === exitPos[0] && res.fc === exitPos[1] && nmask === full) {
        return { par: np.length, sol: np };
      }
      q.push([res.fr, res.fc, nmask, np]);
    }
  }
  return null;
}

let pass = 0, fail = 0;
const t0 = Date.now();
for (const lv of levels) {
  const n = lv.size;
  const errs = [];
  if (lv.grid.length !== n * n) errs.push('grid size mismatch');
  if (!lv.start || !lv.exit) errs.push('missing start/exit');
  const gems = lv.gems || [], mines = lv.mines || [];
  // bounds
  for (const g of gems) if (g[0] < 0 || g[0] >= n || g[1] < 0 || g[1] >= n) errs.push('gem OOB');
  for (const m of mines) if (m[0] < 0 || m[0] >= n || m[1] < 0 || m[1] >= n) errs.push('mine OOB');
  // independent BFS
  const res = bfs(lv.grid, n, lv.start, lv.exit, gems, mines);
  if (!res) errs.push('NOT SOLVABLE (BFS)');
  // confirm stored solution reaches goal (replay)
  if (lv.solution && lv.solution.length) {
    const mineSet = new Set(mines.map(m => m[0] * n + m[1]));
    const gidx = new Map();
    gems.forEach((g, i) => gidx.set(g[0] * n + g[1], i));
    let r = lv.start[0], c = lv.start[1], mask = 0;
    let ok = true;
    for (const di of lv.solution) {
      const [dr, dc] = DIRS[di];
      const res2 = slide(lv.grid, n, r, c, dr, dc, mineSet);
      if (res2.dead) { ok = false; break; }
      for (const [gr, gc] of res2.cells) {
        const gi = gidx.get(gr * n + gc);
        if (gi !== undefined) mask |= (1 << gi);
      }
      r = res2.fr; c = res2.fc;
    }
    const full = (1 << gems.length) - 1;
    if (!(r === lv.exit[0] && c === lv.exit[1] && mask === full)) ok = false;
    if (!ok) errs.push('stored solution does NOT reach goal');
  }
  if (errs.length) {
    fail++;
    console.log(`FAIL L${lv.id} (${lv.tier} ${n}x${n}) par ${lv.par}: ${errs.join('; ')}`);
  } else {
    pass++;
    const parMatch = res.par === lv.par ? 'par-ok' : `par-diff(bfs=${res.par} vs ${lv.par})`;
    console.log(`OK   L${lv.id} (${lv.tier} ${n}x${n}) gems ${gems.length} mines ${mines.length} bfs-par ${res.par} ${parMatch}`);
  }
}
console.log(`\n${pass}/${levels.length} PASS, ${fail} FAIL in ${Date.now() - t0}ms`);
process.exit(fail === 0 ? 0 : 1);
