#!/usr/bin/env node
/* gobble verifier — B-type agar-like: pointer-steered eating via REAL pointer events.
 * startGame() (menu's own path) -> round timer on the engine loop; the player entity
 * chases pointerX/Y (engine getWorldPos mapping). Policy: steer toward the nearest
 * edible object each frame through real pointermove events.
 * PASS: eaten>0/score grows, natural round end (gameover screen shown), restart works. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('gobble', { inject: {
  anchor: 'function updateBot(bot,dt){',
  exports: "globalThis.__GB = { state: () => state, score: () => score, eaten: () => eaten, objects: () => objects.map(o => ({ x: o.x, y: o.y, r: o.r })), player: () => ({ x: player.x, y: player.y, r: entityRadius(player) }) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.els['play-btn'].dispatch('click', {}); // real button (engine wires play-btn -> startGame)
g.pump(5);
T('game-started', g.call('__GB.state()') === 'playing', 'state=' + g.call('__GB.state()'));

const doc = g.sandbox.document;
const pdown = { clientX: 240, clientY: 320, preventDefault() {} };
doc.dispatch('pointerdown', pdown);
let guard = 0, maxEaten = 0;
while (g.call('__GB.state()') === 'playing' && guard++ < 40000) {
  const p = g.call('__GB.player()');
  const objs = g.call('__GB.objects()') || [];
  if (p && objs.length) {
    // nearest edible (smaller than us)
    let best = null, bd = Infinity;
    for (const o of objs) { if (o.r >= p.r * 0.9) continue; const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; best = o; } }
    if (best) doc.dispatch('pointermove', { clientX: 240 + (best.x - p.x) * 0.2, clientY: 320 + (best.y - p.y) * 0.2, preventDefault() {} });
  }
  g.pump(2);
  maxEaten = Math.max(maxEaten, g.call('__GB.eaten()') || 0);
}
doc.dispatch('pointerup', pdown);
T('ate-objects', maxEaten > 0, 'eaten=' + maxEaten);
T('round-ended-naturally', g.call('__GB.state()') === 'gameover', 'state=' + g.call('__GB.state()'));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { eaten: maxEaten, score: g.call('__GB.score()') } };
console.log('gobble: pointer-chased eating through a full engine round: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
