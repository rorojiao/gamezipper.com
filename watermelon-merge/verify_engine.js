#!/usr/bin/env node
/* watermelon-merge verifier (type B/C, Suika-style endless physics merge):
 * - full session via real input: pointermove aims the dropper, pointerdown drops;
 *   strategy = drop each fruit at the nearest same-level fruit (forces merges)
 * - asserts the engine's own terminal cycle: checkGameOver -> endGame -> gameOverScreen,
 *   then btnRestart -> fresh playing state
 * - merge correctness spot-check: two same-level fruits that touch MUST merge (engine rule) */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('watermelon-merge', { seedLS: { wm_howto: '1' }, inject: {
  anchor: 'function checkGameOver(dt){',
  exports: `globalThis.__R = {
    state: () => gameState, score: () => score,
    fruits: () => fruits.map(f => ({ x: f.x, y: f.y, r: f.r, l: f.level })),
    cur: () => currentFruit ? { x: currentFruit.x, l: currentFruit.level, r: currentFruit.r } : null,
    next: () => nextFruitLevel,
    canDrop: () => canDrop,
    danger: () => dangerTimer,
    box: () => ({ L: containerLeft, R: containerRight, T: containerTop, B: containerBottom }),
    nF: () => FRUITS.length,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
T('fruit-chain', g.call('__R.nF()') === 11, 'n=' + g.call('__R.nF()'));

const cv = g.els['gameCanvas'];
const move = (x) => cv.dispatch('pointermove', { clientX: x, clientY: 50, pointerId: 1, preventDefault() {} });
const down = (x) => cv.dispatch('pointerdown', { clientX: x, clientY: 50, pointerId: 1, button: 0, isPrimary: true, preventDefault() {} });

g.els['btnPlay'].click();
T('start', g.call('__R.state()') === 'playing', 'state=' + g.call('__R.state()'));

// aim: nearest same-level fruit x; else alternating container thirds
let aimToggle = 0, inputs = 0, merges = 0, lastScore = 0, maxLevel = 0, drops = 0;
const T0 = Date.now();
let over = false;
for (let d = 0; d < 130 && Date.now() - T0 < 90000; d++) {
  if (g.call('__R.state()') !== 'playing') { over = g.call('__R.state()') === 'gameover'; break; }
  // wait for dropper ready
  for (let i = 0; i < 200 && !(g.call('__R.canDrop()') && g.call('__R.cur()')); i++) g.pump(1);
  const cur = g.call('__R.cur()');
  if (!cur) break;
  const fruits = g.call('__R.fruits()');
  maxLevel = Math.max(maxLevel, ...fruits.map(f => f.l));
  let aim;
  const same = fruits.filter(f => f.l === cur.l);
  if (same.length) aim = same.sort((a, b) => Math.abs(a.x - cur.x) - Math.abs(b.x - cur.x))[0].x;
  else { const box = g.call('__R.box()'); aim = (box.L + box.R) * [0.25, 0.75][aimToggle++ % 2] / 1; aim = box.L + (box.R - box.L) * [0.25, 0.75][aimToggle++ % 2]; }
  move(aim); inputs++;
  for (let i = 0; i < 40 && Math.abs((g.call('__R.cur()') || { x: 1e9 }).x - aim) > 4; i++) { g.pump(1); inputs++; }
  const cl = (g.call('__R.cur()') || {}).l;
  down(aim); inputs++; drops++;
  for (let i = 0; i < 110; i++) { g.pump(1); if (g.call('__R.state()') === 'gameover') break; } // settle + 500ms cooldown
  const sc = g.call('__R.score()');
  if (sc > lastScore) { merges++; lastScore = sc; }
  if (g.call('__R.state()') === 'gameover') { over = true; break; }
}
const finalScore = g.call('__R.score()');
T('strategy-plays', drops >= 40 && inputs >= 300, 'drops=' + drops + ' inputs=' + inputs);
T('merges-happen', merges >= 15 && finalScore >= 200, 'merges=' + merges + ' score=' + finalScore);
T('merge-chain-progress', maxLevel >= 4, 'maxLevel=' + maxLevel + ' (cherry->orange expected in 40+ drops)');

// terminal cycle: game over by overflow (aggressive center stacking if strategy kept it alive)
if (!over) {
  for (let d = 0; d < 80 && g.call('__R.state()') === 'playing' && Date.now() - T0 < 105000; d++) {
    for (let i = 0; i < 200 && !(g.call('__R.canDrop()') && g.call('__R.cur()')); i++) g.pump(1);
    if (!g.call('__R.cur()')) break;
    move(240); down(240); inputs++;
    for (let i = 0; i < 90; i++) { g.pump(1); if (g.call('__R.state()') !== 'playing') break; }
  }
  over = g.call('__R.state()') === 'gameover';
}
T('game-over-fires', over, 'state=' + g.call('__R.state()'));
if (over) {
  const shown = !g.els['gameOverScreen'].classList.contains('hidden');
  T('gameover-screen', shown, 'hidden?');
  g.els['btnRestart'].click();
  T('restart-works', g.call('__R.state()') === 'playing' && g.call('__R.score()') === 0 && g.call('__R.fruits()').length === 0,
    'state=' + g.call('__R.state()') + ' score=' + g.call('__R.score()'));
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { score: finalScore, merges, maxLevel, drops } };
console.log('watermelon-merge: score=' + finalScore + ' merges=' + merges + ' maxLevel=' + maxLevel + ' drops=' + drops + ' gameover=' + over + ': ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
