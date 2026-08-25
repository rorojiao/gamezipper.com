#!/usr/bin/env node
/* duck-life verifier — full progression playthrough through the engine's real input path
 * (canvas pointerdown/move/up driving the engine's own button hit-testing, tap-to-jump,
 * touch-steering and tap-to-boost): title → intro → home → all 3 training minigames
 * (running jump bot / swimming & flying steering bots, 30s each) until stats are race-ready →
 * win the race in each of the 4 worlds (engine's own placement logic → completedWorlds +
 * coins + save) → shop purchase. Win signal = the engine's own raceResult===1 +
 * gs.completedWorlds growth (the engine dispatches 'level-complete' on these). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('duck-life', { inject: {
  anchor: 'function gameLoop(timestamp){',
  exports: `
drawWorldBg = function(){}; drawClouds = function(){}; // draw-only routines stubbed for headless speed
globalThis.__DL = {
  scene: () => scene,
  stats: () => ({ running: gs.stats.running, swimming: gs.stats.swimming, flying: gs.stats.flying, energy: Math.floor(gs.stats.energy) }),
  coins: () => gs.coins,
  worlds: () => gs.completedWorlds.slice(),
  owned: () => gs.ownedItems.slice(),
  raceResult: () => raceResult, raceFinished: () => raceFinished, raceSeg: () => raceSegmentIdx,
  score: () => trainingScore, timer: () => trainingTimer,
  duckX: () => trainingDuckX, duckY: () => trainingDuckY,
  items: () => {
    let l = [];
    if (scene === 'training_running') l = runObstacles.filter(o => !o.hit).map(o => ({ dx: o.x - trainingScrollX, y: 350, type: 'obs' }))
      .concat(runCoins.filter(c => !c.collected).map(c => ({ dx: c.x - trainingScrollX, y: c.y, type: 'coin' })));
    else if (scene === 'training_swimming') l = swimObstacles.filter(o => !o.hit).map(o => ({ dx: o.x - trainingScrollX, y: o.y, type: 'obs' }))
      .concat(swimCoins.filter(c => !c.collected).map(c => ({ dx: c.x - trainingScrollX, y: c.y, type: 'coin' })));
    else if (scene === 'training_flying') l = flyObstacles.filter(o => !o.hit).map(o => ({ dx: o.x - trainingScrollX, y: o.y, type: 'obs' }))
      .concat(flyCoins.filter(c => !c.collected).map(c => ({ dx: c.x - trainingScrollX, y: c.y, type: 'coin' })));
    return l;
  },
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['gameCanvas'];
const T0 = Date.now();
// game coords (800x450) → client coords via the canvas rect the engine itself reads
const R = (() => { const r = cv.getBoundingClientRect(); return (x, y) => [x / 800 * r.width, y / 450 * r.height]; })();
const pd = (x, y) => { const [a, b] = R(x, y); cv.dispatch('pointerdown', { clientX: a, clientY: b, pointerId: 1, button: 0, preventDefault() {} }); };
const pm = (x, y) => { const [a, b] = R(x, y); cv.dispatch('pointermove', { clientX: a, clientY: b, pointerId: 1, preventDefault() {} }); };
const pu = (x, y) => { const [a, b] = R(x, y); cv.dispatch('pointerup', { clientX: a, clientY: b, pointerId: 1, preventDefault() {} }); };
const click = (x, y) => { pd(x, y); pu(x, y); g.pump(3); }; // real path: pointerup → handleButtonClick

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

// --- title → New Game → intro (2 steps) → home ---
g.pump(5);
click(400, 304); // New Game
T('intro-started', C('__DL.scene()') === 'intro', 'scene=' + C('__DL.scene()'));
click(400, 382); click(400, 382); // intro step 0 "Continue", step 1 "Let's Go!"
T('home-reached', C('__DL.scene()') === 'home', 'scene=' + C('__DL.scene()'));
const stats0 = C('__DL.stats()');

// --- training bots (real pointer input; scenes end via the engine's own 30s timer) ---
function runBot(deadline) { // running: tap-to-jump (tapQueue → consumeTap in the engine) over obstacles, up to coins
  while (C('__DL.scene()') === 'training_running') {
    for (let k = 0; k < 2; k++) { g.pump(1); if (C('__DL.scene()') !== 'training_running') return 'done'; }
    const grounded = C('__DL.duckY()') >= 349.5;
    let nearest = Infinity, coinRel = Infinity, coinY = 0;
    for (const o of C('__DL.items()')) { const rel = o.dx - 120;
      if (o.type === 'obs') { if (rel > 5 && rel < nearest) nearest = rel; }
      else if (rel > 5 && rel < coinRel) { coinRel = rel; coinY = o.y; } }
    if (grounded && (nearest < 75 || (coinRel < 70 && coinY < 318))) { pd(400, 200); pu(400, 200); }
    if (Date.now() > deadline) return 'deadline';
  }
  return 'done';
}
function steerBot(mode, deadline) { // swimming/flying: hold pointer, steer toward coins / away from obstacles
  pd(400, mode === 'swimming' ? 225 : 200);
  const sc = mode === 'swimming' ? 'training_swimming' : 'training_flying';
  while (C('__DL.scene()') === sc) {
    for (let k = 0; k < 2; k++) { g.pump(1); if (C('__DL.scene()') !== sc) { pu(400, 200); return 'done'; } }
    const duckX = C('__DL.duckX()'), duckY = C('__DL.duckY()');
    const items = C('__DL.items()');
    let ndx = 1e9, ny = 0, cdx = 1e9, cy = 0;
    for (const o of items) { const rel = o.dx - duckX;
      if (o.type === 'obs') { if (rel > -15 && rel < ndx) { ndx = rel; ny = o.y; } }
      else if (rel > -15 && rel < cdx) { cdx = rel; cy = o.y; } }
    if (mode === 'swimming') {
      let ty = 225;
      if (ndx < 130) ty = ny > 225 ? ny - 150 : ny + 150;
      else if (cdx < 160) ty = cy;
      pm(300, Math.max(70, Math.min(380, ty)));
    } else {
      let tx = duckX, ty = 200;
      if (cdx < 260 && (ndx > 90 || Math.abs(ny - cy) > 60)) { tx = duckX + Math.max(-20, Math.min(50, cdx)); ty = cy; } // chase the coin itself
      else if (ndx < 100 && Math.abs(ny - duckY) < 70) ty = ny > duckY ? ny - 140 : ny + 140; // dodge
      pm(Math.max(60, Math.min(760, tx)), Math.max(50, Math.min(400, ty)));
    }
    if (Date.now() > deadline) { pu(400, 200); return 'deadline'; }
  }
  pu(400, 200);
  return 'done';
}

const cardX = { running: 170, swimming: 410, flying: 650 }; // training_select card buttons (engine layout)
function oneSession(stat, deadline) {
  // home (regen energy) → Train → stat card → play → results → Continue
  let guard = 0;
  while (C('__DL.stats()').energy < 25 && guard++ < 2500) g.pump(3); // engine's own home regen (2/s x2 loops)
  click(137.5, 355); // Train
  if (C('__DL.scene()') !== 'training_select') return 'no-train-select';
  g.pump(3);
  click(cardX[stat], 331); // "Train (-25 NRG)" on the stat's card (drawButton at cy+205, cy=110)
  const sc = 'training_' + stat;
  if (C('__DL.scene()') !== sc) return 'not-started:' + C('__DL.scene()');
  const before = C('__DL.stats()')[stat];
  let r;
  if (stat === 'running') r = runBot(deadline);
  else r = steerBot(stat, deadline);
  for (let k = 0; k < 30 && C('__DL.scene()') !== 'results'; k++) g.pump(2);
  if (C('__DL.scene()') !== 'results') return 'no-results(' + r + ')';
  const after = C('__DL.stats()')[stat];
  click(400, 412); // Continue → home
  return { r: after > before ? 'trained' : 'no-gain', gain: after - before, before, after, score: C('__DL.score()') };
}

// grind each stat to race-winning levels (world 3 non-champ needs ~71+ with boost held)
const sessions = [];
const trainDeadline = T0 + 60000;
for (let round = 0; round < 40 && Date.now() < trainDeadline; round++) {
  const st = C('__DL.stats()');
  const weakest = ['running', 'swimming', 'flying'].sort((a, b) => st[a] - st[b])[0];
  if (st[weakest] >= 85) break;
  const out = oneSession(weakest, Math.min(Date.now() + 25000, trainDeadline));
  sessions.push({ stat: weakest, out: out.r, gain: out.gain || 0 });
  if (typeof out === 'string') break;
}
const st1 = C('__DL.stats()');
T('training-gains-stats', st1.running > stats0.running && st1.swimming > stats0.swimming && st1.flying > stats0.flying,
  'run ' + stats0.running + '→' + st1.running + ' swim ' + stats0.swimming + '→' + st1.swimming + ' fly ' + stats0.flying + '→' + st1.flying);
T('training-results-screen', sessions.some(s => s.out === 'trained'), 'sessions=' + JSON.stringify(sessions.slice(0, 6)));

// --- win the race in each of the 4 worlds (engine's own placement + unlock chain) ---
function raceWorld(world, deadline) {
  click(662.5, 355); // Worlds
  if (C('__DL.scene()') !== 'world_map') return 'no-map';
  const cx = 100 + (world % 2) * 310, cy = 100 + Math.floor(world / 2) * 150;
  click(cx + 160, cy + 99); // Select world
  if (C('__DL.scene()') !== 'home') return 'no-select';
  click(312.5, 355); // Race
  if (C('__DL.scene()') !== 'race_select') return 'no-race-select';
  click(400, 265); // Start Race!
  if (C('__DL.scene()') !== 'race') return 'no-race:' + C('__DL.scene()');
  for (let k = 0; k < 220 && !C('__DL.raceFinished()'); k++) g.pump(1); // 3s countdown
  pd(400, 225); // hold touch = boost (engine's own boost rule)
  let guard = 0;
  while (!C('__DL.raceFinished()') && guard++ < 5000) {
    g.pump(2);
    if (Date.now() > deadline) { pu(400, 225); return 'deadline'; }
  }
  pu(400, 225);
  const res = C('__DL.raceResult()');
  if (C('__DL.raceFinished()')) { click(400, 362); } // Continue → home
  return res === 1 ? 'won' : 'place-' + res;
}

const raceOut = [];
for (let w = 0; w < 4; w++) {
  const out = raceWorld(w, Math.min(Date.now() + 20000, T0 + 92000));
  raceOut.push(out);
  T('world-' + (w + 1) + '-race-won', out === 'won' && C('__DL.worlds()').includes(w), out + ' worlds=' + JSON.stringify(C('__DL.worlds()')));
  if (out !== 'won') break;
}
T('all-4-worlds', raceOut.length === 4 && raceOut.every(r => r === 'won'), raceOut.join(','));

// --- shop: buy the cap through the real Buy button ---
const coinsBefore = C('__DL.coins()');
click(487.5, 355); // Shop
if (C('__DL.scene()') === 'shop') { // card 0 ("Baseball Cap", 50 coins) Buy button
  click(157, 295);
  g.pump(3);
  T('shop-buy', C('__DL.owned()').includes('cap') && C('__DL.coins()') === coinsBefore - 50,
    'owned=' + JSON.stringify(C('__DL.owned()')) + ' coins=' + C('__DL.coins()') + '/' + coinsBefore);
  click(400, 432); // Back
} else T('shop-buy', false, 'scene=' + C('__DL.scene()'));

// --- progress persisted by the engine's own saveState ---
const save = JSON.parse(g.ls.getItem('ducklife_save') || '{}');
T('progress-saved', (save.completedWorlds || []).length === 4 && save.stats && save.stats.running >= 85,
  'worlds=' + JSON.stringify(save.completedWorlds) + ' run=' + (save.stats && save.stats.running));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { worldsWon: raceOut.filter(r => r === 'won').length + '/4', stats: st1, sessions: sessions.length, durS: Math.round((Date.now() - T0) / 1000) } };
console.log('duck-life: train ' + JSON.stringify(st1) + ' → worlds ' + raceOut.join(',') + ': ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
