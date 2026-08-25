#!/usr/bin/env node
/* big-tall-small verifier — 30 lockstep-platformer levels solved through the engine's
 * real input path (document keydown/keyup -> keysPressed -> updatePhysics).
 * All three characters share one input stream (the game's core twist), so levels are
 * solved with a beam search over macro actions (hold dir / hold dir+jump / wait),
 * snapshotting/restoring the engine's IIFE state between branches.
 *
 * P0 fixed along the way (verify-evidence/ has the before): parseLevel/resetLevel looped
 * `col < GRID_H` (12) over 16-wide maps — cols 12-15 (right wall + 10 levels' starting
 * chars, Tight Squeeze's exit) were silently dropped, making those levels unwinnable.
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('big-tall-small', { inject: {
  anchor: 'function checkWin() {',
  exports: `globalThis.__BT = {
    n: () => levels.length,
    load: (i) => { startLevel(i); },
    done: () => gameState.levelComplete === true,
    goal: () => exitZone ? { x: exitZone.x, y: exitZone.y } : null,
    snap: () => JSON.stringify({ c: chars, b: boxes, t: turrets, bl: bullets, k: keys, d: doors, btn: buttons, hk: hasKey, gs: { ac: gameState.activeChar, de: gameState.deaths, rs: gameState.respawning }, tc: turretCooldown, bc: buttonCooldown }),
    restore: (s) => { var o = JSON.parse(s); chars = o.c; boxes = o.b; turrets = o.t; bullets = o.bl; keys = o.k; doors = o.d; buttons = o.btn; hasKey = o.hk; gameState.activeChar = o.gs.ac; gameState.deaths = o.gs.de; gameState.respawning = o.gs.rs; gameState.levelComplete = false; turretCooldown = o.tc; buttonCooldown = o.bc; particles = []; },
    chars: () => ({ b: chars.big, t: chars.tall, s: chars.small }),
    deaths: () => gameState.deaths,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
// this engine binds key events on document (harness api.key() only reaches body)
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, code: k, preventDefault() {} });
const ku = (k) => g.sandbox.document.dispatch('keyup', { key: k, code: k, preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = g.call('__BT.n()');
T('levels-exist', N === 30, 'n=' + N);

// parser-completeness: post P0-fix every level must materialize all 3 chars + an exit
let parsed = 0;
for (let i = 0; i < N; i++) {
  g.call(`__BT.load(${i})`); g.pump(2);
  const c = g.call('__BT.chars()'), goal = g.call('__BT.goal()');
  if (c.b && c.t && c.s && goal) parsed++;
}
T('parser-complete', parsed === N, parsed + '/' + N);

// input-response: real key events must drive every character (lockstep physics)
g.timers.length = 0; // drop death-respawn timers left by the parser sweep (they'd reset chars mid-test)
g.call('__BT.load(0)'); g.pump(3);
const x0 = JSON.parse(JSON.stringify(g.call('__BT.chars()')));
kd('ArrowRight'); g.pump(10); ku('ArrowRight');
const x1 = JSON.parse(JSON.stringify(g.call('__BT.chars()')));
T('input-response', x1.b.x > x0.b.x && x1.t.x > x0.t.x && x1.s.x > x0.s.x,
  'big ' + (x1.b.x - x0.b.x).toFixed(0) + ' tall ' + (x1.t.x - x0.t.x).toFixed(0) + ' small ' + (x1.s.x - x0.s.x).toFixed(0));
g.pump(45); // settle to ground first (spawn is mid-air)
const x1g = JSON.parse(JSON.stringify(g.call('__BT.chars()')));
kd('ArrowUp'); g.pump(6); ku('ArrowUp');
const x2 = JSON.parse(JSON.stringify(g.call('__BT.chars()')));
T('jump-response', x2.b.y < x1g.b.y || x2.t.y < x1g.t.y || x2.s.y < x1g.s.y,
  'y deltas ' + (x2.b.y - x1g.b.y).toFixed(1) + '/' + (x2.t.y - x1g.t.y).toFixed(1) + '/' + (x2.s.y - x1g.s.y).toFixed(1));

// ---- beam search over macro actions through the real input path ----
const ACTIONS = [];
for (const f of [4, 12, 26]) for (const d of ['ArrowLeft', 'ArrowRight']) for (const j of [false, true]) ACTIONS.push({ d, j, f });
ACTIONS.push({ d: null, j: true, f: 12 }, { d: null, j: false, f: 44 }); // hop in place; wait out death-respawn
const keyUpAll = () => ['ArrowLeft', 'ArrowRight', 'ArrowUp'].forEach(k => ku(k));

function rollout(a) { // returns {won, snap, score}
  if (a.d) kd(a.d);
  if (a.j) kd('ArrowUp');
  g.pump(a.f);
  keyUpAll();
  const won = g.call('__BT.done()');
  const snap = g.call('__BT.snap()'), tmr = g.timers.map(t => ({ ...t }));
  const cs = g.call('__BT.chars()'), gl = g.call('__BT.goal()') || { x: -999, y: -999 };
  let sum = 0, mx = 0;
  for (const k of ['b', 't', 's']) {
    const c = cs[k];
    let sc;
    if (!c || !c.alive) sc = 4000;
    else sc = Math.abs(c.x + c.w / 2 - (gl.x + 16)) + 1.5 * Math.abs(c.y + c.h / 2 - (gl.y + 16));
    sum += sc; if (sc > mx) mx = sc;
  }
  return { won, snap, tmr, score: sum + 0.15 * mx, pos: cs };
}

function runPolicy(seq) { // seq: list of {d, j, f} held phases through real keys; true if won
  for (const ph of seq) {
    if (ph.d) kd(ph.d);
    if (ph.j) kd('ArrowUp');
    g.pump(ph.f); // win freezes the loop (levelComplete gate), so an end-of-phase check can't miss it
    if (ph.d) ku(ph.d);
    if (ph.j) ku('ArrowUp');
    if (g.call('__BT.done()')) return true;
  }
  return false;
}
// closed-loop herd controller: read positions every frame, steer with real keys.
// Catcher tile sits at E.x+32 (by construction). Phase A: anyone east of the catcher ->
// bunny-hop LEFT (hops carry chars over the 32px catcher); Phase B: all west -> plain
// RIGHT so all three pin against the catcher's left face inside E's column. Deaths ->
// release keys and wait out the respawn timer.
function herdSolve(maxFrames) {
  const gl = g.call('__BT.goal()');
  if (!gl) return false;
  let deaths = -1, hold = 0; // vary the neutral wait after each death — deterministic re-runs would otherwise repeat the same death forever
  let mode = 'B'; // herd phase is per-call state — left undeclared it becomes an implicit global leaking the previous level's phase into frame 0
  // catcher tile spans E.x+32..E.x+64; the win set is everyone pinned at its WEST face,
  // so herd until every char's left edge is west of E.x+32 (a right-edge test makes chars
  // surf the boundary at x~183, flipping the phase every frame forever)
  for (let f = 0; f < (maxFrames || 2600); f++) {
    const cs = g.call('__BT.chars()');
    const d = g.call('__BT.deaths()');
    if (d > deaths) { deaths = d; hold = (deaths * 13) % 60 + 8; } // new life: shift timing vs spike/turret cycles
    if (hold > 0) { hold--; g.pump(1); continue; }
    const alive = ['b', 't', 's'].filter(k => cs[k] && cs[k].alive);
    if (!alive.length) { g.pump(1); continue; }              // respawning — stay neutral
    // hysteresis: herd while anyone is east of E.x+40; only pin once EVERYONE is west of
    // E.x+24 (the pin line x=160-w tops out at 150; a single threshold at ~156 gets surfed
    // by a char standing on the catcher)
    if (alive.some(k => cs[k].x > gl.x + 40)) mode = 'A';
    else if (alive.every(k => cs[k].x < gl.x + 24)) mode = 'B';
    const wrong = mode === 'A' ? alive : [];
    const left = wrong.length ? 'ArrowLeft' : null;
    const right = !wrong.length ? 'ArrowRight' : null;
    // hop ONLY to cross the catcher itself — full-time hopping makes tall/small leap ~156px
    // across elevated platforms straight into spike clusters; walking drops them to the
    // (safe) floor instead
    const nearCatcher = wrong.some(k => cs[k].x > gl.x + 32 && cs[k].x < gl.x + 130);
    // key state transitions (only dispatch on change)
    if (left && !g.sandbox.__keysL) { kd('ArrowLeft'); g.sandbox.__keysL = true; }
    if (!left && g.sandbox.__keysL) { ku('ArrowLeft'); g.sandbox.__keysL = false; }
    if (right && !g.sandbox.__keysR) { kd('ArrowRight'); g.sandbox.__keysR = true; }
    if (!right && g.sandbox.__keysR) { ku('ArrowRight'); g.sandbox.__keysR = false; }
    const up = !!left && nearCatcher;
    if (up && !g.sandbox.__keysU) { kd('ArrowUp'); g.sandbox.__keysU = true; }
    if (!up && g.sandbox.__keysU) { ku('ArrowUp'); g.sandbox.__keysU = false; }
    g.pump(1);
    if (g.call('__BT.done()')) { ku('ArrowLeft'); ku('ArrowRight'); ku('ArrowUp'); g.sandbox.__keysL = g.sandbox.__keysR = g.sandbox.__keysU = false; return true; }
  }
  ku('ArrowLeft'); ku('ArrowRight'); ku('ArrowUp'); g.sandbox.__keysL = g.sandbox.__keysR = g.sandbox.__keysU = false;
  return false;
}
// fallback ladder (open-loop grids for levels the controller can't herd)
const POLICIES = [];
for (const cross of [[], [{d:'ArrowLeft',j:false,f:24}], [{d:'ArrowLeft',j:true,f:40}], [{d:'ArrowLeft',j:true,f:64}], [{d:'ArrowRight',j:false,f:24}], [{d:'ArrowRight',j:true,f:40}], [{d:null,j:false,f:44}]])
  for (const climb of ['ArrowRight', 'ArrowLeft'])
    for (const mid of [[], [{d:null,j:false,f:44}]])
      for (const settle of ['ArrowRight', 'ArrowLeft'])
        POLICIES.push([...cross, { d: climb, j: true, f: 650 }, ...mid, { d: settle, j: false, f: 350 }]);
function solveLevel(i) { // policies first, then beam search; returns ms (0 = unsolved)
  g.timers.length = 0; // BEFORE load: a frame-1 spawn death schedules the respawn timer here — wiping after would freeze the level in respawning limbo forever
  g.call(`__BT.load(${i})`); g.pump(1);
  const t0 = Date.now();
  const S0 = g.call('__BT.snap()');
  if (herdSolve(2600)) return Date.now() - t0;
  for (const p of POLICIES) {
    g.call('__BT.restore(' + JSON.stringify(S0) + ')'); g.timers.length = 0;
    if (runPolicy(p)) return Date.now() - t0;
  }
  g.call('__BT.restore(' + JSON.stringify(S0) + ')'); g.timers.length = 0;
  let frontier = [{ snap: g.call('__BT.snap()'), tmr: g.timers.map(t => ({ ...t })), score: 1e9 }];
  let budget = 15000; // rollout cap, NOT wall-clock: a Date.now() cutoff makes pass/fail depend on machine load (worst level needs ~4.4k rollouts, winning at depth 6)
  for (let depth = 0; depth < 60; depth++) {
    if (budget <= 0) break;
    const cand = [];
    for (const node of frontier) {
      for (const a of ACTIONS) {
        g.call(`__BT.restore(${JSON.stringify(node.snap)})`);
        g.timers.length = 0; g.timers.push(...node.tmr.map(t => ({ ...t }))); // respawn timers are part of the branch state
        const r = rollout(a);
        budget--;
        if (r.won) return Date.now() - t0;
        cand.push(r);
      }
    }
    cand.sort((p, q) => p.score - q.score);
    const seen = new Set(); frontier = [];
    for (const c of cand) {
      const key = ['b', 't', 's'].map(k => { const p = c.pos[k]; return p && p.alive ? ((p.x / 4) | 0) + ',' + ((p.y / 4) | 0) : 'X'; }).join('|');
      if (!seen.has(key)) { seen.add(key); frontier.push(c); }
      if (frontier.length >= 28) break;
    }
    if (frontier[0] && frontier[0].score > 3900) break; // everything dead & not respawning back
  }
  return 0;
}

const solved = [];
for (let i = 0; i < N; i++) {
  const ms = solveLevel(i);
  if (ms > 0) solved.push(i + 1);
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved: [' + solved.join(',') + '] missing: [' +
  [...Array(N).keys()].map(i => i + 1).filter(i => !solved.includes(i)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('big-tall-small: lockstep platformer, ' + solved.length + '/' + N + ' levels solved via engine input search: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
