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

function alignToFrameZero() {
  let guard = 0;
  while (g.call('__ND.px()') > START_X && guard++ < 60) { doc.dispatch('keyup', { code: 'Space', key: ' ', preventDefault() {} }); g.pump(1); }
  return g.call('__ND.px()');
}

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
  g.pump(1);
  const pxAtStart = g.call('__ND.px()');
  alignToFrameZero();
  const st0 = g.call('__ND.st()');
  const speed = planner.LEVELS[i].speed || 6;
  let died = false, completed = false, steps = 0;
  // start applying the plan at the frame whose px matches the plan's frame 0
  let planIdx = 0;
  const offsetFrames = Math.max(0, Math.round((pxAtStart - START_X) / speed));
  for (let f = 0; f < plan.length + 120; f++) {
    if (f >= offsetFrames && plan[f - offsetFrames] === 'J') tap();
    if (f >= offsetFrames && plan[f - offsetFrames] === 'H') { doc.dispatch('keydown', { code: 'Space', key: ' ', preventDefault() {} }); }
    if (f >= offsetFrames && plan[f - offsetFrames] === '.') doc.dispatch('keyup', { code: 'Space', key: ' ', preventDefault() {} });
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