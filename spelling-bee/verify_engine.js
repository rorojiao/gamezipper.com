#!/usr/bin/env node
/* spelling-bee verifier — all 50 campaign levels to Queen Bee: enumerate every valid word
 * per puzzle from the engine's own DICT + isValidFor semantics (node-side mirror, counts
 * pre-verified equal to each puzzle's maxWords), type each word through REAL document
 * keydown events (letter keys tap hexes via onKey, Enter submits), level complete =
 * engine save.levelProgress[id].completed set by its checkQueenBee. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('spelling-bee', { inject: {
  anchor: 'function submitWord(){',
  exports: `globalThis.__B = {
    start: (i) => startPuzzle(PUZZLES[i], "campaign"),
    boot: () => { // harness now AUTO-fires document DOMContentLoaded, so init() has already
      // run — calling it again double-registers the document keydown handler (the document
      // stub does not dedup listeners) and every typed letter lands twice, so no word ever
      // validates. Probe init's showScreen("menu") side effect; only init when it truly
      // hasn't run (old-harness compatibility).
      save.tutorialSeen = true;
      if (ui.menu.classList.contains("hidden")) init();
    },
    st: (i) => ({ completed: !!(save.levelProgress[PUZZLES[i].id] || {}).completed,
                  found: foundWords.length, max: getMaxWords(currentPuzzle) }),
    dict: () => DICT_WORDS.slice(),
    center: () => currentPuzzle.center.toLowerCase(),
    letters: () => [currentPuzzle.center.toLowerCase(), ...currentPuzzle.outer.map(o => o.toLowerCase())],
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

const DICT = g.call('__B.dict()');
T('dict-loaded', DICT.length > 1000, 'n=' + DICT.length);

g.call('__B.boot()'); g.pump(2);

const N = 50;
const completed = [];
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  g.call(`__B.start(${i})`); g.pump(2);
  const center = g.call('__B.center()');
  const letters = new Set(g.call('__B.letters()'));
  const valid = [...new Set(DICT.filter(w => w.length >= 4 && w.includes(center) && [...w].every(c => letters.has(c))))]
    .sort((a, b) => a.length - b.length); // NYT rule: hex letters reusable; count semantics == engine maxWords
  for (const w of valid) {
    kd('Escape'); // clearWord — defensive: a rejected word leaves residue (submitWord only clears on success)
    for (const c of w.toUpperCase()) kd(c);
    kd('Enter');
  }
  g.pump(40); // Queen Bee overlay timer
  const st = g.call(`__B.st(${i})`);
  if (st.completed && st.found === st.max) completed.push(i + 1);
  else fails.push('L' + (i + 1) + ' completed=' + st.completed + ' found=' + st.found + '/' + st.max);
}
T('levels-queen-bee', completed.length === N, completed.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !completed.includes(x)).join(',') + ']');
T('under-time-budget', (Date.now() - t0) / 1000 < 110, ((Date.now() - t0) / 1000).toFixed(1) + 's');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { queenBee: completed.length + '/' + N, durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('spelling-bee: ' + completed.length + '/50 levels Queen-Beed via real keyboard: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
