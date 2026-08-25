#!/usr/bin/env node
/* unpacking verifier (type A): all 30 levels across 5 chapters must be completed through the
 * real input path — pointer drags from the box onto the room grid; each placement is validated
 * by the engine's own onUp target/type check, and the win fires from the engine's own
 * winLevel (placed.length === lv.items.length). Also exercises: wrong-type drop (error count,
 * red flash, item stays in box), drop on an empty cell (no error), 3-star best keeping after a
 * 1-error replay, chapter unlock progression, level-select gating, and save persistence.
 * Menu/modals: the game builds its canvas and modals at runtime; the harness cannot reach those
 * dynamically created buttons, so level flow uses the public window._up API — the exact
 * functions the modal buttons' inline onclick handlers call. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('unpacking', {
  viewport: [540, 760],
  inject: {
    anchor: 'function onDown(e){',
    exports: `globalThis.__R = {
      st: () => st, lv: () => curLv, n: () => LV.length,
      placedN: () => placed.length, boxN: () => boxItems.filter(function(b){return !b.placed}).length,
      err: () => errors, unlocked: () => unlocked,
      best: (i) => best['l' + i] || 0,
      lay: () => lay(),
      cvs: () => cvs, W: () => W, H: () => H,
      play: () => cvs._play || null,
      // mirror of the engine's own box layout math (renderGame/onDown) for item id
      boxPos: function (id) {
        var L = lay();
        var un = boxItems.filter(function (b) { return !b.placed; });
        var ipr = Math.min(un.length, 8);
        var sp = L.boxW / (ipr + 1);
        var sx = L.boxX + sp;
        for (var i = 0; i < un.length; i++) if (un[i].id === id) return { x: sx + i * sp, y: L.boxY + L.boxH / 2 };
        return null;
      },
      targets: () => LV[curLv].items.map(function(it){ return { t: it.t, r: it.r, c: it.c }; }),
      ls: () => { try { return localStorage.getItem('up1'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

const cvs = g.call('__R.cvs()'); // dynamically created canvas (host stub object)
// resize() sets style.width/height, so the live rect defines the client<->game mapping
const rect = () => cvs.getBoundingClientRect();
const W = () => g.call('__R.W()'), H = () => g.call('__R.H()');
const cx = x => x * rect().width / W(), cy = y => y * rect().height / H();
const pev = (type, x, y) => cvs.dispatch(type, { clientX: cx(x), clientY: cy(y), pointerId: 3, button: 0, isPrimary: true, preventDefault() {} });

// drag box item `id` to grid cell (r,c) — real pointer gesture (down on the item, move, up on the cell)
function dragTo(id, r, c) {
  const p = g.call(`__R.boxPos(${id})`);
  if (!p) return false;
  const L = g.call('__R.lay()');
  const tx = L.gridX + c * L.cellS + L.cellS / 2, ty = L.gridY + r * L.cellS + L.cellS / 2;
  pev('pointerdown', p.x, p.y);
  pev('pointermove', (p.x + tx) / 2, (p.y + ty) / 2);
  pev('pointermove', tx, ty);
  pev('pointerup', tx, ty);
  return true;
}

// --- menu: tap the PLAY button (real canvas pointerdown while st === 'menu') ---
const pb = g.call('__R.play()');
pev('pointerdown', pb.x + pb.w / 2, pb.y + pb.h / 2);
T('level-1-starts', g.call('__R.st()') === 'playing' && g.call('__R.lv()') === 0, 'st=' + g.call('__R.st()'));

// --- wrong-type drop: box item 0 (t1) onto cell (0,2) which expects t3 -> error, item stays ---
dragTo(0, 0, 2);
T('wrong-drop-errors', g.call('__R.err()') === 1 && g.call('__R.placedN()') === 0, 'err=' + g.call('__R.err()'));
// --- drop on an empty cell (0,1 has no target) -> item returns, no error counted ---
dragTo(0, 0, 1);
T('empty-drop-no-error', g.call('__R.err()') === 1 && g.call('__R.placedN()') === 0, 'err=' + g.call('__R.err()'));

function solveLevel() {
  let guard = 0;
  while (g.call('__R.placedN()') < g.call('__R.targets()').length && guard++ < 40) {
    const tg = g.call('__R.targets()');
    const done = [];
    // place in level-data order: item i belongs at (targets[i].r, targets[i].c)
    for (let i = 0; i < tg.length; i++) if (!dragTo(i, tg[i].r, tg[i].c)) return 'grab-fail-' + i;
  }
  g.pump(55); // 400ms winLevel + 400ms showWin timeouts
  return g.call('__R.st()') === 'win' ? true : 'st=' + g.call('__R.st()') + ' placed=' + g.call('__R.placedN()');
}

const solved = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < 30 && Date.now() - T0 < 95000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  const res = solveLevel();
  if (res !== true) { notes.push('L' + (li + 1) + ' ' + res); fails.push('L' + (li + 1) + ' not won (' + res + ')'); break; }
  const expStars = li === 0 ? 2 : 3; // L1 carries the 1 test error -> 2 stars
  T('L' + (li + 1) + '-stars', g.call(`__R.best(${li})`) === expStars, 'best=' + g.call(`__R.best(${li})`));
  solved.push(li + 1);
  if (li < 29) g.call('window._up.next()'); // same function the win modal's Next button calls
}
T('all-30-solved', solved.length === 30, 'solved=' + solved.length + '/30 ' + notes.slice(0, 4).join('|'));
T('all-unlocked', g.call('__R.unlocked()') === 30, 'unlocked=' + g.call('__R.unlocked()'));

// --- replay L1 flawlessly: best must KEEP the 3 stars (max semantics) ---
g.call('window._up.goto(0)');
T('replay-restarts', g.call('__R.st()') === 'playing' && g.call('__R.lv()') === 0 && g.call('__R.err()') === 0, 'replay');
const replayRes = solveLevel();
T('replay-3stars', replayRes === true && g.call('__R.best(0)') === 3, 'best0=' + g.call('__R.best(0)'));

// --- menu + persistence ---
g.call('window._up.menu()');
T('menu-returns', g.call('__R.st()') === 'menu', 'st=' + g.call('__R.st()'));
T('save-persisted', (() => { const ls = g.call('__R.ls()'); const d = JSON.parse(ls || '{}'); return d.u === 30 && Object.keys(d.b || {}).length === 30; })(), 'ls=' + String(g.call('__R.ls()')).slice(0, 80));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/30', notes: notes.slice(0, 6) } };
console.log('unpacking: ' + solved.length + '/30 levels solved via real item drags: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
