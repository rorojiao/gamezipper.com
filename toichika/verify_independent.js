#!/usr/bin/env node
// Independent Node.js verifier for Toichika levels.
// Re-implements the 4 rules from scratch. Verifies the stored solution is valid
// AND counts solutions (with incremental pruning) to report uniqueness distribution.
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const levels = data.levels;
const DIRS = { R: [0, 1], L: [0, -1], D: [1, 0], U: [-1, 0] };
const OPP = { R: 'L', L: 'R', D: 'U', U: 'D' };

function buildAdj(region, R, C, nreg) {
  const adj = Array.from({ length: nreg }, () => new Set());
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const i = region[r][c];
    for (const [dr, dc] of Object.values(DIRS)) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
        const j = region[nr][nc];
        if (j !== i) { adj[i].add(j); adj[j].add(i); }
      }
    }
  }
  return adj;
}

function findPartner(r, c, d, arrowAt, R, C) {
  const [dr, dc] = DIRS[d];
  let nr = r + dr, nc = c + dc;
  while (nr >= 0 && nr < R && nc >= 0 && nc < C) {
    if (arrowAt.has(nr + ',' + nc)) return [nr, nc];
    nr += dr; nc += dc;
  }
  return null;
}

function validate(assign, adj, R, C, nreg) {
  const arrowAt = new Map();
  for (let i = 0; i < nreg; i++) {
    const [r, c, d] = assign[i];
    arrowAt.set(r + ',' + c, [i, d]);
  }
  if (arrowAt.size !== nreg) return false;
  for (const [key, [i, d]] of arrowAt) {
    const [r, c] = key.split(',').map(Number);
    const p = findPartner(r, c, d, arrowAt, R, C);
    if (!p) return false;
    const [pi, pd] = arrowAt.get(p[0] + ',' + p[1]);
    if (pd !== OPP[d]) return false;
    if (adj[i].has(pi)) return false;
  }
  return true;
}

function countSolutions(region, R, C, nreg, cap) {
  const cells = Array.from({ length: nreg }, () => []);
  const regionOf = {};
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    cells[region[r][c]].push([r, c]);
    regionOf[r + ',' + c] = region[r][c];
  }
  const adj = buildAdj(region, R, C, nreg);
  const choices = cells.map(cs => {
    const out = [];
    for (const [r, c] of cs) for (const d of Object.keys(DIRS)) {
      const [dr, dc] = DIRS[d];
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([r, c, d]);
    }
    return out;
  });
  const order = [...Array(nreg).keys()].sort((a, b) => choices[a].length - choices[b].length);
  const assign = new Array(nreg).fill(null);
  const occupied = new Map(); // "r,c" -> [regionIdx, dir]
  let count = 0, nodes = 0;
  const NODE_CAP = 2000000;

  function partialOk(i, r, c, d) {
    const [dr, dc] = DIRS[d];
    let nr = r + dr, nc = c + dc;
    const between = [];
    while (nr >= 0 && nr < R && nc >= 0 && nc < C) {
      const key = nr + ',' + nc;
      if (occupied.has(key)) {
        const unassignedBetween = between.some(b => assign[regionOf[b]] === null);
        if (!unassignedBetween) {
          const [j, pd] = occupied.get(key);
          if (pd !== OPP[d]) return false;
          if (adj[i].has(j)) return false;
        }
        return true;
      }
      between.push(key);
      nr += dr; nc += dc;
    }
    for (const b of between) if (assign[regionOf[b]] === null) return true;
    return false;
  }

  function bt(k) {
    if (count >= cap || nodes > NODE_CAP) return;
    nodes++;
    if (k === nreg) { if (validate(assign, adj, R, C, nreg)) count++; return; }
    const i = order[k];
    for (const ch of choices[i]) {
      const [r, c, d] = ch;
      assign[i] = ch;
      occupied.set(r + ',' + c, [i, d]);
      if (partialOk(i, r, c, d)) bt(k + 1);
      occupied.delete(r + ',' + c);
      assign[i] = null;
      if (count >= cap || nodes > NODE_CAP) return;
    }
  }
  bt(0);
  return { count, capped: nodes > NODE_CAP };
}

let pass = 0, fail = 0;
const dist = { unique: 0, few: 0, many: 0 };
for (const lv of levels) {
  const { R, C, nreg, region, solution } = lv;
  const adj = buildAdj(region, R, C, nreg);
  const assign = solution.map(s => [s.r, s.c, s.d]);
  const ok = validate(assign, adj, R, C, nreg);
  const { count, capped } = countSolutions(region, R, C, nreg, 20);
  if (ok && count >= 1) {
    pass++;
    if (count === 1) dist.unique++;
    else if (count <= 5) dist.few++;
    else dist.many++;
    console.log(`L${lv.num} ${R}x${C} ${nreg}reg: VALID, solutions=${count}${capped ? '+' : ''}`);
  } else {
    fail++;
    console.log(`L${lv.num} ${R}x${C}: FAIL (validOK=${ok}, count=${count})`);
  }
}
console.log(`\n${pass}/${levels.length} VALID. Distribution: unique=${dist.unique} few(2-5)=${dist.few} many(6+)=${dist.many}. FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
