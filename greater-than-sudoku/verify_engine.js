#!/usr/bin/env node
/* greater-than-sudoku in-engine verifier (Type A, verifier-spec.md).
 * 27 embedded levels (LEVELS_DATA: p givens / s solution / h,v inequality signs).
 * Golden standard: per level, startLevel() -> real input path onCanvasTap() to select
 * each empty cell -> placeDigit() with the embedded solution digit -> engine reaches
 * isComplete() and fires winLevel() (S.finished=true, S.mistakes=0).
 * Independent cross-checks (plain node, not vm): embedded LEVELS_DATA deep-equals
 * levels.json; solution is a valid sudoku; inequalities + givens consistent;
 * uniqueness DFS (logic ported from verify_independent.js) with 2-solution cap.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

const el = () => ({ textContent: '', innerHTML: '', value: '', classList: { add() {}, remove() {}, toggle() {} }, style: {},
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  getContext: () => new Proxy({}, { get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    if (p === 'setTransform') return () => 1;
    if (typeof p === 'string' && !(p in t)) return () => 1;
    return t[p];
  }, set: () => true }),
  width: 400, height: 400, clientWidth: 440, clientHeight: 600,
  parentElement: { clientWidth: 440, clientHeight: 600, appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {} },
  appendChild() {}, removeChild() {}, remove() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
  dataset: {}, focus() {}, blur() {}, disabled: false, preventDefault() {} });

const ctx = { console: { log() {}, error() {}, warn() {} }, Date, JSON, Math,
  setTimeout: (f) => { return 0; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem(k, v) { m[k] = String(v); }, removeItem(k) { delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} }, location: { href: 'http://localhost/greater-than-sudoku/', search: '', hash: '' },
  document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, createElement: el,
    body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} } }, documentElement: el(), hidden: false, visibilityState: 'visible', cookie: '' },
  AudioContext: undefined, webkitAudioContext: undefined, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  adsbygoogle: [] };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
ctx.innerWidth = 1280; ctx.innerHeight = 720; ctx.devicePixelRatio = 1;
let seed = 12345;
ctx.Math = Object.create(Math);
ctx.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
vm.createContext(ctx);

const loadErrors = [];
scripts.forEach((s, i) => { try { vm.runInContext(s, ctx, { filename: 'inline-' + i + '.js' }); } catch (e) { loadErrors.push('script#' + i + ': ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); } });

vm.runInContext(`
globalThis.__api = {
  LEVELS_DATA, S,
  startLevel, onCanvasTap, placeDigit, isComplete,
  cellSize: () => cellSize
};
globalThis.__replay = function(idx) {
  startLevel(idx);
  const N = S.N, sol = S.solution;
  let placed = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (S.level.p[r][c] !== 0) continue;
    onCanvasTap(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
    placeDigit(sol[r][c]);
    placed++;
  }
  return { finished: S.finished, mistakes: S.mistakes, complete: isComplete(), placed, stars: (SAVE.progress['lvl-' + idx] || {}).stars };
};
`, ctx, { filename: 'bridge.js' });

if (!ctx.__api) { console.error('engine bridge missing', loadErrors); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

// ---- independent cross-checks (ported from verify_independent.js) ----
function boxSize(N) { return N === 4 ? [2, 2] : N === 6 ? [2, 3] : [3, 3]; }
function legal(r, c, v, grid, N, br, bc, h, vIneq) {
  for (let i = 0; i < N; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
  const br0 = Math.floor(r / br) * br, bc0 = Math.floor(c / bc) * bc;
  for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) if (grid[br0 + i][bc0 + j] === v) return false;
  if (c < N - 1 && h[r][c]) { const right = grid[r][c + 1]; if (right !== 0) { if (h[r][c] === '>' && !(v > right)) return false; if (h[r][c] === '<' && !(v < right)) return false; } }
  if (c > 0 && h[r][c - 1]) { const left = grid[r][c - 1]; if (left !== 0) { if (h[r][c - 1] === '>' && !(left > v)) return false; if (h[r][c - 1] === '<' && !(left < v)) return false; } }
  if (r < N - 1 && vIneq[r][c]) { const down = grid[r + 1][c]; if (down !== 0) { if (vIneq[r][c] === '>' && !(v > down)) return false; if (vIneq[r][c] === '<' && !(v < down)) return false; } }
  if (r > 0 && vIneq[r - 1][c]) { const up = grid[r - 1][c]; if (up !== 0) { if (vIneq[r - 1][c] === '>' && !(up > v)) return false; if (vIneq[r - 1][c] === '<' && !(up < v)) return false; } }
  return true;
}
function independentVerify(level, deadline) {
  const N = level.N, [br, bc] = boxSize(N), sol = level.s, giv = level.p, h = level.h, vIneq = level.v;
  if (sol.length !== N || giv.length !== N || h.length !== N || vIneq.length !== N - 1) return { ok: false, reason: 'dims' };
  for (let r = 0; r < N; r++) { if (sol[r].length !== N) return { ok: false, reason: 'sol cols' }; if (new Set(sol[r]).size !== N) return { ok: false, reason: 'sol row ' + r }; }
  for (let c = 0; c < N; c++) { const s = new Set(); for (let r = 0; r < N; r++) s.add(sol[r][c]); if (s.size !== N) return { ok: false, reason: 'sol col ' + c }; }
  for (let bi = 0; bi < N; bi += br) for (let bj = 0; bj < N; bj += bc) { const s = new Set(); for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) s.add(sol[bi + i][bj + j]); if (s.size !== N) return { ok: false, reason: 'sol box' }; }
  for (let r = 0; r < N; r++) for (let c = 0; c < N - 1; c++) { if (h[r][c] === '>' && !(sol[r][c] > sol[r][c + 1])) return { ok: false, reason: 'h ineq ' + r + ',' + c }; if (h[r][c] === '<' && !(sol[r][c] < sol[r][c + 1])) return { ok: false, reason: 'h ineq ' + r + ',' + c }; }
  for (let r = 0; r < N - 1; r++) for (let c = 0; c < N; c++) { if (vIneq[r][c] === '>' && !(sol[r][c] > sol[r + 1][c])) return { ok: false, reason: 'v ineq ' + r + ',' + c }; if (vIneq[r][c] === '<' && !(sol[r][c] < sol[r + 1][c])) return { ok: false, reason: 'v ineq ' + r + ',' + c }; }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (giv[r][c] !== 0 && giv[r][c] !== sol[r][c]) return { ok: false, reason: 'given mismatch ' + r + ',' + c };
  const grid = giv.map(r => r.slice());
  let solutions = 0;
  function dfs() {
    if (solutions >= 2) return;
    if (Date.now() > deadline) { solutions = -1; return; } // timeout => inconclusive, treated as fail-safe
    let er = -1, ec = -1;
    for (let r = 0; r < N && er === -1; r++) for (let c = 0; c < N; c++) if (grid[r][c] === 0) { er = r; ec = c; break; }
    if (er === -1) { solutions++; return; }
    for (let v = 1; v <= N; v++) { if (legal(er, ec, v, grid, N, br, bc, h, vIneq)) { grid[er][ec] = v; dfs(); grid[er][ec] = 0; if (solutions >= 2 || solutions === -1) return; } }
  }
  dfs();
  if (solutions === -1) return { ok: false, reason: 'solver-timeout' };
  return { ok: solutions === 1, reason: solutions === 1 ? 'unique' : solutions + ' solutions' };
}

let pass = 0, fail = 0; const fails = [];
const t0 = Date.now();
const LEVELS = ctx.__api.LEVELS_DATA;
const jsonLevels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8')).levels;
const matchesJson = JSON.stringify(LEVELS) === JSON.stringify(jsonLevels);
if (matchesJson) pass++; else { fail++; fails.push('embedded LEVELS_DATA != levels.json'); }

for (let i = 0; i < LEVELS.length; i++) {
  const deadline = Date.now() + 8000;
  const iv = independentVerify(LEVELS[i], deadline);
  let rep;
  try { rep = ctx.__replay(i); } catch (e) { rep = { err: String(e).slice(0, 200) }; }
  const ok = iv.ok && rep.finished === true && rep.mistakes === 0 && rep.complete === true;
  if (ok) { pass++; console.log(`L${i + 1} (${LEVELS[i].tier} N=${LEVELS[i].N}) replayed ${rep.placed} digits -> winLevel, ${iv.reason}`); }
  else { fail++; fails.push(`L${i + 1}(ind=${iv.reason},replay=${JSON.stringify(rep).slice(0, 120)})`); console.log(`L${i + 1} FAIL ind=${iv.reason} replay=${JSON.stringify(rep)}`); }
  if (Date.now() - t0 > 110000) { fail++; fails.push('time-budget'); break; }
}
if (loadErrors.length) { fail++; fails.push('load-errors: ' + loadErrors.join(';')); console.log(loadErrors.join('\n')); }
console.log(JSON.stringify({ pass, fail, fails, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', extra: { levels: LEVELS.length, durS: +((Date.now() - t0) / 1000).toFixed(1) } }));
process.exit(fail === 0 ? 0 : 1);
