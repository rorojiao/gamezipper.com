#!/usr/bin/env node
/* burger-stack verifier — 25 levels played through the REAL ingredient-bar buttons:
 * build each customer's recipe bottom-to-top, Serve, chain perfect combos; win =
 * engine's own level pass (score >= target within time). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('burger-stack', { inject: {
  anchor: 'function serveOrder() {',
  exports: `globalThis.__G = {
    n: () => LEVELS.length,
    start: (l) => startLevel(l),
    screen: () => S.screen,
    score: () => G ? G.score : -1,
    tgt: () => G ? G.def.tgt : 0,
    cusIdx: () => G ? G.cusIdx : -1,
    cusCount: () => G ? G.customers.length : 0,
    order: () => G && G.customers[G.cusIdx] ? G.customers[G.cusIdx].order : null,
    finished: () => G ? G.finished : true,
    passed: () => S.screen === 'complete',
    stack: () => G ? G.playerStack.slice() : [],
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__G.n()');
T('levels-exist', N === 25, 'n=' + N);

function ingButtons() {
  const bar = g.els['ingredient-bar'];
  const out = {};
  for (const b of (bar.children || [])) out[(b.textContent || '').toLowerCase()] = b;
  // fallback: children are created in uniq order; map by title text via dataset/title attr
  return out;
}

function playLevel(i) {
  g.call(`__G.start(${i + 1})`); g.pump(3);
  const bar = g.els['ingredient-bar'];
  const kids = (bar.children || []);
  // each button was created for a unique ingredient in def.ings order; label text is uppercase name
  const names = { 'bottom bun': 'bottomBun', 'lettuce': 'lettuce', 'tomato': 'tomato', 'onion': 'onion', 'cheese': 'cheese', 'patty': 'patty', 'bacon': 'bacon', 'egg': 'egg', 'pickle': 'pickle', 'top bun': 'topBun' };
  const btnFor = {};
  kids.forEach(b => {
    const m = /ing-label">([^<]*)</.exec(String(b.innerHTML || ''));
    const label = m ? m[1].trim().toLowerCase() : null;
    if (label && names[label]) btnFor[names[label]] = b;
  });
  for (let guard = 0; guard < 40; guard++) {
    if (g.call('__G.finished()')) break;
    const order = g.call('__G.order()');
    if (!order) break;
    for (const ing of order) {
      const b = btnFor[ing];
      if (b) b.dispatch('click', {}); else return 'missing-button:' + ing;
      g.pump(1);
    }
    g.els['btn-serve'].dispatch('click', {});
    g.pump(60); // serve feedback/next-customer transition
  }
  g.pump(120); // level end transition
  return g.call('__G.passed()') ? 'pass' : 'fail';
}

const solved = [];
for (let i = 0; i < N; i++) {
  const r = playLevel(i);
  if (r === 'pass') solved.push(i + 1); else fails.push('L' + (i + 1) + ' ' + r + ' (score ' + g.call('__G.score()') + '/' + g.call('__G.tgt()') + ')');
}
T('levels-passed', solved.length === N, solved.length + '/' + N + ' passed:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { passed: solved.length + '/' + N } };
console.log('burger-stack: ' + solved.length + '/' + N + ' levels served via real ingredient buttons: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
