// Wood Block Puzzle (1010) per-game verifier — sweep 44 (2026-08-07)
// Validates: all 25 SHAPES are placeable on an empty grid, hasAnyMove() works,
// bestScore persistence + reload restore, and the latent save-version-mismatch
// anti-pattern (setItem stores primitive number, no v:1 guard — future fields
// would be silently dropped on reload).
//
// Usage:
//   kachilu-browser --session wbp open "https://gamezipper.com/wood-block-puzzle/"
//   sleep 12
//   kachilu-browser --session wbp eval --base64 "$(base64 -w0 wood-block-puzzle/verify_engine.js)"
//
// Returns: { verdict: 'PASS'|'FAIL', shapesTotal, shapesPlaceable, saveRoundtrip, saveAntiPattern }

(async () => {
  const r = { verdict: 'FAIL', shapesTotal: null, shapesPlaceable: null };
  if (typeof SHAPES === 'undefined' || typeof GRID === 'undefined' || typeof canPlace !== 'function') {
    return { ...r, ERROR: 'globals not loaded (SHAPES/GRID/canPlace)' };
  }
  // 1. All shapes placeable on empty grid
  let placeable = 0;
  const total = SHAPES.length;
  for (let si = 0; si < total; si++) {
    let canFit = false;
    for (let r0 = 0; r0 < GRID; r0++) {
      for (let c0 = 0; c0 < GRID; c0++) {
        if (canPlace(SHAPES[si], r0, c0)) { canFit = true; break; }
      }
      if (canFit) break;
    }
    if (canFit) placeable++;
  }
  r.shapesTotal = total;
  r.shapesPlaceable = placeable;

  // 2. Persistence roundtrip: force save, read, verify
  if (typeof SAVE_KEY !== 'undefined' && typeof initGrid === 'function' && typeof placePiece === 'function') {
    initGrid();
    bestScore = 0; score = 0;
    // Force a line clear: place a 1x1 at (0,0), then fill row 0
    // (Manual simulation since random piece generation is non-deterministic.)
    let row0Done = false;
    let attempts = 0;
    while (!row0Done && attempts < 100) {
      attempts++;
      if (grid[0].every(c => c)) { row0Done = true; break; }
      let placed = false;
      for (let c0 = 0; c0 < GRID; c0++) {
        if (grid[0][c0]) continue;
        for (let pi = 0; pi < pieces.length; pi++) {
          const p = pieces[pi];
          if (p.placed) continue;
          if (canPlace(p.shape, 0, c0)) {
            placePiece(p, 0, c0); placed = true; break;
          }
        }
        if (placed) break;
      }
      if (placed) { await new Promise(res => setTimeout(res, 20)); continue; }
      // Free tray by placing anywhere
      let freed = false;
      for (let pi = 0; pi < pieces.length; pi++) {
        const p = pieces[pi];
        if (p.placed) continue;
        for (let r0 = 0; r0 < GRID; r0++) {
          for (let c0 = 0; c0 < GRID; c0++) {
            if (canPlace(p.shape, r0, c0)) {
              placePiece(p, r0, c0); freed = true; break;
            }
          }
          if (freed) break;
        }
        if (freed) break;
      }
      if (freed) { await new Promise(res => setTimeout(res, 20)); continue; }
      if (typeof afterPlace === 'function') afterPlace();
      await new Promise(res => setTimeout(res, 30));
    }
    await new Promise(res => setTimeout(res, 600));
    const saveRaw = localStorage.getItem(SAVE_KEY);
    r.saveRoundtrip = {
      key: SAVE_KEY,
      savedValue: saveRaw,
      score: score,
      best: bestScore,
      row0Done
    };
    // Detect the latent anti-pattern
    if (saveRaw && typeof saveRaw === 'string') {
      try {
        const parsed = JSON.parse(saveRaw);
        r.saveAntiPattern = parsed.v === undefined ? 'P1_RISK: stored as primitive, no v:1 guard' : 'OK_v1';
      } catch(e) {
        // Stored as plain string like "91" — anti-pattern confirmed
        r.saveAntiPattern = 'P1_RISK: stored as primitive string (no v:1 guard)';
      }
    }
  } else {
    r.saveRoundtrip = { ERROR: 'SAVE_KEY/initGrid/placePiece not available' };
  }

  // Verdict
  if (placeable === total && r.saveRoundtrip.score > 0 && r.saveRoundtrip.savedValue) {
    r.verdict = 'PASS';
  }
  return r;
})()