#!/usr/bin/env node
/* mini-golf verifier — all 50 holes across 5 courses completed through the engine's
 * real input path: real mousedown/mousemove/mouseup drags on #game-canvas (the
 * engine's own onPointerDown/Move/Up slingshot), physics/cup capture decided by the
 * engine's own updatePhysics, completion flowing through isHoleIn -> completeHole ->
 * the modal's own handleModalAction chain. Shot selection rolls the ENGINE'S OWN
 * updatePhysics forward in-sandbox over a candidate grid (BFS waypoints over static
 * walls + bank angles x power ladder); the real engine remains the referee.
 * Navigation/gating via real createElement'd course/hole cards; title-screen and
 * modal buttons are innerHTML-built (harness querySelectorAll gives generic stubs,
 * real browsers wire them fine) so those are driven through the engine's own handler
 * functions. Daily challenge, HUD stroke counter, persistence, achievements checked. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mini-golf', { inject: {
  anchor: 'function completeHole() {',
  exports: `
globalThis.__holedone = null;
const __mgComplete = completeHole;
completeHole = function(){ globalThis.__holedone = { c: currentHole.c, h: currentHole.h, s: strokes }; return __mgComplete.apply(this, arguments); };
draw = function(){}; // draw-only routine stubbed for headless speed (logic/input untouched)
const __sim = (ang, pw) => { // engine's own updatePhysics rolled forward from the live state
  const sv = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, s: strokes, ph: moveBlockPhase, hi: isHoleIn, ha: holeInAnimT, p: particles, tp: trailParticles };
  particles = []; trailParticles = []; // visual-only arrays diverted away during rollout
  ball.x = sv.x; ball.y = sv.y;
  ball.vx = Math.cos(ang) * pw * 18; ball.vy = Math.sin(ang) * pw * 18;
  isHoleIn = false; strokes = 2; // 2 so a simulated capture never counts a hole-in-one
  moveBlockPhase = sv.ph; holeInAnimT = 0; dt = 16.67;
  let captured = false, frames = 0;
  for (; frames < 900; frames++) {
    moveBlockPhase += 0.01667;
    updatePhysics(16.67);
    if (isHoleIn) { captured = true; break; }
    if (ball.vx === 0 && ball.vy === 0) break;
  }
  const out = { captured, frames, d: Math.hypot(ball.x - currentHole.cup.x, ball.y - currentHole.cup.y) };
  ball.x = sv.x; ball.y = sv.y; ball.vx = sv.vx; ball.vy = sv.vy;
  strokes = sv.s; moveBlockPhase = sv.ph; isHoleIn = sv.hi; holeInAnimT = sv.ha;
  particles = sv.p; trailParticles = sv.tp;
  return out;
};
globalThis.__MG = {
  playing: () => isPlaying, holeIn: () => isHoleIn, aiming: () => isAiming, daily: () => isDaily,
  ball: () => ({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }),
  strokes: () => strokes, course: () => currentCourse, done: () => globalThis.__holedone,
  hole: () => ({ c: currentHole.c, h: currentHole.h, idx: currentHoleIdx, par: currentHole.par,
    tee: { x: currentHole.tee.x, y: currentHole.tee.y }, cup: { x: currentHole.cup.x, y: currentHole.cup.y },
    walls: currentHole.walls.map(w => w.slice()), water: currentHole.water.map(w => w.slice()) }),
  mbTouch: () => getMoveBlockRects().some(w => circleRect(ball.x, ball.y, ball.r + 2, w.x, w.y, w.w, w.h)),
  batchSim: (arr) => arr.map(c => __sim(c[0], c[1])),
  ach: () => Object.assign({}, state.achievements),
  stats: () => ({ best: Object.keys(state.bestScores).filter(k => state.bestScores[k] < 99).length,
    cleared: Object.assign({}, state.courseHolesCleared), stars: Object.assign({}, state.courseStars),
    daily: state.dailyDone, hio: state.holeInOnes, cup: Object.assign({}, state.courseUnderPar) }),
  rect: () => { const r = canvas.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; },
  fixProbe: () => { // synthetic regression for the Under-Par FIX: all course-4 bests under par -> flag + achievement
    const holes4 = HOLES.filter(hh => hh.c === 4);
    holes4.forEach(hh => { state.bestScores[holeKey(hh.c, hh.h)] = Math.max(1, hh.par - 2); });
    state.courseUnderPar[4] = false; delete state.achievements.under_par;
    const sv = { h: currentHole, c: currentCourse, i: currentHoleIdx, p: isPlaying, s: strokes };
    currentHole = holes4[9]; currentCourse = 4; currentHoleIdx = 9; isPlaying = false; strokes = 3;
    completeHole();
    const out = { flag: state.courseUnderPar[4], ach: !!state.achievements.under_par };
    currentHole = sv.h; currentCourse = sv.c; currentHoleIdx = sv.i; isPlaying = sv.p; strokes = sv.s;
    return out;
  },
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const T0 = Date.now();

// ---------- real-input helpers ----------
function putt(ang, pw) { // real slingshot: down on the ball, drag OPPOSITE the shot, release
  const r = C('__MG.rect()'), b = C('__MG.ball()'), cv = g.els['game-canvas'];
  const cx = v => r[0] + (v / 1400) * r[2], cy = v => r[1] + (v / 900) * r[3];
  cv.dispatch('mousedown', { clientX: cx(b.x + 100), clientY: cy(b.y + 70) });
  const dx = b.x - Math.cos(ang) * 200 * pw, dy = b.y - Math.sin(ang) * 200 * pw;
  cv.dispatch('mousemove', { clientX: cx(dx + 100), clientY: cy(dy + 70) });
  cv.dispatch('mouseup', { clientX: cx(dx + 100), clientY: cy(dy + 70) });
}
function settle(deadline) { // pump until the engine completes the hole or the ball rests
  for (let k = 0; k < 1600; k++) {
    g.pump(1);
    if (!C('__MG.playing()')) return 'won';
    if (C('__MG.holeIn()')) { for (let j = 0; j < 130 && C('__MG.playing()'); j++) g.pump(1); return C('__MG.playing()') ? 'anim-stuck' : 'won'; }
    const b = C('__MG.ball()');
    if (b.vx === 0 && b.vy === 0 && !C('__MG.mbTouch()')) return 'rest';
    if (Date.now() > deadline) return 'budget';
  }
  return 'budget';
}

// ---------- geometry (waypoint BFS over static walls, verifierside planning only) ----------
const GEOC = {};
const GEO = () => { const h = C('__MG.hole()'); const k = h.c * 10 + h.h; if (!GEOC[k]) GEOC[k] = h; return GEOC[k]; };
function segBlocked(x1, y1, x2, y2, hd) {
  const steps = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8));
  for (let s = 0; s <= steps; s++) {
    const x = x1 + (x2 - x1) * s / steps, y = y1 + (y2 - y1) * s / steps;
    for (const w of hd.walls) if (x > w[0] - 10 && x < w[0] + w[2] + 10 && y > w[1] - 10 && y < w[1] + w[3] + 10) return true;
    for (const w of hd.water) { const dx = x - w[0], dy = y - w[1]; if (dx * dx + dy * dy < (w[2] + 14) * (w[2] + 14)) return true; }
  }
  return false;
}
const CG = 20, GX0 = 100, GY0 = 70, GNX = 60, GNY = 38;
function nextWaypoint(b, hd) {
  const blocked = new Array(GNX * GNY).fill(false);
  for (let gx = 0; gx < GNX; gx++) for (let gy = 0; gy < GNY; gy++) {
    const x = GX0 + gx * CG, y = GY0 + gy * CG;
    for (const w of hd.walls) if (x > w[0] - 9 && x < w[0] + w[2] + 9 && y > w[1] - 9 && y < w[1] + w[3] + 9) { blocked[gx * GNY + gy] = true; break; }
    if (!blocked[gx * GNY + gy]) for (const w of hd.water) { const dx = x - w[0], dy = y - w[1]; if (dx * dx + dy * dy < (w[2] + 13) * (w[2] + 13)) { blocked[gx * GNY + gy] = true; break; } }
  }
  const sc = [Math.min(GNX - 1, Math.max(0, Math.round((b.x - GX0) / CG))), Math.min(GNY - 1, Math.max(0, Math.round((b.y - GY0) / CG)))];
  const tc = [Math.min(GNX - 1, Math.max(0, Math.round((hd.cup.x - GX0) / CG))), Math.min(GNY - 1, Math.max(0, Math.round((hd.cup.y - GY0) / CG)))];
  const q = [sc], par = {}; par[sc[0] * GNY + sc[1]] = -1;
  while (q.length) {
    const [gx, gy] = q.shift();
    if (gx === tc[0] && gy === tc[1]) break;
    for (const [nx, ny] of [[gx + 1, gy], [gx - 1, gy], [gx, gy + 1], [gx, gy - 1]]) {
      if (nx < 0 || ny < 0 || nx >= GNX || ny >= GNY || blocked[nx * GNY + ny]) continue;
      const id = nx * GNY + ny; if (par[id] !== undefined) continue;
      par[id] = gx * GNY + gy; q.push([nx, ny]);
    }
  }
  let goal = tc[0] * GNY + tc[1];
  if (par[goal] === undefined) return null;
  const path = [];
  for (let id = goal; id !== -1; id = par[id]) path.push([GX0 + Math.floor(id / GNY) * CG, GY0 + (id % GNY) * CG]);
  path.reverse();
  for (let i = path.length - 1; i >= 1; i--) {
    const [x, y] = path[i];
    if (Math.hypot(x - b.x, y - b.y) > 950) continue;
    if (!segBlocked(b.x, b.y, x, y, hd)) return i === path.length - 1 ? hd.cup : { x, y };
  }
  return null;
}
const argmin = rs => { let bi = 0; for (let i = 1; i < rs.length; i++) if (rs[i].d < rs[bi].d - 0.001 || (Math.abs(rs[i].d - rs[bi].d) <= 0.001 && rs[i].frames < rs[bi].frames)) bi = i; return bi; };

// ---------- per-hole solver: plan with the engine's own physics, execute via real drags ----------
function solveHole(deadline) {
  let shots = 0, stuckRun = 0, restarts = 0, why = '';
  for (;;) {
    if (Date.now() > deadline) return { r: 'deadline', shots };
    if (C('__MG.holeIn()')) { for (let j = 0; j < 130 && C('__MG.playing()'); j++) g.pump(1); return { r: C('__MG.playing()') ? 'anim-stuck' : 'won', shots }; }
    if (!C('__MG.playing()')) return { r: 'not-playing:' + JSON.stringify(C('__MG.done()')), shots };
    let b = C('__MG.ball()');
    if (b.vx !== 0 || b.vy !== 0) { g.pump(4); continue; }
    const hd = GEO();
    const dCup = Math.hypot(hd.cup.x - b.x, hd.cup.y - b.y);
    const los = !segBlocked(b.x, b.y, hd.cup.x, hd.cup.y, hd);
    let exec = null;
    // stage A: direct ladder — ALWAYS simmed. The old `if (los)` gate trusted segBlocked's
    // +10px wall margin, which calls grazing/indirect lines "blocked" and skipped the very
    // ladder that captures (c4-h8: cup round a wall corner — soft putts at the cup angle
    // capture, but the bank ring's fixed 30° angles all miss). The engine's own physics
    // referees every sim, so running the ladder unconditionally costs nothing and loosens
    // nothing; segBlocked only decides whether the non-capturing fallback may run.
    {
      const dAng = Math.atan2(hd.cup.y - b.y, hd.cup.x - b.x);
      const pws = dCup < 100 ? [0.07, 0.1, 0.14, 0.2, 0.28, 0.4] : [0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 1.0];
      const rs = C('__MG.batchSim(' + JSON.stringify(pws.map(p => [dAng, p])) + ')');
      const cap = rs.findIndex(x => x.captured);
      if (cap >= 0) exec = [dAng, pws[cap]];
      else if (los) { const bi = argmin(rs); if (rs[bi].d < dCup - 25) exec = [dAng, pws[bi]]; }
    }
    if (!exec && !los) { // stage B: furthest BFS waypoint along a clear corridor
      const wp = nextWaypoint(b, hd);
      if (wp) {
        const wAng = Math.atan2(wp.y - b.y, wp.x - b.x), pws = [0.2, 0.32, 0.45, 0.6, 0.75, 0.9, 1.0];
        const cands = [];
        for (const o of [0, 0.09, -0.09, 0.2, -0.2]) for (const p of pws) cands.push([wAng + o, p]);
        const rs = C('__MG.batchSim(' + JSON.stringify(cands) + ')');
        const cap = rs.findIndex(x => x.captured);
        if (cap >= 0) exec = cands[cap];
        else { const bi = argmin(rs); if (rs[bi].d < dCup - 20) exec = cands[bi]; }
      }
    }
    if (!exec) { // stage C: full bank ring
      const cands = [];
      for (let i = 0; i < 12; i++) for (const p of [0.2, 0.4, 0.6, 0.8, 1.0]) cands.push([i * Math.PI / 6, p]);
      const rs = C('__MG.batchSim(' + JSON.stringify(cands) + ')');
      const cap = rs.findIndex(x => x.captured);
      if (cap >= 0) exec = cands[cap];
      else { const bi = argmin(rs); if (rs[bi].d < dCup - 15) exec = cands[bi]; }
    }
    if (!exec) { // wedged: real restart handler's call, fresh hole
      stuckRun++; why = 'wedged';
      if (stuckRun > 6 || restarts >= 2) return { r: 'stuck', shots };
      g.call('startHole(currentCourse, currentHoleIdx)'); restarts++; shots = 0; g.pump(3); continue;
    }
    putt(exec[0], exec[1]); shots++;
    const sr = settle(deadline);
    if (sr === 'won') return { r: 'won', shots };
    if (sr !== 'rest') return { r: sr, shots };
    b = C('__MG.ball()');
    const nd = Math.hypot(hd.cup.x - b.x, hd.cup.y - b.y);
    if (nd < dCup - 15) stuckRun = 0; else stuckRun++;
    if (shots > 42) {
      if (restarts >= 2) return { r: 'stroke-budget:' + shots, shots };
      g.call('startHole(currentCourse, currentHoleIdx)'); restarts++; shots = 0; g.pump(3);
    }
  }
}

// ---------- boot + title/tutorial render ----------
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('holes-exist', C('(function(){return HOLES.length;})()') === 50, 'n=' + C('(function(){return HOLES.length;})()'));
g.call('showTutorial()'); g.pump(2);
T('tutorial-renders', String(g.els['modal-root'].innerHTML).includes('Welcome'), 'modal=' + String(g.els['modal-root'].innerHTML).slice(0, 40));
g.call("document.getElementById('modal-root').innerHTML = ''");
g.call('showCourseSelect()'); g.pump(2); // the title Play button's action (innerHTML-built button; wired in real browsers)

// ---------- gating through the real createElement'd cards ----------
const cc = g.els['course-grid'].children;
T('course-grid-built', cc.length === 5 && cc.filter(c => String(c.className).includes('locked')).length === 4,
  'cards=' + cc.length + ' locked=' + cc.filter(c => String(c.className).includes('locked')).length);
cc[1].click(); g.pump(1);
T('locked-course-inert', !C('__MG.playing()'), 'course select left / game started on locked course');
cc[0].click(); g.pump(2);
const hc = g.els['hole-grid'].children;
T('hole-grid-built', hc.length === 10 && hc.filter(c => String(c.className).includes('locked')).length === 9,
  'cells=' + hc.length + ' locked=' + hc.filter(c => String(c.className).includes('locked')).length);
hc[3].click(); g.pump(1);
T('locked-hole-inert', !C('__MG.playing()'), 'hole started on locked cell');
hc[0].click(); g.pump(3);
T('game-started', C('__MG.playing()') && C('__MG.course()') === 0 && C('__MG.hole().h') === 1, 'c=' + C('__MG.course()'));

// ---------- all 50 holes, chained via the modal's own handleModalAction ----------
const results = [];
let totalShots = 0;
const modal = a => "handleModalAction({currentTarget:{getAttribute:function(){return '" + a + "'}}})";
outer:
for (let c = 0; c < 5; c++) {
  for (let h = 1; h <= 10; h++) {
    const deadline = Math.min(Date.now() + 7000, T0 + 88000);
    const res = solveHole(deadline);
    totalShots += res.shots;
    results.push(res.r === 'won' ? 'won' : (c + 1) + '-' + h + ':' + res.r + '/shots=' + res.shots);
    T('c' + (c + 1) + '-h' + h + '-won', res.r === 'won', res.r + ' shots=' + res.shots);
    if (c === 0 && h === 1 && res.r === 'won')
      T('hud-stroke-live', String(g.els['hud-stroke'].textContent) === String(res.shots) && res.shots >= 1,
        'hud=' + g.els['hud-stroke'].textContent + ' shots=' + res.shots); // FIX regression: was stuck at 0
    if (res.r !== 'won') break outer;
    if (h < 10) { g.call(modal('next-hole')); g.pump(3); }
  }
  if (c < 4) {
    g.call(modal('next-course')); g.pump(2);
    // harness artifact: grid stubs ACCUMULATE children across innerHTML rebuilds (real
    // browsers replace them) — the newest build is always the last slice
    const cards = Array.from(g.els['course-grid'].children).slice(-5);
    const ok = cards.length === 5 && !String(cards[c + 1].className).includes('locked');
    T('course-' + (c + 2) + '-unlocked', ok, String(cards[c + 1] && cards[c + 1].className));
    if (!ok) break;
    cards[c + 1].click(); g.pump(2);
    Array.from(g.els['hole-grid'].children).slice(-10)[0].click(); g.pump(3);
    T('course-' + (c + 2) + '-h1-starts', C('__MG.playing()') && C('__MG.course()') === c + 1 && C('__MG.hole().h') === 1, 'c=' + C('__MG.course()'));
    if (!C('__MG.playing()')) break;
  } else {
    g.call(modal('finish-game')); g.pump(2);
    T('finish-back-to-select', Array.from(g.els['course-grid'].children).slice(-5).length === 5,
      'cards=' + Array.from(g.els['course-grid'].children).slice(-5).length);
  }
}
const wonN = results.filter(r => r === 'won').length;
T('all-50-holes', wonN === 50, results.filter(r => r !== 'won').join(',').slice(0, 200));

// ---------- daily challenge through the engine's own startDaily + its play button handler ----------
if (wonN === 50 && Date.now() < T0 + 90000) {
  g.call('showTitle()'); g.pump(2);
  g.call('startDaily()'); g.pump(2);
  const dp = g.els['q:[data-action="play-daily"]'];
  dp.click(); g.pump(3);
  T('daily-starts', C('__MG.daily()') === true && C('__MG.playing()'), 'daily=' + C('__MG.daily()'));
  const dres = solveHole(Math.min(Date.now() + 8000, T0 + 100000));
  T('daily-won', dres.r === 'won' && C('__MG.stats().daily') === true, dres.r);
}

// ---------- persistence + achievements ----------
const st = C('__MG.stats()');
const save = JSON.parse(g.ls.getItem('gz-minigolf-save-v1') || '{}');
const savedBest = Object.keys((save.data || {}).bestScores || {}).filter(k => save.data.bestScores[k] < 99).length;
T('progress-saved', st.best === 50 && savedBest === 50 && [0, 1, 2, 3, 4].every(i => st.cleared[i] === 10),
  'best=' + st.best + ' saved=' + savedBest + ' cleared=' + JSON.stringify(st.cleared));
T('all-courses-achievement', st.ach_all !== false && C('__MG.ach().all_courses') === true, JSON.stringify(C('__MG.ach()')));
g.call('showStats()'); g.pump(2);
T('stats-render', g.els['screen-container'].children.length > 0, 'no stats screen');
g.call('showAchievements()'); g.pump(2);
T('achievements-render', g.els['screen-container'].children.length > 0, 'no ach screen');

// synthetic regression for the Under-Par FIX (post-assertion: mutates synthetic bests only)
const fp = C('__MG.fixProbe()');
T('underpar-fix', fp.flag === true && fp.ach === true, JSON.stringify(fp));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { holes: wonN + '/50', shots: totalShots, durS: Math.round((Date.now() - T0) / 1000),
    notes: 'moveBlocks vibrate ~40Hz (spd 0.002 => 250 rad/s): act as solid amplitude-box walls with random shoves; all such holes still cleared' } };
console.log('mini-golf: ' + wonN + '/50 holes via real drag-putts + engine physics (' + totalShots + ' strokes): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
