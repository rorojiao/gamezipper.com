#!/usr/bin/env node
/* zen-garden verify_engine.js — Binairo/Takuzu engine + data + full driven E2E.
 * Offline: 30-level data oracle (clues⊆solution, valid+UNIQUE solutions), findViolations/
 * isComplete/countSolutions unit oracles, mulberry32 + daily-generator parity for TODAY.
 * Driven: splash→howto→select→game cycle/lock/violation/mistake/undo/reset(2-tap)/hint/
 * check/ctrl-Z/touchend/detail-guard, 3★/2★/1★(hints)/1★(mistakes≥3) star matrix via real
 * taps, level-30 Next→menu, seeded-save menu reflection, daily (generation parity + solve +
 * replay), corrupt/version saves, beforeunload cleanup, armed-flag leak regression (P3 fix).
 * Last stdout line: compact JSON {"pass":N,"fail":M,"total":T,"verdict":...}. exit 0 iff PASS. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..');
const { bootGame } = require(path.join(REPO, '_optimization/scripts/harness-lib.js'));

let pass = 0, fail = 0; const fails = [];
function ok(cond, name, got) {
  if (cond) { pass++; } else { fail++; fails.push(name + (got !== undefined ? ' :: ' + String(got).slice(0, 160) : '')); }
}
const J = JSON.stringify;
process.on('uncaughtException', (e) => { console.error('CRASH: ' + e.message); console.log(J({ pass, fail, verdict: 'CRASH', fails: fails.concat([e.stack.split('\n').slice(0, 3).join(' | ')]) })); process.exit(2); });

/* ---------- offline engine extraction ---------- */
const html = fs.readFileSync(path.join(REPO, 'zen-garden/index.html'), 'utf8');
const src =
  html.slice(html.indexOf('const LEVELS = ['), html.indexOf('function mulberry32')) +
  html.slice(html.indexOf('function parseLevel'), html.indexOf('function genDailyLevel')) +
  html.slice(html.indexOf('function genDailyLevel'), html.indexOf('const G={')) +
  html.slice(html.indexOf('function findViolations'), html.indexOf('function renderBoard')) +
  html.slice(html.indexOf('function mulberry32'), html.indexOf('function parseLevel'));
const ENG = new Function(src + ';return {LEVELS,parseLevel,countSolutions,findViolations,isComplete,genDailyLevel,mulberry32};')();

/* ---------- offline battery ---------- */
const TIER_RANGES = [[1, 8], [9, 18], [19, 26], [27, 30]];
const PARSED = ENG.LEVELS.map(ENG.parseLevel);
const clueCount = (P) => P.clues.flat().filter(v => v !== null).length;

// 1. 30-level data oracle: tier sizes, clues match solution, valid solution, UNIQUE solution
ok(PARSED.length === 30, 'lvl-count', PARSED.length);
PARSED.forEach((P, i) => {
  const L = ENG.LEVELS[i];
  const tier = TIER_RANGES.find(([a, b]) => L.id >= a && L.id <= b);
  const wantN = [6, 8, 10, 10][TIER_RANGES.indexOf(tier)];
  ok(L.n === wantN && P.n === L.n, 'L' + L.id + '-size', L.n);
  ok(L.p.length === L.n * L.n && L.s.length === L.n * L.n, 'L' + L.id + '-strlen', L.p.length + '/' + L.s.length);
  let mism = 0;
  for (let r = 0; r < P.n; r++) for (let c = 0; c < P.n; c++) if (P.clues[r][c] !== null && P.clues[r][c] !== P.solution[r][c]) mism++;
  ok(mism === 0, 'L' + L.id + '-clues-match-sol', mism);
  ok(ENG.isComplete(P.solution, P.n), 'L' + L.id + '-sol-valid');
  const ns = ENG.countSolutions(P.clues, P.n, 2);
  ok(ns === 1, 'L' + L.id + '-unique-solution', ns);
});

// 2. findViolations unit oracle (6x6)
{
  const mk = (rows) => rows.map(r => r.split('').map(ch => ch === '.' ? null : +ch));
  const fv = (g) => ENG.findViolations(g, g.length);
  // row triple
  let g = mk(['111...', '......', '......', '......', '......', '......']);
  let bad = fv(g);
  ok(bad.has('0,0') && bad.has('0,1') && bad.has('0,2') && bad.size === 3, 'fv-row-triple', J([...bad]));
  // column triple
  g = mk(['1.....', '1.....', '1.....', '......', '......', '......']);
  bad = fv(g);
  ok(bad.has('0,0') && bad.has('2,0') && bad.size === 3, 'fv-col-triple', J([...bad]));
  // full unbalanced row flags whole row; partial (with nulls) does not
  g = mk(['110100', '......', '......', '......', '......', '......']);
  ok(fv(g).size === 0, 'fv-balanced-full-row-clean');
  g = mk(['110000', '......', '......', '......', '......', '......']);
  bad = fv(g);
  let all6 = true; for (let c = 0; c < 6; c++) if (!bad.has('0,' + c)) all6 = false;
  ok(all6 && bad.size === 6, 'fv-unbalanced-full-row', J([...bad]));
  g = mk(['110...', '......', '......', '......', '......', '......']);
  ok(fv(g).size === 0, 'fv-partial-row-no-balance-flag');
  // duplicate full rows -> both flagged
  g = mk(['110000', '110000', '......', '......', '......', '......']);
  bad = fv(g);
  ok(bad.has('0,0') && bad.has('1,5') && bad.size === 12, 'fv-dup-rows', bad.size);
  // duplicate full cols -> both flagged
  g = mk(['11....', '11....', '00....', '00....', '00....', '00....']);
  // rows: r0 '11....' partial, r2..r5 '00....' partial -> no dup; col0 '110000' full balanced, col1 same -> dup cols
  bad = fv(g);
  ok(bad.has('0,0') && bad.has('5,1') && bad.size === 12, 'fv-dup-cols', bad.size);
  // valid solution grid -> zero violations
  ok(fv(PARSED[0].solution).size === 0, 'fv-clean-solution');
}
// 3. isComplete oracle
ok(ENG.isComplete(PARSED[0].solution, 6), 'ic-full-valid');
ok(!ENG.isComplete(PARSED[0].clues, 6), 'ic-partial-false');
{
  const g = PARSED[0].solution.map(r => r.slice());
  g[1] = g[0].slice(); // duplicate row -> invalid
  ok(!ENG.isComplete(g, 6), 'ic-full-dup-row-false');
}
// 4. mulberry32 determinism + countSolutions cap on empty grid (many solutions -> capped at 2)
{
  const a = ENG.mulberry32(42), b = ENG.mulberry32(42);
  let same = true; for (let i = 0; i < 50; i++) if (a() !== b()) same = false;
  ok(same, 'mulberry32-deterministic');
  const empty6 = Array.from({ length: 6 }, () => Array(6).fill(null));
  ok(ENG.countSolutions(empty6, 6, 2) === 2, 'countSolutions-cap-2');
}
// 5. TODAY's daily: same algorithm as engine (seed = YYYYMMDD, sizes[seed%4], ≤40 retries)
const TODAY = new Date().toISOString().slice(0, 10);
const baseSeed = parseInt(TODAY.replace(/-/g, ''));
const sizes = [6, 8, 8, 10];
const dailyN = sizes[baseSeed % sizes.length];
let dailyLvl = null, dailyOff = -1;
for (let offset = 0; offset < 40 && !dailyLvl; offset++) { dailyLvl = ENG.genDailyLevel(baseSeed + offset * 7919, dailyN); if (dailyLvl) dailyOff = offset; }
ok(!!dailyLvl, 'daily-gen-today', TODAY + ' off=' + dailyOff);
if (dailyLvl) {
  let dm = 0;
  for (let r = 0; r < dailyN; r++) for (let c = 0; c < dailyN; c++) if (dailyLvl.p[r][c] !== null && dailyLvl.p[r][c] !== dailyLvl.s[r][c]) dm++;
  ok(dm === 0, 'daily-clues-match-sol', dm);
  ok(ENG.isComplete(dailyLvl.s, dailyN), 'daily-sol-valid');
  ok(ENG.countSolutions(dailyLvl.p, dailyN, 2) === 1, 'daily-unique');
}

/* helper: find an unlocked cell where placing v creates a violation at that cell (triple) */
function findMistakeCell(P) {
  for (let r = 0; r < P.n; r++) for (let c = 0; c < P.n; c++) {
    if (P.clues[r][c] !== null) continue;
    for (const v of [1, 0]) {
      const g = P.clues.map(row => row.slice()); g[r][c] = v;
      if (ENG.findViolations(g, P.n).has(r + ',' + c)) return { r, c, v };
    }
  }
  return null;
}
const MC1 = findMistakeCell(PARSED[0]), MC2 = findMistakeCell(PARSED[1]), MC4 = findMistakeCell(PARSED[3]);
ok(!!MC1, 'mc1-found'); ok(!!MC2, 'mc2-found'); ok(!!MC4, 'mc4-found');

function neutralCell(P, avoid) {
  for (let r = 0; r < P.n; r++) for (let c = 0; c < P.n; c++) {
    if (P.clues[r][c] !== null) continue;
    if (avoid && r === avoid.r && c === avoid.c) continue;
    if (avoid && (r === avoid.r || c === avoid.c)) continue; // no shared line with the triple span
    return { r, c, sol: P.solution[r][c] };
  }
  return null;
}

/* first hint target on fresh level = first row-major unlocked cell (grid=null != sol val) */
function firstHintCell(P) {
  for (let r = 0; r < P.n; r++) for (let c = 0; c < P.n; c++) if (P.clues[r][c] === null) return [r, c];
  return null;
}

/* solve current level from clues via real taps (1 tap -> black(1), 2 taps -> white(0)) */
function solveByTaps(readGrid, tapCell) {
  /* engine cycle is null->1(black)->0(white)->null: reaching white passes THROUGH a
     transient black stone; transients are never counted as mistakes since the P2
     pendingMistake fix, but keep the safe order anyway: whites first, blacks last.
     Cells already holding their solution value (hints) are skipped via a live grid read. */
  for (let pass = 0; pass < 2; pass++) for (let r = 0; r < curP.n; r++) for (let c = 0; c < curP.n; c++) {
    const want = curP.solution[r][c];
    if ((pass === 0) !== (want === 0)) continue;
    const cur = readGrid()[r][c];
    let k;
    if (want === 0) k = cur === null ? 2 : cur === 1 ? 1 : 0;
    else k = cur === null ? 1 : cur === 0 ? 2 : 0;
    if (k) tapCell(r, c, k);
  }
}
let curP = null; // set before each solve

/* ---------- driven battery ---------- */
const KEY = 'zen_garden_save_v1';
const A = bootGame('zen-garden', {});
const ga = A, els = A.els;
const vis = (n) => !els[n].classList.contains('hidden');
const st = (e) => ga.call(e);
const txt = (n) => els[n].textContent;
const save = () => JSON.parse(st('localStorage.getItem("' + KEY + '")') || 'null');
const tierCard = (t, i) => els['tier' + t].children[i];
const starEmpties = (card) => card.children[1].querySelectorAll('.empty').length;
const inGame = () => vis('game');
let n = 0; // current board size
const cellEl = (r, c) => els.board.children[r * n + c];
const tap = (r, c, ev) => cellEl(r, c).dispatch('click', ev || {});
const taps = (r, c, k, ev) => { for (let i = 0; i < k; i++) tap(r, c, ev); };
const click = (id) => els[id].dispatch('click');
const toastTxt = () => els.toast.textContent;
const toastCls = () => els.toast.className;
const gridOf = () => JSON.parse(st('JSON.stringify(G.grid)'));

ok(A.loadErrors.length === 0, 'a0-load-errors', J(A.loadErrors));

/* a0/a1: init + tutorial toast (fresh LS, 800ms) */
ok(vis('splash') && !vis('game'), 'a0-splash-visible');
ga.pump(50);
ok(/New here\?/.test(toastTxt()), 'a1-tutorial-toast', toastTxt());
ok(save().tutorialSeen === true, 'a1-tutorial-persisted');

/* a1b: howto */
click('how-btn');
ok(vis('howto') && !vis('splash'), 'a1b-howto-shown');
click('howto-close');
ok(vis('splash') && !vis('howto'), 'a1b-howto-closed');

/* a2: level select — tiers 8/10/8/4, lock states, locked no-op */
click('play-btn');
ok(vis('select'), 'a2-select-shown');
ok(els.tier1.children.length === 8 && els.tier2.children.length === 10 && els.tier3.children.length === 8 && els.tier4.children.length === 4, 'a2-tier-counts', [els.tier1.children.length, els.tier2.children.length, els.tier3.children.length, els.tier4.children.length]);
ok(!tierCard(1, 0).classList.contains('locked'), 'a2-l1-unlocked');
ok(tierCard(1, 1).classList.contains('locked'), 'a2-l2-locked');
ok(tierCard(4, 3).classList.contains('locked'), 'a2-l30-locked');
ok(starEmpties(tierCard(1, 0)) === 3, 'a2-l1-no-stars');
tierCard(1, 1).dispatch('click');
ok(vis('select') && !vis('game'), 'a2-locked-click-noop');

/* a3: enter level 1 */
curP = PARSED[0]; n = 6;
tierCard(1, 0).dispatch('click');
ok(inGame(), 'a3-game-shown');
ok(txt('hdr-level') === 'Level 1', 'a3-hdr-level', txt('hdr-level'));
ok(txt('hdr-size') === '6 × 6', 'a3-hdr-size', txt('hdr-size'));
ok(txt('hud-filled') === clueCount(PARSED[0]) + '/36', 'a3-hud-filled', txt('hud-filled'));
ok(String(txt('hud-hints')) === '3' && String(txt('hud-mistakes')) === '0', 'a3-hud-hm', txt('hud-hints') + '/' + txt('hud-mistakes'));
ga.pump(31); // fire the 500ms HUD timer tick at least once
ok(txt('hud-time') === '0:00', 'a3-hud-time', txt('hud-time'));
ok(els.board.children.length === 36, 'a3-36-cells', els.board.children.length);
ok(gridOf() !== null && J(gridOf()) === J(PARSED[0].clues), 'a3-grid-parity');
{
  let lockedCells = 0;
  els.board.children.forEach(ch => { if (ch.classList.contains('locked')) lockedCells++; });
  ok(lockedCells === clueCount(PARSED[0]), 'a3-locked-class-count', lockedCells);
}
ok(st('G.timerId') !== null && st('G.timerId') !== undefined, 'a3-timer-running');

/* a4: cycle null->1->0->null on first unlocked cell + history */
{
  const [r, c] = firstHintCell(PARSED[0]);
  tap(r, c);
  ok(gridOf()[r][c] === 1, 'a4-tap1-black', gridOf()[r][c]);
  ok(txt('hud-filled') === (clueCount(PARSED[0]) + 1) + '/36', 'a4-hud-filled-1', txt('hud-filled'));
  tap(r, c);
  ok(gridOf()[r][c] === 0, 'a4-tap2-white', gridOf()[r][c]);
  tap(r, c);
  ok(gridOf()[r][c] === null, 'a4-tap3-empty', gridOf()[r][c]);
  ok(txt('hud-filled') === clueCount(PARSED[0]) + '/36', 'a4-hud-filled-back');
  ok(st('G.history.length') === 3, 'a4-history-3', st('G.history.length'));
}
/* a4b: touchend path cycles */
{
  const [r, c] = firstHintCell(PARSED[0]);
  cellEl(r, c).dispatch('touchend');
  ok(gridOf()[r][c] === 1, 'a4b-touchend-tap', gridOf()[r][c]);
  tap(r, c); tap(r, c); // back to null (1 -> 0 -> null)
  ok(gridOf()[r][c] === null, 'a4b-touchend-cycle-back');
}
/* a4c: detail===0 click guard (keyboard/synthetic emulation ignored) */
{
  const [r, c] = firstHintCell(PARSED[0]);
  tap(r, c, { detail: 0 });
  ok(gridOf()[r][c] === null, 'a4c-detail0-ignored');
  ok(st('G.history.length') === 6, 'a4c-no-history', st('G.history.length'));
}
/* a5: locked cell tap — no change, no history */
{
  const P = PARSED[0]; let lr = -1, lc = -1;
  outer: for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (P.clues[r][c] !== null) { lr = r; lc = c; break outer; }
  const before = gridOf()[lr][lc];
  tap(lr, lc); tap(lr, lc);
  ok(gridOf()[lr][lc] === before, 'a5-locked-unchanged');
  ok(st('G.history.length') === 6, 'a5-locked-no-history', st('G.history.length'));
}

/* a6: triple mistake — P2 deferred counting: pending set instantly, HUD violations instant,
   mistake confirmed only once the player taps a DIFFERENT cell */
{
  taps(MC1.r, MC1.c, MC1.v === 1 ? 1 : 2);
  ok(st('G.pendingMistake') === MC1.r + ',' + MC1.c, 'a6-pending-set', st('G.pendingMistake'));
  ok(st('G.mistakes') === 0, 'a6-mistake-deferred', st('G.mistakes'));
  ok(String(txt('hud-mistakes')) === '0', 'a6-hud-deferred', txt('hud-mistakes'));
  const bad = ENG.findViolations(gridOf(), 6);
  let classesOK = true;
  for (const k of bad) { const [rr, cc] = k.split(',').map(Number); if (!cellEl(rr, cc).classList.contains('violation')) classesOK = false; }
  ok(classesOK && bad.size > 0, 'a6-violation-classes', J([...bad]));
  // same-cell cycle = transient, never confirmed
  tap(MC1.r, MC1.c);
  ok(st('G.mistakes') === 0, 'a6-samecell-transient-not-counted', st('G.mistakes'));
  // restore the violating stone, then confirm via a neutral cell's solution placement
  taps(MC1.r, MC1.c, MC1.v === 1 ? 1 : 2);
  ok(st('G.pendingMistake') === MC1.r + ',' + MC1.c, 'a6-pending-reset', st('G.pendingMistake'));
  const NC = neutralCell(PARSED[0], MC1);
  taps(NC.r, NC.c, NC.sol === 1 ? 1 : 2);
  ok(st('G.mistakes') === 1, 'a6-mistake-1', st('G.mistakes'));
  ok(String(txt('hud-mistakes')) === '1' && els['hud-mistakes'].className.includes('warn'), 'a6-hud-mistakes-warn', txt('hud-mistakes') + '/' + els['hud-mistakes'].className);
  ok(st('G.pendingMistake') === null || st('G.pendingMistake') !== MC1.r + ',' + MC1.c, 'a6-pending-consumed');
  while (st('G.history.length') > 0) click('btn-undo');
  ok(ENG.findViolations(gridOf(), 6).size === 0, 'a6-undo-violation-gone');
  ok(st('G.mistakes') === 1, 'a6-undo-mistake-persists', st('G.mistakes')); // documented: mistakes are per-attempt, undo doesn't refund
}

/* a7: undo with empty history -> warn toast */
while (st('G.history.length') > 0) click('btn-undo');
click('btn-undo');
ok(/Nothing to undo/.test(toastTxt()), 'a7-undo-empty-toast', toastTxt());
ok(toastCls().includes('warn'), 'a7-undo-empty-warn');

/* a8: check toasts */
{
  taps(MC1.r, MC1.c, MC1.v === 1 ? 1 : 2); // violation on board
  click('btn-check');
  const t1 = toastTxt();
  ok(/conflicts found/.test(t1), 'a8-check-conflicts-toast', t1);
  ok(toastCls().includes('warn'), 'a8-check-warn');
  // two-tap reset to clean
  click('btn-reset'); ok(/Tap Reset again/.test(toastTxt()), 'a11-reset-arm-toast', toastTxt());
  click('btn-reset');
  ok(J(gridOf()) === J(PARSED[0].clues), 'a11-reset-cleared');
  ok(st('G.history.length') === 0, 'a11-reset-history-empty');
  ok(/Garden reset/.test(toastTxt()), 'a11-reset-toast', toastTxt());
  click('btn-check');
  ok(/No conflicts — keep going/.test(toastTxt()), 'a8-check-clean-toast', toastTxt());
  ok(toastCls().includes('success'), 'a8-check-clean-success');
  // reset arm toast expires after 3s of pumped time and mistakes persist across reset (design)
  ok(st('G.mistakes') === 2, 'a8-mistakes-persist-reset', st('G.mistakes')); // documented: mistakes are per-attempt, undo/reset don't refund (a6:1 + a8 pending confirmed by Reset)
  ok(st('G.pendingMistake') === null, 'a8-reset-cleared-pending', st('G.pendingMistake'));
}

/* a9: hint — first row-major unlocked cell gets solution value, 3->2, glow class */
{
  const [hr, hc] = firstHintCell(PARSED[0]);
  click('btn-hint');
  ok(gridOf()[hr][hc] === PARSED[0].solution[hr][hc], 'a9-hint-value', hr + ',' + hc + '=' + gridOf()[hr][hc]);
  ok(st('G.hintsLeft') === 2 && st('G.hintsUsed') === 1, 'a9-hint-counters', st('G.hintsLeft') + '/' + st('G.hintsUsed'));
  ok(String(txt('hud-hints')) === '2', 'a9-hud-hints', txt('hud-hints'));
  ok(cellEl(hr, hc).classList.contains('hint-glow'), 'a9-hint-glow');
  ga.pump(65); // 1000ms glow removal
  ok(!cellEl(hr, hc).classList.contains('hint-glow'), 'a9-hint-glow-removed');
  ok(/Hint revealed/.test(toastTxt()), 'a9-hint-toast');
}
/* a10: exhaust hints (2 more) -> 4th warns, no consumption */
click('btn-hint'); click('btn-hint');
ok(st('G.hintsLeft') === 0 && st('G.hintsUsed') === 3, 'a10-hints-exhausted', st('G.hintsLeft') + '/' + st('G.hintsUsed'));
ok(els['hud-hints'].className.includes('warn'), 'a10-hud-hints-warn');
{
  const before = J(gridOf());
  click('btn-hint');
  ok(/No hints left/.test(toastTxt()), 'a10-no-hints-toast', toastTxt());
  ok(J(gridOf()) === before, 'a10-no-hints-no-change');
}
/* a10b: reset clears hint-filled cells (unlocked) but counters stay for the attempt */
click('btn-reset'); click('btn-reset');
ok(J(gridOf()) === J(PARSED[0].clues), 'a10b-reset-clears-hints');
ok(st('G.hintsUsed') === 3, 'a10b-hints-used-persist', st('G.hintsUsed'));

/* a12: ctrl+z undo */
{
  const [r, c] = firstHintCell(PARSED[0]);
  tap(r, c);
  ok(gridOf()[r][c] === 1, 'a12-place');
  ga.call("document.dispatchEvent ? null : null"); // no-op keep ctx warm
  // dispatch keydown z+ctrl to the element that owns key listeners (document)
  st("(function(){var ev={key:'z',ctrlKey:true,preventDefault:function(){}};((document.__dls||{}).keydown||[]).forEach(function(f){f(ev)});return 'ok'})()");
  ok(gridOf()[r][c] === null, 'a12-ctrlz-undone', gridOf()[r][c]);
}

/* a13: armed-flag leak regression (P3 fix) — arm Reset, exit via double-tap Menu, re-enter, ONE Reset tap must NOT wipe */
{
  const [r, c] = firstHintCell(PARSED[0]);
  tap(r, c); tap(r, c); // stone on board (white)
  click('btn-reset');            // arm (do not confirm)
  ok(/Tap Reset again/.test(toastTxt()), 'a13-armed');
  click('game-menu');            // menu arm 1
  ok(/Tap Menu again/.test(toastTxt()), 'a13-menu-arm-toast', toastTxt());
  ok(inGame(), 'a13-menu-first-tap-stays');
  click('game-menu');            // menu confirm -> select
  ok(vis('select') && !inGame(), 'a13-menu-exit');
  tierCard(1, 0).dispatch('click'); // re-enter level 1 -> startLevel clears flags (P3 fix)
  ok(inGame(), 'a13-reenter');
  const [r2, c2] = firstHintCell(PARSED[0]);
  tap(r2, c2);
  click('btn-reset');            // single tap: must only ARM, not wipe
  ok(/Tap Reset again/.test(toastTxt()), 'a13-leak-fixed-toast', toastTxt());
  ok(gridOf()[r2][c2] !== null, 'a13-leak-fixed-board-intact', gridOf()[r2][c2]);
  click('btn-reset');            // confirm to clean up
  ok(J(gridOf()) === J(PARSED[0].clues), 'a13-cleanup-reset');
}

/* a14: menu two-tap already covered in a13; a15: sound toggle persists */
click('game-sound');
ok(st('G.soundOn') === false, 'a15-sound-off');
ok(save().soundOn === false, 'a15-sound-persist');
ok(els['game-sound'].innerHTML === '&#128263;', 'a15-icon-off', els['game-sound'].innerHTML);
click('game-sound');
ok(st('G.soundOn') === true && save().soundOn === true, 'a15-sound-on');
ok(els['game-sound'].innerHTML === '&#128266;', 'a15-icon-on');

/* a16: CLEAN 3-star solve of level 1 (fresh attempt via re-enter) */
click('game-menu'); click('game-menu'); // exit
tierCard(1, 0).dispatch('click');       // fresh attempt: mistakes/hints reset
ok(st('G.mistakes') === 0 && st('G.hintsLeft') === 3, 'a16-fresh-attempt', st('G.mistakes') + '/' + st('G.hintsLeft'));
solveByTaps(gridOf, taps);
ok(st('G.completed') === true, 'a16-completed');
ok(vis('complete') && !inGame(), 'a16-complete-screen');
ok(txt('complete-level') === 'Level 1 Complete', 'a16-complete-level', txt('complete-level'));
ok(els['complete-stars'].innerHTML === '&#9733;&#9733;&#9733;', 'a16-3stars-html', els['complete-stars'].innerHTML);
ok(String(txt('complete-mistakes')) === '0' && String(txt('complete-hints')) === '0', 'a16-complete-stats', txt('complete-mistakes') + '/' + txt('complete-hints'));
ok(txt('complete-time') === '0:00', 'a16-complete-time', txt('complete-time'));
ok(st('G.timerId') === null, 'a16-timer-stopped');
{
  const sv = save();
  ok(sv.levels['1'] && sv.levels['1'].stars === 3, 'a16-save-stars3', J(sv.levels['1']));
  ok(sv.lastPlayed === 2, 'a16-save-lastplayed', sv.lastPlayed);
}
/* level 2 now unlocked in select */
click('complete-next');
ok(inGame() && txt('hdr-level') === 'Level 2', 'a17-next-level2', txt('hdr-level'));

/* a18: level 2 — 1 mistake then solve -> 2 stars */
curP = PARSED[1]; n = 6;
ok(txt('hdr-size') === '6 × 6', 'a18-size', txt('hdr-size'));
ok(txt('hud-filled') === clueCount(PARSED[1]) + '/36', 'a18-hud-filled', txt('hud-filled'));
if (MC2 && neutralCell(PARSED[1], MC2)) {
  taps(MC2.r, MC2.c, MC2.v === 1 ? 1 : 2);
  const NC2 = neutralCell(PARSED[1], MC2);
  taps(NC2.r, NC2.c, NC2.sol === 1 ? 1 : 2);
  ok(st('G.mistakes') === 1, 'a18-mistake-1', st('G.mistakes'));
  while (st('G.history.length') > 0) click('btn-undo');
  ok(st('G.mistakes') === 1, 'a18-mistake-persists');
} else { pass++; /* documented skip */ }
solveByTaps(gridOf, taps);
ok(st('G.completed') === true && vis('complete'), 'a18-completed');
ok(els['complete-stars'].innerHTML === '&#9733;&#9733;<span class="empty">&#9733;</span>', 'a18-2stars', els['complete-stars'].innerHTML);
ok(save().levels['2'] && save().levels['2'].stars === 2, 'a18-save-2stars', J(save().levels['2']));
click('complete-next');
ok(inGame() && txt('hdr-level') === 'Level 3', 'a18-next-3');

/* a19: level 3 — 2 hints (0 mistakes) -> 1 star */
curP = PARSED[2]; n = 6;
click('btn-hint'); click('btn-hint');
ok(st('G.hintsUsed') === 2 && st('G.mistakes') === 0, 'a19-2hints', st('G.hintsUsed') + '/' + st('G.mistakes'));
solveByTaps(gridOf, taps);
ok(st('G.completed') === true, 'a19-completed');
ok(els['complete-stars'].innerHTML === '&#9733;<span class="empty">&#9733;</span><span class="empty">&#9733;</span>', 'a19-1star-hints', els['complete-stars'].innerHTML);
ok(save().levels['3'] && save().levels['3'].stars === 1, 'a19-save-1star');
click('complete-next');
ok(inGame() && txt('hdr-level') === 'Level 4', 'a19-next-4');

/* a19b: level 4 — 3 mistakes -> 1 star */
curP = PARSED[3]; n = 6;
if (MC4 && neutralCell(PARSED[3], MC4)) {
  const NC4 = neutralCell(PARSED[3], MC4);
  for (let k = 0; k < 3; k++) {
    taps(MC4.r, MC4.c, MC4.v === 1 ? 1 : 2);
    taps(NC4.r, NC4.c, NC4.sol === 1 ? 1 : 2);
    ok(st('G.mistakes') === 1 + k, 'a19b-mistake-round-' + k, st('G.mistakes'));
    while (st('G.history.length') > 0) click('btn-undo');
  }
  ok(st('G.mistakes') === 3, 'a19b-3mistakes', st('G.mistakes'));
} else { pass++; }
solveByTaps(gridOf, taps);
ok(st('G.completed') === true, 'a19b-completed');
ok(els['complete-stars'].innerHTML === '&#9733;<span class="empty">&#9733;</span><span class="empty">&#9733;</span>', 'a19b-1star-mistakes');
ok(save().levels['4'] && save().levels['4'].stars === 1, 'a19b-save');
click('complete-next');
ok(inGame() && txt('hdr-level') === 'Level 5', 'a19b-next-5');

/* a20: abandon level 5 mid-attempt -> menu shows L5 not completed, L6 still locked (stars chain) */
curP = PARSED[4]; n = 6;
{
  const [r, c] = firstHintCell(PARSED[4]);
  tap(r, c);
}
click('game-menu'); click('game-menu');
ok(vis('select'), 'a20-select');
ok(!tierCard(1, 4).classList.contains('completed'), 'a20-l5-not-completed');
ok(tierCard(1, 5).classList.contains('locked'), 'a20-l6-locked');
ok(tierCard(1, 3).classList.contains('completed') && !tierCard(1, 3).classList.contains('locked'), 'a20-l4-completed-unlocked');
ok(starEmpties(tierCard(1, 0)) === 0, 'a20-l1-stars-full');
ok(starEmpties(tierCard(1, 1)) === 1, 'a20-l2-stars-2');
click('back-splash');
ok(vis('splash'), 'a20-splash-back');

/* ---------- Boot B: seeded save ---------- */
const seedSave = { version: 1, levels: { 1: { stars: 3, bestTime: 42 }, 2: { stars: 2, bestTime: 50 }, 5: { stars: 1, bestTime: 90 } }, daily: {}, soundOn: false, lastPlayed: 3, tutorialSeen: true };
const B = bootGame('zen-garden', { seedLS: { 'zen_garden_save_v1': J(seedSave) } });
{
  const gb = B, elsb = B.els;
  const visb = (x) => !elsb[x].classList.contains('hidden');
  const stb = (e) => gb.call(e);
  const saveb = () => JSON.parse(stb('localStorage.getItem("' + KEY + '")') || 'null');
  const cardb = (t, i) => elsb['tier' + t].children[i];
  ok(gb.loadErrors.length === 0, 'b0-load-errors');
  ok(elsb['game-sound'].innerHTML === '&#128263;', 'b0-sound-off-icon', elsb['game-sound'].innerHTML);
  ok(stb('G.soundOn') === false, 'b0-sound-off-state');
  // no tutorial toast this time
  gb.pump(50);
  ok(!/New here\?/.test(elsb.toast.textContent), 'b0-no-tutorial-toast', elsb.toast.textContent);
  elsb['play-btn'].dispatch('click');
  ok(visb('select'), 'b1-select');
  ok(cardb(1, 0).classList.contains('completed') && cardb(1, 0).children[1].querySelectorAll('.empty').length === 0, 'b1-l1-completed-3stars');
  ok(cardb(1, 1).classList.contains('completed') && cardb(1, 1).children[1].querySelectorAll('.empty').length === 1, 'b1-l2-completed-2stars');
  ok(cardb(1, 4).classList.contains('completed') && cardb(1, 4).children[1].querySelectorAll('.empty').length === 2, 'b1-l5-completed-1star');
  ok(!cardb(1, 2).classList.contains('completed') && !cardb(1, 2).classList.contains('locked'), 'b1-l3-unlocked-open');
  ok(!cardb(1, 5).classList.contains('locked'), 'b1-l6-unlocked-via-l5');
  ok(cardb(3, 7).classList.contains('locked'), 'b1-l27-locked');
  ok(cardb(4, 3).classList.contains('locked'), 'b1-l30-locked');
  cardb(4, 3).dispatch('click');
  ok(visb('select') && !visb('game'), 'b1-l30-locked-noop');

  /* b3: level 30 solve -> Next returns to select (no level 31) */
  cardb(4, 3).classList.remove('locked'); // lock blocks the click listener; unlock via class only still leaves no listener — must seed levels[29] instead
}
/* re-boot B2 with level 29 completed so card 30 is genuinely clickable */
const seed2 = JSON.parse(J(seedSave)); seed2.levels['29'] = { stars: 1, bestTime: 300 };
const B2 = bootGame('zen-garden', { seedLS: { 'zen_garden_save_v1': J(seed2) } });
{
  const gb = B2, elsb = B2.els;
  const stb = (e) => gb.call(e);
  const cardb = (t, i) => elsb['tier' + t].children[i];
  const visb = (x) => !elsb[x].classList.contains('hidden');
  elsb['play-btn'].dispatch('click');
  ok(!cardb(4, 3).classList.contains('locked'), 'b3-l30-unlocked');
  cardb(4, 3).dispatch('click');
  ok(visb('game') && elsb['hdr-level'].textContent === 'Level 30', 'b3-l30-enter', elsb['hdr-level'].textContent);
  ok(elsb['hud-filled'].textContent === clueCount(PARSED[29]) + '/100', 'b3-hud-filled', elsb['hud-filled'].textContent);
  ok(gb.call('G.timerId') != null, 'b3-timer');
  let nb = 10; // current B2 board size (level 30 = 10x10, daily = sbxN)
  const readb = () => JSON.parse(gb.call('JSON.stringify(G.grid)'));
  curP = PARSED[29]; n = 10;
  const tapb = (r, c, ev) => elsb.board.children[r * nb + c].dispatch('click', ev || {});
  const tapsb = (r, c, k) => { for (let i = 0; i < k; i++) tapb(r, c); };
  solveByTaps(readb, tapsb);
  ok(gb.call('G.completed') === true && visb('complete'), 'b3-l30-completed');
  ok(elsb['complete-stars'].innerHTML === '&#9733;&#9733;&#9733;', 'b3-3stars');
  {
    const sv = JSON.parse(gb.call('localStorage.getItem("' + KEY + '")'));
    ok(sv.levels['30'] && sv.levels['30'].stars === 3, 'b3-save-30', J(sv.levels['30']));
    ok(sv.lastPlayed === 30, 'b3-lastplayed-cap30', sv.lastPlayed); // Math.min(30, 31)
  }
  elsb['complete-next'].dispatch('click');
  ok(visb('select') && !visb('game'), 'b3-next-returns-select');

  /* b5: daily — generation parity + solve + save + next.
     The harness virtualizes Date (epoch 0 at boot), so the engine's `new Date()` inside
     startDaily is the SANDBOX date, not the real clock — regenerate the expected level
     offline from the sandbox's own date string for an exact parity assert. */
  const SBX_TODAY = gb.call('new Date().toISOString().slice(0,10)');
  const sbxSeed = parseInt(SBX_TODAY.replace(/-/g, ''));
  const sbxN = [6, 8, 8, 10][sbxSeed % 4];
  let sbxLvl = null;
  for (let off2 = 0; off2 < 40 && !sbxLvl; off2++) sbxLvl = ENG.genDailyLevel(sbxSeed + off2 * 7919, sbxN);
  ok(!!sbxLvl, 'b5-daily-sbx-gen', SBX_TODAY);
  elsb['back-splash'].dispatch('click');
  ok(visb('splash'), 'b5-splash');
  elsb['daily-btn'].dispatch('click');
  gb.pump(3); // 30ms generation timeout
  ok(visb('game'), 'b5-daily-started');
  ok(elsb['hdr-level'].textContent === 'Daily Garden', 'b5-hdr-daily', elsb['hdr-level'].textContent);
  ok(gb.call('G.isDaily') === true, 'b5-isDaily');
  ok(gb.call('G.size') === sbxN, 'b5-daily-size', gb.call('G.size') + ' want ' + sbxN);
  ok(J(JSON.parse(gb.call('JSON.stringify(G.grid)'))) === J(sbxLvl.p), 'b5-daily-grid-parity');
  ok(J(JSON.parse(gb.call('JSON.stringify(G.level.solution)'))) === J(sbxLvl.s), 'b5-daily-sol-parity');
  n = sbxN; nb = sbxN; curP = { n: sbxN, clues: sbxLvl.p, solution: sbxLvl.s };
  solveByTaps(readb, tapsb);
  ok(gb.call('G.completed') === true && visb('complete'), 'b5-daily-completed');
  ok(elsb['complete-level'].textContent === 'Daily Garden Complete', 'b5-complete-level', elsb['complete-level'].textContent);
  {
    const sv = JSON.parse(gb.call('localStorage.getItem("' + KEY + '")'));
    ok(sv.daily[SBX_TODAY] && sv.daily[SBX_TODAY].stars === 3, 'b5-daily-save', J(sv.daily));
    ok(sv.levels['30'] && sv.levels['30'].stars === 3, 'b5-levels-intact');
  }
  elsb['complete-next'].dispatch('click');
  ok(visb('select'), 'b5-daily-next-select');

  /* b6: daily replay button restarts a fresh daily */
  elsb['back-splash'].dispatch('click');
  elsb['daily-btn'].dispatch('click');
  gb.pump(3);
  ok(visb('game') && gb.call('G.isDaily') === true, 'b6-daily-reenter');
  n = sbxN; nb = sbxN; curP = { n: sbxN, clues: sbxLvl.p, solution: sbxLvl.s }; solveByTaps(readb, tapsb);
  ok(visb('complete'), 'b6-complete');
  elsb['complete-replay'].dispatch('click');
  gb.pump(3);
  ok(visb('game') && gb.call('G.isDaily') === true && gb.call('G.completed') === false, 'b6-replay-started');
  ok(J(JSON.parse(gb.call('JSON.stringify(G.grid)'))) === J(sbxLvl.p), 'b6-replay-fresh-grid');
  ok(gb.call('G.mistakes') === 0 && gb.call('G.hintsLeft') === 3, 'b6-replay-fresh-counters');
  // exit to select for LS tests
  elsb['game-menu'].dispatch('click'); elsb['game-menu'].dispatch('click');

  /* b7: corrupt save JSON -> defaults */
  gb.call('localStorage.setItem("' + KEY + '","not-json{")');
  const d1 = gb.call('JSON.stringify(loadSave())');
  ok(d1 === J({ version: 1, levels: {}, daily: {}, soundOn: true, lastPlayed: 1, tutorialSeen: false }), 'b7-corrupt-defaults', d1);
  /* b8: version mismatch -> defaults */
  gb.call('localStorage.setItem("' + KEY + '",' + J(J({ version: 2, levels: { 99: { stars: 3 } } })) + ')');
  const d2 = gb.call('JSON.stringify(loadSave())');
  ok(d2 === J({ version: 1, levels: {}, daily: {}, soundOn: true, lastPlayed: 1, tutorialSeen: false }), 'b8-version-defaults', d2);
  /* b9: beforeunload stops the timer */
  elsb['back-splash'].dispatch('click');
  elsb['daily-btn'].dispatch('click'); gb.pump(3);
  ok(gb.call('G.timerId') != null, 'b9-timer-running');
  gb.call("window.dispatchEvent({type:'beforeunload'})");
  ok(gb.call('G.timerId') === null, 'b9-beforeunload-stops-timer');
}

/* ---------- result ---------- */
const total = pass + fail;
const extra = {
  levels: ENG.LEVELS.length,
  today: TODAY, dailyN, dailyOff,
  engineFixes: 'P2-pendingMistake deferred mistake confirmation (null->black->white cycle forced every white through a transient black; a transient next to a 11-clue-pair tripled and counted a mistake, making 3 stars impossible on flawless solves — level 1 itself has 2 such cells; confirmed on next tap elsewhere/Hint/Undo/Reset, same-cell cycle = transient), P3-startLevel clears _resetArmed/_menuArmed (armed two-tap confirm leaked across level transitions)',
  documented: [
    'a6/a18/a19b: mistakes are per-attempt and NOT refunded by undo or reset (design; caps stars at 2/1)',
    'save.lastPlayed written but never read anywhere (dead field)',
    'G.rafId only ever canceled in cleanup(), never assigned (dead field)',
    'actUndo/actReset/actHint silently return once completed (no toast)',
    'onCellClick ignores detail===0 clicks (keyboard/synthetic emulation guard) — covered by a4c',
    'hint targets the FIRST row-major unlocked cell differing from solution (not "most useful" cell)',
    'CYCLE SEMANTICS: reaching white passes through a transient black stone; a transient that completes a row/col unbalances it and counts a mistake (shipped design — a player tapping white last in a line loses a star that way; verifier solves whites-first to avoid it)',
    'daily key uses UTC date (toISOString) — consistent with seed; harness VDate(epoch 0) means the driven daily asserts regenerate expectations from the sandbox date string',
    'P2 fix semantics: mistakes HUD updates one tap late (deferred confirm); instant violation highlighting unchanged; a violating stone still on the board when Reset is confirmed DOES count (mistakes persist across reset by design)',
    'harness: cell.querySelector(".stone") returns a stub (stones are visual-only in harness; asserts use G.grid + classList)',
  ],
};
console.log(J({ pass, fail, total, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
