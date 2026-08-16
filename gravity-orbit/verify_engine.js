#!/usr/bin/env node
/* gravity-orbit in-engine verifier (Type A, per _optimization/scripts/verifier-spec.md).
 * Engine: index.html inline script #1 (the "RECONSTRUCTED CONTROLLER" block is inside a
 * <script src=/game-footer.js> tag => dead in browser, excluded by the src= regex).
 * 30 levels. Win path: startLevel(i) -> placeBody(type,x,y) (real engine placement API,
 * rejects over-budget/too-close placements) -> launch() -> stepSim() until
 * win()/lose(); win() persists stars via setLevelStars. Solutions: each level's built-in
 * hint[] placement first; fallback = guided search (single-body grid sweep, then
 * coordinate descent + seeded-random restarts around hint, objective = closest approach
 * to the goal zone). Bounded: sim steps <= (timeLimit+2)*60 per trial, per-level time cap.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)];
const scripts = scriptMatches.map(m => m[1]);

const el = () => ({ textContent: '', innerHTML: '', value: '', classList: { add() {}, remove() {}, toggle() {} }, style: {},
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  getContext: () => new Proxy({}, { get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    if (typeof p === 'string' && !(p in t)) return () => 1;
    return t[p];
  }, set: () => true }),
  width: 400, height: 400, appendChild() {}, removeChild() {}, remove() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
  dataset: {}, focus() {}, blur() {}, disabled: false, onclick: null, setPointerCapture() {} });

const ctx = { console: { log() {}, error() {}, warn() {} }, Date, JSON, Math,
  setTimeout: (f) => { typeof f === 'function' && f(); return 0; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem(k, v) { m[k] = String(v); }, removeItem(k) { delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/gravity-orbit/', search: '', hash: '' },
  document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {},
    createElement: el, body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} } },
    documentElement: el(), hidden: false, visibilityState: 'visible', cookie: '' },
  AudioContext: undefined, webkitAudioContext: undefined, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  adsbygoogle: [] };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
let seed = 12345;
ctx.Math = Object.create(Math);
ctx.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
vm.createContext(ctx);

const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline-' + i + '.js' }); }
  catch (e) { loadErrors.push('script#' + i + ': ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); }
});

// Engine API bridge: top-level let/const of the engine script are visible to later
// scripts in the same vm context (same semantics as consecutive <script> tags).
vm.runInContext(`
globalThis.__api = {
  LEVELS, startLevel, placeBody, launch, stepSim, getLevelSave,
  snap: () => ({ state, placed: placed.slice(), simTime, sat: satellite ? { x: satellite.x, y: satellite.y, alive: satellite.alive } : null, counts: LEVELS.map(l => l.available.map(a => a.count)) })
};
globalThis.__runTrial = function(idx, placements) {
  startLevel(idx);
  for (const p of placements) placeBody(p.type, p.x, p.y);
  const lvl = LEVELS[idx];
  if (placed.length !== placements.length) return { won: false, reject: true, placedN: placed.length };
  const maxSteps = Math.ceil((lvl.timeLimit + 2) * 60);
  launch();
  let steps = 0, minD = 1e9;
  while (state === 'sim' && steps < maxSteps) {
    stepSim();
    steps++;
    if (satellite) { const d = Math.hypot(satellite.x - lvl.goal.x, satellite.y - lvl.goal.y); if (d < minD) minD = d; }
  }
  const stars = getLevelSave(idx).stars;
  return { won: state === 'end' && stars > 0, stars, steps, minD: Math.round(minD), used: placed.length, stateNow: state };
};
`, ctx, { filename: 'bridge.js' });

if (!ctx.__api) { console.error('engine bridge missing; load errors:', loadErrors); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: 'bridge-missing' })); process.exit(1); }
const A = ctx.__api;

const results = [];
const engineScriptOk = loadErrors.length === 0; // any inline script throwing is a finding

function trial(i, placements) { return ctx.__runTrial(i, placements); }

function solveLevel(i) {
  const lvl = A.LEVELS[i];
  const budget = Date.now() + 3000;
  // 1) built-in hint placements
  if (lvl.hint && lvl.hint.length) {
    const r = trial(i, lvl.hint);
    if (r.won) return { src: 'hint', r };
  }
  // 2) single-body grid sweep (par-1 levels and any single-body rescue)
  const types = [];
  for (const a of lvl.available) { for (let k = 0; k < a.count; k++) types.push(a.type); }
  const n = lvl.par; // aim within par
  if (n === 1) {
    for (let ty = 60; ty <= 540; ty += 30) {
      for (let tx = 60; tx <= 740; tx += 30) {
        for (const t of types) {
          const r = trial(i, [{ type: t, x: tx, y: ty }]);
          if (r.won && !r.reject) return { src: 'grid1', r };
          if (Date.now() > budget) return { src: 'none', r: r || null };
        }
      }
    }
  }
  // 3) coarse two-body sweep over available type pairs (needed e.g. L16 where par=2)
  if (n >= 2) {
    const seenType = new Set(types);
    const tlist = [...seenType];
    for (let ty1 = 100; ty1 <= 500; ty1 += 40) { for (let tx1 = 100; tx1 <= 700; tx1 += 40) { for (const tA of tlist) {
      for (let ty2 = 100; ty2 <= 500; ty2 += 40) { for (let tx2 = 100; tx2 <= 700; tx2 += 40) { for (const tB of tlist) {
        const r = trial(i, [{ type: tA, x: tx1, y: ty1 }, { type: tB, x: tx2, y: ty2 }]);
        if (r.won && !r.reject) return { src: 'grid2', r };
      } } }
      if (Date.now() > budget) return { src: 'none', r: null };
    } } }
  }
  // 4) guided search around hint: coordinate descent on minD with jitter restarts
  if (!lvl.hint || !lvl.hint.length) return { src: 'none', r: null };
  let best = null;
  const evalP = (placements) => { const r = trial(i, placements); return r; };
  const clone = ps => ps.map(p => ({ type: p.type, x: p.x, y: p.y }));
  let cur = clone(lvl.hint);
  best = evalP(cur);
  if (best.won) return { src: 'descent', r: best };
  let improved = true;
  while (improved && Date.now() < budget) {
    improved = false;
    for (let b = 0; b < cur.length; b++) {
      for (const d of [-80, -40, -20, 20, 40, 80]) {
        for (const ax of ['x', 'y']) {
          const cand = clone(cur);
          cand[b][ax] += d;
          if (cand[b].x < 40 || cand[b].x > 760 || cand[b][b] === undefined) continue;
          if (cand[b].y < 40 || cand[b].y > 560) continue;
          const r = evalP(cand);
          if (r.won) return { src: 'descent', r };
          if (!r.reject && r.minD < best.minD) { best = r; cur = cand; improved = true; }
        }
      }
    }
  }
  // 4) seeded random restarts around hint
  while (Date.now() < budget + 2000) {
    const cand = lvl.hint.map(h => ({ type: h.type, x: h.x + (Math.random() - 0.5) * 200, y: h.y + (Math.random() - 0.5) * 200 }));
    cand.forEach(p => { p.x = Math.max(40, Math.min(760, p.x)); p.y = Math.max(40, Math.min(560, p.y)); });
    const r = evalP(cand);
    if (r.won) return { src: 'random', r };
  }
  return { src: 'none', r: best };
}

let pass = 0, fail = 0; const fails = [];
const t0 = Date.now();
for (let i = 0; i < A.LEVELS.length; i++) {
  const out = solveLevel(i);
  if (out.src !== 'none' && out.r && out.r.won) {
    pass++;
    console.log(`L${i + 1} WIN via ${out.src} steps=${out.r.steps} minD=${out.r.minD} used=${out.r.used} stars=${out.r.stars}`);
  } else {
    fail++;
    const minD = out.r ? out.r.minD : '?';
    fails.push(`L${i + 1} (minD=${minD})`);
    console.log(`L${i + 1} FAIL minD=${minD}`);
  }
}
const checks = [['engine-load-clean', engineScriptOk], ...Array(0)];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
if (!engineScriptOk) console.log('load errors:', loadErrors.join(' ; '));
const total = pass + fail;
console.log(JSON.stringify({ pass, fail, fails, total, verdict: fail === 0 ? 'PASS' : 'FAIL', extra: { durS: +((Date.now() - t0) / 1000).toFixed(1) } }));
process.exit(fail === 0 ? 0 : 1);
