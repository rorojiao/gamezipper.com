#!/usr/bin/env node
/* ice-breaker verifier — 30 physics cut-puzzle levels (type A).
 * Every level is played through the REAL input path: canvas mousedown (menu ->
 * levelSelect), mousedown on a level cell (initLevel), then pump while the engine's own
 * updatePhysics runs — vikings ride falling pieces, pieces reaching the goal rescue their
 * viking, and the engine's own win check (state.vikings.every(v => v.rescued)) sets
 * state.won. Next Level via the real canvas click handler. The cut mechanic itself is
 * exercised twice through real mousedown/mousemove/mouseup: an empty piece split (piece
 * count grows) and a viking-carrying piece split (level must STILL be winnable — this is
 * the regression test for the viking-clone FIX). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('ice-breaker', {
  viewport: [800, 1880], // resize() subtracts footer+topnav stub heights (640+640) -> W=800 H=600
  inject: {
    anchor: 'function initLevel(lvlIdx) {',
    exports: `globalThis.__I = {
      state: () => state, screen: () => state.screen, won: () => state.won, lost: () => state.lost,
      level: () => state.level, cuts: () => state.cuts, pieces: () => state.pieces.length,
      n: () => LEVELS.length, saved: () => saved,
    };`,
  },
});
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
const canvas = g.els['gameCanvas'];
const mdown = (x, y) => canvas.dispatch('mousedown', { clientX: x, clientY: y, button: 0, preventDefault() {} });
const mmove = (x, y) => canvas.dispatch('mousemove', { clientX: x, clientY: y, preventDefault() {} });
const mup = (x, y) => canvas.dispatch('mouseup', { clientX: x, clientY: y, preventDefault() {} });
const click = (x, y) => canvas.dispatch('click', { clientX: x, clientY: y, preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = call('__I.n()');
T('levels-30', N === 30, 'n=' + N);
T('starts-menu', call('__I.screen()') === 'menu', call('__I.screen()'));

// real input: menu click -> level select
mdown(400, 300);
T('menu-to-select', call('__I.screen()') === 'levelSelect', call('__I.screen()'));

// level cell via the engine's own coordinate math (W*0.15 + lvl*W*0.12, H*0.12 + tier*H*0.15)
const selectLevel = (i) => mdown(800 * 0.15 + (i % 6) * 800 * 0.12 + 40, 600 * 0.12 + Math.floor(i / 6) * 600 * 0.15 + 30);
function pumpToWin(maxFrames) {
  for (let f = 0; f < (maxFrames || 400); f++) {
    g.pump(1);
    if (call('__I.won()') || call('__I.lost()')) return true;
  }
  return false;
}

const results = [];
selectLevel(0);
T('enter-l1', call('__I.screen()') === 'game' && call('__I.level()') === 0, 'scr=' + call('__I.screen()') + ' lvl=' + call('__I.level()'));
results[0] = pumpToWin() && call('__I.won()');
T('l1-zero-cut-win', !!results[0], 'won=' + call('__I.won()') + ' lost=' + call('__I.lost()'));

// Next Level via the real click handler (clientY > H*0.72 = 432)
click(400, 450);
T('next-advances', call('__I.level()') === 1, 'lvl=' + call('__I.level()'));

// FIX regression: cut the viking-carrying piece of L2 [320,120,160,70] with a real
// vertical swipe at x=400 — the original viking object must stay attached to a sub-piece
// and the level must still be won through the engine's own check.
{
  const before = call('__I.pieces()');
  mdown(400, 80); mmove(400, 250); mup(400, 250);
  const cut = call('__I.cuts()') === 1;
  T('cut-viking-piece-splits', cut && call('__I.pieces()') === before + 1,
    'cuts=' + call('__I.cuts()') + ' pieces ' + before + '->' + call('__I.pieces()'));
  const won = pumpToWin() && call('__I.won()');
  T('cut-viking-still-winnable', !!won, 'won=' + call('__I.won()') + ' lost=' + call('__I.lost()'));
  results[1] = won;
  click(400, 450); // -> level 2 (0-based)
}

// play the rest; on level idx 8 (Pyramid) exercise an empty-piece cut on the way
for (let i = 2; i < N; i++) {
  if (call('__I.level()') !== i) { results[i] = false; fails.push('chain: expected lvl ' + i + ' got ' + call('__I.level()')); break; }
  if (i === 8) {
    const before = call('__I.pieces()');
    mdown(550, 150); mmove(550, 300); mup(550, 300); // vertical cut through the empty [500,200,100,50] piece
    T('cut-empty-piece-splits', call('__I.cuts()') >= 1 && call('__I.pieces()') === before + 1,
      'cuts=' + call('__I.cuts()') + ' pieces ' + before + '->' + call('__I.pieces()'));
  }
  const ok = pumpToWin() && call('__I.won()');
  results[i] = ok;
  if (!ok) fails.push('L' + (i + 1) + ' not won (won=' + call('__I.won()') + ' lost=' + call('__I.lost()') + ')');
  if (i < N - 1) click(400, 450); else click(400, 450); // level 29 -> Back to Menu (levelSelect)
}
const wonCount = results.filter(Boolean).length;
T('levels-won', wonCount === N, wonCount + '/' + N + ' missing:[' + results.map((r, i) => r ? 0 : i + 1).filter(Boolean).join(',') + ']');
T('ends-levelselect', call('__I.screen()') === 'levelSelect', call('__I.screen()'));

// save: stars per level + furthest level persisted by the engine's own save()
const ls = g.ls.getItem('iceBreaker_v1');
T('save-written', !!ls && /level_/.test(ls), ls ? ls.slice(0, 60) : 'none');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: wonCount + '/' + N, cuts: call('__I.cuts()') } };
console.log('ice-breaker: ' + wonCount + '/' + N + ' levels rescued via real mouse input (menu->select->fall->next): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
