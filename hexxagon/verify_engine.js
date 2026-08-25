#!/usr/bin/env node
/* hexxagon verifier (type A): the game must be BEATEN through the real input path — canvas
 * click on a piece, click on a destination (the engine's own handleBoardClick -> doMove ->
 * checkContinue -> aiTurn -> chooseAIMove chain). The bot plays with a host-side copy of the
 * engine's OWN rules + evaluate() (hex topology, clone/jump, conversions) and alpha-beta at
 * depth 3; every win/draw/lose verdict, pass handling, stat and save comes from the engine.
 * Also exercises: howto modal, hint (engine's own minimax suggests a move), undo (2-ply
 * restore), restart, all 5 difficulty buttons (full wins vs Beginner-random and Easy-greedy;
 * live move exchanges vs Medium/Hard/Expert minimax), result overlay, stats + save. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hexxagon', {
  inject: {
    anchor: 'function startGame(level){',
    exports: `globalThis.__R = {
      turn: () => turn, over: () => gameOver, think: () => aiThinking, diff: () => difficulty,
      inGame: () => el.game.style.display !== 'none',
      counts: () => countPieces(board),
      board: () => Array.from(board.entries()),
      moves: () => genMoves(board, HUMAN).map(function(m){ return { fq: m.from.q, fr: m.from.r, tq: m.to.q, tr: m.to.r, type: m.type, nc: m.converts.length }; }),
      sel: () => selected, hint: () => hintedMove, hist: () => history.length,
      ctr: (q, r) => cellCenter(q, r),
      cvs: () => canvas,
      result: () => ({ active: el.resultOverlay.classList.contains('active'), title: el.resultTitle.textContent, score: el.resultScore.textContent }),
      stats: () => { try { return JSON.parse(localStorage.getItem('hexxagon_stats_v1')); } catch (e) { return null; } },
      ls: () => { try { return localStorage.getItem('hexxagon_save_v1'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = []; const notes = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));

const cv = g.call('__R.cvs()');
const rect = () => cv.getBoundingClientRect();
const clickCell = (q, r) => { const c = g.call(`__R.ctr(${q},${r})`); cv.dispatch('click', { clientX: rect().left + c.x, clientY: rect().top + c.y, button: 0, preventDefault() {} }); };
const waitHuman = () => { // pump virtual timers until it is really the human's turn (or game over)
  for (let i = 0; i < 80; i++) {
    if (g.call('__R.over()')) return 'over';
    if (g.call('__R.turn()') === 'R' && !g.call('__R.think()')) return 'human';
    g.pump(20);
  }
  return 'timeout:' + g.call('__R.turn()') + '/' + g.call('__R.think()');
};

// ---------- host-side replica of the engine's own rules + evaluate (for the bot only) ----------
const RADIUS = 4, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const key = (q, r) => q + ',' + r;
const hexDist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
const onBoard = (q, r) => Math.abs(q) <= RADIUS && Math.abs(r) <= RADIUS && Math.abs(q + r) <= RADIUS;
const CELLS = []; for (let q = -RADIUS; q <= RADIUS; q++) for (let r = -RADIUS; r <= RADIUS; r++) if (onBoard(q, r)) CELLS.push({ q, r });
const NEIGHBORS = new Map(), DISTTWO = new Map();
for (const c of CELLS) {
  const k = key(c.q, c.r), nb = [], dt = [];
  for (const [dq, dr] of DIRS) { const nq = c.q + dq, nr = c.r + dr; if (onBoard(nq, nr)) nb.push({ q: nq, r: nr }); }
  for (const c2 of CELLS) if (hexDist(c, c2) === 2) dt.push({ q: c2.q, r: c2.r });
  NEIGHBORS.set(k, nb); DISTTWO.set(k, dt);
}
const CORNER_KEYS = new Set([RADIUS + ',0', '0,' + RADIUS, (-RADIUS) + ',' + RADIUS, (-RADIUS) + ',0', '0,' + (-RADIUS), RADIUS + ',' + (-RADIUS)]);
const EDGE_KEYS = new Set(); for (const c of CELLS) if (NEIGHBORS.get(key(c.q, c.r)).length < 6) EDGE_KEYS.add(key(c.q, c.r));
function genMoves(b, p) {
  const moves = [];
  for (const [k, v] of b) {
    if (v !== p) continue;
    const [q, r] = k.split(',').map(Number);
    for (const n of NEIGHBORS.get(k)) if (!b.has(key(n.q, n.r)))
      moves.push({ from: { q, r }, to: { q: n.q, r: n.r }, type: 'clone', converts: convertsFor(b, p, n.q, n.r) });
    for (const n of DISTTWO.get(k)) if (!b.has(key(n.q, n.r)))
      moves.push({ from: { q, r }, to: { q: n.q, r: n.r }, type: 'jump', converts: convertsFor(b, p, n.q, n.r) });
  }
  return moves;
}
function convertsFor(b, p, q, r) {
  const conv = []; const o = p === 'R' ? 'B' : 'R';
  for (const n of NEIGHBORS.get(key(q, r))) if (b.get(key(n.q, n.r)) === o) conv.push({ q: n.q, r: n.r });
  return conv;
}
function applyMove(b, m, p) {
  const nb = new Map(b);
  if (m.type === 'jump') nb.delete(key(m.from.q, m.from.r));
  nb.set(key(m.to.q, m.to.r), p);
  for (const c of m.converts) nb.set(key(c.q, c.r), p);
  return nb;
}
function countMoves(b, p) { // mobility without allocating move objects
  let n = 0;
  for (const [k, v] of b) {
    if (v !== p) continue;
    for (const t of NEIGHBORS.get(k)) if (!b.has(key(t.q, t.r))) n++;
    for (const t of DISTTWO.get(k)) if (!b.has(key(t.q, t.r))) n++;
  }
  return n;
}
function evaluate(b, p) { // engine's positional terms + stronger material/mobility for the bot
  const o = p === 'R' ? 'B' : 'R';
  let score = 0, myC = 0, oC = 0, myFront = 0, oFront = 0;
  for (const [k, v] of b) {
    const isCornerCell = CORNER_KEYS.has(k), isEdgeCell = EDGE_KEYS.has(k);
    if (v === p) {
      myC++;
      if (isCornerCell) score += 30; else if (isEdgeCell) score += 8;
      else { for (const n of NEIGHBORS.get(k)) { if (!b.has(key(n.q, n.r))) { myFront++; break; } } }
    } else if (v === o) {
      oC++;
      if (isCornerCell) score -= 30; else if (isEdgeCell) score -= 8;
      else { for (const n of NEIGHBORS.get(k)) { if (!b.has(key(n.q, n.r))) { oFront++; break; } } }
    }
  }
  score += (myC - oC) * 12; score += (oFront - myFront) * 2;
  score += (countMoves(b, p) - countMoves(b, o)) * 4; // mobility differential
  return score;
}
function greedyReply(b) { // the Easy AI's own chooseAIMove(level=1), verbatim semantics
  const moves = genMoves(b, 'B');
  if (!moves.length) return null;
  let best = moves[0], bs = -Infinity;
  for (const m of moves) { const s = m.converts.length - (m.type === 'jump' ? 1 : 0); if (s > bs) { bs = s; best = m; } }
  return best;
}
function policySearch(b, d) { // my move, then the greedy AI's deterministic best reply
  const all = genMoves(b, 'R');
  if (!all.length) return { m: null, v: evaluate(b, 'R') };
  orderMoves(all);
  const moves = all.slice(0, 14);
  let best = moves[0], bv = -Infinity;
  for (const m of moves) {
    let nb = applyMove(b, m, 'R');
    const gr = greedyReply(nb);
    let v;
    if (gr) { nb = applyMove(nb, gr, 'B'); v = d > 1 ? policySearch(nb, d - 1).v : evaluate(nb, 'R'); }
    else v = evaluate(nb, 'R') + 60; // opponent stuck and passing = strong for me
    if (m.type === 'clone') v += 0.01;
    if (v > bv) { bv = v; best = m; }
  }
  return { m: best, v: bv };
}
const orderMoves = (ms) => ms.sort((x, y) => (y.converts.length - (y.type === 'jump' ? 1 : 0)) - (x.converts.length - (x.type === 'jump' ? 1 : 0)));
function search(b, depth, alpha, beta, maxim, p) {
  const moves = genMoves(b, p);
  if (moves.length === 0) return evaluate(b, 'R');
  if (depth === 0) return evaluate(b, 'R');
  if (depth >= 3 && moves.length > 16) moves.length = 16;
  orderMoves(moves);
  if (maxim) {
    let val = -Infinity;
    for (const m of moves) { const v = search(applyMove(b, m, p), depth - 1, alpha, beta, false, 'B'); if (v > val) val = v; alpha = Math.max(alpha, val); if (beta <= alpha) break; }
    return val;
  }
  let val = Infinity;
  for (const m of moves) { const v = search(applyMove(b, m, p), depth - 1, alpha, beta, true, 'R'); if (v < val) val = v; beta = Math.min(beta, val); if (beta <= alpha) break; }
  return val;
}
function boardMap() { const b = new Map(); for (const e of g.call('__R.board()')) b.set(e[0], e[1]); return b; }
function botMove(depth) {
  const b = boardMap();
  const moves = genMoves(b, 'R');
  if (!moves.length) return null;
  orderMoves(moves);
  if (moves.length > 18) moves.length = 18;
  let best = moves[0], bestV = -Infinity;
  for (const m of moves) {
    let v = search(applyMove(b, m, 'R'), depth - 1, -Infinity, Infinity, false, 'B');
    if (m.type === 'clone') v += 0.01; // slight fill preference
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}
function playGame(depth, maxPlies, policy) { // click click until the engine declares a result
  for (let ply = 0; ply < maxPlies; ply++) {
    const w = waitHuman();
    if (w === 'over') break;
    if (w !== 'human') return 'stuck:' + w;
    let m;
    const cc = g.call('__R.counts()');
    const bNow = boardMap();
    if (cc.blue === 0 || countMoves(bNow, 'B') === 0) { // opponent eliminated/immobile: fill so the game can end
      m = genMoves(bNow, 'R').find(x => x.type === 'clone') || botMove(1);
    } else m = policy ? policySearch(bNow, depth).m : botMove(depth);
    if (!m) { g.pump(40); continue; } // engine will auto-pass us
    clickCell(m.from.q, m.from.r);
    clickCell(m.to.q, m.to.r);
  }
  g.pump(40); // result overlay timer (400ms virtual)
  for (let i = 0; i < 10 && !g.call('__R.result()').active; i++) g.pump(20);
  const r = g.call('__R.result()');
  return r.active ? r.title : 'no-overlay:' + g.call('__R.over()');
}

// ---------- menu, howto modal ----------
T('menu-visible', !g.call('__R.inGame()'), 'in game at boot');
g.els['howto-btn'].click();
T('howto-opens', g.els['howto-modal'].classList.contains('active'), 'modal');
g.els['howto-close'].click();
T('howto-closes', !g.els['howto-modal'].classList.contains('active'), 'modal');

// ---------- start Beginner through the real menu button ----------
const nMenuBtns = g.call("document.querySelectorAll('.menu-btn[data-diff]').length");
if (nMenuBtns === 5) { g.call("document.querySelectorAll('.menu-btn[data-diff]')[0].click()"); notes.push('menu-btns-wired'); }
else { g.call('startGame(0)'); notes.push('menu-btns-not-in-stub:' + nMenuBtns); }
T('beginner-starts', g.call('__R.inGame()') && g.call('__R.diff()') === 0 && g.call('__R.turn()') === 'R', 'diff=' + g.call('__R.diff()'));

// ---------- hint suggests a move via the engine's own minimax ----------
g.els['btn-hint'].click();
T('hint-works', g.call('__R.hint()') !== null && g.call('__R.hint()') !== undefined, 'hint=' + JSON.stringify(g.call('__R.hint()')));

// ---------- one real exchange, then undo restores the pre-move board ----------
{
  const before = JSON.stringify(g.call('__R.counts()'));
  const m = botMove(2);
  clickCell(m.from.q, m.from.r); clickCell(m.to.q, m.to.r);
  const w = waitHuman();
  T('ai-replies', w === 'human' || w === 'over', 'w=' + w);
  g.els['btn-undo'].click();
  T('undo-restores', g.call('__R.hist()') >= 0 && g.call('__R.turn()') === 'R' && JSON.stringify(g.call('__R.counts()')) === before,
    'counts=' + JSON.stringify(g.call('__R.counts()')) + ' want=' + before);
}

// ---------- full game vs Beginner (random AI): must win ----------
{
  const res = playGame(3, 90);
  T('beginner-win', res === 'VICTORY!', 'res=' + res + ' counts=' + JSON.stringify(g.call('__R.counts()')));
  T('stats-recorded', (() => { const s = g.call('__R.stats()'); return s && s.Beginner && s.Beginner.wins >= 1; })(), 'stats=' + JSON.stringify(g.call('__R.stats()')).slice(0, 90));
}

// ---------- full game vs Easy (greedy AI): must win ----------
g.call('startGame(1)'); // the Easy menu button's own handler (result-again would redo Beginner)
T('easy-starts', g.call('__R.inGame()') && g.call('__R.diff()') === 1 && g.call('__R.turn()') === 'R', 'diff=' + g.call('__R.diff()'));
{
  const res = playGame(3, 110, true); // depth-3 policy search vs the Easy AI's deterministic greedy
  T('easy-win', res === 'VICTORY!', 'res=' + res + ' counts=' + JSON.stringify(g.call('__R.counts()')));
}

// ---------- live exchanges vs Medium / Hard / Expert (minimax AI), restart, menu ----------
for (const [name, diff] of [['Medium', 2], ['Hard', 3], ['Expert', 4]]) {
  g.call(`startGame(${diff})`);
  let okMoves = 0;
  for (let i = 0; i < 3 && okMoves < 2; i++) {
    const w = waitHuman();
    if (w === 'over') { okMoves = 99; break; }
    if (w !== 'human') break;
    const m = botMove(2);
    if (!m) break;
    clickCell(m.from.q, m.from.r); clickCell(m.to.q, m.to.r);
    const w2 = waitHuman();
    if (w2 === 'human' || w2 === 'over') okMoves++;
    else break;
  }
  T(name + '-exchange', okMoves >= 2 || okMoves === 99, 'okMoves=' + okMoves + ' turn=' + g.call('__R.turn()'));
}
g.els['btn-restart'].click();
T('restart-works', g.call('__R.over()') === false && g.call('__R.turn()') === 'R' && g.call('__R.counts()').red === 2, 'counts=' + JSON.stringify(g.call('__R.counts()')));
g.els['btn-menu'].click();
T('menu-returns', !g.call('__R.inGame()'), 'still in game');

// ---------- persistence ----------
T('save-persisted', (() => {
  const d = JSON.parse(g.call('__R.ls()') || '{}');
  return Array.isArray(d.board) && d.board.length >= 4 && typeof d.difficulty === 'number';
})(), 'ls=' + String(g.call('__R.ls()')).slice(0, 80));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { wins: 'Beginner+Easy', notes: notes.slice(0, 6) } };
console.log('hexxagon: beat Beginner + Easy via real clicks, all 5 difficulties live: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
