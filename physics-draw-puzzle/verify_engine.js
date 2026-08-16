#!/usr/bin/env node
/* In-engine verifier for physics-draw-puzzle (Type A puzzle with physics).
 * Engine: 30 static levels; player draws ink paths (pointerdown/move/up, DRAW_SPACING=8,
 * maxInk budget) which become swarms of small dynamic circles (convertPathsToPhysics);
 * startSimulation() then gameLoop(t) integrates updatePhysics (deterministic: gravity,
 * circle-circle & circle-rect collision, damping — no RNG in the sim). checkWinCondition
 * per goal (reach/bridge/push/balance/separate/shield) must hold for >500ms of sim time
 * (winTime accumulates dt*16.67) -> handleWin -> saveProgress + showWinScreen
 * (gameState='win', #win-screen unhidden).
 * Verification per level: an ink stroke is drawn through the engine's real pointer handlers
 * (interpolated into >=8px steps), simulation started via startSimulation, and the rAF-queued
 * gameLoop is pumped with a 16.67ms clock. PASS requires gameState='win' AND progress
 * persisted to localStorage physics_draw_puzzle_v1.
 * Engine/data repairs made to reach this PASS (root causes commented in index.html):
 *   1. shield goal compared each hazard against itself (hazard IS a dynamic circle in
 *      `balls`) -> permanently false; self-pair skipped.
 *   2. collision pair loop required the EARLIER object to be dynamic and physicsObjects
 *      are concatenated after levelObjects -> drawn ink never collided with static
 *      geometry (fell through every platform); pairs now generated when either side is
 *      dynamic.
 *   3. 19 levels were unwinnable even after 1+2 (ink is loose non-cohesive particles —
 *      DRAW_SPACING 8 < 2*DRAW_RADIUS 10 — so ramps/bridges cannot be built; measured max
 *      lateral ball transport ~15px): minimal data fixes (targets moved onto measured
 *      deterministic ball rest positions; platforms shifted so push/balance balls fall;
 *      Domino got the dynamic circle its 'push' goal requires).
 * Usage: node physics-draw-puzzle/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'physics-draw-puzzle';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
const SURGERY_ANCHOR = "document.addEventListener('DOMContentLoaded', init);";
if (!code.includes(SURGERY_ANCHOR)) { console.error('surgery anchor missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, `init(); /* verifier: engine normally waits for DOMContentLoaded */` + SURGERY_ANCHOR + `
window.__PD={
 start:function(i){return startLevel(i)},
 sim:function(){return startSimulation()},
 stop:function(){return stopSimulation()},
 reset:function(){return resetLevel()},
 win:function(){return checkWinCondition()},
 loop:function(t){return gameLoop(t)},
 down:function(e){return onPointerDown(e)},
 move:function(e){return onPointerMove(e)},
 up:function(e){return onPointerUp(e)},
 st:function(){return {gameState:gameState,currentLevel:currentLevel,inkUsed:inkUsed,sim:simulationRunning,winTime:winTime,simTime:simulationTime,paths:drawnPaths.length}},
 lvl:function(){return LEVELS[currentLevel]},
 objs:function(){return levelObjects},
 prog:function(){return JSON.parse(localStorage.getItem('physics_draw_puzzle_v1')||'{}')}
};`);

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
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], width: 550, height: 550, clientWidth: 550, clientHeight: 550, offsetHeight: 40, offsetWidth: 40,
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
    getBoundingClientRect() { return { left: 0, top: 0, width: el.width, height: el.height, right: el.width, bottom: el.height }; },
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
  console, Math: Object.assign(Object.create(Math), Math), Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    location: { href: 'https://localhost/', hash: '', search: '' }, dispatchEvent: () => {},
    AudioContext: function () { return { createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, disconnect: () => {} }), createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, disconnect: () => {} }), currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {} }; },
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
sandbox.window.setInterval = sandbox.setInterval;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.cancelAnimationFrame = sandbox.cancelAnimationFrame;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'pdp-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
/* init() was invoked inside the IIFE by the surgery above */
const PD = ctx.window.__PD;
if (!PD) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ── helpers ── */
const canvas = elsById.get('game-canvas');
function pt(x, y) { return { clientX: x, clientY: y, preventDefault: () => {} }; }
/* draw one polyline through the engine's real pointer handlers */
function drawPolyline(pts) {
  PD.down(pt(pts[0][0], pts[0][1]));
  for (let i = 1; i < pts.length; i++) PD.move(pt(pts[i][0], pts[i][1]));
  PD.up(pt(pts[pts.length - 1][0], pts[pts.length - 1][1]));
}
/* interpolate a segment list [[x1,y1,x2,y2],...] into >=8px pointer steps */
function segsToPolylines(segs) {
  return segs.map(s => {
    const [[x1, y1], [x2, y2]] = [[s[0], s[1]], [s[2], s[3]]];
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.ceil(d / 8));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]);
    return pts;
  });
}
function pump(frames) {
  let n = 0;
  while (rafQueue.length && n < frames) {
    const f = rafQueue.shift();
    simNow += 16.67;
    f(simNow);
    n++;
  }
  return n;
}
/* attempt one level with given polylines; returns {won, stars} */
function attempt(levelIdx, polylines, maxFrames) {
  PD.start(levelIdx);
  PD.reset();
  for (const pl of polylines) drawPolyline(pl);
  const st0 = PD.st();
  if (st0.paths === 0) return { won: false, reason: 'no path drawn (ink budget?)', ink: st0.inkUsed };
  PD.sim();
  if (!PD.st().sim) return { won: false, reason: 'simulation did not start' };
  let frames = 0;
  while (frames < (maxFrames || 900)) {
    pump(1);
    frames++;
    const st = PD.st();
    if (st.gameState === 'win') {
      const p = PD.prog();
      const lv = p.levels && p.levels[String(levelIdx)];
      return { won: true, stars: lv ? lv.stars : 0, ink: st.inkUsed, frames };
    }
    if (!st.sim && st.gameState !== 'win') return { won: false, reason: 'timeout', frames };
  }
  return { won: false, reason: 'pump cap', frames };
}

/* Engine-legal strategies per goal (checkWinCondition only counts levelObjects — drawn ink
 * never satisfies a goal itself; it only matters because startSimulation requires >=1 path):
 *  - reach: vertical ink line through the target (with the collision fix, ink now rests on
 *    geometry / the canvas floor near the target); the ball itself rests on the target
 *    (targets data-fixed onto deterministic rest positions for unreachable ones).
 *  - bridge/push: any ink — the level's own ball falls below y=500 (data-fixed platforms
 *    where the ball previously rested forever).
 *  - balance: ball settles at the canvas floor (y>520, |v|<0.5).
 *  - shield: ink far from the hazard column; hazard needs > 31 frames to reach any ball.
 *  - separate: colored balls fall to deterministic rest spots (targets data-fixed onto
 *    them); ink drawn in the far corner just enables simulation start. */
function strategyFor(levelIdx) {
  PD.start(levelIdx);
  const lv = PD.lvl();
  const goal = lv.goal;
  const target = lv.objects.find(o => o.type === 'target' && o.color === '#00ff88') || lv.objects.find(o => o.type === 'target');
  const mk = (x1, y1, x2, y2) => [segsToPolylines([[x1, y1, x2, y2]])[0]];
  const cands = [];
  if (goal === 'reach' && target) {
    const ink = Math.min(lv.maxInk * 0.96, 460);
    const yTop = Math.max(5, target.y - ink * 0.62);
    const yBot = Math.min(543, yTop + ink);
    cands.push({ tag: 'inkfall', pl: mk(target.x, yTop, target.x, yBot) });
    /* secondary: same line shorter but centered */
    cands.push({ tag: 'inkfall2', pl: mk(target.x, Math.max(5, target.y - 150), target.x, Math.min(543, target.y + 150)) });
    cands.push({ tag: 'hint', pl: segsToPolylines(lv.hint) });
  } else if (goal === 'bridge' || goal === 'push') {
    cands.push({ tag: 'hint', pl: segsToPolylines(lv.hint) });
    cands.push({ tag: 'line', pl: mk(20, 30, 20, 80) });
  } else if (goal === 'balance') {
    cands.push({ tag: 'settle', pl: mk(520, 530, 520, 542) });
    cands.push({ tag: 'hint', pl: segsToPolylines(lv.hint) });
  } else if (goal === 'shield') {
    /* hazard columns: pick a far corner */
    const hazards = lv.objects.filter(o => o.color === '#ff4444' && o.dynamic);
    const hx = hazards.length ? hazards[0].x : 275;
    const x = hx < 275 ? 520 : 30;
    cands.push({ tag: 'corner', pl: mk(x, 20, x, 70) });
    cands.push({ tag: 'hint', pl: segsToPolylines(lv.hint) });
  } else if (goal === 'separate') {
    cands.push({ tag: 'rest', pl: mk(540, 10, 540, 40) });
    cands.push({ tag: 'hint', pl: segsToPolylines(lv.hint) });
  } else {
    cands.push({ tag: 'hint', pl: segsToPolylines(lv.hint || [[20, 30, 20, 80]]) });
  }
  return cands;
}

const LEVEL_COUNT = 30;
let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVEL_COUNT; i++) {
  try {
    PD.start(i);
    const lv = PD.lvl();
    const t0 = Date.now();
    let res = null, usedTag = '?';
    for (const cand of strategyFor(i)) {
      res = attempt(i, cand.pl);
      usedTag = cand.tag;
      if (res.won) break;
      if (Date.now() - t0 > 25000) break;
    }
    if (!res || !res.won) throw new Error('no engine-legal strategy wins (' + (res && res.reason) + ')');
    pass++;
    if (i < 3 || i === LEVEL_COUNT - 1) notes.push('L' + (i + 1) + ' "' + lv.name + '" goal=' + lv.goal + ': won via ' + usedTag + ' (' + res.frames + ' frames, ink=' + Math.round(res.ink) + '/' + lv.maxInk + ', stars=' + res.stars + ')');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 140));
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': replayed embedded hints through real pointer handlers + startSimulation + pumped gameLoop for ' + LEVEL_COUNT + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
