#!/usr/bin/env node
/* word-connections verifier — daily puzzle (lose by 4 mistakes -> retry -> win) + ALL 70
 * puzzles solved: words are selected by clicking the real .word-tile elements (closure
 * listeners), guesses submitted with the real Submit buttons; correct group -> reveal timer,
 * wrong group -> mistake; win = engine's winModal + stats persisted to its localStorage. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('word-connections', { inject: {
  anchor: 'function createExtendedPuzzleLoader() {',
  exports: `globalThis.__WCD = { puzzles: [].concat(PUZZLES, EXTENDED_PUZZLES, ADDITIONAL_PUZZLES, EXPANDED_PUZZLES).map(p => ({ id: p.id, groups: p.groups.map(gr => gr.words.slice()) })) };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const els = g.els;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const PUZ = g.call('__WCD.puzzles');
T('puzzles-exist', Array.isArray(PUZ) && PUZ.length >= 60, 'n=' + (PUZ || []).length);

// harness fires no DOMContentLoaded — boot the engine, then close tutorial if shown
g.sandbox.document.dispatch('DOMContentLoaded', {}); g.pump(3);
if (els.tutorialModal && els.tutorialModal.classList.contains('active')) { els.tutorialClose.dispatch('click', {}); g.pump(2); }

const tiles = (grid) => els[grid].children.filter(c => (c.className || '').split(/\s+/).includes('word-tile'));
const pick = (grid, word) => { const t = tiles(grid).find(x => x.textContent === word); if (t) t.dispatch('click', {}); return !!t; };
const submit = (kind) => { els[kind === 'daily' ? 'dailySubmit' : 'puzzleSubmit'].dispatch('click', {}); g.pump(35); };

// ---- daily: lose by 4 wrong guesses, retry, then win ----
const daily = PUZ[g.call('(function(){var s=0;var d=new Date();var ds=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();for(var i=0;i<ds.length;i++){s=((s<<5)-s)+ds.charCodeAt(i);s=s&s;}return Math.abs(s);})()') % PUZ.length];
let wrong = 0;
for (let round = 0; round < 4; round++) { // one word from each of 4 different groups = guaranteed wrong
  for (let gi = 0; gi < 4; gi++) pick('dailyGrid', daily.groups[gi][0]);
  submit('daily');
  wrong++;
}
T('daily-lose-at-4-mistakes', els.loseModal.classList.contains('active'), 'loseModal not active');
els.loseRetry.dispatch('click', {}); g.pump(3);
T('daily-retry-resets', !els.loseModal.classList.contains('active') && tiles('dailyGrid').length === 16, 'tiles=' + tiles('dailyGrid').length);
for (let gi = 0; gi < 4; gi++) { // all four groups, correct
  for (const w of daily.groups[gi]) pick('dailyGrid', w);
  submit('daily');
}
T('daily-win', els.winModal.classList.contains('active'), 'winModal not active');
const stats1 = JSON.parse(g.ls.getItem('wordConnections_stats_v2') || '{}');
T('daily-stats-persisted', stats1.played === 2 && stats1.wins === 1, JSON.stringify(stats1).slice(0, 90));
els.winClose.dispatch('click', {}); g.pump(2);

// ---- all 70 puzzles via the real level buttons ----
const t0 = Date.now();
let solved = 0;
for (const pz of PUZ) {
  els.levelGrid.children[pz.id - 1].dispatch('click', {}); g.pump(3); // real level button
  if (!els.puzzleModal.classList.contains('active')) { fails.push('pz' + pz.id + ' modal not shown'); break; }
  for (const grp of pz.groups) {
    for (const w of grp) pick('puzzleGrid', w);
    submit('puzzle');
  }
  if (els.winModal.classList.contains('active')) solved++;
  else { fails.push('pz' + pz.id + ' not won'); break; }
  els.winClose.dispatch('click', {}); g.pump(1);
  els.puzzleClose.dispatch('click', {}); g.pump(1);
}
T('all-puzzles-won', solved === PUZ.length, solved + '/' + PUZ.length + ' ' + (fails[0] || ''));
const stats2 = JSON.parse(g.ls.getItem('wordConnections_stats_v2') || '{}');
T('puzzle-stats-persisted', stats2.wins === 1 + PUZ.length, 'wins=' + stats2.wins);
const prog = JSON.parse(g.ls.getItem('wordConnections_progress_v2') || '{}');
T('progress-all-starred', Object.keys(prog).length >= PUZ.length, Object.keys(prog).length + ' entries');

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { daily: 'lose+retry+win', puzzles: solved + '/' + PUZ.length, durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('word-connections: daily (lose/retry/win) + ' + solved + '/' + PUZ.length + ' puzzles via real tile clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
