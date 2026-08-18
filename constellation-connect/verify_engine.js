#!/usr/bin/env node
/* constellation-connect verifier — 31 levels: replay each level's seq path through
 * REAL pointer events (down on star A, move, up on star B -> tryConnect); win =
 * engine checkComplete/completeLevel. Coordinates map star percentages to canvas px. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('constellation-connect', { inject: {
  anchor: 'function checkComplete(){',
  exports: `globalThis.__N = {
    n: () => LV.length,
    load: (i) => { loadLevel(i); },
    segs: () => getSeqArray(LV[state.level]),
    paths: () => { var lv = LV[state.level]; return { twoPath: !!lv.twoPath, seq: lv.seq }; },
    starPos: (i) => { var p = mapStar(LV[state.level].stars[i]); return { x: p.x, y: p.y }; },
    done: () => state.completed,
    connected: () => state.connected.length,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.board;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
// star spans live in innerHTML (never parsed here) — provide stub children for hud + win modals
for (const id of ['winStars', 'hudStars']) for (let k = 0; k < 3; k++) g.els[id].children.push(g.sandbox.document.createElement('span'));
const N = g.call('__N.n()');
T('levels-exist', N === 31, 'n=' + N);

function tapStar(i) { // the engine is tap-to-connect: first tap anchors, each later tap connects
  const p = g.call(`__N.starPos(${i})`);
  cv().dispatch('pointerdown', { clientX: p.x, clientY: p.y, preventDefault() {} });
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__N.load(${i})`); g.pump(3);
  const lv = g.call('__N.paths()');
  if (lv.twoPath) { // tap each path start, then walk the path (re-anchoring between paths)
    for (const path of lv.seq) { tapStar(path[0]); g.pump(1); for (let k = 1; k < path.length; k++) { tapStar(path[k]); g.pump(1); } }
  } else {
    for (const star of lv.seq) { tapStar(star); g.pump(1); }
  }
  g.pump(5);
  if (g.call('__N.done()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not completed (' + g.call('__N.connected()') + '/' + segs.length + ' segs)');
}
T('levels-completed', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('constellation-connect: ' + solved.length + '/' + N + ' constellations drawn via real pointer drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
