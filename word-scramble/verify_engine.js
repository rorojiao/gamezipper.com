#!/usr/bin/env node
/* word-scramble verifier — ALL 10 categories x 5 levels = 50 levels completed + daily puzzle:
 * category cards and level buttons are clicked for real (closure onclick), every word is solved
 * by clicking the real letter tiles (renderGame's closure onclick -> placeTile) in the right
 * order; wrong full attempt, partial submit, tile removal (slot click) and hint are exercised.
 * Static <button onclick="..."> controls can't fire under the harness (no inline-attr binding),
 * so those are invoked as the exact statement the button runs (submitAnswer/nextLevel/...). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('word-scramble', { inject: {
  anchor: 'function submitAnswer() {',
  exports: `globalThis.__WS = {
    st: () => ({ word: g.currentWord, ansLen: g.answer.length, ansWord: g.answer.map(t => t.letter).join(''), solved: g.wordsSolved, inLevel: g.wordsInLevel,
                 level: g.level, cat: g.cat, coins: S.coins, hints: g.hintsUsed, daily: S.dailyCompleted }),
    stars: () => ({ ...S.stars }),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const els = g.els;
const active = (id) => els[id].classList.contains('active');
const CATS = 10, LEVELS = 5;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

// category cards are real closure-clicked
g.call("showScreen('cat-screen')"); g.pump(2);
T('categories-rendered', els['cat-grid'].children.length === CATS, 'n=' + els['cat-grid'].children.length);

const tiles = () => els['tile-area'].children.filter(c => (c.className || '').split(/\s+/).includes('letter-tile') && !(c.className || '').includes('used'));
const place = (ch) => { const t = tiles().find(x => x.textContent === ch); if (!t) return false; t.dispatch('click', {}); return true; };

let didWrong = false, didPartial = false, didRemove = false, didHint = false;
const solveWord = () => {
  const w = g.call('__WS.st()').word;
  if (!didPartial) { // partial submit: 1 tile placed -> rejected, answer kept
    place(w[0]); g.call('submitAnswer()');
    const st = g.call('__WS.st()');
    T('partial-submit-rejected', st.ansLen === 1 && st.solved === 0, 'ansLen=' + st.ansLen);
    didPartial = true;
  }
  if (!didRemove && w.length >= 3) { // click a placed slot to remove that tile
    place(w[1]);
    const slot = els['answer-area'].children[0];
    slot.dispatch('click', {});
    T('slot-click-removes', g.call('__WS.st()').ansLen === 1, 'ansLen=' + g.call('__WS.st()').ansLen);
    didRemove = true;
  }
  if (!didWrong && w.length >= 3) { // full wrong attempt: tiles in displayed (scrambled) order
    const order = els['tile-area'].children.filter(c => (c.className || '').split(/\s+/).includes('letter-tile')).map(c => c.textContent).join('');
    if (order !== w) {
      for (const ch of order) place(ch);
      g.call('submitAnswer()');
      let st = g.call('__WS.st()');
      T('wrong-attempt-rejected', st.solved === 0 && !active('word-correct-modal'), 'solved=' + st.solved);
      g.call('clearAnswer()'); // like the Clear button
      didWrong = true;
    }
  }
  if (!didHint && g.call('__WS.st()').coins >= 10) { // hint reveals + autoplaces a letter
    const before = g.call('__WS.st()');
    g.call('useHint()');
    const after = g.call('__WS.st()');
    T('hint-reveals', after.hints === before.hints + 1 && after.coins === before.coins - 10, JSON.stringify({ before: before.coins, after: after.coins }));
    didHint = true;
  }
  // hint autoplace appends at the answer's END, so order can't be resumed — clear (real Clear
  // button action) and type the whole word in order, like a player would after a hint
  if (g.call('__WS.st()').ansLen > 0) g.call('clearAnswer()');
  for (const ch of w) if (!place(ch)) return false;
  g.call('submitAnswer()'); g.pump(3);
  return active('word-correct-modal');
};

const t0 = Date.now();
// start the chain with real clicks: animals card -> level 1 button; nextLevel() then walks
// all 50 levels (each completed level unlocks the next; finishing a cat's lvl5 rolls into next cat)
els['cat-grid'].children[0].dispatch('click', {}); g.pump(2);
if (!active('level-screen')) fails.push('level-screen not shown after card click');
els['level-grid'].children[0].dispatch('click', {}); g.pump(2);
for (let lvl = 1; lvl <= CATS * LEVELS; lvl++) {
  if (!active('game-screen')) { fails.push('lvl' + lvl + ' game-screen not shown'); break; }
  let ok = true;
  for (let wi = 0; wi < g.call('__WS.st()').inLevel; wi++) {
    if (!solveWord()) { fails.push('lvl' + lvl + ' w' + wi + ' unsolved'); ok = false; break; }
    g.call("closeModal('word-correct-modal');nextWord()"); g.pump(2);
  }
  if (!ok) break;
  if (!active('level-complete-modal')) { fails.push('lvl' + lvl + ' not completed'); break; }
  g.call('nextLevel()'); g.pump(3);
}
const stars = g.call('__WS.stars()');
const got = CAT_ORDER_KEYS().filter(k => (stars[k] || 0) > 0).length;
function CAT_ORDER_KEYS() { const ks = []; for (const c of ['animals','food','nature','sports','science','music','travel','technology','colors','emotions']) for (let l = 1; l <= LEVELS; l++) ks.push(c + '_' + l); return ks; }
T('all-50-levels-starred', got === CATS * LEVELS, got + '/50 first-missing: ' + CAT_ORDER_KEYS().find(k => !(stars[k] > 0)));

// daily puzzle: single seeded word
g.call('startDailyPuzzle()'); g.pump(2);
T('daily-starts', active('game-screen'), 'screen');
if (solveWord()) {
  g.call("closeModal('word-correct-modal');nextWord()"); g.pump(3);
  T('daily-completes', g.call('__WS.st()').daily === true && active('daily-screen'), 'daily=' + g.call('__WS.st()').daily);
} else { fail++; fails.push('daily word unsolved'); }

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { levels: got + '/50', daily: true, durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('word-scramble: 50/50 levels + daily completed via real tile clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
