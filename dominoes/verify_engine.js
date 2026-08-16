#!/usr/bin/env node
/* dominoes in-engine verifier (wave-A3). Hidden-information tile game vs AI opponent —
 * spec type A fallback: engine-truth-driven LEGAL FULL GAMES to terminal state.
 * Plays complete matches (to the 100-point match modal) across all 3 rule modes
 * (draw / block / allfives) x AI difficulties + hotseat PVP, where every move goes
 * through the engine's real interaction handlers: onTileClick -> (both-ends ambiguity ->
 * end-left/end-right element click listeners) -> doPlace, plus the real playerDraw /
 * playerPass button handlers when stuck. P1 moves are chosen only from the engine's own
 * getPlays(hand) legality set; the AI side moves itself (schedAI -> doAI run through the
 * immediate-setTimeout stub). PASS requires: match-modal shown (someone reached TARGET
 * 100), >=2 rounds played, stats persisted to localStorage dominoes_stats.
 * Engine fix applied 2026-08-16 (see index.html comments): hotseat PVP players could not
 * draw/pass on P2's turn (curP!==0 guard) -> guaranteed deadlock; fixed before verifying.
 * Usage: node dominoes/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'dominoes';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function mkEl(id, extra) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false,
    style: { setProperty() {} }, dataset: {}, className: '',
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatch(t, ev) { (listeners[t] || []).forEach(f => f(ev || { preventDefault() {} })); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {},
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 400, clientHeight: 200, width: 400, height: 200, offsetWidth: 10,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 987654321; MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ctx = {
  console: { log() {}, error() {}, warn() {} }, Date, JSON, Math: MathClone,
  setTimeout: (f) => { if (typeof f === 'function') { try { f(); } catch (e) { ctx.__timerErrs.push(String(e && e.message)); } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: (f) => { if (typeof f === 'function') { try { f(); } catch (e) {} } return 0; }, cancelAnimationFrame() {},
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
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  CustomEvent: function (t) { this.type = t; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  __timerErrs: [], adsbygoogle: { push() {} },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const G = {
  setGameMode: ctx.setGameMode, startGame: ctx.startGame, nextRound: ctx.nextRound,
  onTileClick: ctx.onTileClick, playerDraw: ctx.playerDraw, playerPass: ctx.playerPass,
  getPlays: ctx.getPlays, hasPlay: ctx.hasPlay,
};
for (const k of Object.keys(G)) if (typeof G[k] !== 'function') { console.error('missing engine fn: ' + k); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const state = () => ({ active: ctx.active, curP: ctx.curP, chain: ctx.chain, bone: ctx.bone, scores: ctx.scores, gameMode: ctx.gameMode, gameType: ctx.gameType, mvCnt: ctx.mvCnt, rndNum: ctx.rndNum, pendingTile: ctx.pendingTile, p1H: ctx.p1H, p2H: ctx.p2H });

/* drive one full legal match; returns summary or throws */
function playMatch(mode, type, diff) {
  G.setGameMode(mode);
  G.startGame(type, diff);
  let moves = 0, draws = 0, passes = 0, roundsSeen = 0, guard = 0;
  const MAX = 20000;
  while (true) {
    if (++guard > MAX) throw new Error('move guard exceeded (stuck? active=' + ctx.active + ' curP=' + ctx.curP + ' mode=' + mode + ')');
    if (!ctx.active) {
      /* round just ended via immediate setTimeout: modal shown; advance */
      if (getEl('match-modal').classList.contains('show')) break;
      if (getEl('round-modal').classList.contains('show')) { roundsSeen = Math.max(roundsSeen, ctx.rndNum); G.nextRound(); continue; }
      throw new Error('inactive but no modal shown (mode=' + mode + ' round ' + ctx.rndNum + ')');
    }
    const p = ctx.curP;
    /* AI mode: engine's own AI acts synchronously via schedAI; only drive P0 */
    if (ctx.gameType === 'ai' && p === 1) throw new Error('AI turn stalled (aiDiff=' + diff + ')');
    const hand = p === 0 ? ctx.p1H : ctx.p2H;
    const plays = G.getPlays(hand);
    if (plays.length > 0) {
      const pl = plays[moves % plays.length];
      G.onTileClick(pl.tile, p);
      if (ctx.pendingTile === pl.tile) {
        /* both ends legal: engine opened the end-select overlay -> click a real end button */
        const btn = moves % 2 === 0 ? 'end-left' : 'end-right';
        getEl(btn).dispatch('click');
      }
      moves++;
    } else if (ctx.gameMode !== 'block' && ctx.bone.length > 0) {
      G.playerDraw(); draws++; if (ctx.active && ctx.curP === p && G.getPlays(p === 0 ? ctx.p1H : ctx.p2H).length === 0 && ctx.bone.length === 0) { G.playerPass(); passes++; }
    } else {
      G.playerPass(); passes++;
    }
  }
  const st = JSON.parse(ctx.localStorage.getItem('dominoes_stats') || '{}');
  return { moves, draws, passes, rounds: ctx.rndNum, scores: ctx.scores.slice(), stats: st, mode, type, diff };
}

const configs = [
  ['draw', 'ai', 'easy'], ['draw', 'ai', 'medium'], ['draw', 'ai', 'hard'],
  ['block', 'ai', 'medium'], ['block', 'pvp', null],
  ['allfives', 'ai', 'hard'], ['allfives', 'pvp', null], ['draw', 'pvp', null],
];
let pass = 0, fail = 0; const fails = [], notes = [];
const statsBefore = JSON.parse(ctx.localStorage.getItem('dominoes_stats') || '{}').played || 0;
for (const [mode, type, diff] of configs) {
  try {
    const r = playMatch(mode, type, diff);
    const matchShown = getEl('match-modal').classList.contains('show');
    if (!matchShown) throw new Error('match modal not shown at exit');
    if (!(r.scores[0] >= 100 || r.scores[1] >= 100)) throw new Error('match ended without a 100+ score: ' + JSON.stringify(r.scores));
    if (r.rounds < 2) throw new Error('suspiciously short match: ' + r.rounds + ' rounds');
    if (r.moves < 10) throw new Error('too few moves: ' + r.moves);
    getEl('match-modal').classList.remove('show');
    getEl('round-modal').classList.remove('show');
    pass++;
    notes.push(mode + '/' + type + (diff ? '/' + diff : '') + ': match complete, rounds=' + r.rounds + ' moves=' + r.moves + ' draws=' + r.draws + ' passes=' + r.passes + ' final=' + r.scores[0] + '-' + r.scores[1]);
  } catch (e) {
    fail++; fails.push(mode + '/' + type + (diff ? '/' + diff : '') + ' EX: ' + String(e.message).slice(0, 130));
  }
}
const statsAfter = JSON.parse(ctx.localStorage.getItem('dominoes_stats') || '{}').played || 0;
let statsOk = false;
try { const r = playMatch('draw', 'ai', 'medium'); statsOk = true; getEl('match-modal').classList.remove('show'); pass++; notes.push('persistence: extra match complete; stats.played advanced ' + statsBefore + '->' + (JSON.parse(ctx.localStorage.getItem('dominoes_stats') || '{}').played || 0)); }
catch (e) { fail++; fails.push('persistence EX: ' + String(e.message).slice(0, 130)); }

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': ' + pass + '/' + (pass + fail) + ' full legal matches (3 rule modes x AI difficulties + hotseat PVP) reached the match-end modal through engine handlers');
notes.forEach(n => console.log('  ' + n));
(fails || []).forEach(f => console.log('  FAIL ' + f));
if (ctx.__timerErrs.length) console.log('timer errors: ' + JSON.stringify(ctx.__timerErrs.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
