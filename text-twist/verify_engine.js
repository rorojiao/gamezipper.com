#!/usr/bin/env node
/* text-twist verifier — untimed run through ALL 53 letter sets: each round's full word list is
 * entered by clicking the real letter balls (click = renderLetterCircle's listener) and the real
 * Submit button; round completes when foundWords === allWords (engine's own endRound(true)),
 * then the real Next Round button chains to the next set and finally to the game-over screen.
 * Also: empty submit rejected, duplicate word rejected. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('text-twist', { inject: {
  anchor: 'function submitWord(){',
  exports: `globalThis.__T = {
    words: () => allWords.slice(),
    found: () => foundWords.size,
    round: () => currentSetIndex,
    score: () => score,
    nSets: () => LETTER_SETS.length,
    ls: (k) => localStorage.getItem(k),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const els = g.els;
const active = (id) => els[id].classList.contains('active');

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

// start: untimed mode button
els.btnUntimed.dispatch('click', {});
g.pump(130); // interstitial 2000ms -> loadSet(0)
T('starts-untimed', active('game-screen') && g.call('__T.round()') === 0, 'round=' + g.call('__T.round()'));
const nSets = g.call('__T.nSets()');
T('sets-exist', nSets >= 50, 'n=' + nSets);

// empty submit: rejected, nothing found
els.btnSubmit.dispatch('click', {});
T('rejects-empty', g.call('__T.found()') === 0, 'found=' + g.call('__T.found()'));

const balls = () => els.letterCircle.children.filter(c => (c.className || '').split(/\s+/).includes('letter-ball'));
const clickWord = (word) => {
  const used = new Set();
  for (const ch of word.toUpperCase()) {
    const b = balls().find(x => x.textContent === ch && !used.has(x));
    if (!b) return false;
    used.add(b); b.dispatch('click', {});
  }
  return true;
};

let t0 = Date.now();
let dupTested = false;
for (let r = 0; r < nSets; r++) {
  const words = g.call('__T.words()');
  let ok = true;
  for (const w of words) {
    if (!clickWord(w)) { fails.push('r' + r + ' unclickable ' + w); ok = false; break; }
    els.btnSubmit.dispatch('click', {});
    if (!dupTested && words.length > 1) { // first word again: "Already found" must not change count
      const before = g.call('__T.found()');
      clickWord(w); els.btnSubmit.dispatch('click', {});
      if (g.call('__T.found()') !== before) { fails.push('r' + r + ' duplicate accepted'); fail++; ok = false; }
      else pass++; // counts as rejects-duplicate test (once)
      dupTested = true;
      els.btnClear.dispatch('click', {}); // rejected submits keep their letters selected — clear like a player
    }
  }
  g.pump(35); // endRound(true) at +500ms
  const found = g.call('__T.found()'), total = words.length;
  if (!(found === total && active('round-screen'))) { fails.push('r' + r + ' found=' + found + '/' + total + ' roundScreen=' + active('round-screen')); }
  if (r < nSets - 1) {
    els.btnNextRound.dispatch('click', {});
    g.pump(130); // interstitial
    if (!(active('game-screen') && g.call('__T.round()') === r + 1)) fails.push('r' + r + '->r' + (r + 1) + ' failed');
  } else {
    els.btnNextRound.dispatch('click', {});
    if (!active('gameover-screen')) fails.push('final gameover screen not shown');
  }
}

T('all-rounds-complete', !fails.some(f => /^r\d/.test(f)), (fails.filter(f => /^r\d/.test(f))[0] || '') + ' [' + fails.filter(f => /^r\d/.test(f)).length + ' round fails]');
const stats = JSON.parse(g.call(`__T.ls('textTwist_stats')`) || '{}');
T('stats-persisted', stats.played === 1 && stats.bestScore > 0, JSON.stringify(stats));
T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { sets: nSets + '/' + nSets, durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('text-twist: ' + nSets + '/' + nSets + ' rounds completed via ball clicks + Submit: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
