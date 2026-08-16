#!/usr/bin/env node
/* GENERATED in-engine verifier for 8-ball-billiards — pattern follows akari/verify_engine.js.
 * vm sandbox: loads index.html inline scripts (engine is inline top-level declarations, no
 * surgery needed). Calls the same flow the browser runs — startGame() then the rAF-deferred
 * resizeCanvas()+initBalls() — then constructs a dead-straight cue->ball-1->top-left-pocket
 * line (positions injected into the engine's own top-level ball state, the sanctioned
 * state-injection route), fires the engine's real shoot(power, angle), and steps the engine's
 * own updatePhysics(16) until allStopped. Asserts ball 1 is potted by the engine's pocket
 * detection (pocketedThisTurn), first contact was ball 1, cue not scratched, and
 * processTurnEnd() runs clean (no foul, player continues).
 * Usage: node 8-ball-billiards/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'function updatePhysics';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK));
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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 36,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
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

const elCache = {};
const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  Audio: function () { this.loop = false; this.volume = 1; this.play = () => Promise.resolve(); this.pause = () => {}; },
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 640, innerHeight: 480,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
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
    getElementById: (id) => { if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  adsbygoogle: { push: () => {} },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn, delay) => { if (typeof fn === 'function' && (delay || 0) <= 500) { try { fn(); } catch (e) {} } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.Audio = sandbox.Audio;
sandbox.window.dispatchEvent = () => {};
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.AudioContext = sandbox.window.AudioContext;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (s.includes(ENGINE_MARK)) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (s.includes(ENGINE_MARK)) engineOK = false; }
});
if (!engineOK) { console.error('engine script failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const res = { steps:0, potted:false, firstHit:null, cueScratch:false, turnEndErr:null, foul:false,
                playerScore:0, gameStateAfter:'', stopped:false, err:null };
  try {
    setupCanvas();                   // browser runs this at startup (canvas+ctx+resize)
    startGame('twoplayer');          // pass-and-play: no AI path can interfere
    initBalls();                     // the init startGame defers to rAF (never fires under stub)
    // straight line into the top-left pocket: cue(200) -> ball1(100) -> pocket(0), collinear
    const p = pockets[0];
    const ang = Math.atan2(-1, -1);  // pointing to the top-left corner pocket
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const b1 = balls.find(function(b){ return b.id === 1; });
    b1.x = p.x - ux * 100; b1.y = p.y - uy * 100; b1.vx = 0; b1.vy = 0;
    cueBall.x = p.x - ux * 200; cueBall.y = p.y - uy * 200; cueBall.vx = 0; cueBall.vy = 0;
    shoot(20, ang);                  // engine's real shoot(): MAX_POWER straight at ball 1
    let guard = 0;
    while (guard++ < 5000) { res.steps++; if (updatePhysics(16)) { res.stopped = true; break; } }
    res.potted = b1.pocketed === true && pocketedThisTurn.some(function(b){ return b.id === 1; });
    res.firstHit = firstHitBall;
    res.cueScratch = cueBall.pocketed === true;
    try { processTurnEnd(); } catch (e) { res.turnEndErr = String(e && e.message || e).slice(0, 150); }
    res.foul = foulThisTurn === true;
    res.playerScore = playerScore;
    res.gameStateAfter = gameState;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error' + (loadErrors.length ? ' (non-engine script errors: ' + loadErrors.length + ')' : ''), !r.err]);
checks.push(['ball-1-potted-by-engine (pocketedThisTurn contains id 1 after ' + r.steps + ' physics steps)', r.potted]);
checks.push(['legal-contact (firstHitBall=' + r.firstHit + ', cue not scratched=' + !r.cueScratch + ')', r.firstHit === 1 && !r.cueScratch]);
checks.push(['processTurnEnd-clean (no foul, score=' + r.playerScore + ', state=' + r.gameStateAfter + ')', !r.turnEndErr && !r.foul && r.playerScore > 0]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('8-ball-billiards in-engine verification: potted=' + r.potted + ' firstHit=' + r.firstHit + ' scratch=' + r.cueScratch + ' foul=' + r.foul + ' score=' + r.playerScore + ' steps=' + r.steps + ' stopped=' + r.stopped);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'complete 1 legal potted shot (straight cue->ball-1->pocket via engine shoot + updatePhysics + processTurnEnd)', steps: r.steps, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
