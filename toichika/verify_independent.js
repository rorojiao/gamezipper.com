#!/usr/bin/env node
// Independent Node.js verifier for Toichika levels.
// Re-implements the 4 rules from scratch. Verifies the stored solution is valid
// AND counts solutions (with incremental pruning) to report uniqueness distribution.
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
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
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) cells[region[r][c]].push([r, c]);
  const adjacent = buildAdj(region, R, C, nreg);
  const byRegion = Array.from({ length: nreg }, () => []);

  // A finished puzzle is a matching of non-adjacent regions. A pair is legal
  // when its arrows face each other on one row or column and no other arrow
  // occupies a cell between them. Enumerating pairs makes that sightline rule
  // explicit, rather than guessing at it with unsound partial assignments.
  for (let a = 0; a < nreg; a++) for (let b = a + 1; b < nreg; b++) {
    if (adjacent[a].has(b)) continue;
    for (const [ar, ac] of cells[a]) for (const [br, bc] of cells[b]) {
      if (ar !== br && ac !== bc) continue;
      const dr = Math.sign(br - ar);
      const dc = Math.sign(bc - ac);
      if (dr === 0 && dc === 0) continue;
      const dA = dr === 1 ? 'D' : dr === -1 ? 'U' : dc === 1 ? 'R' : 'L';
      const dB = OPP[dA];
      const between = [];
      for (let r = ar + dr, c = ac + dc; r !== br || c !== bc; r += dr, c += dc) between.push(r + ',' + c);
      const candidate = {
        a, b,
        aKey: ar + ',' + ac,
        bKey: br + ',' + bc,
        between,
        aArrow: [ar, ac, dA],
        bArrow: [br, bc, dB],
      };
      byRegion[a].push(candidate);
      byRegion[b].push(candidate);
    }
  }

  const assigned = new Array(nreg).fill(false);
  const endpoints = new Set();
  const blocked = new Map();
  let count = 0;

  function viable(candidate) {
    return !assigned[candidate.a] && !assigned[candidate.b]
      && !blocked.has(candidate.aKey) && !blocked.has(candidate.bKey)
      && candidate.between.every(key => !endpoints.has(key));
  }

  function chooseRegion() {
    let choice = -1;
    let candidates = null;
    for (let regionId = 0; regionId < nreg; regionId++) {
      if (assigned[regionId]) continue;
      const viableCandidates = byRegion[regionId].filter(viable);
      if (viableCandidates.length === 0) return { regionId, candidates: viableCandidates };
      if (!candidates || viableCandidates.length < candidates.length) {
        choice = regionId;
        candidates = viableCandidates;
      }
    }
    return choice === -1 ? null : { regionId: choice, candidates };
  }

  function search(done) {
    if (count >= cap) return;
    if (done === nreg) {
      count++;
      return;
    }
    const choice = chooseRegion();
    if (!choice || choice.candidates.length === 0) return;
    for (const candidate of choice.candidates) {
      assigned[candidate.a] = true;
      assigned[candidate.b] = true;
      endpoints.add(candidate.aKey);
      endpoints.add(candidate.bKey);
      for (const key of candidate.between) blocked.set(key, (blocked.get(key) || 0) + 1);
      search(done + 2);
      for (const key of candidate.between) {
        const remaining = blocked.get(key) - 1;
        if (remaining) blocked.set(key, remaining); else blocked.delete(key);
      }
      endpoints.delete(candidate.aKey);
      endpoints.delete(candidate.bKey);
      assigned[candidate.a] = false;
      assigned[candidate.b] = false;
      if (count >= cap) return;
    }
  }

  search(0);
  return count;
}

let pass = 0, fail = 0;
const dist = { unique: 0, few: 0, many: 0 };
for (const lv of levels) {
  const { R, C, nreg, region, solution } = lv;
  const adj = buildAdj(region, R, C, nreg);
  const assign = solution.map(s => [s.r, s.c, s.d]);
  const ok = validate(assign, adj, R, C, nreg);
  const count = countSolutions(region, R, C, nreg, 2);
  if (ok && count >= 1) {
    pass++;
    if (count === 1) dist.unique++;
    else dist.many++;
    console.log(`L${lv.num} ${R}x${C} ${nreg}reg: VALID, solutions=${count === 1 ? '1' : '2+'}`);
  } else {
    fail++;
    console.log(`L${lv.num} ${R}x${C}: FAIL (validOK=${ok}, count=${count})`);
  }
}
console.log(`\n${pass}/${levels.length} VALID. Counted unique=${dist.unique}; multiple (capped at 2)=${dist.many}. FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
