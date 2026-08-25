#!/usr/bin/env node
'use strict';
// Marble Run — full-level verification via real input paths (verifier-spec contract).
//
// What it exercises per level (all through the engine's own listeners):
//   1. #btn-start click → level-select screen; #level-grid child click → startLevel(i)
//   2. palette .piece-btn click → selectPiece (real toggle behavior)
//   3. game-canvas click at cell centers → the real placement path (budget-guarded,
//      fixed/start/finish cells rejected)
//   4. #btn-play click → startSim; rAF ticks pumped until the engine's own win check
//      in updateMarble sets marble.won (never relaxed here)
//   5. setTimeout(levelComplete,600) → complete-overlay active + state.unlocked advanced
//   6. #btn-next click → next level. L1 also exercises UNDO + canvas-removal + RESET
//      before the real run.
//
// Winning layouts were found OFFLINE by evolutionary search that uses this same engine
// build as the physics oracle (updateMarble min-distance tracking, /tmp harness); they
// are embedded below — the verifier itself only replays them through real input.
//
// Harness notes:
//   - canvas.getBoundingClientRect patched → clientX/Y map 1:1 to canvas pixels
//     (CW=900 CH=720; cellW=86 cellH=82.5 padX=20 padY=30 per resizeCanvas()).
//   - playSound is guarded (if(!audioCtx) + try/catch) so the harness AudioContext
//     stub cannot crash input paths; initAudio() is safe for the same reason.
//   - Virtual clock: the win path's setTimeout(levelComplete,600) needs pump(40)+.

const { bootGame } = require('../_optimization/scripts/harness-lib.js');

// 0-based level index → [{t,r,c}] piece layout (t = piece type id 0..7).
const SOLUTIONS = /*SOLUTIONS*/{"0":[{"t":5,"r":6,"c":1},{"t":6,"r":6,"c":2},{"t":6,"r":6,"c":4},{"t":6,"r":6,"c":5}],"1":[{"t":4,"r":7,"c":6},{"t":2,"r":5,"c":8},{"t":1,"r":6,"c":2}],"2":[{"t":6,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4}],"3":[{"t":6,"r":7,"c":0},{"t":6,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4},{"t":6,"r":7,"c":5}],"4":[{"t":5,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":4,"r":7,"c":3},{"t":4,"r":4,"c":6},{"t":5,"r":2,"c":6}],"5":[{"t":6,"r":7,"c":4},{"t":7,"r":7,"c":5},{"t":7,"r":7,"c":7},{"t":5,"r":4,"c":4}],"6":[{"t":6,"r":7,"c":0},{"t":6,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":4,"r":7,"c":4},{"t":4,"r":4,"c":7},{"t":5,"r":1,"c":7}],"7":[{"t":6,"r":7,"c":0},{"t":6,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4},{"t":6,"r":7,"c":5}],"8":[{"t":5,"r":6,"c":1},{"t":5,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4},{"t":4,"r":7,"c":5},{"t":4,"r":3,"c":7},{"t":6,"r":0,"c":7}],"9":[{"t":6,"r":6,"c":0},{"t":6,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4},{"t":6,"r":7,"c":5},{"t":6,"r":7,"c":6},{"t":6,"r":7,"c":7}],"10":[{"t":1,"r":3,"c":3},{"t":5,"r":0,"c":3},{"t":1,"r":5,"c":5}],"11":[{"t":6,"r":4,"c":0},{"t":4,"r":5,"c":3},{"t":5,"r":3,"c":7},{"t":6,"r":3,"c":8},{"t":6,"r":4,"c":1},{"t":4,"r":6,"c":4}],"12":[],"13":[{"t":4,"r":7,"c":0},{"t":2,"r":7,"c":2},{"t":5,"r":6,"c":3},{"t":7,"r":7,"c":4},{"t":7,"r":6,"c":0},{"t":1,"r":4,"c":6}],"14":[{"t":6,"r":5,"c":2},{"t":0,"r":6,"c":8},{"t":2,"r":1,"c":5}],"15":[{"t":6,"r":7,"c":0},{"t":6,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4},{"t":6,"r":7,"c":5},{"t":6,"r":7,"c":6},{"t":6,"r":7,"c":7}],"16":[{"t":5,"r":6,"c":0},{"t":5,"r":7,"c":1},{"t":6,"r":7,"c":2},{"t":6,"r":7,"c":3},{"t":6,"r":7,"c":4},{"t":4,"r":7,"c":5},{"t":4,"r":4,"c":8},{"t":4,"r":2,"c":6},{"t":4,"r":3,"c":7},{"t":0,"r":0,"c":0}],"17":[{"t":6,"r":2,"c":2},{"t":3,"r":4,"c":5},{"t":7,"r":6,"c":0},{"t":4,"r":6,"c":3},{"t":4,"r":6,"c":8},{"t":6,"r":7,"c":4},{"t":6,"r":7,"c":5},{"t":6,"r":7,"c":6}],"18":[{"t":0,"r":1,"c":5},{"t":1,"r":2,"c":4},{"t":7,"r":7,"c":1},{"t":7,"r":7,"c":3}],"19":[{"t":2,"r":3,"c":7},{"t":0,"r":5,"c":0},{"t":1,"r":5,"c":8},{"t":5,"r":6,"c":8},{"t":6,"r":1,"c":2},{"t":7,"r":7,"c":3},{"t":4,"r":7,"c":4},{"t":4,"r":7,"c":6},{"t":7,"r":7,"c":7},{"t":5,"r":7,"c":5},{"t":6,"r":7,"c":8},{"t":1,"r":5,"c":6}]}/*END*/;

const PAD_X = 20, PAD_Y = 30, CW_ = 86, CH_ = 82.5;
const cx = c => PAD_X + c * CW_ + CW_ / 2;
const cy = r => PAD_Y + r * CH_ + CH_ / 2;

const fails = [];
let pass = 0;
const total = 20;

function ok(cond, name, detail) {
  if (cond) { pass++; } else { fails.push(name + (detail ? ' — ' + detail : '')); }
}

let verdict = 'PASS';
try {
  const g = bootGame('marble-run', {
    inject: {
      anchor: 'window.__marbleRunQA',
      exports: 'window.__mrGeo=function(){return [cellW,cellH,padX,padY];};',
    },
  });
  if (g.loadErrors.length) throw new Error('loadErrors: ' + g.loadErrors.join(' | '));

  const cv = g.els['game-canvas'];
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });

  // Engine geometry sanity (guards against resizeCanvas changes silently breaking click math)
  const geo = g.call('__mrGeo()');
  ok(Math.abs(geo[0] - CW_) < 0.01 && Math.abs(geo[1] - CH_) < 0.01 && geo[2] === PAD_X && geo[3] === PAD_Y,
    'geometry', 'cellW/cellH/padX/padY = ' + JSON.stringify(geo));

  // Real navigation: title → level select
  g.els['btn-start'].dispatch('click', {});
  const grid = g.els['level-grid'];
  ok(grid.children.length === 20 && g.call('__marbleRunQA.state.unlocked') >= 1, 'title→level-select', 'grid children=' + grid.children.length);
  const pal = g.els['palette'];
  const btns = pal.children; // 8 .piece-btn, child index === piece type id

  for (let i = 0; i < total; i++) {
    const sol = SOLUTIONS[i];
    if (!sol) { fails.push('L' + (i + 1) + ' — no solution layout available (search)'); continue; }

   try {
    grid.children[i].dispatch('click', {}); // real listener → startLevel(i)
    ok(g.call('__marbleRunQA.state.currentLevel') === i, 'L' + (i + 1) + ' start');

    let lastSel = -1;
    const placeAll = () => {
      for (const p of sol) {
        if (lastSel !== p.t) { btns[p.t].dispatch('click', {}); lastSel = p.t; }
        cv.dispatch('click', { clientX: cx(p.c), clientY: cy(p.r) });
      }
    };

    // L1 aux coverage: place → UNDO → re-place → canvas-remove one → re-place → RESET → placeAll
    if (i === 0) {
      btns[sol[0].t].dispatch('click', {}); lastSel = sol[0].t;
      cv.dispatch('click', { clientX: cx(sol[0].c), clientY: cy(sol[0].r) });
      ok(g.call('__marbleRunQA.state.piecesUsed') === 1, 'L1 place');
      g.els['btn-undo'].dispatch('click', {});
      ok(g.call('__marbleRunQA.state.piecesUsed') === 0, 'L1 undo');
      cv.dispatch('click', { clientX: cx(sol[0].c), clientY: cy(sol[0].r) }); // re-place
      cv.dispatch('click', { clientX: cx(sol[0].c), clientY: cy(sol[0].r) }); // click existing → remove path
      ok(g.call('__marbleRunQA.state.piecesUsed') === 0, 'L1 canvas-remove');
      g.els['btn-reset'].dispatch('click', {});
      ok(g.call('__marbleRunQA.state.piecesUsed') === 0, 'L1 reset');
    }

    placeAll();
    const used = g.call('__marbleRunQA.state.piecesUsed');
    ok(used === sol.length, 'L' + (i + 1) + ' piecesUsed', used + ' != ' + sol.length + ' (placement rejected?)');

    // Real PLAY → pump until the engine resolves the marble
    g.els['btn-play'].dispatch('click', {});
    ok(g.call('__marbleRunQA.state.simulating') === true, 'L' + (i + 1) + ' sim-start');
    let code = 1; // 1=alive,0=dead-no-won,2=won,-1=no marble
    for (let t = 0; t < 90; t++) {
      g.pump(10);
      code = g.call('__marbleRunQA.state.marble?(__marbleRunQA.state.marble.won?2:(__marbleRunQA.state.marble.alive?1:0)):-1');
      if (code === 2 || code === 0 || code === -1) break;
    }
    ok(code === 2, 'L' + (i + 1) + ' WON via engine physics', 'marble ended code=' + code + ' (0=fell/dead, -1=no marble)');
    if (code !== 2) continue;

    g.pump(45); // setTimeout(levelComplete,600)
    const overlay = g.els['complete-overlay'];
    ok(overlay.classList.contains('active'), 'L' + (i + 1) + ' complete-overlay');
    ok(g.call('__marbleRunQA.state.unlocked') >= i + 2, 'L' + (i + 1) + ' unlocked', 'unlocked=' + g.call('__marbleRunQA.state.unlocked'));
    ok(g.call('localStorage.getItem("marblerun_save")') !== null && g.call('__marbleRunQA.state.levelStars[' + i + '] !== undefined'), 'L' + (i + 1) + ' saved');

    if (i < total - 1) g.els['btn-next'].dispatch('click', {}); // real next-level path
   } catch (e) { fails.push('L' + (i + 1) + ' fatal: ' + e.message); console.error(e.stack); }
  }
} catch (e) {
  verdict = 'FAIL';
  fails.push('fatal: ' + e.message);
  console.error(e.stack);
}

if (fails.length) verdict = 'FAIL';
console.log(JSON.stringify({ pass, fail: fails.length, total, verdict, fails, extra: { game: 'marble-run', engine: 20, input: 'real (palette/canvas/play/next clicks)', engineBugsFixed: [
  'P0 data: L9+L17 start rows 7 → 5 (bottom-row spawn dies on the floor before reaching any placeable cell; lowest possible rail sits 17.3px above a floor-rolling marble vs 14.55px catch radius)',
  'P1 booster glue-death: reflect BOUNCE_DAMP 0.65 applied before the booster 1.6x boost = net 1.04x < friction → marble decayed to vx≈0 and rode the rail forever; type-6 now skips reflect damp',
  'P1 stale win-timer: setTimeout(levelComplete,600) fired on a NEW level if the player left within 600ms → stopSim() killed the fresh run; now guarded by level snapshot',
  'P1 hoverCell undefined crashed the rAF loop on the first game frame (missing init + missing null guard in drawHoverCell)',
] } }));
process.exit(verdict === 'PASS' ? 0 : 1);
