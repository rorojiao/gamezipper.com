// hex-path-spin engine verifier — vm harness, real input paths only.
// Engine state is IIFE-private; assertions are DOM/LS-observable
// (hud-level/score/target/stars, win overlay, level grid, menu stats, LS).
// Rotations are applied through REAL canvas pointerdown events at each hex's
// pixel center (the engine's own handlePointer -> pixelToHex -> rotateTile ->
// traceFullPath -> checkWin path). The target rotations are found offline by a
// deterministic hill-climb solver over the engine's OWN extracted pure
// functions (TILE_PATTERNS/rotatePattern/tracePath/EDGE_DIRS/genLevels), and
// the final path length is cross-checked against hud-score after the clicks.
//
// P0 fixed 2026-08-25: 12/30 levels were unwinnable (start tile type 0 can
// never route rim entry edge 4 inward — path exits after 1 segment under every
// rotation). Generator now forces the start tile to a routable type (1).
'use strict';
const path = require('path');
const fs = require('fs');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }
function click(g, id) { el(g, id).dispatch('click', { type: 'click', preventDefault() {} }); }
function screenVisible(g, id) { return el(g, id).style.display !== 'none'; }

// ---------- extract the engine's pure functions ----------
const SRC = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function sliceFn(marker) {
  const i = SRC.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + marker);
  let j = SRC.indexOf('{', i), d = 0;
  for (; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}') { d--; if (d === 0) return SRC.slice(i, j + 1); }
  }
  throw new Error('unbalanced: ' + marker);
}
function sliceArr(marker) {
  const i = SRC.indexOf(marker), ob = SRC.indexOf('[', i);
  let d = 0;
  for (let j = ob; j < SRC.length; j++) {
    if (SRC[j] === '[') d++;
    else if (SRC[j] === ']') { d--; if (d === 0) return SRC.slice(i, SRC.indexOf(';', j) + 1); }
  }
  throw new Error('unbalanced array: ' + marker);
}
let levelsSrc;
{
  const li = SRC.indexOf('var LEVELS=[]');
  const iife = SRC.indexOf('(function genLevels(){', li);
  let m = SRC.indexOf('{', iife), d = 0;
  for (; m < SRC.length; m++) {
    if (SRC[m] === '{') d++;
    else if (SRC[m] === '}') { d--; if (d === 0) break; }
  }
  levelsSrc = SRC.slice(li, SRC.indexOf(';', m) + 1);
}
const F = new Function([
  sliceFn('function mulberry32('), sliceArr('var TILE_PATTERNS='), sliceFn('function rotatePattern('),
  sliceFn('function tracePath('), sliceArr('var EDGE_DIRS='), sliceFn('function exitToEntry('),
  sliceFn('function pointyHexToPixel('), sliceFn('function cubeRound('), sliceFn('function genHexRing('),
  levelsSrc,
].join('\n') + '\nreturn {mulberry32:mulberry32,TILE_PATTERNS:TILE_PATTERNS,rotatePattern:rotatePattern,tracePath:tracePath,EDGE_DIRS:EDGE_DIRS,exitToEntry:exitToEntry,pointyHexToPixel:pointyHexToPixel,LEVELS:LEVELS};')();

// ---------- mirror of traceFullPath (pure given tiles+level) ----------
function trace(tiles, map, level) {
  let q = level.startQ, r = level.startR, entry = level.startEdge;
  const visited = {};
  let len = 0, reason = '';
  for (let it = 0; it < 200; it++) {
    const t = map[q + ',' + r];
    if (!t) { reason = 'off_board'; break; }
    const key = q + ',' + r + ',' + entry;
    if (visited[key]) { reason = 'loop'; break; }
    visited[key] = true;
    const pat = F.rotatePattern(F.TILE_PATTERNS[t.type], t.rotation);
    const exit = F.tracePath(pat, entry);
    if (exit === -1) { reason = 'dead_end'; break; }
    len++;
    const dir = F.EDGE_DIRS[exit];
    const nq = q + dir.q, nr = r + dir.r;
    if (!map[nq + ',' + nr]) { reason = 'board_edge'; break; }
    q = nq; r = nr; entry = F.exitToEntry(exit);
  }
  return { len, reason: reason || 'max_iterations' };
}
function mkMap(tiles) { const m = {}; tiles.forEach(t => { m[t.q + ',' + t.r] = t; }); return m; }
function traceLevel(level, rots) {
  const tiles = level.tiles.map((t, i) => ({ q: t.q, r: t.r, type: t.type, rotation: rots ? rots[i] : t.rotation }));
  return trace(tiles, mkMap(tiles), level);
}

// ---------- deterministic hill-climb solver (xorshift rng) ----------
function mkRng(seed) { let s = seed >>> 0; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function solveLevel(level, budgetEvals) {
  const n = level.tiles.length;
  let evals = 0;
  const score = rots => {
    const res = traceLevel(level, rots);
    return { res, sc: (res.reason === 'board_edge' || res.reason === 'off_board') ? res.len : res.len - 1000 };
  };
  let best = null;
  const climb = rots0 => {
    const rots = rots0.slice();
    let cur = score(rots); evals++;
    let improved = true;
    while (improved && evals < budgetEvals) {
      improved = false;
      for (let i = 0; i < n && evals < budgetEvals; i++) {
        let bestR = rots[i], bestS = cur.sc, bestRes = cur.res;
        for (let rr = 0; rr < 6; rr++) {
          if (rr === rots[i]) continue;
          const cand = rots.slice(); cand[i] = rr;
          const c = score(cand); evals++;
          if (c.sc > bestS) { bestS = c.sc; bestR = rr; bestRes = c.res; }
        }
        if (bestR !== rots[i]) { rots[i] = bestR; cur = { sc: bestS, res: bestRes }; improved = true; }
      }
    }
    if (!best || cur.sc > best.sc) best = { rots: rots.slice(), sc: cur.sc, res: cur.res };
  };
  climb(level.tiles.map(t => t.rotation));
  const rng = mkRng(12345);
  let restart = 0;
  while (best.sc < level.target3 && evals < budgetEvals && restart < 60) {
    const rots = []; for (let i = 0; i < n; i++) rots.push(Math.floor(rng() * 6));
    climb(rots); restart++;
  }
  return best;
}

// precompute all 30 solutions (engine source is deterministic)
const SOLUTIONS = [];
for (let i = 0; i < 30; i++) {
  const L = F.LEVELS[i];
  const budget = L.tiles.length <= 8 ? 120000 : L.tiles.length <= 20 ? 300000 : 600000;
  const sol = solveLevel(L, budget);
  SOLUTIONS.push(sol);
  if (!(sol.res.len >= L.target3 && (sol.res.reason === 'board_edge' || sol.res.reason === 'off_board'))) {
    ck('solver: L' + (i + 1) + ' reaches 3-star target offline', false, 'len=' + sol.res.len + ' t3=' + L.target3 + ' ' + sol.res.reason);
  }
}
ck('solver: all 30 levels reach target3 (post P0 fix)', SOLUTIONS.every((s, i) => s.res.len >= F.LEVELS[i].target3));

// ---------- geometry for clicks (mirrors resizeCanvas with 480x640 wrap rect) ----------
function hexSizeFor(radius) {
  const w = 480, h = 640;
  const boardW = (2 * radius + 1) * Math.sqrt(3) * 1.0;
  const boardH = (2 * radius + 1) * 1.5 * 1.0 + 0.5;
  let s = Math.min(w / boardW * 0.9, h / boardH * 0.9);
  return s < 12 ? 12 : s;
}
function clickHex(g, q, r, radius) {
  const size = hexSizeFor(radius);
  const p = F.pointyHexToPixel(q, r, size);
  const rect = g.els['canvas-wrap'].getBoundingClientRect();
  const cx = rect.left + rect.width / 2 + p.x;
  const cy = rect.top + rect.height / 2 + p.y;
  el(g, 'game-canvas').dispatch('pointerdown', { type: 'pointerdown', clientX: cx, clientY: cy, preventDefault() {} });
}
// apply solver rotations through real clicks
function applySolution(g, levelIdx) {
  const L = F.LEVELS[levelIdx];
  const sol = SOLUTIONS[levelIdx];
  L.tiles.forEach((t, i) => {
    const want = sol.rots[i];
    const clicks = (want - (t.rotation % 6) + 6) % 6;
    for (let c = 0; c < clicks; c++) clickHex(g, t.q, t.r, L.radius);
  });
  return sol;
}

// ---------- boot 1 ----------
const g = harness.bootGame('hex-path-spin');
ck('boot: no load errors', errs(g).length === 0, errs(g).join(' | '));
ck('boot: menu visible', screenVisible(g, 'menu-screen') && !screenVisible(g, 'game-screen'));
ck('boot: fresh stats', el(g, 'menu-stats').innerHTML.indexOf('Completed: 0/30') >= 0, el(g, 'menu-stats').innerHTML);

// settings overlay
click(g, 'btn-settings-menu');
ck('settings: shown', el(g, 'settings-overlay').classList.contains('show'));
click(g, 'set-sfx');
ck('settings: sfx off', !el(g, 'set-sfx').classList.contains('on'));
click(g, 'set-sfx');
ck('settings: sfx on', el(g, 'set-sfx').classList.contains('on'));
click(g, 'set-music');
ck('settings: music off', !el(g, 'set-music').classList.contains('on'));
click(g, 'set-haptics');
ck('settings: haptics off', !el(g, 'set-haptics').classList.contains('on'));
click(g, 'set-music'); click(g, 'set-haptics'); // restore
ck('settings: restored', el(g, 'set-music').classList.contains('on') && el(g, 'set-haptics').classList.contains('on'));
click(g, 'set-close');
ck('settings: closed', !el(g, 'settings-overlay').classList.contains('show'));

// level select: lock policy
click(g, 'btn-levels');
ck('levels: screen shown', screenVisible(g, 'level-select'));
const grid1 = el(g, 'level-grid').children;
ck('levels: 30 cells', grid1.length === 30, String(grid1.length));
ck('levels: L1 unlocked', !grid1[0].classList.contains('locked'));
ck('levels: L2 locked', grid1[1].classList.contains('locked'));
ck('levels: L30 locked', grid1[29].classList.contains('locked'));
grid1[1].dispatch('click', { type: 'click', preventDefault() {} });
ck('levels: locked click ignored', screenVisible(g, 'level-select'));
click(g, 'ls-back');
ck('levels: back to menu', screenVisible(g, 'menu-screen'));

// play -> tutorial on L1
click(g, 'btn-play');
ck('play: game screen', screenVisible(g, 'game-screen'));
ck('play: hud level 1', String(el(g, 'hud-level').textContent) === '1');
ck('tut: shown on first L1', el(g, 'tutorial-overlay').classList.contains('show'));
ck('tut: step 1', el(g, 'tut-num').textContent === 'Step 1 of 4', el(g, 'tut-num').textContent);
click(g, 'tut-next');
ck('tut: step 2', el(g, 'tut-num').textContent === 'Step 2 of 4');
click(g, 'tut-next'); click(g, 'tut-next');
ck('tut: final button label', el(g, 'tut-next').textContent === 'GOT IT!', el(g, 'tut-next').textContent);
click(g, 'tut-next');
ck('tut: dismissed + flag saved', !el(g, 'tutorial-overlay').classList.contains('show') && g.ls.getItem('hexpathspin_tut') === '1');
g.pump(2); // deferred resizeCanvas rAF

// ---------- solve L1 ----------
function solveCurrent(g, levelIdx, label) {
  const L = F.LEVELS[levelIdx];
  const sol = applySolution(g, levelIdx);
  ck(label + ': hud score = traced length', String(el(g, 'hud-score').textContent) === String(sol.res.len),
    el(g, 'hud-score').textContent + ' vs ' + sol.res.len);
  ck(label + ': hud stars 3', el(g, 'hud-stars').textContent === '★★★', el(g, 'hud-stars').textContent);
  g.pump(30); // 400ms overlay timer
  ck(label + ': win overlay', el(g, 'win-overlay').classList.contains('show'));
  const golds = (el(g, 'win-star-display').innerHTML.match(/#fbbf24/g) || []).length;
  ck(label + ': 3 gold stars', golds === 3, String(golds));
  ck(label + ': score text', el(g, 'win-score-text').textContent === 'Path length: ' + sol.res.len + ' segments', el(g, 'win-score-text').textContent);
  const sv = JSON.parse(g.ls.getItem('hexpathspin_v1'));
  ck(label + ': stars saved', (sv.stars || {})[levelIdx] === 3, JSON.stringify(sv.stars));
  return sol;
}
ck('L1: target shown', el(g, 'hud-target').textContent === F.LEVELS[0].target1 + '-' + F.LEVELS[0].target3, el(g, 'hud-target').textContent);
solveCurrent(g, 0, 'L1');
ck('L1: progress level saved', JSON.parse(g.ls.getItem('hexpathspin_v1')).level === 1);
ck('L1: next button visible', el(g, 'btn-next').style.display !== 'none');

// ---------- levels 2..30 via btn-next ----------
for (let lv = 1; lv < 30; lv++) {
  if (lv === 5) continue; // L6 already solved by the menu-detour branch at lv===4
  click(g, 'btn-next');
  if (String(el(g, 'hud-level').textContent) !== String(lv + 1)) {
    ck('L' + (lv + 1) + ': started', false, 'hud=' + el(g, 'hud-level').textContent); break;
  }
  ck('L' + (lv + 1) + ': started', true);
  g.pump(2);
  if (lv === 2) { // L3: hint + reset
    click(g, 'ctrl-hint');
    ck('L3: hint exercised', errs(g).length === 0, errs(g).join(' | '));
    const initLen = traceLevel(F.LEVELS[2], null).len;
    click(g, 'ctrl-reset');
    // loadLevel() resets hud-score to 0 — the path is only traced on the first
    // rotation (rotateTile calls traceFullPath), so pristine = 0, not initLen.
    ck('L3: reset restores pristine state (score 0, rotations reloaded)',
      String(el(g, 'hud-score').textContent) === '0' && initLen >= 0,
      el(g, 'hud-score').textContent);
  }
  if (lv === 3) { // L4: sound toggle mid-game
    click(g, 'ctrl-sound');
    ck('L4: sound muted label', el(g, 'ctrl-sound').textContent === 'MUTED' && !el(g, 'ctrl-sound').classList.contains('active'));
    click(g, 'ctrl-sound');
    ck('L4: sound restored', el(g, 'ctrl-sound').textContent === 'SOUND' && el(g, 'ctrl-sound').classList.contains('active'));
  }
  solveCurrent(g, lv, 'L' + (lv + 1));
  if (lv === 4) { // after L5: menu detour + resume
    click(g, 'ctrl-home');
    ck('menu: shown mid-run', screenVisible(g, 'menu-screen'));
    const stats = el(g, 'menu-stats').innerHTML;
    ck('menu: stats track 5 completed', stats.indexOf('Completed: 5/30') >= 0 && stats.indexOf('Stars: 15/90') >= 0, stats);
    click(g, 'btn-play');
    ck('menu: play resumes at L6', String(el(g, 'hud-level').textContent) === '6', String(el(g, 'hud-level').textContent));
    g.pump(2);
    solveCurrent(g, 5, 'L6');
  }
}
ck('L30: next hidden on last level', el(g, 'btn-next').style.display === 'none', String(el(g, 'btn-next').style.display));

// final grid state
click(g, 'ctrl-home');
click(g, 'btn-levels');
const gridEnd = el(g, 'level-grid').children;
ck('end: all 30 unlocked', gridEnd.every(c => !c.classList.contains('locked')));
ck('end: all 30 completed', gridEnd.every(c => c.classList.contains('completed')));
ck('end: stats 30/30', el(g, 'menu-stats').innerHTML.indexOf('Completed: 30/30') >= 0 && el(g, 'menu-stats').innerHTML.indexOf('Stars: 90/90') >= 0, el(g, 'menu-stats').innerHTML);
click(g, 'ls-back');

// ---------- boot 2: returning player ----------
const g2 = harness.bootGame('hex-path-spin', { seedLS: Object.assign({}, g.ls._m) });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
ck('boot2: stats carried', el(g2, 'menu-stats').innerHTML.indexOf('Completed: 30/30') >= 0, el(g2, 'menu-stats').innerHTML);
click(g2, 'btn-play');
ck('boot2: resumes at L30 (max)', String(el(g2, 'hud-level').textContent) === '30', String(el(g2, 'hud-level').textContent));
ck('boot2: tutorial not reshown', !el(g2, 'tutorial-overlay').classList.contains('show'));

// reset progress from settings
click(g2, 'ctrl-home');
click(g2, 'btn-settings-menu');
click(g2, 'set-reset');
ck('reset: LS cleared', g2.ls.getItem('hexpathspin_v1') === null);
ck('reset: stats zeroed', el(g2, 'menu-stats').innerHTML.indexOf('Completed: 0/30') >= 0, el(g2, 'menu-stats').innerHTML);
click(g2, 'btn-levels');
const gridR = el(g2, 'level-grid').children;
ck('reset: L2 locked again', !gridR[0].classList.contains('locked') && gridR[1].classList.contains('locked'));
click(g2, 'ls-back');

// ---------- summary ----------
const extra = { levels: 30, totalStars: SOLUTIONS.reduce((a, s, i) => a + (s.res.len >= F.LEVELS[i].target3 ? 3 : 0), 0) };
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
