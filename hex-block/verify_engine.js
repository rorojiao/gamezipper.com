// hex-block engine verifier — vm harness, real input paths only.
// Engine is an IIFE with private state: every assertion is DOM/LS-observable
// (slot classList empty/invalid, score/best displays, gameover overlay, LS best).
// Random pieces are made deterministic by seeding ctx.Math.random (LCG/constant
// precedent from solitaire/coin-machine verifiers): 0.02 -> always the 1-cell
// piece; planned 6-value sequences for controlled deals (T-piece round, and the
// final 3x 5-cell-line deal that cannot fit the deliberately-holed board).
// Wins/placements flow through the engine's own pointer drag path:
// slot pointerdown -> document pointermove at target cell px -> document
// pointerup -> ghost -> placePiece -> checkLines -> clear/score/game-over.
'use strict';
const path = require('path');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }

// ---------- geometry mirror (input coordinate computation only) ----------
const BOARD_RADIUS = 4;
function hexDist(q, r) { return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2; }
const CELLS = [];
for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) if (hexDist(q, r) <= 4) CELLS.push([q, r]);
const key = (q, r) => q + ',' + r;

const g = harness.bootGame('hex-block');
ck('boot: no load errors', errs(g).length === 0, errs(g).join(' | '));

// initAudio has no try/catch and pointerdown calls it — real browsers always have
// AudioContext, so provide the standard minimal stub.
g.call("window.AudioContext=function(){return{state:'running',resume:function(){},currentTime:0,destination:{},createOscillator:function(){return{type:'',frequency:{value:0},connect:function(){},start:function(){},stop:function(){}}},createGain:function(){return{gain:{value:0,setValueAtTime:function(){},exponentialRampToValueAtTime:function(){},linearRampToValueAtTime:function(){}},connect:function(){}}}}}");

// deterministic pieces: floor(0.02*35)=0 -> 1-cell piece; floor(0.02*12)=0
g.call('Math.random=function(){return 0.02}');

const cvs = el(g, 'board-canvas');
const W = cvs.width, CH = cvs.height;
const hexSize = Math.max(12, Math.min(W * 0.92 / (Math.sqrt(3) * 10), CH * 0.95 / 16));
const CX = W / 2, CY = CH / 2;
function cellPx(q, r) { return { x: hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r) + CX, y: hexSize * 1.5 * r + CY }; }

// ---------- input helpers (real event paths) ----------
function drag(slotIdx, q, r) {
  const p = cellPx(q, r);
  el(g, 'slot-' + slotIdx).dispatch('pointerdown', { type: 'pointerdown', clientX: 30, clientY: 600, preventDefault() {} });
  g.sandbox.document.dispatch('pointermove', { type: 'pointermove', clientX: p.x, clientY: p.y, preventDefault() {} });
  g.sandbox.document.dispatch('pointerup', { type: 'pointerup', clientX: p.x, clientY: p.y, preventDefault() {} });
  g.pump(1);
}
function slotEmpty(i) { return el(g, 'slot-' + i).classList.contains('empty'); }
function click(id) { const e = el(g, id); if (typeof e.onclick === 'function') e.onclick({ preventDefault() {} }); else e.dispatch('click', { type: 'click', preventDefault() {} }); }
function scoreShown() { return +String(el(g, 'score-display').textContent); }
// displayScore animates toward score in the rAF loop (15%/frame) — pump until settled
function waitScore(exp) {
  for (let i = 0; i < 250 && scoreShown() !== exp; i++) g.pump(1);
  return scoreShown();
}
function enqueueDeal(seq) { // seq = [pieceIdx,...] x3 -> 6 randoms consumed by dealPieces
  const vals = [];
  for (const p of seq) vals.push((p + 0.5) / 35, 0.5 / 12);
  g.call('(function(){var q=' + JSON.stringify(vals) + ';Math.random=function(){return q.length?q.shift():0.02}})()');
}

// ---------- boot checks ----------
ck('boot: canvas 480x640', W === 480 && CH === 640, W + 'x' + CH);
ck('boot: 3 slots dealt', !slotEmpty(0) && !slotEmpty(1) && !slotEmpty(2));
ck('boot: score 0', scoreShown() === 0);
ck('boot: best 0', String(el(g, 'best-display').textContent) === '0');
ck('boot: overlay hidden', el(g, 'gameover-overlay').classList.contains('hidden'));

// sound toggle
click('btn-sound');
ck('sound: mutes', String(el(g, 'btn-sound').textContent) === 'Muted');
click('btn-sound');
ck('sound: unmutes', String(el(g, 'btn-sound').textContent) === 'Sound');

// fresh deterministic game
click('btn-new');
ck('newgame: overlay still hidden', el(g, 'gameover-overlay').classList.contains('hidden'));
g.pump(2);

const mirror = new Set(); // filled cells
let expScore = 0;
function place(slotIdx, q, r, pts) {
  drag(slotIdx, q, r);
  mirror.add(key(q, r));
  expScore += pts;
}

// ---------- round 1: mechanics ----------
place(0, 0, 0, 10);
ck('R1P1: slot0 emptied', slotEmpty(0));
ck('R1P1: score 10', waitScore(10) === 10, String(scoreShown()));
drag(1, 0, 0); // occupied -> rejected
ck('R1P2: occupied cell rejected', !slotEmpty(1) && waitScore(10) === 10);
place(1, 1, 0, 10);
enqueueDeal([20, 0, 0]); // T-piece + 2 singles for round 2
place(2, -1, 0, 10);
ck('R1: score 30', waitScore(30) === 30, String(scoreShown()));
g.pump(3);
ck('R1: auto-deal refilled all slots', !slotEmpty(0) && !slotEmpty(1) && !slotEmpty(2));

// ---------- round 2: T-piece (4 cells) + off-board anchor ----------
drag(0, 0, 2); // T at (0,2): PIECE_DEFS[20] offsets {(0,0),(0,1),(0,2),(-1,2)} -> cells (0,2),(0,3),(0,4),(-1,4)
mirror.add(key(0, 2)); mirror.add(key(0, 3)); mirror.add(key(0, 4)); mirror.add(key(-1, 4));
expScore += 40;
ck('R2P1: T-piece placed (4 cells, +40)', waitScore(70) === 70, String(scoreShown()));
drag(1, 5, 0); // anchor off-board
ck('R2P2: off-board anchor rejected', !slotEmpty(1) && waitScore(70) === 70);
place(1, 2, 0, 10);
place(2, 3, 0, 10);
ck('R2: score 90', waitScore(90) === 90, String(scoreShown()));

// ---------- round 3: finish row r=0 minus one ----------
place(0, -2, 0, 10);
place(1, -3, 0, 10);
place(2, 4, 0, 10);
ck('R3: score 120', waitScore(120) === 120, String(scoreShown()));

// ---------- round 4: row clear + clearing-gate ----------
place(0, -4, 0, 10); // 9th cell of row r=0 -> line clear +9*20*1
for (let qq = -4; qq <= 4; qq++) mirror.delete(key(qq, 0)); // clear removed the whole row
expScore += 180;
// during the 250ms clear chain startDrag is gated by `clearing`. Test the gate
// BEFORE any pumping: waitScore would run the display animation ~37 frames and
// blow past the 15-frame chain window, un-gating the drag under test.
drag(1, 2, 0);
ck('R4: drag blocked during clear chain', !slotEmpty(1));
ck('R4P1: row r=0 cleared (+10 place +180 bonus)', waitScore(310) === 310, String(scoreShown()));
g.pump(16); // chain timeout 250ms -> else branch (slots 1,2 still held: no re-deal)
place(1, 0, 0, 10); // row r=0 cells are free again — proves the clear
ck('R4: cleared cells reusable', slotEmpty(1) && waitScore(320) === 320, String(scoreShown()));
place(2, 1, 0, 10);
ck('R4: score 330', waitScore(330) === 330, String(scoreShown()));
g.pump(3);

// ---------- phase D: play to a forced game over ----------
// Holes H must hit every line (q-const, r-const, s=q+r-const) so no line ever
// completes while filling, and kill every vertical 5-window so the final deal of
// 3x 5-cell lines (PIECE_DEFS[27]) fits nowhere.
const filled = new Set(mirror);
function buildH() {
  const H = new Set();
  const rowKeys = [];
  for (let v = -4; v <= 4; v++) rowKeys.push(['r', v], ['q', v], ['s', v]);
  const inRow = (c, rk) => rk[0] === 'r' ? c[1] === rk[1] : rk[0] === 'q' ? c[0] === rk[1] : (c[0] + c[1]) === rk[1];
  const cellOf = k => k.split(',').map(Number);
  const rowHit = rk => [...H].some(k2 => inRow(cellOf(k2), rk));
  for (const rk of rowKeys) {
    if (rowHit(rk)) continue;
    const cand = CELLS.filter(c => inRow(c, rk) && !filled.has(key(c[0], c[1])) && !H.has(key(c[0], c[1])));
    if (!cand.length) return null;
    // prefer a cell that also hits other unhit rows
    let best = cand[0], bestHits = -1;
    for (const c of cand) {
      let hits = 0;
      for (const rk2 of rowKeys) if (inRow(c, rk2) && !rowHit(rk2)) hits++;
      if (hits > bestHits) { best = c; bestHits = hits; }
    }
    H.add(key(best[0], best[1]));
  }
  // kill every 5-vert window: cells (q, r-2..r+2) all on board
  const wins = [];
  for (const [q, r] of CELLS) {
    let ok = true;
    for (let d = -2; d <= 2; d++) if (hexDist(q, r + d) > 4) ok = false;
    if (ok) {
      const cells = [];
      for (let d = -2; d <= 2; d++) cells.push(key(q, r + d));
      wins.push(cells);
    }
  }
  for (const w of wins) {
    if (w.some(k => H.has(k) || filled.has(k))) continue; // already dead
    const free = w.find(k => !H.has(k) && !filled.has(k));
    if (!free) continue; // cannot happen (window fully filled = dead anyway)
    H.add(free);
  }
  return H;
}
let H = buildH();
ck('phaseD: hole set built', H !== null && H.size > 0);
// pad |fills| so total placements land on a deal boundary (3rd slot of a round)
const placedSoFar = 12;
let fills = CELLS.filter(c => !filled.has(key(c[0], c[1])) && !H.has(key(c[0], c[1]))).map(c => key(c[0], c[1]));
if ((placedSoFar + fills.length) % 3 !== 0) {
  // move cells from fills into H until the last fill is a round-final placement
  while ((placedSoFar + fills.length) % 3 !== 0 && fills.length) { H.add(fills.pop()); }
}
ck('phaseD: fill count lands on deal boundary', (placedSoFar + fills.length) % 3 === 0 && fills.length > 0, String(fills.length));
// sanity via mirror: no complete line during/after fills, no free 5-window after
function lineComplete(m, q, r) {
  // row r=const along q
  for (let qq = -4; qq <= 4; qq++) if (hexDist(qq, r) <= 4 && !m.has(key(qq, r))) return false;
  return true;
}
ck('phaseD: no q-line completes after fills', !fills.length || (function () {
  const m = new Set(filled); fills.forEach(k => m.add(k));
  for (let r = -4; r <= 4; r++) { let full = true; for (let q = -4; q <= 4; q++) if (hexDist(q, r) <= 4 && !m.has(key(q, r))) { full = false; break; } if (full) return false; }
  return true;
})());
ck('phaseD: no free 5-window after fills', (function () {
  const m = new Set(filled); fills.forEach(k => m.add(k));
  for (const [q, r] of CELLS) {
    let ok = true;
    for (let d = -2; d <= 2; d++) if (hexDist(q, r + d) > 4 || m.has(key(q, r + d))) { ok = false; break; }
    if (ok) return false;
  }
  return true;
})());

let slotCursor = 0; // after R4 all three slots were filled; placements continue 0,1,2...
for (let i = 0; i < fills.length; i++) {
  const [q, r] = fills[i].split(',').map(Number);
  if (i === fills.length - 1) enqueueDeal([27, 27, 27]); // final deal: 3x 5-cell lines that fit nowhere
  drag(slotCursor, q, r);
  slotCursor = (slotCursor + 1) % 3;
  // settle well past the 250ms chain window so no later drag is ever `clearing`-gated
  g.pump(20);
}
g.pump(10);
expScore += 10 * fills.length;
ck('phaseD: all fills placed, score exact', waitScore(expScore) === expScore, scoreShown() + ' vs ' + expScore);
ck('phaseD: game over overlay shown', !el(g, 'gameover-overlay').classList.contains('hidden'));
ck('phaseD: final score matches', +String(el(g, 'final-score').textContent) === expScore, String(el(g, 'final-score').textContent));
ck('phaseD: New Best flagged', String(el(g, 'final-best').textContent) === 'New Best!', String(el(g, 'final-best').textContent));
ck('phaseD: best persisted to LS', g.ls.getItem('hexblock_v1_best') === String(expScore), String(g.ls.getItem('hexblock_v1_best')));
ck('phaseD: best display updated', String(el(g, 'best-display').textContent) === String(expScore));

// ---------- retry ----------
click('btn-retry');
g.pump(3);
ck('retry: overlay hidden', el(g, 'gameover-overlay').classList.contains('hidden'));
ck('retry: score reset', scoreShown() === 0);
ck('retry: 3 slots dealt', !slotEmpty(0) && !slotEmpty(1) && !slotEmpty(2));
drag(0, 0, 0);
ck('retry: placement works after restart', slotEmpty(0) && waitScore(10) === 10, String(scoreShown()));

// ---------- boot 2: returning player ----------
const g2 = harness.bootGame('hex-block', { seedLS: Object.assign({}, g.ls._m) });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
ck('boot2: best carried from LS', String(el(g2, 'best-display').textContent) === String(expScore), String(el(g2, 'best-display').textContent));
ck('boot2: slots dealt', !el(g2, 'slot-0').classList.contains('empty'));

// ---------- summary ----------
const extra = { fills: fills.length, holes: H.size, finalScore: expScore };
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
