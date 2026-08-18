#!/usr/bin/env node
/* boxrob verifier — 40 physics-sokoban levels solved by beam search over macro
 * actions through real keys (hold Left/Right, optional jump), snapshotting player+box
 * state between branches. Fitness = total box-to-nearest-target distance; win =
 * engine's level-complete modal. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('boxrob', { inject: {
  anchor: 'function update(dt) {',
  exports: `globalThis.__R = {
    n: () => LEVELS.length,
    load: (i) => startLevel(i),
    done: () => gameState === 'complete',
    state: () => gameState,
    boxes: () => boxes.map(b => ({ x: b.x, y: b.y })),
    targets: () => targets.map(t => ({ x: t.x, y: t.y })),
    snap: () => JSON.stringify({ p: { x: player.x, y: player.y, vx: player.vx, vy: player.vy, onGround: player.onGround }, b: boxes.map(b => ({ x: b.x, y: b.y })), m: moveCount, u: undoStack.length, st: gameState, t: levelTime }),
    restore: (s) => { const o = JSON.parse(s); player.x = o.p.x; player.y = o.p.y; player.vx = o.p.vx; player.vy = o.p.vy; player.onGround = o.p.onGround; boxes.forEach((b, i) => { b.x = o.b[i].x; b.y = o.b[i].y; }); moveCount = o.m; undoStack = []; gameState = o.st; levelTime = o.t; particles = []; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const kd = (k) => g.sandbox.document.dispatchEvent ? g.sandbox.dispatchEvent({ type: 'keydown', code: k, key: k.replace('Arrow', ''), preventDefault() {} }) : null;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N === 40, 'n=' + N);

function press(code, on) {
  g.sandbox.dispatchEvent({ type: on ? 'keydown' : 'keyup', code, key: code.replace('Arrow', ''), preventDefault() {} });
}

function macro(dir, frames, jump) {
  press(dir === 1 ? 'ArrowRight' : 'ArrowLeft', true);
  if (jump) press('Space', true);
  for (let i = 0; i < frames; i++) {
    g.pump(1);
    if (g.call('__R.done()')) break;
  }
  press('ArrowRight', false); press('ArrowLeft', false); press('Space', false);
  // settle
  for (let i = 0; i < 45; i++) { g.pump(1); if (g.call('__R.done()')) break; }
}

function fitness() {
  const boxes = g.call('__R.boxes()'), targets = g.call('__R.targets()');
  const used = new Set();
  let total = 0;
  for (const b of boxes) {
    let bd = 1e9, bi = -1;
    targets.forEach((t, i) => { if (used.has(i)) return; const d = Math.abs(t.x - b.x) + Math.abs(t.y - b.y); if (d < bd) { bd = d; bi = i; } });
    if (bi >= 0) used.add(bi);
    total += bd;
  }
  return total;
}

function solve(i, budgetMs) {
  const t0 = Date.now();
  g.call(`__R.load(${i})`); g.pump(3);
  let frontier = [{ snap: g.call('__R.snap()'), fit: fitness() }];
  for (let depth = 0; depth < 60; depth++) {
    if (Date.now() - t0 > (budgetMs || 3000)) break;
    const cand = [];
    for (const node of frontier) {
      for (const dir of [-1, 1]) for (const fr of [8, 22, 55]) for (const j of [false, true]) {
        g.call(`__R.restore(${JSON.stringify(node.snap)})`);
        macro(dir, fr, j);
        if (g.call('__R.done()')) return true;
        if (g.call('__R.state()') !== 'playing') continue;
        cand.push({ snap: g.call('__R.snap()'), fit: fitness() });
      }
    }
    cand.sort((a, b) => a.fit - b.fit);
    const seen = new Set(); frontier = [];
    for (const c of cand) {
      const o = JSON.parse(c.snap);
      const key = (o.p.x / 6 | 0) + ',' + (o.p.y / 6 | 0) + '|' + o.b.map(b => (b.x / 6 | 0) + ',' + (b.y / 6 | 0)).join(';');
      if (!seen.has(key)) { seen.add(key); frontier.push(c); }
      if (frontier.length >= 10) break;
    }
    if (!frontier.length) break;
  }
  return false;
}

const solved = [];
for (let i = 0; i < N; i++) { if (solve(i, 3000)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' unsolved'); }
T('levels-solved', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('boxrob: ' + solved.length + '/' + N + ' sokoban levels solved via real key macros: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
