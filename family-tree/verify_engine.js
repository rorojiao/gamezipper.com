#!/usr/bin/env node
/* family-tree engine verifier — real input paths only: tiles are dragged via the tray
   pointerdown → window pointermove → window pointerup gesture (the exact event chain
   the engine binds), placements resolved through nodeHit at the engine's own px/py
   coordinates. Covers tutorial, hint (+ exhausted-hint feedback), hearts/lose/retry,
   anchor/occupied-drop rejection, canvas re-pick, win stars, 40-level sweep, menu
   locking, sound toggle, persistence.
   Harness note: engine hideAllOverlays() removes overlays via document.qsa('.overlay'),
   which the harness resolves against els (not body-appended nodes) — stale overlays stack;
   this verifier always takes the LAST body overlay, matching the modal the engine just
   built and wired. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note: note === undefined ? '' : String(note) }); if (!ok) console.error('  FAIL: ' + name + (note !== undefined ? ' — ' + note : '')); };
const t0 = Date.now();

const g = bootGame('family-tree', {});
const E = (id) => g.sandbox.document.getElementById(id);
const W = () => g.sandbox.window;
const st = () => g.call('state');
const walk = (root, pred, out = []) => { if (pred(root)) out.push(root); (root.children || []).forEach((c) => walk(c, pred, out)); return out; };
const overlays = () => walk(g.sandbox.document.body, (n) => n.classList && n.classList.contains('overlay'));
const lastOv = () => overlays()[overlays().length - 1];
const ovText = () => { let s = ''; walk(lastOv(), (n) => { if (n.textContent) s += n.textContent + ' '; }); return s; }; // parsed text lives on leaf nodes
const nodes = () => g.call('state.level.tpl.nodes');
const charMap = () => g.call('state.level.charMap');
const nodeOf = (name) => nodes().find((n) => charMap()[n.id].name === name);
const trayTiles = () => E('tray').children.filter((c) => c.dataset && c.dataset.name !== undefined);

// real drag gesture: tile pointerdown (target = tile), window pointermove/up at node coords
function dragTo(name, x, y) {
  const tile = trayTiles().find((t) => t.dataset.name === name);
  if (!tile) return false;
  E('tray').dispatch('pointerdown', { target: tile, clientX: 0, clientY: 0 });
  W().dispatchEvent({ type: 'pointermove', clientX: x, clientY: y });
  W().dispatchEvent({ type: 'pointerup', clientX: x, clientY: y });
  return true;
}
const drag = (name, node) => dragTo(name, node.px, node.py);

T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('first-visit-tutorial', st().screen === 'menu' && overlays().length === 1 && ovText().includes('Family Tree') && walk(lastOv(), (n) => n.classList && n.classList.contains('on')).length === 1); // bare text nodes aren't parsed — assert via the active dot + step text

// tutorial: step through all 5 (Back appears after step 0), then Start Playing
{
  let clicked = 0, sawBack = false;
  while (st().screen !== 'play' && clicked < 12) {
    const ov = lastOv();
    if (ov.querySelector('#prev')) sawBack = true;
    ov.querySelector('#next').dispatch('click', {});
    clicked++; g.pump(1);
  }
  T('tutorial-steps-complete', st().screen === 'play' && clicked === 5 && sawBack, 'clicks=' + clicked);
  T('tutorial-seen-saved', g.call('SAVE.tutorialSeen') === true && JSON.parse(g.sandbox.localStorage.getItem('familytree_save_v1')).tutorialSeen === true);
}

// level 1 (T0: couple + 2 kids, anchor 'a' pre-filled)
T('level1-started', st().levelIdx === 0 && String(E('lvlPill').textContent) === 'Level 1' && String(E('heartsEl').textContent) === '❤❤❤');
T('tray-3-tiles', trayTiles().length === 3, trayTiles().map((t) => t.dataset.name).join(','));
T('clues-rendered', E('clueList').children.length === st().level.clues.length);
T('layout-computed', nodes().every((n) => Number.isFinite(n.px) && Number.isFinite(n.py)));

// level data integrity: unique names, genders match nodes, clues reference real names
{
  let ok = true, note = '';
  for (let li = 0; li < 40; li++) {
    const L = g.call('LEVELS[' + li + ']');
    const names = Object.values(L.charMap).map((c) => c.name);
    if (new Set(names).size !== names.length) { ok = false; note = 'L' + (li + 1) + ' dup name'; break; }
    for (const n of L.tpl.nodes) if (L.charMap[n.id].g !== n.g) { ok = false; note = 'L' + (li + 1) + ' gender mismatch ' + n.id; }
    for (const c of L.clues) {
      const mentioned = names.filter((nm) => c.includes(nm));
      if (!mentioned.length) { ok = false; note = 'L' + (li + 1) + ' clue without a name: ' + c.slice(0, 40); }
    }
  }
  T('level-data-integrity', ok, note);
}

// drop on the anchor node: rejected, no heart loss
{
  const anchor = nodes().find((n) => n.id === st().level.anchorId);
  const name = trayTiles()[0].dataset.name;
  drag(name, anchor);
  T('anchor-drop-rejected', Object.keys(st().placed).length === 0 && st().hearts === 3 && trayTiles().length === 3);
}

// correct drag places; clue with all names placed gets struck through
{
  const name = trayTiles()[0].dataset.name;
  drag(name, nodeOf(name));
  T('correct-drag-places', st().placed[nodeOf(name).id] === name && trayTiles().length === 2 && st().hearts === 3);
}

// drop on an occupied node: ignored, no heart loss
{
  const occ = Object.keys(st().placed).map((id) => nodes().find((n) => n.id === id))[0];
  const name = trayTiles()[0].dataset.name;
  drag(name, occ);
  T('occupied-drop-ignored', st().hearts === 3 && st().placed[occ.id] !== name && trayTiles().length === 2);
}

// canvas re-pick: pointerdown on a placed node pulls it back; dropping on a wrong node costs a heart
{
  const placedName = Object.values(st().placed)[0];
  const from = Object.keys(st().placed).map((id) => nodes().find((n) => n.id === id))[0];
  E('cv').dispatch('pointerdown', { clientX: from.px, clientY: from.py });
  T('repick-to-tray', st().placed[from.id] === undefined && trayTiles().length === 3);
  const other = nodes().find((n) => n.id !== st().level.anchorId && n.id !== from.id && !st().placed[n.id]);
  E('cv').dispatch('pointerup', { clientX: other.px, clientY: other.py });
  T('canvas-wrong-drop-heart', st().hearts === 2 && String(E('heartsEl').textContent) === '❤❤🖤' && st().placed[other.id] === undefined, 'hearts=' + st().hearts + ' other=' + other.id);
}

// hint: fills first unplaced correctly; exhausted hint flashes feedback instead of silence
{
  E('hintBtn').dispatch('click', {});
  const first = nodes().find((n) => n.id !== st().level.anchorId && !st().placed[n.id] ? false : false); // (first unplaced BEFORE hint)
  T('hint-places-correct', st().hintsLeft === 0 && String(E('hintBtn').textContent).includes('(0)'));
  const placedCount = Object.keys(st().placed).length;
  const okPlaced = Object.entries(st().placed).every(([id, nm]) => charMap()[id].name === nm);
  T('hint-placement-correct', okPlaced && placedCount >= 1, 'placed=' + placedCount);
  E('hintBtn').dispatch('click', {});
  T('hint-exhausted-feedback', st().feedback && String(st().feedback.text).includes('No hints left') && st().hintsLeft === 0);
  g.pump(45); // ~750ms: the P2 fix decays the toast
  T('hint-feedback-fades', st().feedback === null);
}

// win level 1 with hearts=2 -> 2 stars, next level button, hint label restored (P3 fix)
{
  for (const t of trayTiles().slice()) drag(t.dataset.name, nodeOf(t.dataset.name));
  T('level1-win-modal', ovText().includes('Level Complete!') && ovText().includes('⭐⭐☆'));
  T('level1-2stars-saved', g.call('SAVE.completed[0]') === 2);
  lastOv().querySelector('#nextLvl').dispatch('click', {});
  T('level2-started', st().levelIdx === 1 && st().hearts === 3 && String(E('hintBtn').textContent) === '💡 Hint', E('hintBtn').textContent);
  T('level2-tray-4', trayTiles().length === 4); // T1: couple + 3 kids
}

// lose path on level 2: three wrong drops -> lose modal -> retry restores hearts
{
  const victim = trayTiles()[0].dataset.name;
  const wrongNode = nodes().find((n) => n.id !== st().level.anchorId && charMap()[n.id].name !== victim);
  for (let i = 0; i < 3; i++) drag(victim, wrongNode);
  T('hearts-zero', st().hearts === 0 && String(E('heartsEl').textContent) === '🖤🖤🖤');
  g.pump(35); // 500ms lose timeout
  T('lose-modal', ovText().includes('Out of Hearts'));
  lastOv().querySelector('#retry').dispatch('click', {});
  T('retry-restores', st().levelIdx === 1 && st().hearts === 3 && trayTiles().length === 4 && st().hintsLeft === 1);
}

// menu: 40 cells, locked cells inert, continue jumps to highest unlocked
{
  E('menuBtn').dispatch('click', {});
  const ov = lastOv();
  const cells = ov.querySelectorAll('.lvl-cell');
  T('menu-40-cells', cells.length === 40, cells.length);
  const locked = cells.filter((c) => c.classList.contains('locked'));
  T('menu-locking', locked.length === 38 && locked.every((c) => +c.dataset.lvl > 1), locked.length + ' locked');
  const doneCell = cells.find((c) => +c.dataset.lvl === 0);
  T('menu-done-badge', doneCell.classList.contains('done') && (() => { let s = ''; walk(doneCell, (n) => { if (n.textContent) s += n.textContent; }); return s; })().includes('★★'));
  locked[locked.length - 1].dispatch('click', {}); // locked level 40: inert
  T('locked-cell-inert', st().screen === 'menu' && st().levelIdx === 1);
  const cb = ov.querySelector('#continueBtn');
  T('continue-button', !!cb && String(cb.textContent).includes('Level 2'), cb && cb.textContent);
  cb.dispatch('click', {});
  T('continue-starts-l2', st().levelIdx === 1 && st().screen === 'play', 'idx=' + st().levelIdx);
}

// sound toggle persisted
{
  E('soundBtn').dispatch('click', {});
  T('sound-off', String(E('soundBtn').textContent) === '🔇' && g.call('SAVE.soundOn') === false);
  E('soundBtn').dispatch('click', {});
  T('sound-on', String(E('soundBtn').textContent) === '🔊' && g.call('SAVE.soundOn') === true);
}

// ---- full sweep: levels 3..40 (idx 2..39) all-correct via real drags ----
{
  let runOk = true;
  for (let idx = st().levelIdx; idx < 40 && runOk; idx++) {
    if (st().levelIdx !== idx) { T('sweep-order-' + idx, false, 'at ' + st().levelIdx); runOk = false; break; }
    let guard = 0;
    while (trayTiles().length && guard++ < 12) {
      const t = trayTiles()[0];
      if (!drag(t.dataset.name, nodeOf(t.dataset.name))) { T('sweep-drag-' + idx, false, 'tile vanished'); runOk = false; break; }
      if (st().hearts !== 3) { T('sweep-hearts-' + idx, false, st().hearts); runOk = false; break; }
    }
    if (!runOk) break;
    if (!ovText().includes('Level Complete!')) { T('sweep-win-' + idx, false, 'no modal'); runOk = false; break; }
    if (!ovText().includes('⭐⭐⭐')) { T('sweep-stars-' + idx, false, ovText().slice(0, 60)); runOk = false; break; }
    // click only REAL parsed buttons: the engine's `qs('#nextLvl')?.addEventListener` wires
    // a harness stub at level 40 (browser gets null and skips) — clicking that stub would
    // crash startLevel(40)
    const btn = walk(lastOv(), (n) => n.id === 'nextLvl')[0] || walk(lastOv(), (n) => n.id === 'toMenu2')[0];
    btn.dispatch('click', {});
    g.pump(1);
  }
  T('sweep-40-complete', runOk && Object.keys(g.call('SAVE.completed')).length === 40, Object.keys(g.call('SAVE.completed')).length + '/40');
  T('final-modal-all-done', ovText().includes('Family Tree') && st().screen === 'menu');
  const cells = lastOv().querySelectorAll('.lvl-cell');
  const agg = (el) => { let s = ''; walk(el, (n) => { if (n.textContent) s += n.textContent; }); return s; };
  T('menu-all-done', cells.length === 40 && cells.every((c) => c.classList.contains('done')) && cells.filter((c) => agg(c).includes('★★★')).length === 39 && agg(cells.find((c) => +c.dataset.lvl === 0)).includes('★★')); // L1 keeps its 2★ (max-stars save)
  T('no-continue-at-100', !lastOv().querySelector('#continueBtn') || String(lastOv().querySelector('#continueBtn').textContent) === '');
}

// persistence: returning player sees all 40 done, no tutorial
{
  const g2 = bootGame('family-tree', { seedLS: Object.fromEntries(Object.entries(g.sandbox.localStorage._m)) });
  g2.pump(2);
  T('reload-no-tutorial', g2.call('state.screen') === 'play' && g2.call('state.levelIdx') === 0);
  T('reload-completed-40', Object.keys(g2.call('SAVE.completed')).length === 40);
  g2.sandbox.document.getElementById('menuBtn').dispatch('click', {});
  const cells = (() => { const ov = walk(g2.sandbox.document.body, (n) => n.classList && n.classList.contains('overlay')).pop(); return ov.querySelectorAll('.lvl-cell'); })();
  T('reload-menu-done', cells.length === 40 && cells.every((c) => c.classList.contains('done')));
}

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok).map((r) => r.name);
console.log('family-tree: 40 levels via real tray/canvas drag gestures + hearts/hints/menu/persistence: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { durS: ((Date.now() - t0) / 1000).toFixed(1), fixes: 'P2 flash() feedback never rendered (exhausted-hint tap was a silent no-op) — toast now drawn + decays; P3 hintBtn label stuck at "(0)" on every level after a used hint' } }));
process.exit(fails.length ? 1 : 0);
