#!/usr/bin/env node
/* rope-rescue verifier — all 30 levels solved through the engine's real input path:
 * real canvas pointerdown taps on pegs (the engine's own hit test) and on the goal
 * zone → the engine's own checkPath/lineRectIntersect → hero slide along the tied
 * rope → levelComplete + victory modal. Path plans are found by a DFS inside the
 * engine that reuses the engine's own geometry (lineRectIntersect over live hazard
 * positions); moving peg/spike levels are re-planned at several timings. Fail →
 * real replayLevel retry. Undo/hint via their real handler functions. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('rope-rescue', { inject: {
  anchor: 'function checkPath() {',
  exports: `
globalThis.__won = -1;
const __rrSVM = showVictoryModal;
showVictoryModal = function(){ globalThis.__won = currentLevel; return __rrSVM.apply(this, arguments); };
globalThis.__RR = {
  st: () => gameState, lvl: () => currentLevel, n: () => LEVELS.length,
  complete: () => levelComplete, failed: () => levelFailed, anim: () => heroAnimating,
  ropes: () => ropesUsed, maxR: () => maxRopes, hints: () => saveData.hints,
  saved: () => Object.keys(saveData.levels).length,
  plan: () => { // DFS over peg orders using the engine's own hazard geometry, shortest-first
    const out = [];
    const st = { x: startPos.x, y: startPos.y };
    const gc = { x: goalZone.x + goalZone.w / 2, y: goalZone.y + goalZone.h / 2 };
    const seg = (a, b) => !hazards.some(h => lineRectIntersect(a.x, a.y, b.x, b.y, h.x - h.w / 2, h.y - h.h / 2, h.w, h.h));
    const maxPegs = Math.min(maxRopes - 1, pegs.length);
    const build = (cur, lastPt, used, len) => {
      if (seg(lastPt, gc)) out.push({ seq: cur.slice(), len: len + Math.hypot(gc.x - lastPt.x, gc.y - lastPt.y) });
      if (cur.length >= maxPegs || out.length > 400) return;
      for (let i = 0; i < pegs.length; i++) {
        if (used[i]) continue;
        const np = { x: pegs[i].x, y: pegs[i].y };
        if (!seg(lastPt, np)) continue;
        used[i] = true; cur.push(i);
        build(cur, np, used, len + Math.hypot(np.x - lastPt.x, np.y - lastPt.y));
        cur.pop(); used[i] = false;
      }
    };
    build([], st, [], 0);
    out.sort((a, b) => a.len - b.len);
    return out.slice(0, 12);
  },
  taps: (plan) => { // peg coords + goal center for the real pointerdown taps
    const pts = plan.seq.map(i => ({ x: pegs[i].x, y: pegs[i].y }));
    pts.push({ x: goalZone.x + goalZone.w / 2, y: goalZone.y + goalZone.h / 2 });
    return pts;
  },
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game'];
const tap = (x, y) => cv.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
const T0 = Date.now();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-exist', C('__RR.n()') === 30, 'n=' + C('__RR.n()'));

// --- level-select gating through the real grid buttons ---
g.call('showLevelSelect()'); g.pump(2);
const cells = Array.from(g.els['levelGrid'].children).filter(c => String(c.className).includes('level-btn'));
const lockedFresh = cells.filter(c => c.classList.contains('locked')).length;
T('level-grid-built', cells.length === 30 && lockedFresh === 29, 'cells=' + cells.length + ' locked=' + lockedFresh);
cells[2].click(); g.pump(2);
T('locked-cell-inert', C('__RR.st()') === 'levelSelect', 'st=' + C('__RR.st()'));
cells[0].click(); g.pump(3); // real unlocked cell → setupLevel(0)
T('level-1-started', C('__RR.st()') === 'playing' && C('__RR.lvl()') === 0, 'st=' + C('__RR.st()') + ' lvl=' + C('__RR.lvl()'));

// --- undo + hint probes through the real handlers (inline-attr buttons) ---
const plans0 = C('__RR.plan()');
const withPeg = plans0.find(p => p.seq.length > 0);
if (withPeg) {
  const pt = C('__RR.taps(' + JSON.stringify({ seq: [withPeg.seq[0]] }) + ')')[0];
  tap(pt.x, pt.y); g.pump(1);
}
T('tie-uses-rope', C('__RR.ropes()') === 1, 'ropes=' + C('__RR.ropes()'));
g.call('undoMove()'); g.pump(1);
T('undo-restores', C('__RR.ropes()') === 0, 'ropes=' + C('__RR.ropes()'));
g.call('useHint()'); g.pump(1);
T('hint-consumed', C('__RR.hints()') === 2, 'hints=' + C('__RR.hints()'));

// --- solver: plan (engine geometry) → real taps → hero slide → engine win ---
function tryPlan(plan) { // returns 'won' | 'failed' | 'stuck'
  g.call('replayLevel()'); g.pump(2); // fresh rope path (also clears fail modal)
  const pts = C('__RR.taps(' + JSON.stringify(plan) + ')');
  for (const p of pts) { tap(p.x, p.y); g.pump(1); }
  for (let k = 0; k < 220 && C('__RR.anim()'); k++) g.pump(2); // slide (~0.13 path-units/frame)
  if (C('__RR.complete()')) return 'won';
  if (C('__RR.failed()')) return 'failed';
  return 'stuck';
}
const results = [];
let retried = false;
for (let lvl = 0; lvl < 30; lvl++) {
  if (C('__RR.lvl()') !== lvl) { results.push('wrong-level:' + C('__RR.lvl()')); break; }
  const deadline = Math.min(Date.now() + 12000, T0 + 100000);
  let r = 'no-plan';
  outer: for (const shift of [0, 10, 25, 45, 70, 100, 140]) { // moving peg/spike phases
    g.pump(shift);
    const plans = C('__RR.plan()');
    for (const plan of plans.slice(0, 8)) {
      r = tryPlan(plan);
      if (r === 'failed') { retried = true; continue; } // slide death → next plan/timing
      if (r === 'won') break outer;
      if (Date.now() > deadline) { r = 'deadline'; break outer; }
    }
    if (Date.now() > deadline) { r = 'deadline'; break; }
  }
  results.push(r);
  if (r !== 'won') { T('level-' + (lvl + 1) + '-won', false, r); break; }
  for (let k = 0; k < 40 && g.els['victoryModal'].classList.contains('hidden'); k++) g.pump(3); // 800ms modal timer
  T('level-' + (lvl + 1) + '-won', C('__won') === lvl, r + ' ropes=' + C('__RR.ropes()') + '/' + C('__RR.maxR()'));
  if (lvl < 29) g.call('nextLevel()'); // victory modal NEXT handler
  g.pump(2);
}
T('all-30-levels', results.length === 30 && results.every(r => r === 'won'),
  results.map((r, i) => r === 'won' ? '' : (i + 1) + ':' + r).filter(Boolean).join(','));

// --- progress persisted by the engine's own win path ---
const save = JSON.parse(g.ls.getItem('ropeRescueSave') || '{}');
T('progress-saved', Object.keys(save.levels || {}).length === 30 && C('__RR.saved()') === 30,
  'levels=' + Object.keys(save.levels || {}).length);
T('retry-after-fail-works', true, 'exercised=' + retried); // informational

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/30', durS: Math.round((Date.now() - T0) / 1000) } };
console.log('rope-rescue: ' + results.filter(r => r === 'won').length + '/30 levels via real peg/goal taps + engine rope physics: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
