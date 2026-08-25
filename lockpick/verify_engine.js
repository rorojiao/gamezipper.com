#!/usr/bin/env node
/* lockpick verifier — all 30 levels (4 minigame modes) completed through the engine's real
 * input path on the #game-canvas: pin = pointermove to sweet-spot x + pointerdown per pin
 * (held — security pins spring back on pointerup, so tier-2 uses multi-touch-style held
 * presses, exactly like a real two-hand pick); combo = pointerdown drag, dial rotated to each
 * number via exact float pointer displacement; ward = pointerdown + stepwise pointermove drag
 * along a BFS path through the engine's own maze (collision via its cellAt, lives untouched);
 * digital = pump through the engine's 'show' phase then pointerdown taps at each sequence
 * cell. Win signal = the engine's own completeLevel() firing (wrapped at inject). Level chain
 * via the win modal's Next handler (nextLevel), progress gated by the engine's canUnlock. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('lockpick', { inject: {
  anchor: 'function completeLevel() {',
  exports: `
globalThis.__won = -1; globalThis.__updates = 0;
const __origComplete = completeLevel;
completeLevel = function(){ globalThis.__won = state.level; return __origComplete.apply(this, arguments); };
const __origUpdate = update;
update = function(){ globalThis.__updates++; return __origUpdate.apply(this, arguments); };
render = function(){}; // draw-only routine stubbed for headless speed (logic/input untouched)
globalThis.__LP = {
  st: () => state.screen, lvl: () => state.level, mode: () => state.mode, running: () => state.running,
  stars: () => state.stars.slice(), timer: () => state.timer,
  pinsSet: () => state.pinState ? state.pinState.pins.map(p => !!p.set) : null,
  pinSweets: () => state.pinState ? state.pinState.pins.map(p => p.sweet) : null,
  pinSec: () => state.pinState ? state.pinState.pins.map(p => !!p.security) : null,
  pickAngle: () => state.pinState ? state.pinState.pickAngle : null,
  tol: () => state.pinState ? state.pinState.tol : null,
  comboAngle: () => state.comboState ? state.comboState.angle : null,
  comboStep: () => state.comboState ? state.comboState.step : null,
  comboNums: () => LEVELS[state.level] && LEVELS[state.level].nums ? LEVELS[state.level].nums.slice() : null,
  wardPick: () => state.wardState ? { x: state.wardState.pick.x, y: state.wardState.pick.y, lives: state.wardState.lives } : null,
  wardMaze: () => state.wardState ? state.wardState.maze : null,
  wardWH: () => state.wardState ? { w: state.wardState.w, h: state.wardState.h } : null,
  digPhase: () => state.digitalState ? state.digitalState.phase : null,
  digIdx: () => state.digitalState ? state.digitalState.playerIdx : null,
  digSeq: () => state.digitalState ? state.digitalState.seq.slice() : null,
  upd: () => globalThis.__updates, canUnlock: (i) => canUnlock(i), W: () => W, H: () => H,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game-canvas'];
const T0 = Date.now();
const pd = (x, y) => cv.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
const pm = (x, y) => cv.dispatch('pointermove', { clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
const pu = (x, y) => cv.dispatch('pointerup', { clientX: x, clientY: y, pointerId: 1, preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

// --- menu / level-select gating through the engine's own handlers (inline onclick path) ---
g.call('showLevelSelect()');
T('level-modal-open', g.els['level-modal'].classList.contains('show'), 'modal not shown');
g.call('selectLevel(1)');
T('level-2-locked-fresh', C('__LP.st()') === 'menu', 'screen=' + C('__LP.st()') + ' (canUnlock(1)=' + C('__LP.canUnlock(1)') + ')');
g.call("closeModal('level-modal')");
T('level-modal-closed', !g.els['level-modal'].classList.contains('show'), 'modal still shown');

// --- start level 1 via the Play button's handler; first-visit tutorial pops at 400ms ---
g.call('startGame(0)');
T('level-1-started', C('__LP.st()') === 'game' && C('__LP.mode()') === 'pin', 'st=' + C('__LP.st()') + ' mode=' + C('__LP.mode()'));
g.pump(30);
const tutShown = g.els['tutorial-modal'].classList.contains('show');
g.call('closeTutorial()'); // "Got it" button handler
T('tutorial-first-visit-closable', !g.els['tutorial-modal'].classList.contains('show'), 'shown=' + tutShown);

// --- mode solvers (all input = real pointer events on #game-canvas) ---
function solvePin(deadline) {
  const W = C('__LP.W()');
  const sweets = C('__LP.pinSweets()'), tol = C('__LP.tol()');
  for (let i = 0; i < sweets.length; i++) {
    if (C('__LP.pinsSet()')[i]) continue;
    const x = W * 0.18 + ((sweets[i] + 90) / 180) * W * 0.64; // engine's own x->pickTarget map
    pm(x, W / 2);
    let conv = false;
    for (let k = 0; k < 150; k++) { // pickAngle smoothing (dt*8 lerp) must settle within tol
      g.pump(1);
      if (Math.abs(C('__LP.pickAngle()') - sweets[i]) <= tol * 0.4) { conv = true; break; }
      if (Date.now() > deadline) return 'deadline';
    }
    if (!conv) return 'no-converge@pin' + i;
    pd(x, W / 2); // set pin; pointer stays DOWN — security pins (tier 2) spring back on pointerup
    g.pump(2);
  }
  const set = C('__LP.pinsSet()');
  if (!set.every(Boolean)) return 'pins-not-set:' + JSON.stringify(set);
  for (let k = 0; k < 120 && C('__won') !== C('__LP.lvl()'); k++) g.pump(1); // 1300ms win timeout
  return C('__won') === C('__LP.lvl()') ? 'won' : 'win-timeout';
}

function solveCombo(deadline) {
  const W = C('__LP.W()');
  if (!isFinite(C('__LP.comboAngle()'))) return 'dial-angle-NaN'; // P0 regression guard
  const nums = C('__LP.comboNums()');
  let x = W / 2;
  pd(x, W / 2); // grab the dial
  for (let s = 0; s < nums.length; s++) {
    const t = nums[s];
    let guard = 0;
    while (C('__LP.comboStep()') === s && guard++ < 400) {
      if (Date.now() > deadline) return 'deadline';
      const a0 = C('__LP.comboAngle()');
      // dial reading t needs angle ≡ t*3.6deg (mod 360); drag: angle -= dx*0.4rad/px
      let theta = t * 3.6 * Math.PI / 180;
      while (theta - a0 > Math.PI) theta -= 2 * Math.PI;
      while (theta - a0 < -Math.PI) theta += 2 * Math.PI;
      const dx = (a0 - theta) / 0.4;
      x += dx;
      pm(x, W / 2);
      g.pump(6); // engine locks after ≥1 frame at target (350ms timeout -> step++)
    }
    if (C('__LP.comboStep()') !== s + 1) return 'stuck@num' + s + '(step=' + C('__LP.comboStep()') + ')';
    g.pump(30); // lock timeout margin
  }
  for (let k = 0; k < 120 && C('__won') !== C('__LP.lvl()'); k++) g.pump(1); // 1100ms win timeout
  return C('__won') === C('__LP.lvl()') ? 'won' : 'win-timeout';
}

function solveWard(deadline) {
  const W = C('__LP.W()');
  const maze = C('__LP.wardMaze()'), { w, h } = C('__LP.wardWH()');
  let sx = 0, sy = 0, ex = 0, ey = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (maze[y][x] === 2) { sx = x; sy = y; }
    if (maze[y][x] === 3) { ex = x; ey = y; }
  }
  const prev = new Map(); prev.set(sx + ',' + sy, null);
  const q = [[sx, sy]];
  while (q.length) { // BFS over open cells (engine's own wall data)
    const [cx, cy] = q.shift();
    if (cx === ex && cy === ey) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || maze[ny][nx] === 1 || prev.has(k)) continue;
      prev.set(k, cx + ',' + cy); q.push([nx, ny]);
    }
  }
  if (!prev.has(ex + ',' + ey)) return 'no-path(maze-unwinnable)';
  const path = [];
  for (let k = ex + ',' + ey; k; k = prev.get(k)) path.unshift(k.split(',').map(Number));
  const cellSz = W / w;
  const px = (c) => c * cellSz + cellSz / 2;
  pd(px(sx), px(sy)); // pick up the pick at the start cell
  for (const [cx, cy] of path.slice(1)) { // stepwise drag: each pointermove advances ≤ speed(6px)
    let guard = 0;
    while (guard++ < 400) {
      if (Date.now() > deadline) return 'deadline';
      const p = C('__LP.wardPick()');
      if (Math.hypot(px(cx) - p.x, px(cy) - p.y) < cellSz * 0.2) break;
      pm(px(cx), px(cy)); // straight-line step toward next cell center (union of 2 open cells)
      g.pump(1); // engine checks end-proximity in update()
      if (C('__won') === C('__LP.lvl()')) break;
    }
    if (C('__won') === C('__LP.lvl()')) break;
  }
  pu(px(ex), px(ey));
  for (let k = 0; k < 120 && C('__won') !== C('__LP.lvl()'); k++) g.pump(1); // 1100ms win timeout
  if (C('__won') !== C('__LP.lvl()')) return 'no-win';
  return { r: 'won', lives: C('__LP.wardPick()').lives };
}

function solveDigital(deadline) {
  const W = C('__LP.W()');
  let guard = 0;
  while (C('__LP.digPhase()') !== 'input' && guard++ < 900) { // engine's own show phase (0.55s/step)
    g.pump(1);
    if (Date.now() > deadline) return 'deadline';
  }
  if (C('__LP.digPhase()') !== 'input') return 'show-stuck';
  const seq = C('__LP.digSeq()');
  const cell = Math.min(W, C('__LP.H()')) * 0.22;
  const grid = 3 * cell + 2 * 12, sx0 = (W - grid) / 2, sy0 = (W - grid) / 2 + 20;
  for (const n of seq) { // tap centers exactly where the engine's own grid formula puts them
    const bx = sx0 + (n % 3) * (cell + 12), by = sy0 + Math.floor(n / 3) * (cell + 12);
    pd(bx + cell / 2, by + cell / 2);
    pu(bx + cell / 2, by + cell / 2);
    g.pump(2);
    if (Date.now() > deadline) return 'deadline';
  }
  if (C('__LP.digIdx()') !== seq.length) return 'seq-miss(idx=' + C('__LP.digIdx()') + '/' + seq.length + ')';
  for (let k = 0; k < 120 && C('__won') !== C('__LP.lvl()'); k++) g.pump(1); // 1100ms win timeout
  return C('__won') === C('__LP.lvl()') ? 'won' : 'win-timeout';
}

// --- run the full 1..30 chain through the win modal's Next handler ---
const results = [], modes = [];
let wardLivesMin = 3;
for (let lvl = 0; lvl < 30; lvl++) {
  const deadline = Math.min(Date.now() + 9000, T0 + 100000);
  const mode = C('__LP.mode()');
  let r;
  if (mode === 'pin') r = solvePin(deadline);
  else if (mode === 'combo') r = solveCombo(deadline);
  else if (mode === 'ward') { const o = solveWard(deadline); if (typeof o === 'object') { wardLivesMin = Math.min(wardLivesMin, o.lives); r = o.r; } else r = o; }
  else r = solveDigital(deadline);
  results.push(r); modes.push(mode);
  const winModal = g.els['win-modal'].classList.contains('show');
  T('level-' + (lvl + 1) + '-won(' + mode + ')', r === 'won' && winModal, r + ' modal=' + winModal);
  if (r !== 'won') break; // chain is gated by canUnlock — cannot continue honestly past a loss
  if (lvl < 29) g.call('nextLevel()'); // win modal "Next Level" handler
}
T('all-30-levels', results.length === 30 && results.every(r => r === 'won'),
  results.map((r, i) => r === 'won' ? '' : (i + 1) + ':' + r).filter(Boolean).join(','));
T('ward-clean-path', results.length === 30 || !modes.includes('ward') ? wardLivesMin === 3 : true, 'lives=' + wardLivesMin);

// --- progress persisted by the engine's own completeLevel ---
const stars = JSON.parse(g.ls.getItem('lockpick_stars') || '[]');
T('progress-saved', Array.isArray(stars) && stars.length === 30 && stars.every(s => s > 0),
  'saved=' + stars.filter(s => s > 0).length + '/30');

// NOTE: rAF loop hygiene (startGame now cancels the previous level's pending loop — see FIX in
// index.html) cannot be measured here: the harness rAF stub's cancelAnimationFrame is a no-op,
// so every ever-scheduled loop callback keeps firing per pump regardless of the engine's cancels.
// Pre-fix this measured 13 updates/frame after 12 levels; the engine-side cancel is the real fix.

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: results.filter(r => r === 'won').length + '/30', modes: modes[0] + '...' + modes[modes.length - 1], durS: Math.round((Date.now() - T0) / 1000) } };
console.log('lockpick: ' + results.filter(r => r === 'won').length + '/30 levels through real pointer input across pin/combo/ward/digital: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
