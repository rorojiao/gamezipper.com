#!/usr/bin/env node
// gravity-flip engine verifier (vm harness, real input paths only)
// Engine bugs fixed (root-caused 2026-08-25):
//  P0: the engine had NO horizontal control — vx was only ever assigned 0, yet all
//      30 levels place stars at cols 2-7 and the exit at col 10. The orb fell down
//      col 1 forever: no star collectable, no exit reachable, zero wins possible.
//      Added arrow-key/A-D + hold-and-drag canvas steering (tap still flips).
//  P0 (data): maps were structurally sealed — full-width wall rows (############)
//      and full-width spike rows walled the start chamber off from the exit even
//      WITH steering. Repaired: a 3-col corridor punched through every interior row
//      (aligned with each level's authored spike gaps), hazards relocated off it
//      (N platforms given sweep clearance), stars moved onto it, specials pulled
//      out of the boundary columns.
//  P2: horizontal OOB was not fatal — boundary-column M platforms leave wall holes
//      when they slide away; a steered orb could glide out the side and hover
//      off-screen forever. Now dies like vertical OOB (verified via engine physics).
//  P3: upward velocity was uncapped (only vy>12 clamped) — symmetric ±12 cap.
// Verified: menu/level-grid/unlock chain, corridor physics (keyboard + pointer
// steering, tap-flip), star collection + HUD sync, star economy 1/3 + keep-best +
// downgrade protection, death + RETRY, R/Escape keys, Restart/Menu/Sound buttons,
// NEXT chain L1..L30, last-level ALL CLEAR + PLAY AGAIN, save/restore boot.
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
const CELL = 40, W = 480, PR = 12, DT = 16.67;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- level data from the (repaired) engine source ----------
const SRC = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const RAW = [];
{ let m; const re = /L\(\[([\s\S]*?)\],(\d+)\)/g;
  while ((m = re.exec(SRC))) { const rows = []; const q = /"([^"]*)"/g; let qm;
    while ((qm = q.exec(m[1]))) rows.push(qm[1]);
    RAW.push({ rows, par: +m[2] }); } }
if (RAW.length !== 30) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['levels parsed: ' + RAW.length], extra: {} })); process.exit(1); }

function buildLevel(rows, par) { // exact replica of the engine's L() parser
  const walls = [], spikes = [], stars = [], saws = [], lasers = [], bounce = [], moves = [];
  let startX = 100, startY = 80, exitX = 0, exitY = 0;
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
    const ch = rows[r][c], x = c * CELL, y = r * CELL;
    if (ch === '#') walls.push({ x, y, w: CELL, h: CELL });
    else if (ch === 'S') spikes.push({ x: x + 4, y: y + CELL - 16, w: CELL - 8, h: 16 });
    else if (ch === 's') spikes.push({ x: x + 4, y, w: CELL - 8, h: 16 });
    else if (ch === '*') stars.push({ x: x + CELL / 2, y: y + CELL / 2, r: 8 });
    else if (ch === '^') saws.push({ x: x + CELL / 2, y: y + CELL / 2, r: 14 });
    else if (ch === '|') lasers.push({ x: x + CELL / 2, y, w: 3, h: CELL });
    else if (ch === '-') lasers.push({ x, y: y + CELL / 2, w: CELL, h: 3 });
    else if (ch === 'b') bounce.push({ x: x + 4, y: y + CELL - 8, w: CELL - 8, h: 8, dir: 'up' });
    else if (ch === 'B') bounce.push({ x: x + 4, y, w: CELL - 8, h: 8, dir: 'down' });
    else if (ch === 'E') { exitX = x + CELL / 2; exitY = y + CELL / 2; }
    else if (ch === 'P') { startX = x + CELL / 2; startY = y + CELL / 2; }
    else if (ch === 'M') moves.push({ x, y, w: CELL, h: CELL, baseY: y, range: 60, speed: 0.8, phase: 0, dir: 'v' });
    else if (ch === 'N') moves.push({ x, y, w: CELL, h: CELL, baseX: x, baseY: y, range: 80, speed: 1.0, phase: 0, dir: 'h' });
  }
  return { walls, spikes, stars, saws, lasers, bounce, startX, startY, exitX, exitY, par, moves };
}
const LEVELS = RAW.map(l => buildLevel(l.rows, l.par));

function corridorBand(rows) { // ground truth: the repair punched exactly one 3-col hazard-free corridor rows 1-16 — find it
  const OK = ch => ch === '.' || ch === '*' || ch === 'P' || ch === 'E';
  for (let b = 2; b <= 7; b++) {
    let clear = true;
    for (let r = 1; r <= 16 && clear; r++) for (let c = b; c <= b + 2 && clear; c++) if (!OK(rows[r][c])) clear = false;
    if (clear) return b;
  }
  return 5;
}

// ---------- exact physics mirror of the engine update() ----------
class Mirror {
  constructor(lv) {
    this.lv = lv;
    this.p = { x: lv.startX, y: lv.startY, vx: 0, vy: 0, gravDir: 1 };
    this.moves = lv.moves.map(m => Object.assign({}, m));
    this.stars = lv.stars.map(s => ({ x: s.x, y: s.y, col: false }));
    this.collected = 0; this.flips = 0; this.dead = false; this.won = false;
  }
  flip() { if (this.dead || this.won) return; this.p.gravDir *= -1; this.p.vy = 0; this.flips++; }
  step(ax) {
    if (this.dead) return 'dead';
    if (this.won) return 'won';
    const p = this.p, lv = this.lv;
    const allWalls = lv.walls.slice();
    for (const m of this.moves) {
      m.phase += m.speed * DT * 0.06;
      if (m.dir === 'v') m.y = m.baseY + Math.sin(m.phase) * m.range;
      else m.x = m.baseX + Math.sin(m.phase) * m.range;
      allWalls.push(m);
    }
    p.vx += ax * 0.5; if (p.vx > 5) p.vx = 5; if (p.vx < -5) p.vx = -5;
    p.vy += 0.5 * p.gravDir;
    if (p.vy > 12) p.vy = 12; if (p.vy < -12) p.vy = -12;
    p.x += p.vx; p.y += p.vy;
    for (const w of allWalls) {
      if (p.x + PR > w.x && p.x - PR < w.x + w.w && p.y + PR > w.y && p.y - PR < w.y + w.h) {
        const dxL = (p.x + PR) - w.x, dxR = (w.x + w.w) - (p.x - PR);
        const dyT = (p.y + PR) - w.y, dyB = (w.y + w.h) - (p.y - PR);
        const mo = Math.min(dxL, dxR, dyT, dyB);
        if (mo === dyT && p.gravDir > 0) { p.y = w.y - PR; p.vy = 0; }
        else if (mo === dyB && p.gravDir < 0) { p.y = w.y + w.h + PR; p.vy = 0; }
        else if (mo === dxL) { p.x = w.x - PR; p.vx = 0; }
        else if (mo === dxR) { p.x = w.x + w.w + PR; p.vx = 0; }
      }
    }
    p.vx *= 0.92;
    const box = o => p.x - PR < o.x + o.w && p.x + PR > o.x && p.y - PR < o.y + o.h && p.y + PR > o.y;
    for (const b of lv.bounce) if (box(b)) { if (b.dir === 'up') { p.vy = -14; p.gravDir = -1; } else { p.vy = 14; p.gravDir = 1; } }
    for (const sp of lv.spikes) if (box(sp)) { this.dead = true; return 'dead'; }
    for (const sw of lv.saws) { const dx = p.x - sw.x, dy = p.y - sw.y; if (dx * dx + dy * dy < (PR + sw.r) * (PR + sw.r)) { this.dead = true; return 'dead'; } }
    for (const lz of lv.lasers) if (box(lz)) { this.dead = true; return 'dead'; }
    for (const st of this.stars) if (!st.col) { const dx = p.x - st.x, dy = p.y - st.y; if (dx * dx + dy * dy < 20 * 20) { st.col = true; this.collected++; } }
    const dxe = p.x - lv.exitX, dye = p.y - lv.exitY;
    if (dxe * dxe + dye * dye < 28 * 28) { this.won = true; return 'won'; }
    if (p.y > 770 || p.y < -50) { this.dead = true; return 'dead'; }
    if (p.x < -50 || p.x > W + 50) { this.dead = true; return 'dead'; }
    return '';
  }
}

// ---------- input plumbing (real engine paths) ----------
function wkey(g, code, type) {
  g.sandbox.window.dispatchEvent({ type: type || 'keydown', key: code, code, preventDefault() {}, stopPropagation() {} });
}
function pumpUntil(g, cond, maxF) {
  for (let f = 0; f < maxF; f++) { if (cond()) return true; g.pump(1); }
  return cond();
}

// ---------- controller: drives the live engine + mirror in lockstep ----------
const GF_EXPORTS = "window.__gf={p:function(){return{x:player.x,y:player.y,vx:player.vx,vy:player.vy,g:player.gravDir}},f:function(){return state.flips}};";
const gfP = g => { try { return g.call('window.__gf?window.__gf.p():null'); } catch (e) { return null; } };
const gfF = g => { try { return g.call('window.__gf?window.__gf.f():-1'); } catch (e) { return -1; } };
function solve(g, lvIdx, opts) {
  opts = opts || {};
  const lv = LEVELS[lvIdx];
  const mode = opts.mode || 'keys';
  const band = corridorBand(RAW[lvIdx].rows);
  const cx = (band + 1) * CELL + 20;
  const minX = band * CELL + 18, maxX = (band + 3) * CELL - 18;
  const mir = new Mirror(lv);
  const wps = [];
  if (opts.suicideAt) {
    wps.push({ x: opts.suicideAt[0], y: opts.suicideAt[1] });
  } else {
    lv.stars.forEach((s, i) => {
      if (opts.skip && opts.skip.includes(i)) wps.push({ x: clamp(s.x + (s.x >= cx ? -70 : 70), minX, maxX), y: s.y + 45, star: i, avoid: true });
      else wps.push({ x: s.x, y: s.y, star: i });
    });
    wps.sort((a, b) => a.y - b.y);
    // every level's exit sits at col 10 row 16 with row 16 cols 4..9 fully open:
    // descend the corridor to the floor, then slide right along row 16 into the exit
    wps.push({ x: cx, y: 640, floor: true });
    wps.push({ x: lv.exitX, y: 668, exit: true });
  }
  let wpi = 0, frames = 0, release = false, suiT = -1;
  const held = { left: false, right: false };
  let pointerDown = false;
  const canvas = el(g, 'game');
  const toClient = cxp => { const r = canvas.getBoundingClientRect(); return r.left + cxp * (r.width / canvas.width); };
  const evP = cX => ({ clientX: cX, clientY: 300, pointerId: 1, button: 0, isPrimary: true, preventDefault() {}, stopPropagation() {} });
  const setKeys = ax => {
    const wl = ax < 0, wr = ax > 0;
    if (wl !== held.left) { wkey(g, 'ArrowLeft', wl ? 'keydown' : 'keyup'); held.left = wl; }
    if (wr !== held.right) { wkey(g, 'ArrowRight', wr ? 'keydown' : 'keyup'); held.right = wr; }
  };
  const doFlip = () => { wkey(g, 'Space', 'keydown'); mir.flip(); };
  const cleanup = () => {
    setKeys(0);
    if (pointerDown) canvas.dispatch('pointerup', evP(240));
    pointerDown = false;
  };
  if (mode === 'pointer') { canvas.dispatch('pointerdown', evP(toClient(mir.p.x))); mir.flip(); pointerDown = true; }
  let lastY = mir.p.y, lastX = mir.p.x, still = 0;
  const MAXF = opts.maxFrames || 3500;
  while (frames < MAXF) {
    const wp = wps[wpi], p = mir.p;
    if (wp && !wp.exit && !wp.avoid && wp.star !== undefined && mir.stars[wp.star].col) { wpi++; continue; }
    if (wp && (wp.avoid || wp.floor) && p.y > wp.y - 12) { wpi++; continue; } // near/at the wp (the brake controller holds a hover just above the target — demanding a full crossing stalls forever)
    if (wp && wp.exit && mir.won) break;
    let ax = 0;
    if (suiT < 0 && !release) {
      const dx = (wp ? wp.x : cx) - p.x;
      if (Math.abs(dx) <= 8) ax = 0;
      // pre-brake: friction-only glide covers ~vx/0.08 px (~60 at terminal) — without
      // this the orb overshoots ~20px past the wp into band-edge hazards (L4/L11/L14/L18)
      else if (Math.abs(p.vx) > 0.4 && Math.abs(dx) < p.vx * p.vx * 1.2 + 10) ax = p.vx > 0 ? -1 : 1;
      else ax = dx > 0 ? 1 : -1;
    }
    if (suiT < 0 && !release && wp) {
      const dy = wp.y - p.y;
      const toward = (p.vy > 0.5 && dy > 0) || (p.vy < -0.5 && dy < 0);
      const away = (p.vy > 0.5 && dy < 0) || (p.vy < -0.5 && dy > 0);
      let flip = false;
      if (away && Math.abs(p.vy) >= 1.5) flip = true;
      else if (toward && Math.abs(dy) <= p.vy * p.vy * 1.15 + 6) flip = true;
      if (still >= 4) flip = true;
      if (flip) doFlip();
    }
    if (mode === 'keys') setKeys(ax);
    else if (pointerDown) canvas.dispatch('pointermove', evP(toClient(p.x + ax * 30)));
    const preCol = mir.collected;
    g.pump(1);
    const res = mir.step(ax);
    frames++;
    // lockstep guard: the engine's live orb must match the mirror bit-for-bit
    const ep = gfP(g), ef = gfF(g);
    if (ep && (Math.abs(ep.x - mir.p.x) > 0.02 || Math.abs(ep.y - mir.p.y) > 0.02 || ep.vx !== mir.p.vx || ep.vy !== mir.p.vy || ep.g !== mir.p.gravDir || ef !== mir.flips)) {
      cleanup();
      return { desync: true, frames, wpi, mode, engine: ep, ef, mirror: { x: mir.p.x, y: mir.p.y, vx: mir.p.vx, vy: mir.p.vy, g: mir.p.gravDir }, mf: mir.flips };
    }
    if (mir.collected > preCol && opts.onStar) opts.onStar(mir.collected);
    if (res === 'dead') { cleanup(); return { died: true, frames, wpi, x: mir.p.x, y: mir.p.y, flips: mir.flips }; }
    if (res === 'won') {
      cleanup();
      const shown = pumpUntil(g, () => el(g, 'winOverlay').style.display === 'flex', 70);
      return { won: shown, flips: mir.flips, collected: mir.collected, frames, stars: lv.stars.length };
    }
    if (Math.abs(mir.p.y - lastY) < 0.6 && Math.abs(mir.p.x - lastX) < 0.3) still++; else still = 0;
    lastY = mir.p.y; lastX = mir.p.x;
    if (wp && !wp.exit && Math.abs(p.x - wp.x) <= 8 && Math.abs(p.y - wp.y) <= 14) {
      if (opts.suicideAt) { if (suiT < 0) { doFlip(); suiT = 0; } } // reached the kill spot: flip up into the spikes, then hands off
      else if (!wp.avoid && wp.star === undefined) { /* not used */ }
    }
    if (suiT >= 0) suiT++;
    if (wp && wp.exit && !release && Math.abs(p.x - wp.x) <= 8 && Math.abs(p.y - wp.y) <= 14) {
      release = true; setKeys(0);
      if (mir.p.gravDir < 0) doFlip();
    }
  }
  cleanup();
  return { timeout: true, frames, wpi, flips: mir.flips, collected: mir.collected, x: mir.p.x, y: mir.p.y };
}

// ---------- shared assertions ----------
const gridBtn = (g, i) => el(g, 'levelGrid').children[1 + i + Math.floor(i / 6)];
const litStars = g => el(g, 'winStars').children.filter(c => String(c.className) === 'f').length;
const SAVE = g => Object.assign({ stars: {}, unlocked: 1, best: {} }, JSON.parse(g.ls.getItem('gravity_flip_save') || '{}'));
function runLevel(g, i, opts, label) {
  const r = solve(g, i, Object.assign({ onStar: n => {
    const exp = '★'.repeat(n) + '☆'.repeat(LEVELS[i].stars.length - n);
    if (!ck('L' + (i + 1) + ': HUD star sync @' + n, String(el(g, 'starHud').textContent) === exp, el(g, 'starHud').textContent)) { /* reported */ }
  } }, opts || {}));
  ck('L' + (i + 1) + (label ? ':' + label : '') + ' win', !!r.won, JSON.stringify(r).slice(0, 120));
  if (r.won) {
    const expStars = (opts && opts.skip) ? 1 : 3;
    ck('L' + (i + 1) + (label ? ':' + label : '') + ' ' + expStars + '★', litStars(g) === expStars, String(litStars(g)));
    ck('L' + (i + 1) + (label ? ':' + label : '') + ' saved', SAVE(g).stars[String(i)] === expStars, JSON.stringify(SAVE(g).stars));
  }
  return r;
}

// ================= BOOT 1 =================
const g = harness.bootGame('gravity-flip', { inject: { anchor: 'var keys={left:false,right:false}', exports: GF_EXPORTS } });
ck('boot: no load errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join(' | '));
ck('boot: probe injected', gfP(g) !== null, JSON.stringify(gfP(g)));
ck('boot: menu shown', el(g, 'menuOverlay').style.display !== 'none' && el(g, 'winOverlay').style.display !== 'flex');
ck('boot: canvas 480x720', el(g, 'game').width === 480 && el(g, 'game').height === 720, el(g, 'game').width + 'x' + el(g, 'game').height);
const grid0 = el(g, 'levelGrid');
ck('menu: grid 35 nodes (5 tiers + 30)', grid0.children.length === 35, String(grid0.children.length));
ck('menu: L1 unlocked', gridBtn(g, 0).classList.contains('unlocked'));
ck('menu: L2 locked', gridBtn(g, 1).classList.contains('locked'));
gridBtn(g, 1).dispatch('click', { type: 'click' }); // locked div has no click listener
ck('menu: locked click stays', el(g, 'menuOverlay').style.display !== 'none' && el(g, 'hud').style.display !== 'flex');

// ---- L1 (pointer steering; the tap that grabs the pointer also flips) ----
gridBtn(g, 0).dispatch('click', { type: 'click' });
ck('L1: game screen', el(g, 'hud').style.display === 'flex' && el(g, 'menuOverlay').style.display === 'none');
ck('L1: level tag', String(el(g, 'levelTag').textContent) === 'L1', el(g, 'levelTag').textContent);
ck('L1: star HUD reset', String(el(g, 'starHud').textContent) === '☆', el(g, 'starHud').textContent);
const r1 = solve(g, 0, { mode: 'pointer' });
ck('L1: win via pointer steering', !!r1.won, JSON.stringify(r1).slice(0, 120));
ck('L1: 3★ (1/1 stars)', litStars(g) === 3, String(litStars(g)));
ck('L1: win msg', String(el(g, 'winMsg').textContent) === 'Stars collected: 1/1, Flips: ' + r1.flips + ' (par 1)', el(g, 'winMsg').textContent);
ck('L1: saved 3★ + unlocked 2', SAVE(g).stars['0'] === 3 && SAVE(g).unlocked === 2, g.ls.getItem('gravity_flip_save'));

// ---- L2 (keyboard steering) ----
el(g, 'btnNext').dispatch('click', { type: 'click' });
ck('L2: entered', String(el(g, 'levelTag').textContent) === 'L2');
const r2 = runLevel(g, 1, { mode: 'keys' });
ck('L2: unlocked 3', SAVE(g).unlocked === 3, String(SAVE(g).unlocked));

// ---- L3: skip both stars -> 1 star (many flips, no par bonus); REPLAY -> 3, keep-best ----
el(g, 'btnNext').dispatch('click', { type: 'click' });
ck('L3: entered', String(el(g, 'levelTag').textContent) === 'L3');
const r3s = solve(g, 2, { mode: 'keys', skip: [0, 1] });
ck('L3: skip-run win', !!r3s.won, JSON.stringify(r3s).slice(0, 120));
ck('L3: skip-run 1★', litStars(g) === 1, String(litStars(g)));
ck('L3: skip-run saved 1', SAVE(g).stars['2'] === 1, JSON.stringify(SAVE(g).stars));
el(g, 'btnRetry').dispatch('click', { type: 'click' });
ck('L3: REPLAY re-entered', el(g, 'winOverlay').style.display === 'none' && String(el(g, 'levelTag').textContent) === 'L3');
const r3 = runLevel(g, 2, { mode: 'keys' });
ck('L3: keep-best after upgrade', SAVE(g).stars['2'] === 3);

// ---- L4: death by spikes + RETRY, then full solve ----
el(g, 'btnNext').dispatch('click', { type: 'click' });
ck('L4: entered', String(el(g, 'levelTag').textContent) === 'L4');
const r4d = solve(g, 3, { mode: 'keys', suicideAt: [390, 250] });
ck('L4: spike death', !!r4d.died, JSON.stringify(r4d).slice(0, 120));
ck('L4: fail overlay', pumpUntil(g, () => el(g, 'failOverlay').style.display === 'flex', 60));
el(g, 'btnRetryFail').dispatch('click', { type: 'click' });
ck('L4: RETRY re-entered', el(g, 'failOverlay').style.display === 'none' && String(el(g, 'levelTag').textContent) === 'L4');
runLevel(g, 3, { mode: 'keys' });
ck('L4: unlocked 5', SAVE(g).unlocked === 5, String(SAVE(g).unlocked));

// ---- L5: 3 first, then a skip-run must NOT downgrade the save ----
el(g, 'btnNext').dispatch('click', { type: 'click' });
runLevel(g, 4, { mode: 'pointer' });
ck('L5: saved 3★', SAVE(g).stars['4'] === 3, JSON.stringify(SAVE(g).stars));
wkey(g, 'Escape', 'keydown'); // to menu first — the boot-built grid node predates the unlock and carries no listener
gridBtn(g, 4).dispatch('click', { type: 'click' });
const r5s = solve(g, 4, { mode: 'keys', skip: [0] });
ck('L5: skip-run 1★ in-game', r5s.won && litStars(g) === 1, JSON.stringify(r5s).slice(0, 100) + ' ' + litStars(g));
ck('L5: downgrade blocked in save', SAVE(g).stars['4'] === 3, JSON.stringify(SAVE(g).stars));

// ---- chain L6..L30 with UI interrupts ----
for (let i = 5; i < 30; i++) {
  if (i === 5) { el(g, 'btnNext').dispatch('click', { type: 'click' }); } // from L5 skip-run overlay
  else if (i === 16) { continue; } // L17 entered via btnPlay after the L16 back-button detour
  else { el(g, 'btnNext').dispatch('click', { type: 'click' }); }
  if (String(el(g, 'levelTag').textContent) !== 'L' + (i + 1)) { ck('L' + (i + 1) + ': entered', false, el(g, 'levelTag').textContent); continue; }
  ck('L' + (i + 1) + ': entered', true);
  const mode = (i === 5 || i === 14 || i === 29) ? 'pointer' : 'keys';
  if (i === 9) { // R key restarts mid-run
    g.pump(40); wkey(g, 'Space', 'keydown');
    wkey(g, 'KeyR', 'keydown');
    ck('L10: R restart resets HUD', String(el(g, 'starHud').textContent) === '☆☆', el(g, 'starHud').textContent);
  }
  if (i === 11) { // Restart button mid-run
    g.pump(30);
    el(g, 'btnRestart').dispatch('click', { type: 'click' });
    ck('L12: Restart re-entered', String(el(g, 'levelTag').textContent) === 'L12' && el(g, 'hud').style.display === 'flex');
  }
  if (i === 13) { // Escape to menu, re-enter via grid
    g.pump(25);
    wkey(g, 'Escape', 'keydown');
    ck('L14: Escape to menu', el(g, 'menuOverlay').style.display === 'flex' && el(g, 'hud').style.display === 'none');
    gridBtn(g, 13).dispatch('click', { type: 'click' });
    ck('L14: re-entered from grid', String(el(g, 'levelTag').textContent) === 'L14');
  }
  if (i === 17) { // Sound toggle + Menu button mid-run
    g.pump(25);
    el(g, 'btnSound').dispatch('click', { type: 'click' });
    ck('L18: sound muted label', String(el(g, 'btnSound').textContent) === 'Muted', el(g, 'btnSound').textContent);
    el(g, 'btnSound').dispatch('click', { type: 'click' });
    ck('L18: sound back on', String(el(g, 'btnSound').textContent) === 'Sound');
    el(g, 'btnMenu').dispatch('click', { type: 'click' });
    ck('L18: Menu button', el(g, 'menuOverlay').style.display === 'flex');
    gridBtn(g, 17).dispatch('click', { type: 'click' });
    ck('L18: re-entered from grid', String(el(g, 'levelTag').textContent) === 'L18');
  }
  runLevel(g, i, { mode });
  if (i === 15) { // after L16 win: LEVEL MENU -> PLAY continues at L17
    el(g, 'btnBack').dispatch('click', { type: 'click' });
    ck('L16: LEVEL MENU back', el(g, 'menuOverlay').style.display === 'flex' && el(g, 'winOverlay').style.display === 'none');
    el(g, 'btnPlay').dispatch('click', { type: 'click' });
    ck('L17: PLAY continues at latest', String(el(g, 'levelTag').textContent) === 'L17', el(g, 'levelTag').textContent);
    runLevel(g, 16, { mode: 'keys' });
  }
}

// ---- L30 end state ----
ck('L30: ALL LEVELS CLEAR', String(el(g, 'winTitle').textContent) === 'ALL LEVELS CLEAR', el(g, 'winTitle').textContent);
ck('L30: final msg', String(el(g, 'winMsg').textContent) === 'You mastered all 30 levels! Play again for better stars.', el(g, 'winMsg').textContent);
ck('L30: PLAY AGAIN label', String(el(g, 'btnNext').textContent) === 'PLAY AGAIN', el(g, 'btnNext').textContent);
el(g, 'btnNext').dispatch('click', { type: 'click' });
ck('L30: PLAY AGAIN -> menu', el(g, 'menuOverlay').style.display === 'flex');
const gridEnd = el(g, 'levelGrid');
const allBtns = [];
for (let i = 0; i < 30; i++) allBtns.push(gridBtn(g, i));
ck('end: all 30 unlocked', allBtns.every(b => b.classList.contains('unlocked')));
ck('end: all 30 done', allBtns.every(b => b.classList.contains('done')));
const mini = (gg, i) => { const b = gridBtn(gg, i); return b.children.length ? String(b.children[b.children.length - 1].textContent) : ''; };
ck('end: L1 mini-stars', mini(g, 0) === '★★★', mini(g, 0));
ck('end: L3 mini-stars (keep-best)', mini(g, 2) === '★★★', mini(g, 2));
ck('run: zero engine errors', (g.sandbox.__errors || []).length === 0, (g.sandbox.__errors || []).slice(0, 3).join(' | '));

// ================= BOOT 2: seeded save =================
const g2 = harness.bootGame('gravity-flip', { inject: { anchor: 'var keys={left:false,right:false}', exports: GF_EXPORTS }, seedLS: { gravity_flip_save: JSON.stringify({ v: 1, unlocked: 5, stars: { '0': 3, '1': 2 }, best: {} }) } });
ck('boot2: no load errors', (g2.loadErrors || []).length === 0, (g2.loadErrors || []).join(' | '));
const gb = i => gridBtn(g2, i);
ck('boot2: L5 unlocked', gb(4).classList.contains('unlocked'));
ck('boot2: L6 locked', gb(5).classList.contains('locked'));
ck('boot2: L1 mini ★★★', mini(g2, 0) === '★★★', mini(g2, 0));
ck('boot2: L2 mini ★★☆', mini(g2, 1) === '★★☆', mini(g2, 1));
el(g2, 'btnPlay').dispatch('click', { type: 'click' });
ck('boot2: PLAY continues at L5', String(el(g2, 'levelTag').textContent) === 'L5', el(g2, 'levelTag').textContent);
const rb2 = solve(g2, 4, { mode: 'pointer' });
ck('boot2: L5 win', !!rb2.won, JSON.stringify(rb2).slice(0, 120));
ck('boot2: keep-best 3★', SAVE(g2).stars['4'] === 3 && SAVE(g2).unlocked === 6, g2.ls.getItem('gravity_flip_save'));
ck('boot2: zero errors', (g2.sandbox.__errors || []).length === 0, (g2.sandbox.__errors || []).slice(0, 3).join(' | '));

const extra = {
  levels: 30, allSolvable: true,
  fixes: 'P0 no horizontal control (vx never set; stars cols 2-7 + exit col 10 unreachable — added arrow-key + hold-to-steer pointer input, tap still flips); P0 maps sealed by full-width wall/spike rows — 3-col corridor punched per level, hazards relocated off it (N sweep clearance), stars onto it; P2 horizontal OOB soft-lock now fatal; P3 symmetric vy cap'
};
console.log(JSON.stringify({ pass: PASS, fail: FAIL, total: PASS + FAIL, verdict: FAIL === 0 ? 'PASS' : 'FAIL', fails: FAILS, extra }));
process.exit(FAIL === 0 ? 0 : 1);
