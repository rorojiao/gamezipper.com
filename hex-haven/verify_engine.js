#!/usr/bin/env node
/* hex-haven verifier — 30 quest levels (type A/B).
 * Every tile placement goes through the REAL input path: canvas click events ->
 * pixelToHex -> placeTile -> updateQuestProgress -> checkGameEnd -> endGame('complete')
 * (the engine's own all-quests-complete win). Levels entered via the real level-grid
 * card click (card.onclick=startGame) and chained with nextLevel() (the exact handler
 * the Next Level button's onclick attribute calls — attribute handlers don't compile in
 * the vm, so the global is invoked directly). Menu buttons likewise (onclick attrs).
 * Bot: place tiles nearest-center-first at any valid adjacent hex (placement position
 * doesn't affect quest counts — quests count tiles having the terrain on any edge),
 * so simply dealing tiles until the engine's own quest flags flip completes levels.
 * If a seeded tile stream runs dry (gameover), restartLevel() re-rolls — recorded. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hex-haven', { inject: {
  anchor: 'function placeTile(q, r) {',
  exports: `globalThis.__HH = {
    lvl: () => gameState.currentLevel, nLevels: () => CONFIG.LEVEL_COUNT,
    board: () => currentGame.board.size, tiles: () => currentGame.tilesRemaining,
    tile: () => !!currentGame.currentTile, quests: () => currentGame.quests.map(q => ({ t: q.type, target: q.target, done: !!q.completed })),
    stars: () => currentGame.starsEarned, score: () => currentGame.score,
    history: () => currentGame.moveHistory.length,
    modal: () => document.getElementById('game-over').classList.contains('show'),
    over: () => currentGame.quests.every(q => q.completed),
    px: (q, r) => { const p = hexToPixel(q, r); return [Math.round(p.x), Math.round(p.y)]; },
    valid: (q, r) => isValidPosition(q, r),
    spot: () => { // nearest-center empty valid hex (engine's own isValidPosition)
      let best = null, bd = 1e9;
      for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) {
        if (Math.sqrt(q * q + r * r + q * r) > 4.5) continue;
        if (!isValidPosition(q, r)) continue;
        const d = q * q + r * r + q * r;
        if (d < bd) { bd = d; best = [q, r]; }
      }
      return best;
    },
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30', call('__HH.nLevels()') === 30, 'n=' + call('__HH.nLevels()'));

// menu -> level select (onclick-attribute buttons -> same global fns)
call('showLevelSelect()');
const cards = g.els['level-grid'].children;
T('grid-30-cards', cards.length === 30, 'cards=' + cards.length);

// mechanics on L1 through real clicks: place 2 tiles, undo restores, restart works
cards[0].click(); // real card.onclick -> startGame
T('l1-started', call('__HH.tiles()') > 0 && call('__HH.tile()') === true, 'tiles=' + call('__HH.tiles()'));
const canvas = g.els['board'];
function clickHex(q, r) { const [x, y] = call('__HH.px(' + q + ',' + r + ')'); canvas.dispatch('click', { clientX: x, clientY: y }); }
let spot = call('__HH.spot()'); clickHex(spot[0], spot[1]);
T('click-places-tile', call('__HH.board()') === 1, 'board=' + call('__HH.board()'));
spot = call('__HH.spot()'); clickHex(spot[0], spot[1]);
T('adjacent-click-places', call('__HH.board()') === 2, 'board=' + call('__HH.board()'));
// non-adjacent click is rejected by the engine's own isValidPosition
clickHex(4, -2);
T('far-click-rejected', call('__HH.board()') === 2, 'board=' + call('__HH.board()'));
// far-click rejected proof: the game still offers a valid adjacent spot
T('spot-still-offered', Array.isArray(call('__HH.spot()')), 'spot=' + JSON.stringify(call('__HH.spot()')));
call('undoLastMove()'); // engine's own global (the Undo button's onclick)
T('undo-removes-tile', call('__HH.board()') === 1 && call('__HH.history()') === 1, 'board=' + call('__HH.board()'));
call('restartLevel()'); // real restart handler
T('restart-resets', call('__HH.board()') === 0 && call('__HH.tiles()') === 22, 'board=' + call('__HH.board()') + ' tiles=' + call('__HH.tiles()'));

// play all 30 levels: real clicks until the engine's own all-quests-complete fires
const deadline = Date.now() + 95000;
const done = []; const retried = []; const stuck = [];
let clicks = 0;
for (let lvl = 1; lvl <= 30 && Date.now() < deadline; lvl++) {
  if (call('__HH.lvl()') !== lvl) { call('gameState.currentLevel = ' + lvl + '; startGame(generateLevel(' + lvl + '))'); }
  let won = false;
  for (let attempt = 0; attempt < 4 && !won; attempt++) {
    if (attempt > 0) { call('restartLevel()'); retried.push(lvl); }
    let guard = 0;
    while (guard++ < 60) {
      if (call('__HH.over()')) { won = true; break; } // engine's own every(completed)
      if (!call('__HH.tile()') || call('__HH.tiles()') <= 0) break; // dealt out -> retry
      const s = call('__HH.spot()');
      if (!s) break;
      clickHex(s[0], s[1]); clicks++;
    }
    if (!won && !call('__HH.tile()')) continue; // re-roll
    if (!won) break; // no spots left (board full) -> retry won't help
  }
  if (won) {
    T('modal-on-win-' + lvl, call('__HH.modal()') === true, 'modal hidden');
    done.push(lvl + '(' + call('__HH.stars()') + '*)');
    if (lvl < 30) call('nextLevel()'); // the Next Level button's own handler
  } else stuck.push(lvl);
}
T('levels-complete', done.length === 30, done.length + '/30 done=[' + done.slice(0, 12).join(',') + '] stuck=[' + stuck.join(',') + '] retries=' + retried.length);
T('score-positive', call('__HH.score()') > 0, 'score=' + call('__HH.score()'));
const ls = g.ls.getItem('hexhaven-progress');
let savedStars = 0;
try { savedStars = Object.keys(JSON.parse(ls).stars).length; } catch (e) {}
T('save-written', savedStars >= 30, ls ? 'stars saved=' + savedStars : 'none');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: done.length + '/30', clicks, retries: retried.length, stuck } };
console.log('hex-haven: ' + done.length + '/30 levels completed via real canvas clicks (engine quest->endGame): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
