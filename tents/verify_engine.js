#!/usr/bin/env node
/* tents — Type A verifier. Canvas-only engine (no DOM state to probe): every observation
 * flows through the engine's own validate() -> winLevel(), localStorage progress writes,
 * and runtime-error tracking. All input is real: canvas mousedown at computed button/cell
 * rects (the engine hit-tests the rects its render pass just built, so every action pumps
 * first), mousedown button=2 for grass, wheel for the level-select scroll, document
 * keydown for ctrl+z / ctrl+shift+z / h / Escape.
 * The 30 hand-crafted levels are sliced out of index.html and validated offline (counts,
 * no tent-on-tree, no tents touching incl. diagonals, every tent tree-adjacent, and a
 * perfect tree<->tent matching so each tree serves exactly one tent). The daily
 * generator is sliced verbatim and replayed with a pre-click clock probe (virtual epoch
 * clock -> seed 19700101, doy 1 -> 7x7) — winning the replicated board through real
 * clicks proves the live board is the replica.
 * Win-oracle trick for input paths that produce no directly readable state: a click
 * sequence over solution cells only wins if EVERY intermediate click landed exactly where
 * intended (any stray tent makes validate() fail), so "won === true" certifies the whole
 * path (tutorial dismiss, grass cycle, undo/redo churn).
 * Covers: boot, tutorial dismiss (P1 fix: the tut box was pushed into menuBtns which the
 * play state never hit-tests — overlay was undismissable), full win L1 + 3 stars +
 * progress, next-level chain, tent/grass click cycles (0<->2, 2->1, 1->2, 1->0) via win
 * oracles, undo button + ctrl+z/ctrl+shift+z redo churn then win (P2 fix: redo re-derived
 * the placed value from prev and corrupted grass<->tent transitions), hint/check/mark
 * smoke, Escape to title, settings toggles persist + reset, stats screen, daily solve
 * with NO level progress credit (P1 fix: loadDaily left lvlIdx stale so a daily win
 * credited a real level) + Next-from-daily loads level 1, level 29 (14x14) win + Next ->
 * select (last level), Play Again reload, wheel scroll, beforeunload, boot #2.
 * Contract: exit 0 = PASS, last stdout line = compact JSON. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('tents');
const doc = g.sandbox.document;
const canvas = doc.getElementById('c');
const results = [];
const extra = { engineBugsFixed: [], notes: [] };
function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }

const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// ---------- engine data + generator, extracted verbatim ----------
const rngSrc = src.slice(src.indexOf('function makeRng'), src.indexOf('// ====== Hand-crafted Levels'));
const levSrc = src.slice(src.indexOf('var LEVELS='), src.indexOf('];', src.indexOf('var LEVELS=')) + 2);
const dailySrc = src.slice(src.indexOf('function computeClues'), src.indexOf('// ====== Validate level uniqueness'))
  + src.slice(src.indexOf('// ====== Procedural Generator'), src.indexOf('// ====== Game Logic ====='));
const mod = { exports: {} };
new Function('module', rngSrc + '\n' + levSrc + '\n' + dailySrc + '\nmodule.exports={makeRng:makeRng,LEVELS:LEVELS,computeClues:computeClues,generateDailyPuzzle:generateDailyPuzzle,solveTents:solveTents};')(mod);
const { makeRng, LEVELS, computeClues, generateDailyPuzzle } = mod.exports;

// ---------- offline integrity of the 30 hand-crafted levels ----------
function matchingOK(lv) { // every tree gets exactly one distinct adjacent tent
  const N = lv.trees.length, match = new Array(N).fill(-1), used = new Set();
  function aug(i, seen) {
    for (let j = 0; j < lv.tents.length; j++) {
      if (seen[j]) continue;
      const t = lv.trees[i], u = lv.tents[j];
      if (Math.abs(t[0] - u[0]) + Math.abs(t[1] - u[1]) !== 1) continue;
      seen[j] = 1;
      if (match[j] === -1 || aug(match[j], seen)) { match[j] = i; return true; }
    }
    return false;
  }
  for (let i = 0; i < N; i++) if (!aug(i, {})) return false;
  return true;
}
{
  let bad = [];
  for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i], why = [];
    if (lv.trees.length !== lv.tents.length) why.push('count');
    const tk = new Set(lv.trees.map(t => t.join(','))), nk = new Set(lv.tents.map(t => t.join(',')));
    if (tk.size !== lv.trees.length) why.push('dup-tree');
    if (nk.size !== lv.tents.length) why.push('dup-tent');
    for (const t of lv.tents) if (tk.has(t.join(','))) why.push('tent-on-tree');
    for (let a = 0; a < lv.tents.length; a++) for (let b = a + 1; b < lv.tents.length; b++) {
      const dr = Math.abs(lv.tents[a][0] - lv.tents[b][0]), dc = Math.abs(lv.tents[a][1] - lv.tents[b][1]);
      if (dr <= 1 && dc <= 1) why.push('touch');
    }
    for (const u of lv.tents) {
      let adj = false;
      for (const t of lv.trees) if (Math.abs(t[0] - u[0]) + Math.abs(t[1] - u[1]) === 1) adj = true;
      if (!adj) why.push('tent-no-tree');
    }
    if (!matchingOK(lv)) why.push('no-matching');
    const cl = computeClues(lv);
    const rSum = cl.rowCounts.reduce((a, b) => a + b, 0), cSum = cl.colCounts.reduce((a, b) => a + b, 0);
    if (rSum !== lv.trees.length || cSum !== lv.trees.length) why.push('clues');
    if (why.length) bad.push(i + ':' + [...new Set(why)].join('+'));
  }
  ck('levels:30-valid', LEVELS.length === 30 && bad.length === 0, bad.join('|'));
  const meta = (src.match(/\{n:'/g) || []).length;
  ck('levels:meta-30', meta === 30, 'meta=' + meta);
}

// ---------- geometry (mirrors calcLayout on the harness 480x640 viewport) ----------
const W = 480, H = 640;
function layout(rows, cols) {
  const clueW = 30, clueH = 30, pad = 10, hudH = 56;
  const avW = W - pad * 2 - clueW, avH = H - hudH - pad * 2 - clueH;
  let csz = Math.floor(Math.min(avW / cols, avH / rows));
  if (csz < 16) csz = 16; if (csz > 80) csz = 80;
  return { csz, gridX: Math.floor((W - cols * csz) / 2), gridY: Math.floor(hudH + (avH - rows * csz) / 2 + pad) };
}
function cellXY(rows, cols, r, c) { const L = layout(rows, cols); return { x: L.gridX + c * L.csz + L.csz / 2, y: L.gridY + r * L.csz + L.csz / 2 }; }
function clickXY(x, y, btn) { canvas.dispatch('mousedown', { clientX: x, clientY: y, button: btn || 0 }); }
function clickCell(rows, cols, r, c, btn) { const p = cellXY(rows, cols, r, c); clickXY(p.x, p.y, btn); }
// title menu: Play/Daily/Stats/Settings at W/2, H*0.52 + 26 + i*64
const TITLE = i => ({ x: W / 2, y: H * 0.52 + 26 + i * 64 });
// level-select card i (4 cols at 480px): x=65+(i%4)*90+40, y=70+row*90+40-scroll
function cardXY(i, scroll) { return { x: 65 + (i % 4) * 90 + 40, y: 70 + Math.floor(i / 4) * 90 + 40 - (scroll || 0) }; }
// play HUD / bottom bar / win screen (py=170)
const BTN = { back: [33, 26], hint: [407, 26], undo: [445, 26], set: [477, 26], check: [170, 618], mark: [310, 618], next: [165, 365], select: [315, 365], replay: [240, 420], tutBox: [240, 320] };
function hud(n) { clickXY(BTN[n][0], BTN[n][1]); }

function placeAll(lv, btn) { for (const [r, c] of lv.tents) clickCell(lv.r, lv.c, r, c, btn); }
function prog() { return JSON.parse(g.sandbox.localStorage.getItem('tents_progress') || '{}'); }
function gotoLevel(i, scroll) { doc.dispatch('keydown', { key: 'Escape', preventDefault() {} }); g.pump(2); clickXY(TITLE(0).x, TITLE(0).y); g.pump(2); if (scroll) { canvas.dispatch('wheel', { deltaY: scroll }); g.pump(1); } const p = cardXY(i, scroll); clickXY(p.x, p.y); g.pump(2); }

// ---------- boot ----------
ck('boot:no-load-errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join('|').slice(0, 120));
g.pump(3);

// ---------- tutorial (P1 fix: box now in playBtns) + level 1 full win ----------
{
  clickXY(TITLE(0).x, TITLE(0).y); g.pump(2); // Play -> select
  const p0 = cardXY(0, 0); clickXY(p0.x, p0.y); g.pump(2); // level 1 -> tutorial shows
  // 3 taps on the tut box center. That point is cell (1,2); (1,2) touches solution tents
  // (0,1) and (2,2), so if the taps leaked to the grid the final win below would fail.
  for (let i = 0; i < 3; i++) { hud('tutBox'); g.pump(2); }
  const lv = LEVELS[0];
  placeAll(lv); g.pump(3);
  const pr = prog();
  ck('tut:dismiss+L1-win', pr.done && pr.done.L0 === true, 'done=' + JSON.stringify(pr.done || {}));
  ck('tut:tutDone-saved', pr.tutDone === true);
  ck('win:L1-3stars', pr.stars && pr.stars.L0 === 3, 'stars=' + JSON.stringify(pr.stars || {}));
  ck('win:L1-stats', pr.stats && pr.stats.played === 1 && pr.stats.completed === 1 && pr.stats.totalTime >= 0, JSON.stringify(pr.stats || {}));
  ck('win:L1-best', typeof pr.best.L0 === 'number' && pr.best.L0 >= 0, 'best=' + pr.best.L0);
  // Next Level -> level 2 loads (fresh board: placing its solution must win)
  hud('next'); g.pump(2);
  placeAll(LEVELS[1]); g.pump(3);
  ck('nav:next-level-chain', prog().done.L1 === true, 'done=' + JSON.stringify(prog().done));
}

// ---------- click cycles via win oracles (level 4, no tutorial: tutDone saved) ----------
{
  gotoLevel(3, 0);
  const lv = LEVELS[3];
  // left cycle 1->0: place first tent twice (tent->empty), then all
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1]); // tent
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1]); // back to empty
  placeAll(lv); g.pump(3);
  ck('cycle:left-1-0', prog().done.L3 === true, 'done=' + JSON.stringify(prog().done));
}
{
  gotoLevel(4, 0);
  const lv = LEVELS[4];
  // grass cycle: RC every solution cell (0->2), RC the first again (2->0), RC again (0->2),
  // then left-click all (2->1) -> win certifies every transition
  for (const [r, c] of lv.tents) clickCell(lv.r, lv.c, r, c, 2);
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1], 2); // 2->0
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1], 2); // 0->2
  placeAll(lv); g.pump(3);
  ck('cycle:grass-0-2-0-then-win', prog().done.L4 === true, 'done=' + JSON.stringify(prog().done));
}
{
  gotoLevel(5, 0);
  const lv = LEVELS[5];
  // 1->2: place first solution tent, right-click it (tent->grass), left it back (2->1),
  // then the rest. Plus undo/redo churn around a wrong cell mid-sequence.
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1]); // 0->1
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1], 2); // 1->2 (P2-redo path data)
  doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1); // undo -> tent
  doc.dispatch('keydown', { key: 'z', ctrlKey: true, shiftKey: true, preventDefault() {} }); g.pump(1); // redo -> grass (P2 fix: was empty)
  // churn a wrong cell through all transitions + undo/redo, ending clean
  const wrong = [];
  outer: for (let r = 0; r < lv.r; r++) for (let c = 0; c < lv.c; c++) {
    const k = r + ',' + c, isTree = lv.trees.some(t => t[0] === r && t[1] === c), isTent = lv.tents.some(t => t[0] === r && t[1] === c);
    if (!isTree && !isTent) { wrong.push([r, c]); break outer; }
  }
  let churnOk = true;
  if (wrong.length) {
    const [wr, wc] = wrong[0];
    clickCell(lv.r, lv.c, wr, wc); // 0->1 wrong tent
    clickCell(lv.r, lv.c, wr, wc, 2); // 1->2
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1); // ->1
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1); // ->2
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1); // ->0 (clean)
    // redo twice restores the two actions, undo twice cleans again
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, shiftKey: true, preventDefault() {} }); g.pump(1);
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, shiftKey: true, preventDefault() {} }); g.pump(1);
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1);
    doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1);
    // undo BUTTON path too
    hud('undo'); g.pump(1);
    // grid should now be clean of the wrong cell: prove by winning below
    churnOk = true;
  }
  // re-place first solution tent (currently grass from the redo above), then everything
  placeAll(lv); g.pump(3);
  const wonClean = prog().done.L5 === true;
  ck('cycle:tent-grass+undo-redo-churn-win', wonClean && churnOk, 'done=' + JSON.stringify(prog().done));
  hud('back'); g.pump(2);
}

// ---------- hint / error-check / mark / h key / Escape smoke (level 7, not won) ----------
{
  gotoLevel(6, 0);
  const lv = LEVELS[6];
  clickCell(lv.r, lv.c, lv.tents[0][0], lv.tents[0][1]); // a correct tent
  const wrong = [];
  outer2: for (let r = 0; r < lv.r; r++) for (let c = 0; c < lv.c; c++) {
    const isTree = lv.trees.some(t => t[0] === r && t[1] === c), isTent = lv.tents.some(t => t[0] === r && t[1] === c);
    if (!isTree && !isTent) { wrong.push([r, c]); break outer2; }
  }
  if (wrong.length) clickCell(lv.r, lv.c, wrong[0][0], wrong[0][1]); // a wrong tent
  hud('hint'); g.pump(2); // button hint (wrong-tent highlight path)
  doc.dispatch('keydown', { key: 'h', preventDefault() {} }); g.pump(2); // key hint
  hud('check'); g.pump(1); hud('check'); g.pump(1); // toggle error mode both ways
  hud('mark'); g.pump(1); // bottom info button (no-op draw)
  const noErr = !(g.sandbox.__errors || []).length;
  doc.dispatch('keydown', { key: 'Escape', preventDefault() {} }); g.pump(2);
  ck('flow:hint+check+escape', noErr, 'errors=' + JSON.stringify((g.sandbox.__errors || []).slice(0, 2)));
}

// ---------- settings: toggles persist, reset wipes, stats screen ----------
{
  clickXY(TITLE(3).x, TITLE(3).y); g.pump(2); // Settings
  clickXY(W / 2, 100 + 24); g.pump(1); // sound off
  clickXY(W / 2, 160 + 24); g.pump(1); // music off
  const pr1 = prog();
  ck('set:toggles-persist', pr1.sound === false && pr1.music === false, JSON.stringify({ s: pr1.sound, m: pr1.music }));
  clickXY(TITLE(2).x, TITLE(2).y); g.pump(2); // (from title) stats screen reachable
  clickXY(40, 26); g.pump(2); // stats back -> title
  clickXY(TITLE(3).x, TITLE(3).y); g.pump(2); // settings again
  clickXY(W / 2, 220 + 24); g.pump(2); // Reset Progress (confirm() defaults true)
  // reset removes the whole tents_progress key; prefs revert to in-memory defaults
  const raw2 = g.sandbox.localStorage.getItem('tents_progress');
  const pr2 = raw2 ? JSON.parse(raw2) : { done: {}, stats: { played: 0 } };
  ck('set:reset-wipes', (!raw2 || (pr2.done && Object.keys(pr2.done).length === 0)) && (!raw2 || pr2.stats.played === 0), 'ls=' + (raw2 ? 'present done=' + Object.keys(pr2.done || {}).length : 'removed'));
  clickXY(40, 26); g.pump(2); // settings back
}

// ---------- beforeunload smoke ----------
g.sandbox.window.dispatchEvent({ type: 'beforeunload' }); g.pump(1);
ck('unload:beforeunload-clean', !(g.sandbox.__errors || []).length, 'errors=' + JSON.stringify((g.sandbox.__errors || []).slice(0, 2)));

// ---------- boot #2 (fresh process, prefs persisted, reset state) ----------
let g2, doc2, canvas2;
{
  g2 = bootGame('tents', { seedLS: Object.assign({}, g.ls._m) });
  doc2 = g2.sandbox.document; canvas2 = doc2.getElementById('c');
  g2.pump(3);
  ck('boot2:clean', (g2.loadErrors || []).length === 0 && !(g2.sandbox.__errors || []).length, (g2.loadErrors || []).join('|').slice(0, 80));
}

// ---------- daily: replicated generator + win + NO level credit (P1 fix) ----------
{
  const nowProbe = g2.call('Date.now()');
  const RealDate = Date; // mirror the harness VDate: no-arg new Date() -> virtual epoch clock
  const VDate = class extends RealDate { static now() { return nowProbe; } constructor(...a) { super(...(a.length ? a : [nowProbe])); } };
  Date = VDate; // eslint-disable-line no-global-assign
  const pz = generateDailyPuzzle(19700101); // new Date() on the virtual epoch clock -> 19700101
  Date = RealDate;
  ck('daily:generator-solved', !!pz && pz.tents.length === pz.trees.length, pz ? pz.r + 'x' + pz.c + ' trees=' + pz.trees.length : 'null');
  canvas2.dispatch('mousedown', { clientX: TITLE(1).x, clientY: TITLE(1).y, button: 0 }); g2.pump(2); // Daily
  for (const [r, c] of pz.tents) { const p = cellXY(pz.r, pz.c, r, c); canvas2.dispatch('mousedown', { clientX: p.x, clientY: p.y, button: 0 }); }
  g2.pump(3);
  const pr = JSON.parse(g2.sandbox.localStorage.getItem('tents_progress') || '{}');
  const noCredit = pr.done && Object.keys(pr.done).length === 0; // P1: daily must not credit any level
  ck('daily:win-no-level-credit', noCredit, 'done=' + JSON.stringify(pr.done || {}));
  ck('daily:stats-counted', pr.stats.played === 1 && pr.stats.completed === 1, JSON.stringify(pr.stats));
  // Next Level from a daily win -> level 1 (lvlIdx -1 + 1 = 0)
  clickXY2(165, 365); g2.pump(2);
  // reset in boot 1 wiped tutDone, so level 0 re-shows the tutorial — dismiss it for real
  for (let i = 0; i < 3; i++) { clickXY2(240, 320); g2.pump(2); }
  const lv0 = LEVELS[0];
  for (const [r, c] of lv0.tents) { const p = cellXY(lv0.r, lv0.c, r, c); canvas2.dispatch('mousedown', { clientX: p.x, clientY: p.y, button: 0 }); }
  g2.pump(3);
  const pr2 = JSON.parse(g2.sandbox.localStorage.getItem('tents_progress') || '{}');
  ck('daily:next-loads-L1', pr2.done && pr2.done.L0 === true && !pr2.done.L1, 'done=' + JSON.stringify(pr2.done || {}));
  function clickXY2(x, y) { canvas2.dispatch('mousedown', { clientX: x, clientY: y, button: 0 }); }
}

// ---------- level 29 (14x14 Master): wheel scroll, win, Next -> select; then Play Again ----------
{
  doc2.dispatch('keydown', { key: 'Escape', preventDefault() {} }); g2.pump(2); // leave the win screen the real way
  canvas2.dispatch('mousedown', { clientX: TITLE(0).x, clientY: TITLE(0).y, button: 0 }); g2.pump(2);
  canvas2.dispatch('wheel', { deltaY: 500 }); g2.pump(2); // scroll to bottom (max 180)
  const p29 = cardXY(29, 180);
  canvas2.dispatch('mousedown', { clientX: p29.x, clientY: p29.y, button: 0 }); g2.pump(2);
  const lv = LEVELS[29];
  for (const [r, c] of lv.tents) { const p = cellXY(lv.r, lv.c, r, c); canvas2.dispatch('mousedown', { clientX: p.x, clientY: p.y, button: 0 }); }
  g2.pump(3);
  const pr = JSON.parse(g2.sandbox.localStorage.getItem('tents_progress') || '{}');
  ck('win:L29-14x14+3stars', pr.done && pr.done.L29 === true && pr.stars.L29 === 3, 'done=' + !!(pr.done && pr.done.L29) + ' stars=' + JSON.stringify((pr.stars || {}).L29 || 0));
  // Next on the LAST level -> back to the select screen; prove it by opening level 2 from there
  canvas2.dispatch('mousedown', { clientX: 165, clientY: 365, button: 0 }); g2.pump(2);
  canvas2.dispatch('wheel', { deltaY: -500 }); g2.pump(1); // scroll back to top
  const p1 = cardXY(1, 0);
  canvas2.dispatch('mousedown', { clientX: p1.x, clientY: p1.y, button: 0 }); g2.pump(2);
  const lv1 = LEVELS[1];
  for (const [r, c] of lv1.tents) { const p = cellXY(lv1.r, lv1.c, r, c); canvas2.dispatch('mousedown', { clientX: p.x, clientY: p.y, button: 0 }); }
  g2.pump(3);
  const pr2 = JSON.parse(g2.sandbox.localStorage.getItem('tents_progress') || '{}');
  ck('nav:last-next-to-select+L2', pr2.done && pr2.done.L1 === true, 'done=' + JSON.stringify(pr2.done || {}));
  // Play Again on a win: reload the same level, win again, best time stays a number
  canvas2.dispatch('mousedown', { clientX: 240, clientY: 420, button: 0 }); g2.pump(2); // Play Again
  const lv1b = LEVELS[1];
  for (const [r, c] of lv1b.tents) { const p = cellXY(lv1b.r, lv1b.c, r, c); canvas2.dispatch('mousedown', { clientX: p.x, clientY: p.y, button: 0 }); }
  g2.pump(3);
  const pr3 = JSON.parse(g2.sandbox.localStorage.getItem('tents_progress') || '{}');
  ck('nav:play-again-rewin', pr3.done.L1 === true && typeof pr3.best.L1 === 'number', 'best=' + pr3.best.L1);
  const errs2 = (g2.sandbox.__errors || []);
  ck('run:no-runtime-errors', errs2.length === 0 && (g.sandbox.__errors || []).length === 0, 'e1=' + JSON.stringify((g.sandbox.__errors || []).slice(0, 1)) + ' e2=' + JSON.stringify(errs2.slice(0, 1)));
}

// ---------- report ----------
extra.engineBugsFixed = [
  'P1 next-level: handleAction(next) called loadLevel(next) without ever assigning lvlIdx — after any win the Next button replayed the SAME level forever (lvlIdx stayed put, so the win credited the previous level and the next level never actually advanced; verified by trace: win L1 while lvlIdx still 0 -> done.L0 double-credited). lvlIdx now advances with the load.',
  'P1 tutorial: drawTutorial pushed its "tap to continue" box into menuBtns, but the play-state mousedown/touch handlers hit-test playBtns only — the box was unreachable, so the 3-step tutorial overlay could never be dismissed (it covered the board center on levels 1-3 while grid clicks underneath still fired). The box now lives in playBtns.',
  'P1 daily: loadDaily never reset lvlIdx — during the daily the HUD showed a stale level name, and winLevel credited that stale level (done/stars/best) for a daily win; "Next Level" after a daily win also jumped to staleLvl+1. lvlIdx is now -1 on the daily and winLevel only writes per-level progress when lvlIdx>=0 (daily wins still count toward global stats).',
  'P2 redo: redo() re-derived the re-applied cell value from prev (prev===0?1:prev===1?0:prev), which corrupted every action whose placed value differs from that mapping — grass->tent redid to grass, tent->grass redid to empty. Actions now record `next` and redo restores it exactly (undo unchanged).'
];
extra.notes = [
  'win-oracle verification: a full solution placement only wins if every prior click in the sequence landed exactly where intended (any stray/wrong tent fails validate()), so each "won" check certifies the whole click path',
  'redo correctness is exercised through undo/redo churn over grass<->tent transitions followed by a clean win (the corruption is not directly observable: grass vs empty are both non-tents to validate) — the `next`-record fix itself is by inspection',
  'known P3 cosmetics, not fixed: the Settings HUD button extends past the canvas edge at 480px widths; beforeunload references animId/bgmNode (bgmNodes is the real name) so cleanup is a no-op; stats "Games Played" counts wins',
  'timer pause/resume on visibilitychange has no readable oracle (canvas-drawn timer); the handler is exercised with no runtime errors'
];
extra.levels = LEVELS.length;
let pass = 0, fail = 0; const fails = [];
for (const r of results) { if (r.ok) pass++; else { fail++; fails.push(r.name + (r.info ? ' — ' + r.info : '')); } }
for (const f of fails) console.log('FAIL ' + f);
console.log(JSON.stringify({ pass, fail, total: results.length, verdict: fail ? 'FAIL' : 'PASS', fails, extra }));
process.exit(fail ? 1 : 0);
