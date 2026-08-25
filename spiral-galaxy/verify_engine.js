'use strict';
/* spiral-galaxy verify_engine.js — full E2E coverage via real canvas pointer events.
 *
 * Engine facts (index.html IIFE — internals unreachable, so ALL driving is real DOM:
 * board pointerdown at cell-center pixel coords + button clicks; asserts via HUD text,
 * toasts on body, win-overlay innerHTML and localStorage saves).
 *  - LEVELS: 29 {rows,cols,dots[[r,c]],par(seconds)}. Dots pre-seeded as region centers.
 *  - Tap dot = select/deselect; tap empty cell = add cell + 180deg mirror pair (about the
 *    selected dot); tap own cell = erase pair; tap foreign cell = toast, no change.
 *  - Win: all cells covered + every region connected + contains its dot (symmetry is
 *    construction-guaranteed: every mutation adds/removes mirror pairs).
 *  - Stars: 3 iff hintsUsed==0 && secs<=par; 2 iff hintsUsed==1 && secs<=par; else 1.
 *  - Hint (max 3): fills first candidate pair — first dot in index order, first owned
 *    cell in row-major scan, first empty neighbor in [down,up,right,left] order whose
 *    mirror is empty and not the cell itself. Undo does NOT refund hints.
 * Offline: mirror-constrained DFS solves every level (border dots pin to their border
 * line, pruning hard); the exact hint algorithm is transcribed to predict each hint.
 */
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0; const fails = [];
function ck(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + String(detail).slice(0, 160) : '')); }
}

/* ---- shipped level data ---- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const LEVELS = JSON.parse(/var LEVELS = (\[.*\]);/.exec(html)[1]);

/* ---- offline solver: symmetric connected partition (mirror-pair DFS) ---- */
function solve(L) {
  const R = L.rows, C = L.cols, dots = L.dots;
  const owner = []; for (let r = 0; r < R; r++) owner.push(new Array(C).fill(-1));
  dots.forEach((d, i) => { owner[d[0]][d[1]] = i; });
  const inb = (r, c) => r >= 0 && c >= 0 && r < R && c < C;
  const cells = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) cells.push([r, c]);
  function connected() {
    for (let d = 0; d < dots.length; d++) {
      const members = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (owner[r][c] === d) members.push([r, c]);
      if (!members.length) return false;
      const inSet = new Set(members.map(x => x[0] + ',' + x[1]));
      const seen = new Set([dots[d][0] + ',' + dots[d][1]]); const st = [[dots[d][0], dots[d][1]]];
      while (st.length) { const [r, c] = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const k = (r + dr) + ',' + (c + dc); if (inSet.has(k) && !seen.has(k)) { seen.add(k); st.push([r + dr, c + dc]); } }); }
      if (seen.size !== members.length) return false;
    }
    return true;
  }
  function dfs() {
    let fr = -1, fc = -1;
    for (const [r, c] of cells) { if (owner[r][c] < 0) { fr = r; fc = c; break; } }
    if (fr < 0) return connected();
    for (let d = 0; d < dots.length; d++) {
      const mr = 2 * dots[d][0] - fr, mc = 2 * dots[d][1] - fc;
      if (!inb(mr, mc) || owner[mr][mc] >= 0) continue;
      owner[fr][fc] = d; owner[mr][mc] = d;
      if (dfs()) return true;
      owner[fr][fc] = -1; owner[mr][mc] = -1;
    }
    return false;
  }
  if (!dfs()) return null;
  /* tap plan: per dot, one tap per mirror pair (either cell) */
  const plan = [];
  for (let d = 0; d < dots.length; d++) {
    const done = new Set();
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      if (owner[r][c] !== d || (r === dots[d][0] && c === dots[d][1]) || done.has(r + ',' + c)) continue;
      const mr = 2 * dots[d][0] - r, mc = 2 * dots[d][1] - c;
      done.add(r + ',' + c); done.add(mr + ',' + mc);
      plan.push({ d, cell: [r, c], mirror: [mr, mc] });
    }
  }
  return { owner, plan };
}
const SOL = LEVELS.map(solve);
ck('o-solvable-29', SOL.every(Boolean));
for (let i = 0; i < LEVELS.length; i++) {
  if (!SOL[i]) continue;
  const L = LEVELS[i], S = SOL[i];
  let cov = 0; const counts = new Array(L.dots.length).fill(0);
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) { const o = S.owner[r][c]; if (o >= 0) { cov++; counts[o]++; } }
  ck('o-cover-' + L.id, cov === L.rows * L.cols, cov + '/' + L.rows * L.cols);
  ck('o-odd-regions-' + L.id, counts.every(n => n % 2 === 1), counts.join(','));
  ck('o-plan-count-' + L.id, S.plan.length === (L.rows * L.cols - L.dots.length) / 2);
}

/* ---- exact hint() replica ---- */
function hintPick(L, owner) {
  const R = L.rows, C = L.cols, dots = L.dots;
  const inb = (r, c) => r >= 0 && c >= 0 && r < R && c < C;
  for (let d = 0; d < dots.length; d++) {
    const owned = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (owner[r][c] === d) owned.push([r, c]);
    if (!owned.length) continue;
    for (let ci = 0; ci < owned.length; ci++) {
      const rc = owned[ci];
      const neigh = [[rc[0] + 1, rc[1]], [rc[0] - 1, rc[1]], [rc[0], rc[1] + 1], [rc[0], rc[1] - 1]];
      for (let ni = 0; ni < neigh.length; ni++) {
        const nr = neigh[ni][0], nc = neigh[ni][1];
        if (!inb(nr, nc) || owner[nr][nc] >= 0) continue;
        const m = [2 * dots[d][0] - nr, 2 * dots[d][1] - nc];
        if (!inb(m[0], m[1]) || owner[m[0]][m[1]] >= 0) continue;
        if (m[0] === nr && m[1] === nc) continue;
        return { d, cell: [nr, nc], mirror: m };
      }
    }
  }
  return null;
}
function mirrorOwner(L) {
  const owner = []; for (let r = 0; r < L.rows; r++) owner.push(new Array(L.cols).fill(-1));
  L.dots.forEach((d, i) => { owner[d[0]][d[1]] = i; });
  return owner;
}

/* ---- live helpers ---- */
function tapCell(ga, L, r, c) {
  const board = ga.els.board;
  const cell = board.width / Math.max(L.rows, L.cols);
  ga.els.board.dispatch('pointerdown', { clientX: c * cell + cell / 2, clientY: r * cell + cell / 2 });
  ga.pump(1);
}
function coveredOf(ga) { return +ga.els.hudCovered.textContent; }
function hintsOf(ga) { return +ga.els.hudHints.textContent; }
function brightStars(html) { return (String(html).split('<span')[0].match(/&#9733;/g) || []).length; }
function toastOnBody(ga) {
  return (ga.sandbox.document.body.children || []).some(c => String(c.className || '') === 'toast');
}
function toastText(ga) {
  const all = (ga.sandbox.document.body.children || []).filter(c => String(c.className || '') === 'toast');
  const t = all[all.length - 1]; // newest toast (querySelector('.toast') removal is a harness no-op -> they stack)
  return t ? String(t.innerHTML) : null;
}
function saveOf(ga) { const s = ga.ls.getItem('spiralGalaxy_v1'); return s ? JSON.parse(s) : null; }

/* drive a full solution; ownerSim tracks expected owner for parity/hint prediction.
 * preFn hook runs before the plan (used for hint scenarios). Returns {win, mismatches} */
function playSolution(ga, li, ownerSim, preFn, tag) {
  const L = LEVELS[li], S = SOL[li];
  let sel = -1, mismatch = false;
  const checkCov = () => {
    let n = 0; for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) if (ownerSim[r][c] >= 0) n++;
    if (coveredOf(ga) !== n) { if (!mismatch) { ck(tag + '-parity', false, 'covered ' + coveredOf(ga) + ' expect ' + n); mismatch = true; } }
  };
  const select = (d) => { if (sel !== d) { tapCell(ga, L, L.dots[d][0], L.dots[d][1]); sel = d; } };
  if (preFn) preFn(select, () => checkCov());
  let used = new Set();
  for (const p of S.plan) {
    const key = p.cell[0] + ',' + p.cell[1];
    if (used.has(key)) continue;
    used.add(key);
    if (ownerSim[p.cell[0]][p.cell[1]] >= 0) continue; // already filled (e.g. by a hint we kept)
    select(p.d);
    tapCell(ga, L, p.cell[0], p.cell[1]);
    ownerSim[p.cell[0]][p.cell[1]] = p.d; ownerSim[p.mirror[0]][p.mirror[1]] = p.d;
    checkCov();
  }
  if (!mismatch) ck(tag + '-parity', true);
  ga.pump(2);
  return { mismatch };
}

/* ============ Boot A: fresh — tutorial, micro-interactions, full 29-level sweep ============ */
(function bootA() {
  const ga = bootGame('spiral-galaxy', {});
  ga.pump(3);
  ck('a-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ck('a-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|'));

  // tutorial overlay on first visit
  ck('a-tut-shown', !ga.els.tutOverlay.classList.contains('hidden'));
  ga.els.btnTutStart.dispatch('click', {}); ga.pump(1);
  ck('a-tut-start-hides', ga.els.tutOverlay.classList.contains('hidden'));
  ck('a-tut-seen-ls', ga.ls.getItem('spiralGalaxy_tutSeen') === '1');

  const L1 = LEVELS[0];
  ck('a-hud-init', String(ga.els.hudLevel.textContent) === '1' && ga.els.hudTier.textContent === 'Beginner' &&
    String(ga.els.hudTotal.textContent) === '25' && coveredOf(ga) === 3 && hintsOf(ga) === 3 && ga.els.hudTime.textContent === '0:00');

  // tap with no selection -> toast, no change
  tapCell(ga, L1, 0, 1);
  ck('a-nosel-toast', toastText(ga) === 'Select a glowing dot first', toastText(ga));
  ck('a-nosel-covered', coveredOf(ga) === 3);

  // select dot 0 (4,4); off-grid mirror error
  tapCell(ga, L1, 4, 4);
  ck('a-sel-info', ga.els.selInfo.innerHTML.indexOf('Galaxy 1 selected') === 0, ga.els.selInfo.innerHTML);
  tapCell(ga, L1, 0, 4); // mirror (8,4) off-grid
  ck('a-offgrid-toast', toastText(ga) === 'Mirror cell is off-grid', toastText(ga));
  ck('a-offgrid-covered', coveredOf(ga) === 3);

  // select dot 1 (2,2), add pair, deselect via re-tap, reselect, erase pair
  tapCell(ga, L1, 2, 2);
  tapCell(ga, L1, 1, 2); // mirror (3,2)
  ck('a-add-pair', coveredOf(ga) === 5);
  tapCell(ga, L1, 2, 2); // deselect
  ck('a-desel-info', String(ga.els.selInfo.textContent).indexOf('Tap a glowing dot') === 0, String(ga.els.selInfo.textContent));
  tapCell(ga, L1, 2, 2); // reselect
  tapCell(ga, L1, 1, 2); // erase pair
  ck('a-erase-pair', coveredOf(ga) === 3);
  ga.els.btnUndo.dispatch('click', {}); ga.pump(1); // undo the erase -> pair back
  ck('a-undo-erase', coveredOf(ga) === 5);
  ga.els.btnUndo.dispatch('click', {}); ga.pump(1); // undo the add
  ck('a-undo-add', coveredOf(ga) === 3);
  ga.els.btnUndo.dispatch('click', {}); ga.pump(1); // empty history no-op
  ck('a-undo-empty', coveredOf(ga) === 3);

  // foreign-cell toast: re-add d1 pair, then select d0 and tap d1's cell
  tapCell(ga, L1, 1, 2);
  ck('a-readd', coveredOf(ga) === 5);
  tapCell(ga, L1, 4, 4); // select d0
  tapCell(ga, L1, 1, 2); // belongs to galaxy 2
  ck('a-foreign-toast', toastText(ga) === 'That cell belongs to galaxy 2', toastText(ga));
  ck('a-foreign-covered', coveredOf(ga) === 5);

  // check button: 20 cells left
  ga.els.btnCheck.dispatch('click', {}); ga.pump(1);
  ck('a-check-toast', toastText(ga) === '20 cells left to cover', toastText(ga));

  // hint: predictable pair on this state (d0 has no candidate -> d1 grows (0,2)+(4,2))
  const simA = mirrorOwner(L1);
  simA[1][2] = 1; simA[3][2] = 1;
  const H = hintPick(L1, simA);
  ck('a-hint-predict', !!H && H.d === 1 && H.cell[0] === 0 && H.cell[1] === 2, JSON.stringify(H));
  ga.els.btnHint.dispatch('click', {}); ga.pump(1);
  ck('a-hint-fills', coveredOf(ga) === 7, coveredOf(ga));
  ck('a-hint-count', hintsOf(ga) === 2);
  ga.els.btnUndo.dispatch('click', {}); ga.pump(1);
  ck('a-hint-undo-reverts', coveredOf(ga) === 5);
  ck('a-hint-undo-norefund', hintsOf(ga) === 2);

  // reset restores dots-only + 3 hints + selection cleared
  ga.els.btnReset.dispatch('click', {}); ga.pump(1);
  ck('a-reset-covered', coveredOf(ga) === 3);
  ck('a-reset-hints', hintsOf(ga) === 3);
  ck('a-reset-sel', String(ga.els.selInfo.textContent).indexOf('Tap a glowing dot') === 0);

  // WIN L1 at 3 stars (0 hints, 0 secs <= par)
  playSolution(ga, 0, mirrorOwner(L1), null, 'a-l1');
  ck('a-l1-win', !ga.els.winOverlay.classList.contains('hidden'));
  ck('a-l1-stars', brightStars(ga.els.winStars.innerHTML) === 3, ga.els.winStars.innerHTML);
  ck('a-l1-score', String(ga.els.winScore.textContent) === '1500', String(ga.els.winScore.textContent));
  ck('a-l1-time', ga.els.winTime.textContent === '0:00');
  ck('a-l1-hints', String(ga.els.winHints.textContent) === '0');
  const sv1 = saveOf(ga);
  ck('a-l1-save', sv1 && sv1.stars['0'] === 3 && sv1.unlocked === 2, JSON.stringify(sv1));
  ck('a-l1-next-enabled', !ga.els.btnNext.disabled);

  // L2 -> 2 stars: exactly one hint (spend it, then erase its pair deterministically)
  ga.els.btnNext.dispatch('click', {}); ga.pump(2);
  const L2 = LEVELS[1];
  ck('a-l2-loaded', String(ga.els.hudLevel.textContent) === '2' && ga.els.hudTier.textContent === L2.tier && String(ga.els.hudTotal.textContent) === '25' && coveredOf(ga) === 3);
  playSolution(ga, 1, mirrorOwner(L2), (select, check) => {
    const sim = mirrorOwner(L2);
    const H2 = hintPick(L2, sim);
    ck('a-l2-hint-predict', !!H2 && H2.d === 0, JSON.stringify(H2));
    ga.els.btnHint.dispatch('click', {}); ga.pump(1);
    ck('a-l2-hint-filled', coveredOf(ga) === 5 && hintsOf(ga) === 2);
    // erase the hinted pair: select its dot, tap the cell
    select(H2.d);
    tapCell(ga, L2, H2.cell[0], H2.cell[1]);
    sim[H2.cell[0]][H2.cell[1]] = -1; sim[H2.mirror[0]][H2.mirror[1]] = -1;
    check();
    ck('a-l2-hint-erased', coveredOf(ga) === 3);
  }, 'a-l2');
  ck('a-l2-win', !ga.els.winOverlay.classList.contains('hidden'));
  ck('a-l2-stars2', brightStars(ga.els.winStars.innerHTML) === 2, ga.els.winStars.innerHTML);
  ck('a-l2-hintsshown', String(ga.els.winHints.textContent) === '1');
  ck('a-l2-score', String(ga.els.winScore.textContent) === '1400', String(ga.els.winScore.textContent));
  const sv2 = saveOf(ga);
  ck('a-l2-save', sv2.stars['1'] === 2 && sv2.unlocked === 3, JSON.stringify(sv2.stars));

  // L3 -> 1 star: two hints (both erased deterministically)
  ga.els.btnNext.dispatch('click', {}); ga.pump(2);
  const L3 = LEVELS[2];
  ck('a-l3-loaded', String(ga.els.hudLevel.textContent) === '3' && coveredOf(ga) === 3);
  playSolution(ga, 2, mirrorOwner(L3), (select, check) => {
    const sim = mirrorOwner(L3);
    for (let h = 0; h < 2; h++) {
      const H3 = hintPick(L3, sim);
      ck('a-l3-hint-predict-' + h, !!H3 && H3.d === 0, JSON.stringify(H3));
      ga.els.btnHint.dispatch('click', {}); ga.pump(1);
      ck('a-l3-hint-filled-' + h, coveredOf(ga) === 5 && hintsOf(ga) === 2 - h);
      select(H3.d);
      tapCell(ga, L3, H3.cell[0], H3.cell[1]);
      sim[H3.cell[0]][H3.cell[1]] = -1; sim[H3.mirror[0]][H3.mirror[1]] = -1;
      check();
      ck('a-l3-hint-erased-' + h, coveredOf(ga) === 3);
    }
  }, 'a-l3');
  ck('a-l3-win', !ga.els.winOverlay.classList.contains('hidden'));
  ck('a-l3-stars1', brightStars(ga.els.winStars.innerHTML) === 1, ga.els.winStars.innerHTML);
  ck('a-l3-hintsshown', String(ga.els.winHints.textContent) === '2');
  const sv3 = saveOf(ga);
  ck('a-l3-save', sv3.stars['2'] === 1 && sv3.unlocked === 4, JSON.stringify(sv3.stars));

  // L4..L29 at 3 stars via btnNext chain
  for (let li = 3; li < LEVELS.length; li++) {
    ga.els.btnNext.dispatch('click', {}); ga.pump(2);
    const L = LEVELS[li];
    ck('a-sweep-loaded-' + L.id, String(ga.els.hudLevel.textContent) === String(L.id + 1) && String(ga.els.hudTotal.textContent) === String(L.rows * L.cols), String(ga.els.hudLevel.textContent));
    playSolution(ga, li, mirrorOwner(L), null, 'a-sweep-' + L.id);
    const won = !ga.els.winOverlay.classList.contains('hidden');
    ck('a-sweep-win-' + L.id, won);
    if (won) ck('a-sweep-stars-' + L.id, brightStars(ga.els.winStars.innerHTML) === 3, ga.els.winStars.innerHTML);
  }
  ck('a-l29-next-disabled', ga.els.btnNext.disabled === true);
  const svEnd = saveOf(ga);
  ck('a-end-unlocked', svEnd.unlocked === 29, svEnd.unlocked);
  const starSum = Object.keys(svEnd.stars).reduce((a, k) => a + svEnd.stars[k], 0);
  ck('a-end-starsum', starSum === 3 + 2 + 1 + 26 * 3, String(starSum));

  // level select: totals, all unlocked, per-box stars
  ga.els.btnWinLevels.dispatch('click', {}); ga.pump(2);
  ck('a-levels-screen', !ga.els.levelScreen.classList.contains('hidden') && ga.els.gameScreen.classList.contains('hidden'));
  ck('a-levels-stars-hud', String(ga.els.hudStars.textContent) === String(starSum) && String(ga.els.hudStarsMax.textContent) === '87', String(ga.els.hudStars.textContent) + '/' + String(ga.els.hudStarsMax.textContent));
  const boxes = (ga.els.lvlGrid.children || []).filter(c => String(c.className).indexOf('lvlbox') >= 0);
  ck('a-levels-boxcount', boxes.length === 29, boxes.length);
  ck('a-levels-allunlocked', boxes.every(b => String(b.className).indexOf('locked') < 0));
  ck('a-levels-box2stars', brightStars(boxes[1].innerHTML) === 2, boxes[1].innerHTML);
  ck('a-levels-box3stars', brightStars(boxes[2].innerHTML) === 1, boxes[2].innerHTML);
  ck('a-levels-box29stars', brightStars(boxes[28].innerHTML) === 3, boxes[28].innerHTML);
  ga.els.btnContinue.dispatch('click', {}); ga.pump(2);
  ck('a-continue-back', !ga.els.gameScreen.classList.contains('hidden'));

  // resize handler fires layoutBoard without crashing
  ga.sandbox.window.dispatchEvent({ type: 'resize' }); ga.pump(2);
  ck('a-resize-ok', !ga.sandbox.__errors || !ga.sandbox.__errors.length);
})();

/* ============ Boot B: seeded save — resume, restore, reset-progress ============ */
(function bootB() {
  const ga = bootGame('spiral-galaxy', {
    seedLS: {
      spiralGalaxy_tutSeen: '1',
      spiralGalaxy_v1: JSON.stringify({ ver: 1, stars: { '0': 3 }, unlocked: 2, settings: { sound: false, music: false } }),
    },
  });
  ga.pump(3);
  ck('b-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  // resume at first unlocked unsolved = level 2
  ck('b-resume-l2', String(ga.els.hudLevel.textContent) === '2', String(ga.els.hudLevel.textContent));
  ck('b-tut-hidden', ga.els.tutOverlay.classList.contains('hidden'));
  ck('b-sound-muted', ga.els.btnSound.innerHTML === '&#128263;', ga.els.btnSound.innerHTML);

  // level grid from seeded save
  ga.els.btnLevels.dispatch('click', {}); ga.pump(2);
  const boxes = (ga.els.lvlGrid.children || []).filter(c => String(c.className).indexOf('lvlbox') >= 0);
  ck('b-grid-box1', String(boxes[0].className).indexOf('locked') < 0 && brightStars(boxes[0].innerHTML) === 3, boxes[0].innerHTML);
  ck('b-grid-box2-open', String(boxes[1].className).indexOf('locked') < 0 && brightStars(boxes[1].innerHTML) === 0);
  const lockedCount = boxes.filter(b => String(b.className).indexOf('locked') >= 0).length;
  ck('b-grid-locked', lockedCount === 27, lockedCount);
  ck('b-grid-starhud', String(ga.els.hudStars.textContent) === '3', String(ga.els.hudStars.textContent));

  // clicking a locked box is a no-op (stays on level screen)
  boxes[2].dispatch('click', {}); ga.pump(1);
  ck('b-locked-noop', !ga.els.levelScreen.classList.contains('hidden'));
  // clicking unlocked box 2 loads level 2
  boxes[1].dispatch('click', {}); ga.pump(2);
  ck('b-box2-loads', !ga.els.gameScreen.classList.contains('hidden') && String(ga.els.hudLevel.textContent) === '2');

  // sound toggle persists
  ga.els.btnSound.dispatch('click', {}); ga.pump(1);
  const svS = saveOf(ga);
  ck('b-sound-toggle', svS.settings.sound === true && ga.els.btnSound.innerHTML === '&#128266;', ga.els.btnSound.innerHTML);
  ga.els.btnSound.dispatch('click', {}); ga.pump(1);
  ck('b-sound-toggle-back', saveOf(ga).settings.sound === false);

  // win L2 at 3 stars; best for a level is kept, hud stars total updates
  playSolution(ga, 1, mirrorOwner(LEVELS[1]), null, 'b-l2');
  ck('b-l2-win', !ga.els.winOverlay.classList.contains('hidden'));
  const sv2 = saveOf(ga);
  ck('b-l2-save', sv2.stars['0'] === 3 && sv2.stars['1'] === 3 && sv2.unlocked === 3, JSON.stringify(sv2.stars));

  // reset progress (harness confirm() returns true)
  ga.els.btnWinLevels.dispatch('click', {}); ga.pump(2);
  ga.els.btnResetProg.dispatch('click', {}); ga.pump(2);
  const sv3 = saveOf(ga);
  ck('b-resetprog-save', JSON.stringify(sv3.stars) === '{}' && sv3.unlocked === 1, JSON.stringify(sv3));
  const boxes2 = (ga.els.lvlGrid.children || []).filter(c => String(c.className).indexOf('lvlbox') >= 0);
  ck('b-resetprog-grid', String(ga.els.hudStars.textContent) === '0' && boxes2.filter(b => String(b.className).indexOf('locked') >= 0).length === 28);
})();

/* ---- report ---- */
const total = pass + fail;
console.log(JSON.stringify({ pass, fail, total, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { levels: '29/29 solved+driven', boots: 2, realTaps: true } }));
process.exit(fail === 0 ? 0 : 1);
