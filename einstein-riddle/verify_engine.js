#!/usr/bin/env node
/* einstein-riddle engine verifier — real input paths only: level cards, grid cells, and
   control buttons are all clicked as the elements the engine bound. The verifier fills
   each grid from PUZZLES' stored solution (a player who deduced it), plus full error-path
   coverage (incomplete/multi-yes/duplicate/wrong submits), hint/undo/reset, star tiers,
   all 30 levels, persistence, and progress reset. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note: note === undefined ? '' : String(note) }); if (!ok) console.error('  FAIL: ' + name + (note !== undefined ? ' — ' + note : '')); };
const t0 = Date.now();

const g = bootGame('einstein-riddle', {});
const E = (id) => g.sandbox.document.getElementById(id);
const P = () => g.call('PUZZLES');
const st = () => g.call('state');
const walk = (root, pred) => { const out = []; const w = (n) => { if (pred(n)) out.push(n); (n.children || []).forEach(w); }; w(root); return out; };
const cells = () => walk(E('gridTable'), (n) => n.classList && n.classList.contains('grid-cell') && n.dataset && n.dataset.house !== undefined);
const cellFor = (h, attr, vi) => cells().find((c) => +c.dataset.house === h && c.dataset.attr === attr && +c.dataset.valIdx === vi);
const clickCell = (h, attr, vi) => cellFor(h, attr, vi).dispatch('click', {});
const submit = () => E('submitBtn').dispatch('click', {});
const msg = () => String(E('messageArea').innerHTML);
const fillSolution = (skipYes = true) => {
  const p = P()[st().level - 1];
  for (let h = 0; h < p.n; h++) p.attrs.forEach((a, ai) => {
    if (skipYes && st().grid[h][a].valStates && Object.values(st().grid[h][a].valStates).includes('yes')) return;
    clickCell(h, a, p.solution[h][ai]);
  });
};

T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('home-shown', E('homeView').style.display === 'block' && E('gameView').style.display === 'none');
T('tier-grids-10-each', E('tier1Grid').children.length === 10 && E('tier2Grid').children.length === 10 && E('tier3Grid').children.length === 10);

// clue data integrity across all 30 puzzles (P0 regression)
{
  let ok = true, note = '';
  for (const p of P()) {
    const pos = {};
    p.attrs.forEach((a, ai) => { pos[a] = {}; p.values[a].forEach((v, vi) => { pos[a][v] = p.solution.findIndex((r) => r[ai] === vi); }); });
    for (const c of p.clues) {
      const a = c.args;
      const prs = c.type === 'NTH' ? [[a[0], a[1]]] : [[a[0], a[1]], [a[2], a[3]]];
      for (const [attr, v] of prs) if (!(p.values[attr] || []).includes(v)) { ok = false; note = 'L' + p.level + ' dangling ' + v; }
    }
    if (p.clues.length !== p.clue_text.length) { ok = false; note = 'L' + p.level + ' text misaligned'; }
  }
  T('clues-reference-existing-values', ok, note);
}

// level 1 from home card + tutorial modal
E('tier1Grid').children[0].dispatch('click', {});
g.pump(2);
T('tutorial-first-visit', E('tutModal').classList.contains('show') && g.sandbox.localStorage.getItem('einsteinRiddle_tutorialSeen_v1') === '1');
E('tutOkBtn').dispatch('click', {});
T('tutorial-dismissed', !E('tutModal').classList.contains('show'));
T('level1-open', E('gameView').style.display !== 'none' && String(E('levelTitle').textContent) === 'Level 1' && st().level === 1);
T('clues-rendered', E('clueList').children.length === P()[0].clues.length, E('clueList').children.length + ' li');
T('grid-cells-27', cells().length === 3 * 9, cells().length);
T('prev-disabled-at-1', E('prevBtn').disabled === true && E('nextBtn').disabled === false);

// cell state cycle null -> yes -> no -> null
{
  const c = () => cellFor(0, 'color', 0);
  c().dispatch('click', {});
  T('cycle-yes', c().classList.contains('state-yes'));
  c().dispatch('click', {});
  T('cycle-no', c().classList.contains('state-no') && !c().classList.contains('state-yes'));
  c().dispatch('click', {});
  T('cycle-null', !c().classList.contains('state-yes') && !c().classList.contains('state-no'));
}

// undo: pops one action at a time — first mark survives, second is reverted
{
  cellFor(0, 'pet', 0).dispatch('click', {});
  cellFor(1, 'pet', 2).dispatch('click', {});
  E('undoBtn').dispatch('click', {});
  g.pump(2);
  T('undo-one-step', cellFor(0, 'pet', 0).classList.contains('state-yes') && !cellFor(1, 'pet', 2).classList.contains('state-yes'));
  E('undoBtn').dispatch('click', {});
  g.pump(2);
  T('undo-second-step', !cellFor(0, 'pet', 0).classList.contains('state-yes'));
}

// incomplete submit
submit();
T('incomplete-submit', msg().includes('not marked') && st().mistakes === 0, msg().slice(0, 60));

// multi-yes error
{
  clickCell(0, 'color', 0);
  clickCell(0, 'color', 1);
  submit();
  T('multiyes-error', msg().includes('only one') && st().mistakes === 0, msg().slice(0, 60));
  E('resetBtn').dispatch('click', {});
  g.pump(2);
  T('reset-level', st().mistakes === 0 && st().hintsLeft === 3 && cells().every((c) => !c.classList.contains('state-yes')) && String(E('statHints').textContent) === '3');
}

// hint fills the first empty (house,attr) correctly
{
  E('hintBtn').dispatch('click', {});
  g.pump(2);
  const p = P()[0];
  const vs = st().grid[0][p.attrs[0]].valStates;
  T('hint-fills-correct', vs[p.solution[0][0]] === 'yes' && st().hintsLeft === 2 && String(E('statHints').textContent) === '2', JSON.stringify(vs));
}

// duplicate-value error (full grid, one value in two houses)
{
  E('resetBtn').dispatch('click', {}); g.pump(1);
  const p = P()[0];
  const dupIdx = p.values.color.indexOf(p.values.color[p.solution[2][0]]); // h2 takes h0's color value
  const h0val = p.solution[0][0];
  for (let h = 0; h < p.n; h++) p.attrs.forEach((a, ai) => {
    const vi = h === 2 && a === 'color' ? h0val : p.solution[h][ai];
    clickCell(h, a, vi);
  });
  submit();
  T('duplicate-error', msg().includes('different house') && st().mistakes === 0, msg().slice(0, 60));
}

// wrong solution -> mistake + red flash; then fix in place -> win with 2 stars
{
  E('resetBtn').dispatch('click', {}); g.pump(1);
  const p = P()[0];
  for (let h = 0; h < p.n; h++) p.attrs.forEach((a, ai) => {
    let vi = p.solution[h][ai];
    if (a === 'nationality') vi = p.solution[h === 0 ? 1 : h === 1 ? 0 : h][ai]; // swap h0/h1
    clickCell(h, a, vi);
  });
  submit();
  const flashed = cells().some((c) => c.classList.contains('mistake'));
  T('wrong-submit', st().mistakes === 1 && String(E('statMistakes').textContent) === '1' && msg().includes('Not quite'), msg().slice(0, 50));
  T('wrong-cells-flash', flashed);
  // fix the two swapped cells: yes -> no -> null -> correct yes
  for (const h of [0, 1]) {
    const wrong = h === 0 ? p.solution[1][1] : p.solution[0][1];
    const right = p.solution[h][1];
    clickCell(h, 'nationality', wrong); // yes -> no
    clickCell(h, 'nationality', wrong); // no -> null
    clickCell(h, 'nationality', right); // -> yes
  }
  submit();
  g.pump(2);
  T('win-after-mistake', E('winModal').classList.contains('show') && String(E('winStars').textContent) === '⭐⭐☆' && String(E('winStats').innerHTML).includes('Mistakes: <strong>1</strong>', E('winStats').innerHTML));
  T('completed-2stars', st().completed[1].stars === 2 && st().completed[1].perfect === false);
  E('winNextBtn').dispatch('click', {});
  g.pump(2);
  T('next-level-2', st().level === 2 && st().mistakes === 0 && st().hintsLeft === 3 && E('winModal').classList.contains('show') === false);
}

// L2: one hint then clean fill -> 2 stars (mistakes 0, hints 1)
{
  E('hintBtn').dispatch('click', {}); g.pump(1);
  fillSolution();
  submit(); g.pump(2);
  T('l2-hint-2stars', E('winModal').classList.contains('show') && String(E('winStars').textContent) === '⭐⭐☆' && st().completed[2].hintsUsed === 1);
  E('winNextBtn').dispatch('click', {}); g.pump(2);
}

// L3: perfect 3 stars
{
  fillSolution();
  submit(); g.pump(2);
  T('l3-perfect', String(E('winStars').textContent) === '⭐⭐⭐' && st().completed[3].perfect === true);
  E('winNextBtn').dispatch('click', {}); g.pump(2);
}

// L4: three wrong submits -> 1 star (swap two houses on the last attr = valid permutation)
{
  const p = P()[3];
  const aLast = p.attrs[p.attrs.length - 1];
  const aiLast = p.attrs.length - 1;
  for (let h = 0; h < p.n; h++) p.attrs.forEach((a, ai) => {
    const vi = a === aLast && h === 0 ? p.solution[1][ai] : a === aLast && h === 1 ? p.solution[0][ai] : p.solution[h][ai];
    clickCell(h, a, vi);
  });
  submit(); submit(); submit();
  T('l4-three-mistakes', st().mistakes === 3, 'mistakes=' + st().mistakes + ' ' + msg().slice(0, 40));
  // swap back to the solution
  for (const h of [0, 1]) {
    clickCell(h, aLast, p.solution[h === 0 ? 1 : 0][aiLast]); // yes -> no
    clickCell(h, aLast, p.solution[h === 0 ? 1 : 0][aiLast]); // no -> null
    clickCell(h, aLast, p.solution[h][aiLast]); // -> yes
  }
  submit(); g.pump(2);
  T('l4-1star', String(E('winStars').textContent) === '⭐☆☆' && st().completed[4].stars === 1);
  E('winNextBtn').dispatch('click', {}); g.pump(2);
}

// L5..L30: clean chain; timer ticks; nav button states at L30
{
  let runOk = true;
  for (let lvl = 5; lvl <= 30 && runOk; lvl++) {
    if (st().level !== lvl) { T('chain-at-' + lvl, false, 'at ' + st().level); runOk = false; break; }
    if (lvl === 7) { g.pump(125); if (String(E('statTime').textContent) !== '0:02') { T('timer-ticks', false, E('statTime').textContent); } else T('timer-ticks', true); }
    if (lvl === 30) T('next-disabled-at-30', E('nextBtn').disabled === true && E('prevBtn').disabled === false);
    fillSolution();
    submit();
    if (!E('winModal').classList.contains('show')) { T('win-l' + lvl, false, 'no modal'); runOk = false; break; }
    if (String(E('winStars').textContent) !== '⭐⭐⭐') { T('stars-l' + lvl, false, E('winStars').textContent); runOk = false; break; }
    E('winNextBtn').dispatch('click', {});
    g.pump(2);
  }
  T('all-30-completed', runOk && Object.keys(st().completed).length === 30, Object.keys(st().completed).length + '/30');
  T('l30-exit-to-home', E('homeView').style.display === 'block');
  const cards = [...E('tier1Grid').children, ...E('tier2Grid').children, ...E('tier3Grid').children];
  T('perfect-cards', cards.filter((c) => c.classList.contains('perfect')).length === 27 && cards.filter((c) => c.classList.contains('completed') && !c.classList.contains('perfect')).length === 3);
}

// menu stats
{
  E('menuBtn').dispatch('click', {});
  T('menu-stats', E('menuModal').classList.contains('show') && String(E('menuSolved').textContent) === '30/30' &&
    String(E('menuStars').textContent) === '86' && String(E('menuStreak').textContent) === '30', E('menuStars').textContent + ' stars');
  const saved = JSON.parse(g.sandbox.localStorage.getItem('einsteinRiddle_v1'));
  T('progress-persisted', Object.keys(saved.completed).length === 30 && saved.completed[3].perfect === true);
}

// persistence reload + full reset
{
  const g2 = bootGame('einstein-riddle', { seedLS: Object.fromEntries(Object.entries(g.sandbox.localStorage._m)) });
  g2.pump(2);
  T('reload-progress', Object.keys(g2.call('state.completed')).length === 30 && g2.sandbox.document.getElementById('tier3Grid').children.filter((c) => c.classList.contains('perfect')).length === 10,
    'completed=' + Object.keys(g2.call('state.completed')).length + ' perfect=' + g2.sandbox.document.getElementById('tier3Grid').children.filter((c) => c.classList.contains('perfect')).length);
  g2.sandbox.document.getElementById('menuBtn').dispatch('click', {});
  g2.sandbox.document.getElementById('menuResetBtn').dispatch('click', {});
  g2.pump(2);
  T('reset-all', Object.keys(g2.call('state.completed')).length === 0 &&
    g2.sandbox.document.getElementById('tier1Grid').children.every((c) => !c.classList.contains('perfect') && !c.classList.contains('completed')));
}

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok).map((r) => r.name);
console.log('einstein-riddle: 30 levels via real cell clicks + error paths/hints/stars/persistence: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { durS: ((Date.now() - t0) / 1000).toFixed(1), fixes: 'P0: all 30 puzzles shipped clues referencing values absent from their own values lists (217 dangling refs — every displayed clue unsolvable nonsense); regenerated from solutions, uniqueness-proven per puzzle' } }));
process.exit(fails.length ? 1 : 0);
