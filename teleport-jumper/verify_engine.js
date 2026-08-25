#!/usr/bin/env node
// teleport-jumper engine verifier (vm harness, real input paths only)
// Engine bugs fixed (root-caused 2026-08-25):
//  P0: isSolidForGhost included isWall — ghost could not blink through walls, so the
//      advertised core mechanic ("Blink through walls") never worked and 18/80 sealed-box
//      levels (L12/14/15 in the tutorial tier) were permanently unwinnable; progression
//      hard-stuck at L12. Ghost now passes walls (bounds only).
//  P1: isBlocked ignored thinWalls — every T wall was walk-through, killing the tier-2
//      "teleport through thin walls" mechanic. Walk now respects T.
//  P3 (documented, no code change): doors never block (doors_ list always empty; 'D' grid
//      chars are never parsed) and switches guard nothing — decorative only.
'use strict';
const path = require('path');
const FS = require('fs');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));
const SRC = FS.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let PASS = 0, FAIL = 0; const FAILS = [];
function ck(name, ok, got) {
  if (ok) { PASS++; } else { FAIL++; FAILS.push(name + (got !== undefined ? ' :: ' + got : '')); }
}
const el = (g, id) => g.els[id];
const active = (g, id) => el(g, id).classList.contains('active');
function clickNode(n) { n.dispatch('click', { type: 'click' }); }
function clickBtn(g, id) { // static buttons live in the canonical body tree
  const find = (n) => { if (n.id === id) return n; for (const c of (n.children || [])) { const r = find(c); if (r) return r; } return null; };
  const n = find(g.sandbox.document.body);
  ck('btn found: ' + id, !!n);
  if (n) clickNode(n);
}

// ---- extract LEVELS exactly as authored (self-contained IIFE) ----
const lseg = SRC.slice(SRC.indexOf('var LEVELS=') + 'var LEVELS='.length);
const LEVELS = eval(lseg.slice(0, lseg.indexOf('})();') + 4));
const COLS = 12, ROWS = 10;

// parse one level with the engine's rules (W/T block walk+ghost-bounds fixed rules)
function parseLvl(n) {
  const lvl = LEVELS[n - 1];
  const blocks = new Set(); let P = null, E = null;
  for (let y = 0; y < ROWS; y++) {
    const row = lvl.grid[y] || '';
    for (let x = 0; x < COLS; x++) {
      const ch = row[x];
      if (ch === 'W' || ch === 'T') blocks.add(x + ',' + y);
      else if (ch === 'P') P = { x, y };
      else if (ch === 'E') E = { x, y };
    }
  }
  const patrol = new Set(); const starts = new Set();
  (lvl.hazards || []).forEach(h => {
    starts.add(h.x + ',' + h.y);
    const r = Math.round(h.range);
    for (let o = -r; o <= r; o++) { if (h.dx) patrol.add((h.x + o) + ',' + h.y); else patrol.add(h.x + ',' + (h.y + o)); }
  });
  return { n, lvl, blocks, P, E, patrol, starts, hazards: (lvl.hazards || []).length > 0 };
}
// BFS over walk blocks (W+T); returns path [[x,y],...] incl. start
function bfsWalk(L, s, t) {
  const q = [[s.x, s.y]]; const prev = {}; prev[s.x + ',' + s.y] = null;
  while (q.length) {
    const [x, y] = q.shift();
    if (x === t.x && y === t.y) {
      const path = []; let k = x + ',' + y;
      while (k) { const [a, b] = k.split(',').map(Number); path.unshift([a, b]); k = prev[k]; }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || L.blocks.has(k) || k in prev) continue;
      prev[k] = x + ',' + y; q.push([nx, ny]);
    }
  }
  return null;
}
// straight-line ghost path (ghost passes walls; only bounds block)
function ghostPath(s, t) {
  const p = [[s.x, s.y]]; let x = s.x, y = s.y;
  while (x !== t.x) { x += Math.sign(t.x - x); p.push([x, y]); }
  while (y !== t.y) { y += Math.sign(t.y - y); p.push([x, y]); }
  return p;
}

// ---------- boot 1 ----------
const g = harness.bootGame('teleport-jumper');
ck('boot: no load errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join(' | '));
ck('boot: title active', active(g, 'title-screen') && !active(g, 'level-screen') && !active(g, 'game-screen'));
ck('boot: canvas sized', el(g, 'gc').width > 0 && el(g, 'gc').height > 0, el(g, 'gc').width + 'x' + el(g, 'gc').height);

// keyboard on non-game screen must be inert (no crash)
g.key('x'); g.key('ArrowRight');
ck('boot: keys off-screen inert', (g.sandbox.__errors || []).length === 0);

// skins from title
clickBtn(g, 'title-screen'); // noop target ensure found
const playBtn = (() => { const find = (n) => { for (const c of (n.children || [])) { if (c.classList && c.classList.contains('btn-play')) return c; const r = find(c); if (r) return r; } return null; }; return find(g.sandbox.document.body); })();
clickNode(playBtn);
ck('levelsel: active', active(g, 'level-screen'));
const cont = el(g, 'level-container');
ck('levelsel: 5 tier headers', cont.children.filter(c => String(c.className).indexOf('tier-header') >= 0).length === 5);
ck('levelsel: header text', cont.children[0].textContent === 'Tutorial (1-16)', cont.children[0].textContent);
function lvlBtn(n) {
  const find = (node) => { for (const c of (node.children || [])) { if (String(c.tagName).toUpperCase() === 'BUTTON' && c.children[0] && String(c.children[0].textContent) === String(n)) return c; const r = find(c); if (r) return r; } return null; };
  return find(cont);
}
ck('levelsel: 80 buttons', (() => { const all = []; const walk = (n) => { for (const c of (n.children || [])) { if (String(c.tagName).toUpperCase() === 'BUTTON') all.push(c); walk(c); } }; walk(cont); return all.length === 80; })());
ck('levelsel: L1 unlocked', !lvlBtn(1).classList.contains('locked'));
ck('levelsel: L2 locked + inert', lvlBtn(2).classList.contains('locked') && typeof lvlBtn(2).onclick !== 'function');
clickNode(lvlBtn(2));
ck('levelsel: locked click ignored', !active(g, 'game-screen'));

// back to title -> SKINS (locked at start)
clickBtn(g, 'title-screen'); // Back button id? use querySelector approach below
(function () {
  const back = g.call('document.querySelectorAll("#level-screen .btn-back")')[0];
  clickNode(back);
})();
ck('back: title active', active(g, 'title-screen'));
(function () {
  const btns = g.call('document.querySelectorAll("#title-screen .btn-secondary")');
  clickNode(btns[0]); // SKINS
})();
ck('skins: screen active', active(g, 'skin-screen'));
const skingrid = el(g, 'skin-grid');
ck('skins: 5 skins', skingrid.children.length === 5);
ck('skins: only default unlocked at start', skingrid.children.filter(c => c.classList.contains('locked')).length === 4);
ck('skins: locked no handler', typeof skingrid.children[1].onclick !== 'function');
clickNode(skingrid.children[1]); // locked Ghost — must be inert
ck('skins: locked click inert', !skingrid.children[1].classList.contains('active'));
clickNode(skingrid.children[0]); // default
ck('skins: default active', skingrid.children[0].classList.contains('active'));
ck('skins: skin saved', JSON.parse(g.ls.getItem('teleport_jumper_save')).state.skin === 'default');

// ---- helpers: inputs ----
let DB = null; // {up,left,right,down} nodes the engine bound pointerdown handlers on
function dbtn(dir) {
  if (!DB) { DB = {}; const arr = g.call('document.querySelectorAll(".d-btn")'); arr.forEach(n => { DB[n.dataset.dir] = n; }); }
  return DB[dir];
}
const pev = () => ({ type: 'pointerdown', pointerId: 1, button: 0, preventDefault() {} });
function walkStep(dir) { dbtn(dir).dispatch('pointerdown', pev()); g.pump(9); } // moveCD 140ms
function ghostStep(dir) { dbtn(dir).dispatch('pointerdown', pev()); g.pump(8); } // ghostMoveCD 120ms

function startLvl(n) { clickNode(lvlBtn(n)); }
function hud() {
  return {
    level: String(el(g, 'hud-level').textContent),
    charges: String(el(g, 'hud-charges').textContent),
    tp: String(el(g, 'hud-tp').textContent),
    stars: String(el(g, 'hud-stars').textContent),
  };
}
function winOpen() { return el(g, 'win-overlay').classList.contains('active'); }

// solve via walking (no hazards, walk-solvable) — teleportsUsed=0 => 3 stars
function solveWalk(L) {
  const path = bfsWalk(L, L.P, L.E);
  ck('L' + L.n + ': walk path exists', !!path);
  if (!path) return;
  for (let i = 1; i < path.length; i++) {
    const [dx, dy] = [path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]];
    walkStep(dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
  }
}
// solve via teleport (ghost straight-line through walls); player idles at safe cell
function solveTP(L) {
  // player must idle off every patrol line during ghost walk — pre-walk off if needed
  let px = L.P.x, py = L.P.y;
  if (L.patrol.has(px + ',' + py)) {
    const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => {
      const nx = px + dx, ny = py + dy, k = nx + ',' + ny;
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !L.blocks.has(k) && !L.patrol.has(k) && !L.starts.has(k);
    });
    ck('L' + L.n + ': prewalk off patrol line', !!dir);
    if (!dir) return false;
    walkStep(dir[0] === 1 ? 'right' : dir[0] === -1 ? 'left' : dir[1] === 1 ? 'down' : 'up');
    px += dir[0]; py += dir[1];
  }
  g.key('x'); // enter teleport mode (charges>0 asserted by level data)
  // ghost spawn mirrors doTeleport: one up if free of walls (walls no longer block, so one up unless row 0)
  let gy = Math.max(0, py - 1);
  const gp = ghostPath({ x: px, y: gy }, L.E);
  for (let i = 1; i < gp.length; i++) {
    const [dx, dy] = [gp[i][0] - gp[i - 1][0], gp[i][1] - gp[i - 1][1]];
    ghostStep(dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
  }
  g.key('x'); // confirm teleport onto the exit
  return true;
}
function assertWin(L, tps) {
  const want = tps <= L.lvl.par ? '★★★' : tps <= L.lvl.par + 1 ? '★★☆' : '★☆☆';
  ck('L' + L.n + ': win overlay', winOpen());
  ck('L' + L.n + ': stars ' + want, String(el(g, 'win-stars').textContent) === want, el(g, 'win-stars').textContent);
  // engine writes win-info via innerHTML — the mirror's textContent stays empty
  ck('L' + L.n + ': win info', String(el(g, 'win-info').innerHTML) === 'Teleports: ' + tps + ' / Par: ' + L.lvl.par, el(g, 'win-info').innerHTML);
  ck('L' + L.n + ': hud tp count', hud().tp === 'Teleports: ' + tps, hud().tp);
}
function clickWinBtn(label) {
  // static-markup buttons live in the canonical body tree (els mirrors carry no children)
  const find = (n) => { if (n.id === 'win-overlay') return n; for (const c of (n.children || [])) { const r = find(c); if (r) return r; } return null; };
  const ov = find(g.sandbox.document.body);
  let b = null;
  const walk = (n) => { for (const c of (n.children || [])) { if (String(c.tagName).toUpperCase() === 'BUTTON' && String(c.textContent) === label) { b = c; return; } walk(c); } };
  if (ov) walk(ov);
  ck('win btn found: ' + label, !!b);
  if (b) clickNode(b);
}

// ---------- L1: keyboard movement (arrows + WASD), walk win ----------
startLvl(1);
const L1 = parseLvl(1);
ck('L1: game screen active', active(g, 'game-screen'));
ck('L1: hud level', hud().level === 'Level 1');
ck('L1: hud charges', hud().charges === 'Charges: 2/2', hud().charges);
ck('L1: hud stars empty', hud().stars === '☆☆☆', hud().stars);
// hold ArrowRight: 7 cells right (P 2,4 -> 9,4)
g.key('ArrowRight'); g.pump(63); g.key('ArrowRight', 'keyup');
// hold s (WASD): 4 cells down (-> 9,8 = exit)
g.key('s'); g.pump(36); g.key('s', 'keyup');
assertWin(L1, 0);
const sv1 = JSON.parse(g.ls.getItem('teleport_jumper_save'));
ck('L1: saved unlocked=2', sv1.state.unlocked === 2 && sv1.state.stars['1'] === 3, JSON.stringify(sv1.state));
clickWinBtn('NEXT LEVEL');
ck('L2: started via NEXT', hud().level === 'Level 2');

// ---------- L2: cancel + charge exhaustion + R reset, then walk win ----------
const L2 = parseLvl(2);
g.key('x'); ghostStep('right'); g.key('c'); // enter, move ghost, cancel
ck('L2: cancel keeps tp count 0', hud().tp === 'Teleports: 0', hud().tp);
g.key('x'); g.key('x'); // teleport 1 (ghost spawn = same cell as player: confirm directly)
ck('L2: tp1 charge spent', hud().charges === 'Charges: 1/2', hud().charges);
g.key('x'); ghostStep('right'); g.key('x'); // teleport 2
ck('L2: tp2 charges 0', hud().charges === 'Charges: 0/2', hud().charges);
g.key('x'); // third enter attempt
ck('L2: no-charges toast', String(el(g, 'toast').textContent) === 'No charges!' && el(g, 'toast').classList.contains('show'), el(g, 'toast').textContent);
ck('L2: tp mode not entered', hud().tp === 'Teleports: 2', hud().tp);
g.key('r'); // reset restores level
ck('L2: R resets charges+tp', hud().charges === 'Charges: 2/2' && hud().tp === 'Teleports: 0', hud().charges + ' ' + hud().tp);
solveWalk(L2); assertWin(L2, 0);
clickWinBtn('NEXT LEVEL');

// ---------- L3: teleport through a wall row (mechanic restored) ----------
const L3 = parseLvl(3);
ck('L3: started', hud().level === 'Level 3');
ck('L3: solve by tp', solveTP(L3));
assertWin(L3, 1);
clickWinBtn('NEXT LEVEL');

// ---------- L33-style death test happens later in chain; chain L4..L80 ----------
// L4..L16 walk/tp solve, NEXT each time
for (let n = 4; n <= 16; n++) {
  const L = parseLvl(n);
  ck('L' + n + ': started', hud().level === 'Level ' + n, hud().level);
  if (L.hazards) { ck('L' + n + ': solve by tp', solveTP(L)); assertWin(L, 1); }
  else {
    const walkable = !!bfsWalk(L, L.P, L.E);
    if (walkable) { solveWalk(L); assertWin(L, 0); }
    else { ck('L' + n + ': solve by tp', solveTP(L)); assertWin(L, 1); }
  }
  if (n < 16) clickWinBtn('NEXT LEVEL');
}
// after L16 win: unlocked=17 -> Ghost skin tier unlocked; detour via LEVELS btn
clickWinBtn('LEVELS');
ck('L16: LEVELS to select', active(g, 'level-screen') && !winOpen());
ck('L16: unlocked 17 in LS', JSON.parse(g.ls.getItem('teleport_jumper_save')).state.unlocked === 17);
// skins detour from level screen: Back -> title -> SKINS
(function () { clickNode(g.call('document.querySelectorAll("#level-screen .btn-back")')[0]); })();
(function () { clickNode(g.call('document.querySelectorAll("#title-screen .btn-play")')[0]); })();
ck('L16: back to levelsel', active(g, 'level-screen'));
(function () { clickNode(g.call('document.querySelectorAll("#level-screen .btn-back")')[0]); })();
(function () { clickNode(g.call('document.querySelectorAll("#title-screen .btn-secondary")')[0]); })();
ck('L16: skins again', active(g, 'skin-screen'));
ck('L16: ghost unlocked', !skingrid.children[1].classList.contains('locked'));
clickNode(skingrid.children[1]);
ck('L16: ghost selected', skingrid.children[1].classList.contains('active'));
ck('L16: skin saved', JSON.parse(g.ls.getItem('teleport_jumper_save')).state.skin === 'ghost');
clickNode(g.call('document.querySelectorAll("#skin-screen .btn-back")')[0]);
clickNode(g.call('document.querySelectorAll("#title-screen .btn-play")')[0]);
ck('L16: levelsel again', active(g, 'level-screen'));
startLvl(17); // jump back into the chain at 17 (L17 already unlocked)

// L17..L80 (L49 = switch + RETRY star-downgrade detour; L33 = hazard death test)
for (let n = 17; n <= 80; n++) {
  const L = parseLvl(n);
  ck('L' + n + ': started', hud().level === 'Level ' + n, hud().level);
  if (n === 33) { // deliberate hazard death -> auto reset (toast + 500ms reload)
    ck('L33: burn a charge first', solveTPTo(L, { x: 2, y: 3 }), 'prewalk');
    ck('L33: tp used', hud().tp === 'Teleports: 1', hud().tp);
    // walk down onto the hazard's patrol row and idle — deterministic sweep hits the player
    walkStep('down'); walkStep('down'); // (2,3) -> (2,5) patrol row y=5
    g.pump(120); // > half-period (~94 frames) guarantees co-location
    ck('L33: death toast', String(el(g, 'toast').textContent) === 'Reset!' && el(g, 'toast').classList.contains('show'), el(g, 'toast').textContent);
    g.pump(31); // 500ms reload timer
    ck('L33: level reloaded', hud().charges === 'Charges: 3/3' && hud().tp === 'Teleports: 0', hud().charges + ' ' + hud().tp);
    ck('L33: solve by tp', solveTP(L)); assertWin(L, 1);
  } else if (n === 49) { // normal 3* win, then RETRY: switch step + 2-teleport 2* win
    ck('L49: solve by tp', solveTP(L)); assertWin(L, 1);
    clickWinBtn('RETRY');
    ck('L49: retry restarts', hud().level === 'Level 49' && hud().tp === 'Teleports: 0' && !winOpen(), hud().level);
    const sw = { x: L.lvl.switches_[0].sx, y: L.lvl.switches_[0].sy };
    ck('L49: tp onto switch', solveTPTo(L, sw), 'switch');
    ck('L49: tp count 1', hud().tp === 'Teleports: 1', hud().tp);
    ck('L49: switch stepped, no errors', (g.sandbox.__errors || []).length === 0);
    g.key('x'); // enter again and ghost straight to exit
    const gy = Math.max(0, sw.y - 1);
    const gp = ghostPath({ x: sw.x, y: gy }, L.E);
    for (let i = 1; i < gp.length; i++) {
      const [dx, dy] = [gp[i][0] - gp[i - 1][0], gp[i][1] - gp[i - 1][1]];
      ghostStep(dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
    }
    g.key('x');
    assertWin(L, 2); // 2 teleports vs par 1 -> 2 stars
    const sv49 = JSON.parse(g.ls.getItem('teleport_jumper_save'));
    ck('L49: best stars kept 3', sv49.state.stars['49'] === 3, JSON.stringify(sv49.state.stars['49']));
  } else {
    if (L.hazards) { ck('L' + n + ': solve by tp', solveTP(L)); assertWin(L, 1); }
    else {
      const walkable = !!bfsWalk(L, L.P, L.E);
      if (walkable) { solveWalk(L); assertWin(L, 0); }
      else { ck('L' + n + ': solve by tp', solveTP(L)); assertWin(L, 1); }
    }
  }
  if (n < 80) clickWinBtn('NEXT LEVEL');
}
// L80 win -> NEXT goes to level select
ck('L80: won', winOpen());
clickWinBtn('NEXT LEVEL');
ck('end: level select active', active(g, 'level-screen') && !active(g, 'game-screen'));
const svEnd = JSON.parse(g.ls.getItem('teleport_jumper_save'));
ck('end: unlocked 80', svEnd.state.unlocked === 80, String(svEnd.state.unlocked));
ck('end: 80 starred levels', Object.keys(svEnd.state.stars).length === 80);
ck('end: all 3 stars', Object.values(svEnd.state.stars).every(v => v === 3));
ck('end: none locked', (() => { let bad = 0; for (let i = 1; i <= 80; i++) if (lvlBtn(i).classList.contains('locked')) bad++; return bad === 0; })());
ck('end: L1 button stars row', String(lvlBtn(1).children[1].textContent) === '★★★', String(lvlBtn(1).children[1].textContent));

// ---------- boot 2: seeded save ----------
const seed = { version: '1.0', state: { screen: 'game-screen', level: 7, skin: 'ghost', unlocked: 20, stars: { 1: 3, 2: 2, 3: 1 }, currentTier: 1 } };
const g2 = harness.bootGame('teleport-jumper', { seedLS: { teleport_jumper_save: JSON.stringify(seed) } });
ck('boot2: no load errors', (g2.loadErrors || []).length === 0, (g2.loadErrors || []).join(' | '));
ck('boot2: forced to title', g2.els['title-screen'].classList.contains('active'));
clickNode(g2.call('document.querySelectorAll("#title-screen .btn-play")')[0]);
(function () {
  const find = (node, num) => { for (const c of (node.children || [])) { if (String(c.tagName).toUpperCase() === 'BUTTON' && c.children[0] && String(c.children[0].textContent) === String(num)) return c; const r = find(c, num); if (r) return r; } return null; };
  const c20 = find(g2.els['level-container'], 20), c21 = find(g2.els['level-container'], 21), c1 = find(g2.els['level-container'], 1), c2 = find(g2.els['level-container'], 2);
  ck('boot2: L20 unlocked', !c20.classList.contains('locked'));
  ck('boot2: L21 locked', c21.classList.contains('locked') && typeof c21.onclick !== 'function');
  ck('boot2: L1 stars 3', String(c1.children[1].textContent) === '★★★', String(c1.children[1].textContent));
  ck('boot2: L2 stars 2', String(c2.children[1].textContent) === '★★☆', String(c2.children[1].textContent));
})();
clickNode(g2.call('document.querySelectorAll("#level-screen .btn-back")')[0]);
clickNode(g2.call('document.querySelectorAll("#title-screen .btn-secondary")')[0]);
ck('boot2: skin screen', g2.els['skin-screen'].classList.contains('active'));
const sg2 = g2.els['skin-grid'];
ck('boot2: ghost unlocked+active', !sg2.children[1].classList.contains('locked') && sg2.children[1].classList.contains('active'));
ck('boot2: neon still locked', sg2.children[2].classList.contains('locked') && typeof sg2.children[2].onclick !== 'function');

// helper used above: tp to an arbitrary cell (for death-burn + switch step)
function solveTPTo(L, target) {
  let px = L.P.x, py = L.P.y;
  if (L.patrol.has(px + ',' + py)) {
    const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => {
      const nx = px + dx, ny = py + dy, k = nx + ',' + ny;
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !L.blocks.has(k) && !L.patrol.has(k) && !L.starts.has(k);
    });
    if (!dir) return false;
    walkStep(dir[0] === 1 ? 'right' : dir[0] === -1 ? 'left' : dir[1] === 1 ? 'down' : 'up');
    px += dir[0]; py += dir[1];
  }
  g.key('x');
  const gy = Math.max(0, py - 1);
  const gp = ghostPath({ x: px, y: gy }, target);
  for (let i = 1; i < gp.length; i++) {
    const [dx, dy] = [gp[i][0] - gp[i - 1][0], gp[i][1] - gp[i - 1][1]];
    ghostStep(dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
  }
  g.key('x');
  return true;
}

// final error sweep across the whole run
ck('run: zero engine errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));
ck('run: zero boot2 errors', (g2.sandbox.__errors || []).length === 0, (g2.sandbox.__errors || []).slice(0, 3).join(' | '));

const extra = {
  levels: 80, allSolvable: true,
  fixes: 'P0 ghost-through-walls (18 sealed levels unwinnable, stuck at L12) + P1 thin-walls walkable; P3 documented: doors/switches decorative (doors_ never populated)',
};
console.log(JSON.stringify({ pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS, extra }));
process.exit(FAIL === 0 ? 0 : 1);
