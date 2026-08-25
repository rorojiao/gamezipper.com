#!/usr/bin/env node
'use strict';
/* woodoku verify_engine.js — data oracle + engine-faithful beam solver + driven boots.
 * Driving uses ONLY real input paths: pointerdown on .piece-slot, pointermove/up on
 * #gameCanvas with clientX/Y computed from the harness rect through the engine's own
 * resizeCanvas math. State reads (HUD textContent, localStorage, classList) are asserts.
 * Offline solver: replicates placeShape/predictClears/applyClears/endRoundIfNeeded
 * exactly (post-fix semantics) and proves every level winnable; its plan is replayed
 * on the live engine step-by-step with per-step score/streak/round assertions.
 */
const path = require('path');
const fs = require('fs');
const REPO = '/home/junze/data/game_dev_working/gamezipper.com';
const { bootGame } = require(path.join(REPO, '_optimization/scripts/harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
const extra = {};
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail ? ' :: ' + detail : '')); }
}

// ── extraction ────────────────────────────────────────────────────────────────
const html = fs.readFileSync(path.join(REPO, 'woodoku/index.html'), 'utf8');
const SHAPES = JSON.parse(/var SHAPE_LIBRARY = (\{.*?\});/.exec(html)[1]);
const LEVEL_DATA = JSON.parse(/var LEVEL_DATA = (\[.*?\]);/.exec(html)[1]);
const LV = LEVEL_DATA;

// ── D-series: structural data oracle ─────────────────────────────────────────
const TIER_LABEL = { 1: 'Beginner', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Expert' };
ck('D1 levels=30', LV.length === 30, String(LV.length));
let dOk = true, dDetail = '';
LV.forEach((L, i) => {
  if (L.level !== i + 1) { dOk = false; dDetail += 'seq@' + i + ' '; }
  const tier = Math.floor(i / 6) + 1;
  if (L.tier !== tier) { dOk = false; dDetail += 'tier@' + L.level + ' '; }
  if (L.tierLabel !== TIER_LABEL[tier]) { dOk = false; dDetail += 'label@' + L.level + ' '; }
  if (L.boardSize !== 9) { dOk = false; dDetail += 'boardSize@' + L.level + ' '; }
  if (!Number.isInteger(L.targetScore) || L.targetScore < 100) { dOk = false; dDetail += 'target@' + L.level + ' '; }
  const rw = L.clearReward || {};
  if (!(rw.row > 0 && rw.col > 0 && rw.box > 0 && rw.box >= rw.row)) { dOk = false; dDetail += 'reward@' + L.level + ' '; }
  if (!Array.isArray(L.rounds) || L.rounds.length < 3) { dOk = false; dDetail += 'rounds@' + L.level + ' '; }
  L.rounds.forEach((rd, ri) => {
    if (!Array.isArray(rd) || rd.length !== 3) { dOk = false; dDetail += 'r' + L.level + '.' + ri + 'len '; }
    rd.forEach(k => { if (!SHAPES[k]) { dOk = false; dDetail += 'key@' + L.level + ':' + k + ' '; } });
  });
  const seen = new Set();
  (L.preSeeded || []).forEach(s => {
    if (!Number.isInteger(s.r) || s.r < 0 || s.r > 8 || !Number.isInteger(s.c) || s.c < 0 || s.c > 8) { dOk = false; dDetail += 'seed-bounds@' + L.level + ' '; }
    const k = s.r + ',' + s.c;
    if (seen.has(k)) { dOk = false; dDetail += 'seed-dup@' + L.level + ' '; }
    seen.add(k);
    if (!Number.isInteger(s.color) || s.color < 1 || s.color > 8) { dOk = false; dDetail += 'seed-color@' + L.level + ' '; }
  });
});
ck('D2 structure', dOk, dDetail.trim());
ck('D3 shape library size', Object.keys(SHAPES).length === 25, String(Object.keys(SHAPES).length));
let shOk = true;
for (const k of Object.keys(SHAPES)) {
  const cells = SHAPES[k];
  const seen = new Set();
  for (const [r, c] of cells) {
    if (r < 0 || r > 4 || c < 0 || c > 4) shOk = false;
    const kk = r + ',' + c; if (seen.has(kk)) shOk = false; seen.add(kk);
  }
}
ck('D4 shapes well-formed (no dup cells, 5x5 bounds)', shOk);

const levelsJson = JSON.parse(fs.readFileSync(path.join(REPO, 'woodoku/levels.json'), 'utf8'));
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (typeof a !== 'object') return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!deepEq(a[k], b[k])) return false;
  return true;
}
ck('D5 levels.json parity: shapeLibrary', deepEq(levelsJson.shapeLibrary, SHAPES));
ck('D6 levels.json parity: levels', deepEq(levelsJson.levels, LV));
ck('D7 levels.json has 30 levels', (levelsJson.levels || []).length === 30);

// ── engine-faithful simulator ────────────────────────────────────────────────
function norm(cells) {
  let mr = Infinity, mc = Infinity;
  for (const c of cells) { if (c[0] < mr) mr = c[0]; if (c[1] < mc) mc = c[1]; }
  return cells.map(c => [c[0] - mr, c[1] - mc]);
}
const NORM = {}; for (const k of Object.keys(SHAPES)) NORM[k] = norm(SHAPES[k]);
function canPlace(b, cells, r0, c0) {
  for (let i = 0; i < cells.length; i++) {
    const r = r0 + cells[i][0], c = c0 + cells[i][1];
    if (r < 0 || r > 8 || c < 0 || c > 8 || b[r * 9 + c] !== 0) return false;
  }
  return true;
}
function mkBoard(seeds) {
  const b = new Uint8Array(81);
  for (const s of seeds) b[s.r * 9 + s.c] = s.color || 1;
  return b;
}
function simStep(bIn, cells, r0, c0, score, streak, rw) {
  const b = bIn.slice();
  for (let i = 0; i < cells.length; i++) b[(r0 + cells[i][0]) * 9 + (c0 + cells[i][1])] = 9;
  let nscore = score + cells.length;
  const rows = [], cols = [], boxes = [];
  for (let r = 0; r < 9; r++) { let f = true; for (let c = 0; c < 9; c++) if (b[r * 9 + c] === 0) { f = false; break; } if (f) rows.push(r); }
  for (let c = 0; c < 9; c++) { let f = true; for (let r = 0; r < 9; r++) if (b[r * 9 + c] === 0) { f = false; break; } if (f) cols.push(c); }
  for (let br = 0; br < 9; br += 3) for (let bc = 0; bc < 9; bc += 3) {
    let f = true;
    for (let r = br; r < br + 3 && f; r++) for (let c = bc; c < bc + 3 && f; c++) if (b[r * 9 + c] === 0) f = false;
    if (f) boxes.push([br, bc]);
  }
  const totalLines = rows.length + cols.length, totalBoxes = boxes.length;
  let nstreak = streak, combo = 0, gained = 0, cleared = 0;
  if (totalLines === 0 && totalBoxes === 0) { nstreak = 0; }
  else {
    combo = 1;
    if (totalLines + totalBoxes >= 2) combo = 2;
    if (totalLines + totalBoxes >= 3) combo = 3;
    if (totalLines + totalBoxes >= 4) combo = 5;
    gained = (totalLines * rw.row + totalBoxes * rw.box) * combo;
    nscore += gained;
    nstreak = streak + 1;
    const seen = new Set();
    const add = (r, c) => { const k = r * 9 + c; if (!seen.has(k)) { seen.add(k); b[k] = 0; } };
    for (const r of rows) for (let c = 0; c < 9; c++) add(r, c);
    for (const c of cols) for (let r = 0; r < 9; r++) add(r, c);
    for (const [br, bc] of boxes) for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) add(r, c);
    cleared = seen.size;
  }
  return { b, score: nscore, streak: nstreak, combo, gained, cleared, lines: totalLines, boxesC: totalBoxes };
}
function fitsOne(cells, b) {
  let mr = 0, mc = 0;
  for (const c of cells) { if (c[0] > mr) mr = c[0]; if (c[1] > mc) mc = c[1]; }
  for (let r = 0; r + mr < 9; r++) for (let c = 0; c + mc < 9; c++) if (canPlace(b, cells, r, c)) return true;
  return false;
}
function anyFits(roundShapes, used, b) {
  for (let s = 0; s < 3; s++) { if (used >> s & 1) continue; if (fitsOne(roundShapes[s], b)) return true; }
  return false;
}
function potential(b) {
  let p = 0;
  for (let r = 0; r < 9; r++) { let n = 0; for (let c = 0; c < 9; c++) if (b[r * 9 + c]) n++; if (n === 8) p += 1; }
  for (let c = 0; c < 9; c++) { let n = 0; for (let r = 0; r < 9; r++) if (b[r * 9 + c]) n++; if (n === 8) p += 1; }
  for (let br = 0; br < 9; br += 3) for (let bc = 0; bc < 9; bc += 3) {
    let n = 0;
    for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (b[r * 9 + c]) n++;
    if (n === 8) p += 1.5;
  }
  return p;
}
function filled(b) { let n = 0; for (let i = 0; i < 81; i++) if (b[i]) n++; return n; }

// beam solver — post-fix engine semantics. mode 'max' ranks score+potential,
// mode 'clog' ranks occupancy to force a dead deal (round-end no-fit).
function solveLevel(L, opts) {
  const W = opts.width || 32;
  const mode = opts.mode || 'max';
  const stopAt = opts.stopAt || Infinity;
  const rounds = L.rounds.map(rd => rd.map(k => NORM[k]));
  const len = rounds.length;
  let beam = [{ b: mkBoard(L.preSeeded), score: 0, streak: 0, round: 1, used: 0, parent: null, step: null }];
  let best = null;
  const consider = (score, state, reason) => {
    if (mode === 'clog') { if (reason === 'nofit-deal') best = state; return; }
    if (!best || score > best.score) best = state;
  };
  for (let iter = 0; iter < 3 * len + 4 && beam.length; iter++) {
    const cand = [];
    for (const st of beam) {
      const rs = rounds[st.round - 1];
      for (let slot = 0; slot < 3; slot++) {
        if (st.used >> slot & 1) continue;
        const cells = rs[slot];
        let mr = 0, mc = 0;
        for (const c of cells) { if (c[0] > mr) mr = c[0]; if (c[1] > mc) mc = c[1]; }
        for (let r = 0; r + mr < 9; r++) for (let c = 0; c + mc < 9; c++) {
          if (!canPlace(st.b, cells, r, c)) continue;
          const sim = simStep(st.b, cells, r, c, st.score, st.streak, L.clearReward);
          const nused = st.used | (1 << slot);
          let ns = null;
          if (nused === 7) {
            const nr = st.round + 1;
            if (nr > len) {
              ns = { b: sim.b, score: sim.score, streak: sim.streak, round: nr, used: nused, parent: st, step: { slot, r, c, score: sim.score, streak: sim.streak, round: nr, usedCount: 3, terminal: true, reason: 'rounds-out', cleared: sim.cleared, combo: sim.combo, gained: sim.gained, lines: sim.lines, boxesC: sim.boxesC } };
              consider(sim.score, ns, 'rounds-out');
            } else if (!anyFits(rounds[nr - 1], 0, sim.b)) {
              ns = { b: sim.b, score: sim.score, streak: sim.streak, round: nr, used: nused, parent: st, step: { slot, r, c, score: sim.score, streak: sim.streak, round: nr, usedCount: 3, terminal: true, reason: 'nofit-deal', cleared: sim.cleared, combo: sim.combo, gained: sim.gained, lines: sim.lines, boxesC: sim.boxesC } };
              consider(sim.score, ns, 'nofit-deal');
            } else {
              ns = { b: sim.b, score: sim.score, streak: sim.streak, round: nr, used: 0, parent: st, step: { slot, r, c, score: sim.score, streak: sim.streak, round: nr, usedCount: 3, terminal: false, cleared: sim.cleared, combo: sim.combo, gained: sim.gained, lines: sim.lines, boxesC: sim.boxesC } };
              cand.push(ns);
            }
          } else {
            if (!anyFits(rs, nused, sim.b)) {
              const pc = (nused & 1) + ((nused >> 1) & 1) + ((nused >> 2) & 1);
              const nsT = { b: sim.b, score: sim.score, streak: sim.streak, round: st.round, used: nused, parent: st, step: { slot, r, c, score: sim.score, streak: sim.streak, round: st.round, usedCount: pc, terminal: true, reason: 'nofit-mid', cleared: sim.cleared, combo: sim.combo, gained: sim.gained, lines: sim.lines, boxesC: sim.boxesC } };
              consider(sim.score, nsT, 'nofit-mid');
            } else {
              ns = { b: sim.b, score: sim.score, streak: sim.streak, round: st.round, used: nused, parent: st, step: { slot, r, c, score: sim.score, streak: sim.streak, round: st.round, usedCount: ((st.used | (1 << slot)) & 7), terminal: false, cleared: sim.cleared, combo: sim.combo, gained: sim.gained, lines: sim.lines, boxesC: sim.boxesC } };
              cand.push(ns);
            }
          }
        }
      }
    }
    if (best && (best.score >= stopAt || (mode === 'clog' && best.step && best.step.reason === 'nofit-deal'))) break;
    // dedup by (board, round, used) keeping best rank, cut to W
    const dedup = new Map();
    for (const s of cand) {
      const key = String.fromCharCode.apply(null, s.b) + '|' + s.round + '|' + s.used;
      const rank = mode === 'clog' ? filled(s.b) * 100 + s.score : s.score + 2 * potential(s.b);
      const prev = dedup.get(key);
      if (!prev || prev.rank < rank) dedup.set(key, { s, rank });
    }
    beam = [...dedup.values()].sort((a, b2) => b2.rank - a.rank).slice(0, W).map(x => x.s);
  }
  return best;
}
function buildPlan(state) {
  const steps = [];
  for (let s = state; s && s.step; s = s.parent) steps.push(s.step);
  steps.reverse();
  return steps;
}
function starsFor(score, T) {
  if (score >= T * 1.6) return 3;
  if (score >= T * 1.3) return 2;
  if (score >= T) return 1;
  return 0;
}

// ── S-series: winnability proof for all 30 levels ────────────────────────────
// Deep search (rollout-eval beam) runs offline — one-time, minutes per level — and
// lands full move plans in .verify-plans.json. Here every plan is RE-VALIDATED
// step-by-step through the engine-faithful simulator (legality + terminal + final
// score vs target), so stale plans against changed engine/data fail loudly.
function validatePlan(L, moves) {
  const rounds = L.rounds.map(rd => rd.map(k => NORM[k]));
  const len = rounds.length;
  let b = mkBoard(L.preSeeded), score = 0, streak = 0, round = 1, used = 0;
  const steps = [];
  for (let i = 0; i < moves.length; i++) {
    const [slot, r, c] = moves[i];
    if (slot < 0 || slot > 2 || (used >> slot & 1)) return { err: 'step' + i + ' slot' };
    const cells = rounds[round - 1];
    if (!cells) return { err: 'step' + i + ' no round' };
    if (!canPlace(b, cells[slot], r, c)) return { err: 'step' + i + ' cannot place' };
    const sim = simStep(b, cells[slot], r, c, score, streak, L.clearReward);
    b = sim.b; score = sim.score; streak = sim.streak;
    const nu = used | (1 << slot);
    let nRound = round, nUsed = nu, terminal = false, reason = '';
    if (nu === 7) {
      nRound = round + 1; nUsed = 0;
      if (nRound > len) { terminal = true; reason = 'rounds-out'; }
      else if (!anyFits(rounds[nRound - 1], 0, b)) { terminal = true; reason = 'nofit-deal'; }
    } else if (!anyFits(cells, nu, b)) { terminal = true; reason = 'nofit-mid'; }
    steps.push({ slot, r, c, score, streak, round: nRound, usedCount: (nu & 1) + ((nu >> 1) & 1) + ((nu >> 2) & 1), terminal, reason, cleared: sim.cleared, combo: sim.combo, gained: sim.gained, lines: sim.lines, boxesC: sim.boxesC });
    used = nUsed; round = nRound;
    if (terminal && i < moves.length - 1) return { err: 'step' + i + ' moves past terminal' };
  }
  if (!steps.length || !steps[steps.length - 1].terminal) return { err: 'no terminal' };
  return { steps, score };
}
const plansFile = path.join(REPO, 'woodoku', '.verify-plans.json');
let rawPlans = null;
try { rawPlans = JSON.parse(fs.readFileSync(plansFile, 'utf8')); } catch (e) { rawPlans = null; }
ck('S0 deep-search plans file present', !!rawPlans && Object.keys(rawPlans).length === 30, rawPlans ? Object.keys(rawPlans).length + ' levels' : 'missing');
const validatedPlans = new Array(LV.length).fill(null);
const solved = [];
if (rawPlans) {
  for (let i = 0; i < LV.length; i++) {
    const L = LV[i], T = L.targetScore;
    const rec = rawPlans[String(L.level)];
    if (!rec || !Array.isArray(rec.moves)) { solved.push({ level: L.level, T, score: 0, stars: 0, reason: 'no-plan' }); continue; }
    const v = validatePlan(L, rec.moves);
    if (v.err) { solved.push({ level: L.level, T, score: 0, stars: 0, reason: 'invalid:' + v.err }); continue; }
    validatedPlans[i] = v.steps;
    solved.push({ level: L.level, T, score: v.score, stars: starsFor(v.score, T), reason: v.steps[v.steps.length - 1].reason, depth: v.steps.length });
  }
}
extra.solver = { levels: solved.length, wins: solved.filter(s => s.score >= s.T).length, star3: solved.filter(s => s.stars === 3).length, star2: solved.filter(s => s.stars === 2).length, star1: solved.filter(s => s.stars === 1).length };
solved.forEach(s => ck('S' + s.level + ' winnable L' + s.level + ' (target ' + s.T + ', plan ' + s.score + ', ' + s.stars + '*, ' + s.depth + ' moves, ' + s.reason + ')', s.score >= s.T));

// clog path (post-fix → GAME OVER overlay; pre-fix this was a permanent soft-lock)
let clog = null;
for (let i = LV.length - 1; i >= 12 && !clog; i--) {
  const r = solveLevel(LV[i], { width: 36, mode: 'clog' });
  if (r && r.step && r.step.reason === 'nofit-deal') clog = { idx: i, plan: buildPlan(r), score: r.score };
}
if (!clog) for (let i = 11; i >= 0 && !clog; i--) {
  const r = solveLevel(LV[i], { width: 36, mode: 'clog' });
  if (r && r.step && r.step.reason === 'nofit-deal') clog = { idx: i, plan: buildPlan(r), score: r.score };
}
ck('S31 dead-deal (soft-lock pre-fix) repro path found on a real level', !!clog);
if (clog) extra.clog = { level: clog.idx + 1, depth: clog.plan.length, score: clog.score };

// ── driven helpers ────────────────────────────────────────────────────────────
function gid(ga, id) { return ga.call('document.getElementById("' + id + '")'); }
function txt(ga, id) { return String(gid(ga, id).textContent); }
function hasCls(el, c) { return !!(el && el.classList && el.classList._s && el.classList._s.has(c)); }
function slots(ga) { return ga.call('document.querySelectorAll(".piece-slot")'); }
function slotCanvasCounts(ga) { return slots(ga).map(s => (s.children || []).filter(c => String(c.tagName).toUpperCase() === 'CANVAS').length); }
function readLS(ga, k) { const v = ga.call('localStorage.getItem("' + k + '")'); return v == null ? null : v; }
function gridBtn(ga, levelNum) {
  const tier = Math.floor((levelNum - 1) / 6) + 1;
  const g = gid(ga, 'grid-' + tier);
  return ((g && g.children) || []).find(b => String(b.textContent) === String(levelNum)) || null;
}
function geo(ga) {
  const rect = ga.call('document.getElementById("gameCanvas").getBoundingClientRect()');
  const size = Math.min(rect.width, rect.height);
  const cellSize = Math.floor((size - 16) / 9);
  const ox = (rect.width - cellSize * 9) / 2, oy = (rect.height - cellSize * 9) / 2;
  const cv = gid(ga, 'gameCanvas');
  return {
    cellSize, ox, oy, cv,
    at(r, c) { return { clientX: ox + c * cellSize + cellSize / 2, clientY: oy + r * cellSize + cellSize / 2 }; }
  };
}
function dragPlace(ga, g, slotIdx, r, c) {
  const p = g.at(r, c);
  slots(ga)[slotIdx].dispatch('pointerdown', {});
  g.cv.dispatch('pointermove', { clientX: p.clientX, clientY: p.clientY });
  g.cv.dispatch('pointerup', { clientX: p.clientX, clientY: p.clientY });
}
function starsLit(ga) { return ga.call('document.querySelectorAll(".star")').filter(s => hasCls(s, 'lit')).length; }

const plan1 = validatedPlans[0];
const plan30 = validatedPlans[29];

// ── Boot A: fresh visitor, tutorial → full L1 driven replay ──────────────────
{
  const ga = bootGame('woodoku', {});
  ck('A1 boot no loadErrors', ga.loadErrors.length === 0, ga.loadErrors.join(' | '));
  ck('A2 tutorial overlay shown', hasCls(gid(ga, 'overlay'), 'show'));
  ck('A3 tutorial title', txt(ga, 'overlay-title') === '🪵 WOODOKU', txt(ga, 'overlay-title'));
  ck('A4 tutorial LS written', readLS(ga, 'woodoku_tutorial_v1') === '1');
  let threw = null;
  try { gid(ga, 'btn-home').dispatch('click', {}); } catch (e) { threw = String(e.message); }
  ck('A5 P3: btn-home during tutorial no throw (currentLevel null guard)', !threw, threw);
  ck('A6 level-select toggled open', hasCls(gid(ga, 'level-select'), 'show'));
  ck('A7 grid-1 rendered 6 buttons despite no level', (gid(ga, 'grid-1').children || []).length === 6);
  gid(ga, 'btn-home').dispatch('click', {}); // close again
  ck('A8 level-select closed', !hasCls(gid(ga, 'level-select'), 'show'));

  gid(ga, 'overlay-btn').dispatch('click', {});
  ck('A9 overlay hidden after Start', !hasCls(gid(ga, 'overlay'), 'show'));
  ck('A10 HUD score 0', txt(ga, 'score-val') === '0');
  ck('A11 HUD target 300', txt(ga, 'target-val') === '300');
  ck('A12 HUD level 1 Beginner', txt(ga, 'lvl-num') === '1' && txt(ga, 'lvl-tier') === 'Beginner', txt(ga, 'lvl-num') + '/' + txt(ga, 'lvl-tier'));
  ck('A13 HUD round 1/8', txt(ga, 'rnd-cur') === '1' && txt(ga, 'rnd-tot') === '8');
  ck('A14 pill L1', txt(ga, 'level-pill') === 'L1');
  const gA = geo(ga);
  ck('A15 geometry cellSize 51', gA.cellSize === 51, String(gA.cellSize));

  // single placement + invalid drops
  const counts0 = slotCanvasCounts(ga);
  ck('A16 tray 3 canvases', counts0.join(',') === '1,1,1', counts0.join(','));
  dragPlace(ga, gA, 0, 0, 0); ga.pump(3);
  ck('A17 place I3v@(0,0): score 3', txt(ga, 'score-val') === '3', txt(ga, 'score-val'));
  ck('A18 slot0 emptied', slotCanvasCounts(ga).join(',') === '0,1,1', slotCanvasCounts(ga).join(','));
  dragPlace(ga, gA, 1, 0, 0); ga.pump(2); // occupied cell
  ck('A19 invalid drop (occupied): score still 3, slot1 alive', txt(ga, 'score-val') === '3' && slotCanvasCounts(ga)[1] === 1);
  const outside = { clientX: 1, clientY: 1 };
  slots(ga)[1].dispatch('pointerdown', {});
  gA.cv.dispatch('pointermove', outside);
  gA.cv.dispatch('pointerup', outside);
  ga.pump(2);
  ck('A20 drop outside board: no placement', txt(ga, 'score-val') === '3' && slotCanvasCounts(ga)[1] === 1);

  // resize mid-level then restart for the clean replay
  ga.call('window.dispatchEvent({type:"resize"})'); ga.pump(2);
  gid(ga, 'btn-restart').dispatch('click', {});
  ck('A21 restart: score 0 round 1', txt(ga, 'score-val') === '0' && txt(ga, 'rnd-cur') === '1');
  ck('A22 restart: tray refilled', slotCanvasCounts(ga).join(',') === '1,1,1');

  // full solver-plan replay with per-step engine asserts
  ck('A23 L1 plan available', !!plan1 && plan1.length > 0);
  if (plan1) {
    const T = LV[0].targetScore, len = LV[0].rounds.length;
    let toastChecked = false, stepErr = null;
    plan1.forEach((st, i) => {
      if (stepErr) return;
      try {
        dragPlace(ga, gA, st.slot, st.r, st.c);
        ga.pump(3);
        if (txt(ga, 'score-val') !== String(st.score)) throw new Error('step' + i + ' score ' + txt(ga, 'score-val') + ' != ' + st.score);
        if (txt(ga, 'streak-val') !== String(st.streak)) throw new Error('step' + i + ' streak ' + txt(ga, 'streak-val') + ' != ' + st.streak);
        const disp = String(Math.min(st.round, len));
        if (txt(ga, 'rnd-cur') !== disp) throw new Error('step' + i + ' rnd ' + txt(ga, 'rnd-cur') + ' != ' + disp);
        if (st.usedCount === 3) {
          const empts = slotCanvasCounts(ga);
          // rounds-out terminal: nothing dealt, all 3 slots emptied; nofit-deal terminal
          // (or a fresh deal): 3 new canvases; non-terminal round boundary: 3 new canvases
          const expect = st.terminal && st.reason === 'rounds-out' ? '0,0,0' : '1,1,1';
          if (empts.join(',') !== expect) throw new Error('step' + i + ' tray ' + empts.join(',') + ' != ' + expect);
        }
        if (!toastChecked && st.cleared > 0) {
          toastChecked = true;
          if (!hasCls(gid(ga, 'combo-toast'), 'show')) throw new Error('combo toast not shown');
          if (!/CLEAR|COMBO/.test(txt(ga, 'combo-toast'))) throw new Error('toast text ' + txt(ga, 'combo-toast'));
          ga.pump(61);
          if (hasCls(gid(ga, 'combo-toast'), 'show')) throw new Error('toast not expired after 61 frames');
        }
      } catch (e) { stepErr = String(e.message); }
    });
    ck('A24 L1 replay: all ' + plan1.length + ' steps match engine (score/streak/round/tray/toast)', !stepErr, stepErr);
    const finScore = plan1[plan1.length - 1].score;
    const stars = starsFor(finScore, T);
    ck('A25 LEVEL COMPLETE overlay', hasCls(gid(ga, 'overlay'), 'show') && /LEVEL COMPLETE/.test(txt(ga, 'overlay-title')), txt(ga, 'overlay-title'));
    ck('A26 stars lit = ' + stars, starsLit(ga) === stars, String(starsLit(ga)));
    ck('A27 overlay btn Next Level →', txt(ga, 'overlay-btn') === 'Next Level →');
    const prog = JSON.parse(readLS(ga, 'woodoku_progress_v1') || '{}');
    ck('A28 progress saved 1:' + stars, prog['1'] === stars, JSON.stringify(prog));
    const stats = JSON.parse(readLS(ga, 'woodoku_stats_v1') || '{}');
    const expCleared = plan1.reduce((a, s) => a + s.lines, 0);
    const expBoxes = plan1.reduce((a, s) => a + s.boxesC, 0);
    ck('A29 stats played 1 bestScore ' + finScore, stats.played === 1 && stats.bestScore === finScore, JSON.stringify(stats));
    ck('A30 stats cleared/boxes match sim', stats.totalCleared === expCleared && stats.totalBoxes === expBoxes, stats.totalCleared + '/' + expCleared + ' b:' + stats.totalBoxes + '/' + expBoxes);
    ck('A31 best-val shows ' + finScore, txt(ga, 'best-val') === String(finScore));
    // stats overlay
    gid(ga, 'btn-stats').dispatch('click', {});
    ck('A32 stats overlay title', txt(ga, 'overlay-title') === '📊 STATISTICS', txt(ga, 'overlay-title'));
    const stx = txt(ga, 'overlay-text');
    ck('A33 stats text counts', /Levels Completed: 1 \/ 30/.test(stx) && new RegExp('Best Score: ' + finScore).test(stx), stx.replace(/\n/g, '|'));
    ck('A34 stats played line', /Games Played: 1/.test(stx));
    gid(ga, 'overlay-btn').dispatch('click', {});
    ck('A35 stats Close hides overlay, game intact', !hasCls(gid(ga, 'overlay'), 'show') && txt(ga, 'score-val') === String(finScore));
    // level select grid
    gid(ga, 'btn-home').dispatch('click', {});
    ck('A36 grid sizes 6 per tier', [1, 2, 3, 4, 5].every(t => (gid(ga, 'grid-' + t).children || []).length === 6));
    ck('A37 L1 completed class', hasCls(gridBtn(ga, 1), 'completed'));
    ck('A38 L2 unlocked, won level stays current (P3: stats Close no longer hijacks Next)', hasCls(gridBtn(ga, 1), 'current') && !hasCls(gridBtn(ga, 2), 'locked') && !hasCls(gridBtn(ga, 2), 'current'));
    ck('A39 L3 locked (only L1 beaten)', hasCls(gridBtn(ga, 3), 'locked'));
    gridBtn(ga, 3).dispatch('click', {});
    ck('A40 locked click no-op', txt(ga, 'level-pill') === 'L1');
    gridBtn(ga, 2).dispatch('click', {});
    ck('A41 enter L2', txt(ga, 'level-pill') === 'L2' && txt(ga, 'target-val') === '400', txt(ga, 'level-pill') + '/' + txt(ga, 'target-val'));
    gid(ga, 'btn-home').dispatch('click', {}); // close select

    // undo semantics on L2 (fresh round 1: O, I1, I2h)
    dragPlace(ga, gA, 0, 0, 0); ga.pump(2);
    ck('A42 L2 place O: score 4', txt(ga, 'score-val') === '4', txt(ga, 'score-val'));
    gid(ga, 'btn-undo').dispatch('click', {});
    ck('A43 undo restores score 0 + slot canvas', txt(ga, 'score-val') === '0' && slotCanvasCounts(ga)[0] === 1);
    dragPlace(ga, gA, 0, 0, 0); dragPlace(ga, gA, 1, 0, 2); dragPlace(ga, gA, 2, 0, 3);
    ga.pump(3);
    ck('A44 round 1 done: score 7, round 2 shown (P2 fix)', txt(ga, 'score-val') === '7' && txt(ga, 'rnd-cur') === '2', txt(ga, 'score-val') + '/' + txt(ga, 'rnd-cur'));
    ck('A45 new round tray refilled', slotCanvasCounts(ga).join(',') === '1,1,1');
    gid(ga, 'btn-undo').dispatch('click', {});
    ck('A46 undo across round boundary: score back 5 (no shape resurrect — documented quirk)', txt(ga, 'score-val') === '5', txt(ga, 'score-val'));
    ck('A47 quirk: round stays 2, tray full', txt(ga, 'rnd-cur') === '2' && slotCanvasCounts(ga).join(',') === '1,1,1');
    gid(ga, 'btn-undo').dispatch('click', {});
    ck('A48 undo2: score 4', txt(ga, 'score-val') === '4');
    gid(ga, 'btn-undo').dispatch('click', {});
    ck('A49 undo3: score 0 (board empty)', txt(ga, 'score-val') === '0');
    gid(ga, 'btn-undo').dispatch('click', {});
    ck('A50 undo empty history no-op', txt(ga, 'score-val') === '0');
    // hint: engine scan = first unused slot (round-2 shapes I2v,I3v,O → slot0 I2v) at (0,0)
    const before = txt(ga, 'score-val');
    gid(ga, 'btn-hint').dispatch('click', {});
    const hp = gA.at(0, 0);
    gA.cv.dispatch('pointerup', { clientX: hp.clientX, clientY: hp.clientY });
    ga.pump(3);
    ck('A51 hint places hinted shape via tap (score ' + before + '+2)', txt(ga, 'score-val') === String(Number(before) + 2), txt(ga, 'score-val'));
    ck('A52 hint slot0 consumed', slotCanvasCounts(ga)[0] === 0);
    ga.pump(90); // hint 1500ms timer fires mid-idle — must not corrupt anything
    dragPlace(ga, gA, 1, 2, 0); ga.pump(2); // (1,0) is occupied by the hinted I2v at (0,0)-(1,0) — anchor below it
    ck('A53 drag after hint timeout works', txt(ga, 'score-val') === String(Number(before) + 5), txt(ga, 'score-val'));
    // music toggle (harness does not decode entities in static markup, so compare explicit
    // states: initial ♪ → muted ♪🔊 → back to ♪, plus the engine flag itself)
    gid(ga, 'btn-music').dispatch('click', {});
    const m1 = String(gid(ga, 'btn-music').innerHTML);
    gid(ga, 'btn-music').dispatch('click', {});
    ck('A54 music toggle cycles innerHTML', m1 === '&#9834;&#128263;' && String(gid(ga, 'btn-music').innerHTML) === '&#9834;', m1 + '→' + String(gid(ga, 'btn-music').innerHTML));
    gid(ga, 'btn-restart').dispatch('click', {});
    ck('A55 restart L2 clean', txt(ga, 'score-val') === '0' && txt(ga, 'rnd-cur') === '1' && slotCanvasCounts(ga).join(',') === '1,1,1');
  }
}

// ── Boot B: returning player (seeded progress + stats) ───────────────────────
{
  const ga = bootGame('woodoku', { seedLS: {
    woodoku_tutorial_v1: '1',
    woodoku_progress_v1: JSON.stringify({ 1: 3, 2: 1 }),
    woodoku_stats_v1: JSON.stringify({ played: 7, bestScore: 1234, totalCleared: 40, totalBoxes: 9 }),
  } });
  ck('B1 boot no loadErrors', ga.loadErrors.length === 0, ga.loadErrors.join(' | '));
  ck('B2 skips tutorial (no overlay)', !hasCls(gid(ga, 'overlay'), 'show'));
  ck('B3 best 1234 from stats', txt(ga, 'best-val') === '1234', txt(ga, 'best-val'));
  gid(ga, 'btn-home').dispatch('click', {});
  ck('B4 L1 completed+current', hasCls(gridBtn(ga, 1), 'completed') && hasCls(gridBtn(ga, 1), 'current'));
  ck('B5 L2 completed', hasCls(gridBtn(ga, 2), 'completed'));
  ck('B6 L3 unlocked not completed', !hasCls(gridBtn(ga, 3), 'locked') && !hasCls(gridBtn(ga, 3), 'completed'));
  ck('B7 L4 locked', hasCls(gridBtn(ga, 4), 'locked'));
  gridBtn(ga, 3).dispatch('click', {});
  ck('B8 enter L3', txt(ga, 'level-pill') === 'L3' && txt(ga, 'target-val') === '500' && txt(ga, 'rnd-tot') === '9');
  const gB = geo(ga);
  dragPlace(ga, gB, 0, 0, 0); ga.pump(2);
  ck('B9 L3 place I3v: score 3 (seeded board has nothing at 0,0)', txt(ga, 'score-val') === '3', txt(ga, 'score-val'));
  gid(ga, 'btn-restart').dispatch('click', {});
  ck('B10 restart clean', txt(ga, 'score-val') === '0' && txt(ga, 'rnd-cur') === '1');
}

// ── Boot C: corrupt saves ─────────────────────────────────────────────────────
{
  const ga = bootGame('woodoku', { seedLS: {
    woodoku_tutorial_v1: '1', woodoku_progress_v1: '{not json', woodoku_stats_v1: 'zzz',
  } });
  ck('C1 corrupt boot no loadErrors', ga.loadErrors.length === 0, ga.loadErrors.join(' | '));
  ck('C2 defaults: best 0', txt(ga, 'best-val') === '0');
  ck('C3 defaults: L1 target 300 round 1/8', txt(ga, 'target-val') === '300' && txt(ga, 'rnd-cur') === '1');
  gid(ga, 'btn-home').dispatch('click', {});
  ck('C4 only L1 unlocked', !hasCls(gridBtn(ga, 1), 'locked') && hasCls(gridBtn(ga, 2), 'locked') && hasCls(gridBtn(ga, 30), 'locked'));
}

// ── Boot C2: future / out-of-range progress ──────────────────────────────────
{
  const ga = bootGame('woodoku', { seedLS: {
    woodoku_tutorial_v1: '1', woodoku_progress_v1: JSON.stringify({ 30: 3, 31: 3 }),
  } });
  ck('C2x1 boot ok', ga.loadErrors.length === 0, ga.loadErrors.join(' | '));
  gid(ga, 'btn-home').dispatch('click', {});
  ck('C2x2 L30 unlocked, L29 locked, L31 absent', !hasCls(gridBtn(ga, 30), 'locked') && hasCls(gridBtn(ga, 29), 'locked') && !gridBtn(ga, 31));
  gridBtn(ga, 30).dispatch('click', {});
  ck('C2x3 enter L30', txt(ga, 'level-pill') === 'L30' && txt(ga, 'target-val') === '15000' && txt(ga, 'rnd-tot') === '30');
  const gC = geo(ga);
  dragPlace(ga, gC, 0, 5, 6); ga.pump(2); // L30 preSeeds (0,0)+(1,0) — anchor the vertical L4 in a clean column
  ck('C2x4 L30 place L4 shape (4 cells): score 4', txt(ga, 'score-val') === '4', txt(ga, 'score-val'));
  gid(ga, 'btn-restart').dispatch('click', {});
  ck('C2x5 restart', txt(ga, 'score-val') === '0');
}

// ── Boot D: full unlock → dead-deal GAME OVER (P1 fix) → L30 3★ chain ────────
{
  const prog = {}; for (let i = 1; i <= 29; i++) prog[i] = 3;
  const ga = bootGame('woodoku', { seedLS: {
    woodoku_tutorial_v1: '1',
    woodoku_progress_v1: JSON.stringify(prog),
    woodoku_stats_v1: JSON.stringify({ played: 29, bestScore: 5000, totalCleared: 100, totalBoxes: 20 }),
  } });
  ck('D1 boot no loadErrors', ga.loadErrors.length === 0, ga.loadErrors.join(' | '));
  ck('D2 best 5000', txt(ga, 'best-val') === '5000');
  if (clog) {
    gid(ga, 'btn-home').dispatch('click', {});
    gridBtn(ga, clog.idx + 1).dispatch('click', {});
    ck('D3 entered clog level L' + (clog.idx + 1), txt(ga, 'level-pill') === 'L' + (clog.idx + 1));
    const gD = geo(ga);
    let stepErr = null;
    clog.plan.forEach((st, i) => {
      if (stepErr) return;
      try {
        dragPlace(ga, gD, st.slot, st.r, st.c);
        ga.pump(3);
        if (txt(ga, 'score-val') !== String(st.score)) throw new Error('clog step' + i + ' score ' + txt(ga, 'score-val') + ' != ' + st.score);
      } catch (e) { stepErr = String(e.message); }
    });
    ck('D4 clog replay ' + clog.plan.length + ' steps faithful', !stepErr, stepErr);
    ck('D5 P1 fix: dead deal ends game (GAME OVER overlay, no soft-lock)', hasCls(gid(ga, 'overlay'), 'show') && /GAME OVER/.test(txt(ga, 'overlay-title')), txt(ga, 'overlay-title'));
    ck('D6 no-shapes-fit text', /No shapes fit on the board!/.test(txt(ga, 'overlay-text')), txt(ga, 'overlay-text').replace(/\n/g, '|'));
    ck('D7 Try Again label', txt(ga, 'overlay-btn') === 'Try Again');
    let stats1 = JSON.parse(readLS(ga, 'woodoku_stats_v1') || '{}');
    ck('D8 lose counted stats played 30', stats1.played === 30, String(stats1.played));
    const progAfterLose = JSON.parse(readLS(ga, 'woodoku_progress_v1') || '{}');
    ck('D9 lose does not touch stars', JSON.stringify(progAfterLose) === JSON.stringify(prog), JSON.stringify(progAfterLose));
    gid(ga, 'overlay-btn').dispatch('click', {});
    ck('D10 Try Again reloads level', txt(ga, 'score-val') === '0' && txt(ga, 'rnd-cur') === '1' && !hasCls(gid(ga, 'overlay'), 'show'));
  }
  ck('D11 L30 plan available', !!plan30 && plan30.length > 0);
  if (plan30) {
    gid(ga, 'btn-home').dispatch('click', {});
    gridBtn(ga, 30).dispatch('click', {});
    ck('D12 enter L30', txt(ga, 'level-pill') === 'L30' && txt(ga, 'lvl-tier') === 'Expert');
    const gD = geo(ga);
    const T = LV[29].targetScore, len = LV[29].rounds.length;
    let stepErr = null, checked = 0;
    plan30.forEach((st, i) => {
      if (stepErr) return;
      try {
        dragPlace(ga, gD, st.slot, st.r, st.c);
        ga.pump(2);
        if (i % 3 === 0 || st.terminal) {
          checked++;
          if (txt(ga, 'score-val') !== String(st.score)) throw new Error('L30 step' + i + ' score ' + txt(ga, 'score-val') + ' != ' + st.score);
          if (txt(ga, 'rnd-cur') !== String(Math.min(st.round, len))) throw new Error('L30 step' + i + ' rnd');
        }
      } catch (e) { stepErr = String(e.message); }
    });
    ck('D13 L30 replay faithful (' + checked + ' checkpoints)', !stepErr, stepErr);
    const finScore = plan30[plan30.length - 1].score;
    const stars = starsFor(finScore, T);
    ck('D14 L30 LEVEL COMPLETE (score ' + finScore + ' ≥ ' + T + ')', hasCls(gid(ga, 'overlay'), 'show') && /LEVEL COMPLETE/.test(txt(ga, 'overlay-title')), txt(ga, 'overlay-title'));
    ck('D15 L30 stars ' + stars, starsLit(ga) === stars, String(starsLit(ga)));
    const stats2 = JSON.parse(readLS(ga, 'woodoku_stats_v1') || '{}');
    ck('D16 stats played 31, best = ' + finScore, stats2.played === 31 && stats2.bestScore === finScore, JSON.stringify(stats2));
    const progEnd = JSON.parse(readLS(ga, 'woodoku_progress_v1') || '{}');
    ck('D17 progress 30:' + stars + ' kept others', progEnd['30'] === stars && progEnd['29'] === 3);
    ck('D18 best-val updated', txt(ga, 'best-val') === String(finScore));
    gid(ga, 'overlay-btn').dispatch('click', {});
    ck('D19 next after L30 wraps to L1', txt(ga, 'level-pill') === 'L1' && txt(ga, 'target-val') === '300');
  }
}

// ── report ────────────────────────────────────────────────────────────────────
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict, fails: fails.slice(0, 12), extra }));
process.exit(verdict === 'PASS' ? 0 : 1);
