#!/usr/bin/env node
/* flag-paint verifier — all 30 flags painted through the engine's real input path:
 * real swatch clicks (dynamic palette elements) to arm colors + real canvas pointerdown
 * taps; tap points validated against the engine's own hitTest before use; fills go through
 * onCanvasTap's color check; win = the engine's own completeLevel() firing (wrapped at
 * inject). First-visit tutorial walked via its real step handlers; level-select gating
 * verified via the real locked-cell classes; levels chained through btn-next. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('flag-paint', { inject: {
  anchor: 'function completeLevel(){',
  exports: `
globalThis.__won = -1;
const __oc = completeLevel;
completeLevel = function(){ globalThis.__won = state.levelIdx; return __oc.apply(this, arguments); };
drawFlag = function(){}; // draw-only routine stubbed for headless speed (logic/input untouched)
globalThis.__FP = {
  lvl: () => state.levelIdx, screen: () => state.screen, n: () => FLAGS.length,
  filled: () => Object.keys(state.filledRegions).length,
  total: () => FLAGS[state.levelIdx].regions.length,
  hit: (x, y) => hitTest(x, y),
  regColor: (i) => FLAGS[state.levelIdx].regions[i].color,
  scale: () => scale,
  mistakes: () => state.mistakes, hints: () => state.hintsUsed,
  completed: () => state.save.completed.slice(),
  stars: () => state.save.stars,
  armed: () => state.armedColor,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['flag-canvas'];
const tap = (x, y) => cv.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
const T0 = Date.now();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('flags-exist', C('__FP.n()') === 30, 'n=' + C('__FP.n()'));

// --- first visit: Play → tutorial overlay → walk its 4 steps via the real handlers ---
g.els['btn-play'].click(); g.pump(3);
T('tutorial-first-visit', g.els['tutorial'].style.display === 'flex', 'display=' + g.els['tutorial'].style.display);
g.call('tutNext(2)'); g.call('tutNext(3)'); g.call('tutNext(4)'); // step buttons (inline onclick handlers)
g.call('tutDone()'); g.pump(10); // "Start Playing!" → startLevel(0)
T('level-1-started', C('__FP.screen()') === 'game' && C('__FP.lvl()') === 0 && C('__FP.scale()') > 0,
  'screen=' + C('__FP.screen()') + ' lvl=' + C('__FP.lvl()') + ' scale=' + C('__FP.scale()'));

// swatches are dynamic elements built by buildPalette — click them for real
function swatches() { return (g.els['swatches'].children || []).filter(c => String(c.className).split(/\s+/).includes('swatch')); }
function arm(color) {
  const sw = swatches().find(s => s.dataset && s.dataset.color === color);
  if (!sw) return false;
  sw.click();
  return C('__FP.armed()') === color;
}

// paint one region: verify the tap point against the ENGINE's own hitTest first
function paintRegion(i) {
  const color = C('__FP.regColor(' + i + ')');
  if (!arm(color)) return 'no-swatch-' + color;
  const sc = C('__FP.scale()');
  for (let vx = 4; vx <= 296; vx += 4) for (let vy = 4; vy <= 196; vy += 4) {
    if (C('__FP.hit(' + vx + ',' + vy + ')') !== i) continue;
    const f0 = C('__FP.filled()');
    tap(vx * sc, vy * sc);
    g.pump(2);
    if (C('__FP.filled()') !== f0 + 1) return 'tap-miss@(' + vx + ',' + vy + ')';
    return null;
  }
  return 'no-point-region' + i;
}

function paintAll(deadline) { // fill top-drawn regions first so hitTest finds each target
  const total = C('__FP.total()');
  while (C('__FP.filled()') < total) {
    if (Date.now() > deadline) return 'deadline';
    let filled = C('__FP.filled()');
    for (let i = 0; i < total; i++) { // engine hitTest skips filled; any unfilled works
      if (C('__FP.filled()') > filled) break; // hint or prior fill advanced it
      const c = C('__FP.regColor(' + i + ')');
      // pick the topmost unfilled region the engine itself would hit-test to
      let done = false;
      for (let vx = 4; vx <= 296 && !done; vx += 4) for (let vy = 4; vy <= 196 && !done; vy += 4) {
        if (C('__FP.hit(' + vx + ',' + vy + ')') !== i) continue;
        if (!arm(c)) return 'no-swatch-' + c;
        tap(vx * C('__FP.scale()'), vy * C('__FP.scale()'));
        g.pump(2);
        done = true;
      }
      if (done) break;
    }
    if (C('__FP.filled()') === filled) return 'stuck-filled=' + filled + '/' + total;
  }
  for (let k = 0; k < 120 && C('__won') !== C('__FP.lvl()'); k++) g.pump(1); // 500ms win + 800ms screen
  return C('__won') === C('__FP.lvl()') ? 'won' : 'win-timeout';
}

// --- level 1: exercise the real Hint button, then paint the rest ---
g.els['btn-hint'].click(); g.pump(3);
T('hint-fills-region', C('__FP.hints()') === 1 && C('__FP.filled()') === 1, 'hints=' + C('__FP.hints()') + ' filled=' + C('__FP.filled()'));
let r = paintAll(Math.min(Date.now() + 6000, T0 + 100000));
T('level-1-won', r === 'won' && C('__FP.mistakes()') === 0, r + ' mistakes=' + C('__FP.mistakes()'));
g.pump(60); // complete screen reveal (800ms)

// --- menu → level select: real locked-cell gating after 1 completion ---
g.els['btn-menu'].click(); g.pump(3);
g.els['btn-play'].click(); g.pump(3); // returning player → levels screen
T('levels-screen', C('__FP.screen()') === 'levels', 'screen=' + C('__FP.screen()'));
function levelCells() { // levels-container > continent-group > levels-grid > level-cell
  const out = []; const walk = el => { for (const c of (el.children || [])) { const cls = String(c.className).split(/\s+/); if (cls.includes('level-cell')) out.push(c); walk(c); } };
  walk(g.els['levels-container']); return out;
}
const cells = levelCells();
T('level-cells-built', cells.length === 30, 'n=' + cells.length);
const lockedN = cells.filter(c => c.classList.contains('locked')).length; // classList.add — className string lags
T('gating-after-1-win', lockedN === 28, 'locked=' + lockedN + '/29 expected');
const cell2 = cells.find(c => c.children[0] && String(c.children[0].textContent) === '2');
cell2.click(); g.pump(10); // unlocked cell (flag 2) via its real click listener
T('level-2-via-cell', C('__FP.screen()') === 'game' && C('__FP.lvl()') === 1, 'screen=' + C('__FP.screen()') + ' lvl=' + C('__FP.lvl()'));

// --- paint flags 2..30 chained through the win screen's Next button ---
const results = ['won'];
for (let lvl = 1; lvl < 30; lvl++) {
  if (C('__FP.lvl()') !== lvl) { results.push('wrong-level:' + C('__FP.lvl()')); break; }
  const deadline = Math.min(Date.now() + 6000, T0 + 100000);
  const out = paintAll(deadline);
  results.push(out);
  T('level-' + (lvl + 1) + '-won', out === 'won' && C('__FP.mistakes()') === 0, out + ' mistakes=' + C('__FP.mistakes()'));
  if (out !== 'won') break;
  g.pump(60);
  g.els['btn-next'].click(); g.pump(10); // "Next Flag" → startLevel(lvl+1)
}
T('all-30-flags', results.length === 30 && results.every(x => x === 'won'),
  results.map((x, i) => x === 'won' ? '' : (i + 1) + ':' + x).filter(Boolean).join(','));

// --- progress persisted by the engine's own completeLevel ---
const save = JSON.parse(g.ls.getItem('flagpaint_v1') || '{}');
const starsTotal = Object.values(save.stars || {}).reduce((a, b) => a + b, 0);
const lowStars = Object.entries(save.stars || {}).filter(([k, v]) => Number(k) !== 0 && v < 3).map(([k, v]) => (Number(k) + 1) + ':' + v);
// engine star rules: hintsUsed>=1 caps at 1 star (both branches require hintsUsed===0) — level 1 (hint probe) = 1 star, all others 3
T('progress-saved', (save.completed || []).length === 30 && starsTotal === 88 && lowStars.length === 0 && save.stars['0'] === 1,
  'completed=' + (save.completed || []).length + '/30 stars=' + starsTotal + ' low:' + lowStars.join(',') + ' lvl1=' + save.stars['0']);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { flags: results.filter(x => x === 'won').length + '/30', durS: Math.round((Date.now() - T0) / 1000) } };
console.log('flag-paint: ' + results.filter(x => x === 'won').length + '/30 flags painted via real swatch clicks + canvas taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
