#!/usr/bin/env node
/* moto-x3m ALL-LEVELS sweep (R349 QA extension).
 * verify_engine.js drives only level 1 of 25. This sibling drives EVERY level through the
 * real engine: startLevel(idx) -> ArrowUp hold + adaptive lean (angle-based ArrowLeft/Right
 * real key events) + wall strategy (brake/reverse out of wall contact, re-approach with
 * forward lean for ramp jumps) -> engine auto-respawn on crash -> completeLevel via state.
 * Levels that exhaust the frame guard are UNRESOLVED (never silently PASS). Exit 0 iff all
 * solved; exit 2 if any unresolved. Terrain is fully static/deterministic (Math.random only
 * in audio/particles), so results are reproducible. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('moto-x3m', { seedLS: { motox3m_save_v1: JSON.stringify({ version: 1, currentLevel: 1, stars: {}, bestTimes: {}, tutorialShown: true }) }, inject: {
  anchor: 'function completeLevel(level){',
  exports: "globalThis.__MX2 = { state: () => state, bike: () => bike, dead: () => dead, nLevels: () => LEVELS.length, finish: () => LEVELS[currentLevelIdx].finishX, start: (i) => { currentLevelIdx = i; startLevel(); }, walls: () => LEVELS[currentLevelIdx].obstacles.filter(o => o.type === 'wall').map(o => o.x), grounded: () => (typeof grounded !== 'undefined' ? grounded : false) };",
} });
if (g.loadErrors.length) { console.error('load errors:', g.loadErrors[0]); process.exit(1); }
const st = () => g.call('__MX2.state()');
const key = (c, type) => { g.sandbox.document.dispatch(type, { code: c, key: c, preventDefault() {} }); };
const held = new Set();
const hold = (c, on) => { if (on && !held.has(c)) { held.add(c); key(c, 'keydown'); } else if (!on && held.has(c)) { held.delete(c); key(c, 'keyup'); } };

const N = g.call('__MX2.nLevels()');
const solved = [], unresolved = [];
for (let i = 0; i < N; i++) {
  g.call(`__MX2.start(${i})`);
  if (st() !== 'playing') { unresolved.push(i + 1 + ':start-fail'); continue; }
  const finish = g.call('__MX2.finish()');
  let guard = 0, maxX = 0, reverseFrames = 0, deaths = 0, wasDead = false;
  let lean = null, rev = false;
  hold('ArrowUp', true);
  while (st() === 'playing' && guard++ < 25000) {
    const b = g.call("(()=>{const b=__MX2.bike();return {x:b.x,vx:b.vx,ang:b.angle}})()");
    if (g.call('__MX2.dead()')) { if (!wasDead) deaths++; wasDead = true; } else wasDead = false;
    if (b.x > maxX + 3) maxX = b.x;
    const walls = g.call('__MX2.walls()');
    const nearWall = walls.find(wx => b.x > wx - 90 && b.x < wx + 40);
    const stalled = Math.abs(b.vx) < 25 && g.call('__MX2.grounded()');
    rev = nearWall !== undefined && stalled && (b.x > nearWall - 90);
    if (rev) {
      hold('ArrowUp', false); hold('ArrowDown', true); reverseFrames++;
      if (reverseFrames > 45) { reverseFrames = 0; hold('ArrowDown', false); hold('ArrowUp', true); }
    } else {
      hold('ArrowDown', false); hold('ArrowUp', true); reverseFrames = 0;
      const approaching = nearWall !== undefined;
      const want = (b.ang < -0.15 || approaching) ? 'ArrowRight' : b.ang > 0.15 ? 'ArrowLeft' : null;
      if (want !== lean) { if (lean) hold(lean, false); if (want) hold(want, true); lean = want; }
    }
    g.pump(1);
    if (st() === 'levelComplete') break;
  }
  for (const c of held) key(c, 'keyup'); held.clear(); lean = null;
  if (st() === 'levelComplete') solved.push(i + 1);
  else unresolved.push((i + 1) + '(maxX=' + Math.round(maxX) + '/fin=' + finish + ' deaths=' + deaths + ')');
}
const out = { levels: N, solved: solved.length, unresolved, verdict: solved.length === N ? 'PASS' : 'CHECK' };
console.log('moto-x3m all-levels drive: ' + out.solved + '/' + N + ' solved, unresolved=' + JSON.stringify(out.unresolved) + ', verdict=' + out.verdict);
console.log(JSON.stringify(out));
process.exit(solved.length === N ? 0 : 2);
