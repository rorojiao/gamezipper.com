#!/usr/bin/env node
// Pre-generation script for Ripple Effect puzzle levels
// Uses a powerful solver with constraint propagation + region-based solving

'use strict';

// ========== RNG ==========
function mulberry32(a) {
  return function() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== REGION GENERATION ==========
function generateRegions(size, rng, maxRegionSize, minRegionSize) {
  minRegionSize = minRegionSize || 3;
  const grid = Array.from({length: size}, () => Array(size).fill(-1));
  const regions = [];
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      cells.push([r, c]);
  shuffle(cells, rng);

  let rid = 0;
  for (const [sr, sc] of cells) {
    if (grid[sr][sc] !== -1) continue;
    const target = minRegionSize + Math.floor(rng() * (maxRegionSize - minRegionSize + 1));
    const region = [[sr, sc]];
    grid[sr][sc] = rid;
    let tries = 0;
    while (region.length < target && tries < 100) {
      tries++;
      const candidates = [];
      for (const [rr, cc] of region) {
        for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
          const nr = rr + dr, nc = cc + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1)
            candidates.push([nr, nc]);
        }
      }
      if (!candidates.length) break;
      const [nr, nc] = candidates[Math.floor(rng() * candidates.length)];
      region.push([nr, nc]);
      grid[nr][nc] = rid;
    }
    regions.push(region);
    rid++;
  }

  // Merge singletons
  for (let i = regions.length - 1; i >= 0; i--) {
    if (regions[i].length > 1) continue;
    const [r, c] = regions[i][0];
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== i) {
        const targetRid = grid[nr][nc];
        regions[targetRid].push([r, c]);
        grid[r][c] = targetRid;
        for (let rr = 0; rr < size; rr++)
          for (let cc = 0; cc < size; cc++)
            if (grid[rr][cc] === i) grid[rr][cc] = targetRid;
        regions.splice(i, 1);
        break;
      }
    }
  }

  const regionMap = Array.from({length: size}, () => Array(size).fill(-1));
  for (let i = 0; i < regions.length; i++)
    for (const [r, c] of regions[i]) regionMap[r][c] = i;
  return { regions, regionMap };
}

// ========== SOLVER: Region-by-region with valid assignment generation ==========
function solveRegionByRegion(size, regions, regionMap, rng) {
  const solution = Array.from({length: size}, () => Array(size).fill(0));
  const regionSizes = regions.map(r => r.length);

  // Sort regions: smallest first (more constrained first)
  const order = Array.from({length: regions.length}, (_, i) => i);
  order.sort((a, b) => regionSizes[a] - regionSizes[b]);

  function canPlace(r, c, val) {
    for (let cc = Math.max(0, c - val); cc <= Math.min(size - 1, c + val); cc++)
      if (cc !== c && solution[r][cc] === val) return false;
    for (let rr = Math.max(0, r - val); rr <= Math.min(size - 1, r + val); rr++)
      if (rr !== r && solution[rr][c] === val) return false;
    return true;
  }

  // Generate all valid assignments for a region (permutations of 1..N that satisfy constraints)
  function getValidAssignments(region) {
    const n = region.length;
    const results = [];
    const used = new Set();

    function gen(idx) {
      if (idx === n) {
        results.push(region.map(([r, c], i) => solution[r][c]));
        return;
      }
      const [r, c] = region[idx];
      for (let v = 1; v <= n; v++) {
        if (used.has(v)) continue;
        if (!canPlace(r, c, v)) continue;
        used.add(v);
        solution[r][c] = v;
        gen(idx + 1);
        solution[r][c] = 0;
        used.delete(v);
      }
    }
    gen(0);
    return results;
  }

  let nodes = 0;
  const maxNodes = 15000000;

  function backtrack(orderIdx) {
    if (++nodes > maxNodes) return false;
    if (orderIdx === order.length) return true;

    const ridx = order[orderIdx];
    const region = regions[ridx];
    const assignments = getValidAssignments(region);

    if (assignments.length === 0) return false;

    // Shuffle for randomness
    shuffle(assignments, rng);

    for (const assignment of assignments) {
      // Place
      for (let i = 0; i < region.length; i++)
        solution[region[i][0]][region[i][1]] = assignment[i];

      if (backtrack(orderIdx + 1)) return true;

      // Undo
      for (let i = 0; i < region.length; i++)
        solution[region[i][0]][region[i][1]] = 0;
    }
    return false;
  }

  const result = backtrack(0);
  return result ? solution.map(row => [...row]) : null;
}

// ========== SOLVER: Cell-based with full constraint propagation ==========
function solveWithPropagation(size, regions, regionMap, rng) {
  const regionSizes = regions.map(r => r.length);

  // Candidates
  const cands = [];
  for (let r = 0; r < size; r++) {
    cands[r] = [];
    for (let c = 0; c < size; c++) {
      const rid = regionMap[r][c];
      const s = new Set();
      for (let v = 1; v <= regionSizes[rid]; v++) s.add(v);
      cands[r][c] = s;
    }
  }

  const solution = Array.from({length: size}, () => Array(size).fill(0));
  const changeLog = []; // {type: 'assign'|'removeCand', ...}

  function assignCell(r, c, val) {
    solution[r][c] = val;
    changeLog.push({t: 'a', r, c});
    const rid = regionMap[r][c];

    // Remove val from region
    for (const [rr, rc] of regions[rid]) {
      if (rr === r && rc === c) continue;
      if (solution[rr][rc] === 0 && cands[rr][rc].has(val)) {
        cands[rr][rc].delete(val);
        changeLog.push({t: 'r', r: rr, c: rc, v: val});
        if (cands[rr][rc].size === 0) return false;
      }
    }

    // Row
    for (let cc = Math.max(0, c - val); cc <= Math.min(size - 1, c + val); cc++) {
      if (cc === c || solution[r][cc] !== 0) continue;
      if (cands[r][cc].has(val)) {
        cands[r][cc].delete(val);
        changeLog.push({t: 'r', r, c: cc, v: val});
        if (cands[r][cc].size === 0) return false;
      }
    }

    // Col
    for (let rr = Math.max(0, r - val); rr <= Math.min(size - 1, r + val); rr++) {
      if (rr === r || solution[rr][c] !== 0) continue;
      if (cands[rr][c].has(val)) {
        cands[rr][c].delete(val);
        changeLog.push({t: 'r', r: rr, c, v: val});
        if (cands[rr][c].size === 0) return false;
      }
    }
    return true;
  }

  function undoTo(mark) {
    while (changeLog.length > mark) {
      const ch = changeLog.pop();
      if (ch.t === 'a') {
        solution[ch.r][ch.c] = 0;
      } else {
        cands[ch.r][ch.c].add(ch.v);
      }
    }
  }

  // Propagate naked singles + hidden singles
  function propagate() {
    let changed = true;
    while (changed) {
      changed = false;

      // Naked singles
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (solution[r][c] !== 0) continue;
          if (cands[r][c].size === 0) return false;
          if (cands[r][c].size === 1) {
            const val = [...cands[r][c]][0];
            if (!assignCell(r, c, val)) return false;
            changed = true;
          }
        }
      }

      // Hidden singles in regions
      for (let i = 0; i < regions.length; i++) {
        const rs = regionSizes[i];
        for (let v = 1; v <= rs; v++) {
          let count = 0, lastR = -1, lastC = -1, found = false;
          for (const [rr, rc] of regions[i]) {
            if (solution[rr][rc] === v) { found = true; break; }
            if (solution[rr][rc] === 0 && cands[rr][rc].has(v)) {
              count++; lastR = rr; lastC = rc;
            }
          }
          if (found) continue;
          if (count === 0) return false;
          if (count === 1) {
            if (!assignCell(lastR, lastC, v)) return false;
            changed = true;
          }
        }
      }
    }
    return true;
  }

  let nodes = 0;
  const maxNodes = 10000000;

  function backtrack() {
    if (++nodes > maxNodes) return false;

    const mark = changeLog.length;
    if (!propagate()) { undoTo(mark); return false; }

    // MRV
    let bestR = -1, bestC = -1, bestCount = Infinity;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c] === 0) {
          const cnt = cands[r][c].size;
          if (cnt === 0) { undoTo(mark); return false; }
          if (cnt < bestCount) {
            bestCount = cnt; bestR = r; bestC = c;
            if (cnt === 1) { r = size; break; }
          }
        }
      }
      if (bestCount === 1) break;
    }

    if (bestR === -1) return true; // solved

    const vals = [...cands[bestR][bestC]];
    shuffle(vals, rng);

    for (const val of vals) {
      const mark2 = changeLog.length;
      if (assignCell(bestR, bestC, val)) {
        if (backtrack()) return true;
      }
      undoTo(mark2);
    }

    undoTo(mark);
    return false;
  }

  const result = backtrack();
  return result ? solution.map(row => [...row]) : null;
}

// ========== PUZZLE CREATION ==========
function createPuzzle(size, regions, regionMap, solution, difficulty, rng) {
  const given = Array.from({length: size}, () => Array(size).fill(true));
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      cells.push([r, c]);
  shuffle(cells, rng);

  const target = Math.floor(size * size * difficulty);
  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= target) break;
    given[r][c] = false;
    removed++;
  }

  // Ensure at least 1 given per region
  for (let i = 0; i < regions.length; i++) {
    if (!regions[i].some(([r, c]) => given[r][c])) {
      const [r, c] = regions[i][Math.floor(rng() * regions[i].length)];
      given[r][c] = true;
    }
  }
  return given;
}

// ========== CONNECTIVITY CHECK ==========
function isConnected(region) {
  if (region.length <= 1) return true;
  const set = new Set(region.map(([r, c]) => r * 1000 + c));
  const visited = new Set();
  const queue = [region[0]];
  visited.add(region[0][0] * 1000 + region[0][1]);
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const key = (r + dr) * 1000 + (c + dc);
      if (set.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push([r + dr, c + dc]);
      }
    }
  }
  return visited.size === region.length;
}

// ========== LEVEL GENERATION ==========
function generateLevel(config) {
  const { size, difficulty, seed } = config;
  const rng = mulberry32(seed);

  // Max region sizes tuned per grid size to ensure solvability
  // Key insight: max region size N requires N-cells with spacing >= N+1
  // For 12x12 with size-4 regions: 36 fours, max 3/row × 12 rows = 36 (tight but possible)
  const maxRegionSize = size <= 6 ? 5 : size <= 8 ? 5 : 4;

  for (let attempt = 0; attempt < 500; attempt++) {
    const r = mulberry32(seed + attempt * 9973);
    const { regions, regionMap } = generateRegions(size, r, maxRegionSize, 3);

    // Verify connectivity and max size
    let ok = true;
    const maxSz = Math.max(...regions.map(rg => rg.length));
    if (maxSz > maxRegionSize + 1) ok = false;
    if (ok) {
      for (const region of regions) {
        if (!isConnected(region)) { ok = false; break; }
      }
    }
    if (!ok) continue;

    // Try region-based solver first (often faster for structured problems)
    let solution = solveRegionByRegion(size, regions, regionMap, r);

    // Fallback to propagation solver
    if (!solution) {
      solution = solveWithPropagation(size, regions, regionMap, r);
    }

    if (solution) {
      const puzzle = createPuzzle(size, regions, regionMap, solution, difficulty, rng);
      const maxNum = Math.max(...regions.map(r => r.length));
      return { size, regions, regionMap, solution, puzzle, maxNum };
    }

    if (attempt % 50 === 49) {
      console.error(`  Level ${config.id}: ${attempt + 1} attempts so far...`);
    }
  }
  return null;
}

// ========== VERIFICATION ==========
function verifySolution(data, id) {
  const { size, regions, regionMap, solution } = data;
  let errors = 0;

  // Check each region has values 1..N
  for (let i = 0; i < regions.length; i++) {
    const vals = regions[i].map(([r, c]) => solution[r][c]).sort((a, b) => a - b);
    const expected = Array.from({length: regions[i].length}, (_, j) => j + 1);
    if (JSON.stringify(vals) !== JSON.stringify(expected)) {
      console.error(`  VERIFY FAIL: Level ${id}, region ${i}`);
      errors++;
    }
  }

  // Check distance rule
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = solution[r][c];
      for (let cc = Math.max(0, c - val); cc <= Math.min(size - 1, c + val); cc++) {
        if (cc !== c && solution[r][cc] === val) {
          console.error(`  VERIFY FAIL: Level ${id}, row distance (${r},${c})=(${r},${cc})=${val}`);
          errors++;
        }
      }
      for (let rr = Math.max(0, r - val); rr <= Math.min(size - 1, r + val); rr++) {
        if (rr !== r && solution[rr][c] === val) {
          console.error(`  VERIFY FAIL: Level ${id}, col distance (${r},${c})=(${rr},${c})=${val}`);
          errors++;
        }
      }
    }
  }

  if (errors === 0) console.error(`  Level ${id} verified OK`);
  return errors === 0;
}

// ========== MAIN ==========
function main() {
  const LEVEL_CONFIGS = [];
  for (let i = 1; i <= 30; i++) {
    let sz;
    if (i <= 5) sz = 6;
    else if (i <= 12) sz = 8;
    else if (i <= 22) sz = 10;
    else sz = 12;
    LEVEL_CONFIGS.push({
      id: i,
      size: sz,
      difficulty: 0.3 + (i / 30) * 0.25,
      seed: i * 7919 + 42
    });
  }

  const allLevels = [];

  for (const config of LEVEL_CONFIGS) {
    console.error(`\nGenerating Level ${config.id} (${config.size}x${config.size})...`);
    const startTime = Date.now();
    const data = generateLevel(config);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!data) {
      console.error(`  FAILED to generate level ${config.id}!`);
      process.exit(1);
    }

    console.error(`  Generated in ${elapsed}s`);
    verifySolution(data, config.id);

    allLevels.push({
      id: config.id,
      size: data.size,
      maxNum: data.maxNum,
      regions: data.regions,
      regionMap: data.regionMap,
      solution: data.solution,
      puzzle: data.puzzle,
    });
  }

  // Output as JS constant
  console.log('// Auto-generated Ripple Effect puzzle data');
  console.log('// Generated by generate_levels.js - DO NOT EDIT');
  console.log('');
  console.log('const PRECOMPUTED_LEVELS = [');
  for (const lv of allLevels) {
    console.log(`  {`);
    console.log(`    id: ${lv.id},`);
    console.log(`    size: ${lv.size},`);
    console.log(`    maxNum: ${lv.maxNum},`);
    console.log(`    regions: ${JSON.stringify(lv.regions)},`);
    console.log(`    regionMap: ${JSON.stringify(lv.regionMap)},`);
    console.log(`    solution: ${JSON.stringify(lv.solution)},`);
    console.log(`    puzzle: ${JSON.stringify(lv.puzzle)},`);
    console.log(`  },`);
  }
  console.log('];');

  console.error('\nAll 30 levels generated successfully!');
}

main();
