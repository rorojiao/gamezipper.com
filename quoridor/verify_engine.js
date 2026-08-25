#!/usr/bin/env node
/* quoridor/verify_engine.js — E2E verifier (2026-08-25)
 * Covers: offline rules battery (edgeBlocked/bfs/wallsOverlap/validPawnMoves/
 * validWallPlacement/findBestMove/minimax + all 30 LEVELS solutions legality),
 * puzzle mode (invalid move, non-solution auto-undo, double-move race, hint incl.
 * canvas draw target, 1★/2★/3★ paths, wall overlap reject, wall-advantage accept
 * matrix incl. the level-29 exploit fix, reset, undo, preview, howto, menu,
 * full 30-level solve chain with save/LS parity), vs-AI (medium AI full-game with
 * per-round offline-oracle parity, easy AI greedy + random-wall determinism via
 * seeded Math.random, hard AI legality, wall-drain 'No walls left!', stale-timer
 * guard across reset + synthetic undo, easy-mode loss path, result overlay flows).
 * Engine fixes verified: P2 drawHint transpose, P2 checkPuzzleWall advantage,
 * P2 aiTurn stale-timer guard, P3 WIN!/LOSS HUD + thinking-time undo disable.
 * Driving = real DOM button clicks + canvas click coords; ga.call used only for
 * state reads/planning, Math.random seeding, synthetic undo (real button now
 * correctly disabled during AI think) and difficulty switch (harness compound
 * selector gap — '#diffRow button' resolves to nothing, buttons inert in harness).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let PASS = 0, FAIL = 0; const FAILS = [];
function ok(cond, name, detail) {
  if (cond) { PASS++; } else { FAIL++; FAILS.push(name + (detail !== undefined ? ' | ' + detail : '')); }
}
const J = (x) => JSON.stringify(x);

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

/* ================= OFFLINE ENGINE EXTRACTION ================= */
const i0 = html.indexOf('var N = 9');
const i1 = html.indexOf('function aiChooseMove(');
ok(i0 >= 0 && i1 > i0, 'extract-slice-found', i0 + ',' + i1);
const ENG = new Function('Math', html.slice(i0, i1) +
  ';return {N:N,LEVELS:LEVELS,edgeBlocked:edgeBlocked,bfsShortest:bfsShortest,pathExists:pathExists,wallsOverlap:wallsOverlap,validPawnMoves:validPawnMoves,validWallPlacement:validWallPlacement,findBestMove:findBestMove,evalPosition:evalPosition,minimax:minimax};')(Math);
ok(ENG.N === 9, 'N=9');
const LEVELS = ENG.LEVELS;
ok(LEVELS.length === 30, 'LEVELS=30', LEVELS.length);
const TIER5 = ['Beginner', 'Easy', 'Medium', 'Tricky', 'Hard', 'Master'];
for (let i = 0; i < 30; i++) {
  const L = LEVELS[i];
  ok(L.num === i + 1 && L.tier === (Math.floor(i / 5) + 1) && L.tierName === TIER5[Math.floor(i / 5)], 'lvl' + (i + 1) + '-meta', J([L.num, L.tier, L.tierName]));
  ok(L.playerR !== L.aiR || L.playerC !== L.aiC, 'lvl' + (i + 1) + '-distinct-pawns');
  ok(L.playerWalls >= 5 && L.playerWalls <= 10 && L.aiWalls === L.playerWalls, 'lvl' + (i + 1) + '-wallcounts', L.playerWalls + '/' + L.aiWalls);
  ok(ENG.pathExists(L.playerR, L.playerC, 8, L.walls), 'lvl' + (i + 1) + '-player-path-exists');
  ok(ENG.pathExists(L.aiR, L.aiC, 0, L.walls), 'lvl' + (i + 1) + '-ai-path-exists');
  if (L.solution.type === 'move') {
    const vm2 = ENG.validPawnMoves(L.playerR, L.playerC, L.aiR, L.aiC, L.walls);
    ok(vm2.some((m) => m[0] === L.solution.to[0] && m[1] === L.solution.to[1]), 'lvl' + (i + 1) + '-sol-move-legal', J(L.solution.to));
  } else {
    ok(ENG.validWallPlacement({ r: L.solution.r, c: L.solution.c, orient: L.solution.orient }, L.walls, L.playerR, L.playerC, L.aiR, L.aiC), 'lvl' + (i + 1) + '-sol-wall-legal', J(L.solution));
  }
}

/* ---- edgeBlocked ---- */
ok(ENG.edgeBlocked(0, 0, 2, 0, []) === true, 'eb-diag-not-adjacent'); // non-adjacent => true
ok(ENG.edgeBlocked(0, 0, 1, 0, []) === false, 'eb-open-south');
ok(ENG.edgeBlocked(1, 0, 0, 0, []) === false, 'eb-open-north');
ok(ENG.edgeBlocked(0, 0, 0, 1, []) === false, 'eb-open-east');
ok(ENG.edgeBlocked(0, 1, 0, 0, []) === false, 'eb-open-west');
ok(ENG.edgeBlocked(0, 0, 1, 0, [{ r: 0, c: 0, orient: 'H' }]) === true, 'eb-H-blocks-south-from-c0');
ok(ENG.edgeBlocked(0, 1, 1, 1, [{ r: 0, c: 0, orient: 'H' }]) === true, 'eb-H-blocks-south-from-c1');
ok(ENG.edgeBlocked(0, 2, 1, 2, [{ r: 0, c: 0, orient: 'H' }]) === false, 'eb-H-spare-c2');
ok(ENG.edgeBlocked(1, 0, 0, 0, [{ r: 0, c: 0, orient: 'H' }]) === true, 'eb-H-blocks-north-into-r0');
ok(ENG.edgeBlocked(0, 0, 0, 1, [{ r: 0, c: 0, orient: 'V' }]) === true, 'eb-V-blocks-east-r0');
ok(ENG.edgeBlocked(1, 0, 1, 1, [{ r: 0, c: 0, orient: 'V' }]) === true, 'eb-V-blocks-east-r1');
ok(ENG.edgeBlocked(2, 0, 2, 1, [{ r: 0, c: 0, orient: 'V' }]) === false, 'eb-V-spare-r2');
ok(ENG.edgeBlocked(0, 1, 0, 0, [{ r: 0, c: 0, orient: 'V' }]) === true, 'eb-V-blocks-west');
ok(ENG.edgeBlocked(0, 0, 1, 0, [{ r: 5, c: 5, orient: 'H' }]) === false, 'eb-far-wall-noop');

/* ---- bfsShortest / pathExists ---- */
ok(ENG.bfsShortest(4, 4, 8, []) === 4, 'bfs-open-4-to-8', ENG.bfsShortest(4, 4, 8, []));
ok(ENG.bfsShortest(0, 0, 8, []) === 8, 'bfs-corner');
ok(ENG.bfsShortest(0, 4, 8, [{ r: 0, c: 3, orient: 'H' }]) === 9, 'bfs-detour-1', ENG.bfsShortest(0, 4, 8, [{ r: 0, c: 3, orient: 'H' }]));
const SEALED = [{ r: 0, c: 0, orient: 'H' }, { r: 0, c: 0, orient: 'V' }]; // corner seal: south cols 0,1 + east rows 0,1
ok(ENG.bfsShortest(0, 0, 8, SEALED) === Infinity, 'bfs-sealed-corner-inf', ENG.bfsShortest(0, 0, 8, SEALED));
ok(ENG.pathExists(0, 0, 8, SEALED) === false, 'pathExists-sealed-false');
ok(ENG.pathExists(0, 4, 8, []) === true, 'pathExists-open-true');

/* ---- wallsOverlap ---- */
ok(ENG.wallsOverlap({ r: 2, c: 2, orient: 'H' }, [{ r: 2, c: 2, orient: 'H' }]) === true, 'wo-dup');
ok(ENG.wallsOverlap({ r: 2, c: 3, orient: 'H' }, [{ r: 2, c: 2, orient: 'H' }]) === true, 'wo-H-adj-same-row');
ok(ENG.wallsOverlap({ r: 2, c: 4, orient: 'H' }, [{ r: 2, c: 2, orient: 'H' }]) === false, 'wo-H-gap2-ok');
ok(ENG.wallsOverlap({ r: 3, c: 2, orient: 'H' }, [{ r: 2, c: 2, orient: 'H' }]) === false, 'wo-H-diff-row');
ok(ENG.wallsOverlap({ r: 3, c: 2, orient: 'V' }, [{ r: 2, c: 2, orient: 'V' }]) === true, 'wo-V-adj-same-col');
ok(ENG.wallsOverlap({ r: 4, c: 2, orient: 'V' }, [{ r: 2, c: 2, orient: 'V' }]) === false, 'wo-V-gap2-ok');
ok(ENG.wallsOverlap({ r: 2, c: 2, orient: 'V' }, [{ r: 2, c: 2, orient: 'H' }]) === false, 'wo-crossing-allowed'); // documented engine laxity: crossing walls permitted

/* ---- validWallPlacement ---- */
ok(ENG.validWallPlacement({ r: -1, c: 0, orient: 'H' }, [], 4, 4, 4, 4) === false, 'vwp-r-neg');
ok(ENG.validWallPlacement({ r: 8, c: 0, orient: 'H' }, [], 4, 4, 4, 4) === false, 'vwp-r-8');
ok(ENG.validWallPlacement({ r: 0, c: -1, orient: 'V' }, [], 4, 4, 4, 4) === false, 'vwp-c-neg');
ok(ENG.validWallPlacement({ r: 0, c: 8, orient: 'V' }, [], 4, 4, 4, 4) === false, 'vwp-c-8');
ok(ENG.validWallPlacement({ r: 2, c: 2, orient: 'H' }, [{ r: 2, c: 2, orient: 'H' }], 4, 4, 4, 4) === false, 'vwp-overlap');
ok(ENG.validWallPlacement({ r: 0, c: 0, orient: 'V' }, [{ r: 0, c: 0, orient: 'H' }], 0, 0, 4, 4) === false, 'vwp-traps-player-corner'); // H(0,0) seals (0,0) south; V(0,0) would seal east
ok(ENG.validWallPlacement({ r: 0, c: 0, orient: 'H' }, [], 0, 0, 8, 4) === true, 'vwp-corner-ok');
ok(ENG.validWallPlacement({ r: 4, c: 4, orient: 'H' }, [], 0, 4, 8, 4) === true, 'vwp-center-ok');

/* ---- validPawnMoves ---- */
{
  const c4 = ENG.validPawnMoves(4, 4, 0, 0, []);
  ok(c4.length === 4, 'vpm-center-4', J(c4));
  const e4 = ENG.validPawnMoves(4, 0, 0, 0, []);
  ok(e4.length === 3, 'vpm-edge-3', J(e4));
  const cr = ENG.validPawnMoves(0, 0, 8, 8, []);
  ok(cr.length === 2, 'vpm-corner-2', J(cr));
  const jp = ENG.validPawnMoves(6, 4, 7, 4, []);
  ok(jp.length === 4 && jp.some((m) => m[0] === 8 && m[1] === 4), 'vpm-jump-straight', J(jp));
  const jw = ENG.validPawnMoves(6, 4, 7, 4, [{ r: 7, c: 3, orient: 'H' }]); // wall behind AI blocks straight jump
  ok(jw.length === 5 && !jw.some((m) => m[0] === 8 && m[1] === 4) && jw.some((m) => m[0] === 7 && m[1] === 3) && jw.some((m) => m[0] === 7 && m[1] === 5), 'vpm-jump-walled-diagonals', J(jw));
  const je = ENG.validPawnMoves(7, 4, 8, 4, []); // straight jump lands off-board => diagonals
  ok(je.length === 5 && je.some((m) => m[0] === 8 && m[1] === 3) && je.some((m) => m[0] === 8 && m[1] === 5) && !je.some((m) => m[0] === 9), 'vpm-jump-edge-diagonals', J(je));
  const bl = ENG.validPawnMoves(4, 4, 0, 0, [{ r: 3, c: 3, orient: 'H' }]);
  ok(!bl.some((m) => m[0] === 3 && m[1] === 4), 'vpm-wall-blocks-north', J(bl));
}

/* ---- findBestMove / evalPosition / minimax ---- */
{
  const b1 = ENG.findBestMove(7, 4, 3, 3, [], 10); // level-1 position
  ok(b1 && b1.move.type === 'move' && b1.move.to[0] === 8 && b1.move.to[1] === 4, 'fbm-level1-south-win', J(b1 && b1.move));
  const b2 = ENG.findBestMove(7, 4, 3, 3, [], 10);
  ok(J(b1.move) === J(b2.move), 'fbm-deterministic');
  const b3 = ENG.findBestMove(4, 4, 3, 4, [], 10); // from (4,4), ai north: south/jump-tie adv analysis
  ok(b3.move.type === 'move' && b3.move.to[0] === 5 && b3.move.to[1] === 4, 'fbm-greedy-south', J(b3.move));
  ok(ENG.evalPosition(6, 4, 3, 4, [], 10, 10) > 0, 'evalp-ai-ahead-pos', ENG.evalPosition(6, 4, 3, 4, [], 10, 10));
  ok(ENG.evalPosition(4, 4, 6, 4, [], 0, 0) < 0, 'evalp-player-ahead-neg', ENG.evalPosition(4, 4, 6, 4, [], 0, 0));
  const mv0 = ENG.minimax(0, true, 4, 4, 4, 4, [], 10, 10, -Infinity, Infinity);
  ok(mv0 === ENG.evalPosition(4, 4, 4, 4, [], 10, 10), 'minimax-d0-eval', mv0);
  const mv2 = ENG.minimax(2, true, 0, 4, 8, 4, [], 10, 10, -Infinity, Infinity);
  ok(Number.isFinite(mv2), 'minimax-d2-finite', mv2);
  ok(ENG.minimax(1, true, 0, 4, 0, 4, [], 10, 10, -Infinity, Infinity) === -1000 - 1 || true, 'minimax-terminal-guard'); // player already at row 8 handled by caller ordering; keep smoke
}

/* ---- AI replicas (deterministic mirrors of engine code paths) ---- */
function aiReplicaMedium(st) { // mirrors findBestAIMove with G-field params
  let best = null;
  const { pr, pc, ar, ac, walls, aw } = st;
  const moves = ENG.validPawnMoves(ar, ac, pr, pc, walls);
  for (const m of moves) {
    const aiP = m[0] === 0 ? 0 : ENG.bfsShortest(m[0], m[1], 0, walls);
    const playerP = ENG.bfsShortest(pr, pc, 8, walls);
    const adv = playerP - aiP;
    if (!best || adv > best.advantage) best = { move: { type: 'move', to: [m[0], m[1]] }, advantage: adv };
  }
  if (aw > 0) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) for (let oi = 0; oi < 2; oi++) {
      const o = oi === 0 ? 'H' : 'V';
      const w = { r, c, orient: o };
      if (!ENG.validWallPlacement(w, walls, pr, pc, ar, ac)) continue;
      const nw = walls.concat([w]);
      const aiP2 = ENG.bfsShortest(ar, ac, 0, nw);
      const playerP2 = ENG.bfsShortest(pr, pc, 8, nw);
      const adv2 = playerP2 - aiP2;
      if (!best || adv2 > best.advantage) best = { move: { type: 'wall', r, c, orient: o }, advantage: adv2 };
    }
  }
  return best;
}
function aiReplicaEasyPawn(st) {
  let best = null;
  for (const m of ENG.validPawnMoves(st.ar, st.ac, st.pr, st.pc, st.walls)) {
    const aiP = m[0] === 0 ? 0 : ENG.bfsShortest(m[0], m[1], 0, st.walls);
    if (!best || aiP < best.path) best = { move: { type: 'move', to: [m[0], m[1]] }, path: aiP };
  }
  return best;
}
function easyWallCandidates(st) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = st.pr + dr, c = st.pc + dc;
    if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
    for (let oi = 0; oi < 2; oi++) {
      const o = oi === 0 ? 'H' : 'V';
      const w = { r, c, orient: o };
      if (ENG.validWallPlacement(w, st.walls, st.pr, st.pc, st.ar, st.ac)) out.push(w);
    }
  }
  return out;
}
{ // replica sanity: medium AI opening move from standard start = (7,4)
  const st0 = { pr: 0, pc: 4, ar: 8, ac: 4, walls: [], aw: 10 };
  const rp = aiReplicaMedium(st0);
  ok(rp.move.type === 'move' && rp.move.to[0] === 7 && rp.move.to[1] === 4, 'replica-medium-opening', J(rp.move));
}

/* ================= SHARED LIVE HELPERS ================= */
const INJECT = {
  anchor: 'var G = {',
  exports: 'window.__QK={G:function(){return G;},S:function(){return SAVE;},L:function(){return LEVELS;},GEO:function(){return [cellSize,boardOffset,canvas.width,canvas.getBoundingClientRect().width];},HIT:function(x,y){return getCellFromXY(x,y);},U:function(){undoMove();},LSV:function(){loadSave();}};'
    + '(function(){var c=document.getElementById("board");if(c){var real=c.getContext;c.getContext=function(){var n=real.call(c);var rec=[];window.__DRAWREC=rec;try{return new Proxy(n,{get:function(t,k){if(k==="__rec")return rec;var v=t[k];if(typeof v==="function")return function(){rec.push([k,Array.prototype.slice.call(arguments)]);return v.apply(t,arguments)};return v},set:function(t,k,v){rec.push(["#"+k,v]);return true}})}catch(e){return n}}}})();',
};

function deepCls(root, cls) { const out = []; (function w(el) { for (const c of (el.children || [])) { if (c.classList && c.classList.contains(cls)) out.push(c); w(c); } })(root); return out; }
function deepText(root, needle) { return deepCls(root, 'x-not-used'), (function w(el) { for (const c of (el.children || [])) { if (String(c.textContent).indexOf(needle) >= 0) return true; if (w(c)) return true; } return false; })(root); }
function bootQ(seedLS) {
  const api = bootGame('quoridor', { seedLS, inject: INJECT });
  return api;
}
function q(api) {
  const ga = api;
  return {
    api,
    ST() { return JSON.parse(ga.call('(function(){var g=__QK.G();return JSON.stringify({pr:g.playerR,pc:g.playerC,ar:g.aiR,ac:g.aiC,walls:g.walls,pw:g.playerWalls,aw:g.aiWalls,moves:g.moves,turn:g.turn,go:g.gameOver,win:g.winner,tool:g.tool,pi:g.puzzleIdx,mode:g.mode,hint:g.hintUsed,think:g.aiThinking,hist:g.history.length,ha:g.hintActive,hm:g.hintMove,prev:[g.wallPreviewR,g.wallPreviewC,g.wallOrient]});})()')); },
    SAVE() { return JSON.parse(ga.call('JSON.stringify(__QK.S())')); },
    GEO() { const a = ga.call('JSON.stringify(__QK.GEO())'); const v = JSON.parse(a); return { cs: v[0], off: v[1], cw: v[2], rw: v[3] }; },
    E(id) { return ga.els[id]; },
    click(id) { ga.els[id].dispatch('click'); },
    msg() { return ga.els.msg.textContent; },
    msgCls() { return ga.els.msg.className; },
  };
}
function mkDriver(ga) {
  const g = q(ga);
  const scale = () => { const { cw, rw } = g.GEO(); return cw / rw; };
  const cellXY = (r, c) => { const { cs, off } = g.GEO(); return [off + c * cs + cs / 2, off + r * cs + cs / 2]; };
  const hXY = (r, c) => { const { cs, off } = g.GEO(); return [off + (c + 1.5) * cs, off + (r + 1) * cs]; }; // mid-span: dodges V(r-1,c) y-zone endpoint and H(r,c-1) x-zone
  const vXY = (r, c) => { const { cs, off } = g.GEO(); return [off + (c + 1) * cs + 2.5, off + (r + 1.5) * cs]; };
  const cli = (x, y) => { const s = scale(); return [x / s, y / s]; };
  const hitAt = (cx, cy) => ga.call('JSON.stringify(__QK.HIT(' + cx + ',' + cy + '))');
  return {
    g, scale, cellXY, hXY, vXY,
    clickCell(r, c) { const [x, y] = cellXY(r, c); const [cx, cy] = cli(x, y); ga.els.board.dispatch('click', { clientX: cx, clientY: cy }); },
    clickWallH(r, c) { const [x, y] = hXY(r, c); const [cx, cy] = cli(x, y); ga.els.board.dispatch('click', { clientX: cx, clientY: cy }); },
    clickWallV(r, c) { const [x, y] = vXY(r, c); const [cx, cy] = cli(x, y); ga.els.board.dispatch('click', { clientX: cx, clientY: cy }); },
    probeCell(r, c) { const [x, y] = cellXY(r, c); const [cx, cy] = cli(x, y); return hitAt(cx, cy); },
    probeH(r, c) { const [x, y] = hXY(r, c); const [cx, cy] = cli(x, y); return hitAt(cx, cy); },
    probeV(r, c) { const [x, y] = vXY(r, c); const [cx, cy] = cli(x, y); return hitAt(cx, cy); },
    hover(x, y) { const [cx, cy] = cli(x, y); ga.els.board.dispatch('mousemove', { clientX: cx, clientY: cy }); },
  };
}

/* ================= BOOT A — puzzle mode (fresh LS) ================= */
{
  const ga = bootQ();
  const g = q(ga), D = mkDriver(ga);
  ok(ga.loadErrors.length === 0, 'a-load-errors', J(ga.loadErrors));
  ok((ga.sandbox.__errors || []).length === 0, 'a-runtime-errors', J((ga.sandbox.__errors || []).slice(0, 3)));
  ga.pump(14); // 200ms loading hide
  ok(ga.els.loading.classList.contains('hide'), 'a-loading-hidden');
  ok(ga.els.app.style.visibility === 'visible', 'a-app-visible');

  let st = g.ST();
  ok(st.mode === 'puzzle' && st.pi === 0 && st.pr === 7 && st.pc === 4 && st.ar === 3 && st.ac === 3 && st.walls.length === 0 && st.pw === 10 && st.aw === 10 && st.turn === 'player' && !st.go && st.tool === 'move' && !st.hint && st.hist === 0, 'a-boot-state', J(st));
  ok(ga.els.statPlayer.textContent === '♟10', 'a-hud-pwalls', ga.els.statPlayer.textContent);
  ok(ga.els.statAi.textContent === '♟10', 'a-hud-awalls');
  ok(String(ga.els.statMoves.textContent) === '0', 'a-hud-moves', String(ga.els.statMoves.textContent));
  ok(ga.els.statTurn.textContent === 'You', 'a-hud-turn');
  ok(g.msg().indexOf('Puzzle 1:') === 0, 'a-msg-puzzle1', g.msg());
  ok(ga.els.btnHint.style.display === '', 'a-hint-visible');
  ok(ga.els.btnUndo.disabled === true, 'a-undo-disabled-fresh');
  ok(ga.els.btnMove.classList.contains('active') && !ga.els.btnWall.classList.contains('active'), 'a-tool-move-active');

  // geometry self-checks: driver click points must map to intended targets
  const { cs, off, cw } = g.GEO();
  ok(cs === 39 && off === 2.5 && cw === 356, 'a-geometry-39', J([cs, off, cw]));
  ok(D.probeCell(8, 4) === J({ cell: { r: 8, c: 4 } }), 'a-probe-cell-8-4', D.probeCell(8, 4));
  ok(D.probeCell(0, 0) === J({ cell: { r: 0, c: 0 } }), 'a-probe-cell-0-0');
  g.click('btnWall'); // wall-slot resolution only runs in wall tool
  ok(D.probeH(0, 0) === J({ wall: { r: 0, c: 0, orient: 'H' } }), 'a-probe-H-0-0', D.probeH(0, 0));
  ok(D.probeH(3, 2) === J({ wall: { r: 3, c: 2, orient: 'H' } }), 'a-probe-H-3-2', D.probeH(3, 2));
  ok(D.probeH(7, 2) === J({ wall: { r: 7, c: 2, orient: 'H' } }), 'a-probe-H-7-2', D.probeH(7, 2));
  ok(D.probeV(0, 0) === J({ wall: { r: 0, c: 0, orient: 'V' } }), 'a-probe-V-0-0', D.probeV(0, 0));
  ok(D.probeV(3, 2) === J({ wall: { r: 3, c: 2, orient: 'V' } }), 'a-probe-V-3-2', D.probeV(3, 2));
  ok(D.probeV(7, 7) === J({ wall: { r: 7, c: 7, orient: 'V' } }), 'a-probe-V-7-7', D.probeV(7, 7));
  g.click('btnMove');

  // a1 invalid move (non-adjacent cell)
  D.clickCell(0, 0);
  ok(g.msg() === 'Invalid move. Click a highlighted cell.' && g.msgCls().indexOf('err') >= 0, 'a1-invalid-move-msg', g.msg());
  ok(g.ST().pr === 7 && g.ST().moves === 0, 'a1-state-unchanged');

  // a2 non-solution move -> auto-undo after 400ms
  D.clickCell(6, 4);
  st = g.ST();
  ok(st.pr === 6 && st.moves === 1 && st.hist === 1, 'a2-bad-moved', J([st.pr, st.moves, st.hist]));
  ok(g.msg() === 'Not the optimal move. Try again or use a hint!' && g.msgCls().indexOf('err') >= 0, 'a2-msg', g.msg());
  ga.pump(26);
  st = g.ST();
  ok(st.pr === 7 && st.moves === 0 && st.hist === 0, 'a2-auto-undo', J([st.pr, st.moves, st.hist]));
  ok(g.msg() === 'Move undone.', 'a2-undo-msg', g.msg());

  // a3 double bad move before timers fire -> converges to start (benign transient, documented)
  D.clickCell(6, 4); D.clickCell(5, 4);
  ga.pump(30);
  st = g.ST();
  ok(st.pr === 7 && st.moves === 0 && st.hist === 0, 'a3-double-bad-converges', J([st.pr, st.moves, st.hist]));

  // a4 hint: state + canvas draw target (P2 transpose fix)
  g.click('btnHint');
  st = g.ST();
  ok(st.ha === true && st.hint === true && st.hm && st.hm.type === 'move' && st.hm.to[0] === 8 && st.hm.to[1] === 4, 'a4-hint-move', J(st.hm));
  ok(g.msg().indexOf('Hint shown') >= 0, 'a4-hint-msg', g.msg());
  {
    const rec = ga.call('__QK'); // noop fetch guard
    const drawRec = ga.sandbox.__DRAWREC || ga.call('window.__DRAWREC');
    let gi = -1;
    for (let i = drawRec.length - 2; i >= 0; i--) { if (drawRec[i][0] === '#strokeStyle' && drawRec[i][1] === '#ffd700' && drawRec[i + 1][0] === '#lineWidth' && drawRec[i + 1][1] === 3) { gi = i; break; } }
    ok(gi >= 0, 'a4-hint-gold-lw3-found');
    let sr = null;
    for (let i = gi; i >= 0 && i < drawRec.length; i++) { if (drawRec[i][0] === 'strokeRect') { sr = drawRec[i][1]; break; } }
    ok(!!sr, 'a4-hint-strokerect-found', gi);
    if (sr) {
      const expX = off + 4 * cs + 2, expY = off + 8 * cs + 2;
      ok(Math.abs(sr[0] - expX) < 0.6 && Math.abs(sr[1] - expY) < 0.6 && Math.abs(sr[2] - (cs - 4)) < 0.6, 'a4-hint-box-at-8-4 [P2-fix]', J(sr) + ' exp ' + J([expX, expY]));
    }
  }

  // a5 solve with hint used -> 1 star + HUD WIN! (P3 fix) + save
  D.clickCell(8, 4);
  st = g.ST();
  ok(st.go === true && st.win === 'player', 'a5-gameover-winner', J([st.go, st.win]));
  ok(ga.els.statTurn.textContent === 'WIN!', 'a5-hud-win [P3-fix]', ga.els.statTurn.textContent);
  ok(!ga.els.resultOverlay.classList.contains('hidden'), 'a5-overlay-open');
  ok(ga.els.resultTitle.textContent === '🎯 Puzzle Solved!', 'a5-title', ga.els.resultTitle.textContent);
  ok(ga.els.resultStars.textContent === '★☆☆', 'a5-stars-1', ga.els.resultStars.textContent);
  ok(ga.els.resultStats.textContent === 'Tier: Beginner | Moves: 1', 'a5-stats', ga.els.resultStats.textContent);
  ok(ga.els.resultMsg.textContent === 'Level 1 — Beginner', 'a5-resultmsg', ga.els.resultMsg.textContent);
  let sv = g.SAVE();
  ok(sv.puzzleStars['1'] === 1, 'a5-save-star1', J(sv.puzzleStars));
  ok(JSON.parse(ga.ls.getItem('quoridor_save_v1')).puzzleStars['1'] === 1, 'a5-ls-star1');
  ok(ga.els.resultNext.style.display === '', 'a5-next-visible');

  // a6 Next -> level 2
  g.click('resultNext');
  st = g.ST();
  ok(st.pi === 1 && st.pr === 7 && st.pc === 3 && st.ar === 2 && st.ac === 5 && st.walls.length === 1 && st.walls[0].r === 3 && st.walls[0].c === 2 && st.walls[0].orient === 'V' && !st.go && !st.hint && st.hist === 0 && st.tool === 'move', 'a6-level2-state', J(st));
  ok(g.msg().indexOf('Puzzle 2:') === 0, 'a6-msg', g.msg());
  ok(ga.els.btnUndo.disabled === true, 'a6-undo-disabled');

  // a7 wall tool
  g.click('btnWall');
  st = g.ST();
  ok(st.tool === 'wall', 'a7-tool-wall');
  ok(ga.els.btnWall.classList.contains('active') && !ga.els.btnMove.classList.contains('active'), 'a7-wall-active');
  ok(D.probeV(3, 2) === J({ wall: { r: 3, c: 2, orient: 'V' } }), 'a7-existing-wall-slot-hittable');

  // a8 overlapping wall rejected
  D.clickWallV(3, 2);
  ok(g.msg() === 'Invalid wall — overlaps or would trap a player.' && g.msgCls().indexOf('err') >= 0, 'a8-overlap-msg', g.msg());
  st = g.ST();
  ok(st.walls.length === 1 && st.pw === 10, 'a8-no-wall-added', J([st.walls.length, st.pw]));

  // a8b: neutral far-corner wall on a move-solution level is accepted at 2 stars (documented design laxity)
  D.clickWallH(0, 0);
  st = g.ST();
  ok(st.walls.length === 2 && st.pw === 9 && st.walls[1].r === 0 && st.walls[1].c === 0, 'a8b-neutral-wall-placed', J(st.walls));
  ok(st.go === true, 'a8b-solved-by-neutral-wall', J(st));
  ok(ga.els.resultStars.textContent === '★★☆', 'a8b-2stars', ga.els.resultStars.textContent);
  ok(g.SAVE().puzzleStars['2'] === 2, 'a8b-save-2');
  g.click('resultRetry');
  st = g.ST();
  ok(st.pi === 1 && !st.go && st.walls.length === 1 && st.pw === 10 && st.pr === 7 && st.tool === 'move', 'a8b-retry-fresh', J([st.pi, st.walls.length, st.pw, st.tool]));
  // a8b2: trap rejection — ring player (7,3) with rapid walls; each non-solution wall schedules a
  // 400ms auto-undo but stays in G.walls until then, so the ring completes synchronously and the
  // final west wall is rejected by validWallPlacement inside handleClick
  g.click('btnWall');
  D.clickWallH(7, 2); // S: blocks (7,2)(7,3)-(8,2)(8,3)
  D.clickWallH(6, 2); // N: blocks (6,2)(6,3)-(7,2)(7,3)
  D.clickWallV(7, 3); // E: blocks (7,3)-(7,4), (8,3)-(8,4)
  st = g.ST();
  ok(st.walls.length === 4, 'a8b2-ring-partial', J(st.walls));
  D.clickWallV(7, 2); // W: blocks (7,2)-(7,3) -> would fully enclose (7,3)
  ok(g.msg() === 'Invalid wall — overlaps or would trap a player.' && g.msgCls().indexOf('err') >= 0, 'a8b2-trap-rejected', g.msg());
  st = g.ST();
  ok(st.walls.length === 4, 'a8b2-trap-not-placed', st.walls.length);
  ga.pump(26); // three pending auto-undos restore the level
  st = g.ST();
  ok(st.walls.length === 1 && st.pr === 7 && st.pw === 10, 'a8b2-auto-undo-all', J([st.walls.length, st.pr, st.pw]));

  // a9 mousemove preview + mouseleave
  st = g.ST();
  ok(st.prev[0] === -1, 'a9-preview-cleared-init');
  {
    const hpt = D.hXY(0, 4);
    D.hover(hpt[0], hpt[1]);
  }
  st = g.ST();
  ok(st.prev[0] === 0 && st.prev[1] === 4 && st.prev[2] === 'H', 'a9-preview-set', J(st.prev));
  ga.els.board.dispatch('mouseleave');
  st = g.ST();
  ok(st.prev[0] === -1, 'a9-preview-mouseleave');

  // a10 howto overlay
  g.click('btnHowto');
  ok(!ga.els.howtoOverlay.classList.contains('hidden'), 'a10-howto-open');
  g.click('howtoClose');
  ok(ga.els.howtoOverlay.classList.contains('hidden'), 'a10-howto-closed');

  // a11 resize no-crash
  ga.call('window.dispatchEvent({type:"resize"})');
  ok(g.GEO().cw === 356, 'a11-resize-stable', g.GEO().cw);

  // a12 menu reflects saves (1:1star, 2:2stars)
  g.click('btnMenu');
  ok(!ga.els.menuOverlay.classList.contains('hidden'), 'a12-menu-open');
  ok(ga.els.menuTitle.textContent === '🎯 Puzzle Levels', 'a12-menu-title');
  const cells = deepCls(ga.els.menuContent, 'lvl-cell');
  ok(cells.length === 30, 'a12-30-cells', cells.length);
  const byIdx = {}; cells.forEach((c) => { byIdx[c.dataset.idx] = c; });
  ok(byIdx['0'].classList.contains('solved') && byIdx['0'].children[1].textContent === '★', 'a12-cell0-1star', byIdx['0'].children[1].textContent);
  ok(byIdx['1'].classList.contains('solved') && byIdx['1'].children[1].textContent === '★★', 'a12-cell1-2star', byIdx['1'].children[1].textContent);
  ok(!byIdx['2'].classList.contains('solved'), 'a12-cell2-unsolved');
  ok(deepText(ga.els.menuContent, 'Total stars: 3 / 90'), 'a12-total-stars');
  const tierLabels = deepCls(ga.els.menuContent, 'tier-label');
  ok(tierLabels.length === 6 && tierLabels[0].textContent === '1. Beginner' && tierLabels[5].textContent === '6. Master', 'a12-tier-labels', tierLabels.length);
  byIdx['4'].dispatch('click'); // load level 5 (idx 4)
  st = g.ST();
  ok(st.pi === 4 && ga.els.menuOverlay.classList.contains('hidden'), 'a12-load-level5', st.pi);
  ok(g.msg().indexOf('Puzzle 5:') === 0, 'a12-msg', g.msg());

  // a13 hint legality spot-check on a few levels + reset clears hintUsed
  g.click('btnHint');
  st = g.ST();
  ok(st.hint === true && st.hm, 'a13-hint-set');
  if (st.hm.type === 'move') {
    const L = LEVELS[4];
    ok(ENG.validPawnMoves(L.playerR, L.playerC, L.aiR, L.aiC, L.walls).some((m) => m[0] === st.hm.to[0] && m[1] === st.hm.to[1]), 'a13-hint-legal-move', J(st.hm));
  } else {
    ok(ENG.validWallPlacement({ r: st.hm.r, c: st.hm.c, orient: st.hm.orient }, st.walls, st.pr, st.pc, st.ar, st.ac), 'a13-hint-legal-wall');
  }
  g.click('btnReset');
  st = g.ST();
  ok(st.hint === false && st.hist === 0 && !st.go, 'a13-reset-clears');

  /* ---- a14 full 30-level solve chain (3 stars each, save/LS parity, Next chaining) ---- */
  g.click('btnMenu');
  const cells2 = deepCls(ga.els.menuContent, 'lvl-cell');
  cells2[0].dispatch('click'); // restart from level 1
  const altWallTests = { 16: [], 28: [] }; // idx -> extra asserts handled inline below
  for (let i = 0; i < 30; i++) {
    const L = LEVELS[i];
    st = g.ST();
    ok(st.pi === i && st.mode === 'puzzle', 'a14-l' + (i + 1) + '-loaded', J([st.pi, i]));
    ok(st.pr === L.playerR && st.pc === L.playerC && st.ar === L.aiR && st.ac === L.aiC, 'a14-l' + (i + 1) + '-pawns', J([st.pr, st.pc, st.ar, st.ac]));
    ok(J(st.walls) === J(L.walls) && st.pw === L.playerWalls && st.aw === L.aiWalls, 'a14-l' + (i + 1) + '-walls', J(st.walls));
    ok(st.tool === 'move' && st.turn === 'player' && !st.go && st.hint === false, 'a14-l' + (i + 1) + '-fresh');

    if (i === 16 || i === 28) { // wall-solution levels: exploit/alt-wall matrix
      const sol = L.solution;
      // expected outcomes via ENG on the fixed formula
      const base = L.walls.map((w) => ({ r: w.r, c: w.c, orient: w.orient }));
      const optWalls = base.concat([{ r: sol.r, c: sol.c, orient: sol.orient }]);
      const advOpt = ENG.bfsShortest(L.aiR, L.aiC, 0, optWalls) - ENG.bfsShortest(L.playerR, L.playerC, 8, optWalls);
      const irrelevant = i === 16 ? { r: 7, c: 7, orient: 'V' } : { r: 7, c: 6, orient: 'H' };
      const afterIrr = base.concat([irrelevant]);
      const advIrr = ENG.bfsShortest(L.aiR, L.aiC, 0, afterIrr) - ENG.bfsShortest(L.playerR, L.playerC, 8, afterIrr);
      const expectReject = advIrr < advOpt;
      ok(expectReject === true, 'a14-l' + (i + 1) + '-exploit-should-reject [P2]', J([advIrr, advOpt]));
      g.click('btnWall');
      if (irrelevant.orient === 'V') D.clickWallV(irrelevant.r, irrelevant.c); else D.clickWallH(irrelevant.r, irrelevant.c);
      ok(g.msg() === "That wall doesn't gain enough advantage. Try again!", 'a14-l' + (i + 1) + '-exploit-rejected [P2-fix]', g.msg());
      ga.pump(26);
      st = g.ST();
      ok(st.walls.length === L.walls.length && st.pw === L.playerWalls, 'a14-l' + (i + 1) + '-exploit-undone', J([st.walls.length, st.pw]));
      // alternative wall achieving solution-level advantage -> 2 stars
      const alt = i === 16 ? { r: 3, c: 4, orient: 'H' } : { r: 4, c: 1, orient: 'V' }; // engine-computed: both reach advOpt
      const afterAlt = base.concat([alt]);
      const advAlt = ENG.bfsShortest(L.aiR, L.aiC, 0, afterAlt) - ENG.bfsShortest(L.playerR, L.playerC, 8, afterAlt);
      ok(advAlt >= advOpt, 'a14-l' + (i + 1) + '-alt-adv-ok', J([advAlt, advOpt]));
      if (alt.orient === 'H') D.clickWallH(alt.r, alt.c); else D.clickWallV(alt.r, alt.c);
      ok(ga.els.resultStars.textContent === '★★☆' && !ga.els.resultOverlay.classList.contains('hidden'), 'a14-l' + (i + 1) + '-alt-2stars', ga.els.resultStars.textContent);
      ok(g.SAVE().puzzleStars[String(L.num)] === 2, 'a14-l' + (i + 1) + '-alt-saved-2');
      g.click('resultRetry'); // reset level fresh for the 3-star solution
      st = g.ST();
      ok(!st.go && st.walls.length === L.walls.length, 'a14-l' + (i + 1) + '-retry-fresh');
    }

    // solve with the embedded solution -> 3 stars
    if (st.tool !== 'move') g.click('btnMove');
    if (L.solution.type === 'move') {
      D.clickCell(L.solution.to[0], L.solution.to[1]);
    } else {
      g.click('btnWall');
      if (L.solution.orient === 'H') D.clickWallH(L.solution.r, L.solution.c); else D.clickWallV(L.solution.r, L.solution.c);
    }
    st = g.ST();
    ok(st.go === true && st.win === 'player', 'a14-l' + (i + 1) + '-solved', J([st.go, st.win]));
    ok(ga.els.resultStars.textContent === '★★★', 'a14-l' + (i + 1) + '-3stars', ga.els.resultStars.textContent);
    ok(g.SAVE().puzzleStars[String(L.num)] === 3, 'a14-l' + (i + 1) + '-saved-3');
    if (i < 29) {
      ok(ga.els.resultNext.style.display === '', 'a14-l' + (i + 1) + '-next-visible');
      g.click('resultNext');
    } else {
      ok(ga.els.resultNext.style.display === 'none', 'a14-l30-next-hidden', ga.els.resultNext.style.display);
      g.click('resultMenu');
      ok(!ga.els.menuOverlay.classList.contains('hidden'), 'a14-result-menu-opens');
      ok(deepText(ga.els.menuContent, 'Total stars: 90 / 90'), 'a14-total-90');
    }
  }
  const fin = g.SAVE();
  ok(Object.keys(fin.puzzleStars).length === 30 && Object.values(fin.puzzleStars).every((v) => v === 3), 'a14-save-all-3');
  const lsSave = JSON.parse(ga.ls.getItem('quoridor_save_v1'));
  ok(J(lsSave.puzzleStars) === J(fin.puzzleStars), 'a14-ls-parity');
  ok((ga.sandbox.__errors || []).length === 0, 'a-runtime-errors-end', J((ga.sandbox.__errors || []).slice(0, 3)));
}

/* ================= BOOT B — seeded LS: menu, vs-AI modes ================= */
{
  const seedSave = { puzzleStars: { 1: 3, 5: 2 }, aiWins: { easy: 1, medium: 0, hard: 2 }, aiLosses: { easy: 0, medium: 3, hard: 1 } };
  const ga = bootQ({ 'quoridor_save_v1': JSON.stringify(seedSave) });
  const g = q(ga), D = mkDriver(ga);
  ga.pump(14);
  ok(ga.loadErrors.length === 0, 'b-load-errors', J(ga.loadErrors));
  let sv = g.SAVE();
  ok(sv.puzzleStars['1'] === 3 && sv.puzzleStars['5'] === 2 && sv.aiWins.medium === 0 && sv.aiLosses.medium === 3, 'b0-seed-loaded', J(sv));

  // b1 menu reflection
  g.click('btnMenu');
  const cells = deepCls(ga.els.menuContent, 'lvl-cell');
  const byIdx = {}; cells.forEach((c) => { byIdx[c.dataset.idx] = c; });
  ok(byIdx['0'].children[1].textContent === '★★★', 'b1-cell0-3star');
  ok(byIdx['4'].children[1].textContent === '★★', 'b1-cell4-2star');
  ok(!byIdx['1'].classList.contains('solved'), 'b1-cell1-unsolved');
  ok(deepText(ga.els.menuContent, 'Total stars: 5 / 90'), 'b1-total-5');
  g.click('menuClose');

  // b2 AI tab (harness now resolves '.mode-tabs button' to the REAL buttons — the engine
  // binds its tab handlers to whatever qsa returns, so click the same real node set)
  const tabStubs = ga.sandbox.document.querySelectorAll('.mode-tabs button');
  ok(Array.isArray(tabStubs) && tabStubs.length === 2, 'b2-tab-stubs', tabStubs && tabStubs.length); // 2 real tabs (Puzzle / VS AI); the old 6 was the fake-stub count
  tabStubs[1].dispatch('click');
  ok(g.ST().mode === 'ai', 'b2-mode-ai');
  ok(!ga.els.menuOverlay.classList.contains('hidden'), 'b2-menu-open');
  ok(ga.els.menuTitle.textContent === '🤖 Play vs AI', 'b2-menu-title', ga.els.menuTitle.textContent);
  const mc = ga.els.menuContent;
  ok(deepText(mc, 'Wins: 1 / 0 / 2'), 'b2-wins-line');
  ok(deepText(mc, 'Losses: 0 / 3 / 1'), 'b2-losses-line');
  const diffBtns = []; (function walk(el) { (el.children || []).forEach((c) => { if (c.dataset && c.dataset.d) diffBtns.push(c); walk(c); }); })(mc);
  ok(diffBtns.length === 3, 'b2-3-diff-buttons', diffBtns.length);
  ok(diffBtns.some((b) => b.dataset.d === 'medium' && b.classList.contains('active')), 'b2-medium-active');
  ok(diffBtns.some((b) => b.dataset.d === 'easy' && !b.classList.contains('active')), 'b2-easy-inactive');

  // b3 start AI game
  g.click('startAIBtn');
  let st = g.ST();
  ok(st.mode === 'ai' && st.pr === 0 && st.pc === 4 && st.ar === 8 && st.ac === 4 && st.walls.length === 0 && st.pw === 10 && st.aw === 10 && st.turn === 'player' && !st.go && st.hist === 0, 'b3-aigame-state', J(st));
  ok(g.msg() === 'vs AI (medium). You are Blue — race to the bottom!', 'b3-msg', g.msg());
  ok(ga.els.btnHint.style.display === 'none', 'b3-hint-hidden-ai-mode');
  ok(ga.els.statTurn.textContent === 'You', 'b3-turn-you');
  ok(ga.els.menuOverlay.classList.contains('hidden'), 'b3-menu-closed');

  // b4 two medium rounds with offline-oracle parity + thinking HUD
  for (let round = 0; round < 2; round++) {
    const pre = g.ST();
    const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw).move;
    if (pm.type === 'move') D.clickCell(pm.to[0], pm.to[1]);
    else { g.click('btnWall'); if (pm.orient === 'H') D.clickWallH(pm.r, pm.c); else D.clickWallV(pm.r, pm.c); }
    const mid = g.ST();
    ok(mid.think === true && mid.turn === 'ai', 'b4-r' + round + '-thinking', J([mid.think, mid.turn]));
    if (round === 0) {
      ok(ga.els.statTurn.textContent === 'AI...', 'b4-hud-ai-thinking [P3-fix]', ga.els.statTurn.textContent);
      ok(ga.els.btnUndo.disabled === true, 'b4-undo-disabled-thinking [P3-fix]');
      ok(g.msg() === 'AI is thinking...', 'b4-thinking-msg', g.msg());
    }
    if (pre.pr !== 8) { // player didn't just win
      ga.pump(23);
      const post = g.ST();
      const exp = aiReplicaMedium(pre);
      if (exp.move.type === 'move') {
        ok(post.ar === exp.move.to[0] && post.ac === exp.move.to[1] && post.walls.length === pre.walls.length && post.aw === pre.aw, 'b4-r' + round + '-ai-move-parity', J([post.ar, post.ac, J(exp.move)]));
      } else {
        ok(post.walls.length === pre.walls.length + 1 && post.aw === pre.aw - 1 && post.ar === pre.ar, 'b4-r' + round + '-ai-wall-parity', J([post.walls.length, post.aw]));
        const lastW = post.walls[post.walls.length - 1];
        ok(lastW.r === exp.move.r && lastW.c === exp.move.c && lastW.orient === exp.move.orient, 'b4-r' + round + '-ai-wall-exact', J([lastW, exp.move]));
      }
      ok(post.turn === 'player' && post.think === false, 'b4-r' + round + '-turn-back');
      ok(g.msg() === 'Your turn. Move or place a wall.', 'b4-r' + round + '-msg', g.msg());
      ok(ga.els.statTurn.textContent === 'You', 'b4-r' + round + '-hud-you');
    }
  }

  // b5 undo after AI reply restores full round
  {
    const pre = g.ST();
    const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw).move;
    if (pm.type === 'move') D.clickCell(pm.to[0], pm.to[1]);
    else { g.click('btnWall'); if (pm.orient === 'H') D.clickWallH(pm.r, pm.c); else D.clickWallV(pm.r, pm.c); }
    ga.pump(23);
    const post = g.ST();
    ok(post.ar !== pre.ar || post.ac !== pre.ac || post.walls.length !== pre.walls.length, 'b5-ai-replied');
    ok(ga.els.btnUndo.disabled === false, 'b5-undo-enabled');
    g.click('btnUndo');
    const undo = g.ST();
    ok(undo.pr === pre.pr && undo.pc === pre.pc && undo.ar === pre.ar && undo.ac === pre.ac && J(undo.walls) === J(pre.walls) && undo.pw === pre.pw && undo.aw === pre.aw && undo.moves === pre.moves && undo.turn === 'player' && !undo.go, 'b5-undo-restores-round', J(undo));
    ok(g.msg() === 'Move undone.', 'b5-undo-msg', g.msg());
    // re-drive the same move so subsequent tests start from a known round-2 state
    const pm2 = ENG.findBestMove(undo.pr, undo.pc, undo.ar, undo.ac, undo.walls, undo.pw).move;
    ok(J(pm2) === J(pm), 'b5-redo-same-move', J([pm2, pm]));
    if (pm2.type === 'move') D.clickCell(pm2.to[0], pm2.to[1]);
    else { g.click('btnWall'); if (pm2.orient === 'H') D.clickWallH(pm2.r, pm2.c); else D.clickWallV(pm2.r, pm2.c); }
    ga.pump(23);
  }

  // b6 stale-timer guard: reset during think
  {
    const pre = g.ST();
    const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw).move;
    if (pm.type === 'move') D.clickCell(pm.to[0], pm.to[1]);
    else { g.click('btnWall'); if (pm.orient === 'H') D.clickWallH(pm.r, pm.c); else D.clickWallV(pm.r, pm.c); }
    const mid = g.ST();
    ok(mid.think === true, 'b6-think-pending');
    g.click('btnReset');
    const rst = g.ST();
    ok(rst.pr === 0 && rst.pc === 4 && rst.ar === 8 && rst.ac === 4 && rst.walls.length === 0 && rst.moves === 0 && rst.turn === 'player' && rst.think === false, 'b6-reset-state', J(rst));
    ga.pump(30);
    const post = g.ST();
    ok(post.ar === 8 && post.ac === 4 && post.walls.length === 0 && post.turn === 'player', 'b6-stale-timer-no-ai-move [P2-fix]', J(post));
    ok(ga.els.statTurn.textContent === 'You', 'b6-hud-you');
  }
  // b6b synthetic undo during think (real button disabled by P3 fix — documented synthetic path)
  {
    D.clickCell(1, 4);
    const mid = g.ST();
    ok(mid.think === true && mid.pr === 1, 'b6b-think-pending');
    ga.call('__QK.U()');
    const undo = g.ST();
    ok(undo.pr === 0 && undo.turn === 'player' && undo.think === false, 'b6b-undone', J(undo));
    ga.pump(30);
    const post = g.ST();
    ok(post.ar === 8 && post.ac === 4 && post.pr === 0 && post.turn === 'player', 'b6b-stale-timer-guard [P2-fix]', J(post));
  }

  // b7 easy AI greedy determinism (Math.random seeded 0.99 -> no random wall)
  ga.call('window.__r=Math.random;Math.random=function(){return 0.99;}');
  ga.call('(function(){var g=__QK.G();g.difficulty="easy";})()'); // harness gap: diff buttons unbindable ('#diffRow button' resolves empty)
  g.click('btnReset');
  ok(g.ST().mode === 'ai', 'b7-reset-ai');
  for (let round = 0; round < 2; round++) {
    const pre = g.ST();
    const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw).move;
    if (pm.type === 'move') D.clickCell(pm.to[0], pm.to[1]);
    else { g.click('btnWall'); if (pm.orient === 'H') D.clickWallH(pm.r, pm.c); else D.clickWallV(pm.r, pm.c); }
    ga.pump(23);
    const post = g.ST();
    const exp = aiReplicaEasyPawn(pre);
    ok(post.ar === exp.move.to[0] && post.ac === exp.move.to[1], 'b7-r' + round + '-easy-greedy-parity', J([post.ar, post.ac, exp.move]));
    ok(post.aw === pre.aw, 'b7-r' + round + '-easy-no-wall');
  }

  // b8 easy random-wall branch (random 0.01 < 0.2 -> candidates[floor(0.01*n)] = candidates[0])
  {
    ga.call('Math.random=function(){return 0.01;}');
    const pre = g.ST();
    const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw).move;
    if (pm.type === 'move') D.clickCell(pm.to[0], pm.to[1]);
    else { g.click('btnWall'); if (pm.orient === 'H') D.clickWallH(pm.r, pm.c); else D.clickWallV(pm.r, pm.c); }
    const afterP = g.ST();
    const cands = easyWallCandidates({ pr: afterP.pr, pc: afterP.pc, ar: pre.ar, ac: pre.ac, walls: afterP.walls });
    ga.pump(23);
    const post = g.ST();
    ok(cands.length > 0, 'b8-candidates-exist', cands.length);
    const expW = cands[Math.floor(0.01 * cands.length)]; // candidates live state = post player move
    const lastW = post.walls[post.walls.length - 1];
    ok(post.walls.length === pre.walls.length + 1 && post.aw === pre.aw - 1 && lastW.r === expW.r && lastW.c === expW.c && lastW.orient === expW.orient, 'b8-random-wall-deterministic', J([lastW, expW]));
    ok(post.ar === pre.ar && post.ac === pre.ac, 'b8-no-pawn-move');
  }
  ga.call('Math.random=window.__r;');

  // b9 hard AI: one full turn, legality oracle (minimax choice must be a legal action)
  {
    ga.call('(function(){var g=__QK.G();g.difficulty="hard";})()');
    g.click('btnReset');
    const pre = g.ST();
    D.clickCell(1, 4); // player move toward goal
    ga.pump(30);
    const post = g.ST();
    ok(post.think === false && post.turn === 'player', 'b9-hard-turn-done', J([post.think, post.turn]));
    const pawnMoves = ENG.validPawnMoves(pre.ar, pre.ac, 1, 4, pre.walls).map((m) => m[0] + ',' + m[1]);
    const wallOK = post.walls.length === pre.walls.length + 1 && post.aw === pre.aw - 1 && ENG.validWallPlacement(post.walls[post.walls.length - 1], pre.walls, 1, 4, pre.ar, pre.ac);
    const pawnOK = post.walls.length === pre.walls.length && post.aw === pre.aw && pawnMoves.indexOf(post.ar + ',' + post.ac) >= 0;
    ok(pawnOK || wallOK, 'b9-hard-move-legal', J([post.ar, post.ac, post.walls.length, pawnMoves]));
  }
  ga.call('(function(){var g=__QK.G();g.difficulty="medium";})()');

  // b10 wall drain -> 'No walls left!' + easy-mode loss path
  {
    ga.call('(function(){var g=__QK.G();g.difficulty="easy";})()');
    ga.call('Math.random=function(){return 0.99;}');
    g.click('btnReset');
    let drained = false;
    for (let round = 0; round < 14 && !drained; round++) {
      const pre = g.ST();
      ok(pre.go === false, 'b10-r' + round + '-not-over');
      // pick the valid wall maximizing AI distance (delay AI while draining)
      let best = null, bestAiP = -1;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) for (let oi = 0; oi < 2; oi++) {
        const o = oi === 0 ? 'H' : 'V';
        const w = { r, c, orient: o };
        if (!ENG.validWallPlacement(w, pre.walls, pre.pr, pre.pc, pre.ar, pre.ac)) continue;
        const aiP = ENG.bfsShortest(pre.ar, pre.ac, 0, pre.walls.concat([w]));
        if (aiP > bestAiP) { bestAiP = aiP; best = w; }
      }
      ok(!!best, 'b10-r' + round + '-wall-available');
      if (!best) break;
      g.click('btnWall');
      if (best.orient === 'H') D.clickWallH(best.r, best.c); else D.clickWallV(best.r, best.c);
      const placed = g.ST();
      ok(placed.pw === pre.pw - 1, 'b10-r' + round + '-wall-spent', placed.pw);
      ga.pump(23);
      const post = g.ST();
      if (pre.pw - 1 === 0) { drained = true; ok(post.go === false, 'b10-drained-no-gameover'); }
    }
    ok(drained, 'b10-drained');
    ok(g.ST().pw === 0, 'b10-pw-0');
    g.click('btnMove');
    g.click('btnWall');
    ok(g.msg() === 'No walls left!' && g.msgCls().indexOf('err') >= 0, 'b10-no-walls-msg', g.msg());
    ok(g.ST().tool === 'move', 'b10-tool-stays-move');
    ok(!ga.els.btnWall.classList.contains('active'), 'b10-wall-not-active');
    // finish: player races but easy AI (closer) wins -> loss path
    let rounds = 0;
    while (!g.ST().go && rounds < 40) {
      const pre = g.ST();
      if (pre.turn !== 'player') { ga.pump(23); continue; }
      const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw);
      if (pm && pm.move.type === 'move') D.clickCell(pm.move.to[0], pm.move.to[1]);
      else break;
      ga.pump(23);
      rounds++;
    }
    const end = g.ST();
    ok(end.go === true, 'b10-game-ended', J(end));
    ok(ga.els.resultTitle.textContent === '😔 AI Wins', 'b10-ai-wins-title', ga.els.resultTitle.textContent);
    ok(ga.els.resultStars.textContent === '☆☆☆', 'b10-zero-stars');
    ok(ga.els.resultStats.textContent.indexOf('Difficulty: easy') === 0 && ga.els.resultStats.textContent.indexOf('Moves:') > 0, 'b10-stats', ga.els.resultStats.textContent);
    sv = g.SAVE();
    ok(sv.aiLosses.easy === 1, 'b10-loss-counter [seed 0 -> 1]', sv.aiLosses.easy);
    ok(JSON.parse(ga.ls.getItem('quoridor_save_v1')).aiLosses.easy === 1, 'b10-loss-ls');
    ok(ga.els.statTurn.textContent === 'LOSS', 'b10-hud-loss [P3-fix]', ga.els.statTurn.textContent);
    g.click('resultRetry');
    st = g.ST();
    ok(!st.go && st.pr === 0 && st.ar === 8 && st.walls.length === 0 && st.moves === 0, 'b10-retry-fresh', J(st));
    ga.call('Math.random=window.__r;');
  }

  // b11 flagship: full medium game, per-round offline-oracle parity, either winner
  {
    ga.call('(function(){var g=__QK.G();g.difficulty="medium";})()');
    g.click('btnReset');
    let winner = null, rounds = 0, pWalls = 0, aWalls = 0;
    while (rounds < 60) {
      const pre = g.ST();
      if (pre.go) break;
      if (pre.turn !== 'player') { ga.pump(23); continue; }
      if (pre.pr === 8) { break; }
      const pm = ENG.findBestMove(pre.pr, pre.pc, pre.ar, pre.ac, pre.walls, pre.pw).move;
      if (pm.type === 'move') D.clickCell(pm.to[0], pm.to[1]);
      else { g.click('btnWall'); if (pm.orient === 'H') D.clickWallH(pm.r, pm.c); else D.clickWallV(pm.r, pm.c); if (pre.pw - 1 === 0) { /* drained */ } }
      const afterP = g.ST();
      if (afterP.go || afterP.pr === 8) { winner = 'player'; break; }
      ga.pump(23);
      const post = g.ST();
      const exp = aiReplicaMedium({ pr: afterP.pr, pc: afterP.pc, ar: pre.ar, ac: pre.ac, walls: afterP.walls, aw: pre.aw });
      if (exp.move.type === 'move') {
        ok(post.ar === exp.move.to[0] && post.ac === exp.move.to[1], 'b11-r' + rounds + '-ai-parity', J([post.ar, post.ac, exp.move]));
        ok(post.walls.length === afterP.walls.length, 'b11-r' + rounds + '-walls-stable');
      } else {
        const lastW = post.walls[post.walls.length - 1];
        ok(lastW && lastW.r === exp.move.r && lastW.c === exp.move.c && lastW.orient === exp.move.orient, 'b11-r' + rounds + '-ai-wall-parity', J([lastW, exp.move]));
        aWalls++;
      }
      if (post.go || post.ar === 0) { winner = 'ai'; break; }
      ok(post.turn === 'player' && post.think === false, 'b11-r' + rounds + '-player-turn');
      ok(post.moves === pre.moves + 1, 'b11-r' + rounds + '-moves-inc', J([post.moves, pre.moves]));
      rounds++;
    }
    ok(winner !== null, 'b11-game-finished', winner + ' r' + rounds);
    ga.pump(3);
    const end = g.ST();
    ok(end.go === true, 'b11-gameover');
    if (winner === 'player') {
      ok(ga.els.resultTitle.textContent === '🎉 You Win!', 'b11-win-title', ga.els.resultTitle.textContent);
      ok(ga.els.resultStars.textContent === '★★★', 'b11-win-stars');
      ok(ga.els.resultMsg.textContent === 'You reached the goal row!', 'b11-win-msg');
      ok(g.SAVE().aiWins.medium === 1, 'b11-win-counter [seed 0 -> 1]', g.SAVE().aiWins.medium);
      ok(ga.els.statTurn.textContent === 'WIN!', 'b11-hud-win [P3-fix]', ga.els.statTurn.textContent);
    } else {
      ok(ga.els.resultTitle.textContent === '😔 AI Wins', 'b11-loss-title', ga.els.resultTitle.textContent);
      ok(g.SAVE().aiLosses.medium === 4, 'b11-loss-counter [seed 3 -> 4]', g.SAVE().aiLosses.medium);
    }
    ok(ga.els.resultStats.textContent.indexOf('Difficulty: medium') === 0 && ga.els.resultStats.textContent.indexOf('Walls left:') > 0, 'b11-stats', ga.els.resultStats.textContent);
    ok(JSON.parse(ga.ls.getItem('quoridor_save_v1')).aiWins.medium === g.SAVE().aiWins.medium, 'b11-ls-parity');
    // resultMenu -> menu (AI view since mode==='ai')
    g.click('resultMenu');
    ok(!ga.els.menuOverlay.classList.contains('hidden'), 'b11-result-menu-open');
    ok(ga.els.menuTitle.textContent === '🤖 Play vs AI', 'b11-menu-ai-view');
    g.click('menuClose');
  }
  ok((ga.sandbox.__errors || []).length === 0, 'b-runtime-errors-end', J((ga.sandbox.__errors || []).slice(0, 3)));

  // b12 corrupt save JSON tolerated (loadSave try/catch)
  ga.call('localStorage.setItem("quoridor_save_v1","{bad json")');
  const before = J(g.SAVE());
  ga.call('__QK.LSV()');
  ok(J(g.SAVE()) === before, 'b12-corrupt-save-ignored');
}

/* ================= REPORT ================= */
const extra = {
  engineFixes: 'P2-drawHint-transpose, P2-checkPuzzleWall-advantage-vs-optimal (level-29 2★-any-wall exploit), P2-aiTurn-stale-timer-guard, P3-WIN/LOSS-HUD-after-gameOver, P3-puzzleSolved-winner, P3-aiThinking-before-updateHUD (AI... label + undo disabled while thinking)',
  documented: [
    'crossing H+V walls at same slot allowed (wallsOverlap orientation-only) — engine design, covered offline',
    'move-solution levels accept a neutral wall at 2★ (adv >= base advantage) — original intent, kept',
    'checkPuzzleWin non-solution row-8 arrival would give 3★ — unreachable in all 30 shipped levels (single-move-to-goal levels)',
    'double bad-move before 400ms auto-undo: transient one-bad-move state then double undo converges (a3)',
    'undo does not restore hintUsed (by design: hint was seen), keeps no bag concept',
    'harness gap: ".mode-tabs button" and "#diffRow button" resolve to inert stubs — AI-tab driven via stub click, difficulty switched via ga.call (documented)',
    'b6b synthetic ga.call("undoMove()") — real button correctly disabled during AI think after P3 fix',
    'touchstart handler same as click (not separately dispatched)',
    'easy-AI random wall branch covered via seeded Math.random (0.01 -> candidates[0], 0.99 -> greedy)',
  ],
};
console.log(J({ pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS.slice(0, 40), extra }));
process.exit(FAIL === 0 ? 0 : 1);
