#!/usr/bin/env node
/* GENERATED in-engine verifier for count-master — pattern follows phantom-blade/verify_engine.js.
 * Category: arcade crowd-runner (gate math runner). vm sandbox loads the inline IIFE engine;
 * surgery only appends a window.__cm accessor export before the final `})();` (engine logic
 * untouched beyond the two documented ENGINE BUG FIX comments in index.html).
 * Real input path: the engine's own canvas pointerdown handlers (menu/level-select/win-screen
 * button hit tests) and the document keydown handler (ArrowLeft/ArrowRight lane control).
 * Frames are pumped by the engine's own loop(ts) with a controllable performance.now.
 * ENGINE BUGS FIXED (index.html, "ENGINE BUG FIX (verify BC1...)" comments):
 *  1) startBossFight() never set state='bossFight', and drawBoss() — which advances the fight
 *     (bossTimer ticks, damage exchange, win/lose) — is gated on state==='bossFight': every
 *     boss level (9,14,19,24,29) softlocked forever after the last gate. Unwinnable as shipped.
 *  2) initLevel() shadowed its `lv` parameter with the level object before `tutStep=lv<2`,
 *     so the tutorial arrow never appeared on levels 1-2 (object<2 is always false).
 * Strategy: full honest playthrough — click PLAY, select level 1, then pick the best gate
 * lane each gate (applyOp mirror incl. obstacle 10% avoidance and powerup lanes), grind every
 * boss fight, click NEXT through all 30 levels. All levels won incl. 5 boss levels, stars
 * saved, skins unlocked, save persisted.
 * Usage: node count-master/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'processGate';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK) && s.includes('count_master_save'));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }
const ANCHOR = 'lastTime=performance.now();\nrafId=requestAnimationFrame(loop);\n\n})();';
if (!scripts[engIdx].includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
scripts[engIdx] = scripts[engIdx].replace(ANCHOR,
  'lastTime=performance.now();\nrafId=requestAnimationFrame(loop);\n' +
  'window.__cm = { get state(){return state;}, get level(){return level;}, get crowd(){return crowd;},' +
  ' get startCrowd(){return startCrowd;}, get lane(){return lane;}, get gateIdx(){return gateIdx;},' +
  ' get obstacles(){return obstacles;}, get powerups(){return powerups;}, get save(){return save;},' +
  ' get LEVELS(){return LEVELS;}, get W(){return W;}, get H(){return H;}, get starCount(){return starCount;},' +
  ' get bossActive(){return bossActive;}, get shieldActive(){return shieldActive;},' +
  ' get magnetActive(){return magnetActive;}, get doubleActive(){return doubleActive;},' +
  ' loop: loop, applyOp: applyOp };\n})();');

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
    children: [], left: 0, top: 0, width: 480, height: 860, clientWidth: 480, clientHeight: 860,
    disabled: false, hidden: false, visibilityState: 'visible', checked: false,
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: (t, fn) => { (el._vh = el._vh || {})[t] = (el._vh[t] || []); el._vh[t].push(fn); },
    removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 860, right: 480, bottom: 860 }),
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
const CANVAS = mkEl({ id: 'c', width: 480, height: 860 });
CANVAS.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 860, right: 480, bottom: 860 });

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  window: {
    addEventListener: (t, fn) => { (WINVH[t] = WINVH[t] || []).push(fn); }, removeEventListener: () => {},
    innerWidth: 480, innerHeight: 860, devicePixelRatio: 1,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBiquadFilter: () => ({ connect: () => {}, type: '', frequency: { value: 0 } }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100,
      };
    },
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => { if (id === 'c') return CANVAS; if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
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

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (i === engIdx) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (i === engIdx) engineOK = false; }
});
if (!engineOK || !ctx.window.__cm || !ctx.window.__cm.loop) { console.error('engine failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const A = window.__cm;
  const res = { frames:0, clicks:0, keys:0, wins:[], gameOvers:[], bossWins:[], gatesPassed:0, err:null };
  const ev = (x, y) => ({ preventDefault: function(){}, clientX: x, clientY: y, pointerId: 1 });
  function fire(t, e){ ((document.getElementById('c')._vh[t]) || []).forEach(function(h){ h(e); }); }
  function key(k){ (window.__docvh.keydown || []).forEach(function(h){ h({ key: k, preventDefault: function(){} }); }); res.keys++; }
  function click(x, y){ fire('pointerdown', ev(x, y)); fire('pointerup', ev(x, y)); res.clicks++; }
  function frame(){ __advance(1000/60); A.loop(performance.now()); res.frames++; }
  const W = A.W, H = A.H;
  function setLane(target){
    let g = 0;
    while (A.lane < target && g++ < 3) key('ArrowRight');
    while (A.lane > target && g++ < 3) key('ArrowLeft');
  }
  // optimal-lane policy: value each candidate lane by the engine's own applyOp on the upcoming
  // gate option, minus the 10% obstacle cost if the lane's obstacle is on a collision course,
  // plus a small nudge toward a pending powerup (double doubles a positive gate).
  function wantLane(){
    const lv = A.LEVELS[A.level];
    const gi = A.gateIdx;
    if (gi >= lv.gates.length) return null;
    const set = lv.gates[gi];
    let bestLane = 0, bestScore = -Infinity;
    let obLane = -1;
    for (const ob of A.obstacles) { if (ob.active) obLane = ob.lane; }
    let pu = null;
    for (const p of A.powerups) { if (!p.collected) pu = p; }
    for (let c = 0; c < set.length; c++){
      let sc = A.applyOp(A.crowd, set[c].t, set[c].v);
      if (c === obLane) sc = sc * 0.9;                 // obstacle on this lane: -10% crowd
      if (pu && pu.lane === c) sc = sc * (pu.type === 'double' ? 2 : 1.05);
      if (sc > bestScore) { bestScore = sc; bestLane = c; }
    }
    return bestLane;
  }
  const t0 = __realNow();
  try {
    // title -> PLAY -> level select -> level 1
    click(W / 2, H * 0.45 + 22);
    if (A.state !== 'levelSelect') { res.err = 'PLAY click failed (state=' + A.state + ')'; return res; }
    const startX = W / 2 - (5 * 58 - 8) / 2;
    const clickLevel = (i) => click(startX + (i % 5) * 58 + 25, 75 + Math.floor(i / 5) * 58 + 25);
    clickLevel(0);
    if (A.state !== 'game') { res.err = 'level select click failed (state=' + A.state + ')'; return res; }
    let guard = 0;
    while (guard++ < 60000) {
      frame();
      const st = A.state;
      if (st === 'game') {
        const wl = wantLane();
        if (wl !== null) setLane(wl);
      } else if (st === 'bossFight') {
        // pump: drawBoss exchanges damage per second until win/lose (needs the engine fix)
      } else if (st === 'win') {
        const lv = A.level;
        if (res.wins.indexOf(lv) < 0) {
          res.wins.push(lv);
          if (A.LEVELS[lv].boss) res.bossWins.push(lv);
        }
        if (lv < A.LEVELS.length - 1) click(W / 2 - 55, H * 0.64 + 20); // NEXT: engine advances level
        else { click(W / 2 - 55, H * 0.64 + 20); break; }               // last level: NEXT -> select
      } else if (st === 'gameOver') {
        res.gameOvers.push(A.level);
        break;
      } else if (st === 'levelSelect') {
        break; // run complete (after the last NEXT)
      }
      if (guard % 2000 === 0) console.error('progress f=' + res.frames + ' lv=' + A.level + ' state=' + st + ' crowd=' + A.crowd + ' wins=' + res.wins.length + ' bossWins=' + res.bossWins.join(','));
      if (__realNow() - t0 > 100000) { res.timeout = true; break; }
    }
    res.finalState = A.state; res.finalLevel = A.level;
    res.gatesPassed = res.wins.length; // each win implies all gates of that level passed
    res.totalStars = A.save.total;
    res.starKeys = Object.keys(A.save.stars).length;
    res.skins = A.save.skins.slice();
    res.bossList = A.LEVELS.map(function(l, i){ return l.boss ? i : -1; }).filter(function(i){ return i >= 0; });
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

sandbox.window.__docvh = DOCVH;
sandbox.__realNow = () => Date.now();
let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0, 3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

let saved = null;
try { saved = JSON.parse(sandbox.localStorage.getItem('count_master_save') || 'null'); } catch (e) {}
const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err && !loadErrors.length]);
checks.push(['real-input-used (clicks=' + r.clicks + ', lane keys=' + r.keys + ')', r.clicks >= 3 && r.keys >= 10]);
checks.push(['all-30-levels-won (wins=' + r.wins.length + ', gameOvers=' + JSON.stringify(r.gameOvers) + ')', r.wins.length === 30 && r.gameOvers.length === 0]);
checks.push(['boss-levels-completed (' + r.bossWins.join(',') + ' of ' + (r.bossList || []).join(',') + ')', (r.bossList || []).length === 5 && r.bossWins.length === 5]);
checks.push(['stars-saved-per-level (starKeys=' + r.starKeys + ', total=' + r.totalStars + ')', r.starKeys === 30 && r.totalStars >= 85]);
checks.push(['skins-unlocked-by-stars (' + r.skins.join(',') + ')', r.skins.length >= 3]);
checks.push(['save-persisted (total=' + (saved && saved.total) + ', stars=' + (saved && Object.keys(saved.stars).length) + ')', !!saved && saved.total === r.totalStars && Object.keys(saved.stars).length === 30]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('count-master in-engine verification: frames=' + r.frames + ' wins=' + r.wins.length + '/30 bossWins=' + r.bossWins.join(',') + ' gameOvers=' + r.gameOvers.join(',') + ' stars=' + r.starKeys + ' keys total=' + r.totalStars + ' skins=' + r.skins.join(',') + ' clicks=' + r.clicks + ' keys=' + r.keys + ' timeout=' + !!r.timeout);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'full honest playthrough via real canvas clicks + ArrowLeft/Right lane keys: all 30 levels won including all 5 boss levels (softlock bug fixed), 3-star runs, skins unlocked, save persisted', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
