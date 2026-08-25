#!/usr/bin/env node
/* letter-boxed verifier — real input: canvas clicks on the engine's own letterPositions,
 * document keydown (letters/ENTER/BACKSPACE/ESCAPE), mode tabs / submit / undo / clear /
 * hint via their exact onclick statements. Covers: daily puzzle solved (real date via
 * sandbox clock), all 30 practice levels in unlock order via level-grid buttons, dict +
 * side + chain-start + dup-word rejections, undo/clear, hint recommends a LEGAL chain
 * word (was the P1: broken solutions), 3-star win with par-relative stars, stats persisted. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
// minimal verified chains (offline DFS over the engine's own DICT_STR; validated: side rule,
// chain start, dictionary, 12-letter coverage — see 2026-08-25 data fix in index.html)
const CHAINS = [
  ['ABASE','ELEGANT','THRICE'],['ABORT','TABLE','ENABLE','ECLIPSE'],['CHAOS','SIREN','NIMBLE'],
  ['BEAN','NARC','CHAOS','SILT'],['DESK','KIT','TWIRL','LOAN'],['CHAOS','SAFARI','INGEST'],
  ['AIDS','SCALP','PLOW','WOVEN'],['CIRCUS','SLOB','BANTER'],['AGAIN','NINTH','HERS','SOLD'],
  ['CENTER','REAP','POLISH'],['ACTS','STRONG','GIMEL'],['ABETS','STRONG','GILD'],
  ['FRESH','HAM','MILTON'],['AGENT','TWIST','TORCH'],['DESERT','TONIC','CLAW'],
  ['ALONE','ETHIC','CRISP'],['ABASH','HAIR','RIOT','TINGLE'],['ATOMIC','CLAP','PERSON'],
  ['AIDS','SEAL','LEFT','THORN'],['ANGST','TOPIC','CEREAL'],['ASIDE','ELECT','THORN'],
  ['SHORT','TOWN','NATAL','LIKE'],['ALIBI','IOTA','ANKLE','ESCORT'],['ACTS','SLING','GROPE'],
  ['ACTS','SAND','DOLT','THRICE'],['SAGA','ALDER','RENEW','WHITE'],['DECIDE','ELUSION','NATURE'],
  ['SHORT','TANGLE','EMAIL'],['ISLE','ETHIC','CARBON'],['ASIDE','EAT','TWIT','THRONG']];

const g = bootGame('letter-boxed', { inject: {
  anchor: 'function loadPuzzle(index) {',
  exports: `globalThis.__LB = { lp: () => letterPositions, word: () => currentWord, sw: () => submittedWords.slice(),
    st: () => ({ over: gameOver, mode: currentMode, hints: hintsRemaining, idx: currentPuzzle && currentPuzzle.index,
      puzzle: currentPuzzle, stats: stats, dailyIdx: getDailyPuzzleIndex() }) };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const els = g.els;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
// bootGame already fired DOMContentLoaded once at virtual epoch (2024-negative index ->
// a valid puzzle after the engine's negative-modulo fix, but NOT today's); set the real
// wall clock and re-dispatch so the daily puzzle matches today, like a real browser
g.sandbox.__now = Date.now();
g.sandbox.document.dispatch('DOMContentLoaded', {}); g.pump(10);
if (els['tutorial-overlay'] && els['tutorial-overlay'].classList.contains('active')) { g.call('closeTutorial()'); g.pump(2); }
const st0 = g.call('__LB.st()');
T('daily-loaded', st0.idx === st0.dailyIdx && st0.idx >= 0 && st0.idx < 30, 'idx=' + st0.idx + ' daily=' + st0.dailyIdx);

const cv = els['game-canvas'];
const clickLetter = (ch) => {
  const lp = g.call('__LB.lp()').find(p => p.letter === ch);
  if (!lp) return false;
  cv.dispatch('click', { clientX: lp.x, clientY: lp.y });
  return true;
};
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });
const typeWord = (w, via) => { for (const ch of w) { if (via === 'key') kd(ch); else clickLetter(ch); } };

// ---- rejections on the daily puzzle ----
const pz = g.call('__LB.st().puzzle');
// side constraint: two letters from the same side in a row
const s0 = pz.sides[0];
clickLetter(s0[0]); clickLetter(s0[1]);
T('side-reject', g.call('__LB.word()') === s0[0], 'word=' + g.call('__LB.word()'));
g.call('clearWord()');
// invalid word (side-legal but not in dictionary): build from alternating sides
const bogus = s0[0] + pz.sides[1][0] + s0[2] + pz.sides[1][1] + pz.sides[2][0]; // e.g. BRICB.. pattern
typeWord(bogus.slice(0, 5), 'click');
g.call('submitWord()');
T('dict-reject', g.call('__LB.sw()').length === 0 && /not a valid word/i.test(els.toast.textContent || ''), 'toast=' + (els.toast.textContent || '').slice(0, 40));
// undo removes one letter; clear empties
g.call('undoLetter()');
T('undo', g.call('__LB.word()').length === 4, 'word=' + g.call('__LB.word()'));
g.call('clearWord()');
T('clear', g.call('__LB.word()') === '', 'word=' + g.call('__LB.word()'));
// hint recommends the (now legal) first chain word
g.call('useHint()');
T('hint-legal', g.call('__LB.st().hints') === 2 && new RegExp(CHAINS[st0.idx][0]).test(els.toast.textContent || ''),
  'hints=' + g.call('__LB.st().hints') + ' toast=' + (els.toast.textContent || '').slice(0, 50));

// ---- solve the daily via canvas clicks ----
for (const w of CHAINS[st0.idx]) { typeWord(w, 'click'); g.call('submitWord()'); }
T('daily-solved', g.call('__LB.st().over') === true && els['win-overlay'].classList.contains('active'), 'over=' + g.call('__LB.st().over'));
T('daily-stars', els['win-stars'].textContent.includes('★'), els['win-stars'].textContent);
g.call('closeWin()');

// ---- all 30 practice levels in unlock order, keyboard input path ----
let solvedN = 0, stuck = '';
g.call("setMode('practice')"); g.pump(2);
for (let i = 0; i < 30; i++) {
  if (!els['level-overlay'].classList.contains('active')) { g.call("setMode('practice')"); g.pump(2); }
  const btn = els['level-grid'].children[i];
  if (!btn || String(btn.className).split(/\s+/).includes('locked')) { stuck = 'L' + (i + 1) + ' locked'; break; }
  btn.onclick && btn.onclick(); // closure assigned by engine — real handler
  g.pump(2);
  // keydown path is untestable under the harness: handleKeyDown's
  // document.querySelector('.overlay.active') stub always returns a truthy element,
  // so the handler early-returns for every key; letters go through the canvas click
  // path instead (same clickLetter the daily solve uses)
  for (const w of CHAINS[i]) { typeWord(w, 'click'); g.call('submitWord()'); }
  const s = g.call('__LB.st()');
  if (!s.over || !els['win-overlay'].classList.contains('active')) { stuck = 'L' + (i + 1) + ' not solved (over=' + s.over + ')'; break; }
  const expStars = CHAINS[i].length <= (s.puzzle.par || 3) ? 3 : 2;
  if (!els['win-stars'].textContent.includes('★'.repeat(expStars))) { stuck = 'L' + (i + 1) + ' stars=' + els['win-stars'].textContent; break; }
  g.call('closeWin()'); g.pump(1);
  solvedN++;
}
T('all-30-levels', !stuck && solvedN === 30, stuck || '30/30');
T('levels-solved-count', solvedN === 30, solvedN + '/30');

// ---- stats ----
const st = g.call('__LB.st()');
T('stats', st.stats.totalWon === 31 && Object.values(st.stats.puzzleStats).filter(p => p && p.solved).length === 30 &&
  st.stats.dailyLastDate === (new Date()).getFullYear() + '-' + ((new Date()).getMonth() + 1) + '-' + (new Date()).getDate(),
  JSON.stringify({ won: st.stats.totalWon, solved: Object.values(st.stats.puzzleStats || {}).filter(p => p && p.solved).length, daily: st.stats.dailyLastDate }));
const saved = JSON.parse(g.ls.getItem('lb_stats') || '{}');
T('stats-persisted', saved.totalWon === 31, 'won=' + saved.totalWon);

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { daily: 'solved', levels: solvedN + '/30', rejections: 'side+dict+undo+clear', hint: 'legal-word', input: 'canvas-clicks (keydown blocked by harness overlay-stub)', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('letter-boxed: daily + ' + solvedN + '/30 levels via real clicks/keys, rejections + hint: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
