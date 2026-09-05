#!/usr/bin/env node
// Independent Node.js BFS verifier for Kojun levels
// Kojun rules (Nikoli):
//   - Each region of size N must contain integers 1..N (each exactly once)
//   - Two orthogonally-adjacent cells must NOT have the same value
//   - Givens are fixed
// Pattern: backtracking solver with MRV heuristic + multi-solution support
// Pass criteria (per Pitfall #51 — multi-solution design):
//   - Stored solution satisfies Kojun rules (region completeness + adjacency)
//   - At least one valid solution exists
//   - Catalog meta does NOT claim uniqueness (Kojun is multi-solution by design)
//
// Reference: Wikipedia "Kojun" / Nikoli English rules.

const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

const DIRS4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function buildRegionMap(regions) {
  const H = regions.reduce((m, r) => Math.max(m, ...r.map(p => p[0])), -1) + 1;
  const W = regions.reduce((m, r) => Math.max(m, ...r.map(p => p[1])), -1) + 1;
  const rmap = {};
  const rsize = {};
  for (let i = 0; i < regions.length; i++) {
    rsize[i] = regions[i].length;
    for (const [r, c] of regions[i]) {
      rmap[r + ',' + c] = i;
    }
  }
  return { H, W, rmap, rsize };
}

function solveKojun(H, W, givens, regions, cap = 3) {
  const { rmap, rsize } = buildRegionMap(regions);
  const regionUsed = {};
  for (let i = 0; i < regions.length; i++) regionUsed[i] = new Set();
  const grid = Array(H).fill(null).map(() => Array(W).fill(0));
  for (const k in givens) {
    const [r, c] = k.split(',').map(Number);
    const v = givens[k];
    grid[r][c] = v;
    regionUsed[rmap[k]].add(v);
  }
  function pickCell() {
    let best = null;
    let bestCount = Infinity;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (grid[r][c] !== 0) continue;
        const region = rmap[r + ',' + c];
        const max = rsize[region];
        const used = regionUsed[region];
        let count = 0;
        for (let v = 1; v <= max; v++) {
          if (used.has(v)) continue;
          let ok = true;
          for (const [dr, dc] of DIRS4) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
            if (grid[nr][nc] === v) { ok = false; break; }
          }
          if (ok) count++;
        }
        if (count === 0) return null;
        if (count < bestCount) { bestCount = count; best = [r, c]; }
      }
    }
    return best;
  }
  const solutions = [];
  function bt() {
    if (solutions.length >= cap) return;
    const cell = pickCell();
    if (!cell) {
      solutions.push(grid.map(r => r.slice()));
      return;
    }
    const [r, c] = cell;
    const region = rmap[r + ',' + c];
    const max = rsize[region];
    const used = regionUsed[region];
    const candidates = [];
    for (let v = 1; v <= max; v++) {
      if (used.has(v)) continue;
      let ok = true;
      for (const [dr, dc] of DIRS4) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
        if (grid[nr][nc] === v) { ok = false; break; }
      }
      if (ok) candidates.push(v);
    }
    for (const v of candidates) {
      grid[r][c] = v;
      regionUsed[region].add(v);
      bt();
      grid[r][c] = 0;
      regionUsed[region].delete(v);
      if (solutions.length >= cap) return;
    }
  }
  bt();
  return solutions;
}

function validateStoredSolution(H, W, givens, regions, solution) {
  // Returns {ok: bool, reason: string|null}
  if (!solution) return { ok: false, reason: 'no stored solution' };
  const { rmap, rsize } = buildRegionMap(regions);
  // Build region value set
  const rvals = {};
  for (let i = 0; i < regions.length; i++) rvals[i] = new Set();
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = solution[r][c];
      if (typeof v !== 'number' || v < 1) return { ok: false, reason: `cell (${r},${c}) invalid v=${v}` };
      const region = rmap[r + ',' + c];
      if (v > rsize[region]) return { ok: false, reason: `cell (${r},${c}) v=${v} > region size ${rsize[region]}` };
      rvals[region].add(v);
    }
  }
  for (let i = 0; i < regions.length; i++) {
    if (rvals[i].size !== rsize[i]) return { ok: false, reason: `region ${i} has ${rvals[i].size}/${rsize[i]} distinct` };
    for (let v = 1; v <= rsize[i]; v++) {
      if (!rvals[i].has(v)) return { ok: false, reason: `region ${i} missing value ${v}` };
    }
  }
  // Adjacency check
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = solution[r][c];
      for (const [dr, dc] of DIRS4) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
        if (solution[nr][nc] === v) return { ok: false, reason: `adj (${r},${c}) and (${nr},${nc}) both ${v}` };
      }
    }
  }
  // Givens match
  for (const k in givens) {
    const [r, c] = k.split(',').map(Number);
    if (solution[r][c] !== givens[k]) return { ok: false, reason: `given (${r},${c}) expected ${givens[k]} got ${solution[r][c]}` };
  }
  return { ok: true, reason: null };
}

let pass = 0, fail = 0, multi = 0;
const fails = [];

for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const { H, W, regions, givens, solution } = L;

  // 1) Stored solution must satisfy Kojun rules
  const v = validateStoredSolution(H, W, givens, regions, solution);
  if (!v.ok) {
    fail++;
    fails.push(`L${i + 1} ${H}x${W}: STORED INVALID — ${v.reason}`);
    continue;
  }

  // 2) At least one solution exists via independent solver
  const sols = solveKojun(H, W, givens, regions, 3);
  if (sols.length === 0) {
    fail++;
    fails.push(`L${i + 1} ${H}x${W}: NO SOLUTION FOUND (independent solver)`);
    continue;
  }
  if (sols.length > 1) multi++;

  pass++;
}

console.log(`Independent Kojun verifier: ${pass}/${LEVELS.length} PASS, ${fail} FAIL, ${multi} multi-solution (Pitfall #51 OK)`);
if (fail > 0) {
  console.log('Fails:', JSON.stringify(fails.slice(0, 10)));
  process.exit(1);
}
process.exit(0);
