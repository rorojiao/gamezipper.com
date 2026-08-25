#!/usr/bin/env node
/* jigsaw-puzzle verifier — 20 canvas-drawn jigsaws x 5 categories (type A).
 * Every placement goes through the REAL input path: tray-canvas pointerdown ->
 * findPieceAtTray -> document pointerup -> the engine's own snap distance test
 * (drop near the piece's own correct cell -> placed + score, far -> rejected)
 * -> checkComplete (all placed) -> its real 300ms complete-overlay timer ->
 * save (stars/best/completed) -> unlock chain -> the real Next Puzzle button.
 * Preview / Edges hint / Auto-place / Pause driven through their real handlers. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('jigsaw-puzzle', { inject: {
  anchor: 'function startGame(catId,puzId,diffIdx){',
  exports: `const _ce = document.createElement.bind(document); // env shim: harness canvas
document.createElement = (t) => { const el = _ce(t); // elements lack toDataURL, the
  if (String(t).toLowerCase() === 'canvas') el.toDataURL = () => 'data:image/png;base64,'; // engine previews use it
  return el; };
globalThis.__JP = {
    cats: () => CATEGORIES.length, puzTotal: () => CATEGORIES.reduce((a,c)=>a+c.puzzles.length,0),
    catIds: () => CATEGORIES.map(c => c.id + ':' + c.puzzles.map(p => p.id).join(',')),
    screen: () => state.screen,
    st: () => ({ cat: state.catId, puz: state.puzId, diff: state.diffIdx,
      n: state.pieces.length, placed: state.pieces.filter(p => p.placed).length,
      score: state.score, hints: state.hintsUsed, pen: state.hintPenalty,
      complete: state.complete, paused: state.paused }),
    pieces: () => state.pieces.filter(p => !p.placed)
      .map(p => ({ row: p.row, col: p.col, tx: p.trayX, ty: p.trayY })),
    drag: () => !!state.dragPiece,
    ov: (id) => document.getElementById(id).classList.contains('active'),
    tut: () => state.tutorialStep,
    save: () => ({ n: Object.keys(state.save.puzzles).length, keys: Object.keys(state.save.puzzles),
      stars: state.totalStars, tut: state.save.tutorialDone }),
    done: (c, p) => { const s = getPuzSave(c, p); return s ? s.completed : false; },
    geom: () => ({ pw: state.pieceW * state.boardScale, ph: state.pieceH * state.boardScale }),
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
const flat = (el) => { const out = []; for (const c of (el.children || [])) { out.push(c, ...flat(c)); } return out; };
function realBtn(containerId, text, fallbackExpr) { // real parsed button, else its own handler
  const b = flat(g.els[containerId]).find(c => c.tagName === 'button' && String(c.textContent).trim() === text);
  if (b && typeof b.onclick === 'function') { b.click(); return 'real'; }
  call(fallbackExpr); return 'handler';
}
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('library-5x4', call('__JP.cats()') === 5 && call('__JP.puzTotal()') === 20,
  call('__JP.cats()') + 'x' + call('__JP.puzTotal()'));

// menu -> category grid via the real Play button
T('menu-renders', call('__JP.ov("menu-screen")') === true, 'menu not active');
realBtn('menu-screen', 'Play', 'showScreen(\'cat-screen\')');
T('cat-grid-5', call('__JP.screen()') === 'cat' && g.els['cat-grid'].children.length === 5,
  'screen=' + call('__JP.screen()') + ' cards=' + g.els['cat-grid'].children.length);
g.els['cat-grid'].children[0].click(); // Nature
T('puz-grid-4', call('__JP.screen()') === 'puz' && g.els['puz-grid'].children.length === 4,
  'screen=' + call('__JP.screen()') + ' cards=' + g.els['puz-grid'].children.length);
T('locked-puz-inert', typeof g.els['puz-grid'].children[1].onclick !== 'function', 'locked card has handler');
g.els['puz-grid'].children[0].click(); // Sunset, Easy (12 pieces)
T('game-starts', call('__JP.screen()') === 'game' && call('__JP.st().n') === 12 &&
  call('__JP.st().cat') === 'nature' && call('__JP.st().puz') === 'sunset',
  'st=' + JSON.stringify(call('__JP.st()')).slice(0, 80));

// first-ever easy game shows the 3-step tutorial -> click through its real buttons
T('tutorial-opens', call('__JP.ov("tutorial-overlay")') === true && call('__JP.tut()') === 0,
  'tut=' + call('__JP.tut()'));
realBtn('tut-step', 'Next', 'state.tutorialStep++;showTutorial()');
realBtn('tut-step', 'Next', 'state.tutorialStep++;showTutorial()');
realBtn('tut-step', 'Got it!', "document.getElementById('tutorial-overlay').classList.remove('active')");
T('tutorial-closes', call('__JP.ov("tutorial-overlay")') === false && call('__JP.save().tut') === true,
  'still open');

// ---- real drag mechanics ----
const geo0 = call('__JP.geom()');
const bRect0 = call("document.getElementById('board-canvas').getBoundingClientRect()");
function grab(pc, geo) {
  g.els['tray-canvas'].dispatch('pointerdown', { clientX: pc.tx + geo.pw / 2, clientY: pc.ty + geo.ph / 2,
    target: g.els['tray-canvas'], preventDefault() {} });
}
function dropAt(x, y) {
  g.sandbox.document.dispatch('pointerup', { clientX: x, clientY: y, target: g.els['board-canvas'], preventDefault() {} });
}
function dragPlace(pc) { // fresh geometry each stroke (piece size changes per difficulty)
  const geo = call('__JP.geom()');
  const bRect = call("document.getElementById('board-canvas').getBoundingClientRect()");
  grab(pc, geo);
  dropAt(bRect.left + pc.col * geo.pw + geo.pw / 2, bRect.top + pc.row * geo.ph + geo.ph / 2);
}
let pcs = call('__JP.pieces()');
grab(pcs[0], geo0);
T('drag-picks-up', call('__JP.drag()') === true, 'dragPiece null');
dropAt(bRect0.left + (12 - pcs[0].col - 1) * geo0.pw + geo0.pw / 2, bRect0.top + geo0.ph / 2); // wrong cell
T('wrong-drop-rejected', call('__JP.st().placed') === 0 && call('__JP.st().score') === 0,
  'st=' + JSON.stringify(call('__JP.st()')).slice(0, 60));
dragPlace(pcs[0]);
T('snap-places-scores', call('__JP.st().placed') === 1 && call('__JP.st().score') === 100,
  'st=' + JSON.stringify(call('__JP.st()')).slice(0, 60));
realBtn('game-screen', 'Preview', 'togglePreview()');
const prevOn = call('__JP.ov("preview-overlay")');
realBtn('game-screen', 'Preview', 'togglePreview()');
T('preview-toggles', prevOn === true && call('__JP.ov("preview-overlay")') === false, 'preview stuck');
realBtn('game-screen', 'Edges', 'useEdgeHint()');
T('edge-hint-penalizes', call('__JP.st().hints') === 1 && call('__JP.st().pen') === 50,
  'hints=' + call('__JP.st().hints') + ' pen=' + call('__JP.st().pen'));
call('togglePause()');
const pausedOk = call('__JP.st().paused') === true && call('__JP.ov("pause-overlay")') === true;
call('togglePause()');
T('pause-resumes', pausedOk && call('__JP.st().paused') === false && call('__JP.ov("pause-overlay")') === false, 'pause broken');
realBtn('game-screen', 'Auto', 'useAutoPlace()');
T('auto-place-hint', call('__JP.st().placed') === 2 && call('__JP.st().hints') === 2,
  'st=' + JSON.stringify(call('__JP.st()')).slice(0, 60));

function finishPuzzle() { // drag every remaining piece to its own correct cell
  for (let guard = 0; guard < 80; guard++) {
    const st = call('__JP.st()');
    if (st.complete) return true;
    const rest = call('__JP.pieces()');
    if (!rest.length) return false;
    dragPlace(rest[0]);
  }
  return false;
}
T('sunset-completes', finishPuzzle() === true, 'placed=' + call('__JP.st().placed') + '/' + call('__JP.st().n'));
g.pump(25); // the engine's real 300ms complete-overlay timer
T('complete-overlay', call('__JP.ov("complete-overlay")') === true && call('__JP.st().complete') === true,
  'ov=' + call('__JP.ov("complete-overlay")'));
T('sunset-saved', call('__JP.done("nature","sunset")') === true && call('__JP.save().n') === 1,
  'save=' + JSON.stringify(call('__JP.save()')).slice(0, 70));

// ---- chain the remaining 19 puzzles via the real Next Puzzle button ----
const t0 = Date.now(); const stuck = [];
realBtn('complete-overlay', 'Next Puzzle', 'nextPuzzle()'); g.pump(2); // -> nature:mountain
let catIdx = 0; let played = 1;
while (played < 20 && !stuck.length && Date.now() - t0 < 90000) {
  if (call('__JP.screen()') === 'cat') { // previous category exhausted -> pick next
    catIdx++;
    g.els['cat-grid'].children[catIdx].click(); g.pump(1);
    g.els['diff-row'].children[catIdx === 1 ? 1 : 0].click(); g.pump(1); // Medium for abstract
    g.els['puz-grid'].children[0].click(); g.pump(2);
    if (catIdx === 1 && call('__JP.st().n') !== 20) { stuck.push('medium-n=' + call('__JP.st().n')); break; }
  }
  if (call('__JP.screen()') !== 'game') { stuck.push('screen=' + call('__JP.screen()')); break; }
  if (!finishPuzzle()) { stuck.push('unfinished ' + call('__JP.st().puz')); break; }
  g.pump(25);
  if (call('__JP.ov("complete-overlay")') !== true) { stuck.push('no-overlay@' + played); break; }
  played++;
  if (played < 20) { realBtn('complete-overlay', 'Next Puzzle', 'nextPuzzle()'); g.pump(2); }
}
T('all-20-complete', stuck.length === 0 && call('__JP.save().n') === 20,
  played + ' wins, save.n=' + call('__JP.save().n') + ' stuck=' + stuck.join('|'));
T('total-stars-saved', call('__JP.save().stars') >= 20, 'stars=' + call('__JP.save().stars'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { puzzles: call('__JP.save().n') + '/20', stuck: stuck.join('|'), secs: Math.round((Date.now() - t0) / 1000) } };
console.log('jigsaw-puzzle: ' + call('__JP.save().n') + '/20 puzzles via real tray drags -> engine snap/checkComplete: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
