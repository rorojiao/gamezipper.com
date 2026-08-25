#!/usr/bin/env node
/* yahtzee verifier — vs-AI type: one complete legal game vs AI-Medium through the engine's real
 * turn machinery: handleRoll() (the ROLL button's onclick handler), REAL canvas pointerdown for
 * dice holds, selectCategory() (the scorecard buttons' onclick handler), then the full AI chain
 * (aiTakeTurn timeouts + animateDiceRoll rAF promises) every round — 13 rounds for both players
 * to endGame() -> game-over modal -> Play Again (newGame) round trip. An independent mirror of
 * scoreCategory/totalScore cross-checks every recorded score and the final totals.
 * No win/goal logic is loosened anywhere.
 * Harness notes (documented quirks, not engine bugs):
 *  - the game wires init() via document.addEventListener('DOMContentLoaded'); the harness's
 *    synthetic DOMContentLoaded only reaches window-registered listeners, so this verifier fires
 *    the document-registered ones itself — exactly what a real browser does after parsing.
 *  - buttons use inline onclick="fn()" attributes calling top-level globals; the harness markup
 *    parser cannot bind attribute onclick, so the verifier invokes the same global functions the
 *    browser would run for those clicks (startGame / handleRoll / selectCategory / newGame).
 *  - the AI turn chain resolves promise .then callbacks, so the verifier yields to the event
 *    loop between pump batches (microtasks do not drain inside a synchronous loop). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('yahtzee', { inject: {
  anchor: "document.addEventListener('DOMContentLoaded',init);",
  exports: `globalThis.__S = {
  cp: () => currentPlayer,
  rolls: () => rollsLeft,
  dice: () => dice.slice(),
  held: () => held.slice(),
  anim: () => isAnimating,
  h: () => Object.assign({}, humanScores),
  a: () => Object.assign({}, aiScores),
  mode: () => gameMode,
  over: () => document.getElementById('game-over').classList.contains('show'),
  goTitle: () => document.getElementById('go-title').textContent,
  goSub: () => document.getElementById('go-subtitle').textContent,
  goYour: () => document.getElementById('go-your-score').textContent,
  stats: () => Object.assign({}, stats),
  screen: () => document.getElementById('game-screen').style.display,
  menu: () => document.getElementById('menu-screen').style.display,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
// the browser fires document-registered DOMContentLoaded listeners too — replicate that.
// The harness now AUTO-fires document-level DCL, so init() has usually already run; firing
// the listeners again re-inits, and setupDiceInteraction() builds a NEW handlePointerDown
// closure per init (element-listener dedup can't help) — every die tap then toggles twice,
// on+off, and holds never stick. Probe init's particleCanvas side effect; only fire DCL
// manually when init truly hasn't run (old-harness compatibility).
if (g.call('typeof particleCanvas') !== 'object') {
  (g.sandbox.document.__dls && g.sandbox.document.__dls.DOMContentLoaded || [])
    .forEach(f => f.call(g.sandbox.document, { type: 'DOMContentLoaded' }));
}

// ---------- independent scoring mirror (exact copy of the engine's rules) ----------
const UPPER = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
const LOWER = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];
const ALL = [...UPPER, ...LOWER];
function mScore(d, cat) {
  const c = [0, 0, 0, 0, 0, 0]; d.forEach(v => c[v - 1]++);
  const total = d.reduce((a, b) => a + b, 0);
  switch (cat) {
    case 'ones': return c[0]; case 'twos': return c[1] * 2; case 'threes': return c[2] * 3;
    case 'fours': return c[3] * 4; case 'fives': return c[4] * 5; case 'sixes': return c[5] * 6;
    case 'threeOfAKind': return c.some(x => x >= 3) ? total : 0;
    case 'fourOfAKind': return c.some(x => x >= 4) ? total : 0;
    case 'fullHouse': return (c.some(x => x === 3) && c.some(x => x === 2)) ? 25 : 0;
    case 'smallStraight': {
      const p = [c[0] > 0, c[1] > 0, c[2] > 0, c[3] > 0, c[4] > 0, c[5] > 0];
      return ((p[0] && p[1] && p[2] && p[3]) || (p[1] && p[2] && p[3] && p[4]) || (p[2] && p[3] && p[4] && p[5])) ? 30 : 0;
    }
    case 'largeStraight': { const s = d.slice().sort((a, b) => a - b).join(''); return (s === '12345' || s === '23456') ? 40 : 0; }
    case 'yahtzee': return c.some(x => x === 5) ? 50 : 0;
    case 'chance': return total;
    default: return 0;
  }
}
const mYahtzee = d => d.every(v => v === d[0]);
function mTotal(sc) {
  const u = UPPER.reduce((s, c) => s + (sc[c] || 0), 0);
  const l = LOWER.reduce((s, c) => s + (sc[c] || 0), 0);
  return u + l + (u >= 63 ? 35 : 0) + (sc.yahtzeeBonus || 0);
}
// mirror of the (post-FIX) bonus rule: yahtzee box must already be scored >0
const mBonus = (sc, d, cat) => (mYahtzee(d) && cat !== 'yahtzee' && sc.yahtzee !== undefined && sc.yahtzee > 0) ? 100 : 0;

// ---------- real pointer hold on the dice canvas (mirror of getDieIndex geometry) ----------
const CV = g.els['dice-canvas'];
const rect = CV.getBoundingClientRect();
function dieCenter(i) {
  const w = rect.width, h = rect.height, n = 5;
  const pad = w * 0.03, availW = w - pad * 2, availH = h - pad * 2;
  const dieSize = Math.min(availW / n * 0.85, availH * 0.8);
  const totalW = dieSize * n + (n - 1) * (availW / n - dieSize);
  const startX = (w - totalW) / 2, startY = (h - dieSize) / 2;
  const spacing = dieSize + (availW - totalW) / (n - 1);
  return { x: rect.left + startX + i * spacing + dieSize / 2, y: rect.top + startY + dieSize / 2 };
}
const tapDie = i => { const p = dieCenter(i); CV.dispatch('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 1, button: 0, preventDefault() {} }); };

const DEADLINE = Date.now() + 100000;
const yieldLoop = () => new Promise(r => setImmediate(r));
async function waitTurn(cap) { // pump+yield until the human's turn again (or game over), animation settled
  for (let f = 0; f < cap && Date.now() < DEADLINE; f++) {
    if (g.call('__S.over()')) return 'over';
    if (g.call('__S.cp()') === 'human' && !g.call('__S.anim()')) return 'human';
    g.pump(3); await yieldLoop();
  }
  if (g.call('__S.over()')) return 'over';
  return (g.call('__S.cp()') === 'human' && !g.call('__S.anim()')) ? 'human' : 'timeout';
}
const rollAndSettle = async () => { g.call('handleRoll()'); for (let f = 0; f < 40; f++) { g.pump(3); await yieldLoop(); if (!g.call('__S.anim()')) return true; } return !g.call('__S.anim()'); };

(async () => {
  // ---------- start a vs-AI game exactly as the menu button does ----------
  g.call("startGame('ai','medium')");
  g.pump(3); await yieldLoop();
  T('game-started', g.call('__S.screen()') === 'flex' && g.call('__S.cp()') === 'human' && g.call('__S.rolls()') === 3,
    'screen=' + g.call('__S.screen()') + ' cp=' + g.call('__S.cp()') + ' rolls=' + g.call('__S.rolls()'));

  // ---------- hold feature: one real pointerdown toggles a die on, another toggles it off ----------
  T('roll1-ok', await rollAndSettle() && g.call('__S.rolls()') === 2, 'rolls=' + g.call('__S.rolls()'));
  tapDie(0);
  T('hold-on', g.call('__S.held()')[0] === true, 'held=' + JSON.stringify(g.call('__S.held()')));
  tapDie(0);
  T('hold-off', g.call('__S.held()')[0] === false, 'held=' + JSON.stringify(g.call('__S.held()')));

  // ---------- play the 13 rounds; round 1 continues from the roll above ----------
  let holdWorked = 0, holdPreserved = 0;
  let rounds = 0;
  for (let r = 1; r <= 13 && Date.now() < DEADLINE; r++) {
    if (r > 1 && !(await rollAndSettle())) { fails.push('round ' + r + ': roll never settled'); break; }
    const dice1 = g.call('__S.dice()');
    // hold every die showing the most common face (real canvas taps)
    const cnt = {}; dice1.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
    let v = dice1[0], best = 0; for (const k in cnt) if (cnt[k] > best) { best = cnt[k]; v = +k; }
    const wantHeld = dice1.map(x => x === v);
    for (let i = 0; i < 5; i++) if (wantHeld[i]) tapDie(i);
    if (JSON.stringify(g.call('__S.held()')) === JSON.stringify(wantHeld)) holdWorked++;
    // second roll — held dice values must be preserved by the engine
    if (!(await rollAndSettle())) { fails.push('round ' + r + ': roll 2 never settled'); break; }
    const dice2 = g.call('__S.dice()');
    if (wantHeld.every((w, i) => !w || dice2[i] === dice1[i])) holdPreserved++;
    // score the best available category via the scorecard button handler
    const h0 = g.call('__S.h()');
    let cat = null, sc = -1;
    for (const c of ALL) if (h0[c] === undefined) { const s = mScore(dice2, c); if (s > sc) { sc = s; cat = c; } }
    if (!cat) { fails.push('round ' + r + ': no open category'); break; }
    g.call(`selectCategory('${cat}')`);
    const myH = { ...h0 }; myH[cat] = sc;
    if (mBonus(myH, dice2, cat)) myH.yahtzeeBonus = (myH.yahtzeeBonus || 0) + mBonus(myH, dice2, cat);
    const res = await waitTurn(700); // AI plays its whole chain
    rounds = r;
    if (res === 'timeout') { fails.push('round ' + r + ': AI chain never returned the turn (cp=' + g.call('__S.cp()') + ' anim=' + g.call('__S.anim()') + ')'); break; }
    const h1 = g.call('__S.h()'), a1 = g.call('__S.a()');
    if (h1[cat] !== sc) { fails.push('round ' + r + ': human ' + cat + ' engine=' + h1[cat] + ' mirror=' + sc); break; }
    if ((h1.yahtzeeBonus || 0) !== (myH.yahtzeeBonus || 0)) { fails.push('round ' + r + ': human yahtzeeBonus engine=' + (h1.yahtzeeBonus || 0) + ' mirror=' + (myH.yahtzeeBonus || 0)); break; }
    const aiCats = ALL.filter(c => a1[c] !== undefined);
    if (res === 'human' && aiCats.length !== r) { fails.push('round ' + r + ': AI scored ' + aiCats.length + ' categories after ' + r + ' rounds'); break; }
  }
  const finished = g.call('__S.over()');
  T('game-finished', finished === true, 'over=' + finished + ' rounds=' + rounds);
  T('hold-real-pointer', holdWorked === 13, holdWorked + '/13 rounds held via canvas pointerdown');
  T('hold-preserved', holdPreserved === 13, holdPreserved + '/13 rounds held dice survived re-roll');
  const hF = g.call('__S.h()'), aF = g.call('__S.a()');
  T('human-all-13', ALL.every(c => typeof hF[c] === 'number'), 'missing:[' + ALL.filter(c => typeof hF[c] !== 'number').join(',') + ']');
  T('ai-all-13', ALL.every(c => typeof aF[c] === 'number'), 'missing:[' + ALL.filter(c => typeof aF[c] !== 'number').join(',') + ']');

  // totals: HUD + game-over modal must equal the independent mirror
  const mh = mTotal(hF), ma = mTotal(aF);
  T('hud-human-total', String(g.els['player-score'].textContent) === String(mh), 'hud=' + g.els['player-score'].textContent + ' mirror=' + mh);
  T('hud-ai-total', String(g.els['opponent-score'].textContent) === String(ma), 'hud=' + g.els['opponent-score'].textContent + ' mirror=' + ma);
  const expTitle = mh > ma ? 'You Win!' : mh < ma ? 'AI Wins!' : 'Draw!';
  T('gameover-modal', finished && g.call('__S.goTitle()') === expTitle && String(g.call('__S.goYour()')) === String(mh),
    'title=' + g.call('__S.goTitle()') + ' (exp ' + expTitle + ') your=' + g.call('__S.goYour()') + ' (exp ' + mh + ')');
  T('gameover-subtitle', String(g.call('__S.goSub()')) === mh + ' vs ' + ma, 'sub=' + g.call('__S.goSub()'));

  // stats persisted (gamesPlayed increments once, bestScore >= final)
  const st = JSON.parse(g.ls.getItem('yahtzee-stats') || 'null');
  T('stats-saved', !!st && st.version === 2 && st.gamesPlayed === 1 && st.bestScore >= mh,
    'saved=' + JSON.stringify({ v: st && st.version, gp: st && st.gamesPlayed, best: st && st.bestScore }));

  // ---------- Play Again round trip ----------
  g.call('newGame()'); // the game-over modal's PLAY AGAIN button handler
  g.pump(3); await yieldLoop();
  T('play-again', g.call('__S.over()') === false && g.call('__S.cp()') === 'human' && Object.keys(g.call('__S.h()')).length === 0 && g.call('__S.rolls()') === 3,
    'over=' + g.call('__S.over()') + ' cp=' + g.call('__S.cp()') + ' h=' + Object.keys(g.call('__S.h()')).length + ' rolls=' + g.call('__S.rolls()'));
  // prove the new game really plays: one full human round + AI answer
  await rollAndSettle();
  const d2 = g.call('__S.dice()');
  const h2 = g.call('__S.h()');
  let c2 = null, s2 = -1; for (const c of ALL) if (h2[c] === undefined) { const s = mScore(d2, c); if (s > s2) { s2 = s; c2 = c; } }
  g.call(`selectCategory('${c2}')`);
  const res2 = await waitTurn(700);
  T('second-game-plays', res2 !== 'timeout' && g.call('__S.h()')[c2] === s2 && ALL.filter(c => g.call('__S.a()')[c] !== undefined).length === 1,
    'res=' + res2 + ' scored=' + g.call('__S.h()')[c2] + '/' + s2 + ' aiCats=' + ALL.filter(c => g.call('__S.a()')[c] !== undefined).length);
  g.call('goMenu()'); // the MENU button handler
  T('menu-return', g.call('__S.menu()') === 'flex', 'menu=' + g.call('__S.menu()'));

  T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
    JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

  const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
    extra: { finalScore: mh + ' vs ' + ma, result: expTitle, roundsPlayed: rounds, holdRounds: holdWorked } };
  console.log('yahtzee: full 13-round game vs AI-Medium to game-over + Play Again cycle: ' + out.verdict + ' (' + mh + ' vs ' + ma + ', ' + expTitle + ')');
  console.log(JSON.stringify(out));
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: 'FAIL', fails: [String(e.message).slice(0, 120)], extra: {} })); process.exit(1); });
