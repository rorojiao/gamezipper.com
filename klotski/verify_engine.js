// klotski verify_engine.js — full end-to-end verification per _optimization/scripts/verifier-spec.md
// Real input only: canvas pointerdown/pointermove drags for every block slide (pointer coords
// aim at the block's PRE-move position — that's where the engine hit-test finds it), button
// clicks for all UI. Win oracle = the engine's OWN checkWin (win modal only when the 2x2
// reaches (r3,c1)). Solutions from klotski/_solutions.json (offline BFS optimum); each is
// re-validated against a faithful canMove replica and cross-checked vs live engine state.
'use strict';
const path = require('path');
const fs = require('fs');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const ROWS = 5, COLS = 4;
function getBlockSize(type) { return type === 2 ? { w: 2, h: 2 } : type === 'v' ? { w: 1, h: 2 } : type === 'h' ? { w: 2, h: 1 } : { w: 1, h: 1 }; }
function canMove(block, dr, dc, allBlocks) {
  const sz = getBlockSize(block.type);
  const nr = block.r + dr, nc = block.c + dc;
  if (nr < 0 || nc < 0 || nr + sz.h > ROWS || nc + sz.w > COLS) return false;
  for (const b of allBlocks) {
    if (b.id === block.id) continue;
    const bz = getBlockSize(b.type);
    if (nr < b.r + bz.h && nr + sz.h > b.r && nc < b.c + bz.w && nc + sz.w > b.c) return false;
  }
  return true;
}

let pass = 0, fail = 0;
const fails = [];
function T(name, cond, detail) {
  if (cond) { pass++; console.log('ok ' + name + (detail ? ' | ' + detail : '')); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' | ' + (detail === undefined ? '' : detail)); }
}
const errs = g => (g.loadErrors || []).concat(g.sandbox.__errors || []);

function main() {
  const sols = JSON.parse(fs.readFileSync(path.join(__dirname, '_solutions.json'), 'utf8'));
  const g = bootGame('klotski');
  const d = g.sandbox.document;
  const cv = d.getElementById('game-canvas');
  T('boot:no-runtime-errors', errs(g).length === 0, errs(g).join(' ;; ').slice(0, 200));
  T('boot:title-screen', d.getElementById('title-screen').style.display !== 'none' && d.getElementById('level-select').style.display === 'none');

  // ---- engine data access + offline solution validation ----
  const nLevels = g.call('LEVELS.length');
  T('data:level-count', nLevels === 33, 'n=' + nLevels);
  const LEVELS = JSON.parse(g.call('JSON.stringify(LEVELS)'));
  let dataOk = true, dataBad = '';
  for (const lv of LEVELS) {
    const occ = new Set();
    let cc = 0;
    for (const b of lv.blocks) {
      const sz = getBlockSize(b.type);
      if (b.r < 0 || b.c < 0 || b.r + sz.h > ROWS || b.c + sz.w > COLS) { dataOk = false; dataBad = lv.name + ' OOB ' + b.id; }
      for (let r = b.r; r < b.r + sz.h; r++) for (let c = b.c; c < b.c + sz.w; c++) {
        if (occ.has(r + ',' + c)) { dataOk = false; dataBad = lv.name + ' overlap ' + b.id; }
        occ.add(r + ',' + c);
      }
      if (b.type === 2) cc++;
    }
    if (cc !== 1) { dataOk = false; dataBad = lv.name + ' cc=' + cc; }
  }
  T('data:all-levels-valid-layout', dataOk, dataBad);
  for (let i = 0; i < nLevels; i++) {
    const blocks = JSON.parse(JSON.stringify(LEVELS[i].blocks));
    let ok = true, why = '';
    for (const m of sols[i]) {
      const b = blocks.find(x => x.id === m.id);
      if (!b || !canMove(b, m.dr, m.dc, blocks)) { ok = false; why = 'illegal move ' + JSON.stringify(m); break; }
      b.r += m.dr; b.c += m.dc;
    }
    const ccb = blocks.find(x => x.type === 2);
    if (ok && !(ccb.r === 3 && ccb.c === 1)) { ok = false; why = 'end cc=(' + ccb.r + ',' + ccb.c + ')'; }
    T('data:sol-L' + (i + 1) + '-replays-legal', ok, why || (sols[i].length + ' moves'));
  }

  // ---- level select gating ----
  const findBtn = snip => d.querySelectorAll('button').find(b => b.onclick && String(b.onclick).includes(snip));
  findBtn('showLevelSelect()').click(); // title Play
  T('nav:level-select', d.getElementById('level-select').style.display !== 'none' && d.getElementById('title-screen').style.display === 'none');
  const grid = d.getElementById('level-grid');
  const lastKids = () => grid.children.slice(-nLevels); // innerHTML='' keeps stub children; last batch = current render
  T('grid:33-buttons', lastKids().length === 33, 'n=' + lastKids().length);
  T('grid:L1-unlocked', !lastKids()[0].classList.contains('locked'));
  T('grid:L2-locked', lastKids()[1].classList.contains('locked'));
  T('grid:L33-locked', lastKids()[32].classList.contains('locked'));
  T('grid:none-completed', lastKids().every(b => !b.classList.contains('completed')));

  // ---- L1: half solution -> undo oracle -> finish ----
  lastKids()[0].click();
  T('nav:game-screen', d.getElementById('game-screen').style.display !== 'none');
  T('hud:level-1-name', d.getElementById('level-name').textContent === 'Level 1: 横刀立马', d.getElementById('level-name').textContent);
  T('hud:moves-0', String(d.getElementById('move-count').textContent) === '0', JSON.stringify(d.getElementById('move-count').textContent));
  g.pump(60 * 3);
  T('timer:ticks', d.getElementById('timer').textContent === '0:03', d.getElementById('timer').textContent);

  const engineBlocks = () => JSON.parse(g.call('JSON.stringify(state.blocks)'));
  const sameBoard = (a, b) => a.length === b.length && a.every((x, i) => x.id === b[i].id && x.r === b[i].r && x.c === b[i].c);
  // drag one block: pointer events at the block's PRE-move center, offset by (dc,dr)*60px
  function drive(rep, m, canvas) {
    const b = rep.find(x => x.id === m.id);
    const sz = getBlockSize(b.type);
    const cx = (b.c + sz.w / 2) * 100, cy = (b.r + sz.h / 2) * 100;
    b.r += m.dr; b.c += m.dc;
    canvas.dispatch('pointerdown', { clientX: cx, clientY: cy });
    canvas.dispatch('pointermove', { clientX: cx + m.dc * 60, clientY: cy + m.dr * 60 });
    canvas.dispatch('pointerup', {});
  }
  function replay(idx, canvas, blocksFn) { // drives sols[idx]; every move cross-checked vs engine
    const rep = JSON.parse(JSON.stringify(LEVELS[idx].blocks));
    for (let k = 0; k < sols[idx].length; k++) {
      const m = sols[idx][k];
      const b = rep.find(x => x.id === m.id);
      if (!canMove(b, m.dr, m.dc, rep)) return { ok: false, why: 'replica illegal @' + k };
      drive(rep, m, canvas);
      const eng = blocksFn();
      if (!sameBoard(rep, eng)) return { ok: false, why: 'engine desync @move ' + k + ' rep=' + JSON.stringify(rep.map(x => x.id + x.r + ',' + x.c)) + ' eng=' + JSON.stringify(eng.map(x => x.id + x.r + ',' + x.c)) };
    }
    return { ok: true, moves: sols[idx].length };
  }

  const half = Math.floor(sols[0].length / 2);
  const rep1 = JSON.parse(JSON.stringify(LEVELS[0].blocks));
  for (let k = 0; k < half; k++) drive(rep1, sols[0][k], cv);
  T('input:half-solution-moves', +d.getElementById('move-count').textContent === half, String(d.getElementById('move-count').textContent));
  T('input:no-desync-half', sameBoard(rep1, engineBlocks()));
  T('no-win-at-half', d.getElementById('win-modal').style.display !== 'flex', JSON.stringify(d.getElementById('win-modal').style.display)); // unshown modal: undefined (inline style attr unparsed) or 'none'
  findBtn('undo()').click();
  findBtn('undo()').click();
  T('undo:counter', +d.getElementById('move-count').textContent === half - 2, String(d.getElementById('move-count').textContent));
  const afterUndo = engineBlocks();
  const expectUndo = JSON.parse(JSON.stringify(LEVELS[0].blocks));
  for (let k = 0; k < half - 2; k++) { const m = sols[0][k]; const b = expectUndo.find(x => x.id === m.id); b.r += m.dr; b.c += m.dc; }
  T('undo:board-rolls-back', sameBoard(expectUndo, afterUndo));
  // redo the 2 undone moves + drive to the end
  for (let k = half - 2; k < sols[0].length; k++) {
    const m = sols[0][k];
    const b = afterUndo.find(x => x.id === m.id); // engine-current replica
    if (k < half) { /* redo: afterUndo tracks engine */ }
    drive(afterUndo, m, cv);
  }
  T('win:L1-modal', d.getElementById('win-modal').style.display === 'flex', JSON.stringify(d.getElementById('win-modal').style.display));
  T('win:L1-moves', +d.getElementById('win-moves').textContent === sols[0].length, String(d.getElementById('win-moves').textContent));
  T('win:L1-3stars', d.getElementById('win-stars').textContent === '★★★', d.getElementById('win-stars').textContent + ' (par ' + LEVELS[0].par + ', optimal ' + sols[0].length + ')');
  const save1 = JSON.parse(g.ls._m['klotski_save'] || '{}');
  T('save:L1-unlocked-2', save1.unlocked === 2, JSON.stringify(save1));
  T('save:L1-stars-3', Array.isArray(save1.stars) && save1.stars[0] === 3, JSON.stringify(save1.stars));
  const timerAtWin = d.getElementById('timer').textContent;
  g.pump(120);
  T('win:timer-frozen', d.getElementById('timer').textContent === timerAtWin, timerAtWin + ' -> ' + d.getElementById('timer').textContent);

  // ---- hint: engine-solver move ----
  findBtn('replayLevel()').click();
  T('replay:reset-moves-0', String(d.getElementById('move-count').textContent) === '0' && d.getElementById('win-modal').style.display !== 'flex');
  const beforeHint = engineBlocks();
  const hintsBefore = g.call('state.hints');
  findBtn('hint()').click();
  const afterHint = engineBlocks();
  const hi = afterHint.findIndex((b, i) => b.r !== beforeHint[i].r || b.c !== beforeHint[i].c);
  T('hint:makes-legal-move', hi >= 0 && Math.abs(afterHint[hi].r - beforeHint[hi].r) + Math.abs(afterHint[hi].c - beforeHint[hi].c) === 1, hi >= 0 ? afterHint[hi].id : 'no move');
  T('hint:counter+1', String(d.getElementById('move-count').textContent) === '1', String(d.getElementById('move-count').textContent));
  T('hint:decremented', g.call('state.hints') === hintsBefore - 1, hintsBefore + '->' + g.call('state.hints'));
  findBtn('hint()').click(); findBtn('hint()').click();
  const spent = String(d.getElementById('move-count').textContent);
  findBtn('hint()').click(); // 4th: exhausted -> no move
  T('hint:exhausted-no-move', String(d.getElementById('move-count').textContent) === spent, spent + ' -> ' + String(d.getElementById('move-count').textContent));

  // ---- reset oracle ----
  findBtn('resetLevel()').click();
  T('reset:moves-0', String(d.getElementById('move-count').textContent) === '0');
  T('reset:board-start', sameBoard(LEVELS[0].blocks.map(b => ({ ...b })), engineBlocks()));
  T('reset:undo-stack-cleared', g.call('state.undoStack.length') === 0);

  // ---- full win chain L1..L33 via real input + Next Level ----
  let chainOk = true, chainWhy = '';
  for (let idx = 0; idx < nLevels && chainOk; idx++) {
    const res = replay(idx, cv, engineBlocks);
    if (!res.ok) { chainOk = false; chainWhy = res.why; break; }
    if (d.getElementById('win-modal').style.display !== 'flex') { chainOk = false; chainWhy = 'L' + (idx + 1) + ' no win modal'; break; }
    const mv = +d.getElementById('win-moves').textContent;
    if (mv !== sols[idx].length) { chainOk = false; chainWhy = 'L' + (idx + 1) + ' moves ' + mv; break; }
    const sv = JSON.parse(g.ls._m['klotski_save'] || '{}');
    if (sv.unlocked !== Math.min(nLevels, idx + 2)) { chainOk = false; chainWhy = 'L' + (idx + 1) + ' unlocked=' + sv.unlocked; break; }
    if (!(Array.isArray(sv.stars) && sv.stars[idx] >= 1)) { chainOk = false; chainWhy = 'L' + (idx + 1) + ' stars=' + JSON.stringify(sv.stars); break; }
    pass++; console.log('ok chain:L' + (idx + 1) + ' | ' + mv + ' moves, saved');
    findBtn('nextLevel()').click();
    const onSelect = d.getElementById('level-select').style.display !== 'none';
    if (idx === nLevels - 1) {
      if (!onSelect) { chainOk = false; chainWhy = 'L33 next did not go to select'; }
    } else if (onSelect || d.getElementById('level-name').textContent.indexOf('Level ' + (idx + 2) + ':') !== 0) {
      chainOk = false; chainWhy = 'L' + (idx + 1) + ' next-nav failed: ' + d.getElementById('level-name').textContent;
    }
  }
  T('chain:L1-L33-real-input', chainOk, chainWhy);
  const kids = lastKids();
  T('chain:all-33-completed', kids.every(b => b.classList.contains('completed')));
  T('chain:all-33-unlocked', kids.every(b => !b.classList.contains('locked')));
  T('chain:save-unlocked-33', JSON.parse(g.ls._m['klotski_save']).unlocked === 33);
  T('chain:no-errors', errs(g).length === 0, errs(g).join(' ;; ').slice(0, 200));

  // ---- boot 2: persistence ----
  const g2 = bootGame('klotski', { seedLS: Object.assign({}, g.ls._m) });
  const d2 = g2.sandbox.document;
  T('boot2:no-errors', errs(g2).length === 0, errs(g2).join(' ;; ').slice(0, 200));
  T('boot2:progress-loaded', g2.call('state.unlocked') === 33 && g2.call('state.stars[0]') === 3);
  const fb2 = snip => d2.querySelectorAll('button').find(b => b.onclick && String(b.onclick).includes(snip));
  fb2('showLevelSelect()').click();
  const kids2 = d2.getElementById('level-grid').children.slice(-nLevels);
  T('boot2:grid-all-completed', kids2.every(b => b.classList.contains('completed')));
  kids2[32].click(); // L33 directly
  T('boot2:L33-loads', d2.getElementById('level-name').textContent.indexOf('Level 33:') === 0, d2.getElementById('level-name').textContent);
  fb2('showLevelSelect()').click();
  d2.getElementById('level-grid').children.slice(-nLevels)[0].click(); // L1 replay
  const cv2 = d2.getElementById('game-canvas');
  const r2 = replay(0, cv2, () => JSON.parse(g2.call('JSON.stringify(state.blocks)')));
  T('boot2:L1-replay-win', r2.ok && d2.getElementById('win-modal').style.display === 'flex', r2.ok ? '' : r2.why);
  const sv2 = JSON.parse(g2.ls._m['klotski_save'] || '{}');
  T('boot2:stars-kept-3', Array.isArray(sv2.stars) && sv2.stars[0] === 3, JSON.stringify(sv2.stars));

  // ---- settings: toggles + reset progress ----
  fb2('showSettings()').click();
  const sT = d2.getElementById('sound-toggle'), mT = d2.getElementById('music-toggle');
  T('settings:overlay', d2.getElementById('settings-modal').style.display === 'flex');
  T('settings:sound-on', sT.classList.contains('on'));
  T('settings:music-off', !mT.classList.contains('on'));
  sT.click(); mT.click();
  T('settings:sound-toggled-off', !sT.classList.contains('on'));
  T('settings:music-toggled-on', mT.classList.contains('on'));
  const svT = JSON.parse(g2.ls._m['klotski_save'] || '{}');
  T('settings:save-reflects-toggles', svT.soundOn === false && svT.musicOn === true, JSON.stringify(svT));
  fb2('resetProgress()').click(); // confirm() stub returns true
  const svR = JSON.parse(g2.ls._m['klotski_save'] || '{}');
  T('settings:reset-progress', g2.call('state.unlocked') === 1 && Array.isArray(svR.stars) && svR.stars.every(x => x === 0), JSON.stringify(svR));
  fb2('closeSettings()').click();
  const kids3 = d2.getElementById('level-grid').children.slice(-nLevels);
  T('settings:grid-relocked', kids3[1].classList.contains('locked') && !kids3[0].classList.contains('completed'));
  g2.sandbox.dispatchEvent({ type: 'beforeunload' });
  T('boot2:beforeunload-no-crash', errs(g2).length === 0, errs(g2).join(' ;; ').slice(0, 200));
  T('final:no-runtime-errors', errs(g).length === 0 && errs(g2).length === 0);

  console.log(JSON.stringify({
    pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 20),
    extra: {
      levels: nLevels,
      engineBugsFixed: [
        'P0 win condition cc@(1,1)=board CENTER -> (3,1) bottom-center exit per FINAL_REPORT.md + page copy/FAQ (14/33 levels started pre-won, rest solvable in <=2 moves)',
        'P0 level data: 29/33 levels had OVERLAPPING blocks; L11/L13/L22/L27(+L21) filled 19-20/20 cells (<=1 empty: 2x2 can never move) -> all repaired, BFS-verified solvable to (3,1), names/tiers kept',
        'P2 [0]*30 (=== 0 in JS, no array-repeat) -> state.stars never persisted; now Array(LEVELS.length).fill(0)',
        'P2 hint bfs step cap 100 < par 200 -> hint silently dead on most levels; raised to 400',
        'P2 unlock/next hardcoded 30 vs 33 levels -> L31-33 permanently locked; now LEVELS.length',
        'P2 par values (multi-square-slide counts) below single-slide optimum -> 3 stars unattainable; pars raised to BFS optimum where needed'
      ]
    }
  }));
  process.exit(fail === 0 ? 0 : 1);
}

try { main(); } catch (e) {
  console.log('FAIL harness-exception | ' + (e && e.stack || e));
  console.log(JSON.stringify({ pass, fail: fail + 1, total: pass + fail + 1, verdict: 'FAIL', fails: fails.concat(['harness-exception: ' + String(e && e.message || e)]).slice(0, 20), extra: {} }));
  process.exit(1);
}
