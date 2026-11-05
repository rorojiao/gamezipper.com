#!/usr/bin/env node
/* quordle verifier — practice rounds: read the engine's 4 solutions, type each unique
 * solution word through REAL document keydown events; each guess solves the board(s)
 * whose answer it matches; win = engine gameOver+gameWon (all 4 boards solved) with
 * currentRow within the 9-row budget. Rejection path (non-dictionary word) verified too. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('quordle', { inject: {
  anchor: 'function submitGuess(){',
  exports: `globalThis.__Q = {
    sols: () => solutions.slice(),
    solved: () => boardSolved.slice(),
    st: () => ({ row: currentRow, gameOver: gameOver, gameWon: gameWon }),
    practice: () => startNewGame('practice'),
    val: () => Array.from(VAL),
    modal: () => ({ open: document.getElementById('resultModal').classList.contains('open'), html: String(document.getElementById('resultContent').innerHTML || '') }), // harness textContent does NOT aggregate children; innerHTML getter returns the assigned markup (real DOM aggregates — live probe verified separately)
    close: () => closeModal('resultModal'),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, ctrlKey: false, metaKey: false, altKey: false, preventDefault() {} });
const type = (w) => { for (const c of w) kd(c); kd('Enter'); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

let wins = 0, rounds = 0;
for (let round = 0; round < 3; round++) {
  g.call('__Q.practice()'); g.pump(2);
  const sols = g.call('__Q.sols()');
  if (round === 0) T('solutions-4-distinct', sols.length === 4 && new Set(sols).size === 4, sols.join(','));

  // rejection: non-dictionary word must not advance the row
  type('zzqxz'); g.pump(60); // reveal timers ~1950ms ≈ 118 frames
  let st = g.call('__Q.st()');
  T(`r${round}-rejects-invalid`, st.row === 0 && !st.gameOver, 'row=' + st.row);
  kd('Backspace'); kd('Backspace'); kd('Backspace'); kd('Backspace'); kd('Backspace');

  // solve: type each unique solution (≤4 distinct words, budget 9 rows)
  for (const w of [...new Set(sols)]) {
    type(w);
    g.pump(125); // submit finalizes at 350*5+200=1950ms
  }
  g.pump(60);
  st = g.call('__Q.st()');
  const solved = g.call('__Q.solved()');
  if (st.gameOver && st.gameWon && solved.every(Boolean)) wins++;
  else fails.push(`round${round}: won=${st.gameWon} row=${st.row} solved=${solved.join(',')}`);
  rounds++;
}
T('practice-wins', wins === rounds, wins + '/' + rounds);

/* P2 regression (QA R1038 follow-up 2026-11-05): result modal must open POPULATED on
 * both paths. Old bugs: lose branch revealAnswers() threw at row index 9 (nonexistent)
 * so the modal never opened; #resultContent was always empty (win modal was a blank box). */
const wmod = g.call('__Q.modal()'); // last round ended in a win; 800ms modal timer already pumped
T('win-modal-open-populated', wmod.open === true && /You Win/.test(wmod.html), JSON.stringify(wmod).slice(0, 140));
g.call('__Q.close()'); g.pump(2);
g.call('__Q.practice()'); g.pump(2);
const sols2 = g.call('__Q.sols()');
const wrong = (g.call('__Q.val()') || []).filter(w => !sols2.includes(w)).slice(0, 9);
for (const w of wrong) { type(w); g.pump(125); }
g.pump(60); // +500ms result-modal timer
const lst = g.call('__Q.st()');
const lmod = g.call('__Q.modal()');
T('lose-over', lst.gameOver && !lst.gameWon && lst.row === 9, JSON.stringify(lst));
T('lose-modal-open', lmod.open === true, JSON.stringify(lmod).slice(0, 120));
T('lose-modal-populated', /Quordle/.test(lmod.html), lmod.html.slice(0, 80));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { wins: wins + '/' + rounds } };
console.log('quordle: ' + wins + '/' + rounds + ' practice games all-4-boards solved via real keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
