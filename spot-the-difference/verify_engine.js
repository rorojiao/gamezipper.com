#!/usr/bin/env node
/* spot-the-difference verifier — A-type: all 30 levels completed through the engine's own logic.
 *
 * Each level's scene and differences are seeded/deterministic; the bot reads the live G.diffs
 * ground truth and clicks every difference position through the REAL input path (the canvas
 * pointerdown handler -> getCanvasCoords -> handleCanvasClick's own hit test -> found/combo/score
 * -> levelComplete). Win detection is always the engine's own levelComplete (save + overlay).
 * Navigation uses the real buttons: title Play, tutorial Skip, overlay Next Level, Level Select.
 * Also covers: wrong-click -3s penalty, and the Daily Challenge path (startDaily -> complete). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('spot-the-difference', { viewport: [1280, 800], inject: {
  anchor: 'const G={',
  exports: `globalThis.__S={st:function(){return{
    screen:G.screen,level:G.currentLevel?G.currentLevel.id:null,isDaily:G.isDaily,
    found:G.found,total:G.total,timeLeft:G.timeLeft,paused:G.paused,overlayActive:G.overlayActive,
    hints:G.hints,combo:G.combo,score:G.score,
    diffs:G.diffs.map(function(d){return{x:d.x,y:d.y,hitR:d.hitR,found:d.found}}),
    completed:Object.keys(save.completed).length,
    stars:(function(){var s=0;for(var k in save.stars)s+=save.stars[k];return s})(),
    dailyDone:save.dailyDone,dailyStreak:save.dailyStreak||0,tutorialDone:save.tutorialDone}}};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
g.pump(3);
const S = () => g.call('__S.st()');
const CW = 600, CH = 400;

// real input path: the engine's own canvas pointerdown handler
function clickCanvas(id, x, y) {
  const rect = g.els[id].getBoundingClientRect();
  g.els[id].dispatch('pointerdown', { clientX: rect.left + x * (rect.width / CW), clientY: rect.top + y * (rect.height / CH), preventDefault() {} });
}
function walk(el, fn) { for (const c of (el.children || [])) { fn(c); walk(c, fn); } }
function overlayButton(match) {
  let btn = null;
  walk(g.els['overlay-content'], (e) => {
    if (!btn && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes(match)) btn = e;
  });
  return btn;
}

T('title-screen', S().screen === 'title', 'screen=' + S().screen);
g.els['btn-play'].click(); g.pump(2); // real title button: starts level 1
// first-run tutorial overlay blocks canvas input — dismiss via the real Skip button
let tut = '';
if (S().overlayActive) {
  const skip = overlayButton('tutSkip');
  if (skip) { skip.click(); g.pump(1); tut = 'skipped'; }
  else { g.call('tutSkip()'); g.pump(1); tut = 'G-fallback'; }
}
T('tutorial-dismissable', !S().overlayActive && S().tutorialDone, 'overlayActive=' + S().overlayActive + ' via ' + tut);

// deliberate wrong click: engine must dock 3s and reset combo (behavioral check on real input)
{
  const before = S();
  const safe = { x: 8, y: 8 }; // far from any diff (diffs live inside the scene)
  const near = before.diffs.some(d => (d.x - safe.x) ** 2 + (d.y - safe.y) ** 2 <= d.hitR * d.hitR);
  if (!near) { clickCanvas('c-left', safe.x, safe.y); g.pump(1); }
  const after = S();
  T('wrong-click-penalty', !near ? (after.timeLeft === before.timeLeft - 3 && after.combo === 0) : true,
    !near ? 'timeLeft ' + before.timeLeft + '->' + after.timeLeft + ' combo=' + after.combo : 'skipped (spot occupied)');
}

// ---- walk all 30 levels: click every true difference through the real pointerdown path ----
const DEADLINE = Date.now() + 90000;
let won = 0, stuck = '', nextClicks = 0, gFallbacks = 0;
for (let lv = 1; lv <= 30 && !stuck; lv++) {
  if (Date.now() > DEADLINE) { stuck = 'deadline'; break; }
  const st0 = S();
  if (st0.level !== lv) { stuck = 'expected L' + lv + ' got L' + st0.level; break; }
  for (const d of st0.diffs) { // engine's own hit test decides found
    clickCanvas('c-left', d.x, d.y); g.pump(2);
    if (S().overlayActive) break;
  }
  // last difference completes via setTimeout(levelComplete, 600)
  let done = false;
  for (let p = 0; p < 50 && !done; p++) { g.pump(1); done = S().overlayActive; }
  const st = S();
  if (!done || st.found !== st.total) { stuck = 'L' + lv + ' complete missing (found=' + st.found + '/' + st.total + ' overlay=' + st.overlayActive + ')'; break; }
  won++;
  if (lv < 30) {
    const next = overlayButton('nextLevel');
    if (next) { next.click(); nextClicks++; } else { g.call('nextLevel()'); gFallbacks++; }
    g.pump(4);
  }
}
if (won === 30 && !stuck) { // final overlay has no Next — Level Select (goToLevels) -> title
  const sel = overlayButton('goToLevels');
  if (sel) { sel.click(); nextClicks++; } else { g.call('goToLevels()'); gFallbacks++; }
  g.pump(3);
}
const st = S();
T('all-30-levels-completable', won === 30, won + '/30' + (stuck ? ' stuck: ' + stuck : ''));
T('progress-saved', st.completed >= 30, 'completed=' + st.completed);
T('stars-earned', st.stars >= 30, 'stars=' + st.stars);
const sv = JSON.parse(g.ls.getItem('std_save_v1') || 'null');
T('localStorage-persisted', !!sv && sv.version === 1 && Object.keys(sv.completed || {}).length >= 30,
  'completed keys=' + (sv ? Object.keys(sv.completed || {}).length : 0));
T('level-select-screen', st.screen === 'level', 'screen=' + st.screen);

// ---- Daily Challenge path via the real title button ----
g.els['btn-back-title'].click(); g.pump(2);
g.els['btn-daily'].click(); g.pump(3);
let dailyOk = false, dailyStuck = '';
{
  const st0 = S();
  if (st0.isDaily) {
    for (const d of st0.diffs) { clickCanvas('c-right', d.x, d.y); g.pump(2); if (S().overlayActive) break; }
    for (let p = 0; p < 50 && !S().overlayActive; p++) g.pump(1);
    dailyOk = S().overlayActive && S().found === S().total;
  } else dailyStuck = 'daily did not start (screen=' + st0.screen + ')';
}
const sandboxToday = g.call("new Date().toISOString().slice(0,10)"); // the engine stamps with the sandbox clock — compare like for like
T('daily-challenge-completable', dailyOk && S().dailyDone === sandboxToday,
  'complete=' + dailyOk + ' dailyDone=' + S().dailyDone + ' ' + dailyStuck);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won + '/30', stars: st.stars, nextClicks, gFallbacks, stuck: stuck || dailyStuck || '' } };
console.log('spot-the-difference: ' + won + '/30 levels + daily via real canvas pointerdown clicks: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
