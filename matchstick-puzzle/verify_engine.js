#!/usr/bin/env node
/* matchstick-puzzle verifier (type A): all 30 levels must be solved through the real input
 * path (pointer drag on a stick -> snap -> engine's own checkWin). Equation levels are solved
 * by an in-page search using the ENGINE's own parseEquationFromSticks (find a target layout:
 * drag each stray stick to the segment slot that completes the target equation); shape levels
 * restore the engine's own lvl.solution layout. Also exercises undo (full-board restore, the
 * old undo crashed), hint, move counting, star/persistence, and the win-modal -> next chain. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('matchstick-puzzle', {
  viewport: { w: 900, h: 900 },
  inject: {
    anchor: 'function checkWin(){',
    exports: `globalThis.__R = {
      state: () => state, lv: () => currentLevel, moves: () => movesUsed, n: () => LEVELS.length,
      sticks: () => sticks.map(s => ({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 })),
      grid: () => GRID_SIZE, done: () => completedLevels.slice(),
      stars: () => stars, hist: () => moveHistory.length,
      parse: () => parseEquationFromSticks(sticks),
      lvl: () => LEVELS[currentLevel],
      // pure probe: which stick index would handlePointerDown grab at screen (x,y)?
      probe: function (x, y) {
        for (var i = sticks.length - 1; i >= 0; i--) if (isNearStick(x, y, sticks[i])) return i;
        return -1;
      },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

const cv = g.els['gameCanvas'];
const GS = () => g.call('__R.grid()');
const sx = v => v * GS() + 10; // grid -> canvas/screen coords (engine's own offset)
const pev = (type, x, y) => cv.dispatch(type, { clientX: x, clientY: y, pointerId: 4, button: 0, isPrimary: true, preventDefault() {} });

// grab probe: find a screen point where the engine would grab stick index i
function grabPoint(i) {
  const st = g.call('__R.sticks()');
  const s = st[i];
  for (let t = 0.1; t <= 0.95; t += 0.17) {
    const px = sx(s.x1 + (s.x2 - s.x1) * t), py = sx(s.y1 + (s.y2 - s.y1) * t);
    if (g.call(`__R.probe(${px}, ${py})`) === i) return [px, py];
    for (const o of [7, -7, 13, -13]) {
      const ox = sx(s.x1 + (s.x2 - s.x1) * t) + (Math.abs(s.y2 - s.y1) < 0.3 ? o : 0);
      const oy = sx(s.y1 + (s.y2 - s.y1) * t) + (Math.abs(s.x2 - s.x1) < 0.3 ? o : 0);
      if (g.call(`__R.probe(${ox}, ${oy})`) === i) return [ox, oy];
    }
  }
  return null;
}

// drag stick i so its center lands at grid (cx, cy) — real pointer gesture. The pointer-up
// point must be the target center PLUS the grab offset (the engine keeps the stick center at
// pointer - dragOffset, and dragOffset = grabPoint - stickCenter at pointerdown).
function dragStickTo(i, cx, cy) {
  const st = g.call('__R.sticks()');
  const s = st[i];
  const c0x = sx((s.x1 + s.x2) / 2), c0y = sx((s.y1 + s.y2) / 2);
  const p = grabPoint(i);
  if (!p) return false;
  const dox = p[0] - c0x, doy = p[1] - c0y;
  const tx = sx(cx) + dox, ty = sx(cy) + doy;
  pev('pointerdown', p[0], p[1]);
  const N = 5;
  for (let k = 1; k <= N; k++) pev('pointermove', p[0] + (tx - p[0]) * k / N, p[1] + (ty - p[1]) * k / N);
  pev('pointerup', tx, ty);
  return true;
}

// equation solver: strays = sticks outside the band; try every segment-slot assignment of
// strays (single stray: all slots of the target layout; two strays: all pairs), validated by
// the engine's own parser — the win itself only fires from the engine's checkWin.
const SEGPTS = { // segment stick of a digit cell at (L, y0): [x1,y1,x2,y2] + its center
  a: (L, y0) => [[L, y0, L + 2, y0], [L + 1, y0]],
  b: (L, y0) => [[L + 2, y0, L + 2, y0 + 1], [L + 2, y0 + 0.5]],
  c: (L, y0) => [[L + 2, y0 + 1, L + 2, y0 + 2], [L + 2, y0 + 1.5]],
  d: (L, y0) => [[L, y0 + 2, L + 2, y0 + 2], [L + 1, y0 + 2]],
  e: (L, y0) => [[L, y0 + 1, L, y0 + 2], [L, y0 + 1.5]],
  f: (L, y0) => [[L, y0, L, y0 + 1], [L, y0 + 0.5]],
  g: (L, y0) => [[L, y0 + 1, L + 2, y0 + 1], [L + 1, y0 + 1]],
};
function targetSlots(target, y0) {
  const toks = target.split(' ');
  const slots = [];
  let L = 2;
  const digits = ch => { const D = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' }[ch]; for (const s of D) slots.push(SEGPTS[s](L, y0)); L += 2.5; };
  for (const ch of toks[0]) digits(ch);
  L += 2.5; // op cell (no slots)
  for (const ch of toks[2]) digits(ch);
  L += 2.5; // '=' cell (no slots)
  for (const ch of toks[4]) digits(ch);
  return slots;
}

function solveEquationLevel() {
  const lvl = g.call('__R.lvl()');
  const y0 = lvl.y0 || 3;
  const st = g.call('__R.sticks()');
  // strays = sticks entirely outside the band
  const strays = [];
  st.forEach((s, i) => { if (Math.min(s.y1, s.y2) > y0 + 2.25 || Math.max(s.y1, s.y2) < y0 - 0.25) strays.push(i); });
  const slots = targetSlots(lvl.targetEquation, y0);
  if (strays.length === 1) {
    for (const [, c] of slots) {
      if (!dragStickTo(strays[0], c[0], c[1])) return 'grab-fail';
      if (g.call('__R.parse()') === lvl.targetEquation) return true;
      g.call('undo()'); // restore and try next slot
    }
    return 'no-slot';
  }
  if (strays.length === 2) {
    for (const [, c1] of slots) {
      if (!dragStickTo(strays[0], c1[0], c1[1])) return 'grab-fail';
      for (const [, c2] of slots) {
        if (c1.join() === c2.join()) continue;
        if (!dragStickTo(strays[1], c2[0], c2[1])) return 'grab-fail';
        if (g.call('__R.parse()') === lvl.targetEquation) return true;
        g.call('undo()');
      }
      g.call('undo()');
    }
    return 'no-slot';
  }
  return 'strays=' + strays.length;
}

function solveShapeLevel() {
  const lvl = g.call('__R.lvl()');
  const sol = lvl.solution;
  const st = g.call('__R.sticks()');
  // multiset diff: which sticks are surplus (parked) and which solution slots are missing;
  // pair them by orientation+length (a drag preserves both), drag each surplus stick home.
  const R = v => Math.round(v * 2) / 2;
  const norm = x => { let a = [R(x[0]), R(x[1])], b = [R(x[2]), R(x[3])]; if (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1])) { const t = a; a = b; b = t; } return a.concat(b); };
  const key = a => a.join(',');
  const cnt = {};
  for (const x of sol) { const k = key(norm(x)); cnt[k] = (cnt[k] || 0) + 1; }
  const surplus = [];
  st.forEach((s, i) => {
    const k = key(norm([s.x1, s.y1, s.x2, s.y2]));
    if ((cnt[k] || 0) > 0) cnt[k]--;
    else surplus.push(i);
  });
  const missing = [];
  for (const x of sol) { const k = key(norm(x)); if (cnt[k] > 0) { cnt[k]--; missing.push(x); } }
  if (missing.length !== surplus.length || missing.length !== lvl.allowedMoves) return 'diff=' + missing.length + '/' + surplus.length + '/am' + lvl.allowedMoves;
  let moves = 0;
  for (const si of surplus) {
    const s = st[si];
    const adx = Math.abs(s.x2 - s.x1), ady = Math.abs(s.y2 - s.y1);
    const mj = missing.findIndex(t => Math.abs(Math.abs(t[2] - t[0]) - adx) < 0.01 && Math.abs(Math.abs(t[3] - t[1]) - ady) < 0.01);
    if (mj < 0) return 'no-slot-for-stick' + si;
    const t = missing.splice(mj, 1)[0];
    if (!dragStickTo(si, (t[0] + t[2]) / 2, (t[1] + t[3]) / 2)) return 'grab-fail' + si;
    moves++;
  }
  return moves === lvl.allowedMoves ? true : 'moves=' + moves;
}

// --- menu -> level select -> level 1 (grid buttons use property onclick) ---
g.call('showLevelSelect()');
const cells = [...g.els['level-grid'].children];
T('level-grid', cells.length === 30, 'cells=' + cells.length);
cells[0].click();
T('level-1-starts', g.call('__R.state()') === 'game' && g.call('__R.lv()') === 0, 'state=' + g.call('__R.state()'));

// --- undo regression on level 1: drag a stray somewhere, undo restores exactly ---
const before = JSON.stringify(g.call('__R.sticks()'));
const st0 = g.call('__R.sticks()');
const strayIdx = st0.findIndex(s => Math.min(s.y1, s.y2) > 5.25);
if (!dragStickTo(strayIdx, 10, 10)) fails.push('L1 undo-test grab failed');
T('move-counted', g.call('__R.moves()') === 1, 'moves=' + g.call('__R.moves()'));
g.call('undo()');
T('undo-restores-board', JSON.stringify(g.call('__R.sticks()')) === before && g.call('__R.moves()') === 0, 'undo differs');
// hint overlay
g.call('showHint()');
T('hint-shows', g.els['hint-overlay'].style.display === 'block', 'hint');

// --- solve all 30 levels in a chain ---
const solved = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < 30 && Date.now() - T0 < 100000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  const lvl = g.call('__R.lvl()');
  const res = lvl.type === 'equation' ? solveEquationLevel() : solveShapeLevel();
  g.pump(45); // 500ms win modal timeout
  const won = g.call('__R.state()') === 'win' && g.els['win-modal'].style.display === 'flex';
  if (res !== true || !won) {
    notes.push('L' + (li + 1) + ' res=' + res + ' state=' + g.call('__R.state()') + ' parse=' + JSON.stringify(g.call('__R.parse()')) + ' moves=' + g.call('__R.moves()'));
    fails.push('L' + (li + 1) + ' not won (' + res + ')');
    break;
  }
  T('L' + (li + 1) + '-stars', g.call('__R.stars()') >= 1, 'stars=' + g.call('__R.stars()'));
  solved.push(li + 1);
  if (li < 29) g.call('nextLevel()');
}
T('all-30-solved', solved.length === 30, 'solved=' + solved.length + '/30 ' + notes.slice(0, 4).join('|'));
T('completion-saved', g.call('__R.done()').length === 30, 'saved=' + g.call('__R.done()').length);

// final nextLevel from L30 returns to the level select
g.call('nextLevel()');
T('next-after-last', g.call('__R.state()') === 'menu' && g.els['level-select'].style.display === 'flex', 'state=' + g.call('__R.state()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/30', notes: notes.slice(0, 6) } };
console.log('matchstick-puzzle: ' + solved.length + '/30 levels solved via real stick drags: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
