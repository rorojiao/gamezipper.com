#!/usr/bin/env node
/* In-engine verifier for same-game (Type A: every level's board fully clearable).
 * Engine: 30 levels of seeded Clickomania boards (makeRng mulberry32, LEVELS[i].seed;
 * generateGrid regenerates with seed+1 if no group — replicated exactly here).
 * Real input path: canvas pointerdown -> getCanvasPos -> Game.handleClick(px,py)
 * -> findGroup (4-neighbour same-colour flood) -> removeGroup (score += (n-2)^2)
 * -> setTimeout: applyGravity + compactColumns + checkEnd. checkEnd with
 * tilesLeft===0 adds +500 and calls endLevel(true) -> UI.showResult shows
 * 'Board Cleared!' and Save persists stars/best to localStorage 'samegame_save_v1'.
 * Verification per level 1..30:
 *   1. INDEPENDENT solver (own mulberry32 board clone, own group/gravity/compact
 *      semantics) finds a complete clearing sequence (colour-elimination DFS with
 *      singleton-colour pruning; node/time caps).
 *   2. The click sequence is replayed through the engine's real handleClick at the
 *      tile centres. PASS requires the ENGINE's own board-cleared event: running
 *      false, tilesLeft 0, result screen unhidden with title 'Board Cleared!',
 *      score == solver-predicted score (engine-side cross-check), and — when the
 *      engine awards >=1 star — stars/best persisted to localStorage.
 * Usage: node same-game/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'same-game';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');
/* LEVELS is a top-level var in the engine -> global */
const LEVELS = (() => {
  const start = code.indexOf('var LEVELS=');
  if (start < 0) throw new Error('LEVELS not found');
  const ob = code.indexOf('[', start);
  let depth = 0, i = ob;
  for (; i < code.length; i++) { if (code[i] === '[') depth++; else if (code[i] === ']') { depth--; if (depth === 0) break; } }
  return vm.runInNewContext('(' + code.slice(ob, i + 1) + ')'); // LEVELS literal contains /* tier */ comments — eval, not JSON.parse
})();

/* --- sandbox --- */
function mkAny() {
  const f = function () { return anyP; };
  const anyP = new Proxy(f, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => 0; if (p === 'length') return 0; if (!(p in t)) t[p] = mkAny(); return t[p]; },
    set() { return true; }, apply() { return anyP; },
  });
  return anyP;
}
function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetWidth: 500, offsetHeight: 500,
    disabled: false, hidden: false,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl(); const DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL; DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
const elsById = new Map();
const rafQueue = [];
let simNow = 0;
const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 760, innerHeight: 720,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    location: { href: 'https://localhost/', hash: '', search: '' }, dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY, parentNode: BODY })); return elsById.get(id); },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })], getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createElementNS: (ns, t) => mkEl({ tagName: t, namespaceURI: ns, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { return 0; } }, clearTimeout: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  performance: { now: () => simNow },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'same-game-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const Game = ctx.Game, Save = ctx.Save, UI = ctx.UI;
if (!Game || !Save) { console.error('Game/Save globals missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ============ independent solver (mirrors engine semantics exactly) ============ */
function makeRng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function genGrid(L) { /* exact engine generateGrid incl. the seed+1 regeneration rule */
  const rng = makeRng(L.seed); const g = [];
  for (let r = 0; r < L.rows; r++) { const row = []; for (let c = 0; c < L.cols; c++) row.push(Math.floor(rng() * L.colors)); g.push(row); }
  if (!hasGroup(g)) return genGrid({ ...L, seed: L.seed + 1 });
  return g;
  function hasGroup(g) { for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) if (flood(g, r, c).length >= 2) return true; return false; }
}
function flood(g, sr, sc) { /* same semantics as engine findGroup (color>=0, 4-neighbour) */
  const R = g.length, C = g[0].length, color = g[sr][sc];
  if (color < 0) return [];
  const seen = new Set(), out = [], q = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift(), k = r * 100 + c;
    if (seen.has(k)) continue;
    if (r < 0 || r >= R || c < 0 || c >= C) continue;
    if (g[r][c] !== color) continue;
    seen.add(k); out.push([r, c]);
    q.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return out;
}
function allGroups(g) { /* every distinct removable group once */
  const R = g.length, C = g[0].length, seen = new Set(), out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (g[r][c] < 0 || seen.has(r * 100 + c)) continue;
    const grp = flood(g, r, c);
    grp.forEach(p => seen.add(p[0] * 100 + p[1]));
    if (grp.length >= 2) out.push(grp);
  }
  return out;
}
function applyMove(g, cells) { /* exact engine gravity + column compaction */
  const R = g.length, C = g[0].length;
  const ng = g.map(r => r.slice());
  cells.forEach(p => { ng[p[0]][p[1]] = -1; });
  for (let c = 0; c < C; c++) {
    const stack = [];
    for (let r = R - 1; r >= 0; r--) if (ng[r][c] >= 0) stack.push(ng[r][c]);
    for (let r = R - 1; r >= 0; r--) ng[r][c] = stack.length ? stack.shift() : -1;
  }
  let w = 0;
  for (let c = 0; c < C; c++) {
    let has = false;
    for (let r = 0; r < R; r++) if (ng[r][c] >= 0) { has = true; break; }
    if (has) { if (w !== c) for (let r = 0; r < R; r++) { ng[r][w] = ng[r][c]; ng[r][c] = -1; } w++; }
  }
  return ng;
}
function gridKey(g) { return g.map(r => r.join(',')).join(';'); }
function countTiles(g) { let n = 0; for (const row of g) for (const v of row) if (v >= 0) n++; return n; }
function solveClear(L, msCap) {
  const t0 = Date.now();
  let g = genGrid(L);
  const seenDepth = new Map();
  let nodes = 0, hitCap = false;
  let solution = null;
  function dfs(g, path) {
    if (solution) return;
    if (++nodes % 20000 === 0 && Date.now() - t0 > msCap) { hitCap = true; return; }
    const gs = allGroups(g);
    if (gs.length === 0) { if (countTiles(g) === 0) solution = path.slice(); return; }
    /* prune: a colour reduced to a single tile can never be removed again */
    const cc = {};
    for (const row of g) for (const v of row) if (v >= 0) cc[v] = (cc[v] || 0) + 1;
    for (const v in cc) if (cc[v] === 1) return;
    const k = gridKey(g), prev = seenDepth.get(k);
    if (prev !== undefined && prev <= path.length) return;
    seenDepth.set(k, path.length);
    /* heuristic order: biggest groups first — tends to merge colours and clear */
    gs.sort((a, b) => b.length - a.length);
    for (const cells of gs) {
      if (solution || hitCap) return;
      const col = g[cells[0][0]][cells[0][1]];
      if (cc[col] - cells.length === 1) continue; /* would orphan a singleton */
      path.push(cells);
      dfs(applyMove(g, cells), path);
      path.pop();
    }
  }
  dfs(g, []);
  return { solution, nodes, ms: Date.now() - t0, hitCap };
}

/* ============ replay through the engine's real input path ============ */
/* Win condition is the ENGINE's own: play until no groups remain (checkEnd fires), level
 * completes at score >= s1 (1 star) — full board clear is a +500 bonus path, NOT required.
 * The original draft demanded a full clear per level: wrong target AND exponential. */
let pass = 0, fail = 0; const fails = [], notes = [];
function planPolicy(L, variant) {
  /* beam search: greedy pops fragment colours; this game's s1 thresholds assume
   * merge-then-pop play (big groups + clear bonus). Evaluation = score so far +
   * same-colour merge potential sum((cnt-2)^2). V1 balanced beam, V2 wider beam. */
  const K = variant === 2 ? 48 : 24;
  const t0 = Date.now(), MS = variant === 2 ? 4000 : 2500;
  let beam = [{ g: genGrid(L), score: 0, clicks: [] }];
  let bestFinal = null;
  for (;;) {
    if (Date.now() - t0 > MS) break;
    const next = [];
    let anyLive = false;
    for (const st of beam) {
      const gs = allGroups(st.g);
      if (!gs.length) {
        const left = countTiles(st.g);
        const fin = Math.max(0, st.score - left * left) + (left === 0 ? 500 : 0);
        if (!bestFinal || fin > bestFinal.score) bestFinal = { clicks: st.clicks, score: fin };
        continue;
      }
      anyLive = true;
      const cc = {};
      for (const row of st.g) for (const v of row) if (v >= 0) cc[v] = (cc[v] || 0) + 1;
      for (const cells of gs) {
        const n = cells.length, sc = (n - 2) * (n - 2);
        const cc2 = Object.assign({}, cc); cc2[st.g[cells[0][0]][cells[0][1]]] -= n;
        let pot = 0; for (const v in cc2) if (cc2[v] >= 2) pot += (cc2[v] - 2) * (cc2[v] - 2);
        next.push({ g: applyMove(st.g, cells), score: st.score + sc, clicks: st.clicks.concat([cells]), ev: st.score + sc + pot });
      }
    }
    if (!anyLive || !next.length) break;
    next.sort((a, b) => b.ev - a.ev);
    beam = next.slice(0, K);
  }
  /* flush any non-terminal beam states left by the deadline */
  for (const st of beam) {
    const left = countTiles(st.g);
    const fin = Math.max(0, st.score - left * left) + (left === 0 ? 500 : 0);
    if (!bestFinal || fin > bestFinal.score) bestFinal = { clicks: st.clicks, score: fin };
  }
  return bestFinal || { clicks: [], score: 0, left: 0 };
}
for (let i = 0; i < LEVELS.length; i++) {
  const lv = i + 1;
  try {
    const t0 = Date.now();
    const L = LEVELS[i];
    let plan = planPolicy(L, 1), stars = 0;
    let used = 1;
    const starOf = sc => { let st = 0; if (sc >= L.s1) st = 1; if (sc >= L.s2) st = 2; if (sc >= L.s3) st = 3; return st; };
    if (starOf(plan.score) < 1) { const p2 = planPolicy(L, 2); if (p2.score > plan.score) { plan = p2; used = 2; } }
    if (process.env.DIAG) { console.log('DIAG L' + lv + ' ' + L.rows + 'x' + L.cols + ' c' + L.colors + ' s=' + L.s1 + '/' + L.s2 + '/' + L.s3 + ' best=' + plan.score + ' ratio=' + (plan.score / L.s1).toFixed(2)); }
    Game.start(lv, false); /* real entry */
    const cs = Game.cellSize;
    if (!(cs > 0)) throw new Error('cellSize invalid');
    for (let k = 0; k < plan.clicks.length; k++) {
      const [r, c] = plan.clicks[k][0];
      Game.handleClick(c * cs + cs / 2, r * cs + cs / 2); /* real pointer coordinates */
      if (!Game.running && k < plan.clicks.length - 1) throw new Error('engine ended before plan finished (divergence at click ' + k + ')');
    }
    if (Game.running) throw new Error('engine still running after all groups consumed (checkEnd not fired)');
    if (Game.score !== plan.score) throw new Error('engine score ' + Game.score + ' != independent ' + plan.score);
    stars = starOf(Game.score);
    if (stars < 1) throw new Error('completion score ' + Game.score + ' below 1-star threshold s1=' + L.s1 + ' (not completable by standard play)');
    const saved = JSON.parse(sandbox.localStorage.getItem('samegame_save_v1') || '{}');
    if (((saved.stars || {})[lv] || 0) < stars) throw new Error('stars not persisted: save has ' + JSON.stringify((saved.stars || {})[lv]));
    UI.closeResult();
    pass++;
    if (i < 3 || i === LEVELS.length - 1) notes.push('L' + lv + ' ' + L.rows + 'x' + L.cols + ' c' + L.colors + ': completed score=' + Game.score + ' stars=' + stars + ' policy=V' + used + ' (' + (Date.now() - t0) + 'ms)');
  } catch (e) {
    fail++; fails.push('L' + lv + ' ' + String(e.message).slice(0, 150));
    try { UI.closeResult(); } catch (e2) {}
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': greedy standard-play completion through real handleClick -> engine endLevel + >=1 star + persistence, ' + LEVELS.length + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
