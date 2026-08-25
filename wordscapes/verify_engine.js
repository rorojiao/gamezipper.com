#!/usr/bin/env node
/* wordscapes verifier — all 30 levels completed: words are entered with REAL canvas pointer
 * drags on the letter wheel (pointerdown at the first letter, pointermove along the word,
 * pointerup -> handlePointerUp -> checkWord); level done = engine's ov-complete overlay +
 * stars persisted. Also: non-dictionary word shakes (not accepted), bonus word coins. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('wordscapes', { inject: {
  anchor: 'function checkWord(word){',
  exports: `globalThis.__WA = {
    st: () => ({ lvl: currentLevel, found: foundWords.size, nWords: LEVELS[currentLevel].words.length,
                 stars: (Array.isArray(state.levelStars) ? state.levelStars.slice() : Object.values(state.levelStars)), coins: state.coins, bonus: bonusWords.size }),
    letters: () => wheelLetters.slice(),
    words: () => LEVELS[currentLevel].words.slice(),
    pos: (i) => ({ x: wheelCenter.x + Math.cos(wheelAngles[i]) * WHEEL_RADIUS, y: wheelCenter.y + Math.sin(wheelAngles[i]) * WHEEL_RADIUS }),
    dictHas: (w) => DICT.has(w),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const els = g.els;
const cv = () => els['cvs-wheel'];
const active = (id) => els[id].classList.contains('active');

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

els['btn-play'].dispatch('click', {}); g.pump(2);
T('packs-shown', active('scr-packs') && els['pack-grid'].children.length === 6, 'packs=' + els['pack-grid'].children.length);
els['pack-grid'].children[0].dispatch('click', {}); g.pump(2); // real pack card
els['lv-grid'].children[0].dispatch('click', {}); g.pump(2);   // real level button
T('level1-starts', active('scr-game'), 'scr-game inactive');

const drag = (indices) => {
  const at = (i) => g.call(`__WA.pos(${i})`);
  let p = at(indices[0]);
  cv().dispatch('pointerdown', { clientX: p.x, clientY: p.y, preventDefault() {} });
  for (let k = 1; k < indices.length; k++) { p = at(indices[k]); cv().dispatch('pointermove', { clientX: p.x, clientY: p.y, preventDefault() {} }); }
  cv().dispatch('pointerup', { clientX: p.x, clientY: p.y, preventDefault() {} });
};
const indicesFor = (word) => { // map each char to an unused wheel index
  const letters = g.call('__WA.letters()'); const used = new Set(); const out = [];
  for (const ch of word) {
    const i = letters.findIndex((l, k) => l === ch && !used.has(k));
    if (i < 0) return null; used.add(i); out.push(i);
  }
  return out;
};
const dragWord = (word) => { const idx = indicesFor(word); if (!idx) return false; drag(idx); return true; };

// wrong word: a 2-letter combo from the wheel that is NOT in the engine's DICT
{
  const letters = g.call('__WA.letters()');
  let done = false;
  for (let i = 0; i < letters.length && !done; i++) for (let j = 0; j < letters.length && !done; j++) {
    if (i === j) continue;
    const w = letters[i] + letters[j];
    if (!g.call(`__WA.dictHas(${JSON.stringify(w.toLowerCase())})`)) {
      drag([i, j]); done = true;
      T('wrong-word-rejected', g.call('__WA.st()').found === 0, 'found=' + g.call('__WA.st()').found);
    }
  }
}
// bonus word: a DICT word formable from the wheel that is not a level word
{
  const letters = g.call('__WA.letters()');
  const lvWords = new Set(g.call('__WA.words()').map(w => w.toUpperCase()));
  const cnt = {}; letters.forEach(c => cnt[c] = (cnt[c] || 0) + 1);
  const cands = ['CATS', 'EAST', 'CASE', 'SEAT', 'TEAS', 'EATS', 'SCAT', 'ATES', 'SATE', 'DOGS', 'SUN', 'RAN', 'ASK', 'SEA'];
  const bonus = cands.find(w => !lvWords.has(w) && g.call(`__WA.dictHas(${JSON.stringify(w.toLowerCase())})`)
    && [...w].every(c => cnt[c] > 0) && [...new Set(w)].every(c => [...w].filter(x => x === c).length <= cnt[c]));
  if (bonus) { const c0 = g.call('__WA.st()').coins; dragWord(bonus); const st = g.call('__WA.st()'); T('bonus-word-coins', st.coins === c0 + 1 && st.bonus === 1, JSON.stringify(st)); }
  else T('bonus-word-coins', true, 'no candidate in DICT (skipped)');
}

const starsAt = (arr, i) => (Array.isArray(arr) ? arr[i] : Object.values(arr)[i]);
const t0 = Date.now();
let done = 0;
for (let lvl = 0; lvl < 30; lvl++) {
  const words = g.call('__WA.words()');
  let ok = true;
  for (const w of words) {
    if (!dragWord(w.toUpperCase())) { fails.push('L' + (lvl + 1) + ' untypeable ' + w); ok = false; break; }
  }
  g.pump(35); // levelComplete timer 500ms
  const st = g.call('__WA.st()');
  if (!(active('ov-complete') && st.found === st.nWords && starsAt(st.stars, lvl) > 0)) { fails.push('L' + (lvl + 1) + ' found=' + st.found + '/' + st.nWords + ' ov=' + active('ov-complete')); ok = false; }
  if (!ok) break;
  done++;
  els['btn-next'].dispatch('click', {}); g.pump(2); // real Next button
}
const stars = g.call('__WA.st()').stars;
T('all-30-levels-complete', done === 30 && stars.filter(s => s > 0).length === 30, done + '/30 starred=' + stars.filter(s => s > 0).length);
T('ends-at-packs', active('scr-packs'), 'screen');

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { levels: done + '/30', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('wordscapes: ' + done + '/30 levels completed via real wheel drags: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
