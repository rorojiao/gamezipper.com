#!/usr/bin/env node
/* color-blend verifier — 27 color-mixing levels: solve each by choosing drop counts
 * (r,g,b) that minimize Euclidean distance to the target within tolerance, then add
 * those drops through REAL well button clicks and press CHECK. Win = complete modal. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('color-blend', { inject: {
  anchor: 'function addDrop(channel){',
  exports: `globalThis.__M = {
    n: () => LEVELS.length,
    lvl: (i) => ({ target: LEVELS[i].target, tol: LEVELS[i].tol, max: LEVELS[i].max }),
    load: (i) => loadLevel(i),
    mix: () => ({ r: state.mix.r, g: state.mix.g, b: state.mix.b }),
    used: () => ({ r: state.dropsUsed.r, g: state.dropsUsed.g, b: state.dropsUsed.b }),
    complete: () => !dom.completeModal.classList.contains('hidden') || !dom.victoryModal.classList.contains('hidden'),
    hideComplete: () => { dom.completeModal.classList.add('hidden'); },
    idx: () => state.levelIdx,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__M.n()');
T('levels-exist', N === 27, 'n=' + N);

const DROP = 17;
function bestCounts(target, tol, max) {
  let best = null, bestDist = 1e9;
  for (let r = 0; r <= max.r; r++) for (let gr = 0; gr <= max.g; gr++) for (let b = 0; b <= max.b; b++) {
    const dr = Math.min(r * DROP, 255) - target[0], dg = Math.min(gr * DROP, 255) - target[1], db = Math.min(b * DROP, 255) - target[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < bestDist) { bestDist = dist; best = [r, gr, b]; }
  }
  return { best, bestDist };
}

const solved = [];
for (let i = 0; i < N; i++) {
  const lv = g.call(`__M.lvl(${i})`);
  const { best, bestDist } = bestCounts(lv.target, lv.tol, lv.max);
  if (bestDist > lv.tol) { fails.push('L' + (i + 1) + ' unreachable target (best dist ' + bestDist.toFixed(1) + ' > tol ' + lv.tol + ')'); continue; }
  g.call(`__M.load(${i})`); g.pump(2);
  g.els.tutorialTip && g.els.tutorialTip.classList.add('hidden');
  const wells = { r: g.els.wellR, g: g.els.wellG, b: g.els.wellB };
  for (const ch of ['r', 'g', 'b']) for (let k = 0; k < best[ch === 'r' ? 0 : ch === 'g' ? 1 : 2]; k++) wells[ch].dispatch('click', {});
  g.pump(2);
  g.els.checkBtn.dispatch('click', {});
  g.pump(10);
  if (g.call('__M.complete()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' check failed (dist ' + bestDist.toFixed(1) + ' tol ' + lv.tol + ')');
  g.call('__M.hideComplete()');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('color-blend: ' + solved.length + '/' + N + ' targets matched via real well clicks + CHECK: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
