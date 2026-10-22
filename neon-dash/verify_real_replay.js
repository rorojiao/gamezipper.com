#!/usr/bin/env node
/* R970 neon-dash: DOUBLE-VALIDATION harness.
 *
 *  Layer 1 (verify_solvable.js) is an independent re-implementation of the engine's
 *  physics. It must not be trusted alone, so this file replays the plan Layer 1
 *  produces through the REAL engine source inside the VM harness, one frame at a
 *  time, using the engine's own keydown -> handleAction() -> inputJustPressed path.
 *  If the real engine agrees the plan completes, the model is faithful; if the real
 *  engine dies on a plan the model called solvable, the MODEL is wrong (not the game).
 *
 *  Also reports, for every level, whether the real engine can be driven to completion
 *  with the offline plan, and what happens on the levels Layer 1 called NO_PATH.
 */
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const planner = require('./plan-lib.js');

const g = bootGame('neon-dash', { inject: {
  anchor: 'function getLevelLength() {',
  exports: "globalThis.__ND = { st: () => gameState, lvl: () => currentLevelIdx, px: () => player.x, " +
           "py: () => player.y, alive: () => player.alive, grounded: () => player.grounded, " +
           "mode: () => player.mode, deaths: () => saveData.totalDeaths, unlocked: () => saveData.unlockedLevel, " +
           "stars: () => saveData.stars, start: (i) => startLevel(i), ret: () => { resetLevel(); setGameState('playing'); } };",
} });
const doc = g.sandbox.document;
const tap = () => { doc.dispatch('keydown', { code: 'Space', key: ' ', preventDefault() {} });
                    doc.dispatch('keyup', { code: 'Space', key: ' ', preventDefault() {} }); };

/* Frame alignment: the plan assumes the first plan decision lands on the very first
 * engine frame after startLevel (px == START_X). The harness needs a few pumps for the
 * engine to settle, and each of those frames advances px, so without this correction the
 * whole plan is replayed out of phase and the player jumps into hazards that the plan
 * already accounted for. Realign by reading the engine's own px and skipping exactly the
 * frames the engine already consumed. */
const START_X = (function () {
  const m = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8')
    .match(/x:\s*([\d.]+),\s*y:\s*GROUND_Y\s*-\s*PLAYER_SIZE/);
  return m ? parseFloat(m[1]) : 100;
})();

/* Offset handling: the plan assumes plan[0] lands on the first engine frame at
 * px == START_X. player.x only ever increases, so there is nothing to "align" back to —
 * pumping to reach START_X would just run the player into the first obstacle while alive.
 * Instead read px once after startLevel and start applying the plan at the matching index
 * (see offsetFrames below). An earlier version of this file tried to walk px back to
 * START_X, ran 60 blind frames, killed the player, and then reported MODEL-DIVERGES. */

let agree = 0, disagree = 0; const rows = [];
const planByLvl = planner.planAll(20000);
const ONLY_SOLVABLE = process.argv.includes('--solvable-only');
const todo = planByLvl.map((r, i) => i).filter(i => !ONLY_SOLVABLE || planByLvl[i].solvable);
console.log('replaying ' + todo.length + '/' + planByLvl.length + ' levels (START_X=' + START_X + ')');

for (const i of todo) {
  const lvl = i + 1;
  const rec = planByLvl[i];
  const plan = rec.plan || '';   // rec is the plan object; the string lives on .plan
  // fresh level, practice OFF (so the plan is the honest no-assist route)
  g.call('__ND.start(' + i + ')');
    // Frame-phase alignment. The planner's plan[k] is the decision applied on the
    // transition START_X + k*speed -> START_X + (k+1)*speed, i.e. the FIRST engine
    // update() after startLevel already consumes plan[0].
    //
    // This harness used to call pump(1) before reading px, which silently consumed
    // the 100->104 transition with NO input and then applied plan[0] one frame late.
    // Every subsequent decision was therefore out of phase, which is what produced
    // the bogus "MODEL-DIVERGES on all 4 solvable levels" verdict. resetLevel()
    // hardcodes player.x = 100, so the offset is exactly 0 and NO pre-pump is
    // correct. The px assertion below fails loudly if the engine ever changes that.
    const pxAtStart = g.call('__ND.px()');
    if (Math.abs(pxAtStart - START_X) > 0.001) {
      console.error(`ABORT: engine start x=${pxAtStart} != planner START_X=${START_X}; plan phase would be wrong`);
      process.exit(2);
    }

    const st0 = g.call('__ND.st()');
    const speed = planner.LEVELS[i].speed || 6;
    let died = false, completed = false, steps = 0;
    const offsetFrames = 0;
    for (let f = 0; f < plan.length + 120; f++) {
      if (plan[f] === 'J') tap();
      if (plan[f] === 'H') { doc.dispatch('keydown', { code: 'Space', key: ' ', preventDefault() {} }); }
      if (plan[f] === '.') doc.dispatch('keyup', { code: 'Space', key: ' ', preventDefault() {} });
      g.pump(1);
      steps++;
      const st = g.call('__ND.st()');
      if (st === 'complete' || st === 'levelComplete') { completed = true; break; }
      if (!g.call('__ND.alive()')) { died = true; break; }
    }
  doc.dispatch('keyup', { code: 'Space', key: ' ', preventDefault() {} });
  const realLvl = g.call('__ND.lvl()');
  const verdict = rec.solvable
    ? (completed ? 'CONFIRMED' : (died ? 'MODEL-WRONG(died)' : 'MODEL-WRONG(timeout)'))
    : (plan.length === 0 ? 'INCONCLUSIVE(offline-search-unfinished)' : (died ? 'CONFIRMED-UNWINNABLE' : 'INCONCLUSIVE'));
  if (verdict.startsWith('CONFIRMED')) agree++; else if (verdict.startsWith('MODEL-WRONG')) disagree++;
  rows.push({ lvl, name: planner.LEVELS[i].name, offlineSolvable: rec.solvable,
    offlineWhy: rec.why || '', planLen: plan.length, pxAtStart, offsetFrames,
    realVerdict: verdict, frames: steps, startState: st0, engineLevel: realLvl });
  process.stdout.write(`L${String(lvl).padStart(2)} ${planner.LEVELS[i].name.padEnd(19).slice(0,19)} offline=${(rec.solvable ? 'SOLVABLE' : rec.why).padEnd(9)} px0=${pxAtStart} off=${offsetFrames} real=${verdict.padEnd(24)} frames=${steps} deaths=${g.call('__ND.deaths()')}\n`);
}

// post-run persistence check through the engine's own writeSave
const unlocked = g.call('__ND.unlocked()');
const stars = g.call('__ND.stars()');
const lsRaw = g.sandbox.localStorage.getItem('neonDashSave');
console.log(JSON.stringify({
  agree, disagree, total: planner.LEVELS.length,
  verdict: disagree === 0 ? 'MODEL-FAITHFUL' : 'MODEL-DIVERGES',
  unlockedLevel: unlocked, stars,
  saveRaw: String(lsRaw).slice(0, 220),
  rows,
}, null, 1));
process.exit(disagree === 0 ? 0 : 1);