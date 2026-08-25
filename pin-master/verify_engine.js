#!/usr/bin/env node
/* pin-master verifier — all 40 levels completed through the engine's real input path:
 * canvas pointerdown taps at real pin coordinates (the engine's own hit-test in handleClick),
 * dependency-aware (locked pins wait for their locker, ice pins take 2 hits, chains/bombs
 * resolve via the engine itself), plates drop/fill slots through the engine's own physics,
 * win = the engine's own checkWin() flipping gameState to 'levelComplete'. Chain levels via
 * the win screen's Next button; hint + undo exercised through their real button regions. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('pin-master', { inject: {
  anchor: 'function checkWin(){',
  exports: `
render = function(){}; // draw-only routine stubbed for headless speed (logic/input untouched)
globalThis.__PM = {
  gs: () => gameState, lvl: () => currentLevel, n: () => LEVELS.length,
  stars: (id) => getLevelStars(id),
  pins: () => gameObjects.pins.map(p => ({ id: p.id, x: p.x, y: p.y, removed: p.removed, animating: p.animating, iceHits: p.iceHits, lockedBy: p.lockedBy })),
  canRemove: (id) => { const p = findPin(id); return p ? canRemovePin(p) : false; },
  plates: () => gameObjects.plates.map(p => ({ id: p.id, removed: p.removed, dropping: p.dropping })),
  slotsFilled: () => gameObjects.slots.filter(s => s.filled).length,
  hints: () => hintsRemaining, undos: () => undosRemaining,
  W: () => W, H: () => H,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['c'];
const W = 480, H = 640; // harness viewport (engine reads window.innerWidth/innerHeight)
const tap = (x, y) => cv.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
const T0 = Date.now();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-exist', C('__PM.n()') === 40, 'n=' + C('__PM.n()'));

// --- menu → level select via the real Start button region ---
tap(W / 2, H * 0.585); g.pump(5);
T('level-select', C('__PM.gs()') === 'levelSelect', 'gs=' + C('__PM.gs()'));

// level-select geometry (engine's own grid math): bw=60, gapX=30, padY=80, 5 cols
const lvlBtn = (i) => tap(30 + (i % 5) * 90 + 30, 80 + Math.floor(i / 5) * 72 + 36);
lvlBtn(1); g.pump(12); // level 2 before any win — engine gates on stars of level 1
T('level-2-locked-fresh', C('__PM.gs()') === 'levelSelect', 'gs=' + C('__PM.gs()'));
lvlBtn(0); g.pump(12); // level 1 always unlocked
T('level-1-tutorial', C('__PM.gs()') === 'tutorial', 'gs=' + C('__PM.gs()'));
tap(W / 2, H / 2); g.pump(12); tap(W / 2, H / 2); g.pump(12); tap(W / 2, H / 2); g.pump(12); // 3 tutorial steps (clickLock 150ms between taps)
T('tutorial-done', C('__PM.gs()') === 'playing', 'gs=' + C('__PM.gs()'));

// --- hint + undo through their real button regions ---
tap(W / 2 + 65, H - 60); g.pump(12); // Hint button (engine hit region)
T('hint-button', C('__PM.hints()') === 2, 'hints=' + C('__PM.hints()'));
const pins0 = C('__PM.pins()');
const victim = pins0.find(p => !p.removed && !p.animating && C('__PM.canRemove("' + p.id + '")'));
tap(victim.x, victim.y); g.pump(25); // remove one pin through the real hit-test (unscrew anim = 1/3s)
T('pin-removal', C('__PM.pins()').find(p => p.id === victim.id).removed, 'pin not removed');
tap(W / 2 - 65, H - 60); g.pump(12); // Undo button
T('undo-restores', !C('__PM.pins()').find(p => p.id === victim.id).removed && C('__PM.undos()') === 2,
  'removed=' + C('__PM.pins()').find(p => p.id === victim.id).removed + ' undos=' + C('__PM.undos()'));

// --- solver: tap every engine-removable pin (real coords, engine's own canRemovePin truth) ---
function solveLevel(deadline) {
  let taps = 0;
  for (;;) {
    if (C('__PM.gs()') === 'levelComplete') return { r: 'won', taps };
    const pins = C('__PM.pins()');
    const live = pins.filter(p => !p.removed);
    if (!live.length) { // all pins gone — plates are falling; wait for the engine's win
      for (let k = 0; k < 400 && C('__PM.gs()') !== 'levelComplete'; k++) {
        g.pump(1);
        if (Date.now() > deadline) return { r: 'settle-timeout', taps };
      }
      return C('__PM.gs()') === 'levelComplete' ? { r: 'won', taps } : { r: 'settle-timeout', taps };
    }
    const target = live.find(p => !p.animating && C('__PM.canRemove("' + p.id + '")'));
    if (!target) { // let anims finish, then re-check before declaring deadlock
      g.pump(30);
      const still = C('__PM.pins()').filter(p => !p.removed);
      if (still.length && !still.some(p => !p.animating && C('__PM.canRemove("' + p.id + '")'))) return { r: 'deadlock', taps };
      continue;
    }
    tap(target.x, target.y);
    taps++;
    g.pump(10); // clickLock is 150ms
    if (Date.now() > deadline) return { r: 'deadline', taps };
  }
}

const results = [];
let totalSlotsFilled = 0;
for (let lvl = 0; lvl < 40; lvl++) {
  const deadline = Math.min(Date.now() + 8000, T0 + 100000);
  const out = solveLevel(deadline);
  results.push(out.r);
  T('level-' + (lvl + 1) + '-won', out.r === 'won' && C('__PM.plates()').every(p => p.removed),
    out.r + ' plates=' + C('__PM.plates()').filter(p => p.removed).length + '/' + C('__PM.plates()').length);
  totalSlotsFilled += C('__PM.slotsFilled()');
  if (out.r !== 'won') break;
  if (lvl < 39) { tap(W / 2, H * 0.715); g.pump(10); } // win screen "Next Level" button region
}
T('all-40-levels', results.length === 40 && results.every(r => r === 'won'),
  results.map((r, i) => r === 'won' ? '' : (i + 1) + ':' + r).filter(Boolean).join(','));

// --- progress persisted by the engine's own setLevelResult ---
const save = JSON.parse(g.ls.getItem('pinMaster_v1') || '{}');
const savedStars = Object.values(save.levels || {}).filter(v => v.stars > 0).length;
T('progress-saved', savedStars >= 39, 'levels with stars=' + savedStars + '/40');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/40', durS: Math.round((Date.now() - T0) / 1000) } };
console.log('pin-master: ' + results.filter(r => r === 'won').length + '/40 levels via real pin taps + engine plate-drop physics: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
