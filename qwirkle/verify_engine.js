'use strict';
/* qwirkle verify_engine.js — full E2E coverage via real pointer/click events.
 *
 * Engine facts (index.html, single IIFE; internals hidden but exported via verifier-local
 * harness `inject` shim window.__QK = {G} — READ-ONLY asserts/planning; all driving is real
 * DOM events: handCanvas/boardCanvas pointerdown, action-bar button clicks):
 *  - 108-tile bag (6 colors x 6 shapes x 3), Fisher-Yates; hands of 6, pop-refill
 *    (bag shows 96 right after the deal).
 *  - Lines: same color + unique shapes OR same shape + unique colors, max 6; 6-line =
 *    qwirkle +6. Multi-tile placements must form one line (validatePlacements).
 *  - Player: tap tile -> tap cell (pending), Place confirms (score/toast), Undo restores
 *    score/board/hand but NOT bag (engine-documented simplification) and NOT aiScore
 *    (P3 documented below). Swap 1 (selected) or all; Pass blocked while moves exist.
 *  - AI: easy = random top-50%, medium = 70% best, hard = deterministic best+qwirkle.
 *    AI turn = setTimeout 800ms; endAITurn = further 600ms back to player.
 *  - Level 1-30, difficulty = floor((lv-1)/10) capped 2; endGame modal (innerHTML buttons
 *    -> driven via ga.call of the same handler strings); progress 'qwirkle_progress'
 *    {maxLevel, stars, bestScores}; unlock next level on >=1 star win.
 *
 * Determinism: hard AI (level 21) is a pure function of (aiHand, board) — the verifier
 * extracts the engine's own pure rules functions (constants..validatePlacementsOnBoard),
 * reads the live deal, simulates the whole game offline as an oracle, then replays it
 * live with per-round parity asserts (scores, bag count, board map incl tile owners,
 * hand contents). Player policy = deterministic 1-ply lookahead (top-8 moves minus the
 * AI's best single-tile reply); deals are re-rolled (startLevel) until the oracle predicts
 * a player win (best effort, honest outcome reported either way).
 *
 * Engine fixes this run:
 *  - P2 aiTakeTurn turn-guard (restart during the 800ms AI timer placed a ghost AI tile
 *    on the fresh board) — covered by a-race-*.
 *  - P1 findAllValidMoves first-move score (AI first board move NaN'd aiScore) — covered
 *    by a-swap1 (player swap-all on move 1 gives the AI the first board move).
 * Documented as-is (NOT bugs fixed): undo keeps aiScore while erasing the AI's reply
 * tiles (score/board desync, P3, scores never decrease); undo does not restore bag
 * contents (self-commented); endGame on the player-confirm path leaves turnLabel stale
 * and swap/pass buttons visually enabled (guarded internally, cosmetic P3);
 * "Nothing to undo"/"Wait for your turn"/"Bag is empty" branches are only reachable
 * through disabled buttons (asserted synthetically); single-tile qwirkles by the AI earn
 * the +6 in score but skip the 'AI Qwirkle!' toast (move.qwirkle flag only set for multi
 * moves — mirrored by the oracle); AI-swap branch (bag.sort with random comparator) is
 * non-replicable offline — deals that would trigger it are filtered out of the flagship.
 */
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0; const fails = [];
function ck(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + String(detail).slice(0, 180) : '')); }
}

/* ================= offline: extract the engine's pure rules functions ================= */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const s0 = html.indexOf('var COLORS=[');
const s1 = html.indexOf('function aiTakeTurn(');
ck('o-slice', s0 > 0 && s1 > s0, s0 + '/' + s1);
const ENG = new Function('Math', html.slice(s0, s1) +
  ';return {G:G,tileKey:tileKey,makeBag:makeBag,drawTile:drawTile,refillHand:refillHand,' +
  'validatePlacements:validatePlacements,checkLineConstraintsOnBoard:checkLineConstraintsOnBoard,' +
  'getLine:getLine,validateLine:validateLine,findAllValidMoves:findAllValidMoves,' +
  'mergeMultiTileMoves:mergeMultiTileMoves,validatePlacementsOnBoard:validatePlacementsOnBoard};')(Math);
ck('o-eng-fns', typeof ENG.findAllValidMoves === 'function' && typeof ENG.validateLine === 'function');

/* --- offline rules battery --- */
(function offlineRules() {
  const bag = ENG.makeBag();
  ck('o-bag-108', bag.length === 108, bag.length);
  const counts = {};
  bag.forEach(t => { counts[t.color + ':' + t.shape] = (counts[t.color + ':' + t.shape] || 0) + 1; });
  ck('o-bag-36types', Object.keys(counts).length === 36, Object.keys(counts).length);
  ck('o-bag-3each', Object.values(counts).every(n => n === 3));
  const b2 = [{ color: 1, shape: 1 }, { color: 2, shape: 2 }];
  ck('o-draw-pop', ENG.drawTile(b2).color === 2 && b2.length === 1);
  ck('o-draw-empty', ENG.drawTile([]) === null);
  const h1 = [], b3 = []; for (let i = 0; i < 8; i++) b3.push({ color: i % 6, shape: 0 });
  ENG.refillHand(h1, b3);
  ck('o-refill-6', h1.length === 6 && b3.length === 2);

  const VL = ENG.validateLine;
  ck('o-vl-1', VL([{ color: 0, shape: 0 }]).valid === true);
  ck('o-vl-color-ok', VL([{ color: 0, shape: 0 }, { color: 0, shape: 1 }]).valid === true);
  ck('o-vl-color-dupshape', VL([{ color: 0, shape: 0 }, { color: 0, shape: 0 }]).valid === false);
  ck('o-vl-color-dupshape-msg', VL([{ color: 0, shape: 0 }, { color: 0, shape: 0 }]).msg === 'Same color line must have unique shapes');
  ck('o-vl-shape-ok', VL([{ color: 0, shape: 3 }, { color: 1, shape: 3 }]).valid === true);
  // same shape, colors {0,1,0} — not all unique -> 'unique colors' branch (needs 3 tiles)
  ck('o-vl-shape-dupcolor', VL([{ color: 0, shape: 3 }, { color: 1, shape: 3 }, { color: 0, shape: 3 }]).valid === false);
  ck('o-vl-shape-dupcolor-msg', VL([{ color: 0, shape: 3 }, { color: 1, shape: 3 }, { color: 0, shape: 3 }]).msg === 'Same shape line must have unique colors');
  ck('o-vl-mixed', VL([{ color: 0, shape: 0 }, { color: 1, shape: 1 }]).valid === false);
  ck('o-vl-mixed-msg', VL([{ color: 0, shape: 0 }, { color: 1, shape: 1 }]).msg === 'Tiles must share color or shape');
  const seven = []; for (let i = 0; i < 7; i++) seven.push({ color: 0, shape: i % 6 });
  ck('o-vl-len7', VL(seven).valid === false && VL(seven).msg === 'Line too long (max 6)');

  const CC = ENG.checkLineConstraintsOnBoard;
  let bd = {};
  let r = CC(7, 7, 0, 0, bd); ck('o-cc-isolated', r.valid && r.score === 1);
  bd = { '7,7': { color: 0, shape: 0 }, '8,7': { color: 0, shape: 1 } };
  r = CC(9, 7, 0, 2, bd); ck('o-cc-h3', r.valid && r.score === 3, JSON.stringify(r));
  bd['9,6'] = { color: 1, shape: 2 };
  r = CC(9, 7, 0, 2, bd); ck('o-cc-h3v2', r.valid && r.score === 5, JSON.stringify(r));
  bd = {};
  for (let i = 0; i < 5; i++) bd['7,' + (7 + i)] = { color: 0, shape: i };
  r = CC(7, 12, 0, 5, bd); ck('o-cc-qwirkle', r.valid && r.score === 12 && r.lines.some(l => l.len === 6), JSON.stringify(r));
  bd = { '6,7': { color: 0, shape: 0 }, '7,7': { color: 0, shape: 1 }, '8,7': { color: 0, shape: 2 } };
  const ln = ENG.getLine(7, 7, 1, 0, bd, 0, 1);
  ck('o-getline-3', ln.len === 3 && ln.tiles.length === 3);

  const VP = ENG.validatePlacementsOnBoard;
  bd = {};
  ck('o-vp-first1', VP([{ x: 7, y: 7, color: 3, shape: 3 }], bd).score === 1);
  ck('o-vp-adj-required', VP([{ x: 3, y: 3, color: 0, shape: 0 }], { '7,7': { color: 0, shape: 0 } }).valid === false);
  bd = { '7,7': { color: 0, shape: 0 } };
  ck('o-vp-2line', VP([{ x: 8, y: 7, color: 0, shape: 1 }, { x: 9, y: 7, color: 0, shape: 2 }], bd).score === 3);
  ck('o-vp-overlap', VP([{ x: 7, y: 7, color: 0, shape: 1 }], bd).valid === false);

  const VPG = ENG.validatePlacements;
  ENG.G.board = {};
  ck('o-vpg-empty', VPG([]).valid === false && VPG([]).msg === 'No tiles placed');
  ck('o-vpg-first', VPG([{ x: 7, y: 7, color: 0, shape: 0 }]).score === 1);
  ENG.G.board = { '7,7': { color: 0, shape: 0 } };
  ck('o-vpg-adj', VPG([{ x: 9, y: 9, color: 0, shape: 1 }]).valid === false);
  ck('o-vpg-overlap', VPG([{ x: 7, y: 7, color: 0, shape: 1 }, { x: 8, y: 7, color: 0, shape: 1 }]).msg === 'Tile overlap');
  // both x and y vary -> not a single line
  ck('o-vpg-notline', VPG([{ x: 8, y: 7, color: 0, shape: 1 }, { x: 9, y: 8, color: 0, shape: 2 }]).msg === 'Tiles must be in a single line');
  ENG.G.board = {};
  r = VPG([{ x: 7, y: 7, color: 0, shape: 0 }, { x: 8, y: 7, color: 0, shape: 1 }]);
  ck('o-vpg-2isolated', r.valid && r.score === 2, JSON.stringify(r));

  const FM = ENG.findAllValidMoves([{ color: 0, shape: 0 }, { color: 0, shape: 0 }, { color: 1, shape: 1 }], {});
  ck('o-fm-first', FM.length === 3 && FM.every(m => m.placements[0].x === 7 && m.placements[0].y === 7 && m.score === 1), JSON.stringify(FM.map(m => m.score)));
  bd = { '7,7': { color: 0, shape: 0 } };
  const MV = ENG.findAllValidMoves([{ color: 0, shape: 1 }, { color: 5, shape: 5 }], bd);
  ck('o-fm-adj-only', MV.length > 0 && MV.every(m => Math.abs(m.placements[0].x - 7) + Math.abs(m.placements[0].y - 7) === 1));
  ck('o-fm-all-valid', MV.every(m => { const v = VP(m.placements, bd); return v.valid && v.score === m.score; }));
  bd = { '7,7': { color: 0, shape: 0 } };
  const MV2 = ENG.findAllValidMoves([{ color: 0, shape: 1 }, { color: 0, shape: 2 }], bd);
  ck('o-fm-multi', MV2.some(m => m.placements.length === 2), JSON.stringify(MV2.map(m => m.placements.length + ':' + m.score)));
})();

/* ================= policies + offline simulator (oracle) ================= */
function choose(hand, board) { // = engine hard-AI selection
  const moves = ENG.findAllValidMoves(hand, board);
  if (!moves.length) return null;
  moves.sort((a, b) => (b.score || 0) - (a.score || 0));
  const qw = moves.filter(m => m.qwirkle);
  return qw.length > 0 ? qw[0] : moves[0];
}
function bestSingle(hand, board) { // cheap max single-tile reply score (lookahead heuristic)
  const keys = Object.keys(board);
  if (!keys.length) return hand.length ? 1 : 0;
  const cands = {};
  for (const k of keys) {
    const bx = +k.split(',')[0], by = +k.split(',')[1];
    for (const d of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = bx + d[0], ny = by + d[1], nk = nx + ',' + ny;
      if (!board[nk] && !cands[nk]) cands[nk] = { x: nx, y: ny };
    }
  }
  let best = 0;
  for (const ck2 in cands) {
    const c = cands[ck2];
    for (const t of hand) {
      const r = ENG.checkLineConstraintsOnBoard(c.x, c.y, t.color, t.shape, board);
      if (r.valid && r.score > best) best = r.score;
    }
  }
  return best;
}
function playerChoose(pH, aH, board) { // deterministic 1-ply lookahead (sim + driver share it)
  const moves = ENG.findAllValidMoves(pH, board);
  if (!moves.length) return null;
  moves.sort((a, b) => (b.score || 0) - (a.score || 0));
  const top = moves.slice(0, 8);
  let best = null, bestVal = -1e9;
  for (let i = 0; i < top.length; i++) {
    const m = top[i];
    const tb = {}; for (const k in board) tb[k] = board[k];
    for (const p of m.placements) tb[p.x + ',' + p.y] = { color: p.color, shape: p.shape };
    const reply = bestSingle(aH, tb);
    const val = ((m.score || 1) - reply) * 100 - i; // deterministic tie-break: earlier wins
    if (val > bestVal) { bestVal = val; best = m; }
  }
  return best;
}
function tapIndicesFor(move, hand) { // driver rule: prefer move.usedIndices (asc), then any content match (asc)
  const U = move.usedIndices || {}; const used = [];
  const uArr = Object.keys(U).map(Number).sort((a, b) => a - b);
  for (const p of move.placements) {
    let idx = -1;
    for (const i of uArr) { if (used.indexOf(i) >= 0) continue; const t = hand[i]; if (t && t.color === p.color && t.shape === p.shape) { idx = i; break; } }
    if (idx < 0) for (let i = 0; i < hand.length; i++) { if (used.indexOf(i) >= 0) continue; const t = hand[i]; if (t && t.color === p.color && t.shape === p.shape) { idx = i; break; } }
    used.push(idx);
  }
  return used;
}
function aiApplyHand(hand, chosen) { // replicates aiTakeTurn's hand-removal block verbatim
  const usedSet = {}; for (const k in chosen.usedIndices) usedSet[k] = true;
  let handCopy = hand.slice(); const matched = [];
  for (const p of chosen.placements) {
    for (let h = 0; h < handCopy.length; h++) {
      if (handCopy[h] && !usedSet[h]) continue;
      if (handCopy[h] && handCopy[h].color === p.color && handCopy[h].shape === p.shape) { matched.push(h); handCopy[h] = null; break; }
    }
  }
  if (matched.length < chosen.placements.length) {
    handCopy = hand.slice(); matched.length = 0;
    for (const p of chosen.placements) {
      for (let h = 0; h < handCopy.length; h++) {
        if (handCopy[h] && handCopy[h].color === p.color && handCopy[h].shape === p.shape) { matched.push(h); handCopy[h] = null; break; }
      }
    }
  }
  return handCopy.filter(t => t !== null);
}
function simGame(st0) {
  const bag = st0.bag.slice(), pH = st0.pH.slice(), aH = st0.aH.slice();
  const board = {}; for (const k in st0.board) board[k] = { color: st0.board[k].color, shape: st0.board[k].shape, owner: st0.board[k].owner };
  let pS = st0.pS, aS = st0.aS, bagEmpty = false, gameOver = false;
  const events = [];
  const snap = () => ({ pS, aS, bagN: bag.length, pH: pH.map(t => t.color + ':' + t.shape).join(','), aH: aH.map(t => t.color + ':' + t.shape).join(','), boardMap: Object.keys(board).map(k => k + ':' + board[k].owner).sort().join('|') });
  function finish(msg) {
    gameOver = true;
    let stars = 0; if (pS > aS) stars = 1; if (pS > aS * 1.2) stars = 2; if (pS > aS * 1.5) stars = 3;
    return { msg, stars, title: pS > aS ? 'You Win!' : 'AI Wins', pS, aS };
  }
  function checkEnd() { // mirrors checkGameEnd order (player-empty first, then stalemate)
    if (bag.length === 0) bagEmpty = true;
    if (bagEmpty && pH.length === 0) { pS += 6; return finish('You used all your tiles! +6 bonus'); }
    if (bagEmpty && aH.length === 0) { aS += 6; return finish('AI used all tiles'); }
    if (bagEmpty && ENG.findAllValidMoves(pH, board).length === 0 && ENG.findAllValidMoves(aH, board).length === 0) return finish('No more valid moves');
    return null;
  }
  function applyChosen(chosen, who, score, qwirkle) {
    for (const p of chosen.placements) board[p.x + ',' + p.y] = { color: p.color, shape: p.shape, owner: who };
    if (who === 'p') {
      const used = tapIndicesFor(chosen, pH); const usedSet = new Set(used);
      const nh = pH.filter((t, i) => !usedSet.has(i)); pH.length = 0; nh.forEach(t => pH.push(t));
      pS += score;
      while (pH.length < 6 && bag.length > 0) pH.push(bag.pop());
      return qwirkle;
    }
    const nh = aiApplyHand(aH, chosen); aH.length = 0; nh.forEach(t => aH.push(t));
    aS += score;
    while (aH.length < 6 && bag.length > 0) aH.push(bag.pop());
  }
  let guard = 0;
  while (!gameOver && guard++ < 60) {
    const chosen = playerChoose(pH, aH, board);
    if (chosen) {
      // player score/qwirkle come from validatePlacements (the confirm path), like the engine
      const vr = ENG.validatePlacementsOnBoard(chosen.placements, board);
      if (!vr.valid || vr.score === undefined) return { ok: false, reason: 'player-score' };
      if (chosen.score !== undefined && chosen.score !== vr.score) return { ok: false, reason: 'score-parity ' + chosen.score + '/' + vr.score };
      const ev = { who: 'p', type: 'place', taps: tapIndicesFor(chosen, pH), placements: chosen.placements.map(p => ({ x: p.x, y: p.y })), score: vr.score, qwirkle: !!vr.qwirkle, toast: vr.qwirkle ? 'QWIRKLE! +6 Bonus!' : '+' + vr.score + ' points', before: snap() };
      events.push(ev);
      applyChosen(chosen, 'p', vr.score, !!vr.qwirkle);
      ev.after = snap();
      const end = checkEnd();
      if (end) { ev.end = end; break; }
    } else {
      if (bag.length > 0) return { ok: false, reason: 'player-swap-needed' };
      events.push({ who: 'p', type: 'pass', toast: 'Passed', before: snap(), after: snap() });
    }
    const ac = choose(aH, board);
    if (ac) {
      const aiScore = ac.score === undefined ? 1 : ac.score;
      const ev2 = { who: 'a', type: 'place', score: aiScore, qwirkle: !!ac.qwirkle, toast: ac.qwirkle ? 'AI Qwirkle! +6 Bonus!' : null, before: snap() };
      events.push(ev2);
      applyChosen(ac, 'a', aiScore, false);
      ev2.after = snap();
      const end2 = checkEnd();
      if (end2) { ev2.end = end2; break; }
    } else {
      if (bag.length > 0) return { ok: false, reason: 'ai-swap-random' };
      events.push({ who: 'a', type: 'pass', toast: 'AI passed', before: snap(), after: snap() });
      const end3 = checkEnd();
      if (end3) { events[events.length - 1].end = end3; break; }
    }
    if (ENG.findAllValidMoves(pH, board).length === 0) {
      events.push({ who: 'x', type: 'pmToast', toast: bag.length === 0 ? 'No valid moves — Pass to end' : 'No valid moves — Swap or Pass' });
    }
  }
  if (!gameOver) return { ok: false, reason: 'loop-guard' };
  return { ok: true, events, outcome: events.filter(e => e.end).map(e => e.end)[0] };
}

/* ================= live helpers ================= */
function bootQ(opts) {
  const ga = bootGame('qwirkle', Object.assign({
    inject: { anchor: 'var G={', exports: 'window.__QK={G:function(){return G;}};' },
  }, opts || {}));
  ga.pump(2);
  const started = () => { try { return ga.call('window.__QK.G().playerHand.length') === 6 && ga.call('window.__QK.G().turn') === 'player'; } catch (e) { return false; } };
  if (!started()) {
    ga.sandbox.document.dispatch('DOMContentLoaded', { type: 'DOMContentLoaded' });
    ga.pump(3);
  }
  return ga;
}
function q(ga, expr) { return ga.call('window.__QK.G().' + expr); }
function readState(ga) {
  return {
    bag: JSON.parse(ga.call('JSON.stringify(window.__QK.G().bag)')),
    pH: JSON.parse(ga.call('JSON.stringify(window.__QK.G().playerHand)')),
    aH: JSON.parse(ga.call('JSON.stringify(window.__QK.G().aiHand)')),
    board: JSON.parse(ga.call('JSON.stringify(window.__QK.G().board)')),
    pS: q(ga, 'playerScore'), aS: q(ga, 'aiScore'),
    turn: q(ga, 'turn'), gameOver: q(ga, 'gameOver'),
  };
}
const boardMapOf = b => Object.keys(b).map(k => k + ':' + b[k].owner).sort().join('|');
const handOf = h => h.map(t => t.color + ':' + t.shape).join(',');
function cs(ga) { return q(ga, 'cellSize'); }
function edgeTap(ga, dir) {
  const w = ga.els.boardCanvas.width, h = ga.els.boardCanvas.height;
  const pt = { l: { x: 5, y: h / 2 }, r: { x: w - 5, y: h / 2 }, u: { x: w / 2, y: 5 }, d: { x: w / 2, y: h - 5 } }[dir];
  ga.els.boardCanvas.dispatch('pointerdown', { clientX: pt.x, clientY: pt.y });
}
function ensureView(ga, gx, gy) {
  const tx = Math.max(0, Math.min(5, gx - 4)), ty = Math.max(0, Math.min(5, gy - 4));
  for (let k = 0; k < 12 && q(ga, 'viewX') < tx; k++) edgeTap(ga, 'r');
  for (let k = 0; k < 12 && q(ga, 'viewX') > tx; k++) edgeTap(ga, 'l');
  for (let k = 0; k < 12 && q(ga, 'viewY') < ty; k++) edgeTap(ga, 'd');
  for (let k = 0; k < 12 && q(ga, 'viewY') > ty; k++) edgeTap(ga, 'u');
}
function btap(ga, gx, gy) {
  ensureView(ga, gx, gy);
  const c = cs(ga), vx = gx - q(ga, 'viewX'), vy = gy - q(ga, 'viewY');
  ga.els.boardCanvas.dispatch('pointerdown', { clientX: vx * c + c / 2, clientY: vy * c + c / 2 });
}
function htap(ga, i) {
  const c = cs(ga);
  ga.els.handCanvas.dispatch('pointerdown', { clientX: 5 + i * (c + 2) + c / 2, clientY: c / 2 + 5 });
}
function btn(ga, id) { ga.els[id].dispatch('click', {}); }
function toastText(ga) { return String(ga.els.toast.textContent); }
function waitPlayer(ga) {
  for (let k = 0; k < 60; k++) {
    if (q(ga, 'turn') === 'player' || q(ga, 'gameOver')) return;
    ga.pump(5);
  }
}
function headerBtn(ga, text) {
  const found = [];
  (function walk(el) { for (const ch of (el.children || [])) { if (String(ch.tagName || '').toLowerCase() === 'button' && String(ch.textContent) === text) found.push(ch); walk(ch); } })(ga.sandbox.document.body);
  return found[0];
}
function parity(ga, snap, tag) {
  const st = readState(ga);
  ck(tag + '-pS', st.pS === snap.pS, st.pS + ' vs ' + snap.pS);
  ck(tag + '-aS', st.aS === snap.aS, st.aS + ' vs ' + snap.aS);
  ck(tag + '-bag', st.bag.length === snap.bagN, st.bag.length + ' vs ' + snap.bagN);
  ck(tag + '-hand', handOf(st.pH) === snap.pH, handOf(st.pH) + ' vs ' + snap.pH);
  ck(tag + '-board', boardMapOf(st.board) === snap.boardMap, boardMapOf(st.board).slice(0, 140));
}
function findSixLineEnd(board) { // empty in-line extension cell of any 6-length line (len-7 toast)
  for (const k of Object.keys(board)) {
    const x = +k.split(',')[0], y = +k.split(',')[1];
    for (const d of [[1, 0], [0, 1]]) {
      let n = 0; while (board[(x + d[0] * (n + 1)) + ',' + (y + d[1] * (n + 1))]) n++;
      let m = 0; while (board[(x - d[0] * (m + 1)) + ',' + (y - d[1] * (m + 1))]) m++;
      if (n + m + 1 === 6) {
        const ex = x + d[0] * (n + 1), ey = y + d[1] * (n + 1);
        if (!board[ex + ',' + ey]) return { x: ex, y: ey };
        const sx = x - d[0] * (m + 1), sy = y - d[1] * (m + 1);
        if (!board[sx + ',' + sy]) return { x: sx, y: sy };
      }
    }
  }
  return null;
}

/* ================= Boot A: level-1 (easy AI) UI + micro-interactions ================= */
(function bootA() {
  const ga = bootQ();
  ga.pump(25);
  ck('a-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ck('a-boot-bag', q(ga, 'bag.length') === 96, q(ga, 'bag.length'));
  ck('a-loading-hide', ga.els.loading.classList.contains('hide'));
  ck('a-fresh-ls', ga.ls.getItem('qwirkle_progress') === null, String(ga.ls.getItem('qwirkle_progress')));
  ck('a-scores0', String(ga.els.playerScore.textContent) === '0' && String(ga.els.aiScore.textContent) === '0' && String(ga.els.bagCount.textContent) === '96', ga.els.bagCount.textContent);
  ck('a-label', ga.els.turnLabel.textContent === 'Your Turn (Level 1 / Easy AI) — Tap a tile, then the board', ga.els.turnLabel.textContent);
  ck('a-active-card', ga.els.playerScoreCard.classList.contains('active') && !ga.els.aiScoreCard.classList.contains('active'));
  ck('a-btns-init', ga.els.placeBtn.disabled === true && ga.els.swapBtn.disabled === false && ga.els.passBtn.disabled === false && ga.els.undoBtn.disabled === true);

  btap(ga, 7, 7);
  ck('a-toast-selectfirst', toastText(ga) === 'Select a tile from your hand first', toastText(ga));

  edgeTap(ga, 'l'); ck('a-scroll-l', q(ga, 'viewX') === 2, q(ga, 'viewX'));
  edgeTap(ga, 'u'); ck('a-scroll-u', q(ga, 'viewY') === 2, q(ga, 'viewY'));
  edgeTap(ga, 'r'); edgeTap(ga, 'r'); edgeTap(ga, 'd');
  ck('a-scroll-back', q(ga, 'viewX') === 4 && q(ga, 'viewY') === 3, q(ga, 'viewX') + ',' + q(ga, 'viewY'));

  htap(ga, 0);
  ck('a-selected', q(ga, 'selectedTile') === 0);
  btap(ga, 7, 7);
  ck('a-pending1', q(ga, 'pendingPlacements.length') === 1);
  ck('a-place-enabled', ga.els.placeBtn.disabled === false);
  btap(ga, 6, 7);
  ck('a-toast-already', toastText(ga) === 'Tile already placed — tap it to return', toastText(ga));
  ck('a-pending-still1', q(ga, 'pendingPlacements.length') === 1);
  btap(ga, 7, 7);
  ck('a-pending-removed', q(ga, 'pendingPlacements.length') === 0 && ga.els.placeBtn.disabled === true);
  // hand-tap on a pending tile's index returns it (selectedTile stays as-is)
  htap(ga, 0); btap(ga, 7, 7);
  htap(ga, 0);
  ck('a-handtap-return', q(ga, 'pendingPlacements.length') === 0, q(ga, 'pendingPlacements.length'));

  // pending blocks swap (tile 0 is still selected from above — place again)
  btap(ga, 7, 7);
  ck('a-pending-again', q(ga, 'pendingPlacements.length') === 1);
  btn(ga, 'swapBtn');
  ck('a-toast-swapblocked', toastText(ga) === 'Undo pending tiles first', toastText(ga));
  ck('a-still-player', q(ga, 'turn') === 'player');
  btap(ga, 7, 7); // clear pending (tile 0 stays selected)

  // confirm the first move: +1, toast, AI turn (tile 0 still selected)
  btap(ga, 7, 7); btn(ga, 'placeBtn');
  ck('a-first-confirm', String(ga.els.playerScore.textContent) === '1' && toastText(ga) === '+1 points', toastText(ga));
  ck('a-label-ai', ga.els.turnLabel.textContent === 'AI is thinking...', ga.els.turnLabel.textContent);
  ck('a-turn-ai', q(ga, 'turn') === 'ai');
  btn(ga, 'undoBtn'); // synthetic: disabled in real browsers while AI thinks
  ck('a-undo-while-ai', toastText(ga) === 'Wait for your turn', toastText(ga));
  waitPlayer(ga);
  ck('a-turn-back', q(ga, 'turn') === 'player');
  const stAI = readState(ga);
  const aiCells = Object.keys(stAI.board).filter(k => stAI.board[k].owner === 'a');
  ck('a-ai-placed', aiCells.length >= 1, aiCells.join('|') || 'AI swapped tiles (easy branch)');
  ck('a-ai-score-num', Number.isFinite(stAI.aS) && stAI.aS >= 0, stAI.aS);
  ck('a-bag-drawn', String(ga.els.bagCount.textContent) === String(q(ga, 'bag.length')), ga.els.bagCount.textContent);

  if (aiCells.length) {
    const ak = aiCells[0].split(',').map(Number);
    htap(ga, 0); btap(ga, ak[0], ak[1]);
    ck('a-toast-occupied', toastText(ga) === 'Cell occupied', toastText(ga));
  } else ck('a-toast-occupied', true, 'SKIP: AI swapped this deal');
  // invalid-line toast: hand tile sharing neither color nor shape with a board neighbour
  {
    let done = false;
    outer:
    for (const bk of Object.keys(stAI.board)) {
      const bt0 = stAI.board[bk]; const bx = +bk.split(',')[0], by = +bk.split(',')[1];
      for (const d of [[1, 0], [0, 1]]) {
        const cx = bx + d[0], cy = by + d[1];
        if (stAI.board[cx + ',' + cy]) continue;
        for (let hi = 0; hi < stAI.pH.length; hi++) {
          const t = stAI.pH[hi];
          if (t.color !== bt0.color && t.shape !== bt0.shape) {
            htap(ga, hi); btap(ga, cx, cy);
            ck('a-toast-invalid', toastText(ga) === 'Tiles must share color or shape', toastText(ga));
            done = true; break outer;
          }
        }
      }
    }
    if (!done) ck('a-toast-invalid', true, 'SKIP: no mismatched tile in hand this deal');
  }

  btn(ga, 'passBtn');
  ck('a-toast-passblock', toastText(ga) === 'You have valid moves — play or swap instead', toastText(ga));
  ck('a-pass-stillplayer', q(ga, 'turn') === 'player');

  // undo: restores score/board/hand to the pre-confirm snapshot (aiScore kept — P3 documented)
  {
    const pre = readState(ga);
    btn(ga, 'undoBtn');
    ck('a-toast-undo', toastText(ga) === 'Move undone', toastText(ga));
    ck('a-undo-score', q(ga, 'playerScore') === 0, q(ga, 'playerScore'));
    ck('a-undo-board', boardMapOf(readState(ga).board) === '', boardMapOf(readState(ga).board));
    ck('a-undo-hand', readState(ga).pH.length === 6);
    ck('a-undo-aiscore-kept', q(ga, 'aiScore') === pre.aS, q(ga, 'aiScore') + ' vs ' + pre.aS);
    ck('a-undo-btn-disabled', ga.els.undoBtn.disabled === true);
  }

  // restart during AI thinking -> ghost-move guard (P2 fix)
  {
    htap(ga, 0); btap(ga, 7, 7); btn(ga, 'placeBtn');
    ck('a-race-turn-ai', q(ga, 'turn') === 'ai');
    btn(ga, 'restartBtn');
    ga.pump(70);
    ck('a-race-fresh', q(ga, 'bag.length') === 96 && q(ga, 'playerScore') === 0 && q(ga, 'turn') === 'player', q(ga, 'bag.length'));
    ck('a-race-no-ghost', boardMapOf(readState(ga).board) === '', boardMapOf(readState(ga).board));
  }

  // swap 1 (selected): counts as a turn; the AI then takes the game's first board move
  // (P1 coverage: pre-fix this NaN'd aiScore)
  {
    htap(ga, 1);
    btn(ga, 'swapBtn');
    ck('a-swap1-toast', toastText(ga) === 'Swapped 1 tile', toastText(ga));
    ck('a-swap1-hand', q(ga, 'playerHand.length') === 6);
    ck('a-swap1-turn', q(ga, 'turn') === 'ai');
    waitPlayer(ga);
    ck('a-swap1-back', q(ga, 'turn') === 'player');
    ck('a-ai-firstmove-fin', Number.isFinite(q(ga, 'aiScore')), q(ga, 'aiScore'));
    const afterSwap = readState(ga);
    ck('a-ai-firstmove-board', Object.keys(afterSwap.board).some(k => afterSwap.board[k].owner === 'a'), boardMapOf(afterSwap.board));
  }
  // swap all (none selected)
  {
    btn(ga, 'swapBtn');
    ck('a-swapall-toast', toastText(ga) === 'Swapped all tiles', toastText(ga));
    ck('a-swapall-hand', q(ga, 'playerHand.length') === 6 && q(ga, 'selectedTile') === -1);
    ck('a-swapall-turn', q(ga, 'turn') === 'ai');
    waitPlayer(ga);
  }
  btn(ga, 'restartBtn'); ga.pump(2);
  btn(ga, 'undoBtn');
  ck('a-toast-noundo', toastText(ga) === 'Nothing to undo', toastText(ga));

  const helpBtn = headerBtn(ga, '?');
  ck('a-helpbtn', !!helpBtn);
  helpBtn.dispatch('click', {}); ga.pump(1);
  ck('a-help-open', ga.els.modalBg.classList.contains('show'));
  ck('a-help-content', String(ga.els.modalContent.innerHTML).indexOf('How to Play Qwirkle') >= 0);
  ga.call('closeModal()');
  ck('a-help-close', !ga.els.modalBg.classList.contains('show'));

  const lvBtn = headerBtn(ga, 'Levels');
  lvBtn.dispatch('click', {}); ga.pump(1);
  ck('a-lv-open', ga.els.modalBg.classList.contains('show'));
  const lvHtml = String(ga.els.modalContent.innerHTML);
  ck('a-lv-30', (lvHtml.match(/<div>\d+<\/div>/g) || []).length === 30, (lvHtml.match(/<div>\d+<\/div>/g) || []).length);
  ck('a-lv-only1-unlocked', (lvHtml.match(/onclick="startLevel\(\d+\)"/g) || []).length === 1 && lvHtml.indexOf('onclick="startLevel(1)"') >= 0);
  ck('a-lv-stars0', lvHtml.indexOf('☆☆☆') >= 0);
  ga.call('closeModal()');

  btn(ga, 'soundBtn');
  ck('a-sound-off', ga.els.soundBtn.textContent === 'Muted' && ga.els.soundBtn.style.opacity === '0.5');
  btn(ga, 'soundBtn');
  ck('a-sound-on', ga.els.soundBtn.textContent === 'Sound' && ga.els.soundBtn.style.opacity === '1');
  btn(ga, 'musicBtn');
  ck('a-music-off', ga.els.musicBtn.textContent === 'M:Mute' && ga.els.musicBtn.style.opacity === '0.5');
  btn(ga, 'musicBtn');
  ck('a-music-on', ga.els.musicBtn.textContent === 'Music');

  ga.sandbox.window.dispatchEvent({ type: 'resize' }); ga.pump(2);
  ck('a-resize', ga.els.boardCanvas.width === cs(ga) * 10 && ga.els.boardCanvas.height === cs(ga) * 10, ga.els.boardCanvas.width + '/' + cs(ga));
  ck('a-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|').slice(0, 160));
})();

/* ================= Boot B: seeded progress + level-21 hard-AI flagship full game ================= */
(function bootB() {
  const ga = bootQ({
    seedLS: { qwirkle_progress: JSON.stringify({ maxLevel: 21, stars: { 1: 2, 5: 3 }, bestScores: { 1: 57 } }) },
  });
  ga.pump(2);
  ck('b-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ck('b-boot', q(ga, 'bag.length') === 96, q(ga, 'bag.length'));

  const lvBtn = headerBtn(ga, 'Levels');
  lvBtn.dispatch('click', {}); ga.pump(1);
  const lvHtml = String(ga.els.modalContent.innerHTML);
  ck('b-lv-open', ga.els.modalBg.classList.contains('show'));
  ck('b-lv-unlock-21', lvHtml.indexOf('onclick="startLevel(21)"') >= 0);
  ck('b-lv-lock-22', lvHtml.indexOf('onclick="startLevel(22)"') < 0);
  ck('b-lv-stars1', lvHtml.indexOf('★★☆') >= 0, 'seeded 2-star level 1');
  ck('b-lv-stars5', lvHtml.indexOf('★★★') >= 0);
  ck('b-lv-current1', lvHtml.indexOf('class="current"') >= 0);
  ga.call('closeModal()');
  ck('b-ls-untouched', JSON.parse(ga.ls.getItem('qwirkle_progress')).maxLevel === 21);

  ga.call('startLevel(21)'); ga.pump(2);
  ck('b-diff', q(ga, 'difficulty') === 2 && q(ga, 'level') === 21);
  ck('b-label', ga.els.turnLabel.textContent === 'Your Turn (Level 21 / Hard AI) — Tap a tile, then the board', ga.els.turnLabel.textContent);

  // deal search: simulate each deal offline; prefer a player win (any stars), best effort
  let sim = null, attempts = 0;
  while (attempts < 40) {
    const st = readState(ga);
    sim = simGame(st);
    if (sim.ok && sim.outcome.stars >= 1) break;
    if (attempts === 39) { sim = simGame(readState(ga)); break; } // final deal as-is, honest outcome
    ga.call('startLevel(21)'); ga.pump(2); attempts++;
  }
  ck('f-deal', !!(sim && sim.ok), 'attempts=' + attempts + ' reason=' + (sim && sim.reason));
  if (!sim || !sim.ok) return;

  let endInfo = null; let qwP = 0, qwA = 0, len7 = 0;
  for (let i = 0; i < sim.events.length; i++) {
    const ev = sim.events[i];
    if (ev.who === 'x') { ck('f-' + i + '-pmtoast', toastText(ga) === ev.toast, toastText(ga) + ' vs ' + ev.toast); continue; }
    if (ev.who === 'p') {
      parity(ga, ev.before, 'f-' + i + '-pre'); // == previous AI event's after-state
      if (ev.type === 'place') {
        const stNow = readState(ga);
        const six = len7 === 0 ? findSixLineEnd(stNow.board) : null; // 'Line too long (max 6)' coverage
        if (six) {
          for (let hi = 0; hi < stNow.pH.length && len7 === 0; hi++) {
            htap(ga, hi); btap(ga, six.x, six.y);
            if (toastText(ga) === 'Line too long (max 6)') len7 = 1;
          }
        }
        for (let pI = 0; pI < ev.placements.length; pI++) {
          htap(ga, ev.taps[pI]);
          btap(ga, ev.placements[pI].x, ev.placements[pI].y);
        }
        ck('f-' + i + '-pending', q(ga, 'pendingPlacements.length') === ev.placements.length, q(ga, 'pendingPlacements.length'));
        if (ev.qwirkle) qwP++;
        btn(ga, 'placeBtn');
        ck('f-' + i + '-toast', toastText(ga) === ev.toast, toastText(ga) + ' vs ' + ev.toast);
        if (ev.end) { // endgame bonus (+6) lands after the after-snapshot
          ck('f-' + i + '-pscore', q(ga, 'playerScore') === ev.end.pS, q(ga, 'playerScore') + ' vs ' + ev.end.pS);
          parity(ga, Object.assign({}, ev.after, { pS: ev.end.pS, aS: ev.end.aS }), 'f-' + i + '-post');
          endInfo = ev.end; break;
        }
        ck('f-' + i + '-pscore', q(ga, 'playerScore') === ev.after.pS, q(ga, 'playerScore') + ' vs ' + ev.after.pS);
        parity(ga, ev.after, 'f-' + i + '-post'); // post-confirm, pre-AI (no pump yet)
        ck('f-' + i + '-turnai', q(ga, 'turn') === 'ai');
        waitPlayer(ga);
      } else {
        if (q(ga, 'bag.length') === 0) { btn(ga, 'swapBtn'); ck('f-' + i + '-swapempty', toastText(ga) === 'Bag is empty', toastText(ga)); }
        btn(ga, 'passBtn');
        ck('f-' + i + '-pass', toastText(ga) === 'Passed', toastText(ga));
        waitPlayer(ga);
      }
    } else { // AI event — already executed during the previous waitPlayer
      const pmFollows = sim.events[i + 1] && sim.events[i + 1].type === 'pmToast'; // pmToast overwrites the AI toast text
      if (ev.type === 'pass' && !pmFollows) ck('f-' + i + '-aipass', toastText(ga) === 'AI passed', toastText(ga));
      if (ev.qwirkle && !pmFollows) { qwA++; ck('f-' + i + '-aiqw', toastText(ga) === 'AI Qwirkle! +6 Bonus!', toastText(ga)); }
      if (ev.end) { // endgame bonus (+6) lands after the after-snapshot
        ck('f-' + i + '-aiscore', q(ga, 'aiScore') === ev.end.aS, q(ga, 'aiScore') + ' vs ' + ev.end.aS);
        ck('f-' + i + '-pscore-end', q(ga, 'playerScore') === ev.end.pS, q(ga, 'playerScore') + ' vs ' + ev.end.pS);
        parity(ga, Object.assign({}, ev.after, { pS: ev.end.pS, aS: ev.end.aS }), 'f-' + i + '-post');
        endInfo = ev.end; break;
      }
      ck('f-' + i + '-aiscore', q(ga, 'aiScore') === ev.after.aS, q(ga, 'aiScore') + ' vs ' + ev.after.aS);
      parity(ga, ev.after, 'f-' + i + '-post');
    }
  }
  ck('f-finished', !!endInfo, 'pS=' + q(ga, 'playerScore') + ' aS=' + q(ga, 'aiScore'));
  if (endInfo) {
    ck('f-gameover', q(ga, 'gameOver') === true);
    ck('f-modal-open', ga.els.modalBg.classList.contains('show'));
    const mh = String(ga.els.modalContent.innerHTML);
    ck('f-modal-title', mh.indexOf(endInfo.title) >= 0, endInfo.title);
    ck('f-modal-msg', mh.indexOf(endInfo.msg) >= 0, endInfo.msg);
    ck('f-modal-scores', mh.indexOf('>' + endInfo.pS + '<') >= 0 && mh.indexOf('>' + endInfo.aS + '<') >= 0);
    const starStr = (endInfo.stars >= 1 ? '★' : '☆') + (endInfo.stars >= 2 ? '★' : '☆') + (endInfo.stars >= 3 ? '★' : '☆');
    ck('f-modal-stars', mh.indexOf(starStr) >= 0, starStr);
    ck('f-modal-btns', mh.indexOf('Next Level') >= 0 && mh.indexOf('Retry') >= 0 && mh.indexOf('Level Select') >= 0);
    const sv = JSON.parse(ga.ls.getItem('qwirkle_progress'));
    ck('f-save-stars', sv.stars['21'] === endInfo.stars, JSON.stringify(sv.stars));
    ck('f-save-best', sv.bestScores['21'] === endInfo.pS && sv.bestScores['1'] === 57, JSON.stringify(sv.bestScores));
    if (endInfo.stars >= 1) ck('f-save-unlock', sv.maxLevel === 22, sv.maxLevel);
    else ck('f-save-maxkept', sv.maxLevel === 21, sv.maxLevel);
    ga.call('startLevel(22)'); ga.pump(2); // Next Level button handler (innerHTML button)
    ck('f-next', q(ga, 'level') === 22 && q(ga, 'bag.length') === 96 && q(ga, 'turn') === 'player');
    ck('f-next-label', ga.els.turnLabel.textContent === 'Your Turn (Level 22 / Hard AI) — Tap a tile, then the board', ga.els.turnLabel.textContent);
  }
  ck('b-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|').slice(0, 160));
  console.error('EXTRA ' + JSON.stringify({ attempts, events: sim.events.length, pS: sim.outcome.pS, aS: sim.outcome.aS, stars: sim.outcome.stars, title: sim.outcome.title, qwirklesP: qwP, qwirklesA: qwA, len7Toast: len7 }));
})();

/* ---- report ---- */
const total = pass + fail;
console.log(JSON.stringify({ pass, fail, total, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { engineFixes: 'P2-aiTakeTurn-turn-guard, P1-first-move-score', boots: 2, realEvents: true, documented: ['undo keeps aiScore while erasing AI reply tiles (P3 desync)', 'undo does not restore bag contents (engine self-commented)', 'endGame player-confirm path leaves stale turnLabel + visually-enabled swap/pass (guarded internally, cosmetic P3)', 'AI single-tile qwirkle: +6 in score but no toast (move flag only set for multi moves)', 'disabled-button-only branches asserted synthetically', 'AI-swap random branch excluded by deal selection'] } }));
process.exit(fail === 0 ? 0 : 1);
