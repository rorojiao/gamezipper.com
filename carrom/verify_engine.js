const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SLUG = 'carrom';
/* spec v3 vm template: persistent element registry, immediate setTimeout, seeded Math.random */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
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
    querySelector: () => null, querySelectorAll: () => [],
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
  __timerErrors: [], __getEl: getEl,
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* Driver (type B skill game): play a complete legal 2-player freestyle game to a terminal
 * result. All shots via the engine's REAL input path (onPointerDown place+drag,
 * onPointerMove aim/power, onPointerUp -> shootStriker) + engine updatePhysics ticks.
 * Engine rules discovered by rollouts: max-power striker range is ~520px (friction 0.984),
 * so only coins near the shooter's baseline are hittable at speed; a pocketed OWN coin is a
 * foul that returns exactly one coin, so own-colour clears need 2-in-one-shot, while
 * pocketing the OPPONENT colour is permanent. Search = physics rollout on cloned state,
 * candidates: aligned full shots + graze/cut fans (perpendicular aim offsets) at every coin
 * near a pocket from a swept striker position; scored by net permanent pockets + sum of
 * pocket-distance improvements. */
const DRIVER = `
(function () {
  var pass = 0, fail = 0, fails = [], notes = [];
  var DT = 1 / 60;
  try {
    var rect = { left: 0, top: 0, width: canvasSize, height: canvasSize };
    canvas.getBoundingClientRect = function () { return rect; };
    startGame('2p');
    gameMode = 'freestyle'; /* real UI mode (data-mode="freestyle"); node DOM defaults to classic */
    setupPieces(); resetStriker(); gameState = 'placing';
    var nW = pieces.filter(function (p) { return p.type === 0; }).length, nB = pieces.filter(function (p) { return p.type === 1; }).length;
    if (nW + nB !== 17) throw new Error('freestyle setup produced ' + (nW + nB) + ' coins');
    notes.push('freestyle setup: ' + nW + ' white + ' + nB + ' black coins (generator asymmetry: inner ring gives blacks 4 spots vs whites 2; game stays completable)');
    function minPocketDist(p) { var m = 1e9; for (var i = 0; i < POCKETS.length; i++) { var d = Math.hypot(p.x - POCKETS[i].x, p.y - POCKETS[i].y); if (d < m) m = d; } return m; }
    function snap() {
      return { pieces: pieces, striker: striker, gs: gameState,
        pocketed: JSON.parse(JSON.stringify(pocketed)), scores: scores.slice(),
        sp: strikerPocketed, ft: foulThisTurn, qp: queenPending, qpb: queenPocketedBy, qc: queenCovered };
    }
    function restore(s) { pieces = s.pieces; striker = s.striker; gameState = s.gs; pocketed = s.pocketed;
      scores = s.scores; strikerPocketed = s.sp; foulThisTurn = s.ft; queenPending = s.qp; queenPocketedBy = s.qpb; queenCovered = s.qc; }
    function tryShot(sx, sy, angle, power) {
      var s = snap();
      var beforeD = 0; pieces.forEach(function (p) { if (!p.pocketed) beforeD += minPocketDist(p); });
      pieces = s.pieces.map(function (p) { var q = new Piece(p.x, p.y, p.type); q.vx = p.vx; q.vy = p.vy; q.radius = p.radius; q.pocketed = p.pocketed; q.active = p.active; return q; });
      striker = new Piece(sx, sy, s.striker.type); striker.radius = STRIKER_R;
      striker.vx = Math.cos(angle) * power * 0.38; striker.vy = Math.sin(angle) * power * 0.38;
      strikerPocketed = false; foulThisTurn = false; queenPending = false;
      gameState = 'roll';
      var before = pieces.map(function (p) { return p.pocketed ? 1 : 0; });
      var t = 0;
      while (t < 2600) {
        updatePhysics(DT); t++;
        var moving = false, all = pieces.concat([striker]);
        for (var i = 0; i < all.length; i++) { var p = all[i]; if (!p.pocketed && (Math.abs(p.vx) > 0.15 || Math.abs(p.vy) > 0.15)) { moving = true; break; } }
        if (!moving) break;
      }
      var me = s.striker.type, res = { opp: 0, own: 0, strikerPocketed: striker.pocketed };
      for (var k = 0; k < pieces.length; k++) if (!before[k] && pieces[k].pocketed) { if (pieces[k].type === me) res.own++; else res.opp++; }
      var afterD = 0; pieces.forEach(function (p) { if (!p.pocketed) afterD += minPocketDist(p); });
      res.improve = beforeD - afterD;
      particles = []; sparkles = [];
      restore(s);
      return res;
    }
    function score(r) { /* net permanent pockets: own fouls return one coin per shot */
      var net = r.opp + Math.max(0, r.own - 1);
      return net * 2000 + r.improve - (r.strikerPocketed ? 30000 : 0);
    }
    function genCandidates(me) {
      var sy = me === 0 ? BASELINE_TOP : BASELINE_BOTTOM, out = [];
      var live = pieces.filter(function (p) { return !p.pocketed; });
      var lo = CX - STRIKER_RANGE + 8, hi = CX + STRIKER_RANGE - 8;
      for (var pi = 0; pi < live.length; pi++) {
        var P = live[pi];
        if (minPocketDist(P) > 270) continue;
        for (var sx = lo; sx <= hi + 1; sx += 70) {
          if (Math.hypot(P.x - sx, P.y - sy) > 480) continue; /* striker range: ~520px at full power */
          var dx = P.x - sx, dy = P.y - sy, dl = Math.hypot(dx, dy) || 1;
          var px = -dy / dl, py = dx / dl;
          var offs = [0, 30, -30, 65, -65];
          for (var oi = 0; oi < offs.length; oi++) {
            var ax = P.x + px * offs[oi], ay = P.y + py * offs[oi];
            out.push({ sx: sx, ang: Math.atan2(ay - sy, ax - sx), pow: 22 });
          }
        }
        /* aligned centre hits: striker x that lines up striker->coin->each pocket */
        for (var ki = 0; ki < POCKETS.length; ki++) {
          var K = POCKETS[ki];
          var sxk = P.x + (P.y - sy) * (P.x - K.x) / (K.y - P.y);
          if (sxk < lo || sxk > hi) continue;
          if (Math.hypot(P.x - sxk, P.y - sy) > 480) continue;
          out.push({ sx: sxk, ang: Math.atan2(P.y - sy, P.x - sxk), pow: 22 });
        }
      }
      return out;
    }
    function shootReal(sx, ang, pow) {
      var sy = currentPlayer === 0 ? BASELINE_TOP : BASELINE_BOTTOM;
      if (gameState === 'placing') { var c1 = boardToCanvas(sx, sy); onPointerDown({ clientX: c1.x, clientY: c1.y }); }
      if (gameState !== 'aiming') throw new Error('pointer place failed, state=' + gameState);
      var c2 = boardToCanvas(striker.x, striker.y);
      onPointerDown({ clientX: c2.x, clientY: c2.y });
      if (!isDragging) throw new Error('drag not started');
      var drag = boardToCanvas(striker.x + Math.cos(ang) * pow * 10, striker.y + Math.sin(ang) * pow * 10);
      onPointerMove({ clientX: drag.x, clientY: drag.y, preventDefault: function () {} });
      onPointerUp({});
      if (gameState !== 'moving') throw new Error('shootStriker not fired (power=' + aimPower + ')');
    }
    var turns = 0, shots = 0, rollouts = 0, t0 = Date.now(), pocketEvents = 0;
    while (gameState !== 'gameover' && turns < 400) {
      var me = currentPlayer;
      var cands = genCandidates(me);
      var sy = me === 0 ? BASELINE_TOP : BASELINE_BOTTOM;
      var best = null, bestScore = 20;
      for (var ci = 0; ci < cands.length; ci++) {
        rollouts++;
        var r = tryShot(cands[ci].sx, sy, cands[ci].ang, cands[ci].pow);
        var sc = score(r);
        if (sc > bestScore) { bestScore = sc; best = cands[ci]; }
      }
      if (!best) {
        /* fallback: cycle direct full-power hits at REACHABLE live coins (~520px striker range) */
        var reach = pieces.filter(function (p) { return !p.pocketed && Math.abs(p.y - sy) < 500; });
        var T = reach.length ? reach[turns % reach.length] : { x: CX, y: CY };
        var sx2 = Math.max(CX - STRIKER_RANGE + 8, Math.min(CX + STRIKER_RANGE - 8, T.x));
        best = { sx: sx2, ang: Math.atan2(T.y - sy, T.x - sx2), pow: 22 };
      }
      var beforeP = pieces.filter(function (p) { return p.pocketed; }).length;
      shootReal(best.sx, best.ang, best.pow); shots++;
      var t = 0;
      while (gameState === 'moving' && t < 9000) { updatePhysics(DT); t++; }
      var afterP = pieces.filter(function (p) { return p.pocketed; }).length;
      if (afterP > beforeP) { pocketEvents++; notes.push('turn ' + (turns + 1) + ' pl' + me + ': ' + (afterP - beforeP) + ' pocketed, ' + (pieces.filter(function (p) { return !p.pocketed; }).length) + ' coins left'); }
      turns++;
      if (Date.now() - t0 > 100000) throw new Error('budget: turn ' + turns + ', ' + pieces.filter(function (p) { return !p.pocketed; }).length + ' left; board=' + pieces.filter(function (p) { return !p.pocketed; }).map(function (p) { return (p.type === 0 ? 'W' : 'B') + p.x.toFixed(0) + ',' + p.y.toFixed(0); }).join(' '));
    }
    if (gameState !== 'gameover') throw new Error('no terminal state in 400 turns: ' + pieces.filter(function (p) { return !p.pocketed; }).length + ' coins left');
    var go = document.getElementById('game-over');
    if (!go.classList.contains('show')) throw new Error('endGame did not show #game-over overlay');
    var title = document.getElementById('go-title').textContent;
    var statsNow = JSON.parse(localStorage.getItem('carrom_stats') || '{}');
    if (!(statsNow.played >= 1)) throw new Error('endGame did not persist carrom_stats.played');
    if (scores[0] + scores[1] <= 0) throw new Error('no points scored in full game');
    pass++;
    notes.push('full freestyle 2P game terminal: ' + turns + ' turns / ' + shots + ' shots / ' + pocketEvents + ' pocket turns, result="' + title + '", scores=' + JSON.stringify(scores) + ', stats.played=' + statsNow.played);
    notes.push('search: ' + rollouts + ' physics rollouts on cloned state; all real shots via onPointerDown/Move/Up -> shootStriker -> engine updatePhysics');
  } catch (e) { fail++; fails.push(String(e.message).slice(0, 250)); }
  return { pass: pass, fail: fail, total: pass + fail, fails: fails, notes: notes.slice(0, 12),
    summary: pass === 1 ? 'complete legal game to terminal endGame via pointer-path shots + rollout search' : 'game did not terminate' };
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
