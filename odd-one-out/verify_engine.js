#!/usr/bin/env node
/* odd-one-out engine verifier — real input paths only: every interaction is a canvas
   click at the same screen coordinates the engine's own hit-testing uses (play button,
   level grid, grid cells, hint/menu buttons). oddIdx is read via inject (the verifier
   "sees" the board) but every action is a real tap. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note }); if (!ok) console.error('  FAIL: ' + name + (note ? ' — ' + note : '')); };

const g = bootGame('odd-one-out', {
  inject: {
    anchor: 'function handleTap(e){',
    exports: `window.__O3 = {
      st: () => state, lvl: () => curLevel, odd: () => oddIdx, grid: () => grid,
      hints: () => hints, streak: () => streak, score: () => score, stars: () => totalStars,
      timeLeft: () => timeLeft, dim: () => [W, H], lvls: () => LEVELS, glow: () => hintGlow };`,
  },
});
const E = (id) => g.sandbox.document.getElementById(id);
const X = () => g.call('window.__O3');
const tap = (x, y) => E('c').dispatch('click', { clientX: x, clientY: y });
// grid geometry mirrored from engine getGridIndex
const gridGeom = () => {
  const [W, H] = X().dim();
  const n = X().lvls()[X().lvl()].grid;
  const pad = 20, avail = Math.min(W, H * 0.5) - pad * 2;
  const cs = avail / n, ox = (W - avail) / 2, oy = H * 0.22;
  return { W, H, n, cs, ox, oy };
};
const cellCenter = (idx) => { const { n, cs, ox, oy } = gridGeom(); return [ox + (idx % n) * cs + cs / 2, oy + Math.floor(idx / n) * cs + cs / 2]; };

T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('title-state', X().st() === 'title', X().st());

// play button
const [W0, H0] = X().dim();
tap(W0 / 2, H0 * 0.55 + 26);
g.pump(2);
T('levels-state', X().st() === 'levels', X().st());

// locked level tap (idx 2 locked at curLevel 0) must not start
{
  const cols = 6, bw = Math.min(60, (W0 - 40) / cols - 8), bh = bw;
  const pad = (W0 - cols * (bw + 8) - 8) / 2, oy = H0 * 0.22;
  tap(pad + 2 * (bw + 8) + 4 + bw / 2, oy + 0 * (bh + 12) + 4 + bh / 2); // level 3 (idx 2)
  g.pump(2);
  T('locked-level-ignored', X().st() === 'levels', X().st());
  // unlocked level 1 (idx 0)
  tap(pad + 0 * (bw + 8) + 4 + bw / 2, oy + 4 + bh / 2);
  g.pump(2);
}
T('level-started', X().st() === 'playing' && X().lvl() === 0, X().st() + ' lvl=' + X().lvl());

// odd cell must be visually distinguishable on every level of the run
const oddDistinguishable = () => {
  const grid = X().grid();
  const odd = grid[X().odd()];
  const rest = grid.find((it, i) => i !== X().odd());
  if (odd.type === 'color') return Math.abs(odd.l - rest.l) >= 5;
  if (odd.type === 'emoji') return odd.char !== rest.char;
  if (odd.type === 'letter') return odd.char !== rest.char;
  if (odd.type === 'number') return odd.val !== rest.val;
  if (odd.type === 'shape') return Math.abs(odd.rot - rest.rot) >= 15;
  return false;
};

// wrong tap on tutorial level: streak stays 0, no penalty (untimed)
{
  const n = gridGeom().n;
  const wrong = (X().odd() + 1) % (n * n);
  tap(...cellCenter(wrong));
  g.pump(3);
  T('wrong-tap-no-crash', X().st() === 'playing' && X().streak() === 0, X().st());
}

// hint button
{
  const [W, H] = X().dim();
  const hintsBefore = X().hints();
  tap(W - 55, H - 55);
  g.pump(3);
  T('hint-used', X().hints() === hintsBefore - 1 && X().glow() === X().odd(), 'hints=' + X().hints());
  const prog = JSON.parse(g.sandbox.localStorage.getItem('ooo_progress') || '{}');
  T('hint-persisted', prog.hints === hintsBefore - 1, JSON.stringify(prog));
  g.pump(70); // hint glow expires (60 frames)
  T('hint-expires', X().glow() === -1);
}

// menu button -> levels, then back into level 1
{
  const [W, H] = X().dim();
  tap(30, H - 55);
  g.pump(2);
  T('menu-to-levels', X().st() === 'levels', X().st());
  const cols = 6, bw = Math.min(60, (W - 40) / cols - 8), bh = bw;
  const pad = (W - cols * (bw + 8) - 8) / 2, oy = H * 0.22;
  tap(pad + 0 * (bw + 8) + 4 + bw / 2, oy + 4 + bh / 2);
  g.pump(2);
  T('re-enter-level', X().st() === 'playing' && X().lvl() === 0);
}

// ---- full 30-level run ----
let expScore = 0, runOk = true, levelsSeen = 0;
for (let step = 0; step < 200 && X().st() !== 'allDone'; step++) {
  const st = X().st();
  if (st === 'playing') {
    if (!oddDistinguishable()) { T('odd-visible-lvl' + X().lvl(), false, 'odd indistinguishable'); runOk = false; break; }
    levelsSeen++;
    const odd = X().odd();
    const streak = X().streak();
    expScore += 100 + (streak + 1) * 10; // engine increments streak before scoring
    tap(...cellCenter(odd));
    g.pump(45);
  } else if (st === 'complete') {
    const [W, H] = X().dim();
    tap(W / 2, H * 0.65 + 10); // CONTINUE
    g.pump(3);
  } else if (st === 'levels') {
    // timer-fail + wrong-tap test on the first timed level (idx 6), once
    const cols = 6, bw = Math.min(60, (X().dim()[0] - 40) / cols - 8), bh = bw;
    const pad = (X().dim()[0] - cols * (bw + 8) - 8) / 2, oy = X().dim()[1] * 0.22;
    const row = Math.floor(X().lvl() / 6), col = X().lvl() % 6;
    tap(pad + col * (bw + 8) + 4 + bw / 2, oy + row * (bh + 12) + 4 + bh / 2);
    g.pump(3);
    if (X().st() !== 'playing') { T('level-enter-' + X().lvl(), false, X().st()); runOk = false; break; }
    if (X().lvl() === 6 && X().lvls()[6].time > 0) {
      // wrong tap: -3s penalty
      const n = gridGeom().n;
      const tBefore = X().timeLeft();
      tap(...cellCenter((X().odd() + 1) % (n * n)));
      g.pump(3);
      if (!(X().timeLeft() <= Math.max(0, tBefore - 3) + 0.01)) { T('wrong-penalty', false, X().timeLeft() + ' vs ' + tBefore); runOk = false; break; }
      // let the timer expire -> back to levels, level not completed
      g.pump(1900);
      if (!(X().st() === 'levels' && X().lvl() === 6)) { T('timer-fail', false, X().st() + ' lvl=' + X().lvl()); runOk = false; break; }
      // replay properly
      tap(pad + col * (bw + 8) + 4 + bw / 2, oy + row * (bh + 12) + 4 + bh / 2);
      g.pump(3);
    }
  } else { T('unexpected-state', false, st); runOk = false; break; }
}
T('run-complete', runOk && X().st() === 'allDone' && levelsSeen >= 30, X().st() + ' seen=' + levelsSeen);
T('all-levels-cleared', X().lvl() === 30, 'lvl=' + X().lvl());
T('stars-90', X().stars() === 90, 'stars=' + X().stars());
T('score-accumulated', X().score() === expScore, X().score() + ' vs ' + expScore);
{
  const stars = JSON.parse(g.sandbox.localStorage.getItem('ooo_stars') || '{}');
  const all3 = Array.from({ length: 30 }, (_, i) => stars[i] === 3).every(Boolean);
  T('stars-persisted-3each', all3, JSON.stringify(stars).slice(0, 120));
  const prog = JSON.parse(g.sandbox.localStorage.getItem('ooo_progress') || '{}');
  T('progress-persisted', prog.cur === 30 && prog.stars === 90, JSON.stringify(prog));
}

// allDone -> tap PLAY AGAIN -> levels, all unlocked
{
  const [W, H] = X().dim();
  tap(W / 2, H * 0.6 + 10);
  g.pump(2);
  T('allDone-to-levels', X().st() === 'levels');
  // every level unlocked now: tap level 30 (idx 29)
  const cols = 6, bw = Math.min(60, (W - 40) / cols - 8), bh = bw;
  const pad = (W - cols * (bw + 8) - 8) / 2, oy = H * 0.22;
  const row = Math.floor(29 / 6), col = 29 % 6;
  tap(pad + col * (bw + 8) + 4 + bw / 2, oy + row * (bh + 12) + 4 + bh / 2);
  g.pump(3);
  T('replay-any-level', X().st() === 'playing' && X().lvl() === 29, X().st() + ' lvl=' + X().lvl());
}

// fresh boot loads persisted progress (seedLS = returning-player localStorage)
{
  const g2 = bootGame('odd-one-out', {
    inject: { anchor: 'function handleTap(e){', exports: 'window.__O3 = { lvl: () => curLevel, stars: () => totalStars }' },
    seedLS: Object.fromEntries(Object.entries(g.sandbox.localStorage._m)),
  });
  g2.pump(2);
  T('reload-progress', g2.call('window.__O3.lvl()') === 30 && g2.call('window.__O3.stars()') === 90, g2.call('window.__O3.lvl()') + '/' + g2.call('window.__O3.stars()'));
}

const pass = results.filter(r => r.ok).length;
const fails = results.filter(r => !r.ok).map(r => r.name);
console.log('odd-one-out: 30 levels via real taps + timer/hint/lock paths: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { fixes: 'P1 pizza emoji alt identical (unwinnable emoji levels), P1 progress never saved on completion, P2 final level stars never recorded' } }));
process.exit(fails.length ? 1 : 0);
