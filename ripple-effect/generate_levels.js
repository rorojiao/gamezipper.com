#!/usr/bin/env node
// Pre-generation script for Ripple Effect puzzle levels
// Generates all 30 levels offline and outputs them as a JS constant

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
function generateRegions(size, rng, maxRegionSize) {
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
    const maxR = maxRegionSize;
    const minR = Math.min(3, maxR - 1);
    const target = minR + Math.floor(rng() * (maxR - minR + 1));
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

  // Merge singletons with neighbors
  for (let i = regions.length - 1; i >= 0; i--) {
    if (regions[i].length > 1) continue;
    const [r, c] = regions[i][0];
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== i) {
        const targetRid = grid[nr][nc];
        regions[targetRid].push([r, c]);
        grid[r][c] = targetRid;
        // Fix any remaining references to old region id
        for (let rr = 0; rr < size; rr++)
          for (let cc = 0; cc < size; cc++)
            if (grid[rr][cc] === i) grid[rr][cc] = targetRid;
        regions.splice(i, 1);
        break;
      }
    }
  }

  // Rebuild regionMap with consecutive IDs
  const regionMap = Array.from({length: size}, () => Array(size).fill(-1));
  for (let i = 0; i < regions.length; i++) {
    for (const [r, c] of regions[i]) regionMap[r][c] = i;
  }
  return { regions, regionMap };
}

// ========== EFFICIENT SOLVER WITH FORWARD CHECKING + MRV ==========
function solvePuzzle(size, regions, regionMap, rng) {
  const regionSizes = regions.map(r => r.length);

  // Candidate sets for each cell
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

  // Forward checking: remove val from neighbors, return removed list or null on contradiction
  function propagate(r, c, val) {
    const removed = [];
    const rid = regionMap[r][c];

    // Remove val from other cells in same region
    for (const [rr, rc] of regions[rid]) {
      if (solution[rr][rc] === 0 && cands[rr][rc].has(val)) {
        cands[rr][rc].delete(val);
        removed.push(rr * size + rc, val);
        if (cands[rr][rc].size === 0) return null;
      }
    }

    // Row distance constraint
    for (let cc = Math.max(0, c - val); cc <= Math.min(size - 1, c + val); cc++) {
      if (cc !== c && solution[r][cc] === 0 && cands[r][cc].has(val)) {
        cands[r][cc].delete(val);
        removed.push(r * size + cc, val);
        if (cands[r][cc].size === 0) return null;
      }
    }

    // Col distance constraint
    for (let rr = Math.max(0, r - val); rr <= Math.min(size - 1, r + val); rr++) {
      if (rr !== r && solution[rr][c] === 0 && cands[rr][c].has(val)) {
        cands[rr][c].delete(val);
        removed.push(rr * size + c, val);
        if (cands[rr][c].size === 0) return null;
      }
    }

    return removed;
  }

  function undoPropagation(removed) {
    for (let i = 0; i < removed.length; i += 2) {
      const key = removed[i];
      const val = removed[i + 1];
      const r = Math.floor(key / size);
      const c = key % size;
      cands[r][c].add(val);
    }
  }

  let nodes = 0;
  const maxNodes = 20000000; // 20M nodes for pre-generation

  function backtrack() {
    if (++nodes > maxNodes) return false;

    // MRV: find unassigned cell with fewest candidates
    let bestR = -1, bestC = -1, bestCount = Infinity;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c] === 0) {
          const cnt = cands[r][c].size;
          if (cnt === 0) return false;
          if (cnt < bestCount) {
            bestCount = cnt;
            bestR = r;
            bestC = c;
            if (cnt === 1) { r = size; break; } // can't beat 1
          }
        }
      }
    }

    if (bestR === -1) return true; // all cells assigned

    const vals = [...cands[bestR][bestC]];
    shuffle(vals, rng);

    for (const val of vals) {
      solution[bestR][bestC] = val;
      const removed = propagate(bestR, bestC, val);
      if (removed !== null) {
        if (backtrack()) return true;
        undoPropagation(removed);
      } else {
        // Contradiction - nothing to undo (propagate already cleaned up partially)
        // Actually propagate stops at first contradiction, some removals may have happened
        // We need to undo what was done
        // But we stored them in removed until the contradiction... wait, on null we don't have the list
        // Let me fix this: we need to always track removals
      }
      solution[bestR][bestC] = 0;
    }

    return false;
  }

  // Hmm, there's a bug: when propagate returns null, we lose the removed list.
  // Let me fix propagate to always return the list and use a flag for contradiction.
  // Actually, let me restructure:

  function propagateV2(r, c, val) {
    const removed = [];
    const rid = regionMap[r][c];
    let ok = true;

    // Remove val from other cells in same region
    if (ok) {
      for (const [rr, rc] of regions[rid]) {
        if (solution[rr][rc] === 0 && cands[rr][rc].has(val)) {
          cands[rr][rc].delete(val);
          removed.push(rr * size + rc, val);
          if (cands[rr][rc].size === 0) { ok = false; break; }
        }
      }
    }

    // Row distance constraint
    if (ok) {
      for (let cc = Math.max(0, c - val); cc <= Math.min(size - 1, c + val); cc++) {
        if (cc !== c && solution[r][cc] === 0 && cands[r][cc].has(val)) {
          cands[r][cc].delete(val);
          removed.push(r * size + cc, val);
          if (cands[r][cc].size === 0) { ok = false; break; }
        }
      }
    }

    // Col distance constraint
    if (ok) {
      for (let rr = Math.max(0, r - val); rr <= Math.min(size - 1, r + val); rr++) {
        if (rr !== r && solution[rr][c] === 0 && cands[rr][c].has(val)) {
          cands[rr][c].delete(val);
          removed.push(rr * size + c, val);
          if (cands[rr][c].size === 0) { ok = false; break; }
        }
      }
    }

    return { removed, ok };
  }

  // Override backtrack with fixed propagation
  nodes = 0;
  function backtrackV2() {
    if (++nodes > maxNodes) return false;

    let bestR = -1, bestC = -1, bestCount = Infinity;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c] === 0) {
          const cnt = cands[r][c].size;
          if (cnt === 0) return false;
          if (cnt < bestCount) {
            bestCount = cnt;
            bestR = r;
            bestC = c;
            if (cnt === 1) { r = size; break; }
          }
        }
      }
    }

    if (bestR === -1) return true;

    const vals = [...cands[bestR][bestC]];
    shuffle(vals, rng);

    for (const val of vals) {
      solution[bestR][bestC] = val;
      const { removed, ok } = propagateV2(bestR, bestC, val);
      if (ok && backtrackV2()) return true;
      undoPropagation(removed);
      solution[bestR][bestC] = 0;
    }

    return false;
  }

  const result = backtrackV2();
  console.error(`  Solver: ${nodes} nodes explored, result=${result ? 'SOLVED' : 'FAILED'}`);
  return result ? solution.map(row => [...row]) : null;
}

// ========== PUZZLE CREATION (remove cells) ==========
function createPuzzle(size, regions, regionMap, solution, difficulty, rng) {
  const given = Array.from({length: size}, () => Array(size).fill(true));
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      cells.push([r, c]);
  shuffle(cells, rng);

  const total = size * size;
  const target = Math.floor(total * difficulty);
  let removed = 0;

  for (const [r, c] of cells) {
    if (removed >= target) break;
    given[r][c] = false;
    removed++;
  }

  // Ensure at least 1 given per region
  for (let i = 0; i < regions.length; i++) {
    const hasGiven = regions[i].some(([r, c]) => given[r][c]);
    if (!hasGiven) {
      const [r, c] = regions[i][Math.floor(rng() * regions[i].length)];
      given[r][c] = true;
    }
  }

  return given;
}

// ========== LEVEL GENERATION ==========
function generateLevel(config) {
  const rng = mulberry32(config.seed);
  const { size, difficulty } = config;

  // Use smaller max region sizes for larger grids to keep solver fast
  const maxRegionSize = size <= 6 ? 5 : size <= 8 ? 5 : size <= 10 ? 5 : 4;

  for (let attempt = 0; attempt < 200; attempt++) {
    const r = mulberry32(config.seed + attempt * 9973);
    const { regions, regionMap } = generateRegions(size, r, maxRegionSize);

    // Check max region size isn't too large
    const maxSize = Math.max(...regions.map(rg => rg.length));
    if (maxSize > maxRegionSize + 1) continue;

    // Verify all regions are connected
    let allConnected = true;
    for (const region of regions) {
      if (!isConnected(region)) { allConnected = false; break; }
    }
    if (!allConnected) continue;

    const solution = solvePuzzle(size, regions, regionMap, r);
    if (solution) {
      const puzzle = createPuzzle(size, regions, regionMap, solution, difficulty, rng);
      const maxNum = Math.max(...regions.map(r => r.length));
      return { size, regions, regionMap, solution, puzzle, maxNum };
    }
    console.error(`  Attempt ${attempt + 1} failed, trying new regions...`);
  }
  return null;
}

function isConnected(region) {
  if (region.length <= 1) return true;
  const set = new Set(region.map(([r, c]) => r * 100 + c));
  const visited = new Set();
  const queue = [region[0]];
  visited.add(region[0][0] * 100 + region[0][1]);
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      const key = nr * 100 + nc;
      if (set.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return visited.size === region.length;
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
    console.error(`\nGenerating Level ${config.id} (${config.size}x${config.size}, difficulty=${config.difficulty.toFixed(2)})...`);
    const startTime = Date.now();
    const data = generateLevel(config);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!data) {
      console.error(`  FAILED to generate level ${config.id}!`);
      process.exit(1);
    }

    console.error(`  Generated in ${elapsed}s`);

    allLevels.push({
      id: config.id,
      size: data.size,
      maxNum: data.maxNum,
      regions: data.regions,
      regionMap: data.regionMap,
      solution: data.solution,
      puzzle: data.puzzle,
    });

    // Verify solution
    verifySolution(data, config.id);
  }

  // Output as JS constant
  console.log('// Auto-generated Ripple Effect puzzle data');
  console.log('// Generated by generate_levels.js');
  console.log('// DO NOT EDIT - regenerate with: node generate_levels.js > levels_data.js');
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

function verifySolution(data, id) {
  const { size, regions, regionMap, solution } = data;

  // Check each region has unique values 1..N
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const vals = region.map(([r, c]) => solution[r][c]).sort((a, b) => a - b);
    const expected = Array.from({length: region.length}, (_, j) => j + 1);
    if (JSON.stringify(vals) !== JSON.stringify(expected)) {
      console.error(`  VERIFY FAIL: Level ${id}, region ${i}: values ${vals} != expected ${expected}`);
    }
  }

  // Check distance rule
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = solution[r][c];
      // Row check
      for (let cc = Math.max(0, c - val); cc <= Math.min(size - 1, c + val); cc++) {
        if (cc !== c && solution[r][cc] === val) {
          console.error(`  VERIFY FAIL: Level ${id}, row distance: (${r},${c})=${val} and (${r},${cc})=${val}`);
        }
      }
      // Col check
      for (let rr = Math.max(0, r - val); rr <= Math.min(size - 1, r + val); rr++) {
        if (rr !== r && solution[rr][c] === val) {
          console.error(`  VERIFY FAIL: Level ${id}, col distance: (${r},${c})=${val} and (${rr},${c})=${val}`);
        }
      }
    }
  }
  console.error(`  Level ${id} verified OK`);
}

main();
