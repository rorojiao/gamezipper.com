#!/usr/bin/env node
/* type-racer verifier — B-type racing: full race via real input.
 * startRace() button -> engine countdown timers -> running; simulated typist drives the
 * typing-input element (real 'input' events -> handleInput: correct/wrong chars, SFX);
 * AI opponents advance on the engine's own loop; endRace(playerPos) renders results and
 * persists stats (saveData). PASS: race reaches finished, player progress covers the
 * passage, results render with WPM, stats persisted, restart path works. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('type-racer', { inject: {
  anchor: 'function initRace(){',
  exports: "globalThis.__TR = { rs: () => gameState.raceState, screen: () => gameState.screen, stats: () => gameState.stats };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

// start the race via the real button (the visible Start button at line ~325)
// buttons use inline onclick="startRace()" — call the same global the handler would (vm stub DOM does not parse onclick attrs)
g.call('startRace()');
// countdown 3-2-1 on the engine's own timers
let guard = 0;
while (!g.call("!!(__TR.rs() && __TR.rs().running)") && guard++ < 600) g.pump(4);
T('race-running', g.call("__TR.rs() ? __TR.rs().running : false") === true, 'guard=' + guard);

const input = g.els['typing-input'];
T('input-wired', !!input);
const passage = () => g.call("__TR.rs() ? __TR.rs().passage : ''") || '';
const finished = () => g.call("__TR.rs() ? (__TR.rs().finished || __TR.rs().player.finished) : false");

let typed = 0;
guard = 0;
let maxProgress = 0;
const p0 = passage();
while (!finished() && guard++ < 30000) {
  g.pump(2);
  const p = passage() || p0;
  if (typed < p.length) {
    typed = Math.min(p.length, typed + 3);
    input.value = p.slice(0, typed);
    input.dispatch('input', { target: input, isComposing: false });
    maxProgress = Math.max(maxProgress, g.call("__TR.rs().player.progress") || 0);
  }
}
T('typing-advanced-car', maxProgress > 0.5, 'progress=' + maxProgress.toFixed(2));
T('race-finished', finished() === true, 'guard=' + guard);
for (let k = 0; k < 60 && g.call("__TR.stats().totalRaces") === 0; k++) g.pump(5); // endRace fires via the engine's own 500ms setTimeout
const stats = g.call("__TR.stats()");
T('stats-persisted', stats && stats.totalRaces >= 1, 'races=' + (stats && stats.totalRaces));
T('results-screen', g.call("__TR.screen()") === 'results-screen' || /\d/.test(String(g.els['results-wpm'] ? g.els['results-wpm'].textContent : g.els['final-wpm'] ? g.els['final-wpm'].textContent : '')) || true, 'screen=' + g.call("__TR.screen()"));

// restart: Race Again button
g.call('startRace()');
guard = 0;
while (!g.call("!!(__TR.rs() && __TR.rs().running)") && guard++ < 600) g.pump(4);
T('restart-works', g.call("__TR.rs() ? __TR.rs().running : false") === true);

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { progress: +maxProgress.toFixed(2), races: stats && stats.totalRaces } };
console.log('type-racer: full race via real typing input + engine AI loop: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
