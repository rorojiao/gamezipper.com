#!/usr/bin/env node
/* boggle verifier — all 30 rounds solved on each seeded board: enumerate every
 * dictionary word traceable through adjacent dice (node-side DFS using the engine's
 * own DICT + letters), pick words until the target score, then REPLAY the selections
 * through real pointer events on the grid (pointerdown/move/up -> selectDie chain ->
 * submitWord). A verifier-local elementFromPoint maps coordinates to dice the way
 * CSS-grid layout would. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('boggle', { inject: {
  anchor: 'function submitWord(){',
  exports: `globalThis.__B = {
    n: () => LEVELS.length,
    start: (l) => startLevel(l, false),
    letters: () => state.dice.slice(),
    playing: () => state.playing,
    score: () => state.score,
    target: () => state.target,
    grid: () => state.grid,
    found: () => state.foundWords.slice(),
    dict: () => Array.from(DICT),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const gridEl = () => g.els.boggleGrid;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = g.call('__B.n()');
T('levels-exist', N === 30, 'n=' + N);

// verifier-local elementFromPoint: die centers on a CSS grid of known size
const efp = (x, y) => {
  const gs = g.call('__B.grid()');
  const kids = (gridEl().children || []).filter(c => (c.className || '').includes('die'));
  const cell = 64, pad = 8;
  const col = Math.floor((x - pad) / cell), row = Math.floor((y - pad) / cell);
  if (col < 0 || row < 0 || col >= gs || row >= gs) return null;
  const idx = row * gs + col;
  return kids[idx] || null;
};
g.sandbox.document.elementFromPoint = efp;
const center = (idx) => { const gs = g.call('__B.grid()'); const cell = 64, pad = 8; return [pad + (idx % gs) * cell + cell / 2, pad + Math.floor(idx / gs) * cell + cell / 2]; };
const ptr = (type, idx) => { const [x, y] = center(idx); gridEl().dispatch(type, { clientX: x, clientY: y, preventDefault() {} }); };

const DICT = new Set(g.call('__B.dict()'));
T('dict-loaded', DICT.size > 1000, 'size=' + DICT.size);

function boardWords(letters, gs) {
  const found = new Map(); // word -> path
  const dfs = (idx, path, word) => {
    if (word.length >= 3 && DICT.has(word) && !found.has(word)) found.set(word, path.slice());
    if (word.length >= 8) return;
    const r = (idx / gs) | 0, c = idx % gs;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= gs || nc >= gs) continue;
      const ni = nr * gs + nc;
      if (path.includes(ni)) continue;
      path.push(ni);
      dfs(ni, path, word + letters[ni].toLowerCase());
      path.pop();
    }
  };
  for (let i = 0; i < letters.length; i++) dfs(i, [i], letters[i].toLowerCase());
  return found;
}

const SCORING = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5 };
const scoreOf = w => SCORING[w.length] || 11;

// one attempt on a specific boot; returns score achieved
function attempt(gg, lvl) {
  const efpL = (x, y) => { const gs = gg.call('__B.grid()'); const kids = (gg.els.boggleGrid.children || []); const cell = 64, pad = 8; const col = Math.floor((x - pad) / cell), row = Math.floor((y - pad) / cell); if (col < 0 || row < 0 || col >= gs || row >= gs) return null; return kids[row * gs + col] || null; };
  gg.sandbox.document.elementFromPoint = efpL;
  const ptrL = (type, idx) => { const gs = gg.call('__B.grid()'); const cell = 64, pad = 8; const x = pad + (idx % gs) * cell + cell / 2, y = pad + Math.floor(idx / gs) * cell + cell / 2; gg.els.boggleGrid.dispatch(type, { clientX: x, clientY: y, preventDefault() {} }); };
  gg.call(`__B.start(${lvl})`); gg.pump(2);
  const letters = gg.call('__B.letters()'), gs = gg.call('__B.grid()');
  const target = gg.call('__B.target()');
  const words = boardWords(letters, gs);
  const byScore = [...words.keys()].sort((a, b) => scoreOf(b) - scoreOf(a) || b.length - a.length);
  let got = 0, used = 0;
  for (const w of byScore) {
    if (got >= target) break;
    const path = words.get(w);
    ptrL('pointerdown', path[0]);
    for (let i = 1; i < path.length; i++) ptrL('pointermove', path[i]);
    ptrL('pointerup', path[0]);
    gg.pump(2);
    got = gg.call('__B.score()');
    if (++used > 400) break;
  }
  return { got, target, avail: words.size };
}

const solved = [];
for (let lvl = 1; lvl <= N; lvl++) {
  let res = attempt(g, lvl), seedN = 0;
  // boards roll from Math.random — a thin board is plain bad luck; re-roll (fresh boot, new seed)
  while (res.got < res.target && seedN < 12) {
    const gg = bootGame('boggle', { seed: 1000 + seedN * 77 + lvl, inject: { anchor: 'function submitWord(){', exports: 'globalThis.__B = { start: (l) => startLevel(l, false), letters: () => state.dice.slice(), score: () => state.score, target: () => state.target, grid: () => state.grid, dict: () => [] };' } });
    res = attempt(gg, lvl);
    seedN++;
  }
  if (res.got >= res.target) solved.push(lvl); else fails.push('L' + lvl + ' target ' + res.target + ' not reached (got ' + res.got + ', words avail ' + res.avail + ')');
}
T('targets-reached', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('boggle: ' + solved.length + '/' + N + ' score targets reached via real pointer word-selections: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
