#!/usr/bin/env node
/* mahjong-dimensions verifier — all 30 levels cleared through the engine's real UI path:
 * btn-play → tutorial → level button → canvas click events (hit points derived from the
 * engine's own getVisibleBlocks()+project() iteration order, mirroring handleClick's
 * first-hit test) → btn-next chain 1→30. Shape rotation via real mousedown/mousemove/
 * mouseup drags. Win signal = the engine's own winGame() firing (wrapped at inject).
 * Also exercises hint/shuffle/undo through their real buttons (undo used to brick the
 * level — see FIX in index.html). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mahjong-dimensions', { inject: {
  anchor: 'function winGame() {',
  exports: `
globalThis.__won = 0;
const __origWinGame = winGame;
winGame = function(){ globalThis.__won = G.level; return __origWinGame.apply(this, arguments); };
drawTile3D = function(){}; // headless: draw-only routine stubbed (game logic + input untouched)
globalThis.__MD = {
  st: () => G.screen,
  lvl: () => G.level,
  rem: () => G.blocks.filter(b => b.tileId !== null && b.tileId !== undefined).length,
  tiles: () => G.tiles.length,
  blocks: () => G.blocks.length,
  hints: () => G.hints, shuffles: () => G.shuffles, undos: () => G.undos,
  hintBlocks: () => G.hintBlocks.slice(),
  hintPairOk: () => { const a = G.tiles.find(t => t.blockId === G.hintBlocks[0]); const b = G.tiles.find(t => t.blockId === G.hintBlocks[1]); return !!(a && b && tilesMatch(a, b)); },
  ids: () => G.blocks.map(b => b.tileId).join(','),
  rot: () => G.rotation, targetRot: () => G.targetRot,
  hits: () => getVisibleBlocks().map(({ block, tile }) => { const p = project(block.x, block.y, block.z, G.rotation); return { id: block.id, x: p.x, y: p.y, suit: tile.suit, value: tile.value }; }),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game-canvas'];
const clickAt = (x, y) => cv.dispatch('click', { clientX: x, clientY: y, preventDefault() {} });
const T0 = Date.now();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

// --- UI path: title → tutorial (first visit) → level select
g.els['btn-play'].click();
T('tutorial-first-visit', g.els['tut-overlay'].classList.contains('active'), 'overlay not active');
g.els['btn-tut-ok'].click();
T('level-select-screen', C('__MD.st()') === 'levels', 'st=' + C('__MD.st()'));
// Relaxed timer via the real settings control (in-game option; win path unchanged)
g.els['sel-timer'].dispatch('change', { target: { value: 'relaxed' } });

// level buttons: level-packs > section > grid > buttons (order = level 1..30)
function levelBtns() {
  const out = []; const walk = el => { for (const c of (el.children || [])) { if (String(c.className).split(/\s+/).includes('lvl-btn')) out.push(c); walk(c); } };
  walk(g.els['level-packs']); return out;
}
const btns = levelBtns();
T('level-buttons-built', btns.length === 30, 'n=' + btns.length);
T('only-level-1-unlocked', !btns[0].classList.contains('locked') && btns.slice(1).every(b => b.classList.contains('locked')),
  'l1 locked=' + btns[0].classList.contains('locked') + ' l2 locked=' + (btns[1] && btns[1].classList.contains('locked')));
btns[0].click();
T('level-1-started', C('__MD.st()') === 'game' && C('__MD.rem()') > 0, 'st=' + C('__MD.st()') + ' rem=' + C('__MD.rem()'));

// --- click-point solver helpers (mirror handleClick's first-hit semantics exactly) ---
function firstHitAt(hits, x, y) { for (const h of hits) { if (Math.abs(x - h.x) < 24 && Math.abs(y - h.y) < 30) return h.id; } return null; }
function clickPointFor(hits, target) {
  for (let dx = -22; dx <= 22; dx += 2) for (let dy = -28; dy <= 28; dy += 2) {
    const x = target.x + dx, y = target.y + dy;
    if (firstHitAt(hits, x, y) === target.id) return { x, y };
  }
  return null;
}
const matchT = (a, b) => a.id !== b.id && ((a.suit === 'seasons' && b.suit === 'seasons') || (a.suit === 'flowers' && b.suit === 'flowers') || (a.suit === b.suit && a.value === b.value));

function dragRotate(totalDx) {
  let x = 240;
  cv.dispatch('mousedown', { clientX: x, clientY: 320, preventDefault() {} });
  let rem = totalDx;
  let guard = 0;
  while (Math.abs(rem) > 1e-9 && guard++ < 200) { const step = Math.max(-90, Math.min(90, rem)); x += step; rem -= step; cv.dispatch('mousemove', { clientX: x, clientY: 320, preventDefault() {} }); }
  cv.dispatch('mouseup', { clientX: x, clientY: 320, preventDefault() {} });
}
let quarter = 0; // cumulative quarter-turns (targetRot grows monotonically)
function rotateTo(mod4) { // rotate (via real drags) so G.rotation ≡ mod4 * PI/2
  const cur = ((quarter % 4) + 4) % 4;
  const steps = (mod4 - cur + 4) % 4;
  if (!steps) return;
  quarter += steps;
  const desired = quarter * Math.PI / 2;
  dragRotate((desired - C('__MD.targetRot()')) / 0.008); // real drag input drives G.targetRot
  for (let i = 0; i < 130 && Math.abs(C('__MD.rot()') - desired) > 0.002; i++) g.pump(1);
}

// The engine keeps G.selected across rotation drags, so a pair living on two different
// faces is matched by selecting one, rotating, then clicking the partner — exactly what a
// human does. Solver: prefer co-visible pairs; fall back to select→rotate→click.
// Every attempted match is VERIFIED against engine truth (rem must drop by exactly 2) and
// the removed-set is recomputed from the engine after each attempt, so a swallowed or
// mis-hit click can never desync the model. Failed pairs are tabued for this board.
let survey = null;
function ensureSurvey() {
  if (survey) return survey;
  const byQ = [];
  for (let q = 0; q < 4; q++) { rotateTo(q); byQ.push(C('__MD.hits()')); }
  survey = byQ; return byQ;
}
const tabu = new Set();
function deselectIfAny() { // clicking the selected block deselects it (engine rule)
  const selB = g.call('G.selected ? G.selected.blockId : null');
  if (selB === null) return;
  const here = C('__MD.hits()');
  const t = here.find(h => h.id === selB);
  if (t) { const p = clickPointFor(here, t); if (p) clickAt(p.x, p.y); }
}
function tryPair(pa, pb, needRotate, qa, qb) { // returns true iff engine removed a pair
  const r0 = C('__MD.rem()');
  if (needRotate === 2) { rotateTo(qa); clickAt(pa.x, pa.y); rotateTo(qb); clickAt(pb.x, pb.y); }
  else { if (needRotate === 1) rotateTo(qa); clickAt(pa.x, pa.y); clickAt(pb.x, pb.y); }
  g.pump(30);
  if (C('__MD.rem()') === r0 - 2) return true;
  if (C('__MD.rem()') === 0) return true; // board emptied (engine removes the last pair)
  deselectIfAny(); g.pump(2);
  return false;
}
function oneMatch() {
  const removed = new Set(g.call('G.blocks.filter(b => b.tileId === null || b.tileId === undefined).map(b => b.id)'));
  const live = (l) => l.filter(h => !removed.has(h.id));
  const here = C('__MD.hits()');
  for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) {
    if (!matchT(here[i], here[j]) || tabu.has(here[i].id + '+' + here[j].id)) continue;
    const pa = clickPointFor(here, here[i]), pb = clickPointFor(here, here[j]);
    if (!pa || !pb) continue;
    if (tryPair(pa, pb, 0)) return true;
    tabu.add(here[i].id + '+' + here[j].id);
  }
  const byQ = ensureSurvey().map(live);
  // co-visible pair at another orientation → rotate there, click both
  for (let q = 0; q < 4; q++) for (let i = 0; i < byQ[q].length; i++) for (let j = i + 1; j < byQ[q].length; j++) {
    if (!matchT(byQ[q][i], byQ[q][j]) || tabu.has(byQ[q][i].id + '+' + byQ[q][j].id)) continue;
    const pa = clickPointFor(byQ[q], byQ[q][i]), pb = clickPointFor(byQ[q], byQ[q][j]);
    if (!pa || !pb) continue;
    if (tryPair(pa, pb, 1, q)) return true;
    tabu.add(byQ[q][i].id + '+' + byQ[q][j].id);
  }
  // split pair: A on one face, B on another → select A, rotate, click B
  for (let qa = 0; qa < 4; qa++) for (const A of byQ[qa]) {
    for (let qb = 0; qb < 4; qb++) { if (qb === qa) continue; for (const B of byQ[qb]) {
      if (!matchT(A, B) || tabu.has(A.id + '+' + B.id)) continue;
      const pa = clickPointFor(byQ[qa], A), pb = clickPointFor(byQ[qb], B);
      if (!pa || !pb) continue;
      if (tryPair(pa, pb, 2, qa, qb)) return true;
      tabu.add(A.id + '+' + B.id);
    } }
  }
  return false;
}

function solveLevel(deadline) {
  let matches = 0, softRetries = 0;
  while (C('__won') !== C('__MD.lvl()')) {
    if (Date.now() > deadline) return { r: 'deadline', matches };
    if (oneMatch()) { matches++; continue; }
    if (C('__MD.rem()') === 0) { g.pump(30); continue; } // board empty — win-check timeout still pending
    if (softRetries++ === 0) { tabu.clear(); survey = null; continue; } // occluders changed since tabued
    return { r: 'stuck', matches };
  }
  return { r: 'won', matches };
}

// --- level 1 mechanics probes (hint / shuffle / undo through real buttons) ---
g.els['btn-hint'].click();
T('hint-finds-pair', C('__MD.hintBlocks().length') === 2 && C('__MD.hintPairOk()') && C('__MD.hints()') === 2,
  'blocks=' + JSON.stringify(C('__MD.hintBlocks()')) + ' hints=' + C('__MD.hints()'));
const idsBefore = C('__MD.ids()');
const tilesBefore = C('__MD.tiles()');
g.els['btn-shuffle'].click();
T('shuffle-reassigns', C('__MD.shuffles()') === 1 && C('__MD.tiles()') === tilesBefore && C('__MD.ids()') !== idsBefore,
  'shuffles=' + C('__MD.shuffles()') + ' tiles=' + C('__MD.tiles()'));
g.pump(150); // let the hint timeout + any pending anims settle
if (!oneMatch()) { rotateTo(0); oneMatch(); } // guaranteed pair post-shuffle (same tile multiset)
const tilesAfterMatch = C('__MD.tiles()');
g.els['btn-undo'].click();
T('undo-restores-pair', C('__MD.tiles()') === tilesAfterMatch + 2 && C('__MD.undos()') === 2 && C('__MD.rem()') > 0,
  'tiles=' + C('__MD.tiles()') + '/' + (tilesAfterMatch + 2) + ' undos=' + C('__MD.undos()'));
survey = null; tabu.clear(); // undo resurrects blocks + shuffle moved tiles — drop the cached survey
// undo'd tiles must be re-matchable (they were dead pre-fix) — the solve below proves it.

// --- solve all 30 levels through the btn-next chain ---
const results = [];
for (let lvl = 1; lvl <= 30; lvl++) {
  const deadline = Math.min(Date.now() + 8000, T0 + 100000);
  survey = null; tabu.clear();
  let out = solveLevel(deadline), tries = 0;
  while (out.r !== 'won' && tries < 2 && Date.now() < deadline) { // engine's own restart path
    g.els['btn-pause'].click(); g.els['btn-restart'].click(); quarter = 0;
    survey = null; tabu.clear();
    out = solveLevel(deadline); tries++;
  }
  results.push(out.r);
  T('level-' + lvl + '-won', out.r === 'won' && C('__MD.rem()') === 0, out.r + ' rem=' + C('__MD.rem()'));
  if (out.r !== 'won') { // continue the chain for remaining levels via save-unlock fallback
    const save = { version: 1, levels: {}, sound: true, music: true, timerMode: 'relaxed', tutorialDone: true };
    for (let k = 1; k <= 30; k++) save.levels['lvl_' + k] = { unlocked: true, score: 1, stars: 1 };
    g.ls.setItem('mjd_v1', JSON.stringify(save));
    g.els['btn-quit'].click();
    if (lvl < 30) levelBtns()[lvl].click();
    continue;
  }
  g.els['btn-next'].click(); // real UI: win modal → next level
}
T('all-30-levels', results.every(r => r === 'won'), results.map((r, i) => r === 'won' ? '' : (i + 1) + ':' + r).filter(Boolean).join(','));

// --- progress saved (engine writes unlock + best score per win) ---
const save = JSON.parse(g.ls.getItem('mjd_v1') || '{}');
const wonCount = Object.keys(save.levels || {}).filter(k => /^lvl_\d+$/.test(k) && (save.levels[k].score > 0 || save.levels[k].unlocked)).length;
T('progress-saved', wonCount >= 29, 'saved levels=' + wonCount);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/30', durS: Math.round((Date.now() - T0) / 1000) } };
console.log('mahjong-dimensions: ' + results.filter(r => r === 'won').length + '/30 levels cleared via real canvas clicks + drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
