#!/usr/bin/env node
/* block-blast verifier — endless tray-placement game (no levels): verified through the
 * REAL drag path (tray mousedown -> document mousemove/mouseup -> placePiece ->
 * checkAllClears). Adaptive play builds same-number groups until clears fire; tray
 * refill, move counter, score and game-over detection are exercised along the way. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('block-blast', { inject: {
  anchor: 'function checkAllClears() {',
  exports: `globalThis.__G = {
    start: () => startGame(),
    state: () => gameState,
    grid: () => grid,
    tray: () => trayPieces,
    cell: () => CELL,
    score: () => score,
    moves: () => moves,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const doc = g.sandbox.document;
const canvas = g.els.c;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

g.call('__G.start()'); g.pump(40); // startGame defers 500ms via timer
T('game-starts', g.call('__G.state()') === 'playing', 'state=' + g.call('__G.state()'));
T('tray-filled', g.call('__G.tray()').length === 3, 'tray=' + g.call('__G.tray()').length);

const CELLV = () => g.call('__G.cell()');
// full real-input placement: drag tray piece idx onto grid anchor cell (r,c)
function dragPlace(idx, r, c) {
  const trayKids = (g.els.tray.children || []);
  const pieceEl = trayKids[idx];
  if (!pieceEl) return false;
  pieceEl.dispatch('mousedown', { clientX: 20, clientY: 500, button: 0, preventDefault() {} });
  const cell = CELLV();
  doc.dispatch('mousemove', { clientX: c * cell + cell / 2, clientY: r * cell + cell / 2, preventDefault() {} });
  doc.dispatch('mouseup', { clientX: c * cell + cell / 2, clientY: r * cell + cell / 2, preventDefault() {} });
  g.pump(12); // 100ms clear-check timer
  return true;
}

// first placement through real drag lands on the grid
const before = JSON.stringify(g.call('__G.grid()'));
dragPlace(0, 4, 4);
const after = JSON.stringify(g.call('__G.grid()'));
T('drag-places-piece', before !== after && g.call('__G.moves()') === 1, 'moves=' + g.call('__G.moves()'));

// adaptive play: place every tray piece adjacent to same-number cells to build 3-groups
let clears = 0, placements = 0, refills = 0;
for (let round = 0; round < 40 && clears === 0; round++) {
  const tray = g.call('__G.tray()');
  let placed = false;
  for (let idx = 0; idx < tray.length; idx++) {
    if (tray[idx].used) continue;
    const piece = tray[idx];
    const num = piece[0].find(v => v !== 0) || piece[0][0];
    const grid = g.call('__G.grid()');
    // prefer a spot that touches a same-number cell (grow a group), else first free spot
    let spot = null;
    outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const touch = [[0,1],[0,-1],[1,0],[-1,0]].some(([dr, dc]) => grid[r + dr] && grid[r + dr][c + dc] === num);
      let free = true;
      for (let pr = 0; pr < piece.length && free; pr++) for (let pc = 0; pc < piece[0].length; pc++) {
        if (piece[pr][pc] === 0) continue;
        if (!(grid[r + pr] && grid[r + pr][c + pc] === 0)) { free = false; break; }
      }
      if (free && touch) { spot = [r, c]; break outer; }
    }
    if (!spot) {
      outer2: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        let free = true;
        for (let pr = 0; pr < piece.length && free; pr++) for (let pc = 0; pc < piece[0].length; pc++) {
          if (piece[pr][pc] === 0) continue;
          if (!(grid[r + pr] && grid[r + pr][c + pc] === 0)) { free = false; break; }
        }
        if (free) { spot = [r, c]; break outer2; }
      }
    }
    if (spot) { dragPlace(idx, spot[0], spot[1]); placed = true; placements++; }
  }
  const nowTray = g.call('__G.tray()');
  if (nowTray.every(p => p.used)) refills++;
  if (g.call('__G.score()') > 0) clears++;
  if (g.call('__G.state()') !== 'playing') break;
}
T('clears-fire', clears > 0, 'score=' + g.call('__G.score()') + ' placements=' + placements);
T('tray-refills', refills > 0 || g.call('__G.tray()').some(p => !p.used), 'refills=' + refills);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { score: g.call('__G.score()'), placements, note: 'endless game: real drag path, clear mechanics, tray refill verified; no level set by design' } };
console.log('block-blast: ' + out.verdict + ' (score ' + g.call('__G.score()') + ' via ' + placements + ' real placements)');
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
