#!/usr/bin/env node
/* fireboy-watergirl verifier — 25 co-op platformer levels (type A/B).
 * Real input path throughout: window keydown/keyup events -> Input keys ->
 * gameLoop physics (moveEntity gravity/jump/collision) -> the engine's own
 * checkExit (both heroes' feet on their exit tiles) -> completeLevel -> save.
 * Level entry via the real level-grid card click (G.sel -> btn.onclick -> G.start),
 * chained with G.nextLevel() (the exact global the Next Level button calls).
 * Bot: a greedy hop planner that mirrors the engine's exact physics (vx=4, jump
 * vy=-12, gravity +0.5/frame, 28x26 AABB vs 32px tiles) simulates every candidate
 * jump arc against the level's tile map and walks+jumps the heroes to their exits;
 * heroes are parked on their exit columns, then both jump together so both feet
 * enter their exit tiles on the same frame (the engine's own win check).
 * Engine P0s found & fixed (see index.html FIX comments): jump rise 115px < the
 * 128px exit-platform height on L1-4 (unwinnable tutorial), L5 exit stairs 6 rows
 * above the highest reachable platform, genLevel hazards merging into 6-12 tile
 * uncrossable lakes / covering the spawn / sitting under row-18 platforms. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('fireboy-watergirl', { inject: {
  anchor: 'function checkExit(){',
  exports: `globalThis.__FW = {
    st: () => state, lvl: () => currentLevel, n: () => LEVELS.length,
    lv: (n) => LEVELS[n - 1].tiles,
    fb: () => [fireboy.x, fireboy.y, fireboy.onGround],
    wg: () => [watergirl.x, watergirl.y, watergirl.onGround],
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-25', call('__FW.n()') === 25, 'n=' + call('__FW.n()'));

const TS = 32, ROWSN = 22, COLSN = 40, W = 28, H = 26;
const solid = (t, c, r) => r >= 0 && r < ROWSN && c >= 0 && c < COLSN && t[r][c] === 1;
const hazAt = (t, kind, c, r) => { // engine isHazard: fire dies in water/acid, water in lava/acid
  const v = r >= 0 && r < ROWSN && c >= 0 && c < COLSN ? t[r][c] : 0;
  return kind === 'fb' ? v === 3 || v === 4 : v === 2 || v === 4;
};
/* simulate one jump arc with the engine's exact frame physics from a standing
 * position (mirrors moveEntity: x+=vx then clamp; vy+=.5 clamp 12; y+=vy then
 * land/bump; hazard checked at feet-center tile every frame) */
function simFlight(t, kind, x0, y0, maxF) {
  let x = x0, y = y0, vy = -12;
  for (let f = 0; f < (maxF || 200); f++) {
    x += 4;
    let top = Math.floor(y / TS), bot = Math.floor((y + H - 1) / TS);
    for (let r = top; r <= bot; r++) for (let c = Math.floor(x / TS); c <= Math.floor((x + W) / TS); c++)
      if (solid(t, c, r)) { x = c * TS - W; } // engine clamps + vx=0; hero slides down faces (Right held)
    vy += 0.5; if (vy > 12) vy = 12;
    y += vy;
    top = Math.floor(y / TS); bot = Math.floor((y + H - 1) / TS);
    let landRow = -1;
    for (let r = top; r <= bot; r++) for (let c = Math.floor(x / TS); c <= Math.floor((x + W) / TS); c++)
      if (solid(t, c, r)) { if (vy > 0) { y = r * TS - H; vy = 0; landRow = r; } else if (vy < 0) { y = (r + 1) * TS; vy = 0; } }
    const hc = Math.floor((x + W / 2) / TS), hr = Math.floor((y + H - 2) / TS);
    if (hazAt(t, kind, hc, hr)) return { dead: true };
    if (landRow >= 0) { // reject phantom edge landings (<8px support): the engine
      // allows boundary-touch stands but takeoff jitter can't reproduce them
      let ov = 0;
      for (let c = Math.floor(x / TS); c <= Math.floor((x + W) / TS); c++)
        if (solid(t, c, landRow)) ov += Math.min(x + W, (c + 1) * TS) - Math.max(x, c * TS);
      if (ov < 8) return null;
      // standing probe: the engine's hazard check dips into the support row every
      // other frame (gravity re-settles y by +0.5), so a center-over-pit landing dies
      if (hazAt(t, kind, hc, landRow)) return { dead: true };
      return { row: landRow, x };
    }
  }
  return null;
}
/* route search: memoized DFS over standing states (row, col). From each standing
 * spot try a takeoff at every col of the current solid run (rightward); a landing
 * on the exit platform is the goal; every extra hop costs a little; landings with
 * no onward hop are dead ends. Greedy one-step lookahead parks heroes on run edges
 * that dead-end the next hop (verified L5/L11) — the full route fixes that. */
/* the controller's jump fires 0-2 frames after the trigger col crossing, so the
 * real takeoff x lands in [c*32-14, c*32-2] — near platform edges that jitter flips
 * bump outcomes. A candidate counts only if BOTH extremes land on the same run. */
function robustArc(t, kind, c, y0) {
  const la = simFlight(t, kind, c * TS - 13, y0), lb = simFlight(t, kind, c * TS - 2, y0);
  if (!la || !lb || la.dead || lb.dead || la.row !== lb.row) return null;
  if (lb.x <= c * TS - 2 + 24) return null;
  // both landings must sit ON the run (center over solid), not edge-hangs: an
  // edge-hang state dead-ends (no takeoff possible, walk-off only)
  if (!solid(t, Math.floor((la.x + 14) / TS), la.row) || !solid(t, Math.floor((lb.x + 14) / TS), lb.row)) return null;
  return la;
}
/* walking off a run's right edge (Right held): deterministic fall — vy starts 0,
 * x keeps drifting +4/frame until landing below; same collision/probe rules */
function fallFlight(t, kind, x0, y0, maxF) {
  let x = x0, y = y0, vy = 0;
  for (let f = 0; f < (maxF || 200); f++) {
    x += 4;
    let top = Math.floor(y / TS), bot = Math.floor((y + H - 1) / TS);
    for (let r = top; r <= bot; r++) for (let c = Math.floor(x / TS); c <= Math.floor((x + W) / TS); c++)
      if (solid(t, c, r)) { x = c * TS - W; }
    vy += 0.5; if (vy > 12) vy = 12;
    y += vy;
    top = Math.floor(y / TS); bot = Math.floor((y + H - 1) / TS);
    let landRow = -1;
    for (let r = top; r <= bot; r++) for (let c = Math.floor(x / TS); c <= Math.floor((x + W) / TS); c++)
      if (solid(t, c, r)) { if (vy > 0) { y = r * TS - H; vy = 0; landRow = r; } }
    const hc = Math.floor((x + W / 2) / TS), hr = Math.floor((y + H - 2) / TS);
    if (hazAt(t, kind, hc, hr)) return { dead: true };
    if (landRow >= 0) {
      let ov = 0;
      for (let c = Math.floor(x / TS); c <= Math.floor((x + W) / TS); c++)
        if (solid(t, c, landRow)) ov += Math.min(x + W, (c + 1) * TS) - Math.max(x, c * TS);
      if (ov < 8) return null;
      if (hazAt(t, kind, hc, landRow)) return { dead: true };
      return { row: landRow, x };
    }
  }
  return null;
}
/* walk-off candidate at a run's right end: both edge-crossing extremes must agree */
function walkOff(t, kind, endCol, row) {
  const edge = (endCol + 1) * TS, y0 = row * TS - H;
  const la = fallFlight(t, kind, edge + 0.5, y0), lb = fallFlight(t, kind, edge + 3.5, y0);
  if (!la || !lb || la.dead || lb.dead || la.row !== lb.row) return null;
  if (Math.floor((lb.x + 14) / TS) <= endCol) return null; // must land forward of the edge
  if (!solid(t, Math.floor((la.x + 14) / TS), la.row) || !solid(t, Math.floor((lb.x + 14) / TS), la.row)) return null;
  return la;
}
const memo = new Map();
function solve(t, kind, col, row, depth) {
  if (depth > 12) return -1e9;
  const key = row * 64 + col;
  if (memo.has(key)) return memo.get(key);
  memo.set(key, -1e9); // in-progress guard (rightward progress makes cycles impossible)
  let end = col;
  while (end + 1 < COLSN - 1 && solid(t, end + 1, row)) end++;
  while (end > 0 && !solid(t, end, row)) end--; // center may stand past the edge (>=8px overlap)
  let start = end;
  while (start - 1 >= 1 && solid(t, start - 1, row)) start--;
  const y0 = row * TS - H;
  let best = -1e9;
  if (end < COLSN - 2 && !solid(t, end + 1, row)) { // walk off the run's right edge
    const w = walkOff(t, kind, end, row);
    if (w) {
      const isExit = w.row === goal.platRow && w.row < 20 && w.x + 14 >= goal.platC0 * TS - 8;
      const v = isExit ? 2e6 + w.x : solve(t, kind, Math.floor((w.x + 14) / TS), w.row, depth + 1) - 100;
      if (v > best) best = v;
    }
  }
  for (let c = start; c <= end; c++) { // whole-run scan: the hero can walk left to a takeoff
    const land = robustArc(t, kind, c, y0);
    if (!land) continue;
    const isExit = land.row === goal.platRow && land.row < 20 && land.x + 14 >= goal.platC0 * TS - 8;
    const v = isExit ? 2e6 + land.x : solve(t, kind, Math.floor((land.x + 14) / TS), land.row, depth + 1) - 300;
    if (v > best) best = v;
  }
  memo.set(key, best);
  return best;
}
function planHop(t, kind, col, row) {
  memo.clear();
  let end = col;
  while (end + 1 < COLSN - 1 && solid(t, end + 1, row)) end++;
  while (end > 0 && !solid(t, end, row)) end--; // center may stand past the edge (>=8px overlap)
  let start = end;
  while (start - 1 >= 1 && solid(t, start - 1, row)) start--;
  const y0 = row * TS - H;
  let best = null, bestScore = solve(t, kind, col, row, 0);
  if (end < COLSN - 2 && !solid(t, end + 1, row)) { // prefer walking off if it's on the best route
    const w = walkOff(t, kind, end, row);
    if (w) {
      const isExit = w.row === goal.platRow && w.row < 20 && w.x + 14 >= goal.platC0 * TS - 8;
      const v = isExit ? 2e6 + w.x : memo.get(w.row * 64 + Math.floor((w.x + 14) / TS)) - 100;
      if (v !== undefined && v >= bestScore - 1) return { takeoffCol: Infinity, land: w };
    }
  }
  for (let c = start; c <= end; c++) {
    const land = robustArc(t, kind, c, y0);
    if (!land) continue;
    const isExit = land.row === goal.platRow && land.row < 20 && land.x + 14 >= goal.platC0 * TS - 8;
    const v = isExit ? 2e6 + land.x : memo.get(land.row * 64 + Math.floor((land.x + 14) / TS)) - 300;
    if (v !== undefined && v >= bestScore - 1) { bestScore = v; best = { takeoffCol: c, land }; break; }
  }
  return best;
}
let goal = null; // set per level from its tiles
function readGoal(t) {
  let fbE = null, wgE = null;
  for (let r = 0; r < ROWSN; r++) for (let c = 0; c < COLSN; c++) {
    if (t[r][c] === 8 && !fbE) fbE = { r, c };
    if (t[r][c] === 9 && !wgE) wgE = { r, c };
  }
  const platRow = fbE.r + 1;
  let c0 = fbE.c;
  while (c0 - 1 >= 0 && solid(t, c0 - 1, platRow)) c0--;
  let c1 = fbE.c;
  while (c1 + 1 < COLSN && solid(t, c1 + 1, platRow)) c1++;
  goal = { platRow, platC0: c0, platC1: c1, fbCol: fbE.c, wgCol: wgE.c };
}

// real input helpers: window keydown/keyup -> the engine's Input keys
const KEYS = { fbR: 'ArrowRight', fbL: 'ArrowLeft', fbU: 'ArrowUp', wgR: 'KeyD', wgL: 'KeyA', wgU: 'KeyW' };
const held = new Set();
function setKeys(want) {
  for (const k of [...held]) if (!want.includes(k)) { g.sandbox.dispatchEvent({ type: 'keyup', code: k, key: k, preventDefault() {} }); held.delete(k); }
  for (const k of want) if (!held.has(k)) { g.sandbox.dispatchEvent({ type: 'keydown', code: k, key: k, preventDefault() {} }); held.add(k); }
}
function releaseAll() { setKeys([]); }

// menu -> level select -> real level-card click (G.sel builds btn.onclick=G.start)
call('G.sel()');
const cards = g.els['lgr'].children;
T('grid-25-cards', cards.length === 25, 'cards=' + cards.length);
cards[0].click(); g.pump(2);
T('grid-click-starts', call('__FW.st()') === 'playing' && call('__FW.lvl()') === 1, 'st=' + call('__FW.st()'));

// mechanics: real keypresses move fireboy right (real Input->physics path)
const x0 = call('__FW.fb()')[0];
setKeys([KEYS.fbR]); g.pump(10); releaseAll();
T('key-input-moves', call('__FW.fb()')[0] > x0 + 20, 'dx=' + (call('__FW.fb()')[0] - x0));

const deadline = Date.now() + 98000;
const done = []; const unwon = []; let retries = 0, deaths = 0, hops = 0;
for (let n = 1; n <= 25 && Date.now() < deadline; n++) {
  if (call('__FW.lvl()') !== n) { call('G.start(' + n + ')'); g.pump(2); } // chain broke -> direct load
  const t = call('__FW.lv(' + n + ')');
  readGoal(t);
  let won = false;
  for (let attempt = 0; attempt < 5 && !won; attempt++) {
    if (attempt > 0) { call('G.retry()'); g.pump(2); retries++; }
    won = playLevel(n, t);
    if (Date.now() > deadline) break;
  }
  if (won) {
    done.push(n);
    if (n < 25) { call('G.nextLevel()'); g.pump(2); } // the Next Level button's own handler
  } else {
    unwon.push(n);
    if (n < 25) { call('G.nextLevel()'); g.pump(2); }
  }
}

/* drive one level: park fireboy on his exit column, park watergirl on hers,
 * then both jump together -> the engine's own checkExit -> completeLevel */
function playLevel(n, t) {
  let active = 'fb', phase = 'toExit', plan = null, wasAir = false, jumping = false;
  let lastX = -1, stall = 0, dblTries = 0;
  const budget = Math.min(deadline, Date.now() + 12000);
  while (Date.now() < budget) {
    const st = call('__FW.st()');
    if (st === 'complete') { releaseAll(); return true; }
    if (st === 'dead') { releaseAll(); deaths++; return false; }
    const p = call(active === 'fb' ? '__FW.fb()' : '__FW.wg()');
    const [x, y, og] = p;
    const col = Math.floor((x + 14) / TS), row = Math.floor((y + H) / TS);
    if (og) stall = (Math.abs(x - lastX) < 2 && phase !== 'align' && phase !== 'parked') ? stall + 1 : 0;
    lastX = x;
    if (stall > 500) { releaseAll(); return false; }
    const R = active === 'fb' ? KEYS.fbR : KEYS.wgR, L = active === 'fb' ? KEYS.fbL : KEYS.wgL, U = active === 'fb' ? KEYS.fbU : KEYS.wgU;
    const Uo = active === 'fb' ? KEYS.wgU : KEYS.fbU;
    const exitCol = active === 'fb' ? goal.fbCol : goal.wgCol;
    if (phase === 'toExit') {
      if (!og) { wasAir = true; jumping = false; setKeys([R]); g.pump(1); continue; }
      if (wasAir) { plan = null; wasAir = false; }
      if (row === goal.platRow && col >= goal.platC0 - 1 && col <= goal.platC1 + 1) { phase = 'align'; continue; }
      if (!plan) {
        plan = planHop(t, active, col, row);
        if (!plan) { releaseAll(); return false; } // no forward hop: stuck
      }
      // hold jump until airborne: onGround flickers every other frame, a 1-frame tap
      // can land on an og=false frame and never jump
      if (col >= plan.takeoffCol) jumping = true;
      if (jumping) { setKeys([R, U]); g.pump(1); hops++; }
      else if (plan.takeoffCol < col) { setKeys([L]); g.pump(1); } // walk back to the planned takeoff
      else { setKeys([R]); g.pump(1); }
    } else if (phase === 'align') {
      if (!og) { setKeys([col > exitCol ? L : col < exitCol ? R : []]); g.pump(1); continue; }
      if (col < exitCol) { setKeys([R]); g.pump(1); }
      else if (col > exitCol) { setKeys([L]); g.pump(1); }
      else {
        setKeys([]);
        if (active === 'fb') { active = 'wg'; phase = 'toExit'; plan = null; wasAir = false; lastX = -1; stall = 0; }
        else { phase = 'double'; dblTries++; }
      }
    } else if (phase === 'double') { // both heroes jump together through their exit tiles
      let ok = false;
      for (let f = 0; f < 120; f++) { // hold both jumps: physics identical -> feet enter the exit tiles on the same frame
        setKeys([KEYS.fbU, KEYS.wgU]); g.pump(1);
        if (call('__FW.st()') === 'complete') { ok = true; break; }
      }
      releaseAll();
      if (ok) return true;
      if (dblTries++ < 3) { phase = 'align'; continue; } // realign and retry the pair jump
      return false;
    }
  }
  releaseAll();
  return false;
}

T('levels-complete', done.length === 25, done.length + '/25 done=[' + done.join(',') + '] unwon=[' + unwon.join(',') + ']');
const ls = g.ls.getItem('fbwg_save');
let savedN = 0;
try { savedN = Object.keys(JSON.parse(ls).levels).length; } catch (e) {}
T('save-written', savedN >= 25, ls ? 'levels saved=' + savedN : 'none');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: done.length + '/25', unwon, retries, deaths, hops } };
console.log('fireboy-watergirl: ' + done.length + '/25 levels via real keys -> engine checkExit: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
