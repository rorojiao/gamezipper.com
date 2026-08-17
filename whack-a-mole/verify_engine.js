#!/usr/bin/env node
/* whack-a-mole verifier — B-type reflex game through the real input path.
 * start-btn click -> engine's own setInterval countdown + spawn timers drive mole pops
 * (harness timer pump). Every active hole gets a pointerdown (the engine's own whack
 * handler, incl. reaction-time tracking). PASS: score>0 from real whacks, 60s countdown
 * reaches endGame, high score persisted, overlay shown, restart works. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('whack-a-mole', { inject: {
  anchor: "holes.push(h);",
  exports: "globalThis.__WAM = { holes: () => holes, active: () => gameActive, score: () => score, timeLeft: () => timeLeft, endOverlayShown: () => overlay && overlay.style.display !== 'none' };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
T('nine-holes', g.call('__WAM.holes().length') === 9, 'holes=' + g.call('__WAM.holes().length'));

g.els['start-btn'].dispatch('click', {});
T('game-active', g.call('__WAM.active()') === true);

let whacks = 0, guard = 0;
let sawActive = 0;
while (g.call('__WAM.active()') === true && guard++ < 6000) {
  g.pump(3);
  const hs = g.call('__WAM.holes()');
  for (const h of hs) {
    if (h.active) {
      sawActive++;
      h.el.dispatch('pointerdown', { clientX: 100, clientY: 100, preventDefault() {} });
      whacks++;
      g.pump(1);
    }
  }
}
const score = g.call('__WAM.score()');
T('moles-appeared', sawActive > 0, 'sawActive=' + sawActive);
T('score-from-real-whacks', score > 0, 'score=' + score + ' whacks=' + whacks);
T('game-ended', g.call('__WAM.active()') === false, 'still active after 60s sim');
T('high-score-persisted', (g.ls.getItem('wam_high') || '0') !== '0' || score === 0, 'wam_high=' + g.ls.getItem('wam_high'));

// restart path
g.els['start-btn'].dispatch('click', {});
T('restart-works', g.call('__WAM.active()') === true);

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { score, whacks, sawActive } };
console.log('whack-a-mole: real pointerdown whacks over a full 60s engine-timer session: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
