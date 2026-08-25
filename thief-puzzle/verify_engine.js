#!/usr/bin/env node
/* thief-puzzle verifier (type A): all 40 levels must be won through the real input path —
 * pointerdown near the hand, pointermove waypoints drawing a path, pointerup releasing it;
 * the hand then follows the polyline at 300px/s while the engine hit-tests walls/lasers/
 * cameras/guards/spikes and doWin fires within 30px of the treasure. Obstacle dynamics are
 * closed-form in levelTime (laser/spike = sin phase gates, cam ang = ang0+spd*t, guard ph =
 * ph0+spd*0.02*t), so the bot plans a TIME-AWARE A* (16px grid, arrival-time-bucketed) using
 * the engine's own obstacle data read at t=0, then executes the exact same polyline through
 * real pointer events. Also exercises: tutorial dismiss, out-of-bounds fail -> CAUGHT panel ->
 * RETRY, real level-select card taps, star saves, persistence. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('thief-puzzle', {
  inject: {
    anchor: 'function makeLevel(idx){',
    exports: `globalThis.__R = {
      st: () => state, lv: () => currentLvl, n: () => TOTAL,
      tut: () => tutorial.active,
      hand: () => ({ x: hand.x, y: hand.y }),
      tgt: () => ({ x: target.x, y: target.y }),
      obs: () => obs.map(function(o){ return { t: o.t, x: o.x, y: o.y, w: o.w, h: o.h, vert: !!o.vert, len: o.len, per: o.per, ph: o.ph, ang: o.ang, span: o.span, spd: o.spd, rng: o.rng, r: o.r || 16, vrng: o.vrng || 95, vspan: o.vspan || Math.PI/3.5, sx: o.sx, sy: o.sy, px1: o.px1, py1: o.py1 }; }),
      cleared: () => Object.keys(save.lvls).filter(function(k){ return save.lvls[k].c; }).length,
      starsOf: (l) => (save.lvls[l] ? save.lvls[l].s : 0),
      cvs: () => C,
      ls: () => { try { return localStorage.getItem('gz_thief_v4'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 40, 'n=' + g.call('__R.n()'));

const cv = g.call('__R.cvs()');
const rect = () => cv.getBoundingClientRect();
const pev = (type, gx, gy) => cv.dispatch(type, {
  clientX: rect().left + gx * rect().width / 1280, clientY: rect().top + gy * rect().height / 720,
  pointerId: 9, button: 0, isPrimary: true, preventDefault() {},
});
const tapGame = (gx, gy) => { pev('pointerdown', gx, gy); pev('pointerup', gx, gy); };

// ---------- time-aware A* (host side) ----------
function plan(obs, sx0, sy0, tx, ty, t0) {
  const CS = 16, W = 1280, H = 720, nx = W / CS | 0, ny = H / CS | 0;
  const solid = new Uint8Array(nx * ny);
  for (const o of obs) if (o.t === 'wall') {
    const x0 = Math.max(0, (o.x - 13) / CS | 0), x1 = Math.min(nx - 1, (o.x + o.w + 13) / CS | 0);
    const y0 = Math.max(0, (o.y - 13) / CS | 0), y1 = Math.min(ny - 1, (o.y + o.h + 13) / CS | 0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const cx = x * CS + CS / 2, cy = y * CS + CS / 2;
      const rx = Math.max(o.x, Math.min(cx, o.x + o.w)), ry = Math.max(o.y, Math.min(cy, o.y + o.h));
      if (Math.hypot(cx - rx, cy - ry) < 11) solid[y * nx + x] = 1;
    }
  }
  const TAU = Math.PI * 2;
  const hazAt = (px, py, t) => { // engine hitTest formulas + safety margin
    for (const o of obs) {
      if (o.t === 'laser') {
        if (Math.sin(t / o.per * TAU + o.ph) <= 0) continue;
        if (o.vert) { if (Math.abs(px - o.x) < 14 && Math.abs(py - o.y) < o.len / 2 + 6) return true; }
        else if (Math.abs(py - o.y) < 14 && Math.abs(px - o.x) < o.len / 2 + 6) return true;
      } else if (o.t === 'cam') {
        const dx = px - o.x, dy = py - o.y, d = Math.hypot(dx, dy);
        if (d < o.rng + 6) {
          let df = Math.atan2(dy, dx) - (o.ang + o.spd * t);
          while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU;
          if (Math.abs(df) < o.span / 2 + 0.06) return true;
        }
      } else if (o.t === 'guard') {
        const ph = o.ph + o.spd * 0.02 * t;
        const gx2 = o.sx + (o.px1 - o.sx) * 0.5 * (1 + Math.sin(ph));
        const gy2 = o.sy + (o.py1 - o.sy) * 0.5 * (1 + Math.cos(ph * 0.7));
        const dx = px - gx2, dy = py - gy2, d = Math.hypot(dx, dy);
        if (d < o.r + 6) return true;
        if (d < o.vrng + 6) {
          const ma = Math.atan2(gy2 - o.sy, gx2 - o.sx);
          let df = Math.atan2(dy, dx) - ma;
          while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU;
          if (Math.abs(df) < o.vspan / 2 + 0.06) return true;
        }
      } else if (o.t === 'spike') {
        if (Math.sin(t / o.per * TAU + o.ph) <= 0.2) continue;
        if (Math.hypot(px - o.x, py - o.y) < o.r + 14) return true;
      }
    }
    return false;
  };
  const wallHit = (px, py) => { // engine circRect with hand radius 10 (+ margin)
    for (const o of obs) if (o.t === 'wall') {
      const rx = Math.max(o.x, Math.min(px, o.x + o.w)), ry = Math.max(o.y, Math.min(py, o.y + o.h));
      if (Math.hypot(px - rx, py - ry) < 10.5) return true;
    }
    return false;
  };
  const seg = (x1, y1, x2, y2, dStart) => { // sample the segment every ~4px with time = t0 + d/300
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / 4));
    for (let i = 0; i <= n; i++) {
      const px = x1 + (x2 - x1) * i / n, py = y1 + (y2 - y1) * i / n;
      if (wallHit(px, py)) return false;
      if (hazAt(px, py, t0 + (dStart + d * i / n) / 300)) return false;
    }
    return true;
  };
  let scx = Math.min(nx - 1, Math.max(0, sx0 / CS | 0)), scy = Math.min(ny - 1, Math.max(0, sy0 / CS | 0));
  let gcx = Math.min(nx - 1, Math.max(0, tx / CS | 0)), gcy = Math.min(ny - 1, Math.max(0, ty / CS | 0));
  if (solid[gcy * nx + gcx]) { // nearest open cell to the target
    outer: for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = gcx + dx, y = gcy + dy;
      if (x >= 0 && y >= 0 && x < nx && y < ny && !solid[y * nx + x]) { gcx = x; gcy = y; break outer; }
    }
  }
  const key = (x, y, b) => (x * ny + y) * 600 + b; // b = bucket = round(dist/8), cap path 4800px
  const h = (x, y) => Math.hypot(tx - (x * CS + CS / 2), ty - (y * CS + CS / 2));
  const heap = [], push = (n2) => { heap.push(n2); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p].f <= heap[i].f) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l].f < heap[m].f) m = l; if (r < heap.length && heap[r].f < heap[m].f) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const seen = new Set(), parent = new Map();
  push({ x: scx, y: scy, d: 0, f: h(scx, scy) });
  seen.add(key(scx, scy, 0));
  let goalNode = null, expanded = 0;
  while (heap.length && expanded++ < 400000) {
    const cur = pop();
    if (cur.x === gcx && cur.y === gcy) { goalNode = cur; break; }
    const cx = cur.x * CS + CS / 2, cy = cur.y * CS + CS / 2;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const x2 = cur.x + dx, y2 = cur.y + dy;
      if (x2 < 1 || y2 < 1 || x2 >= nx - 1 || y2 >= ny - 1) continue;
      if (solid[y2 * nx + x2]) continue;
      const step = (dx && dy ? CS * Math.SQRT2 : CS);
      const d2 = cur.d + step;
      const b2 = Math.round(d2 / 8);
      const k2 = key(x2, y2, b2);
      if (seen.has(k2)) continue;
      const x2c = x2 * CS + CS / 2, y2c = y2 * CS + CS / 2;
      if (!seg(cx, cy, x2c, y2c, cur.d)) continue;
      seen.add(k2); parent.set(k2, { x: cur.x, y: cur.y, b: Math.round(cur.d / 8), d: cur.d });
      push({ x: x2, y: y2, d: d2, f: d2 + h(x2, y2) });
    }
  }
  if (!goalNode) return null;
  // reconstruct cell centers
  const cells = [{ x: gcx, y: gcy }];
  let k = key(gcx, gcy, Math.round(goalNode.d / 8));
  while (parent.has(k)) { const p = parent.get(k); cells.push({ x: p.x, y: p.y }); k = key(p.x, p.y, p.b); }
  cells.reverse();
  const pts = cells.map(c => ({ x: c.x * CS + CS / 2, y: c.y * CS + CS / 2 }));
  pts[0] = { x: sx0, y: sy0 };
  // final exact approach to the treasure, sampled for safety
  const last = pts[pts.length - 1];
  if (Math.hypot(tx - last.x, ty - last.y) > 4) {
    if (!seg(last.x, last.y, tx, ty, goalNode.d)) return null;
    pts.push({ x: tx, y: ty });
  }
  return pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 7);
}

// ---------- play one level (assumes it was JUST loaded, t=0 pristine) ----------
function attempt(t0frames) {
  const obs = g.call('__R.obs()'), h = g.call('__R.hand()'), tg = g.call('__R.tgt()');
  if (g.call('__R.tut()')) tapGame(640, 360); // dismiss tutorial (consumes no time)
  const path = plan(obs, h.x, h.y, tg.x, tg.y, t0frames * 0.01667 + 0.0001);
  if (!path) return 'no-plan';
  if (t0frames) g.pump(t0frames); // advance the obstacle phases before the gesture
  pev('pointerdown', h.x, h.y); // must land within 45px of the hand to start drawing
  for (const p of path) pev('pointermove', p.x, p.y);
  pev('pointerup', path[path.length - 1].x, path[path.length - 1].y);
  let st = null;
  for (let f = 0; f < 1800; f++) { g.pump(1); st = g.call('__R.st()'); if (st !== 'playing') break; }
  return st;
}
function solveLevel() { // retry ladder: delay the start to shift obstacle phases
  const offsets = [0, 40, 100, 200, 350];
  for (let i = 0; i < offsets.length; i++) {
    const res = attempt(offsets[i]);
    if (res === 'complete') return true;
    if (res === 'fail' || res === 'no-plan') { // through the CAUGHT panel's own RETRY button
      g.pump(150); // retract 0.6s + failTimer 1.5s
      if (g.call('__R.st()') === 'fail') tapGame(640, 364); else continue;
      if (g.call('__R.st()') !== 'playing') return 'retry-broken:' + g.call('__R.st()');
    } else return 'st=' + res;
  }
  return 'unbeaten';
}

// ---------- title -> PLAY (real canvas button tap) ----------
g.pump(6); // render title, populate btns
T('title-state', g.call('__R.st()') === 'title', 'st=' + g.call('__R.st()'));
tapGame(640, 378); // PLAY button center
T('play-starts-L1', g.call('__R.st()') === 'playing' && g.call('__R.lv()') === 0, 'st=' + g.call('__R.st()') + ' lv=' + g.call('__R.lv()'));
T('tutorial-shows', g.call('__R.tut()') === true, 'tut=' + g.call('__R.tut()'));

// ---------- fail path: draw off-canvas -> out-of-bounds doFail -> CAUGHT -> RETRY ----------
tapGame(640, 360); // dismiss tutorial
{
  const h = g.call('__R.hand()');
  pev('pointerdown', h.x, h.y);
  pev('pointermove', 500, 100); pev('pointermove', 900, 100); pev('pointermove', 1400, 100);
  pev('pointerup', 1400, 100); // over the top edge, far from the target (1200,360)
  let st = null;
  for (let f = 0; f < 600; f++) { g.pump(1); st = g.call('__R.st()'); if (st !== 'playing') break; }
  T('out-of-bounds-fails', st === 'fail', 'st=' + st);
}
g.pump(150);
T('caught-panel-retry', (() => { tapGame(640, 364); return g.call('__R.st()') === 'playing' && g.call('__R.lv()') === 0; })(), 'st=' + g.call('__R.st()'));

// ---------- level 1 win, then level-select card tap ----------
const solved = [], notes = [];
const T0 = Date.now();
{
  const res = solveLevel();
  T('L1-win', res === true, 'res=' + res);
  if (res === true) solved.push(1);
  else fails.push('L1 not won (' + res + ')');
}
g.pump(120); // completeTimer 1.8s -> panel
T('complete-panel', g.call('__R.st()') === 'complete', 'st=' + g.call('__R.st()'));
tapGame(640, 449); // LEVEL SELECT button
T('level-select-open', g.call('__R.st()') === 'levelSelect', 'st=' + g.call('__R.st()'));
g.pump(3); // render the select grid so the card buttons exist
tapGame(450, 116); // card 2 (level index 1) center: col 1 row 0
T('card2-starts-L2', g.call('__R.st()') === 'playing' && g.call('__R.lv()') === 1, 'lv=' + g.call('__R.lv()'));

// ---------- chain L2..L40 through the win panel's NEXT LEVEL button ----------
for (let li = 1; li < 40 && Date.now() - T0 < 92000; li++) {
  const res = solveLevel();
  if (res !== true) { notes.push('L' + (li + 1) + ' ' + res); fails.push('L' + (li + 1) + ' not won (' + res + ')'); break; }
  T('L' + (li + 1) + '-win', true, '');
  solved.push(li + 1);
  g.call('__R.cleared()');
  if (li < 39) { g.pump(120); if (g.call('__R.st()') !== 'complete') break; tapGame(743, 389); } // NEXT LEVEL
}
T('all-40-solved', solved.length === 40, 'solved=' + solved.length + '/40 ' + notes.slice(0, 4).join('|'));
T('all-cleared', g.call('__R.cleared()') === 40, 'cleared=' + g.call('__R.cleared()'));

// ---------- persistence + stars ----------
T('save-persisted', (() => {
  const d = JSON.parse(g.call('__R.ls()') || '{}');
  const ks = Object.keys(d.lvls || {});
  let stars = 0; ks.forEach(k => { stars += d.lvls[k].s || 0; });
  return ks.length === 40 && ks.every(k => d.lvls[k].c) && stars >= 40;
})(), 'ls=' + String(g.call('__R.ls()')).slice(0, 80));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/40', notes: notes.slice(0, 6) } };
console.log('thief-puzzle: ' + solved.length + '/40 levels stolen via real drag paths: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
