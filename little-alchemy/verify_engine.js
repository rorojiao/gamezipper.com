#!/usr/bin/env node
/* little-alchemy verifier (type A): ALL 128 elements must be discoverable from the 4 base
 * elements through the real input path — panel-card pointer drags place items on the
 * workspace, canvas pointer drags combine them; discovery fires from the engine's own
 * checkCombineOnDrop -> discovered.add -> save/renderPanel. Planning = offline BFS over the
 * engine's own RECIPES. Also exercises: search filter, no-match drop, double-tap remove,
 * hint (places a valid pair), the reset overlay (cancel + confirm), and save persistence.
 * NOTE: the harness stub's document.removeEventListener is a no-op, so after every gesture
 * the accumulated pointermove/pointerup listeners are cleared — exactly what the engine's
 * own onUp does in a real browser via removeEventListener. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('little-alchemy', {
  inject: {
    anchor: 'function checkCombineOnDrop(item){',
    exports: `globalThis.__R = {
      disc: () => Array.from(discovered), total: () => Object.keys(ELEMENTS).length,
      base: () => BASE_ELEMENTS.slice(),
      items: () => workspaceItems.map(i => ({ id: i.id, elem: i.elem, x: i.x, y: i.y })),
      recipes: () => RECIPES.map(r => r.slice()),
      hint: () => hintPair,
      ls: () => { try { return localStorage.getItem("little-alchemy-save-v1"); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const disc = () => new Set(g.call('__R.disc()'));
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('start-4-base', disc().size === 4, 'disc=' + disc().size);
const TOTAL = g.call('__R.total()');
T('total-elements', TOTAL === 128, 'total=' + TOTAL);

const cv = g.els['workspace-canvas'];
const grid = g.els['element-grid'];
const docEv = (type, x, y) => g.call(`document.dispatch(${JSON.stringify(type)}, {clientX: ${x}, clientY: ${y}, preventDefault: function(){}})`);
const clearDragLsn = () => g.call('if (document.__dls) { delete document.__dls.pointermove; delete document.__dls.pointerup; }');

// place element `e` from the panel onto the workspace at (x,y) — real panel pointerdown/move/up
function placeFromPanel(e, x, y) {
  const card = (grid.children || []).find(c => c.dataset && c.dataset.elem === e);
  if (!card) return false;
  card.dispatch('pointerdown', { clientX: 600, clientY: 300, currentTarget: card, preventDefault() {} });
  docEv('pointermove', x, y);
  docEv('pointerup', x, y);
  clearDragLsn();
  return true;
}
// drag the workspace item at (fx,fy) onto (tx,ty) — real canvas pointerdown + document move/up
function dragItem(fx, fy, tx, ty) {
  cv.dispatch('pointerdown', { clientX: fx, clientY: fy, preventDefault() {} });
  docEv('pointermove', tx, ty);
  docEv('pointerup', tx, ty);
  clearDragLsn();
}
function clearWorkspace() { g.els['btn-clear'].click(); }

// --- search filter ---
const cards4 = grid.children.length;
const searchEv = () => { const t = g.els['search-input']; return { target: t, currentTarget: t }; };
g.els['search-input'].value = 'wat';
g.els['search-input'].dispatch('input', searchEv());
const cards1 = grid.children.length;
g.els['search-input'].value = '';
g.els['search-input'].dispatch('input', searchEv());
T('search-filters', cards4 === 4 && cards1 === 1 && grid.children.length === 4, `4->${cards4}->${cards1}->${grid.children.length}`);

// --- first discovery: water + fire -> steam, popup shows ---
placeFromPanel('water', 120, 160);
placeFromPanel('fire', 220, 160);
dragItem(120, 160, 220, 160);
T('steam-discovered', disc().has('steam'), 'disc=' + disc().size);
T('discovery-popup', g.els['discovery-popup'].classList.contains('show'), 'popup');

// --- no-match drop: water + steam have no recipe -> both items remain ---
clearWorkspace();
placeFromPanel('water', 120, 160);
placeFromPanel('steam', 220, 160);
const d5 = disc().size;
dragItem(120, 160, 220, 160);
T('no-match-keeps-items', g.call('__R.items()').length === 2 && disc().size === d5,
  'items=' + g.call('__R.items()').length + ' disc=' + disc().size);

// --- double-tap removes an item (engine feature; items now overlap at the drop point).
// Each tap is a REAL down+up pair — a bare second pointerdown would leave the first tap's
// drag open, which never happens with real input. ---
const tap = (x, y) => { cv.dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} }); docEv('pointerup', x, y); clearDragLsn(); };
tap(220, 160); tap(220, 160);
T('double-tap-removes', g.call('__R.items()').length === 1, 'items=' + g.call('__R.items()').length);

// --- hint places a valid pair and sets hintPair ---
clearWorkspace();
g.els['btn-hint'].click();
T('hint-pair', !!g.call('__R.hint()') && g.call('__R.items()').length >= 2,
  'hint=' + JSON.stringify(g.call('__R.hint()')) + ' items=' + g.call('__R.items()').length);

// --- reset overlay: cancel keeps progress, confirm returns to the 4 base elements ---
g.els['btn-reset'].click();
T('reset-overlay-shows', !g.els['reset-overlay'].classList.contains('hidden'), 'overlay');
g.els['btn-reset-cancel'].click();
T('reset-cancel', g.els['reset-overlay'].classList.contains('hidden') && disc().size === d5, 'cancel');
g.els['btn-reset'].click();
g.els['btn-reset-confirm'].click();
const baseSet = new Set(g.call('__R.base()'));
T('reset-confirm', disc().size === 4 && [...disc()].every(e => baseSet.has(e)), 'disc=' + disc().size);

// --- full completion: BFS over the engine's own recipes, every step a real drag ---
const discovered = [], notes = [];
let guard = 0;
while (disc().size < TOTAL && guard++ < 300) {
  const d = disc();
  const recs = g.call('__R.recipes()');
  const next = recs.find(r => d.has(r[0]) && d.has(r[1]) && !d.has(r[2]));
  if (!next) { notes.push('stuck at ' + d.size + '/' + TOTAL); fails.push('stuck at ' + d.size + '/' + TOTAL + ' no executable recipe'); break; }
  clearWorkspace();
  if (!placeFromPanel(next[0], 120, 160) || !placeFromPanel(next[1], 220, 160)) {
    notes.push('no card for ' + next[0] + '/' + next[1]); fails.push('no card for ' + next[0] + '/' + next[1]); break;
  }
  dragItem(120, 160, 220, 160);
  if (!disc().has(next[2])) { notes.push('combine ' + next.join('+') + ' failed'); fails.push('combine ' + next.join('+') + ' failed'); break; }
  discovered.push(next[2]);
}
T('all-128-discovered', disc().size === TOTAL, disc().size + '/' + TOTAL + ' ' + notes.slice(0, 3).join('|'));
T('save-persisted', (() => { const ls = g.call('__R.ls()'); return !!ls && JSON.parse(ls).d.length === TOTAL; })(), 'ls');
T('hud-count', String(g.els['discovered-count'].textContent) === String(TOTAL), 'hud=' + g.els['discovered-count'].textContent);
T('hint-exhausted', (g.els['btn-hint'].click(), g.call('__R.hint()') === null), 'hint pair remains');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { discovered: disc().size + '/' + TOTAL, steps: discovered.length, notes: notes.slice(0, 6) } };
console.log('little-alchemy: ' + disc().size + '/' + TOTAL + ' elements discovered via real drags: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
