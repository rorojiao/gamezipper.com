#!/usr/bin/env node
/* battleship verifier — B/C-type: a full game through the engine's own flow.
 * Screens/buttons: playBtn → randomBtn (auto-place: placeShipRandomly, the real callee)
 * → readyBtn (deploys enemy fleet + enters battle) → fireAtEnemy(x,y) per shot — the
 * exact canvas-click callee with its setTimeout hit/sink resolution; enemy returns fire
 * via aiTakeTurn on the engine's timers. Policy: fire every cell in order (100 shots
 * always sinks everything; the engine ends the game at checkAllShipsSunk).
 * PASS: game reaches gameOver with winner=player via the engine chain, ships sunk
 * counted, stats persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('battleship', { inject: {
  anchor: 'function endPlayerTurn() {',
  exports: "globalThis.__BT = { pShips: () => gameState.playerShips.length, setEasy: () => { gameState.difficulty = 'easy'; gameState.mode = 'classic'; }, screen: () => gameState.screen, over: () => gameState.gameOver, winner: () => gameState.winner, turn: () => gameState.isPlayerTurn, processing: () => gameState.isProcessingShot, sunk: () => gameState.enemyShips.filter(s => s.sunk).length, ships: () => gameState.enemyShips.length, shots: () => gameState.shotsFired, play: () => { document.getElementById('playBtn').click(); }, random: () => { document.getElementById('randomBtn').click(); }, ready: () => { document.getElementById('readyBtn').click(); }, fire: (x, y) => fireAtEnemy(x, y) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__BT.setEasy()'); // random-fire AI
g.call('__BT.play()');
g.pump(5);
g.call('__BT.random()');
g.pump(5);
T('fleet-placed', g.call('__BT.pShips()') === 5, 'ships=' + g.call('__BT.pShips()'));
g.call('__BT.ready()');
g.pump(10);
T('battle-started', g.call('__BT.screen()') === 'battle', 'screen=' + g.call('__BT.screen()'));

let guard = 0, cells = [];
for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) cells.push([x, y]);
let ci = 0;
while (guard++ < 20000 && !g.call('__BT.over()')) {
  if (g.call('__BT.turn()') !== true || g.call('__BT.processing()')) { g.pump(30); continue; }
  if (ci >= cells.length) break;
  const [x, y] = cells[ci++];
  g.call(`__BT.fire(${x}, ${y})`);
  g.pump(80); // hit/sunk setTimeout + enemy aiTakeTurn 1000ms chain
}
const t0 = Date.now();
while (!g.call('__BT.over()') && Date.now() - t0 < 20000) g.pump(50);
T('game-over-won', g.call('__BT.over()') === true && g.call('__BT.winner()') === 'player',
  'over=' + g.call('__BT.over()') + ' winner=' + g.call('__BT.winner()'));
T('fleet-sunk', g.call('__BT.sunk()') === g.call('__BT.ships()'), g.call('__BT.sunk()') + '/' + g.call('__BT.ships()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { shots: g.call('__BT.shots()'), sunk: g.call('__BT.sunk()'), winner: g.call('__BT.winner()') } };
console.log('battleship: full-game sweep through engine fire chain: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
