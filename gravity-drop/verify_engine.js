#!/usr/bin/env node
// gravity-drop engine verifier (vm harness, real input paths only)
// Engine bugs found & fixed (root-caused 2026-08-25):
//  P0: NO source of horizontal velocity existed — the ball spawns exactly
//      column-centered with vx=0, and a centered fall only ever produces
//      axis-pure 'top' collisions, so vx stayed 0 forever. The ball could
//      never leave its spawn column: 18/30 levels place the goal 1-2 columns
//      away (unwinnable), and permanent bouncy/fixed/ice blocks under the
//      spawn column (e.g. L25 fixed @(3,5), L29 bouncy @(3,5)) sealed more.
//      Fix: arrow-key/A-D + hold-and-drag steering (tap still removes the
//      tapped block). moveCount still only counts block removals, so the
//      authored pars/stars economy is unchanged.
//  P1: showLevelSelect() sets result-modal inline style.display='none';
//      a later win's classList.add('show') cannot override inline display,
//      so the win modal stayed invisible after any level-select visit and
//      the game soft-locked. Fix: showResult clears inline display first.
// Verified: title/level-select/chapters/settings, locked-level guard, unlock
// chain, per-level planning via real pointer clicks (block removal) + keyboard
// and pointer steering, exact physics lockstep vs mirror, undo, hint,
// breakable timers, loss (ball out) + recovery, star economy vs par,
// result modal contents, next chain L1..L30, last-level handling, save/restore.
'use strict';
const fs = require('fs');
const path = require('path');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let PASS = 0, FAIL = 0; const FAILS = [];
function ck(name, ok, got) {
  if (ok) { PASS++; } else { FAIL++; FAILS.push(name + (got !== undefined ? ' :: ' + got : '')); }
  return ok;
}
const el = (g, id) => g.els[id];

// ---------- physics constants (must mirror the engine exactly) ----------
const R = 12, GRAVITY = 400, RESTITUTION = 0.5, WALL_RESTITUTION = 0.6,
  BOUNCY_RESTITUTION = 1.0, FRICTION = 0.92, ICE_FRICTION = 0.98, MAX_VEL = 800,
  STEER_ACCEL = 1200, MAX_VX = 320, DTMS = 16.67;

// ---------- level data from the engine source ----------
const SRC = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const LEVELS = [];
{
  const lit = /const LEVELS = \[([\s\S]*?)\n\];/.exec(SRC);
  const re = /\{cols:(\d+), rows:(\d+), ball:\[(\d+),(\d+)\], goal:\[(\d+),(\d+)\], par:(\d+),\s*\n\s*blocks:\[([\s\S]*?)\]\}/g;
  let m;
  while ((m = re.exec(lit[1]))) {
    const blocks = [];
    const bre = /\{c:(\d+),r:(\d+),type:'(\w+)'[^}]*\}/g; let b;
    while ((b = bre.exec(m[8]))) blocks.push({ c: +b[1], r: +b[2], type: b[3] });
    LEVELS.push({ cols: +m[1], rows: +m[2], ball: [+m[3], +m[4]], goal: [+m[5], +m[6]], par: +m[7], blocks });
  }
}
if (LEVELS.length !== 30) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['levels parsed: ' + LEVELS.length], extra: {} })); process.exit(1); }

// ---------- exact physics mirror of engine physicsUpdate ----------
class Mirror {
  constructor(lvl) {
    this.lvl = lvl;
    this.cw = 480 / lvl.cols; this.ch = 640 / lvl.rows;
    this.grid = [];
    for (let r = 0; r < lvl.rows; r++) { this.grid[r] = []; for (let c = 0; c < lvl.cols; c++) this.grid[r][c] = null; }
    for (const b of lvl.blocks) this.grid[b.r][b.c] = { type: b.type, hit: false };
    this.ballX = lvl.ball[0] * this.cw + this.cw / 2;
    this.ballY = lvl.ball[1] * this.ch + this.ch / 2;
    this.vx = 0; this.vy = 0; this.active = true; this.complete = false;
    this.now = 0; this.last = 0; this.breakQ = [];
  }
  remove(r, c) { this.grid[r][c] = null; }
  // clock replica: engine gameLoop computes dt from (ts - lastTime) with lastTime=0
  // marking a fresh startGameLoop (dt=0 first frame). The float accumulation must
  // match sandbox.__now exactly or vx/vy drift in the last bits and lockstep breaks.
  step(steer) {
    if (!this.active || this.complete) return;
    this.now += 16.67;
    let dt;
    if (this.last === 0) { this.last = this.now; dt = 0; }
    else { dt = Math.min((this.now - this.last) / 1000, 0.05); this.last = this.now; }
    // engine breakable null-out runs on a 100ms setTimeout — due timers fire before this frame's physics
    for (let i = this.breakQ.length - 1; i >= 0; i--) {
      const q = this.breakQ[i];
      if (this.now >= q.at) { if (this.grid[q.r] && this.grid[q.r][q.c] === q.blk) this.grid[q.r][q.c] = null; this.breakQ.splice(i, 1); }
    }
    this.vy += GRAVITY * dt;
    this.vy = Math.min(this.vy, MAX_VEL);
    this.vx *= FRICTION;
    if (steer) { this.vx += steer * STEER_ACCEL * dt; if (this.vx > MAX_VX) this.vx = MAX_VX; if (this.vx < -MAX_VX) this.vx = -MAX_VX; }
    let nx = this.ballX + this.vx * dt;
    let ny = this.ballY + this.vy * dt;
    if (nx - R < 0) { nx = R; this.vx = -this.vx * WALL_RESTITUTION; }
    if (nx + R > 480) { nx = 480 - R; this.vx = -this.vx * WALL_RESTITUTION; }
    const cw = this.cw, ch = this.ch;
    const collisions = [];
    for (let r = 0; r < this.lvl.rows; r++) for (let c = 0; c < this.lvl.cols; c++) {
      const blk = this.grid[r][c]; if (!blk) continue;
      const col = circleRect(nx, ny, R, c * cw, r * ch, cw, ch);
      if (col) collisions.push({ r, c, blk, col });
    }
    collisions.sort((a, b) => b.col.pen - a.col.pen);
    for (const { r, c, blk, col } of collisions) {
      nx = this.ballX + this.vx * dt;
      ny = this.ballY + this.vy * dt;
      const { cx, cy, normal, pen } = col;
      if (normal === 'top' || normal === 'bottom') ny = normal === 'top' ? cy - R : cy + R + pen;
      else nx = normal === 'left' ? cx - R : cx + R + pen;
      let rest = RESTITUTION;
      if (blk.type === 'bouncy') rest = BOUNCY_RESTITUTION;
      else if (blk.type === 'ice') rest = RESTITUTION;
      else if (blk.type === 'breakable') {
        if (!blk.hit) { blk.hit = true; this.breakQ.push({ r, c, blk, at: this.now + 100 }); }
        rest = RESTITUTION * 0.5;
      }
      if (normal === 'top' || normal === 'bottom') {
        this.vy = normal === 'top' ? -Math.abs(this.vy) * rest : Math.abs(this.vy) * rest;
        this.vx *= blk.type === 'ice' ? ICE_FRICTION : FRICTION;
      } else {
        this.vx = normal === 'left' ? -Math.abs(this.vx) * rest : Math.abs(this.vx) * rest;
      }
    }
    this.ballX = nx; this.ballY = ny;
    if (this.ballY > 640 + R * 2) this.active = false;
    const goalTop = this.lvl.goal[1] * ch, goalCx = this.lvl.goal[0] * cw + cw / 2;
    if (this.ballY >= goalTop && Math.abs(this.ballX - goalCx) < cw * 0.6) { this.active = false; this.complete = true; }
  }
}
function circleRect(cx0, cy0, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx0, rx + rw));
  const closestY = Math.max(ry, Math.min(cy0, ry + rh));
  const dx = cx0 - closestX, dy = cy0 - closestY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < cr) {
    const pen = cr - dist;
    let normal;
    if (dist === 0) normal = 'top';
    else {
      const nx2 = dx / dist, ny2 = dy / dist;
      if (Math.abs(nx2) > Math.abs(ny2)) normal = nx2 < 0 ? 'left' : 'right';
      else normal = ny2 < 0 ? 'top' : 'bottom';
    }
    return { cx: closestX, cy: closestY, normal, pen };
  }
  return null;
}

// ---------- steering controller ----------
function steerFor(m, targetX) {
  const dx = targetX - m.ballX;
  if (Math.abs(dx) <= 8) return 0;
  if (Math.abs(m.vx) > 0.4 && Math.abs(dx) < m.vx * m.vx / 2400 + 12) return m.vx > 0 ? -1 : 1; // pre-brake
  return dx > 0 ? 1 : -1;
}
function dodgeTarget(m, goalCx) {
  const cw = m.cw, ch = m.ch, lvl = m.lvl;
  const row0 = Math.floor((m.ballY + R) / ch);
  const goalRow = lvl.goal[1];
  const solid = (r, c) => { const b = m.grid[r] && m.grid[r][c]; return b && b.type !== 'breakable'; };
  // trigger from row0 (the ball's own row): resting on a block directly above the goal
  // made the old row0+1 scan treat the support's column as clear — target = own column
  // → steer 0 → the ball perched on the block forever (L2 trap: support (3,7), goal [3,9])
  for (let r2 = row0; r2 <= Math.min(lvl.rows - 1, row0 + 3); r2++) {
    for (let c2 = 0; c2 < lvl.cols; c2++) {
      if (!solid(r2, c2)) continue;
      const bx0 = c2 * cw, bx1 = bx0 + cw;
      if (m.ballX + R + 3 > bx0 && m.ballX - R - 3 < bx1) {
        // solid block ahead or underfoot — aim for the free column nearest the goal
        // whose path is clear ALL THE WAY to the goal row (from row0, so a support
        // disqualifies its own column); fall back to the 5-row window when no
        // column runs clear that far (plans remove the intervening blocks)
        let best = null, bestWin = null;
        for (let c = 0; c < lvl.cols; c++) {
          let free = true, freeWin = true;
          for (let r3 = row0; r3 <= Math.min(lvl.rows - 1, goalRow); r3++) if (solid(r3, c)) { free = false; break; }
          for (let r3 = row0; r3 <= Math.min(lvl.rows - 1, row0 + 5); r3++) if (solid(r3, c)) { freeWin = false; break; }
          const cx = c * cw + cw / 2, d = Math.abs(cx - goalCx);
          if (free && (!best || d < best.d)) best = { cx, d };
          if (freeWin && (!bestWin || d < bestWin.d)) bestWin = { cx, d };
        }
        return (best || bestWin) ? (best || bestWin).cx : goalCx;
      }
    }
  }
  return goalCx;
}
function ctrl(m) { return steerFor(m, dodgeTarget(m, m.lvl.goal[0] * m.cw + m.cw / 2)); }

// ---------- offline planner: minimal removable subset that wins ----------
function simRun(m) {
  let lastY = m.ballY, stall = 0;
  for (let f = 0; f < 1200; f++) {
    m.step(ctrl(m));
    if (m.complete) return true;
    if (!m.active) return false;
    if (Math.abs(m.ballY - lastY) < 1.5 && Math.abs(m.vx) < 1) stall++; else stall = 0;
    if (stall > 150) return false;
    lastY = m.ballY;
  }
  return false;
}
function planLevel(lvl) {
  const rem = lvl.blocks.filter(b => b.type === 'removable');
  for (let size = 0; size <= rem.length; size++) {
    const rec = (start, chosen) => {
      if (chosen.length === size) {
        const m = new Mirror(lvl);
        for (const b of chosen) m.remove(b.r, b.c);
        if (simRun(m)) return chosen.slice();
        return null;
      }
      for (let i = start; i < rem.length; i++) { chosen.push(rem[i]); const r = rec(i + 1, chosen); if (r) return r; chosen.pop(); }
      return null;
    };
    const r = rec(0, []);
    if (r) return { rm: r, size };
  }
  return null;
}
const PLANS = LEVELS.map(planLevel);
const PLAN_INFO = PLANS.map((p, i) => p ? { lv: i + 1, minMoves: p.size, par: LEVELS[i].par } : { lv: i + 1, solvable: false });

// ---------- input plumbing ----------
function wkey(g, code, type) {
  g.sandbox.window.dispatchEvent({ type: type || 'keydown', key: code, code, preventDefault() {}, stopPropagation() {} });
}
function pumpUntil(g, cond, maxF) {
  for (let f = 0; f < maxF; f++) { if (cond()) return true; g.pump(1); }
  return cond();
}
const GD_EXPORTS = "window.__gd={b:function(){return{x:ballX,y:ballY,vx:ballVX,vy:ballVY,a:ballActive,lc:levelComplete}},m:function(){return moveCount},lv:function(){return currentLevel},cell:function(r,c){var b=grid[r]?grid[r][c]:null;return b?b.type:null},hb:function(){return hintBlock},st:function(){return gameState},t:function(){return lastTime},n:function(){return window.__now}};";
const gdB = g => { try { return g.call('window.__gd?window.__gd.b():null'); } catch (e) { return null; } };
const gdM = g => { try { return g.call('window.__gd?window.__gd.m():-1'); } catch (e) { return -1; } };
const gdCell = (g, r, c) => { try { return g.call('window.__gd?window.__gd.cell(' + r + ',' + c + '):null'); } catch (e) { return null; } };
const gdHB = g => { try { return g.call('window.__gd?window.__gd.hb():undefined'); } catch (e) { return undefined; } };
const gdST = g => { try { return g.call('window.__gd?window.__gd.st():null'); } catch (e) { return null; } };
function walkLive(g) { // static-markup buttons live in the body subtree with compiled inline onclicks
  const out = [];
  const rec = n => { (n.children || []).forEach(c => { out.push(c); rec(c); }); };
  rec(g.sandbox.document.body);
  return out;
}
const btnByFn = (g, rootId, src) => walkLive(g).find(b => typeof b.onclick === 'function' && String(b.onclick).includes(src));

// ---------- live level runner ----------
const held = { left: false, right: false };
function setKeys(g, steer) {
  const L = steer < 0, Rt = steer > 0;
  if (L !== held.left) { wkey(g, 'ArrowLeft', L ? 'keydown' : 'keyup'); held.left = L; }
  if (Rt !== held.right) { wkey(g, 'ArrowRight', Rt ? 'keydown' : 'keyup'); held.right = Rt; }
}
function runLevel(g, n, opts) {
  opts = opts || {};
  const lvl = LEVELS[n - 1];
  const plan = opts.plan !== undefined ? opts.plan : PLANS[n - 1];
  const mir = new Mirror(lvl);
  // sync to the live engine's current ball + clock (entries happen mid-chain: after
  // resultNext the rAF chain never stopped, so the engine may already be frames ahead)
  const e0 = gdB(g);
  if (e0) { mir.ballX = e0.x; mir.ballY = e0.y; mir.vx = e0.vx; mir.vy = e0.vy; mir.active = e0.a; mir.complete = e0.lc; }
  try { mir.now = Number(g.call('window.__gd.n()')) || 0; mir.last = Number(g.call('window.__gd.t()')) || 0; } catch (e) {}
  const cw = mir.cw, ch = mir.ch;
  const canvas = el(g, 'board');
  const ev = (x, y) => ({ clientX: x, clientY: y, pointerId: 1, button: 0, isPrimary: true, preventDefault() {}, stopPropagation() {} });
  // pointer-steer mode: hold the board at a harmless cell (goal cell — no removable there)
  let ptr = false;
  if (opts.pointer) {
    canvas.dispatch('pointerdown', ev(lvl.goal[0] * cw + cw / 2, lvl.goal[1] * ch + ch / 2));
    ptr = true;
  }
  let ci = 0;
  const clicks = plan ? plan.rm : [];
  const kill = opts.kill; // deliberate loss: steer away from goal
  let f = 0;
  for (; f < 900; f++) {
    if (f >= 2 && ci < clicks.length) {
      const b = clicks[ci++];
      canvas.dispatch('pointerdown', ev(b.c * cw + cw / 2, b.r * ch + ch / 2)); // in pointer mode keep the hold: steerPtr.x is re-set by the next pointermove
      if (!ptr) canvas.dispatch('pointerup', ev(b.c * cw + cw / 2, b.r * ch + ch / 2));
      mir.remove(b.r, b.c);
    }
    const steer = kill ? kill : ctrl(mir);
    if (ptr) canvas.dispatch('pointermove', ev(mir.ballX + steer * 40, mir.ballY));
    else setKeys(g, steer);
    g.pump(1);
    mir.step(steer);
    // exact lockstep vs the live engine
    const e = gdB(g);
    if (e && (Math.abs(e.x - mir.ballX) > 0.02 || Math.abs(e.y - mir.ballY) > 0.02 || e.vx !== mir.vx || e.vy !== mir.vy || e.a !== mir.active || e.lc !== mir.complete)) {
      setKeys(g, 0); if (ptr) canvas.dispatch('pointerup', ev(240, 320));
      return { desync: true, f, engine: e, mirror: { x: mir.ballX, y: mir.ballY, vx: mir.vx, vy: mir.vy, a: mir.active, lc: mir.complete } };
    }
    if (mir.complete) break;
    if (!mir.active) break;
  }
  setKeys(g, 0);
  if (ptr) canvas.dispatch('pointerup', ev(240, 320));
  return { won: mir.complete, died: !mir.active && !mir.complete, moves: ci, frames: f, flips: undefined };
}
// "shown" must mean VISIBLE: .show class AND no inline display:none override (the P1 —
// classList alone was true while the modal sat invisibly behind inline display:none)
const modalShown = g => el(g, 'result-modal').classList.contains('show') && el(g, 'result-modal').style.display !== 'none';
function winChecks(g, n, movesUsed, label) {
  const lvl = LEVELS[n - 1];
  const expStars = movesUsed <= lvl.par ? 3 : (movesUsed <= lvl.par + 1 ? 2 : 1);
  ck('L' + n + (label ? ':' + label : '') + ' modal shown', pumpUntil(g, () => modalShown(g), 80), 'cls=' + el(g, 'result-modal').className);
  ck('L' + n + ' title', String(el(g, 'r-title').textContent) === 'Level Complete!', el(g, 'r-title').textContent);
  const expStr = '★★★'.slice(0, expStars) + '☆☆☆'.slice(0, 3 - expStars);
  ck('L' + n + ' stars ' + expStars, String(el(g, 'r-stars').textContent) === expStr, el(g, 'r-stars').textContent + ' (moves ' + movesUsed + ' par ' + lvl.par + ')');
  ck('L' + n + ' par text', String(el(g, 'r-par').textContent) === 'Par: ' + lvl.par + ' | Your moves: ' + movesUsed, el(g, 'r-par').textContent);
  const sv = JSON.parse(g.ls.getItem('gravity_drop_save') || '{}');
  ck('L' + n + ' saved', sv.levels[n] && sv.levels[n].stars === expStars && sv.levels[n].moves === movesUsed, JSON.stringify(sv.levels[n]));
  return expStars;
}

// level-select buttons are PARSED out of grid.innerHTML — the entities live as literal
// text in the .lstars span's textContent (the parsed button's own innerHTML is never set)
const lvlStars = (grid, i) => { const b = grid.children[i]; return b && b.children[1] ? String(b.children[1].textContent) : '?'; };

// ================= BOOT 1 =================
const g = harness.bootGame('gravity-drop', { inject: { anchor: "const SAVE_KEY = 'gravity_drop_save';", exports: GD_EXPORTS } });
ck('boot: no load errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join(' | '));
ck('boot: probe injected', gdB(g) !== null, JSON.stringify(gdB(g)));
ck('boot: title screen', el(g, 'title-screen').style.display === 'flex' && gdST(g) === 'title', el(g, 'title-screen').style.display);
ck('boot: total stars 0', String(el(g, 'title-stars').textContent) === 'Total Stars: 0 / 90', el(g, 'title-stars').textContent);

// settings modal from title
const playBtn = btnByFn(g, 'title-screen', 'showLevelSelect()');
ck('title: play btn found', !!playBtn);
const settingsBtn = btnByFn(g, 'title-screen', 'showSettings()');
ck('title: settings btn found', !!settingsBtn);
settingsBtn.dispatch('click', { type: 'click' });
ck('settings: shown', el(g, 'settings-modal').classList.contains('show'));
el(g, 'st-sound').dispatch('click', { type: 'click' });
ck('settings: sound off', !el(g, 'st-sound').classList.contains('on') && JSON.parse(g.ls.getItem('gravity_drop_save')).settings.sound === false, el(g, 'st-sound').className);
el(g, 'st-sound').dispatch('click', { type: 'click' });
ck('settings: sound on', el(g, 'st-sound').classList.contains('on') && JSON.parse(g.ls.getItem('gravity_drop_save')).settings.sound === true, el(g, 'st-sound').className);
btnByFn(g, 'settings-modal', 'closeSettings()').dispatch('click', { type: 'click' });
ck('settings: closed', !el(g, 'settings-modal').classList.contains('show'));

// level select
playBtn.dispatch('click', { type: 'click' });
ck('select: screen', el(g, 'level-screen').style.display === 'flex' && gdST(g) === 'levelSelect', el(g, 'level-screen').style.display);
ck('select: chapter title', String(el(g, 'chapter-title').textContent) === 'Chapter 1: Basics', el(g, 'chapter-title').textContent);
ck('select: 6 buttons', el(g, 'level-grid').children.length === 6, String(el(g, 'level-grid').children.length));
ck('select: L1 unlocked', !el(g, 'level-grid').children[0].classList.contains('locked'));
ck('select: L2 locked', el(g, 'level-grid').children[1].classList.contains('locked'));
el(g, 'level-grid').children[1].dispatch('click', { type: 'click' });
ck('select: locked click stays', gdST(g) === 'levelSelect' && el(g, 'game-screen').style.display !== 'flex', gdST(g));

// chapter nav
el(g, 'chapters-nav').children[4].dispatch('click', { type: 'click' });
ck('select: ch5 renders L25-30', String(el(g, 'chapter-title').textContent) === 'Chapter 5: Master' && el(g, 'level-grid').children.length === 6, el(g, 'chapter-title').textContent);
el(g, 'chapters-nav').children[0].dispatch('click', { type: 'click' });
ck('select: back to ch1', String(el(g, 'chapter-title').textContent) === 'Chapter 1: Basics');

// ---- L1: basics + full lockstep ----
if (!PLANS[0]) { ck('L1: solvable', false, 'planner found no plan'); }
el(g, 'level-grid').children[0].dispatch('click', { type: 'click' });
ck('L1: playing', gdST(g) === 'playing' && String(el(g, 'gh-level').textContent) === 'Level 1' && el(g, 'game-screen').style.display === 'flex', gdST(g));
ck('L1: header', String(el(g, 'gh-moves').textContent) === '0' && String(el(g, 'gh-par').textContent) === '1', el(g, 'gh-moves').textContent + '/' + el(g, 'gh-par').textContent);
const r1 = runLevel(g, 1);
ck('L1: win', !!r1.won, JSON.stringify(r1).slice(0, 140));
winChecks(g, 1, r1.moves || PLANS[0].size);
ck('L1: unlock 2', JSON.parse(g.ls.getItem('gravity_drop_save')).levels[2] === undefined);

// ---- L2: undo round-trip + hint ----
btnByFn(g, 'result-modal', 'resultNext()').dispatch('click', { type: 'click' });
ck('L2: entered via NEXT', String(el(g, 'gh-level').textContent) === 'Level 2' && !modalShown(g));
const undoBtn = btnByFn(g, 'game-footer', 'gameUndo()');
const hintBtn = btnByFn(g, 'game-footer', 'gameHint()');
ck('L2: footer buttons', !!undoBtn && !!hintBtn);
g.pump(3);
// click the first removable in the ball column (exists in every level plan)
{
  const blk = LEVELS[1].blocks.find(b => b.type === 'removable');
  const cw = 480 / LEVELS[1].cols, ch = 640 / LEVELS[1].rows;
  el(g, 'board').dispatch('pointerdown', { clientX: blk.c * cw + cw / 2, clientY: blk.r * ch + ch / 2, pointerId: 1, button: 0, isPrimary: true, preventDefault() {}, stopPropagation() {} });
  el(g, 'board').dispatch('pointerup', { clientX: 0, clientY: 0, pointerId: 1, preventDefault() {}, stopPropagation() {} });
  ck('L2: click removes + counts', gdCell(g, blk.r, blk.c) === null && gdM(g) === 1, gdCell(g, blk.r, blk.c) + '/' + gdM(g));
  undoBtn.dispatch('click', { type: 'click' });
  ck('L2: undo restores', gdCell(g, blk.r, blk.c) === 'removable' && gdM(g) === 0, gdCell(g, blk.r, blk.c) + '/' + gdM(g));
  undoBtn.dispatch('click', { type: 'click' });
  ck('L2: empty undo no-op', gdM(g) === 0);
  hintBtn.dispatch('click', { type: 'click' });
  const hb = gdHB(g);
  ck('L2: hint targets a removable', !!hb && gdCell(g, hb.r, hb.c) === 'removable', JSON.stringify(hb));
}
const r2 = runLevel(g, 2);
ck('L2: win', !!r2.won, JSON.stringify(r2).slice(0, 140));
winChecks(g, 2, r2.moves || PLANS[1].size);

// ---- L3 (goal col 2 — steering mandatory): pointer steering ----
btnByFn(g, 'result-modal', 'resultNext()').dispatch('click', { type: 'click' });
ck('L3: entered', String(el(g, 'gh-level').textContent) === 'Level 3');
const r3 = runLevel(g, 3, { pointer: true });
ck('L3: win via pointer steering', !!r3.won, JSON.stringify(r3).slice(0, 140));
winChecks(g, 3, r3.moves || PLANS[2].size, 'pointer');

// ---- L4: restart mid-run, then win ----
btnByFn(g, 'result-modal', 'resultNext()').dispatch('click', { type: 'click' });
ck('L4: entered', String(el(g, 'gh-level').textContent) === 'Level 4');
g.pump(40);
btnByFn(g, 'game-footer', 'gameRestart()').dispatch('click', { type: 'click' });
ck('L4: Restart mid-run resets', gdM(g) === 0 && gdB(g).y < 100, 'moves=' + gdM(g) + ' y=' + (gdB(g) || {}).y);
const r4 = runLevel(g, 4);
ck('L4: win', !!r4.won, JSON.stringify(r4).slice(0, 140));
winChecks(g, 4, r4.moves || PLANS[3].size);

// ---- L5: deliberate loss + recovery via level select (P1 modal regression) ----
btnByFn(g, 'result-modal', 'resultNext()').dispatch('click', { type: 'click' });
ck('L5: entered', String(el(g, 'gh-level').textContent) === 'Level 5');
const r5d = runLevel(g, 5, { plan: { rm: [], size: 0 }, kill: -1 });
ck('L5: ball lost off bottom', !!r5d.died && !r5d.won, JSON.stringify(r5d).slice(0, 120));
ck('L5: no modal on loss', !modalShown(g) && !pumpUntil(g, () => modalShown(g), 30));
ck('L5: loss not saved', JSON.parse(g.ls.getItem('gravity_drop_save')).levels[5] === undefined);
// recovery: result-modal "Levels" -> select -> replay (this path also drives the P1: modal must reappear)
btnByFn(g, 'game-header', 'showLevelSelect()').dispatch('click', { type: 'click' });
ck('L5: back to select', gdST(g) === 'levelSelect' && el(g, 'level-screen').style.display === 'flex');
el(g, 'level-grid').children[4].dispatch('click', { type: 'click' });
ck('L5: replay entered', String(el(g, 'gh-level').textContent) === 'Level 5' && gdST(g) === 'playing');
const r5 = runLevel(g, 5);
ck('L5: win after recovery', !!r5.won, JSON.stringify(r5).slice(0, 140));
winChecks(g, 5, r5.moves || PLANS[4].size, 'recovered'); // 'modal shown' check = the P1 regression

// ---- chain L6..L30 via NEXT ----
for (let n = 6; n <= 30; n++) {
  btnByFn(g, 'result-modal', 'resultNext()').dispatch('click', { type: 'click' });
  const tag = String(el(g, 'gh-level').textContent);
  if (!ck('L' + n + ': entered via NEXT', tag === 'Level ' + n && gdST(g) === 'playing', tag)) continue;
  if (!PLANS[n - 1]) { ck('L' + n + ': solvable', false, 'planner found no plan'); continue; }
  const r = runLevel(g, n);
  if (!ck('L' + n + ': win', !!r.won, JSON.stringify(r).slice(0, 140))) continue;
  winChecks(g, n, r.moves);
}

// ---- L30 end state ----
ck('L30: NEXT hidden on last level', el(g, 'r-next-btn').style.display === 'none', el(g, 'r-next-btn').style.display);
const starsTotal = PLANS.reduce((a, p, i) => a + (p ? (p.size <= LEVELS[i].par ? 3 : (p.size <= LEVELS[i].par + 1 ? 2 : 1)) : 0), 0);
// go to level select and check totals + all done (innerHTML stars are &#9733; entities)
btnByFn(g, 'result-modal', 'resultLevels()').dispatch('click', { type: 'click' });
ck('end: levels screen', gdST(g) === 'levelSelect' && String(el(g, 'total-stars').textContent) === 'Total Stars: ' + starsTotal + ' / 90', el(g, 'total-stars').textContent);
el(g, 'chapters-nav').children[4].dispatch('click', { type: 'click' });
ck('end: L30 done+3star', lvlStars(el(g, 'level-grid'), 5) === '&#9733;&#9733;&#9733;', lvlStars(el(g, 'level-grid'), 5));
ck('run: zero engine errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));

// ================= BOOT 2: seeded save =================
const g2 = harness.bootGame('gravity-drop', { inject: { anchor: "const SAVE_KEY = 'gravity_drop_save';", exports: GD_EXPORTS }, seedLS: { gravity_drop_save: JSON.stringify({ v: 1, levels: { 1: { stars: 3, moves: 1, best: 1 }, 2: { stars: 2, moves: 3, best: 3 } }, settings: { sound: true, music: true }, totalStars: 5 }) } });
ck('boot2: no load errors', (g2.loadErrors || []).length === 0, (g2.loadErrors || []).join(' | '));
btnByFn(g2, 'title-screen', 'showLevelSelect()').dispatch('click', { type: 'click' });
ck('boot2: seeded stars text', String(el(g2, 'total-stars').textContent) === 'Total Stars: 5 / 90', el(g2, 'total-stars').textContent);
ck('boot2: L1 mini stars', lvlStars(el(g2, 'level-grid'), 0) === '&#9733;&#9733;&#9733;' && !el(g2, 'level-grid').children[0].classList.contains('locked'), lvlStars(el(g2, 'level-grid'), 0));
ck('boot2: L3 unlocked (L2 has stars)', !el(g2, 'level-grid').children[2].classList.contains('locked'));
ck('boot2: L4 locked', el(g2, 'level-grid').children[3].classList.contains('locked'));
el(g2, 'level-grid').children[2].dispatch('click', { type: 'click' });
ck('boot2: L3 playing', String(el(g2, 'gh-level').textContent) === 'Level 3');
const rb2 = runLevel(g2, 3);
ck('boot2: L3 win', !!rb2.won, JSON.stringify(rb2).slice(0, 140));
winChecks(g2, 3, rb2.moves);
ck('boot2: zero errors', (g2.sandbox.__errors || []).length === 0, (g2.sandbox.__errors || []).slice(0, 3).join(' | '));

const extra = {
  levels: 30,
  planner: PLAN_INFO,
  fixes: 'P0 no horizontal velocity source (ball spawns column-centered, vx stays 0 forever; 18/30 goals unreachable + permanent spawn-column blockers) — added arrow-key/A-D + hold-drag steering, tap still removes blocks, move economy unchanged; P1 showLevelSelect set result-modal inline display:none which overrides .show — win modal invisible after level-select visit = softlock, showResult now clears inline display'
};
console.log(JSON.stringify({ pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS, extra }));
process.exit(FAIL === 0 ? 0 : 1);
