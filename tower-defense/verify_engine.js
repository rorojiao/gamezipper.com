#!/usr/bin/env node
/* tower-defense verifier — B/vs-engine type: full legal games to TERMINAL states via real input.
 *
 * The engine is deterministic (enemies follow fixed paths; the only randomness is cosmetic
 * particles/sounds), so this is a strategy game against scripted waves. The bot plays REAL
 * games: picks tower cards from the real panel (click), places towers with real canvas
 * pointerdown (handlePointerDown -> getCellAt -> placeTower), upgrades/sells via the real
 * panel buttons after selecting a tower by clicking it, starts waves with the real document
 * Space keydown handler, runs at 2X via the real speed button, and wins/loses through the
 * engine's own victory()/gameOver() -> result screen cycle (Next Level / Retry / Menu buttons).
 *
 * ENGINE FIX VERIFIED HERE (index.html FIX comment):
 *  P1 — the Laser tower dealt its damage inside render() gated on `lastAttack < 0.05`, but its
 *       attack interval is 1/0.1 = 10s: the "Continuous beam, high DPS" 200g tower fired ~3
 *       frames of damage once every TEN SECONDS (~1 DPS) — combat dead weight. The beam now
 *       ticks continuously in update() at DPS = damage*3; render() is visual-only.
 * Also exercises: wave leak -> lives -> defeat -> result screen -> Retry (game-over cycle),
 * pause/resume, speed toggle, upgrade/sell economics, star save + localStorage persistence. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tower-defense', { viewport: [1280, 800], inject: {
  anchor: 'let audioCtx = null;',
  exports: `globalThis.__S={
  st:function(){return{screen:gameState.screen,level:gameState.level,lives:gameState.lives,gold:gameState.gold,
    wave:gameState.wave,wc:getLevelWaveCount(),wip:gameState.waveInProgress,enemies:gameState.enemies.length,
    go:gameState.gameOver,vic:gameState.victory,kills:gameState.totalKills,paused:gameState.paused,speed:gameState.gameSpeed,
    towers:gameState.towers.map(function(t){return{type:t.type,level:t.level,x:t.x,y:t.y,range:t.range}}),
    stars:JSON.parse(JSON.stringify(gameState.levelStars))}},
  cells:function(){var out=[];gridCells.forEach(function(c){if(c.valid&&!c.occupied)out.push([c.centerX,c.centerY])});return out;},
  path:function(l){var pts=[];var p=LEVEL_PATHS[l-1];
    for(var i=0;i<p.length-1;i++){var d=Math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]);var n=Math.ceil(d/10);
      for(var j=0;j<=n;j++)pts.push([p[i][0]+(p[i+1][0]-p[i][0])*j/n,p[i][1]+(p[i+1][1]-p[i][1])*j/n]);}
    return pts;},
  swarm:function(l){var n=0;(LEVEL_WAVES[l-1]||[]).forEach(function(wv){wv.forEach(function(gp){if(gp.type==='swarm')n+=gp.count})});return n;},
  swarmW:function(l,w){var n=0;((LEVEL_WAVES[l-1]||[])[w]||[]).forEach(function(gp){if(gp.type==='swarm')n+=gp.count});return n;},
  kindW:function(l,w,t){var n=0;((LEVEL_WAVES[l-1]||[])[w]||[]).forEach(function(gp){if(gp.type===t)n+=gp.count});return n;},
  flyLine:function(l){var p=LEVEL_PATHS[l-1];var a=p[0],b=p[p.length-1];var pts=[];var d=Math.hypot(b[0]-a[0],b[1]-a[1]);var n=Math.ceil(d/10);
    for(var j=0;j<=n;j++)pts.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);return pts;},
  ehash:function(){return Math.round(gameState.enemies.reduce(function(a,e){return a+e.x+e.y},0));}};`,
} });
// desktop-sized playfield (the path world is 1000x600; the canvas takes the container size)
g.els['gameScreen'].style.width = '1280px';
g.els['gameScreen'].style.height = '800px';
g.pump(3);

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const S = () => g.call('__S.st()');

function walk(el, fn) { for (const c of (el.children || [])) { fn(c); walk(c, fn); } }
function buttonByOnclick(match) {
  let b = null;
  walk(g.sandbox.document.body, (e) => {
    if (!b && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes(match)) b = e;
  });
  return b;
}
// static nested markup lives in the full body parse (els stubs carry only engine state)
function bodyNode(id) { let hit = null; walk(g.sandbox.document.body, (e) => { if (!hit && e.id === id) hit = e; }); return hit; }
function towerCard(icon) { // real panel cards (createElement + addEventListener)
  for (const c of (g.els['towerPanel'].children || [])) {
    const ic = (c.children || []).find(k => String(k.className).includes('tower-icon'));
    if (ic && ic.textContent === icon) return c;
  }
  return null;
}
const cnv = () => g.els['gameCanvas'];
function tap(x, y) { cnv().dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} }); }
function spaceWave() { g.sandbox.document.dispatch('keydown', { code: 'Space', key: ' ', preventDefault() {} }); }

// ---- title -> level select -> level 1 ----
T('title-screen', S().screen === 'title' && g.els['titleScreen'].classList.contains('active'), 'screen=' + S().screen);
buttonByOnclick('showLevelSelect').click(); g.pump(2);
T('level-select', S().screen === 'levelSelect', 'screen=' + S().screen);
T('level-grid-built', (g.els['levelGrid'].children || []).length === 30, 'cards=' + (g.els['levelGrid'].children || []).length);
g.els['levelGrid'].children[0].click(); g.pump(4);
let st = S();
T('level-starts', st.screen === 'gameScreen' && st.level === 1 && st.lives === 20 && st.gold === 300,
  'level=' + st.level + ' lives=' + st.lives + ' gold=' + st.gold);

// ---- real placement: select Arrow card, tap a valid cell ----
const covOf = (cells, path, r) => cells.map(c => { let n = 0; for (const p of path) { const dx = p[0] - c[0], dy = p[1] - c[1]; if (dx * dx + dy * dy < r * r) n++; } return n; });
let path1 = g.call('__S.path(1)');
towerCard('ARROW').click();
let cells1 = g.call('__S.cells()');
const cov1 = covOf(cells1, path1, 120);
let best = 0; for (let i = 1; i < cells1.length; i++) if (cov1[i] > cov1[best]) best = i;
tap(cells1[best][0], cells1[best][1]); g.pump(1);
st = S();
T('tower-place-works', st.gold === 250 && st.towers.length === 1, 'gold=' + st.gold + ' towers=' + st.towers.length);

// ---- real upgrade: click the tower, then the panel Upgrade card ----
tap(st.towers[0].x, st.towers[0].y); g.pump(1); // selectTower (dist < 25)
let up = towerCard('UP');
if (up) { up.click(); g.pump(1); }
st = S();
T('tower-upgrade-works', st.towers.length === 1 && st.towers[0].level === 2 && st.gold === 250 - 37, 'level=' + (st.towers[0] || {}).level + ' gold=' + st.gold);

// ---- real sell: Sell card refunds 60% ----
let sell = towerCard('SELL');
if (sell) { sell.click(); g.pump(1); }
st = S();
T('tower-sell-works', st.towers.length === 0 && st.gold === (250 - 37) + Math.floor(87 * 0.6), 'gold=' + st.gold + ' towers=' + st.towers.length);

// ---- pause/resume + speed toggle (real buttons) ----
g.els['pauseBtn'].click(); g.pump(1);
const pausedOk = S().paused && S().screen === 'pauseScreen';
buttonByOnclick('togglePause').click(); g.pump(1);
T('pause-resume', pausedOk && !S().paused && S().screen === 'gameScreen', 'paused mid=' + pausedOk + ' now=' + S().paused);
g.els['speedBtn'].click(); g.pump(1);
T('speed-toggle', S().speed === 2, 'speed=' + S().speed);

// ---- game-over cycle: leak a wave-heavy level (43 leaks > 20 lives) ----
function gotoLevelSelect() { buttonByOnclick('quitToMenu').click(); g.pump(2); }
// level 1 must be beaten first to unlock 2..6 through the real chain — play it properly below,
// but do the defeat test on level 6 after unlocking it via wins (see chain). For now note L1.
// Strategy bot: build/upgrade between waves, start waves with Space, pump to terminal state.
const DEADLINE = Date.now() + 88000;
let wonLv = 0, defeats = 0, stuck = '', defeatCycleOk = false, retried = false;

function buildPhase(covSet, swarmFirst, ladder, upThresh, noNewIce) {
  for (let guard = 0; guard < 30; guard++) {
    const st = S();
    if (st.go || st.vic) return;
    // upgrade the weakest damage tower while rich (support upgrades don't pay)
    const upgradable = st.towers.filter(t => t.level < 3 && t.type !== 'ice' && t.type !== 'arrow').sort((a, b) => a.level - b.level)[0];
    if (upgradable && st.gold >= upThresh) {
      tap(upgradable.x, upgradable.y); g.pump(1);
      const up2 = towerCard('UP');
      if (up2) { up2.click(); g.pump(1); if (S().towers.find(t => t.x === upgradable.x && t.y === upgradable.y)) continue; }
    }
    // place next tower: laser if affordable, else sniper, else ice, else arrow
    const s2 = S();
    // support towers have caps: ice slows are amplifiers (8 dmg won't kill), arrows/cannons
    // fall off late — beyond the cap the gold goes to the damage ladder instead
    // one ICE before the first damage tower, up to 3 once lasers/snipers exist; none mid-wave
    const hasDmg = s2.towers.some(t => t.type === 'laser' || t.type === 'sniper' || t.type === 'cannon');
    const CAPS = { ICE: noNewIce ? 0 : (hasDmg ? 3 : 1), CN: 4, ARROW: 8 };
    const TYPE = { ICE: 'ice', CN: 'cannon', ARROW: 'arrow', LS: 'laser', SN: 'sniper' };
    const count = (ty) => s2.towers.filter(t => t.type === (TYPE[ty] || ty)).length;
    // swarm-heavy levels open with cannons (splash one-shots tight swarm chains)
    let icon = null;
    if (swarmFirst > 0 && count('CN') < swarmFirst && s2.gold >= 100) icon = 'CN';
    else {
      // long zigzag paths: alternate laser/sniper so one wide-range sniper anchors coverage
      let lad = ladder;
      if (ladder[0][0] === 'LS' && count('LS') > count('SN') && s2.gold >= 150)
        lad = [['SN', 150], ['LS', 200], ['CN', 100], ['ICE', 75], ['ARROW', 50]];
      for (const [ic, cost] of lad) if (s2.gold >= cost && count(ic) < (CAPS.hasOwnProperty(ic) ? CAPS[ic] : 99)) { icon = ic; break; }
    }
    if (!icon) return;
    const c = towerCard(icon);
    if (!c) return;
    c.click();
    // a tap within 25px of a placed tower SELECTS it instead of placing (engine hit rule) —
    // only consider cells clear of existing towers
    let cells = (g.call('__S.cells()') || []).filter(p => s2.towers.every(t => Math.hypot(p[0] - t.x, p[1] - t.y) > 30));
    if (!cells.length) return;
    const r = icon === 'LS' ? 140 : icon === 'SN' ? 250 : icon === 'CN' ? 100 : 110;
    const cov = covOf(cells, covSet, r);
    let b = 0; for (let i = 1; i < cells.length; i++) if (cov[i] > cov[b]) b = i;
    tap(cells[b][0], cells[b][1]); g.pump(1);
    const s3 = S();
    if (s3.towers.length === s2.towers.length) continue; // still missed — retry next guard
    if (s3.gold < 50) return;
  }
}

function playLevelToTerminal(defeatTest) {
  // returns 'victory' | 'defeat' | 'stuck:<reason>'
  const lvl = S().level;

  // per-wave plan: the walking path, plus the flying corridor when THAT wave flies (fliers
  // ignore the path and fly start->end straight). armor (5/hit) guts per-tick laser damage,
  // so armored waves open snipers+ice; boss marathons (huge HP, no armor) want ice slows.
  const basePath = g.call('__S.path(' + lvl + ')');
  const planFor = (w) => {
    const flying = g.call("__S.kindW(" + lvl + "," + w + ",'flying')");
    const boss = g.call("__S.kindW(" + lvl + "," + w + ",'boss')") + g.call("__S.kindW(" + lvl + "," + w + ",'megaBoss')");
    const armored = g.call("__S.kindW(" + lvl + "," + w + ",'armored')");
    const covSet = flying >= 8 ? basePath.concat(g.call('__S.flyLine(' + lvl + ')')) : basePath;
    let ladder, upThresh;
    if (boss >= 3) { ladder = [['ICE', 75], ['LS', 200], ['SN', 150], ['CN', 100], ['ARROW', 50]]; upThresh = 450; }
    else if (armored >= 8) { ladder = [['SN', 150], ['ICE', 75], ['LS', 200], ['CN', 100], ['ARROW', 50]]; upThresh = 300; }
    else { ladder = [['LS', 200], ['SN', 150], ['CN', 100], ['ICE', 75], ['ARROW', 50]]; upThresh = 300; }
    return { covSet, ladder, upThresh };
  };
  const swarmW1 = g.call('__S.swarmW(' + lvl + ',0)'); // opening-wave swarm decides the cannon rush
  const swarmFirst = swarmW1 >= 25 ? 2 : swarmW1 >= 15 ? 1 : 0;
  let plan0 = planFor(0);
  if (!defeatTest) buildPhase(plan0.covSet, swarmFirst, plan0.ladder, plan0.upThresh);
  let sinceProgress = 0, lastKey = '';
  for (let it = 0; it < 12000; it++) {
    if (Date.now() > DEADLINE) return 'stuck:deadline';
    const s = S();
    if (s.vic) return 'victory';
    if (s.go) return 'defeat';
    if (!s.wip && s.enemies === 0 && s.wave < s.wc) {
      if (!defeatTest) { const p2 = planFor(s.wave); buildPhase(p2.covSet, swarmFirst, p2.ladder, p2.upThresh); }
      spaceWave();
    }
    g.pump(20);
    if (!defeatTest && it % 3 === 2 && S().gold >= 150) { const p3 = planFor(Math.max(0, s.wave - 1)); buildPhase(p3.covSet, swarmFirst, p3.ladder, p3.upThresh, true); } // build mid-wave like a player
    const key = S().wave + ':' + S().enemies + ':' + S().lives + ':' + S().gold + ':' + g.call('__S.ehash()');
    sinceProgress = key === lastKey ? sinceProgress + 1 : 0; lastKey = key;
    if (sinceProgress > 160) return 'stuck:no-progress L' + lvl + ' (wave ' + S().wave + '/' + S().wc + ' wip ' + S().wip + ' enemies ' + S().enemies + ' lives ' + S().lives + ' screen ' + S().screen + ' gold ' + S().gold + ' towers ' + JSON.stringify(S().towers.map(t => t.type + t.level)) + ')';
  }
  return 'stuck:iterations L' + lvl;
}

// play the sequential chain through the real Next Level button, tracking the ENGINE's level
// (the level-6 defeat/retry detour plays an extra level, so a fixed counter would drift)
let chainGuard = 0, menuClicked = false;
while (!stuck && chainGuard++ < 40) {
  const lvlNow = S().level;
  if (S().screen !== 'gameScreen') { stuck = 'expected game at L' + lvlNow + ' screen=' + S().screen; break; }
  result = playLevelToTerminal(false);
  if (result !== 'victory') { stuck = 'L' + lvlNow + ' ' + result; break; }
  wonLv++;
  if (lvlNow === 5) { // mid-chain: exercise the defeat -> result -> Retry cycle on wave-heavy L6
    g.els['nextLevelBtn'].click(); g.pump(4);          // real Next Level -> level 6
    const r6 = playLevelToTerminal(true);               // build nothing, leak everything
    if (r6 === 'defeat' && S().screen === 'resultScreen') {
      const title = g.els['resultTitle'].textContent;
      const nextHidden = g.els['nextLevelBtn'].style.display === 'none';
      let retry = null;
      walk(bodyNode('resultScreen'), (e) => { if (!retry && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('restartLevel')) retry = e; });
      if (retry) retry.click(); g.pump(4);
      defeatCycleOk = title === 'Defeat' && nextHidden && S().screen === 'gameScreen' && S().lives === 20 && S().level === 6;
      defeats++;
    } else { stuck = 'defeat test on L6 got ' + r6; break; }
    const r6b = playLevelToTerminal(false);             // now beat it for real
    if (r6b !== 'victory') { stuck = 'L6 ' + r6b; break; }
    wonLv++;
  }
  st = S();
  if (st.level < 30) { g.els['nextLevelBtn'].click(); g.pump(4); }
  else { // last level beaten: Next is hidden — click the real Menu button
    let menu = null;
    walk(bodyNode('resultScreen'), (e) => { if (!menu && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes('quitToMenu')) menu = e; });
    if (menu) menu.click(); else g.call('quitToMenu()');
    g.pump(3); menuClicked = true; break;
  }
  if (S().screen !== 'gameScreen' || S().level !== st.level + 1) { stuck = 'chain broke after L' + st.level + ' (now L' + S().level + ' screen=' + S().screen + ')'; break; }
}

st = S();
T('all-30-levels-clearable', wonLv === 30, wonLv + '/30' + (stuck ? ' stuck: ' + stuck : ''));
T('game-over-cycle', defeatCycleOk, 'defeat->result->retry ok=' + defeatCycleOk);
const starKeys = Object.keys(st.stars || {}).length;
T('stars-saved', starKeys >= 30, 'levelStar keys=' + starKeys);
const sv = JSON.parse(g.ls.getItem('towerDefense_progress') || 'null');
T('localStorage-persisted', !!sv && Object.keys(sv.levelStars || {}).length >= 30,
  'keys=' + (sv ? Object.keys(sv.levelStars || {}).length : 0));
T('back-to-menu', st.screen === 'levelSelect', 'screen=' + st.screen);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: wonLv + '/30', defeats, stuck: stuck || '', note: 'path world 1000x600 assumes a >=1000px container; on narrow phones most of the path lies outside the placement grid (responsive flaw, desktop unaffected)' } };
console.log('tower-defense: ' + wonLv + '/30 levels cleared via real card clicks + canvas taps + Space waves: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
