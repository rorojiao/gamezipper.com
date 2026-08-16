#!/usr/bin/env node
/* solitaire (Klondike, draw-1) vm-sandbox verifier — replaces the kachilu-browser script.
 * Klondike has no fixed levels: the per-"level" solvability analog used here is
 *   1) deal integrity over seeded shuffles (52 unique cards, 1..7 tableau, 24 stock, one face-up per col)
 *   2) forced-win: construct near-won state, finish via engine's own autoMoveToFoundation → checkWin fires
 *   3) Monte-Carlo greedy policy-win rate over 10 seeded deals (400 rollouts each); every won deal
 *      is REPLAYED through the engine's doMove/dealFromStock (proof the engine accepts a full line)
 * PASS = (1) ∧ (2) ∧ (at least 2/10 deals won-and-replayed)
 * Output: last stdout line JSON {pass,fail,total,verdict,...} ; exit 0 = PASS */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const repo = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repo, 'solitaire', 'index.html'), 'utf8');

// extract inline scripts (skip ld+json / external src)
const scripts = [...html.matchAll(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !/application\/ld\+json/.test(m[1]))
  .map(m => m[2]).join('\n');

function mk2D() {
  return new Proxy({}, {
    get: (t, p) => {
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: [] });
      if (typeof p === 'string' && !(p in t)) return () => 1;
      return t[p];
    },
    set: (t, p, v) => { t[p] = v; return true; },
  });
}
function mkSandbox(seed) {
  let s = seed >>> 0;
  const ctx = {
    console, Date, JSON,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => {}, cancelAnimationFrame() {},
    performance: { now: () => 0 },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'node' }, location: { href: 'http://localhost/solitaire/' },
    document: {
      getElementById: () => ({ textContent: '', classList: { add() {}, remove() {} }, style: {}, addEventListener() {}, getContext: () => mk2D(), width: 800, height: 600 }),
      addEventListener() {}, removeEventListener() {},
      querySelector: () => null, querySelectorAll: () => [],
      createElement: () => ({ getContext: () => mk2D(), style: {}, width: 300, height: 300 }),
      body: { appendChild() {} }, hidden: false, visibilityState: 'visible',
    },
    AudioContext: undefined,
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.addEventListener = () => {};
  ctx.Math = Object.create(Math);
  ctx.Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  vm.createContext(ctx);
  // engine lives inside an IIFE (254..1105) — inject an export shim right after its init() call
  const anchor = scripts.lastIndexOf('init();');
  const injected = anchor < 0 ? scripts : scripts.slice(0, anchor + 6) + `
    ;globalThis.__api = { S, newGame, makeCard, doMove, dealFromStock, autoMoveToFoundation, checkWin, flipTopCards, findFoundationDrop };` + scripts.slice(anchor + 6);
  vm.runInContext(injected, ctx, { filename: 'solitaire-inline.js' });
  return ctx;
}

// engine rules mirrors, exactly as findFoundationDrop / canPlaceOnTableau: value 0..12, color 0/1
function canFound(state, card, fi) {
  const f = state.foundations[fi];
  if (f.length === 0) return card.value === 0;
  const top = f[f.length - 1];
  return top.suit === card.suit && card.value === top.value + 1;
}
function canTab(state, cards, col) {
  const pile = state.tableau[col];
  if (pile.length === 0) return cards[0].value === 12; // only Kings on empty
  const top = pile[pile.length - 1];
  if (!top.faceUp) return false;
  return top.color !== cards[0].color && cards[0].value === top.value - 1;
}
const key = st => JSON.stringify([st.stock.length, st.waste.map(c => c.id).join(','), st.foundations.map(f => f.length), st.tableau.map(t => t.map(c => (c.faceUp ? 'U' : 'd') + c.id).join('.')).join('|')]);

// search: exhaustive search explodes on the onF-plateau (millions of tableau permutations with
// identical foundation counts) — a rigged trivial win burns >100k nodes. Use Monte-Carlo greedy
// rollouts with heuristic move scoring instead: this is a POLICY (win-rate evidence), and every
// winning rollout is a concrete move line replayed through the engine's doMove/dealFromStock.
function rollout(initial, rnd, maxMoves) {
  const st = JSON.parse(JSON.stringify(initial));
  const path = [];
  const buryDepth = (col, i) => i; // cards buried above position i
  for (let step = 0; step < maxMoves; step++) {
    const onF = st.foundations.reduce((a, f) => a + f.length, 0);
    if (onF === 52) return { won: true, path, onF };
    const cands = [];
    if (st.waste.length) {
      const c = st.waste[st.waste.length - 1];
      for (let fi = 0; fi < 4; fi++) if (canFound(st, c, fi)) cands.push({ mv: { kind: 'wf', fi }, score: 100 });
      for (let col = 0; col < 7; col++) if (canTab(st, [c], col)) cands.push({ mv: { kind: 'wt', col }, score: 30 });
    }
    for (let col = 0; col < 7; col++) {
      const pile = st.tableau[col];
      if (!pile.length) continue;
      const c = pile[pile.length - 1];
      if (c.faceUp) for (let fi = 0; fi < 4; fi++) if (canFound(st, c, fi)) cands.push({ mv: { kind: 'tf', col, fi }, score: 90 });
      for (let i = pile.length - 1; i >= 0; i--) {
        if (!pile[i].faceUp) break;
        const run = pile.slice(i);
        for (let dst = 0; dst < 7; dst++) {
          if (dst === col || !canTab(st, run, dst)) continue;
          const uncovers = i > 0 && !pile[i - 1].faceUp; // uncovers a face-down card
          const freesKingBase = pile[0].value === 12 && st.tableau[dst].length === 0 && i === 0 ? false : true;
          let score = uncovers ? 60 : 5;
          if (pile[0].value === 12 && i === 0 && st.tableau[dst].length === 0) score = 1; // useless King shuffle
          cands.push({ mv: { kind: 'tt', col, i, dst }, score });
        }
      }
    }
    for (let fi = 0; fi < 4; fi++) {
      const f = st.foundations[fi];
      if (!f.length) continue;
      const c = f[f.length - 1];
      if (c.value === 0) continue;
      for (let col = 0; col < 7; col++) if (canTab(st, [c], col)) cands.push({ mv: { kind: 'ft', fi, col }, score: 8 });
    }
    if (st.stock.length) cands.push({ mv: { kind: 'deal' }, score: 20 + st.waste.length * 0.0 });
    else if (st.waste.length) cands.push({ mv: { kind: 'deal' }, score: 12 }); // recycle
    if (!cands.length) return { won: false, path, onF };
    // weighted random pick (foundation-first bias, exploration elsewhere)
    let total = 0;
    for (const c of cands) total += c.score;
    let r = rnd() * total, pick = cands[0];
    for (const c of cands) { r -= c.score; if (r <= 0) { pick = c; break; } }
    applyMove(st, pick.mv);
    path.push(pick.mv);
  }
  return { won: false, path, onF: st.foundations.reduce((a, f) => a + f.length, 0) };
}
function applyMove(st, mv) {
  const flip = col => { const p = st.tableau[col]; if (p.length && !p[p.length - 1].faceUp) p[p.length - 1].faceUp = true; };
  if (mv.kind === 'deal') {
    if (st.stock.length) { const c = st.stock.pop(); c.faceUp = true; st.waste.push(c); return true; } // engine dealFromStock sets faceUp
    if (st.waste.length) { st.stock = st.waste.reverse().map(c => ({ ...c, faceUp: false })); st.waste = []; return true; }
    return false;
  }
  if (mv.kind === 'wf') { const c = st.waste.pop(); c.faceUp = true; st.foundations[mv.fi].push(c); return true; }
  if (mv.kind === 'wt') { const c = st.waste.pop(); c.faceUp = true; st.tableau[mv.col].push(c); return true; }
  if (mv.kind === 'tf') { const c = st.tableau[mv.col].pop(); st.foundations[mv.fi].push(c); flip(mv.col); return true; }
  if (mv.kind === 'tt') { const run = st.tableau[mv.col].splice(mv.i); st.tableau[mv.dst].push(...run); flip(mv.col); return true; }
  if (mv.kind === 'ft') { const c = st.foundations[mv.fi].pop(); c.faceUp = true; st.tableau[mv.col].push(c); return true; }
  return false;
}

let pass = 0, fail = 0; const notes = [];
const T = (name, ok, info) => { if (ok) pass++; else { fail++; notes.push(name + (info ? ': ' + info : '')); } return ok; };

// ── 1. deal integrity over 10 seeded shuffles ──
let dealsOK = 0;
for (let i = 0; i < 10; i++) {
  const ctx = mkSandbox(4242 + i * 101);
  const api = ctx.__api;
  api.newGame();
  const S = api.S;
  const all = [...S.stock, ...S.waste, ...S.foundations.flat(), ...S.tableau.flat()];
  const ids = new Set(all.map(c => c.suit + c.rank));
  const sizesOK = S.tableau.every((t, ci) => t.length === ci + 1) && S.stock.length === 24 && all.length === 52;
  const faceOK = S.tableau.every(t => t.filter(c => c.faceUp).length === 1 && t[t.length - 1].faceUp);
  if (ids.size === 52 && sizesOK && faceOK) dealsOK++;
}
T('deal-integrity(10 seeds)', dealsOK === 10, dealsOK + '/10');

// ── 2. forced win through the engine's own functions ──
{
  const ctx = mkSandbox(777);
  const api = ctx.__api;
  api.newGame();
  const S = api.S;
  // build near-won state: foundations A/2..Q of each suit, remaining 4 kings spread on tableau
  S.stock = []; S.waste = []; S.tableau = [[], [], [], [], [], [], []];
  S.foundations = [[], [], [], []];
  const mk = (suit, rank) => { const c = api.makeCard(suit, rank); c.faceUp = true; return c; };
  const SUITS = ['spade', 'heart', 'diamond', 'club'];
  for (let fi = 0; fi < 4; fi++) {
    const f = [];
    for (let v = 0; v <= 11; v++) f.push(mk(SUITS[fi], 'A23456789TJQK'[v]));
    S.foundations[fi] = f;
  }
  for (let k = 0; k < 4; k++) S.tableau[k] = [mk(SUITS[k], 'K')];
  // finish via engine autoMoveToFoundation
  let moved = true, guard = 0;
  while (moved && guard++ < 20) {
    moved = false;
    for (let col = 0; col < 7; col++) {
      const pile = S.tableau[col];
      if (pile.length && api.autoMoveToFoundation(pile[pile.length - 1], { type: 'tableau', col, idx: pile.length - 1 })) { moved = true; break; }
    }
  }
  const total = S.foundations.reduce((a, f) => a + f.length, 0);
  T('forced-win(checkWin fires, 52 on foundations)', S.gameWon === true && total === 52, 'total=' + total + ' won=' + S.gameWon);
}

// ── 3. seeded-deal policy-win rate (Monte-Carlo greedy) + engine replay of winning lines ──
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let solved = 0, replayed = 0;
const perDeal = [];
const ROLLOUTS = 400;
for (let i = 0; i < 10; i++) {
  const ctx = mkSandbox(90000 + i * 3571);
  const api = ctx.__api;
  api.newGame();
  const S = api.S;
  const initial = { stock: S.stock.map(c => ({ ...c })), waste: [], foundations: [[], [], [], []], tableau: S.tableau.map(t => t.map(c => ({ ...c }))) };
  let sol = null, bestOnF = 0;
  for (let r = 0; r < ROLLOUTS && !sol; r++) {
    const res = rollout(initial, mulberry32(0xBEEF + i * 613 + r * 37), 500);
    bestOnF = Math.max(bestOnF, res.onF);
    if (res.won) sol = res.path;
  }
  perDeal.push(sol ? sol.length : -bestOnF); // negative = best foundation progress on losing deals
  if (!sol) continue;
  solved++;
  // replay through the engine (proves doMove/dealFromStock accept every move of the line)
  api.newGame();
  const S2 = api.S;
  S2.stock = S.stock.map(c => ({ ...c })); S2.waste = []; S2.foundations = [[], [], [], []];
  S2.tableau = S.tableau.map(t => t.map(c => ({ ...c })));
  let ok = true;
  for (const mv of sol) {
    if (mv.kind === 'deal') { api.dealFromStock(); continue; }
    if (mv.kind === 'wf' || mv.kind === 'wt') {
      const c = S2.waste[S2.waste.length - 1];
      if (mv.kind === 'wf') api.doMove({ type: 'waste' }, { type: 'foundation', fi: mv.fi }, [c]);
      else api.doMove({ type: 'waste' }, { type: 'tableau', col: mv.col }, [c]);
    } else if (mv.kind === 'tf') {
      const pile = S2.tableau[mv.col];
      api.doMove({ type: 'tableau', col: mv.col, idx: pile.length - 1 }, { type: 'foundation', fi: mv.fi }, [pile[pile.length - 1]]);
    } else if (mv.kind === 'tt') {
      const pile = S2.tableau[mv.col];
      const run = pile.slice(mv.i);
      api.doMove({ type: 'tableau', col: mv.col, idx: mv.i }, { type: 'tableau', col: mv.dst }, run);
    } else if (mv.kind === 'ft') {
      const f = S2.foundations[mv.fi];
      api.doMove({ type: 'foundation', fi: mv.fi }, { type: 'tableau', col: mv.col }, [f[f.length - 1]]);
    }
    const total = S2.foundations.reduce((a, f) => a + f.length, 0);
    if (total !== S2.foundations.reduce((a, f) => a + f.length, 0)) { ok = false; break; }
  }
  const total = S2.foundations.reduce((a, f) => a + f.length, 0);
  if (ok && total === 52 && S2.gameWon) replayed++;
}
T('policy-win ≥2/10 seeded deals', solved >= 2, solved + '/10 (win len / -best onF: ' + perDeal.join(',') + ')');
T('engine-replay of winning lines', replayed === solved, replayed + '/' + solved);

const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict, extra: { dealsOK, solved, replayed, perDealMoves: perDeal, notes }, harness: 'node-vm (replaces kachilu-browser script)' }));
process.exit(fail === 0 ? 0 : 1);
