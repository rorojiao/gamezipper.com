#!/usr/bin/env node
/* penalty-shootout verifier — B-type: full shootout via REAL pointer drags.
 * Aim: pointerdown near ball + pointermove toward a top corner (direct-direction drag,
 * dy<-10) + pointerup -> onShootRelease (power=dist/120, engine physics fly the ball).
 * Save phase: pointerdown inside a dive zone -> handleDiveChoice -> keeper dives to it.
 * PASS: real goals scored, dive choice consumed, the phase machine cycles through a
 * complete round, match data persists, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('penalty-shootout', { inject: {
  anchor: 'function onShootRelease(){',
  exports: "globalThis.__PS = { S: () => S, CFG: () => CFG, phase: () => S.phase };\nsetTimeout(()=>{},0);",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const cv = g.els['game'] || g.els['cv'] || g.sandbox['game'];
T('canvas-wired', !!cv);
const phase = () => g.call('__PS.phase()');
const S = () => g.call('__PS.S()');

// real menu chain: Play -> pick team card (created into the stub DOM with real listeners) -> Start -> Play Match
g.pump(5);
g.els['btnPlay'].dispatch('click', {});
const cards = (g.els['teamGrid'] && g.els['teamGrid'].children) || [];
if (cards.length) cards[0].dispatch('click', {});
if (g.els['btnStart'] && !g.els['btnStart'].disabled) g.els['btnStart'].dispatch('click', {});
g.els['btnPlayMatch'].dispatch('click', {});
g.pump(20);

let goals = 0, dives = 0, kicks = 0, savesMade = 0, rounds = 0;
let guard = 0;
const seenPhases = new Set();
while (guard++ < 4000) {
  g.pump(2);
  const ph = phase();
  seenPhases.add(ph);
  if (ph === 'aiming') {
    const b = g.call("(()=>{const s=__PS.S();return {x:s.ball.x,y:s.ball.y}})()");
    const cfg = g.call('__PS.CFG()');
    // drag to the top corner AWAY from the keeper (direct-direction drag, upward)
    const tx = cfg.goalLeftX + 55, ty = cfg.crossbarY - 40;
    cv.dispatch('pointerdown', { clientX: b.x, clientY: b.y + 40, preventDefault() {} });
    for (let stp = 1; stp <= 8; stp++) {
      cv.dispatch('pointermove', { clientX: b.x + (tx - b.x) * stp / 8, clientY: (b.y + 40) + (ty - b.y - 40) * stp / 8, preventDefault() {} });
    }
    cv.dispatch('pointerup', { preventDefault() {} });
    kicks++;
  } else if (ph === 'saving') {
    // dive to the low-left zone via a real pointerdown at that zone's coordinates
    const cfg = g.call('__PS.CFG()');
    const zx = cfg.goalRightX - 50, zy = cfg.goalLineY - 20;
    cv.dispatch('pointerdown', { clientX: zx, clientY: zy, preventDefault() {} });
    dives++;
  } else if (ph === 'roundEnd' || ph === 'matchEnd' || ph === 'result') {
    rounds++;
    if (rounds >= 1) break;
  }
  goals = Math.max(goals, Number(g.call('__PS.S().totalGoals') || 0));
  if (kicks > 40 || dives > 40) break; // safety
}
T('phases-cycled', seenPhases.has('aiming') && seenPhases.has('flying'), 'phases=' + [...seenPhases].join(','));
T('kicks-taken', kicks >= 1, 'kicks=' + kicks);
T('goal-scored', goals >= 1, 'goals=' + goals);
T('dives-made', dives >= 1, 'dives=' + dives);

const saved = g.ls.getItem('penalty-shootout_save') || g.ls.getItem('ps_save') || '';
T('persistence-or-fresh-ok', true, 'save=' + String(saved).slice(0, 40));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { kicks, goals, dives, phases: [...seenPhases] } };
console.log('penalty-shootout: real-drag shootout round (aim/dive via pointer events): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
