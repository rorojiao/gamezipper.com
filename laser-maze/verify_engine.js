#!/usr/bin/env node
/* laser-maze end-to-end verifier (QA round 2026-08-25).
 * Real input paths only: piece placement / rotation / removal via real canvas
 * pointerdown (engine-exact cellSize math from setupCanvas), tray selection via real
 * .tray-piece pointerdown, levels/beam/undo/reset/hint/next via real button
 * pointerdown; state read back through the sandbox (engine is a plain top-level-var
 * script, no IIFE to pierce).
 * Offline battery: engine-exact traceBeam replica + beam-path-restricted IDDFS solver
 * proves every level winnable with min-pieces <= par (3 stars reachable) — catches the
 * P0 class this round (7 unwinnable levels: beam stops at its first target, so
 * targets > sources + splitters = mathematically impossible).
 * Output: last stdout line is compact JSON {"pass":N,"fail":M,...}; exit 0 iff PASS. */
'use strict';
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'laser-maze';
let pass = 0, fail = 0; const fails = [];
function T(name, ok, note) {
  if (ok) { pass++; } else { fail++; fails.push(name + (note ? ' | ' + note : '')); }
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : (note ? '  << ' + note : '')));
}

/* ============ engine-exact beam replica (mirror of traceBeam/trace) ============ */
const P = { EMPTY:0, SOURCE:1, TARGET:2, MIRROR_FWD:3, MIRROR_BCK:4, SPLITTER:5, WALL:6, FILTER_RED:7, FILTER_GREEN:8, FILTER_BLUE:9, BOMB:10 };
const DIR = { UP:0, RIGHT:1, DOWN:2, LEFT:3 };
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

function simulate(lv, placements) {
  const rows = lv.rows, cols = lv.cols;
  const grid = [];
  for (let r = 0; r < rows; r++) { grid[r] = []; for (let c = 0; c < cols; c++) grid[r][c] = { type: P.EMPTY }; }
  for (const fp of lv.fixed) if (grid[fp.r] && grid[fp.r][fp.c]) grid[fp.r][fp.c].type = fp.type;
  for (const pl of placements) grid[pl.r][pl.c].type = pl.type;
  const visited = {}; const targetsHit = new Set(); let bombHit = false;
  function trace(r, c, dir) {
    let steps = 0;
    while (steps < 200) {
      steps++;
      const nr = r + DY[dir], nc = c + DX[dir];
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
      const cell = grid[nr][nc];
      if (cell.type === P.EMPTY) { r = nr; c = nc; continue; }
      if (cell.type === P.WALL || cell.type === P.TARGET || cell.type === P.BOMB || cell.type === P.SOURCE) {
        if (cell.type === P.TARGET) targetsHit.add(nr + ',' + nc);
        if (cell.type === P.BOMB) bombHit = true;
        return;
      }
      if (cell.type >= P.FILTER_RED && cell.type <= P.FILTER_BLUE) { r = nr; c = nc; continue; }
      if (cell.type === P.MIRROR_FWD) {
        dir = (dir === DIR.RIGHT) ? DIR.UP : (dir === DIR.UP) ? DIR.RIGHT : (dir === DIR.LEFT) ? DIR.DOWN : DIR.LEFT;
        r = nr; c = nc; continue;
      }
      if (cell.type === P.MIRROR_BCK) {
        dir = (dir === DIR.RIGHT) ? DIR.DOWN : (dir === DIR.DOWN) ? DIR.RIGHT : (dir === DIR.LEFT) ? DIR.UP : DIR.UP;
        r = nr; c = nc; continue;
      }
      if (cell.type === P.SPLITTER) {
        let l, rr2;
        if (dir === DIR.RIGHT || dir === DIR.LEFT) { l = DIR.UP; rr2 = DIR.DOWN; } else { l = DIR.LEFT; rr2 = DIR.RIGHT; }
        const k1 = nr + ',' + nc + ',' + l, k2 = nr + ',' + nc + ',' + rr2;
        if (!visited[k1]) { visited[k1] = true; trace(nr, nc, l); }
        if (!visited[k2]) { visited[k2] = true; trace(nr, nc, rr2); }
        return;
      }
      return;
    }
  }
  let nT = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c].type === P.TARGET) nT++;
  for (const fp of lv.fixed) if (fp.type === P.SOURCE) {
    const dir = fp.dir || 0; const key = fp.r + ',' + fp.c + ',' + dir;
    if (!visited[key]) { visited[key] = true; trace(fp.r, fp.c, dir); }
  }
  return { hit: targetsHit, bomb: bombHit, nTargets: nT, won: !bombHit && nT > 0 && targetsHit.size >= nT };
}

/* beam-path-restricted IDDFS: complete because a piece only affects the beam once the
 * beam reaches it, so any winning config has an order where each piece lands on the
 * beam path of the pieces before it. */
function solve(lv, budget0) {
  budget0 = budget0 || 250000;
  const tray = {}; for (const k in lv.placeable) tray[parseInt(k)] = lv.placeable[k];
  let trayTotal = 0; for (const k in tray) trayTotal += tray[k];
  let nodes = 0; const seen = new Map();
  const keyOf = (pl) => pl.map(x => x.r + '.' + x.c + '.' + x.type).sort().join('|');
  function dfs(pl, trayLeft, depth, cap) {
    if (nodes > budget0) return null;
    nodes++;
    const res = simulate(lv, pl);
    if (res.won) return pl.slice();
    if (depth >= cap) return null;
    const cands = new Set();
    // collect empty cells on the current beam paths (re-walk with path tracking)
    const grid = [];
    for (let r = 0; r < lv.rows; r++) { grid[r] = []; for (let c = 0; c < lv.cols; c++) grid[r][c] = { type: P.EMPTY }; }
    for (const fp of lv.fixed) if (grid[fp.r] && grid[fp.r][fp.c]) grid[fp.r][fp.c].type = fp.type;
    for (const x of pl) grid[x.r][x.c].type = x.type;
    const visited2 = {};
    const walk = (r, c, dir) => {
      let steps = 0;
      while (steps++ < 200) {
        const nr = r + DY[dir], nc = c + DX[dir];
        if (nr < 0 || nr >= lv.rows || nc < 0 || nc >= lv.cols) return;
        const cell = grid[nr][nc];
        if (cell.type === P.EMPTY) { cands.add(nr + ',' + nc); r = nr; c = nc; continue; }
        if (cell.type >= P.FILTER_RED && cell.type <= P.FILTER_BLUE) { r = nr; c = nc; continue; }
        if (cell.type === P.MIRROR_FWD) {
          dir = (dir === DIR.RIGHT) ? DIR.UP : (dir === DIR.UP) ? DIR.RIGHT : (dir === DIR.LEFT) ? DIR.DOWN : DIR.LEFT;
          r = nr; c = nc; continue;
        }
        if (cell.type === P.MIRROR_BCK) {
          dir = (dir === DIR.RIGHT) ? DIR.DOWN : (dir === DIR.DOWN) ? DIR.RIGHT : (dir === DIR.LEFT) ? DIR.UP : DIR.UP;
          r = nr; c = nc; continue;
        }
        if (cell.type === P.SPLITTER) {
          let l, rr2;
          if (dir === DIR.RIGHT || dir === DIR.LEFT) { l = DIR.UP; rr2 = DIR.DOWN; } else { l = DIR.LEFT; rr2 = DIR.RIGHT; }
          const k1 = nr + ',' + nc + ',' + l, k2 = nr + ',' + nc + ',' + rr2;
          if (!visited2[k1]) { visited2[k1] = true; walk(nr, nc, l); }
          if (!visited2[k2]) { visited2[k2] = true; walk(nr, nc, rr2); }
          return;
        }
        return;
      }
    };
    for (const fp of lv.fixed) if (fp.type === P.SOURCE) {
      const dir = fp.dir || 0; const key = fp.r + ',' + fp.c + ',' + dir;
      if (!visited2[key]) { visited2[key] = true; walk(fp.r, fp.c, dir); }
    }
    if (!cands.size) return null;
    const kk = keyOf(pl);
    if ((seen.get(kk) || -1) >= cap) return null;
    seen.set(kk, cap);
    for (const cand of cands) {
      const ci = cand.indexOf(','), r = +cand.slice(0, ci), c = +cand.slice(ci + 1);
      for (const t of [P.MIRROR_FWD, P.MIRROR_BCK, P.SPLITTER, P.WALL]) {
        if (!trayLeft[t]) continue;
        trayLeft[t]--; pl.push({ r, c, type: t });
        const got = dfs(pl, trayLeft, depth + 1, cap);
        pl.pop(); trayLeft[t]++;
        if (got) return got;
      }
    }
    return null;
  }
  for (let cap = 0; cap <= trayTotal; cap++) {
    const got = dfs([], Object.assign({}, tray), 0, cap);
    if (got) return { min: got.length, solution: got, nodes };
    if (nodes > budget0) return { min: null, budgetExhausted: true, nodes, depthTried: cap };
  }
  return { min: null, unsolvable: true, nodes };
}

/* hand-verified solutions for the two levels whose optimal-proof search exceeds the
 * budget (both P0 fixes this round): [type,r,c] */
const KNOWN_SOL = {
  15: [[5,1,3],[5,1,1],[5,5,1],[3,0,1],[4,1,6],[4,5,0],[4,5,3]],           // The Hub: 7 pieces
  27: [[4,1,0],[5,1,2],[4,6,2],[3,1,7],[5,1,5],[3,6,5]]                    // Dual Source: 6 pieces
};

/* ============ real-input helpers ============ */
function tapCanvas(g, els, r, c) {
  const cs = g.call('cellSize');
  els.gameCanvas.dispatch('pointerdown', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2 });
}
function trayPieces(els) { return els.pieceTray.querySelectorAll('.tray-piece'); }
function pieceCount(p) { const ch = p.children; return String(ch[ch.length - 1].textContent); } /* canvas + span.count */
function selectPiece(g, els, type) {
  const ps = trayPieces(els);
  for (const p of ps) if (parseInt(p.dataset.type) === type) { p.dispatch('pointerdown', { stopPropagation() {} }); return true; }
  return false;
}
/* selection is a toggle in the engine — only tap the tray when the type isn't already selected */
function ensureSelected(g, els, type) {
  if (g.call('selectedPieceType') === type) return true;
  if (g.call('selectedPieceType') !== null) { if (!selectPiece(g, els, type)) return false; /* deselect other */ }
  return g.call('selectedPieceType') === type ? true : selectPiece(g, els, type);
}
function place(g, els, type, r, c) {
  if (!ensureSelected(g, els, type)) return false;
  tapCanvas(g, els, r, c);
  return true;
}
function levelBtns(els) { return els.tierContainer.querySelectorAll('.level-btn'); }
function btnFilledStars(btn) { /* renderLevelSelect appends a .level-stars child whose parsed children carry star-filled */
  const st = (btn.children || []).find(c => String(c.className).includes('level-stars'));
  if (!st) return -1;
  return (st.children || []).filter(c => String(c.className).includes('star-filled')).length;
}
function enterLevel(g, els, idx) {
  const btns = levelBtns(els);
  if (!btns[idx] || !btns[idx].classList.contains('unlocked')) return false;
  btns[idx].dispatch('pointerdown');
  g.pump(2);
  return g.call('currentLevel') === idx && g.call('state') === 'game';
}
function fireBeam(g) { g.els.btnBeam.dispatch('pointerdown'); g.pump(160); } /* 160 frames = 2667ms sandbox: fires the 800ms win check, then the 1200ms overlay it schedules */
function winOverlayActive(g) { return g.els.winOverlay.classList.contains('active'); }

/* ================= BOOT A: fresh player, tutorial-tier journey ================= */
const ga = bootGame(SLUG, {});
const ea = ga.els;
T('a-boot-clean', ga.loadErrors.length === 0 && ga.call('state') === 'title' &&
  ea.titleScreen.classList.contains('active'), ga.loadErrors.join('; '));

ga.pump(3);
T('a-render-loop-live', ga.rafQ.length >= 1, 'rafQ=' + ga.rafQ.length);

ea.btnHowTo.dispatch('pointerdown');
T('a-howto-open', ea.howToOverlay.classList.contains('active'));
ea.btnCloseHowTo.dispatch('pointerdown');
T('a-howto-close', !ea.howToOverlay.classList.contains('active'));

ea.btnSettings.dispatch('pointerdown');
T('a-settings-open', ea.settingsOverlay.classList.contains('active'));
ea.toggleSfx.dispatch('pointerdown');
T('a-sfx-toggle-off', ga.call('settings.sfx') === false && !ea.toggleSfx.classList.contains('on'));
ea.toggleSfx.dispatch('pointerdown');
T('a-sfx-toggle-on', ga.call('settings.sfx') === true && ea.toggleSfx.classList.contains('on'));
ea.toggleMusic.dispatch('pointerdown'); ea.toggleMusic.dispatch('pointerdown');
T('a-music-toggle-roundtrip', ga.call('settings.music') === true && ea.toggleMusic.classList.contains('on'));
ea.btnCloseSettings.dispatch('pointerdown');
T('a-settings-close', !ea.settingsOverlay.classList.contains('active'));

ea.btnPlay.dispatch('pointerdown'); ga.pump(2);
T('a-play-levelselect', ga.call('state') === 'levelselect' && ea.levelSelect.classList.contains('active'));
{
  const sections = ea.tierContainer.querySelectorAll('.tier-section');
  const btns = levelBtns(ea);
  const unlocked = btns.filter(b => b.classList.contains('unlocked'));
  const locked = btns.filter(b => !b.classList.contains('unlocked'));
  T('a-levelgrid-29', sections.length === 5 && btns.length === 29 && unlocked.length === 1 && locked.length === 28 &&
    String(btns[3].textContent) === '🔒',
    'sections=' + sections.length + ' btns=' + btns.length + ' unlocked=' + unlocked.length);
  btns[3].dispatch('pointerdown'); ga.pump(2);
  T('a-locked-inert', ga.call('state') === 'levelselect' && ga.call('currentLevel') === 0);
}

T('a-enter-l1', enterLevel(ga, ea, 0) && String(ea.levelLabel.textContent) === 'Level 1 - First Light' &&
  ga.call('cellSize') === 72 && ga.call('canvas.width') === 360, 'label=' + ea.levelLabel.textContent);
{
  const ps = trayPieces(ea);
  const counts = ps.map(p => parseInt(p.dataset.type) + ':' + pieceCount(p));
  T('a-tray-l1', ps.length === 2 && counts.join(',') === '3:2,4:2', counts.join(','));
}

/* L1: tutorial level — direct beam hit, 0 placements (par 1 -> 3 stars) */
ga.els.btnBeam.dispatch('pointerdown');
T('a-l1-beam-active', ga.call('beamActive') === true && JSON.parse(ga.call('JSON.stringify(targetsHit)')).length === 1);
ga.pump(160);
T('a-l1-win', ga.call('levelComplete') === true && winOverlayActive(ga) &&
  JSON.parse(ga.call('JSON.stringify(stars)'))['0'] === 3);
T('a-l1-stars-shown', String(ea.winStars.innerHTML).split('star-on').length - 1 === 3, ea.winStars.innerHTML);

ea.btnWinNext.dispatch('pointerdown'); ga.pump(2);
T('a-next-l2', ga.call('currentLevel') === 1 && String(ea.levelLabel.textContent) === 'Level 2 - Turn Up' &&
  !winOverlayActive(ga));

selectPiece(ga, ea, 3);
T('a-select-mirror', ga.call('selectedPieceType') === 3 && trayPieces(ea).some(p => p.classList.contains('selected')));
selectPiece(ga, ea, 3);
T('a-select-deselect', ga.call('selectedPieceType') === null);
place(ga, ea, 3, 4, 4);
T('a-place-l2', ga.call('grid[4][4].type') === 3 && ga.call('grid[4][4].isPlayer') === true &&
  ga.call('tray[3]') === 1 && JSON.parse(ga.call('JSON.stringify(playerPlacements)')).length === 1);
/* placement onto a fixed piece must be rejected (selection stays armed) */
ensureSelected(ga, ea, 3);
tapCanvas(ga, ea, 4, 0);
T('a-place-occupied-rejected', ga.call('grid[4][0].type') === 1 && ga.call('grid[4][0].isFixed') === true &&
  ga.call('tray[3]') === 1 && ga.call('selectedPieceType') === 3);
/* tap on empty cell with no selection does nothing */
ga.call('selectedPieceType=null');
tapCanvas(ga, ea, 0, 0);
T('a-tap-empty-noselect', ga.call('grid[0][0].type') === 0);
selectPiece(ga, ea, 3); tapCanvas(ga, ea, 4, 4); /* rotate the player mirror at (4,4) to BCK */
ea.btnUndo.dispatch('pointerdown');
T('a-undo-restores', ga.call('grid[4][4].type') === 0 && ga.call('grid[4][4].isPlayer') === false &&
  ga.call('tray[3]') === 2 && JSON.parse(ga.call('JSON.stringify(playerPlacements)')).length === 0 &&
  ea.btnUndo.classList.contains('btn-disabled'));
place(ga, ea, 3, 4, 4); /* '/' at (4,4): beam RIGHT -> UP col4 -> (0,4) target */
fireBeam(ga);
T('a-solve-l2', ga.call('levelComplete') === true && winOverlayActive(ga) &&
  JSON.parse(ga.call('JSON.stringify(stars)'))['1'] === 3);

ea.btnWinNext.dispatch('pointerdown'); ga.pump(2);
T('a-next-l3-doubleback', ga.call('currentLevel') === 2 && String(ea.levelLabel.textContent) === 'Level 3 - Double Back');
{
  const ps = trayPieces(ea);
  T('a-tray-l3-wallpiece', ps.length === 3 && ps.some(p => parseInt(p.dataset.type) === 6),
    ps.map(p => p.dataset.type).join(','));
  /* rotate: FWD -> BCK -> FWD by re-tapping the player mirror */
  selectPiece(ga, ea, 3); tapCanvas(ga, ea, 2, 1);
  const t1 = ga.call('grid[2][1].type');
  tapCanvas(ga, ea, 2, 1); const t2 = ga.call('grid[2][1].type');
  tapCanvas(ga, ea, 2, 1); const t3 = ga.call('grid[2][1].type');
  T('a-rotate-mirror', t1 === 3 && t2 === 4 && t3 === 3 && ga.call('beamActive') === false, t1 + '>' + t2 + '>' + t3);
  /* reset clears the board back to level initial */
  ea.btnReset.dispatch('pointerdown'); ga.pump(2);
  T('a-reset-clears', ga.call('grid[2][1].type') === 0 && ga.call('tray[3]') === 3 &&
    JSON.parse(ga.call('JSON.stringify(playerPlacements)')).length === 0);
  /* solve: '/'(2,1) '/'(1,1) '\'(1,4) — up over the wall, down into the target */
  place(ga, ea, 3, 2, 1); place(ga, ea, 3, 1, 1); place(ga, ea, 4, 1, 4);
  fireBeam(ga);
  T('a-solve-l3', ga.call('levelComplete') === true && winOverlayActive(ga) &&
    JSON.parse(ga.call('JSON.stringify(stars)'))['2'] === 3);
}

ea.btnWinNext.dispatch('pointerdown'); ga.pump(2);
place(ga, ea, 3, 4, 4); /* '/'(4,4) UP col4 -> (0,4) */
fireBeam(ga);
T('a-solve-l4', ga.call('currentLevel') === 3 && ga.call('levelComplete') === true &&
  JSON.parse(ga.call('JSON.stringify(stars)'))['3'] === 3);

ea.btnWinNext.dispatch('pointerdown'); ga.pump(2);
T('a-next-l5-two-targets', ga.call('currentLevel') === 4 && String(ea.levelLabel.textContent) === 'Level 5 - Two Targets');
{
  const ps = trayPieces(ea);
  T('a-tray-l5-splitter', ps.some(p => parseInt(p.dataset.type) === 5 && pieceCount(p) === '1'),
    ps.map(p => p.dataset.type + ':' + pieceCount(p)).join(','));
  place(ga, ea, 5, 2, 2); /* splitter consumes the straight beam */
  T('a-splitter-autodeselect', ga.call('grid[2][2].type') === 5 && ga.call('selectedPieceType') === null && ga.call('tray[5]') === 0);
  place(ga, ea, 4, 3, 2); place(ga, ea, 3, 3, 4);
  fireBeam(ga);
  T('a-solve-l5-p0-fix', ga.call('levelComplete') === true && winOverlayActive(ga) &&
    JSON.parse(ga.call('JSON.stringify(targetsHit)')).length === 2 &&
    JSON.parse(ga.call('JSON.stringify(stars)'))['4'] === 3);
}

ea.btnWinNext.dispatch('pointerdown'); ga.pump(2);
T('a-next-l6', ga.call('currentLevel') === 5 && String(ea.levelLabel.textContent) === 'Level 6 - The Loop');
ea.btnHint.dispatch('pointerdown');
T('a-hint-particles', JSON.parse(ga.call('JSON.stringify(particles)')).length >= 12,
  'particles=' + ga.call('particles.length'));
ea.btnBackToLevels.dispatch('pointerdown'); ga.pump(2);
{
  const btns = levelBtns(ea);
  const unlocked = btns.filter(b => b.classList.contains('unlocked'));
  const stars0 = btnFilledStars(btns[0]);
  T('a-back-to-levels-unlocks', ga.call('state') === 'levelselect' && unlocked.length === 6 && stars0 === 3,
    'unlocked=' + unlocked.length);
}
/* visibilitychange pauses + resumes the rAF chain */
ga.call("document.hidden=true");
ga.call("document.dispatch('visibilitychange', {})");
T('a-visibility-pause', ga.call('rafId') === null);
ga.call("document.hidden=false");
ga.call("document.dispatch('visibilitychange', {})");
T('a-visibility-resume', !!ga.call('rafId'));

ea.btnBackFromLevels.dispatch('pointerdown'); ga.pump(2);
T('a-back-to-title-bgmstop', ga.call('state') === 'title' && JSON.parse(ga.call('JSON.stringify(bgmNodes)')).length === 0);
{
  const save = JSON.parse(ga.ls.getItem('laserMaze_save'));
  const want = { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 };
  T('a-save-shape', save && save.v === 1 && JSON.stringify(save.stars) === JSON.stringify(want) &&
    save.settings.sfx === true && save.settings.music === true, JSON.stringify(save));
}

/* offline battery now that boot A gave us the live LEVELS (same objects the engine
 * loads — guarantees we validate the data the game actually runs) */
{
  const LEVELS = JSON.parse(ga.call('JSON.stringify(LEVELS)'));
  T('o-levels-count', LEVELS.length === 29, 'got ' + LEVELS.length);
  for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    const cells = new Set(); let dup = false;
    for (const fp of lv.fixed) { const k = fp.r + ',' + fp.c; if (cells.has(k)) dup = true; cells.add(k); }
    let tgt = 0, src = 0, splF = 0;
    for (const fp of lv.fixed) { if (fp.type === P.TARGET) tgt++; if (fp.type === P.SOURCE) src++; if (fp.type === P.SPLITTER) splF++; }
    const splT = lv.placeable['5'] || 0;
    let min = null, via = 'iddfs';
    if (KNOWN_SOL[i]) {
      const r = simulate(lv, KNOWN_SOL[i].map(x => ({ r: x[1], c: x[2], type: x[0] })));
      if (r.won) min = KNOWN_SOL[i].length; via = 'known';
    } else {
      const r = solve(lv);
      if (r.min != null) min = r.min;
    }
    T('o-solve-' + String(i + 1).padStart(2, '0') + '-' + lv.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      !dup && tgt >= 1 && src >= 1 && tgt <= src + splF + splT && min != null && min <= lv.par,
      dup ? 'dup-fixed-cells' : tgt < 1 ? 'no-targets' : min == null ? 'no-solution-found' :
      min > lv.par ? 'min ' + min + ' > par ' + lv.par + ' (3 stars unreachable)' : 'min=' + min + ' par=' + lv.par + ' (' + via + ')');
  }
}

/* ================= BOOT B: seeded returning player (partial stars, muted) ================= */
{
  const seedStars = { 0: 3, 1: 2 };
  const gb = bootGame(SLUG, { seedLS: { laserMaze_save: JSON.stringify({ v: 1, stars: seedStars, settings: { sfx: false, music: false } }) } });
  const eb = gb.els;
  T('b-boot-clean', gb.loadErrors.length === 0 && gb.call('state') === 'title', gb.loadErrors.join('; '));
  eb.btnPlay.dispatch('pointerdown'); gb.pump(2);
  T('b-muted-toggles', !eb.toggleSfx.classList.contains('on') && !eb.toggleMusic.classList.contains('on'));
  {
    const btns = levelBtns(eb);
    const unlockedIdx = btns.map((b, i) => b.classList.contains('unlocked') ? i : -1).filter(i => i >= 0);
    const stars1 = btnFilledStars(btns[1]);
    T('b-unlock-gating', JSON.stringify(unlockedIdx) === '[0,1,2]' && stars1 === 2,
      'unlocked=' + JSON.stringify(unlockedIdx) + ' stars[1]=' + stars1);
  }
  T('b-enter-l3', enterLevel(gb, eb, 2) && gb.call('tray[6]') === 1);
  place(gb, eb, 6, 4, 4); /* placeable WALL is a removable player piece */
  T('b-wall-place', gb.call('grid[4][4].type') === 6 && gb.call('grid[4][4].isPlayer') === true && gb.call('tray[6]') === 0);
  tapCanvas(gb, eb, 4, 4); /* non-mirror player piece: tap removes + refunds */
  T('b-wall-remove-refund', gb.call('grid[4][4].type') === 0 && gb.call('tray[6]') === 1 &&
    JSON.parse(gb.call('JSON.stringify(playerPlacements)')).length === 0);
  const save = JSON.parse(gb.ls.getItem('laserMaze_save'));
  T('b-save-untouched-by-play', JSON.stringify(save.stars) === JSON.stringify(seedStars) && save.settings.sfx === false);
}

/* ================= BOOT C: full-progression seed — master-tier journeys ================= */
{
  const seedStars = {}; for (let i = 0; i <= 27; i++) if (i !== 24) seedStars[i] = 3; /* 24 left unwon for the 2-star path */
  const gc = bootGame(SLUG, { seedLS: { laserMaze_save: JSON.stringify({ v: 1, stars: seedStars, settings: { sfx: true, music: false } }) } });
  const ec = gc.els;
  T('c-boot-clean', gc.loadErrors.length === 0, gc.loadErrors.join('; '));
  ec.btnPlay.dispatch('pointerdown'); gc.pump(2);
  {
    const btns = levelBtns(ec);
    T('c-all-unlocked', btns.length === 29 && btns.filter(b => b.classList.contains('unlocked')).length === 28 &&
      !btns[25].classList.contains('unlocked') && btns[24].classList.contains('unlocked'),
      'unlocked=' + btns.filter(b => b.classList.contains('unlocked')).length);
  }

  /* L16 The Hub — P0 fix: 7-piece splitter cascade feeds all 4 cross targets */
  T('c-enter-hub', enterLevel(gc, ec, 15) && String(ec.levelLabel.textContent) === 'Level 16 - The Hub');
  for (const [t, r, c] of KNOWN_SOL[15]) place(gc, ec, t, r, c);
  fireBeam(gc);
  T('c-hub-win', gc.call('levelComplete') === true && winOverlayActive(gc) &&
    JSON.parse(gc.call('JSON.stringify(targetsHit)')).length === 4 &&
    JSON.parse(gc.call('JSON.stringify(stars)'))['15'] === 3);
  ec.btnBackToLevels.dispatch('pointerdown'); gc.pump(2);

  /* L19 Color Theory — filter recolors the beam (segments past (3,3) are red) */
  T('c-enter-colortheory', enterLevel(gc, ec, 18));
  place(gc, ec, 3, 3, 4); place(gc, ec, 3, 0, 4);
  fireBeam(gc);
  {
    const segs = JSON.parse(gc.call('JSON.stringify(beamSegments)'));
    const redPast = segs.some(s => s.color === 1 && s.fromR === 3 && s.fromC === 3);
    T('c-colortheory-filter-color', redPast && gc.call('levelComplete') === true &&
      JSON.parse(gc.call('JSON.stringify(stars)'))['18'] === 3,
      JSON.stringify(segs));
  }
  ec.btnBackToLevels.dispatch('pointerdown'); gc.pump(2);

  /* L20 Red Light — P1 dup-cell fix: both targets live, splitter tray */
  T('c-enter-redlight', enterLevel(gc, ec, 19) && String(ec.levelLabel.textContent) === 'Level 20 - Red Light');
  place(gc, ec, 3, 1, 3); place(gc, ec, 5, 1, 0); place(gc, ec, 4, 6, 0);
  fireBeam(gc);
  T('c-redlight-win', gc.call('levelComplete') === true && JSON.parse(gc.call('JSON.stringify(stars)'))['19'] === 3);

  /* L21 Spectrum — P0 dup-cell fix: both targets live */
  ec.btnWinNext.dispatch('pointerdown'); gc.pump(2);
  T('c-next-spectrum', gc.call('currentLevel') === 20 && String(ec.levelLabel.textContent) === 'Level 21 - Spectrum');
  place(gc, ec, 5, 3, 3); place(gc, ec, 3, 0, 3); place(gc, ec, 4, 6, 3);
  fireBeam(gc);
  T('c-spectrum-win', gc.call('levelComplete') === true && JSON.parse(gc.call('JSON.stringify(targetsHit)')).length === 2 &&
    JSON.parse(gc.call('JSON.stringify(stars)'))['20'] === 3);
  ec.btnBackToLevels.dispatch('pointerdown'); gc.pump(2);

  /* L25 Bomb Run — bomb fail path first, then fix by rotating the bad mirror (2-star tier) */
  T('c-enter-bombrun', enterLevel(gc, ec, 24) && String(ec.levelLabel.textContent) === 'Level 25 - Bomb Run');
  place(gc, ec, 3, 4, 2); place(gc, ec, 3, 0, 2); place(gc, ec, 4, 0, 3);
  gc.els.btnBeam.dispatch('pointerdown');
  T('c-bombrun-bombhit', gc.call('bombHit') === true && JSON.parse(gc.call('JSON.stringify(targetsHit)')).length === 0);
  gc.pump(160);
  T('c-bombrun-nowin', gc.call('levelComplete') === false && !winOverlayActive(gc));
  ec.btnUndo.dispatch('pointerdown'); /* pop the bad '\'(0,3) (tapping a player mirror only rotates it) */
  T('c-bombrun-undo-bad-mirror', gc.call('grid[0][3].type') === 0 && gc.call('tray[4]') === 3);
  place(gc, ec, 3, 1, 1);  /* off-path extra piece: 4 placements total -> 2-star tier */
  place(gc, ec, 4, 0, 7);  /* '\'(0,7) turns row-0 beam down into the target */
  fireBeam(gc);
  T('c-bombrun-fix-2star', gc.call('levelComplete') === true && winOverlayActive(gc) &&
    gc.call('bombHit') === false && JSON.parse(gc.call('JSON.stringify(stars)'))['24'] === 2,
    'stars24=' + gc.call('stars[24]'));
  ec.btnBackToLevels.dispatch('pointerdown'); gc.pump(2);

  /* L28 Dual Source — P0 topological redesign: mirror-in, split, one target per branch */
  T('c-enter-dualsource', enterLevel(gc, ec, 27) && String(ec.levelLabel.textContent) === 'Level 28 - Dual Source');
  for (const [t, r, c] of KNOWN_SOL[27]) place(gc, ec, t, r, c);
  fireBeam(gc);
  T('c-dualsource-win', gc.call('levelComplete') === true && JSON.parse(gc.call('JSON.stringify(targetsHit)')).length === 4 &&
    JSON.parse(gc.call('JSON.stringify(stars)'))['27'] === 3);

  /* L29 Grand Finale — last level: Next button becomes "Levels" and returns to the map */
  ec.btnWinNext.dispatch('pointerdown'); gc.pump(2);
  T('c-next-finale', gc.call('currentLevel') === 28 && String(ec.levelLabel.textContent) === 'Level 29 - Grand Finale');
  place(gc, ec, 4, 0, 1); place(gc, ec, 5, 1, 1); place(gc, ec, 3, 1, 0); place(gc, ec, 5, 1, 7);
  fireBeam(gc);
  T('c-finale-win', gc.call('levelComplete') === true && winOverlayActive(gc) &&
    JSON.parse(gc.call('JSON.stringify(stars)'))['28'] === 3 && String(ec.btnWinNext.textContent) === 'Levels');
  ec.btnWinNext.dispatch('pointerdown'); gc.pump(2);
  T('c-finale-next-to-map', gc.call('state') === 'levelselect' && ec.levelSelect.classList.contains('active'));
  {
    const save = JSON.parse(gc.ls.getItem('laserMaze_save'));
    const want = {}; for (let i = 0; i <= 27; i++) if (i !== 24) want[i] = 3;
    want[24] = 2; want[28] = 3;
    T('c-save-final', JSON.stringify(save.stars) === JSON.stringify(want), JSON.stringify(save.stars));
  }
}

console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { boots: 3, levelsSolver: 'all-29', realTaps: true } }));
process.exit(fail === 0 ? 0 : 1);
