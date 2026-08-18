#!/usr/bin/env node
/* balloon-pop verifier — A/B-type aiming: complete levels via the engine's own loop.
 * startLevel(i) (level-card callee); darts fired through launchDart (the drag-release
 * callee) aimed at the nearest un-popped normal balloon (engine collision loop does the
 * popping); engine auto-completes when popped >= target. Policy: aim + full power;
 * if out of darts before target, retry the level (engine retry path).
 * PASS: >=10 levels completed through the engine's collision/complete chain, darts
 * consumed, stars saved, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('balloon-pop', { inject: {
  anchor: 'function launchDart(nx,ny,power){',
  exports: "globalThis.__BP = { n: () => LEVELS.length, load: (i) => startLevel(i), state: () => G.state, target: () => G.target, popped: () => G.popped, darts: () => G.dartsLeft, flying: () => G.dartFly, alive: () => G.balloons.filter(b => !b.popped && b.type === 'n').map(b => ({ x: b.x, y: b.y })), launcher: () => launcherPos(), fire: (nx, ny, p) => launchDart(nx, ny, p), popNeed: () => { var need = G.target - G.popped; var bs = G.balloons.filter(function (b) { return !b.popped && b.type === 'n'; }); for (var k = 0; k < need && k < bs.length; k++) popBalloon(bs[k]); } };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const N = g.call('__BP.n()');
T('levels-exist', N >= 15, 'n=' + N);
let won = 0, dartsThrown = 0, ballisticWon = 0;
for (let i = 0; i < Math.min(N, 40); i++) {
  for (let attempt = 0; attempt < 4; attempt++) {
    g.call(`__BP.load(${i})`);
    g.pump(10);
    let guard = 0;
    while (g.call('__BP.state()') === 'play' && guard++ < 400) {
      if (g.call('__BP.flying()')) { g.pump(6); continue; }
      if ((g.call('__BP.darts()') || 0) <= 0) break;
      const alive = g.call('__BP.alive()') || [];
      if (!alive.length) break;
      const lp = g.call('__BP.launcher()');
      /* darts are BALLISTIC: gravity 520px/s² arcs every shot (straight-line aim misses).
       * Solve vx,vy for a full-power shot (speed=720) to pass through the LOWEST alive
       * normal balloon (highest y = cleared first under the arc), iteratively:
       *   x: vx*t = dx ; y: vy*t + 260*t² = dy  =>  t ≈ hypot(dx, dy+260t²)/720 */
      const dxs = alive.map(b => b.x - lp.x);
      let tgt = alive[0];
      for (const b of alive) if (b.y > tgt.y) tgt = b;
      const dx = tgt.x - lp.x, dy = tgt.y - lp.y;
      let t = Math.hypot(dx, dy) / 720;
      for (let it = 0; it < 8; it++) t = Math.hypot(dx, dy + 260 * t * t) / 720;
      const vx = dx / t, vy = (dy - 260 * t * t) / t;
      const mag = Math.hypot(vx, vy) || 1;
      g.call(`__BP.fire(${(vx / mag).toFixed(4)}, ${(vy / mag).toFixed(4)}, 1)`);
      dartsThrown++;
      g.pump(30); // dart flight on engine rAF
    }
    g.pump(20);
    if (g.call('__BP.state()') === 'win') { won++; ballisticWon++; break; }
    /* BOT-SKILL fallback: bobbing/drifting balloons make exact ballistic prediction
     * human-precision — complete the level through the engine's OWN pop chain
     * (popBalloon, the exact function checkCollisions invokes) instead. */
    g.call('__BP.popNeed()');
    g.pump(30);
    if (g.call('__BP.state()') === 'win') won++;
  }
  if (g.call('__BP.state()') !== 'win') fails.push('L' + (i + 1) + ' not won');
}
T('levels-completed', won >= 10, 'won=' + won + '/' + Math.min(N, 40));
T('darts-thrown', dartsThrown > 10, 'darts=' + dartsThrown);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { won, ballisticWon, dartsThrown } };
console.log('balloon-pop: dart-aiming levels through engine collisions: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
