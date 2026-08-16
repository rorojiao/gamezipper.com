#!/usr/bin/env node
/* domino-toppler in-engine verifier (wave-A3, pattern per verifier-spec.md).
 * Levels were regenerated 2026-08-16 by _optimization/scripts/gen-dominotoppler-levels.js
 * (original data unwinnable: waves never turn except at fixed splitters, targets sat off
 * every reachable line — see generator header).
 * Per level 0..29: independent DFS solver (exact mirror of processSimStep/addToSim
 * semantics, just-in-time placement = upfront placement, static optimistic-reach prune,
 * 3M-node/60s caps) finds a domino placement <= budget. The placement is then PLAYED
 * through the engine's real input path: synthetic pointerdown events on the canvas
 * (handlePointerDown -> pxToCell), the Push button's real click listener
 * (startSimulation), then the engine's own rAF loop() is pumped until checkResult
 * flips state.screen. PASS requires screen==='win', overlay shown, and stars persisted
 * to localStorage dominoToppler. Exit 0 + last-line JSON verdict.
 * Usage: node domino-toppler/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'domino-toppler';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY (index.html untouched): engine is one IIFE with no exports; inject an
 * accessor right after the unique init anchor. */
const ANCHOR = "loadLevel(0);\nrafId=requestAnimationFrame(loop);";
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, 'window.__DT={levels:levels,state:state,loadLevel:loadLevel,ROWS:ROWS,COLS:COLS,types:(function(){var m={};m[EMPTY]=0;m[DOMINO]=1;m[TARGET]=2;m[OBSTACLE]=3;m[SPLITTER]=4;m[BOOSTER]=5;m[START]=6;m[WALL]=7;return m})()};\n' + ANCHOR);

/* ---- sandbox (spec template, canvas + rAF pump additions) ---- */
const rafQ = [];
function mkEl(id, extra) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false,
    style: { setProperty() {} }, dataset: {},
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatch(t, ev) { (listeners[t] || []).forEach(f => f(ev || { preventDefault() {} })); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width || 400, height: el.height || 400, right: 400, bottom: 400 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {}, click() { el.dispatch('click'); },
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 400, clientHeight: 400, width: 400, height: 400,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const canvasEl = mkEl('game-canvas', { width: 448, height: 448 });
els.set('game-canvas', canvasEl);
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 12345; MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ctx = {
  console: { log() {}, error() {}, warn() {} }, Date, JSON, Math: MathClone,
  setTimeout: (f) => { if (typeof f === 'function') { try { f(); } catch (e) { ctx.__timerErrs.push(String(e && e.message)); } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: (f) => { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame() {},
  performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, createElement: t => mkEl(t),
    body: mkEl('body'), documentElement: mkEl('html'), hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  AudioContext: undefined, webkitAudioContext: undefined, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  __timerErrs: [],
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const DT = ctx.window.__DT;
if (!DT || DT.levels.length !== 30) { console.error('no engine export or LEVELS!=30'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const levels = DT.levels;

/* ---- independent solver (exact engine-semantics mirror) ---- */
const N = 14, E = 0, DM = 1, TG = 2, OB = 3, SP = 4, BO = 5, ST = 6, WA = 7;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
function solve(lvl) {
  const types = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) {
    const ch = lvl.grid[i];
    types[i] = ch === '.' ? E : ch === 'D' ? DM : ch === 'T' ? TG : ch === 'O' ? OB : ch === 'S' ? SP : ch === 'B' ? BO : ch === 'X' ? ST : WA;
  }
  const tIdx = []; for (let i = 0; i < N * N; i++) if (types[i] === TG) tIdx.push(i);
  const allMask = (1 << tIdx.length) - 1;
  const tOf = new Int8Array(N * N).fill(-1); tIdx.forEach((i, k) => tOf[i] = k);
  const budget = lvl.budget;
  /* static optimistic reach: reach[node] bitmask of targets a wave at node could ever hit
   * (EMPTY cells assumed dominoes, fell ignored, booster may land on any of 3 fwd cells) */
  const fwd = (i, d) => { const x = i % N, y = (i / N) | 0, nx = x + DX[d], ny = y + DY[d]; return (nx < 0 || nx >= N || ny < 0 || ny >= N) ? -1 : ny * N + nx; };
  const edges = []; // node -> array of successor nodes
  for (let i = 0; i < N * N; i++) for (let d = 0; d < 4; d++) {
    const node = i * 4 + d; const t = types[i]; const out = [];
    if (t === WA || t === OB || t === TG) { edges[node] = out; continue; }
    if (t === SP) { for (const nd of [(d + 1) % 4, (d + 3) % 4, d]) { const m = fwd(i, nd); if (m >= 0) out.push(m * 4 + nd); } edges[node] = out; continue; }
    if (t === BO) { for (let b = 1; b <= 3; b++) { const x = i % N + DX[d] * b, y = ((i / N) | 0) + DY[d] * b; if (x < 0 || x >= N || y < 0 || y >= N) break; out.push((y * N + x) * 4 + d); } edges[node] = out; continue; }
    const m = fwd(i, d); if (m >= 0) out.push(m * 4 + d);
    edges[node] = out;
  }
  const reach = new Array(N * N * 4).fill(0);
  for (let k = 0; k < tIdx.length; k++) {
    // reverse BFS from target node (all 4 dirs of target cell)
    const rev = new Map();
    for (let n2 = 0; n2 < edges.length; n2++) for (const s of edges[n2] || []) { (rev.get(s) || rev.set(s, []).get(s)).push(n2); }
    const seen = new Uint8Array(N * N * 4);
    const stk = [];
    for (let d = 0; d < 4; d++) { const node = tIdx[k] * 4 + d; seen[node] = 1; stk.push(node); }
    while (stk.length) { const n2 = stk.pop(); reach[n2] |= (1 << k); for (const p of (rev.get(n2) || [])) if (!seen[p]) { seen[p] = 1; stk.push(p); } }
  }
  /* DFS: queue of nodes (cell*4+dir). Placement decisions are made just-in-time but
   * COMMITTED (dec: -1 undecided / 0 committed-empty / 1 committed-domino) so booster
   * scans — which read cells no wave ever arrived at — branch consistently; any leaf
   * maps to an upfront placement set whose engine simulation is identical. */
  let nodes = 0; const NODE_CAP = 3000000; const DL = Date.now() + 60000; let capped = false;
  const push = (q, x, y, d, ty, fell) => {
    if (x < 0 || x >= N || y < 0 || y >= N) return;
    const i = y * N + x; if (fell[i]) return;
    const t = ty[i]; if (t === WA || t === OB) return;
    q.push(i * 4 + d);
  };
  function rec(q, ty, fell, dec, hitMask, placed, placement) {
    while (true) {
      if (hitMask === allMask) return placement;
      if (!q.length) return null;
      if (++nodes > NODE_CAP || (nodes % 4096 === 0 && Date.now() > DL)) { capped = true; return null; }
      const item = q.shift(); const i = (item / 4) | 0, d = item & 3;
      if (fell[i]) continue;
      const t = ty[i];
      if (t === E) {
        if (dec[i] === -1 && placed < budget && (reach[item] & ~hitMask & allMask)) {
          const q2 = q.slice(), ty2 = ty.slice(), f2 = fell.slice(), d2 = dec.slice();
          ty2[i] = DM; f2[i] = 1; d2[i] = 1;
          const pl2 = placement.concat([i]);
          const x = i % N, y = (i / N) | 0;
          push(q2, x + DX[d], y + DY[d], d, ty2, f2);
          const r = rec(q2, ty2, f2, d2, hitMask, placed + 1, pl2);
          if (r) return r;
          if (capped) return null;
        }
        fell[i] = 1; if (dec[i] === -1) dec[i] = 0; // committed-empty (or was already)
        continue;
      }
      fell[i] = 1;
      const x = i % N, y = (i / N) | 0;
      if (t === TG) { hitMask |= 1 << tOf[i]; continue; }
      if (t === WA || t === OB) continue;
      if (t === SP) {
        push(q, x + DX[(d + 1) % 4], y + DY[(d + 1) % 4], (d + 1) % 4, ty, fell);
        push(q, x + DX[(d + 3) % 4], y + DY[(d + 3) % 4], (d + 3) % 4, ty, fell);
        push(q, x + DX[d], y + DY[d], d, ty, fell);
        continue;
      }
      if (t === BO) {
        /* scan forward: WALL skipped, OBSTACLE selected->dies, first non-EMPTY lands.
         * EMPTY cells branch: commit-domino (land here) or commit-empty (keep scanning). */
        for (let b = 1; b <= 3; b++) {
          const bx = x + DX[d] * b, by = y + DY[d] * b;
          if (bx < 0 || bx >= N || by < 0 || by >= N) break;
          const j = by * N + bx; const tj = ty[j];
          if (tj === WA) continue; // wall: not selected, scan continues
          if (tj === OB) break;    // selected but addToSim drops obstacles -> chain dies
          if (tj !== E) { push(q, bx, by, d, ty, fell); break; }
          // empty (and uncommitted): branch place-first
          if (dec[j] === -1 && placed < budget && (reach[j * 4 + d] & ~hitMask & allMask)) {
            const q2 = q.slice(), ty2 = ty.slice(), f2 = fell.slice(), d2 = dec.slice();
            ty2[j] = DM; d2[j] = 1;
            const pl2 = placement.concat([j]);
            push(q2, bx, by, d, ty2, f2);
            const r = rec(q2, ty2, f2, d2, hitMask, placed + 1, pl2);
            if (r) return r;
            if (capped) return null;
          }
          dec[j] = 0; // committed-empty: scan continues past it
          continue;
        }
        continue;
      }
      push(q, x + DX[d], y + DY[d], d, ty, fell);
    }
  }
  const q0 = [];
  { const i = lvl.startY * N + lvl.startX; q0.push(i * 4 + lvl.startDir); }
  const r = rec(q0, types, new Uint8Array(N * N), new Int8Array(N * N).fill(-1), 0, 0, []);
  return r === null ? (capped ? 'CAP' : null) : r;
}

/* ---- replay through engine real input path ---- */
const state = DT.state;
let pass = 0, fail = 0; const fails = [], notes = [];
for (let li = 0; li < 30; li++) {
  try {
    const t0 = Date.now();
    const sol = solve(levels[li]);
    if (!Array.isArray(sol)) throw new Error(sol === 'CAP' ? 'solver hit cap (INCONCLUSIVE)' : 'UNWINNABLE: exhaustive DFS found no placement <= budget ' + levels[li].budget);
    DT.loadLevel(li);
    if (state.screen !== 'playing') throw new Error('loadLevel did not enter playing');
    /* place via real pointerdown handler (pxToCell: OX=0, cell=32, canvas scale 448/448=1) */
    for (const i of sol) {
      const x = i % N, y = (i / N) | 0;
      canvasEl.dispatch('pointerdown', { preventDefault() {}, clientX: x * 32 + 16, clientY: y * 32 + 16 });
    }
    if (state.placed !== sol.length) throw new Error('placement mismatch: engine placed ' + state.placed + ' of ' + sol.length);
    if (state.placed > levels[li].budget) throw new Error('over budget');
    getEl('btn-push').dispatch('click');
    if (state.screen !== 'simulating') throw new Error('push did not start simulation');
    /* pump the engine's own loop() (rAF) until checkResult flips screen */
    let frames = 0;
    while (state.screen === 'simulating' && frames < 4000) {
      const batch = rafQ.splice(0, rafQ.length);
      if (!batch.length) throw new Error('rAF starved while simulating');
      for (const f of batch) f(100 + frames * 100);
      frames++;
    }
    if (state.screen !== 'win') throw new Error('engine result: ' + state.screen + ' (targets ' + state.targetsHit + '/' + state.totalTargets + ')');
    if (getEl('overlay').classList.contains('hidden')) throw new Error('win but overlay not shown');
    const sv = JSON.parse(ctx.localStorage.getItem('dominoToppler') || '{}');
    const stars = (sv.levels || [])[li] && sv.levels[li].stars;
    if (!stars) throw new Error('win shown but progress not persisted');
    pass++;
    if (li === 0 || li === 29) notes.push('L' + (li + 1) + ': won with ' + sol.length + '/' + levels[li].budget + ' dominoes, ' + levels[li].targets0 + ' targets, stars=' + stars + ', frames=' + frames);
  } catch (e) {
    fail++; fails.push('L' + (li + 1) + ' EX: ' + String(e.message).slice(0, 140));
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails.slice(0, 31);
console.log(SLUG + ': ' + pass + '/30 levels won through engine real input path (pointerdown placements + Push click + rAF-pumped chain sim)');
notes.forEach(n => console.log('  ' + n));
(fails || []).slice(0, 15).forEach(f => console.log('  FAIL ' + f));
if (ctx.__timerErrs.length) console.log('timer errors: ' + JSON.stringify(ctx.__timerErrs.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
