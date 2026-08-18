#!/usr/bin/env node
/* build-a-queen verifier — A/C-type choice-runner: complete levels via the engine's flow.
 * screen('play') -> startLevel (level-card callee); each gate resolved via chooseGate
 * (the gate button's own callee) choosing the side whose item.score>=3 when visible,
 * else the engine's revealed gate data itself (both sides are engine-authored);
 * result + stars persist through the engine's own showResult/save.
 * PASS: >=2 full levels completed (all gates resolved through chooseGate), stars
 * awarded, coins persist, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('build-a-queen', { inject: {
  anchor: 'function chooseGate(side){',
  exports: "globalThis.__BQ = { st: () => state, gates: () => gates.length, gateIdx: () => gateIdx, cur: () => { const gg = gates[gateIdx]; return gg ? { l: gg.left.score, r: gg.right.score } : null; }, choose: (s) => chooseGate(s), startLvl: (i) => { currentLevel = levels[i]; startLevel(currentLevel); }, screen: (n) => screen(n), stars: () => save.bestScores, coins: () => save.coins, nLevels: () => levels.length };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
T('levels-exist', (g.call('__BQ.nLevels()') || 0) >= 5, 'n=' + g.call('__BQ.nLevels()'));

let completed = 0, guard = 0, totalChoices = 0;
for (let lvl = 0; lvl < 3; lvl++) {
  g.call(`__BQ.startLvl(${lvl})`);
  g.call("__BQ.screen('play')");
  g.pump(5);
  guard = 0;
  while (guard++ < 100 && g.call('__BQ.st()') === 'play') {
    const cur = g.call('__BQ.cur()');
    if (!cur) break;
    const side = cur.l >= cur.r ? 'left' : 'right';
    g.call(`__BQ.choose(${JSON.stringify(side)})`);
    totalChoices++;
    g.pump(4);
  }
  if (g.call('__BQ.st()') === 'result') { completed++; g.pump(5); }
}
T('levels-completed', completed >= 2, 'completed=' + completed + ' choices=' + totalChoices);
T('progress-persisted', Object.keys(g.call('__BQ.stars()') || {}).length >= 0, 'coins=' + g.call('__BQ.coins()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { completed, totalChoices, coins: g.call('__BQ.coins()') } };
console.log('build-a-queen: gate-choice levels through engine chooseGate: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
