#!/usr/bin/env node
/* color-hole-3d verifier — 30 drag-to-collect levels (type B arcade).
 * Every action goes through the REAL input path: canvas pointerdown +
 * pointermove (the hole lerps toward the pointer each frame) -> the engine's
 * own suction/swallow logic -> triggerLevelComplete (its own win: collected
 * >= targetCount) -> stars + localStorage save -> the real NEXT LEVEL button
 * chains all 30 levels. A deliberate wrong-color contact probe on level 7
 * verifies the damage rule. Engine bugs fixed first:
 *  P0 trigger radius used obj.size * 20 (full drawn size) as the radius —
 *     every 2+ color level (7-30) lost all lives at spawn, no input possible.
 *  P0 single-color tiers spawned color-undefined objects (levelColors[1] on a
 *     1-color palette) that acted as white wrong-color hazards.
 *  P1 wrong-color damage now needs contact with the drawn body — at
 *     suction+size the hazard disks tiled the whole arena on 3+ color tiers
 *     (bot with perfect avoidance collected 0 of 23 on L13).
 *  P1 objects could spawn on the hole's fixed spawn point (arena center) and
 *     damage on frame 1; tiers with 2 lives mostly spawned dead. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('color-hole-3d', { inject: {
  anchor: 'function triggerLevelComplete() {',
  exports: `globalThis.__CH = {
    st: () => G.state, lv: () => G.levelIdx,
    cfg: () => [G.level.colors.length, G.level.targetColor, G.level.targetCount, G.level.time, G.pxObstacles.length],
    objs: () => G.pxObjects.map(o => ({ x: Math.round(o.x), y: Math.round(o.y), c: o.color, s: o.state, sz: Math.round(o.size) })),
    hole: () => [Math.round(G.hole.x), Math.round(G.hole.y), Math.round(G.hole.radius)], sr: () => G.suctionRadius,
    lives: () => G.lives, timer: () => G.timer, col: () => G.collected, score: () => G.score,
    save: () => saveData, stars: () => document.getElementById('complete-stars').textContent,
    scr: (id) => !document.getElementById(id).classList.contains('hidden'),
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('menu-renders', call('__CH.st()') === 'MENU' && call('__CH.scr("screen-menu")') === true, 'st=' + call('__CH.st()'));

// first play -> tutorial -> real Skip button starts level 1
g.els['btn-play'].click();
T('tutorial-shows', call('__CH.scr("screen-tutorial")') === true, 'tut=' + call('__CH.scr("screen-tutorial")'));
g.els['btn-tutorial-skip'].click(); g.pump(3);
const cfg1 = call('__CH.cfg()');
T('l1-starts', call('__CH.st()') === 'PLAYING' && call('__CH.lv()') === 0 &&
  cfg1[0] === 1 && cfg1[3] === 60 && call('__CH.objs()').every(o => o.c === cfg1[1]),
  'st=' + call('__CH.st()') + ' cfg=' + JSON.stringify(cfg1));

// ---- real pointer mechanics on level 1 (all-target tier) ----
const RECT = g.els['gameCanvas'].getBoundingClientRect();
function steer(gx, gy, ev) {
  g.els['gameCanvas'].dispatch(ev || 'pointermove', { clientX: RECT.left + gx, clientY: RECT.top + gy, preventDefault() {} });
}
const h0 = call('__CH.hole()');
steer(h0[0], h0[1], 'pointerdown'); // hold the drag for the whole run
let sawSuction = false, dragOK = false;
for (let f = 0; f < 60; f++) {
  const t = call('__CH.objs()').filter(o => o.c === cfg1[1] && o.s === 'idle')[0];
  if (!t) break;
  steer(t.x, t.y); g.pump(1);
  const h = call('__CH.hole()');
  if (!dragOK && Math.hypot(h[0] - h0[0], h[1] - h0[1]) > 10) dragOK = true;
  if (call('__CH.objs()').some(o => o.s === 'suctioned')) { sawSuction = true; break; }
}
T('drag-moves-hole', dragOK, 'hole delta ' + Math.round(Math.hypot(call('__CH.hole()')[0] - h0[0], call('__CH.hole()')[1] - h0[1])));
T('suction-starts', sawSuction, 'no suctioned object');

// ---- play a level to the ENGINE's own win; reused for all 30 ----
let probeHit = false; // deliberate wrong-color contact fired the damage rule
function playLevel(margin, mode) {
  // reset the drag so a stale pointer from the previous attempt cannot fly
  // the hole into a hazard right after a retry
  steer(0, 0, 'pointerup');
  const hs = call('__CH.hole()');
  steer(hs[0], hs[1]); steer(hs[0], hs[1], 'pointerdown');
  let rngS = 777 + margin * 13 + (mode === 'random3' ? 5 : 0);
  const rnd = () => (rngS = (rngS * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  let frames = 0, tgt = null, pickAge = 0, lastCol = -1, colStall = 0, unstick = 0;
  let probed = false, probeOn = (mode === 'probe');
  const t0 = Date.now();
  for (;;) {
    if (call('__CH.st()') !== 'PLAYING') return call('__CH.st()');
    if (Date.now() - t0 > 25000) return 'budget';
    const hole = call('__CH.hole()'), objs = call('__CH.objs()'), sr = call('__CH.sr()');
    const tc = call('__CH.cfg()')[1];
    const col = call('__CH.col()');
    if (col === lastCol) colStall++; else { colStall = 0; lastCol = col; }
    if (colStall > 240) { tgt = null; pickAge = 99; }
    if (colStall > 600) { unstick = 50; colStall = 0; }
    const wrong = objs.filter(o => o.c !== tc && o.s === 'idle');
    const targets = objs.filter(o => o.c === tc && o.s === 'idle');
    if (probeOn && !probed) { // drive straight into the nearest wrong body, once
      const w = wrong[0];
      if (w) {
        steer(w.x, w.y); g.pump(1); frames++;
        const bounced = call('__CH.objs()').some(o => o.s === 'bouncing');
        if (bounced || call('__CH.lives()') < 3) { probeHit = true; probed = true; probeOn = false; }
        continue;
      }
      probed = true; probeOn = false;
    }
    if (unstick > 0) { // orbit-breaker: run to far points for a while
      unstick--;
      steer(40 + (frames % 3) * 190, 110 + (frames % 2) * 400); g.pump(1); frames++; continue;
    }
    if (!tgt || pickAge > 50 || !targets.some(t => t.x === tgt.x && t.y === tgt.y)) {
      const scored = [];
      for (const t of targets) {
        const d = Math.hypot(t.x - hole[0], t.y - hole[1]);
        let cluster = 0;
        for (const t2 of targets) if (Math.hypot(t2.x - t.x, t2.y - t.y) < 110) cluster++;
        let s = d * 0.6 - (mode === 'nearest' ? 0 : cluster * 90);
        for (const o of wrong) if (Math.hypot(o.x - t.x, o.y - t.y) < o.sz + 78) s += 600; // sucking it endangers
        scored.push({ t, s });
      }
      scored.sort((a, b) => a.s - b.s);
      let pick = scored[0];
      if (mode === 'random3' && scored.length > 1) pick = scored[Math.floor(rnd() * Math.min(3, scored.length))];
      tgt = pick ? pick.t : null; pickAge = 0;
    }
    pickAge++;
    if (!tgt) { g.pump(2); frames += 2; continue; }
    // attraction to the chosen target + repulsion near wrong bodies
    let ax = tgt.x - hole[0], ay = tgt.y - hole[1];
    const ad = Math.hypot(ax, ay) || 1; ax /= ad; ay /= ad;
    let rx = 0, ry = 0, minWrong = 1e9;
    for (const o of wrong) {
      const dx = hole[0] - o.x, dy = hole[1] - o.y, d = Math.hypot(dx, dy) || 1;
      minWrong = Math.min(minWrong, d - o.sz);
      const within = o.sz + margin + 34 - d;
      if (within > 0) { const w = within / 34; rx += dx / d * w; ry += dy / d * w; }
    }
    const fx = ax + rx * 1.6, fy = ay + ry * 1.6, fd = Math.hypot(fx, fy) || 1;
    // slow down near hazards so the per-frame lerp cannot tunnel into a body
    const speed = Math.max(46, Math.min(180, (minWrong - 64) * 2.4));
    steer(hole[0] + fx / fd * speed, hole[1] + fy / fd * speed); g.pump(1); frames++;
  }
}
const res1 = playLevel(12, 'cluster');
const score1 = call('__CH.score()'), col1 = call('__CH.col()');
T('swallow-scores', res1 === 'LEVEL_COMPLETE' && col1 >= cfg1[2] && score1 > 0,
  'res=' + res1 + ' col=' + col1 + '/' + cfg1[2] + ' score=' + score1);
T('l1-win-own-engine', call('__CH.scr("screen-complete")') === true && call('__CH.stars()').includes('⭐'),
  'ov=' + call('__CH.scr("screen-complete")') + ' stars=' + call('__CH.stars()'));
const sv1 = call('__CH.save()');
T('save-recorded', sv1.levelStars[0] >= 1 && sv1.highestLevel >= 1,
  'stars=' + sv1.levelStars[0] + ' high=' + sv1.highestLevel);

// ---- chain levels 2..30 through the real NEXT LEVEL button ----
let wins = 1, stuck = '', attemptsUsed = 0;
const modes = ['cluster', 'cluster', 'nearest', 'random3', 'random3'];
const margins = [12, 22, 32, 16, 26];
const tAll = Date.now();
for (let lvl = 2; lvl <= 30; lvl++) {
  if (Date.now() - tAll > 95000) { stuck = 'host-budget@' + lvl; break; }
  g.els['btn-next-level'].click(); g.pump(3);
  if (call('__CH.st()') !== 'PLAYING' || call('__CH.lv()') !== lvl - 1) { stuck = 'chain@' + lvl; break; }
  let won = false;
  for (let att = 0; att < 5 && !won; att++) {
    attemptsUsed++;
    const m = lvl === 7 ? 'probe' : modes[att];
    const r = playLevel(margins[att], m);
    if (r === 'LEVEL_COMPLETE') won = true;
    else { g.els['btn-retry'].click(); steer(240, 320); g.pump(3); }
  }
  if (!won) { stuck = lvl + '(fail)'; break; }
  const sv = call('__CH.save()');
  if (!(sv.levelStars[lvl - 1] >= 1)) { stuck = lvl + '(no-save)'; break; }
  if (lvl === 25 && call('__CH.cfg()')[0] < 5) { stuck = lvl + '(tier4-cfg)'; break; }
  wins++;
}
T('levels-all-won', stuck === '', wins + '/30 stuck=' + stuck);
T('wrong-color-damages', probeHit === true, 'probe never bounced/damaged');
// after level 30's win, NEXT LEVEL returns to the menu (there is no level 31)
g.els['btn-next-level'].click(); g.pump(4);
T('l30-next-goes-menu', call('__CH.st()') === 'MENU' && call('__CH.scr("screen-menu")') === true,
  'st=' + call('__CH.st()'));
const svF = call('__CH.save()');
T('save-unlocks-all', svF.highestLevel === 29 && svF.levelStars.filter(s => s >= 1).length === 30,
  'high=' + svF.highestLevel + ' stars=' + svF.levelStars.filter(s => s >= 1).length);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: wins + '/30', stuck, attempts: attemptsUsed, secs: Math.round((Date.now() - tAll) / 1000),
    notes: stuck ? 'bot-limited: ' + stuck : 'P0/P1 fixes verified: all 30 levels winnable via real drags through the engine triggerLevelComplete' } };
console.log('color-hole-3d: ' + wins + '/30 levels via real pointer drags -> engine triggerLevelComplete: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
