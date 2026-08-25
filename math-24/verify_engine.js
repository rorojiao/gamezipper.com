#!/usr/bin/env node
/* math-24 end-to-end verifier (QA round 2026-08-25).
 * Real input paths only: every card/op/=/bottom-bar interaction is a real canvas
 * pointerdown at engine-exact coordinates (rect/scale math replicated from
 * handlePointerDown); modal navigation via real button .click()s; state read back
 * through a read-only __M24 export injected after `let intervals=[];`.
 * Regression coverage for the 6 engine fixes of this round:
 *   P1 getExprResult parsed A/J/Q/K as undefined identifiers (face-card deals unsolvable)
 *   P1 checkAnswer accepted wins without all four cards (8×3= instant win)
 *   P1 classic/daily timer never ticked (always 3 stars, full bonus, 0.0s avg) + the
 *      visibilitychange pause was never resumed (soft-lock after tab switch)
 *   P1 ops panel: '=' was drawn over '(' — parens unusable, '=' top half appended '('
 *   P2 hint burned charges writing nothing for ×/÷-first solutions, appended raw digits
 *   P2 dailyStreak incremented on every daily start; unsolvable daily launched stale board
 * Output: last stdout line is compact JSON {"pass":N,"fail":M,...}; exit 0 iff PASS. */
'use strict';
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'math-24';
let pass = 0, fail = 0; const fails = [];
function T(name, ok, note) {
  if (ok) { pass++; } else { fail++; fails.push(name + (note ? ' | ' + note : '')); }
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : (note ? '  << ' + note : '')));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* engine-exact replicas */
const cardDisp = (v) => v === 1 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v);
function expectedHint(sol) { /* mirrors post-fix useHint */
  const parts = sol.match(/\d+|[+\-*/]/g) || [];
  let hn = null, ho = null;
  for (let i = 0; i < parts.length; i++) {
    if (/\d/.test(parts[i]) && hn === null) {
      hn = cardDisp(+parts[i]);
      if (i + 1 < parts.length && '+-*/'.includes(parts[i + 1])) ho = parts[i + 1] === '*' ? '×' : '÷';
    }
    if (hn && ho) break;
  }
  return hn && ho ? hn + ho : null;
}
function expectedDaily(api) { /* mirrors post-fix startMode('daily') seed walk (sandbox clock = epoch) */
  const today = new Date(0).toDateString();
  let seed = 0; for (const ch of today) seed += ch.charCodeAt(0);
  for (let t = 0; t < 40; t++) {
    const nums = [((seed * 7) % 13) + 1, ((seed * 11) % 13) + 1, ((seed * 13) % 13) + 1, ((seed * 17) % 13) + 1];
    if (api.call('__M24.sv(' + JSON.stringify(nums) + ')')) return nums;
    seed++;
  }
  return null;
}
function subsetPair(nums) { /* two cards that already evaluate to 24 — must NOT win */
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if (i === j) continue;
    const a = nums[i], b = nums[j];
    if (a * b === 24) return { i, j, op: 2 };
    if (a + b === 24) return { i, j, op: 0 };
    if (a - b === 24) return { i, j, op: 1 };
    if (b !== 0 && a / b === 24) return { i, j, op: 3 };
  }
  return null;
}
function buildWrongFour(nums) { /* uses all 4 cards, evaluates ≠ 24 — must NOT win */
  const tries = ['a+b+c+d', 'a*b-c-d', 'a*b+c-d', 'a+b*c-d', 'a*b+c*d', 'a*b*c-d', 'a*b*c+d', 'a*b-c+d'];
  for (const t of tries) {
    const e = t.replace(/[abcd]/g, (m) => String({ a: nums[0], b: nums[1], c: nums[2], d: nums[3] }[m]));
    if (Math.abs(Function('return(' + e + ')')() - 24) > 1e-9) return t;
  }
  return null;
}

const EXPORTS = 'globalThis.__M24={get gs(){return gameState},get expr(){return gameState.expression},get mode(){return gameState.mode},get cards(){return gameState.cards},get used(){return gameState.used},get hints(){return gameState.hints},get score(){return gameState.score},get streak(){return gameState.streak},get time(){return gameState.time},get paused(){return gameState.paused},get shake(){return gameState.shakeTime},get ti(){return gameState.timerInterval},get solved(){return gameState.totalSolved},get speedSolved(){return gameState.speedSolved},get best(){return gameState.bestStreak},get pc(){return gameState.puzzlesCompleted},get ds(){return gameState.dailyStreak},get stars(){return gameState.totalStars},get high(){return gameState.highScore},get sol(){return gameState.puzzle&&gameState.puzzle.solution},get W(){return W},get H(){return H},get s(){return scale},get sfx(){return sfxEnabled},get bgm(){return bgmEnabled},sv:solve24,gp:genPuzzle};';
const g = bootGame(SLUG, { inject: { anchor: 'let intervals=[];', exports: EXPORTS } });
const els = g.els;

/* geometry + real-input helpers (engine-exact handlePointerDown math; rect.left/top=0, rect.width=W) */
const geoOf = (api) => ({ W: api.call('__M24.W'), H: api.call('__M24.H'), s: api.call('__M24.s') });
const tapOf = (api) => (x, y) => api.els.gameCanvas.dispatch('pointerdown', { clientX: x, clientY: y });
function cardXY(api, i) { const { W, s } = geoOf(api); const cw = 90 * s, gap = 16 * s, tot = 4 * cw + 3 * gap; return [(W - tot) / 2 + i * (cw + gap) + cw / 2, 130 * s + 60 * s]; }
function opXY(api, k) { const { W, H, s } = geoOf(api); const bw = 52 * s, g2 = 8 * s, tot = 7 * bw + 6 * g2; return [(W - tot) / 2 + k * (bw + g2) + bw / 2, H - 155 * s + 26 * s]; }
function eqXY(api) { const { W, H, s } = geoOf(api); const bw = 52 * s, bh = 52 * s, g2 = 8 * s, tot = 7 * bw + 6 * g2; return [(W - tot) / 2 + 6 * (bw + g2) + bw / 2, H - 155 * s + bh + g2 / 2]; }
function bottomXY(api, i) { const { W, H, s } = geoOf(api); const bw = 70 * s, bh = 38 * s, bg = 10 * s, tot = 4 * bw + 3 * bg; return [(W - tot) / 2 + i * (bw + bg) + bw / 2, H - 58 * s + bh / 2]; }
const OPCELL = { '+': 0, '-': 1, '*': 2, '/': 3, '(': 4, ')': 5 };
const tap = tapOf(g);
const tapCard = (i) => { const [x, y] = cardXY(g, i); tap(x, y); };
const tapOp = (k) => { const [x, y] = opXY(g, k); tap(x, y); };
const tapEq = () => { const [x, y] = eqXY(g); tap(x, y); };
const tapBottom = (i) => { const [x, y] = bottomXY(g, i); tap(x, y); };
const cardsArr = () => JSON.parse(g.call('JSON.stringify(__M24.cards)'));
const expr = () => g.call('__M24.expr');
const active = (id) => els[id].classList.contains('active');
/* static-markup buttons live past nested divs, beyond the els-registry parse — walk the
 * body subtree inside the sandbox and click the real parsed node (compiled onclick) */
function clickInModal(api, modalId, needle) {
  const sb = "(function(){function findId(n,id){for(var i=0;i<(n.children||[]).length;i++){var c=n.children[i];if(c.id===id)return c;var r=findId(c,id);if(r)return r;}return null;}" +
    "function collect(n,out){(n.children||[]).forEach(function(c){out.push(c);collect(c,out);});}" +
    "var m=findId(document.body," + JSON.stringify(modalId) + ");if(!m)return 'NOMODAL';" +
    "var all=[];collect(m,all);" +
    "for(var i=0;i<all.length;i++){var h=all[i].onclick;if(typeof h==='function'&&String(h).indexOf(" + JSON.stringify(needle) + ")>=0){all[i].click();return 'ok';}}return 'NOBTN';})()";
  return api.call(sb);
}
function solveByTaps(api, sol) { /* clear, then tap cards/ops/parens in solution order, then '=' */
  const cards = JSON.parse(api.call('JSON.stringify(__M24.cards)'));
  const usedTap = [false, false, false, false];
  const t2 = tapOf(api);
  { const [cx, cy] = bottomXY(api, 1); t2(cx, cy); } /* Clear — leftover used[] flags would no-op the card taps */
  for (const tok of sol.match(/\d+|[+\-*/()]/g)) {
    if (/\d/.test(tok)) {
      const i = cards.findIndex((v, idx) => !usedTap[idx] && v === +tok);
      if (i < 0) return 'no unused card for ' + tok;
      usedTap[i] = true;
      const [x, y] = cardXY(api, i); t2(x, y);
    } else {
      const k = OPCELL[tok]; if (k === undefined) return 'no cell for ' + tok;
      const [x, y] = opXY(api, k); t2(x, y);
    }
  }
  const [ex, ey] = eqXY(api); t2(ex, ey);
  return null;
}

(async () => {
  /* ---------- offline: engine solver + generator sanity (functions exported verbatim) ---------- */
  {
    const known = { '3,3,8,8': true, '1,1,1,8': true, '5,5,5,1': true, '4,2,1,12': true, '1,1,1,1': false, '1,1,1,3': false };
    let ok = true, note = '';
    for (const quad of Object.keys(known)) {
      const nums = quad.split(',').map(Number);
      const sol = g.call('__M24.sv(' + JSON.stringify(nums) + ')');
      if (known[quad] && typeof sol !== 'string') { ok = false; note += quad + ' expected solvable got ' + sol + '; '; continue; }
      if (!known[quad] && sol !== null) { ok = false; note += quad + ' expected null got ' + sol + '; '; continue; }
      if (typeof sol === 'string') {
        if (!/^[\d+\-*/()]+$/.test(sol)) { ok = false; note += quad + ' sol has odd chars ' + sol + '; '; continue; }
        const v = Function('return(' + sol + ')')();
        if (Math.abs(v - 24) > 1e-9) { ok = false; note += quad + ' sol evaluates ' + v + '; '; }
      }
    }
    T('off-solve24-battery', ok, note);
  }
  {
    let ok = true, note = '';
    for (let i = 0; i < 10; i++) {
      const p = JSON.parse(g.call('JSON.stringify(__M24.gp("easy"))'));
      if (!p || !p.solution || p.nums.some((v) => v < 1 || v > 9)) { ok = false; note += 'easy#' + i + ' bad ' + JSON.stringify(p).slice(0, 60) + '; '; }
    }
    T('off-genpuzzle-easy-1-9-solvable', ok, note);
  }
  {
    let ok = true, note = '';
    for (let i = 0; i < 10; i++) {
      const p = JSON.parse(g.call('JSON.stringify(__M24.gp("hard"))'));
      if (!p || !p.solution || p.nums.some((v) => v < 1 || v > 13)) { ok = false; note += 'hard#' + i + ' bad ' + JSON.stringify(p).slice(0, 60) + '; '; }
    }
    T('off-genpuzzle-hard-1-13-solvable', ok, note);
  }

  /* ---------- boot A: fresh player full journey ---------- */
  T('a-boot-clean', g.loadErrors.length === 0, g.loadErrors.join(' | ').slice(0, 300));
  T('a-firstvisit-tutorial', active('tutorialOverlay'), 'overlay active=' + active('tutorialOverlay'));

  T('a-tutorial-start-menu', clickInModal(g, 'tutorialOverlay', 'closeTutorial()') === 'ok' && active('menuModal') && g.call('__M24.paused') === true && !active('tutorialOverlay'));

  T('a-menu-stats-open', clickInModal(g, 'menuModal', 'showStats()') === 'ok');
  T('a-stats-zeros', active('statsModal') && String(els.statSolved.textContent) === '0' && String(els.statHigh.textContent) === '0');
  T('a-stats-close-menu', clickInModal(g, 'statsModal', 'hideStats()') === 'ok' && active('menuModal') && !active('statsModal'));

  clickInModal(g, 'settingsModal', "toggleSetting('sfx')");
  let sv1 = JSON.parse(g.ls.getItem('math24_v4') || '{}');
  T('a-settings-sfx-off', g.call('__M24.sfx') === false && sv1.settings && sv1.settings.sfx === false && !els.sfxToggle.classList.contains('on'));
  clickInModal(g, 'settingsModal', "toggleSetting('bgm')");
  sv1 = JSON.parse(g.ls.getItem('math24_v4') || '{}');
  T('a-settings-bgm-off', g.call('__M24.bgm') === false && sv1.settings.bgm === false);
  clickInModal(g, 'settingsModal', "toggleSetting('sfx')"); clickInModal(g, 'settingsModal', "toggleSetting('bgm')");
  sv1 = JSON.parse(g.ls.getItem('math24_v4') || '{}');
  T('a-settings-restore', g.call('__M24.sfx') === true && g.call('__M24.bgm') === true && sv1.settings.sfx === true && els.sfxToggle.classList.contains('on'));

  T('a-menu-classic-open', clickInModal(g, 'menuModal', "startMode('classic')") === 'ok');
  let nums = cardsArr();
  T('a-classic-start', g.call('__M24.mode') === 'classic' && nums.length === 4 && expr() === '' && g.call('__M24.hints') === 3 && g.call('__M24.time') === 0 && g.call('__M24.paused') === false && !active('menuModal'));

  {
    const geo = geoOf(g);
    T('a-geometry', geo.W === 480 && geo.H === 640 && Math.abs(geo.s - 0.6) < 1e-9, JSON.stringify(geo));
  }
  { /* every op cell incl. both parens has its own hit-testable cell (P1 layout regression) */
    ['+', '-', '×', '÷', '(', ')'].forEach((_, k) => tapOp(k));
    T('a-ops-cells-parens-alive', expr() === '+-×÷()', 'expr=' + JSON.stringify(expr()));
  }
  g.pump(3); /* the sandbox clock is epoch-based and 0 until pumped: shakeTime stamps Date.now() */
  tapEq(); /* unparseable expression -> wrong-answer path, never a modal */
  T('a-eq-invalid-no-modal', !active('resultModal') && g.call('__M24.shake') > 0, 'shake=' + g.call('__M24.shake'));
  g.pump(30); /* the 400ms wrong-answer input cooldown runs on sandbox time, not wall-clock */
  tapBottom(1); /* Clear */
  T('a-clear-works', expr() === '' && Array.from(g.call('__M24.used')).every((x) => x === false), 'expr=' + JSON.stringify(expr()));

  nums = cardsArr();
  const pair = subsetPair(nums);
  let subsetNote = 'no 24-pair in deal (fallback: 1-card tap)';
  if (pair) {
    tapCard(pair.i); tapOp(pair.op); tapCard(pair.j); tapEq();
    subsetNote = 'pair ' + nums[pair.i] + ',' + nums[pair.j];
  } else {
    tapCard(0); tapEq();
  }
  T('a-subset-no-cheat', !active('resultModal') && g.call('__M24.score') === 0 && g.call('__M24.solved') === 0, subsetNote);
  g.pump(30); /* clear the 400ms wrong-answer cooldown before the next build */
  tapBottom(1); /* clear */
  const wrong = buildWrongFour(nums);
  let wrongNote = 'builder null';
  if (wrong) {
    for (const ch of wrong) {
      if (/[abcd]/.test(ch)) tapCard('abcd'.indexOf(ch));
      else if (ch === '+') tapOp(0); else if (ch === '-') tapOp(1); else if (ch === '*') tapOp(2);
    }
    tapEq();
    wrongNote = wrong + ' -> ' + JSON.stringify(expr());
  }
  T('a-full-wrong-no-cheat', !active('resultModal') && g.call('__M24.score') === 0 && g.call('__M24.solved') === 0 && g.call('__M24.shake') > 0, wrongNote);
  g.pump(30); /* engine blocks input for 400ms (sandbox time) after a wrong answer */
  tapBottom(1); /* Clear the wrong expression so used[] flags free the cards */
  T('a-clear-before-solve', expr() === '');

  /* classic/daily timer regression (P1: was frozen at 0 forever) */
  g.pump(130);
  T('a-timer-ticks-classic', g.call('__M24.time') >= 2, 'time=' + g.call('__M24.time'));

  /* real-tap solve: face/ace glyphs must now evaluate (P1 getExprResult regression) */
  const sol1 = g.call('__M24.sol');
  const solveErr = solveByTaps(g, sol1);
  T('a-solve-classic-win', !solveErr && active('resultModal') && g.call('__M24.score') > 0 && g.call('__M24.solved') === 1 && g.call('__M24.streak') === 1, solveErr || ('score=' + g.call('__M24.score')));
  T('a-result-modal-content', String(els.resultTitle.textContent) === 'Puzzle Solved!' && String(els.resultStars.textContent) === '★★★' && /^\+\d+ points$/.test(String(els.resultScore.textContent)) && String(els.nextBtn.textContent) === 'Next Puzzle', 'stars=' + String(els.resultStars.textContent) + ' score=' + String(els.resultScore.textContent));
  {
    const sv = JSON.parse(g.ls.getItem('math24_v4') || '{}');
    T('a-save-after-win', sv.totalSolved === 1 && sv.firstVisit === false && sv.bestStreak === 1 && sv.highScore >= 250 && sv.starsEarned.length === 1, JSON.stringify(sv).slice(0, 160));
  }

  T('a-next-btn-click', clickInModal(g, 'resultModal', 'nextPuzzle()') === 'ok');
  T('a-next-puzzle', g.call('__M24.pc') === 1 && expr() === '' && g.call('__M24.hints') === 3 && g.call('__M24.time') === 0 && !active('resultModal'), 'pc=' + g.call('__M24.pc') + ' time=' + g.call('__M24.time'));

  const sol2 = g.call('__M24.sol');
  const wantHint = expectedHint(sol2);
  tapBottom(0); /* Hint */
  T('a-hint-writes-display-glyph', g.call('__M24.hints') === 2 && wantHint !== null && expr() === wantHint, 'expr=' + JSON.stringify(expr()) + ' want=' + JSON.stringify(wantHint) + ' sol=' + sol2);
  tapBottom(0); tapBottom(0);
  let hintNote = 'hints=' + g.call('__M24.hints');
  tapBottom(0);
  T('a-hint-exhaust-guard', g.call('__M24.hints') === 0, hintNote + '->' + g.call('__M24.hints'));
  tapBottom(1);
  T('a-clear-after-hints', expr() === '');

  const scoreBeforeSkip = g.call('__M24.score');
  const pcBeforeSkip = g.call('__M24.pc');
  tapBottom(2); /* Skip */
  T('a-skip-penalty', g.call('__M24.score') === scoreBeforeSkip - 50 && g.call('__M24.pc') === pcBeforeSkip + 1 && expr() === '' && g.call('__M24.time') === 0, 'score ' + scoreBeforeSkip + '->' + g.call('__M24.score'));

  tapBottom(3); /* Menu */
  const tAtMenu = g.call('__M24.time');
  g.pump(120);
  T('a-menu-freeze', active('menuModal') && g.call('__M24.paused') === true && g.call('__M24.time') === tAtMenu, 'time ' + tAtMenu + '->' + g.call('__M24.time'));

  T('a-classic-restart-open', clickInModal(g, 'menuModal', "startMode('classic')") === 'ok');
  T('a-classic-restart', g.call('__M24.mode') === 'classic' && g.call('__M24.paused') === false && g.call('__M24.time') === 0);

  /* visibility soft-lock regression (P1: paused forever after tab switch) */
  g.call("document.hidden=true;document.dispatch('visibilitychange')");
  const tHidden = g.call('__M24.time');
  g.pump(60);
  const hidOk = g.call('__M24.paused') === true && g.call('__M24.ti') === null && g.call('__M24.time') === tHidden;
  g.call("document.hidden=false;document.dispatch('visibilitychange')");
  g.pump(130);
  T('a-visibility-resume', hidOk && g.call('__M24.paused') === false && g.call('__M24.ti') !== null && g.call('__M24.time') >= 2, 'hidden(paused=' + hidOk + ') shown(time=' + g.call('__M24.time') + ')');

  /* ---------- speed mode: face-card deal solve + 60s game over ---------- */
  tapBottom(3); /* Menu */
  clickInModal(g, 'menuModal', "startMode('speed')"); /* Speed Challenge (medium 1-13) */
  T('a-speed-start', g.call('__M24.mode') === 'speed' && g.call('__M24.score') === 0 && g.call('__M24.streak') === 0 && g.call('__M24.time') === 0);
  let faceDeal = null, skips = 0;
  for (let tries = 0; tries < 6; tries++) {
    const n = cardsArr();
    if (n.some((v) => v === 1 || v >= 11)) { faceDeal = n; break; }
    tapBottom(2); skips++; /* Skip */
  }
  T('a-speed-facecard-deal', faceDeal !== null, 'skips=' + skips + ' deal=' + JSON.stringify(cardsArr()));
  const solS = g.call('__M24.sol');
  const sErr = solveByTaps(g, solS);
  T('a-speed-facecard-solve-win', !sErr && active('resultModal') && g.call('__M24.speedSolved') === 1 && g.call('__M24.score') > 0, sErr || ('sol=' + solS + ' deal=' + JSON.stringify(faceDeal)));
  clickInModal(g, 'resultModal', 'nextPuzzle()');
  let over = false;
  for (let i = 0; i < 70 && !over; i++) { g.pump(60); over = active('gameOverModal'); }
  T('a-speed-gameover-60s', over && String(els.goSolved.textContent) === '1' && /^Score: \d+$/.test(String(els.gameOverScore.textContent)), 'goSolved=' + String(els.goSolved.textContent) + ' score=' + String(els.gameOverScore.textContent) + ' time=' + g.call('__M24.time'));

  clickInModal(g, 'gameOverModal', "startMode('speed')"); /* Play Again */
  T('a-speed-play-again', g.call('__M24.mode') === 'speed' && g.call('__M24.score') === 0 && g.call('__M24.time') === 0 && g.call('__M24.speedSolved') === 0 && !active('gameOverModal'));
  tapBottom(3); /* Menu */
  T('a-speed-menu-exit', active('menuModal'));

  /* ---------- daily: deterministic epoch deal, same-day streak guard ---------- */
  clickInModal(g, 'menuModal', "startMode('daily')"); /* Daily Challenge */
  const wantDaily = expectedDaily(g);
  T('a-daily-start-deal', g.call('__M24.mode') === 'daily' && g.call('__M24.ds') === 1 && JSON.stringify(cardsArr()) === JSON.stringify(wantDaily), 'deal=' + JSON.stringify(cardsArr()) + ' want=' + JSON.stringify(wantDaily));
  const solD = g.call('__M24.sol');
  const dErr = solveByTaps(g, solD);
  T('a-daily-solve-win', !dErr && active('resultModal') && String(els.nextBtn.textContent) === 'Back to Menu' && g.call('__M24.best') === 1, dErr || ('sol=' + solD + ' best=' + g.call('__M24.best'))); /* best=1: Play Again legitimately reset streak to 0 before the daily win */
  clickInModal(g, 'resultModal', 'nextPuzzle()');
  T('a-daily-next-back-to-menu', active('menuModal'));
  clickInModal(g, 'menuModal', "startMode('daily')"); /* Daily again, same day */
  const dsAgain = g.call('__M24.ds');
  tapBottom(3); /* Menu */
  T('a-daily-restreak-guard', dsAgain === 1, 'dailyStreak=' + dsAgain);

  {
    const sv = JSON.parse(g.ls.getItem('math24_v4') || '{}');
    T('a-save-shape', sv.totalSolved === 3 && sv.bestStreak === 1 && sv.dailyStreak === 1 && sv.totalStars === 9 && sv.starsEarned.length === 3 && sv.highScore >= 290 && sv.puzzlesCompleted >= 3 && sv.settings.sfx === true && sv.firstVisit === false && sv.lastDaily === new Date(0).toDateString(), JSON.stringify(sv).slice(0, 220));
    clickInModal(g, 'menuModal', 'showStats()');
    T('a-stats-populated', active('statsModal') && String(els.statSolved.textContent) === '3' && String(els.statBest.textContent) === '1' && String(els.statDaily.textContent) === '1' && String(els.statStars.textContent) === '9' && Number(els.statHigh.textContent) >= 290 && /^\d+\.\ds$/.test(String(els.statAvg.textContent)), 'solved=' + String(els.statSolved.textContent) + ' avg=' + String(els.statAvg.textContent));
    clickInModal(g, 'statsModal', 'hideStats()');
  }

  /* ---------- boot B: seeded returning player (muted, tutorial seen) ---------- */
  const seedB = { totalSolved: 7, totalTime: 120, totalAttempts: 9, bestStreak: 4, dailyStreak: 2, lastDaily: 'Wed Dec 31 1969', puzzlesCompleted: 12, totalStars: 21, highScore: 1500, starsEarned: [3, 3, 3, 2], settings: { sfx: false, bgm: false }, firstVisit: false };
  const gb = bootGame(SLUG, { seedLS: { math24_v4: JSON.stringify(seedB) }, inject: { anchor: 'let intervals=[];', exports: EXPORTS } });
  T('b-boot-straight-menu', gb.loadErrors.length === 0 && !gb.els.tutorialOverlay.classList.contains('active') && gb.els.menuModal.classList.contains('active'));
  T('b-muted-loaded', gb.call('__M24.sfx') === false && gb.call('__M24.bgm') === false && !gb.els.sfxToggle.classList.contains('on'));
  clickInModal(gb, 'menuModal', "startMode('classic')"); /* Classic */
  const bCards = JSON.parse(gb.call('JSON.stringify(__M24.cards)'));
  const [bx, by] = cardXY(gb, 0);
  gb.els.gameCanvas.dispatch('pointerdown', { clientX: bx, clientY: by });
  T('b-classic-play-muted', gb.call('__M24.mode') === 'classic' && bCards.length === 4 && gb.call('__M24.expr') === cardDisp(bCards[0]), 'expr=' + JSON.stringify(gb.call('__M24.expr')));
  clickInModal(gb, 'settingsModal', "toggleSetting('bgm')");
  const svb = JSON.parse(gb.ls.getItem('math24_v4') || '{}');
  T('b-bgm-toggle-on', gb.call('__M24.bgm') === true && svb.settings.bgm === true && gb.els.bgmToggle.classList.contains('on'));

  console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail ? 'FAIL' : 'PASS', fails, extra: { boots: 2, fixes: 6, tapsReal: true, skips } }));
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('VERIFIER CRASH', e);
  console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: 'FAIL', fails: fails.concat('crash: ' + (e && e.message)), extra: {} }));
  process.exit(1);
});
