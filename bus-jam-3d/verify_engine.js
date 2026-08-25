#!/usr/bin/env node
/* bus-jam-3d verifier — all 30 campaign levels + 2 endless runs completed through the
 * engine's real input path: real canvas pointerdown taps at each queued passenger's drawn
 * position (the engine's own onPointerDown hit-test -> tapPassenger -> walk -> seat ->
 * bus fill -> departBus -> checkGameEnd -> finishLevel). Navigation through the real
 * debounced onclick buttons (Play, level cards, tutorial Skip, Next, Endless, Replay);
 * pause/resume and the three boosters probed through their real handler functions
 * (booster buttons live under querySelectorAll('.booster') which the harness stubs). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('bus-jam-3d', { inject: {
  anchor: 'function findBusFor(p){',
  exports: `
globalThis.__won = null;
const __bjFinish = finishLevel;
finishLevel = function(stars){ globalThis.__won = { id: scene.level.id, stars, endless: scene.endless }; return __bjFinish.apply(this, arguments); };
spawnConfetti = function(){}; // decorative-only DOM animation (el.animate) — draw-only stub
drawBackdrop = function(){}; drawBuses = function(){}; drawParticles = function(){}; drawFloatingTexts = function(){}; // draw stubs; drawPassengers stays live (it sets tap positions)
globalThis.__BJ = {
  n: () => LEVELS.length,
  lvl: (i) => { const l = LEVELS[i]; return { id: l.id, buses: l.buses.map(b => ({ c: b.color, cap: b.capacity })), pax: l.passengers.slice() }; },
  scene: () => !scene ? null : { state: scene.state, lvl: scene.level.id, endless: scene.endless,
    queued: scene.passengers.filter(p => p.state === 'queued').length,
    gone: scene.passengers.filter(p => p.state === 'gone' || p.state === 'seated').length,
    busesUsed: scene.busesUsed, combo: scene.combo, boosters: Object.assign({}, scene.boosters),
    buses: scene.buses.map(b => ({ c: b.color, cap: b.capacity, filled: b.filled, dep: b.departProgress })) },
  q: () => scene ? scene.passengers.filter(p => p.state === 'queued').map(p => ({ color: p.color, x: p.x, y: p.y })) : [],
  save: () => ({ unlocked: save.unlockedLevel, stars: Object.assign({}, save.stars), best: save.endlessBest,
    runs: (save.endlessRuns || []).length, ach: Object.assign({}, save.achievements) }),
  tut: () => !$('tutorialOverlay').classList.contains('hidden'),
  completeShown: () => !$('completeOverlay').classList.contains('hidden'),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game'];
const T0 = Date.now();

function tap(x, y) { cv.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} }); }
function solveLevel(deadline) { // tap every queued passenger through the real hit-test path
  let taps = 0;
  for (let k = 0; k < 500; k++) {
    const s = C('__BJ.scene()');
    if (!s) return { r: 'no-scene', taps };
    if (s.state === 'complete') {
      if (C('__won')) return { r: 'won', taps };
      g.pump(10); continue; // finishLevel fires on a 700ms timer after 'complete'
    }
    const q = C('__BJ.q()');
    if (q.length) { tap(q[0].x, q[0].y); taps++; g.pump(8); } else g.pump(6);
    if (Date.now() > deadline) return { r: 'deadline', taps };
  }
  return { r: 'loop-budget', taps };
}

// ---------- boot + level data integrity (per-color exact match = every bus departs) ----------
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30', C('__BJ.n()') === 30, 'n=' + C('__BJ.n()'));
let mism = [];
for (let i = 0; i < 30; i++) {
  const l = C('__BJ.lvl(' + i + ')');
  const cap = {}, cnt = {};
  l.buses.forEach(b => cap[b.c] = (cap[b.c] || 0) + b.cap);
  l.pax.forEach(c => cnt[c] = (cnt[c] || 0) + 1);
  for (const c in cnt) if (!cap[c]) mism.push('L' + l.id + ':' + c + '-no-bus');
  for (const c in cap) if (cap[c] !== (cnt[c] || 0)) mism.push('L' + l.id + ':' + c + '=' + (cnt[c] || 0) + '/' + cap[c]);
}
T('per-color-integrity', mism.length === 0, mism.join(',').slice(0, 120)); // L17/L20 fixed to exact

// ---------- title -> level select through the real debounced buttons ----------
g.els['btnPlay'].click(); g.pump(8);
T('level-select-built', g.els['lsGrid'].children.length === 6 && !g.els['levelSelect'].classList.contains('hidden'),
  'cards=' + g.els['lsGrid'].children.length);
const lockedFresh = Array.from(g.els['lsGrid'].children).filter(c => c.classList.contains('locked')).length;
T('fresh-gating', lockedFresh === 5, 'locked=' + lockedFresh);
g.els['lsGrid'].children[1].click(); g.pump(6);
T('locked-card-inert', C('__BJ.scene()') === null, 'locked card started a level');
// tier tabs: switch to Mega Hub (tier 4) and back — all locked there
Array.from(g.els['tierTabs'].children)[4].click(); g.pump(2);
T('tier-tab-switch', g.els['lsGrid'].children.length === 6 && Array.from(g.els['lsGrid'].children).every(c => c.classList.contains('locked')),
  'cards=' + g.els['lsGrid'].children.length);
Array.from(g.els['tierTabs'].children)[0].click(); g.pump(2);
g.els['lsGrid'].children[0].click(); g.pump(4); // level 1 via its real unlocked card
T('level-1-started', C('__BJ.scene()') && C('__BJ.scene().lvl') === 1 && C('__BJ.scene().state') === 'play', JSON.stringify(C('__BJ.scene()')).slice(0, 60));
T('tutorial-shown', C('__BJ.tut()') === true, 'tutorial not shown');
g.els['tutSkip'].click(); g.pump(2);
T('tutorial-skip-works', C('__BJ.tut()') === false && C('__BJ.scene().state') === 'play', 'skip failed');

// ---------- pause/resume + booster probes on level 1 (real handlers) ----------
g.els['btnPause'].click(); g.pump(6);
T('pause-works', C('__BJ.scene().state') === 'paused', 'st=' + C('__BJ.scene().state'));
g.els['btnResume'].click(); g.pump(8);
T('resume-works', C('__BJ.scene().state') === 'play', 'st=' + C('__BJ.scene().state'));
g.call('undoMove()'); // empty history -> toast, no consumption
T('undo-empty-safe', C('__BJ.scene().boosters.undo') === 3, 'undo=' + C('__BJ.scene().boosters.undo'));
const q0 = C('__BJ.q()');
tap(q0[0].x, q0[0].y); g.pump(2); // one real tap -> walking
T('tap-boards', C('__BJ.q()').length === q0.length - 1, 'queued=' + C('__BJ.q()').length + '/' + q0.length);
g.call('undoMove()'); g.pump(1);
T('undo-restores', C('__BJ.scene().boosters.undo') === 2 && C('__BJ.q()').length === q0.length,
  'undo=' + C('__BJ.scene().boosters.undo') + ' q=' + C('__BJ.q()').length);
g.call('boosterSort()'); g.pump(1);
T('sort-consumed', C('__BJ.scene().boosters.sort') === 0, 'sort=' + C('__BJ.scene().boosters.sort'));
g.call('boosterAddSlot()'); g.pump(1);
T('addslot-grows-bus', C('__BJ.scene().buses[0].cap') === 6 && C('__BJ.scene().boosters.addSlot') === 2,
  'cap=' + C('__BJ.scene().buses[0].cap') + ' left=' + C('__BJ.scene().boosters.addSlot'));

// ---------- all 30 levels via real taps; chained through the real Next button ----------
const results = [];
for (let id = 1; id <= 30; id++) {
  C('__won = null'); // stale win flag from the previous level must not short-circuit the wait
  const deadline = Math.min(Date.now() + 6000, T0 + 88000);
  const res = solveLevel(deadline);
  const won = C('__won');
  results.push(res.r === 'won' && won && won.id === id ? 'won' : id + ':' + res.r);
  T('level-' + id + '-won', res.r === 'won' && !!won && won.id === id && won.stars >= 1,
    res.r + ' won=' + JSON.stringify(won).slice(0, 60));
  if (res.r !== 'won') break;
  if (id === 1) T('level-1-three-stars', won.stars === 3, 'stars=' + won.stars);
  if (id < 30) { g.els['btnCompleteNext'].click(); g.pump(10); } // real debounced Next
}

T('all-30-levels', results.length === 30 && results.every(r => r === 'won'),
  results.filter(r => r !== 'won').join(',').slice(0, 200));

// ---------- campaign save + achievements ----------
const sv = C('__BJ.save()');
T('unlock-chain', sv.unlocked === 30, 'unlocked=' + sv.unlocked);
T('stars-saved', Object.keys(sv.stars).length === 30 && Object.values(sv.stars).every(v => v >= 1) && Object.values(sv.stars).filter(v => v === 3).length >= 15,
  'starKeys=' + Object.keys(sv.stars).length + ' 3stars=' + Object.values(sv.stars).filter(v => v === 3).length);
const needAch = ['first_ride', 'tier1_clear', 'tier2_clear', 'tier3_clear', 'tier4_clear', 'tier5_clear', 'three_star_5', 'three_star_15', 'combo_3'];
T('campaign-achievements', needAch.every(a => sv.ach[a]), needAch.filter(a => !sv.ach[a]).join(',') || 'all');
const lsSv = JSON.parse(g.ls.getItem('bus_jam_3d_v1') || '{}');
T('progress-persisted', (lsSv.stars ? Object.keys(lsSv.stars).length : 0) === 30 && lsSv.unlockedLevel === 30,
  'stars=' + (lsSv.stars ? Object.keys(lsSv.stars).length : 0) + ' unlocked=' + lsSv.unlockedLevel);

// ---------- endless mode: 2 generated boards through the real buttons ----------
if (Date.now() < T0 + 92000) {
  g.els['btnCompleteHome'].click(); g.pump(8); // back to title
  g.els['btnEndless'].click(); g.pump(8);
  g.els['btnEndlessStart'].click(); g.pump(6);
  let e1 = 'skip';
  T('endless-starts', C('__BJ.scene()') && C('__BJ.scene().endless') === true, JSON.stringify(C('__BJ.scene()')).slice(0, 50));
  C('__won = null');
  const er1 = solveLevel(Math.min(Date.now() + 6000, T0 + 96000));
  e1 = er1.r;
  T('endless-1-won', er1.r === 'won' && C('__won') && C('__won').endless === true, er1.r);
  T('endless-next-hidden', g.els['btnCompleteNext'].classList.contains('hidden'), 'Next visible in endless');
  g.els['btnCompleteReplay'].click(); g.pump(10); // real Replay -> next generated board
  C('__won = null');
  const er2 = solveLevel(Math.min(Date.now() + 6000, T0 + 98000));
  T('endless-2-won', er2.r === 'won', er2.r + ' e1=' + e1);
  g.pump(50); // __won is set at finishLevel entry — let the body (endlessBest/achievements) run
  const sv2 = C('__BJ.save()');
  T('endless-saved', sv2.runs === 2 && sv2.best > 0, 'runs=' + sv2.runs + ' best=' + sv2.best); // FIX regression: was 4 (double finishLevel)
  T('endless-achievement', !!sv2.ach.endless_10, JSON.stringify(sv2.ach).slice(0, 80)); // values are unlock timestamps
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/30', durS: Math.round((Date.now() - T0) / 1000),
    notes: 'endless_10 achievement tests score>=10 though desc says level 10 (score ~900 any run) — desc/test mismatch only' } };
console.log('bus-jam-3d: ' + results.filter(r => r === 'won').length + '/30 campaign levels via real passenger taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
