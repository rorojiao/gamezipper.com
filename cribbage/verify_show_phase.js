#!/usr/bin/env node
/* cribbage show-phase regression (2026-11-12 R1139):
 * P1 softlock: crib panel set G.currentScorer = countingPlayer === 2, so
 * continueShow read G.players[2].totalScore -> TypeError -> game froze after
 * EVERY hand's crib panel (browser-captured: "Uncaught TypeError: Cannot read
 * properties of undefined (reading 'totalScore')@887").
 * P1 scoring gap: startShow began at 1-G.dealer, so when dealer===0 the
 * dealer's own hand was never counted.
 * Layer 1: static wiring. Layer 2: engine-driven show chain for dealer=0 and
 * dealer=1 — all 5 cards' worth (2 hands + crib) must be credited, scorer for
 * crib must be the dealer, chain must end in game_over with zero errors. */
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };

const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
T('wire-start-at-0', /G\.countingPlayer=0;\s*\n?\s*showNextCount\(\);/.test(src.match(/function startShow\(\)\{[\s\S]*?\n\}/)[0]), 'startShow must begin at player 0 (count BOTH hands then crib)');
T('wire-scorer-dealer-map', /G\.currentScorer=\(G\.countingPlayer===2\)\?G\.dealer:G\.countingPlayer;/.test(src), 'crib panel must credit the dealer, not index 2');
T('wire-iscrib-flag', /showScoreBreakdown\(hand,scoring,label,G\.countingPlayer===2\)/.test(src), 'isCrib must be countingPlayer===2');

function runShow(dealer) {
  const g = bootGame('cribbage', { inject: {
    anchor: 'function continueShow(){',
    exports: "globalThis.__T = { ng: () => newGame(1), go: () => { G.phase='pegging'; G.dealer=" + dealer + "; G.starter={suit:'S',rank:5,value:5}; G.players[0].hand=[{suit:'S',rank:5,value:5},{suit:'H',rank:6,value:6},{suit:'D',rank:7,value:7},{suit:'C',rank:10,value:10}]; G.players[1].hand=[{suit:'S',rank:2,value:2},{suit:'H',rank:3,value:3},{suit:'D',rank:9,value:9},{suit:'C',rank:10,value:10}]; G.crib=[{suit:'S',rank:4,value:4},{suit:'H',rank:8,value:8},{suit:'D',rank:10,value:10},{suit:'C',rank:13,value:10}]; G.players[0].totalScore=0; G.players[1].totalScore=0; startShow(); }, ph: () => G.phase, cp: () => G.countingPlayer, sc: () => G.currentScorer, s0: () => G.players[0].totalScore, s1: () => G.players[1].totalScore, cont: () => continueShow() };",
  } });
  if (g.loadErrors.length) return { err: 'load: ' + JSON.stringify(g.loadErrors[0]).slice(0, 100) };
  g.call('__T.ng()'); g.pump(5);
  g.call('__T.go()');
  const scorers = []; let panels = 0;
  for (let it = 0; it < 10; it++) {
    for (let pf = 0; pf < 20; pf++) { g.pump(30); if (g.call('__T.cp()') !== undefined && g.sandbox.__lastPanel !== false) break; }
    if (g.call('__T.ph()') === 'game_over' || panels >= 3) break;
    scorers.push(g.call('__T.sc()')); panels++;
    g.call('__T.cont()');
  }
  for (let pf = 0; pf < 60 && g.call('__T.ph()') !== 'game_over'; pf++) g.pump(30); // endGame queued at setTimeout 800ms
  return { panels, scorers, s0: g.call('__T.s0()'), s1: g.call('__T.s1()'), ph: g.call('__T.ph()'), errs: (g.sandbox.__errors || []).concat(g.loadErrors || []).slice(0, 4) };
}

// Expected show totals for our fixed layouts (starter S5 included):
// P0 hand 5,6,7,10 + S5: 15s: 5+10=15, 5(dup S5? cards S5,H6,D7,C10 + starter S5)->15s: 5+10 (starter5+p0 C10)=15 x? computed by engine — assert invariants instead.
for (const dealer of [0, 1]) {
  const r = runShow(dealer);
  T('d' + dealer + '-no-errors', !r.err && (!r.errs || r.errs.length === 0), (r.err || JSON.stringify(r.errs || [])).slice(0, 160));
  T('d' + dealer + '-three-panels', r.panels === 3, JSON.stringify(r));
  T('d' + dealer + '-scorers-0-1-dealer', JSON.stringify(r.scorers) === JSON.stringify([0, 1, dealer]), JSON.stringify(r.scorers));
  T('d' + dealer + '-both-scored', (r.s0 || 0) > 0 && (r.s1 || 0) > 0, JSON.stringify(r));
  T('d' + dealer + '-reaches-game-over', r.ph === 'game_over', 'ph=' + r.ph);
}
console.log('show-phase verifier: PASS=' + pass + ' FAIL=' + fail);
if (fail) { console.log('FAILS:\n' + fails.join('\n')); process.exit(1); }
