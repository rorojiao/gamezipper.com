#!/usr/bin/env node
/* In-engine verifier for pull-the-pin (Type A puzzle, physics).
 * Engine (index.html IIFE): 30 static levels (makeLevels); balls/pins/platforms/
 * bombs in game coords (420x700 design space). startLevel(i) -> state='playing';
 * input = canvas mousedown/touchstart -> handleTap (tap a pin to pull it; the pin
 * stops colliding immediately, pullAnim animates out in render). gameLoop(t) via
 * requestAnimationFrame -> updatePhysics(dt): gravity, pin/platform/ball-ball
 * collision, gray-ball color transfer, bomb explode (kills balls within 80/scale),
 * bucket collect (game-x in (126,294), y>~640, non-gray counts), off-screen kill
 * (y > gameH/scale+50). When every ball is dead for >40 frames -> checkWinLose():
 * stars = 3/2/1 by collected/totalColored ratio (>=1 / >=0.66 / >=0.33), >0 =>
 * state='win' + setLevelData (localStorage 'pullThePin_v1') + showLevelComplete.
 * Verification per level: search a pin-pull sequence (order + inter-pull gap)
 * through the engine's REAL input path (recorded canvas mousedown listener on the
 * pin's hit rect) while pumping the engine's own rAF loop with a controlled clock;
 * PASS requires state==='win' AND save.levels[i].completed persisted.
 * Search: heuristic orders first (all pins, various orders/gaps), then snapshot/
 * restore DFS over (pin, gap) choices with node/time caps. Physics is fully
 * deterministic (Math.random only touches particles/render jitter).
 * The verifier also asserts resize() geometry consistency (700*scale===gameH)
 * in both portrait and landscape orientations.
 * Usage: node pull-the-pin/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'pull-the-pin';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* surgery: export accessors right after the IIFE's init lines (last occurrence =
 * the init call at the bottom; the first occurrence is inside gameLoop). */
const ANCHOR = 'animFrame = requestAnimationFrame(gameLoop);';
const anchorIdx = code.lastIndexOf(ANCHOR);
if (anchorIdx < 0) { console.error('surgery anchor missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
code = code.slice(0, anchorIdx + ANCHOR.length) + `
;globalThis.__PP={
 lv:function(){return LEVELS},
 start:function(i){startLevel(i);return true},
 st:function(){return {state:state,currentLevel:currentLevel,
   balls:balls.map(function(b){return {x:b.x,y:b.y,vx:b.vx,vy:b.vy,alive:b.alive,isGray:b.isGray,color:b.color}}),
   pins:pins.map(function(p){return {id:p.id,x:p.x,y:p.y,w:p.w,alive:p.alive,pullAnim:p.pullAnim,pullDir:p.pullDir}}),
   bombs:bombs.map(function(b){return {x:b.x,y:b.y,alive:b.alive,exploded:b.exploded}}),
   collected:collectedCount,totalColored:totalColored,levelStars:levelStars,settle:settleTimer}},
 geom:function(){return {gameX:gameX,gameY:gameY,gameW:gameW,gameH:gameH,scale:scale,W:W,H:H}},
 snap:function(){return JSON.parse(JSON.stringify({state:state,balls:balls,pins:pins,bombs:bombs,particles:[], /* particles are visual-only — deep-copying them throttled DFS to ~85 nodes/s */
   bucketBalls:bucketBalls,collectedCount:collectedCount,levelStars:levelStars,settleTimer:settleTimer,
   comboCount:comboCount,comboTimer:comboTimer,tutVisible:tutVisible,tutStep:tutStep}))},
 restore:function(s){state=s.state;balls=JSON.parse(JSON.stringify(s.balls));pins=JSON.parse(JSON.stringify(s.pins));
   bombs=JSON.parse(JSON.stringify(s.bombs));particles=[];bucketBalls=s.bucketBalls;collectedCount=s.collectedCount;
   levelStars=s.levelStars;settleTimer=s.settleTimer;comboCount=s.comboCount;comboTimer=s.comboTimer;
   tutVisible=s.tutVisible;tutStep=s.tutStep},
 save:function(){try{return JSON.parse(localStorage.getItem('pullThePin_v1'))}catch(e){return null}}
};` + code.slice(anchorIdx + ANCHOR.length);

/* ---- sandbox ---- */
function mkCtxStub() {
  const grad = { addColorStop() {} };
  const c = {};
  ['clearRect', 'fillRect', 'strokeRect', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'arc', 'arcTo', 'ellipse', 'fill', 'stroke', 'fillText', 'save', 'restore', 'translate', 'rotate', 'setLineDash', 'drawImage', 'putImageData'].forEach(k => { c[k] = () => {}; });
  c.createLinearGradient = () => grad; c.createRadialGradient = () => grad; c.createPattern = () => grad;
  c.measureText = () => ({ width: 10 }); c.getImageData = () => ({ data: new Uint8ClampedArray(4) });
  return c;
}
function audioNode() {
  return {
    type: 'sine', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
    gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
    connect() {}, disconnect() {}, start() {}, stop() {},
  };
}
function mkEl(extra) {
  const listeners = {};
  const el = {
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], width: 420, height: 740, clientWidth: 420, clientHeight: 740,
    disabled: false, hidden: false,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatchEvent() { return true; },
    _listeners: listeners,
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => null, querySelectorAll: () => [],
    setAttribute() {}, getAttribute() { return ''; }, focus() {}, blur() {}, click() {},
  };
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: el.width, height: el.height, right: el.width, bottom: el.height });
  el.getContext = () => mkCtxStub();
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl();
const elsById = new Map();
function getEl(id) { if (!elsById.has(id)) elsById.set(id, mkEl({ id })); return elsById.get(id); }
const rafQueue = [];
let simNow = 0;
const winListeners = {};
const sandbox = {
  console, Math: Object.assign(Object.create(Math), Math), Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint8ClampedArray, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  /* NOTE: setTimeout intentionally never fires in this sandbox: the engine's only
   * gameplay-independent uses are sfx tones and the music loop's self-re-schedule
   * (playMusicLoop would recurse infinitely if fired synchronously). */
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  performance: { now: () => simNow },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  location: { href: 'https://localhost/pull-the-pin/', hash: '', search: '' },
  AudioContext: function () { return { currentTime: 0, state: 'running', destination: {}, sampleRate: 8000, resume() {}, close() { return { catch() {} }; }, createGain: audioNode, createOscillator: audioNode }; },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  MutationObserver: function () { return { observe() {}, disconnect() {} }; },
  ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
  IntersectionObserver: function () { return { observe() {}, disconnect() {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
};
sandbox.document = {
  getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  createElement: t => mkEl({ tagName: t }), createTextNode: t => ({ textContent: t }),
  body: BODY, head: mkEl(), documentElement: mkEl(),
  hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
};
sandbox.window = {
  addEventListener: (t, f) => { (winListeners[t] = winListeners[t] || []).push(f); },
  removeEventListener() {}, dispatchEvent() { return true; },
  innerWidth: 420, innerHeight: 740, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: sandbox.location, localStorage: sandbox.localStorage, navigator: sandbox.navigator,
  setTimeout: sandbox.setTimeout, clearTimeout: sandbox.clearTimeout,
  setInterval: sandbox.setInterval, clearInterval: sandbox.clearInterval,
  requestAnimationFrame: sandbox.requestAnimationFrame, cancelAnimationFrame: sandbox.cancelAnimationFrame,
  performance: sandbox.performance,
  scrollTo() {}, scrollY: 0, scrollX: 0,
  AudioContext: sandbox.AudioContext, webkitAudioContext: sandbox.AudioContext,
};
sandbox.window.document = sandbox.document;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'pull-the-pin-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const PP = sandbox.__PP || sandbox.window.__PP; // globalThis in vm === contextified sandbox, not the window stub
if (!PP) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ---- orientation consistency check (guards the resize() fix) ---- */
function assertGeom(portrait) {
  const g = PP.geom();
  const ok = Math.abs(g.gameH - 700 * g.scale) < 2.5 && Math.abs(g.gameW - 420 * g.scale) < 2.5;
  if (!ok) throw new Error('geometry inconsistent (' + (portrait ? 'portrait' : 'landscape') + '): gameH=' + g.gameH.toFixed(1) + ' 700*scale=' + (700 * g.scale).toFixed(1) + ' gameW=' + g.gameW.toFixed(1));
  return ok;
}
assertGeom(true);

function pump(frames) {
  let n = 0;
  while (n < frames && rafQueue.length) {
    const f = rafQueue.shift();
    simNow += 16.67;
    f(simNow);
    n++;
  }
  return n;
}
/* real input: canvas mousedown listener -> handleTap */
const canvasEl = getEl('game');
function fire(type, ev) {
  (canvasEl._listeners[type] || []).forEach(f => f(ev));
}
function tapPin(idx) {
  const pin = PP.st().pins[idx];
  const g = PP.geom();
  const cx = g.gameX + (pin.x + pin.w / 2) * g.scale;
  const cy = g.gameY + pin.y * g.scale;
  fire('mousedown', { clientX: cx, clientY: cy, preventDefault() {} });
}

/* ---- play a full pull sequence through the real input path ---- */
function playSequence(idx, order, gap, initSettle) {
  PP.start(idx);
  pump(initSettle === undefined ? 200 : initSettle);
  for (let k = 0; k < order.length; k++) {
    tapPin(order[k]);
    if (gap > 0) pump(gap);
  }
  let frames = 0;
  while (frames < 1500) {
    pump(1);
    frames++;
    if (PP.st().state !== 'playing') break;
  }
  return PP.st();
}
function seqResult(st) {
  return { win: st.state === 'win', state: st.state, collected: st.collected, total: st.totalColored, stars: st.levelStars };
}

/* ---- DFS with engine snapshot/restore over (pin, gap) choices ---- */
function dfsSolve(idx, budgetMs) {
  const t0 = Date.now();
  if (process.env.PTP_DEBUG) console.error('[dbg] dfsSolve L' + (idx+1) + ' start');
  PP.start(idx);
  pump(200);
  const root = PP.snap();
  const nPins = root.pins.length;
  const gaps = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 40, 80];
  let nodes = 0; const NODE_CAP = 60000;
  let expired = false; /* once budget/node cap trips, unwind every loop immediately — snapshots+termPump per pending branch kept running long past the deadline */
  let sol = null;
  const chosen = [];
  function termPump() { /* pump until state leaves 'playing' or cap */
    let f = 0;
    while (f < 500) { pump(1); f++; if (PP.st().state !== 'playing') break; }
    return PP.st().state;
  }
  function dfs(pulled) {
    if (sol || expired) return true;
    if (++nodes > NODE_CAP || Date.now() - t0 > budgetMs) { expired = true; return false; }
    if (pulled.size === nPins) {
      const endState = termPump();
      if (endState === 'win') { sol = chosen.slice(); return true; }
      PP.restore(root); /* restore to root is wrong mid-tree; caller snapshots instead */
      return false;
    }
    for (let p = 0; p < nPins && !sol && !expired; p++) {
      if (pulled.has(p)) continue;
      for (let gi = 0; gi < gaps.length && !sol && !expired; gi++) {
        const snapBefore = PP.snap();
        tapPin(p);
        if (gaps[gi] > 0) pump(gaps[gi]);
        const sNow = PP.st();
        if (sNow.state === 'win') { chosen.push([p, gaps[gi]]); sol = chosen.slice(); PP.restore(snapBefore); return true; }
        if (sNow.state === 'fail' || sNow.state !== 'playing') { PP.restore(snapBefore); continue; }
        pulled.add(p); chosen.push([p, gaps[gi]]);
        const snapAfter = PP.snap();
        if (process.env.PTP_DEBUG && (nodes % 500 === 0)) console.error('[dbg] L' + (idx+1) + ' nodes=' + nodes + ' t=' + (Date.now()-t0) + 'ms');
        dfs(pulled);
        pulled.delete(p); chosen.pop();
        PP.restore(snapAfter);
        /* also consider terminal after this pull (rest of pins stay) */
        if (!sol && p !== -1) {
          const st = termPump();
          if (st === 'win') { chosen.push([p, gaps[gi]]); sol = chosen.slice(); }
          PP.restore(snapAfter);
        }
        if (!sol) PP.restore(snapBefore);
      }
    }
    return !!sol;
  }
  /* NOTE: restore(snapBefore) inside dfs restores to before this branch's pull;
   * termPump after restore(snapAfter) is guarded to run before restoring snapBefore. */
  dfs(new Set());
  if (sol) {
    /* replay the found solution through a fresh engine run (real input) */
    const replay = [];
    for (const [p, gap] of sol) replay.push([p, gap]);
    return { order: replay.map(x => x[0]), gaps: replay.map(x => x[1]) };
  }
  return null;
}
function playSequenceWithGaps(idx, order, gaps, initSettle) {
  PP.start(idx);
  pump(initSettle === undefined ? 200 : initSettle);
  for (let k = 0; k < order.length; k++) {
    tapPin(order[k]);
    if (gaps[k] > 0) pump(gaps[k]);
  }
  let frames = 0;
  while (frames < 1500) { pump(1); frames++; if (PP.st().state !== 'playing') break; }
  return PP.st();
}

/* ---- main ---- */
const LEVELS_COUNT = 30;
const GLOBAL_T0 = Date.now();
let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVELS_COUNT; i++) {
  try {
    const t0 = Date.now();
    PP.start(i);
    const nPins = PP.st().pins.length;
    /* heuristic policies: pull every pin in a fixed order with a fixed gap */
    const idxOrder = [...Array(nPins).keys()];
    const policies = [];
    for (const gap of [0, 4, 40]) {
      policies.push({ order: idxOrder, gap, tag: 'fwd/g' + gap });
      policies.push({ order: idxOrder.slice().reverse(), gap, tag: 'rev/g' + gap });
      policies.push({ order: idxOrder.slice().sort((a, b) => PP.st().pins[a].y - PP.st().pins[b].y), gap, tag: 'top/g' + gap });
      policies.push({ order: idxOrder.slice().sort((a, b) => PP.st().pins[b].y - PP.st().pins[a].y), gap, tag: 'bot/g' + gap });
    }
    let res = null, usedTag = '?';
    for (const pol of policies) {
      res = seqResult(playSequence(i, pol.order, pol.gap));
      usedTag = pol.tag;
      if (res.win) break;
      if (Date.now() - t0 > 8000) break;
    }
    let dfsInfo = '';
    if (!res.win) {
      const dfs = dfsSolve(i, 8000); // fixed 8s/level — dynamic budget overflowed the 120s contract on dense-gap searches
      if (dfs) {
        res = seqResult(playSequenceWithGaps(i, dfs.order, dfs.gaps));
        usedTag = 'dfs(' + dfs.order.length + ' pulls)';
        dfsInfo = ' order=[' + dfs.order.join(',') + '] gaps=[' + dfs.gaps.join(',') + ']';
      }
    }
    if (!res || !res.win) throw new Error('no pin-pull sequence reached engine win (best state=' + (res && res.state) + ' collected=' + (res && res.collected) + '/' + (res && res.total) + ')' + dfsInfo);
    const save = PP.save();
    const rec = save && save.levels && save.levels[i];
    if (!rec || rec.completed !== true || !(rec.stars >= 1)) throw new Error('win state reached but progress[' + i + '] not persisted: ' + JSON.stringify(rec));
    if (rec.stars !== res.stars) throw new Error('persisted stars ' + rec.stars + ' != engine stars ' + res.stars);
    pass++;
    if (i < 2 || i === LEVELS_COUNT - 1) notes.push('L' + (i + 1) + ': ' + res.stars + ' stars via ' + usedTag + ' (' + res.collected + '/' + res.total + ' colored collected, ' + (Date.now() - t0) + 'ms)' + dfsInfo);
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 160));
  }
  if (Date.now() - GLOBAL_T0 > 110000 && i < LEVELS_COUNT - 1) { fail++; fails.push('global time budget exhausted at level ' + (i + 1)); break; }
}
/* landscape orientation sanity (post-fix): resize must stay 700*scale tall */
let geomNote = 'geom-ok';
try {
  sandbox.window.innerWidth = 1280; sandbox.window.innerHeight = 720;
  (winListeners['resize'] || []).forEach(f => f());
  assertGeom(false);
} catch (e) { geomNote = 'GEOM-FAIL: ' + e.message; fail++; }
const out = { pass, fail, total: LEVELS_COUNT, verdict: fail === 0 ? 'PASS' : 'FAIL', extra: { geom: geomNote, durS: +((Date.now() - GLOBAL_T0) / 1000).toFixed(1) } };
console.log(SLUG + ': real-input pin pulls (canvas mousedown) + pumped rAF gameLoop -> engine checkWinLose(state=win) + localStorage persist for ' + LEVELS_COUNT + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
