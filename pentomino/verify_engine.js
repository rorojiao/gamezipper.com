/**
 * Pentomino Fill - In-engine verifier.
 *
 * Runs the same solver logic inside the browser engine when the user checks
 * a solution (or on level load via gz-debug). Mirrors verify_python.py rules.
 *
 * Usage:
 *   verifyLevel(level) -> { passed, checks: [{name, ok, detail}] }
 */
'use strict';

(function (root) {
  const PENTOMINOES = {
    F: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 0]],
    I: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    L: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
    N: [[0, 1], [1, 1], [2, 1], [3, 0], [3, 1]],
    P: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
    T: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
    U: [[0, 0], [0, 1], [1, 0], [2, 0], [2, 1]],
    V: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
    W: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
    X: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
    Y: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 1]],
    Z: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
  };

  function normalize(piece) {
    let minR = Infinity, minC = Infinity;
    for (const [r, c] of piece) {
      if (r < minR) minR = r;
      if (c < minC) minC = c;
    }
    const out = [];
    for (const [r, c] of piece) out.push([r - minR, c - minC]);
    out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return JSON.stringify(out);
  }

  function rotateCW(piece) {
    return piece.map(([r, c]) => [-c, r]);
  }

  function reflect(piece) {
    return piece.map(([r, c]) => [r, -c]);
  }

  function allOrientations(name) {
    const base = PENTOMINOES[name];
    if (!base) return [];
    const seen = new Set();
    const orientations = [];
    let cur = base;
    for (let i = 0; i < 4; i++) {
      const normed = normalize(cur);
      if (!seen.has(normed)) {
        seen.add(normed);
        orientations.push(JSON.parse(normed));
      }
      cur = rotateCW(cur);
    }
    cur = reflect(base);
    for (let i = 0; i < 4; i++) {
      const normed = normalize(cur);
      if (!seen.has(normed)) {
        seen.add(normed);
        orientations.push(JSON.parse(normed));
      }
      cur = rotateCW(cur);
    }
    return orientations;
  }

  function countUniqueSolutions(outlineSet, pieces, cap = 2) {
    const placements = {};
    for (const name of pieces) {
      const orientList = allOrientations(name);
      const placementsForName = [];
      for (const orient of orientList) {
        for (const cellStr of outlineSet) {
          const [ar, ac] = cellStr.split(',').map(Number);
          const placed = [];
          let ok = true;
          for (const [dr, dc] of orient) {
            const cell = `${ar + dr},${ac + dc}`;
            if (!outlineSet.has(cell)) { ok = false; break; }
            placed.push(cell);
          }
          if (ok) {
            const key = placed.slice().sort().join('|');
            placementsForName.push({ key, placed });
          }
        }
      }
      const seen = new Set();
      const unique = [];
      for (const p of placementsForName) {
        if (!seen.has(p.key)) { seen.add(p.key); unique.push(p); }
      }
      placements[name] = unique;
    }

    const solutions = [];
    function backtrack(idx, usedSet, current) {
      if (solutions.length >= cap) return;
      if (idx === pieces.length) {
        solutions.push(current.slice().sort().join('|'));
        return;
      }
      const name = pieces[idx];
      for (const { placed } of placements[name]) {
        let conflict = false;
        for (const cell of placed) {
          if (usedSet.has(cell)) { conflict = true; break; }
        }
        if (conflict) continue;
        const newUsed = new Set(usedSet);
        for (const cell of placed) newUsed.add(cell);
        current.push(name + ':' + placed.slice().sort().join(','));
        backtrack(idx + 1, newUsed, current);
        current.pop();
      }
    }

    backtrack(0, new Set(), []);
    return solutions.length;
  }

  function verifyLevel(level) {
    const checks = [];
    const rows = level.rows;
    const cols = level.cols;
    const pieces = level.pieces;

    // Build outline set
    const outlineSet = new Set();
    for (let r = 0; r < rows; r++) {
      const row = level.outline[r];
      for (let c = 0; c < cols; c++) {
        if (row[c] === '#') outlineSet.add(`${r},${c}`);
      }
    }

    // 1. Cell count
    const cellCount = outlineSet.size;
    const expectedCells = 5 * pieces.length;
    checks.push({
      name: 'cell_count',
      ok: cellCount === expectedCells,
      detail: `${cellCount} cells, expected ${expectedCells}`,
    });

    // 2. Pieces valid
    const validPieces = pieces.every((p) => p in PENTOMINOES) && new Set(pieces).size === pieces.length;
    checks.push({
      name: 'pieces_valid',
      ok: validPieces,
      detail: `${pieces.length} unique pieces: ${pieces.join(',')}`,
    });

    // 3. Unique solution
    const nSols = countUniqueSolutions(outlineSet, pieces, 2);
    checks.push({
      name: 'unique_solution',
      ok: nSols === 1,
      detail: `${nSols} solutions found (cap=2)`,
    });

    const passed = checks.every((c) => c.ok);
    return { passed, checks };
  }

  /**
   * Verify a user's placed solution.
   * board[r][c] = piece name or '' for empty
   * Returns { passed, errors: [string] }
   */
  function checkUserSolution(outlineGrid, board, expectedPieces) {
    const errors = [];
    const rows = outlineGrid.length;
    const cols = outlineGrid[0].length;

    // Outline cells
    const outlineCells = new Set();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (outlineGrid[r][c] === '#') outlineCells.add(`${r},${c}`);
      }
    }

    // Placed cells
    const placed = {};
    const usedCells = new Set();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const piece = board[r][c];
        if (piece && piece !== '.') {
          if (!placed[piece]) placed[piece] = [];
          placed[piece].push([r, c]);
          const cell = `${r},${c}`;
          if (!outlineCells.has(cell)) {
            errors.push(`Cell (${r},${c}) is outside outline.`);
          }
          if (usedCells.has(cell)) {
            errors.push(`Cell (${r},${c}) is covered by multiple pieces.`);
          }
          usedCells.add(cell);
        }
      }
    }

    // Pieces match expected
    const placedNames = Object.keys(placed);
    if (placedNames.length !== expectedPieces.length) {
      errors.push(`Expected ${expectedPieces.length} pieces, placed ${placedNames.length}.`);
    }
    for (const expected of expectedPieces) {
      if (!placed[expected]) {
        errors.push(`Missing piece ${expected}.`);
      } else if (placed[expected].length !== 5) {
        errors.push(`Piece ${expected} has ${placed[expected].length} cells, expected 5.`);
      }
    }

    // Each piece connected
    for (const [name, cells] of Object.entries(placed)) {
      if (cells.length !== 5) continue;
      const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
      const visited = new Set([cellSet.values().next().value]);
      const queue = [cells[0]];
      while (queue.length) {
        const [cr, cc] = queue.pop();
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const key = `${cr + dr},${cc + dc}`;
          if (cellSet.has(key) && !visited.has(key)) {
            visited.add(key);
            queue.push([cr + dr, cc + dc]);
          }
        }
      }
      if (visited.size !== 5) {
        errors.push(`Piece ${name} is not connected.`);
      }
    }

    // Outline fully covered
    const missing = [];
    for (const cell of outlineCells) {
      if (!usedCells.has(cell)) missing.push(cell);
    }
    if (missing.length > 0) {
      errors.push(`${missing.length} outline cells not filled.`);
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  // Export for browser (window.PentominoVerify) and Node.js (module.exports)
  const exported = { verifyLevel, checkUserSolution, allOrientations, countUniqueSolutions, PENTOMINOES };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.PentominoVerify = exported;
  }

  // CLI runner: `node verify_engine.js [level_idx]` to spot-check a single level.
  if (typeof require !== 'undefined' && require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf-8'));
    const levels = data.levels;
    const target = process.argv[2] ? parseInt(process.argv[2]) - 1 : null;

    let allPass = true;
    for (let i = 0; i < levels.length; i++) {
      if (target !== null && i !== target) continue;
      const result = exported.verifyLevel(levels[i]);
      const mark = result.passed ? '\u2713' : '\u2717';
      console.log(`Level ${String(i + 1).padStart(2)} [${levels[i].tier.padEnd(8)}] ${mark}`);
      for (const c of result.checks) {
        if (!c.ok) console.log(`  \u2717 ${c.name}: ${c.detail}`);
      }
      if (!result.passed) allPass = false;
    }
    if (target === null) {
      console.log(`\n${allPass ? 'PASS' : 'FAIL'}: ${levels.length} levels (in-engine)`);
    }
    process.exit(allPass ? 0 : 1);
  }
})(typeof window !== 'undefined' ? window : globalThis);
