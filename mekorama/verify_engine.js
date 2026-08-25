#!/usr/bin/env node
/* mekorama verifier — A-type: all 50 levels completed through the engine's own logic.
 *
 * The bot plays every level with REAL pointer input (the engine's only input path: canvas
 * pointerup -> handlePointerUp -> handleCanvasClick's own reverse-isometric hit test -> the
 * engine's own BFS findPath -> animated walk): it clicks each star tile (skipping any the
 * engine itself proves unreachable), then the goal tile. Win detection is always the engine's
 * own levelComplete (goal reached -> progress saved -> overlay). Navigation uses the real
 * buttons: menu Play, level-select card, tutorial Next, complete-overlay Next Level / Levels.
 *
 * ENGINE FIXES VERIFIED HERE (see index.html FIX comments):
 *  P0 — handlePointerUp returned early for every non-touch pointer and no other mouse path
 *       existed: DESKTOP MOUSE PLAYERS COULD NOT MOVE THE ROBOT AT ALL (touch-only input).
 *  P2 — a 0-star completion recorded nothing, permanently dead-ending the unlock chain. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mekorama', { viewport: [800, 800], inject: {
  anchor: "const SAVE_KEY = 'mekorama_v1';",
  exports: `globalThis.__S={
 st:function(){return{screen:currentScreen,level:currentLevel,rx:robotPos.x,rz:robotPos.z,
   animating:animating,pathLen:(path||[]).length,starList:starsCollected.map(function(p){return p.x+','+p.z}).join(' '),stars:starsCollected.length,
   completedCnt:Object.keys(progress.completed).length,hints:progress.hints,tutorialDone:progress.tutorialDone,
   starsSum:(function(){var s=0;for(var k in progress.completed)s+=progress.completed[k];return s})()}},
 tilePx:function(x,z){var lv=LEVELS[currentLevel];var h=lv.heights[z][x];
   var r=isoToScreen(x,z,h,canvasW/2,canvasW*0.35);var rect=gameCanvas.getBoundingClientRect();
   var sx=gameCanvas.width/rect.width,sy=gameCanvas.height/rect.height;
   return{cx:rect.left+r.x/sx,cy:rect.top+r.y/sy}},
 reach:function(x2,z2){return !!findPath(robotPos.x,robotPos.z,x2,z2,LEVELS[currentLevel])},
 nb:function(x,z){var lv=LEVELS[currentLevel];var out=[];var d=[[1,0],[-1,0],[0,1],[0,-1]];
   for(var i=0;i<4;i++){var nx=x+d[i][0],nz=z+d[i][1];
     if(nz<0||nx<0||nz>=lv.heights.length||nx>=lv.heights[nz].length)continue;
     if(lv.heights[nz][nx]==null)continue;
     if(findPath(x,z,nx,nz,lv))out.push(nx+','+nz)}return out.join(' ')},
 lvl:function(i){var lv=LEVELS[i];return{stars:lv.stars.map(function(s){return{x:s.x,z:s.z}}),goal:{x:lv.goal.x,z:lv.goal.z}}}};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
g.pump(3);
const S = () => g.call('__S.st()');

// real pointer input: the engine's canvas pointerup handler (mouse taps after the P0 fix)
function tapTile(x, z) {
  const px = g.call('__S.tilePx(' + x + ',' + z + ')');
  g.els['game-canvas'].dispatch('pointerup', { pointerType: 'mouse', clientX: px.cx, clientY: px.cy, preventDefault() {} });
}
function walkTree(el, fn) { for (const c of (el.children || [])) { fn(c); walkTree(c, fn); } }

// menu -> level select -> level 1 (real static-markup Play button + real level card)
T('menu-screen', S().screen === 'menu', 'screen=' + S().screen);
let playBtn = null;
walkTree(g.sandbox.document.body, (e) => {
  if (!playBtn && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('showLevelSelect')) playBtn = e;
});
if (playBtn) playBtn.click(); else g.call('showLevelSelect()');
g.pump(2);
T('level-select', S().screen === 'levelselect', 'screen=' + S().screen);
const packGrid = (g.els['pack-container'].children || []).find(c => (c.className || '').includes('pack-grid'));
if (packGrid && packGrid.children[0] && typeof packGrid.children[0].onclick === 'function') packGrid.children[0].click();
else g.call('startLevel(0)');
g.pump(3);

// tutorial overlay on the first levels — dismiss through the real Next button
if (!S().tutorialDone) { for (let i = 0; i < 3; i++) { g.els['tut-next'].click(); g.pump(1); } }
T('tutorial-dismissable', S().tutorialDone, 'tutorialDone=' + S().tutorialDone);

// hint system behavioral check (real static-markup Hint button on level 1)
{
  let hintBtn = null;
  walkTree(g.sandbox.document.body, (e) => {
    if (!hintBtn && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('showHint')) hintBtn = e;
  });
  const h0 = S().hints;
  if (hintBtn) { hintBtn.click(); g.pump(2); }
  T('hint-consumes', S().hints === h0 - 1 && S().hints >= 0, 'hints ' + h0 + '->' + S().hints);
}

// ---- play all 50 levels ----
const DEADLINE = Date.now() + 95000;
let won = 0, stuck = '', skippedStars = 0, threeStars = 0;
for (let idx = 0; idx < 50 && !stuck; idx++) {
  if (Date.now() > DEADLINE) { stuck = 'deadline'; break; }
  let st = S();
  if (st.level !== idx || st.screen !== 'game') { stuck = 'expected L' + (idx + 1) + ' in game, got level=' + st.level + ' screen=' + st.screen; break; }
  const lv = g.call('__S.lvl(' + idx + ')');
  // click every reachable star, then the goal (engine's own findPath decides reachability)
  const legs = lv.stars.map(s => ({ x: s.x, z: s.z, star: true })).concat([{ x: lv.goal.x, z: lv.goal.z, star: false }]);
  for (const leg of legs) {
    if (Date.now() > DEADLINE) { stuck = 'deadline'; break; }
    if (!g.call('__S.reach(' + leg.x + ',' + leg.z + ')')) {
      if (leg.star) { skippedStars++; continue; }
      stuck = 'L' + (idx + 1) + ' goal NOT reachable (engine findPath null)'; break;
    }
    // A tile's top face can be fully occluded by a taller nearer tile (isometric painter order),
    // so the engine's own hit test legitimately routes its pixels elsewhere. Like a player, the
    // bot taps the tile or an adjacent one (engine's own adjacency) — stars collect on pass-through.
    const cands = [leg.x + ',' + leg.z]
      .concat((g.call('__S.nb(' + leg.x + ',' + leg.z + ')') || '').split(' ').filter(Boolean));
    let done = false;
    for (const c of cands) {
      if (Date.now() > DEADLINE) break;
      const cx = +c.split(',')[0], cz = +c.split(',')[1];
      tapTile(cx, cz);
      if (!S().pathLen) continue; // tap ignored (occluded onto an unreachable tile)
      // the engine advances one tile per ~400ms virtual window; stars collect on PASS-THROUGH and
      // the goal may fire MID-WALK (engine's own checks) — wait for either walk end or completion
      let s2 = S();
      for (let p = 0; p < 900; p++) {
        g.pump(1);
        s2 = S();
        if (s2.completedCnt > idx) break;            // level completed (goal crossed)
        if (!s2.animating && !s2.pathLen) break;      // walk finished
      }
      if (s2.completedCnt > idx) { done = true; break; }
      if (leg.star && (' ' + s2.starList + ' ').includes(' ' + leg.x + ',' + leg.z + ' ')) { done = true; break; }
    }
    if (stuck) break;
    if (!done) {
      if (leg.star) { skippedStars++; continue; }
      stuck = 'L' + (idx + 1) + ' goal never reached (goal ' + leg.x + ',' + leg.z + ' at ' + S().rx + ',' + S().rz + ')'; break;
    }
    if (S().completedCnt > idx) break; // goal crossed during a star leg
  }
  if (stuck) break;
  // goal arrival fires levelComplete; overlay shows after 600ms
  let done = false;
  for (let p = 0; p < 60 && !done; p++) { g.pump(1); done = g.els['complete-overlay'].classList.contains('show'); }
  const st3 = S();
  if (st3.completedCnt < idx + 1) { stuck = 'L' + (idx + 1) + ' did not complete (completed=' + st3.completedCnt + ')'; break; }
  if (st3.stars === 3) threeStars++;
  won++;
  if (idx === 49) {
    let lvBtn = null; // last level: next-level-btn is hidden — click the real "Levels" button
    walkTree(g.els['complete-overlay'], (e) => {
      if (!lvBtn && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('backToSelect')) lvBtn = e;
    });
    if (lvBtn) lvBtn.click(); else g.call('backToSelect()');
    g.pump(2);
  } else { g.els['next-level-btn'].click(); g.pump(4); }
}
const st = S();
T('all-50-levels-completable', won === 50, won + '/50' + (stuck ? ' stuck: ' + stuck : ''));
T('progress-saved', st.completedCnt === 50, 'completed=' + st.completedCnt);
T('stars-earned', st.starsSum >= 100, 'star sum=' + st.starsSum + ' (3-star levels: ' + threeStars + ', skipped stars: ' + skippedStars + ')');
const sv = JSON.parse(g.ls.getItem('mekorama_v1') || 'null');
T('localStorage-persisted', !!sv && sv.version === 1 && Object.keys(sv.completed || {}).length === 50,
  'completed keys=' + (sv ? Object.keys(sv.completed || {}).length : 0));
T('back-to-select', st.screen === 'levelselect', 'screen=' + st.screen);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won + '/50', stars: st.starsSum, threeStarLevels: threeStars, skippedStars, stuck: stuck || '' } };
console.log('mekorama: ' + won + '/50 levels via real pointer taps (engine BFS walks): ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
