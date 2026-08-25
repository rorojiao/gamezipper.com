#!/usr/bin/env node
/* waffle verifier — daily puzzle + 5 practice rounds solved + one deliberate loss:
 * every swap is made by clicking the REAL grid cells (renderGrid's closure listeners —
 * click selects, second click swaps); solve plan recomputes greedily from the engine's own
 * exported grid/solution each step; win = engine's result screen "Solved!" + stats persisted;
 * lose = 15 wasted swaps -> "Not quite...". Static onclick buttons are invoked as the exact
 * statement the button runs (harness cannot fire inline attrs). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('waffle', { seed: 424242, inject: {
  anchor: 'function computeColors(grid,puzzle){',
  exports: `globalThis.__WF = {
    st: () => ({ screen: state.screen, mode: state.mode, swaps: state.swapsUsed, won: state.stats.won, played: state.stats.played, dailyDone: state.stats.dailyCompleted }),
    grid: () => state.grid.map(r => r.slice()),
    sol: () => state.solution.map(r => r.slice()),
    solved: () => isSolved(state.grid, state.solution),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const els = g.els;
const cell = (r, c) => els.grid.children[r * 5 + c];
const click = (r, c) => cell(r, c).dispatch('click', {});

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

const nextSwap = () => { // one greedy step on the live grid: returns [r,c,r2,c2] or null
  const grid = g.call('__WF.grid()'), sol = g.call('__WF.sol()');
  const act = (r, c) => r % 2 === 0 || c % 2 === 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    if (!act(r, c) || grid[r][c] === sol[r][c]) continue;
    const L = sol[r][c];
    let best = null, bestScore = -1;
    for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 5; c2++) {
      if (!act(r2, c2) || (r2 === r && c2 === c) || grid[r2][c2] !== L) continue;
      const misplaced = grid[r2][c2] !== sol[r2][c2];
      const direct = grid[r][c] === sol[r2][c2];
      const score = (misplaced ? 2 : 0) + (direct ? 1 : 0);
      if (score > bestScore) { bestScore = score; best = [r, c, r2, c2]; }
    }
    return best;
  }
  return null;
};
const solvePuzzle = (maxSwaps) => {
  let used = 0;
  while (!g.call('__WF.solved()') && used < maxSwaps) {
    const s = nextSwap();
    if (!s) return { ok: false, used };
    click(s[0], s[1]); click(s[2], s[3]);
    used++;
    if (g.call('__WF.solved()')) break;
  }
  return { ok: g.call('__WF.solved()'), used };
};

// ---- daily ----
g.call('startDaily()'); g.pump(40); // tutorial timer 500ms
g.call('closeTutorial()');
T('daily-starts', els['screen-game'].classList.contains('active'), 'screen');
let res = solvePuzzle(15);
g.pump(55); // onWin -> showResult at 800ms
T('daily-solved', res.ok && res.used <= 15, 'used=' + res.used + ' solved=' + res.ok);
T('daily-result', els['screen-result'].classList.contains('active') && els['result-title'].textContent === 'Solved!', els['result-title'].textContent);
T('daily-stats', g.call('__WF.st()').dailyDone === true && g.call('__WF.st()').won === 1, JSON.stringify(g.call('__WF.st()')));

// ---- practice: 5 wins ----
let wins = 0;
for (let i = 0; i < 5; i++) {
  g.call('startPractice()'); g.pump(2);
  res = solvePuzzle(15);
  g.pump(55);
  if (res.ok && els['screen-result'].classList.contains('active')) wins++;
  else fails.push('practice' + i + ' used=' + res.used + ' ok=' + res.ok);
}
T('practice-5-wins', wins === 5, wins + '/5');
const stMid = g.call('__WF.st()');
T('stats-accumulate', stMid.played === 6 && stMid.won === 6, JSON.stringify(stMid));

// ---- deliberate loss: burn 15 swaps, each chosen to NOT solve the puzzle ----
g.call('startPractice()'); g.pump(2);
const act = (r, c) => r % 2 === 0 || c % 2 === 0;
while (g.call('__WF.st()').swaps < 15 && !g.call('__WF.solved()')) {
  const grid = g.call('__WF.grid()'), sol = g.call('__WF.sol()');
  let done = false;
  for (let r = 0; r < 5 && !done; r++) for (let c = 0; c < 5 && !done; c++) {
    if (!act(r, c)) continue;
    for (let r2 = 0; r2 < 5 && !done; r2++) for (let c2 = 0; c2 < 5 && !done; c2++) {
      if (!act(r2, c2) || (r2 === r && c2 === c) || grid[r2][c2] === grid[r][c]) continue;
      // would this swap solve the puzzle? skip those pairs
      const a = grid[r][c]; grid[r][c] = grid[r2][c2]; grid[r2][c2] = a;
      let solves = true;
      for (let rr = 0; rr < 5; rr++) for (let cc = 0; cc < 5; cc++) if (act(rr, cc) && grid[rr][cc] !== sol[rr][cc]) solves = false;
      const b = grid[r][c]; grid[r][c] = grid[r2][c2]; grid[r2][c2] = b; // restore
      if (solves) continue;
      click(r, c); click(r2, c2); done = true;
    }
  }
  if (!done) break; // no safe pair left (near-solved grid) — bail to avoid fake pass
}
g.pump(70); // onLose timer 300ms + showResult 300ms (many stacked swap timers compete per frame)
T('lose-at-15-swaps', els['screen-result'].classList.contains('active') && els['result-title'].textContent === 'Not quite...', els['result-title'].textContent + ' swaps=' + g.call('__WF.st()').swaps);
T('lose-stats', g.call('__WF.st()').played === 7 && g.call('__WF.st()').won === 6, JSON.stringify(g.call('__WF.st()')));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { daily: 'won', practice: wins + '/5', loss: 'verified' } };
console.log('waffle: daily + 5 practice wins via real cell-click swaps + loss path: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
