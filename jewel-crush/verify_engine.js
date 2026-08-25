#!/usr/bin/env node
/* jewel-crush verifier — 50-level match-3 (type A/B).
 * Every level played through the REAL input path: canvas pointerdown at a gem +
 * pointermove past the swipe threshold fires the engine's own trySwap -> processMatchChain
 * (addTimeout cascades via pump) -> engine's own checkObjectiveComplete -> levelComplete()
 * (CustomEvent 'level-complete' on document — the pass signal). Bot picks swaps by
 * simulating every possible move INSIDE the engine (swapGems/findMatches/swap back),
 * objective-aware (ice cells / target color / match size). render() stubbed (draw-only).
 * FAIL honesty: levels the bot can't beat within budget are recorded unsolved. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('jewel-crush', { inject: {
  anchor: 'function startLevel(idx) {',
  exports: `render = function(){}; // headless: draw-only, skip canvas painting
  globalThis.__J = {
    moves: () => movesLeft, animating: () => animating, screen: () => currentScreen,
    nLevels: () => LEVELS.length, start: (i) => startLevel(i),
    best: () => { // evaluate all possible swaps inside engine scope, return the objective-best
      const obj = currentLevel.objective;
      const cand = findPossibleMoves();
      let best = null;
      for (const m of cand) {
        swapGems(m.r1, m.c1, m.r2, m.c2);
        const ms = findMatches();
        let v = 0;
        for (const mt of ms) for (const cell of mt) {
          const gem = grid[cell.r][cell.c];
          if (!gem || gem.stone) continue;
          v += 1;
          if (obj.type === 'clear_ice' && gem.ice) v += 8;
          if (obj.type === 'collect' && gem.color === obj.color) v += 8;
        }
        swapGems(m.r1, m.c1, m.r2, m.c2);
        if (v > 0 && (!best || v > best.v)) best = { r1: m.r1, c1: m.c1, r2: m.r2, c2: m.c2, v };
      }
      return best;
    },
  };
  document.addEventListener('level-complete', () => { globalThis.__wonLevel = true; });
  document.addEventListener('gameover', () => { globalThis.__lostLevel = true; });
  // browser-parity shim: real documents have dispatchEvent; the headless sandbox lacks it and
  // levelComplete()'s CustomEvent dispatch would throw before the win overlay renders.
  document.dispatchEvent = function(ev){ ev = ev || {}; ev.preventDefault = ev.preventDefault || function(){}; ((this.__dls || {})[ev.type] || []).forEach(function(f){ f.call(this, ev); }, this); return true; };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = call('__J.nLevels()');
T('levels-50', N === 50, 'n=' + N);

const cell = 44, offX = 64, offY = 115;
const cx = (c) => offX + c * cell + cell / 2, cy = (r) => offY + r * cell + cell / 2;
const canvas = g.els['gameCanvas'];
function dragSwap(m) {
  const dr = m.r2 - m.r1, dc = m.c2 - m.c1;
  canvas.dispatch('pointerdown', { clientX: cx(m.c1), clientY: cy(m.r1), pointerId: 1, button: 0, preventDefault() {} });
  canvas.dispatch('pointermove', { clientX: cx(m.c1) + dc * cell * 0.55, clientY: cy(m.r1) + dr * cell * 0.55, pointerId: 1, preventDefault() {} });
  canvas.dispatch('pointerup', { clientX: cx(m.c1) + dc * cell * 0.55, clientY: cy(m.r1) + dr * cell * 0.55, pointerId: 1, preventDefault() {} });
}
function settle() { // cascade chain runs on 250/300ms engine timers; ~34 frames per hop
  for (let i = 0; i < 400; i++) {
    g.pump(1);
    if (!call('__J.animating()')) { g.pump(26); return; } // trailing 400ms win/fail timer
  }
}

const deadline = Date.now() + 100000;
const solved = []; const unsolved = []; let totalSwaps = 0, attemptsUsed = 0;
for (let i = 0; i < N; i++) {
  const lvDeadline = Math.min(deadline, Date.now() + 4200);
  let won = false;
  for (let attempt = 0; attempt < 6 && !won && Date.now() < lvDeadline; attempt++) {
    attemptsUsed++;
    call('__J.start(' + i + ')'); g.pump(5);
    call('globalThis.__wonLevel = false; globalThis.__lostLevel = false; undefined');
    let guard = 0;
    while (guard++ < 90 && Date.now() < lvDeadline) {
      if (call('globalThis.__wonLevel')) { won = true; break; }
      if (call('globalThis.__lostLevel')) break; // out of moves -> retry
      const best = call('__J.best()');
      if (!best) { g.pump(40); continue; } // no scoring swap; engine reshuffles if deadlocked
      dragSwap(best); totalSwaps++;
      settle();
    }
  }
  (won ? solved : unsolved).push(i + 1);
  if (Date.now() >= deadline) { for (let k = i + 1; k < N; k++) unsolved.push(k + 1); break; }
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' unsolved:[' + unsolved.join(',') + ']');
T('majority-solved', solved.length >= Math.floor(N * 0.9), solved.length + '/' + N);
T('swaps-made', totalSwaps > 30, 'swaps=' + totalSwaps);
const ls = g.ls.getItem('jewelcrush_save');
T('save-written', !!ls && /maxLevel/.test(ls), ls ? ls.slice(0, 60) : 'none');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { solved: solved.length + '/' + N, unsolved: unsolved.slice(0, 20), swaps: totalSwaps, attempts: attemptsUsed } };
console.log('jewel-crush: ' + solved.length + '/' + N + ' levels completed via real swipe input: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
