'use strict';
/* flood-fill verify_engine.js — full E2E coverage via real palette pointer events.
 *
 * Engine facts (index.html, top-level script — engine vars/functions are vm globals so
 * state READS use ga.call('state.*'); all DRIVING is real DOM: #palette .pbtn pointerdown,
 * toolbar/overlay button pointerdown).
 *  - 30 classic levels, deterministic grid seed (idx+1)*7919+12345 via mulberry32.
 *    Move: pick palette color != current; territory (BFS from 0,0 over current color) is
 *    recolored, then re-absorbed. Win when territory covers the grid. Classic lose at
 *    moves >= par+5. Stars: <=par-2:3, <=par:2, <=par+3:1, else 0.
 *  - Modes: classic / daily (seed=floor(Date/864e5); VDate epoch0 -> seed 0, 10x10/5c/par18)
 *    / zen (Math.random grid, par 99, no lose).
 *  - Undo stack (10 deep), restart, greedy hint, tutorial on first classic load,
 *    level select gate i<=levelReached, settings persisted to floodfill_settings,
 *    progress to floodfill_v2.
 * Offline: beam search (w=40, immediate-gain-first) finds <=par+3 solutions for all 30
 * levels; engine parity asserted after every tap.
 *
 * Harness notes:
 *  - engine registers init on DOCUMENT 'DOMContentLoaded'; harness fires only window-level
 *    DCL -> dispatch document DCL manually right after boot (both boots).
 *  - #modeSel .mbtn via document.querySelectorAll hits the synthetic qa: fallback (compound
 *    selector), so mode buttons get no real listeners — drive the exact button handler
 *    body via ga.call("setMode(m);loadLevel(0);").
 *  - ovStars/level-cell stars are innerHTML/child-built: count lit via innerHTML string /
 *    first child textContent (engine writes numeric textContent — always String() wrap).
 */
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0; const fails = [];
function ck(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + String(detail).slice(0, 160) : '')); }
}

/* ---- shipped data + exact generation/simulation ---- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const src = html.slice(html.indexOf('var LEVELS ='), html.indexOf('];', html.indexOf('var LEVELS')) + 2);
const LEVELS = (new Function(src + ';return LEVELS;'))();
function mulberry32(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function generateGrid(size, numColors, seed) { var rng = mulberry32(seed); var g = []; for (var r = 0; r < size; r++) { var row = []; for (var c = 0; c < size; c++) row.push(Math.floor(rng() * numColors)); g.push(row); } return g; }
function territoryOf(g) { var size = g.length; var vis = []; for (var i = 0; i < size; i++) vis.push(new Array(size).fill(false)); var oc = g[0][0]; var q = [[0, 0]]; vis[0][0] = true; var t = []; while (q.length) { var cell = q.shift(); var r = cell[0], c = cell[1]; t.push(cell); var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; for (var d = 0; d < 4; d++) { var nr = r + dirs[d][0], nc = c + dirs[d][1]; if (nr >= 0 && nr < size && nc >= 0 && nc < size && !vis[nr][nc] && g[nr][nc] === oc) { vis[nr][nc] = true; q.push([nr, nc]); } } } return t; }
function applyTo(g, color) { var t = territoryOf(g); t.forEach(c => { g[c[0]][c[1]] = color; }); }
function gainOf(g, color) { var t = territoryOf(g); var size = g.length; var vis = []; for (var i = 0; i < size; i++) vis.push(new Array(size).fill(false)); var q = []; q.push.apply(q, t); t.forEach(c => { vis[c[0]][c[1]] = true; }); var gain = 0; while (q.length) { var cell = q.shift(); var r = cell[0], c = cell[1]; var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; for (var d = 0; d < 4; d++) { var nr = r + dirs[d][0], nc = c + dirs[d][1]; if (nr >= 0 && nr < size && nc >= 0 && nc < size && !vis[nr][nc] && g[nr][nc] === color) { vis[nr][nc] = true; q.push([nr, nc]); gain++; } } } return gain; }
function greedyColor(g, nc) { var best = -1, bg = -1; for (var color = 0; color < nc; color++) { if (color === g[0][0]) continue; var gg = gainOf(g, color); if (gg > bg) { bg = gg; best = color; } } return best; }
function beamSolve(L, idx, beamW, maxDepth) {
  const g0 = generateGrid(L.size, L.colors, (idx + 1) * 7919 + 12345);
  const total = L.size * L.size;
  if (territoryOf(g0).length === total) return [];
  let frontier = [{ g: g0, path: [] }];
  const seen = new Set([g0.map(r => r.join('')).join('|')]);
  for (let d = 0; d < maxDepth; d++) {
    const next = [];
    for (const node of frontier) {
      for (let color = 0; color < L.colors; color++) {
        if (color === node.g[0][0] || gainOf(node.g, color) === 0) continue;
        const g2 = node.g.map(r => r.slice()); applyTo(g2, color);
        const key = g2.map(r => r.join('')).join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        const path = node.path.concat(color);
        if (territoryOf(g2).length === total) return path;
        next.push({ g: g2, path, terr: territoryOf(g2).length });
      }
    }
    if (!next.length) return null;
    next.sort((a, b) => b.terr - a.terr);
    frontier = next.slice(0, beamW);
  }
  return null;
}
function starsOf(moves, par) { return moves <= par - 2 ? 3 : moves <= par ? 2 : moves <= par + 3 ? 1 : 0; }

/* offline battery: every classic level solvable within par+3 */
const PLANS = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  let res = null;
  for (const cap of [L.par - 2, L.par, L.par + 1, L.par + 2, L.par + 3]) { res = beamSolve(L, i, 40, cap); if (res) break; }
  ck('o-solvable-' + (i + 1), !!res && res.length <= L.par + 3, res ? res.length + ' vs par' + L.par : 'null');
  PLANS.push(res);
}
/* offline: L1 lose plan — pure 0-gain waste (validated: territory stays 1/36 for 15 moves) */
const L1 = LEVELS[0];
const LOSE_PLAN = (() => {
  const g = generateGrid(L1.size, L1.colors, 7919 + 12345).map(r => r.slice());
  const plan = [];
  while (plan.length < L1.par + 5) {
    const cur = g[0][0]; let pick = -1;
    for (let color = 0; color < L1.colors; color++) { if (color !== cur && gainOf(g, color) === 0) { pick = color; break; } }
    if (pick < 0) return null;
    applyTo(g, pick); plan.push(pick);
    if (territoryOf(g).length === L1.size * L1.size) return null;
  }
  return plan;
})();
ck('o-lose-plan', Array.isArray(LOSE_PLAN) && LOSE_PLAN.length === L1.par + 5, LOSE_PLAN && LOSE_PLAN.length);

/* ---- live helpers ---- */
function bootFF(opts) {
  const ga = bootGame('flood-fill', opts);
  // engine registers init on document 'DOMContentLoaded'. The harness now auto-fires
  // document-level DCL after script load, so init has already run — firing it again
  // (this verifier's original manual dispatch) double-binds every handler and NEXT
  // skips 2 levels mid-sweep (kakuro-class regression). Probe the init side effect:
  // only dispatch when init truly hasn't run (old-harness compatibility).
  if (ga.call('state.grid === null')) ga.sandbox.document.dispatch('DOMContentLoaded', { type: 'DOMContentLoaded' });
  ga.pump(3);
  return ga;
}
function tapPalette(ga, colorIdx) {
  const btns = (ga.els.palette.children || []);
  btns[colorIdx].dispatch('pointerdown', {});
  ga.pump(2);
}
function movesOf(ga) { return ga.call('state.moves'); }
function terrSize(ga) { return ga.call('getTerritory(state.grid).length'); }
function ovStars(ga) { return ((ga.els.ovStars.innerHTML || '').match(/class="s[^"]*lit/g) || []).length; }
function cellStars(el) { return ((String((((el || {}).children || [])[0] || {}).textContent || '')).match(/★/g) || []).length; }
function progOf(ga) { const s = ga.ls.getItem('floodfill_v2'); return s ? JSON.parse(s) : null; }
function pumpOverlay(ga) { ga.pump(70); } // win overlay 800ms / lose 300ms timers

/* apply a full plan with per-move engine parity */
function playPlan(ga, plan, tag) {
  const sim = ga.call('JSON.parse(JSON.stringify(state.grid))');
  for (let k = 0; k < plan.length; k++) {
    const before = movesOf(ga);
    tapPalette(ga, plan[k]);
    applyTo(sim, plan[k]);
    const expTerr = territoryOf(sim).length;
    if (movesOf(ga) !== before + 1) { ck(tag + '-move-' + k, false, 'moves ' + movesOf(ga)); return false; }
    if (ga.call('JSON.stringify(state.grid)') !== JSON.stringify(sim)) { ck(tag + '-grid-' + k, false, 'grid diverged'); return false; }
    if (terrSize(ga) !== expTerr) { ck(tag + '-terr-' + k, false, terrSize(ga) + ' vs ' + expTerr); return false; }
  }
  return true;
}

/* ============ Boot A: fresh — tutorial, tools, lose flow, full 30-level sweep ============ */
(function bootA() {
  const ga = bootFF({});
  ck('a-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ck('a-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|'));
  ck('a-boot-init', ga.call('state.grid !== null'));
  ck('a-tut-shown', !ga.els.tutorial.classList.contains('hidden'));
  ck('a-l1-loaded', ga.call('state.levelIdx') === 0 && String(ga.els.parVal.textContent) === '10' && movesOf(ga) === 0);
  ck('a-palette', (ga.els.palette.children || []).length === 4);

  // tutorial close persists levelReached
  ga.els.tutClose.dispatch('pointerdown', {}); ga.pump(2);
  ck('a-tut-closed', ga.els.tutorial.classList.contains('hidden') && (progOf(ga) || {}).levelReached === 1);

  // hint: engine's greedyHint on live grid
  const grid0 = ga.call('JSON.parse(JSON.stringify(state.grid))');
  const expHint = greedyColor(grid0, 4);
  ga.els.hintBtn.dispatch('pointerdown', {}); ga.pump(2);
  ck('a-hint', ga.call('state.showHintColor') === expHint, ga.call('state.showHintColor') + ' vs ' + expHint);
  ck('a-hint-flash', ga.call('state.hintsUsed') === 1);
  // palette hint highlight (buildPalette children are real .pbtn elements)
  ck('a-hint-lit', (ga.els.palette.children || []).filter(b => b.classList.contains('hint')).length === 1);

  // apply 2 moves then undo restores exactly
  const snap = ga.call('JSON.stringify(state.grid)');
  tapPalette(ga, PLANS[0][0]);
  tapPalette(ga, PLANS[0][1]);
  ck('a-two-moves', movesOf(ga) === 2);
  ga.els.undoBtn.dispatch('pointerdown', {}); ga.pump(2);
  ck('a-undo-1', movesOf(ga) === 1);
  ga.els.undoBtn.dispatch('pointerdown', {}); ga.pump(2);
  ck('a-undo-0', movesOf(ga) === 0 && ga.call('JSON.stringify(state.grid)') === snap);
  ga.els.undoBtn.dispatch('pointerdown', {}); ga.pump(1);
  ck('a-undo-empty', movesOf(ga) === 0);

  // same-color tap is a no-op
  const cur = ga.call('state.grid[0][0]');
  tapPalette(ga, cur);
  ck('a-same-color-noop', movesOf(ga) === 0);

  // lose flow: pure 0-gain waste to par+5 (territory frozen), per-move parity
  playPlan(ga, LOSE_PLAN, 'a-lose');
  ck('a-lose-triggered', ga.call('state.gameOver') === true && movesOf(ga) === L1.par + 5, movesOf(ga));
  pumpOverlay(ga);
  ck('a-lose-overlay', !ga.els.overlay.classList.contains('hidden') && ga.els.ovTitle.textContent === 'Out of Moves!', ga.els.ovTitle.textContent);
  ck('a-lose-next-hidden', ga.els.ovNext.style.display === 'none');
  const progLose = progOf(ga);
  ck('a-lose-nosave', !((progLose || {}).levels || {})['0'], JSON.stringify(progLose));

  // retry -> fresh level 1 (same deterministic grid), then win with the beam plan
  ga.els.ovRetry.dispatch('pointerdown', {}); ga.pump(3);
  ck('a-retry-fresh', movesOf(ga) === 0 && ga.call('state.gameOver') === false && ga.call('JSON.stringify(state.grid)') === JSON.stringify(generateGrid(L1.size, L1.colors, 7919 + 12345)));
  playPlan(ga, PLANS[0], 'a-l1');
  pumpOverlay(ga);
  const st1 = starsOf(PLANS[0].length, L1.par);
  ck('a-l1-win', !ga.els.overlay.classList.contains('hidden') && ga.call('state.gameWon') === true);
  ck('a-l1-stars', ovStars(ga) === st1, ovStars(ga) + ' vs ' + st1 + ' moves ' + PLANS[0].length);
  const p1 = progOf(ga);
  ck('a-l1-progress', p1.levels['0'].stars === st1 && p1.levels['0'].best === PLANS[0].length && p1.levelReached === 1, JSON.stringify(p1.levels));

  // sweep levels 2..30 via ovNext chain
  for (let i = 1; i < LEVELS.length; i++) {
    ga.els.ovNext.dispatch('pointerdown', {}); ga.pump(3);
    const L = LEVELS[i];
    ck('a-sweep-hud-' + (i + 1), ga.call('state.levelIdx') === i && String(ga.els.parVal.textContent) === String(L.par) && (ga.els.palette.children || []).length === L.colors, ga.els.parVal.textContent);
    playPlan(ga, PLANS[i], 'a-sweep-' + (i + 1));
    pumpOverlay(ga);
    const won = ga.call('state.gameWon') === true;
    const st = starsOf(PLANS[i].length, L.par);
    if (!won) { ck('a-sweep-win-' + (i + 1), false, 'not won'); continue; }
    ck('a-sweep-' + (i + 1), ovStars(ga) === st && progOf(ga).levels[String(i)] && progOf(ga).levels[String(i)].stars === st && progOf(ga).levelReached === i + 1,
      'stars ' + ovStars(ga) + '/' + st);
    if (i === LEVELS.length - 1) {
      ck('a-last-title', ga.els.ovTitle.textContent === 'All Levels Complete!', ga.els.ovTitle.textContent);
      ck('a-last-next-menu', ga.els.ovNext.textContent === 'Menu' && ga.els.ovNext.style.display !== 'none', ga.els.ovNext.style.display); // P2 fix verified
    }
  }
  const pEnd = progOf(ga);
  ck('a-end-all30', Object.keys(pEnd.levels).length === 30 && pEnd.levelReached === 30, Object.keys(pEnd.levels).length + ' ' + pEnd.levelReached);

  // Menu -> level select: all unlocked, stars shown, current = 30
  ga.els.ovNext.dispatch('pointerdown', {}); ga.pump(3);
  ck('a-menu-levelselect', !ga.els.levelSelect.classList.contains('hidden'));
  const cells = (ga.els.levelGrid.children || []);
  ck('a-menu-cells', cells.length === 30, cells.length);
  ck('a-menu-unlocked', cells.every(c => c.classList.contains('unlocked')));
  ck('a-menu-current', cells[29].classList.contains('current'));
  ck('a-menu-stars-shown', cellStars(cells[0]) === st1, String(((cells[0].children || [])[0] || {}).textContent));
  ga.els.closeLevelSelect.dispatch('pointerdown', {}); ga.pump(1);
  ck('a-menu-closed', ga.els.levelSelect.classList.contains('hidden'));

  // restart from the post-win state (level 30): reloads the same level fresh
  ga.els.restartBtn.dispatch('pointerdown', {}); ga.pump(2);
  ck('a-restart', movesOf(ga) === 0 && ga.call('state.levelIdx') === LEVELS.length - 1 &&
    ga.call('JSON.stringify(state.grid)') === JSON.stringify(generateGrid(LEVELS[29].size, LEVELS[29].colors, 30 * 7919 + 12345)) &&
    ga.call('state.gameWon') === false);

  // daily mode: VDate epoch -> seed 0, 10x10, 5 colors, par 18
  // (mode buttons bind via document.querySelectorAll('#modeSel .mbtn') -> synthetic qa:
  //  fallback in the harness; drive the exact button-handler body)
  ga.call("setMode('daily'); loadLevel(0);"); ga.pump(3);
  ck('a-daily-loaded', ga.call('state.mode') === 'daily' && String(ga.els.parVal.textContent) === '18' && (ga.els.palette.children || []).length === 5 && ga.els.levelVal.textContent === 'D');
  ck('a-daily-info', !ga.els.dailyInfo.classList.contains('hidden') && ga.els.dailyInfo.textContent.indexOf('Grid 10x10') >= 0, ga.els.dailyInfo.textContent);
  const dailyGrid = ga.call('JSON.parse(JSON.stringify(state.grid))');
  ck('a-daily-seed', JSON.stringify(dailyGrid) === JSON.stringify(generateGrid(10, 5, 0)));
  // solve daily adaptively (greedy, par 99, no lose in daily)
  {
    let guard2 = 0;
    while (ga.call('getTerritory(state.grid).length') < 100 && guard2++ < 200) {
      const g = ga.call('JSON.parse(JSON.stringify(state.grid))');
      const pick = greedyColor(g, 5);
      if (pick < 0) break;
      tapPalette(ga, pick);
    }
    pumpOverlay(ga);
    ck('a-daily-win', ga.call('state.gameWon') === true && ga.els.ovTitle.textContent === 'Daily Complete!', ga.els.ovTitle.textContent);
    const dp = progOf(ga);
    const dkey = Object.keys(dp.daily || {})[0];
    ck('a-daily-saved', !!dkey && dp.daily[dkey].moves === movesOf(ga), JSON.stringify(dp.daily));
  }
  ga.els.ovNext.dispatch('pointerdown', {}); ga.pump(2); // Close
  ck('a-daily-close', ga.els.overlay.classList.contains('hidden'));

  // zen mode: random grid solved adaptively; zenBest recorded; New Puzzle regenerates
  ga.call("setMode('zen'); loadLevel(0);"); ga.pump(3);
  ck('a-zen-loaded', ga.call('state.mode') === 'zen' && String(ga.els.parVal.textContent) === '99' && ga.els.levelVal.textContent === 'Z');
  {
    const zg = ga.call('state.grid');
    const zsize = zg.length, zcolors = ga.call('state.numColors');
    let guard3 = 0;
    while (ga.call('getTerritory(state.grid).length') < zsize * zsize && guard3++ < 300) {
      const g = ga.call('JSON.parse(JSON.stringify(state.grid))');
      const pick = greedyColor(g, zcolors);
      if (pick < 0) break;
      tapPalette(ga, pick);
    }
    pumpOverlay(ga);
    ck('a-zen-win', ga.call('state.gameWon') === true && ga.els.ovTitle.textContent === 'Zen Complete!', ga.els.ovTitle.textContent);
    ck('a-zen-best', (progOf(ga) || {}).zenBest === movesOf(ga), (progOf(ga) || {}).zenBest + ' vs ' + movesOf(ga));
    ga.els.ovNext.dispatch('pointerdown', {}); ga.pump(3);
    ck('a-zen-new', movesOf(ga) === 0 && ga.call('state.gameWon') === false);
  }

  // settings modal: toggles persist
  ga.els.settingsBtn.dispatch('pointerdown', {}); ga.pump(2);
  ck('a-settings-open', !ga.els['settings-modal'].classList.contains('hidden'));
  ck('a-settings-defaults', ga.els.sfxToggle.classList.contains('on') && ga.els.bgmToggle.classList.contains('on') && !ga.els.autoHintToggle.classList.contains('on'));
  ga.els.sfxToggle.dispatch('pointerdown', {}); ga.pump(1);
  const stt = JSON.parse(ga.ls.getItem('floodfill_settings'));
  ck('a-settings-persist', stt.sfx === false && stt.bgm === true);
  ga.els.sfxToggle.dispatch('pointerdown', {}); ga.pump(1);
  ga.els.closeSettings.dispatch('pointerdown', {}); ga.pump(1);
  ck('a-settings-close', ga.els['settings-modal'].classList.contains('hidden'));

  // resize handler no-crash
  ga.sandbox.window.dispatchEvent({ type: 'resize' }); ga.pump(2);
  ck('a-resize-ok', !ga.sandbox.__errors || !ga.sandbox.__errors.length);
})();

/* ============ Boot B: seeded progress — resume level, locked cells ============ */
(function bootB() {
  const ga = bootFF({
    seedLS: { floodfill_v2: JSON.stringify({ version: 2, levels: { 0: { stars: 3, best: 8 } }, daily: {}, zenBest: 12, levelReached: 2 }) },
  });
  ck('b-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  // init loads startLevel = min(levelReached, 29) = 2 (level 3)
  ck('b-resume', ga.call('state.levelIdx') === 2 && String(ga.els.levelVal.textContent) === '3', ga.els.levelVal.textContent);
  ck('b-no-tutorial', ga.els.tutorial.classList.contains('hidden'));

  ga.els.homeBtn.dispatch('pointerdown', {}); ga.pump(2);
  const cells = (ga.els.levelGrid.children || []);
  ck('b-cells', cells.length === 30);
  ck('b-unlock-gate', cells[0].classList.contains('unlocked') && cells[1].classList.contains('unlocked') && cells[2].classList.contains('unlocked') && !cells[3].classList.contains('unlocked'));
  ck('b-locked-icon', String(cells[3].textContent).indexOf('🔒') >= 0, cells[3].textContent);
  ck('b-stars-display', cellStars(cells[0]) === 3);

  // locked cell has no listener (click does nothing)
  cells[3].dispatch('pointerdown', {}); ga.pump(2);
  ck('b-locked-noop', !ga.els.levelSelect.classList.contains('hidden') && ga.call('state.levelIdx') === 2);

  // unlocked cell loads that level directly
  cells[1].dispatch('pointerdown', {}); ga.pump(3);
  ck('b-cell-loads', ga.els.levelSelect.classList.contains('hidden') && ga.call('state.levelIdx') === 1 && String(ga.els.levelVal.textContent) === '2');

  // restart mid-level: make a real move, then restart resets moves + reloads the grid
  tapPalette(ga, PLANS[1][0]);
  ck('b-pre-restart', movesOf(ga) === 1);
  ga.els.restartBtn.dispatch('pointerdown', {}); ga.pump(2);
  ck('b-restart-mid', movesOf(ga) === 0 && ga.call('state.levelIdx') === 1 &&
    ga.call('JSON.stringify(state.grid)') === JSON.stringify(generateGrid(LEVELS[1].size, LEVELS[1].colors, 2 * 7919 + 12345)));

  // win L2 keeps existing best if worse
  playPlan(ga, PLANS[1], 'b-l2');
  pumpOverlay(ga);
  const p = progOf(ga);
  ck('b-l2-save', p.levels['1'].stars === starsOf(PLANS[1].length, LEVELS[1].par) && p.levels['0'].stars === 3 && p.levelReached === 2, JSON.stringify(p.levels));
})();

/* ---- report ---- */
const total = pass + fail;
console.log(JSON.stringify({ pass, fail, total, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { levels: '30/30 classic + daily + zen', boots: 2, realTaps: true, engineFix: 'P2-lastlevel-next-hidden' } }));
process.exit(fail === 0 ? 0 : 1);
