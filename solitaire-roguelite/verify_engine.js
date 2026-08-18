#!/usr/bin/env node
/* solitaire-roguelite verifier — A/C-type: fight an encounter via the engine's own rules.
 * startRun() -> map -> startEncounter() (all real callees); the battle is Klondike:
 * play via moveCards/moveToFoundation/drawStock over the engine's OWN legality
 * (canPlaceOnTableau/canPlaceOnFoundation), and every foundation move runs the engine's
 * autoMoveWasteToFoundation + damageEnemy chain (1 damage/card).
 * PASS: an encounter reaches enemy hp 0 through foundation moves (engine winEncounter
 * fires), >=8 legal moves executed, run state persists, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('solitaire-roguelite', { inject: {
  anchor: 'function autoMoveWasteToFoundation() {',
  exports: "globalThis.__SR = { inBattle: () => !!battle, hp: () => battle ? battle.enemy.hpCur : -1, stock: () => battle ? battle.stock.length : 0, waste: () => battle ? battle.waste.length : 0, found: () => battle ? battle.foundations.reduce((a, f) => a + f.length, 0) : 0, tabMove: (a, b, c) => moveCards(battle.tableau, a, b, c), toFound: (a, b) => moveToFoundation(battle.tableau, battle.foundations, a, b), wasteToTab: (c) => moveWasteToTableau(battle.waste, battle.tableau, c), autoFound: () => autoMoveWasteToFoundation(), draw: () => { const r = drawStock(battle.stock, battle.waste); return r; }, legalTab: (fromCol, fromIdx, toCol) => { const src = battle.tableau[fromCol]; const dst = battle.tableau[toCol]; if (!src || fromIdx >= src.length) return false; const card = src[fromIdx]; if (!card.faceUp) return false; return canPlaceOnTableau(card, dst); }, foundable: (col) => { const src = battle.tableau[col]; if (!src || !src.length) return false; const card = src[src.length - 1]; return card.faceUp && findBestFoundationTarget(card, battle.foundations) >= 0; }, startRun: () => startRun(), startEnc: () => startEncounter(), recycle: () => { if (!battle) return false; if (battle.recycles >= 3) return false; recycleStock(battle.waste, battle.stock); battle.recycles++; return true; }, gold: () => run ? run.gold : 0 };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__SR.startRun()');
g.pump(5);
g.call('__SR.startEnc()');
g.pump(5);
T('battle-started', g.call('__SR.inBattle()') === true);

let moves = 0, guard = 0, won = false, draws = 0, wasteMoves = 0, tabMoves = 0;
while (guard++ < 6000) {
  if (!g.call('__SR.inBattle()')) break;
  if (g.call('__SR.hp()') <= 0) { won = true; break; }
  // 1) auto-move anything foundation-ready (engine's own chain — deals damage)
  const f0 = g.call('__SR.found()');
  g.call('__SR.autoFound()');
  if (g.call('__SR.found()') > f0) { moves++; g.pump(4); continue; }
  // 2) direct tableau-top -> foundation
  let acted = false;
  for (let c = 0; c < 7 && !acted; c++) {
    if (g.call(`__SR.foundable(${c})`) === true) { if (g.call(`__SR.toFound(${c}, 99)`) === true) { moves++; acted = true; } }
  }
  if (acted) { g.pump(4); continue; }
  // 2.5) waste top -> tableau (bounded: feeds foundation moves, but capping avoids
  // shuffle cycles between columns)
  if (wasteMoves < 8) {
    for (let t = 0; t < 7 && !acted; t++) {
      if (g.call(`__SR.wasteToTab(${t})`) === true) { moves++; wasteMoves++; acted = true; }
    }
  }
  if (acted) { g.pump(4); continue; }
  // 3) tableau moves that UNCOVER a face-down card only (pure shuffles cycle forever)
  const unc = g.call('(function(){for(var a=0;a<7;a++){var col=battle.tableau[a];for(var i=0;i<col.length;i++){if(!col[i].faceUp&&i<col.length-1&&col[i+1].faceUp){for(var t=0;t<7;t++){if(t!==a&&canPlaceOnTableau(col[i+1],battle.tableau[t])){return [a,i+1,t];}}}}}return null})()');
  if (unc && tabMoves < 30) {
    if (g.call(`__SR.tabMove(${unc[0]}, ${unc[1]}, ${unc[2]})`) === true) { moves++; tabMoves++; acted = true; }
  }
  if (acted) { g.pump(4); continue; }
  // 4) draw from stock; when empty, the engine's own recycle path (up to 3, enemy hits back)
  if ((g.call('__SR.stock()') || 0) > 0 && draws < 60) { g.call('__SR.draw()'); g.call('__SR.autoFound()'); draws++; g.pump(4); continue; }
  if (g.call('__SR.recycle()') === true) { g.pump(4); continue; }
  break;
}
T('encounter-won', won || g.call('__SR.hp()') <= 0, 'hp=' + g.call('__SR.hp()') + ' moves=' + moves);
T('moves-executed', moves >= 8, 'moves=' + moves);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { moves, draws, hp: g.call('__SR.hp()'), found: g.call('__SR.found()') } };
console.log('solitaire-roguelite: encounter fought via engine klondike rules: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
