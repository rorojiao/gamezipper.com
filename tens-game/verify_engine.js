#!/usr/bin/env node
/* tens-game end-to-end verifier (QA round 2026-08-25).
 * Real input paths only: tile placement via real canvas pointerdown (rect/scale math
 * replicated engine-exact from handlePointer), choice selection via real .choice-tile
 * clicks; state read back through a read-only __TG export injected into the IIFE.
 * Covers: render-loop liveness (P0 regression: gridOffset must be numeric), choices
 * UI + selection, single-pair clear + scoring, double-pair single placement + bonus,
 * gravity compaction after a column clear, undo (basic + post-clear-corruption P2
 * regression), hint semantics (validated against an engine-exact replica), full-board
 * game over (best score persist, NEW BEST label, interstitial no-op, play again),
 * tutorial auto-show + persistence, SFX/music toggles, seeded boot.
 * Output: last stdout line is compact JSON {"pass":N,"fail":M,...}; exit 0 iff PASS. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

const SLUG = 'tens-game';
let pass = 0, fail = 0; const fails = [];
function T(name, ok, note) {
  if (ok) { pass++; } else { fail++; fails.push(name + (note ? ' | ' + note : '')); }
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : (note ? '  << ' + note : '')));
}

/* engine-exact replicas */
const GS = 5;
function replicaPairs(g) {
  const pairs = [];
  for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) {
    if (g[r][c] === 0) continue;
    if (c + 1 < GS && g[r][c + 1] !== 0 && g[r][c] + g[r][c + 1] === 10) pairs.push([r, c, r, c + 1]);
    if (r + 1 < GS && g[r + 1][c] !== 0 && g[r][c] + g[r + 1][c] === 10) pairs.push([r, c, r + 1, c]);
  }
  return pairs;
}
function makesClear(g, r, c, v) {
  const t = g.map(row => row.slice()); t[r][c] = v;
  return replicaPairs(t).length > 0;
}

const EXPORTS = 'globalThis.__TG={get grid(){return grid},get choices(){return choices},get sel(){return selectedChoice},get state(){return gameState},get score(){return score},get dscore(){return displayScore},get undos(){return undoCount},get last(){return lastPlaced},get hint(){return hintCell},get best(){return bestScore},get cs(){return cellSize},get ox(){return gridOffsetX},get oy(){return gridOffsetY},get cw(){return canvas.width},get ch(){return canvas.height},get sfx(){return sfxEnabled},get mus(){return musicEnabled}};';
const g = bootGame(SLUG, { inject: { anchor: '// === GAME LOGIC ===', exports: EXPORTS } });
const els = g.els;

const gridStr = () => g.call('JSON.stringify(__TG.grid)');
const gridArr = () => JSON.parse(gridStr());
const choicesArr = () => JSON.parse(g.call('JSON.stringify(__TG.choices)'));

function tapCell(r, c) {
  const w = g.call('__TG.cw'), h = g.call('__TG.ch');
  const ox = g.call('__TG.ox'), oy = g.call('__TG.oy'), cs = g.call('__TG.cs');
  const gx = ox + c * cs + cs / 2, gy = oy + r * cs + cs / 2;
  const rect = els.gameCanvas.getBoundingClientRect();
  const sx = w / rect.width, sy = h / rect.height;
  els.gameCanvas.dispatch('pointerdown', { clientX: rect.left + gx / sx, clientY: rect.top + gy / sy });
}
function settle(label) {
  let n = 0;
  while ((g.call('__TG.state') === 'animating') && n < 60) { g.pump(5); n++; }
  g.pump(3);
  if (g.call('__TG.state') === 'animating') return label + ': stuck animating';
  return null;
}
function selectChoice(i) { els['choices-panel'].children[i].click(); }
function place(r, c, expectVal) { /* uses currently selected choice */
  tapCell(r, c);
  const got = g.call('__TG.grid[' + r + '][' + c + ']');
  if (expectVal !== undefined && got !== expectVal) return 'place(' + r + ',' + c + ') got ' + got + ' want ' + expectVal;
  return null;
}
function safeCellFor(v, preferred, exclude) {
  const gA = gridArr();
  const ex = new Set((exclude || []).map(p => p[0] + ',' + p[1]));
  const cells = [];
  (preferred || []).forEach(p => cells.push(p));
  for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) cells.push([r, c]);
  for (const [r, c] of cells) {
    if (ex.has(r + ',' + c)) continue;
    if (gA[r][c] === 0 && !makesClear(gA, r, c, v)) return [r, c];
  }
  return null;
}
/* burn a turn: place any current choice somewhere safe (never in `exclude` — those
 * cells are reserved for the move being staged) until choices contain `want` */
function waitChoiceValue(want, label, exclude) {
  for (let t = 0; t < 70; t++) {
    const ch = choicesArr();
    const idx = ch.indexOf(want);
    if (idx >= 0) { selectChoice(idx); return true; }
    selectChoice(0);
    const cell = safeCellFor(ch[0], null, exclude);
    if (!cell) return false;
    const e = place(cell[0], cell[1], ch[0]); if (e) return false;
    const s = settle(label); if (s) return false;
  }
  return false;
}

/* ---------- boot A ---------- */
T('boot-clean', g.loadErrors.length === 0 && g.call('__TG.state') === 'playing' && g.call('__TG.score') === 0 &&
  gridArr().every(row => row.every(v => v === 0)) && choicesArr().length === 3, g.loadErrors.join('; '));
g.pump(3);
const ox0 = g.call('__TG.ox'), oy0 = g.call('__TG.oy'), cs0 = g.call('__TG.cs');
T('render-loop-alive-p0', typeof ox0 === 'number' && isFinite(ox0) && typeof oy0 === 'number' && isFinite(oy0) &&
  typeof cs0 === 'number' && cs0 > 0 && g.call('__TG.cw') === 320 && Math.abs(cs0 - 61.6) < 0.01,
  'ox=' + ox0 + ' oy=' + oy0 + ' cs=' + cs0);
T('choices-ui', els['choices-panel'].children.length === 3 &&
  String(els['choices-panel'].children[0].className).includes('selected') && g.call('__TG.sel') === 0);
selectChoice(1);
T('choice-select', g.call('__TG.sel') === 1 && String(els['choices-panel'].children[1].className).includes('selected'));
selectChoice(0);
T('choice-reselect', g.call('__TG.sel') === 0);

g.pump(35); /* 500ms -> tutorial auto-show (fresh save) */
T('tutorial-autoshow', els['tutorial-modal'].classList.contains('visible') &&
  JSON.parse(g.ls.getItem('tens_settings') || '{}').tutorial === true);
els['tutorial-close-btn'].click();
T('tutorial-close', !els['tutorial-modal'].classList.contains('visible'));

/* scenario A: single pair clear at (0,0)+(1,0) */
{
  const ch = choicesArr(); selectChoice(0);
  const e1 = place(0, 0, ch[0]); T('place-first-tile', e1 === null, e1 || '');
  let s = settle('A1'); T('place-first-settles', s === null && g.call('__TG.score') === 0, s || '');
  const t = ch[0];
  const ok = waitChoiceValue(10 - t, 'A2', [[1, 0]]);
  T('wait-complement', ok, 'choices never offered ' + (10 - t));
  if (ok) {
    selectChoice(choicesArr().indexOf(10 - t));
    const gA = gridArr();
    T('complement-staged', gA[0][0] === t && gA[1][0] === 0 && makesClear(gA, 1, 0, 10 - t) === true,
      't=' + t + ' cell(1,0)=' + gA[1][0]);
    tapCell(1, 0);
    const sc = g.call('__TG.score');
    s = settle('A3');
    const gB = gridArr();
    T('pair-clears-and-scores', s === null && sc === 10 && gB[0][0] === 0 && gB[1][0] === 0,
      'score=' + sc + ' s=' + (s || '-') + ' cells=' + gB[0][0] + ',' + gB[1][0]);
    T('undo-disabled-after-clear-p2', els['undo-btn'].disabled === true && g.call('__TG.last') === null && g.call('__TG.undos') === 3);
  }
}

/* scenario B: corruption regression — column stack, clear bottom pair, gravity drops p3 into placed cell */
{
  const RES = [[4, 0]]; /* reserved: the complement slot */
  function burn() { /* place current choice somewhere harmless; null if impossible */
    const ch = choicesArr();
    const cell = safeCellFor(ch[0], null, RES);
    if (!cell) return null;
    selectChoice(0); place(cell[0], cell[1], ch[0]);
    return settle('B-burn') === null ? cell : null;
  }
  function placeSafeAt(r, c, tries) { /* place SOME current choice at (r,c) without clearing */
    for (let i = 0; i < tries; i++) {
      const ch = choicesArr();
      if (!makesClear(gridArr(), r, c, ch[0])) {
        selectChoice(0);
        const e = place(r, c, ch[0]);
        if (e) return null;
        if (settle('B-slot')) return null;
        return ch[0];
      }
      if (burn() === null) return null;
    }
    return null;
  }
  const vals = [];
  let okAll = true; const notes = [];
  for (const [r, c] of [[0, 0], [1, 0], [2, 0], [3, 0]]) {
    const v = placeSafeAt(r, c, 40);
    if (v === null) { okAll = false; notes.push('slot ' + r); break; }
    vals.push(v);
  }
  if (okAll) {
    const y = vals[3];
    const got = waitChoiceValue(10 - y, 'B-comp', RES);
    T('corrupt-setup-ok', got, 'stack=' + JSON.stringify(vals));
    if (got) {
      selectChoice(choicesArr().indexOf(10 - y));
      tapCell(4, 0);
      const s = settle('B-clear');
      const gB = gridArr();
      /* random burn tiles elsewhere can legally chain extra clears, so assert the
       * engine-exact gravity INVARIANT (every column bottom-packed) + that the pair
       * scored, not one exact layout */
      let packed = true;
      for (let c = 0; c < GS; c++) for (let r = 0; r < GS - 1; r++) { if (gB[r][c] !== 0 && gB[r + 1][c] === 0) packed = false; } /* no tile floating above a hole */
      T('gravity-invariant', s === null && packed && g.call('__TG.score') >= 10,
        'packed=' + packed + ' score=' + g.call('__TG.score') + ' grid=' + JSON.stringify(gB));
      /* P2 regression: undo must be a no-op now (placed tile was cleared) */
      const before = gridStr();
      els['undo-btn'].click();
      T('undo-no-corruption-p2', els['undo-btn'].disabled === true && gridStr() === before && g.call('__TG.undos') === 3,
        'grid changed or undos=' + g.call('__TG.undos'));
    }
  } else T('corrupt-setup-ok', false, 'stuck at ' + notes.join('; '));
}

/* scenario C: one placement creating two pairs (bonus scoring) */
{
  const RESC = [[1, 0], [1, 1]]; /* reserved: the two staging slots */
  function burnC() {
    const ch = choicesArr();
    const cell = safeCellFor(ch[0], null, RESC);
    if (!cell) return null;
    selectChoice(0); place(cell[0], cell[1], ch[0]);
    return settle('C-burn') === null ? cell : null;
  }
  const v1 = (() => {
    for (let i = 0; i < 40; i++) {
      const ch = choicesArr();
      if (!makesClear(gridArr(), 0, 1, ch[0])) {
        selectChoice(0);
        if (place(0, 1, ch[0]) !== null) return null;
        if (settle('C1') !== null) return null;
        return ch[0];
      }
      if (burnC() === null) return null;
    }
    return null;
  })();
  let okC = v1 !== null;
  if (!okC) T('double-pair-setup', false, 'no safe tile at (0,1)');
  if (okC) {
    /* second leg: same value tv at (1,0) */
    let e2 = null; const tv = v1;
    for (let i = 0; i < 40 && e2 === null; i++) {
      const ch = choicesArr();
      const idx = ch.indexOf(tv);
      if (idx >= 0 && !makesClear(gridArr(), 1, 0, tv)) {
        selectChoice(idx);
        e2 = place(1, 0, tv);
        if (e2 === null && settle('C3') !== null) e2 = 'settle';
      } else if (burnC() === null) { e2 = 'no-burn-space'; }
    }
    okC = e2 === null;
    if (!okC) T('double-pair-setup', false, 'e2=' + e2);
    if (okC) {
      const okComp = waitChoiceValue(10 - tv, 'C4', RESC);
      okC = okComp;
      if (!okComp) T('double-pair-setup', false, 'no complement for tv=' + tv);
      if (okComp) {
        /* exactly-2-pairs guard: burn if the placement would catch extra pairs */
        let placedOk = false, why = '';
        for (let i = 0; i < 30 && !placedOk; i++) {
          const ch = choicesArr();
          const idx = ch.indexOf(10 - tv);
          if (idx < 0) { why = 'complement vanished'; break; }
          const t2 = gridArr().map(row => row.slice());
          t2[1][1] = 10 - tv;
          const np = replicaPairs(t2).length;
          if (np === 2) {
            selectChoice(idx);
            const scoreBefore = g.call('__TG.score');
            tapCell(1, 1);
            const gained = g.call('__TG.score') - scoreBefore;
            const s = settle('C5');
            const gB = gridArr();
            T('double-pair-bonus-score', s === null && gained === 30 && gB[0][1] === 0 && gB[1][0] === 0 && gB[1][1] === 0,
              'gained=' + gained + ' want 30 (2 pairs x10 + 2x5 bonus) s=' + (s || '-'));
            placedOk = true;
          } else if (burnC() === null) { why = 'pairs=' + np; break; }
        }
        if (!placedOk) T('double-pair-bonus-score', false, 'could not stage exactly-2 pairs: ' + why);
      }
    }
  }
}

/* undo basic (uncorrupted path) */
{
  const ch = choicesArr(); selectChoice(0);
  const cell = safeCellFor(ch[0]);
  const e = cell ? place(cell[0], cell[1], ch[0]) : 'no-safe-cell';
  const s = settle('U1');
  T('undo-place', e === null && s === null, e || s || '');
  if (e === null && s === null) {
    T('undo-btn-enabled', els['undo-btn'].disabled === false && g.call('__TG.undos') === 3);
    els['undo-btn'].click();
    const gA = gridArr();
    T('undo-restores-cell', gA[cell[0]][cell[1]] === 0 && g.call('__TG.undos') === 2 && g.call('__TG.last') === null &&
      String(els['undo-counter'].textContent) === '(2)');
  }
}

/* hint */
{
  els['hint-btn'].click();
  const h = JSON.parse(g.call('JSON.stringify(__TG.hint)'));
  let ok = !!h && typeof h.row === 'number';
  if (ok) {
    const gA = gridArr();
    ok = gA[h.row][h.col] === 0;
    let any = false;
    for (let n = 1; n <= 9; n++) if (makesClear(gA, h.row, h.col, n)) any = true;
    ok = ok && any;
  }
  T('hint-cell-valid', ok, 'hint=' + JSON.stringify(h));
}

/* score display catch-up */
{
  let n = 0;
  while (String(els['score-display'].textContent) !== String(g.call('__TG.score')) && n < 20) { g.pump(2); n++; }
  T('score-display-sync', String(els['score-display'].textContent) === String(g.call('__TG.score')) &&
    String(els['best-display'].textContent) === String(g.call('__TG.best')),
    'disp=' + els['score-display'].textContent + ' score=' + g.call('__TG.score'));
}

/* game over: fill the board with non-clearing placements */
{
  let placed = 0, guard = 0, stuck = false;
  while (g.call('__TG.state') !== 'gameover' && guard < 400) {
    guard++;
    const gA = gridArr();
    const empties = [];
    for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) if (gA[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) {
      /* board full — finishTurn should have triggered gameover on settle; pump a bit */
      g.pump(10); continue;
    }
    const ch = choicesArr();
    let done = false;
    for (let i = 0; i < 3 && !done; i++) {
      const v = ch[i];
      for (const [r, c] of empties) {
        if (!makesClear(gA, r, c, v)) {
          selectChoice(i); place(r, c, v); placed++;
          const s = settle('GO'); if (s) stuck = true;
          done = true; break;
        }
      }
    }
    if (!done) { stuck = true; break; }
    if (stuck) break;
  }
  const fin = g.call('__TG.state') === 'gameover';
  T('gameover-reached', fin && !stuck, 'state=' + g.call('__TG.state') + ' stuck=' + stuck + ' placed=' + placed + ' guard=' + guard);
  if (fin) {
    const sc = g.call('__TG.score');
    T('gameover-modal', els['gameover-modal'].classList.contains('visible') &&
      String(els['final-score'].textContent) === String(sc) &&
      !els['interstitial-ad'].classList.contains('visible'),
      'final=' + els['final-score'].textContent + ' score=' + sc);
    T('best-saved', g.ls.getItem('tens_best') === String(sc) &&
      (String(els['best-score-label'].textContent).includes('NEW BEST') || sc === 0),
      'ls=' + g.ls.getItem('tens_best') + ' sc=' + sc + ' label=' + els['best-score-label'].textContent);
    els['play-again-btn'].click();
    T('play-again-resets', g.call('__TG.state') === 'playing' && g.call('__TG.score') === 0 &&
      gridArr().every(row => row.every(v => v === 0)) && choicesArr().length === 3 && !els['gameover-modal'].classList.contains('visible'));
  }
}

/* toggles */
els['sound-btn'].click();
T('sfx-off', g.call('__TG.sfx') === false && String(els['sound-btn'].textContent) === 'SFX: OFF' &&
  JSON.parse(g.ls.getItem('tens_settings')).sfx === false);
els['music-btn'].click();
T('music-off', g.call('__TG.mus') === false && String(els['music-btn'].textContent) === 'MUSIC: OFF');
els['sound-btn'].click(); els['music-btn'].click();
T('toggles-restore', g.call('__TG.sfx') === true && g.call('__TG.mus') === true);

els['tutorial-btn'].click();
T('tutorial-reopen', els['tutorial-modal'].classList.contains('visible'));
els['tutorial-close-btn'].click();
T('tutorial-reclose', !els['tutorial-modal'].classList.contains('visible'));

/* ---------- boot B: seeded ---------- */
const gb = bootGame(SLUG, {
  seedLS: { tens_best: '500', tens_settings: JSON.stringify({ sfx: false, music: false, tutorial: true }) },
  inject: { anchor: '// === GAME LOGIC ===', exports: EXPORTS },
});
const eb = gb.els;
T('seeded-boot', gb.loadErrors.length === 0 && String(eb['best-display'].textContent) === '500' &&
  gb.call('__TG.best') === 500 && String(eb['sound-btn'].textContent) === 'SFX: OFF' &&
  String(eb['music-btn'].textContent) === 'MUSIC: OFF' && gb.call('__TG.sfx') === false && gb.call('__TG.mus') === false,
  gb.loadErrors.join('; '));
gb.pump(35);
T('seeded-no-tutorial', !eb['tutorial-modal'].classList.contains('visible'));
gb.pump(3);
{
  const ch = JSON.parse(gb.call('JSON.stringify(__TG.choices)'));
  const cell = (() => {
    const gA = JSON.parse(gb.call('JSON.stringify(__TG.grid)'));
    for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) if (gA[r][c] === 0 && !makesClear(gA, r, c, ch[0])) return [r, c];
    return null;
  })();
  const rect = eb.gameCanvas.getBoundingClientRect();
  const w = gb.call('__TG.cw'), h = gb.call('__TG.ch');
  const ox = gb.call('__TG.ox'), oy = gb.call('__TG.oy'), cs = gb.call('__TG.cs');
  const gx = ox + cell[1] * cs + cs / 2, gy = oy + cell[0] * cs + cs / 2;
  eb.gameCanvas.dispatch('pointerdown', { clientX: rect.left + gx / (w / rect.width), clientY: rect.top + gy / (h / rect.height) });
  T('seeded-playable', cell && gb.call('__TG.grid[' + cell[0] + '][' + cell[1] + ']') === ch[0],
    'cell=' + cell + ' want=' + ch[0]);
}

console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { boots: 2, realTaps: true } }));
process.exit(fail === 0 ? 0 : 1);
