#!/usr/bin/env node
/*
 * Hexa-Bridges in-engine verifier (pure Node vm — no browser, no Python).
 *
 * Replaces the previous Python-Playwright driver (python3 has no playwright
 * module on this machine). The game engine lives inside a closed IIFE, so we
 * drive it exactly like a player would through DOM stubs:
 *
 *   1. extract the inline <script>s from index.html into a vm sandbox
 *      (window.__LEVELS_DATA levels script + engine IIFE + adsense stub)
 *   2. localStorage is pre-seeded: progress stars 0..N-1 = 3 (all levels
 *      unlocked, unlockFor()) and settings sound=false (getAudio() no-ops)
 *   3. per level: click the level button in #tiers (=> startLevel(i)),
 *      collect the engine-rendered .edge-tap zones from #board.innerHTML,
 *      verify every stored solution edge is a rendered legal adjacency,
 *      click each solution edge on #board (=> toggleBridge), then click
 *      #btn-check (=> doCheck -> checkWin -> winLevel) and assert the
 *      win overlay (#overlay-win) received the 'show' class.
 *   4. cross-check the inline LEVELS data against levels.json
 *      (size/anchors/solution must be identical).
 *
 * Usage: node verify_engine.js   (cwd-independent)
 * exit 0 = every level won in-engine; last stdout line is
 * {"pass":N,"fail":M,"total":T,"verdict":"PASS|FAIL"}
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'hexa-bridges';
const SLUG_DIR = __dirname;

function fatal(msg) {
  console.error('verify_engine[' + SLUG + '] fatal: ' + msg);
  console.log(JSON.stringify({ pass: 0, fail: 0, total: 0, verdict: 'FAIL' }));
  process.exit(1);
}

const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length < 2) fatal('expected >=2 inline scripts (levels data + engine), got ' + scripts.length);
const code = scripts.join('\n');

// ---------------- minimal DOM stubs ----------------
function mkClassList() {
  const set = new Set();
  return {
    add: (...cs) => { cs.forEach(c => set.add(c)); },
    remove: (...cs) => { cs.forEach(c => set.delete(c)); },
    toggle: (c, force) => {
      const on = force === undefined ? !set.has(c) : !!force;
      if (on) set.add(c); else set.delete(c);
      return on;
    },
    contains: c => set.has(c),
  };
}

function parseAttrStr(s) {
  const o = {};
  let m;
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  while ((m = re.exec(s))) o[m[1]] = m[2] !== undefined ? m[2] : m[3];
  return o;
}

function mkEl(extra) {
  const el = {
    tag: 'div', id: '', className: '', textContent: '', innerHTML: '', value: '',
    style: {}, attrs: {}, children: [], parentElement: null, parentNode: null,
    hidden: false,
    _handlers: {},
    addEventListener(type, fn) { (el._handlers[type] = el._handlers[type] || []).push(fn); },
    removeEventListener() {},
    dispatchEvent() { return true; },
    appendChild(c) { el.children.push(c); if (c && typeof c === 'object') { c.parentElement = el; c.parentNode = el; } return c; },
    removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); return c; },
    remove() {},
    setAttribute(n, v) { el.attrs[n] = String(v); },
    getAttribute(n) { return n in el.attrs ? el.attrs[n] : null; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 480, right: 480, bottom: 480 }),
    getContext: () => new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => {}), set: () => true }),
    animate: () => ({ onfinish: null, cancel: () => {} }),
  };
  el.classList = mkClassList();
  el.querySelector = (sel) => { const r = qsa(el, sel); return r.length ? r[0] : null; };
  el.querySelectorAll = (sel) => qsa(el, sel);
  Object.assign(el, extra || {});
  return el;
}

// mini querySelector(All) over an element's innerHTML string:
// supports '<tag>', '.class', 'tag.class' (all the engine uses)
function qsa(el, sel) {
  const out = [];
  const src = typeof el.innerHTML === 'string' ? el.innerHTML : '';
  if (!src) return out;
  const m = /^([a-zA-Z]*)((?:\.[a-zA-Z][\w-]*)*)$/.exec(sel);
  if (!m) return out;
  const wantTag = m[1] ? m[1].toLowerCase() : null;
  const wantCls = m[2] ? m[2].slice(1).split('.') : [];
  const tagRe = /<([a-zA-Z]+)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let t;
  while ((t = tagRe.exec(src))) {
    const tag = t[1].toLowerCase();
    if (wantTag && tag !== wantTag) continue;
    const attrs = parseAttrStr(t[2]);
    if (wantCls.length) {
      const cls = String(attrs['class'] || '').split(/\s+/);
      if (!wantCls.every(c => cls.includes(c))) continue;
    }
    const node = mkEl({ tag });
    node.attrs = attrs;
    String(attrs['class'] || '').split(/\s+/).filter(Boolean).forEach(c => node.classList.add(c));
    out.push(node);
  }
  return out;
}

const byId = new Map();
const documentStub = {
  getElementById(id) { if (!byId.has(id)) byId.set(id, mkEl({ id })); return byId.get(id); },
  createElement: (tag) => mkEl({ tag: String(tag).toLowerCase() }),
  createTextNode: (t) => ({ textContent: t }),
  getElementsByTagName: () => [],
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  body: mkEl(), head: mkEl(), documentElement: mkEl(),
  hidden: false, visibilityState: 'visible',
};

const audioCtxStub = () => ({
  createOscillator: () => ({ type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {}, disconnect() {} }),
  createGain: () => ({
    connect() {}, disconnect() {},
    gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
  }),
  destination: {}, currentTime: 0, state: 'running', resume() {}, close() {},
});

// pre-seeded storage: all levels unlocked (stars >= 1 on every previous level),
// sound off so the audio path is inert
const STORE = new Map([
  ['gz-hexa-bridges-settings-v1', JSON.stringify({ sound: false })],
  ['gz-hexa-bridges-progress-v1', JSON.stringify({
    stars: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [String(i), 3])),
    bestTime: {},
  })],
]);
const localStorageStub = {
  getItem: (k) => (STORE.has(k) ? STORE.get(k) : null),
  setItem: (k, v) => { STORE.set(k, String(v)); },
  removeItem: (k) => { STORE.delete(k); },
};

const windowStub = {
  addEventListener() {}, removeEventListener() {},
  innerWidth: 1280, innerHeight: 800,
  AudioContext: audioCtxStub, webkitAudioContext: audioCtxStub,
};

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, Error,
  window: windowStub, document: documentStub, localStorage: localStorageStub,
  setInterval: () => 0, clearInterval() {},
  setTimeout: () => 0, clearTimeout() {},   // timer/toast callbacks never gate the win path
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, // confetti is cosmetic
  performance: { now: () => Date.now() },
};
sandbox.webkitAudioContext = windowStub.AudioContext;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(code, ctx, { filename: 'hexa-bridges-inline.js' });
} catch (e) {
  fatal('engine load error: ' + (e && e.stack ? String(e.stack).split('\n').slice(0, 3).join(' | ') : e));
}

// ---------------- levels ----------------
const LEVELS = windowStub.__LEVELS_DATA && windowStub.__LEVELS_DATA.LEVELS;
if (!Array.isArray(LEVELS) || LEVELS.length === 0) fatal('window.__LEVELS_DATA.LEVELS missing/empty');
console.log('[hexa-bridges] engine loaded in vm; inline levels: ' + LEVELS.length);

// canonical edge key — byte-for-byte the engine's edgeKey()
const ck = (a, b) => {
  const k1 = a[0] + ',' + a[1], k2 = b[0] + ',' + b[1];
  return k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
};

// cross-check inline data vs levels.json
let jsonConsistent = null, jsonNote = '';
try {
  const data = JSON.parse(fs.readFileSync(path.join(SLUG_DIR, 'levels.json'), 'utf8'));
  const ls = data.levels || [];
  jsonConsistent = ls.length === LEVELS.length && ls.every((l, i) => {
    const L = LEVELS[i];
    const sizeOk = L.Q === l.size[0] && L.R === l.size[1] && l.number === i + 1;
    const keys = Object.keys(l.anchors);
    const anchorsOk = keys.length === Object.keys(L.anchors).length &&
      keys.every(k => L.anchors[k] === l.anchors[k]);
    const solA = l.solution.map(([a, b]) => ck(a, b)).sort().join(';');
    const solB = L.solution.map(([a, b]) => ck(a, b)).sort().join(';');
    return sizeOk && anchorsOk && solA === solB;
  });
  if (!jsonConsistent) jsonNote = 'levels.json disagrees with inline LEVELS data';
} catch (e) {
  jsonConsistent = null;
  jsonNote = 'levels.json unreadable: ' + (e.message || e);
}
console.log('[hexa-bridges] levels.json consistent with inline data: ' + jsonConsistent + (jsonNote ? ' (' + jsonNote + ')' : ''));

// ---------------- wiring ----------------
function fire(el, type, ev) {
  const hs = (el && el._handlers && el._handlers[type]) || [];
  for (const h of hs.slice()) h(ev || {});
}

// level buttons were built by buildLevelsView() during engine init
const tiersEl = byId.get('tiers');
const levelBtns = new Map();
if (tiersEl) {
  for (const grid of tiersEl.children) {
    if (String(grid.className || '').indexOf('lvl-grid') < 0) continue;
    for (const btn of grid.children) {
      const m = /<div>\s*(\d+)\s*<\/div>/.exec(btn.innerHTML || '');
      if (m) levelBtns.set(parseInt(m[1], 10), btn);
    }
  }
}
if (levelBtns.size !== LEVELS.length) fatal('expected ' + LEVELS.length + ' level buttons in #tiers, found ' + levelBtns.size);

const el = (id) => documentStub.getElementById(id); // creates+caches on first use
const boardEl = el('board');
const btnCheck = el('btn-check');
const overlayWin = el('overlay-win');
const statusEl = el('g-status');
if (!boardEl._handlers.click || !boardEl._handlers.click.length) fatal('#board has no click handler');
if (!btnCheck._handlers.click || !btnCheck._handlers.click.length) fatal('#btn-check has no click handler');

// ---------------- per-level verification ----------------
const results = [];
let pass = 0, fail = 0;
const fails = [];

for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const num = i + 1;
  const rec = { level: num, tier: L.tier, size: L.Q + 'x' + L.R, edges: Array.isArray(L.solution) ? L.solution.length : 0 };
  try {
    overlayWin.classList.remove('show'); // like btn-next-win before moving on
    const btn = levelBtns.get(num);
    if (!btn || !(btn._handlers.click || []).length) throw new Error('level button locked/missing');
    fire(btn, 'click'); // => startLevel(i) => renderBoard()

    // legal adjacency zones rendered by the engine for this level
    const zones = new Set(qsa(boardEl, '.edge-tap').map(n => n.getAttribute('data-edge')));
    const keys = (L.solution || []).map(([a, b]) => ck(a, b));
    rec.dupes = keys.length !== new Set(keys).size;
    rec.zonesOk = keys.every(k => zones.has(k));

    // place every solution bridge via board clicks (=> toggleBridge)
    for (const k of keys) {
      fire(boardEl, 'click', {
        target: {
          classList: { contains: (c) => c === 'edge-tap' },
          getAttribute: (n) => (n === 'data-edge' ? k : null),
        },
      });
    }
    rec.preCheckOverlay = overlayWin.classList.contains('show'); // must be false
    rec.connectedStatus = String(statusEl.innerHTML || '').indexOf('Connected tree') >= 0;

    fire(btnCheck, 'click'); // => doCheck() -> checkWin() -> winLevel()
    rec.win = overlayWin.classList.contains('show');
    if (!rec.win) {
      rec.statusHtml = String(statusEl.innerHTML || '').slice(0, 90);
      rec.errCount = byId.get('err-count').textContent;
    }
  } catch (e) {
    rec.win = false;
    rec.error = String(e && e.message || e).slice(0, 120);
  }
  rec.ok = rec.win === true && rec.preCheckOverlay === false;
  if (rec.ok) pass++; else { fail++; fails.push(num); }
  results.push(rec);
  console.log(
    'L' + String(num).padStart(2, '0') + ' ' + rec.tier + ' ' + rec.size +
    ' edges=' + rec.edges +
    ' zones=' + (rec.zonesOk ? 'ok' : 'MISSING') +
    ' dupes=' + (rec.dupes ? 'yes' : 'no') +
    ' conn=' + (rec.connectedStatus ? 'yes' : 'no') +
    ' check=' + (rec.ok ? 'WIN' : 'FAIL') +
    (rec.error ? ' err=' + rec.error : '') +
    (!rec.ok && rec.statusHtml ? ' status="' + rec.statusHtml + '"' : '')
  );
}

console.log('##DETAIL## ' + JSON.stringify({
  method: 'node-vm',
  levelsJsonConsistent: jsonConsistent,
  jsonNote: jsonNote || undefined,
  fails,
  levels: results,
}));
console.log(JSON.stringify({ pass, fail, total: LEVELS.length, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
