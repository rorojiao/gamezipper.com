#!/usr/bin/env node
/* tetra-fit/verify_engine.js — E2E verifier (2026-08-25)
 * Offline: LEVELS/SHAPES extraction + data oracle (30 levels, exact-cover area,
 * cells in-bounds/unique, SHAPES normalized/connected/sized, COLORS coverage,
 * levels.json parity, rotation-count sanity) + engine-faithful exact-cover solver
 * proving all 30 levels winnable, each plan re-validated cell-for-cell.
 * Driven boots (real pointer events only: piece mousedown/touchstart, document
 * mousemove/touchmove, mouseup/touchend at cell coords; piece clicks rotate):
 *  A fresh — HUD/grid/tray render, L1 full win incl. rotation + win modal + LS,
 *    invalid drops (overlap/out-of-bounds/outside-grid), highlight-invalid path,
 *    reset, hint (fresh + mid-level), rotation cycling (O4 1-rot, I2 2-rot),
 *    touch-path placement, mouseup-without-mousemove, prev/next gating,
 *    L2+L3 win chain, pieces-left counter (P3 fix).
 *  B seeded 'tetra-fit-level':'4' -> boots at level 5 (P3 restore fix).
 *  C corrupt LS ('{not json' + 'zzz') -> level-1 fallback + win rewrites
 *    'tetra-fit-unlocked' cleanly (P2 crash fix).
 *  D seeded level 30 -> driven 8xI4 win at the last level; modal-next stays,
 *    btnNext no-op past the end, no phantom unlock.
 *  E full 30-level sweep of real driven wins with per-move placement asserts.
 * Engine fixes verified: P2 unlockLevel corrupt-LS crash, P3 #pieces-left
 * element missing, P3 saved level never restored. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let PASS = 0, FAIL = 0; const FAILS = [];
function ok(cond, name, detail) {
  if (cond) { PASS++; } else { FAIL++; FAILS.push(name + (detail !== undefined ? ' | ' + detail : '')); }
}
const J = (x) => JSON.stringify(x);

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

/* ================= OFFLINE EXTRACTION ================= */
const lvM = /const LEVELS = (\[\{.*?\}\]);/.exec(html);
ok(!!lvM, 'extract-LEVELS');
const LEVELS = JSON.parse(lvM[1]);
const shM = /const SHAPES = (\{[\s\S]*?\});/.exec(html);
ok(!!shM, 'extract-SHAPES');
const SHAPES = new Function('return ' + shM[1])();
const coM = /const COLORS = (\{[\s\S]*?\});/.exec(html);
ok(!!coM, 'extract-COLORS');
const COLORS = new Function('return ' + coM[1])();

/* engine's own geometry functions (slice: rotateShape .. before renderGrid) */
const f0 = html.indexOf('function rotateShape(');
const f1 = html.indexOf('function renderGrid(');
ok(f0 >= 0 && f1 > f0, 'extract-geometry-slice', f0 + ',' + f1);
const GEO = new Function(html.slice(f0, f1) + ';return {rotateShape:rotateShape,getBoundingBox:getBoundingBox,normalizeShape:normalizeShape,getAllRotations:getAllRotations};')();

/* ================= D-SERIES: DATA ORACLE ================= */
ok(LEVELS.length === 30, 'D1-levels-30', LEVELS.length);
const EXPECT_SHAPES = ['I1','I2','I3','L3','I4','O4','T4','L4','S4','F5','I5','L5','P5','T5','U5','V5','W5','X5','Y5','Z5'];
ok(JSON.stringify(Object.keys(SHAPES)) === JSON.stringify(EXPECT_SHAPES), 'D4-shape-keyset', J(Object.keys(SHAPES)));
const SIZE = { I1:1,I2:2,I3:3,L3:3,I4:4,O4:4,T4:4,L4:4,S4:4,F5:5,I5:5,L5:5,P5:5,T5:5,U5:5,V5:5,W5:5,X5:5,Y5:5,Z5:5 };
for (const k of EXPECT_SHAPES) {
  const sh = SHAPES[k];
  ok(sh.length === SIZE[k], 'D4-' + k + '-size', sh.length);
  const set = new Set(sh.map(([r, c]) => r + ',' + c));
  ok(set.size === sh.length, 'D4-' + k + '-unique-cells');
  const minR = Math.min(...sh.map((x) => x[0])), minC = Math.min(...sh.map((x) => x[1]));
  ok(minR === 0 && minC === 0, 'D4-' + k + '-normalized', minR + ',' + minC);
  // connectivity (BFS over 4-neighbourhood)
  const seen = new Set([sh[0][0] + ',' + sh[0][1]]); const q = [sh[0]];
  while (q.length) { const [r, c] = q.pop(); for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const kk = (r + dr) + ',' + (c + dc); if (set.has(kk) && !seen.has(kk)) { seen.add(kk); q.push([r + dr, c + dc]); } } }
  ok(seen.size === sh.length, 'D4-' + k + '-connected', seen.size + '/' + sh.length);
  const rots = GEO.getAllRotations(sh);
  ok(rots.length === 1 || rots.length === 2 || rots.length === 4, 'D7-' + k + '-rotcount', rots.length);
  const rset = new Set(rots.map((r) => J(r)));
  ok(rset.size === rots.length, 'D7-' + k + '-rot-dedup');
}
ok(GEO.getAllRotations(SHAPES.I1).length === 1, 'D7-I1-1rot');
ok(GEO.getAllRotations(SHAPES.O4).length === 1, 'D7-O4-1rot');
ok(GEO.getAllRotations(SHAPES.I2).length === 2, 'D7-I2-2rot');
ok(GEO.getAllRotations(SHAPES.I4).length === 2, 'D7-I4-2rot');
ok(GEO.getAllRotations(SHAPES.I5).length === 2, 'D7-I5-2rot');
ok(GEO.getAllRotations(SHAPES.T4).length === 4, 'D7-T4-4rot');
ok(GEO.getAllRotations(SHAPES.L4).length === 4, 'D7-L4-4rot');
for (const k of EXPECT_SHAPES) ok(COLORS[k] && /^#[0-9a-f]{6}$/i.test(COLORS[k]), 'D5-color-' + k, COLORS[k]);

const TIER_NAMES = {};
for (let i = 0; i < 30; i++) {
  const L = LEVELS[i], n = i + 1;
  ok(L.id === n, 'D1-id-' + n, L.id);
  const tier = Math.floor(i / 5) + 1;
  ok(L.tier === tier, 'D2-tier-' + n, L.tier);
  ok(typeof L.name === 'string' && L.name.length > 0, 'D2-name-' + n, L.name);
  ok(L.rows >= 2 && L.rows <= 5 && L.cols >= 3 && L.cols <= 9, 'D2-bounds-' + n, L.rows + 'x' + L.cols);
  const set = new Set(); let inb = true;
  for (const [r, c] of L.cells) { if (r < 0 || r >= L.rows || c < 0 || c >= L.cols) inb = false; set.add(r + ',' + c); }
  ok(inb, 'D3-cells-inbounds-' + n);
  ok(set.size === L.cells.length, 'D3-cells-unique-' + n);
  ok(L.pieces.length >= 2 && L.pieces.every((k) => SHAPES[k]), 'D3-pieces-valid-' + n, J(L.pieces));
  const area = L.pieces.reduce((s, k) => s + SIZE[k], 0);
  ok(area === L.cells.length, 'D3-exact-cover-area-' + n, area + ' vs ' + L.cells.length);
}
try {
  const lj = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
  const ljLevels = lj.levels || lj;
  ok(Array.isArray(ljLevels) && ljLevels.length === 30, 'D6-json-30', ljLevels && ljLevels.length);
  let parity = true;
  for (let i = 0; i < 30; i++) {
    const a = ljLevels[i], b = LEVELS[i];
    if (!a || a.id !== b.id || a.tier !== b.tier || a.name !== b.name || a.rows !== b.rows || a.cols !== b.cols || J(a.cells) !== J(b.cells) || J(a.pieces) !== J(b.pieces)) parity = false;
  }
  ok(parity, 'D6-json-parity');
} catch (e) { ok(false, 'D6-json-parity', e.message); }

/* ================= S-SERIES: SOLVER (all 30 winnable) ================= */
function rotsOf(key) { return GEO.getAllRotations(SHAPES[key]); }
function solveLevel(L) {
  const active = new Set(L.cells.map(([r, c]) => r * 100 + c));
  const occ = new Set();
  const used = new Array(L.pieces.length).fill(false);
  function dfs(depth) {
    if (depth === L.pieces.length) return [];
    let R = -1, C = -1;
    for (const [r, c] of L.cells) { if (!occ.has(r * 100 + c)) { R = r; C = c; break; } }
    if (R < 0) return null;
    const tried = new Set();
    for (let i = 0; i < L.pieces.length; i++) {
      if (used[i]) continue;
      const key = L.pieces[i];
      if (tried.has(key)) continue;
      tried.add(key);
      const rots = rotsOf(key);
      for (let ri = 0; ri < rots.length; ri++) {
        for (const [dr, dc] of rots[ri]) {
          const ar = R - dr, ac = C - dc;
          let good = true; const ks = [];
          for (const [r2, c2] of rots[ri]) {
            const k = (ar + r2) * 100 + (ac + c2);
            if (!active.has(k) || occ.has(k)) { good = false; break; }
            ks.push(k);
          }
          if (!good) continue;
          for (const k of ks) occ.add(k);
          used[i] = true;
          const sub = dfs(depth + 1);
          if (sub) return [{ i, ri, r: ar, c: ac }].concat(sub);
          for (const k of ks) occ.delete(k);
          used[i] = false;
        }
      }
    }
    return null;
  }
  return dfs(0);
}
const PLANS = [];
for (let i = 0; i < 30; i++) {
  const plan = solveLevel(LEVELS[i]);
  ok(!!plan, 'S-solvable-L' + (i + 1));
  if (!plan) { PLANS.push(null); continue; }
  // replay-validate: exact cover, no overlap, every anchor legal
  const occSet = new Set(); let valid = true;
  for (const mv of plan) {
    for (const [dr, dc] of rotsOf(LEVELS[i].pieces[mv.i])[mv.ri]) {
      const k = (mv.r + dr) * 100 + (mv.c + dc);
      if (occSet.has(k)) valid = false;
      occSet.add(k);
    }
  }
  ok(valid && occSet.size === LEVELS[i].cells.length && LEVELS[i].cells.every(([r, c]) => occSet.has(r * 100 + c)), 'S-plan-exact-L' + (i + 1), occSet.size + '/' + LEVELS[i].cells.length);
  PLANS.push(plan);
}

/* ================= DRIVEN HELPERS ================= */
function bootT(seedLS) { return bootGame('tetra-fit', seedLS ? { seedLS } : {}); }
const CELL0 = { x: 10, y: 100, sz: 30, pad: 14 }; // verifier-side layout grid: cell(r,c) rect = (10+c*30, 100+r*30, 28x28)
function cx(c) { return CELL0.x + c * CELL0.sz + CELL0.pad; }
function cy(r) { return CELL0.y + r * CELL0.sz + CELL0.pad; }
function layout(ga) {
  ga.sandbox.document.querySelectorAll('.grid .cell').forEach((c) => {
    c.style.left = (CELL0.x + (+c.dataset.col) * CELL0.sz) + 'px';
    c.style.top = (CELL0.y + (+c.dataset.row) * CELL0.sz) + 'px';
    c.style.width = '28px'; c.style.height = '28px';
  });
}
function tray(ga) { return (ga.els.pieces.children || []).filter((c) => c.classList && c.classList.contains('piece')); }
function qsaReal(ga, sel) { return ga.sandbox.document.querySelectorAll(sel).filter((c) => c.parentElement === ga.els.grid); } // harness falls back to 6 inert stubs when zero real nodes match — count only real grid children (fakes have no parent)
function pieceEl(ga, idx) { return tray(ga).find((p) => +p.dataset.index === idx); }
function drive(ga, idx, clicks, r, c) {
  layout(ga);
  for (let k = 0; k < clicks; k++) { const el = pieceEl(ga, idx); el.dispatch('click', {}); }
  const el = pieceEl(ga, idx);
  el.dispatch('mousedown', { clientX: 300, clientY: 500 });
  ga.sandbox.document.dispatch('mousemove', { clientX: cx(c) - 5, clientY: cy(r) - 5 });
  ga.sandbox.document.dispatch('mouseup', { clientX: cx(c), clientY: cy(r) });
}
function driveTouch(ga, idx, clicks, r, c) {
  layout(ga);
  for (let k = 0; k < clicks; k++) { const el = pieceEl(ga, idx); el.dispatch('click', {}); }
  const el = pieceEl(ga, idx);
  el.dispatch('touchstart', { touches: [{ clientX: 300, clientY: 500 }], preventDefault() {} });
  ga.sandbox.document.dispatch('touchmove', { touches: [{ clientX: cx(c), clientY: cy(r) }], preventDefault() {} });
  ga.sandbox.document.dispatch('touchend', { changedTouches: [{ clientX: cx(c), clientY: cy(r) }] });
}
const placedN = (ga) => ga.call('placedPieces.length');
const gid = (ga, id) => ga.els[id];
const txt = (ga, id) => String(ga.els[id].textContent); // engine assigns numbers (browsers stringify textContent; harness stores raw) — compare via String()

/* ================= BOOT A — fresh, full feature pass ================= */
{
  const ga = bootT();
  ok(ga.loadErrors.length === 0, 'a-load-errors', J(ga.loadErrors));
  ok(txt(ga, 'level-num') === '1' && txt(ga, 'tier') === '1' && txt(ga, 'level-name') === 'First Fit', 'a2-hud', txt(ga, 'level-num') + '/' + txt(ga, 'tier') + '/' + txt(ga, 'level-name'));
  layout(ga);
  const cells = ga.sandbox.document.querySelectorAll('.grid .cell');
  ok(cells.length === 8, 'a3-grid-8', cells.length);
  ok(cells.every((c) => c.classList.contains('active')) && cells.every((c) => !c.classList.contains('occupied')), 'a3-all-active');
  ok(cells.filter((c) => String(c.dataset.row) === '1' && String(c.dataset.col) === '3').length === 1, 'a3-dataset'); // dataset.row/col assigned as numbers
  const tr = tray(ga);
  ok(tr.length === 2 && tr.map((p) => p.dataset.piece).join(',') === 'I4,I4', 'a4-tray-2', J(tr.map((p) => p.dataset.piece)));
  const shapeEl = tr[0].children[0];
  ok(shapeEl.children.length === 4 && shapeEl.children.every((c) => c.style.backgroundColor === COLORS.I4), 'a4-piece-render', shapeEl.children.length); // I4 vertical bbox = 4 rows x 1 col => 4 cells, all filled
  ok(txt(ga, 'pieces-left') === '2', 'a5-pieces-left-2', txt(ga, 'pieces-left'));
  ok(gid(ga, 'btn-next').disabled === true && gid(ga, 'btn-prev').disabled === true, 'a6-nav-gating');
  ok(!gid(ga, 'win-modal').classList.contains('active'), 'a6-modal-closed');

  // rotation: I4 click -> horizontal
  tr[0].dispatch('click', {});
  ok(J(ga.call("pieceRotations['0-0']")) === J([[0, 0], [0, 1], [0, 2], [0, 3]]), 'a7-rotated-horizontal', ga.call("pieceRotations['0-0']") && J(ga.call("pieceRotations['0-0']")));
  drive(ga, 0, 0, 0, 0);
  ok(placedN(ga) === 1, 'a7-placed-1', placedN(ga));
  ok(ga.sandbox.document.querySelectorAll('.grid .cell.occupied').length === 4, 'a7-occupied-4');
  ok(tray(ga).length === 1, 'a7-tray-1');
  ok(txt(ga, 'pieces-left') === '1', 'a7-pieces-left-1', txt(ga, 'pieces-left'));

  // invalid: vertical I4 (no rotation) over row0 -> out of bounds; horizontal over occupied; drop outside grid
  drive(ga, 1, 0, 0, 0); // vertical I4 anchor (0,0): cells (0..3,0) -> rows 2,3 OOB
  ok(placedN(ga) === 1, 'a8-oob-rejected', placedN(ga));
  drive(ga, 1, 1, 0, 0); // horizontal I4 anchored at (0,0) — all 4 cells already occupied
  ok(placedN(ga) === 1, 'a8-overlap-rejected', placedN(ga));
  layout(ga);
  pieceEl(ga, 1).dispatch('mousedown', { clientX: 300, clientY: 500 });
  ga.sandbox.document.dispatch('mousemove', { clientX: 2000, clientY: 2000 });
  ga.sandbox.document.dispatch('mouseup', { clientX: 2000, clientY: 2000 });
  ok(placedN(ga) === 1, 'a8-outside-grid-noop', placedN(ga));
  ok(ga.sandbox.document.body.children.filter((c) => c.classList && c.classList.contains('dragging')).length === 0, 'a8-clone-removed');

  // reset restores the level
  gid(ga, 'btn-reset').dispatch('click', {});
  ok(placedN(ga) === 0 && tray(ga).length === 2 && txt(ga, 'pieces-left') === '2', 'a10-reset');
  ok(qsaReal(ga, '.grid .cell.occupied').length === 0, 'a10-reset-occupied');
  ok(gid(ga, 'btn-next').disabled === true, 'a10-reset-next-gated');
  ok(ga.call("pieceRotations['0-0']") === undefined || ga.call("pieceRotations['0-0']") === null, 'a10-rotations-cleared', J(ga.call("pieceRotations['0-0']")));

  // full L1 win: rotate both I4 horizontal, rows 0 and 1
  drive(ga, 0, 1, 0, 0);
  drive(ga, 1, 1, 1, 0);
  ok(placedN(ga) === 2, 'a11-placed-2', placedN(ga));
  ok(gid(ga, 'btn-next').disabled === false, 'a11-next-enabled');
  ok(gid(ga, 'win-modal').classList.contains('active'), 'a11-modal-active');
  ok(ga.sandbox.localStorage.getItem('tetra-fit-level') === '0', 'a11-ls-level', ga.sandbox.localStorage.getItem('tetra-fit-level'));
  ok(ga.sandbox.localStorage.getItem('tetra-fit-unlocked') === '[1]', 'a11-ls-unlocked', ga.sandbox.localStorage.getItem('tetra-fit-unlocked'));
  ok(ga.sandbox.document.querySelectorAll('.grid .cell.occupied').length === 8, 'a11-occupied-8');
  ok(txt(ga, 'pieces-left') === '0', 'a11-pieces-left-0', txt(ga, 'pieces-left'));

  // modal close keeps level; modal-next advances
  gid(ga, 'btn-modal-close').dispatch('click', {});
  ok(!gid(ga, 'win-modal').classList.contains('active') && txt(ga, 'level-num') === '1', 'a12-close-stays');
  gid(ga, 'btn-modal-next').dispatch('click', {});
  ok(txt(ga, 'level-num') === '2' && txt(ga, 'level-name') === 'Block Drop' && !gid(ga, 'win-modal').classList.contains('active'), 'a12-next-l2', txt(ga, 'level-num'));
  ok(gid(ga, 'btn-next').disabled === true && gid(ga, 'btn-prev').disabled === false, 'a12-nav-gating-l2');

  // L2 win: O4 at (0,0), I2 vertical at (0,2)
  drive(ga, 0, 0, 0, 0);
  drive(ga, 1, 0, 0, 2);
  ok(placedN(ga) === 2 && gid(ga, 'win-modal').classList.contains('active'), 'a13-l2-win', placedN(ga));
  ok(ga.sandbox.localStorage.getItem('tetra-fit-unlocked') === '[1,2]', 'a13-l2-unlocked', ga.sandbox.localStorage.getItem('tetra-fit-unlocked'));

  // prev returns to a fresh L1; prev disabled at level 1
  gid(ga, 'btn-modal-next').dispatch('click', {});
  ok(txt(ga, 'level-num') === '3', 'a14-at-l3', txt(ga, 'level-num'));
  gid(ga, 'btn-prev').dispatch('click', {});
  ok(txt(ga, 'level-num') === '2' && placedN(ga) === 0 && gid(ga, 'btn-next').disabled === true, 'a14-prev-fresh-l2');
  gid(ga, 'btn-prev').dispatch('click', {});
  ok(txt(ga, 'level-num') === '1' && gid(ga, 'btn-prev').disabled === true, 'a14-prev-at-1');

  // forward to L3: highlight-invalid path + rotation cycling + win
  // (re-win L1+L2 via plans to advance — uses the same real-event driver)
  for (const mv of PLANS[0]) drive(ga, mv.i, mv.ri, mv.r, mv.c);
  ok(gid(ga, 'win-modal').classList.contains('active'), 'a15-l1-rewin');
  gid(ga, 'btn-modal-next').dispatch('click', {});
  for (const mv of PLANS[1]) drive(ga, mv.i, mv.ri, mv.r, mv.c);
  ok(gid(ga, 'win-modal').classList.contains('active'), 'a15-l2-rewin');
  gid(ga, 'btn-modal-next').dispatch('click', {});
  ok(txt(ga, 'level-num') === '3', 'a15-at-l3', txt(ga, 'level-num'));

  // L3 (3x3, I3 x3): place vertical I3 col0, then attempt horizontal I3 at (0,1):
  // covers (0,1),(0,2),(0,3) — (0,3) OOB -> invalid highlight mid-drag, reject on drop
  drive(ga, 0, 0, 0, 0);
  ok(placedN(ga) === 1, 'a9-l3-placed-1', placedN(ga));
  layout(ga);
  pieceEl(ga, 1).dispatch('click', {}); // I3 -> horizontal
  pieceEl(ga, 1).dispatch('mousedown', { clientX: 300, clientY: 500 });
  ga.sandbox.document.dispatch('mousemove', { clientX: cx(1), clientY: cy(0) });
  const inv = ga.sandbox.document.querySelectorAll('.grid .cell.invalid');
  ok(inv.length >= 1, 'a9-invalid-highlight', inv.length);
  ga.sandbox.document.dispatch('mouseup', { clientX: cx(1), clientY: cy(0) });
  ok(placedN(ga) === 1, 'a9-invalid-drop-rejected', placedN(ga));
  ok(qsaReal(ga, '.grid .cell.invalid').length === 0, 'a9-highlight-cleared');

  // I2 rotation cycling (on L4) and O4 single-rotation; touch-path placement; hint
  gid(ga, 'btn-reset').dispatch('click', {}); // a9 left one piece placed — replay from empty
  for (const mv of PLANS[2]) drive(ga, mv.i, mv.ri, mv.r, mv.c);
  ok(gid(ga, 'win-modal').classList.contains('active'), 'a15-l3-win');
  gid(ga, 'btn-modal-next').dispatch('click', {});
  ok(txt(ga, 'level-num') === '4', 'a16-at-l4', txt(ga, 'level-num'));
  gid(ga, 'btn-hint').dispatch('click', {});
  const hinted = ga.sandbox.document.querySelectorAll('.grid .cell').filter((c) => c.style.animation && c.style.animation !== 'none');
  ok(hinted.length === 4, 'a16-hint-4-cells', hinted.length);
  ok(placedN(ga) === 0, 'a16-hint-no-state-change', placedN(ga));
  // O4 has exactly 1 rotation: 3 clicks must be harmless
  pieceEl(ga, 0).dispatch('click', {}); pieceEl(ga, 0).dispatch('click', {}); pieceEl(ga, 0).dispatch('click', {});
  const o4rots = ga.call("pieceRotations['3-0']");
  ok(o4rots && J(o4rots) === J(GEO.normalizeShape(SHAPES.O4)), 'a17-O4-single-rot', o4rots && J(o4rots)); // getAllRotations returns sorted-normalized cells
  driveTouch(ga, 0, 0, 0, 0); // touch path places O4 at (0,0)
  ok(placedN(ga) === 1, 'a18-touch-placed', placedN(ga));
  gid(ga, 'btn-hint').dispatch('click', {});
  const hinted2 = ga.sandbox.document.querySelectorAll('.grid .cell').filter((c) => c.style.animation && c.style.animation !== 'none');
  ok(hinted2.length === 4, 'a16-hint-midlevel', hinted2.length);
  // mouseup without any mousemove still places at the up coords
  layout(ga);
  const el = pieceEl(ga, 1);
  el.dispatch('mousedown', { clientX: 300, clientY: 500 });
  ga.sandbox.document.dispatch('mouseup', { clientX: cx(2), clientY: cy(0) });
  ok(placedN(ga) === 2 && gid(ga, 'win-modal').classList.contains('active'), 'a20-nomove-drop-wins', placedN(ga));
}

/* ================= BOOT B — seeded restore (P3 fix) ================= */
{
  const ga = bootT({ 'tetra-fit-level': '4' });
  ok(ga.loadErrors.length === 0, 'b-load-errors', J(ga.loadErrors));
  ok(txt(ga, 'level-num') === '5' && txt(ga, 'level-name') === 'Quad Bar', 'b1-restored-l5', txt(ga, 'level-num') + '/' + txt(ga, 'level-name'));
  ok(gid(ga, 'btn-prev').disabled === false, 'b1-prev-enabled');
}

/* ================= BOOT C — corrupt LS (P2 + P3 guards) ================= */
{
  const ga = bootT({ 'tetra-fit-unlocked': '{not json', 'tetra-fit-level': 'zzz' });
  ok(ga.loadErrors.length === 0, 'c-load-errors', J(ga.loadErrors));
  ok(txt(ga, 'level-num') === '1', 'c1-corrupt-level-falls-back', txt(ga, 'level-num'));
  for (const mv of PLANS[0]) drive(ga, mv.i, mv.ri, mv.r, mv.c);
  ok(placedN(ga) === 2 && gid(ga, 'win-modal').classList.contains('active'), 'c2-win-despite-corrupt-unlocked');
  ok(ga.sandbox.localStorage.getItem('tetra-fit-unlocked') === '[1]', 'c3-unlocked-rewritten', ga.sandbox.localStorage.getItem('tetra-fit-unlocked'));
}

/* ================= BOOT D — last level ================= */
{
  const ga = bootT({ 'tetra-fit-level': '29' });
  ok(txt(ga, 'level-num') === '30' && txt(ga, 'level-name') === 'Fortress', 'd1-at-l30', txt(ga, 'level-num'));
  for (const mv of PLANS[29]) drive(ga, mv.i, mv.ri, mv.r, mv.c);
  ok(gid(ga, 'win-modal').classList.contains('active') && gid(ga, 'btn-next').disabled === false, 'd2-l30-win');
  ok(ga.sandbox.localStorage.getItem('tetra-fit-level') === '29', 'd2-ls-level-29', ga.sandbox.localStorage.getItem('tetra-fit-level'));
  ok(ga.sandbox.localStorage.getItem('tetra-fit-unlocked') === null, 'd3-no-phantom-unlock', ga.sandbox.localStorage.getItem('tetra-fit-unlocked'));
  gid(ga, 'btn-modal-next').dispatch('click', {});
  ok(txt(ga, 'level-num') === '30' && !gid(ga, 'win-modal').classList.contains('active'), 'd4-modal-next-stays');
  gid(ga, 'btn-next').dispatch('click', {});
  ok(txt(ga, 'level-num') === '30', 'd5-btn-next-noop-at-end', txt(ga, 'level-num'));
}

/* ================= BOOT E — full 30-level sweep of driven wins ================= */
{
  const ga = bootT();
  let sweepFails = 0;
  for (let li = 0; li < 30; li++) {
    const plan = PLANS[li];
    if (!plan) { sweepFails++; continue; }
    if (txt(ga, 'level-num') !== String(li + 1)) { sweepFails++; continue; }
    for (let m = 0; m < plan.length; m++) {
      const mv = plan[m];
      drive(ga, mv.i, mv.ri, mv.r, mv.c);
      if (placedN(ga) !== m + 1) { sweepFails++; break; }
    }
    const won = gid(ga, 'win-modal').classList.contains('active') && gid(ga, 'btn-next').disabled === false;
    const cov = ga.sandbox.document.querySelectorAll('.grid .cell.occupied').length === LEVELS[li].cells.length;
    if (!won || !cov) { sweepFails++; FAILS.push('E-L' + (li + 1) + (won ? '' : ' nowin') + (cov ? '' : ' nocov')); FAIL++; }
    else PASS++;
    if (li < 29) gid(ga, 'btn-modal-next').dispatch('click', {});
  }
  ok(sweepFails === 0, 'E-sweep-30-wins', sweepFails);
  ok(ga.sandbox.localStorage.getItem('tetra-fit-level') === '29', 'E-ls-final', ga.sandbox.localStorage.getItem('tetra-fit-level'));
}

/* ================= REPORT ================= */
const out = { pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS.slice(0, 12), extra: { engineFixes: ['P2 unlockLevel: corrupt tetra-fit-unlocked JSON.parse threw inside checkWin after every win (unlock write aborted; now treated as empty)', 'P3 #pieces-left: updatePiecesLeft() wrote to a null element (id missing from markup); indicator added', 'P3 tetra-fit-level: saved on every win but never restored on boot; now restored with unreadable/out-of-range fallback to level 1'], harnessAdditions: ['cloneNode(deep) on elements (drag ghosts)', 'compound/descendant selector support (.grid .cell, .cell[data-row][data-col])', 'stopPropagation injected on dispatched events'], documented: ['harness keeps numeric textContent/dataset assignments raw (browsers stringify) — verifier compares via String()','btnNext handler does not re-check disabled — unreachable in a real browser (disabled buttons swallow clicks)', 'tetra-fit-unlocked is write-only (no level-select reads it) — kept as forward-progression record', 'rotation is click-to-cycle BEFORE dragging (documented in instructions); no mid-drag rotate'] } };
console.log(JSON.stringify(out));
process.exit(FAIL === 0 ? 0 : 1);
