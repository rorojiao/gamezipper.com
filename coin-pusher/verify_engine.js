#!/usr/bin/env node
/* GENERATED in-engine verifier for coin-pusher — pattern follows phantom-blade/verify_engine.js.
 * Category: idle/arcade coin-pusher. vm sandbox loads the inline IIFE engine; surgery only
 * appends a window.__cp export before the final `})();` (engine logic untouched). Real input
 * path: the engine's own canvas pointerdown/pointermove/pointerup handlers (aim + doDrop on
 * release), btnPlay click handler, and the .booster button handlers wired by setupButtons.
 * Frames are pumped by the engine's own loop(t); the 500ms UI interval's checkUnlocks() is
 * pumped explicitly (sandbox setInterval is a no-op by design).
 * Strategy: drop coins over the open side gap of the sweeping pusher (landing position
 * predicted through the fall time), win coins + prizes, claim the ready giant booster and
 * the 60s free-coins booster, then switch to the Silver machine once it unlocks at
 * lifetime>=1000 (real menu path: btnMenu -> machine card click -> btnPlay).
 * Goal: won>0, biggest win>=100, prize won, machine 2 unlocked+selected, free coins
 * claimed, saved. (Gold/wall tier = lifetime>=5000 grind, deeper progression, out of scope.)
 * Usage: node coin-pusher/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'physicsStep';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK) && s.includes('gz_coinpusher_v1'));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }
const ANCHOR = "document.addEventListener('visibilitychange', ()=>{ if(document.hidden) save(); });\n\n})();";
if (!scripts[engIdx].includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
scripts[engIdx] = scripts[engIdx].replace(ANCHOR,
  "document.addEventListener('visibilitychange', ()=>{ if(document.hidden) save(); });\n" +
  'window.__cp = { state: state, MACHINES: MACHINES, loop: loop, doDrop: doDrop, activateBooster: activateBooster, checkUnlocks: checkUnlocks, save: save };\n})();');

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
    children: [], left: 0, top: 0, width: 760, height: 600, clientWidth: 760, clientHeight: 600,
    disabled: false, hidden: false, visibilityState: 'visible', checked: false,
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: (t, fn) => { (el._vh = el._vh || {})[t] = (el._vh[t] || []); el._vh[t].push(fn); },
    removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { this.children.push(c); return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 760, height: 600, right: 760, bottom: 600 }),
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

let CLOCK = 0, NOW = 0;
const elCache = {};
const DOCVH = {};
const WINVH = {};
// deterministic Math.random (LCG) so the whole run is reproducible
const seededMath = Object.create(Math);
let _seed = 20260816;
seededMath.random = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
const CANVAS = mkEl({ id: 'stage', width: 760, height: 600 });
CANVAS.getBoundingClientRect = () => ({ left: 0, top: 0, width: 760, height: 600, right: 760, bottom: 600 });
CANVAS.setPointerCapture = () => {};
const BOOSTERS = ['giant', 'wall', 'magnet', 'free'].map(b => mkEl({ dataset: { boost: b } }));

const sandbox = {
  console, Math: seededMath, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  Date: class VDate extends Date { static now() { return NOW; } },
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  window: {
    addEventListener: (t, fn) => { (WINVH[t] = WINVH[t] || []).push(fn); }, removeEventListener: () => {},
    innerWidth: 800, innerHeight: 700,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBiquadFilter: () => ({ connect: () => {}, type: '', frequency: { value: 0 }, Q: { value: 1 } }),
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
    getElementById: (id) => { if (id === 'stage') return CANVAS; if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: (sel) => (String(sel).indexOf('.booster') >= 0 ? BOOSTERS : (String(sel).indexOf('.machine-card') >= 0 ? [] : [])),
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
  __advance: (ms) => { CLOCK += ms; NOW += ms; },
  __realNow: () => Date.now(),
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

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (i === engIdx) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (i === engIdx) engineOK = false; }
});
if (!engineOK || !ctx.window.__cp || !ctx.window.__cp.loop) { console.error('engine failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const A = window.__cp, state = A.state;
  const res = { frames:0, drops:0, won:0, wins:0, prizes:0, biggest:0, lifetime:0, unlocked:1,
                giantUsed:false, freeClaimed:false, wallUsed:false, machineSwitched:false, err:null };
  const ev = (x) => ({ preventDefault: function(){}, clientX: x, clientY: 100, pointerId: 1 });
  function fire(t, e){ ((window.__canvas._vh[t]) || []).forEach(function(h){ h(e); }); }
  function clickEl(el){ if (el && el._vh && el._vh.click) el._vh.click.forEach(function(f){ f(); }); }
  function frame(){ __advance(16.6667); A.loop(performance.now()); res.frames++; }
  function aimDrop(x){ fire('pointerdown', ev(x)); fire('pointermove', ev(x)); fire('pointerup', ev(x)); res.drops++; }
  function aimOnly(x){ fire('pointerdown', ev(x)); fire('pointermove', ev(x)); } // set dropX without releasing
  function cancelAim(){ fire('pointercancel', ev(state.dropX)); }
  // landing-position prediction: coin falls from y=60, vy0=50, g=1400 to tray top 380-r (~0.62s);
  // pusher phase advances 1.1*machine speed rad/s — recomputed each call (machine changes mid-run)
  function gapX(){
    const SPEED = 1.1 * A.MACHINES[state.currentMachine].speed;
    const cxLand = 380 + Math.sin(state.pusherPhase + SPEED * 0.62) * 110;
    if (cxLand < 360) return 690;   // right gap open (tray right edge cx+310 < 672)
    if (cxLand > 400) return 70;    // left gap open (tray left edge cx-350 > 54)
    return null;
  }
  const t0 = __realNow();
  try {
    clickEl(document.getElementById('btnPlay')); // real handler -> showGame (unpause)
    if (state.paused) { res.err = 'btnPlay did not start the game (still paused)'; return res; }
    let guard = 0;
    while (guard++ < 30000) {
      frame();
      // drop a coin whenever the predicted landing spot is over an open gap; pause drops when
      // the field is crowded (O(n^2) physics guard)
      const gx = gapX();
      if (gx !== null && state.balance > 30 && state.coins.length < 120 && res.frames % 6 === 0) aimDrop(gx);
      // giant booster: ready at start — aim at a gap (pointerdown sets dropX), real button
      // handler drops a value-100 diamond there; verified by the ready flag flipping off
      if (!res.giantUsed && state.boosterGiant.ready && state.balance >= 2 && gx !== null) {
        aimOnly(gx); clickEl(window.__boost[0]); cancelAim();
        res.giantUsed = (state.boosterGiant.ready === false);
      }
      // free coins booster: claimable 60s into the session (engine gates on Date.now only);
      // verified by balance AND lifetime actually increasing by the +100 amount
      if (!res.freeClaimed && (performance.now() / 1000) >= 62) {
        const b0 = state.balance, l0 = state.lifetime;
        clickEl(window.__boost[3]);
        res.freeClaimed = (state.balance >= b0 + 99 && state.lifetime >= l0 + 99);
      }
      // machine progression. In the real game the machine cards only re-render (locked ->
      // unlocked handlers) when the menu is shown, so the honest path is: btnMenu (showMenu,
      // paused) -> click the freshly rendered unlocked card -> btnPlay (showGame, resumed).
      const grid = document.getElementById('machineGrid');
      const n = grid.children.length;
      if (state.unlocked >= 2 && state.currentMachine < 1 && n >= 5) {
        clickEl(document.getElementById('btnMenu'));
        const n2 = grid.children.length; // showMenu re-rendered the cards with real handlers
        clickEl(grid.children[n2 - 5]);  // Silver (i=1 of the latest batch)
        clickEl(document.getElementById('btnPlay'));
      }
      if (state.unlocked >= 3 && state.currentMachine < 2 && grid.children.length >= 4) {
        clickEl(document.getElementById('btnMenu'));
        const n3 = grid.children.length;
        clickEl(grid.children[n3 - 4]);  // Gold (i=2 of the latest batch)
        clickEl(document.getElementById('btnPlay'));
      }
      if (state.currentMachine >= 1) res.machineSwitched = true;
      // wall booster: needs machine level 2 + no cooldown + 5 coins — drops a 5-coin wall at
      // dropX; verified by the cooldown actually engaging
      if (!res.wallUsed && state.currentMachine >= 2 && state.boosterWall.cooldown <= 0 && state.balance >= 35 && gx !== null) {
        aimOnly(gx); clickEl(window.__boost[1]); cancelAim();
        res.wallUsed = (state.boosterWall.cooldown > 0);
      }
      if (res.frames % 30 === 0) A.checkUnlocks(); // 500ms UI interval tick (engine cadence)
      if (res.frames % 3000 === 0) console.error('progress f=' + res.frames + ' coins=' + state.coins.length + ' bal=' + Math.round(state.balance) + ' won=' + Math.round(state.won) + ' life=' + Math.round(state.lifetime) + ' unlk=' + state.unlocked + ' m=' + state.currentMachine);
      res.won = state.won; res.wins = state.stats.wins; res.prizes = state.stats.prizes;
      res.biggest = state.stats.biggestWin; res.lifetime = state.lifetime; res.unlocked = state.unlocked;
      // done when every mechanic is demonstrated (Gold/wall tier needs lifetime>=5000 ground
      // out on the slower Silver machine — beyond the budget, remains as deeper progression);
      // hard 70s wall-time cap bounds the run
      if (res.frames > 3000 && res.unlocked >= 2 && res.machineSwitched &&
          res.prizes >= 1 && res.giantUsed && res.freeClaimed) break;
      if (__realNow() - t0 > 70000) { res.timeout = true; break; }
    }
    A.checkUnlocks(); A.save();
    res.won = state.won; res.wins = state.stats.wins; res.prizes = state.stats.prizes;
    res.biggest = state.stats.biggestWin; res.lifetime = state.lifetime; res.unlocked = state.unlocked;
    res.balance = state.balance; res.dropsStat = state.stats.drops; res.sessions = state.stats.sessions;
    res.finalMachine = state.currentMachine;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

sandbox.window.__canvas = CANVAS;
sandbox.window.__boost = BOOSTERS;
let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0, 3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

let saved = null;
try { saved = JSON.parse(sandbox.localStorage.getItem('gz_coinpusher_v1') || 'null'); } catch (e) {}
const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err && !loadErrors.length]);
checks.push(['btnPlay-click-started-game', r.err === null || !String(r.err).includes('paused')]);
checks.push(['real-pointer-drops (drops=' + r.dropsStat + ')', (r.dropsStat || 0) >= 10]);
checks.push(['coins-won-off-edge (won=' + r.won + ', wins=' + r.wins + ')', r.won > 0 && r.wins > 0]);
checks.push(['big-win->=100 (biggest=' + r.biggest + ')', r.biggest >= 100]);
checks.push(['prize-won (prizes=' + r.prizes + ')', r.prizes >= 1]);
checks.push(['machine2-silver-unlocked+selected (unlocked=' + r.unlocked + ', lifetime=' + r.lifetime + ', machine=' + r.finalMachine + ')', r.unlocked >= 2 && r.lifetime >= 1000 && r.finalMachine === 1]);
checks.push(['boosters-giant+free-used (' + r.giantUsed + '/' + r.freeClaimed + ')', r.giantUsed && r.freeClaimed]);
checks.push(['save-persisted (balance=' + (saved && saved.balance) + ', unlocked=' + (saved && saved.unlocked) + ', machine=' + (saved && saved.currentMachine) + ')', !!saved && saved.unlocked >= 2 && saved.currentMachine === 1 && typeof saved.balance === 'number']);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('coin-pusher in-engine verification: frames=' + r.frames + ' drops=' + r.dropsStat + ' won=' + r.won + ' wins=' + r.wins + ' prizes=' + r.prizes + ' biggest=' + r.biggest + ' lifetime=' + r.lifetime + ' unlocked=' + r.unlocked + ' machine=' + r.finalMachine + ' balance=' + r.balance + ' sessions=' + r.sessions + ' boosters=' + r.giantUsed + '/' + r.freeClaimed + '/' + r.wallUsed + ' timeout=' + !!r.timeout + ' saved=' + JSON.stringify(saved));
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'play the pusher via real pointer aim/release + button handlers: coins and prizes won off the edge, giant+free boosters used, Silver machine (2nd) unlocked at lifetime>=1000 and selected via the menu path, progress saved (Gold/wall tier = deeper progression beyond budget)', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
