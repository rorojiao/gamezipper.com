#!/usr/bin/env node
/* GENERATED in-engine verifier for basketball-shoot — pattern follows pong/verify_engine.js.
 * vm sandbox loads game.js (IIFE engine) with read-only source surgery injecting a __verify
 * export at the IIFE tail (engine logic untouched). Canvas event handlers registered by the
 * engine are captured and replayed (mousedown/mousemove/mouseup = the real drag input path);
 * frames are pumped by calling the engine's own gameLoop(). A mirror of updateBall physics
 * (gravity 0.45, drag 0.992, rim/backboard bounces, score window) searches a scoring shot,
 * which is then executed through the real handlers — the engine's own checkScore() decides.
 * Goal: score >= 2 baskets (2 or 3 pts each) within the engine's real scoring path.
 * Usage: node basketball-shoot/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
let code = fs.readFileSync(path.join(SLUG_DIR, 'game.js'), 'utf8');
if (!/\}\)\(\);\s*$/.test(code)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(/\}\)\(\);\s*$/,
  'window.__verify={start:startGame,end:endGame,loop:gameLoop,' +
  'snap:function(){return {state:gameState,score:score,streak:streak,' +
  'ball:{x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,flying:ball.flying},' +
  'hoop:{x:hoop.x,y:hoop.y,rL:hoop.rimLeft,rR:hoop.rimRight,bbX:hoop.backboardX,bbY0:hoop.backboardY},W:W,H:H};},' +
  'fire:function(t,e){(window.__vh[t]||[]).forEach(function(h){h(e);});},' +
  'hardReset:function(){resetBall();positionHoop();scoredThisShot=false;ball.hitRimThisShot=false;}};\n})();');

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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500,
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

// handler map: the engine registers drag handlers on the canvas — we replay them (real input path)
const VH = {};
const elCache = {};
// real-game geometry: canvas is width:100vw;height:100vh (phone portrait) — max-power climb is
// ~419px, so on very tall stubs the top hoop band would be physically unreachable; 390x844 keeps
// every hoop placement (0.12H..0.30H = 101..253px, need <= 0.78H-414 = 244px) reachable.
const CANVAS = mkEl({ id: 'c', width: 390, height: 844 });
CANVAS.addEventListener = (t, fn) => { (VH[t] = VH[t] || []).push(fn); };
CANVAS.getBoundingClientRect = () => ({ left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844 });
CANVAS.parentElement = BODY;

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 480, innerHeight: 800,
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
    dispatchEvent: () => {}, __vh: VH,
  },
  document: {
    getElementById: (id) => { if (id === 'c') return CANVAS; if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
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
  setTimeout: (fn, delay) => { if (typeof fn === 'function' && (delay || 0) <= 2000) { try { fn(); } catch (e) {} } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
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
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'game.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack && loadErr.stack.split('\n')[0] || loadErr.message); process.exit(1); }
if (!ctx.window.__verify) { console.error('__verify export missing'); process.exit(1); }

const DRIVER = `(function(){
  const A = window.__verify;
  const res = { shots:0, misses:0, frames:0, score:0, baskets:0, endState:'', best:null, err:null };
  const BALL_R = 22, RIM_R = 6, NET_H = 36, BB_H = 70, GRAV = 0.45, DRAG = 0.992;
  const ev = (x, y) => ({ preventDefault: () => {}, clientX: x, clientY: y });
  // exact mirror of updateBall (gravity->drag->move->backboard->rim->score window)
  function simShot(vx, vy, h, W, H) {
    let x = W * 0.5, y = H * 0.78, scored = false;
    for (let f = 0; f < 800; f++) {
      vy += GRAV; vx *= DRAG; vy *= DRAG; x += vx; y += vy;
      const bbX = h.bbX - 6;
      if (x + BALL_R > bbX && x - BALL_R < bbX + 12 && y + BALL_R > h.bbY0 && y - BALL_R < h.bbY0 + BB_H) { x = bbX - BALL_R; vx = -vx * 0.55; }
      for (const rx of [h.rL, h.rR]) {
        const dx = x - rx, dy = y - h.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < BALL_R + RIM_R && d > 0.001) {
          const nx = dx / d, ny = dy / d, ov = BALL_R + RIM_R - d;
          x += nx * ov; y += ny * ov;
          const dot = vx * nx + vy * ny;
          vx -= 1.5 * dot * nx; vy -= 1.5 * dot * ny; vx *= 0.6; vy *= 0.6;
        }
      }
      if (vy > 0 && x > h.rL + BALL_R * 0.3 && x < h.rR - BALL_R * 0.3 && y > h.y - 5 && y < h.y + NET_H) { scored = true; break; }
      if (y > H + 60 || x < -60 || x > W + 60) break;
    }
    return scored;
  }
  // search a scoring (vx,vy) for the current hoop
  function findShot(s) {
    const h = s.hoop, W = s.W, H = s.H;
    const base = Math.atan2(h.y - H * 0.78, h.x - W * 0.5);
    for (let da = -0.9; da <= 0.9; da += 0.02) {
      for (let p = 0.30; p <= 1.001; p += 0.02) {
        const ang = base + da, speed = p * 22;
        const vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed;
        if (simShot(vx, vy, h, W, H)) return { vx, vy, len: p * 160, ang };
      }
    }
    return null;
  }
  try {
    A.start();
    let guard = 0;
    while (res.baskets < 2 && guard++ < 400000) {
      const s = A.snap();
      if (s.state !== 'playing') { res.err = 'state=' + s.state; break; }
      if (!s.ball.flying) {
        const shot = findShot(s);
        if (!shot) {
          // hoop physically unreachable this placement — deliberate weak miss; the engine's own
          // out-of-bounds branch repositions the hoop and resets the ball (real game behavior)
          const bx = s.ball.x, by = s.ball.y, len = 40;
          A.fire('mousedown', ev(bx, by));
          A.fire('mousemove', ev(bx - len, by + len));
          A.fire('mouseup', ev(bx - len, by + len));
          res.misses++; res.shots++;
        } else {
        // real input path: mousedown on ball, drag opposite to shot dir, mouseup
        const bx = s.ball.x, by = s.ball.y;
        A.fire('mousedown', ev(bx, by));
        A.fire('mousemove', ev(bx - Math.cos(shot.ang) * shot.len, by - Math.sin(shot.ang) * shot.len));
        A.fire('mouseup', ev(bx - Math.cos(shot.ang) * shot.len, by - Math.sin(shot.ang) * shot.len));
        res.shots++;
        }
      }
      const before = A.snap().score;
      A.loop(); res.frames++;
      const after = A.snap();
      if (after.score > before) res.baskets++;
      // safety: a shot that somehow never leaves the field — force engine reset
      if (res.frames % 3000 === 0) A.hardReset();
    }
    const fin = A.snap();
    res.score = fin.score;
    if (res.baskets >= 2) { A.end(); res.endState = A.snap().state; res.best = window.__localStorage_probe ? null : localStorage.getItem('bs_best'); }
    if (guard >= 400000) res.err = 'frame guard exhausted';
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

sandbox.__localStorage_probe = true; // (unused placeholder, keeps shape stable)
sandbox.localStorage.getItem; // ensure defined
// expose localStorage read to driver via window (already shared object)
let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0, 3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const best = sandbox.localStorage.getItem('bs_best');
const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err]);
checks.push(['baskets-scored>=2 (baskets=' + r.baskets + ', score=' + r.score + ')', r.baskets >= 2]);
checks.push(['score>0 via real drag input (shots=' + r.shots + ', frames=' + r.frames + ')', r.score > 0]);
checks.push(['endGame->over+best-persisted (state=' + r.endState + ', bs_best=' + best + ')', r.endState === 'over' && parseInt(best || '0', 10) >= r.score]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('basketball-shoot in-engine verification: score=' + r.score + ' baskets=' + r.baskets + ' shots=' + r.shots + ' misses=' + r.misses + ' frames=' + r.frames + ' endState=' + r.endState + ' best=' + best);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'score >= 2 baskets via real canvas drag handlers + engine checkScore; endGame persists best score', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
