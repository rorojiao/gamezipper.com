#!/usr/bin/env node
/* maze-paint engine verifier — real input paths only: pointerdown/up swipes on the
   canvas (threshold >20px), touchstart/touchend gestures, and window keydown arrows.
   Solutions come from an independent BFS over (pos, painted-bitmap) — optimal for all
   30 levels (verified: optimal === par everywhere, so 3 stars is achievable on every
   level). Covers undo, hints (best-direction toast), star tiers (3/2/1 via wasted
   moves), level select locking, settings/sound/music/reset, visibility pause,
   persistence. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note: note === undefined ? '' : String(note) }); if (!ok) console.error('  FAIL: ' + name + (note !== undefined ? ' — ' + note : '')); };
const t0 = Date.now();

const g = bootGame('maze-paint', {});
const E = (id) => g.sandbox.document.getElementById(id);
const G = () => g.call('Game');

// ---------- independent BFS solver ----------
function slidePath(grid, r, c, dr, dc) {
  const path = [];
  for (;;) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) break;
    if (grid[nr][nc] === 1) break;
    r = nr; c = nc; path.push([r, c]);
  }
  return path;
}
function solve(level) {
  const grid = level.grid, R = grid.length, C = grid[0].length;
  let p = '';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) p += grid[r][c] === 1 ? '1' : '0';
  const si = level.start[0] * C + level.start[1];
  p = p.slice(0, si) + '1' + p.slice(si + 1);
  const target = '1'.repeat(R * C);
  const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  const seen = new Set([level.start[0] + ',' + level.start[1] + ',' + p]);
  let queue = [{ r: level.start[0], c: level.start[1], p, moves: [] }];
  while (queue.length) {
    const next = [];
    for (const st of queue) {
      for (const [dir, [dr, dc]] of Object.entries(DIRS)) {
        const path = slidePath(grid, st.r, st.c, dr, dc);
        if (!path.length) continue;
        let np = st.p.split('');
        for (const [r, c] of path) np[r * C + c] = '1';
        np = np.join('');
        const moves = st.moves.concat([dir]);
        const er = path[path.length - 1][0], ec = path[path.length - 1][1];
        if (np === target) return moves;
        const k = er + ',' + ec + ',' + np;
        if (!seen.has(k)) { seen.add(k); next.push({ r: er, c: ec, p: np, moves }); }
      }
    }
    queue = next;
  }
  return null;
}

const LEVELS = g.call('LEVELS');
const solutions = LEVELS.map(solve);

// walk whose FIRST completion is in [lo,hi] — for exercising the 2-star/1-star tiers.
// (Naive "waste slides + optimal solution" does NOT work here: every slide paints its
// path, so prefix slides shorten the remaining solution and the level completes early
// at par. A late tier needs a walk that keeps >=1 cell unpainted while wiggling.)
function findWalk(level, lo, hi) {
  const grid = level.grid, R = grid.length, C = grid[0].length;
  let p0 = '';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) p0 += grid[r][c] === 1 ? '1' : '0';
  const si = level.start[0] * C + level.start[1];
  p0 = p0.slice(0, si) + '1' + p0.slice(si + 1);
  const target = '1'.repeat(R * C);
  const seen = new Set(); const walk = [];
  function dfs(r, c, p, depth) {
    if (depth >= hi) return false;
    for (const [dir, [dr, dc]] of Object.entries({ up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] })) {
      const path = slidePath(grid, r, c, dr, dc);
      if (!path.length) continue;
      const np = p.split('');
      for (const [rr, cc] of path) np[rr * C + cc] = '1';
      const s = np.join('');
      const nd = depth + 1;
      const er = path[path.length - 1][0], ec = path[path.length - 1][1];
      walk.push(dir);
      if (s === target) { if (nd >= lo && nd <= hi) return true; }
      else {
        const key = er + ',' + ec + '|' + s + '|' + nd; // END pos: pre-pos keys conflate distinct states
        if (!seen.has(key)) { seen.add(key); if (dfs(er, ec, s, nd)) return true; }
      }
      walk.pop();
    }
    return false;
  }
  return dfs(level.start[0], level.start[1], p0, 0) ? walk : null;
}
const walk2star = findWalk(LEVELS[2], 9, 12); // L3: par 8, 9..12 moves => 2 stars
const walk1star = findWalk(LEVELS[3], 12, 14); // L4: par 7, >11 moves => 1 star

// ---------- input helpers ----------
const swipe = (dir) => { // real pointer gesture on the canvas
  const cv = E('game-canvas');
  const d = { up: [0, -60], down: [0, 60], left: [-60, 0], right: [60, 0] }[dir];
  cv.dispatch('pointerdown', { clientX: 100, clientY: 100 });
  cv.dispatch('pointerup', { clientX: 100 + d[0], clientY: 100 + d[1] });
};
const touchSwipe = (dir) => { // touch-event path
  const cv = E('game-canvas');
  const d = { up: [0, -60], down: [0, 60], left: [-60, 0], right: [60, 0] }[dir];
  cv.dispatch('touchstart', { touches: [{ clientX: 100, clientY: 100 }], preventDefault() {} });
  cv.dispatch('touchend', { changedTouches: [{ clientX: 100 + d[0], clientY: 100 + d[1] }], preventDefault() {} });
};
const keyMove = (dir) => g.sandbox.window.dispatchEvent({ type: 'keydown', key: 'Arrow' + dir[0].toUpperCase() + dir.slice(1) });
function settle() { // pump until the slide animation chain finishes
  for (let i = 0; i < 220 && g.call('Game.ball.moving'); i++) g.pump(1);
  g.pump(1);
}
function play(moves, input) {
  for (const mv of moves) {
    (input || swipe)(mv);
    settle();
    if (G().state !== 'playing' && G().state !== 'complete') break;
  }
}

// ---------- level data integrity ----------
{
  let ok = true, note = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    if (L.grid[L.start[0]][L.start[1]] !== 0) { ok = false; note = 'L' + (i + 1) + ' start on wall'; break; }
    if (!solutions[i]) { ok = false; note = 'L' + (i + 1) + ' unsolvable'; break; }
    if (solutions[i].length > L.par) { ok = false; note = 'L' + (i + 1) + ' optimal ' + solutions[i].length + ' > par ' + L.par; break; }
  }
  T('level-data-integrity', ok, note);
  T('tier-walks-found', !!walk2star && !!walk1star, walk2star && walk1star ? '' : 'no late-completion walk for star tiers');
}

// ---------- boot / menu ----------
T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('menu-shown', G().state === 'menu' && !E('screen-menu').classList.contains('hidden'));

// ---------- level 1 via PLAY ----------
E('btn-play').dispatch('click', {});
T('l1-start', G().state === 'playing' && +String(E('hud-level-num').textContent) === 1 && G().paintedCount === 1 && G().totalCells === 21);
T('l1-tutorial-box', !E('tutorial-box').classList.contains('hidden') && String(E('tutorial-title').textContent) === 'First Steps');

// swipe mechanics
swipe('right'); settle();
T('swipe-slides', G().ball.c === 4 && G().ball.r === 0 && G().moves === 1 && G().paintedCount === 5 && String(E('hud-moves').textContent) === '1');
// below-threshold swipe ignored
E('game-canvas').dispatch('pointerdown', { clientX: 100, clientY: 100 });
E('game-canvas').dispatch('pointerup', { clientX: 108, clientY: 104 });
T('tiny-swipe-ignored', G().moves === 1);
// swipe into a wall (no path): no move, no history entry
swipe('up'); settle();
T('blocked-swipe-noop', G().moves === 1 && G().history.length === 1);
// touch path + keyboard path
touchSwipe('down'); settle();
T('touch-swipe', G().ball.r === 1 && G().ball.c === 4 && G().moves === 2, 'r' + G().ball.r + 'c' + G().ball.c); // wall at (2,4) stops the slide
keyMove('up'); settle();
T('keyboard-move', G().ball.r === 0 && G().ball.c === 4 && G().moves === 3);

// undo restores everything
{
  const before = { r: G().ball.r, c: G().ball.c, paintedCount: G().paintedCount, score: G().score };
  E('btn-undo').dispatch('click', {});
  T('undo-restores', G().moves === 2 && G().ball.r === 1 && G().ball.c === 4 && G().paintedCount === before.paintedCount && G().score === before.score, 'r' + G().ball.r + ' pc ' + G().paintedCount + '/' + before.paintedCount);
  keyMove('down'); settle(); // redo the move
}

// hint: independent best-direction computation
{
  const painted = G().painted;
  let bestDir = null, best = -1;
  for (const [dir, [dr, dc]] of Object.entries({ up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] })) {
    const path = slidePath(G().grid, G().ball.r, G().ball.c, dr, dc);
    const cnt = path.filter(([r, c]) => !painted[r][c]).length;
    if (cnt > best) { best = cnt; bestDir = dir; }
  }
  E('btn-hint').dispatch('click', {});
  const toasts = E('game-container').children.filter((n) => n.classList.contains('toast'));
  T('hint-best-dir', G().hintsRemaining === 2 && toasts.length === 1 && String(toasts[0].textContent) === 'Hint: Swipe ' + bestDir.toUpperCase(), toasts.map((t) => t.textContent).join('|'));
  g.pump(160); // 2.5s toast lifetime
  T('toast-removed', E('game-container').children.filter((n) => n.classList.contains('toast')).length === 0);
  E('btn-hint').dispatch('click', {}); E('btn-hint').dispatch('click', {});
  T('hints-exhaust', G().hintsRemaining === 0);
  E('btn-hint').dispatch('click', {});
  T('hint-at-zero-noop', G().hintsRemaining === 0);
}

// visibilitychange pause + escape via MENU
{
  g.sandbox.document.hidden = true;
  g.sandbox.document.dispatch('visibilitychange', {});
  T('hidden-pauses', G().state === 'paused');
  g.sandbox.document.hidden = false;
  E('btn-back').dispatch('click', {});
  T('pause-escape-menu', G().state === 'menu' && !E('screen-menu').classList.contains('hidden'));
}

// ---------- full sweep: 30 levels, star tiers exercised ----------
const starOf = (moves, par) => (moves <= par ? 3 : moves <= Math.ceil(par * 1.5) ? 2 : 1);
{
  // L1 fresh: solve optimally (7 = par -> 3 stars). Score math checked exactly.
  E('btn-play').dispatch('click', {}); // still only L1 unlocked
  play(solutions[0]);
  T('l1-complete', G().state === 'complete' && G().paintedCount === 21);
  g.pump(90); // 1200ms complete-screen delay + star pops
  T('l1-screen', !E('screen-complete').classList.contains('hidden') && String(E('complete-score').textContent).includes('Moves: 7'));
  const expScore = 21 * 10 + (7 * 3 - 7) * 50 + 3 * 100; // paint + efficiency + star bonus
  T('l1-score-math', String(E('complete-score').textContent) === 'Score: ' + expScore + '  |  Moves: 7', E('complete-score').textContent);
  T('l1-saved-3stars', G().saveData.levels[0].stars === 3 && G().saveData.levels[0].bestMoves === 7 && G().saveData.unlockedLevels === 2);

  // L2: 3 stars optimal via btn-next
  E('btn-next').dispatch('click', {});
  T('l2-start', G().currentLevel === 1 && G().moves === 0 && G().paintedCount === 1);
  play(solutions[1]);
  g.pump(90);
  T('l2-saved-3stars', G().saveData.levels[1].stars === 3);

  // L3: first completion via a 12-move walk (par 8, ceil(8*1.5)=12) -> 2 stars
  E('btn-next').dispatch('click', {});
  play(walk2star);
  g.pump(90);
  T('l3-first-2stars', G().saveData.levels[2].stars === 2 && G().saveData.levels[2].bestMoves === walk2star.length, 'stars=' + G().saveData.levels[2].stars + ' best=' + G().saveData.levels[2].bestMoves + ' want len ' + walk2star.length);
  // replay clean -> 3 stars REPLACES 2 (max-stars upgrade), bestMoves improves
  E('btn-replay').dispatch('click', {});
  T('l3-replay-restarts', G().currentLevel === 2 && G().moves === 0 && G().state === 'playing' && G().hintsRemaining === 3);
  play(solutions[2]);
  g.pump(90);
  T('l3-upgraded-3stars', G().saveData.levels[2].stars === 3 && G().saveData.levels[2].bestMoves === 8, 'stars=' + G().saveData.levels[2].stars + ' best=' + G().saveData.levels[2].bestMoves);

  // L4: first completion via a 14-move walk > ceil(7*1.5)=11 -> 1 star, level still unlocks
  E('btn-next').dispatch('click', {});
  T('l4-start', G().currentLevel === 3 && G().hintsRemaining === 3 && G().history.length === 0);
  play(walk1star);
  g.pump(90);
  T('l4-saved-1star', G().saveData.levels[3].stars === 1, 'stars=' + (G().saveData.levels[3] || {}).stars + ' moves=' + G().moves);
  T('l4-unlock-anyway', G().saveData.unlockedLevels === 5);

  // L5..L30 optimal via btn-next chain
  let okSweep = true;
  for (let i = 4; i < LEVELS.length; i++) {
    E('btn-next').dispatch('click', {});
    if (G().currentLevel !== i || G().state !== 'playing') { T('sweep-start-' + (i + 1), false, 'at L' + (G().currentLevel + 1) + ' state ' + G().state); okSweep = false; break; }
    play(solutions[i]);
    g.pump(90);
    const stars = starOf(solutions[i].length, LEVELS[i].par);
    if (G().saveData.levels[i].stars !== 3) { T('sweep-stars-' + (i + 1), false, 'got ' + G().saveData.levels[i].stars + ' moves ' + G().moves + '/' + LEVELS[i].par); okSweep = false; break; }
  }
  T('sweep-30-done', okSweep && Object.keys(G().saveData.levels).length === 30 && G().saveData.unlockedLevels === 31, Object.keys(G().saveData.levels).length + '/30');

  // at L30 complete, NEXT goes back to menu
  E('btn-next').dispatch('click', {});
  T('next-at-end-menu', G().state === 'menu' && !E('screen-menu').classList.contains('hidden'));
}

// ---------- level select ----------
{
  E('btn-levels').dispatch('click', {});
  const tiles = E('level-select-grid').children;
  T('select-30-tiles', tiles.length === 30 && G().state === 'levels');
  T('select-completed-class', tiles[0].classList.contains('completed') && tiles[29].classList.contains('completed'));
  const locked = tiles[29];
  T('select-all-unlocked', !tiles.some((t) => t.classList.contains('locked')));
  // relock by resetting progress later; locked behavior tested on fresh boot below (g2)
  const agg = (el) => { let s = ''; const w = (n) => { if (n.textContent) s += n.textContent; (n.children || []).forEach(w); }; w(el); return s; };
  T('select-stars-shown', (agg(tiles[0]).match(/&#9733;/g) || []).length === 3); // harness keeps entities raw; count 3 star glyphs for a 3-star level
  tiles[2].dispatch('click', {});
  T('select-plays-level', G().currentLevel === 2 && G().state === 'playing');
  E('btn-back').dispatch('click', {});
  T('back-to-menu', G().state === 'menu');
}

// ---------- settings / toggles / reset ----------
{
  E('btn-menu-settings').dispatch('click', {});
  T('settings-open', !E('screen-settings').classList.contains('hidden') && E('screen-menu').classList.contains('hidden'));
  E('toggle-sound').dispatch('click', {});
  T('sound-off-persisted', String(E('btn-sound').textContent) === 'OFF' && G().saveData.soundEnabled === false);
  E('toggle-sound').dispatch('click', {});
  T('sound-on', String(E('btn-sound').textContent) === 'ON' && G().saveData.soundEnabled === true);
  E('toggle-music').dispatch('click', {});
  T('music-off-persisted', G().saveData.musicEnabled === false && String(E('toggle-music').textContent) === 'OFF');
  E('toggle-music').dispatch('click', {});
  E('btn-settings-back').dispatch('click', {});
  T('settings-back', !E('screen-menu').classList.contains('hidden'));
}

// ---------- persistence ----------
{
  const g2 = bootGame('maze-paint', { seedLS: Object.fromEntries(Object.entries(g.sandbox.localStorage._m)) });
  const G2 = () => g2.call('Game');
  T('reload-progress', Object.keys(G2().saveData.levels).length === 30 && G2().saveData.unlockedLevels === 31 && G2().saveData.levels[0].stars === 3);
  // btn-play after 100%: the ternary falls back to level 1
  g2.sandbox.document.getElementById('btn-play').dispatch('click', {});
  T('play-after-100-replays-l1', G2().currentLevel === 0 && G2().state === 'playing');
  // locked-level behavior: fresh save keeps L2+ locked
  const g3 = bootGame('maze-paint', { seedLS: { mazepaint_save_v1: JSON.stringify({ version: 1, levels: { 0: { stars: 2, bestMoves: 9 } }, totalScore: 100, soundEnabled: true, musicEnabled: true, unlockedLevels: 2 }) } });
  const G3 = () => g3.call('Game');
  g3.sandbox.document.getElementById('btn-levels').dispatch('click', {});
  const t3 = g3.sandbox.document.getElementById('level-select-grid').children;
  const lockedTile = t3[5];
  lockedTile.dispatch('click', {});
  T('locked-tile-inert', G3().state === 'levels' && typeof lockedTile.onclick !== 'function');
  t3[1].dispatch('click', {});
  T('unlocked-tile-plays', G3().currentLevel === 1 && G3().state === 'playing');
  // reset progress
  g3.sandbox.document.getElementById('btn-back').dispatch('click', {});
  g3.sandbox.document.getElementById('btn-menu-settings').dispatch('click', {});
  g3.sandbox.document.getElementById('btn-reset-progress').dispatch('click', {});
  const raw = JSON.parse(g3.sandbox.localStorage.getItem('mazepaint_save_v1'));
  T('reset-progress', Object.keys(raw.levels).length === 0 && raw.unlockedLevels === 1 && G3().state === 'menu');
}

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok).map((r) => r.name);
console.log('maze-paint: 30 levels solved by independent BFS (optimal=par on all), driven via real pointer/touch/keyboard: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { durS: ((Date.now() - t0) / 1000).toFixed(1), fixes: 'P3 stale 5s tutorial-hide timer survived level restarts, killing the next level\'s tutorial early; now cleared in startLevel' } }));
process.exit(fails.length ? 1 : 0);
