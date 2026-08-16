#!/usr/bin/env node
/* dreadrock (Dungeon Puzzle Quest) in-engine verifier (wave-A3). 30 grid levels:
 * keys/doors, sokoban blocks+plates, monsters (cost 1 HP), potions. Strategy: an
 * INDEPENDENT BFS over the exact semantics of the engine's move()/checkInteractions()/
 * updatePlates() (door opens permanently on key use or when ALL plates are covered;
 * block push blocked by wall/door/block/live-monster/exit; monster fight costs 1 HP and
 * death at hp<=0 restarts the level) finds a minimal-move solution per level, then the
 * solution is REPLAYED through the engine's real input path — window keydown events
 * (handleKey -> move). PASS requires the engine's own onLevelComplete to fire:
 * player standing on the exit, stars persisted to progress + localStorage 'dpq_save',
 * and the engine-built "ROOM CLEARED!" overlay appended to document.body.
 * Usage: node dreadrock/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'dreadrock';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

/* ---- sandbox ---- */
function mkEl(id, extra) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false,
    style: { setProperty() {} }, dataset: {}, className: '', onclick: null,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatch(t, ev) { (listeners[t] || []).forEach(f => f(ev || { preventDefault() {} })); },
    appendChild(c) { (el.__kids = el.__kids || []).push(c); return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width || 400, height: el.height || 300 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {},
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 400, clientHeight: 300, width: 400, height: 300, offsetWidth: 10,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const canvasEl = mkEl('game-canvas', { width: 480, height: 480 });
els.set('game-canvas', canvasEl);
const bodyEl = getEl('body');
const winListeners = {};
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 424242; MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ctx = {
  console: { log() {}, error() {}, warn() {} }, Date, JSON, Math: MathClone,
  setTimeout: (f) => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, createElement: t => mkEl(t),
    body: bodyEl, documentElement: mkEl('html'), hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  AudioContext: undefined, webkitAudioContext: undefined, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener(t, f) { (winListeners[t] = winListeners[t] || []).push(f); }, removeEventListener() {}, dispatchEvent() {},
  CustomEvent: function (t) { this.type = t; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  __timerErrs: [], adsbygoogle: { push() {} },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
for (const fn of ['loadLevel', 'move', 'showScreen']) {
  if (typeof ctx[fn] !== 'function') { console.error('missing engine fn: ' + fn); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
}
const LEVELS = ctx.LEVELS;
if (!Array.isArray(LEVELS) || LEVELS.length < 1) { console.error('LEVELS not accessible'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
if (!(winListeners.keydown || []).length) { console.error('keydown listener not registered'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ---- independent solver: BFS over the engine's exact move semantics ---- */
const DIRS = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];

function solve(lv, capStates) {
  const rows = lv.g.length, cols = lv.g[0].length;
  let player = null;
  const grid0 = [], blocks = [], plates = [], monsters = [], keys = [], potions = [], exits = [];
  for (let r = 0; r < rows; r++) {
    grid0[r] = '';
    for (let c = 0; c < cols; c++) {
      const ch = lv.g[r][c]; /* NOTE: engine's switch default -> '.' for undefined/out-of-row */
      let cell = '.';
      switch (ch) {
        case '#': cell = '#'; break;
        case '@': player = { x: c, y: r }; break;
        case 'E': exits.push({ x: c, y: r }); cell = 'E'; break;
        case 'K': keys.push({ x: c, y: r }); break;
        case 'D': cell = 'D'; break;
        case 'B': blocks.push([c, r]); break;
        case 'P': plates.push({ x: c, y: r }); break;
        case 'M': monsters.push({ x: c, y: r }); break;
        case 'H': potions.push({ x: c, y: r }); break;
      }
      grid0[r] += cell;
    }
  }
  if (!player || !exits.length) return { why: 'no player or no exit' };
  const start = { grid: grid0, blocks, mdead: 0, ktook: 0, ptook: 0, hp: 3, keys: 0, px: player.x, py: player.y };
  const key = (s) => s.grid.join('') + '|' + s.blocks.map(b => b[0] + ',' + b[1]).sort().join(';') + '|' + s.mdead + ',' + s.ktook + ',' + s.ptook + ',' + s.px + ',' + s.py + ',' + s.hp + ',' + s.keys;

  const monAt = (s, x, y) => { for (let i = 0; i < monsters.length; i++) if (!(s.mdead & (1 << i)) && monsters[i].x === x && monsters[i].y === y) return i; return -1; };
  const blockAt = (s, x, y) => s.blocks.findIndex(b => b[0] === x && b[1] === y);

  function interact(s) { /* pickups at player pos + exit check (engine checkInteractions) */
    for (let i = 0; i < keys.length; i++) {
      if (!(s.ktook & (1 << i)) && keys[i].x === s.px && keys[i].y === s.py) { s.ktook |= (1 << i); s.keys++; }
    }
    for (let i = 0; i < potions.length; i++) {
      if (!(s.ptook & (1 << i)) && potions[i].x === s.px && potions[i].y === s.py) { s.ptook |= (1 << i); if (s.hp < 3) s.hp++; }
    }
    const win = exits.some(e => e.x === s.px && e.y === s.py);
    return win;
  }
  function openPlatesDoors(s) { /* engine updatePlates: ALL doors open permanently when every plate covered */
    if (!plates.length) return;
    const allOn = plates.every(p => s.blocks.some(b => b[0] === p.x && b[1] === p.y));
    if (!allOn) return;
    let changed = false;
    for (let r = 0; r < rows; r++) if (s.grid[r].includes('D')) { s.grid[r] = s.grid[r].replace(/D/g, '.'); changed = true; }
    return changed;
  }

  function step(st, dx, dy) {
    const nx = st.px + dx, ny = st.py + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return null;
    const cell = st.grid[ny][nx];
    if (cell === '#') return null;
    /* fresh copy-on-write state */
    const s = { grid: st.grid, blocks: st.blocks, mdead: st.mdead, ktook: st.ktook, ptook: st.ptook, hp: st.hp, keys: st.keys, px: nx, py: ny };
    const cow = () => { if (s.grid === st.grid) s.grid = st.grid.slice(); };
    if (cell === 'D') { /* door: consumes a key and opens it, player steps in same move */
      if (st.keys <= 0) return null;
      s.keys = st.keys - 1; cow();
      s.grid[ny] = s.grid[ny].substring(0, nx) + '.' + s.grid[ny].substring(nx + 1);
    }
    const bi = blockAt(s, nx, ny);
    if (bi >= 0) {
      const bx = nx + dx, by = ny + dy;
      if (bx < 0 || by < 0 || bx >= cols || by >= rows) return null;
      const bcell = s.grid[by][bx];
      if (bcell === '#' || bcell === 'D') return null;
      if (blockAt(s, bx, by) >= 0) return null;
      if (monAt(s, bx, by) >= 0) return null;
      if (exits.some(e => e.x === bx && e.y === by)) return null;
      s.blocks = st.blocks.slice(); s.blocks[bi] = [bx, by];
      cow(); openPlatesDoors(s);
      const win = interact(s);
      return { s, win };
    }
    const mi = monAt(s, nx, ny);
    if (mi >= 0) {
      if (s.hp <= 1) return null; /* engine: hp-- then hp<=0 -> level restart (dead branch) */
      s.mdead = st.mdead | (1 << mi); s.hp = st.hp - 1;
      const win = interact(s);
      return { s, win };
    }
    const win = interact(s);
    return { s, win };
  }

  const seen = new Set([key(start)]);
  let queue = [{ s: start, path: [] }];
  let explored = 0;
  for (let depth = 0; depth < 400 && queue.length; depth++) {
    const next = [];
    for (const { s, path } of queue) {
      for (const [dname, dx, dy] of DIRS) {
        const r = step(s, dx, dy);
        if (!r) continue;
        if (r.win) return { path: path.concat([dname]), moves: path.length + 1, explored };
        const k = key(r.s);
        if (seen.has(k)) continue;
        seen.add(k);
        if (++explored > capStates) return { why: 'state cap (' + capStates + ')', explored };
        next.push({ s: r.s, path: path.concat([dname]) });
      }
    }
    queue = next;
  }
  return { why: queue.length ? 'depth cap' : 'exhausted', explored };
}

/* ---- replay a solution through the engine's real keydown path ---- */
const KEYNAME = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
function keyDown(k) { (winListeners.keydown || []).forEach(f => f({ key: k, preventDefault() {} })); }
function playThrough(idx, dirs) {
  vm.runInContext('loadLevel(' + idx + '); showScreen("game");', ctx);
  const kidsBefore = (bodyEl.__kids || []).length;
  for (const d of dirs) {
    keyDown(KEYNAME[d]);
    const st = ctx.state;
    if (st.hp <= 0) throw new Error('player died mid-replay at move ' + ctx.state.moves);
    if (st.level !== idx) throw new Error('level restarted mid-replay (death)');
  }
  const st = ctx.state;
  const lv = LEVELS[idx];
  const exit = lv.g[st.player.y] ? lv.g[st.player.y][st.player.x] : '?';
  if (exit !== 'E') throw new Error('player ended on "' + exit + '" not exit');
  if (st.moves !== dirs.length) throw new Error('engine counted ' + st.moves + ' moves vs ' + dirs.length + ' dispatched');
  const prog = ctx.progress;
  const stars = (prog.stars || {})[idx] || 0;
  if (!stars) throw new Error('win reached but progress.stars not set');
  const sv = JSON.parse(ctx.localStorage.getItem('dpq_save') || '{}');
  const svStars = ((sv.p || {}).stars || {})[idx] || 0;
  if (!svStars) throw new Error('progress not persisted to dpq_save');
  const kids = bodyEl.__kids || [];
  const ov = kids[kids.length - 1];
  if (!ov || ov.className !== 'overlay' || !String(ov.innerHTML).includes('ROOM CLEARED!')) throw new Error('win overlay not appended');
  return { stars, moves: st.moves, par: lv.p || 0, unlocked: prog.unlocked };
}

let pass = 0, fail = 0; const fails = [], notes = [];
const t0 = Date.now();
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const sol = solve(lv, 3000000);
  if (process.env.DRK_PLAN_ONLY) {
    console.log(JSON.stringify(sol.path ? { n: i + 1, solvable: true, min: sol.path.length, par: lv.p || 0 } : { n: i + 1, solvable: false, why: sol.why }));
    continue;
  }
  if (!sol.path) { fail++; fails.push('L' + (i + 1) + ' unsolvable: ' + sol.why + ' (explored ' + (sol.explored || 0) + ')'); continue; }
  try {    const r = playThrough(i, sol.path);
    pass++;
    if (r.stars < 3) notes.push('L' + (i + 1) + ': BFS minimum ' + r.moves + ' moves > par ' + r.par + ' -> 3 stars unattainable (' + r.stars + '-star win), engine declared win + persisted');
    else if (i === 0 || i === LEVELS.length - 1 || i % 6 === 0) notes.push('L' + (i + 1) + ': BFS ' + r.moves + ' moves vs par ' + r.par + ' -> ' + r.stars + ' stars, engine declared win + persisted');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' replay EX: ' + String(e.message).slice(0, 140));
  }
}

if (process.env.DRK_PLAN_ONLY) process.exit(0);

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails.slice(0, 31);
console.log(SLUG + ': ' + pass + '/' + (pass + fail) + ' levels solved by independent BFS over engine semantics and replayed via real keydown events (engine onLevelComplete + dpq_save + overlay)');
notes.forEach(x => console.log('  ' + x));
(fails || []).slice(0, 12).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
