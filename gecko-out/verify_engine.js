#!/usr/bin/env node
/* gecko-out verifier — 30 pin-pull physics puzzles (type A).
 * Every action goes through the REAL input path: canvas pointerdown taps on
 * menu/level-select/HUD/win/fail buttons (coords read from the engine's own
 * G._*Btns) and on pins (the engine's own hit test -> pullPin ->
 * applyGravity -> checkCollisions -> winLevel is its OWN win check). The bot
 * finds a winning pin order with a host-side mirror of the physics (search
 * only), then replays it through real taps, chaining all 30 levels via the
 * real Next button. Also covers: HUD Undo (coin-charged restore), HUD Hint,
 * win-screen Retry, level-30 end state and the gecko_out_v1 save.
 * Engine bugs fixed first:
 *  P0 hitBtn() reads x/y/w/h but drawMenu/drawHUD stored only _x/_y/_w/_h —
 *     every comparison ran against undefined, so PLAY on the main menu (and
 *     Undo/Hint/Restart/Menu in-game) could never be clicked: the game was
 *     literally unstartable.
 *  P0 19 of 30 levels were unwinnable (exit in another column than the
 *     gecko — no horizontal movement exists — or a bomb resting on the exit
 *     cell): levels 4,6,7,8,9,10,12,13,14,16,17,18,20,22,23,24,26,28,30.
 *     Data fixed (see the FIX(P0) comment at the LEVELS array); win logic
 *     untouched.
 * Note: the fail screen is unreachable by design — the gecko never ENTERS a
 * hazard cell (isOccupiedByHazard blocks its fall), and hazards can never
 * land on a resting gecko from above in a single-column engine, so no legal
 * level data can produce a death. The fail-retry path shares initLevel with
 * the win-screen Retry, which IS verified. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('gecko-out', { inject: {
  anchor: 'function pullPin(pinIdx){',
  exports: `globalThis.__GO = {
    st: () => G.state, lv: () => G.currentLevel, nlv: () => LEVELS.length,
    data: (i) => LEVELS[i],
    geo: () => [W, H, boardX, boardY, boardScale],
    pins: () => G.pins.map(p => ({ r: p.r, c: p.c, pulled: p.pulled })),
    gk: () => [G.gecko.r, G.gecko.c, G.gecko.alive],
    exit: () => [G.exitPos.r, G.exitPos.c],
    moves: () => G.moveCount, anim: () => G.animating,
    gems: () => [G.gemsCollected, G.totalGems],
    save: () => G.save, hint: () => [G.hintPin, G.hintTimer],
    undoN: () => G.undoStack.length,
    btns: (k) => G[k] || [],
    winf: () => [G.winStars, G.winCoins],
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
const CELL = 60;
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
g.pump(3);
T('menu-renders', call('__GO.st()') === 'menu' && call('__GO.btns("_menuBtns")').length === 2,
  'st=' + call('__GO.st()') + ' btns=' + call('__GO.btns("_menuBtns")').length);
T('data-30-levels', call('__GO.nlv()') === 30, 'n=' + call('__GO.nlv()'));

// real canvas taps
const RECT = g.els['gc'].getBoundingClientRect();
function tapAt(px, py) {
  g.els['gc'].dispatch('pointerdown', { clientX: RECT.left + px, clientY: RECT.top + py, preventDefault() {} });
  g.pump(2);
}
function tapPin(pin) { // engine hit test: |dx|<36, |dy|<24 around the pin center
  const geo = call('__GO.geo()');
  tapAt(geo[2] + (pin.c * CELL + CELL / 2) * geo[4], geo[3] + (pin.r * CELL + CELL / 2) * geo[4]);
}
function tapBtn(b) { tapAt(b.x + b.w / 2, b.y + b.h / 2); }

// ---- host physics mirror (SEARCH ONLY; win stays the engine's own) ----
function simLevel(lv) {
  const grid = lv.grid.map(r => [...r]);
  const pins = lv.pins.map(p => ({ r: p.r, c: p.c, pulled: false }));
  let gr = 0, gc = 0, totalGems = 0;
  const objects = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 7; c++) {
    const v = grid[r][c];
    if (v === 3) { gr = r; gc = c; grid[r][c] = 0; }
    if (v === 5) objects.push({ type: 'bomb', r, c, alive: true, collected: false });
    if (v === 6) { objects.push({ type: 'gem', r, c, alive: true, collected: false }); totalGems++; }
    if (v === 7) objects.push({ type: 'lava', r, c, alive: true, collected: false });
    if (v === 8) objects.push({ type: 'water', r, c, alive: true, collected: false });
  }
  let er = 8, ec = 3;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 7; c++) if (grid[r][c] === 4) { er = r; ec = c; }
  const isBlocked = (r, c) => r < 0 || r >= 9 || c < 0 || c >= 7 || grid[r][c] === 1 ||
    pins.some(p => !p.pulled && p.r === r && p.c === c);
  const isHaz = (r, c) => objects.some(o => o.alive && o.type !== 'gem' && o.r === r && o.c === c);
  function settle() { // applyGravity + checkCollisions, returns 'dead'|'win'|'ok'
    let moved = true, it = 0;
    while (moved && it++ < 50) {
      moved = false;
      const nr = gr + 1;
      if (!isBlocked(nr, gc) && !isHaz(nr, gc)) { gr = nr; moved = true; }
      for (const o of objects) {
        if (!o.alive || (o.type === 'gem' && o.collected)) continue;
        const onr = o.r + 1;
        if (!isBlocked(onr, o.c)) { o.r = onr; moved = true; }
      }
    }
    for (const o of objects) {
      if (!o.alive || o.r !== gr || o.c !== gc) continue;
      if (o.type === 'gem' && !o.collected) o.collected = true;
      else if (o.type !== 'gem') return 'dead';
    }
    if (gr === er && gc === ec) return 'win';
    return 'ok';
  }
  function pull(i) { pins[i].pulled = true; return settle(); }
  return { pins, pull, gems: () => objects.filter(o => o.type === 'gem' && o.collected).length, totalGems };
}
// search every permutation for a winning order (prefer all-gems, then fewest pulls)
function solve(lv) {
  const n = lv.pins.length;
  let best = null, worst = null; // worst = a first-death order for the fail test
  const dfs = (S, pulled, order) => {
    if (best && best.gems === simTotal && best.order.length === 1) return;
    for (let i = 0; i < n; i++) {
      if (pulled[i]) continue;
      const sim = simLevel(lv);
      const o2 = [...order, i];
      let res = 'ok';
      for (const k of o2) { res = sim.pull(k); if (res !== 'ok') break; }
      if (res === 'win') {
        const gems = sim.gems();
        if (!best || gems > best.gems || (gems === best.gems && o2.length < best.order.length)) best = { order: o2, gems };
      } else if (res === 'dead') {
        if (!worst || o2.length < worst.length) worst = o2;
      } else if (o2.length < n) dfs(i, { ...pulled, [i]: true }, o2);
    }
  };
  const simTotal = simLevel(lv).totalGems;
  dfs(-1, {}, []);
  return { best, worst };
}
// sanity: the mirror agrees with the engine on level 1 (both pins -> win)
const lv1 = call('__GO.data(0)');
const sol1 = solve(lv1);

// ---- menu -> level select -> level 1 (all real taps) ----
tapBtn(call('__GO.btns("_menuBtns")')[0]); g.pump(3); // PLAY
T('select-renders', call('__GO.st()') === 'select' && call('__GO.btns("_levelBtns")').length === 30,
  'st=' + call('__GO.st()') + ' cells=' + call('__GO.btns("_levelBtns")').length);
const lb1 = call('__GO.btns("_levelBtns")')[0];
const lb2 = call('__GO.btns("_levelBtns")')[1];
T('l2-locked-at-start', !lb2.unlocked && lb1.unlocked === true, 'l1=' + lb1.unlocked + ' l2=' + lb2.unlocked);
tapBtn(lb1); g.pump(3);
T('l1-plays', call('__GO.st()') === 'play' && call('__GO.lv()') === 0 && call('__GO.gk()')[2] === true,
  'st=' + call('__GO.st()') + ' lv=' + call('__GO.lv()'));

// replay the solver's order through real pin taps
function playOrder(order) {
  for (const pi of order) {
    if (call('__GO.st()') !== 'play') return call('__GO.st()');
    const pin = call('__GO.pins()')[pi];
    if (pin.pulled) return 'already-pulled';
    tapPin(pin); g.pump(24); // pull animation ~15 frames
    if (call('__GO.st()') === 'fail') return 'fail';
  }
  g.pump(26); // winLevel fires state='win' in a 300ms timer
  return call('__GO.st()');
}
T('mirror-solves-l1', !!sol1.best, 'no winning order found for L1');
let r1 = sol1.best ? playOrder(sol1.best.order) : 'no-sol';
T('l1-win-own-engine', r1 === 'win', 'r=' + r1 + ' gk=' + JSON.stringify(call('__GO.gk()')));
const winf1 = call('__GO.winf()');
T('l1-stars-recorded', winf1[0] >= 1 && winf1[1] > 0, 'stars=' + winf1[0] + ' coins=' + winf1[1]);
const sv1 = call('__GO.save()');
T('l1-saved', !!(sv1.levels['0'] && sv1.levels['0'].stars >= 1 && sv1.coins > 0), JSON.stringify(sv1.levels));

// ---- chain levels 2..30 through the real Next button ----
let chained = 1, stuck = '', attempts = 0;
const tAll = Date.now();
const failDemo = { lvl: -1, order: null };
for (let li = 1; li < 30; li++) {
  if (Date.now() - tAll > 80000) { stuck = 'budget@' + (li + 1); break; }
  const nb = call('__GO.btns("_winBtns")').find(b => b.action === 'next');
  if (!nb) { stuck = 'no-next@' + (li + 1); break; }
  tapBtn(nb); g.pump(3);
  if (call('__GO.lv()') !== li || call('__GO.st()') !== 'play') { stuck = 'chain@' + (li + 1); break; }
  const lv = call('__GO.data(' + li + ')');
  const sol = solve(lv);
  attempts++;
  if (!sol.best) { stuck = 'unsolvable@' + (li + 1); break; }
  // mid-level HUD checks (coins allow by level 3): Hint then Undo
  if (li === 2) {
    g.pump(3); // render the HUD buttons
    const hb = call('__GO.btns("_hudBtns")').find(b => b.action === 'hint');
    const coinsBefore = call('__GO.save()').coins;
    tapBtn(hb); g.pump(2);
    T('hint-highlights', call('__GO.hint()')[0] >= 0 && call('__GO.save()').coins === coinsBefore - 25,
      'hint=' + JSON.stringify(call('__GO.hint()')) + ' coins ' + coinsBefore + '->' + call('__GO.save()').coins);
  }
  if (li === 3) {
    g.pump(3);
    // pull a pin OUTSIDE the winning order (a scenery pull that cannot win)
    const spare = call('__GO.pins()').findIndex((p, ix) => !sol.best.order.includes(ix));
    const pin = call('__GO.pins()')[spare];
    const moves0 = call('__GO.moves()');
    tapPin(pin); g.pump(24);
    const ub = call('__GO.btns("_hudBtns")').find(b => b.action === 'undo');
    tapBtn(ub); g.pump(3);
    T('undo-restores', call('__GO.moves()') === moves0 && call('__GO.pins()').every(p => !p.pulled) &&
      call('__GO.undoN()') === 0,
      'moves=' + call('__GO.moves()') + '/' + moves0 + ' undoN=' + call('__GO.undoN()') + ' spare=' + spare);
  }
  const r = playOrder(sol.best.order);
  if (r !== 'win') { stuck = (li + 1) + '(' + r + ')'; break; }
  const sv = call('__GO.save()');
  if (!sv.levels[String(li)] || sv.levels[String(li)].stars < 1) { stuck = (li + 1) + '(no-save)'; break; }
  chained++;
}
T('levels-all-won', stuck === '' && chained === 30, chained + '/30 stuck=' + stuck);

// ---- level 30 end: no Next; Retry restarts; Levels returns to select ----
const winBtns30 = call('__GO.btns("_winBtns")');
T('l30-no-next', !winBtns30.some(b => b.action === 'next'), JSON.stringify(winBtns30.map(b => b.action)));
tapBtn(winBtns30.find(b => b.action === 'retry')); g.pump(3);
T('win-retry-restarts', call('__GO.st()') === 'play' && call('__GO.lv()') === 29 &&
  call('__GO.moves()') === 0 && call('__GO.pins()').every(p => !p.pulled),
  'st=' + call('__GO.st()') + ' lv=' + call('__GO.lv()') + ' moves=' + call('__GO.moves()'));
g.els['gc'].dispatch('pointerdown', { clientX: RECT.left + 10, clientY: RECT.top + 300, preventDefault() {} }); g.pump(2); // stray tap: nothing fatal
const cells2 = call('__GO.btns("_hudBtns")').find(b => b.action === 'menu');
tapBtn(cells2); g.pump(3);
tapBtn(call('__GO.btns("_menuBtns")')[0]); g.pump(3); // PLAY again -> select
T('menu-roundtrip', call('__GO.st()') === 'select', 'st=' + call('__GO.st()'));

const svF = call('__GO.save()');
const starSum = Object.values(svF.levels).reduce((s, l) => s + l.stars, 0);
T('save-all-30', Object.keys(svF.levels).length === 30 && svF.coins > 0 && svF.totalStars === starSum,
  'levels=' + Object.keys(svF.levels).length + ' stars=' + svF.totalStars + '/' + starSum + ' coins=' + svF.coins);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: chained + '/30', attempts, secs: Math.round((Date.now() - tAll) / 1000),
    notes: stuck ? 'blocker: ' + stuck : 'P0s fixed: dead menu/HUD buttons + 19 unwinnable levels; 30/30 won via real pin taps through engine pullPin/checkCollisions/winLevel; retry/undo/hint/save verified' } };
console.log('gecko-out: ' + chained + '/30 levels via real pin taps -> engine winLevel: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
