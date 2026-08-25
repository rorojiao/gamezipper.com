#!/usr/bin/env node
/* two-dots verifier — A-type: all 50 levels played through the engine's REAL input path
 * (canvas pointerdown -> pointermove per chain dot -> pointerup; squares close the loop with a
 * 5th move back onto the start dot; menu/NEXT/RETRY are canvas taps on the drawn buttons).
 * A greedy solver reads the live grid via an export shim, values each candidate chain/square by
 * the level's remaining objectives (collect color / anchor-drop columns / ice / slime / gem
 * make-and-collect), and replays the winner as real pointer gestures; win detection is always
 * the engine's own checkEnd() -> screen==='win'. No win logic is loosened.
 * Guard rule: never make a move that would eradicate every slime cell while the slime objective
 * is still short (slime only regrows from existing slime — total eradication deadlocks the level). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('two-dots', { viewport: [480, 640], inject: {
  anchor: 'var cListeners=[];',
  exports: `draw = function(){}; // pure render (all screens canvas-drawn); headless speed
globalThis.__S = {
  snap: function(){ return {scr:screen,lvl:currentLevel,mv:movesLeft,score:score,
    grid:grid.map(function(r){return r.slice()}),anc:Object.keys(anchors),ice:Object.assign({},iceMap),
    sl:Object.keys(slimeSet),gems:Object.keys(gems),col:Object.assign({},collected),
    iceB:iceBroken,slC:slimeCleared,gemC:gemCount,pow:Object.assign({},powerups),
    unl:save.unlocked,stars:Object.assign({},save.stars),lives:getLives(),tut:tutorialStep}; },
  lvs: function(){ return LEVELS.map(function(l){ return {mv:l.mv,obj:l.obj}; }); },
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const C = g.els.c;
const R = 6, CC = 6;
// geometry mirror of cs()/gOff()/cellAt() for W=480,H=640
const S = Math.min((480 - 32) / CC, (640 - 260) / R);
const OX = (480 - S * CC) / 2, OY = 130;
const ctr = ([r, c]) => ({ x: OX + c * S + S / 2, y: OY + r * S + S / 2 });
const ptr = (t, rc) => { const p = ctr(rc); C.dispatch(t, { clientX: p.x, clientY: p.y, pointerId: 1, button: 0, preventDefault() {} }); };
const tap = (x, y) => { C.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} }); C.dispatch('pointerup', { clientX: x, clientY: y, pointerId: 1, preventDefault() {} }); };
function playChain(cells) { // real gesture: down, move dot-to-dot, up
  ptr('pointerdown', cells[0]);
  for (let i = 1; i < cells.length; i++) ptr('pointermove', cells[i]);
  ptr('pointerup', cells[cells.length - 1]);
  g.pump(2);
}

const snap = () => g.call('__S.snap()');

// ---------- solver ----------
function needsOf(s, lv) {
  const nd = { collect: {}, ice: 0, slime: 0, gem: 0, anchor: 0 };
  lv.obj.forEach(o => {
    if (o.t === 'collect') nd.collect[o.c] = Math.max(0, o.n - (s.col[o.c] || 0));
    else if (o.t === 'ice') nd.ice = Math.max(0, o.n - s.iceB);
    else if (o.t === 'slime') nd.slime = Math.max(0, o.n - s.slC);
    else if (o.t === 'gem') nd.gem = Math.max(0, o.n - s.gemC);
    else if (o.t === 'anchor') nd.anchor = s.anc.length;
  });
  return nd;
}
function makeValuer(s, nd) {
  const ancAt = {}; let anchorCellNeed = 0;
  s.anc.forEach(k => { const [r, c] = k.split('_').map(Number); (ancAt[c] = ancAt[c] || []).push(r); anchorCellNeed += (5 - r); });
  const slimeSet = new Set(s.sl);
  const urg = rem => Math.min(1.2, rem / Math.max(4, s.mv));
  const wCollect = {}; for (const c in nd.collect) wCollect[c] = nd.collect[c] > 0 ? 3 + 11 * Math.min(1.4, nd.collect[c] / Math.max(4, s.mv)) : 0;
  const wIce = nd.ice > 0 ? 4 + 9 * urg(nd.ice * 1.6) : 0;
  const wSlime = nd.slime > 0 ? 3 + 9 * urg(nd.slime) : 0;
  const wBelow = nd.anchor > 0 ? 4 + 10 * Math.min(1.4, anchorCellNeed / Math.max(4, s.mv)) : 0;
  // how much this cell's clearance helps each remaining anchor: cells under a NEARLY-dropped anchor matter more
  const belowBoost = ar => (ar >= 4 ? 1.5 : ar >= 3 ? 1.2 : 1.0);
  const cellVal = (r, c) => {
    let v = 0;
    const vDot = s.grid[r][c];
    if (vDot === null || vDot === undefined) return 0;
    if ((nd.collect[vDot] || 0) > 0) v += wCollect[vDot];
    if (nd.ice > 0 && s.ice[r + '_' + c]) v += wIce * (s.ice[r + '_' + c] === 1 ? 1.3 : 0.9); // last-layer pops complete cells (what the objective counts)
    if (nd.slime > 0 && slimeSet.has(r + '_' + c)) v += wSlime;
    if (nd.anchor > 0) { const ars = (ancAt[c] || []).filter(ar => r > ar); if (ars.length) v += wBelow * belowBoost(Math.max(...ars)); }
    if (s.gems.includes(r + '_' + c)) v += 60;
    if ((ancAt[c] || []).includes(r)) v -= 3; // clearing the anchor's own dot sets it back (it re-adopts later)
    return v + 0.3;
  };
  const slimeWipeFatal = clearedSlime => nd.slime > 0 && s.sl.length - clearedSlime <= 0;
  return { cellVal, slimeWipeFatal, anchorCellNeed };
}
function allChains(grid, maxLen, cap) {
  const out = []; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let r = 0; r < R && out.length < cap; r++) for (let c = 0; c < CC && out.length < cap; c++) {
    const v = grid[r][c]; if (v === null || v === undefined) continue;
    const seen = new Set([r + '_' + c]); const path = [[r, c]];
    (function dfs() {
      if (path.length >= 2) out.push(path.slice());
      if (path.length >= maxLen || out.length >= cap) return;
      const cr = path[path.length - 1][0], cc2 = path[path.length - 1][1];
      for (const d of dirs) {
        const nr = cr + d[0], nc = cc2 + d[1], k = nr + '_' + nc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= CC || seen.has(k) || grid[nr][nc] !== v) continue;
        seen.add(k); path.push([nr, nc]); dfs(); path.pop(); seen.delete(k);
      }
    })();
  }
  return out;
}
function pickMove(s, lv, starve) {
  const nd = needsOf(s, lv);
  const V = makeValuer(s, nd);
  const slimeSet = new Set(s.sl);
  // cells sitting BELOW an unfinished ice/slime/gem cell: clearing them repositions that overlay
  // (gravity moves it with its dot) and re-rolls its neighborhood — key churn targets when starved
  const reposition = new Set();
  const overCells = [];
  if (nd.ice > 0) for (const k in s.ice) overCells.push(k);
  if (nd.slime > 0) s.sl.forEach(k => overCells.push(k));
  if (nd.gem > 0) s.gems.forEach(k => overCells.push(k));
  overCells.forEach(k => { const [ir, ic] = k.split('_').map(Number); for (let r = ir + 1; r < R; r++) reposition.add(r + '_' + ic); });
  // churn targets when nothing valuable chains: cells BELOW an unfinished anchor drop it on
  // clearance, and cells ORTHOGONALLY ADJACENT to an ice cell re-roll until the ice cell's own
  // dot finds a same-color partner to chain through (the only way ice pops)
  const belowAnchor = new Set(), adjIce = new Set(), adjGem = new Set();
  if (nd.anchor > 0) s.anc.forEach(k => { const [ar, ac] = k.split('_').map(Number); for (let r = ar + 1; r < R; r++) belowAnchor.add(r + '_' + ac); });
  const markAdj = (set, k) => { const [ir, ic] = k.split('_').map(Number); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => { const r = ir + dr, c = ic + dc; if (r >= 0 && r < R && c >= 0 && c < CC) set.add(r + '_' + c); }); };
  if (nd.ice > 0) for (const k in s.ice) markAdj(adjIce, k);
  if (nd.gem > 0) s.gems.forEach(k => markAdj(adjGem, k));
  let best = null, churnBest = null;
  const consider = (m) => { if (!best || m.val > best.val) best = m; };
  const gemOnBoard = s.gems.length > 0;
  // chains
  for (const cells of allChains(s.grid, 10, 600)) {
    let val = 0, slimeCleared = 0, useful = 0, churn = 0;
    for (const rc of cells) {
      const cv = V.cellVal(rc[0], rc[1]); val += cv; if (cv >= 1) useful++;
      if (slimeSet.has(rc[0] + '_' + rc[1])) slimeCleared++;
      churn += 1 + (reposition.has(rc[0] + '_' + rc[1]) ? 2.5 : 0) + (belowAnchor.has(rc[0] + '_' + rc[1]) ? 3 : 0)
        + (adjIce.has(rc[0] + '_' + rc[1]) ? 1.5 : 0) + (adjGem.has(rc[0] + '_' + rc[1]) ? 1.5 : 0);
    }
    val -= 0.7 * (cells.length - useful); // junk cells cost a move's worth of board churn
    if (V.slimeWipeFatal(slimeCleared)) val -= 1000;
    if (nd.gem > 0 && !gemOnBoard && cells.length >= 6) val += 30 + 22 * Math.min(1, (nd.gem - s.gemC) / 2); // 6+ chain spawns a gem; urgency scales with how many gems are still owed
    if (!churnBest || churn > churnBest.churn) churnBest = { type: 'chain', cells, val, churn };
    consider({ type: 'chain', cells, val });
  }
  if (process.env.DBG2 && nd.ice > 0) {
    let iceChains = 0, iceBest = 0;
    // recount from scratch for the debug line (cheap at 6x6)
    for (const cells of allChains(s.grid, 10, 600)) {
      let has = false; for (const rc of cells) if (s.ice[rc[0] + '_' + rc[1]]) has = true;
      if (has) { iceChains++; iceBest = Math.max(iceBest, cells.length); }
    }
    console.error('DBG2 mv=' + s.mv, 'iceCells=' + Object.keys(s.ice).length, 'iceChains=' + iceChains, 'maxLen=' + iceBest, 'bestVal=' + (best ? best.val.toFixed(1) : 'none'), 'wIce~' + (nd.ice > 0 ? (4 + 9 * Math.min(1.2, nd.ice * 1.6 / Math.max(4, s.mv))).toFixed(1) : '0'));
  }
  // squares: 2x2 same color -> clears every dot of that color (mass collect / ice / slime / below-anchor)
  for (let r = 0; r < R - 1; r++) for (let c = 0; c < CC - 1; c++) {
    const v = s.grid[r][c];
    if (v === null || v === undefined) continue;
    if (s.grid[r][c + 1] !== v || s.grid[r + 1][c] !== v || s.grid[r + 1][c + 1] !== v) continue;
    let val = 0, slimeCleared = 0;
    for (let rr = 0; rr < R; rr++) for (let cc2 = 0; cc2 < CC; cc2++) {
      if (s.grid[rr][cc2] === v) { val += V.cellVal(rr, cc2); if (slimeSet.has(rr + '_' + cc2)) slimeCleared++; }
    }
    if (V.slimeWipeFatal(slimeCleared)) val -= 1000;
    consider({ type: 'chain', cells: [[r, c], [r, c + 1], [r + 1, c + 1], [r + 1, c], [r, c]], val });
  }
  // target powerup (1 charge): clears all of one color — counts toward collect objectives, no move cost
  if (s.pow.target > 0) {
    const byColor = {};
    for (let r = 0; r < R; r++) for (let c = 0; c < CC; c++) { const v = s.grid[r][c]; if (v !== null && v !== undefined) (byColor[v] = byColor[v] || []).push([r, c]); }
    for (const v in byColor) {
      let val = 0, slimeCleared = 0;
      for (const rc of byColor[v]) { val += V.cellVal(rc[0], rc[1]); if (slimeSet.has(rc[0] + '_' + rc[1])) slimeCleared++; }
      if (V.slimeWipeFatal(slimeCleared)) continue;
      if (val >= 15) consider({ type: 'target', cell: byColor[v][0], val });
    }
  }
  // eraser (2 charges, whole campaign): remove any single dot — a guaranteed ice/anchor/gem-cell clear; hoard for high value
  if (s.pow.eraser > 0) {
    let bc = null, bv = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < CC; c++) { const v = V.cellVal(r, c) - 0.3; if (v > bv) { bv = v; bc = [r, c]; } }
    if (bc && bv >= 8) consider({ type: 'eraser', cell: bc, val: bv + 2 });
  }
  // extraMoves (1 charge, whole campaign): buy +5 moves only when close-but-short at the death
  const remTotal = Object.values(nd.collect).reduce((a, b) => a + b, 0) + nd.ice * 2 + nd.slime + nd.gem * 2 + V.anchorCellNeed;
  if (s.pow.extraMoves > 0 && s.mv <= 5 && remTotal > s.mv && remTotal <= 12) consider({ type: 'extra', val: 7 + remTotal / 10 });
  // gem hunting: gems only spawn from 6+ chains, so with a gem owed, nothing on the board and no
  // 6-chain in reach, a full-board reshuffle is worth more than another small chain — but only
  // when the board is near-starved (or gems are the only thing left), while there are enough
  // moves left to both spawn and then collect, and never as a death rattle
  const onlyGem = nd.gem > 0 && Object.values(nd.collect).every(v => v === 0) && nd.ice === 0 && nd.slime === 0 && nd.anchor === 0;
  const gemHunt = nd.gem > 0 && s.gems.length === 0 && !(best && best.cells && best.cells.length >= 6);
  if (gemHunt && s.pow.shuffler > 0 && s.mv >= 6 && best && (best.val < 3 || (onlyGem && best.val < 7))) return { type: 'shuffler', val: 6.5 };
  if (gemHunt && s.pow.shuffler > 0 && s.mv < 3) { /* too late to spawn+collect — save the charge */ }
  // starved: nothing useful on the board — reshuffle (fresh 36 cells) rather than nibble junk
  else if (starve >= 2 && s.pow.shuffler > 0 && (!best || best.val < 1)) return { type: 'shuffler', val: 6 };
  // no progress move at all: play the highest-churn chain (refills + overlay repositioning reshape the board)
  if (!best || best.val < 1) return churnBest || best;
  return best;
}

// ---------- play through ----------
const LVS = g.call('__S.lvs()');
T('levels-exist', LVS.length === 50, 'n=' + LVS.length);

g.pump(3);
let s = snap();
T('title-screen', s.scr === 'title', 'scr=' + s.scr);
tap(240, 352); g.pump(2); // PLAY
s = snap();
T('level-select', s.scr === 'levelSelect', 'scr=' + s.scr);
tap(128, 124); g.pump(2); // level 1 tile

const DEADLINE = Date.now() + 100000;
const won = []; let losses = 0; let stuck = ''; let regens = 0;
for (let idx = 0; idx < 50 && Date.now() < DEADLINE; idx++) {
  let guard = 0, starve = 0;
  for (;;) {
    s = snap();
    if (s.scr === 'win') break;
    if (s.scr === 'lose') {
      losses++;
      starve = 0;
      if (s.lives <= 0) {
        // out of lives: the engine regenerates one life per 20 virtual minutes (getLives()); the
        // sandbox clock is virtual, so waiting = pumping frames. A patient player does exactly
        // this. Bounded by budget and a regen cap.
        if (regens >= 40 || Date.now() > DEADLINE - 15000) { stuck = 'L' + (idx + 1) + ' lost with 0 lives left'; break; }
        regens++;
        g.pump(36000); g.pump(36000); // ~20 virtual minutes (LIFE_REGEN_MS / 16.67ms)
      }
      tap(240, 360); g.pump(2); // RETRY (real button)
      continue;
    }
    if (s.tut >= 0 && s.tut < 3) { g.call('G.nextTut()'); g.call('G.nextTut()'); g.call('G.nextTut()'); g.pump(1); continue; } // dismiss the tutorial overlay (real OK handler)
    if (++guard > 300 || s.mv <= 0 && s.scr === 'game') { stuck = 'L' + (idx + 1) + ' no progress (mv=' + s.mv + ')'; break; }
    const mv = pickMove(s, LVS[idx], starve);
    if (!mv) { stuck = 'L' + (idx + 1) + ' solver found no legal move'; break; }
    starve = mv.val < 1 ? starve + 1 : 0;
    if (process.env.DBG) console.error('L' + (idx + 1), 'mv' + s.mv, mv.type, 'val=' + mv.val.toFixed(1), 'len=' + (mv.cells ? mv.cells.length : '-'), 'starve=' + starve, 'anc=' + s.anc.length, 'col=' + JSON.stringify(s.col), 'iceB=' + s.iceB, 'slC=' + s.slC, 'gemC=' + s.gemC);
    if (mv.type === 'chain') playChain(mv.cells);
    else if (mv.type === 'target') { g.call('G.startTarget()'); ptr('pointerdown', mv.cell); ptr('pointerup', mv.cell); g.pump(2); }
    else if (mv.type === 'eraser') { g.call('G.startEraser()'); ptr('pointerdown', mv.cell); ptr('pointerup', mv.cell); g.pump(2); }
    else if (mv.type === 'extra') { g.call('G.useExtra()'); g.pump(2); }
    else if (mv.type === 'shuffler') { g.call('G.useShuffler()'); g.pump(2); }
  }
  if (stuck) break;
  won.push(idx + 1);
  if (idx === 49) break;
  tap(240, 395); g.pump(3); // NEXT (real button) -> engine's own nextLevel()
}
T('levels-won', won.length === 50, won.length + '/50 missing:[' + Array.from({ length: 50 }, (_, i) => i + 1).filter(x => !won.includes(x)).join(',') + ']' + (stuck ? ' stuck@' + stuck : ''));
const fin = snap();
T('save-progress', fin.unl >= 50 && Object.keys(fin.stars).length >= 50, 'unlocked=' + fin.unl + ' stars=' + Object.keys(fin.stars).length);
const sv = JSON.parse(g.ls.getItem('twodots_v2') || 'null');
T('save-persisted', !!sv && sv.v === 2 && sv.unlocked >= 50 && Object.keys(sv.stars || {}).length >= 50, 'unl=' + (sv && sv.unlocked));
T('lives-accounting', fin.lives >= 0 && losses <= regens + 5, 'losses=' + losses + ' waits=' + regens + ' lives=' + fin.lives);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won.length + '/50', losses, lifeWaits: regens, firstFail: won.length < 50 ? won.length + 1 : 0, note: stuck || '' } };
console.log('two-dots: ' + won.length + '/50 levels via real pointer chains/squares to engine win: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
