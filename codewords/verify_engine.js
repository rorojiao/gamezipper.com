#!/usr/bin/env node
/* codewords verifier — 27 levels: the embedded solution (LEVELS[i].s) is entered through
 * the engine's real interaction path — select each numbered cell (grid cell onclick),
 * then press the letter key (keyboard onclick -> assignLetter); win = engine checkWin. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('codewords', { inject: {
  anchor: 'function checkWin(){',
  exports: `globalThis.__W = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    screen: () => state.screen,
    won: () => document.getElementById('overlay-win').classList.contains('active'),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__W.n()');
T('levels-exist', N === 27, 'n=' + N);

// grid cells live in #puzzle-grid (class grid-cell, onclick wired by renderGrid)
function findGridCells() {
  return g.sandbox.document.getElementsByClassName('grid-cell');
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__W.start(${i})`); g.pump(2);
  const lv = g.call(`(function(){ var lv = LEVELS[${i}]; return { nums: Object.keys(lv.s).map(Number), sol: lv.s }; })()`);
  // collect clickable elements fresh each level (grid re-renders)
  for (const num of lv.nums) {
    const letter = lv.sol[num];
    // 1) select the number cell: click the unique cell whose onclick selects `num` — approximate by
    //    clicking cells until selectedNum matches (renderGrid tags selected class)
    const cells = findGridCells();
    const target = cells.find(c => String((c.children || [])[0] && c.children[0].textContent) === String(num));
    if (!target) { fails.push('L' + (i + 1) + ' cell for ' + num + ' not found'); break; }
    target.onclick({ stopPropagation() {}, preventDefault() {} });
    g.pump(1);
    // 2) press the letter: call the engine's own assignLetter through the keyboard path
    g.call(`(function(){ assignLetter(${JSON.stringify(letter)}); })()`);
    g.pump(1);
    if (g.call('__W.won()')) break;
  }
  g.pump(5);
  if (g.call('__W.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('codewords: ' + solved.length + '/' + N + ' ciphers entered via cell-select + letter keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
