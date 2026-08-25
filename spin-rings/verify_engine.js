#!/usr/bin/env node
/* spin-rings verifier (type A): all 30 levels + the daily challenge must be solved through
 * the real input path (pointer drag on a ring band -> snap -> engine's own checkWin/onWin).
 * The plan is derived from the engine's own ring data (each ring is the shared pattern rotated
 * by d_i steps; aligning effective rotations solves it), executed as real drags. Also
 * exercises undo (exact restore), reset, hint, star persistence, win-modal chaining. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('spin-rings', { inject: {
  anchor: 'function checkWin(){',
  exports: `globalThis.__R = {
    scene: () => S.scene, won: () => S.won, lv: () => S.levelIdx, daily: () => S.isDaily,
    moves: () => S.moves, n: () => LC.length,
    rings: () => S.rings.map(r => r.slice()),
    steps: (i) => Math.round((S.tgtRot[i] || 0) / ((Math.PI * 2) / S.cfg.s)),
    seg: () => (Math.PI * 2) / S.cfg.s, cfg: () => S.cfg,
    geo: () => ({ CX: CX, CY: CY, R0: R0, RW: RW }),
    solvedCols: () => { var c = 0; for (var j = 0; j < S.cfg.s; j++) if (isColumnSolved(j)) c++; return c; },
    stars: (i) => progress.levels[i] || 0, dailyStars: () => progress.dailyStars,
    hints: () => S.hintsLeft,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

const cv = g.els['canvas'];
const pev = (type, x, y) => cv.dispatch(type, { clientX: x, clientY: y, pointerId: 5, button: 0, isPrimary: true, preventDefault() {} });

// drag ring i by deltaSteps (shortest direction); one pointer gesture with interpolated moves
function dragRing(i, deltaSteps) {
  const geo = g.call('__R.geo()');
  const seg = g.call('__R.seg()');
  const rad = geo.R0 + i * geo.RW + geo.RW / 2;
  const a0 = 0.3; // arbitrary start angle
  const total = deltaSteps * seg;
  const px = (a) => geo.CX + Math.cos(a) * rad;
  const py = (a) => geo.CY + Math.sin(a) * rad;
  pev('pointerdown', px(a0), py(a0));
  const N = 6;
  for (let s = 1; s <= N; s++) pev('pointermove', px(a0 + total * s / N), py(a0 + total * s / N));
  pev('pointerup', px(a0 + total), py(a0 + total));
}

// solve current level: match convention is rings[0][j] === rings[i][(j+d)%s], which means
// rings[i][m] === rings[0][(m-d)%s], so aligning columns needs steps_i === (-d) mod s.
// Align all rings to the most common v_i = (-d_i) mod s to minimize moves.
function solveCurrent() {
  const rings = g.call('__R.rings()');
  const s = rings[0].length;
  const ds = rings.map(r0 => {
    for (let d = 0; d < s; d++) {
      let ok = true;
      for (let j = 0; j < s; j++) if (rings[0][j] !== r0[(j + d) % s]) { ok = false; break; }
      if (ok) return d;
    }
    return -1;
  });
  if (ds.some(d => d < 0)) return false;
  const vs = ds.map(d => (s - d) % s);
  const cnt = {}; let K = 0, best = 0;
  for (const v of vs) { cnt[v] = (cnt[v] || 0) + 1; if (cnt[v] > best) { best = cnt[v]; K = v; } }
  for (let i = 0; i < rings.length; i++) {
    let delta = (vs[i] - K) % s; if (delta < 0) delta += s;
    if (delta === 0) continue;
    if (delta > s / 2) delta -= s; // shortest direction
    dragRing(i, delta);
  }
  return true;
}

g.els['play-btn'].click();
T('start-game', g.call('__R.scene()') === 'playing', 'scene=' + g.call('__R.scene()'));

// --- control exercises on level 1 before solving ---
dragRing(0, 1);
T('rotate-counts-move', g.call('__R.moves()') === 1, 'moves=' + g.call('__R.moves()'));
const before = g.call('__R.steps(0)');
g.els['btn-undo'].click();
T('undo-restores', g.call('__R.moves()') === 0 && g.call('__R.steps(0)') === before - 1,
  'moves=' + g.call('__R.moves()') + ' steps=' + g.call('__R.steps(0)'));
g.els['btn-hint'].click();
T('hint-consumed', g.call('__R.hints()') < 3, 'hints=' + g.call('__R.hints()'));
g.els['btn-reset'].click();
T('reset-works', g.call('__R.moves()') === 0 && g.call('__R.steps(0)') === 0 && !g.call('__R.won()'),
  'moves=' + g.call('__R.moves()'));

const solved = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < 30 && Date.now() - T0 < 95000; li++) {
  if (g.call('__R.lv()') !== li || g.call('__R.daily()')) { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  if (!solveCurrent()) { notes.push('L' + (li + 1) + ' pattern mismatch (rings not rotations of a shared pattern)'); fails.push('L' + (li + 1) + ' unsolvable-by-design'); break; }
  g.pump(70); // 350ms win-check timeout + 600ms modal
  if (!g.call('__R.won()')) {
    notes.push('L' + (li + 1) + ' not won: solvedCols=' + g.call('__R.solvedCols()') + '/' + g.call('__R.cfg()').s + ' moves=' + g.call('__R.moves()'));
    fails.push('L' + (li + 1) + ' not won');
    break;
  }
  T('L' + (li + 1) + '-stars', g.call('__R.stars(' + li + ')') >= 1, 'stars=' + g.call('__R.stars(' + li + ')'));
  solved.push(li + 1);
  if (li < 29) g.els['win-next'].click();
}
T('all-30-solved', solved.length === 30, 'solved=' + solved.length + '/30 ' + notes.slice(0, 4).join('|'));

// final win-next returns to menu; then daily challenge
g.els['win-next'].click();
T('back-to-menu', g.call('__R.scene()') === 'menu', 'scene=' + g.call('__R.scene()'));
g.els['daily-btn'].click();
T('daily-starts', g.call('__R.scene()') === 'playing' && g.call('__R.daily()') === true, 'scene=' + g.call('__R.scene()'));
if (g.call('__R.scene()') === 'playing') {
  if (solveCurrent()) {
    g.pump(70);
    T('daily-solved', g.call('__R.won()') === true && g.call('__R.dailyStars()') >= 1,
      'won=' + g.call('__R.won()') + ' stars=' + g.call('__R.dailyStars()'));
  } else T('daily-solved', false, 'pattern mismatch');
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/30', notes: notes.slice(0, 6) } };
console.log('spin-rings: ' + solved.length + '/30 levels + daily solved via real ring drags: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
