#!/usr/bin/env node
/* eco-reclaim verifier — 12 restoration-puzzle levels (type A/B).
 * Every placement goes through the REAL input path: tool buttons (renderTools
 * onclick) -> Game.selTool, canvas pointerdown -> pointerToCell -> pickCell ->
 * applyTool (the engine's own validity/cost/spread rules) -> computeGoals ->
 * goalsMet (engine's own coverage check) -> the real Pack Up button -> packUp
 * -> rank/save/next-level unlock, chained via the complete overlay's real Next
 * button. Seeded rng (424242) keeps spread shuffles deterministic.
 * Bot: mirrors the engine's tool rules and plays goal-driven — river first,
 * wetlands/beaches (water-adjacent), grass stock with reserve margin, fynbos,
 * then forest; core economy is self-sustaining because green placements refund
 * +2 and spreads +1 each (purify/excavate are the only net costs). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('eco-reclaim', { inject: {
  anchor: 'function applyTool(r,c){',
  exports: `globalThis.__EC = {
    g: () => Game.grid, W: () => Game.W, H: () => Game.H,
    cores: () => Game.cores, cov: () => Game.coverage, goalsMet: () => goalsMet(),
    hist: () => Game.history.length, sel: () => Game.selTool,
    center: (r, c) => { const p = cellCenter(r, c); return [p.x, p.y]; },
    fin: () => !Game || Game.finished, lvl: () => Game ? Game.level.id : 0,
    goals: () => Game.level.goals, nLevels: () => LEVELS.length,
    best: () => Save.best, unlocked: () => Save.unlocked,
    fail: () => document.getElementById('failOverlay').classList.contains('show'),
    win: () => document.getElementById('completeOverlay').classList.contains('show'),
    packEnabled: () => !document.getElementById('btnPack').disabled,
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
const TOOL_IDX = { purify: 0, excavate: 1, irrigate: 2, cultivate: 3, arboretum: 4, coastal: 5, fynbos: 6 };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-12', call('__EC.nLevels()') === 12, 'n=' + call('__EC.nLevels()'));

// menu -> level select: locked cards have no onclick (real lock behavior)
g.els['btnLevels'].click(); g.pump(2);
T('level-select-cards', g.els['lsGrid'].children.length === 12, 'cards=' + g.els['lsGrid'].children.length);
g.els['lsGrid'].children[1].click(); g.pump(2);
T('locked-card-blocked', call('__EC.lvl()') === 0, 'started lvl ' + call('__EC.lvl()'));

// real Play button starts level 1; dismiss the first-visit tutorial popup
g.els['btnPlay'].click(); g.pump(3);
T('play-starts-l1', call('__EC.lvl()') === 1, 'lvl=' + call('__EC.lvl()'));
call('(document.getElementById("tutSkip")||{click(){}}).click()');

// mechanics through the real path: purify click converts a tile, undo restores it
const g0 = JSON.stringify(call('__EC.g()')), cores0 = call('__EC.cores()');
selectTool('purify'); placeCell(2, 2);
T('real-click-purifies', call('__EC.g()[2][2]') === 3 && call('__EC.cores()') === cores0 - 1,
  'tile=' + call('__EC.g()[2][2]') + ' cores=' + call('__EC.cores()'));
selectTool('cultivate'); // real tool switch (button click -> Game.selTool)
T('tool-select-works', call('__EC.sel()') === 'cultivate', 'sel=' + call('__EC.sel()'));
selectTool('purify');
g.els['btnUndo'].click(); g.pump(2);
T('undo-restores-grid', JSON.stringify(call('__EC.g()')) === g0, 'grid differs after undo');

function selectTool(id) { if (call('__EC.sel()') !== id) { g.els['toolsGrid'].children[TOOL_IDX[id]].click(); g.pump(2); } }
function placeCell(r, c) { const p = call('__EC.center(' + r + ',' + c + ')'); g.els['board'].dispatch('pointerdown', { clientX: p[0], clientY: p[1] }); g.pump(8); }

/* ---------- solver (host-side mirror of the engine's tile/tool rules) ---------- */
const B = 0, TX = 1, RK = 2, SO = 3, GR = 4, WE = 5, FO = 6, RI = 7, BE = 8, FY = 9;
const adjWater = (g2, r, c) => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => {
  const row = g2[r + dr]; const t = row ? row[c + dc] : undefined; return t === RI || t === WE;
});
function pickAction(g2, goals, cores) {
  const H = g2.length, W = g2[0].length, total = H * W;
  const cnt = {}; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) cnt[g2[r][c]] = (cnt[g2[r][c]] || 0) + 1;
  const need = {}; for (const k in goals) need[k] = Math.ceil(goals[k] * total - 1e-9);
  const soil = [], bt = [], grass = [], soilAw = [], btAw = [];
  let anyWater = false;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const t = g2[r][c];
    if (t === RI || t === WE) anyWater = true;
    if (t === SO) { soil.push([r, c]); if (adjWater(g2, r, c)) soilAw.push([r, c]); }
    if (t === B || t === TX) { bt.push([r, c]); if (adjWater(g2, r, c)) btAw.push([r, c]); }
    if (t === GR) grass.push([r, c]);
  }
  const first = (arr) => arr.length ? arr[0] : null;
  const nearCenter = (arr) => arr.slice().sort((a, b) =>
    (Math.abs(a[0] - H / 2) + Math.abs(a[1] - W / 2)) - (Math.abs(b[0] - H / 2) + Math.abs(b[1] - W / 2)))[0];
  // 1. wetland (opens water adjacency for wetland/beach chains)
  if (need.wetland > (cnt[WE] || 0)) {
    if (!anyWater) {
      const s = nearCenter(soil); if (s) return { tool: 'excavate', at: s };
      const b2 = nearCenter(bt); if (b2) return { tool: 'purify', at: b2 };
    } else {
      const s = first(soilAw); if (s) return { tool: 'irrigate', at: s };
      const b2 = first(btAw); if (b2) return { tool: 'purify', at: b2 };
      const s2 = nearCenter(soil.filter(([r, c]) => adjWater(g2, r, c))); if (s2) return { tool: 'excavate', at: s2 };
      const b3 = first(bt); if (b3) return { tool: 'purify', at: b3 };
    }
  }
  // 2. beach
  if (need.beach > (cnt[BE] || 0)) {
    const s = first(soilAw); if (s) return { tool: 'coastal', at: s };
    const b2 = first(btAw); if (b2) return { tool: 'purify', at: b2 };
    const s2 = first(soil); if (s2 && anyWater && adjWater(g2, s2[0], s2[1])) return { tool: 'excavate', at: s2 };
    const b3 = first(bt); if (b3) return { tool: 'purify', at: b3 };
  }
  const remFy = Math.max(0, (need.fynbos || 0) - (cnt[FY] || 0));
  const remFo = Math.max(0, (need.forest || 0) - (cnt[FO] || 0));
  const grassGoal = (need.grass || 0);
  // 3. fynbos consumes grass — only from surplus above the grass goal
  if (remFy > 0 && grass.length > grassGoal) return { tool: 'fynbos', at: first(grass) };
  // 4. forest consumes grass (and its spread eats adjacent grass)
  if (remFy === 0 && remFo > 0 && grass.length > grassGoal) return { tool: 'arboretum', at: first(grass) };
  // 5. grass / totalGreen stock (reserve covers later fynbos/forest conversions)
  const greenNow = (cnt[GR] || 0) + (cnt[FO] || 0) + (cnt[WE] || 0) + (cnt[FY] || 0);
  const grassTarget = grassGoal + remFy + remFo + 1;
  if ((cnt[GR] || 0) < grassTarget || ((need.totalGreen || 0) > greenNow)) {
    const s = soil.slice().sort((a, b) => // most-soil-neighbors first: spreads refund most
      soilNb(g2, b) - soilNb(g2, a))[0];
    if (s) return { tool: 'cultivate', at: s };
  }
  // 6. low cores: any core-positive action before spending
  if (cores <= 3) {
    if (soilAw.length) return { tool: 'irrigate', at: first(soilAw) };
    if (soil.length) return { tool: 'cultivate', at: first(soil) };
    if (grass.length) return { tool: 'fynbos', at: first(grass) };
  }
  // 7. open more soil
  const b4 = first(bt); if (b4 && cores >= 1) return { tool: 'purify', at: b4 };
  return null;
}
function soilNb(g2, [r, c]) {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]].reduce((n, [dr, dc]) => {
    const row = g2[r + dr]; return n + (row && row[c + dc] === SO ? 1 : 0);
  }, 0);
}

function playLevel() {
  const t0 = Date.now();
  let noops = 0;
  for (let step = 0; step < 1200 && Date.now() - t0 < 14000; step++) {
    if (call('__EC.goalsMet()')) {
      if (call('__EC.packEnabled()')) { g.els['btnPack'].click(); g.pump(6); }
      return call('__EC.win()') ? 'won' : 'pack-failed';
    }
    if (call('__EC.fin()')) return call('__EC.fail()') ? 'fail-overlay' : 'finished';
    const g2 = call('__EC.g()');
    const act = pickAction(g2, call('__EC.goals()'), call('__EC.cores()'));
    if (!act) return 'stuck';
    const before = JSON.stringify(g2) + call('__EC.cores()');
    selectTool(act.tool); placeCell(act.at[0], act.at[1]);
    const after = JSON.stringify(call('__EC.g()')) + call('__EC.cores()');
    if (before === after) { if (++noops > 4) return 'noop'; } else noops = 0;
  }
  return 'timeout';
}

// play all 12 levels chained through the real complete overlay
const deadline = Date.now() + 95000;
const done = [], stuck = [];
let attempts = 0;
for (let lvl = 1; lvl <= 12 && Date.now() < deadline; lvl++) {
  let res = 'not-run';
  for (let a = 0; a < 3; a++) {
    attempts++;
    res = playLevel();
    if (res === 'won') break;
    if (Date.now() > deadline) break;
    // real retry paths: fail overlay's Retry, or the in-game restart button
    if (call('__EC.fail()')) { g.els['failRetry'].click(); g.pump(4); }
    else { g.els['gRestart'].click(); g.pump(4); }
  }
  if (res === 'won') { done.push(lvl + ':' + ((call('__EC.best()')['' + lvl] || {}).rank || '?')); if (lvl < 12) { g.els['cmpNext'].click(); g.pump(6); } }
  else { stuck.push(lvl + '(' + res + ')'); if (lvl < 12) { if (call('__EC.lvl()') !== lvl + 1) { call('startLevel(' + (lvl + 1) + ')'); g.pump(4); } } }
}
T('levels-complete', done.length === 12, done.length + '/12 done=[' + done.join(',') + '] stuck=[' + stuck.join(',') + ']');
const best = call('__EC.best()');
T('save-written', Object.keys(best).length >= 12 && call('__EC.unlocked()') >= 12,
  'best=' + JSON.stringify(best).slice(0, 70) + ' unlocked=' + call('__EC.unlocked()'));
const ls = g.ls.getItem('ecoreclaim_save_v1');
T('save-persisted', !!ls && JSON.parse(ls).unlocked >= 12, ls ? '' : 'no save');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: done.length + '/12', ranks: done, stuck } };
console.log('eco-reclaim: ' + done.length + '/12 levels via real clicks -> engine goalsMet/packUp: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
