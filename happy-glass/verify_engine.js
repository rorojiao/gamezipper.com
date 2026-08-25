#!/usr/bin/env node
/* happy-glass verifier — 30 water-physics draw levels (type A).
 * Every level is played through the REAL input path: playBtn click -> level-grid
 * button click (buildLevelGrid's own onclick=startLevel) -> canvas pointerdown/move/up
 * strokes (the engine's own startDraw/moveDraw/endDraw build collider segments under
 * its ink limit) -> playPauseBtn click (toggleSim) -> the engine's own updatePhysics
 * runs the sim until its own win check (fillRatio>=0.55 sustained 1.5s -> onWin ->
 * gameState='won'). Next level via the real nextLevelBtn click handler.
 * Bot plans (trough+pour water-routing polylines, tuned per level against the engine's
 * real physics) draw within each level's inkLimit. FAIL honesty: any level the bot
 * can't fill within budget is recorded unwon. Physics is stepped by the engine's own
 * updatePhysics(1/60) (same dt the rAF loop passes) batched in-vm for headless speed;
 * render() is stubbed (draw-only). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('happy-glass', { viewport: [400, 700], inject: {
  anchor: 'function onWin(){',
  exports: `render = function(){};
  globalThis.__H = {
    st: () => gameState, id: () => currentLevel ? currentLevel.id : 0,
    n: () => LEVELS.length, ink: () => totalInkUsed, limit: () => currentLevel.inkLimit,
    fill: () => fillRatio, strokes: () => drawnStrokes.length,
    start: (i) => startLevel(i),
    frames: (n) => { // step the engine's own physics (dt identical to the rAF loop)
      let f = 0;
      for (; f < n; f++) {
        updatePhysics(1/60);
        if (gameState === 'won') return { won: true, f: f + 1, fill: fillRatio };
      }
      return { won: false, f, fill: fillRatio };
    },
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = call('__H.n()');
T('levels-30', N === 30, 'n=' + N);

const canvas = g.els['gameCanvas'];
function stroke(pts) { // real pointer path -> engine startDraw/moveDraw/endDraw
  canvas.dispatch('pointerdown', { clientX: pts[0][0], clientY: pts[0][1], pointerId: 1, button: 0, preventDefault() {} });
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.round(d / 8));
    for (let s = 1; s <= steps; s++)
      canvas.dispatch('pointermove', { clientX: x0 + (x1 - x0) * s / steps, clientY: y0 + (y1 - y0) * s / steps, pointerId: 1, preventDefault() {} });
  }
  canvas.dispatch('pointerup', { clientX: 0, clientY: 0, pointerId: 1, preventDefault() {} });
}

/* per-level plans (game coords; viewport 400x700 => client==game). Water-routing
 * concept: catch the falling stream or shelf-edge drips on a shallow trough, then a
 * steeper pour segment ending INSIDE the glass mouth, clearing every obstacle/wall. */
const S = (a) => a; // one stroke = polyline
const PLANS = {
  1:  [S([[380, 100], [395, 110]])], // direct fall already lands in the mouth; tiny far-corner stroke exercises input
  2:  [S([[96, 160], [130, 180]]), S([[96, 300], [160, 340], [288, 538]])],
  3:  [S([[306, 180], [268, 200]]), S([[306, 300], [248, 340], [118, 536]])],
  4:  [S([[128, 445], [170, 480], [240, 538]])],
  5:  [S([[44, 300], [110, 340], [330, 536]])],
  6:  [S([[268, 330], [200, 372], [90, 548]])],
  7:  [S([[356, 300], [290, 340], [90, 546]])],
  8:  [S([[196, 240], [230, 270], [240, 390], [338, 546]])],
  9:  [S([[46, 280], [120, 330], [338, 546]])],
  10: [S([[175, 130], [235, 146]]), S([[235, 146], [335, 300]]), S([[398, 320], [280, 365]]), S([[280, 365], [240, 546]])],
  11: [S([[235, 120], [176, 140]]), S([[176, 140], [48, 205]]), S([[24, 300], [90, 556]])],
  12: [S([[356, 200], [280, 250], [240, 360], [90, 546]])],
  13: [S([[40, 276], [230, 480], [348, 556]])],
  14: [S([[190, 400], [230, 536]])],
  15: [S([[356, 140], [300, 165]]), S([[300, 165], [315, 400]]), S([[315, 400], [80, 556]])],
  16: [S([[196, 110], [235, 130], [365, 245]]), S([[395, 300], [330, 330], [240, 556]])],
  17: [S([[356, 150], [300, 175]]), S([[300, 175], [210, 320], [150, 420]]), S([[150, 420], [80, 556]])],
  18: [S([[92, 300], [89, 276]]), S([[92, 300], [135, 330], [242, 492], [338, 556]])],
  19: [S([[46, 390], [100, 420], [275, 455], [338, 556]])],
  20: [S([[196, 105], [245, 125], [345, 260]]), S([[375, 265], [320, 300], [315, 395], [245, 556]])],
  21: [S([[356, 140], [305, 165]]), S([[305, 165], [320, 400]]), S([[320, 400], [80, 556]])],
  22: [S([[235, 112], [176, 130]]), S([[235, 112], [238, 90]]), S([[176, 130], [38, 196]]), S([[12, 244], [95, 556]])],
  23: [S([[46, 420], [110, 450]]), S([[46, 420], [43, 398]]), S([[110, 450], [338, 556]])],
  24: [S([[196, 105], [245, 125]]), S([[245, 125], [365, 235]]), S([[398, 280], [330, 320]]), S([[330, 320], [240, 556]])],
  25: [S([[156, 330], [328, 548]])],
  26: [S([[356, 380], [280, 410]]), S([[356, 380], [359, 356]]), S([[322, 438], [240, 490], [95, 556]])],
  27: [S([[176, 118], [235, 134]]), S([[176, 118], [173, 96]]), S([[235, 134], [300, 350]]), S([[360, 365], [300, 392]]), S([[300, 392], [240, 556]])],
  28: [S([[46, 400], [110, 440]]), S([[46, 400], [43, 378]]), S([[110, 440], [370, 556]])],
  29: [S([[356, 380], [300, 420], [180, 470], [95, 556]]), S([[356, 380], [359, 356]])],
  30: [S([[196, 105], [235, 125], [360, 250]]), S([[390, 300], [320, 330], [240, 556]])],
};

// real input: title -> level select
g.els['playBtn'].dispatch('click'); g.pump(2);
T('title-to-select', call('__H.st()') === 'levelSelect', call('__H.st()'));
// first level via the real level-grid button (buildLevelGrid onclick=startLevel)
const gridBtns = g.els['levelGrid'].children;
gridBtns[0].click(); g.pump(2);
T('grid-click-starts', call('__H.st()') === 'playing' && call('__H.id()') === 1,
  'st=' + call('__H.st()') + ' id=' + call('__H.id()'));

const deadline = Date.now() + 100000;
const won = []; const unwon = []; const inkOver = [];
let chainOk = true; const log = [];
for (let i = 1; i <= N; i++) {
  if (call('__H.id()') !== i) { // chain broke (a level failed) -> direct load (allowed: load-injection)
    chainOk = chainOk && call('__H.id()') === i;
    if (call('__H.id()') !== i) { call('__H.start(' + i + ')'); g.pump(2); }
  }
  const lvDeadline = Math.min(deadline, Date.now() + 9000);
  for (const pts of PLANS[i]) stroke(pts);
  const drew = call('__H.strokes()');
  g.els['playPauseBtn'].dispatch('click'); // real toggleSim
  let frames = 0, ok = false, fillNow = 0;
  while (frames < 2400 && Date.now() < lvDeadline) {
    const r = call('__H.frames(60)');
    frames += r.f; fillNow = r.fill;
    if (r.won) { ok = true; break; }
    if (frames > 1100 && r.fill < 0.01) break; // provably dry — stop wasting budget
  }
  const ink = call('__H.ink()'), limit = call('__H.limit()');
  if (ink > limit + 1) inkOver.push(i);
  if (ok) {
    won.push(i); log.push('L' + i + '@' + frames);
    if (i < N) g.els['nextLevelBtn'].click(); // real handler -> startLevel(i+1)
  } else {
    unwon.push(i + '(fill=' + fillNow.toFixed(2) + ',drew=' + drew + ')');
    call('__H.start(' + Math.min(i + 1, N) + ')'); g.pump(2); // continue the sweep
    chainOk = false;
  }
  if (Date.now() >= deadline) { for (let k = i + 1; k <= N; k++) unwon.push(k + '(budget)'); break; }
}
T('levels-won', won.length === N, won.length + '/' + N + ' unwon:[' + unwon.join(',') + ']');
T('ink-within-limit', inkOver.length === 0, 'over:' + inkOver.join(','));
// after L30's win the real nextLevelBtn click goes back to the level select
if (won.includes(N)) { g.els['nextLevelBtn'].click(); g.pump(2); }
T('ends-levelselect', call('__H.st()') === 'levelSelect', call('__H.st()'));
// engine save: happyglass_v2 progress written by onWin's saveProgress
const ls = g.ls.getItem('happyglass_v2');
let savedOK = false;
try { const d = JSON.parse(ls); savedOK = d.maxLevel >= 30 && Object.keys(d.stars).length >= 30; } catch (e) {}
T('save-written', savedOK, ls ? String(ls).slice(0, 70) : 'none');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won.length + '/' + N, unwon: unwon.slice(0, 12), sample: log.slice(0, 8).join(' ') } };
console.log('happy-glass: ' + won.length + '/' + N + ' levels filled via real pointer strokes + engine onWin: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
