#!/usr/bin/env node
'use strict';
// Str8ts — full verification via real input paths (verifier-spec contract).
//
// Engine win check (checkWin L637): every white cell filled AND val === levelData.sol
// — never relaxed here. Solutions are the engine's own embedded LEVELS[i].sol,
// entered through the same paths a player uses:
//   canvas click (handleCanvasClick L557) → numpad .num-btn click (placeNumber L582)
//   keyboard digit (document keydown L1014) and numpad ⌫ (eraseCell L622) also covered.
// Navigation uses the public Game API, which is exactly what every inline
// onclick="Game.*()" button delegates to.
//
// Coverage:
//   - all 27 levels in unlock order: level-btn click (real onclick=startLevel) →
//     fill all white non-given cells → winOverlay + 3 stars + str8ts_save.completed
//     + Next Level chain (nextLevel) + next button unlocked (lock gating asserted)
//   - L1 aux: pencil mode (pencilBtn + pencil mark), wrong entry (error flag +
//     errors counter + #errorVal), erase, undo/redo, hint (hintBtn → cell locked
//     given + hints counter), keyboard digit entry, pause→restart (state reset)
//   - daily challenge (startDaily → rotated level → win → completed.daily,
//     nextLevel from daily returns to menu)
//   - screens: tutorial (4 steps, prev/next/close via real buttons), settings
//     (toggle + restore), stats (6 cards, counts after 28 wins), pause/resume
//
// Data audit (offline, /tmp/st8-probe.js): all 27 sols complete over white cells,
// givens ⊆ sol, digits in range, no row/col repeats, every horizontal/vertical
// white run is a consecutive straight — str8ts rules hold for every level.

const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const fails = [];
let pass = 0;

function ok(cond, name, detail) {
  if (cond) { pass++; } else { fails.push(name + (detail ? ' — ' + detail : '')); }
}

let verdict = 'PASS';
try {
  const g = bootGame('str8ts', {
    inject: {
      anchor: 'var saveData = loadStorage();',
      exports: 'window.__str8tsQA={levels:LEVELS,st:function(){return state;}};',
    },
  });
  // Before the P2 fix this was non-empty: "showLevelSelect is not defined"
  // (gz-analytics.js loads in every production page, the trailing window-alias
  // block then referenced IIFE-scoped names and threw).
  ok(g.loadErrors.length === 0, 'boot clean (window-alias P2 fix)', g.loadErrors.join(' | '));

  const LEVELS = JSON.parse(g.call('JSON.stringify(__str8tsQA.levels)'));
  const total = LEVELS.length;
  ok(total === 27, '27 levels', String(total));

  const cv = g.els['gameCanvas'];
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });
  const S = () => g.call('__str8tsQA.st()');

  const levelBtns = () => g.els['levelGridContainer'].children.filter(el => el.classList.contains('level-btn'));

  // Fill every white non-given cell of the current level via canvas+numpad.
  const fillAll = (levelData) => {
    const cs = S().cellSize;
    const pad = g.els['numpad'];
    const n = levelData.n;
    ok(pad.children.length === n + 1, 'numpad built', pad.children.length + ' children for n=' + n);
    let entered = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const k = r + ',' + c;
      const v = levelData.sol[k];
      if (v === undefined || levelData.givens[k] !== undefined) continue;
      cv.dispatch('click', { clientX: cs * (c + 1), clientY: cs * (r + 1) });
      pad.children[v - 1].dispatch('click', {});
      entered++;
    }
    return entered;
  };

  // Title → level select (Play button path)
  g.call('Game.showLevelSelect()');
  ok(S().screen === 'levelSelect', 'title→level-select');
  let btns = levelBtns();
  ok(btns.length === 27, 'level grid built', btns.length + ' buttons');
  ok(!btns[0].classList.contains('locked') && btns[1].classList.contains('locked') && btns[26].classList.contains('locked'),
    'initial lock gating (L1 open, rest locked)');

  for (let i = 0; i < total; i++) {
    try {
      // real level button click → startLevel(i)
      btns[i].dispatch('click', {});
      const started = S().levelIdx === i && S().screen === 'gameScreen' && S().levelData.n === LEVELS[i].n;
      ok(started, 'L' + (i + 1) + ' start');
      if (!started) continue;

      // ---- L1 auxiliary surface coverage (state reset by restart afterwards) ----
      if (i === 0) {
        const L0 = LEVELS[0];
        const cs = S().cellSize;
        const pad = g.els['numpad'];
        const firstEmpty = (() => { for (let r = 0; r < L0.n; r++) for (let c = 0; c < L0.n; c++) { const k = r + ',' + c; if (L0.sol[k] !== undefined && L0.givens[k] === undefined) return { r, c, k }; } return null; })();
        // pencil mode: toggle via real #pencilBtn, mark, verify, untoggle
        g.els['pencilBtn'].dispatch('click', {});
        ok(S().pencilMode === true, 'pencil on');
        cv.dispatch('click', { clientX: cs * (firstEmpty.c + 1), clientY: cs * (firstEmpty.r + 1) });
        pad.children[2].dispatch('click', {}); // pencil a "3"
        ok(S().grid[firstEmpty.r][firstEmpty.c].pencil[3] === true && S().grid[firstEmpty.r][firstEmpty.c].val === 0, 'pencil mark set, val untouched');
        pad.children[2].dispatch('click', {}); // toggle off again
        ok(S().grid[firstEmpty.r][firstEmpty.c].pencil[3] === undefined, 'pencil mark toggle-off');
        g.els['pencilBtn'].dispatch('click', {});
        ok(S().pencilMode === false, 'pencil off');
        // wrong entry: error flag + counter + #errorVal
        const s0 = L0.sol[firstEmpty.k];
        const wrong = s0 === 1 ? 2 : 1;
        cv.dispatch('click', { clientX: cs * (firstEmpty.c + 1), clientY: cs * (firstEmpty.r + 1) });
        pad.children[wrong - 1].dispatch('click', {});
        ok(S().grid[firstEmpty.r][firstEmpty.c].error === true && S().errors === 1, 'wrong entry flagged + errors=1');
        ok(String(g.els['errorVal'].textContent) === '1', 'errorVal HUD');
        // erase (real ⌫ button)
        pad.children[pad.children.length - 1].dispatch('click', {});
        ok(S().grid[firstEmpty.r][firstEmpty.c].val === 0 && S().grid[firstEmpty.r][firstEmpty.c].error === false, 'erase clears val+error');
        // undo → redo
        g.call('Game.undo()');
        ok(S().grid[firstEmpty.r][firstEmpty.c].val === wrong, 'undo restores');
        g.call('Game.redo()');
        ok(S().grid[firstEmpty.r][firstEmpty.c].val === 0, 'redo re-erases');
        // keyboard digit entry (document keydown handler)
        cv.dispatch('click', { clientX: cs * (firstEmpty.c + 1), clientY: cs * (firstEmpty.r + 1) });
        g.sandbox.document.dispatch('keydown', { key: String(s0), code: String(s0), preventDefault() {} });
        ok(S().grid[firstEmpty.r][firstEmpty.c].val === s0 && S().grid[firstEmpty.r][firstEmpty.c].error === false, 'keyboard entry correct value');
        // progress bar advanced past 0
        ok(parseFloat(g.els['progressFill'].style.width) > 0, 'progressFill advances');
        // hint via real #hintBtn: random cell filled+locked, hints=1
        g.els['hintBtn'].dispatch('click', {});
        const hsel = S().selected;
        ok(S().hints === 1 && S().grid[hsel.r][hsel.c].given === true && S().grid[hsel.r][hsel.c].val === L0.sol[hsel.r + ',' + hsel.c],
          'hint fills + locks a cell, hints=1');
        // pause → restart resets everything (clean 3-star path)
        g.call('Game.showPause()');
        ok(g.els['pauseOverlay'].classList.contains('active'), 'pause overlay');
        g.call('Game.resume()');
        ok(!g.els['pauseOverlay'].classList.contains('active'), 'resume');
        g.call('Game.restartLevel()');
        ok(S().errors === 0 && S().hints === 0 && S().pencilMode === false, 'restart resets counters');
        let dirty = 0;
        for (let r = 0; r < L0.n; r++) for (let c = 0; c < L0.n; c++) { const cell = S().grid[r][c]; if (!cell.black && !cell.given && cell.val !== 0) dirty++; }
        ok(dirty === 0, 'restart clears board');
      }

      const entered = fillAll(LEVELS[i]);
      ok(entered > 0, 'L' + (i + 1) + ' cells entered', entered + '');

      // win fired by the engine's own checkWin inside placeNumber
      ok(g.els['winOverlay'].classList.contains('active'), 'L' + (i + 1) + ' winOverlay');
      ok(S().errors === 0, 'L' + (i + 1) + ' error-free run');
      const saved = JSON.parse(g.call('localStorage.getItem("str8ts_save")'));
      const rec = saved.completed['l' + i];
      ok(rec !== undefined && rec.stars === 3 && rec.errors === 0 && rec.hints === 0, 'L' + (i + 1) + ' saved 3★', JSON.stringify(rec));
      ok(g.els['winStars'].textContent === '⭐⭐⭐' && String(g.els['winErrors'].textContent) === '0' && String(g.els['winHints'].textContent) === '0', 'L' + (i + 1) + ' win HUD');

      if (i < total - 1) {
        g.call('Game.nextLevel()'); // real "Next Level →" path
        ok(S().levelIdx === i + 1 && !g.els['winOverlay'].classList.contains('active'), 'L' + (i + 1) + ' next-level chain');
        // unlock gating from the live level-select DOM
        g.call('Game.quitToMenu()');
        btns = levelBtns();
        const gate = btns[i].classList.contains('completed')
          && (i + 1 >= total || !btns[i + 1].classList.contains('locked'))
          && (i + 2 >= total || btns[i + 2].classList.contains('locked'));
        ok(gate, 'L' + (i + 1) + ' unlock gating');
      }
    } catch (e) { fails.push('L' + (i + 1) + ' fatal: ' + e.message); console.error(e.stack); }
  }

  // ---- Daily challenge (rotated level, own sol, completed.daily) ----
  try {
    g.call('Game.startDaily()');
    ok(S().isDaily === true && S().screen === 'gameScreen', 'daily starts');
    const ld = JSON.parse(g.call('JSON.stringify(__str8tsQA.st().levelData)'));
    ok(ld.tier === 'Daily' && ld.sol && Object.keys(ld.sol).length > 0, 'daily level generated', 'tier=' + ld.tier);
    const entered = fillAll(ld);
    ok(entered > 0 && g.els['winOverlay'].classList.contains('active'), 'daily win via real input', entered + ' cells');
    const saved = JSON.parse(g.call('localStorage.getItem("str8ts_save")'));
    ok(saved.completed.daily !== undefined, 'daily saved', JSON.stringify(saved.completed.daily));
    g.call('Game.nextLevel()'); // from daily → quitToMenu
    ok(S().screen === 'levelSelect', 'daily next → menu');
  } catch (e) { fails.push('daily fatal: ' + e.message); console.error(e.stack); }

  // ---- Screens: tutorial / settings / stats / pause ----
  try {
    g.call('Game.showTutorial()');
    ok(g.els['tutorialOverlay'].classList.contains('active'), 'tutorial overlay');
    const titles = [];
    titles.push(g.els['tutorialTitle'].textContent);
    for (let s = 0; s < 3; s++) { g.els['tutorialNextBtn'].dispatch('click', {}); titles.push(g.els['tutorialTitle'].textContent); }
    ok(titles.length === 4 && new Set(titles).size === 4, 'tutorial 4 distinct steps', titles.join('|'));
    g.els['tutorialPrevBtn'].dispatch('click', {});
    ok(g.els['tutorialTitle'].textContent === titles[2], 'tutorial prev');
    g.els['tutorialNextBtn'].dispatch('click', {});
    g.els['tutorialNextBtn'].dispatch('click', {}); // Done
    ok(!g.els['tutorialOverlay'].classList.contains('active'), 'tutorial done closes');

    g.call('Game.showSettings()');
    ok(g.els['settingsOverlay'].classList.contains('active') && g.els['settingsList'].children.length === 4, 'settings 4 toggles');
    const t0 = g.els['settingsList'].children[1].children[1]; // rows: [Show Conflicts, Sound Effects]; row = [label span, toggle button]
    const before = t0.textContent;
    t0.dispatch('click', {});
    ok(S().settings.soundOn === false && t0.textContent === 'OFF', 'settings toggle off');
    t0.dispatch('click', {});
    ok(S().settings.soundOn === true && t0.textContent === before, 'settings toggle restore');
    g.call('Game.closeOverlay("settingsOverlay")');
    ok(!g.els['settingsOverlay'].classList.contains('active'), 'settings close');

    g.call('Game.showStats()');
    const cards = g.els['statsGrid'].children;
    ok(cards.length === 6, 'stats 6 cards');
    const val = (lbl) => { for (const c of cards) if (c.children[0].textContent === lbl) return c.children[1].textContent; return '?'; };
    ok(val('Played') === '28' && val('Completed') === '28' && val('Perfect Games') === '28' && val('Total Errors') === '0' && val('Total Hints') === '0',
      'stats after 28 clean wins', ['Played=' + val('Played'), 'Completed=' + val('Completed'), 'Perfect=' + val('Perfect Games')].join(' '));
    g.call('Game.closeOverlay("statsOverlay")');

    // pause overlay opens/stops timer and resume works (game screen)
    g.call('Game.startLevel(0, false)');
    g.call('Game.showPause()');
    ok(g.els['pauseOverlay'].classList.contains('active') && S().timerInterval === null, 'pause stops timer');
    g.call('Game.resume()');
    ok(!g.els['pauseOverlay'].classList.contains('active') && S().timerInterval !== null, 'resume restarts timer');
  } catch (e) { fails.push('screens fatal: ' + e.message); console.error(e.stack); }

  // final persistence shape
  const finalSave = JSON.parse(g.call('localStorage.getItem("str8ts_save")'));
  ok(Object.keys(finalSave.completed).length === 28 && finalSave.stats.perfectGames === 28, 'final save: 28 completions');
} catch (e) {
  verdict = 'FAIL';
  fails.push('fatal: ' + e.message);
  console.error(e.stack);
}

if (fails.length) verdict = 'FAIL';
console.log(JSON.stringify({
  pass, fail: fails.length, total: pass + fails.length, verdict, fails,
  extra: {
    game: 'str8ts', engine: 27, input: 'real (canvas+numpad clicks, keyboard, level buttons)',
    dataAudit: 'all 27 sols complete; str8ts rules (straights consecutive, no row/col repeats) verified offline for every level',
    engineBugsFixed: [
      'P2: trailing window-alias block referenced IIFE-scoped names (showLevelSelect etc.) — ReferenceError on every production load since gz-analytics.js always defines window.gzAnalytics; aliases now bound via the public Game API (was also fatal for harness boot)',
    ],
  },
}));
process.exit(verdict === 'PASS' ? 0 : 1);
