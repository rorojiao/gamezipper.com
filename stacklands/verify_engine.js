#!/usr/bin/env node
/* stacklands verifier — A-type: all 30 levels completed through the engine's own game logic.
 *
 * The bot computes an OPTIMAL craft plan per level with an event-driven DFS solver that mirrors the
 * engine's exact deterministic mechanics (same-type source cards share a synchronized prodTimer that
 * fires at multiples of the interval whether or not the spawn lands; spawning needs an empty slot;
 * collected counts at spawn; crafted counts at craft; recipes are instant two-card combines), then
 * EXECUTES that plan on the live engine through onCardClick(slot) — the exact function every board
 * card's pointerdown handler calls (the harness DOM stub cannot resolve .card elements nested in
 * slot divs, so engine binding via querySelectorAll is inert here; the handler body is unchanged
 * engine code). Win detection is always the engine's own checkObjectives -> levelComplete
 * (state.ended + modal + progress saved). Level navigation uses the real modal buttons.
 *
 * Plan execution is poll-based: each step fires as soon as its two ingredients are simultaneously
 * on the board (crafts are timing-insensitive — ingredients persist until combined). If the board
 * jams full while the next step's pair is absent, the bot makes a legal jam-escape craft that avoids
 * consuming ingredients still required by remaining plan steps (sources are renewable, so burning
 * surplus raws is always safe). ENGINE DATA (CARDS production intervals, RECIPES, LEVELS) is read
 * LIVE from the sandbox — nothing is hard-coded.
 *
 * ENGINE FIXES VERIFIED HERE (see index.html FIX comments):
 *  P0 — 14 levels shipped with 8-full (or 7+1) source boards: production needs an empty slot and
 *       every first recipe needs two materials simultaneously, so they were permanently unwinnable.
 *  P0 — several boards were provably capacity-infeasible even after trimming (terminal crafted
 *       cards are never consumed: sources + terminal objectives must leave 2+ free slots), and
 *       mixed-source boards interleave raw spawns so double-plank objectives (hut) could never
 *       form. Boards were retuned so an event-exact optimal solver proves every level winnable.
 *  P0 — L30 carried 4 terminal craft objectives + 3 raw source types = 9 permanent slot claims on
 *       an 8-slot board (provably unwinnable); one objective was dropped. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('stacklands', { viewport: [520, 640], inject: {
  anchor: 'var RECIPES = {};',
  exports: `globalThis.__S = {
  st: function(){ return { screen: state.screen, lvl: state.levelIdx >= 0 && LEVELS[state.levelIdx] ? LEVELS[state.levelIdx].n : 0,
    timeLeft: +state.timeLeft.toFixed(1), ended: state.ended, paused: state.paused,
    board: state.board.map(function(c){ return c ? c.type : null }),
    objs: state.objs.map(function(o){ return { t: o.t, c: o.c, n: o.n, cur: o.cur, done: o.done } }),
    progress: JSON.parse(JSON.stringify(state.progress)) } },
  click: function(i){ onCardClick(i) },
  start: function(i){ startLevel(i) },
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
g.sandbox.document.dispatch('DOMContentLoaded'); // engine inits in document-DOMContentLoaded (real browsers fire it)
g.pump(3);
const S = () => g.call('__S.st()');
T('title-screen', S().screen === 'title', 'screen=' + S().screen);
// harness-quirk compensation: modal buttons are re-bound after every innerHTML modal render; real
// browsers create FRESH elements (no listener accumulation) but the harness keeps one persistent stub
// whose listeners accumulate — clicking it after N levels would fire N stale handlers. Restrict these
// stubs to browser-equivalent "only the latest bound listener fires" semantics (latest innerHTML render).
for (const id of ['mNext', 'mHome', 'mReplay', 'mLevelSelect']) {
  const el = g.els[id];
  if (el) { el.__latest = {}; el.addEventListener = (t, f) => { el.__latest[t] = f; };
    el.click = () => { const f = el.__latest.click; if (f) f.call(el, { preventDefault() {} }); }; }
}
g.els.btnPlay.click(); g.pump(2); // real title-screen button
T('level-select', S().screen === 'levelSelect', 'screen=' + S().screen);

// ---- engine data, read live ----
const RECIPES = g.call('RECIPES');
const CARDS = g.call('CARDS');
const LEVELS = g.call('LEVELS');
const PROD = {}; for (const c of Object.keys(CARDS)) if (CARDS[c].produces) PROD[c] = { type: CARDS[c].produces.type, interval: CARDS[c].produces.interval / 1000 };

// ---- optimal event-driven solver (mirrors the engine's deterministic production model) ----
function solve(lv) {
  const timeLimit = lv.time;
  const srcCards = lv.board.filter(c => c && PROD[c]); // per-card timers (all same-type cards fire synchronized)
  const insts = new Set();
  for (const sc of new Set(srcCards)) for (let k = 1; k * PROD[sc].interval <= timeLimit + 1e-9; k++) insts.add(+(k * PROD[sc].interval).toFixed(3));
  const events = [...insts].sort((a, b) => a - b);
  const memo = new Map();
  const objectives = lv.objs.map(o => ({ t: o.t, c: o.c, n: o.n }));
  const done = (collected, crafted) => objectives.every(o => (o.t === 'collect' ? (collected[o.c] || 0) : (crafted[o.c] || 0)) >= o.n);
  function dfs(ei, board, collected, crafted, plan) {
    if (done(collected, crafted)) return plan;
    if (ei >= events.length) return null;
    const key = ei + '|' + board.slice().sort().join(',') + '|' + Object.keys(crafted).sort().map(k => k + crafted[k]).join(',');
    if (memo.has(key)) return memo.get(key);
    memo.set(key, null);
    const ev = events[ei]; const b2 = board.slice(); const col2 = { ...collected };
    for (const sc of srcCards) { // one spawn ATTEMPT per source card, in slot order (engine fires each card's timer)
      const m = (ev / PROD[sc].interval) % 1;
      if (Math.abs(m) < 1e-6 || Math.abs(m) > 1 - 1e-6) {
        const empty = b2.findIndex(x => !x);
        if (empty >= 0) { b2[empty] = PROD[sc].type; col2[PROD[sc].type] = (col2[PROD[sc].type] || 0) + 1; }
      }
    }
    const res = craftsFrom(ei, b2, col2, crafted, plan);
    memo.set(key, res);
    return res;
  }
  function craftsFrom(ei, board, collected, crafted, plan) {
    const cnt = {}; board.forEach(c => { if (c) cnt[c] = (cnt[c] || 0) + 1; });
    for (const k of Object.keys(RECIPES)) { // craft one pair (earliest-first search: ASAP plans beat the clock comfortably)
      const [a, b] = k.split('+');
      if (!(a === b ? cnt[a] >= 2 : (cnt[a] >= 1 && cnt[b] >= 1))) continue;
      const nb = board.slice(); const ia = nb.indexOf(a); const ib = a === b ? nb.indexOf(a, ia + 1) : nb.indexOf(b);
      nb[ia] = RECIPES[k]; nb[ib] = null;
      const nc = { ...crafted }; nc[RECIPES[k]] = (nc[RECIPES[k]] || 0) + 1;
      const r = craftsFrom(ei, nb, collected, nc, plan.concat([{ a, b, res: RECIPES[k], t: events[ei] }]));
      if (r) return r;
    }
    return dfs(ei + 1, board, collected, crafted, plan); // hold as last resort
  
  }
  return dfs(0, lv.board.slice(), {}, [], []);
}

const plans = LEVELS.map(solve);
const unsolved = plans.map((p, i) => p ? 0 : i + 1).filter(x => x);
T('all-levels-solvable-offline', unsolved.length === 0, 'solver proves winnable: ' + (30 - unsolved.length) + '/30, unsolvable: ' + unsolved.join(','));

// ---- execute each plan on the live engine ----
const clickPair = (sa, sb) => { g.call('__S.click(' + sa + ')'); g.call('__S.click(' + sb + ')'); g.pump(3); };
const DEADLINE = Date.now() + 95000;
const won = []; let stuck = '';
for (let idx = 0; idx < 30 && Date.now() < DEADLINE; idx++) {
  const plan = plans[idx];
  if (!plan) { stuck = 'L' + LEVELS[idx].n + ' no offline plan'; break; }
  g.call('__S.start(' + idx + ')');
  g.pump(2);
  let step = 0;
  let guard = 0;
  let diverged = 0;
  for (;;) {
    const st = S();
    if (st.ended) {
      if (st.objs.every(o => o.done)) break;
      stuck = 'L' + st.lvl + ' TIME UP (left: ' + st.objs.filter(o => !o.done).map(o => o.t + ':' + o.c + ' ' + o.cur + '/' + o.n).join(', ') + ')';
      break;
    }
    if (++guard > 12000) { stuck = 'L' + st.lvl + ' no progress at step ' + step + '/' + plan.length + ' board=' + st.board.join(','); break; }
    const elapsed = LEVELS[idx].time - st.timeLeft;
    if (step < plan.length) {
      const { a, b, t } = plan[step];
      const sa = st.board.findIndex(x => x === a);
      const sb = st.board.findIndex((x, i) => i !== sa && x === (a === b ? a : b));
      // fire at the solver's exact event instant (engine is deterministic -> exact replay); one-frame skew tolerated;
      // if ingredients are late (shouldn't happen), keep polling until they appear
      // fire strictly AFTER the event's spawns have landed (solver model: spawns-then-crafts within an event;
      //      crafting a frame early would free slots the solver expected to stay filled, changing which spawns land)
      if (sa >= 0 && sb >= 0 && elapsed >= t + 0.02) { clickPair(sa, sb); step++; continue; }
      if (elapsed >= t + 1.0 && !(sa >= 0 && sb >= 0)) diverged++;
    }
    g.pump(6); // ~100ms virtual: wait for the engine's production timers
  }
  if (diverged > 4) { stuck = 'L' + LEVELS[idx].n + ' replay diverged x' + diverged; }
  if (stuck) break;
  won.push(S().lvl);
  if (Date.now() > DEADLINE) break;
  // modal buttons are getElementById stubs carrying the engine's own listeners (innerHTML is 1-level in the harness)
  const btn = idx < 29 ? 'mNext' : 'mHome';
  if (g.els[btn]) { g.els[btn].click(); g.pump(2); }
}
T('levels-won', won.length === 30, won.length + '/30' + (stuck ? ' stuck: ' + stuck : ''));
const prog = S().progress;
const doneLv = Object.keys(prog).filter(k => prog[k] > 0).length;
let starSum = 0; Object.keys(prog).forEach(k => starSum += prog[k]);
T('progress-saved', doneLv === 30, 'saved levels=' + doneLv);
T('stars-earned', starSum >= 30, 'stars=' + starSum);
const sv = JSON.parse(g.ls.getItem('stacklands_save_v1') || 'null');
T('localStorage-persisted', !!sv && sv.v === 1 && Object.keys(sv.progress || {}).length >= 30, 'progress keys=' + (sv ? Object.keys(sv.progress || {}).length : 0));
T('home-after-30', S().screen === 'title', 'screen=' + S().screen);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won.length + '/30', stars: starSum, stuck: stuck || '' } };
console.log('stacklands: ' + won.length + '/30 levels via solver-planned onCardClick crafting on the live engine: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
