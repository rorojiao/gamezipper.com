// hotaru-beam engine verification — real-input (pointerdown/button clicks) per
// _optimization/scripts/verifier-spec.md. Wins go through the engine's own
// checkSolved on ALL 30 levels using constructed+validated solutions.
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('../_optimization/scripts/harness-lib.js');

const SOLS = JSON.parse(fs.readFileSync(path.join(__dirname, '_solutions.json'), 'utf8'));
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const levSrc = src.slice(src.indexOf('var LEVELS=['), src.indexOf('];', src.indexOf('var LEVELS=[')) + 2);
const LEVELS = new Function('return ' + levSrc.replace('var LEVELS=', ''))();
const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

// ---- faithful checkSolved port (degree-2 circles, connectivity, numbered traces) ----
function validateEngineSemantics(lv, edges) {
  const circleSet = {}; lv.circles.forEach(c => circleSet[c.r + ',' + c.c] = 1);
  const adj = {};
  for (const k in edges) {
    const p = k.split(/[-,]/);
    const a = p[0] + ',' + p[1], b = p[2] + ',' + p[3];
    (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
  }
  for (const ci of lv.circles) if ((adj[ci.r + ',' + ci.c] || []).length !== 2) return 'degree';
  const start = lv.circles[0].r + ',' + lv.circles[0].c;
  const seen = { [start]: 1 }, q = [start];
  while (q.length) for (const n of (adj[q.shift()] || [])) if (!seen[n]) { seen[n] = 1; q.push(n); }
  for (const ci of lv.circles) if (!seen[ci.r + ',' + ci.c]) return 'connectivity';
  const ek = (r1, c1, r2, c2) => (r1 > r2 || (r1 === r2 && c1 > c2)) ? ek(r2, c2, r1, c1) : r1 + ',' + c1 + '-' + r2 + ',' + c2;
  for (const ci of lv.circles) {
    if (ci.num < 0) continue;
    const d = DIRS[ci.dir], fr = ci.r + d[0], fc = ci.c + d[1];
    if (!edges[ek(ci.r, ci.c, fr, fc)]) return 'no-dot-edge';
    let cr = fr, cc = fc, pdr = d[0], pdc = d[1], bends = 0, steps = 0;
    const vis = { [ci.r + ',' + ci.c]: 1, [cr + ',' + cc]: 1 };
    while (steps++ < 500) {
      const k = cr + ',' + cc;
      if (circleSet[k] !== undefined) { if (bends !== ci.num) return 'bends'; break; }
      const nx = (adj[k] || []).filter(n => !vis[n]);
      if (nx.length !== 1) return 'walk';
      const p = nx[0].split(','); const nr = +p[0], nc = +p[1];
      const ndr = nr - cr, ndc = nc - cc;
      if (ndr !== pdr || ndc !== pdc) bends++;
      vis[nx[0]] = 1; cr = nr; cc = nc; pdr = ndr; pdc = ndc;
    }
  }
  return null;
}

let pass = 0, fail = 0; const fails = []; const notes = [];
function ck(name, cond, info) {
  if (cond) { pass++; } else { fail++; fails.push(name + (info ? ' | ' + info : '')); }
  process.stderr.write((cond ? 'ok ' : 'FAIL ') + name + (info ? ' | ' + info : '') + '\n');
}

const g = H.bootGame('hotaru-beam');
const doc = g.sandbox.document;
const errs = gg => (gg.loadErrors || []).concat(gg.sandbox.__errors || []);
const $ = id => doc.getElementById(id);
const activeScreen = () => ['title-screen', 'level-screen', 'game-screen']
  .filter(id => { const el = doc.getElementById(id); return el && el.classList && el.classList.contains('active'); })[0] || null;
// find a DOM button whose compiled onclick references `snippet`
function findBtn(snippet, d) {
  d = d || doc;
  return (d.querySelectorAll('button') || []).find(b => b.onclick && String(b.onclick).includes(snippet)) || null;
}
const overlayActive = id => { const el = $(id); return !!(el && el.classList && el.classList.contains('active')); };
const lsRead = () => { try { return JSON.parse(g.ls.getItem('hotaru-beam') || '{}'); } catch (e) { return {}; } };

// geometry replica of resizeCanvas @480x640
function geom(lv) {
  const maxW = Math.min(500, 480 - 16), maxH = 640 - 100;
  const cs = Math.max(Math.min(maxW / (lv.gridC + 1), maxH / (lv.gridR + 1)), 28);
  return { cs: cs, ox: 10, oy: 10 };
}
function clickEdge(edgeKey) {
  const lv = LEVELS[curLevelId - 1]; const { cs, ox, oy } = geom(lv);
  const p = edgeKey.split(/[-,]/); const r1 = +p[0], c1 = +p[1], r2 = +p[2], c2 = +p[3];
  let x, y;
  if (r1 === r2) { // horizontal
    const c = Math.min(c1, c2); x = ox + (c + 0.5) * cs; y = oy + r1 * cs;
  } else {
    const r = Math.min(r1, r2); x = ox + c1 * cs; y = oy + (r + 0.5) * cs;
  }
  $('game-canvas').dispatch('pointerdown', { clientX: x, clientY: y });
}
let curLevelId = 1;
function applySolution(id) {
  curLevelId = id;
  for (const e of SOLS[String(id)]) clickEdge(e);
}
function winAndAdvance(id) {
  applySolution(id);
  g.pump(30); // 400ms win-overlay timeout fires (500ms virtual)
  const won = overlayActive('win-overlay');
  ck('win:L' + id, won, 'lvl=' + $('hud-level').textContent);
  if (!won) return false;
  const stats = $('win-stats').innerHTML;
  ck('win-stats:L' + id, stats.includes('Time:') && stats.includes('Hints:'), stats.replace(/<br>/g, ' / '));
  const sv = lsRead();
  ck('saved:L' + id, sv.levels && sv.levels[id] && sv.levels[id].completed === true, 'ls=' + JSON.stringify(sv.levels && sv.levels[id]));
  return true;
}

// ---------- boot ----------
ck('boot:title-active', activeScreen() === 'title-screen', activeScreen());
ck('boot:no-runtime-errors', errs(g).length === 0, errs(g).slice(0, 3).join('; '));

// ---------- offline data integrity ----------
ck('data:30-levels', LEVELS.length === 30 && LEVELS.every((l, i) => l.id === i + 1), 'n=' + LEVELS.length);
let boundsOk = true, uniqOk = true;
for (const lv of LEVELS) {
  const seen = {};
  for (const c of lv.circles) {
    if (c.r < 0 || c.r > lv.gridR || c.c < 0 || c.c > lv.gridC) boundsOk = false;
    if (seen[c.r + ',' + c.c]) uniqOk = false;
    seen[c.r + ',' + c.c] = 1;
    if (!DIRS[c.dir]) boundsOk = false;
    if (c.num < -1 || c.num > 9) boundsOk = false;
  }
}
ck('data:circles-in-bounds', boundsOk);
ck('data:circles-unique', uniqOk);
let solOk = true, solBad = '';
for (const lv of LEVELS) {
  const edges = {}; (SOLS[String(lv.id)] || []).forEach(e => edges[e] = true);
  const why = validateEngineSemantics(lv, edges);
  if (why) { solOk = false; solBad += 'L' + lv.id + ':' + why + ' '; }
}
ck('data:all-30-solvable-offline', solOk, solBad);
notes.push('levels 2-30 regenerated (P0: shipped data unsolvable under engine semantics, L2 analytically proven); solutions validated against a faithful checkSolved port');

// ---------- level select gating ----------
const playBtn = findBtn('showLevelSelect()');
ck('dom:play-btn', !!playBtn);
playBtn.click();
ck('nav:level-screen', activeScreen() === 'level-screen', activeScreen());
const grid = $('level-grid');
ck('grid:30-buttons', grid.children.length === 30, 'n=' + grid.children.length);
ck('grid:L1-unlocked', grid.children[0].classList.contains('unlocked') && !!grid.children[0].onclick);
ck('grid:L2-locked', grid.children[1].classList.contains('locked') && !grid.children[1].onclick);
ck('grid:L30-locked', grid.children[29].classList.contains('locked') && !grid.children[29].onclick);

// ---------- L1 + tutorial ----------
grid.children[0].click();
ck('nav:game-screen', activeScreen() === 'game-screen', activeScreen());
ck('hud:level-1', $('hud-level').textContent === 'Level 1', $('hud-level').textContent);
ck('tut:shown-on-L1', overlayActive('tutorial-overlay'));
for (let i = 0; i < 6; i++) findBtn('nextTutStep()').click();
ck('tut:dismiss-6-nexts', !overlayActive('tutorial-overlay'));
ck('tut:_tutDone-saved', lsRead()._tutDone === true);

// ---------- hint / toast ----------
findBtn('doHint()').click();
ck('hint:toast-shown', $('toast').classList.contains('show'), $('toast').textContent.slice(0, 30));
g.pump(151); // 2517ms > 2500ms auto-hide
ck('hint:toast-autohide', !$('toast').classList.contains('show'));

// ---------- timer + visibilitychange (P2 fix) ----------
// toast autohide pump above burned 2517ms of live game time — timer now at ~4.5s (4 ticks)
g.pump(120); // +2s -> ~6.5s
ck('timer:ticks', $('hud-timer').textContent === '0:04', $('hud-timer').textContent);
doc.hidden = true; doc.dispatch('visibilitychange', {});
g.pump(120);
ck('timer:stops-when-hidden', $('hud-timer').textContent === '0:04', $('hud-timer').textContent);
doc.hidden = false; doc.dispatch('visibilitychange', {});
g.pump(120);
ck('timer:resume-keeps-elapsed', $('hud-timer').textContent === '0:06', $('hud-timer').textContent); // continues from 4 (+2s), NOT reset to 0:02

// ---------- win L1 (perimeter, real clicks) ----------
if (!winAndAdvance(1)) { /* failures already recorded */ }
const t1Recorded = lsRead().levels[1].time;
ck('win:L1-timer-frozen', $('hud-timer').textContent === '0:06', $('hud-timer').textContent);
g.pump(120);
ck('win:L1-timer-stays-frozen', $('hud-timer').textContent === '0:06', $('hud-timer').textContent);

// ---------- L2 chain ----------
findBtn('nextLevel()').click();
ck('nav:L2', $('hud-level').textContent === 'Level 2', $('hud-level').textContent);
winAndAdvance(2);

// ---------- L3: toggle-off + undo oracles ----------
findBtn('nextLevel()').click();
ck('nav:L3', $('hud-level').textContent === 'Level 3', $('hud-level').textContent);
curLevelId = 3;
const lv3 = LEVELS[2];
// W1/W2: edges at circles not in the solution (degree-breaking)
const wrongEdgesAt = (lv, id) => {
  const sol = new Set(SOLS[String(id)]);
  const out = [];
  for (const c of lv.circles) {
    for (const k in DIRS) {
      const [dr, dc] = DIRS[k];
      const nr = c.r + dr, nc = c.c + dc;
      if (nr < 0 || nr > lv.gridR || nc < 0 || nc > lv.gridC) continue;
      const key = (c.r > nr || (c.r === nr && c.c > nc)) ? nr + ',' + nc + '-' + c.r + ',' + c.c : c.r + ',' + c.c + '-' + nr + ',' + nc;
      if (!sol.has(key)) { out.push(key); break; }
    }
  }
  return out;
};
const wrongs3 = wrongEdgesAt(lv3, 3);
ck('oracle:L3-wrong-edges-exist', wrongs3.length >= 2, 'n=' + wrongs3.length);
const sol3 = SOLS['3'];
// toggle-off: place W1 then click again -> must be OFF
clickEdge(wrongs3[0]); clickEdge(wrongs3[0]);
// apply solution except last edge
for (let i = 0; i < sol3.length - 1; i++) clickEdge(sol3[i]);
// undo-blocking edge W2
clickEdge(wrongs3[1]);
g.pump(30);
ck('undo:L3-blocked-by-wrong-edge', !overlayActive('win-overlay'));
findBtn('doUndo()').click(); // removes W2
clickEdge(sol3[sol3.length - 1]);
g.pump(30);
ck('undo:L3-win-after-undo', overlayActive('win-overlay'), 'lvl=' + $('hud-level').textContent);
ck('saved:L3', !!(lsRead().levels && lsRead().levels[3] && lsRead().levels[3].completed));

// ---------- L4: reset oracle + settings ----------
findBtn('nextLevel()').click();
ck('nav:L4', $('hud-level').textContent === 'Level 4', $('hud-level').textContent);
curLevelId = 4;
const wrongs4 = wrongEdgesAt(LEVELS[3], 4);
clickEdge(wrongs4[0]); clickEdge(wrongs4[1]);
findBtn('doReset()').click();
// timer text resets on next tick after doReset (state.timer=0); win proves edges cleared
winAndAdvance(4);

// settings (from title screen path after finishing chain later — but do mid-flow via level select back)
findBtn('showLevelSelect()').click(); // win-overlay "Level Select" button
ck('nav:back-to-levels', activeScreen() === 'level-screen', activeScreen());
ck('grid:L1-L4-completed', [0, 1, 2, 3].every(i => grid.children[i].classList.contains('completed')));
ck('grid:L5-unlocked', grid.children[4].classList.contains('unlocked') && !!grid.children[4].onclick);
ck('grid:L6-still-locked', grid.children[5].classList.contains('locked') && !grid.children[5].onclick);
// settings via title
findBtn('showTitle()').click();
ck('nav:title', activeScreen() === 'title-screen', activeScreen());
findBtn('showSettings()').click();
ck('settings:overlay', overlayActive('settings-overlay'));
$('sound-toggle').click();
ck('settings:sound-off', $('sound-toggle').textContent === 'OFF', $('sound-toggle').textContent);
$('music-toggle').click();
ck('settings:music-off', $('music-toggle').textContent === 'OFF', $('music-toggle').textContent);
$('error-toggle').click();
ck('settings:errors-off', $('error-toggle').textContent === 'OFF', $('error-toggle').textContent);
findBtn('hideSettings()').click();
ck('settings:closed', !overlayActive('settings-overlay'));
$('sound-toggle').click(); $('music-toggle').click(); $('error-toggle').click(); // restore ON
ck('settings:restored', $('sound-toggle').textContent === 'ON' && $('error-toggle').textContent === 'ON');
notes.push('P3: sound/music toggles are in-memory only (not persisted to localStorage)');

// ---------- L5..L30 real-input win chain ----------
let chainOk = true;
for (let id = 5; id <= 30; id++) {
  if (id === 5) {
    findBtn('showLevelSelect()').click();
    grid.children[4].click();
    ck('nav:L5', $('hud-level').textContent === 'Level 5', $('hud-level').textContent);
    if (!winAndAdvance(5)) { chainOk = false; break; }
  } else {
    findBtn('nextLevel()').click();
    if ($('hud-level').textContent !== 'Level ' + id) { ck('nav:L' + id, false, $('hud-level').textContent); chainOk = false; break; }
    if (!winAndAdvance(id)) { chainOk = false; break; }
  }
}
if (chainOk) {
  // after L30 win, Next Level -> level select
  findBtn('nextLevel()').click();
  ck('nav:L30-next-goes-to-select', activeScreen() === 'level-screen', activeScreen());
  ck('grid:all-30-completed', grid.children.every(b => b.classList.contains('completed')));
}

// ---------- boot2: persistence + no-tutorial + best-time min-keep ----------
const lsSnap = Object.assign({}, g.ls._m);
const g2 = H.bootGame('hotaru-beam', { seedLS: lsSnap });
const doc2 = g2.sandbox.document;
ck('boot2:no-errors', errs(g2).length === 0, errs(g2).slice(0, 3).join('; '));
doc2.getElementById('level-grid');
// enter via Play -> L1
(function () {
  const btn = (doc2.querySelectorAll('button') || []).find(b => b.onclick && String(b.onclick).includes('showLevelSelect()'));
  btn.click();
})();
const grid2 = doc2.getElementById('level-grid');
ck('boot2:progress-visible', grid2.children[0].classList.contains('completed') && grid2.children[29].classList.contains('completed'));
grid2.children[0].click();
ck('boot2:no-tutorial-replay', !doc2.getElementById('tutorial-overlay').classList.contains('active'));
ck('boot2:hud-level-1', doc2.getElementById('hud-level').textContent === 'Level 1');
// slower replay: 5s elapsed, win -> recorded time must stay at the faster first win
g2.pump(480); // 8s — deliberately SLOWER than the 6s first win, so min-keep must retain the original\
ck('boot2:replay-timer', doc2.getElementById('hud-timer').textContent === '0:08', doc2.getElementById('hud-timer').textContent);
(function () {
  const lv = LEVELS[0]; const maxW = Math.min(500, 480 - 16), maxH = 640 - 100;
  const cs = Math.max(Math.min(maxW / (lv.gridC + 1), maxH / (lv.gridR + 1)), 28);
  for (const e of SOLS['1']) {
    const p = e.split(/[-,]/); const r1 = +p[0], c1 = +p[1], r2 = +p[2], c2 = +p[3];
    let x, y;
    if (r1 === r2) { const c = Math.min(c1, c2); x = 10 + (c + 0.5) * cs; y = 10 + r1 * cs; }
    else { const r = Math.min(r1, r2); x = 10 + c1 * cs; y = 10 + (r + 0.5) * cs; }
    doc2.getElementById('game-canvas').dispatch('pointerdown', { clientX: x, clientY: y });
  }
})();
g2.pump(30);
ck('boot2:replay-win', doc2.getElementById('win-overlay').classList.contains('active'));
const sv2 = JSON.parse(g2.ls.getItem('hotaru-beam') || '{}');
ck('boot2:best-time-kept-min', sv2.levels && sv2.levels[1] && sv2.levels[1].time === t1Recorded,
  't1=' + t1Recorded + ' now=' + (sv2.levels && sv2.levels[1] && sv2.levels[1].time));

// title How-to-Play path (on boot2 after replay)
(function () {
  g2.sandbox.dispatchEvent({ type: 'beforeunload' });
})();
ck('boot2:beforeunload-no-crash', errs(g2).length === 0, errs(g2).slice(0, 3).join('; '));

ck('final:no-runtime-errors', errs(g).length === 0 && errs(g2).length === 0);

notes.push('win-oracle: per-level win requires every pointerdown to land exactly on its intended edge midpoint — "won===true" certifies the whole click path');
notes.push('P2 fixed: visibilitychange resume used startTimer() which zeroed the elapsed timer');
notes.push('P3 fixed: saveProgress kept overwriting best time (win overlay "Best" could regress); win overlay now guarded against firing after leaving the game screen');
notes.push('P3 noted: #total-stars HUD span is never populated (no star system)');

console.log(JSON.stringify({ pass: pass, fail: fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails, extra: { engineBugsFixed: [
  'P0: 29/30 shipped levels unsolvable under engine checkSolved (L2 forced-contradiction proof; L3-L7 exhaustive search) — regenerated solution-first with tier/grid/circle-count/numbered-density preserved',
  'P2: visibilitychange resume reset the level timer to 0:00 (elapsed time lost on tab switch)',
  'P3: saveProgress overwrote best time each win (Best could regress); win overlay could pop after leaving game screen'
], notes: notes } }));
process.exit(fail === 0 ? 0 : 1);
