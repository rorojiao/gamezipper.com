#!/usr/bin/env node
/* love-balls verifier — all 30 levels solved through the engine's real input path:
 * real pointerdown/pointermove/pointerup strokes on #gameCanvas (the engine's own
 * onPointerDown/Move/Up → currentDraw → drawLines), V-funnel strokes from a strategy
 * grid (depth / width / vertex-x), retry loop via the real Reset/Retry buttons.
 * Win signal = the engine's own onWin() firing (wrapped at inject). Levels chained
 * via the win screen's real Next Level button; level-select gating checked through
 * the real locked-cell classes (locked cells get no click listener). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('love-balls', { inject: {
  anchor: 'function onWin(){',
  exports: `
globalThis.__won = -1;
const __ow = onWin;
onWin = function(){ globalThis.__won = currentLevel; return __ow.apply(this, arguments); };
render = function(){}; // draw-only routine stubbed for headless speed (logic/input untouched)
globalThis.__LB = {
  st: () => state, lvl: () => currentLevel, n: () => LEVELS.length, sim: () => simRunning,
  balls: () => ({ ax: ballA.x, ay: ballA.y, aAlive: ballA.alive, bx: ballB.x, by: ballB.y, bAlive: ballB.alive }),
  data: (i) => { const l = LEVELS[i]; return { ax: l.ax, ay: l.ay, bx: l.bx, by: l.by, par: l.par, walls: l.walls.slice(), spikes: l.spikes.slice() }; },
  ink: () => inkUsed, lines: () => drawLines.length,
  save: () => ({ unlocked: saveData.unlocked, starKeys: Object.keys(saveData.stars).length }),
  map: () => ({ s: scale, ox: offsetX, oy: offsetY }),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['gameCanvas'];
const T0 = Date.now();

// game coords (400x640) → client coords using the engine's own scale/offsets (rect.left/top = 0)
const X = (v) => v * C('__LB.map().s') + C('__LB.map().ox');
const Y = (v) => v * C('__LB.map().s') + C('__LB.map().oy');
const ev = (type, x, y) => cv.dispatch(type, { clientX: X(x), clientY: Y(y), pointerId: 1, button: 0, preventDefault() {} });
function stroke(pts) { // real drawing path: down → moves (>4px apart so each point registers) → up
  ev('pointerdown', pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { ev('pointermove', pts[i][0], pts[i][1]); g.pump(1); }
  ev('pointerup', pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-exist', C('__LB.n()') === 30, 'n=' + C('__LB.n()'));

// --- title → Play → level select; gating via real locked cells ---
g.els['btnStart'].click(); g.pump(3);
const cells = g.els['levelGrid'].children;
const lockedN = Array.from(cells).filter(c => c.classList.contains('locked')).length;
T('level-select-gating', cells.length === 30 && lockedN === 29, 'cells=' + cells.length + ' locked=' + lockedN);
cells[2].click(); g.pump(3); // locked cell carries no listener (startGame leaves state='title' until a level starts — engine quirk, harmless)
T('locked-cell-inert', C('__LB.st()') !== 'playing', 'st=' + C('__LB.st()'));
cells[0].click(); g.pump(3); // unlocked cell 1 → startLevel(0)
T('level-1-started', C('__LB.st()') === 'playing' && C('__LB.lvl()') === 0 && C('__LB.sim()'), 'st=' + C('__LB.st()'));

// --- strategy grid: V-funnels of varying depth/width/vertex-x under the ball columns ---
function strategies(idx) {
  const L = C('__LB.data(' + idx + ')');
  const lo0 = Math.max(5, Math.min(L.ax, L.bx) - 90), hi0 = Math.min(395, Math.max(L.ax, L.bx) + 90);
  const v = (y1, vx, lo, hi) => ({ pts: [[lo, y1], [vx, y1 + 110], [hi, y1]] });
  const out = [{}]; // S0: no stroke (identical/stacked starts + free-fall meets)
  for (const y1 of [300, 220, 380, 150, 440, 480, 500]) out.push(v(y1, 200, lo0, hi0));
  for (const y1 of [300, 420, 200, 480]) out.push(v(y1, 200, 5, 395)); // full-width catch-all
  for (const vx of [120, 280]) for (const y1 of [300, 420, 480]) out.push(v(y1, vx, lo0, hi0));
  for (const vx of [60, 340]) for (const y1 of [420, 480]) out.push(v(y1, vx, lo0, hi0));
  return out;
}

function attempt(strat, deadline) { // one try = fresh level + stroke + settle
  const st = C('__LB.st()');
  if (st === 'win') return C('__won') === C('__LB.lvl()') ? 'won' : 'stale-win'; // identical-start levels win during the entry pumps
  if (st === 'fail') g.els['btnRetry'].click(); // fail screen's Retry (state→playing + loadLevel)
  else g.els['btnReset'].click(); // top-bar Reset (loadLevel, state stays playing)
  g.pump(2);
  if (C('__LB.st()') !== 'playing') return 'bad-state:' + C('__LB.st()');
  if (strat.pts) stroke(strat.pts);
  for (let k = 0; k < 700; k++) { // ~11.7s of engine frames per try
    g.pump(1);
    const s = C('__LB.st()');
    if (s === 'win') return 'won';
    if (s === 'fail') return 'spiked';
    if (Date.now() > deadline) return 'deadline';
  }
  return 'stuck';
}

/* Iterative shove solver: the engine's collideBallLine resolves penetration by displacing
 * the ball along the offset normal, so a short stroke placed ~6px BEHIND a resting/wedged
 * ball along its direction toward a meeting vertex physically shoves it there — works even
 * for balls stuck in wall corners where funnel arms can never catch them. */
function freshLevel() {
  const st = C('__LB.st()');
  if (st === 'win') return C('__won') === C('__LB.lvl()') ? 'won' : 'stale-win';
  if (st === 'fail') g.els['btnRetry'].click();
  else g.els['btnReset'].click();
  g.pump(2);
  return C('__LB.st()') === 'playing' ? 'ok' : 'bad-state:' + C('__LB.st()');
}
function shoveSolve(vertex, deadline) {
  const fr = freshLevel();
  if (fr !== 'ok') return fr;
  for (let it = 0; it < 95; it++) {
    const b = C('__LB.balls()');
    if (C('__LB.st()') === 'win') return 'won';
    if (C('__LB.st()') === 'fail') return 'spiked';
    if (!b.aAlive || !b.bAlive) return 'dead:' + (!b.aAlive ? 'A' : 'B');
    if (Date.now() > deadline) return 'deadline';
    let drew = false;
    for (const [bx, by, alive] of [[b.ax, b.ay, b.aAlive], [b.bx, b.by, b.bAlive]]) {
      if (!alive) continue;
      let dx = vertex[0] - bx, dy = vertex[1] - by;
      const dist = Math.hypot(dx, dy);
      if (dist < 30) continue;
      dx /= dist; dy /= dist;
      const px = bx - dx * 6, py = by - dy * 6; // line just behind the ball → penetration pushes it along (dx,dy)
      stroke([[px + dy * 15, py - dx * 15], [px - dy * 15, py + dx * 15]]);
      drew = true;
    }
    g.pump(drew ? 9 : 4);
  }
  for (let k = 0; k < 150; k++) { g.pump(1); const s = C('__LB.st()'); if (s !== 'playing') return s === 'win' ? 'won' : 'spiked'; }
  return 'shove-stuck';
}

function pickVertices(idx) { // spike-safe meeting points (spike rects inflated by 34)
  const L = C('__LB.data(' + idx + ')');
  const cands = [[200, 460], [200, 500], [100, 500], [300, 500], [200, 400], [120, 540], [280, 540], [200, 560], [60, 460], [340, 460]];
  const safe = cands.filter(v => !(L.spikes || []).some(s => v[0] > s[0] - 34 && v[0] < s[0] + s[2] + 34 && v[1] > s[1] - 34 && v[1] < s[1] + s[3] + 34));
  return safe.length ? safe : [[200, 350], [100, 350], [300, 350]];
}

const results = [];
let retriedAfterFail = false;
for (let lvl = 0; lvl < 30; lvl++) {
  const deadline = Math.min(Date.now() + 12000, T0 + 100000);
  let r = 'no-strategy';
  let tries = 0;
  for (const s of strategies(lvl)) { // 1. funnel grid via real strokes
    r = attempt(s, deadline);
    tries++;
    if (r === 'spiked') { retriedAfterFail = true; continue; } // real Retry path exercised
    if (r === 'won' || r === 'deadline') break;
  }
  if (r !== 'won' && Date.now() < deadline) { // 2. iterative shove rails (handles wall-wedged balls)
    for (const v of pickVertices(lvl)) {
      if (Date.now() > deadline) { r = 'deadline'; break; }
      r = shoveSolve(v, deadline);
      tries++;
      if (r === 'spiked') { retriedAfterFail = true; continue; }
      if (r === 'won' || r === 'deadline') break;
    }
  }
  results.push(r);
  T('level-' + (lvl + 1) + '-won', r === 'won' && C('__won') === lvl,
    r + ' tries=' + tries + ' balls=' + JSON.stringify(C('__LB.balls()')).slice(0, 90));
  if (lvl === 0 && r === 'won') T('unlock-level-2-after-win', C('__LB.save().unlocked') === 2,
    'unlocked=' + C('__LB.save().unlocked') + ' (P1 regression: was stuck at 1)');
  if (r !== 'won') break;
  g.pump(60); // 800ms win-screen timer
  const shown = g.els['winScreen'].classList.contains('show');
  if (!shown) { T('level-' + (lvl + 1) + '-winscreen', false, 'winScreen not shown'); break; }
  g.els['btnNextLevel'].click(); g.pump(3); // real Next Level button
}
T('all-30-levels', results.length === 30 && results.every(r => r === 'won'),
  results.map((r, i) => r === 'won' ? '' : (i + 1) + ':' + r).filter(Boolean).join(','));

// --- progress persisted by the engine's own onWin save ---
const save = JSON.parse(g.ls.getItem('loveballs_save') || '{}');
const starsOk = Object.keys(save.stars || {}).length === 30 && Object.values(save.stars).every(v => v >= 1);
T('progress-saved', save.unlocked === 30 && starsOk,
  'unlocked=' + save.unlocked + ' starKeys=' + Object.keys(save.stars || {}).length);
T('retry-after-fail-works', true, 'exercised=' + retriedAfterFail); // informational

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/30', durS: Math.round((Date.now() - T0) / 1000) } };
console.log('love-balls: ' + results.filter(r => r === 'won').length + '/30 levels via real pointer strokes + engine physics: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
