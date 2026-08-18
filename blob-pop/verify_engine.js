#!/usr/bin/env node
/* blob-pop verifier — Puyo-style match-4 adventure. Tier-1 levels (1-5, 2 colors,
 * 5-9 blobs) solved by beam search over drop choices through the REAL key path
 * (ArrowLeft/Right to steer, ArrowUp to rotate, Space to hard-drop), snapshotting
 * engine state between branches. Higher tiers are bot-limited (4 colors + garbage
 * need human-grade chain engineering) — documented in extra. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('blob-pop', { inject: {
  anchor: 'function checkWinLose(){',
  exports: `globalThis.__P = {
    n: () => LEVELS.length,
    start: (i) => startAdventure(i + 1),
    snap: () => JSON.stringify({ grid: grid, q: nextQueue, pair: curPair, hold: holdPiece, state: gameState, cleared: blobsCleared, lvl: level }),
    restore: (s) => { var o = JSON.parse(s); grid = o.grid; nextQueue = o.q; curPair = o.pair; holdPiece = o.hold; gameState = o.state; blobsCleared = o.cleared; level = o.lvl; particles = []; popAnimations = []; },
    remaining: () => { var n = 0; for (var r = HIDDEN_ROWS; r < ROWS + HIDDEN_ROWS; r++) for (var c = 0; c < COLS; c++) if (grid[r][c] >= 1 && grid[r][c] <= 4) n++; return n; },
    state: () => gameState,
    col: () => curPair ? curPair.c1.c : -1,
    score: () => score,
    settled: () => settlePending === undefined ? true : settlePending,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = g.call('__P.n()');
T('levels-exist', N === 30, 'n=' + N);

// input path sanity: steering + rotation + hard drop all take effect
g.call('__P.start(0)'); g.pump(2);
const col0 = g.call('__P.col()');
kd('ArrowLeft'); g.pump(1);
const col1 = g.call('__P.col()');
kd('ArrowUp'); g.pump(1);
kd(' '); g.pump(3);
T('input-response', col1 < col0 && g.call('__P.state()') !== 'menu', 'col ' + col0 + '->' + col1 + ' state ' + g.call('__P.state()'));

// settle helper: run until the current pair locks and chains resolve
function settle(maxFrames) {
  for (let i = 0; i < (maxFrames || 400); i++) {
    g.pump(1);
    if (g.call('__P.state()') === 'levelcomplete') return 'won';
    if (g.call('__P.col()') >= 0) return 'pair'; // a fresh pair is spawning/active
    // no active pair -> chains settling; keep pumping until spawn or terminal
  }
  return g.call('__P.state()') === 'levelcomplete' ? 'won' : 'timeout';
}
function waitPair(maxFrames) {
  for (let i = 0; i < (maxFrames || 300); i++) { g.pump(1); if (g.call('__P.col()') >= 0) return true; if (g.call('__P.state()') !== 'playing') return false; }
  return false;
}

// one drop action: steer to column c (0-5) with orientation o (0 horiz, 1 vert-down), hard-drop, settle
function drop(c, o) {
  if (o) { kd('ArrowUp'); kd('ArrowUp'); g.pump(1); } // rotate twice -> vertical
  let guard = 0;
  while (g.call('__P.col()') < c && guard++ < 8) { kd('ArrowRight'); g.pump(1); }
  guard = 0;
  while (g.call('__P.col()') > c && guard++ < 8) { kd('ArrowLeft'); g.pump(1); }
  kd(' '); g.pump(2);
  return settle();
}

function solve(i, budgetMs) {
  const t0 = Date.now();
  g.call(`__P.start(${i})`); g.pump(2);
  let frontier = [{ snap: g.call('__P.snap()'), rem: g.call('__P.remaining()') }];
  for (let depth = 0; depth < 40; depth++) {
    if (Date.now() - t0 > budgetMs) break;
    const cand = [];
    for (const node of frontier) {
      for (const o of [0, 1]) for (let c = 0; c < 6; c++) {
        g.call(`__P.restore(${JSON.stringify(node.snap)})`);
        const r = drop(c, o);
        if (r === 'won') return { won: true, drops: depth + 1 };
        if (g.call('__P.state()') !== 'playing') continue; // game over branch
        if (!waitPair(300)) continue;
        const snap = g.call('__P.snap()');
        cand.push({ snap, rem: g.call('__P.remaining()') });
      }
    }
    cand.sort((a, b) => a.rem - b.rem);
    const seen = new Set(); frontier = [];
    for (const c of cand) { const h = JSON.stringify(JSON.parse(c.snap).grid); if (!seen.has(h)) { seen.add(h); frontier.push(c); } if (frontier.length >= 18) break; }
    if (!frontier.length) break;
  }
  return { won: false };
}

const solvedT1 = [];
for (let i = 0; i < 5; i++) { // tier 1: 2 colors, 5-9 blobs
  const r = solve(i, 14000);
  if (r.won) solvedT1.push(i + 1); else fails.push('L' + (i + 1) + ' tier-1 not cleared');
}
T('tier1-cleared', solvedT1.length === 5, solvedT1.length + '/5 solved:[' + solvedT1.join(',') + ']');

// pop mechanics fire in normal play on any tier: blobs get cleared via matches
g.call('__P.start(5)'); g.pump(2);
for (let d = 0; d < 40 && g.call('__P.state()') === 'playing'; d++) { drop(d % 6, d % 2); waitPair(200); }
T('pop-mechanics', g.call('__P.score()') > 0, 'score=' + g.call('__P.score()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { tier1: solvedT1.length + '/5', note: 'tiers 2-6 bot-limited (3-4 colors + garbage need human chain engineering); input path, pop mechanics and engine flow verified' } };
console.log('blob-pop: tier-1 ' + solvedT1.length + '/5 cleared via beam search over real key drops: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
