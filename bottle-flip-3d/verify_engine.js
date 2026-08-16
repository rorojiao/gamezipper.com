#!/usr/bin/env node
/* GENERATED in-engine verifier for bottle-flip-3d — pattern follows phantom-blade/verify_engine.js.
 * vm sandbox loads the inline IIFE engine; surgery only extends the existing window.__bf3d
 * debug export with {loadLevel, update, restartLevel} (engine logic untouched).
 * Real input path: the engine's own document keydown/keyup Space handlers (captured from
 * addEventListener) charge the power gauge; frames are pumped by the engine's own update().
 * AI mirrors the (fixed) launch+flight math per quantized power (incl. wind zones, rotating
 * bars, oscillating platforms at the exact frame clock) and picks a power that lands upright.
 * Engine bugs fixed in this pass (see index.html ENGINE BUG FIX comments): unreachable
 * platforms (launch-speed cap), random-tilt spin, never-moving platforms, miss=completes-level.
 * Goal: complete levels 1, 11 (moving platform) and 30 (bars+wind+mover), stars saved+next unlocked.
 * Usage: node bottle-flip-3d/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = '__bf3d';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK) && s.includes('launchBottle'));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }
const ANCHOR = 'window.__bf3d = { state, LEVELS, SKINS };';
if (!scripts[engIdx].includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
scripts[engIdx] = scripts[engIdx].replace(ANCHOR,
  'window.__bf3d = { state, LEVELS, SKINS, loadLevel: loadLevel, update: update, restartLevel: restartLevel };');

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
    children: [], left: 0, top: 0, width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    disabled: false, hidden: false, visibilityState: 'visible', checked: false,
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: (t, fn) => { (el._vh = el._vh || {})[t] = (el._vh[t] || []); el._vh[t].push(fn); },
    removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; }, closest: () => null,
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
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

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
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
    getElementById: (id) => { if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
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
// preset save: tutorial done, sound off (avoid audio churn)
sandbox.localStorage.setItem('gz_bottleflip3d_v2', JSON.stringify({ version: 2, currentLevel: 0, levels: {}, skins: ['plastic'], activeSkin: 'plastic', caps: 0, soundOn: false, musicOn: false, volume: 0.8, tutorialDone: true }));

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (i === engIdx) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (i === engIdx) engineOK = false; }
});
if (!engineOK || !ctx.window.__bf3d || !ctx.window.__bf3d.update) { console.error('engine failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const A = window.__bf3d, state = A.state;
  const res = { levels:{}, frames:0, attempts:0, err:null };
  const DT = 1/60, QUANT = 0.02666666666666667; // dt*1.6 — charge power quantum per frame
  function key(type, code){ (window.__docvh[type]||[]).forEach(function(h){ h({ code: code, repeat: false, preventDefault: function(){} }); }); }
  function clickBtn(id){ var el = document.getElementById(id); if (el && el._vh && el._vh.click) el._vh.click.forEach(function(f){ f(); }); }
  function frame(){ __advance(1000*DT); A.update(DT); res.frames++; }
  // exact mirror of (fixed) launchBottle + update() flight for a candidate power
  function mirror(power, lv, clock0){
    const target = lv.platforms[lv.platforms.length - 1];
    const groundY = state.H - 80, startX = 140;
    const theta = 70 * Math.PI / 180, g = 1700;
    const targetX = target.x + target.w / 2, targetY = target.y;
    const dx = targetX - startX, dy = targetY - groundY;
    const ballDen = 2 * Math.cos(theta) * Math.cos(theta) * (dy + dx * Math.tan(theta));
    const vNeed = ballDen > 1 ? Math.sqrt(g * dx * dx / ballDen) : 900;
    const baseV = Math.max(220, Math.min(2200, vNeed / 1.0875));
    const v0 = baseV * (0.45 + power * 0.85);
    let vx = v0 * Math.cos(theta), vy = -v0 * Math.sin(theta);
    const angVel = (Math.PI * 2) / Math.max(1, dx) * vx;
    let x = startX, y = groundY - 60, ang = 0, clock = clock0;
    const bars = (lv.obstacles || []).filter(function(o){return o.type==='bar'}).map(function(o){return {cx:o.cx, cy:o.cy, r:o.r, angle:o.angle, speed:o.speed||1}});
    const winds = (lv.obstacles || []).filter(function(o){return o.type==='wind'});
    for (let f = 0; f < 3000; f++) {
      clock += 1000 * DT;
      const mt = clock / 1000;
      for (const b of bars) b.angle += b.speed * DT;
      const plats = lv.platforms.map(function(p){ return { l: p.x + (p.moveX ? Math.sin(mt*(p.speed||1))*p.moveX : 0) - 8, r: p.x + (p.moveX ? Math.sin(mt*(p.speed||1))*p.moveX : 0) + p.w + 8, top: p.y + (p.moveY ? Math.sin(mt*(p.speed||1))*p.moveY : 0) }; });
      let wind = 0;
      for (const w of winds) { const wx = x - w.x, wy = y - w.y; if (wx*wx + wy*wy < w.r*w.r) wind += w.speed; }
      vx += wind * DT; vy += g * DT; x += vx * DT; y += vy * DT; ang += angVel * DT;
      // bar collision (engine checks after motion, before platforms)
      for (const b of bars) {
        const ca = Math.cos(b.angle), sa = Math.sin(b.angle);
        const dxl = x - b.cx, dyl = y - b.cy;
        const lx = dxl * ca + dyl * sa, ly = -dxl * sa + dyl * ca;
        if (Math.abs(lx) < b.r && Math.abs(ly) < 8 + 16) return { fail: 'bar' };
      }
      const bBot = y + 35, prevBot = bBot - vy * DT;
      for (let i = 0; i < plats.length; i++) {
        const p = plats[i];
        if (vy > 0 && prevBot <= p.top + 1 && bBot >= p.top - 1 && x >= p.l && x <= p.r) {
          const norm = ((ang % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
          const distDeg = Math.min(norm, Math.PI*2 - norm) * 180 / Math.PI;
          return { land: x, distDeg: distDeg, plat: i };
        }
      }
      if (y > state.H + 200) return { fail: 'oob' };
    }
    return { fail: 'timeout' };
  }
  function pickPower(lv, clock0){
    let best = null;
    for (let q = 4; q <= 36; q++) { // power = q quanta in (0.10, 0.99)
      const p = q * QUANT;
      const m = mirror(p, lv, clock0);
      if (m.land !== undefined && m.distDeg <= 12) {
        if (!best || m.distDeg < best.deg) best = { q: q, deg: m.distDeg };
      }
    }
    return best;
  }
  function play(idx, maxAttempts){
    A.loadLevel(idx);
    let attempts = 0;
    let guard = 0;
    while (guard++ < 60000) {
      if (state.screen === 'resultModal') break;
      if (state.screen !== 'playing') { frame(); continue; }
      if (!state.bottle && !state.charging) {
        const pick = pickPower(state.level, performance.now());
        attempts++;
        if (attempts > maxAttempts) return { fail: 'no-power-found', attempts: attempts };
        if (!pick) { // no viable power at this platform phase — let the clock run ~1.5s so the
          // oscillating platform rotates to a new phase, then re-search (no launch needed)
          for (let w = 0; w < 90; w++) frame();
          continue;
        }
        const target = pick.q * QUANT - QUANT * 0.5;
        key('keydown', 'Space');
        while (state.charging && state.power < target && guard++ < 60000) frame();
        key('keyup', 'Space');
        continue;
      }
      frame();
    }
    return { attempts: attempts, screen: state.screen, result: state.result, totalScore: state.totalScore,
             streak: state.streak, idx: idx, frames: res.frames };
  }
  try {
    for (let i = 0; i < 20; i++) frame(); // advance the clock past guardedClick's 250ms window (CLOCK starts at 0)
    clickBtn('btnPlay'); // real button handler -> guardedClick -> loadLevel(0)
    if (state.screen !== 'playing') { res.err = 'btnPlay did not start level (screen=' + state.screen + ')'; return res; }
    let r1 = { screen: state.screen };
    // level 1 via btnPlay already loaded: run the attempt loop inline
    let attempts = 0, guard = 0;
    while (guard++ < 60000) {
      if (state.screen === 'resultModal') break;
      if (state.screen !== 'playing') { frame(); continue; }
      if (!state.bottle && !state.charging) {
        const pick = pickPower(state.level, performance.now());
        attempts++;
        if (!pick) { key('keydown', 'Space'); frame(); key('keyup', 'Space'); continue; }
        if (attempts > 40) { res.err = 'level1: power search failed'; break; }
        const target = pick.q * QUANT - QUANT * 0.5;
        key('keydown', 'Space');
        while (state.charging && state.power < target && guard++ < 60000) frame();
        key('keyup', 'Space');
        continue;
      }
      frame();
    }
    res.levels[1] = { screen: state.screen, result: state.result, score: state.totalScore, attempts: attempts };
    res.attempts += attempts;
    // levels 11 (moving platform) and 30 (bars+wind+mover) via engine loadLevel
    [10, 29].forEach(function(idx){
      const r = play(idx, 40);
      res.levels[idx + 1] = r;
      res.attempts += (r.attempts || 0);
    });
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

sandbox.window.__docvh = DOCVH;
sandbox.window.performance.now = () => CLOCK;
let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0, 3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

let saved = null;
try { saved = JSON.parse(sandbox.localStorage.getItem('gz_bottleflip3d_v2') || 'null'); } catch (e) {}
const L = r.levels || {};
const lvStars = (id) => saved && saved.levels && saved.levels[id] ? saved.levels[id].stars : 0;
const res1 = L[1] || {}, res11 = L[11] || {}, res30 = L[30] || {};
const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err && !loadErrors.length]);
checks.push(['level1-completed (screen=' + res1.screen + ', result=' + JSON.stringify(res1.result) + ')', res1.screen === 'resultModal' && !!res1.result && res1.result.stars >= 1]);
checks.push(['level11-moving-plat-completed (' + JSON.stringify(res11.result || res11.fail) + ')', res11.screen === 'resultModal' && res11.result && res11.result.stars >= 1]);
checks.push(['level30-master-completed (' + JSON.stringify(res30.result || res30.fail) + ')', res30.screen === 'resultModal' && res30.result && res30.result.stars >= 1]);
checks.push(['score>0 (L1 score=' + res1.score + ')', (res1.score || 0) > 0]);
checks.push(['save-persisted (stars 1/11/30 = ' + lvStars(1) + '/' + lvStars(11) + '/' + lvStars(30) + ')', lvStars(1) >= 1 && lvStars(11) >= 1 && lvStars(30) >= 1]);
checks.push(['next-level-unlocked (L2=' + (saved && saved.levels && !!saved.levels[2] && saved.levels[2].unlocked) + ')', !!(saved && saved.levels && saved.levels[2] && saved.levels[2].unlocked)]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('bottle-flip-3d in-engine verification: L1 ' + JSON.stringify(res1) + ' | L11 ' + JSON.stringify(res11) + ' | L30 ' + JSON.stringify(res30) + ' | attempts=' + r.attempts + ' frames=' + r.frames);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'land the bottle upright on levels 1/11/30 via real Space charge-release input + engine update(); 4 engine bugs fixed (reach/spin/mover/fail-complete)', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
