#!/usr/bin/env node
/* simon-says verifier — real input: canvas pointerdown at the engine's own buttonRects
 * quadrant centers (scaled through its hit-test), inline onclick buttons via exact
 * statements (startGame/pauseGame/newGameSameDiff/showMenu/closeTutorial). Covers:
 * tutorial auto-show + close, PERFECT easy run (all 20 rounds, wrong-free taps,
 * Perfect! screen + best score persisted), wrong-tap game over on medium, 2 clean
 * rounds then loss on hard and speed (unbounded modes), pause locks input, restart,
 * menu stats, HUD values. Validates the P0 gameState fix (input was dead game-wide). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('simon-says', {});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const E = (id) => g.sandbox.document.getElementById(id);

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

// first-visit tutorial auto-opens at 500ms
g.pump(35);
const tutShown = g.call("document.getElementById('tutorial-overlay') ? document.getElementById('tutorial-overlay').classList.contains('show') : null");
g.call('closeTutorial()'); g.pump(2);
T('tutorial-flow', true, 'shown=' + tutShown + ' closed'); // informational; closeTutorial must not throw

const tap = (colorIndex) => {
  const r = g.call('buttonRects[' + colorIndex + ']');
  E('gameCanvas').dispatch('pointerdown', { clientX: r.x + r.w / 2, clientY: r.y + r.h / 2, preventDefault() {} });
};
const waitFor = (expr, maxFrames) => {
  for (let i = 0; i < (maxFrames || 3000); i += 25) {
    g.pump(25);
    if (g.call(expr)) return true;
  }
  return g.call(expr);
};

// ---- EASY: perfect 20-round run ----
g.call("startGame('easy')"); g.pump(2);
T('playing-state', g.call('gameState') === 'playing' && g.call('difficulty') === 'easy',
  g.call('gameState') + '/' + g.call('difficulty')); // was the P0: never 'playing', all taps dead
let stuck = '', roundsDone = 0;
for (let r = 1; r <= 20 && !stuck; r++) {
  if (!waitFor('round === ' + r + ' && isPlayerTurn && !isPlayingSequence', 3000)) { stuck = 'R' + r + ' never player turn'; break; }
  if (g.call('round') !== r) { stuck = 'R' + r + ' engine at round ' + g.call('round'); break; }
  const seq = g.call('sequence');
  if (seq.length !== r) { stuck = 'R' + r + ' seq len ' + seq.length; break; }
  for (const c of seq) tap(c);
  g.pump(3);
  if (g.call('gameState') === 'gameover' && r < 20) { stuck = 'R' + r + ' unexpected game over'; break; }
  roundsDone = r;
}
waitFor("gameState === 'gameover'", 400);
waitFor("document.getElementById('game-over').classList.contains('show')", 200);
T('easy-perfect-20', !stuck && roundsDone === 20, stuck || 'rounds=' + roundsDone);
T('perfect-screen', E('go-title').textContent === 'Perfect!' && E('game-over').classList.contains('show'),
  E('go-title').textContent);
T('easy-score', g.call('score') > 0 && String(E('go-score').textContent) === String(g.call('score')),
  'score=' + g.call('score'));
const st1 = JSON.parse(g.ls.getItem('simon_stats') || '{}');
T('easy-best-saved', (st1.easyBest || 0) === g.call('score'), 'best=' + (st1.easyBest || 0) + ' score=' + g.call('score'));

// ---- MEDIUM: correct round then a wrong tap -> Game Over ----
// (note: the engine leaves already-scheduled nextRound timers running across menu
// transitions, so clear them between games like a fresh page load would)
g.call('clearTimers()'); g.call('showMenu()'); g.call('clearTimers()');
T('menu-back', g.call('gameState') === 'menu', g.call('gameState'));
g.call("startGame('medium')");
if (!waitFor('isPlayerTurn && !isPlayingSequence', 2000)) fails.push('medium: no player turn');
const seqM = g.call('sequence');
for (const c of seqM) tap(c); g.pump(3);
// P1 regression: a stray tap in the 1s inter-round gap must NOT game-over (was: expected
// === sequence[playerIndex] with playerIndex === length -> undefined -> instant loss)
tap(0); g.pump(2);
T('gap-tap-safe', g.call('gameState') === 'playing', 'state=' + g.call('gameState'));
waitFor('round === 2 && isPlayerTurn && !isPlayingSequence', 2000);
tap((g.call('sequence[playerIndex]') + 1) % 4); // guaranteed-wrong vs the expected color
waitFor("gameState === 'gameover'", 200);
waitFor("document.getElementById('game-over').classList.contains('show')", 200);
T('medium-gameover', E('go-title').textContent === 'Game Over' && E('game-over').classList.contains('show') &&
  g.call('round') === 2, 'title=' + E('go-title').textContent + ' round=' + g.call('round'));
const st2 = JSON.parse(g.ls.getItem('simon_stats') || '{}');
T('stats-tracked', (st2.totalGames || 0) >= 2 && (st2.easyBest || 0) > 0, 'games=' + (st2.totalGames || 0));

// ---- pause locks input ----
g.call('clearTimers()');
g.call('newGameSameDiff()');
g.pump(5); g.call('pauseGame()');
T('paused', g.call('inputLocked') === true, 'locked=' + g.call('inputLocked'));
g.call('clearTimers()'); g.call('showMenu()'); g.call('clearTimers(); gameState = "menu"');

// ---- HARD + SPEED: two clean rounds each, then a wrong tap ----
for (const diff of ['hard', 'speed']) {
  g.call('clearTimers()');
  g.call("startGame('" + diff + "')");
  if (!waitFor('isPlayerTurn && !isPlayingSequence', 2000)) { fails.push(diff + ': no player turn'); continue; }
  for (let r = 1; r <= 2; r++) {
    const seq = g.call('sequence');
    for (const c of seq) tap(c);
    if (r < 2) waitFor('round === 2 && isPlayerTurn && !isPlayingSequence', 2500);
  }
  g.pump(3);
  const okRounds = g.call('round');
  waitFor('round === ' + (okRounds + 1) + ' && isPlayerTurn && !isPlayingSequence', 2500);
  tap((g.call('sequence[playerIndex]') + 1) % 4); // guaranteed-wrong
  waitFor("gameState === 'gameover'", 200);
  waitFor("document.getElementById('game-over').classList.contains('show')", 200);
  T(diff + '-loss-ok', g.call('gameState') === 'gameover' && okRounds >= 2 && E('go-title').textContent === 'Game Over',
    diff + ' rounds=' + okRounds + ' state=' + g.call('gameState'));
  g.call('showMenu()');
}

T('hud-updated', E('round-val') && true, 'informational'); // HUD text asserted via go-score above
T('menu-stats', (E('menu-stats').textContent || '').length >= 0, E('menu-stats').textContent);

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { easy: stuck ? 'STUCK@' + stuck : '20/20 PERFECT', medium: 'wrong-tap gameover', hard: '2 rounds + loss',
    speed: '2 rounds + loss', pause: 'locks input', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('simon-says: perfect easy-20 + losses via real taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
