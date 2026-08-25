#!/usr/bin/env node
/* word-search verifier — real input: chapter/level cards (closure onclick), real drag
 * selection through canvas onpointerdown/move/up at cell centers (the engine's own
 * hit-testing), win Next button, hint button. Covers: ALL 5 chapters x 6 levels solved
 * (deterministic seeded puzzles — placements read from engine state, selected in their
 * own start->end order), 3-star persistence + unlock chain, daily challenge (fresh +
 * replay branch), hint consumes a charge, post-daily normal level titled correctly
 * (was the state.daily P2), tutorial dismissed, save persisted. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('word-search', { inject: {
  anchor: 'function startLevel(ch,lv){',
  exports: `globalThis.__WSR = { st: () => state, save: () => save };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const els = g.els;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

const center = (cell) => { const cs = g.call('__WSR.st().cellSize'); return { x: cell.c * cs + cs / 2, y: cell.r * cs + cs / 2 }; };
const drag = (a, b) => {
  const cv = els.gameCanvas, p1 = center(a), p2 = center(b);
  cv.dispatch('pointerdown', { clientX: p1.x, clientY: p1.y, preventDefault() {} });
  cv.dispatch('pointermove', { clientX: p2.x, clientY: p2.y, preventDefault() {} });
  cv.dispatch('pointerup', { clientX: p2.x, clientY: p2.y, preventDefault() {} });
};
const solveCurrent = () => {
  const placements = g.call('__WSR.st().placements.slice()');
  for (const p of placements) drag(p.cells[0], p.cells[p.cells.length - 1]);
  return g.call('__WSR.st().foundWords.length') === g.call('__WSR.st().placements.length') ? placements.length : -1;
};

// ---- enter via real UI: Play Levels -> level 1 card ----
g.call('showChapters()'); g.pump(2);
T('chapter-cards', els.chapterGrid.children.length === 6, 'n=' + els.chapterGrid.children.length);
els.chapterGrid.children[0].dispatch('click', {}); g.pump(3);
if (els.tutorialOverlay) { g.call('dismissTutorial()'); g.pump(1); }
T('level1-live', g.call('__WSR.st().chapter') === 1 && g.call('__WSR.st().level') === 1 && g.call('__WSR.st().placements.length') > 0,
  'placements=' + g.call('__WSR.st().placements.length'));

// wrong selection first: drag a line that is not a word (row 0 full line)
{
  const gs = g.call('__WSR.st().gridSize');
  const before = g.call('__WSR.st().foundWords.length');
  drag({ r: 0, c: 0 }, { r: 0, c: Math.min(4, gs - 1) });
  T('wrong-sel-ignored', g.call('__WSR.st().foundWords.length') === before, 'found=' + g.call('__WSR.st().foundWords.length'));
}

// ---- all 30 levels chained via the real Next button ----
let stuck = '', solved = 0;
for (let i = 0; i < 30; i++) {
  const n = solveCurrent();
  if (n < 0) { stuck = 'ch' + g.call('__WSR.st().chapter') + 'lv' + g.call('__WSR.st().level') + ' unsolved'; break; }
  solved += n;
  g.pump(35); // 500ms showWin timer
  if (!els.winModal.classList.contains('active')) { stuck = 'win modal missing after ch' + g.call('__WSR.st().chapter') + 'lv' + g.call('__WSR.st().level'); break; }
  const ch = g.call('__WSR.st().chapter'), lv = g.call('__WSR.st().level');
  const data = g.call('__WSR.save().levels["' + ch + '-' + lv + '"]');
  if (!data || data.stars !== 3) { stuck = 'ch' + ch + 'lv' + lv + ' stars=' + (data && data.stars); break; }
  if (els.winNextBtn.style.display === 'none') { stuck = 'next hidden'; break; }
  // winNextBtn is an inline onclick= attribute (unbound in this harness) — run its exact statement
  g.call('nextLevel()'); g.pump(3);
  // prove the level actually advanced (guards against silently re-solving one level)
  const expCh = Math.floor((i + 1) / 6) + 1, expLv = ((i + 1) % 6) + 1; // solved 1-based level i+1 -> now at i+2
  if (!(i === 29 && g.call('__WSR.st().screen') === 'chapter')) {
    const at = g.call('__WSR.st().chapter') * 10 + g.call('__WSR.st().level');
    if (at !== expCh * 10 + expLv) { stuck = 'after win ' + i + ' at ch' + g.call('__WSR.st().chapter') + 'lv' + g.call('__WSR.st().level'); break; }
  }
}
T('all-30-levels', !stuck && solved >= 5 * 6 * 4, stuck || solved + ' words over 30 levels');
const solvedLevels = g.call('Object.keys(__WSR.save().levels).length');
T('all-levels-persisted', solvedLevels === 30, 'saved=' + solvedLevels);

// after ch5 lv6 the Next button should have returned us to the chapters screen
T('back-to-chapters', els.chapterGrid.children.length === 6, 'chapter grid rebuilt');

// ---- daily: fresh + replay branches ----
g.call('showDaily()'); g.pump(3);
T('daily-live', g.call('__WSR.st().daily') === true, 'daily=' + g.call('__WSR.st().daily'));
const dailyN = solveCurrent();
g.pump(35);
T('daily-solved', dailyN > 0 && els.winModal.classList.contains('active') && els.winTitle.textContent === 'Daily Complete!',
  'n=' + dailyN + ' title=' + els.winTitle.textContent);
g.call('nextLevel()'); g.pump(2);
g.call('showDaily()'); g.pump(3); // replay branch: same puzzle served from save.daily
T('daily-replay', g.call('__WSR.st().daily') === true && g.call('__WSR.st().placements.length') > 0, 'placements=' + g.call('__WSR.st().placements.length'));

// ---- post-daily normal level must be titled 'Level Complete!' (state.daily P2) ----
g.call('showChapters()'); g.pump(2);
els.chapterGrid.children[0].dispatch('click', {}); g.pump(3);
solveCurrent(); g.pump(35);
T('post-daily-title', els.winTitle.textContent === 'Level Complete!', 'title=' + els.winTitle.textContent);

// ---- hint consumes a charge ----
g.call('nextLevel()'); g.pump(3);
const h0 = g.call('__WSR.st().hints');
g.call('useHint()'); g.pump(2); // inline onclick= — run its exact statement
T('hint-consumed', g.call('__WSR.st().hints') === h0 - 1, h0 + '->' + g.call('__WSR.st().hints'));
g.pump(100); // 1500ms hint highlight restore

const saved = JSON.parse(g.ls.getItem('wordsearch_save') || '{}');
T('save-persisted', Object.keys(saved.levels || {}).length === 30 && (saved.totalFound || 0) >= solved,
  'levels=' + Object.keys(saved.levels || {}).length + ' found=' + saved.totalFound);

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { levels: stuck ? 'STUCK@' + stuck : '30/30 3-star', words: solved, daily: 'fresh+replay', hint: 'consumed', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('word-search: ' + (stuck ? 'STUCK ' + stuck : '30 levels/' + solved + ' words') + ' via real drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
