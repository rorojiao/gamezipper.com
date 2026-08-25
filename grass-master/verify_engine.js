#!/usr/bin/env node
/* grass-master verifier — 30 slide-mower levels (type A).
 * Independent BFS over (mower, remaining-grass) states solves each level, then the
 * move sequence is REPLAYED through the real input path: canvas pointerdown/up swipes
 * (>=20px delta) fire the engine's own doMove -> slide anim -> loop() -> engine's own
 * checkWin() -> triggerWin() (wrapped flag) -> win overlay. Next level via the real
 * btnNext click handler. PASS: all 30 levels won through the engine win path. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('grass-master', { inject: {
  anchor: 'function triggerWin(){',
  exports: `const __origTW = triggerWin;
  triggerWin = function(){ globalThis.__won = true; return __origTW.apply(this, arguments); };
  globalThis.__GM = {
    n: () => LEVELS.length, levels: () => LEVELS, start: (i) => startLevel(i),
    mower: () => state.mower, grid: () => state.grid, moves: () => state.moves,
    anim: () => !!state.anim, screen: () => state.screen,
    par: () => state.par, lvl: () => state.lvl,
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = call('__GM.n()');
T('levels-30', N === 30, 'n=' + N);

const DIRS = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] };
// independent solver on the engine's own level data (rocks/flowers/water block)
function solve(L, budget) {
  const size = L.size, blocks = [], grass0 = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const v = L.grid[r][c];
    if (v === 2 || v === 3 || v === 4) blocks.push(r + ',' + c);
    else if (v === 1) grass0.push(r + ',' + c);
  }
  const blockedSet = new Set(blocks);
  const key = (m, grass) => m[0] + ',' + m[1] + '|' + [...grass].sort().join(';');
  const startM = L.start.slice();
  const initGrass = new Set(grass0);
  // the mower cuts its own starting cell if it is grass (doMove cuts the vacated cell)
  const sk = startM[0] + ',' + startM[1];
  if (initGrass.has(sk)) initGrass.delete(sk);
  const seen = new Set([key(startM, initGrass)]);
  let frontier = [{ m: startM, grass: initGrass, path: [] }];
  let work = 0;
  while (frontier.length && work < (budget || 80000)) {
    const next = [];
    for (const node of frontier) {
      for (const dir of Object.keys(DIRS)) {
        const [dr, dc] = DIRS[dir];
        let r = node.m[0], c = node.m[1];
        const grass = new Set(node.grass);
        let movedFlag = false;
        while (true) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= size || nc >= size) break;
          if (blockedSet.has(nr + ',' + nc)) break;
          r = nr; c = nc; movedFlag = true;
          grass.delete(r + ',' + c);
        }
        if (!movedFlag) continue;
        work++;
        if (!grass.size) return node.path.concat(dir); // all grass cut
        const k = key([r, c], grass);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ m: [r, c], grass, path: node.path.concat(dir) });
      }
    }
    frontier = next;
    if (frontier.length > 40000) break;
  }
  return null;
}

const canvasEl = () => g.els['game'];
function swipe(dir) {
  const [dr, dc] = DIRS[dir];
  const el = canvasEl();
  el.dispatch('pointerdown', { clientX: 200, clientY: 200, pointerId: 1, button: 0, preventDefault() {} });
  el.dispatch('pointerup', { clientX: 200 + dc * 60, clientY: 200 + dr * 60, pointerId: 1, preventDefault() {} });
}

const solved = []; let unsolved = []; let replayFails = 0;
const deadline = Date.now() + 90000;
for (let i = 0; i < N && Date.now() < deadline; i++) {
  const L = call(`__GM.levels()[${i}]`);
  const path = solve(L, 80000);
  if (!path) { unsolved.push(i + 1); continue; }
  call(`__GM.start(${i})`); g.pump(2);
  call('globalThis.__won = false; undefined');
  let ok = false;
  for (const dir of path) {
    swipe(dir);
    for (let f = 0; f < 90 && call('__GM.anim()'); f++) g.pump(1); // anim 150-400ms
    g.pump(2);
    if (call('globalThis.__won ? 1 : 0')) { ok = true; break; }
  }
  if (!ok) { // extra settle (anim timing) before declaring replay failure
    g.pump(30);
    ok = !!call('globalThis.__won');
  }
  if (ok) {
    solved.push(i + 1);
    g.els['btnNext'].click(); // real Next Level handler
    g.pump(2);
  } else { replayFails++; unsolved.push(i + 1); }
}
T('levels-won', solved.length === N, solved.length + '/' + N + ' unsolved:[' + unsolved.join(',') + '] replayFails=' + replayFails);
// mechanics sanity via real swipe on L1: one RIGHT swipe cuts the row and wins
call('__GM.start(0)'); g.pump(2);
call('globalThis.__won = false; undefined');
swipe('RIGHT');
for (let f = 0; f < 60 && (call('__GM.anim()') || !call('globalThis.__won ? 1 : 0')); f++) g.pump(1);
T('l1-one-swipe-win', !!call('globalThis.__won'), 'moves=' + call('__GM.moves()'));
// undo/reset path through the engine's own buttons
call('__GM.start(0)'); g.pump(2);
swipe('DOWN'); for (let f = 0; f < 60 && call('__GM.anim()'); f++) g.pump(1); g.pump(2);
call('doUndo()'); g.pump(1); // engine's own global (the HTML button's onclick calls exactly this)
T('undo-restores', call('__GM.moves()') === 0, 'moves=' + call('__GM.moves()'));
call('doReset()'); g.pump(1);
T('reset-works', call('__GM.moves()') === 0 && call('__GM.screen()') === 'game', 'moves=' + call('__GM.moves()'));
const ls = g.ls.getItem('grassMasterV1');
T('save-written', !!ls && /stars/.test(ls), ls ? ls.slice(0, 50) : 'none');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { won: solved.length + '/' + N, unsolved } };
console.log('grass-master: ' + solved.length + '/' + N + ' levels mowed via real swipes (BFS replay): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
