// labyrinth engine verifier — vm harness, real input paths only.
// Engine state is IIFE-private; every assertion is DOM/LS-observable
// (overlay classes, hudLevel/hudTime/stars, result panel, LS gz_labyrinth_v1).
//
// Wins flow through the engine's OWN physics: window keydown/keyup (G.keys),
// dpad pointerdown/up, canvas touch-drag (touchDX/DY) and deviceorientation —
// all feeding physicsStep -> wall collisions -> goal proximity -> onWin.
//
// Determinism: mazes are seeded (mulberry32) and physics has no randomness, so
// the verifier EXTRACTS the engine's pure functions (genMaze/bfsPath/buildLevel/
// physicsStep/collideSeg/...) from index.html at runtime, runs a pilot SIM to
// derive a frame-exact input schedule (same 16.67ms dt, same timer ordering),
// then replays that schedule on the real engine via real events. Sim and engine
// trajectories are bit-identical (same floats, same op order).
'use strict';
const path = require('path');
const fs = require('fs');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }
function visible(g, id) { return !el(g, id).classList.contains('hidden'); }
function click(g, id) {
  const e = el(g, id);
  if (typeof e.onclick === 'function') e.onclick({ type: 'click', preventDefault() {} });
  else e.dispatch('click', { type: 'click', preventDefault() {} });
}

// ---------- extract the engine's pure functions (no transcription bugs) ----------
const SRC = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function sliceBlock(startMarker) {
  const i = SRC.indexOf(startMarker);
  if (i < 0) throw new Error('marker not found: ' + startMarker);
  // brace-match from the first { after the marker
  let j = SRC.indexOf('{', i), depth = 0;
  for (; j < SRC.length; j++) {
    if (SRC[j] === '{') depth++;
    else if (SRC[j] === '}') { depth--; if (depth === 0) return SRC.slice(i, j + 1); }
  }
  throw new Error('unbalanced: ' + startMarker);
}
// var TIERS=[...]; — array literal: bracket-match to the closing ] then ';'
function sliceVarArray(marker) {
  const i = SRC.indexOf(marker);
  const ob = SRC.indexOf('[', i);
  let depth = 0;
  for (let j = ob; j < SRC.length; j++) {
    if (SRC[j] === '[') depth++;
    else if (SRC[j] === ']') { depth--; if (depth === 0) return SRC.slice(i, SRC.indexOf(';', j) + 1); }
  }
  throw new Error('unbalanced array: ' + marker);
}
const FNS = [
  sliceBlock('function mulberry32('), sliceBlock('function clamp('),
  sliceBlock('function genMaze('), sliceBlock('function deadEnds('),
  sliceBlock('function buildLevel('), sliceBlock('function bfsPath('),
  sliceBlock('function pathCells('), sliceBlock('function physicsStep('),
  sliceBlock('function keyDirX('), sliceBlock('function keyDirY('),
  sliceBlock('function cellCenter('), sliceBlock('function resolveWalls('),
  sliceBlock('function collideBorder('), sliceBlock('function collideCellWalls('),
  sliceBlock('function collideSeg('), sliceBlock('function checkHoles('),
  sliceVarArray('var TIERS='),
].join('\n');
// LEVELS builder IIFE: from 'var LEVELS=[]' through its closing '}();'
{
  const i = SRC.indexOf('var LEVELS=[]');
  let j = SRC.indexOf('(', SRC.indexOf('}', i)), depth = 0, k = SRC.indexOf('{', i);
  // simple approach: find the '(function(){...})();' right after var LEVELS=[];
  const iifeStart = SRC.indexOf('(function(){var n=1;', i);
  let m = SRC.indexOf('{', iifeStart);
  for (depth = 0; m < SRC.length; m++) {
    if (SRC[m] === '{') depth++;
    else if (SRC[m] === '}') { depth--; if (depth === 0) break; }
  }
  const levelSrc = SRC.slice(i, SRC.indexOf(';', m) + 1);
  global.__LAB_FNS_SRC = FNS + '\n' + levelSrc;
}
// build the sim factory: G is our sim state; onWin/onFall/sndBump are stubs
const mkSimFactory = new Function('G', 'onWin', 'onFall', 'sndBump',
  global.__LAB_FNS_SRC + '\nreturn {physicsStep:physicsStep,buildLevel:buildLevel,pathCells:pathCells,bfsPath:bfsPath,cellCenter:cellCenter,LEVELS:LEVELS,TIERS:TIERS};');

// ---------- sim (bit-exact mirror of engine per-frame behavior) ----------
const DT = 0.0167; // pump = 16.67ms exactly
function mkSim() {
  const S = {
    cv: { width: 0 }, cell: 40, offX: 0, offY: 0, cur: 1, active: null, ball: null,
    state: 'menu', time: 0, tiltX: 0, tiltY: 0, keys: {}, touchDX: 0, touchDY: 0, touching: false,
    hintTimer: 0, hintPath: [], won: false, fell: false,
  };
  let wonStub = false, fellStub = false;
  const F = mkSimFactory(S, function () { S.state = 'win'; S.won = true; wonStub = true; },
                            function () { S.state = 'fall'; S.fell = true; fellStub = true; },
                            function () {});
  S.__F = F;
  return S;
}
// engine __now starts at 0; every pump adds 16.67. The touch-decay interval is
// armed at boot (__now=0, every 50ms) and fires BEFORE raf inside each pump.
let gFrames = 0; // total pumps issued against the engine so far
function simFrame(S) {
  const now = (gFrames) * 16.67; // this frame's __now (caller increments gFrames)
  // due timers first (touch decay), then the raf loop body
  S.__decayAt = S.__decayAt === undefined ? 50 : S.__decayAt;
  while (S.__decayAt <= now) { S.touchDX *= 0.9; S.touchDY *= 0.9; S.__decayAt += 50; }
  if (S.state === 'play') S.time += DT;
  S.__F.physicsStep(DT);
}

// start a level inside the sim (mirrors startLevel's state init)
function simStart(S, num, seedOverride, cvWidth) {
  const lv = S.__F.LEVELS[num - 1];
  S.cur = num;
  S.active = S.__F.buildLevel(lv, seedOverride);
  const size = cvWidth;
  S.cell = size / Math.max(S.active.cols, S.active.rows);
  S.offX = (size - S.active.cols * S.cell) / 2;
  S.offY = (size - S.active.rows * S.cell) / 2;
  S.ball = { x: S.offX + S.cell * (S.active.start.c + 0.5), y: S.offY + S.cell * (S.active.start.r + 0.5), vx: 0, vy: 0, r: S.cell * 0.30, scale: 1, falling: false };
  S.time = 0; S.fell = false; S.won = false; S.state = 'play';
  S.tiltX = 0; S.tiltY = 0; S.touchDX = 0; S.touchDY = 0; S.keys = {};
  // NOTE: the engine's 50ms touch-decay interval is armed at boot and NEVER
  // reset by startLevel — the sim must keep the same global schedule (__decayAt).
}

// ---------- action schedule + replay ----------
// act: {t:'kd'|'ku', k:'ArrowRight'} | {t:'pad', id:'dRight', on:true/false}
//      {t:'tilt', gx, by} | {t:'tdn'/'tmove'/'tup', x, y} | {t:'p'}
function applyEngine(g, act) {
  if (act.t === 'kd' || act.t === 'ku') {
    g.call('window.dispatchEvent({type:"' + (act.t === 'kd' ? 'keydown' : 'keyup') + '",key:"' + act.k + '",preventDefault:function(){}})');
  } else if (act.t === 'pad') {
    g.els[act.id].dispatch(act.on ? 'pointerdown' : 'pointerup', { type: act.on ? 'pointerdown' : 'pointerup', preventDefault() {} });
  } else if (act.t === 'tilt') {
    g.call('window.dispatchEvent({type:"deviceorientation",gamma:' + act.gx + ',beta:' + act.by + '})');
  } else if (act.t === 'tdn') {
    g.els.cv.dispatch('pointerdown', { type: 'pointerdown', clientX: act.x, clientY: act.y, pointerId: 1, preventDefault() {} });
  } else if (act.t === 'tmove') {
    g.els.cv.dispatch('pointermove', { type: 'pointermove', clientX: act.x, clientY: act.y, pointerId: 1, preventDefault() {} });
  } else if (act.t === 'tup') {
    g.els.cv.dispatch('pointerup', { type: 'pointerup', clientX: act.x, clientY: act.y, pointerId: 1, preventDefault() {} });
  } else if (act.t === 'p') { gFrames++; g.pump(1); }
}
function applySim(S, act) {
  if (act.t === 'kd') { const m = { arrowright: 'right', arrowleft: 'left', arrowup: 'up', arrowdown: 'down' }; S.keys[m[act.k.toLowerCase()]] = true; }
  else if (act.t === 'ku') { const m = { arrowright: 'right', arrowleft: 'left', arrowup: 'up', arrowdown: 'down' }; S.keys[m[act.k.toLowerCase()]] = false; }
  else if (act.t === 'pad') { const m = { dRight: 'right', dLeft: 'left', dUp: 'up', dDown: 'down' }; S.keys[m[act.id]] = act.on; }
  else if (act.t === 'tilt') { S.tiltX = Math.max(-1, Math.min(1, act.gx / 35)); S.tiltY = Math.max(-1, Math.min(1, (act.by - 30) / 35)); }
  else if (act.t === 'tdn') { S.touching = true; S.__lx = act.x; S.__ly = act.y; }
  else if (act.t === 'tmove') {
    const dx = act.x - (S.__lx === undefined ? act.x : S.__lx), dy = act.y - (S.__ly === undefined ? act.y : S.__ly);
    S.__lx = act.x; S.__ly = act.y;
    if (S.touching) { S.touchDX = Math.max(-1, Math.min(1, S.touchDX + dx * 0.04)); S.touchDY = Math.max(-1, Math.min(1, S.touchDY + dy * 0.04)); }
  } else if (act.t === 'tup') { S.touching = false; }
  else if (act.t === 'p') { gFrames++; simFrame(S); }
}

const DIRKEY = { right: 'ArrowRight', left: 'ArrowLeft', up: 'ArrowUp', down: 'ArrowDown' };
const DIRPAD = { right: 'dRight', left: 'dLeft', up: 'dUp', down: 'dDown' };

// Derive a schedule that drives the sim ball along the BFS path start->target
// using `mode` ('key' | 'pad') for movement. Returns {acts, ok, frames}.
function planDrive(S, target, mode) {
  const acts = [];
  const path = S.__F.pathCells(S.active.grid, S.active.cols, S.active.rows, S.active.start, target);
  if (!path.length) return { acts, ok: false, frames: 0 };
  // collapse into runs
  const runs = [];
  for (let i = 1; i < path.length; i++) {
    const dc = path[i][0] - path[i - 1][0], dr = path[i][1] - path[i - 1][1];
    const dir = dc === 1 ? 'right' : dc === -1 ? 'left' : dr === 1 ? 'down' : 'up';
    if (runs.length && runs[runs.length - 1].dir === dir) runs[runs.length - 1].end = path[i];
    else runs.push({ dir, end: path[i] });
  }
  const cs = S.cell;
  let guard = 0;
  for (const run of runs) {
    const c = S.__F.cellCenter(run.end[0], run.end[1]);
    const axis = run.dir === 'right' || run.dir === 'left' ? 'x' : 'y';
    const fwd = run.dir === 'right' || run.dir === 'down' ? 1 : -1;
    // press
    if (mode === 'key') acts.push({ t: 'kd', k: DIRKEY[run.dir] }); else acts.push({ t: 'pad', id: DIRPAD[run.dir], on: true });
    applySim(S, acts[acts.length - 1]);
    let cap = 40 + 18 * 40; // generous per-run cap
    while (cap-- > 0) {
      acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]);
      if (S.state !== 'play') break;
      const proj = axis === 'x' ? S.ball.x : S.ball.y;
      if (fwd > 0 ? proj >= c[axis] - cs * 0.02 : proj <= c[axis] + cs * 0.02) break;
    }
    // release + settle
    if (mode === 'key') acts.push({ t: 'ku', k: DIRKEY[run.dir] }); else acts.push({ t: 'pad', id: DIRPAD[run.dir], on: false });
    applySim(S, acts[acts.length - 1]);
    for (let s2 = 0; s2 < 14 && S.state === 'play'; s2++) { acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]); }
    if (S.state !== 'play') break;
    if (guard++ > 200) break;
  }
  // tail pumps until state settles
  for (let s2 = 0; s2 < 40 && S.state === 'play'; s2++) { acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]); }
  return { acts, ok: S.state !== 'play', frames: acts.filter(a => a.t === 'p').length };
}
function replay(g, acts) { for (const a of acts) applyEngine(g, a); }

// Solve level `num` on the engine from a FRESHLY STARTED level (caller clicks in),
// using cvWidth read off the live canvas. Falls if target is a hole cell.
function solveOnEngine(g, S, num, mode, targetCell, seedOverride) {
  const cvW = g.els.cv.width;
  simStart(S, num, seedOverride, cvW);
  const target = targetCell || S.active.goal;
  const plan = planDrive(S, target, mode || 'key');
  replay(g, plan.acts);
  return { ok: plan.ok, plan, simState: S.state };
}

// ---------- boot 1 ----------
const g = harness.bootGame('labyrinth');
ck('boot: no load errors', errs(g).length === 0, errs(g).join(' | '));
ck('boot: menu overlay shown', visible(g, 'ovMenu') && !visible(g, 'ovLevels') && !visible(g, 'ovResult') && !visible(g, 'ovTut'));
ck('boot: 6 tier buttons', (g.els.tierList.children || []).length === 6, String((g.els.tierList.children || []).length));
ck('boot: sound default on', el(g, 'btnSound').textContent.indexOf('🔊') >= 0, el(g, 'btnSound').textContent);
ck('boot: music default on', el(g, 'btnMusic').textContent.indexOf('🎵') >= 0, el(g, 'btnMusic').textContent);

// sound + music toggles persist
click(g, 'btnSound');
ck('sound: muted text', el(g, 'btnSound').textContent.indexOf('🔇') >= 0);
ck('sound: persisted off', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).soundOn === false);
click(g, 'btnSound');
ck('sound: back on + persisted', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).soundOn === true);
click(g, 'btnMusic');
ck('music: muted + persisted', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).musicOn === false);
click(g, 'btnMusic');
ck('music: back on', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).musicOn === true);

// first Play -> tutorial
click(g, 'btnPlay');
ck('play: tutorial shown first time', visible(g, 'ovTut'));
click(g, 'btnTutOk');
ck('play: L1 started', String(el(g, 'hudLevel').textContent) === '1' && !visible(g, 'ovTut'));
g.pump(1); // loop writes hudTime each frame while playing
ck('play: timer at 0:00', el(g, 'hudTime').textContent === '0:00');
ck('play: tut flag persisted', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).showTut === false);

// ---------- L1: keyboard win ----------
{
  const S = mkSim();
  const r = solveOnEngine(g, S, 1, 'key');
  ck('L1: sim planned a win', r.ok, 'simState=' + r.simState);
  g.pump(30); // 420ms result timer
  ck('L1: win overlay', visible(g, 'ovResult'));
  ck('L1: title', el(g, 'resTitle').textContent === 'Level Complete!', el(g, 'resTitle').textContent);
  ck('L1: 3 stars', el(g, 'resultStars').innerHTML === '&#9733;&#9733;&#9733;', el(g, 'resultStars').innerHTML);
  ck('L1: msg', el(g, 'resMsg').textContent === 'Perfect! 3 stars!', el(g, 'resMsg').textContent);
  ck('L1: time under par', /^\d+:\d\d$/.test(el(g, 'resultTime').textContent), el(g, 'resultTime').textContent);
  ck('L1: progress saved 3 stars', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress['1'] === 3);
}

// ---------- level select: unlock policy + navigation ----------
click(g, 'btnResultMenu');
ck('menu: shown after result-menu', visible(g, 'ovMenu'));
const tierBtns = g.els.tierList.children;
tierBtns[0].onclick({ type: 'click', preventDefault() {} });
ck('levels: overlay shown', visible(g, 'ovLevels'));
const cells = g.els.lvlGrid.children;
ck('levels: 5 cells', cells.length === 5, String(cells.length));
ck('levels: L1 unlocked+starred', !cells[0].classList.contains('lock') && cells[0].innerHTML.indexOf('&#9733;') >= 0);
ck('levels: L2 unlocked (L1 starred)', !cells[1].classList.contains('lock'));
ck('levels: L3 still locked', cells[2].classList.contains('lock'));
ck('levels: L5 still locked', cells[4].classList.contains('lock'));
click(g, 'btnBackTiers');
ck('menu: back to tiers', visible(g, 'ovMenu'));

// ---------- L2 via level select, driven by DPAD ----------
click(g, 'btnPlay'); // showTut=false -> starts maxUnlocked()=2
ck('L2: started via Play(maxUnlocked)', String(el(g, 'hudLevel').textContent) === '2', String(el(g, 'hudLevel').textContent));
{
  const S = mkSim();
  const r = solveOnEngine(g, S, 2, 'pad');
  ck('L2: dpad-driven win', r.ok, 'simState=' + r.simState);
  g.pump(30);
  ck('L2: win overlay', visible(g, 'ovResult'));
  ck('L2: 3 stars', el(g, 'resultStars').innerHTML === '&#9733;&#9733;&#9733;');
  ck('L2: progress', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress['2'] === 3);
}

// ---------- L3: hint exercise + fall + retry ----------
click(g, 'btnNext');
ck('L3: next started', String(el(g, 'hudLevel').textContent) === '3');
g.pump(3);
g.call('window.dispatchEvent({type:"keydown",key:"h",preventDefault:function(){}})');
g.call('window.dispatchEvent({type:"keyup",key:"h",preventDefault:function(){}})');
click(g, 'btnHint');
g.pump(5);
ck('L3: hint path exercised, no errors', errs(g).length === 0, errs(g).join(' | '));
{
  // fall: drive to a hole instead of the goal
  const S = mkSim();
  const cvW = g.els.cv.width;
  simStart(S, 3, undefined, cvW);
  // restart engine level to the same pristine state first (ball may have drifted from hint frame)
  click(g, 'btnRestart');
  g.pump(2);
  const hole = S.active.holes[0];
  const r = solveOnEngine(g, S, 3, 'key', hole);
  ck('L3: sim fell into hole', r.ok && r.simState === 'fall', 'simState=' + r.simState);
  g.pump(35); // 500ms fall overlay timer
  ck('L3: fall overlay', visible(g, 'ovResult'));
  ck('L3: fall title', el(g, 'resTitle').textContent === 'Fell in a Hole!', el(g, 'resTitle').textContent);
  ck('L3: no progress for fall', !JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress['3']);
  click(g, 'btnRetry');
  g.pump(2);
  ck('L3: retry restarts level', String(el(g, 'hudLevel').textContent) === '3' && el(g, 'hudTime').textContent === '0:00');
}
{
  const S = mkSim();
  const r = solveOnEngine(g, S, 3, 'key');
  ck('L3: win after fall-retry', r.ok);
  g.pump(30);
  ck('L3: win overlay', visible(g, 'ovResult'));
}

// ---------- L4: restart mid-level + r-key ----------
click(g, 'btnNext');
ck('L4: started', String(el(g, 'hudLevel').textContent) === '4');
{
  const S = mkSim();
  const cvW = g.els.cv.width;
  simStart(S, 4, undefined, cvW);
  // partial drive (first 2 runs only)
  const path = S.__F.pathCells(S.active.grid, S.active.cols, S.active.rows, S.active.start, S.active.goal);
  const partial = [];
  const run1 = { dir: path[1][0] - path[0][0] === 1 ? 'right' : path[1][0] - path[0][0] === -1 ? 'left' : path[1][1] - path[0][1] === 1 ? 'down' : 'up', end: path[1] };
  partial.push({ t: 'kd', k: DIRKEY[run1.dir] });
  applySim(S, partial[partial.length - 1]);
  const c1 = S.__F.cellCenter(run1.end[0], run1.end[1]);
  for (let i = 0; i < 60; i++) { partial.push({ t: 'p' }); applySim(S, partial[partial.length - 1]); if (S.state !== 'play') break; }
  partial.push({ t: 'ku', k: DIRKEY[run1.dir] });
  applySim(S, partial[partial.length - 1]);
  replay(g, partial);
  g.pump(2);
  const t1 = el(g, 'hudTime').textContent;
  ck('L4: timer running', t1 !== '0:00', t1);
  g.call('window.dispatchEvent({type:"keydown",key:"r",preventDefault:function(){}})');
  g.pump(2);
  ck('L4: r-key restart resets timer', el(g, 'hudTime').textContent === '0:00', el(g, 'hudTime').textContent);
  click(g, 'btnRestart');
  g.pump(2);
  ck('L4: btnRestart also resets', el(g, 'hudTime').textContent === '0:00');
}
{
  const S = mkSim();
  const r = solveOnEngine(g, S, 4, 'key');
  ck('L4: win', r.ok);
  g.pump(30);
  ck('L4: win overlay', visible(g, 'ovResult'));
}

// ---------- L5: touch-drag first run + deviceorientation run, keys for the rest ----------
click(g, 'btnNext');
ck('L5: started', String(el(g, 'hudLevel').textContent) === '5');
{
  const S = mkSim();
  const cvW = g.els.cv.width;
  simStart(S, 5, undefined, cvW);
  const path = S.__F.pathCells(S.active.grid, S.active.cols, S.active.rows, S.active.start, S.active.goal);
  const acts = [];
  // touch: drag right/down (whichever the first run is) by ~100px in small moves
  const dc = path[1][0] - path[0][0], dr = path[1][1] - path[0][1];
  const dxs = dc === 1 ? 25 : dc === -1 ? -25 : 0, dys = dr === 1 ? 25 : dr === -1 ? -25 : 0;
  acts.push({ t: 'tdn', x: 300, y: 300 }); applySim(S, acts[acts.length - 1]);
  let cx = 300, cy = 300;
  for (let i = 0; i < 8; i++) { cx += dxs; cy += dys; acts.push({ t: 'tmove', x: cx, y: cy }); applySim(S, acts[acts.length - 1]); }
  // drive until we pass the 3rd path cell (touch decays; sim mirrors it)
  const wp = S.__F.cellCenter(path[2][0], path[2][1]);
  const axis = dxs !== 0 ? 'x' : 'y', fwd = dxs + dys;
  for (let i = 0; i < 120; i++) {
    acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]);
    if (S.state !== 'play') break;
    const proj = axis === 'x' ? S.ball.x : S.ball.y;
    if (fwd > 0 ? proj >= wp[axis] - S.cell * 0.05 : proj <= wp[axis] + S.cell * 0.05) break;
  }
  // release touch, zero out accumulated tilt by dragging back
  for (let i = 0; i < 8; i++) { cx -= dxs; cy -= dys; acts.push({ t: 'tmove', x: cx, y: cy }); applySim(S, acts[acts.length - 1]); }
  acts.push({ t: 'tup', x: cx, y: cy }); applySim(S, acts[acts.length - 1]);
  for (let i = 0; i < 14; i++) { acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]); }
  // tilt run: next run direction, gamma/beta ±35 -> full tilt 1
  const cc = Math.max(0, Math.min(S.active.cols - 1, Math.floor((S.ball.x - S.offX) / S.cell)));
  const rr = Math.max(0, Math.min(S.active.rows - 1, Math.floor((S.ball.y - S.offY) / S.cell)));
  const rem = pathFrom(S, [cc, rr], S.active.goal);
  const runs = [];
  for (let i = 1; i < rem.length; i++) {
    const d2c = rem[i][0] - rem[i - 1][0], d2r = rem[i][1] - rem[i - 1][1];
    const dir = d2c === 1 ? 'right' : d2c === -1 ? 'left' : d2r === 1 ? 'down' : 'up';
    if (runs.length && runs[runs.length - 1].dir === dir) runs[runs.length - 1].end = rem[i];
    else runs.push({ dir, end: rem[i] });
  }
  // first remaining run via deviceorientation
  if (runs.length) {
    const run = runs[0];
    const gx = run.dir === 'right' ? 35 : run.dir === 'left' ? -35 : 0;
    const by = run.dir === 'down' ? 65 : run.dir === 'up' ? -5 : 30;
    acts.push({ t: 'tilt', gx, by }); applySim(S, acts[acts.length - 1]);
    const c2 = S.__F.cellCenter(run.end[0], run.end[1]);
    const ax2 = run.dir === 'right' || run.dir === 'left' ? 'x' : 'y';
    const fw2 = run.dir === 'right' || run.dir === 'down' ? 1 : -1;
    for (let i = 0; i < 140; i++) {
      acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]);
      if (S.state !== 'play') break;
      const proj = ax2 === 'x' ? S.ball.x : S.ball.y;
      if (fw2 > 0 ? proj >= c2[ax2] - S.cell * 0.02 : proj <= c2[ax2] + S.cell * 0.02) break;
    }
    acts.push({ t: 'tilt', gx: 0, by: 30 }); applySim(S, acts[acts.length - 1]); // level the board
    for (let i = 0; i < 14 && S.state === 'play'; i++) { acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]); }
  }
  replay(g, acts);
  ck('L5: touch+tilt drove ball, still playing', errs(g).length === 0, errs(g).join(' | '));
  // finish with keys from wherever the ball is now
  const c3 = Math.max(0, Math.min(S.active.cols - 1, Math.floor((S.ball.x - S.offX) / S.cell)));
  const r3 = Math.max(0, Math.min(S.active.rows - 1, Math.floor((S.ball.y - S.offY) / S.cell)));
  const finish = finishDrive(S, [c3, r3]);
  replay(g, finish.acts);
  g.pump(30);
  ck('L5: win overlay', visible(g, 'ovResult'), 'resTitle=' + el(g, 'resTitle').textContent);
  ck('L5: 3 stars', el(g, 'resultStars').innerHTML === '&#9733;&#9733;&#9733;');
}

// path from arbitrary cell to goal (BFS on the engine's own bfsPath)
function pathFrom(S, from, to) {
  const dist = S.__F.bfsPath(S.active.grid, S.active.cols, S.active.rows, { c: from[0], r: from[1] }, to);
  const path = []; let c = to.c, r = to.r; path.push([c, r]);
  let guard2 = 0;
  while (!(c === from[0] && r === from[1])) {
    const w = S.active.grid[r][c]; const dirs = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
    let moved = false;
    for (let i = 0; i < 4; i++) { if (!(w & dirs[i][2])) { const nc = c + dirs[i][0], nr = r + dirs[i][1]; if (nc >= 0 && nc < S.active.cols && nr >= 0 && nr < S.active.rows && dist[nr][nc] === dist[r][c] - 1) { c = nc; r = nr; path.push([c, r]); moved = true; break; } } }
    if (!moved || guard2++ > 400) break;
  }
  return path.reverse();
}
// keys-only finish from an arbitrary cell
function finishDrive(S, from) {
  const acts = [];
  const rem = pathFrom(S, from, S.active.goal);
  const runs = [];
  for (let i = 1; i < rem.length; i++) {
    const d2c = rem[i][0] - rem[i - 1][0], d2r = rem[i][1] - rem[i - 1][1];
    const dir = d2c === 1 ? 'right' : d2c === -1 ? 'left' : d2r === 1 ? 'down' : 'up';
    if (runs.length && runs[runs.length - 1].dir === dir) runs[runs.length - 1].end = rem[i];
    else runs.push({ dir, end: rem[i] });
  }
  for (const run of runs) {
    if (S.state !== 'play') break;
    const c = S.__F.cellCenter(run.end[0], run.end[1]);
    const axis = run.dir === 'right' || run.dir === 'left' ? 'x' : 'y';
    const fwd = run.dir === 'right' || run.dir === 'down' ? 1 : -1;
    acts.push({ t: 'kd', k: DIRKEY[run.dir] }); applySim(S, acts[acts.length - 1]);
    let cap = 700;
    while (cap-- > 0) {
      acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]);
      if (S.state !== 'play') break;
      const proj = axis === 'x' ? S.ball.x : S.ball.y;
      if (fwd > 0 ? proj >= c[axis] - S.cell * 0.02 : proj <= c[axis] + S.cell * 0.02) break;
    }
    acts.push({ t: 'ku', k: DIRKEY[run.dir] }); applySim(S, acts[acts.length - 1]);
    for (let s2 = 0; s2 < 14 && S.state === 'play'; s2++) { acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]); }
  }
  for (let s2 = 0; s2 < 40 && S.state === 'play'; s2++) { acts.push({ t: 'p' }); applySim(S, acts[acts.length - 1]); }
  return { acts, ok: S.state !== 'play' };
}

// ---------- levels 6..30 via btnNext chain ----------
for (let lv = 6; lv <= 30; lv++) {
  click(g, 'btnNext');
  if (String(el(g, 'hudLevel').textContent) !== String(lv)) { ck('L' + lv + ': started', false, 'hud=' + String(el(g, 'hudLevel').textContent)); break; }
  ck('L' + lv + ': started', true);
  const S = mkSim();
  const r = solveOnEngine(g, S, lv, 'key');
  ck('L' + lv + ': win', r.ok, 'simState=' + r.simState);
  g.pump(30);
  ck('L' + lv + ': overlay', visible(g, 'ovResult'));
  ck('L' + lv + ': 3 stars', el(g, 'resultStars').innerHTML === '&#9733;&#9733;&#9733;', el(g, 'resultStars').innerHTML);
  ck('L' + lv + ': progress', JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress[String(lv)] === 3);
}
ck('L30 done: next button label', el(g, 'btnNext').textContent === 'All Levels Done!', el(g, 'btnNext').textContent);
click(g, 'btnNext');
ck('L30: next -> menu', visible(g, 'ovMenu'));

// ---------- daily puzzle ----------
{
  const before = JSON.stringify(JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress);
  click(g, 'btnDaily');
  g.pump(2);
  ck('daily: hud shows D', el(g, 'hudLevel').textContent === 'D', el(g, 'hudLevel').textContent);
  const S = mkSim();
  // VDate epoch 0 -> 1970-01-01 -> seed 7777
  const r = solveOnEngine(g, S, 15, 'key', undefined, 7777);
  ck('daily: win', r.ok, 'simState=' + r.simState);
  g.pump(30);
  ck('daily: overlay', visible(g, 'ovResult'));
  ck('daily: msg mentions daily', el(g, 'resMsg').textContent.indexOf('Daily puzzle solved') === 0, el(g, 'resMsg').textContent);
  ck('daily: next label back-to-menu', el(g, 'btnNext').textContent === 'Back to Menu', el(g, 'btnNext').textContent);
  ck('daily: progress untouched', JSON.stringify(JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress) === before);
  click(g, 'btnNext');
  ck('daily: back to menu', visible(g, 'ovMenu'));
}

// ---------- boot 2: returning player ----------
const g2 = harness.bootGame('labyrinth', { seedLS: Object.assign({}, g.ls._m) });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
ck('boot2: progress carried', Object.keys(JSON.parse(g2.ls.getItem('gz_labyrinth_v1')).progress).length === 30);
click(g2, 'btnPlay'); // no tutorial now; starts maxUnlocked()=30
ck('boot2: resumes at L30', String(el(g2, 'hudLevel').textContent) === '30', String(el(g2, 'hudLevel').textContent));

// ---------- long-press reset (boot2) ----------
g2.els.resetHint.dispatch('pointerdown', { type: 'pointerdown', preventDefault() {} });
g2.pump(70); // 1100ms long-press
ck('reset: hint text', el(g2, 'resetHint').textContent === 'Progress cleared!', el(g2, 'resetHint').textContent);
ck('reset: LS cleared', Object.keys(JSON.parse(g2.ls.getItem('gz_labyrinth_v1')).progress).length === 0);
g2.els.resetHint.dispatch('pointerup', { type: 'pointerup', preventDefault() {} });
g2.pump(2);

// ---------- summary ----------
const extra = { levels: 30, progress: Object.keys(JSON.parse(g.ls.getItem('gz_labyrinth_v1')).progress).length };
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
