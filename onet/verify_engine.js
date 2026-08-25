#!/usr/bin/env node
/* onet verifier — 30 seeded link-pair levels (type A).
 * Every match goes through the REAL input path: canvas pointerdown ->
 * handlePointer -> getTileAt -> handleTileClick -> the engine's own canConnect
 * (0/1/2-bend path) -> its real match timers (650ms path + 350ms remove) ->
 * engine isLevelComplete -> showResult -> the real NEXT LEVEL button chains all
 * 30 levels. Hint / Undo / Shuffle via their real hud button handlers. The bot
 * picks pairs with the engine's OWN findHint (move selection only — placement
 * is always two real canvas taps). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('onet', { inject: {
  anchor: 'function handleTileClick(r,c){',
  exports: `globalThis.__OT = {
    g: () => G.grid.map(r => r.slice()), cols: () => G.cols, rows: () => G.rows,
    lvl: () => G.level, n: () => LEVELS.length, state: () => G.gameState,
    screen: () => currentScreen, sel: () => G.selected, hp: () => G.hintPair,
    hints: () => G.hints, shuffles: () => G.shuffles, score: () => G.score,
    hint: () => findHint(G.grid, G.cols, G.rows),
    pos: (r, c) => { const p = tilePos(r, c); return [p.OX + TILE_PX / 2, p.OY + TILE_PX / 2]; },
    nextVisible: () => document.getElementById('btn-next').style.display !== 'none',
    unlocked: () => getUnlocked(),
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30', call('__OT.n()') === 30, 'n=' + call('__OT.n()'));

// big viewport so every tile row sits below the 90px HUD guard in handlePointer
g.sandbox.innerWidth = 1200; g.sandbox.innerHeight = 1600;
call('resize()');

function tap(r, c) {
  const [x, y] = call('__OT.pos(' + r + ',' + c + ')');
  g.els['c'].dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
}
function playLevel(deadlineMs) { // returns 'complete' | reason string
  const t0 = Date.now();
  for (let guard = 0; guard < 400; guard++) {
    if (call('__OT.state()') === 'complete') return 'complete';
    if (call('__OT.state()') !== 'playing') return 'state=' + call('__OT.state()');
    const h = call('__OT.hint()');
    if (!h) { // dead board: engine already auto-shuffled once after the last
      // match; fall back to the real Shuffle button, then give up honestly
      if (call('__OT.shuffles()') > 0) { g.els['hud-shuffle'].click(); g.pump(3); continue; }
      return 'no-valid-move';
    }
    tap(h.r1, h.c1); tap(h.r2, h.c2);
    g.pump(68); // 650ms path anim + 350ms remove anim (engine's own timers)
    if (Date.now() - t0 > deadlineMs) return 'budget';
  }
  return 'guard';
}

// title -> level select (real PLAY button)
g.els['btn-play'].click(); g.pump(2);
T('level-select-renders', call('__OT.screen()') === 'screen-levels' &&
  call('document.querySelectorAll(".level-btn").length') === 30,
  'screen=' + call('__OT.screen()') + ' btns=' + call('document.querySelectorAll(".level-btn").length'));
call('document.querySelectorAll(".level-btn")[5].click()'); g.pump(2);
T('locked-level-blocked', call('__OT.state()') === null, 'state=' + call('__OT.state()'));
call('document.querySelectorAll(".level-btn")[0].click()'); g.pump(3);
T('start-l1', call('__OT.state()') === 'playing' && call('__OT.lvl()') === 0 &&
  call('__OT.g()').length === 5 && call('__OT.g()[0]').length === 6,
  'state=' + call('__OT.state()') + ' lvl=' + call('__OT.lvl()'));

// real tap selects a tile; tapping it again deselects (engine's own toggle)
const grid0 = call('__OT.g()');
let t0 = null;
for (let r = 0; r < 5 && !t0; r++) for (let c = 0; c < 6; c++) if (grid0[r][c] !== -1) { t0 = [r, c]; break; }
tap(t0[0], t0[1]);
T('real-tap-selects', !!call('__OT.sel()'), 'selected=null');
tap(t0[0], t0[1]);
T('tap-again-deselects', call('__OT.sel()') === null, 'still selected');

// genuine mismatch: select A, tap different-type B -> canConnect fails,
// selection moves to B, no tile is removed
let mm = null;
outer2:
for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
  for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 6; c2++) {
    if (grid0[r][c] !== -1 && grid0[r2][c2] !== -1 && grid0[r][c] !== grid0[r2][c2]) { mm = [[r, c], [r2, c2]]; break outer2; }
  }
}
tap(mm[0][0], mm[0][1]); tap(mm[1][0], mm[1][1]); g.pump(2);
T('mismatch-rejected', JSON.stringify(call('__OT.sel()')) === JSON.stringify({ r: mm[1][0], c: mm[1][1] }) &&
  JSON.stringify(call('__OT.g()')) === JSON.stringify(grid0), 'sel=' + JSON.stringify(call('__OT.sel()')));
tap(mm[1][0], mm[1][1]); // deselect before the scored match

// one real match, then hint + undo mechanics
const h1 = call('__OT.hint()');
tap(h1.r1, h1.c1); tap(h1.r2, h1.c2); g.pump(68);
const g1 = call('__OT.g()');
const score1 = call('__OT.score()');
T('match-removes-pair', g1[h1.r1][h1.c1] === -1 && g1[h1.r2][h1.c2] === -1 && score1 > 0,
  'score=' + score1);
g.els['hud-hint'].click(); g.pump(1);
T('hint-finds-pair', !!call('__OT.hp()') && call('__OT.hints()') === 2,
  'hints=' + call('__OT.hints()'));
tap(call('__OT.hp().r1'), call('__OT.hp().c1')); g.pump(1); // clear selection
g.els['hud-undo'].click(); g.pump(2);
T('undo-restores-pair', call('__OT.g()[' + h1.r1 + '][' + h1.c1 + ']') !== -1 && call('__OT.score()') < score1,
  'tile=' + call('__OT.g()[' + h1.r1 + '][' + h1.c1 + ']') + ' score=' + call('__OT.score()'));

// finish level 1, then chain all 30 via the real NEXT button
const chainT0 = Date.now();
const done = []; const stuck = [];
for (let lvl = 0; lvl < 30; lvl++) {
  const res = playLevel(20000);
  if (res !== 'complete') { stuck.push((lvl + 1) + '(' + res + ')'); break; }
  done.push(lvl + 1);
  if (lvl < 29) {
    if (call('__OT.state()') !== 'complete' || !call('__OT.nextVisible()')) { stuck.push((lvl + 1) + '(no-next)'); break; }
    g.els['btn-next'].click(); g.pump(4); // real NEXT LEVEL button
    if (call('__OT.lvl()') !== lvl + 1 || call('__OT.state()') !== 'playing') { stuck.push((lvl + 2) + '(chain)'); break; }
  }
}
T('levels-complete', done.length === 30, done.length + '/30 stuck=[' + stuck.join(',') + ']');
const sv = JSON.parse(g.ls.getItem('onet_save') || '{}');
T('save-unlocked-30', (sv.unlocked || 0) >= 30 && Object.keys(sv.stars || {}).length >= 30,
  'unlocked=' + sv.unlocked + ' stars=' + Object.keys(sv.stars || {}).length);
T('result-screen-l30', call('__OT.screen()') === 'screen-result' && call('__OT.state()') === 'complete',
  'screen=' + call('__OT.screen()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: done.length + '/30', stuck: stuck.join(','), secs: Math.round((Date.now() - chainT0) / 1000) } };
console.log('onet: ' + done.length + '/30 levels via real taps -> engine canConnect/complete: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
