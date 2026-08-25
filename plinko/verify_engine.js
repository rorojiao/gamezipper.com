#!/usr/bin/env node
/* plinko verifier (type B arcade): full 30-level chain played through the real input path.
 * Each drop is a canvas pointerdown (x mapped through the engine's own scale factor);
 * physics runs inside the engine rAF loop (draw stubbed — draw-only). checkWin is the
 * engine's own (fired by its setTimeout after the last ball lands) — score >= 0.7*target
 * shows the win modal; btn-next chains to the next level. The bot learns drop positions
 * per level (try a spread of x candidates once, then retry the level dropping everything
 * at the best-paying x) — retries are a real player mechanic (btn-retry on the lose modal). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('plinko', { inject: {
  anchor: 'function checkWin(){',
  exports: `globalThis.__R = {
    state: () => state, score: () => score, balls: () => ballsRemaining,
    ready: () => dropReady, hasBall: () => !!ball,
    ballPos: () => ball ? { x: ball.x, y: ball.y, vy: ball.vy } : null,
    target: () => target, stars: () => stars, level: () => level,
    scale: () => scale, n: () => totalLevels, sl: () => slots,
    probe: (i) => { level = i; initLevel(i); state = 'game'; },
  };
draw = function(){ if(rafId)rafId=requestAnimationFrame(loop); }; // headless: skip canvas painting (draw-only)`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N === 30, 'n=' + N);

// real UI chain: title -> level select -> level 1
g.els['btn-play'].click();
g.els['level-grid'].children[0].click();
T('start-chain', g.call('__R.state()') === 'game' && g.call('__R.level()') === 1,
  'state=' + g.call('__R.state()') + ' level=' + g.call('__R.level()'));

// drop one ball at board-x X through a real canvas pointerdown
function dropAt(x) {
  const sc = g.call('__R.scale()');
  g.els['gameCanvas'].dispatch('pointerdown', { clientX: x * sc, clientY: 60, pointerId: 1, button: 0, isPrimary: true, preventDefault() {} });
}
// pump until the ball settles into a slot (engine clears it + sets dropReady), or cap
function settleBall(cap) {
  for (let i = 0; i < (cap || 2200); i++) {
    g.pump(1);
    const st = g.call('__R.state()');
    if (st === 'win' || st === 'lose') return st;
    if (!g.call('__R.hasBall()') && g.call('__R.ready()')) return 'landed';
  }
  return 'hang';
}
// play one full attempt of the current level: drop every ball, return final state
function playAttempt(xs) {
  let bi = 0;
  while (g.call('__R.state()') === 'game' && g.call('__R.balls()') > 0) {
    const x = xs[Math.min(bi, xs.length - 1)]; bi++;
    dropAt(x);
    if (!g.call('__R.hasBall()')) return 'nodrop'; // input rejected — level over for this attempt
    const r = settleBall();
    if (r === 'win' || r === 'lose' || r === 'hang') return r;
  }
  for (let i = 0; i < 200; i++) { g.pump(1); const st = g.call('__R.state()'); if (st === 'win' || st === 'lose') return st; } // checkWin setTimeout
  return g.call('__R.state()');
}

const CANDS = [12, 30, 60, 95, 130, 165, 200, 240, 300, 360, 400, 435, 470, 505, 540, 570, 588];
const T0 = Date.now();
const results = [], notes = [];
const attemptGains = {}; // per level: {x: observed gain} — later attempts drop everything at the best x
for (let lvl = 1; lvl <= N && Date.now() - T0 < 100000; lvl++) {
  if (g.call('__R.level()') !== lvl) { // recover chain (retry from current level's modal)
    fails.push('L' + lvl + ' chain broken at level ' + g.call('__R.level()')); break;
  }
  let won = false, why = '';
  for (let attempt = 0; attempt < 7 && !won; attempt++) {
    const xs = [];
    const nb = g.call('__R.balls()');
    if (attempt === 0) { // learn the board — spread candidates across the balls
      for (let i = 0; i < nb; i++) xs.push(CANDS[Math.floor(i * CANDS.length / nb)]);
    } else { // reuse the historically best-paying x for every ball
      const hist = attemptGains[lvl] || {};
      let bk = null; for (const k in hist) if (bk === null || hist[k] > hist[bk]) bk = k;
      const use = bk !== null ? Number(bk) : 300;
      for (let i = 0; i < nb; i++) xs.push(use);
    }
    const before = g.call('__R.score()');
    const r = playAttempt(xs);
    const gain = g.call('__R.score()') - before; // score resets on startLevel via btn-retry
    xs.forEach(x => { attemptGains[lvl] = attemptGains[lvl] || {}; attemptGains[lvl][x] = Math.max(attemptGains[lvl][x] || 0, gain / xs.length); });
    if (r === 'win') { won = true; results.push(lvl); }
    else {
      why = r;
      // lose modal -> btn-retry; hang (stuck ball) -> HUD ↺ restart (real player recovery)
      if (r === 'lose') g.els['btn-retry'].click();
      else g.els['btn-restart'].click();
    }
  }
  if (!won) { notes.push('L' + lvl + ' ' + why + ' (score ' + g.call('__R.score()') + '/t' + g.call('__R.target()') + ')'); fails.push('L' + lvl + ' unwon'); break; }
  if (lvl < N) g.els['btn-next'].click(); // win modal -> next level
}
T('all-30-levels', results.length === N, 'won=' + results.length + ' last=' + results[results.length - 1] + ' ' + notes.join('|'));

// engine-level sanity: slots data matches level defs (bad slot values = unwinnable targets)
let slotOk = true;
for (let i = 0; i < N; i++) {
  g.call(`__R.probe(${i + 1})`);
  const sl = g.call('__R.sl()');
  const tot = sl.reduce((a, s) => a + s.val, 0);
  if (!sl.length || tot === 0) { slotOk = false; fails.push('L' + (i + 1) + ' slots total 0'); }
}
T('slot-data-sane', slotOk, 'see fails');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { won: results.length + '/' + N, notes: notes.slice(0, 10) } };
console.log('plinko: ' + results.length + '/' + N + ' levels won via real pointer drops + engine checkWin: ' + out.verdict);
if (notes.length) console.log('misses: ' + notes.slice(0, 10).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
