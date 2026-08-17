#!/usr/bin/env node
/* punch-master verifier — B-type arena brawler via REAL key events on real Matter.js physics.
 * Matter is vendored (_optimization/vendor) and preloaded; the engine's dynamic script
 * loader resolves on the pump, and the async game IIFE needs a real microtask yield
 * (setImmediate) before its globals (startGame) exist.
 * Play: walk toward nearest enemy (KeyA/KeyD), Space hold=charge / release=punch
 * (engine perfect-zone + damage path); Matter bodies resolve collisions.
 * PASS: level cleared -> engine endLevel(true), score>0, punches thrown, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
(async () => {
const g = bootGame('punch-master', { vendor: { Matter: 'matter-0.19.0.min.js' }, inject: {
  anchor: 'function releasePunch(){',
  exports: "globalThis.__PM = { state: () => state, score: () => score, enemies: () => enemies.length, px: () => (player && player.body ? player.body.position.x : null), exs: () => (enemies.length ? enemies.map(e => e.body.position.x) : []) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
T('matter-loaded', !!g.sandbox.Matter && !!g.sandbox.Matter.Engine);

g.pump(2); // fire deferred dynamic-script onload
await new Promise(r => setImmediate(r)); // let the async game IIFE resume and expose globals
g.pump(3);
T('startGame-exposed', typeof g.sandbox.startGame === 'function');
g.call('startGame()');
g.pump(10);
T('game-started', g.call('__PM.state()') === 'game', 'state=' + g.call('__PM.state()'));
T('enemies-present', g.call('__PM.enemies()') >= 1, 'enemies=' + g.call('__PM.enemies()'));

const key = (c, type) => g.sandbox.document.dispatch(type, { code: c, key: c, preventDefault() {} });
let guard = 0, punches = 0, cleared = false;
while (guard++ < 60000) {
  const st = g.call('__PM.state()');
  if (st === 'end') { cleared = true; break; }
  const px = g.call('__PM.px()');
  const exs = g.call('__PM.exs()') || [];
  if (px === null || !exs.length) { g.pump(2); continue; }
  const nearest = exs.reduce((a, b) => Math.abs(b - px) < Math.abs(a - px) ? b : a, exs[0]);
  const dx = nearest - px;
  if (Math.abs(dx) > 70) {
    key(dx > 0 ? 'KeyD' : 'KeyA', 'keydown');
    key(dx > 0 ? 'KeyA' : 'KeyD', 'keyup');
    g.pump(3);
  } else {
    key('KeyA', 'keyup'); key('KeyD', 'keyup');
    key('Space', 'keydown');
    g.pump(24); // charge through the perfect-zone window
    key('Space', 'keyup');
    punches++;
    g.pump(6);
  }
}
T('punches-thrown', punches >= 1, 'punches=' + punches);
T('level-cleared', cleared || g.call('__PM.enemies()') === 0, 'state=' + g.call('__PM.state()') + ' enemies=' + g.call('__PM.enemies()'));
T('score-earned', g.call('__PM.score()') > 0, 'score=' + g.call('__PM.score()'));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { punches, state: g.call('__PM.state()'), score: g.call('__PM.score()') } };
console.log('punch-master: charge-punch brawling on real Matter physics: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERR', e.stack || e.message); process.exit(1); });
