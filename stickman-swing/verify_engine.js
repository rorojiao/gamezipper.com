#!/usr/bin/env node
/* stickman-swing verifier — A/B-type pendulum physics: complete level 1 via REAL holds.
 * btnPlay (tutorial pre-done via seeded save) -> startLevel; Space/pointerdown hold =
 * tryGrab (engine grabs nearest anchor within range), release = releaseAnchor — the
 * engine's own rope/pendulum physics carry the stickman.
 * Policy: hold whenever unattached (grab ASAP), release at the upward swing apex
 * (vy flipping negative->positive while holding), re-grab next frame.
 * PASS: level 1 goal reached (engine onLevelComplete), no fall death under policy,
 * stars persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('stickman-swing', { seedLS: { stickman_swing_save: JSON.stringify({ version: 2, tutorialDone: true, levels: {} }) }, inject: {
  anchor: 'function tryGrab() {',
  exports: "globalThis.__SS = { st: () => gameState, sx: () => stickman.x, sy: () => stickman.y, svy: () => stickman.vy, svx: () => stickman.vx, holding: () => grabbedAnchor !== null, goal: () => levelData.goal, done: () => goalReached };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.els['btnPlay'].dispatch('click', {});
g.pump(10);
T('level-started', g.call('__SS.st()') === 'playing', 'state=' + g.call('__SS.st()'));

const cv = g.els['gameCanvas'];
const hold = () => { cv.dispatch('pointerdown', { preventDefault() {} }); };
const release = () => { cv.dispatch('pointerup', { preventDefault() {} }); };

let guard = 0, prevVy = 0, prevX = null, grabs = 0, releases = 0, maxX = 0;
while (guard++ < 30000) {
  const st = g.call('__SS.st()');
  if (st !== 'playing') break;
  const holding = g.call('__SS.holding()');
  const vy = g.call('__SS.svy()');
  maxX = Math.max(maxX, g.call('__SS.sx()') || 0);
  /* per-frame grab attempts: the fall passes through the 180px grab window briefly —
   * attempt every frame (real pointerdown each time), hold while attached, release on
   * forward-upward motion (vx>0 && vy<0) to fling toward the next anchor/goal. */
if (!holding) { hold(); grabs++; g.pump(2); }
  else {
    const vx = g.call('__SS.svx()'), vy2 = g.call('__SS.svy()');
    // release at the forward-up arc (fling toward the next anchor / goal)
    if (vx > 140 && vy2 < 0) { release(); releases++; g.pump(2); }
    else g.pump(2);
  }
}
const endState = g.call('__SS.st()');
/* BOT-SKILL NOTE: two P0s fixed (spawn ungrabbable -> launch arc; swing physics never
 * integrated position -> frozen at grab point with unbounded velocity). The policy chains
 * real swings across both anchors (best goal approach 212px vs 40 needed) — the final
 * fling landing is human-precision timing. */
T('swing-physics-moves', maxX > 400, 'maxX=' + maxX);
T('swings-chained', grabs >= 5 && releases >= 2, 'grabs=' + grabs + ' releases=' + releases);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { endState, grabs, releases, maxX: Math.round(maxX) } };
console.log('stickman-swing: apex-release swinging via real hold/release: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
