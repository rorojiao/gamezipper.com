#!/usr/bin/env node
/* grow-worm in-engine verifier (Type A, verifier-spec.md).
 * 25 grid puzzles (worm + stars + magnets/boxes/switches + teleporters + spikes).
 * No embedded solutions => independent BFS solver written to the engine's exact
 * moveWorm() semantics (walls, self-collision, magnet-gated box push, star growth,
 * spike penalty+reset, teleporter pair, switch/exit gating, win-before-fail ordering),
 * then the found move sequence is REPLAYED through the engine's real input path
 * (UI.playLevel + handleKeydown key events -> moveWorm) and must reach gameState 'win'.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

const el = () => ({ textContent: '', innerHTML: '', value: '', classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: {},
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  getContext: () => new Proxy({}, { get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 10 });
    if (typeof p === 'string' && !(p in t)) return () => 1;
    return t[p];
  }, set: () => true }),
  width: 400, height: 400, clientWidth: 440, clientHeight: 600,
  parentElement: { clientWidth: 440, clientHeight: 600, appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {} },
  appendChild() {}, removeChild() {}, remove() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
  dataset: {}, focus() {}, blur() {}, disabled: false, preventDefault() {} });

function ACStub() {
  const node = () => ({ connect() { return node(); }, disconnect() {}, start() {}, stop() {},
    type: '', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
    gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  this.state = 'running'; this.currentTime = 0; this.destination = {}; this.sampleRate = 44100;
  this.resume = () => {}; this.close = () => {};
  this.createOscillator = node; this.createGain = node; this.createBufferSource = node;
  this.createBiquadFilter = node; this.createBuffer = () => ({ getChannelData: () => new Float32Array(100) });
}

const ctx = { console: { log() {}, error() {}, warn() {} }, Date, JSON, Math,
  setTimeout: (f) => { return 0; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem(k, v) { m[k] = String(v); }, removeItem(k) { delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} }, location: { href: 'http://localhost/grow-worm/', search: '', hash: '' },
  document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, createElement: el,
    body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} } }, documentElement: el(), hidden: false, visibilityState: 'visible', cookie: '' },
  AudioContext: ACStub, webkitAudioContext: ACStub, alert() {}, confirm: () => true, prompt: () => '',
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
  LEVELS, loadLevel, moveWorm, handleKeydown, UI,
  state: () => ({ gameState, moves, worm: worm.map(s => ({ x: s.x, y: s.y })), curIdx, exitOpen, switches: switches.map(s => ({ x: s.x, y: s.y, activated: s.activated })), carrying }),
  getLevelSave: id => saveData.levels[id] || null
};
`, ctx, { filename: 'bridge.js' });
if (!ctx.__api) { console.error('bridge missing', loadErrors); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const A = ctx.__api;

// ---------- independent BFS solver (engine moveWorm semantics) ----------
function solve(L, nodeCap, deadline) {
  const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }; // [dy,dx]
  const isWall = (x, y) => x < 0 || y < 0 || x >= L.gridW || y >= L.gridH || !!L.walls[x + ',' + y];
  const spikes = new Set(L.spikes.map(s => s.x + ',' + s.y));
  const magnets = L.magnets.map(m => m.x + ',' + m.y);
  const tele = L.teleporters;
  const teleMap = new Map(tele.map(t => [t.x + ',' + t.y, tele.find(o => o.pair === t.pair && (o.x !== t.x || o.y !== t.y))]));
  function initWorm() {
    const w = [{ x: L.start.x, y: L.start.y }];
    const dx = L.startDir === 'left' ? 1 : L.startDir === 'right' ? -1 : 0;
    const dy = L.startDir === 'up' ? 1 : L.startDir === 'down' ? -1 : 0;
    for (let i = 1; i < L.startLen; i++) w.push({ x: L.start.x + dx * i, y: L.start.y + dy * i });
    return w;
  }
  function exitOpenWith(boxes) {
    if (!L.switches.length) return true;
    return L.switches.every(sw => boxes.some(b => b.x === sw.x && b.y === sw.y));
  }
  const start = {
    worm: initWorm(),
    boxes: L.boxes.map(b => ({ x: b.x, y: b.y, id: b.id })),
    carrying: false,
    stars: new Set(L.stars.map(s => s.x + ',' + s.y).concat(L.bonusStars.map(s => s.x + ',' + s.y))),
    moves: 0,
  };
  const key = st => st.worm.map(s => s.x + ',' + s.y).join('|') + '#' + st.boxes.map(b => b.x + ',' + b.y).sort().join('|') + '#' + st.carrying + '#' + [...st.stars].sort().join('|');
  const q = [{ st: start, path: '' }];
  const seen = new Set([key(start)]);
  let nodes = 0;
  while (q.length) {
    if (++nodes > nodeCap || Date.now() > deadline) return { timeout: true, nodes };
    const { st, path } = q.shift();
    for (const d of ['up', 'down', 'left', 'right']) {
      const [dy, dx] = DIRS[d];
      const head = st.worm[0];
      const nx = head.x + dx, ny = head.y + dy;
      if (isWall(nx, ny)) continue;
      let selfHit = false;
      for (let i = 1; i < st.worm.length; i++) if (st.worm[i].x === nx && st.worm[i].y === ny) { selfHit = true; break; }
      if (selfHit) continue;
      const boxes = st.boxes.map(b => ({ x: b.x, y: b.y, id: b.id }));
      const bi = boxes.findIndex(b => b.x === nx && b.y === ny);
      let pushed = false;
      if (bi >= 0) {
        if (!st.carrying) continue;
        const bx = nx + dx, by = ny + dy;
        if (isWall(bx, by) || boxes.some(b => b.x === bx && b.y === by)) continue;
        boxes[bi].x = bx; boxes[bi].y = by;
        pushed = true;
      }
      let worm = [{ x: nx, y: ny }, ...st.worm];
      const stars = new Set(st.stars);
      let grew = false;
      const k = nx + ',' + ny;
      if (stars.has(k)) { stars.delete(k); grew = true; }
      const carrying = st.carrying || magnets.includes(k);
      let moves = st.moves;
      if (spikes.has(k)) {
        moves += 2;
        worm = initWorm(); // engine: reset to start, everything else kept
      } else {
        const tp = teleMap.get(k);
        if (tp) { worm[0].x = tp.x; worm[0].y = tp.y; }
        if (!grew) worm.pop();
        moves++;
        // win check (engine order: win BEFORE fail, so moves === ok can still win)
        if (worm[0].x === L.goal.x && worm[0].y === L.goal.y && exitOpenWith(boxes)) {
          return { won: true, path: path + (path ? ' ' : '') + d, moves };
        }
        if (moves >= L.ok) continue; // would failLevel
      }
      const ns = { worm, boxes, carrying, stars, moves };
      const kk = key(ns);
      if (!seen.has(kk)) { seen.add(kk); q.push({ st: ns, path: path + (path ? ' ' : '') + d }); }
    }
  }
  return { won: false, nodes };
}

// ---------- replay through the engine ----------
function replay(idx, movesStr) {
  vm.runInContext(`UI.playLevel(${idx});`, ctx);
  const dirs = movesStr ? movesStr.split(' ') : [];
  for (const d of dirs) {
    const keyName = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[d];
    vm.runInContext(`handleKeydown({ key: ${JSON.stringify(keyName)}, preventDefault(){} });`, ctx);
    const s = A.state();
    if (s.gameState === 'win') break;
    if (s.gameState === 'fail') break;
  }
  const s = A.state();
  return { gameState: s.gameState, moves: s.moves, saved: A.getLevelSave(A.LEVELS[idx].id) };
}

let pass = 0, fail = 0; const fails = [];
const t0 = Date.now();
for (let i = 0; i < A.LEVELS.length; i++) {
  const L = A.LEVELS[i];
  const deadline = Date.now() + 20000;
  const sol = solve(L, 4000000, deadline);
  if (sol.timeout) { fail++; fails.push(`L${i + 1} solver-timeout`); console.log(`L${i + 1} SOLVER TIMEOUT`); continue; }
  if (!sol.won) { fail++; fails.push(`L${i + 1} unsolvable(nodes=${sol.nodes})`); console.log(`L${i + 1} UNSOLVABLE nodes=${sol.nodes}`); continue; }
  const rep = replay(i, sol.path);
  const ok = rep.gameState === 'win' && rep.moves === sol.moves;
  if (ok) { pass++; console.log(`L${i + 1} (${L.name}) solved+replayed: ${sol.moves} moves (par ${L.par}, limit ${L.ok}) -> win, stars=${rep.saved ? rep.saved.stars : '?'}`); }
  else { fail++; fails.push(`L${i + 1} replay-mismatch(${rep.gameState},${rep.moves}vs${sol.moves})`); console.log(`L${i + 1} REPLAY MISMATCH`, JSON.stringify(rep)); }
  if (Date.now() - t0 > 110000) { fail++; fails.push('time-budget'); break; }
}
if (loadErrors.length) { fail++; fails.push('load-errors: ' + loadErrors.join(';')); console.log(loadErrors.join('\n')); }
console.log(JSON.stringify({ pass, fail, fails, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', extra: { levels: A.LEVELS.length, durS: +((Date.now() - t0) / 1000).toFixed(1) } }));
process.exit(fail === 0 ? 0 : 1);
