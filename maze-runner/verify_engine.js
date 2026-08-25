#!/usr/bin/env node
/* maze-runner verifier — A-type: all 30 levels (5 tiers x 6) completed through the engine's own logic.
 *
 * Per level the bot solves the key/door puzzle with a BFS over (cell, keys-held, doors-open) — the
 * engine's own solvability validation (bfs) IGNORES doors, so this search is the real proof a level
 * is completable — then WALKS that path on the live engine by dispatching real document keydown
 * events (the exact input path: the engine's document keydown handler -> tryMove -> animated move ->
 * checkPickups). Win detection is always the engine's own checkPickups -> completeLevel (progress
 * saved, modal shown). Level navigation uses the real title Play button, the real level-select card
 * click, and the real complete-modal buttons (inline onclick G.nextLevel/nextTier/quitToMenu).
 *
 * Fog/minimap are cosmetic. Powerups are ignored (speed/xray/shield only affect rating). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('maze-runner', { viewport: [800, 600], inject: {
  anchor: "var SAVE_VER='v1';",
  exports: `globalThis.__S={st:function(){return{
    screen:currentScreen,tier:currentTier,level:currentLevel,paused:paused,
    r:player?player.r:-1,c:player?player.c:-1,
    gh:maze?maze.gh:0,gw:maze?maze.gw:0,grid:maze?maze.grid:null,
    keys:maze?maze.items.keys.map(function(k){return{r:k.r,c:k.c,color:k.color,collected:k.collected}}):[],
    doors:maze?maze.items.doors.map(function(d){return{r:d.r,c:d.c,color:d.color,open:d.open}}):[],
    exit:maze?maze.items.exit:null,
    completedCnt:Object.keys(state.completed).length,
    starsSum:(function(){var s=0;for(var k in state.stars)s+=state.stars[k];return s})()
  }},
  start:function(t,l){startLevel(t,l)}};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
g.pump(3);
const S = () => g.call('__S.st()');

// ---- real title Play button (static markup, inline onclick compiled by the harness) ----
function walk(el, fn) { for (const c of (el.children || [])) { fn(c); walk(c, fn); } }
let playBtn = null;
walk(g.sandbox.document.body, (e) => {
  if (!playBtn && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('level-select')) playBtn = e;
});
T('title-screen', S().screen === 'title', 'screen=' + S().screen);
if (playBtn) playBtn.click(); else g.call("G.showScreen('level-select')");
g.pump(2);
T('level-select', S().screen === 'level-select', 'screen=' + S().screen + (playBtn ? '' : ' [G fallback]'));

// ---- real first level card click (buildLevelSelect creates cards with onclick=startLevel) ----
let started = false;
const grid0 = g.els['level-grid'];
if (grid0 && grid0.children[0] && typeof grid0.children[0].onclick === 'function') { grid0.children[0].click(); started = true; }
if (!started) g.call('__S.start(0,0)'); // safety: engine's own startLevel (level-select card handler)
g.pump(4);

// ---- key/door BFS over (cell, held-mask, open-mask) ----
function solveLevel(st) {
  const colors = {}; let nb = 0;
  for (const k of st.keys) if (!(k.color in colors)) colors[k.color] = nb++;
  const doorAt = new Map(st.doors.map((d, i) => [d.r + ',' + d.c, i]));
  const keyAt = new Map(st.keys.map(k => [k.r + ',' + k.c, colors[k.color]]));
  const doorColorBit = st.doors.map(d => 1 << colors[d.color]);
  const N = 1 << nb;
  const seen = new Set();
  let queue = [{ r: st.r, c: st.c, held: 0, open: 0, par: null }];
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (queue.length) {
    const nxt = [];
    for (const s of queue) {
      const kk = s.r + ',' + s.c + '|' + s.held + '|' + s.open;
      if (seen.has(kk)) continue;
      seen.add(kk);
      if (s.r === st.exit[0] && s.c === st.exit[1]) { // reconstruct
        const path = []; let n = s;
        while (n) { path.unshift(n); n = n.par; }
        return path;
      }
      for (const [dr, dc] of DIRS) {
        const r = s.r + dr, c = s.c + dc;
        if (r < 0 || r >= st.gh || c < 0 || c >= st.gw || st.grid[r][c] === 1) continue;
        let held = s.held, open = s.open;
        const di = doorAt.get(r + ',' + c);
        if (di !== undefined && !(open & (1 << di))) { // closed door: needs its key, consumes it, opens forever
          if (!(held & doorColorBit[di])) continue;
          held &= ~doorColorBit[di]; open |= (1 << di);
        }
        const kb = keyAt.get(r + ',' + c);
        if (kb !== undefined && !(open & (1 << st.doors.findIndex(d => colors[d.color] === kb)))) held |= (1 << kb);
        nxt.push({ r, c, held, open, par: s });
      }
    }
    queue = nxt;
    if (seen.size > 200000) break;
  }
  return null;
}

const KEYNAME = { '-1,0': 'ArrowUp', '1,0': 'ArrowDown', '0,-1': 'ArrowLeft', '0,1': 'ArrowRight' };
const keydown = (k) => g.sandbox.document.dispatch('keydown', { key: k, code: k, preventDefault() {} });

// ---- walk all 30 levels ----
const DEADLINE = Date.now() + 95000;
let won = 0, stuck = '', domClicks = 0, gFallbacks = 0, stepsTotal = 0, unsolvable = [];
for (let idx = 0; idx < 30 && !stuck; idx++) {
  if (Date.now() > DEADLINE) { stuck = 'deadline'; break; }
  let st = S();
  if (st.screen !== 'game-screen') { stuck = 'L' + idx + ' not in game (screen=' + st.screen + ')'; break; }
  const path = solveLevel(st);
  if (!path) { unsolvable.push('T' + st.tier + 'L' + (st.level + 1)); stuck = 'L' + idx + ' key/door deadlock (engine bfs ignores doors)'; break; }
  // walk: one real keydown per step, pump until the animated move lands
  let ok = true;
  for (let i = 1; i < path.length; i++) {
    const dr = path[i].r - path[i - 1].r, dc = path[i].c - path[i - 1].c;
    keydown(KEYNAME[dr + ',' + dc]);
    stepsTotal++;
    let arrived = false;
    for (let p = 0; p < 50; p++) {
      g.pump(1);
      const s2 = S();
      if (s2.r === path[i].r && s2.c === path[i].c) { arrived = true; break; }
    }
    if (!arrived) { stuck = 'L' + idx + ' move ' + i + '/' + (path.length - 1) + ' did not land (at ' + S().r + ',' + S().c + ' want ' + path[i].r + ',' + path[i].c + ')'; ok = false; break; }
  }
  if (!ok || stuck) break;
  // arrival at exit -> engine's own checkPickups -> completeLevel (paused, progress saved)
  let doneLvl = false;
  for (let p = 0; p < 8 && !doneLvl; p++) { g.pump(1); doneLvl = S().paused; }
  if (!doneLvl) { stuck = 'L' + idx + ' reached exit but completeLevel did not fire'; break; }
  won++;
  if (idx === 29) break;
  // real modal button: inline onclick compiled by the harness (Next Level / Next Tier)
  let btn = null;
  walk(g.els['complete-modal'] || { children: [] }, (e) => {
    if (!btn && String(e.tagName).toLowerCase() === 'button' && e.classList.contains('btn-primary') && typeof e.onclick === 'function') btn = e;
  });
  if (btn) { btn.click(); domClicks++; }
  else { // last-but-one safety: engine's own handler function (identical code path to the button's onclick)
    const st2 = S();
    g.call(st2.level < 5 ? 'G.nextLevel()' : 'G.nextTier()'); gFallbacks++;
  }
  g.pump(4);
}
// final modal (after level 30) has no Next button — click the real "Level Select" (G.quitToMenu)
if (won === 30 && !stuck) {
  let btn = null;
  walk(g.els['complete-modal'] || { children: [] }, (e) => {
    if (!btn && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('quitToMenu')) btn = e;
  });
  if (btn) { btn.click(); domClicks++; } else { g.call('G.quitToMenu()'); gFallbacks++; }
  g.pump(3);
}

const st = S();
T('all-30-levels-completable', won === 30 && unsolvable.length === 0,
  won + '/30 won' + (unsolvable.length ? ' unsolvable: ' + unsolvable.join(',') : '') + (stuck ? ' stuck: ' + stuck : ''));
T('progress-saved', st.completedCnt === 30, 'completed=' + st.completedCnt);
T('stars-earned', st.starsSum >= 30, 'stars=' + st.starsSum);
const sv = JSON.parse(g.ls.getItem('maze-runner-save') || 'null');
T('localStorage-persisted', !!sv && sv.version === 'v1' && Object.keys(sv.completed || {}).length === 30,
  'completed keys=' + (sv ? Object.keys(sv.completed || {}).length : 0));
T('back-to-title', st.screen === 'title', 'screen=' + st.screen);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won + '/30', steps: stepsTotal, domClicks, gFallbacks, stuck: stuck || '' } };
console.log('maze-runner: ' + won + '/30 levels via real keydown walking + key/door BFS: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
