#!/usr/bin/env node
/* GENERATED in-engine verifier for yajilin — STATIC LEVELS edition.
 * yajilin/index.html now embeds offline-generated levels (STATIC_LV, 30 levels +
 * DAILY_LV, 7-level daily rotation) produced by _optimization/scripts/gen-yajilin-levels.js,
 * each proven uniquely solvable offline (induced-cycle construction matching the engine's
 * checkWin rules, then an independent exhaustive enumerator proving exactly one winning
 * shading). The previous runtime generator (genPuzzle -> unbounded findHC DFS, clues placed
 * after the cycle) produced unsolvable/hanging boards and was removed from the play path.
 *
 * This verifier checks, for every one of the 30 static levels + all 7 daily-pool dates
 * (daily pick = YYYYMMDD % DAILY_LV.length, exercised via a controlled clock):
 *   1. index.html really serves the static data: startLevel(idx) loads exactly the
 *      embedded clues/shaded/hc (no runtime regeneration).
 *   2. Independent invariant check of the loaded puzzle: every arrow clue counts exactly
 *      n shaded cells in its ray; shaded cells pairwise non-adjacent; the hc set covers
 *      every non-shaded non-clue cell, every hc cell has exactly 2 hc neighbours, and the
 *      hc cells form one connected component (a single loop) — i.e. the embedded solution
 *      is a genuine win under the rules enforced by checkWin (index.html:494).
 *   3. The solution is PLAYED through the engine's own cellAction (shade the shaded set,
 *      loop-mark the hc cells) and checkWin must fire showWin: #winOv shown and
 *      save.lv[idx] stars persisted to localStorage yajilinV1.
 * Single process, no workers (static levels load instantly; nothing searches).
 * Usage: node yajilin/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'yajilin';
const SLUG_DIR = __dirname;

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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}

/* Controlled clock: the daily pick is seed = YYYYMMDD % DAILY_LV.length, so the verifier
 * walks the whole rotation by shifting the sandbox date. */
function mkFakeDate() {
  const RealDate = Date;
  let offsetMs = 0;
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(RealDate.now() + offsetMs);
      else super(...args);
    }
    static now() { return RealDate.now() + offsetMs; }
  }
  return { FakeDate, setOffsetDays(days) { offsetMs = days * 86400000; }, seedNow() { const d = new RealDate(RealDate.now() + offsetMs); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); } };
}

function makeCtx(dateOverride) {
  const BODY = mkEl();
  const DOC_EL = mkEl();
  BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL;
  DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
  function ImageStub() { const o = { width: 0, height: 0, onload: null, onerror: null, addEventListener: () => {} }; let _src = ''; Object.defineProperty(o, 'src', { get: () => _src, set: (v) => { _src = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; }
  const elsById = new Map();
  const timerErrors = [];
  const MathClone = Object.assign(Object.create(Math), Math);
  const sandbox = {
    console, Math: MathClone, Date: dateOverride || Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
    parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
    Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
    Image: ImageStub,
    CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
    window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
      AudioContext: function () { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        createBiquadFilter: () => ({ connect: () => {}, frequency: { value: 0 }, Q: { value: 0 }, type: '', gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100 }; },
      devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
      scrollY: 0, scrollX: 0, scrollTo: () => {}, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
      dispatchEvent: () => {},
    },
    document: {
      getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY, parentNode: BODY })); return elsById.get(id); },
      getElementsByTagName: () => [mkEl({ parentElement: BODY })],
      getElementsByClassName: () => [mkEl({ parentElement: BODY })],
      querySelector: () => mkEl({ parentElement: BODY }),
      querySelectorAll: () => [],
      addEventListener: () => {}, removeEventListener: () => {},
      createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
      createElementNS: (ns, t) => mkEl({ tagName: t, namespaceURI: ns, parentElement: BODY, parentNode: BODY }),
      createTextNode: (t) => ({ textContent: t }),
      body: BODY, head: mkEl(), documentElement: DOC_EL,
      hidden: false, visibilityState: 'visible', readyState: 'complete',
      cookie: '',
    },
    adsbygoogle: { push: () => {} },
    localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setInterval: () => 0, clearInterval: () => {},
    setTimeout: (fn) => { try { return fn && fn(); } catch (e) { timerErrors.push(String(e && e.message)); return 0; } },
    clearTimeout: () => {},
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    performance: { now: () => Date.now() },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
    navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
    MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
    ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
    IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
    CustomEvent: function (t) { return { type: t }; },
    Event: function (t) { return { type: t }; },
    devicePixelRatio: 1,
    __timerErrors: timerErrors,
  };
  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.window.performance = sandbox.performance;
  sandbox.window.navigator = sandbox.navigator;
  sandbox.window.setTimeout = sandbox.setTimeout;
  sandbox.window.setInterval = sandbox.setInterval;
  sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
  sandbox.webkitAudioContext = sandbox.window.AudioContext;
  sandbox.globalThis = sandbox;
  const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const code = scripts.join('\n');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: 'yajilin-bundle.js' });
  return { ctx, sandbox };
}

/* ---------- independent structural validation of the embedded static data ---------- */
function extractStatic(html) {
  function grab(name) {
    const m = html.match(new RegExp('var ' + name + '=([\\s\\S]*?);\\s*\\n'));
    if (!m) return null;
    /* the payload is plain JSON (arrays/objects/numbers/strings) */
    return JSON.parse(m[1]);
  }
  return { staticLv: grab('STATIC_LV'), dailyLv: grab('DAILY_LV') };
}

function validateLevel(L, label) {
  const errs = [];
  if (!L || typeof L.w !== 'number' || typeof L.h !== 'number') return ['bad geometry'];
  const { w, h } = L;
  if (w < 4 || h < 4 || w > 15 || h > 15) errs.push('geometry out of range ' + w + 'x' + h);
  const clueAt = {};
  (L.clues || []).forEach(cl => {
    const k = cl.r + ',' + cl.c;
    if (clueAt[k]) errs.push('duplicate clue at ' + k);
    clueAt[k] = cl;
    if (cl.r < 0 || cl.r >= h || cl.c < 0 || cl.c >= w) errs.push('clue out of bounds ' + k);
    if (!['U', 'D', 'L', 'R'].includes(cl.d)) errs.push('bad clue dir ' + cl.d);
    if (typeof cl.n !== 'number' || cl.n < 0 || cl.n > Math.max(w, h)) errs.push('bad clue n ' + cl.n);
  });
  const shadeSet = new Set();
  (L.shaded || []).forEach(s => {
    const k = s[0] + ',' + s[1];
    if (s[0] < 0 || s[0] >= h || s[1] < 0 || s[1] >= w) errs.push('shaded out of bounds ' + k);
    if (clueAt[k]) errs.push('shaded on clue cell ' + k);
    shadeSet.add(k);
  });
  const d4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (const k of shadeSet) {
    const [r, c] = k.split(',').map(Number);
    for (const [dr, dc] of d4) if (shadeSet.has((r + dr) + ',' + (c + dc))) errs.push('adjacent shaded ' + k + '~' + (r + dr) + ',' + (c + dc));
  }
  /* clue counts against the intended shading */
  const dMap = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  (L.clues || []).forEach(cl => {
    let cnt = 0, r = cl.r + dMap[cl.d][0], c = cl.c + dMap[cl.d][1];
    while (r >= 0 && r < h && c >= 0 && c < w) { if (shadeSet.has(r + ',' + c)) cnt++; r += dMap[cl.d][0]; c += dMap[cl.d][1]; }
    if (cnt !== cl.n) errs.push('clue (' + cl.r + ',' + cl.c + ') ' + cl.d + '=' + cl.n + ' sees ' + cnt);
  });
  /* hc: exactly the non-hole cells, every cell 2 hc-neighbours, one component */
  const hcSet = new Set((L.hc || []).map(p => p[0] + ',' + p[1]));
  if (hcSet.size !== (L.hc || []).length) errs.push('duplicate hc cell');
  let expectedFree = 0;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const k = r + ',' + c;
    const hole = shadeSet.has(k) || clueAt[k];
    if (!hole) { expectedFree++; if (!hcSet.has(k)) errs.push('free cell not on loop: ' + k); }
    else if (hcSet.has(k)) errs.push('hole cell on loop: ' + k);
  }
  if (hcSet.size !== expectedFree) errs.push('loop size ' + hcSet.size + ' != free cells ' + expectedFree);
  for (const k of hcSet) {
    const [r, c] = k.split(',').map(Number);
    let nb = 0;
    for (const [dr, dc] of d4) if (hcSet.has((r + dr) + ',' + (c + dc))) nb++;
    if (nb !== 2) errs.push('loop cell ' + k + ' has ' + nb + ' loop neighbours');
  }
  if (hcSet.size) {
    const first = [...hcSet][0];
    const seen = new Set([first]);
    const stack = [first];
    while (stack.length) {
      const [r, c] = stack.pop().split(',').map(Number);
      for (const [dr, dc] of d4) {
        const k = (r + dr) + ',' + (c + dc);
        if (hcSet.has(k) && !seen.has(k)) { seen.add(k); stack.push(k); }
      }
    }
    if (seen.size !== hcSet.size) errs.push('loop not connected: ' + seen.size + '/' + hcSet.size);
  }
  return errs.slice(0, 4);
}

/* ---------- per-item driver (runs inside the page context) ---------- */
const DRIVER = `(function __runItem(){
'use strict';
const IDX=__IDX__;            /* 0..29 level, or -1 for daily */
const EXPECT=__EXPECT__;      /* embedded static entry this item must serve */
init();
save.tut=true;
startLevel(IDX);
if(S.screen!=='game')return {ok:false,msg:'startLevel failed — level does not start'};
if(S.w!==EXPECT.w||S.h!==EXPECT.h)return {ok:false,msg:'served ' + S.w + 'x' + S.h + ' but embed says ' + EXPECT.w + 'x' + EXPECT.h};
const jcl=JSON.stringify(S.clues), jex=JSON.stringify(EXPECT.clues);
if(jcl!==jex)return {ok:false,msg:'served clues differ from STATIC embed'};
if(JSON.stringify(S.shaded)!==JSON.stringify(EXPECT.shaded))return {ok:false,msg:'served shaded set differs from embed'};
/* replay the embedded solution through the engine's own cellAction */
S.mode='shade';
for(const s of S.shaded)cellAction(s[0],s[1]);
S.mode='loop';
const hcSet=new Set(S.hc.map(p=>p[0]+','+p[1]));
for(const p of S.hc){if(hcSet.has(p[0]+','+p[1])&&!S.loopGrid[p[0]][p[1]]&&S.mode==='loop')cellAction(p[0],p[1]);}
const wo=document.getElementById('winOv');
if(!wo.classList.contains('show'))return {ok:false,msg:'winOv not shown after playing the embedded solution'};
let stars='';
if(IDX>=0){
 const sv=JSON.parse(localStorage.getItem('yajilinV1')||'{}');
 const st=sv.lv&&sv.lv[IDX];
 if(!(st>=1))return {ok:false,msg:'save.lv[' + IDX + '] not persisted after win'};
 stars='stars='+st;
}
return {ok:true,msg:'static level served + embedded solution won via cellAction' + (stars?' (' + stars + ')':'')};
})()`;

/* ---------- main ---------- */
function main() {
  const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
  const { staticLv, dailyLv } = extractStatic(html);
  const issues = [];
  if (!Array.isArray(staticLv) || staticLv.length !== 30) {
    console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', msg: 'STATIC_LV missing or not 30 entries (found ' + (staticLv && staticLv.length) + ')' }));
    process.exit(1);
  }
  if (!Array.isArray(dailyLv) || dailyLv.length < 1) {
    console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', msg: 'DAILY_LV missing or empty' }));
    process.exit(1);
  }
  const LVN = staticLv.length + 1; /* 30 levels + daily slot (daily pool rotation verified below) */

  /* structural validation of every embedded entry (levels + all pool days) */
  const structErrs = [];
  staticLv.forEach((L, i) => validateLevel(L, 'L' + (i + 1)).forEach(e => structErrs.push('L' + (i + 1) + ': ' + e)));
  dailyLv.forEach((L, i) => validateLevel(L, 'daily#' + i).forEach(e => structErrs.push('daily#' + i + ': ' + e)));

  /* items: 30 levels + every daily-pool date (rotation walked with a shifted clock) */
  const clock = mkFakeDate();
  const todayPick = ((new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate()) % dailyLv.length + dailyLv.length) % dailyLv.length;
  const items = [];
  for (let i = 0; i < staticLv.length; i++) items.push({ label: 'L' + (i + 1), idx: i, expect: staticLv[i], offsetDays: 0 });
  /* find a date offset (within +0..+13 days) hitting each pool index, incl. today's at +0 */
  const byPool = new Map();
  for (let off = 0; off < 14 && byPool.size < dailyLv.length; off++) {
    clock.setOffsetDays(off);
    const p = ((clock.seedNow() % dailyLv.length) + dailyLv.length) % dailyLv.length;
    if (!byPool.has(p)) byPool.set(p, off);
  }
  if (byPool.size < dailyLv.length) issues.push('daily rotation walk covered only ' + byPool.size + '/' + dailyLv.length + ' pool days in 14 days');
  for (const [poolIdx, off] of [...byPool].sort((a, b) => a[1] - b[1])) {
    items.push({ label: 'daily+' + off + 'd(pool#' + poolIdx + ')', idx: -1, expect: dailyLv[poolIdx], offsetDays: off, poolIdx });
  }

  const results = [];
  for (const it of items) {
    const t0 = Date.now();
    let out;
    try {
      const clock2 = mkFakeDate();
      clock2.setOffsetDays(it.offsetDays || 0);
      const { ctx } = makeCtx(clock2.FakeDate);
      out = vm.runInContext(DRIVER.replace('__IDX__', String(it.idx)).replace('__EXPECT__', JSON.stringify(it.expect)), ctx);
    } catch (e) {
      out = { ok: false, msg: 'EX:' + String(e && e.message).slice(0, 160) };
    }
    out.ms = Date.now() - t0;
    out.label = it.label;
    results.push(out);
  }

  let pass = 0, fail = 0;
  const fails = [], notes = [];
  if (structErrs.length) { structErrs.forEach(e => fails.push('STRUCT ' + e)); fail += structErrs.length; }
  for (const r of results) {
    if (r.ok) { pass++; if (/^L(1|30)$/.test(r.label) || r.label.startsWith('daily+0')) notes.push(r.label + ' (' + r.ms + 'ms): ' + r.msg); }
    else { fail++; fails.push(r.label + ' (' + r.ms + 'ms): ' + r.msg); }
  }
  const headline = pass >= LVN && fail === 0;
  console.log(SLUG + ' in-engine verification (static levels): ' + pass + '/' + (pass + fail) + ' items (' + staticLv.length + ' static levels + ' + (results.length - staticLv.length) + ' daily-pool dates; structural validation of all ' + (staticLv.length + dailyLv.length) + ' embedded entries included), verdict=' + (fail === 0 ? 'PASS' : 'FAIL'));
  notes.forEach(n => console.log('  ' + n));
  fails.slice(0, 30).forEach(f => console.log('  FAIL ' + f));
  const out = {
    pass, fail, total: pass + fail,
    verdict: fail === 0 ? 'PASS' : 'FAIL',
    headline: (fail === 0 ? LVN + '/' + LVN : pass + '/' + LVN) + ' (30 levels + today daily) — daily pool rotation: ' + (results.length - staticLv.length) + '/' + dailyLv.length + ' dates exercised (' + results.length + ' items total)',
    extra: {
      staticLevels: staticLv.length, dailyPool: dailyLv.length, dailyPickToday: todayPick,
      sizes: [...new Set(staticLv.map(L => L.w + 'x' + L.h))].join(','),
      provenance: 'offline generator _optimization/scripts/gen-yajilin-levels.js (induced-cycle construction matching engine checkWin rules; independent exhaustive enumerator proved exactly one winning shading per level; see _optimization/evidence/yajilin/)',
    },
  };
  if (issues.length) out.extra.issues = issues;
  if (out.extra.issues && out.extra.issues.length === 0) delete out.extra.issues;
  console.log(JSON.stringify(out));
  process.exit(fail === 0 ? 0 : 1);
}
main();
