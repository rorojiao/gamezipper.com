#!/usr/bin/env node
/* word-card-sort verifier — real input: btn-play + tutorial Skip (onclick properties),
 * real Deal/deck-pile clicks, real HTML5 drag path (dragstart on .card with dataTransfer,
 * drop on .category-col), real Next/Replay/Hint/Shuffle/Undo buttons, level-select
 * closures. Covers: ALL 50 levels solved mistake-free (3 stars, incl. the L17 dup-word
 * P0 regression), progression 1->50, save wcs_save 50 entries, level select fully
 * unlocked, replay L1 with a deliberate WRONG drop (mistake counted, card returned,
 * 2-star win, save keeps best 3), deck-pile deals, hint (count + toast), shuffle
 * (multiset preserved), undo (placement reverted). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('word-card-sort', { inject: {
  anchor: 'function startLevel(lvl){',
  exports: `globalThis.__WCS = {
    snap: () => JSON.stringify({ lvl: currentLevel, over: gameState.gameOver, mistakes: gameState.mistakes,
      score: gameState.score, hints: gameState.hints, shuffles: gameState.shuffles,
      histLen: gameState.history.length, staging: gameState.staging.map(s => s.word),
      cats: gameState.categories.map(c => ({ n: c.name, w: c.words.slice(), p: c.placed.slice() })) }),
    save: () => saveData };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const E = (id) => g.sandbox.document.getElementById(id); // shared with engine (creates on first access)
const snap = () => JSON.parse(g.call('__WCS.snap()'));

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

// ---- enter via real Play + dismiss the tutorial via its Skip button ----
E('btn-play').dispatch('click', {}); g.pump(2);
T('tutorial-shown', E('tutorial').classList.contains('active') && E('game-screen').classList.contains('active'),
  'tut=' + E('tutorial').classList.contains('active'));
E('tutorial-nav').children[0].dispatch('click', {}); g.pump(1); // Skip (step 0)
T('tutorial-dismissed', !E('tutorial').classList.contains('active'), 'still active');
T('level1-live', snap().lvl === 1 && E('category-area').children.length === 3, 'lvl=' + snap().lvl);

// ---- drag helpers (engine's own listeners) ----
const cardInSlot = (i) => {
  const slot = E('staging-area').children[i];
  return (slot.children || []).filter(c => String(c.className || '').split(/\s+/).includes('card')).pop();
};
const dragTo = (slotIdx, catIdx) => {
  const card = cardInSlot(slotIdx);
  card.dispatch('dragstart', { dataTransfer: { effectAllowed: '' } });
  E('category-area').children[catIdx].dispatch('drop', { preventDefault() {} });
};
// which category still wants this word (handles legal cross-category duplicates L11/L18/L22...)
const targetCat = (s, word) => s.cats.findIndex(c =>
  c.w.includes(word) && c.p.filter(x => x === word).length < c.w.filter(x => x === word).length);

// ---- solve all 50 levels mistake-free via real deal + drag/drop + Next ----
let stuck = '', solvedLvls = 0, dealt = 0;
for (let l = 1; l <= 50 && !stuck; l++) {
  let s = snap();
  if (s.lvl !== l) { stuck = 'L' + l + ' not active (' + s.lvl + ')'; break; }
  const total = s.cats.reduce((a, c) => a + c.w.length, 0);
  let guard = 0;
  while (!stuck && guard++ < 300) {
    s = snap();
    const placed = s.cats.reduce((a, c) => a + c.p.length, 0);
    if (placed === total) break;
    // deal more cards, but stop when dealCards can make no progress (all remaining word
    // strings already staged — cross-category duplicates like L18 'Barley' make available
    // empty while placed+staging < total; placing the staged cards frees them again)
    let noDeal = 0;
    while (s.staging.length < 5 && placed + s.staging.length < total && noDeal < 6) {
      const before = s.staging.length;
      E('btn-deal').dispatch('click', {}); dealt++;
      s = snap();
      if (s.staging.length === before) noDeal++; else noDeal = 0;
    }
    if (s.staging.length === 0) { stuck = 'L' + l + ' nothing to place'; break; }
    const word = s.staging[0], ci = targetCat(s, word);
    if (ci < 0) { stuck = 'L' + l + ' no home for "' + word + '"'; break; }
    dragTo(0, ci);
    const s2 = snap();
    if (s2.mistakes !== 0) { stuck = 'L' + l + ' correct drop on "' + s.cats[ci].n + '" counted wrong'; break; }
    if (s2.staging.length !== s.staging.length - 1) { stuck = 'L' + l + ' card not consumed'; break; }
  }
  if (stuck) break;
  g.pump(35); // 500ms showWin timer
  if (!E('win-screen').classList.contains('active')) { stuck = 'L' + l + ' win screen missing'; break; }
  if (E('win-stars').textContent !== '★★★') { stuck = 'L' + l + ' stars=' + E('win-stars').textContent; break; }
  solvedLvls++;
  if (l < 50) { E('btn-next').dispatch('click', {}); g.pump(1); }
}
T('all-50-levels', !stuck && solvedLvls === 50, stuck || '50/50 (L17 dup-word regression OK)');
T('save-progress-50', Object.keys(snap().lvl && g.call('__WCS.save().progress') || {}).length === 50 &&
  Object.values(g.call('__WCS.save().progress')).every(v => v === 3),
  'n=' + Object.keys(g.call('__WCS.save().progress')).length);

// ---- level select: 5 tiers x 10, all unlocked after the full clear ----
E('btn-win-levels').dispatch('click', {}); g.pump(2);
const sections = E('tier-container').children.filter(c => String(c.className).includes('tier-section'));
const btns = sections.flatMap(sec => sec.children.filter(c => String(c.className).includes('tier-grid')).pop().children);
const lockedN = btns.filter(b => String(b.className).split(/\s+/).includes('locked')).length;
T('level-select-50-unlocked', sections.length === 5 && btns.length === 50 && lockedN === 0,
  'tiers=' + sections.length + ' btns=' + btns.length + ' locked=' + lockedN);

// ---- replay L1 through the real level button: deliberate WRONG drop, then 2-star win ----
btns[0].onclick(); g.pump(2);
T('replay-started', snap().lvl === 1, 'lvl=' + snap().lvl);
for (let i = 0; i < 3; i++) E('btn-deal').dispatch('click', {});
let s = snap();
const word = s.staging[0];
const wrongCi = s.cats.findIndex(c => !c.w.includes(word));
dragTo(0, wrongCi);
s = snap();
T('wrong-drop-counted', s.mistakes === 1 && s.staging.length === 3 && /Mistakes:\s*1/.test(E('mistakes-display').textContent || ''),
  'mistakes=' + s.mistakes + ' staging=' + s.staging.length + ' hud="' + (E('mistakes-display').textContent || '') + '"');
// finish L1 (wrongly-dropped card was returned to staging) -> 2 stars, save keeps best 3
let guard = 0;
while (guard++ < 100) {
  s = snap();
  const total = s.cats.reduce((a, c) => a + c.w.length, 0);
  const placed = s.cats.reduce((a, c) => a + c.p.length, 0);
  if (placed === total) break;
  while (s.staging.length < 5 && placed + s.staging.length < total) { E('btn-deal').dispatch('click', {}); s = snap(); }
  if (s.staging.length === 0) break;
  dragTo(0, targetCat(s, s.staging[0]));
}
g.pump(35);
T('replay-2star', E('win-screen').classList.contains('active') && E('win-stars').textContent === '★★☆' &&
  g.call('__WCS.save().progress[1]') === 3, 'stars=' + E('win-stars').textContent + ' save=' + g.call('__WCS.save().progress[1]'));

// ---- L2 via real Next: deck-pile deal, place+undo, shuffle, hint ----
E('btn-next').dispatch('click', {}); g.pump(2);
T('next-to-L2', snap().lvl === 2, 'lvl=' + snap().lvl);
E('btn-deal').dispatch('click', {}); E('deck-pile').dispatch('click', {}); g.pump(1);
T('deck-pile-deals', snap().staging.length === 2, 'staging=' + snap().staging.length);
// place one correctly then undo it (staging was 2 -> 1 after place -> 2 after undo)
s = snap();
const word2 = s.staging[0];
dragTo(0, targetCat(s, word2));
const placed0 = snap().cats.reduce((a, c) => a + c.p.length, 0);
E('btn-undo').dispatch('click', {}); g.pump(1);
T('undo-reverts', snap().cats.reduce((a, c) => a + c.p.length, 0) === placed0 - 1 &&
  snap().staging.length === 2 && snap().staging[0] === word2 && snap().histLen === 0,
  'placed=' + snap().cats.reduce((a, c) => a + c.p.length, 0) + ' staging=' + snap().staging.length);
// shuffle preserves the multiset
const before = snap().staging.slice().sort().join(',');
E('btn-shuffle').dispatch('click', {}); g.pump(1);
T('shuffle', snap().shuffles === 1 && snap().staging.slice().sort().join(',') === before,
  'shuffles=' + snap().shuffles + ' staging=' + snap().staging.join(','));
// hint: consumes a charge, toast names the category
E('btn-hint').dispatch('click', {}); g.pump(1);
const toast = (g.sandbox.document.body.children || []).filter(c => String(c.className || '').includes('game-toast')).pop();
T('hint', snap().hints === 2 && /belongs to/.test((toast && toast.textContent) || ''),
  'hints=' + snap().hints + ' toast="' + ((toast && toast.textContent) || '').slice(0, 50) + '"');

const saved = JSON.parse(g.ls.getItem('wcs_save') || '{}');
T('save-persisted', saved && saved.progress && Object.keys(saved.progress).length === 50 && saved.progress[1] === 3,
  'keys=' + Object.keys((saved && saved.progress) || {}).length);
T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { levels: stuck ? 'STUCK@' + stuck : '50/50 3-star', dealtCards: dealt, replay: 'wrong-drop->2star, best-3 kept',
    powerups: 'hint/shuffle/undo/deck-pile', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('word-card-sort: ' + (stuck ? 'STUCK ' + stuck : '50/50 levels') + ' via real drags/drops: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
