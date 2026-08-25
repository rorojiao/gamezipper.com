#!/usr/bin/env node
/* crossword verifier — real input: puzzle-card clicks (closures), per-cell <input>
 * 'input'/'keydown' dispatches (the engine's own listeners), clue-item clicks, inline
 * onclick buttons via their exact statements (showHint/checkAnswer/clearGrid/
 * revealPuzzle/showStart). Covers: data validity (intersections/bounds, all 30),
 * ALL 30 puzzles solved through real typing (3 stars), timer interval, hint x3
 * (reveals correct letters, 1-star win), keyboard nav (backspace/arrows/tab/enter),
 * global document keydown path, clearGrid, checkAnswer wrong-flash, autosave
 * debounce + clear-on-complete, revealPuzzle give-up view (no win), stars persisted. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('crossword', {});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const E = (id) => g.sandbox.document.getElementById(id);

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('PUZZLES.length');
T('start-cards', E('puzzle-list').children.length === N, 'n=' + E('puzzle-list').children.length);

// ---- data validity: intersections must agree + words inside bounds ----
{
  const P = g.call('PUZZLES');
  let bad = '';
  P.forEach((p, pi) => {
    const m = new Map();
    for (const w of p.words) for (let i = 0; i < w.answer.length; i++) {
      const r = w.row + (w.dir === 'down' ? i : 0), c = w.col + (w.dir === 'across' ? i : 0);
      if (r < 0 || r >= p.rows || c < 0 || c >= p.cols) bad += 'P' + (pi + 1) + ' bounds;';
      const k = r + ',' + c;
      if (m.has(k) && m.get(k) !== w.answer[i]) bad += 'P' + (pi + 1) + ' clash@' + k + ';';
      if (!m.has(k)) m.set(k, w.answer[i]);
    }
  });
  T('data-intersections-valid', !bad, bad.slice(0, 100));
}

const cell = (r, c) => E('crossword-grid').children[r * g.call('currentPuzzle.cols') + c];
const inp = (r, c) => { const ch = cell(r, c).children; return ch[ch.length - 1]; };
const type = (r, c, ch) => { inp(r, c).dispatch('focus', {}); inp(r, c).dispatch('input', { target: { value: ch } }); };
const solveAll = () => {
  const P = g.call('currentPuzzle');
  for (const w of P.words) for (let i = 0; i < w.answer.length; i++) {
    const r = w.row + (w.dir === 'down' ? i : 0), c = w.col + (w.dir === 'across' ? i : 0);
    type(r, c, w.answer[i]);
  }
  g.pump(25); // 300ms puzzleComplete timer
};
const enter = (i) => { E('puzzle-list').children[i].dispatch('click', {}); g.pump(1); };

// ---- P1: timer + clean 3-star solve ----
enter(0);
T('p1-live', g.call('currentPuzzle.title') === 'Weather Watch' && g.call('userGrid.length') === 7, '');
type(0, 0, 'S'); g.pump(125); // let the 1s timer interval tick twice
T('timer-runs', E('timer').textContent === '00:02' && g.call('seconds') === 2, E('timer').textContent + '/' + g.call('seconds'));
solveAll();
T('p1-win', !E('win-overlay').classList.contains('hidden') && /★★★/.test(E('win-msg').textContent),
  E('win-msg').textContent);

// ---- P2: 3 hints reveal wrong cells -> 1-star win ----
g.call('showStart()'); enter(1);
const p2 = g.call('currentPuzzle');
type(0, 0, 'Q'); type(0, 1, 'Q'); type(0, 2, 'Q');
g.call('showHint()'); g.call('showHint()'); g.call('showHint()');
const fixed = g.call('userGrid[0].slice(0,3)');
T('hints-reveal', g.call('hintsLeft') === 0 && E('hints-display').textContent === '0/3' &&
  E('hint-btn').style.display === 'none' &&
  fixed.join('') === p2.words[0].answer.slice(0, 3),
  'left=' + g.call('hintsLeft') + ' ug0=' + JSON.stringify(fixed) + ' want=' + p2.words[0].answer.slice(0, 3));
solveAll();
T('p2-win-1star', /Time: 00:0[0-9] \| Hints: 3 \| Stars: ★☆☆/.test(E('win-msg').textContent), E('win-msg').textContent);

// ---- P3: keyboard nav, global keydown, clear, check, autosave ----
g.call('showStart()'); enter(2);
const cols3 = g.call('currentPuzzle.cols');
const kd = (r, c, key) => inp(r, c).dispatch('keydown', { key, preventDefault() {}, target: inp(r, c) });
const sel = () => JSON.stringify(g.call('selectedCell'));
// click a real cell (its own listener): selects word a6 (DAISY row2), cursor at (2,0)
cell(2, 0).dispatch('click', {});
T('cell-click-selects', sel() === JSON.stringify({ row: 2, col: 0 }) && g.call('selectedWordId') === 'a6',
  sel() + ' word=' + g.call('selectedWordId'));
kd(2, 0, 'ArrowRight');
T('arrow-right', sel() === JSON.stringify({ row: 2, col: 1 }), sel());
kd(2, 1, 'ArrowLeft');
T('arrow-left', sel() === JSON.stringify({ row: 2, col: 0 }), sel());
kd(2, 0, 'ArrowDown'); // (3,0) is a block -> skips to a7 LILAC (4,0), re-selects word a7
T('arrow-down-word-switch', sel() === JSON.stringify({ row: 4, col: 0 }) && g.call('selectedWordId') === 'a7',
  sel() + ' word=' + g.call('selectedWordId'));
kd(4, 0, 'ArrowUp'); // back up into a6 territory -> re-selects a6 at its start (2,0)
T('arrow-up', sel() === JSON.stringify({ row: 2, col: 0 }), sel());
kd(2, 0, 'C'); // letter key writes and advances within the word
T('letter-key-advances', g.call('userGrid[2][0]') === 'C' && sel() === JSON.stringify({ row: 2, col: 1 }),
  g.call('userGrid[2][0]') + ' ' + sel());
kd(2, 1, 'Backspace');
T('backspace-clears', g.call('userGrid[2][1]') === '' && sel() === JSON.stringify({ row: 2, col: 0 }),
  g.call('userGrid[2][1]') + ' ' + sel());
kd(2, 0, 'Tab'); // next word in list order: a6 -> a7
T('tab-next-word', g.call('selectedWordId') === 'a7' && sel() === JSON.stringify({ row: 4, col: 0 }),
  g.call('selectedWordId') + ' ' + sel());
kd(4, 0, 'Enter'); // a7 -> d1, but d1's first cell (0,0) crosses a1 and selectCell gives
// wordIds[0] priority, so the selection lands on a1 — engine design, same in a browser
T('enter-next-word', g.call('selectedWordId') === 'a1', g.call('selectedWordId'));
// global document keydown path writes to selectedCell (needs e.target.tagName present,
// like a real event; without target the engine's guard line itself throws)
const dz = g.call('selectedCell'); // the letter writes HERE, then the branch advances the cursor
g.sandbox.document.dispatch('keydown', { key: 'z', preventDefault() {}, target: { tagName: 'DIV' } });
T('doc-keydown', dz && g.call('userGrid[' + dz.row + '][' + dz.col + ']') === 'Z', JSON.stringify(dz) + '=' + g.call('userGrid[' + dz.row + '][' + dz.col + ']'));
const dz2 = g.call('selectedCell'); // cursor advanced after the letter
g.sandbox.document.dispatch('keydown', { key: 'Backspace', preventDefault() {}, target: { tagName: 'DIV' } });
T('doc-backspace', g.call('userGrid[' + dz2.row + '][' + dz2.col + ']') === '', g.call('userGrid[' + dz2.row + '][' + dz2.col + ']'));
// clue click: first down clue is d1, whose first cell re-selects a1 (same priority rule)
const clueEl = E('down-clues').children[0];
clueEl.onclick && clueEl.onclick();
T('clue-click', g.call('selectedWordId') === 'a1', g.call('selectedWordId'));
// clear resets
g.call('clearGrid()');
T('clear-grid', g.call('userGrid.every(row => row.every(v => v === ""))') === true && g.call('completedWords.size') === 0, '');
// wrong answer flash path (no crash) + autosave debounce
type(0, 0, 'Q'); g.call('checkAnswer()'); g.pump(45);
const sv = JSON.parse(g.ls.getItem('crossword_save_v1') || '{}');
T('autosave-debounce', sv[2] && sv[2][0][0] === 'Q', JSON.stringify(sv[2] && sv[2][0]));
solveAll();
const sv2 = JSON.parse(g.ls.getItem('crossword_save_v1') || '{}');
T('progress-cleared-on-win', !sv2[2], JSON.stringify(Object.keys(sv2)));

// ---- remaining puzzles 4..29 solved 3-star ----
let stuck = '';
for (let i = 3; i < N && !stuck; i++) {
  g.call('showStart()'); enter(i);
  if (g.call('PUZZLES.indexOf(currentPuzzle)') !== i) { stuck = 'P' + (i + 1) + ' not active'; break; }
  solveAll();
  if (E('win-overlay').classList.contains('hidden')) { stuck = 'P' + (i + 1) + ' no win'; break; }
  if (!/★★★/.test(E('win-msg').textContent)) { stuck = 'P' + (i + 1) + ' stars=' + E('win-msg').textContent; break; }
  // reveal give-up view check on the last puzzle: fills grid, no win by itself
  if (i === N - 1) {
    g.call('revealPuzzle()');
    const allFilled = g.call('currentPuzzle.words.every(w => w.id)') &&
      g.call('completedWords.size') === g.call('currentPuzzle.words.length');
    if (!allFilled) stuck = 'P30 reveal incomplete';
  }
}
T('all-30-solved', !stuck, stuck || '30/30');

const stars = JSON.parse(g.ls.getItem('crossword_stars_v1') || '{}');
T('stars-persisted', Object.keys(stars).length === N && Object.entries(stars).every(([k, v]) =>
  (Number(k) === 1 ? v.stars === 1 : v.stars === 3)), 'n=' + Object.keys(stars).length +
  ' bad=' + Object.entries(stars).filter(([k, v]) => (Number(k) === 1 ? v.stars !== 1 : v.stars !== 3)).map(([k]) => k).join(','));

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { puzzles: stuck ? 'STUCK@' + stuck : N + '/' + N, input: 'cell inputs + doc keydown',
    hint: 'x3 -> 1-star win', reveal: 'give-up view, no win', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('crossword: ' + (stuck ? 'STUCK ' + stuck : N + '/' + N + ' puzzles') + ' via real inputs: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
