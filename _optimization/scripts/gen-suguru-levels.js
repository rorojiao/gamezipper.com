#!/usr/bin/env node
/* suguru level generator — unique-solution guarantee under the engine's exact rules
 * (region size N → digits 1..N each exactly once; 8-adjacency: no equal values touch).
 * Pipeline per level: grow contiguous regions (sizes 1-5) → solve full grid →
 * dig givens greedily keeping UNIQUE solution (engine solveSuguru semantics) →
 * floor on givens count per difficulty for human solvability.
 * Output: state/suguru-levels.json {easy:[10],medium:[10],hard:[10]} in engine format. */
const fs = require('fs');
const path = require('path');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const CFG = { easy: { n: 10, size: 5, maxR: 5, keepFrac: 0.45, band: 0.06, attempts: 200, nodeBudget: 6e6 }, medium: { n: 10, size: 7, maxR: 5, keepFrac: 0.40, band: 0.08, attempts: 200, nodeBudget: 8e6 }, hard: { n: 10, size: 9, maxR: 5, keepFrac: 0.30, band: 0.10, attempts: 120, nodeBudget: 1.2e7 } };
// solve() must expose node count for the per-attempt budget

function growRegions(N, rnd, maxR) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const regionOf = new Array(N * N).fill(-1);
    const regions = [];
    // ~N²/4 seeds (avg region size ~4): too many small regions ⇒ adjacent size-1 pairs are
    // provably unsolvable (both forced to 1 under 8-adjacency)
    const nSeeds = Math.max(4, Math.round(N * N / 4));
    const cells = Array.from({ length: N * N }, (_, i) => i).sort(() => rnd() - 0.5);
    for (const c of cells) {
      if (regions.length >= nSeeds) break;
      if (regionOf[c] !== -1) continue;
      // min-distance rejection so seeds spread out
      const x = c % N, y = (c / N) | 0;
      const tooClose = regions.some(r0 => { const c0 = r0[0]; return Math.max(Math.abs(c0 % N - x), Math.abs(((c0 / N) | 0) - y)) < 2; });
      if (tooClose) continue;
      const id = regions.length; regions.push([c]); regionOf[c] = id;
    }
    // leftover: any still-unassigned cell joins an adjacent region later via growth
    // grow: random region gains a random adjacent unassigned cell, capped at maxR
    let guard = 0;
    while (regionOf.includes(-1) && guard++ < 20000) {
      const rid = Math.floor(rnd() * regions.length);
      if (regions[rid].length >= maxR) continue;
      const frontier = [];
      for (const c of regions[rid]) {
        const x = c % N, y = (c / N) | 0;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          const ni = ny * N + nx;
          if (regionOf[ni] === -1) frontier.push(ni);
        }
      }
      if (!frontier.length) continue;
      const pick = frontier[Math.floor(rnd() * frontier.length)];
      regions[rid].push(pick); regionOf[pick] = rid;
    }
    if (!regionOf.includes(-1) && regions.every(r => r.length >= 1 && r.length <= maxR)) {
      // regions must be contiguous (guaranteed by growth) and cover exactly
      return regions;
    }
  }
  throw new Error('region growth failed');
}

// solver identical in semantics to engine solveSuguru: count solutions up to 2, return first found
// performance: MRV cell ordering (most-constrained first) + candidate precompute — critical for 9x9
function solve(N, regions, givens) {
  const regionOf = new Array(N * N).fill(-1);
  regions.forEach((r, ri) => r.forEach(c => regionOf[c] = ri));
  const grid = new Array(N * N).fill(0);
  const gk = Object.keys(givens);
  for (const k of gk) grid[+k] = givens[+k];
  let count = 0, first = null, nodes = 0;
  const NODE_CAP = 300000;
  const nb = []; // neighbor lists (8-adjacency)
  for (let c = 0; c < N * N; c++) {
    const x = c % N, y = (c / N) | 0, l = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < N && ny < N) l.push(ny * N + nx);
    }
    nb.push(l);
  }
  function cands(c) {
    const sz = regions[regionOf[c]].length, used = new Set();
    for (const n of nb[c]) if (grid[n]) used.add(grid[n]);
    for (const n of regions[regionOf[c]]) if (n !== c && grid[n]) used.add(grid[n]);
    const out = [];
    for (let v = 1; v <= sz; v++) if (!used.has(v)) out.push(v);
    return out;
  }
  function bt() {
    if (count > 1 || nodes++ > NODE_CAP) return;
    // MRV: unfilled cell with fewest candidates
    let best = -1, bestC = null;
    for (let c = 0; c < grid.length; c++) {
      if (grid[c]) continue;
      const cc = cands(c);
      if (bestC === null || cc.length < bestC.length) { best = c; bestC = cc; if (cc.length <= 1) break; }
    }
    if (best === -1) { count++; if (!first) first = grid.slice(); return; }
    if (bestC.length === 0) return; // dead end
    for (const v of bestC) {
      grid[best] = v; bt(); grid[best] = 0;
      if (count > 1) return;
    }
  }
  bt();
  return { count: nodes > NODE_CAP ? 2 : count, solution: count === 1 ? first : null, nodes }; // cap-hit ⇒ treat as non-unique (conservative)
}

function genOne(size, cfg, seed) {
  let nNoSol = 0, nOutBand = 0, nBudget = 0, bandSamples = [];
  for (let attempt = 0; attempt < cfg.attempts; attempt++) {
    if (attempt % 10 === 9) console.error(`PROGRESS ${size}x${size} attempt=${attempt + 1}/${cfg.attempts} noSol=${nNoSol} budget=${nBudget}`); // PROGRESS
    const rnd = mulberry32(seed + attempt * 104729);
    const regions = growRegions(size, rnd, cfg.maxR);
    const res0 = solveNoUnique(size, regions, mulberry32(seed + attempt * 7919));
    if (!res0) { nNoSol++; continue; }
    const sol = res0;
    // dig to TARGET (stop at keepFrac); removal kept only if puzzle stays UNIQUE
    // (full re-count with the MRV solver — fast enough, and semantics match engine exactly)
    const givens = {}; sol.forEach((v, i) => givens[i] = v);
    const target = Math.round(size * size * cfg.keepFrac);
    const order = Object.keys(givens).map(Number).sort(() => rnd() - 0.5);
    let nodesSpent = 0;
    let abandoned = false;
    for (const c of order) {
      if (Object.keys(givens).length <= target) break;
      const v = givens[c]; delete givens[c];
      const r = solve(size, regions, givens);
      nodesSpent += r.nodes || 0;
      if (nodesSpent > (cfg.nodeBudget || 6e6)) { abandoned = true; break; } // pathological partition — next attempt
      if (r.count === 1) { /* keep removed */ } else givens[c] = v; // UNKNOWN(cap) or multi → restore (conservative)
    }
    if (abandoned) { nBudget++; continue; }
    const givensCount = Object.keys(givens).length;
    if (bandSamples.length < 6) bandSamples.push(givensCount);
    if (givensCount >= target - Math.round(size * size * cfg.band) && givensCount <= target + Math.round(size * size * cfg.band)) {
      return { grid: [size, size], regions, givens, givensCount, solution: sol };
    }
  }
  throw new Error(`genOne failed (noSol=${nNoSol} budgetAbandon=${nBudget} outBand=${nOutBand} bandSamples=${bandSamples.join(',')})`);
}
function solveNoUnique(N, regions, rnd) {
  // find ANY valid completion — MRV ordering (critical for 9x9)
  const regionOf = new Array(N * N).fill(-1);
  regions.forEach((r, ri) => r.forEach(c => regionOf[c] = ri));
  const g = new Array(N * N).fill(0);
  const nb = [];
  for (let c = 0; c < N * N; c++) {
    const x = c % N, y = (c / N) | 0, l = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < N && ny < N) l.push(ny * N + nx);
    }
    nb.push(l);
  }
  function cands(cell) {
    const sz = regions[regionOf[cell]].length, used = new Set();
    for (const n of nb[cell]) if (g[n]) used.add(g[n]);
    for (const n of regions[regionOf[cell]]) if (n !== cell && g[n]) used.add(g[n]);
    const out = [];
    for (let v = 1; v <= sz; v++) if (!used.has(v)) out.push(v);
    return out;
  }
  function bt() {
    let best = -1, bestC = null;
    for (let c = 0; c < g.length; c++) {
      if (g[c]) continue;
      const cc = cands(c);
      if (bestC === null || cc.length < bestC.length) { best = c; bestC = cc; if (cc.length <= 1) break; }
    }
    if (best === -1) return true;
    if (!bestC.length) return false;
    const vals = bestC.slice().sort(() => rnd() - 0.5);
    for (const v of vals) { g[best] = v; if (bt()) return true; g[best] = 0; }
    return false;
  }
  return bt() ? g : null;
}

const out = {};
// worker mode: --diff hard --idx 0,1 --seed-base 9000 → generate only those indices,
// write state/suguru-<diff>-w<seedbase>.json (merge step assembles the final file)
const argOf = k => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const ONLY_DIFF = argOf('--diff'), ONLY_IDX = argOf('--idx') ? argOf('--idx').split(',').map(Number) : null, SEED_BASE = parseInt(argOf('--seed-base') || '0', 10);
for (const [diff, cfg] of Object.entries(CFG)) {
  if (ONLY_DIFF && diff !== ONLY_DIFF) continue;
  out[diff] = [];
  const idxs = ONLY_IDX || Array.from({ length: cfg.n }, (_, i) => i);
  for (const i of idxs) {
    const L = genOne(cfg.size, cfg, (SEED_BASE || 0x51ed) + i * 31337 + cfg.size * 7);
    // final independent check: unique solution + givens consistent
    const chk = solve(cfg.size, L.regions, L.givens);
    if (chk.count !== 1 || !chk.solution) { console.error('FINAL CHECK FAILED', diff, i); process.exit(1); }
    out[diff].push({ grid: L.grid, regions: L.regions, givens: L.givens, givensCount: L.givensCount });
    console.log(`${diff} #${i + 1}: ${cfg.size}x${cfg.size} regions=${L.regions.length} givens=${L.givensCount} unique ✓`);
  }
}
if (ONLY_DIFF) {
  fs.writeFileSync(path.join(__dirname, '..', 'state', `suguru-${ONLY_DIFF}-w${SEED_BASE}.json`), JSON.stringify({ generated: new Date().toISOString(), levels: out }, null, 1));
  console.log(`OK: worker slice written (diff=${ONLY_DIFF} seed=${SEED_BASE}).`);
} else {
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'suguru-levels.json'), JSON.stringify({ generated: new Date().toISOString(), levels: out }, null, 1));
  console.log('OK: 30 levels, all unique-solution verified under engine rules (8-adjacency).');
}
