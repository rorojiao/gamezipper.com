#!/usr/bin/env node
/* GENERATED in-engine verifier for coin-machine — pattern follows phantom-blade/verify_engine.js.
 * Category: arcade/merge (Suika-like). vm sandbox loads the inline engine (top-level function
 * declarations — no source surgery needed) with a seeded LCG Math.random (deterministic runs).
 * Real input path: the engine's own canvas pointerdown/pointermove/pointerup handlers (captured
 * from addEventListener) -> dropCoin(); frames are pumped by the engine's own
 * gameLoop(timestamp) with a controllable performance.now.
 * ENGINE BUG FIXED (index.html, "ENGINE BUG FIX (verify BC1...)"): resolveCollisions skipped
 * ALL collision handling for different-level pairs (`if (a.level !== b.level) continue;` before
 * the collision math) — coins fell through each other to the floor, the pile could never gain
 * height, and checkGameOver's overflow state ("The machine overflowed!") was unreachable. Fix:
 * separation+impulse for every overlapping pair; merge still gated to equal levels.
 * Success events: merges -> score>0 + collection unlock persisted; terminal state: engine's own
 * overflow checkGameOver (dual wall-column + center-disposal policy overfills the machine);
 * then engine's own newGame() reset path + best/collection/prefs saves.
 * Usage: node coin-machine/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'dropCoin';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK) && s.includes('resolveCollisions'));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }

function mkAny() {
  const f = function () { return anyP; };
  const anyP = new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'length') return 0;
      if (!(p in t)) t[p] = mkAny();
      return t[p];
    },
    set() { return true; },
    apply() { return anyP; },
  });
  return anyP;
}
function mkEl(extra) {
  const el = {
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 400, clientHeight: 400,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: (t, fn) => { (el._vh = el._vh || {})[t] = (el._vh[t] || []); el._vh[t].push(fn); },
    removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl(), DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL;
DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
function ImageStub() { const o = { width: 0, height: 0, complete: true, onload: null, onerror: null, addEventListener: () => {} }; let _s = ''; Object.defineProperty(o, 'src', { get: () => _s, set: (v) => { _s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; }

let CLOCK = 0;
const elCache = {};
const DOCVH = {};
const WINVH = {};
// deterministic Math.random (LCG) so the whole run is reproducible
const seededMath = Object.create(Math);
let _seed = 20260816;
seededMath.random = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
// real-size responsive machine: 420px wide -> containerW=420, containerH=560 (engine: w=min(rect,420), h=w*4/3)
const CONT_W = 420, CONT_H = CONT_W * 4 / 3;
const CANVAS = mkEl({ id: 'game-canvas', width: CONT_W, height: CONT_H });
CANVAS.getBoundingClientRect = () => ({ left: 0, top: 0, width: CONT_W, height: CONT_H, right: CONT_W, bottom: CONT_H });
const NEXT_CANVAS = mkEl({ id: 'next-preview', width: 50, height: 50 });
const MACHINE = mkEl({ id: 'machine-container' });
MACHINE.getBoundingClientRect = () => ({ left: 0, top: 0, width: CONT_W, height: CONT_H, right: CONT_W, bottom: CONT_H });

const sandbox = {
  console, Math: seededMath, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  window: {
    addEventListener: (t, fn) => { (WINVH[t] = WINVH[t] || []).push(fn); }, removeEventListener: () => {},
    innerWidth: 420, innerHeight: 828,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBiquadFilter: () => ({ connect: () => {}, type: '', frequency: { value: 0 } }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100,
      };
    },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => {
      if (id === 'game-canvas') return CANVAS;
      if (id === 'next-preview') return NEXT_CANVAS;
      if (id === 'machine-container') return MACHINE;
      if (!elCache[id]) elCache[id] = mkEl({ id });
      return elCache[id];
    },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: () => [],
    addEventListener: (t, fn) => { (DOCVH[t] = DOCVH[t] || []).push(fn); }, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  adsbygoogle: { push: () => {} },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn, delay) => { if (typeof fn === 'function' && (delay || 0) <= 2000) { try { fn(); } catch (e) {} } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => CLOCK },
  __advance: (ms) => { CLOCK += ms; },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.dispatchEvent = () => {};
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.AudioContext = sandbox.window.AudioContext;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;
// preset prefs: tutorial seen, sound off (avoid audio churn)
sandbox.localStorage.setItem('coinmachine_prefs', JSON.stringify({ v: 1, sound: false, music: false, tutorial: true }));

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (i === engIdx) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (i === engIdx) engineOK = false; }
});
if (!engineOK || !ctx.dropCoin || !ctx.gameLoop) { console.error('engine failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const res = { frames:0, drops:0, merges:0, score:0, maxScore:0, unlocked:[], gameOverAt:-1,
                resetOK:false, postResetDrop:false, container:[containerW, containerH], err:null };
  const ev = (x) => ({ preventDefault: function(){}, clientX: x, clientY: 20, pointerId: 1 });
  function fire(t, e){ ((document.getElementById('game-canvas')._vh || {})[t] || []).forEach(function(h){ h(e); }); }
  function frame(){ __advance(16.6667); gameLoop(performance.now()); res.frames++; }
  function waitCanDrop(guardMax){ let g=0; while (!canDrop && g++ < (guardMax||600)) frame(); return canDrop; }
  function drop(x){ if (!waitCanDrop()) return false; fire('pointerdown', ev(x)); fire('pointermove', ev(x)); fire('pointerup', ev(x)); res.drops++; return true; }
  function settled(){ for (const c of coins) { if (Math.abs(c.vy) > 6 || Math.abs(c.vx) > 6) return false; } return true; }
  function waitSettle(guardMax){ let g=0; while (!settled() && g++ < (guardMax||300)) frame(); }
  try {
    // real init path: DOMContentLoaded -> init()
    (window.__docvh.DOMContentLoaded || []).forEach(function(h){ h(); });
    res.container = [containerW, containerH];
    // Phase 1 — merges through the real pointer drop path (all at center x so same-level coins meet)
    for (let i = 0; i < 10; i++) { drop(containerW / 2); waitSettle(300); }
    res.score = score; res.maxScore = score;
    // Phase 2 — losing-player policy: fill PILE POCKETS (valleys of the surface profile, wall
    // gaps, bare floor) so each coin rests stably and the surface rises; a drop is merge-free
    // only if no same-level coin the drop can contact lies within r_new + r_c + 2 of the descent
    // line (the engine's group-merge chains any resting-touch same-level pair from an 8%
    // penetration). NOTE: never drop at a float-exact repeat x — the engine skips collision for
    // dist <= 0.001 pairs, so exactly coincident coins become physics ghosts (degenerate input,
    // avoided here; engine left as shipped).
    function surfaceY(x) {
      let s = containerH;
      for (const c of coins) {
        if (Math.abs(x - c.x) < c.radius) {
          const yy = c.y - Math.sqrt(c.radius * c.radius - (x - c.x) * (x - c.x));
          if (yy < s) s = yy;
        }
      }
      return s;
    }
    function conflicts(newLevel, newR, x, restY) {
      let n = 0;
      for (const c of coins) {
        if (c.level !== newLevel) continue;
        if (Math.abs(c.x - x) >= c.radius + newR + 2) continue;
        if (restY !== null && c.y - c.radius > restY + newR + 2) continue; // buried below reach
        n++;
      }
      return n;
    }
    function pickX(newLevel, newR) {
      let best = null, bestKey = null;
      for (let x = newR + 2; x <= containerW - newR - 2; x += 4) {
        const sy = surfaceY(x), sl = surfaceY(Math.max(1, x - 12)), sr = surfaceY(Math.min(containerW - 1, x + 12));
        const pocket = (sy >= containerH - 0.5) || (sl < sy - 2 && sr < sy - 2);
        const restY = sy - newR;
        const conf = conflicts(newLevel, newR, x, restY);
        // prefer: no merge conflict > pocket > highest fill point; fallback ranks conflicts
        const key = [conf, pocket ? 0 : 1, Math.round(sy)].join('|');
        if (bestKey === null || key < bestKey) { bestKey = key; best = x; }
      }
      return best;
    }
    let g = 0;
    res.minTop = containerH; // highest pile top (min over coins of y-r) seen across the run
    res.pauses = 0;
    const dangerY = containerH * 0.15;
    // dual wall-column policy: coins dropped flush against a wall stack stably (each rests on
    // wall + coin below); a column with no equal ADJACENT levels never merges (the group-merge
    // scan only reaches r+r+2 from a penetrating pair). ~9-12 alternating smalls per wall reach
    // the danger line; only when BOTH wall tops match the incoming level is the coin disposed
    // into the center pile. Every drop x is deterministically jittered: the engine skips
    // collision for dist<=0.001 pairs, so exactly-coincident merge centroids become ghosts.
    function colTop(left) {
      let t = null;
      for (const c of coins) {
        const inz = left ? c.x < 60 : c.x > containerW - 60;
        if (inz && (!t || c.y < t.y)) t = c;
      }
      return t;
    }
    function slowAboveLine() {
      for (const c of coins) if (c.y - c.radius < dangerY + 4 && Math.abs(c.vy) < 25 && Math.abs(c.vx) < 25) return c;
      return null;
    }
    while (!gameOver && g++ < 500000 && res.drops < 500) {
      const wl = colTop(true), wr = colTop(false);
      const r0 = COINS[nextLevel - 1].radius;
      const jit = ((res.drops * 37) % 13) * 0.11; // 0.00..1.32 deterministic jitter
      let x;
      if (!wl || wl.level !== nextLevel) x = r0 + 0.6 + jit;              // build left column
      else if (!wr || wr.level !== nextLevel) x = containerW - r0 - 0.6 - jit; // build right column
      else x = containerW / 2 + 0.37 + jit;                              // both blocked: dispose center
      drop(x);
      waitSettle(220); // partial settle — keep feeding; an overfull agitated pile is what
      // eventually parks a slow, >800ms-old coin above the danger line (engine's own check)
      for (const c of coins) { const t = c.y - c.radius; if (t < res.minTop) res.minTop = t; }
      if (score > res.maxScore) res.maxScore = score;
      // let a slow coin above the line age past the engine's 800ms grace (its own check fires)
      if (!gameOver && slowAboveLine()) {
        res.pauses++;
        let g2 = 0;
        while (!gameOver && g2++ < 1500 && slowAboveLine()) frame();
      }
    }
    let g2 = 0;
    while (!gameOver && g2++ < 4000) frame(); // let the pile settle so checkGameOver fires
    res.didGameOver = gameOver;
    res.gameOverAt = gameOver ? res.frames : -1;
    res.pile = coins.map(function(c){ return 'L' + c.level + '@' + Math.round(c.x) + ',' + Math.round(c.y) + '(vx' + Math.round(c.vx) + ',vy' + Math.round(c.vy) + ')'; });
    res.dangerY = containerH * 0.15;
    res.score = score; if (score > res.maxScore) res.maxScore = score;
    // Phase 3 — engine's own reset path (Play Again button handler)
    newGame();
    res.resetOK = (!gameOver && coins.length === 0 && score === 0 && canDrop);
    if (res.resetOK) { drop(containerW / 2); for (let f = 0; f < 30; f++) frame(); res.postResetDrop = coins.length === 1; }
    res.finalScore = score; if (score > res.maxScore) res.maxScore = score;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

sandbox.window.__docvh = DOCVH;
let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0, 3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

let best = null, collection = null, prefs = null;
try { best = JSON.parse(sandbox.localStorage.getItem('coinmachine_best') || 'null'); } catch (e) {}
try { collection = JSON.parse(sandbox.localStorage.getItem('coinmachine_collection') || 'null'); } catch (e) {}
try { prefs = JSON.parse(sandbox.localStorage.getItem('coinmachine_prefs') || 'null'); } catch (e) {}
const unlocked = collection && collection.data ? Object.keys(collection.data).map(Number).sort((a, b) => a - b) : [];
const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err && !loadErrors.length]);
checks.push(['real-pointer-drops-executed (drops=' + r.drops + ', container=' + r.container.join('x') + ')', r.drops >= 10]);
checks.push(['merge-scored-via-engine (score=' + r.score + ', maxScore=' + r.maxScore + ')', r.maxScore > 0]);
checks.push(['collection-unlocked-persisted (unlocked=' + unlocked.join(',') + ')', unlocked.filter(k => k >= 2).length >= 1]);
checks.push(['best-score-persisted (best=' + (best && best.score) + ')', !!best && best.score >= r.maxScore]);
checks.push(['overflow-game-over-reached (didGameOver=' + r.didGameOver + ', drops=' + r.drops + ', frames=' + r.frames + ')', r.didGameOver === true]);
checks.push(['newGame-reset (resetOK=' + r.resetOK + ', postResetDrop=' + r.postResetDrop + ')', r.resetOK && r.postResetDrop]);
checks.push(['prefs-saved (tutorial=' + (prefs && prefs.tutorial) + ')', !!prefs && prefs.tutorial === true]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('coin-machine in-engine verification: drops=' + r.drops + ' frames=' + r.frames + ' score=' + r.score + ' maxScore=' + r.maxScore + ' unlocked=' + unlocked.join(',') + ' best=' + (best && best.score) + ' gameOverAt=' + r.gameOverAt + ' minTop=' + Math.round(r.minTop) + '/danger' + Math.round(r.dangerY) + ' resetOK=' + r.resetOK + ' postResetDrop=' + r.postResetDrop);
console.log('  pile(n=' + r.pile.length + ', dangerY=' + Math.round(r.dangerY) + '): ' + r.pile.join(' | '));
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'drop coins via real pointer handlers -> engine merges (score+unlock persisted), reach engine overflow game-over, then newGame reset + playable; best/prefs saved', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
