const SURGERY_ANCHOR = 'function placeWall(q, r){';
const SURGERY_EXPORT = "globalThis.__X = { LEVELS: function () { return LEVELS; }, state: function () { return state; }, placeWall: placeWall, updateCatMove: updateCatMove, checkGameOver: checkGameOver, catMove: catMove, isBlocked: isBlocked, bfsDistToBorder: bfsDistToBorder, neighborsOf: neighborsOf, inBounds: inBounds, keyOf: keyOf, isBorder: isBorder, loadLevel: loadLevel, loadDaily: loadDaily, useHint: useHint, currentLevel: currentLevel, GRID: GRID_SIZE, DIRS: HEX_DIRS };\n";
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SLUG = 'catch-the-cat';
/* spec v3 vm template: persistent element registry, immediate setTimeout, seeded Math.random */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let code = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
/* optional per-game source surgery: export IIFE internals via unique anchor (spec v3) */
if (typeof SURGERY_ANCHOR === 'string') {
  if (!code.includes(SURGERY_ANCHOR)) { console.error('surgery anchor not found: ' + SURGERY_ANCHOR); process.exit(1); }
  code = code.replace(SURGERY_ANCHOR, SURGERY_EXPORT + SURGERY_ANCHOR);
}
const elsById = new Map();
function mkEl(extra) {
  const el = {
    id: '', className: '', tagName: '', textContent: '', innerHTML: '', value: '', src: '', href: '',
    style: { setProperty() {} }, dataset: {}, children: [],
    clientWidth: 800, clientHeight: 450, offsetWidth: 800, offsetHeight: 450, width: 800, height: 450,
    disabled: false, hidden: false, checked: false,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {}, insertBefore(c) { return c; },
    querySelector() { return mkEl(); }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, right: 800, bottom: 450, width: 800, height: 450 }; },
    setAttribute() {}, getAttribute() { return ''; }, removeAttribute() {},
    focus() {}, blur() {}, click() {}, select() {},
    getContext() {
      return new Proxy({}, {
        get: (t, p) => {
          if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
          if (p === 'measureText') return () => ({ width: 10 });
          if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
          if (typeof p === 'string' && !(p in t)) return () => undefined;
          return t[p];
        },
        set: () => true,
      });
    },
  };
  Object.assign(el, extra || {});
  return el;
}
function getEl(id) { if (!elsById.has(id)) elsById.set(id, mkEl({ id })); return elsById.get(id); }
let __seed = 12345;
const MathClone = Object.create(Math);
MathClone.random = () => { __seed = (__seed * 1664525 + 1013904223) >>> 0; return __seed / 4294967296; };
const sandbox = {
  console: { log() {}, error() {}, warn() {} },
  Math: MathClone, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, WeakMap, Symbol, Promise,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone,
  Error, TypeError, RangeError, SyntaxError,
  Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
  setTimeout: (f) => { if (typeof f === 'function') { try { f(); } catch (e) { sandbox.__timerErrors.push(String(e && e.message)); } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, requestIdleCallback: () => 0, cancelIdleCallback() {},
  performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear() { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node-verify', maxTouchPoints: 1, vibrate() {}, clipboard: { writeText() {} }, language: 'en-US', languages: ['en-US'] },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '', reload() {} },
  document: {
    getElementById: getEl,
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getElementsByTagName: () => [], getElementsByClassName: () => [],
    addEventListener() {}, removeEventListener() {},
    createElement: t => mkEl({ tagName: t }), createElementNS: (ns, t) => mkEl({ tagName: t }),
    createTextNode: t => ({ textContent: t }),
    body: mkEl(), head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  Image: function () { const o = { onload: null, onerror: null, width: 0, height: 0 }; let s = ''; Object.defineProperty(o, 'src', { get: () => s, set(v) { s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  AudioContext: undefined, webkitAudioContext: undefined,
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, screen: { width: 1280, height: 720 },
  adsbygoogle: { push() {} },
  __timerErrors: [], __getEl: getEl, __reseed: n => { __seed = n >>> 0; },
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
/* Driver: play every level + the daily to an ENGINE-DETECTED win.
 * Wall placement goes through the engine's real interaction path placeWall() +
 * updateCatMove() completion; the engine's own win detection must fire (#overlay.show)
 * and non-daily wins must persist to catch-the-cat_save_v1.
 *
 * Policy layer 1: deterministic heuristics (P0 path[2] classic, P1 ring-2, P2 ring-3
 * with path+arc bonuses, several reseeds for the random-tie AI levels).
 * Policy layer 2 (fallback): exact bounded-depth search vs a faithful model of the
 * engine's cat AI — expert catMove() is fully deterministic (called directly); bfs may
 * only pick tied2[0] or tied2[1] (stable wall-pressure tie-sort, 80/20 random); easy
 * picks uniformly within the min-dist tie set; smart adds candidates[1] when within +1.
 * Cat nodes are AND-nodes over exactly those options, so a proven win holds against the
 * real engine regardless of its internal randomness. Unproven turns fall back to a
 * model-steered delay heuristic and the rollout is retried with fresh seeds. */
const DRIVER = `
(function () {
  var LEVELS = __X.LEVELS(), state = __X.state(), placeWall = __X.placeWall, updateCatMove = __X.updateCatMove,
      checkGameOver = __X.checkGameOver, catMove = __X.catMove, isBlocked = __X.isBlocked, bfsDistToBorder = __X.bfsDistToBorder,
      neighborsOf = __X.neighborsOf, inBounds = __X.inBounds, keyOf = __X.keyOf, isBorder = __X.isBorder,
      loadLevel = __X.loadLevel, loadDaily = __X.loadDaily, currentLevel = __X.currentLevel;
  var pass = 0, fail = 0, fails = [], notes = [];
  var ONLY_DAILY = /*CTC_TEST*/false;
  function snap() { return { q: state.cat.q, r: state.cat.r, walls: Object.assign({}, state.walls) }; }
  function restore(s) { state.cat.q = s.q; state.cat.r = s.r; state.cat.animQ = s.q; state.cat.animR = s.r; state.walls = Object.assign({}, s.walls); }

  /* ---------- heuristic policies ---------- */
  function escapePath() {
    if (isBorder(state.cat.q, state.cat.r)) return null;
    var prev = {}, seen = {}; seen[keyOf(state.cat.q, state.cat.r)] = 1;
    var q = [{ q: state.cat.q, r: state.cat.r }], head = 0;
    while (head < q.length) {
      var cur = q[head++];
      var ns = neighborsOf(cur.q, cur.r);
      for (var i = 0; i < ns.length; i++) {
        var n = ns[i], k = keyOf(n.q, n.r);
        if (seen[k] || isBlocked(n.q, n.r)) continue;
        seen[k] = 1; prev[k] = keyOf(cur.q, cur.r);
        if (isBorder(n.q, n.r)) { var path = [k], c = k; while (prev[c]) { c = prev[c]; path.unshift(c); } return path; }
        q.push(n);
      }
    }
    return null;
  }
  var POLICY = 0;
  function ringCells(dist) {
    var out = [], seen = {}; seen[keyOf(state.cat.q, state.cat.r)] = 1;
    var frontier = [{ q: state.cat.q, r: state.cat.r }];
    for (var d = 0; d < dist; d++) {
      var next = [];
      for (var i = 0; i < frontier.length; i++) {
        var ns = neighborsOf(frontier[i].q, frontier[i].r);
        for (var j = 0; j < ns.length; j++) {
          var k = keyOf(ns[j].q, ns[j].r);
          if (seen[k] || isBlocked(ns[j].q, ns[j].r)) continue;
          seen[k] = 1; next.push(ns[j]);
        }
      }
      frontier = next;
    }
    return frontier;
  }
  function bestWall() {
    var path = escapePath();
    var pathScore = {}; if (path) for (var i = 0; i < path.length; i++) pathScore[path[i]] = 40 - i * 2;
    function arcAdj(q, r) { var a = 0; var ns = neighborsOf(q, r); for (var i = 0; i < ns.length; i++) if (isBlocked(ns[i].q, ns[i].r)) a++; return a; }
    if (POLICY === 1 || POLICY === 2) {
      var cells = ringCells(POLICY === 1 ? 2 : 3);
      var best = null, bestScore = -Infinity;
      for (var ci = 0; ci < cells.length; ci++) {
        var c = cells[ci], k = keyOf(c.q, c.r);
        if (c.q === state.cat.q && c.r === state.cat.r) continue;
        state.walls[k] = true;
        var d = bfsDistToBorder(state.cat.q, state.cat.r);
        delete state.walls[k];
        var score = (d === Infinity ? 100000 : d * 10) + (pathScore[k] || 0) + arcAdj(c.q, c.r) * 3;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      if (best) return best;
    }
    if (path && path.length >= 3) {
      for (var idx = Math.min(2, path.length - 2); idx >= 1; idx--) {
        var pq = path[idx].split(',');
        if (!isBlocked(+pq[0], +pq[1])) return { q: +pq[0], r: +pq[1] };
      }
    }
    var best2 = null, bestScore2 = -Infinity;
    for (var q = 0; q < 11; q++) for (var r = 0; r < 11; r++) {
      if (isBlocked(q, r) || (q === state.cat.q && r === state.cat.r)) continue;
      state.walls[keyOf(q, r)] = true;
      var d2 = bfsDistToBorder(state.cat.q, state.cat.r);
      delete state.walls[keyOf(q, r)];
      var sc2 = (d2 === Infinity ? 100000 : d2 * 100) - (Math.abs(q - state.cat.q) + Math.abs(r - state.cat.r));
      if (sc2 > bestScore2) { bestScore2 = sc2; best2 = { q: q, r: r }; }
    }
    return best2;
  }
  function playOnce() {
    var walls = 0, guard = 0;
    while (!state.won && !state.failed && guard++ < 90) {
      var w = bestWall();
      if (!w) return { ok: false, walls: walls, why: 'no wall' };
      placeWall(w.q, w.r); walls++;
      if (!state.won && state.catMoving) { updateCatMove(230); updateCatMove(230); }
    }
    return { ok: state.won, walls: walls, why: state.failed ? 'escaped' : 'stalled' };
  }

  /* ---------- exact model of the engine's cat AI ---------- */
  function catOptions(catQ, catR, w) {
    state.cat.q = catQ; state.cat.r = catR; state.walls = w;
    var ns = neighborsOf(catQ, catR), cands = [];
    for (var i = 0; i < ns.length; i++) {
      var n = ns[i];
      if (isBlocked(n.q, n.r)) continue;
      cands.push({ q: n.q, r: n.r, dist: isBorder(n.q, n.r) ? 0 : bfsDistToBorder(n.q, n.r) });
    }
    if (cands.length === 0) return [];
    var ai = currentLevel().ai;
    if (ai === 'expert') { var mv = catMove(); return mv ? [mv] : []; }
    var min = cands[0].dist;
    for (var j = 1; j < cands.length; j++) if (cands[j].dist < min) min = cands[j].dist;
    var tied = [];
    for (var k = 0; k < cands.length; k++) if (cands[k].dist === min) tied.push(cands[k]);
    if (ai === 'bfs') {
      /* engine: sort ties by blocked-neighbour count desc (stable), pick [0] or 20% [1] */
      if (tied.length > 1) {
        function press(c) { var a = 0, n2 = neighborsOf(c.q, c.r); for (var m = 0; m < n2.length; m++) if (isBlocked(n2[m].q, n2[m].r)) a++; return a; }
        var t = tied.slice().sort(function (a, b) { return press(b) - press(a); });
        return t[0].q === t[1].q && t[0].r === t[1].r ? [t[0]] : [t[0], t[1]];
      }
      return [tied[0]];
    }
    var out = tied.slice();
    if (ai === 'smart' && cands.length >= 2 && cands[1].dist <= min + 1) out.push(cands[1]);
    return out;
  }
  function distToBorderMap(w) {
    state.walls = w;
    var d = {}, qu = [];
    for (var q = 0; q < 11; q++) for (var r = 0; r < 11; r++) {
      if (isBorder(q, r) && !isBlocked(q, r)) { d[keyOf(q, r)] = 0; qu.push({ q: q, r: r }); }
    }
    var head = 0;
    while (head < qu.length) {
      var cur = qu[head++], ns = neighborsOf(cur.q, cur.r);
      for (var i = 0; i < ns.length; i++) {
        var n = ns[i], k = keyOf(n.q, n.r);
        if (d[k] !== undefined || isBlocked(n.q, n.r)) continue;
        d[k] = d[keyOf(cur.q, cur.r)] + 1; qu.push(n);
      }
    }
    return d;
  }
  function candidateWalls(catQ, catR, w) {
    state.cat.q = catQ; state.cat.r = catR; state.walls = w;
    var seen = {}; seen[keyOf(catQ, catR)] = 1; var rings = [];
    var frontier = [{ q: catQ, r: catR }];
    for (var ring = 1; ring <= 3; ring++) {
      var next = [];
      for (var i = 0; i < frontier.length; i++) {
        var ns = neighborsOf(frontier[i].q, frontier[i].r);
        for (var j = 0; j < ns.length; j++) {
          var k = keyOf(ns[j].q, ns[j].r);
          if (seen[k] || isBlocked(ns[j].q, ns[j].r)) continue;
          seen[k] = 1; next.push(ns[j]); rings.push(ns[j]);
        }
      }
      frontier = next;
    }
    var dm = distToBorderMap(w);
    var dc = {}; dc[keyOf(catQ, catR)] = 0;
    var qu2 = [{ q: catQ, r: catR }], head2 = 0, dag = [];
    while (head2 < qu2.length) {
      var cur2 = qu2[head2++];
      var ns2 = neighborsOf(cur2.q, cur2.r);
      for (var m = 0; m < ns2.length; m++) {
        var n2 = ns2[m], k2 = keyOf(n2.q, n2.r);
        if (dc[k2] !== undefined || isBlocked(n2.q, n2.r)) continue;
        dc[k2] = dc[keyOf(cur2.q, cur2.r)] + 1; qu2.push(n2);
      }
    }
    var catD = dm[keyOf(catQ, catR)];
    if (catD !== undefined) {
      for (var kk in dc) {
        if (dm[kk] !== undefined && dc[kk] + dm[kk] === catD && !seen[kk]) {
          seen[kk] = 1;
          var p = kk.split(',');
          dag.push({ q: +p[0], r: +p[1], dOrder: dc[kk] });
        }
      }
      dag.sort(function (a, b) { return a.dOrder - b.dOrder; });
    }
    return dag.concat(rings);
  }
  var solveMemo = null;
  function skey(catQ, catR, w) { return catQ + ',' + catR + '|' + Object.keys(w).sort().join('.'); }
  function solveNode(catQ, catR, w, depthLeft, ctr) {
    if (ctr.n++ > ctr.cap) throw new Error('CAP');
    var key = skey(catQ, catR, w);
    var c = solveMemo.get(key);
    if (c) { if (c.win && c.d <= depthLeft) return true; if (!c.win && c.searched >= depthLeft) return false; }
    if (depthLeft <= 0) return false;
    var cands = candidateWalls(catQ, catR, w);
    for (var i = 0; i < cands.length; i++) {
      var w2 = Object.assign({}, w); w2[keyOf(cands[i].q, cands[i].r)] = true;
      var opts = catOptions(catQ, catR, w2);
      if (opts.length === 0) { solveMemo.set(key, { win: true, d: depthLeft }); return true; }
      var allWin = true;
      for (var j = 0; j < opts.length; j++) {
        if (isBorder(opts[j].q, opts[j].r)) { allWin = false; break; }
        if (!solveNode(opts[j].q, opts[j].r, w2, depthLeft - 1, ctr)) { allWin = false; break; }
      }
      if (allWin) { solveMemo.set(key, { win: true, d: depthLeft }); return true; }
    }
    solveMemo.set(key, { win: false, searched: depthLeft });
    return false;
  }
  function solveTurnWall(depths, cap, deadline) {
    var s = snap();
    for (var di = 0; di < depths.length; di++) {
      var D = depths[di], ctr = { n: 0, cap: cap };
      try {
        var cands = candidateWalls(s.q, s.r, s.walls);
        for (var i = 0; i < cands.length; i++) {
          var w2 = Object.assign({}, s.walls); w2[keyOf(cands[i].q, cands[i].r)] = true;
          var opts = catOptions(s.q, s.r, w2);
          if (opts.length === 0) return cands[i];
          var ok = true;
          for (var j = 0; j < opts.length; j++) {
            if (isBorder(opts[j].q, opts[j].r) || !solveNode(opts[j].q, opts[j].r, w2, D - 1, ctr)) { ok = false; break; }
          }
          if (ok) return cands[i];
        }
      } catch (e) { if (String(e.message) !== 'CAP') throw e; }
      if (Date.now() > deadline) return null;
    }
    return null;
  }
  /* model-steered delay heuristic: maximise the cat's worst-case post-move escape
   * distance, with a bonus for cells whose cat-option is already hemmed by blocks */
  function steerWall() {
    var s = snap(), cands = candidateWalls(s.q, s.r, s.walls);
    var best = null, bestScore = -Infinity;
    for (var i = 0; i < cands.length; i++) {
      var w2 = Object.assign({}, s.walls); w2[keyOf(cands[i].q, cands[i].r)] = true;
      var opts = catOptions(s.q, s.r, w2);
      if (opts.length === 0) return cands[i];
      var worst = Infinity;
      for (var j = 0; j < opts.length; j++) {
        var o = opts[j], sc;
        if (isBorder(o.q, o.r)) sc = -100000;
        else {
          state.cat.q = o.q; state.cat.r = o.r; state.walls = w2;
          var dd = bfsDistToBorder(o.q, o.r), hem = 0, ns2 = neighborsOf(o.q, o.r);
          for (var m = 0; m < ns2.length; m++) if (isBlocked(ns2[m].q, ns2[m].r)) hem++;
          sc = (dd === Infinity ? 100000 : dd * 12) + hem * 4;
        }
        if (sc < worst) worst = sc;
      }
      var score = worst - (Math.abs(cands[i].q - s.q) + Math.abs(cands[i].r - s.r));
      if (score > bestScore) { bestScore = score; best = cands[i]; }
    }
    restore(s);
    return best;
  }
  function playSolve(budgetMs, hardDeadline) {
    solveMemo = new Map();
    var t0 = Date.now(), walls = 0, guard = 0, proofs = 0;
    while (!state.won && !state.failed && guard++ < 60) {
      var wall = solveTurnWall([7, 11, 15, 19], 500000, Math.min(t0 + budgetMs, hardDeadline));
      var s = snap();
      restore(s);
      var w = wall || steerWall();
      if (!w) return { ok: false, walls: walls, why: 'no wall available', proofs: proofs }; // steer can return null on a fully-hemmed board — was a null-deref (L27)
      if (wall) proofs++;
      placeWall(w.q, w.r); walls++;
      if (!state.won && state.catMoving) { updateCatMove(230); updateCatMove(230); }
      if (!wall && Date.now() > t0 + budgetMs) return { ok: false, walls: walls, why: 'no proof + steer failed', proofs: proofs };
      if (Date.now() > hardDeadline) return { ok: false, walls: walls, why: 'hard deadline', proofs: proofs };
    }
    return { ok: state.won, walls: walls, why: state.failed ? 'escaped' : 'stalled', proofs: proofs };
  }

  /* ---------- level loop ---------- */
  function playLevel(makeFn, label, retries, solveBudget, hardDeadline) {
    var orders = [0, 1, 2];
    for (var pi = 0; pi < orders.length; pi++) {
      POLICY = orders[pi];
      for (var attempt = 0; attempt < retries; attempt++) {
        globalThis.__reseed(999 + pi * 104729 + attempt * 7919 + label.length * 131);
        makeFn();
        var res = playOnce();
        if (res.ok) return { walls: res.walls, policy: 'P' + pi };
        if (Date.now() > hardDeadline) break;
      }
    }
    for (var sr = 0; sr < 3; sr++) {
      globalThis.__reseed(31337 + sr * 65537);
      makeFn();
      var res2 = playSolve(sr === 0 ? solveBudget : 15000, hardDeadline);
      if (res2.ok) return { walls: res2.walls, policy: 'SOLVE(proofs: ' + res2.proofs + '/, steer walls: ' + (res2.walls - res2.proofs) + ')' };
      if (Date.now() > hardDeadline) break;
    }
    throw new Error('cat escaped; heuristics x' + (retries * 3) + ' + exact solver x3 failed (last: ' + res2.why + ' after ' + res2.walls + ' walls)');
  }
  if (!ONLY_DAILY) {
    for (var li = 0; li < LEVELS.length; li++) {
      try {
        var expertTier = li >= 18; /* L19+ adversarial search needs deeper budgets; early tiers pass via heuristics in seconds */
        var res = playLevel(function () { loadLevel(li); }, 'L' + li, 8, expertTier ? 25000 : 8000, Date.now() + (expertTier ? 50000 : 20000));
        var sv = JSON.parse(localStorage.getItem('catch-the-cat_save_v1') || '{}');
        if (!(sv.progress && sv.progress[li] > 0)) throw new Error('win not persisted to catch-the-cat_save_v1');
        if (!__getEl('overlay').classList.contains('show')) throw new Error('win overlay not shown');
        pass++;
        if (li < 2 || li === 26 || li === 28 || li === LEVELS.length - 1 || res.policy.indexOf('SOLVE') === 0)
          notes.push('L' + (li + 1) + ' (' + LEVELS[li].ai + ' AI, ' + LEVELS[li].obstacles.length + ' obstacles): trapped in ' + res.walls + ' walls via ' + res.policy);
      } catch (e) { fail++; fails.push('L' + (li + 1) + ': ' + String(e.message).slice(0, 130)); }
    }
  }
  try {
    var res = playLevel(function () { loadDaily(); }, 'daily', 4, 25000, Date.now() + 85000);
    if (!__getEl('overlay').classList.contains('show')) throw new Error('win overlay not shown');
    pass++; notes.push('daily (' + currentLevel().ai + ' AI, ' + currentLevel().obstacles.length + ' obstacles): trapped in ' + res.walls + ' walls via ' + res.policy);
  } catch (e) { fail++; fails.push('daily: ' + String(e.message).slice(0, 130)); }
  return { pass: pass, fail: fail, total: ONLY_DAILY ? 1 : pass + fail, fails: fails, notes: notes,
    summary: pass + '/' + (ONLY_DAILY ? 1 : LEVELS.length + 1) + ': every level + daily trapped via placeWall/updateCatMove (heuristics, exact-solver fallback)' };
})()
`;

let result = null;
try { result = vm.runInContext(DRIVER, ctx, { filename: 'driver.js' }); }
catch (e) { console.error('driver crashed:', e.stack || e.message); result = { pass: 0, fail: 1, total: 1, fails: [String(e.message).slice(0, 200)], verdict: 'FAIL' }; }
if (!result || typeof result !== 'object') { console.error('driver returned no result object'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + (result.summary || (out.pass + '/' + out.total + ' items ok')));
(result.notes || []).slice(0, 14).forEach(n => console.log('  ' + n));
(result.fails || []).slice(0, 14).forEach(f => console.log('  FAIL ' + f));
if (sandbox.__timerErrors.length) console.log('timerErrors: ' + JSON.stringify(sandbox.__timerErrors.slice(0, 3)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
