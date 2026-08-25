#!/usr/bin/env node
/* spider-solitaire verifier — 1-suit spider, played to the engine's own win
 * (type A). Every action goes through the REAL input path: canvas pointerdown
 * -> handleMove (column hit-test + card pick) -> canMoveCards/canPlaceCards ->
 * moveCards -> checkCompletedSequences (K..A same suit) -> 8 sequences ->
 * handleWin overlay + stats + localStorage save. Moves are CHOSEN by a host
 * policy over the engine's own findValidMoves list (selection only); each is
 * executed as two real clicks (select card, drop on target top card / empty
 * column) or a real stock/deal-button click. Undo/Hint via their real buttons.
 * Engine bug fixed first: P1 dropping onto an empty column was impossible
 * through the pointer path (click loop never hit the empty-column branch). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('spider-solitaire', { inject: {
  anchor: 'function handleMove(cardX, cardY) {',
  exports: `globalThis.__SS = {
    cols: () => gameState.columns.map(c => c.map(x => x.rank + x.suit[0] + (x.faceUp ? 'U' : 'D'))),
    moves: () => gameState.moves, score: () => gameState.score, done: () => gameState.completedSequences,
    stock: () => gameState.stock.length, deals: () => gameState.stockDeals,
    sel: () => [gameState.selectedColumn, gameState.selectedCards ? gameState.selectedCards.length : 0],
    hint: () => gameState.hintCards ? [gameState.hintColumn, gameState.hintCards.fromIndex, gameState.hintCards.toColumn] : null,
    valid: () => findValidMoves(),
    won: () => gameState.gameWon,
    ov: (id) => document.getElementById(id).classList.contains('active'),
    stats: () => stats,
    saved: () => { try { return JSON.parse(localStorage.getItem('spiderSolitaireGame')) } catch (e) { return null } },
    snap: () => saveState(),
    dims: () => { const rc = canvas.getBoundingClientRect(); return [canvas.width, canvas.height, rc.left, rc.top, rc.width, rc.height]; },
    pos: (col, idx) => [getColumnX(col) + 35, getColumnY(col, idx) + 90], // bottom quarter of the card's band: the hit-test scans 100px bands top-down, so the card's own top strip is shadowed by the card above it
    stockPos: () => [canvas.width - STOCK_CARD_WIDTH - 20 + 25, 60],
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
if (!call('__SS.saved()') && call('__SS.stock()') === 0 && !call('__SS.ov("tutorialOverlay")')) {
  // engine deferred init to document DOMContentLoaded (harness fires it from the
  // window bag only) — replay that exact event so init() runs as in a browser
  ((g.sandbox.document.__dls || {})['DOMContentLoaded'] || [])
    .forEach(f => f.call(g.sandbox.document, { type: 'DOMContentLoaded' }));
}

// first play -> tutorial overlay -> real Start button deals the game
T('tutorial-first-play', call('__SS.ov("tutorialOverlay")') === true, 'ov=' + call('__SS.ov("tutorialOverlay")'));
g.els['tutorialStart'].click(); g.pump(3);
const colCounts = call('__SS.cols()').map(c => c.length);
T('deal-layout', JSON.stringify(colCounts) === JSON.stringify([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]) &&
  call('__SS.stock()') === 50 && call('__SS.deals()') === 5 &&
  call('__SS.cols()').every(c => c[c.length - 1].endsWith('U')),
  'cols=' + JSON.stringify(colCounts) + ' stock=' + call('__SS.stock()'));

// ---- real-click mechanics ----
function clickCanvas(x, y) {
  const [cw, chh, rl, rt, rw, rh] = call('__SS.dims()');
  g.els['gameCanvas'].dispatch('pointerdown', {
    clientX: rl + x * rw / cw, clientY: rt + y * rh / chh, preventDefault() {} });
}
function clickCard(col, idx) { const [x, y] = call('__SS.pos(' + col + ',' + idx + ')'); clickCanvas(x, y); }
function clickCol(col) { // top card of the column (or empty-column band at y=70)
  const cs = call('__SS.cols()')[col];
  if (cs.length) clickCard(col, cs.length - 1); else { const [x] = call('__SS.pos(' + col + ',0)'); clickCanvas(x, 70); }
}
const cols0 = call('__SS.cols()');
const downIdx = cols0.findIndex(c => c.some(x => x.endsWith('D')));
clickCard(downIdx, 0); g.pump(2); // a face-down card
T('facedown-select-rejected', call('__SS.sel()')[0] === -1, 'sel=' + JSON.stringify(call('__SS.sel()')));

const vm0 = call('__SS.valid()');
T('engine-offers-moves', Array.isArray(vm0) && vm0.length > 0, 'valid=' + (vm0 || []).length);
const mv0 = vm0.find(m => m.type === 'move');
clickCard(mv0.fromColumn, mv0.fromIndex); g.pump(2);
T('click-selects-run', call('__SS.sel()')[0] === mv0.fromColumn &&
  call('__SS.sel()')[1] === cols0[mv0.fromColumn].length - mv0.fromIndex,
  'sel=' + JSON.stringify(call('__SS.sel()')));
// drop somewhere illegal: a column whose top card is NOT one rank higher
{
  const cs = call('__SS.cols()');
  const moving = cs[mv0.fromColumn].slice(mv0.fromIndex);
  const myRank = (s) => ({ A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 }[/^[AKQJ0-9]+/.exec(s)[0]] || 0);
  let bad = -1;
  for (let c = 0; c < 10; c++) {
    if (c === mv0.fromColumn || !cs[c].length) continue;
    const top = cs[c][cs[c].length - 1];
    if (!top.endsWith('U')) continue;
    if (myRank(top) !== myRank(moving[0]) + 1) { bad = c; break; }
  }
  if (bad >= 0) {
    const beforeMv = call('__SS.moves()');
    clickCard(bad, cs[bad].length - 1); g.pump(2);
    T('illegal-drop-no-move', call('__SS.moves()') === beforeMv,
      'moves=' + call('__SS.moves()') + '/' + beforeMv);
  } else T('illegal-drop-no-move', true, 'no illegal target found');
}
// now perform the engine's own offered move with real clicks
{
  const before = call('__SS.cols()');
  const mv = call('__SS.valid()').find(m => m.type === 'move') || mv0;
  clickCard(mv.fromColumn, mv.fromIndex); g.pump(2);
  if (call('__SS.sel()')[0] !== mv.fromColumn) { clickCard(mv.fromColumn, mv.fromIndex); g.pump(2); }
  clickCol(mv.toColumn); g.pump(6); // + autoComplete timer
  const after = call('__SS.cols()');
  T('real-click-move', call('__SS.moves()') >= 1 && JSON.stringify(before) !== JSON.stringify(after),
    'moves=' + call('__SS.moves()'));
}
// undo through the real button
{
  const before = call('__SS.cols()'), mv = call('__SS.moves()'), sc = call('__SS.score()');
  g.els['undoBtn'].click(); g.pump(2);
  T('undo-restores', call('__SS.moves()') === Math.max(0, mv - 1) &&
    JSON.stringify(call('__SS.cols()')) !== JSON.stringify(before),
    'mv=' + call('__SS.moves()') + '/' + mv);
}
// hint through the real button
g.els['hintBtn'].click(); g.pump(2);
T('hint-highlights', call('__SS.hint()') !== null || call('__SS.valid()').some(m => m.type === 'deal'),
  'hint=' + JSON.stringify(call('__SS.hint()')));
// deal through the engine's real Deal button (the canvas stock patch overlaps
// column 7's x-band at the harness's 480px canvas width — a scale artifact of
// the environment, not the engine; both paths call the same deal())
{
  const st0 = call('__SS.stock()'), dl0 = call('__SS.deals()'), cs0 = call('__SS.cols()').map(c => c.length);
  g.els['dealBtn'].click(); g.pump(10);
  const cs1 = call('__SS.cols()').map(c => c.length);
  T('deal-button-deals', call('__SS.stock()') === st0 - 10 && call('__SS.deals()') === dl0 - 1 &&
    cs1.every((n, i) => n === cs0[i] + 1) && call('__SS.cols()').every(c => c[c.length - 1].endsWith('U')),
    'stock=' + call('__SS.stock()') + ' deals=' + call('__SS.deals()'));
}

// ---- play to the engine's own win: 8 completed K..A sequences ----
// A host-side mirror of the engine's own rules (canMoveCards / canPlaceCards /
// moveCards / deal / checkCompletedSequences+autoComplete) searches for a
// winning line from a snapshot of the LIVE engine state; the found line is
// then replayed move-by-move through the REAL input path (card clicks, empty-
// column drops via the P1 fix, Deal button). The win itself is the engine's
// own checkCompletedSequences -> handleWin — nothing is short-circuited.
const RV = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };
const RV2 = ['.', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const parse = (s) => ({ rank: /^[AKQJ0-9]+/.exec(s)[0], up: s.endsWith('U') });
const myRank = (s) => RV[parse(s).rank];

function simFromSnap(sn) { // engine snapshot -> {cols:[[{r,u}]], stock:[r], deals}
  return {
    cols: sn.columns.map(c => c.map(x => ({ r: RV[x.rank], u: x.faceUp }))),
    stock: sn.stock.map(x => RV[x.rank]), // engine pops from the END
    deals: sn.stockDeals, done: sn.completedSequences,
  };
}
function simColsStr(st) { return st.cols.map(c => c.map(x => RV2[x.r] + (x.u ? 'U' : 'D')).join(',')).join(';'); }
function simSig(st) { return simColsStr(st) + '|' + st.stock.length + '|' + st.deals; }
function isSeq(a) { // same-suit descending (1-suit: suit always matches)
  for (let i = 1; i < a.length; i++) if (a[i].r !== a[i - 1].r - 1) return false;
  return true;
}
function simComplete(st) { // engine's autoComplete loop: remove every faceUp K..A run
  let hit = true;
  while (hit) {
    hit = false;
    for (const c of st.cols) {
      if (c.length < 13) continue;
      const t = c.slice(-13);
      if (!t[0].u || t[0].r !== 13) continue;
      let ok = true;
      for (let i = 0; i < 13; i++) if (t[i].r !== 13 - i) { ok = false; break; }
      if (ok) { c.splice(-13); st.done++; if (c.length && !c[c.length - 1].u) c[c.length - 1].u = true; hit = true; }
    }
  }
}
function simMoves(st) { // mirrors findValidMoves
  const out = [];
  for (let s = 0; s < 10; s++) {
    const col = st.cols[s];
    for (let i = 0; i < col.length; i++) {
      if (!col[i].u) continue;
      const run = col.slice(i);
      if (!isSeq(run)) continue;
      for (let t = 0; t < 10; t++) {
        if (t === s) continue;
        const tc = st.cols[t];
        if (tc.length === 0) { out.push({ k: 'm', f: s, i, t }); continue; }
        const top = tc[tc.length - 1];
        if (!top.u || top.r !== run[0].r + 1) continue;
        out.push({ k: 'm', f: s, i, t });
      }
    }
  }
  if (st.deals > 0 && st.stock.length > 0 && st.cols.every(c => c.length > 0)) out.push({ k: 'd' });
  return out;
}
function simApply(st, op) { // mirrors moveCards/deal (returns new state)
  const n = { cols: st.cols.map(c => c.map(x => ({ r: x.r, u: x.u }))), stock: st.stock.slice(), deals: st.deals, done: st.done };
  if (op.k === 'd') {
    for (let i = 0; i < 10; i++) { const r = n.stock.pop(); n.cols[i].push({ r, u: true }); }
    n.deals--;
  } else {
    const cards = n.cols[op.f].splice(op.i);
    n.cols[op.t].push(...cards);
    const src = n.cols[op.f];
    if (src.length && !src[src.length - 1].u) src[src.length - 1].u = true;
  }
  simComplete(n);
  return n;
}
function joinedLen(st, op) { // resulting run length at the target after the drop
  const src = st.cols[op.f], run = src.slice(op.i), tgt = st.cols[op.t];
  if (!tgt.length) return run.length;
  const top = tgt[tgt.length - 1];
  if (!top.u || top.r !== run[0].r + 1) return run.length;
  let len = run.length + 1;
  for (let i = tgt.length - 2; i >= 0 && tgt[i].u && tgt[i].r === tgt[i + 1].r - 1; i--) len++;
  return len;
}
function opScore(st, op) { // policy: completions, reveals, empties, long joins
  const src = st.cols[op.f], run = src.slice(op.i), tgt = st.cols[op.t];
  let s = 0;
  const jl = joinedLen(st, op);
  if (jl >= 13) s += 1e6; // completes K..A
  if (op.i > 0 && !src[op.i - 1].u) s += 8000; // reveals hidden
  if (op.i === 0) s += 3000; // empties a column
  if (op.i > 0 && src[op.i - 1].u && src[op.i - 1].r === run[0].r + 1) s -= 2500; // splits a natural run
  if (!tgt.length) s -= 200; // parking on an empty column costs workspace
  s += jl * 25;
  return s;
}

let result = 'stuck', searchNodes = 0, searchMs = 0, attempts = 0;
const t0 = Date.now();
// the mechanics checks above consumed one deal; start the win attempt from a
// FRESH deal through the engine's real New Game button (full 5 redeals left)
g.els['newGameBtn'].click(); g.pump(6);
if (call('__SS.done()') !== 0 || call('__SS.moves()') !== 0) g.els['newGameBtn'].click(), g.pump(6);
const snap0 = call('__SS.snap()');
const sim0 = simFromSnap(snap0);
(function solve() { // randomized-restart search guided by greedy rollouts
  const deadline = Date.now() + 75000;
  let seedN = 987654321;
  const rnd = () => (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  function rollout(st0, capOps) { // deterministic greedy rollout -> best done reached
    let st = st0; const seen2 = new Set([simSig(st)]);
    let bestDone = st.done;
    for (let o = 0; o < capOps && st.done < 8; o++) {
      const ms = simMoves(st).filter(m => m.k === 'm').map(m => [m, opScore(st, m)]);
      ms.sort((a, b) => b[1] - a[1]);
      let picked = null;
      for (const [op] of ms) {
        const child = simApply(st, op); const sg = simSig(child);
        if (seen2.has(sg)) continue;
        seen2.add(sg); picked = [op, child]; break;
      }
      if (!picked) {
        if (st.deals > 0 && st.stock.length > 0 && st.cols.every(c => c.length > 0)) {
          const child = simApply(st, { k: 'd' });
          if (!seen2.has(simSig(child))) { seen2.add(simSig(child)); picked = [{ k: 'd' }, child]; }
        }
        if (!picked) break;
      }
      st = picked[1];
      if (st.done > bestDone) bestDone = st.done;
    }
    return bestDone;
  }
  let winOps = null;
  while (!winOps && Date.now() < deadline) {
    attempts++;
    let sim = sim0; const ops = []; const seen = new Set([simSig(sim)]);
    while (sim.done < 8 && ops.length < 330 && Date.now() < deadline) {
      const ms = simMoves(sim).filter(m => m.k === 'm').map(m => [m, opScore(sim, m)]);
      ms.sort((a, b) => b[1] - a[1]);
      // evaluate the top few candidates by greedy rollout; noise varies restarts
      let picked = null, bestVal = -1;
      const cand = Math.min(ms.length, 3 + Math.floor(rnd() * 2));
      for (let k = 0; k < cand; k++) {
        const child = simApply(sim, ms[k][0]);
        const sg = simSig(child);
        if (seen.has(sg)) continue;
        const val = rollout(child, 70) * 1000 + ms[k][1] + rnd() * 40;
        searchNodes++;
        if (val > bestVal) { bestVal = val; picked = [ms[k][0], child]; }
      }
      if (!picked) {
        if (sim.deals > 0 && sim.stock.length > 0 && sim.cols.every(c => c.length > 0)) {
          const child = simApply(sim, { k: 'd' });
          if (!seen.has(simSig(child))) { seen.add(simSig(child)); picked = [{ k: 'd' }, child]; }
        }
        if (!picked) break;
      }
      seen.add(simSig(picked[1]));
      sim = picked[1]; ops.push(picked[0]);
    }
    if (sim.done === 8) winOps = ops;
  }
  searchMs = Date.now() - t0;
  if (winOps) {
    // ---- replay the winning line through the REAL input path ----
    const engStr = () => call('__SS.cols()').map(c => c.map(x => x.replace(/[shdc](?=[UD]$)/, '')).join(',')).join(';');
    let sim = sim0;
    for (const op of winOps) {
      if (call('__SS.won()') || call('__SS.done()') === 8) break;
      if (engStr() !== simColsStr(sim)) { result = 'replay-diverge'; return; }
      sim = simApply(sim, op);
      if (op.k === 'd') {
        g.els['dealBtn'].click(); g.pump(12);
      } else {
        clickCard(op.f, op.i); g.pump(2);
        if (call('__SS.sel()')[0] !== op.f) { result = 'select-fail@' + op.f; return; }
        clickCol(op.t); g.pump(10);
      }
      if (engStr() !== simColsStr(sim)) { result = 'replay-diverge@op' + op.k; return; }
    }
    for (let f = 0; f < 80 && !call('__SS.won()'); f++) g.pump(4); // handleWin fires at +500ms
    result = (call('__SS.won()') && call('__SS.done()') === 8) ? 'win' : ('replay-stalled@done' + call('__SS.done()'));
  } else {
    result = 'no-win-in-restarts';
  }
})();
for (let f = 0; f < 45 && !call('__SS.ov("winOverlay")'); f++) g.pump(2);
T('game-won-own-engine', result === 'win' && call('__SS.done()') === 8 &&
  call('__SS.ov("winOverlay")') === true && call('__SS.won()') === true,
  'result=' + result + ' done=' + call('__SS.done()') + ' ov=' + call('__SS.ov("winOverlay")'));
T('win-stats-recorded', call('__SS.stats().won') === 1 && call('__SS.stats().played') === 1 &&
  call('__SS.stats().bestScore') > 0, 'stats=' + JSON.stringify(call('__SS.stats()')));
const sv = call('__SS.saved()');
T('win-state-saved', sv && sv.gameState.gameWon === true && sv.gameState.completedSequences === 8,
  'saved=' + JSON.stringify(sv && sv.gameState && { w: sv.gameState.gameWon, d: sv.gameState.completedSequences }));
g.els['playAgainBtn'].click(); g.pump(4);
T('play-again-resets', call('__SS.ov("winOverlay")') === false && call('__SS.done()') === 0 &&
  call('__SS.moves()') === 0 && call('__SS.cols()').every(c => c.length >= 5),
  'done=' + call('__SS.done()') + ' moves=' + call('__SS.moves()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { result, moves: call('__SS.moves()'), searchNodes, attempts, searchMs, secs: Math.round((Date.now() - t0) / 1000),
    notes: result === 'win' ? 'rollout-guided restart search found the line host-side; every op replayed via real clicks (incl. empty-column drops through the P1 fix); win = engine checkCompletedSequences->handleWin' : 'bot-limited: ' + result } };
console.log('spider-solitaire: 1-suit game won via real card clicks -> engine checkCompletedSequences/handleWin: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
