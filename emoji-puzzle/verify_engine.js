#!/usr/bin/env node
/* emoji-puzzle verifier (type A): all 30 levels must be completed through the real input path —
 * canvas pointerdown taps (tap a left slot to select, tap the matching right slot to connect;
 * one level also solved via the drag path down->move->up). Correct/incorrect matching, win,
 * stars and progress all fire from the engine's own tryConnect/onLevelComplete. The bot plans
 * with the engine's own state (leftItems[i].idx === rightItems[j].idx is the engine's match
 * rule). Also exercises: wrong pair (no connect, error flash), undo (un-connects + recounts),
 * hint (hintsUsed -> 2-star win, best keeps prior 3), real level-grid card clicks, and save
 * persistence. Menu buttons (Play/Next/Hint/...) are inline-onclick elements without ids, so
 * flow calls the same global functions those handlers call. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('emoji-puzzle', {
  inject: {
    anchor: 'function tryConnect(leftIdx,rightIdx){',
    exports: `globalThis.__R = {
      lv: () => state.level, n: () => LV.length,
      left: () => state.leftItems.map(function(i){ return { idx: i.idx, conn: !!i.connected }; }),
      right: () => state.rightItems.map(function(i){ return { idx: i.idx, conn: !!i.connected }; }),
      lpos: () => state.leftPos.map(function(p){ return { x: p.x, y: p.y }; }),
      rpos: () => state.rightPos.map(function(p){ return { x: p.x, y: p.y }; }),
      matched: () => state.matched, conns: () => state.connections.length,
      completed: () => state.completed, sel: () => state.selected,
      hintsUsed: () => state.hintsUsed, hintsLeft: () => state.hintsLeft,
      stars: function (i) { return state.stars[i] || 0; }, maxLv: () => state.maxLevel,
      canvas: () => canvas,
      ls: () => { try { return localStorage.getItem('emojiPuzzle'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
// the harness fires only window-level DOMContentLoaded listeners; this engine registers init on
// the DOCUMENT (as a real browser also supports) — dispatch it, exactly what a browser does
g.call("document.dispatch('DOMContentLoaded', {})");

const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

const cv = g.call('__R.canvas()');
// exact inverse of the engine's getPointerPos: scale = canvas.width/rect.width (same scale for x and y)
const rect = () => cv.getBoundingClientRect();
const scl = () => cv.width / rect().width;
const pev = (type, gx, gy) => cv.dispatch(type, {
  clientX: rect().left + gx / scl(), clientY: rect().top + gy / scl(),
  pointerId: 5, button: 0, isPrimary: true, preventDefault() {},
});
const tapL = (i) => { const p = g.call(`__R.lpos()`)[i]; pev('pointerdown', p.x, p.y); pev('pointerup', p.x, p.y); };
const tapR = (j) => { const p = g.call(`__R.rpos()`)[j]; pev('pointerdown', p.x, p.y); pev('pointerup', p.x, p.y); };

// --- title -> level select (Play button's own handler) -> real card click starts level 1 ---
T('title-visible', g.els['title-screen'].style.display === 'block', 'disp=' + g.els['title-screen'].style.display);
g.call('showLevelSelect()');
const grid = g.els['level-grid'];
T('grid-rendered', grid.children.length === 35, 'children=' + grid.children.length); // 5 tier labels + 30 buttons
const btns = () => Array.from(grid.children).filter(c => String(c.className).indexOf('level-btn') >= 0);
btns()[0].click();
T('card1-starts-L1', g.call('__R.lv()') === 0 && g.els['game-screen'].style.display === 'block', 'lv=' + g.call('__R.lv()'));

// --- wrong pair: select left 0, tap a right with a different idx -> no connection, no match ---
{
  const li0 = g.call('__R.left()')[0].idx;
  const wrong = g.call('__R.right()').findIndex(r => r.idx !== li0);
  tapL(0); tapR(wrong);
  T('wrong-pair-no-connect', g.call('__R.matched()') === 0 && g.call('__R.conns()') === 0,
    'matched=' + g.call('__R.matched()') + ' conns=' + g.call('__R.conns()'));
  g.pump(3); // let the error-flash interval run a tick
}

// --- correct pair then undo: connection made, then removed and matched recounted ---
function rightFor(li) { return g.call('__R.right()').findIndex(r => r.idx === g.call('__R.left()')[li].idx && !r.conn); }
function connectPair(li) { tapL(li); tapR(rightFor(li)); }
connectPair(0);
T('connect-works', g.call('__R.matched()') === 1 && g.call('__R.left()')[0].conn === true, 'matched=' + g.call('__R.matched()'));
g.call('undoConn()'); // the Undo button's own handler
T('undo-removes', g.call('__R.matched()') === 0 && g.call('__R.left()')[0].conn === false, 'matched=' + g.call('__R.matched()'));

// --- solve level 1 via the DRAG path (down on left, move to right, up) ---
{
  const lp = g.call('__R.lpos()')[0], rp = g.call('__R.rpos()')[rightFor(0)];
  pev('pointerdown', lp.x, lp.y);
  pev('pointermove', (lp.x + rp.x) / 2, (lp.y + rp.y) / 2);
  pev('pointermove', rp.x, rp.y);
  pev('pointerup', rp.x, rp.y);
  T('drag-connect-works', g.call('__R.matched()') === 1, 'matched=' + g.call('__R.matched()'));
}

function solveLevel() { // tap-tap path for the remaining pairs
  let guard = 0;
  while (!g.call('__R.completed()') && guard++ < 12) {
    const li = g.call('__R.left()').findIndex(i => !i.conn);
    if (li < 0) break;
    connectPair(li);
  }
  return g.call('__R.completed()') ? true : 'matched=' + g.call('__R.matched()') + '/' + g.call('__R.left()').length;
}

const solved = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < 30 && Date.now() - T0 < 95000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  const res = solveLevel();
  if (res !== true) { notes.push('L' + (li + 1) + ' ' + res); fails.push('L' + (li + 1) + ' not completed (' + res + ')'); break; }
  T('L' + (li + 1) + '-3stars', g.call(`__R.stars(${li})`) === 3, 'stars=' + g.call(`__R.stars(${li})`));
  solved.push(li + 1);
  g.pump(42); // win modal shows after the engine's own 600ms timeout
  if (g.els['win-modal'].style.display !== 'flex') { T('L' + (li + 1) + '-modal', false, 'modal=' + g.els['win-modal'].style.display); break; }
  if (li < 29) g.call('nextLevel()'); // the win modal Next button's own handler
}
T('all-30-solved', solved.length === 30, 'solved=' + solved.length + '/30 ' + notes.slice(0, 4).join('|'));
T('all-unlocked', g.call('__R.maxLv()') === 30, 'maxLevel=' + g.call('__R.maxLv()'));

// --- level select after the chain: all 30 unlocked; real card click starts level 6 ---
g.call('showLevelSelect()');
T('no-locked-cards', btns().every(b => String(b.className).indexOf('locked') < 0), 'locked remain');
btns()[5].click();
T('card6-starts-L6', g.call('__R.lv()') === 5, 'lv=' + g.call('__R.lv()'));

// --- hint on the L6 replay: hintsUsed 1 -> 2-star win, but best stars stay 3 (max semantics) ---
g.call('useHint()'); // the Hint button's own handler
T('hint-used', g.call('__R.hintsUsed()') === 1 && g.call('__R.hintsLeft()') === 2 && String(g.els['hint-display'].textContent).length > 0,
  'used=' + g.call('__R.hintsUsed()') + ' left=' + g.call('__R.hintsLeft()'));
const res6 = solveLevel();
g.pump(42);
T('hint-win-keeps-best', res6 === true && g.call('__R.stars(5)') === 3, 'stars6=' + g.call('__R.stars(5)'));

// --- persistence ---
T('save-persisted', (() => {
  const d = JSON.parse(g.call('__R.ls()') || '{}');
  return d.maxLevel === 30 && Object.keys(d.stars || {}).length === 30;
})(), 'ls=' + String(g.call('__R.ls()')).slice(0, 90));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/30', notes: notes.slice(0, 6) } };
console.log('emoji-puzzle: ' + solved.length + '/30 levels completed via real taps/drags: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
