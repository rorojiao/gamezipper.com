#!/usr/bin/env node
/**
 * Herugolf Independent Verifier
 *
 * Reads levels.json and validates each level for:
 *   1. All balls can reach a hole
 *   2. Each level has EXACTLY ONE unique solution
 *   3. Each solution obeys all rules:
 *      - Each ball's path is a sequence of orthogonal segments
 *      - Segment lengths strictly decrease (segment N+1 < segment N)
 *      - Path does not self-cross
 *      - First cell of path is the ball start
 *      - Final cell of path is a hole
 *      - One ball per hole (bijection)
 *      - Paths from different balls do not share cells
 *      - Walls are impassable
 *      - Ponds are passable but never a segment endpoint
 *
 * Run: node verify_independent.js
 * Exit: 0 on all-pass, 1 on any failure
 */

const fs = require('fs');
const path = require('path');

const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

function canFollow(lastDir, newDir) {
  if (!lastDir) return true;
  if (lastDir[0] === -newDir[0] && lastDir[1] === -newDir[1]) return false;
  return true;
}

// ============================================================
// Enumerate all valid paths from a ball to any hole
// Path = sequence of orthogonal segments with strictly decreasing lengths
// ============================================================
function enumPaths(rows, cols, start, walls, holes, blockedExtra, ponds) {
  const results = [];
  const [sr, sc] = start;

  function dfs(r, c, cells, ordered, lastDir, lastLen, segs) {
    // Check if current cell is a hole (ball falls in)
    if (holes.has(`${r},${c}`) && (r !== sr || c !== sc)) {
      results.push({
        cells: new Set(cells),
        ordered: ordered.slice(),
        hole: [r, c],
        segs: segs.map(s => ({dir: s.dir, len: s.len}))
      });
      return;
    }
    if (segs.length >= 4) return;

    const nextLen = (lastLen !== null) ? (lastLen - 1) : null;
    const maxFirst = Math.min(6, Math.max(rows, cols));

    for (const d of DIRS) {
      if (!canFollow(lastDir, d)) continue;

      let lengths;
      if (nextLen !== null) {
        if (nextLen < 1) continue;
        lengths = [nextLen];
      } else {
        lengths = [];
        for (let i = 1; i <= maxFirst; i++) lengths.push(i);
        // shuffle
        for (let i = lengths.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lengths[i], lengths[j]] = [lengths[j], lengths[i]];
        }
      }

      for (const sl of lengths) {
        let nr = r, nc = c;
        const newCells = [];
        let valid = true;
        let hitHole = null;

        for (let step = 0; step < sl; step++) {
          nr += d[0]; nc += d[1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) { valid = false; break; }
          if (walls.has(`${nr},${nc}`)) { valid = false; break; }
          if (blockedExtra.has(`${nr},${nc}`)) { valid = false; break; }
          if (cells.has(`${nr},${nc}`)) { valid = false; break; }
          newCells.push([nr, nc]);
          if (holes.has(`${nr},${nc}`)) { hitHole = [nr, nc]; break; }
        }

        if (!newCells.length || !valid) continue;
        if (hitHole) {
          const allCells = new Set(cells);
          for (const [cr, cc] of newCells) allCells.add(`${cr},${cc}`);
          results.push({
            cells: allCells,
            ordered: ordered.concat(newCells),
            hole: hitHole,
            segs: [...segs.map(s => ({dir: s.dir, len: s.len})), {dir: d, len: newCells.length}]
          });
        } else {
          // Segment completed - cannot end on a pond
          if (ponds.has(`${nr},${nc}`)) continue;
          const allCells = new Set(cells);
          for (const [cr, cc] of newCells) allCells.add(`${cr},${cc}`);
          dfs(nr, nc, allCells,
              ordered.concat(newCells),
              d, sl, [...segs, {dir: d, len: sl}]);
        }
      }
    }
  }

  dfs(sr, sc, new Set([`${sr},${sc}`]), [[sr, sc]], null, null, []);
  return results;
}

// ============================================================
// Count distinct solutions (stops at maxSolutions)
// ============================================================
function countSolutions(rows, cols, balls, holes, walls, ponds, maxSolutions = 2, timeoutMs = 8000) {
  const holesSet = new Set(holes.map(h => `${h[0]},${h[1]}`));
  const ballsSet = new Set(balls.map(b => `${b[0]},${b[1]}`));

  // Pre-compute paths for each ball
  const ballPaths = balls.map(b => {
    const others = new Set(ballsSet);
    others.delete(`${b[0]},${b[1]}`);

    const pathList = enumPaths(rows, cols, b, walls, holesSet, others, ponds);

    // Deduplicate by (hole, segs hash) - same path with different segment boundaries
    // is the same physical path
    const seen = new Set();
    const dedup = [];
    for (const p of pathList) {
      const sig = `${p.hole[0]},${p.hole[1]}|` +
        p.ordered.map(c => `${c[0]},${c[1]}`).join(';');
      if (seen.has(sig)) continue;
      seen.add(sig);
      dedup.push(p);
    }
    return dedup;
  });

  // Any ball with no path -> 0 solutions
  for (const p of ballPaths) if (p.length === 0) return 0;

  let count = 0;
  let timedOut = false;
  const t0 = Date.now();

  function back(idx, usedCells, usedHoles) {
    if (timedOut) return;
    if (Date.now() - t0 > timeoutMs) { timedOut = true; return; }
    if (count >= maxSolutions) return;
    if (idx === balls.length) { count++; return; }
    for (const p of ballPaths[idx]) {
      if (count >= maxSolutions) return;
      const holeKey = `${p.hole[0]},${p.hole[1]}`;
      if (usedHoles.has(holeKey)) continue;
      // Check for cell overlap
      let overlap = false;
      for (const c of p.cells) if (usedCells.has(c)) { overlap = true; break; }
      if (overlap) continue;
      usedHoles.add(holeKey);
      const newUsed = new Set(usedCells);
      for (const c of p.cells) newUsed.add(c);
      back(idx + 1, newUsed, usedHoles);
      usedHoles.delete(holeKey);
    }
  }

  back(0, new Set(), new Set());
  return timedOut ? -1 : count;
}

// ============================================================
// Reconstruct ordered path from segments
// ============================================================
function reconstructPath(ball, segments) {
  const path = [[ball[0], ball[1]]];
  let cur = [ball[0], ball[1]];
  for (const seg of segments) {
    for (let s = 0; s < seg.len; s++) {
      cur = [cur[0] + seg.dir[0], cur[1] + seg.dir[1]];
      path.push(cur);
    }
  }
  return path;
}

// ============================================================
// Validate a stored solution obeys all rules
// ============================================================
function validateSolution(level) {
  const {rows, cols, balls, holes, walls, ponds, solution} = level;
  const wallsSet = new Set(walls.map(w => `${w[0]},${w[1]}`));
  const pondsSet = new Set(ponds.map(p => `${p[0]},${p[1]}`));
  const holesSet = new Set(holes.map(h => `${h[0]},${h[1]}`));
  const ballsSet = new Set(balls.map(b => `${b[0]},${b[1]}`));

  if (balls.length !== holes.length) return `ball/hole count mismatch`;
  if (new Set(holes.map(h=>`${h[0]},${h[1]}`)).size !== holes.length) return `duplicate holes`;
  if (new Set(balls.map(b=>`${b[0]},${b[1]}`)).size !== balls.length) return `duplicate balls`;
  if (new Set([...wallsSet].filter(w => pondsSet.has(w))).size > 0) return `wall/pond overlap`;

  // Map ball index to its path
  if (solution.length !== balls.length) return `solution count mismatch`;

  const allCells = new Set();
  for (let i = 0; i < solution.length; i++) {
    const sp = solution[i];
    const ball = balls[i];
    const hole = holes[i];

    // Reconstruct path from segments (cells may be sorted in JSON)
    if (!sp.segments || sp.segments.length === 0) return `no segments for ball ${i}`;

    // Segments strictly decreasing
    for (let j = 1; j < sp.segments.length; j++) {
      if (sp.segments[j].len >= sp.segments[j-1].len) {
        return `segments not strictly decreasing for ball ${i}`;
      }
    }

    const path = reconstructPath(ball, sp.segments);
    if (path.length < 2) return `path too short for ball ${i}`;

    // Start at ball
    if (path[0][0] !== ball[0] || path[0][1] !== ball[1]) {
      return `path ${i} doesn't start at ball`;
    }
    // End at hole
    if (path[path.length-1][0] !== hole[0] || path[path.length-1][1] !== hole[1]) {
      return `path ${i} doesn't end at hole`;
    }

    // Check path is valid
    const seenCells = new Set();
    for (let k = 0; k < path.length; k++) {
      const [r, c] = path[k];
      const kk = `${r},${c}`;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return `cell out of bounds`;
      if (seenCells.has(kk)) return `self-crossing at step ${k}`;
      seenCells.add(kk);
      // Walls (except ball start) impassable
      if (wallsSet.has(kk) && k > 0) return `crosses wall at ${kk}`;
      // No two balls' paths share cells (except that two paths can both have
      // a ball start, but ball starts are at different cells)
      if (allCells.has(kk)) return `cell ${kk} shared between paths`;
      allCells.add(kk);
    }

    // Ponds: crossable but cannot end a segment (except for hole endpoint)
    let cur = [ball[0], ball[1]];
    for (const seg of sp.segments) {
      let segEnd = null;
      for (let s = 0; s < seg.len; s++) {
        cur = [cur[0] + seg.dir[0], cur[1] + seg.dir[1]];
        segEnd = cur;
      }
      // If segment doesn't end at hole, it can't end at a pond
      const segEndKey = `${segEnd[0]},${segEnd[1]}`;
      if (segEndKey !== `${hole[0]},${hole[1]}` && pondsSet.has(segEndKey)) {
        return `segment ends on pond at ${segEndKey}`;
      }
    }
  }

  return null; // valid
}

// ============================================================
// MAIN
// ============================================================
function main() {
  const jsonPath = path.join(__dirname, 'levels.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ levels.json not found at ${jsonPath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const levels = data.levels || data;
  if (!Array.isArray(levels)) {
    console.error('❌ levels.json format: expected {"levels":[...]}');
    process.exit(1);
  }
  if (levels.length !== 30) {
    console.error(`❌ expected 30 levels, got ${levels.length}`);
    process.exit(1);
  }

  console.log(`Verifying ${levels.length} Herugolf levels...\n`);
  let passed = 0, failed = 0;
  const failures = [];

  for (const L of levels) {
    const id = L.id;
    const tier = L.tier;
    const walls = new Set((L.walls||[]).map(w=>`${w[0]},${w[1]}`));
    const ponds = new Set((L.ponds||[]).map(p=>`${p[0]},${p[1]}`));

    // Validate stored solution
    const solErr = L.solution ? validateSolution(L) : 'no solution stored';

    // Count actual solutions via independent backtracking
    let solCount;
    try {
      solCount = countSolutions(
        L.rows, L.cols, L.balls, L.holes, walls, ponds, 2, 6000
      );
    } catch (e) {
      solCount = -2;  // error
    }

    const ok = solErr === null && solCount === 1;
    if (ok) {
      passed++;
      console.log(`  ✓ Level ${String(id).padStart(2)} (${tier.padEnd(9)}): unique, solution valid`);
    } else {
      failed++;
      const reason = solErr
        ? `solution invalid: ${solErr}`
        : solCount === 0 ? 'NO SOLUTION'
        : solCount === -1 ? 'TIMEOUT'
        : solCount === -2 ? 'ERROR'
        : solCount > 1 ? `${solCount} solutions (not unique)`
        : `count=${solCount}`;
      console.log(`  ✗ Level ${String(id).padStart(2)} (${tier.padEnd(9)}): ${reason}`);
      failures.push({id, tier, reason});
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed (of ${levels.length})`);

  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - Level ${f.id} (${f.tier}): ${f.reason}`);
    process.exit(1);
  }
  console.log('\n🎉 All 30 levels are valid and have exactly one unique solution!');
  process.exit(0);
}

if (require.main === module) main();