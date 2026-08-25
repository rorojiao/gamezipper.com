#!/usr/bin/env node
/* word-ladder verifier — real input: tier-card clicks (closure listeners), letter-tile
 * clicks on #currentTiles children (the engine's own cycleLetter listeners), real
 * Check/Hint/Undo/Reset/Next buttons, document keydown (Enter/Backspace/R/H/letter).
 * Covers: all 50 levels solved OPTIMALLY (3 stars, exact lv.path via forward cycling),
 * unlock chain, save persisted (stars/bestTurns/highestUnlocked), hint consumes the
 * per-level charge, undo/reset, keydown paths, replay after full clear. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('word-ladder', { inject: {
  anchor: 'function boot(){',
  exports: `globalThis.__WLS = { st: () => ({ cur: state.currentWord, path: state.path.slice(), lvl: state.levelIndex }) };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const els = g.els;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
// boot() runs at script load; tutorial modal opens on first visit
g.pump(2);
T('tutorial-shown', els.modalTut.classList.contains('open'), 'modalTut open=' + els.modalTut.classList.contains('open'));
els.tutStart.dispatch('click', {}); g.pump(2);
T('menu-shown', els.tierGrid.children.length === 5, 'cards=' + els.tierGrid.children.length);

// enter via the real tier card (targets first uncleared level = 1)
els.tierGrid.children[0].dispatch('click', {}); g.pump(2);
T('level1-started', g.call('__WLS.st().lvl') === 1 && g.call('__WLS.st().cur') === g.call('__WL__.LEVELS[0].start'),
  'lvl=' + g.call('__WLS.st().lvl') + ' cur=' + g.call('__WLS.st().cur'));

const LEVELS = g.call('__WL__.LEVELS');
const clicksTo = (from, to) => (to.charCodeAt(0) - from.charCodeAt(0) + 26) % 26;

// ---- solve all 50 levels optimally via real tile clicks + Check ----
let stuck = '';
for (let n = 1; n <= 50; n++) {
  const lv = LEVELS[n - 1];
  if (g.call('__WLS.st().lvl') !== n) { stuck = 'L' + n + ' not active (' + g.call('__WLS.st().lvl') + ')'; break; }
  for (let w = 1; w < lv.path.length; w++) {
    const target = lv.path[w];
    const cur = g.call('__WLS.st().cur');
    for (let i = 0; i < target.length; i++) {
      if (cur[i] === target[i]) continue;
      const clicks = clicksTo(cur[i], target[i]);
      for (let c = 0; c < clicks; c++) els.currentTiles.children[i].dispatch('click', {});
    }
    if (g.call('__WLS.st().cur') !== target) { stuck = 'L' + n + ' cycle mismatch: ' + g.call('__WLS.st().cur') + ' != ' + target; break; }
    els.btnCheck.dispatch('click', {}); g.pump(1);
  }
  if (stuck) break;
  if (!els.modalWin.classList.contains('open')) { stuck = 'L' + n + ' win modal not open (cur=' + g.call('__WLS.st().cur') + ')'; break; }
  if (g.call('__WL__.save.stars[' + n + ']') !== 3) { stuck = 'L' + n + ' stars=' + g.call('__WL__.save.stars[' + n + ']'); break; }
  els.winNext.dispatch('click', {}); g.pump(1);
}
T('all-50-levels', !stuck, stuck || '50/50 optimal');
T('unlocked-50', g.call('__WL__.save.highestUnlocked') === 50, 'unlocked=' + g.call('__WL__.save.highestUnlocked'));
const bests = g.call('__WL__.save.bestTurns');
T('best-turns-50', LEVELS.every((lv, i) => bests[i + 1] === lv.path.length - 1), 'mismatch L' + (LEVELS.findIndex((lv, i) => bests[i + 1] !== lv.path.length - 1) + 1));
const saved = JSON.parse(g.ls.getItem('wordLadderV1') || '{}');
T('save-persisted', Object.keys(saved.stars || {}).length === 50 && Object.values(saved.stars).every(s => s === 3) && saved.highestUnlocked === 50,
  'stars=' + Object.keys(saved.stars || {}).length);

// ---- replay level 7 (path length 3) for hint / undo / reset / keydown ----
// L50's winNext returned to the menu (play hidden); re-enter through the real tier card
// so the keydown guard ($("#play").style.display) sees an active play screen, then jump
// to L7 via the engine's own exported startLevel
els.tierGrid.children[0].dispatch('click', {}); g.pump(2);
g.call('__WL__.startLevel(7)'); g.pump(2);
els.btnHint.dispatch('click', {}); g.pump(2);
T('hint-advances', g.call('__WLS.st().path.length') === 2 && g.call('__WLS.st().cur') === LEVELS[6].path[1],
  'path=' + JSON.stringify(g.call('__WLS.st().path')) + ' hints=' + g.call('__WL__.save.hintsLeft[7]'));
els.btnHint.dispatch('click', {}); g.pump(1); // charge exhausted
T('hint-exhausted', g.call('__WLS.st().path.length') === 2 && /No hints/.test(els.toast.textContent || els.lastToastText || ''), 'path=' + g.call('__WLS.st().path.length'));
els.btnUndo.dispatch('click', {}); g.pump(1);
T('undo', g.call('__WLS.st().path.length') === 1 && g.call('__WLS.st().cur') === LEVELS[6].start, 'path=' + JSON.stringify(g.call('__WLS.st().path')));
// keydown: letter sets tile 0; Enter checks; Backspace undoes; R resets
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });
kd('B'); g.pump(1);
T('keydown-letter', g.call('__WLS.st().cur')[0] === 'B', 'cur=' + g.call('__WLS.st().cur'));
kd('Enter'); g.pump(1);
T('keydown-check', g.call('__WLS.st().path.length') === 2, 'path=' + JSON.stringify(g.call('__WLS.st().path')));
kd('Backspace'); g.pump(1);
T('keydown-undo', g.call('__WLS.st().path.length') === 1, 'path=' + g.call('__WLS.st().path.length'));
els.currentTiles.children[3].dispatch('click', {}); g.pump(1);
kd('r'); g.pump(1);
T('keydown-reset', g.call('__WLS.st().cur') === LEVELS[6].start, 'cur=' + g.call('__WLS.st().cur'));

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { levels: stuck ? 'STUCK@' + stuck : '50/50 3-star', hint: 'consumed+exhausted', keys: 'letter/enter/backspace/r', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('word-ladder: ' + (stuck ? 'STUCK ' + stuck : '50/50 optimal') + ' via tile clicks + buttons + keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
