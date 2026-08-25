// hexa-sort engine verifier — vm harness, real input paths only.
// Engine state is IIFE-private; assertions are DOM/LS-observable
// (g-title/g-moves/g-score, win/lose overlay, star canvases, level-select
// markup, menu stats, LS 'hexa-sort-save'). Drops flow through the engine's
// own input path: tray-div pointerdown -> document pointerup at the target
// hex's pixel center -> pixelToHex -> placePiece -> clearGroups ->
// checkWinLose -> showWin/showLose. Math.random is pinned to 0.02 so the
// whole tray is color 0 (floor(0.02*colors)=0 for every level's colorCount).
//
// Win strategy (scoring ceiling analysis, see P0 comment in index.html):
// groups clear the MOMENT 3+ connected same-color cells form, so build
// components of <=2 cells, then one hub piece at (0,0) joins 3 pairwise
// non-adjacent petals (1,0)/(0,-1)/(-1,1) plus their extras (2,0)/(0,-2)/
// (-2,2) — a single clear caps at 7 cells = 70 pts. Levels with
// 10*min(M,7) >= 2*target win with one flower; larger levels first clear a
// small m-cell flower kept under target (10m < t), then land a 7-cell flower
// so the FIRST score crossing the target already exceeds 2*target (3 stars).
//
// P0 fixed: all 50 targets recalibrated to 3*min(pieces,moves) — originals
// exceeded the score ceiling on L5-L50 (permanently unwinnable) and hit it
// exactly on L1-L4 (3 stars unreachable). P1 fixed: showWin multi-fire level
// runaway; tray-exhaust soft-lock (no lose branch); Continue after L50 loads
// an empty dead screen (level clamp). P2 fixed: winning score filed under the
// NEXT level's best key (phantom stars/completed counts — asserted via exact
// 'N/50 levels completed' counts after L5 and after L50).
'use strict';
const path = require('path');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }
function click(g, id) { el(g, id).dispatch('click', { type: 'click', preventDefault() {} }); }
function shown(g, id) { return el(g, id).classList.contains('show'); }
function hasCls(e, c) { return (e.classList && e.classList.contains(c)) || String(e.className).indexOf(c) >= 0; }

// walk a parsed subtree; find a button whose compiled inline onclick matches.
// els[id] entries are truncated id-mirrors — the canonical parsed tree hangs
// off sandbox.document.body, so scope searches there.
function walk(root, out) { out.push(root); (root.children || []).forEach(c => walk(c, out)); return out; }
function bodyNode(g, id) { return walk(g.sandbox.document.body, []).find(n => n.id === id) || el(g, id); }
function btnByCode(g, rootId, needle, notNeedle) {
  for (const b of walk(bodyNode(g, rootId), [])) {
    if (typeof b.onclick === 'function') {
      const s = String(b.onclick);
      if (s.indexOf(needle) >= 0 && !(notNeedle && s.indexOf(notNeedle) >= 0)) return b;
    }
  }
  return null;
}
function fire(b) { if (b) b.dispatch('click', { type: 'click', preventDefault() {} }); }

// ---------- level table (mirrors index.html LEVELS) ----------
const SRC = require('fs').readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const LEVELS = [];
for (const m of SRC.matchAll(/\{name:"([^"]+)",ch:(\d+),radius:(\d+),colors:(\d+),moves:(\d+),target:(\d+),pieces:(\d+),pre:\[\]\}/g)) {
  LEVELS.push({ name: m[1], radius: +m[3], moves: +m[5], target: +m[6], pieces: +m[7] });
}
ck('levels: parsed 50 entries', LEVELS.length === 50, String(LEVELS.length));
ck('levels: targets are 3*min(pieces,moves)', LEVELS.every(l => l.target === 3 * Math.min(l.pieces, l.moves)));

// ---------- geometry (mirrors resizeCanvas with 480px wrap) ----------
function liveHS(g, radius) {
  const w = el(g, 'board').width;
  for (let hs = 14; hs <= 32; hs++) {
    if (Math.ceil((2 * radius + 1) * Math.sqrt(3) * hs + hs * 2 + 20) === w) return hs;
  }
  return null;
}
const SQ3 = Math.sqrt(3);
const PET = [[1, 0], [0, -1], [-1, 1]];   // hub neighbors, pairwise non-adjacent
const EXT = [[2, 0], [0, -2], [-2, 2]];   // one extra cell beyond each petal
const HUB = [0, 0];
function flowerOrder(cells) { // placement order for a `cells`-sized clear, hub LAST
  const seq = [];
  for (let i = 0; i < Math.min(3, cells - 1); i++) seq.push(PET[i]);
  for (let i = 3; i < cells - 1; i++) seq.push(EXT[i - 3]);
  seq.push(HUB);
  return seq;
}
function drop(g, q, r, hs) {
  const p = { x: el(g, 'board').width / 2 + hs * (SQ3 * q + SQ3 / 2 * r), y: el(g, 'board').height / 2 + hs * 1.5 * r };
  el(g, 'tray-wrap').children[0].dispatch('pointerdown', { type: 'pointerdown', clientX: 60, clientY: 600, preventDefault() {} });
  g.sandbox.document.dispatch('pointerup', { type: 'pointerup', clientX: p.x, clientY: p.y, preventDefault() {} });
  g.pump(2);
}

// ---------- solve one level via real drops; assert win + 3 stars ----------
function solve(g, i, label) {
  const lv = LEVELS[i];
  const M = Math.min(lv.pieces, lv.moves), t = lv.target;
  const hs = liveHS(g, lv.radius);
  ck(label + ': hexSize derived from live canvas', hs !== null);
  let used, expect;
  const run = cells => {
    flowerOrder(cells).forEach(c => drop(g, c[0], c[1], hs));
    g.pump(45); // 300ms chain wave + 400ms win timer
  };
  if (10 * Math.min(M, 7) >= 2 * t) {
    used = Math.min(M, 7); expect = 10 * used; run(used);
  } else {
    const m = Math.min(7, Math.floor((t - 1) / 10)); // 10m < t: stays under target
    ck(label + ': two-phase plan sizes valid', m >= 3 && m + 7 <= M && 10 * (m + 7) >= 2 * t, 'm=' + m);
    run(m);
    ck(label + ': interim ' + 10 * m + ' below target t=' + t + ' (no early win)',
      String(el(g, 'g-score').textContent) === String(10 * m) && !shown(g, 'game-over'),
      el(g, 'g-score').textContent + ' overlay=' + shown(g, 'game-over'));
    used = m + 7; expect = 10 * (m + 7); run(7);
  }
  ck(label + ': win overlay shown', shown(g, 'game-over'));
  ck(label + ': win title', el(g, 'go-title').textContent === 'Level Complete!' && el(g, 'go-title').className === 'win', el(g, 'go-title').textContent);
  ck(label + ': 3 gold stars', el(g, 'go-stars').children.filter(c => hasCls(c, 'filled')).length === 3);
  ck(label + ': score msg', el(g, 'go-msg').textContent === 'Score: ' + expect + ' / Target: ' + t, el(g, 'go-msg').textContent);
  ck(label + ': hud score', String(el(g, 'g-score').textContent) === String(expect), String(el(g, 'g-score').textContent));
  ck(label + ': moves used', String(el(g, 'g-moves').textContent) === String(lv.moves - used), String(el(g, 'g-moves').textContent));
  ck(label + ': tray leftovers', el(g, 'tray-wrap').children.length === lv.pieces - used, String(el(g, 'tray-wrap').children.length));
  const sv = JSON.parse(g.ls.getItem('hexa-sort-save'));
  ck(label + ': best saved under own key', sv.best && sv.best['lv' + i] === expect, JSON.stringify(sv.best));
  return expect;
}

function levelBtn(g, i) { // engine innerHTML renders into the els registry entry:
  return el(g, 'level-list').children[Math.floor(i / 10)].children[1].children[i % 10]; // chapter -> grid -> button
}
function started(g, i) {
  return el(g, 'g-title').textContent === 'Level ' + (i + 1) + ' — ' + LEVELS[i].name
    && String(el(g, 'g-moves').textContent) === String(LEVELS[i].moves)
    && String(el(g, 'g-score').textContent) === '0'
    && el(g, 'tray-wrap').children.length === LEVELS[i].pieces;
}

// ---------- boot 1 ----------
const g = harness.bootGame('hexa-sort');
ck('boot: no load errors', errs(g).length === 0, errs(g).join(' | '));
ck('boot: menu stats 0/50', el(g, 'menu-stats').textContent === '0/50 levels completed', el(g, 'menu-stats').textContent);
g.call('Math.random=function(){return 0.02}'); // whole tray color 0

// tutorial modal (menu)
fire(btnByCode(g, 'menu-screen', 'openTutorial()'));
ck('tut: shown', shown(g, 'tutorial-modal'));
ck('tut: step 1 text', el(g, 'tut-text').textContent.indexOf('Drag pieces from the tray') === 0, el(g, 'tut-text').textContent);
ck('tut: next label', el(g, 'tut-next').textContent === 'Next');
click(g, 'tut-next'); click(g, 'tut-next'); click(g, 'tut-next'); click(g, 'tut-next');
ck('tut: last label Got It!', el(g, 'tut-next').textContent === 'Got It!', el(g, 'tut-next').textContent);
click(g, 'tut-next');
ck('tut: completed closes', !shown(g, 'tutorial-modal'));
fire(btnByCode(g, 'menu-screen', 'openTutorial()'));
fire(btnByCode(g, 'tutorial-modal', "closeOverlay('tutorial-modal')")); // Skip
ck('tut: skip closes', !shown(g, 'tutorial-modal'));

// settings modal (menu) — toggles + persistence
fire(btnByCode(g, 'menu-screen', 'openSettings()'));
ck('set: shown', shown(g, 'settings-modal'));
ck('set: sfx on by default', String(el(g, 'tog-sfx').className) === 'toggle on', String(el(g, 'tog-sfx').className));
click(g, 'tog-sfx');
ck('set: sfx off', String(el(g, 'tog-sfx').className) === 'toggle', String(el(g, 'tog-sfx').className));
ck('set: sfx off persisted', JSON.parse(g.ls.getItem('hexa-sort-save')).s === 0);
click(g, 'tog-sfx');
click(g, 'tog-music');
ck('set: music off persisted', JSON.parse(g.ls.getItem('hexa-sort-save')).m === 0);
click(g, 'tog-music'); click(g, 'tog-particles'); click(g, 'tog-particles'); // round-trip
ck('set: restored', String(el(g, 'tog-sfx').className) === 'toggle on' && String(el(g, 'tog-music').className) === 'toggle on' && String(el(g, 'tog-particles').className) === 'toggle on');
fire(btnByCode(g, 'settings-modal', "closeOverlay('settings-modal')", 'resetProgress'));
ck('set: done closes', !shown(g, 'settings-modal'));

// level select: lock policy (locked buttons are pointer-events:none in CSS —
// enforced at browser level, so the verifier asserts markup, no dispatch)
fire(btnByCode(g, 'menu-screen', 'showLevelSelect()'));
ck('lsel: shown', shown(g, 'level-select'));
ck('lsel: 50 buttons', walk(el(g, 'level-list'), []).filter(e => hasCls(e, 'level-btn')).length === 50);
ck('lsel: L1 unlocked', !hasCls(levelBtn(g, 0), 'locked'));
ck('lsel: L2 locked', hasCls(levelBtn(g, 1), 'locked'));
ck('lsel: L50 locked', hasCls(levelBtn(g, 49), 'locked'));
ck('lsel: locked renders no star row', levelBtn(g, 49).children.length === 0);
fire(levelBtn(g, 0)); // start L1 via selectLevel
ck('L1: started via selectLevel', started(g, 0), el(g, 'g-title').textContent);

// L1 power-ups: place/undo/bomb/restart/shuffle via real buttons + drops
{
  const hs = liveHS(g, LEVELS[0].radius);
  drop(g, 1, 0, hs);
  ck('L1: drop consumed move+piece', String(el(g, 'g-moves').textContent) === '11' && el(g, 'tray-wrap').children.length === 5);
  click(g, 'btn-undo');
  ck('L1: undo restored move+piece', String(el(g, 'g-moves').textContent) === '12' && el(g, 'tray-wrap').children.length === 6);
  ck('L1: undo count decremented', String(el(g, 'undo-count').textContent) === '2', String(el(g, 'undo-count').textContent));
  drop(g, 1, 0, hs);
  click(g, 'btn-bomb');
  ck('L1: bomb scored 15 (1 cell)', String(el(g, 'g-score').textContent) === '15' && String(el(g, 'bomb-count').textContent) === '0', String(el(g, 'g-score').textContent) + '/' + String(el(g, 'bomb-count').textContent));
  g.pump(25); // bomb's 300ms clearGroups settle
  ck('L1: bomb cell freed, no win/lose', !shown(g, 'game-over') && String(el(g, 'g-score').textContent) === '15');
  fire(btnByCode(g, 'game-screen', 'doRestart()', 'showLevelSelect')); // Restart (not Levels)
  ck('L1: restart resets board', started(g, 0), el(g, 'g-score').textContent);
  ck('L1: powerups persist across restart (engine design)', String(el(g, 'undo-count').textContent) === '2' && String(el(g, 'bomb-count').textContent) === '0');
  click(g, 'btn-shuffle');
  ck('L1: shuffle keeps tray', el(g, 'tray-wrap').children.length === 6 && errs(g).length === 0, errs(g).join(' | '));
}
solve(g, 0, 'L1');
ck('L1: next visible', el(g, 'go-next').style.display !== 'none');

// ---------- chain L2..L50 ----------
for (let i = 1; i < 50; i++) {
  if (i === 5) continue; // resumed + solved by the menu detour after L5
  if (i === 10) continue; // entered via level-select detour after L10
  if (i !== 10) click(g, 'go-next');
  if (!started(g, i)) { ck('L' + (i + 1) + ': started', false, el(g, 'g-title').textContent); break; }
  ck('L' + (i + 1) + ': started', true);
  ck('L' + (i + 1) + ': powerups reset by nextLevel', String(el(g, 'undo-count').textContent) === '3' && String(el(g, 'bomb-count').textContent) === '1');
  if (i === 2) { click(g, 'btn-shuffle'); ck('L3: shuffle mid-game', el(g, 'tray-wrap').children.length === LEVELS[2].pieces && errs(g).length === 0); }
  solve(g, i, 'L' + (i + 1));
  if (i === 4) { // after L5: menu detour, stats, lock policy, resume at L6
    fire(btnByCode(g, 'game-over', 'backToMenu()', 'doRestart')); // overlay Menu
    ck('detour: menu shown', el(g, 'menu-screen').style.display === 'flex' && el(g, 'game-screen').style.display === 'none');
    ck('detour: stats exactly 5/50 (P2 best-key fix)', el(g, 'menu-stats').textContent === '5/50 levels completed', el(g, 'menu-stats').textContent);
    fire(btnByCode(g, 'menu-screen', 'showLevelSelect()'));
    ck('detour: L6 unlocked+current', !hasCls(levelBtn(g, 5), 'locked') && hasCls(levelBtn(g, 5), 'current'));
    ck('detour: L7 still locked', hasCls(levelBtn(g, 6), 'locked'));
    ck('detour: L1 star row rendered (3 spans)', levelBtn(g, 0).children.length === 1 && hasCls(levelBtn(g, 0).children[0], 'stars') && levelBtn(g, 0).children[0].children.length === 3);
    fire(btnByCode(g, 'level-select', 'closeLevelSelect()'));
    fire(btnByCode(g, 'menu-screen', 'startGame()'));
    ck('detour: resumes at L6', started(g, 5), el(g, 'g-title').textContent);
    solve(g, 5, 'L6');
  }
  if (i === 9) { // after L10: Menu (closes the win overlay) -> level select -> L11.
    // (the game-screen Levels button sits UNDER the full-screen win overlay —
    // pointer-unreachable in a real browser, so not a valid input path here)
    fire(btnByCode(g, 'game-over', 'backToMenu()', 'doRestart'));
    ck('detour2: menu via overlay Menu', el(g, 'menu-screen').style.display === 'flex');
    fire(btnByCode(g, 'menu-screen', 'showLevelSelect()'));
    ck('detour2: level select from menu', shown(g, 'level-select') && !hasCls(levelBtn(g, 10), 'locked') && hasCls(levelBtn(g, 11), 'locked'));
    fire(levelBtn(g, 10));
    ck('detour2: L11 started via selectLevel', started(g, 10), el(g, 'g-title').textContent);
    ck('detour2: win overlay closed', !shown(g, 'game-over'));
    ck('detour2: selectLevel resets powerups', String(el(g, 'undo-count').textContent) === '3' && String(el(g, 'bomb-count').textContent) === '1');
    solve(g, 10, 'L11');
  }
}
ck('L50: next hidden on last level', el(g, 'go-next').style.display === 'none', String(el(g, 'go-next').style.display));
ck('chain: no load errors', errs(g).length === 0, errs(g).join(' | '));

// final: back to menu, full stats (exactly 50 best keys — P2 fix regression)
fire(btnByCode(g, 'game-over', 'backToMenu()', 'doRestart'));
ck('end: stats 50/50', el(g, 'menu-stats').textContent === '50/50 levels completed', el(g, 'menu-stats').textContent);
fire(btnByCode(g, 'menu-screen', 'showLevelSelect()'));
ck('end: L50 unlocked', !hasCls(levelBtn(g, 49), 'locked'));
ck('end: no phantom keys (exactly 50)', Object.keys(JSON.parse(g.ls.getItem('hexa-sort-save')).best).length === 50);
fire(btnByCode(g, 'level-select', 'closeLevelSelect()'));

// ---------- boot 2: returning player ----------
const g2 = harness.bootGame('hexa-sort', { seedLS: Object.assign({}, g.ls._m) });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
ck('boot2: stats carried 50/50', el(g2, 'menu-stats').textContent === '50/50 levels completed', el(g2, 'menu-stats').textContent);
g2.call('Math.random=function(){return 0.02}');
fire(btnByCode(g2, 'menu-screen', 'startGame()'));
ck('boot2: Continue clamps to L50 after finishing (P1 fix)', el(g2, 'g-title').textContent === 'Level 50 — Grandmaster', el(g2, 'g-title').textContent);
ck('boot2: L50 board live', String(el(g2, 'g-moves').textContent) === '17' && el(g2, 'tray-wrap').children.length === 72);

// lose path on L50: burn all 17 moves on isolated singles (no group ever forms)
{
  const hs = liveHS(g2, LEVELS[49].radius);
  const singles = [];
  for (let q = -6; q <= 6; q += 2) singles.push([q, 0]);
  for (let q = -6; q <= 4; q += 2) singles.push([q, 2]);
  for (let q = -4; q <= 6; q += 2) singles.push([q, -2]);
  ck('lose: 17 isolated cells available', singles.length >= 17);
  for (let k = 0; k < 17; k++) drop(g2, singles[k][0], singles[k][1], hs);
  ck('lose: moves exhausted, no score', String(el(g2, 'g-moves').textContent) === '0' && String(el(g2, 'g-score').textContent) === '0');
  g2.pump(30); // 400ms lose timer
  ck('lose: overlay shown', shown(g2, 'game-over'));
  ck('lose: title', el(g2, 'go-title').textContent === 'Out of Moves!' && el(g2, 'go-title').className === 'lose');
  ck('lose: msg', el(g2, 'go-msg').textContent === 'Score: 0 / Target: 51', el(g2, 'go-msg').textContent);
  ck('lose: no stars', el(g2, 'go-stars').children.length === 0);
  ck('lose: next hidden', el(g2, 'go-next').style.display === 'none');
  fire(btnByCode(g2, 'game-over', 'doRestart()', 'backToMenu')); // Retry
  ck('lose: retry restarts L50', el(g2, 'g-title').textContent === 'Level 50 — Grandmaster'
    && String(el(g2, 'g-moves').textContent) === '17' && String(el(g2, 'g-score').textContent) === '0'
    && el(g2, 'tray-wrap').children.length === 72);
}

// reset progress
fire(btnByCode(g2, 'game-screen', 'backToMenu()'));
fire(btnByCode(g2, 'menu-screen', 'openSettings()'));
fire(btnByCode(g2, 'settings-modal', 'resetProgress()'));
ck('reset: LS cleared', g2.ls.getItem('hexa-sort-save') === null);
ck('reset: stats zeroed', el(g2, 'menu-stats').textContent === '0/50 levels completed', el(g2, 'menu-stats').textContent);
fire(btnByCode(g2, 'menu-screen', 'showLevelSelect()'));
ck('reset: L2 locked again', hasCls(levelBtn(g2, 1), 'locked'));

// ---------- summary ----------
const extra = { levels: 50, threeStar: 50, fixes: 'P0 loadSave-mutated-state.level on every read -> saveProgress clobbered the post-win increment, progression stuck on session-entry level forever; P0 46/50 targets above score ceiling (10*min(p,mv); single clear caps at 7 cells/70pts) -> 3*min(p,mv); P1 showWin re-fire level runaway, tray-exhaust soft-lock (no lose branch), Continue-after-L50 dead screen (level clamp); P2 win score filed under next level best key' };
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
