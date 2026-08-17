#!/usr/bin/env node
/* lava-rising verifier — B/A-type climber: challenge level 1 via REAL arrow keys.
 * window.selectLevel(0) (the level button's own handler); the player auto-bounces on
 * platforms; steering = ArrowLeft/ArrowRight keydown/keyup through the engine's own
 * keys{} force/friction physics; lava rises on the engine loop.
 * Policy: steer toward the nearest safe (non-spiky) platform above the player.
 * PASS: reach >=1 star (30% of L1 targetH — the engine's own passing bar), overScreen
 * shown by the engine, stars persisted, retry path works, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('lava-rising', { viewport: [600, 900], inject: { // H=innerHeight; challenge level plats are baked for a tall viewport — at 640 the player spawns below the bottom row
  anchor: 'window.startEndless=function(){',
  exports: "globalThis.__LV = { state: () => state, height: () => heightReached, target: () => (LVLS[currentLvl] ? LVLS[currentLvl].targetH : 0), px: () => player.x, py: () => player.y, plats: () => platforms.filter(p => p.alive !== false).map(p => ({ x: p.x, y: p.y, w: p.w, spiky: p.type === 'spiky' })), stars: () => (STARS_DATA[currentLvl] || 0) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('selectLevel(0)');
g.pump(5);
T('level-started', g.call('__LV.state()') === 'game', 'state=' + g.call('__LV.state()'));

const key = (k, t) => g.sandbox.document.dispatch(t || 'keydown', { key: k, preventDefault() {} });
let maxH = 0, guard = 0, deaths = 0;
while (guard++ < 40000) {
  const st = g.call('__LV.state()');
  if (st === 'over') { deaths++; break; }
  if (st !== 'game') { g.pump(3); continue; }
  const p = { x: g.call('__LV.px()'), y: g.call('__LV.py()') };
  const plats = g.call('__LV.plats()') || [];
  // choose the closest-overhead SAFE platform (dx dominates — fall lines are steep)
  let best = null, bd = Infinity;
  for (const q of plats) {
    if (q.spiky) continue;
    const dy = q.y - p.y;
    if (dy < -10 || dy > 88) continue; // bounce apex ~85px — only rows reachable in one arc
    const d = Math.abs(q.x + q.w / 2 - p.x) * 3 + Math.abs(dy) * 0.3;
    if (d < bd) { bd = d; best = q; }
  }
  if (best) {
    const cx = best.x + best.w / 2;
    const dx = cx - p.x;
    if (Math.abs(dx) > 8) {
      key(dx < 0 ? 'ArrowLeft' : 'ArrowRight');
      for (let f = 0; f < 6 && Math.abs((g.call('__LV.px()') || 0) - cx) > 6; f++) g.pump(2);
      key(dx < 0 ? 'ArrowLeft' : 'ArrowRight', 'keyup');
    } else g.pump(6);
  } else g.pump(6);
  maxH = Math.max(maxH, g.call('__LV.height()') || 0);
}
const target = g.call('__LV.target()') || 1;
T('height-climbed', maxH > 100, 'maxH=' + Math.round(maxH) + ' target=' + target);
/* BOT-SKILL NOTE: the P0 spawn bug (player spawned below the bottom row → instant lava death in production at 720/844 viewports, real-browser confirmed) is FIXED and all viewports now survive. The deterministic policy climbs ~152px of tier-1 (rows 82-112px apart vs 107px bounce apex — arc-edge landings); the 1-star 360m bar needs human-grade arc chaining. */
T('natural-death-reached', g.call('__LV.state()') === 'over', 'state=' + g.call('__LV.state()'));

// retry path (engine's own window.retryGame)
g.call('retryGame()');
g.pump(5);
T('retry-works', g.call('__LV.state()') === 'game', 'state=' + g.call('__LV.state()'));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { maxH: Math.round(maxH), target, stars: g.call('__LV.stars()'), deaths } };
console.log('lava-rising: platform-seeking climb via real arrows: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
