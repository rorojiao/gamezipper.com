#!/usr/bin/env node
/* number-match — engine verifier (queue-B #31)
 * Real input paths only: every board action is a canvas pointerdown at real cell
 * coordinates (geometry read from a read-only __NM export); UI goes through real
 * markup buttons (inline onclick compiled by the harness). The winning line is the
 * generator's own reverse-insertion replay, validated offline against the engine's
 * exact canConnect semantics for all 30 levels.
 * Engine bugs fixed 2026-08-25:
 *   P0 boards were random pair-valued scatter with zero playability guarantee —
 *      ordinary (greedy) play lost 30/30 levels (deadlocks drew random junk addLine
 *      rows into the 12-row GAME OVER). Generator is now reverse-play constructive:
 *      replaying insertions backwards is a guaranteed win for all 30 levels, and
 *      greedy play wins 29/30 (re-measured with the engine's exact match semantics —
 *      an earlier restricted-move analysis overstated it as "proven unsolvable").
 *      Odd sizes play one row shorter (odd cell counts can never fully clear).
 *   P2 calcStars thresholds unreachable (min moves = cells/2 but maxMoves = cells/4,
 *      ratio always >= 2) — every win scored exactly 1 star; 3 stars is now a perfect
 *      clear, 2 stars allows one bailout row.
 *   P3 after a bailout line the board was never re-checked — if the new row created no
 *      match the game soft-locked (no move possible, nothing further ever fired);
 *      bailoutCheck now chains until a match exists or the board fills for a real loss.
 *   P3 the analytics bridge script assigned bare IIFE-internal names (startCurrent &
 *      friends) — it threw "startCurrent is not defined" on every page load; aliases
 *      now come from window.G.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'number-match';
const results = [], fails = [];
function T(name, cond, info) {
  results.push(name);
  if (!cond) fails.push(name + (info ? ' :: ' + info : ''));
  process.stdout.write((cond ? 'ok ' : 'FAIL ') + name + (info && !cond ? '  [' + info + ']' : '') + '\n');
}
function textOf(el) { if (!el) return ''; let t = String(el.textContent == null ? '' : el.textContent); (el.children || []).forEach(c => { t += textOf(c); }); return t; }
const active = el => el && el.classList.contains('active');
function deep(root, pred, out = []) { for (const c of (root.children || [])) { if (pred(c)) out.push(c); deep(c, pred, out); } return out; }
const fullText = c => { let t = String(c.textContent == null ? '' : c.textContent); (c.children || []).forEach(ch => { t += fullText(ch); }); return t; };
const btn = (sb, txt) => deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && fullText(c).includes(txt))[0];

/* ---------- replicate engine logic verbatim (generator + matcher) ---------- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function makeRNG(seed) { var s = seed | 0; return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const levelConfigRep = new Function(html.slice(html.indexOf('function levelConfig(lv){'), html.indexOf('function generateLevel')) + '\nreturn levelConfig;')();
function isMatchPair(a, b) { return a === b || (a + b === 10); }
function canConnect(grid, r1, c1, r2, c2) {
  if (r1 === r2 && c1 === c2) return false;
  if (!grid[r1] || grid[r1][c1] === 0 || !grid[r2] || grid[r2][c2] === 0) return false;
  if (!isMatchPair(grid[r1][c1], grid[r2][c2])) return false;
  if (r1 === r2) { const lo = Math.min(c1, c2), hi = Math.max(c1, c2); for (let c = lo + 1; c < hi; c++) if (grid[r1][c] !== 0) return false; return true; }
  if (c1 === c2) { const lo = Math.min(r1, r2), hi = Math.max(r1, r2); for (let r = lo + 1; r < hi; r++) if (grid[r] && grid[r][c1] !== 0) return false; return true; }
  return false;
}
function compactG(g, cols) { for (let r = 0; r < g.length; r++) { const nr = []; for (let c = 0; c < cols; c++) if (g[r][c]) nr.push(g[r][c]); while (nr.length < cols) nr.push(0); g[r] = nr; } }
/* generator replica WITH the insertion log (positions are the pair's cells at removal
 * time — later same-row insertions are already gone by then) */
function genWithSteps(lv) {
  const cfg = levelConfigRep(lv), cols = cfg.size, rowsN = cfg.rows, rng = makeRNG(lv * 31337 + 42);
  const g = []; for (let r = 0; r < rowsN; r++) g.push([]);
  const partnerOf = v => { const w = 10 - v; return (rng() < 0.5 || w < 1 || w > 9) ? v : w; };
  const fillTo = (cols % 2 === 1) ? cols - 1 : cols, steps = [];
  for (let r = 0; r < rowsN; r++) {
    while (g[r].length < fillTo) {
      const p = Math.floor(rng() * (g[r].length + 1)); const v = Math.floor(rng() * 9) + 1;
      g[r].splice(p, 0, v); g[r].splice(p + 1, 0, partnerOf(v));
      steps.push({ type: 'h', row: r, pos: p });
    }
  }
  if (cols % 2 === 1) {
    for (let r = 0; r + 1 < rowsN; r += 2) { const v = Math.floor(rng() * 9) + 1; g[r].push(v); g[r + 1].push(partnerOf(v)); steps.push({ type: 'v', row: r }); }
  }
  return { g, steps, cols, cfg };
}
/* offline: all 30 replay solutions legal + fully clearing (guards the P0 fix itself) */
let allSolvable = true;
for (let lv = 1; lv <= 30; lv++) {
  const { g, steps, cols } = genWithSteps(lv);
  const grid = g.map(r => r.slice());
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    const r1 = s.row, c1 = s.type === 'v' ? cols - 1 : s.pos, r2 = s.type === 'v' ? s.row + 1 : s.row, c2 = s.type === 'v' ? cols - 1 : s.pos + 1;
    if (!canConnect(grid, r1, c1, r2, c2)) { allSolvable = false; break; }
    grid[r1][c1] = 0; grid[r2][c2] = 0; compactG(grid, cols);
  }
  if (grid.some(r => r.some(v => v))) allSolvable = false;
}
T('gen-30-all-solvable-by-replay', allSolvable);

/* ---------- BOOT A (fresh) ---------- */
const EXPORTS = 'globalThis.__NM={get grid(){return grid},get phase(){return phase},get score(){return score},get moves(){return moves},get level(){return level},get selected(){return selected},get hints(){return hints},get undoCount(){return undoCount},get shuffleCount(){return shuffleCount},get hintCells(){return hintCells},get W(){return W},get H(){return H},get offX(){return offX},get offY(){return offY},get cw(){return cellW},get ch(){return cellH}};';
const g = bootGame(SLUG, { inject: { anchor: 'function updateUI(){', exports: EXPORTS } });
const els = g.els, sb = g.sandbox, cv = els['gc'];
g.pump(3);
T('boot-no-errors', g.loadErrors.length === 0, g.loadErrors.join(' | '));
T('menu-shown', active(els['menu-screen']));

const S1 = genWithSteps(1), S2 = genWithSteps(2), S3 = genWithSteps(3);
const liveGrid = () => g.call('JSON.stringify(__NM.grid)');

function tapRC(r, c) {
  const geo = JSON.parse(g.call('JSON.stringify({W:__NM.W,H:__NM.H,ox:__NM.offX,oy:__NM.offY,cw:__NM.cw,ch:__NM.ch})'));
  const rect = cv.getBoundingClientRect();
  const sx = geo.W / (rect.width || geo.W), sy = geo.H / (rect.height || geo.H);
  cv.dispatch('pointerdown', { clientX: (rect.left || 0) + (geo.ox + c * geo.cw + geo.cw / 2) / sx, clientY: (rect.top || 0) + (geo.oy + r * geo.ch + geo.ch / 2) / sy });
}

/* continue -> L1 (the Continue button's loose text is dropped by the markup parser —
 * only its span#menu-level survives — but it is the first BUTTON in the DOM and its
 * compiled onclick="G.startCurrent()" is wired) */
deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON')[0].click(); g.pump(3);
T('l1-start', active(els['game-screen']) && textOf(els['level-display']) === 'Level 1' &&
  textOf(els['hint-count']) === '5' && textOf(els['undo-count']) === '5' && textOf(els['shuffle-count']) === '3' &&
  els['undo-btn'].disabled === true && g.call('__NM.phase') === 'play',
  textOf(els['level-display']) + ' h=' + textOf(els['hint-count']) + ' u=' + textOf(els['undo-count']) + ' s=' + textOf(els['shuffle-count']));
T('l1-grid-matches-sim', liveGrid() === JSON.stringify(S1.g), liveGrid().slice(0, 80));

/* play L1 with the reverse-insertion replay — sync check after EVERY move */
let sim = S1.g.map(r => r.slice());
let syncOK = true, syncInfo = '';
for (let i = S1.steps.length - 1; i >= 0; i--) {
  const s = S1.steps[i];
  const r1 = s.row, c1 = s.type === 'v' ? S1.cols - 1 : s.pos, r2 = s.type === 'v' ? s.row + 1 : s.row, c2 = s.type === 'v' ? S1.cols - 1 : s.pos + 1;
  if (liveGrid() !== JSON.stringify(sim)) { syncOK = false; syncInfo = 'pre-move desync step ' + i; break; }
  tapRC(r1, c1); g.pump(2); tapRC(r2, c2); g.pump(4);
  sim[r1][c1] = 0; sim[r2][c2] = 0; compactG(sim, S1.cols);
  if (liveGrid() !== JSON.stringify(sim)) { syncOK = false; syncInfo = 'post-move desync step ' + i + ' live=' + liveGrid() + ' sim=' + JSON.stringify(sim); break; }
}
T('l1-replay-sync', syncOK, syncInfo);
g.pump(25); // 300ms win timeout
T('l1-won', g.call('__NM.phase') === 'win' && active(els['win-overlay']) &&
  textOf(els['win-stars']) === '* * *', // perfect clear: moves == pairs == 18
  'phase=' + g.call('__NM.phase') + ' stars=' + textOf(els['win-stars']));
T('l1-score-sane', parseInt(textOf(els['win-score']).replace(/\D+/g, ''), 10) >= 180, textOf(els['win-score']));
const savedA = JSON.parse(g.ls.getItem('nm_v3_stars') || '{}');
T('l1-stars-saved-3', savedA['1'] === 3, JSON.stringify(savedA['1']));
T('l1-best-saved', parseInt(g.ls.getItem('nm_v3_best') || '0', 10) > 0, g.ls.getItem('nm_v3_best'));

/* NEXT LEVEL -> L2; selection semantics; undo; hint; shuffle */
btn(sb, 'Next Level').click(); g.pump(3);
T('l2-start', textOf(els['level-display']) === 'Level 2' && liveGrid() === JSON.stringify(S2.g), textOf(els['level-display']));
T('l2-moves-reset', g.call('__NM.moves') === 0 && g.call('__NM.score') === 0);
/* tap-again deselects */
tapRC(0, 0); g.pump(2); tapRC(0, 0); g.pump(2);
T('sel-deselect', g.call('__NM.selected') === null && g.call('__NM.moves') === 0, String(g.call('__NM.selected')));
/* non-matching second tap moves the selection instead of consuming a move */
{
  const grid2 = JSON.parse(liveGrid());
  let A = null, B = null;
  outer: for (let r = 0; r < grid2.length; r++) for (let c = 0; c + 1 < grid2[r].length; c++) {
    if (grid2[r][c] && grid2[r][c + 1] && !isMatchPair(grid2[r][c], grid2[r][c + 1])) { A = [r, c]; B = [r, c + 1]; break outer; }
  }
  if (A) {
    tapRC(A[0], A[1]); g.pump(2); tapRC(B[0], B[1]); g.pump(2);
    const sel = g.call('JSON.stringify(__NM.selected)');
    T('sel-nonmatch-switches', sel === JSON.stringify(B) && g.call('__NM.moves') === 0, sel);
  } else T('sel-nonmatch-switches', false, 'no adjacent non-pair found (unexpected for dense board)');
  tapRC(B[0], B[1]); g.pump(2); // clear selection
}
/* one real match, then undo restores the board */
{
  const s = S2.steps[S2.steps.length - 1];
  const r1 = s.row, c1 = s.pos, r2 = s.row, c2 = s.pos + 1;
  tapRC(r1, c1); g.pump(2); tapRC(r2, c2); g.pump(4);
  T('undo-after-match', g.call('__NM.moves') === 1 && g.call('__NM.undoCount') === 5);
  btn(sb, 'Restart') ? null : null; // (undo button is the toolbar one)
  els['undo-btn'].click(); g.pump(3);
  T('undo-restores', liveGrid() === JSON.stringify(S2.g) && g.call('__NM.moves') === 0 && g.call('__NM.undoCount') === 4 &&
    els['undo-btn'].disabled === true, 'moves=' + g.call('__NM.moves'));
}
/* hint: consumes one, highlights a real pair, expires after ~90 frames */
els['hint-btn'].click(); g.pump(2);
const hc = g.call('JSON.stringify(__NM.hintCells)');
T('hint-finds-pair', textOf(els['hint-count']) === '4' && hc !== 'null' && g.call('__NM.hints') === 4, hc);
{
  const g22 = JSON.parse(liveGrid()); const h = JSON.parse(hc);
  T('hint-is-legal-move', h && canConnect(g22, h[0][0], h[0][1], h[1][0], h[1][1]), hc);
}
g.pump(95);
T('hint-expires', g.call('JSON.stringify(__NM.hintCells)') === 'null', g.call('JSON.stringify(__NM.hintCells)'));
/* shuffle preserves the value multiset */
{
  const before = {};
  JSON.parse(liveGrid()).forEach(row => row.forEach(v => { if (v) before[v] = (before[v] || 0) + 1; }));
  els['shuffle-btn'].click(); g.pump(2);
  const after = {};
  JSON.parse(liveGrid()).forEach(row => row.forEach(v => { if (v) after[v] = (after[v] || 0) + 1; }));
  T('shuffle-preserves-multiset', textOf(els['shuffle-count']) === '2' && JSON.stringify(before) === JSON.stringify(after),
    JSON.stringify(before) + ' vs ' + JSON.stringify(after));
}
/* deadlock -> engine's own bailout addLine (P3 chain): play a searched line that
 * reaches a state with NO legal match (greedy play would simply win the level) */
function findHintRep(gd) {
  const rows = gd.length, cols = gd[0].length;
  for (let r1 = 0; r1 < rows; r1++) for (let c1 = 0; c1 < cols; c1++) {
    if (!gd[r1][c1]) continue;
    for (let r2 = r1; r2 < rows; r2++) for (let c2 = 0; c2 < cols; c2++) {
      if (r1 === r2 && c1 >= c2) continue;
      if (!gd[r2][c2]) continue;
      if (!isMatchPair(gd[r1][c1], gd[r2][c2])) continue;
      if (r1 === r2) { let ok = true; for (let cc = Math.min(c1, c2) + 1; cc < Math.max(c1, c2); cc++) if (gd[r1][cc] !== 0) { ok = false; break; } if (ok) return [[r1, c1], [r2, c2]]; }
      else if (c1 === c2) { let ok = true; for (let rr = Math.min(r1, r2) + 1; rr < Math.max(r1, r2); rr++) if (gd[rr] && gd[rr][c1] !== 0) { ok = false; break; } if (ok) return [[r1, c1], [r2, c2]]; }
    }
  }
  return null;
}
function applyMove(gd, m, cols) {
  const g2 = gd.map(r => r.slice());
  g2[m[0]][m[1]] = 0; g2[m[2]][m[3]] = 0;
  for (let r = 0; r < g2.length; r++) { const nr = []; for (let c = 0; c < cols; c++) if (g2[r][c]) nr.push(g2[r][c]); while (nr.length < cols) nr.push(0); g2[r] = nr; }
  return g2;
}
function allMovesRep(gd) {
  const out = [];
  const rows = gd.length, cols = gd[0].length;
  for (let r1 = 0; r1 < rows; r1++) for (let c1 = 0; c1 < cols; c1++) {
    if (!gd[r1][c1]) continue;
    for (let r2 = r1; r2 < rows; r2++) for (let c2 = 0; c2 < cols; c2++) {
      if (r1 === r2 && c1 >= c2) continue;
      if (!gd[r2][c2]) continue;
      if (!isMatchPair(gd[r1][c1], gd[r2][c2])) continue;
      if (r1 === r2) { let ok = true; for (let cc = Math.min(c1, c2) + 1; cc < Math.max(c1, c2); cc++) if (gd[r1][cc] !== 0) { ok = false; break; } if (ok) out.push([r1, c1, r2, c2]); }
      else if (c1 === c2) { let ok = true; for (let rr = Math.min(r1, r2) + 1; rr < Math.max(r1, r2); rr++) if (gd[rr] && gd[rr][c1] !== 0) { ok = false; break; } if (ok) out.push([r1, c1, r2, c2]); }
    }
  }
  return out;
}
function findDeadPath(start, cols, maxDepth) {
  let found = null;
  const seen = new Set();
  const dfs = (gd, path) => {
    if (found) return;
    if (!gd.some(r => r.some(v => v))) return; // cleared — not a dead state
    if (!findHintRep(gd)) { found = path.slice(); return; }
    if (path.length >= maxDepth) return;
    const k = gd.map(r => r.join('')).join('/');
    if (seen.has(k)) return;
    seen.add(k);
    for (const m of allMovesRep(gd)) { dfs(applyMove(gd, m, cols), path.concat([m])); if (found) return; }
  };
  dfs(start, []);
  return found;
}
{
  /* the shuffle test rearranged the board — restart so the searched dead path (from
   * the deterministic initial board) lines up with the live grid */
  deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && fullText(c) === 'Restart')[0].click();
  g.pump(3);
  const dead = findDeadPath(S2.g, S2.cols, 12);
  let played = false, simD = null;
  if (dead) {
    played = true;
    simD = S2.g.map(r => r.slice());
    for (const m of dead) {
      if (liveGrid() !== JSON.stringify(simD)) { played = false; break; }
      tapRC(m[0], m[1]); g.pump(2); tapRC(m[2], m[3]); g.pump(8);
      simD = applyMove(simD, m, S2.cols);
    }
  }
  const stuck = played && liveGrid() === JSON.stringify(simD) && !findHintRep(JSON.parse(liveGrid()));
  const rowsBefore = JSON.parse(liveGrid()).length;
  g.pump(40); // let the 500ms bailoutCheck fire
  const rowsAfter = JSON.parse(liveGrid()).length;
  T('deadlock-addline', dead && stuck && rowsAfter > rowsBefore && g.call('__NM.phase') === 'play',
    'path=' + (dead ? dead.length + 'mv' : 'none') + ' stuck=' + stuck + ' rows ' + rowsBefore + '->' + rowsAfter + ' phase=' + g.call('__NM.phase'));
}
/* restart, then clean replay win on L2 (3 stars) */
deep(sb.document.body, c => String(c.tagName).toUpperCase() === 'BUTTON' && fullText(c) === 'Restart')[0].click();
g.pump(3);
T('restart-resets', liveGrid() === JSON.stringify(S2.g) && g.call('__NM.moves') === 0 && g.call('__NM.phase') === 'play');
{
  let ok = true, info = '';
  const sim2 = S2.g.map(r => r.slice());
  for (let i = S2.steps.length - 1; i >= 0; i--) {
    const s = S2.steps[i];
    const r1 = s.row, c1 = s.type === 'v' ? S2.cols - 1 : s.pos, r2 = s.type === 'v' ? s.row + 1 : s.row, c2 = s.type === 'v' ? S2.cols - 1 : s.pos + 1;
    if (liveGrid() !== JSON.stringify(sim2)) { ok = false; info = 'desync@' + i; break; }
    tapRC(r1, c1); g.pump(2); tapRC(r2, c2); g.pump(4);
    sim2[r1][c1] = 0; sim2[r2][c2] = 0; compactG(sim2, S2.cols);
  }
  g.pump(25);
  T('l2-replay-win', ok && g.call('__NM.phase') === 'win' && textOf(els['win-stars']) === '* * *', info + ' phase=' + g.call('__NM.phase'));
}
const savedB2 = JSON.parse(g.ls.getItem('nm_v3_stars') || '{}');
T('l2-stars-saved-3', savedB2['1'] === 3 && savedB2['2'] === 3, JSON.stringify([savedB2['1'], savedB2['2']]));
T('runtime-errors-a', !(sb.__errors || []).length, (sb.__errors || []).slice(0, 2).join(' | '));

/* ---------- BOOT B (seeded progress) ---------- */
const g2 = bootGame(SLUG, { seedLS: { nm_v3_level: '3', nm_v3_best: '777', nm_v3_stars: JSON.stringify({ 1: 3, 2: 2 }) }, inject: { anchor: 'function updateUI(){', exports: EXPORTS } });
const els2 = g2.els, sb2 = g2.sandbox;
g2.pump(3);
T('boot-b-no-errors', g2.loadErrors.length === 0, g2.loadErrors.join(' | '));
T('boot-b-menu-level-3', textOf(els2['menu-level']) === '3', textOf(els2['menu-level']));
btn(sb2, 'Select Level').click(); g2.pump(2);
const cells = els2['level-grid'].children;
const starTxt = b => { const st = (b.children || []).find(c => String(c.className).includes('stars')); return st ? textOf(st) : textOf(b); };
T('boot-b-cells-30', cells.length === 30, cells.length);
T('boot-b-completed-stars', cells[0].classList.contains('completed') && starTxt(cells[0]) === '***' &&
  cells[1].classList.contains('completed') && starTxt(cells[1]) === '**-', '1:' + starTxt(cells[0]) + ' 2:' + starTxt(cells[1]));
T('boot-b-current-and-next', cells[2].classList.contains('current') && starTxt(cells[2]) === '---' &&
  !cells[3].classList.contains('locked') && typeof cells[3].onclick === 'function' && cells[4].classList.contains('locked') && cells[29].classList.contains('locked'),
  '3:' + String(cells[2].className) + ' 5:' + String(cells[4].className));
cells[2].click(); g2.pump(3);
T('boot-b-l3-starts', textOf(els2['level-display']) === 'Level 3' && textOf(els2['best-display']) === '777' &&
  g2.call('__NM.grid.length') === 6, textOf(els2['level-display']) + ' best=' + textOf(els2['best-display']));
const g3rep = genWithSteps(3);
T('boot-b-l3-grid-matches-sim', g2.call('JSON.stringify(__NM.grid)') === JSON.stringify(g3rep.g),
  g2.call('JSON.stringify(__NM.grid)').slice(0, 60));
T('runtime-errors-b', !(sb2.__errors || []).length, (sb2.__errors || []).slice(0, 2).join(' | '));

/* ---------- report ---------- */
const pass = results.length - fails.length;
const out = {
  pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails,
  extra: {
    levels: 30, solvability: 'all 30 solvable by construction (reverse-insertion replay validated offline)',
    realWins: ['L1 (perfect 18 moves = pairs -> 3 stars)', 'L2 (perfect -> 3 stars)'],
    engineFixes: [
      'P0 random-scatter generator guaranteed nothing about playability — ordinary (greedy) play lost 30/30 levels (deadlocks drew random junk addLine rows into the 12-row GAME OVER); reverse-play constructive generator guarantees a winning line for all 30 (greedy now wins 29/30); odd sizes play one row shorter (odd cell counts can never fully clear)',
      'P2 calcStars thresholds unreachable (min moves = cells/2 but maxMoves = cells/4, ratio always >=2) -> every win scored exactly 1 star; now 3 stars = perfect clear, 2 stars = one bailout row',
      'P3 board never re-checked after a bailout line -> soft-lock when the added row created no match; bailoutCheck chains until a match exists or the board fills for a real loss',
      'P3 analytics bridge assigned bare IIFE-internal names (startCurrent & friends) -> threw "startCurrent is not defined" on every page load; aliases now come from window.G'
    ]
  }
};
process.stdout.write('\n' + JSON.stringify(out) + '\n');
process.exit(fails.length ? 1 : 0);
