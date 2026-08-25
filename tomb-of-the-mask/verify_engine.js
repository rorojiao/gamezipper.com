#!/usr/bin/env node
/* tomb-of-the-mask verifier — A/B-type: all 25 stage levels solved by BFS over REAL arrow-key
 * swipes (document keydown -> tryMove slide-to-wall). Win = the engine's own levelComplete()
 * firing (currentScreen -> 'completeScreen' after its own winTimer). Snapshots (JSON of
 * gameState) keep enemies/lava deterministic across BFS branches. addLevelEntities() rolls
 * seeded Math.random per createGameState — layouts are deterministic for a fixed boot. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tomb-of-the-mask', { inject: {
  anchor: 'function levelComplete(){',
  exports: `render = function(){}; renderTitleBG = function(){}; // draw-only; keep headless BFS fast
globalThis.__S = {
  screen: () => currentScreen,
  start: (i) => { gameState = createGameState(i, false); particles = []; celebParticles = []; showScreen('game'); },
  snap: () => JSON.stringify(gameState),
  restore: (s) => { gameState = JSON.parse(s); if (currentScreen !== 'game') showScreen('game'); },
  pos: () => gameState ? { x: gameState.px, y: gameState.py, alive: gameState.alive, won: gameState.won, t: gameState.time, score: gameState.score, lava: gameState.lavaY } : null,
  n: () => LEVELS.length,
  saved: () => localStorage.getItem('totm_save'),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const N = g.call('__S.n()');
T('levels-exist', N === 25, 'n=' + N);

// real flow first: PLAY -> tutorial -> GOT IT (engine's own screen flow)
g.call('G.startStage(1)');
T('tutorial-shown', g.call('__S.screen()') === 'tutorialScreen', 'st=' + g.call('__S.screen()'));
g.call('G.dismissTutorial()');
g.pump(3);
T('tutorial-dismissed', g.call('__S.screen()') === 'game', 'st=' + g.call('__S.screen()'));

const DIRS = [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]];
// engine listens for keys on `document` (not body/canvas) — dispatch there directly
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, code: k, preventDefault() {} });
function solve(i, maxNodes) {
  g.call(`__S.start(${i})`);
  g.pump(2);
  if (g.call('__S.screen()') !== 'game') return false;
  let frontier = [g.call('__S.snap()')];
  const visited = new Set();
  let nodes = 0;
  for (let depth = 0; depth < 50 && frontier.length; depth++) {
    const next = [];
    for (const snap of frontier) {
      for (const [k] of DIRS) {
        if (++nodes > (maxNodes || 900)) return false;
        g.call(`__S.restore(${JSON.stringify(snap)})`);
        kd(k); // engine's own document keydown -> tryMove (slide to wall)
        g.pump(2);
        const p = g.call('__S.pos()');
        if (!p) continue;
        if (p.won) { g.pump(30); return g.call('__S.screen()') === 'completeScreen'; }
        if (!p.alive) continue; // slid through a spike / enemy / lava
        const key = p.x + ',' + p.y;
        if (visited.has(key)) continue;
        visited.add(key);
        next.push(g.call('__S.snap()'));
      }
    }
    frontier = next;
  }
  return false;
}

const solved = [];
for (let i = 0; i < N; i++) { if (solve(i)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won'); }
T('levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' + Array.from({ length: N }, (_, x) => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

// save path: stars + unlock persisted through the engine's own levelComplete()
const save = JSON.parse(g.call('__S.saved()') || '{}');
T('save-progress', (save.stars && Object.keys(save.stars).length >= solved.length - 1) && save.unlocked >= Math.min(25, solved.length + 1),
  'stars=' + Object.keys(save.stars || {}).length + ' unlocked=' + save.unlocked);

// arcade mode smoke: engine generates a maze, plays legally for 60 swipes without crash
g.call('G.startArcade()');
g.pump(2);
let arcScore = 0, arcMoves = 0, arcScreenOK = true;
for (let i = 0; i < 60; i++) {
  const p = g.call('__S.pos()');
  if (!p || !p.alive) break;
  if (g.call('__S.screen()') !== 'game') { arcScreenOK = false; break; }
  arcScore = Math.max(arcScore, p.score);
  kd(DIRS[i % 4][0]); g.pump(2); arcMoves++;
}
T('arcade-smoke', arcMoves >= 5 && arcScreenOK, 'moves=' + arcMoves);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('tomb-of-the-mask: ' + solved.length + '/' + N + ' levels via real arrow-key BFS to engine completeScreen: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
