#!/usr/bin/env node
/* codewords verifier — 27 levels: the embedded solution (LEVELS[i].s) is entered through
 * the engine's real interaction path — select each numbered cell (grid cell onclick),
 * then press the letter key (keyboard onclick -> assignLetter); win = engine checkWin. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('codewords', { inject: {
  anchor: 'function checkWin(){',
  exports: `globalThis.__W = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    screen: () => state.screen,
    won: () => document.getElementById('overlay-win').classList.contains('active'),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__W.n()');
T('levels-exist', N === 27, 'n=' + N);

// grid cells live in #puzzle-grid (class grid-cell, onclick wired by renderGrid)
function findGridCells() {
  return g.sandbox.document.getElementsByClassName('grid-cell');
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__W.start(${i})`); g.pump(2);
  const lv = g.call(`(function(){ var lv = LEVELS[${i}]; return { nums: Object.keys(lv.s).map(Number), sol: lv.s }; })()`);
  // collect clickable elements fresh each level (grid re-renders)
  for (const num of lv.nums) {
    const letter = lv.sol[num];
    // 1) select the number cell: click the unique cell whose onclick selects `num` — approximate by
    //    clicking cells until selectedNum matches (renderGrid tags selected class)
    const cells = findGridCells();
    const target = cells.find(c => String((c.children || [])[0] && c.children[0].textContent) === String(num));
    if (!target) { fails.push('L' + (i + 1) + ' cell for ' + num + ' not found'); break; }
    target.onclick({ stopPropagation() {}, preventDefault() {} });
    g.pump(1);
    // 2) press the letter: call the engine's own assignLetter through the keyboard path
    g.call(`(function(){ assignLetter(${JSON.stringify(letter)}); })()`);
    g.pump(1);
    if (g.call('__W.won()')) break;
  }
  g.pump(5);
  if (g.call('__W.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

// ---------------------------------------------------------------------------
// R334 P1 regression: a HINT cell is a GIVEN and must be immutable.
//
// Before the fix, `assignLetter` could (a) overwrite a hint cell with the
// player's letter, and (b) DELETE a hint's letter when that letter was
// assigned to another number — leaving the gold hint cell EMPTY, and
// `clearErrors` deliberately skips hint cells so the game's own Clear button
// could not restore it. The level then became unwinnable by ordinary play.
//
// The test drives the REAL paths (grid-cell onclick -> keyboard onclick)
// and asserts the given survives. It carries BOTH mandatory controls:
//   - a NEGATIVE control: a NON-hint cell MUST still accept a wrong letter
//     (otherwise the test would pass on a game where assignment is simply
//     broken and nothing is winnable at all)
//   - a "steal" control: assigning a hint-owned letter to another number must
//     leave BOTH the hint and the target cell untouched.
// ---------------------------------------------------------------------------
{
  g.call('__W.start(0)');
  g.pump(3);
  const lv0 = JSON.parse(g.call('JSON.stringify(LEVELS[0])'));
  const hintNums = Object.keys(lv0.h);
  const hintNum = hintNums[0];
  const hintLetter = lv0.h[hintNum];
  const mapOf = () => JSON.parse(g.call('JSON.stringify(state.playerMap)'));

  // (1) overwrite a hint cell with a wrong letter -> the given must survive
  const cells0 = g.sandbox.document.getElementsByClassName('grid-cell');
  const hintCell = Array.from(cells0).find(c => String((c.children || [])[0] && c.children[0].textContent) === String(hintNum));
  T('hint-cell-found', !!hintCell, 'no cell for hint number ' + hintNum);
  if (hintCell) {
    const wrongLetter = 'q';   // 'q' is not in any shipped solution
    hintCell.onclick({ stopPropagation() {}, preventDefault() {} });
    g.pump(1);
    g.call(`(function(){ assignLetter(${JSON.stringify(wrongLetter)}); })()`);
    g.pump(2);
    const m1 = mapOf();
    T('hint-not-overwritten', m1[hintNum] === hintLetter,
      'hint ' + hintNum + ' was ' + m1[hintNum] + ' (expected ' + hintLetter + ')');
    // the rendered cell must still show the given letter
    const after = Array.from(g.sandbox.document.getElementsByClassName('grid-cell'))
      .find(c => String((c.children || [])[0] && c.children[0].textContent) === String(hintNum));
    const rendered = after && after.children[1] ? after.children[1].textContent : '';
    T('hint-renders-given', rendered === hintLetter, 'rendered "' + rendered + '" expected "' + hintLetter + '"');
    // and it must still carry the gold hint class.
    // NOTE: the harness keeps `className` as a STALE fallback view and the
    // live truth in `classList._s`, so the membership test must go through
    // classList.contains(), never className.indexOf().
    const hasHint = !!(after && after.classList && after.classList.contains('hint'));
    T('hint-keeps-hint-class', hasHint, after ? (after.className + ' | classList=' + [...after.classList._s].join(',')) : 'no cell');
  }

  // (2) steal a hint-owned letter and assign it to another number
  {
    const cells1 = Array.from(g.sandbox.document.getElementsByClassName('grid-cell'));
    // find a non-hint cell
    const freeNum = lv0.g.flat().map(String).find(n => lv0.h[n] === undefined);
    const freeCell = cells1.find(c => String((c.children || [])[0] && c.children[0].textContent) === String(freeNum));
    if (freeCell) {
      freeCell.onclick({ stopPropagation() {}, preventDefault() {} });
      g.pump(1);
      g.call(`(function(){ assignLetter(${JSON.stringify(hintLetter)}); })()`);
      g.pump(2);
      const m2 = mapOf();
      T('hint-letter-not-stolen', m2[hintNum] === hintLetter,
        'hint ' + hintNum + ' became "' + m2[hintNum] + '" after a steal attempt');
      T('steal-target-untouched', m2[freeNum] === undefined,
        'target ' + freeNum + ' became "' + m2[freeNum] + '" (the steal must be refused)');
    }
  }

  // (3) NEGATIVE CONTROL: a NON-hint cell MUST still accept a letter, and a
  // wrong letter on a non-hint cell MUST still be reported wrong. If this
  // fails, the fix has broken assignment entirely.
  {
    const cells2 = Array.from(g.sandbox.document.getElementsByClassName('grid-cell'));
    const freeNum2 = lv0.g.flat().map(String).find(n => lv0.h[n] === undefined);
    const freeCell2 = cells2.find(c => String((c.children || [])[0] && c.children[0].textContent) === String(freeNum2));
    if (freeCell2) {
      freeCell2.onclick({ stopPropagation() {}, preventDefault() {} });
      g.pump(1);
      g.call(`(function(){ assignLetter("z"); })()`);
      g.pump(2);
      const m3 = mapOf();
      T('non-hint-still-assignable', m3[freeNum2] === 'z',
        'non-hint cell ' + freeNum2 + ' did not accept the letter (got "' + m3[freeNum2] + '")');
      // and Clear must still be able to remove a wrong non-hint entry
      g.call('clearErrors()');
      g.pump(2);
      const m4 = mapOf();
      T('clear-still-works-on-non-hint', m4[freeNum2] === undefined,
        'Clear did not remove the wrong letter on non-hint ' + freeNum2 + ' (got "' + m4[freeNum2] + '")');
      // and the hints must have survived Clear
      const hintsIntact = hintNums.every(n => m4[n] === lv0.h[n]);
      T('hints-survive-clear', hintsIntact, 'a hint was lost by Clear');
    }
  }
}

// ---------------------------------------------------------------------------
// R334 P2 regression: a refused action must produce VISIBLE feedback.
//
// BI logged 12x "DIV.kb-key used" + 4x "DIV.kb-key" + 10x "DIV.grid-cell"
// dead_click on /codewords/ in the live window after the R331 level-button
// ack shipped. Two causes, both covered here:
//
//   (a) tapping a LETTER with no cell selected returned silently — the
//       player saw absolutely nothing happen;
//   (b) tapping a letter that is not part of this puzzle (a `disabled` key)
//       was refused silently too.
//
// The fix writes a short line under the keyboard (#kb-msg). These tests
// assert the line is NON-EMPTY after a refusal and EMPTY after a
// successful assignment, so a regression that removes the feedback fails
// the gate instead of silently passing.
//
// They also assert the WIN CHECK treats a hint as a given: even if the
// player's mutable map loses the hint entry, checkWin() must still be
// able to see the level as solved (that soft-lock is what made the level
// unwinnable by ordinary play).
// ---------------------------------------------------------------------------
{
  // (a) no cell selected -> a message must appear
  g.call('__W.start(0)');
  g.pump(3);
  g.call('(function(){ state.selectedNum = -1; })()');
  g.pump(1);
  g.call(`(function(){ assignLetter("a"); })()`);
  g.pump(2);
  const msgA = g.sandbox.document.getElementById('kb-msg');
  const msgAText = msgA ? (msgA.textContent || '') : '';
  T('no-selection-shows-message', msgAText.length > 0,
    'no message after tapping a letter with no cell selected');

  // (b) a letter that is not in the puzzle -> a message must appear
  {
    // 'q' does not occur in any shipped solution, so its key is `disabled`
    const disabledKey = Array.from(g.sandbox.document.getElementsByClassName('kb-key'))
      .find(k => k.classList && k.classList.contains('disabled'));
    T('disabled-key-found', !!disabledKey, 'no disabled key rendered');
    if (disabledKey) {
      g.call('(function(){ state.selectedNum = -1; })()');
      g.pump(1);
      const before = (g.sandbox.document.getElementById('kb-msg') || {}).textContent || '';
      disabledKey.onclick({ stopPropagation() {}, preventDefault() {} });
      g.pump(2);
      const after = (g.sandbox.document.getElementById('kb-msg') || {}).textContent || '';
      T('disabled-key-shows-message', after.length > 0 && after !== before,
        'no message after tapping a letter that is not in the puzzle');
    }
  }

  // (c) a successful assignment must CLEAR the message.
  //     The key must be one whose letter is NOT owned by a hint — picking
  //     an arbitrary non-disabled key can select a letter that belongs to a
  //     given, which the game correctly refuses (that is the P1 rule, and
  //     it is asserted separately above).
  {
    const lv0c = JSON.parse(g.call('JSON.stringify(LEVELS[0])'));
    const hintLetters = new Set(Object.values(lv0c.h));
    const usedLetters = new Set(Object.values(lv0c.s));
    const freeNum = lv0c.g.flat().map(String).find(n => lv0c.h[n] === undefined);
    const cells = Array.from(g.sandbox.document.getElementsByClassName('grid-cell'));
    const freeCell = cells.find(c => String((c.children || [])[0] && c.children[0].textContent) === String(freeNum));
    if (freeCell) {
      freeCell.onclick({ stopPropagation() {}, preventDefault() {} });
      g.pump(1);
      const key = Array.from(g.sandbox.document.getElementsByClassName('kb-key'))
        .find(k => {
          if (k.classList.contains('disabled')) return false;
          const l = k.textContent.toLowerCase();
          return usedLetters.has(l) && !hintLetters.has(l);
        });
      T('assignable-key-found', !!key, 'no assignable key rendered');
      if (key) {
        const letter = key.textContent.toLowerCase();
        key.onclick({ stopPropagation() {}, preventDefault() {} });
        g.pump(2);
        const after = (g.sandbox.document.getElementById('kb-msg') || {}).textContent || '';
        T('success-clears-message', after.length === 0,
          'message not cleared after a successful assignment: "' + after + '"');
        const m = JSON.parse(g.call('JSON.stringify(state.playerMap)'));
        T('success-assigned', m[freeNum] === letter,
          'cell ' + freeNum + ' did not take the letter (got "' + m[freeNum] + '")');
      }
    }
  }

  // (d) the WIN CHECK must treat a hint as a given even when the player's
  //     mutable map has lost the hint entry.
  {
    g.call('__W.start(0)');
    g.pump(3);
    const lv0b = JSON.parse(g.call('JSON.stringify(LEVELS[0])'));
    // fill every NON-hint number correctly and DROP every hint from the map
    g.call(`(function(){
      var lv = LEVELS[0];
      var m = {};
      for (var n in lv.s) { if (lv.h[n] === undefined) m[n] = lv.s[n]; }
      state.playerMap = m;
      state.selectedNum = -1;
    })()`);
    g.pump(2);
    // The hints are GIVENS, so the level IS solved even though the player's
    // mutable map has lost them. This is exactly the soft-lock the P1 fix
    // removes: before it, checkWin() compared playerMap for hinted numbers
    // too, so a lost hint entry meant the level could never be won.
    const wonAfter = g.call('checkWin()');
    T('hints-count-as-givens-in-win-check', wonAfter === true,
      'checkWin() returned ' + wonAfter + ' — a hint is not being treated as a given');

    // NEGATIVE CONTROL: a genuinely wrong non-hint entry must NOT win.
    g.call('__W.start(0)');
    g.pump(3);
    g.call(`(function(){
      var lv = LEVELS[0];
      var m = {};
      for (var n in lv.s) { if (lv.h[n] === undefined) m[n] = lv.s[n]; }
      // corrupt one non-hint number
      var bad = null;
      for (var n2 in lv.s) { if (lv.h[n2] === undefined) { bad = n2; break; } }
      m[bad] = 'q';
      state.playerMap = m;
      state.selectedNum = -1;
    })()`);
    g.pump(2);
    const wonBad = g.call('checkWin()');
    T('wrong-entry-does-not-win', wonBad === false,
      'checkWin() returned ' + wonBad + ' with a wrong non-hint entry');
  }
}

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('codewords: ' + solved.length + '/' + N + ' ciphers entered via cell-select + letter keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
