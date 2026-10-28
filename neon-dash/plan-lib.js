#!/usr/bin/env node
/* R970 neon-dash shared planner: exact per-frame DP over the engine's deterministic
 * physics, returning BOTH the verdict and the concrete input plan, so the plan can be
 * replayed against the real engine (verify_real_replay.js) for double-validation.
 *
 * Why per-frame DP and not BFS: player.x advances deterministically
 * (x = START_X + frame*speed), so the search collapses to "propagate the reachable set
 * forward one frame at a time" — memory is one frame's set, not the whole frontier.
 *
 * Engine refs: index.html L2177-2196 (consts), L2428-2436 (getLevelLength),
 * L2645-2732 (checkCollisions incl. block-landing / spike / orb / moving_platform /
 * portal), L2824-2950 (update + completion), L2486-2520 (input), L2972 (flag clear).
 */
const fs = require('fs');
const path = require('path');

function extractArray(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + marker);
  const s = src.indexOf('[', i);
  let d = 0, j = s, inStr = null;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === '[') d++; else if (ch === ']') { d--; if (!d) break; }
  }
  return eval('(' + src.slice(s, j + 1) + ')');
}

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const LEVELS = extractArray(HTML, 'var LEVELS =');

const num = (re, d) => { const m = HTML.match(re); return m ? parseFloat(m[1]) : d; };
const GROUND_Y = num(/var GROUND_Y\s*=\s*([\d.]+)/, 370);
const PLAYER_SIZE = num(/var PLAYER_SIZE\s*=\s*([\d.]+)/, 30);
const PLAYER_HIT = num(/var PLAYER_HIT\s*=\s*([\d.]+)/, 28);
const HIT_OFFSET = (PLAYER_SIZE - PLAYER_HIT) / 2;
const GRAVITY_CUBE = num(/var GRAVITY_CUBE\s*=\s*([\d.]+)/, 0.8);
const JUMP_FORCE = num(/var JUMP_FORCE\s*=\s*([\d.]+)/, -12);
const GRAVITY_SHIP = num(/var GRAVITY_SHIP\s*=\s*([\d.]+)/, 0.5);
const FLY_FORCE = num(/var FLY_FORCE\s*=\s*([\d.]+)/, -0.8);
const CANVAS_W = num(/var CANVAS_W\s*=\s*([\d.]+)/, 800);
const CANVAS_H = num(/var CANVAS_H\s*=\s*([\d.]+)/, 450);
const START_X = num(/x:\s*([\d.]+),\s*y:\s*GROUND_Y\s*-\s*PLAYER_SIZE/, 100);

const aabb = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

const levelLength = lv => (lv.obstacles || []).reduce((m, o) => Math.max(m, o.x + (o.w || 30)), 0) + 500;

// one engine frame, given the state at frame `frames` and the decision for this frame.
// `nx` is the x the engine will have AFTER its own `player.x += speed`.
function step(st, jp, held, lv, nx) {
  const speed = lv.speed || 6;
  const x = nx;
  let vy = st.vy, y = st.y, grounded = st.grounded, mode = st.mode, gdir = st.gdir;

  switch (mode) {
    case 'cube':
      vy += GRAVITY_CUBE; y += vy;
      if (y >= GROUND_Y - PLAYER_SIZE) { y = GROUND_Y - PLAYER_SIZE; vy = 0; grounded = true; }
      if (y < 0) { y = 0; vy = 0; }
      if (jp && grounded) { vy = JUMP_FORCE; grounded = false; }
      break;
    case 'ship':
      vy += held ? FLY_FORCE : GRAVITY_SHIP;
      vy = Math.max(-8, Math.min(8, vy)); y += vy;
      if (y < 10) { y = 10; vy = 0; }
      if (y > 400) { y = 400; vy = 0; }
      grounded = false;
      break;
    case 'ball':
      vy += GRAVITY_CUBE * gdir; y += vy;
      if (gdir === 1 && y >= GROUND_Y - PLAYER_SIZE) { y = GROUND_Y - PLAYER_SIZE; vy = 0; grounded = true; }
      if (gdir === -1 && y <= 10) { y = 10; vy = 0; grounded = true; }
      if (jp) { gdir *= -1; vy = 0; grounded = false; }
      break;
    case 'wave': {
      const diag = speed * 1.2 * 0.707;
      y += held ? -diag : diag;
      if (y < 10) y = 10;
      if (y > GROUND_Y - PLAYER_SIZE) y = GROUND_Y - PLAYER_SIZE;
      vy = 0; grounded = false;
      break;
    }
    default: return null;
  }

  const ph = { x: x + HIT_OFFSET, y: y + HIT_OFFSET, w: PLAYER_HIT, h: PLAYER_HIT };
  for (const o of (lv.obstacles || [])) {
    const ox = o.x, oy = o.y, ow = o.w || 30, oh = o.h || 30;
    if (ox + ow < x - 100 || ox > x + CANVAS_W) continue;
    if (o.type === 'block' || o.type === 'pillar') {
      if (o.type === 'block' && vy >= 0 && y + PLAYER_SIZE <= oy + 4 && ph.x < ox + ow && ph.x + ph.w > ox) {
        y = oy - PLAYER_SIZE; vy = 0; grounded = true; continue;
      }
      if (aabb(ph.x, ph.y, ph.w, ph.h, ox, oy, ow, oh)) return null;
    } else if (o.type === 'spike') {
      let sx = ox + 5, sy = oy + 5, sw = ow - 10, sh = oh - 10;
      if (sw < 5) sw = 5;
      if (sh < 5) sh = 5;
      if (aabb(ph.x, ph.y, ph.w, ph.h, sx, sy, sw, sh)) return null;
    } else if (o.type === 'orb') {
      if (aabb(ph.x, ph.y, ph.w, ph.h, ox, oy, ow, oh) && jp) { vy = JUMP_FORCE * 1.3; grounded = false; }
    } else if (o.type === 'moving_platform') {
      const mpY = oy + Math.sin((x * 0.02) + (o.phase || 0)) * (o.range || 60);
      if (aabb(ph.x, ph.y, ph.w, ph.h, ox, mpY, ow, oh)) {
        if (vy >= 0 && y + PLAYER_SIZE <= mpY + 4) { y = mpY - PLAYER_SIZE; vy = 0; grounded = true; }
        else return null;
      }
    } else if (o.type === 'portal') {
      if (aabb(ph.x, ph.y, ph.w, ph.h, ox, oy, ow, oh) && o.mode && mode !== o.mode) {
        mode = o.mode;
        if (mode === 'ball') gdir = 1;
      }
    }
  }
  if (y > CANVAS_H + 50) return null;
  return { y, vy, grounded, mode, gdir };
}

/**
 * @returns {{solvable:boolean, why:string, plan:string, frames:number, peak:number, ms:number}}
 * plan[f] === 'J' = tap this frame (cube/ball), 'H' = hold this frame (ship/wave),
 * '.' = no input. `solvable:false` with why='NO_PATH' means the reachable set was
 * FULLY exhausted with no surviving route to the goal — that is a proof of unwinnable.
 * why='TIMEOUT'/'FRAMECAP' means the search did NOT finish, i.e. indeterminate.
 */
function solve(lv, budgetMs) {
  const t0 = Date.now();
  const goal = levelLength(lv) - 100;
  const speed = lv.speed || 6;
  const y0 = GROUND_Y - PLAYER_SIZE;
  const start = { y: y0, vy: 0, grounded: true, mode: 'cube', gdir: 1, from: null, ch: '.' };
  let cur = new Map([[`cube|1|${y0}|0|1`, start]]);
  let frames = 0, peak = cur.size;

  const rebuild = node => { let plan = ''; while (node && node.from) { plan = node.ch + plan; node = node.from; } return plan; };

  // R325: accumulate x exactly like the engine's per-frame `player.x += speed`.
  let nx = START_X;

  while (true) {
    if (Date.now() - t0 > budgetMs) return { solvable: false, why: 'TIMEOUT', plan: '', frames, peak, ms: Date.now() - t0 };
    if (frames > 60000) return { solvable: false, why: 'FRAMECAP', plan: '', frames, peak, ms: Date.now() - t0 };
    // R325: advance x the SAME way the engine does. The engine runs
    // `player.x += speed` once per frame (index.html update(), ~L2841), which
    // ACCUMULATES rounding error; this solver previously used the closed form
    // START_X + (frames+1)*speed. The two disagree by ~5e-12 after ~200 frames
    // of speed 4.2, and that flips a strict AABB tie: on Level 4 the spike inset
    // at bx=1095 is compared as (x + 29) > 1095. Closed form gives exactly 1095.0
    // -> false (survives); accumulated gives 1095.0000000000050022 -> true (dies).
    // The planner therefore declared a level solvable that the real engine kills.
    // The increment runs on EVERY iteration (the engine's first update() also
    // moves x off START_X), matching the original `frames+1` semantics.
    nx += speed;
    if (nx >= goal) {
      return { solvable: true, why: '', plan: rebuild(cur.values().next().value), frames, peak, ms: Date.now() - t0 };
    }
    const next = new Map();
    for (const st of cur.values()) {
      const decs = (st.mode === 'cube' || st.mode === 'ball') ? [['.', false, false], ['J', true, false]] : [['.', false, false], ['H', false, true]];
      for (const [ch, jp, hd] of decs) {
        const r = step(st, jp, hd, lv, nx);
        if (!r) continue;
        const k = `${r.mode}|${r.gdir}|${r.y.toFixed(4)}|${r.vy.toFixed(4)}|${r.grounded ? 1 : 0}`;
        if (next.has(k)) continue;
        next.set(k, { ...r, from: st, ch });
      }
    }
    if (!next.size) return { solvable: false, why: 'NO_PATH', plan: '', frames, peak, ms: Date.now() - t0 };
    cur = next; frames++;
    if (cur.size > peak) peak = cur.size;
  }
}

function planAll(budgetMs) {
  return LEVELS.map((lv, i) => ({ level: i + 1, ...solve(lv, budgetMs) }));
}

module.exports = {
  LEVELS, solve, planAll, extractArray, step, aabb, levelLength,
  CONSTS: { GROUND_Y, PLAYER_SIZE, PLAYER_HIT, GRAVITY_CUBE, JUMP_FORCE, GRAVITY_SHIP, FLY_FORCE, CANVAS_W, CANVAS_H, START_X },
};

if (require.main === module) {
  console.log('neon-dash R970 exact-physics DP solvability (all levels; timeout/framecap = INDETERMINATE = FAIL):');
  console.log('consts read from engine: ' + JSON.stringify(module.exports.CONSTS));
  const res = planAll(20000);
  let ok = 0, unwinnable = 0, indet = 0;
  for (const r of res) {
    const lv = LEVELS[r.level - 1];
    if (r.solvable) ok++;
    else if (r.why === 'NO_PATH') unwinnable++;
    else indet++;
    console.log(`L${String(r.level).padStart(2)} ${lv.name.padEnd(19).slice(0, 19)} ` +
      (r.solvable ? `SOLVABLE frames=${r.frames} peak=${r.peak} plan=${r.plan.length} ${r.ms}ms`
        : `${r.why} frames=${r.frames} peak=${r.peak}`));
  }
  console.log(JSON.stringify({
    pass: ok, total: LEVELS.length, unwinnableProven: unwinnable, indeterminate: indet,
    verdict: ok === LEVELS.length ? 'PASS' : 'FAIL',
    obstacleTypes: [...new Set(LEVELS.flatMap(l => (l.obstacles || []).map(o => o.type)))],
  }));
  process.exit(ok === LEVELS.length ? 0 : 1);
}