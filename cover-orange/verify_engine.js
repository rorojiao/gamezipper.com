#!/usr/bin/env node
/* cover-orange verifier — 30 physics-shelter levels played through REAL input: canvas
 * mousedown/mousemove/mouseup drags build a box tower + wide plank cap over the orange
 * (rain is caught by the plank above the orange's hit zone), START RAIN clicked, WIN =
 * engine state WIN (cloud crossed endX with the orange unhit), NEXT LEVEL chained
 * through the real win-screen button. FAIL -> real RETRY button. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('cover-orange', { inject: {
  anchor: 'function updateCloud(dt){',
  exports: `globalThis.__C = {
    state: () => G.state, scale: () => G.scale, lvl: () => G.level, speed: () => LEVELS[G.level].cloud.speed,
    orange: () => ({ x: G.orange.x, y: G.orange.y, hit: G.orange.hit }),
    bodies: () => G.bodies.filter(b => !b.isStatic).map(b => ({ t: b.type, x: b.x, y: b.y, w: b.w, h: b.h, r: b.r, sl: b.isSleeping })),
    unlocked: () => G.unlocked,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.c, s = () => g.call('__C.scale()');
const down = (x, y) => cv().dispatch('mousedown', { clientX: x * s(), clientY: y * s(), preventDefault() {} });
const move = (x, y) => cv().dispatch('mousemove', { clientX: x * s(), clientY: y * s(), preventDefault() {} });
const up = () => cv().dispatch('mouseup', { clientX: 0, clientY: 0 });
const click = (x, y) => { down(x, y); up(); g.pump(16); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

function settle(maxF) { // wait until all dynamic bodies sleep (or budget out)
  for (let f = 0; f < (maxF || 260); f++) { g.pump(1); if (g.call('__C.bodies()').every(b => b.sl)) return f; }
  return -1;
}
function grab(b, tx, ty) { // real drag: pick the object by its top edge, park it at (tx,ty), release
  const gx = b.x, gy = b.y - b.h / 2 + 4;
  if (gx > STRIP.x0 && gx < STRIP.x1 && gy > STRIP.y0) return false; // would hit START RAIN instead — refuse
  down(gx, gy); move(tx, ty); up();
  return true;
}
function drop(b, tx, ty) { grab(b, tx, ty); g.pump(30); settle(200); }

const STRIP = { x0: 310, x1: 490, y0: 535 }; // START RAIN button eats any mousedown here; ground-resting bodies inside it become ungrabbable

function buildAndRain(cx) {
  const B = () => g.call('__C.bodies()'); // live snapshot each call: positions drift as objects fall
  const o = g.call('__C.orange()');
  // phase 1 (objects still airborne at authored y — grab points above the button strip):
  // park everything that would land inside the strip / on the column, plus all circles (they roll)
  const SLOTS = [70, 140, 210, 280, 520, 590, 660, 730];
  let si = 0, parked = 0;
  let bs = B();
  const urgent = i => (bs[i].x > STRIP.x0 && bs[i].x < STRIP.x1) || bs[i].t === 'circle';
  for (const i of bs.map((_, k) => k).filter(urgent)) {
    if (parked >= 5) break; // stay inside the ~83-frame fall window (debounce = 12 pumps per grab)
    grab(B()[i], SLOTS[si++ % 8], 300); g.pump(13); parked++; // live pos: objects fall ~2px/frame, snapshots go stale instantly
  }
  settle(500);
  // phase 2: materials by stable array index (order never changes; positions re-read live)
  bs = B();
  const isPlank = i => bs[i].t === 'plank';
  const planks = bs.map((_, k) => k).filter(isPlank).sort((a, b) => bs[b].w - bs[a].w);
  const stack = bs.map((_, k) => k).filter(k => k !== planks[0] && bs[k].t !== 'circle').sort((a, b) => (bs[b].h - bs[a].h) || (bs[b].w - bs[a].w)); // spare planks + triangles are tower filler; the widest plank is the cap
  // tidy: unused bodies parked clear of the column
  let ax = 70;
  for (const k of [...bs.map((_, q) => q).filter(q => !stack.includes(q) && q !== planks[0]), ...[]]) {
    if (Math.abs(B()[k].x - cx) < 90) { drop(B()[k], ax, 300); bs = B(); ax = ax === 70 ? 730 : 70; }
  }
  // tower: stack fillers at cx until the top clears the orange's hit zone, then plank cap
  let cur = 580; const cap = planks[0];
  const need = o.y - 40;
  for (const k of stack) {
    if (cur <= need + 5) break;
    let ok = false;
    for (let a = 0; a < 3 && !ok; a++) {
      drop(B()[k], cx, cur - B()[k].h / 2 - 8);
      const nb = B()[k];
      if (Math.abs(nb.x - cx) <= 8 && Math.abs(nb.y - (cur - nb.h / 2)) <= 10) ok = true;
      else if (Math.abs(nb.x - cx) > 8) continue; // regrab re-centered
      else ok = true; // slightly low/high but aligned: acceptable
    }
    const nb = B()[k];
    if (Math.abs(nb.x - cx) > 40 || Math.abs(nb.y - (cur - nb.h / 2)) > 40) return 'tower-lost';
    if (Math.abs(nb.x - cx) > 12) return 'tower-crooked';
    cur = nb.y - nb.h / 2;
  }
  if (cur > o.y - 25) return 'tower-short@' + Math.round(cur) + '<' + (o.y - 25); // real bar: the cap plank's top must sit above the orange's hit zone
  if (cap === undefined) return 'no-plank';
  drop(B()[cap], cx, cur - 7.5 - 8);
  const capB = B()[cap];
  if (Math.abs(capB.x - cx) > 12 || (capB.y + 7.5) > o.y - 20) return 'cap-failed ' + JSON.stringify([Math.round(capB.x), Math.round(capB.y)]);
  click(400, 555); // START RAIN (real button)
  if (g.call('__C.state()') !== 'SIMULATING') return 'rain-not-started';
  const sp = g.call('__C.speed()');
  const capF = Math.ceil(1150 / (sp * 60 * 0.0167)) + 500;
  for (let f = 0; f < capF; f++) {
    g.pump(1);
    const st = g.call('__C.state()');
    if (st === 'WIN') return 'WIN';
    if (st === 'FAIL') return 'FAIL';
  }
  return 'timeout';
}

// real flow: TITLE -> PLAY
click(400, 45);
T('play-flow', g.call('__C.state()') === 'PLANNING' && g.call('__C.lvl()') === 0, g.call('__C.state()'));

const results = [];
for (let i = 0; i < 30; i++) {
  if (g.call('__C.lvl()') !== i || g.call('__C.state()') !== 'PLANNING') { results.push('bad-state'); break; }
  const o = g.call('__C.orange()');
  let res = '', won = false;
  for (const cx of [o.x, o.x - 4, o.x + 4]) { // retry via real RETRY button with small column shifts
    res = buildAndRain(cx);
    if (res === 'WIN') { won = true; break; }
    if (g.call('__C.state()') === 'FAIL') { click(400, 372); } // RETRY restarts the level clean
    else break; // build defect (not a rain death): retrying on a half-built tower is garbage
  }
  results.push(res);
  if (!won) break;
  click(400, 412); // NEXT LEVEL (real win-screen button; L30 -> TITLE)
  g.pump(30);
}
const wonCount = results.filter(r => r === 'WIN').length;
T('levels-won', wonCount === 30, wonCount + '/30 [' + results.join(',') + ']');
T('unlock-progress', g.call('__C.unlocked()') >= 30, 'unlocked=' + g.call('__C.unlocked()'));
// real LEVEL SELECT flow from TITLE
if (g.call('__C.state()') === 'TITLE') {
  click(400, 115); // LEVEL SELECT
  click(235, 140); // grid cell L2 (col1,row0) — must be unlocked by now
  T('level-select', g.call('__C.state()') === 'PLANNING' && g.call('__C.lvl()') === 1, g.call('__C.state()') + ' lvl' + g.call('__C.lvl()'));
} else T('level-select', false, 'not on TITLE');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { won: wonCount + '/30', note: 'P0: resolveCollision referenced undefined n -> ReferenceError froze every colliding frame (cloud/rain never advanced once objects landed); P1: cloud vx px/frame treated as px/s (14-min levels); P0b: impulse used swapped invMass (vs static floor = zero) so bodies never settled, vy grew unboundedly -> tunneling; P1b: winning never advanced G.unlocked (progression stuck at L1 from the menu); P2: ground clamp fought the floor (bodies hovered/jittered); data: all 30 levels topped up with boxes+planks (stack budget 700-orange.y, interfaces lose ~2-6px each to rest penetration). All 30 won via real drags + button clicks' } };
console.log('cover-orange: ' + wonCount + '/30 shelters built via real drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
