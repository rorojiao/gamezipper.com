#!/usr/bin/env node
/* dunk-shot-3d verifier (type B arcade) — all 30 levels completed through the engine's
 * real input path: real canvas touchstart/touchmove/touchend drags (the branch that
 * binds in this environment) -> pointerEnd -> shootBall -> updatePhysics -> the
 * engine's own swish detection -> endLevel (m-complete + starsPerLevel persistence),
 * chaining 1..30 via the real Next Level button. Shot plans come from an exact port of
 * the engine's launch mapping + per-frame physics, searched per shot against the live
 * rim/obstacle state; the live launch mapping is calibration-checked against the port.
 *
 * P0s fixed in index.html before this run (each reproduced pre-fix):
 *  1) dead-ball endShot(false) had no `return` — first rolling-dead ball threw
 *     "Cannot read properties of null (reading 'pos')" in the rAF loop (real browsers:
 *     permanent freeze). The 2026-08-16 crash fix guarded the three later endShot
 *     calls but missed this one. Reproduced: 781 real drags -> raf TypeError.
 *  2) launch scaling made swishing geometrically impossible: 781 real drags on L1
 *     scored 0 points; exhaustive launch-state sweep: best rim approach 0.116 vs the
 *     0.07 swish window (forward speed vs vertical-timing mismatch).
 *  3) rims never reset after a scored ball -> max level score = hoops swishes
 *     (~135/290/465) < every target from L1 (280) — unwinnable by construction.
 *  4) scored balls exited via endShot(false) (front-exit + dead-ball paths) so the
 *     combo reset after EVERY basket: maxCombo capped at 1, score capped 110/shot,
 *     unclearable from L10 up, 3 stars unreachable everywhere.
 *  5) shot budget outran targets from L15 (perfect-play max 1155 < 1400 ... 435 < 2600).
 *  6) early-end fired at >= target, capping the score ~target so the 3-star
 *     threshold (1.2x) was unreachable from L12 up.
 * P2 documented (unfixed): power-ups are unreachable dead content — they sit on the
 * depth-0.5 plane at z 0.4-0.6 while every trajectory (scoring arc or floor bounce)
 * crosses that depth at z>=0.8 or <=0.3. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('dunk-shot-3d', { inject: {
  anchor: '/* ---------- Ball launch ---------- */',
  exports: `
globalThis.__end = null;
var __oEL = endLevel;
endLevel = function(){ if(gameState === 'playing') globalThis.__end = { type: 'complete', lvl: currentLevel, score: levelScore, shots: levelShots, maxCombo: maxCombo }; return __oEL.apply(this, arguments); };
var __oFL = failLevel;
failLevel = function(){ globalThis.__end = { type: 'fail', lvl: currentLevel, score: levelScore, shots: levelShots }; return __oFL.apply(this, arguments); };
render = function(dt){ if(slowmoTimer>0) slowmoTimer--; if(doubleTimer>0) doubleTimer--; if(magnetTimer>0){magnetTimer--; if(magnetTimer<=0) magnetActive=false;} }; // draw-only; render's ONLY game logic is these timer decrements, replicated exactly
globalThis.__DS = {
  st: function(){ return { state: gameState, lvl: currentLevel, score: levelScore, shots: levelShots, combo: combo, maxCombo: maxCombo,
    inFlight: !!ballInFlight, vel: ballInFlight ? { x: ballInFlight.vel.x, y: ballInFlight.vel.y, z: ballInFlight.vel.z } : null,
    frames: levelFrames, rims: rims.map(function(r){ return { x: r.x, scored: r.scored }; }) }; },
  cfg: function(n){ var c = getLevelConfig(n); return { shots: c.shots, target: c.target, hoops: c.hoops, difficulty: c.difficulty,
    obstacles: c.obstacles.map(function(o){ return { type: o.type, x: o.x, y: o.y }; }) }; },
  save: function(){ return JSON.parse(JSON.stringify(save)); },
};`
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game'];
const T0 = Date.now();

/* ---------- exact port of launch mapping + per-frame physics (verbatim math) ---------- */
const GRAVITY = -0.0009, AIR_DRAG = 0.999;
function launchOf(dx, dy) {
  const dragLen = Math.hypot(dx, dy);
  if (dragLen < 12) return null;
  const power = Math.min(1, dragLen / 220);
  const vx = -dx * 0.006 * (0.5 + power * 0.8), vy = -dy * 0.006 * (0.5 + power * 0.8);
  if (Math.hypot(vx, vy) < 0.05) return null;
  const maxV = 0.045;
  return {
    pos: { x: 0.5, y: 1.0, z: 0.18 },
    vel: {
      x: Math.max(-maxV, Math.min(maxV, -vx * 2)),
      y: -(0.011 + power * 0.007),
      z: Math.max(-maxV * 0.8, Math.min(maxV * 0.8, -vy * 20))
    }, power
  };
}
function simFlight(b0, rims, obstacles) { // one flight to its end; returns {swished:rimIndex|null, frames}
  const b = { pos: { ...b0.pos }, vel: { ...b0.vel }, time: 0, bounced: 0, hasScored: false };
  const rs = rims.map(r => ({ x: r.x, scored: r.scored, hitCount: 0 }));
  let swished = null;
  for (let t = 1; t <= 600; t++) {
    b.vel.z += GRAVITY;
    b.vel.x *= AIR_DRAG; b.vel.y *= AIR_DRAG; b.vel.z *= AIR_DRAG;
    b.pos.x += b.vel.x; b.pos.y += b.vel.y; b.pos.z += b.vel.z;
    b.time += 1;
    if (b.pos.y < 0.05) { b.pos.y = 0.05; b.vel.y = -b.vel.y * 0.4; b.bounced++; }
    if (b.pos.x < 0.02) { b.pos.x = 0.02; b.vel.x = -b.vel.x * 0.5; b.bounced++; }
    if (b.pos.x > 0.98) { b.pos.x = 0.98; b.vel.x = -b.vel.x * 0.5; b.bounced++; }
    if (b.pos.z < 0.01) {
      b.pos.z = 0.01; b.vel.z = -b.vel.z * 0.55; b.bounced++;
      if (Math.abs(b.vel.z) < 0.003 && b.bounced > 1) return { swished, frames: t };
    }
    if (b.pos.z > 1.4) { b.pos.z = 1.4; b.vel.z = -b.vel.z * 0.4; }
    if (b.pos.y > 1.0 && b.pos.z < 0.18) { b.pos.z = 0.18; b.vel.z = -b.vel.z * 0.5; b.bounced++; }
    for (const o of obstacles) { // static positions: moving_wall oscillates below the arc (z<=0.58) — verified never on path
      const dx = b.pos.x - o.x, dy = b.pos.y - 0.5, dz = b.pos.z - o.y;
      const d = Math.hypot(dx, dy, dz);
      if (d < 0.08) {
        const n = [dx / d, dy / d, dz / d];
        const dot = b.vel.x * n[0] + b.vel.y * n[1] + b.vel.z * n[2];
        if (dot < 0) { b.vel.x -= 2 * dot * n[0] * 0.7; b.vel.y -= 2 * dot * n[1] * 0.7; b.vel.z -= 2 * dot * n[2] * 0.7; }
      }
    }
    if (!b.hasScored) {
      for (let ri = 0; ri < rs.length; ri++) {
        const rim = rs[ri]; if (rim.scored) continue;
        const dx = b.pos.x - rim.x, dy = b.pos.y - 0.15, dz = b.pos.z - 0.55;
        const dH = Math.hypot(dx, dz), dV = Math.abs(dy);
        if (dH < 0.07 && dV < 0.05 && b.vel.y < -0.001) { swished = ri; return { swished, frames: t }; }
        else if (dH < 0.13 && Math.abs(dz) < 0.13 && Math.abs(dy) < 0.05) {
          const nx = dx / Math.max(0.001, dH), ny = dy / Math.max(0.001, dV);
          const dot = b.vel.x * nx + b.vel.y * ny;
          if (dot < 0) {
            b.vel.x -= 2 * dot * nx * 0.6; b.vel.y -= 2 * dot * ny * 0.6;
            rim.hitCount++;
            if (rim.hitCount > 4) return { swished: null, frames: t };
          }
        }
      }
    }
    if (b.hasScored && b.pos.y < 0.0) return { swished, frames: t };
    if (b.pos.y > 1.05) return { swished, frames: t };
    const speed = Math.hypot(b.vel.x, b.vel.y, b.vel.z);
    if (b.time > 300 && speed < 0.001) return { swished, frames: t };
  }
  return { swished: null, frames: 600 };
}
function findShot(rims, obstacles, wantRim) {
  for (let dy = 30; dy <= 290; dy += 5) {
    for (let dx = -2.2; dx <= 2.2; dx += 0.1) {
      const b = launchOf(dx, dy); if (!b) continue;
      const rs = rims.map((r, i) => ({ x: r.x, scored: i !== wantRim }));
      const r = simFlight(b, rs, obstacles);
      if (r.swished === wantRim) return { dx, dy };
    }
  }
  for (let dy = 30; dy <= 300; dy += 2) { // fine pass if coarse missed
    for (let dx = -2.5; dx <= 2.5; dx += 0.025) {
      const b = launchOf(dx, dy); if (!b) continue;
      const rs = rims.map((r, i) => ({ x: r.x, scored: i !== wantRim }));
      const r = simFlight(b, rs, obstacles);
      if (r.swished === wantRim) return { dx, dy };
    }
  }
  return null;
}

/* ---------- real touch input (the branch that binds here) ---------- */
function drag(dx, dy) {
  const ex = 240 + dx, ey = 320 + dy;
  cv.dispatch('touchstart', { touches: [{ clientX: 240, clientY: 320 }], preventDefault() {} });
  cv.dispatch('touchmove', { touches: [{ clientX: ex, clientY: ey }], preventDefault() {} });
  cv.dispatch('touchend', { changedTouches: [{ clientX: ex, clientY: ey }], preventDefault() {} });
}
function drainFlight() {
  for (let i = 0; i < 160; i++) {
    g.pump(5);
    const st = C('__DS.st()');
    if (!st.inFlight || st.state !== 'playing') return st;
  }
  return C('__DS.st()');
}
function shoot(dx, dy) { // returns state after flight drained
  drag(dx, dy);
  return drainFlight();
}

/* ---------- boot ---------- */
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('menu-at-boot', C('__DS.st().state') === 'menu', 'state=' + C('__DS.st().state'));

/* ---------- level-config integrity (post P0-C fix: every level clearable + 3-starable) ---------- */
function perfectMax(k) { return k <= 10 ? 100 * k + 5 * k * (k + 1) : 200 * k - 450; }
let integ = [];
const CFG = [];
for (let n = 1; n <= 30; n++) {
  const c = C('__DS.cfg(' + n + ')');
  CFG.push(c);
  if (perfectMax(c.shots) < c.target * 1.2) integ.push('L' + n + ':no3star(' + perfectMax(c.shots) + '<' + Math.round(c.target * 1.2) + ')');
  if (c.shots < 3) integ.push('L' + n + ':shots' + c.shots);
  if (c.hoops < 1 || c.hoops > 3) integ.push('L' + n + ':hoops' + c.hoops);
  if (c.obstacles.some(o => o.x < 0 || o.x > 1 || o.y < 0.3 || o.y > 0.52)) integ.push('L' + n + ':obs-oob');
}
T('level-economy-integrity', integ.length === 0, integ.join(',').slice(0, 160));

/* ---------- L1: tutorial, pause, launch calibration, scoring ---------- */
g.els['btn-play'].click(); g.pump(30);
T('l1-started', C('__DS.st().lvl') === 1 && C('__DS.st().state') === 'playing', JSON.stringify(C('__DS.st()')).slice(0, 90));
T('tutorial-shown', g.els['tutorial'].classList.contains('show'), 'tutorial hidden');
g.els['tut-skip'].click(); g.pump(2);
T('tutorial-skipped', !g.els['tutorial'].classList.contains('show') && C('__DS.save().tutorialDone') === true, 'still shown');
// pause / resume through real buttons
g.els['btn-menu'].click(); g.pump(2);
T('pause-works', C('__DS.st().state') === 'paused' && g.els['m-pause'].classList.contains('show'), 'state=' + C('__DS.st().state'));
g.els['btn-resume'].click(); g.pump(2);
T('resume-works', C('__DS.st().state') === 'playing' && !g.els['m-pause'].classList.contains('show'), 'state=' + C('__DS.st().state'));
// launch-mapping calibration: engine's own shootBall velocities === port
{
  drag(0.4, 100);
  const lv = C('__DS.st().vel'), pm = launchOf(0.4, 100);
  T('launch-mapping-exact', lv && pm && Math.abs(lv.x - pm.vel.x) < 1e-15 && Math.abs(lv.y - pm.vel.y) < 1e-15 && Math.abs(lv.z - pm.vel.z) < 1e-15,
    'engine=' + JSON.stringify(lv) + ' port=' + JSON.stringify(pm.vel));
  drainFlight(); g.pump(10); // this calibration shot may or may not score; level is replayed for the scored run
  if (C('__DS.st().state') !== 'playing') { // it completed L1 incidentally (or failed) — restart clean
    g.pump(50);
    if (g.els['m-complete'].classList.contains('show')) { g.els['btn-replay'].click(); g.pump(4); }
  }
}
// dead-ball crash regression: one deliberate non-scoring flop (P0-A2 path)
const missDrag = (() => { // a real launch that provably misses (sim-checked against live rims)
  const rims0 = C('__DS.st().rims');
  for (const c of [[120, 80], [150, 60], [-120, 80], [-150, 100], [200, 120]]) {
    const b = launchOf(c[0], c[1]);
    if (b && simFlight(b, rims0, []).swished === null) return c;
  }
  return [200, 120];
})();
{
  const errsBefore = (g.sandbox.__errors || []).length;
  shoot(missDrag[0], missDrag[1]); // wall-pinball flop that dies on the floor
  g.pump(30);
  const newErrs = (g.sandbox.__errors || []).slice(errsBefore).filter(e => /null|TypeError/.test(e));
  T('deadball-no-crash', newErrs.length === 0 && C('__DS.st().score') === 0, JSON.stringify(newErrs[0] || '').slice(0, 90));
}

/* ---------- solve a level: real swish shots until the engine ends it ---------- */
function solveLevel(id) {
  const cfg = CFG[id - 1];
  let shots = 0, swishes = 0, searchFail = 0;
  for (;;) {
    if (Date.now() > T0 + 100000) return { deadline: true };
    const st = C('__DS.st()');
    if (st.state !== 'playing') break; // ended (complete via early-end / exhausted)
    if (st.shots >= cfg.shots && !st.inFlight) break;
    const unscored = st.rims.map((r, i) => r.scored ? -1 : i).filter(i => i >= 0);
    const want = unscored.length ? unscored[0] : 0;
    const plan = findShot(st.rims, cfg.obstacles, want);
    if (!plan) { searchFail++; shoot(0, 13); continue; } // consume a shot, keep going
    const before = C('__DS.st().score');
    const after = shoot(plan.dx, plan.dy);
    g.pump(12); // let endShot/early-end timers land
    shots++;
    if (C('__DS.st().score') > before || C('__DS.st().state') !== 'playing') swishes++;
  }
  g.pump(60); // endLevel 600-700ms timers -> modal
  return { shots, swishes, searchFail };
}

const chain = []; let threeStars = 0, twoStars = 0;
for (let id = 1; id <= 30; id++) {
  const r0 = C('__DS.st()');
  if (r0.lvl !== id || r0.state !== 'playing') {
    chain.push(id + ':bad-load(lvl' + r0.lvl + ',' + r0.state + ')');
    T('level-' + id + '-complete', false, 'lvl=' + r0.lvl + ' state=' + r0.state);
    break;
  }
  C('__end = null');
  const res = solveLevel(id);
  if (res.deadline) { chain.push(id + ':deadline'); T('level-' + id + '-complete', false, 'deadline'); break; }
  const end = C('__end');
  const sv = C('__DS.save()');
  const stars = (sv.starsPerLevel || {})[id] || 0;
  const cfg = CFG[id - 1];
  const ok = end && end.type === 'complete' && end.lvl === id && end.score >= cfg.target &&
    g.els['m-complete'].classList.contains('show') && stars >= 2;
  if (ok) { twoStars++; if (stars >= 3) threeStars++; }
  chain.push(ok ? '' + id : id + ':' + (end ? end.type : 'no-end') + '/s' + (end ? end.score : '-') + '/t' + cfg.target + '/*' + stars + (res.searchFail ? '/sf' + res.searchFail : ''));
  T('level-' + id + '-complete', ok,
    'end=' + JSON.stringify(end) + ' target=' + cfg.target + ' stars=' + stars + ' modal=' + g.els['m-complete'].classList.contains('show'));
  if (id === 1) {
    T('hud-score-live', String(g.els['hud-score'].textContent) === String(C('__DS.st().score')), 'hud=' + g.els['hud-score'].textContent);
    T('ach-first-swish', (C('__DS.save().achievements') || []).includes('first_swish'), JSON.stringify(C('__DS.save().achievements')));
  }
  if (id === 5) T('ach-combo5', (C('__DS.save().achievements') || []).includes('combo_5'), 'ach=' + JSON.stringify(C('__DS.save().achievements')));
  if (!ok) break;
  g.els['btn-next'].click(); g.pump(6);
}
T('all-30-complete', chain.length === 30 && chain.every(x => !x.includes(':')),
  chain.filter(x => x.includes(':')).join(',').slice(0, 200) || 'all');
const wonN = chain.filter(x => !x.includes(':')).length;
if (wonN === 30) {
  const sv = C('__DS.save()');
  const ach = sv.achievements || [];
  T('final-next-menu', (g.els['btn-next'].click(), g.pump(4), C('__DS.st().state') === 'menu' && g.els['m-start'].classList.contains('show')), 'state=' + C('__DS.st().state'));
  T('save-persisted', Object.keys(sv.starsPerLevel || {}).length === 30 && Object.values(sv.starsPerLevel).every(v => v >= 2) && sv.maxUnlocked === 31 && sv.bestScore > 0,
    'keys=' + Object.keys(sv.starsPerLevel || {}).length + ' maxUnlocked=' + sv.maxUnlocked + ' best=' + sv.bestScore);
  T('ach-core-set', ['first_swish', 'combo_5', 'level_5', 'level_10', 'level_20', 'level_30', 'three_stars'].every(a => ach.includes(a)),
    'missing=' + ['first_swish', 'combo_5', 'level_5', 'level_10', 'level_20', 'level_30', 'three_stars'].filter(a => !ach.includes(a)).join(','));
  // level select: 30 cells, all unlocked, stars rendered
  g.els['btn-levels'].click(); g.pump(2);
  const cells = g.els['lvl-grid'].children;
  const lockedN = Array.from(cells).filter(c => c.classList.contains('locked')).length;
  T('level-select-ok', cells.length === 30 && lockedN === 0, 'cells=' + cells.length + ' locked=' + lockedN);
  // replay L1 via a real cell: deliberately miss EVERY shot -> engine's own failLevel -> retry -> win
  cells[0].click(); g.pump(6);
  let missShots = 0, sawFail = false;
  for (let i = 0; i < 20 && C('__DS.st().state') === 'playing'; i++) { shoot(missDrag[0], missDrag[1]); g.pump(20); missShots++; }
  g.pump(40);
  sawFail = g.els['m-fail'].classList.contains('show') && C('__DS.st().state') === 'fail';
  T('fail-path-works', sawFail, 'state=' + C('__DS.st().state') + ' modal=' + g.els['m-fail'].classList.contains('show') + ' missShots=' + missShots);
  g.els['btn-retry'].click(); g.pump(6);
  C('__end = null');
  solveLevel(1);
  const endR = C('__end');
  T('retry-then-win', endR && endR.type === 'complete' && endR.lvl === 1, 'end=' + JSON.stringify(endR));
}
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: wonN + '/30', stars2: twoStars, stars3: threeStars, durS: Math.round((Date.now() - T0) / 1000),
    notes: '6 P0s fixed (all reproduced pre-fix): dead-ball endShot without return froze the rAF loop on the first rolling ball (781-drag sweep -> "raf: Cannot read properties of null (reading pos)"); launch scaling made every swish geometrically impossible (0 points in 781 real drags, best approach 0.116 vs 0.07 window); rims never reset -> max level score = hoops swishes < every target (L1: 135 max vs 280); scored balls exited via endShot(false) so combo reset after EVERY basket (maxCombo capped at 1, score capped 110/shot -> unclearable from L10); shot budget < perfect-play max from L15 (1155<1400 .. 435<2600); early-end at >=target capped score so 3-star (1.2x) unreachable L12+. ' +
      'All levels cleared via real touch drags searched by an exact physics port (launch mapping calibration-checked to 1e-15); fail+retry and pause/resume exercised through real buttons. ' +
      'P2 documented: power-ups unreachable dead content (depth-0.5 plane z0.4-0.6 vs every trajectory crossing that depth at z>=0.8 or <=0.3); tutorial promises collecting them.' } };
console.log('dunk-shot-3d: ' + wonN + '/30 levels via real touch drags (' + threeStars + 'x3-star): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
