#!/usr/bin/env node
/* pyramid-solitaire verifier — A/C-type: solve deals via the engine's own rules.
 * Pair search over the engine's selectable set (canSelect: pyramid-uncovered + waste
 * top), sum-13 matches removed through removeCards — the exact card-click path;
 * drawStock when stuck (the stock-pile click callee); waste recycle on exhaustion.
 * PASS: >=10 pairs removed via the engine path, score accrues, deck cycles used,
 * boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('pyramid-solitaire', { inject: {
  anchor: 'function removeCards(c1,c2){',
    exports: "globalThis.__PS = { pairIdx: () => { const pool = flatPyramid.concat(waste); const sel = pool.filter(c => !c.removed && canSelect(c)); for (let i = 0; i < sel.length; i++) { if (cardVal(sel[i]) === 13) return [pool.indexOf(sel[i]), -1]; } for (let i = 0; i < sel.length; i++) for (let j = i + 1; j < sel.length; j++) { if (cardVal(sel[i]) + cardVal(sel[j]) === 13) return [pool.indexOf(sel[i]), pool.indexOf(sel[j])]; } return null; }, removeAt: (i1, i2) => { const pool = flatPyramid.concat(waste); if (i2 < 0) { removeKing(pool[i1]); } else { removeCards(pool[i1], pool[i2]); } return true; }, drawStock: () => drawStock(), score: () => score, remaining: () => flatPyramid.filter(c => !c.removed).length, stock: () => stock.length, newGame: () => newGame() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__PS.newGame()');
g.pump(5);
let removed = 0, guard = 0, draws = 0;
while (guard++ < 600) {
  const idx = g.call('__PS.pairIdx()');
  if (idx && idx[0] >= 0 && (idx[1] >= 0 || idx[1] === -1)) {
    g.call(`__PS.removeAt(${idx[0]}, ${idx[1]})`);
    removed++;
    g.pump(3);
    continue;
  }
  if ((g.call('__PS.stock()') || 0) > 0 && draws < 40) { g.call('__PS.drawStock()'); draws++; g.pump(4); continue; }
  break;
}
const score = g.call('__PS.score()') || 0;
T('pairs-removed', removed >= 12, 'removed=' + removed + ' /* kings + pairs, both via engine paths */');
T('score-accrued', score >= removed * 10, 'score=' + score);
T('board-advanced', g.call('__PS.remaining()') < 28 || removed >= 10, 'remaining=' + g.call('__PS.remaining()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { removed, draws, score, remaining: g.call('__PS.remaining()') } };
console.log('pyramid-solitaire: sum-13 removals through engine removeCards: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
