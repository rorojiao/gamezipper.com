#!/usr/bin/env node
/* string-art engine verifier — real input paths only: canvas mousedown/mouseup taps at
   exact pin coordinates (engine maps normalized pins through canvas.style.width=480),
   drag-to-thread via mousemove, palette chip clicks, hint/undo/reset buttons, overlay
   and level-select buttons. Level geometry is independently replicated (the pure-math
   generators are copied from the page source; nothing is read from engine state).
   Covers: menu/stats/continue, per-level completion for all 30 levels (incl. the two
   ray levels where rays auto-place on a tap), unlock chain, wrong-pin/far-tap no-ops,
   hints (incl. the >=3-hints star downgrade), undo, reset, drag input, done-color
   toast, auto color advance, level-select locking, visibilitychange, menu escape,
   persistence reload. Documented gap: the pure elapsed-time star tiers (>180s/>360s)
   are not exercised — the hint-downgrade tier is. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

const results = [];
const T = (name, ok, note) => { results.push({ name, ok, note: note === undefined ? '' : String(note) }); if (!ok) console.error('  FAIL: ' + name + (note !== undefined ? ' — ' + note : '')); };
const t0 = Date.now();

// ---------- independent level replication (verbatim pure-math generators) ----------
function circlePins(cx, cy, r, n, startAngle) {
  startAngle = startAngle === undefined ? -Math.PI / 2 : startAngle;
  var pins = [];
  for (var i = 0; i < n; i++) { var a = startAngle + (i / n) * Math.PI * 2; pins.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pins;
}
function skipThread(colorIdx, pinCount, skip, offset) { offset = offset || 0; var seq = []; for (var i = 0; i <= pinCount; i++) { seq.push(((i * skip) % pinCount) + offset); } return { c: colorIdx, seq: seq }; }
const LEVELS = [
  { n: 'Heart', gen() { return { pins: [[0.5,0.15],[0.28,0.3],[0.2,0.5],[0.3,0.68],[0.5,0.85],[0.7,0.68],[0.8,0.5],[0.72,0.3]], threads: [{ c: 0, seq: [0,1,2,3,4,5,6,7,0] }] }; } },
  { n: 'Star', gen() { return { pins: circlePins(0.5,0.5,0.35,10), threads: [{ c: 0, seq: [0,2,4,6,8,0] }] }; } },
  { n: 'Diamond', gen() { return { pins: [[0.5,0.1],[0.9,0.5],[0.5,0.9],[0.1,0.5]], threads: [{ c: 0, seq: [0,1,2,3,0] }] }; } },
  { n: 'Triangle', gen() { return { pins: [[0.5,0.1],[0.85,0.8],[0.15,0.8]], threads: [{ c: 0, seq: [0,1,2,0] }] }; } },
  { n: 'Spirelli', gen() { var n = 12; return { pins: circlePins(0.5,0.5,0.38,n), threads: [skipThread(0,n,5)] }; } },
  { n: 'Flower', gen() { return { pins: circlePins(0.5,0.5,0.36,8), threads: [{ c: 0, seq: [0,2,4,6,0] }, { c: 1, seq: [1,3,5,7,1] }] }; } },
  { n: 'Butterfly', gen() { return { pins: [[0.5,0.5],[0.15,0.15],[0.3,0.1],[0.1,0.35],[0.15,0.7],[0.3,0.85],[0.1,0.55],[0.85,0.15],[0.7,0.1],[0.9,0.35],[0.85,0.7],[0.7,0.85],[0.9,0.55],[0.45,0.15],[0.55,0.15],[0.42,0.85],[0.58,0.85]], threads: [{ c: 0, seq: [0,1,2,3,0] }, { c: 0, seq2: [0,4,5,6,0] }, { c: 1, seq: [0,7,8,9,0] }, { c: 1, seq2: [0,10,11,12,0] }, { c: 2, seq: [13,0,14] }, { c: 2, seq2: [15,0,16] }] }; } },
  { n: 'Fish', gen() { return { pins: [[0.2,0.5],[0.3,0.3],[0.45,0.25],[0.6,0.3],[0.65,0.5],[0.6,0.7],[0.45,0.75],[0.3,0.7],[0.75,0.3],[0.9,0.2],[0.9,0.8],[0.75,0.7],[0.25,0.42]], threads: [{ c: 0, seq: [0,1,2,3,4,5,6,7,0] }, { c: 1, seq: [4,8,9,10,11,4] }, { c: 2, seq: [0,12] }] }; } },
  { n: 'Tree', gen() { return { pins: [[0.5,0.9],[0.4,0.9],[0.6,0.9],[0.45,0.7],[0.55,0.7],[0.5,0.6],[0.2,0.55],[0.15,0.4],[0.3,0.3],[0.5,0.15],[0.7,0.3],[0.85,0.4],[0.8,0.55],[0.35,0.45],[0.65,0.45]], threads: [{ c: 1, seq: [0,1,3,4,2,0] }, { c: 0, seq: [5,6,7,8,9,10,11,12,5] }, { c: 0, seq2: [13,5,14] }] }; } },
  { n: 'Sun', gen() { var inner = circlePins(0.5,0.5,0.15,8); var outer = circlePins(0.5,0.5,0.38,16); var rays = []; for (var i = 0; i < 16; i++) { rays.push([inner[i/2|0][0], inner[i/2|0][1], outer[i][0], outer[i][1]]); } return { pins: [[0.5,0.5]].concat(inner).concat(outer), threads: [{ c: 0, seq: [0,1,2,3,4,5,6,7,8,0] }, { c: 1, rays: rays }] }; } },
  { n: 'Spiral Bloom', gen() { var n = 16; return { pins: circlePins(0.5,0.5,0.38,n), threads: [skipThread(0,n,7), skipThread(2,n,5)] }; } },
  { n: 'Heart Curve', gen() { var n = 20; return { pins: circlePins(0.5,0.5,0.4,n,0), threads: [skipThread(0,n,9), skipThread(3,n,7)] }; } },
  { n: 'Mandala', gen() { var n = 24; return { pins: circlePins(0.5,0.5,0.4,n), threads: [skipThread(0,n,11), skipThread(3,n,7), skipThread(1,n,5)] }; } },
  { n: 'Snowflake', gen() { var n = 12; var pins = circlePins(0.5,0.5,0.38,n); return { pins: [[0.5,0.5]].concat(pins), threads: [{ c: 0, seq: [0,1,0,3,0,5,0,7,0,9,0,11] }, { c: 1, seq: [0,2,0,4,0,6,0,8,0,10,0,12] }, { c: 2, seq: [1,2,3,4,5,6,7,8,9,10,11,12,1] }] }; } },
  { n: 'Starburst', gen() { var n = 30; return { pins: circlePins(0.5,0.5,0.4,n), threads: [skipThread(0,n,13), skipThread(4,n,11), skipThread(1,n,7)] }; } },
  { n: 'Compass', gen() { var center = [[0.5,0.5]]; var ring1 = circlePins(0.5,0.5,0.25,8); var ring2 = circlePins(0.5,0.5,0.4,8); return { pins: center.concat(ring1).concat(ring2), threads: [{ c: 0, seq: [0,1,9,0,3,11,0,5,13,0,7,15] }, { c: 1, seq: [1,2,3,4,5,6,7,8,1] }, { c: 3, seq2: [9,10,11,12,13,14,15,16,9] }] }; } },
  { n: 'Concentric Bloom', gen() { var r1 = circlePins(0.5,0.5,0.2,12); var r2 = circlePins(0.5,0.5,0.4,12); return { pins: r1.concat(r2), threads: [{ c: 0, seq: [0,12,1,13,2,14,3,15,4,16,5,17,6,18,7,19,8,20,9,21,10,22,11,23,0] }, { c: 1, seq: [0,1,2,3,4,5,6,7,8,9,10,11,0] }, { c: 2, seq2: [12,13,14,15,16,17,18,19,20,21,22,23,12] }] }; } },
  { n: 'Wave', gen() { var n = 20; return { pins: circlePins(0.5,0.5,0.4,n), threads: [skipThread(0,n,8), skipThread(1,n,6), skipThread(2,n,4)] }; } },
  { n: 'Lotus', gen() { var n = 36; return { pins: circlePins(0.5,0.5,0.42,n), threads: [skipThread(0,n,17), skipThread(4,n,13), skipThread(3,n,9), skipThread(1,n,5)] }; } },
  { n: 'Kaleidoscope', gen() { var n = 40; return { pins: circlePins(0.5,0.5,0.42,n), threads: [skipThread(0,n,19), skipThread(2,n,15), skipThread(4,n,11), skipThread(1,n,7)] }; } },
  { n: 'Cathedral', gen() { var r1 = circlePins(0.5,0.5,0.18,16); var r2 = circlePins(0.5,0.5,0.42,16); var pins = r1.concat(r2); var rays = []; for (var i = 16; i < 32; i++) { rays.push([pins[i][0], pins[i][1], pins[(i+8)%16+16][0], pins[(i+8)%16+16][1]]); } return { pins: pins, threads: [skipThread(0,16,7), skipThread(1,16,5), { c: 2, seq: [0,16,2,18,4,20,6,22,8,24,10,26,12,28,14,30,0] }, { c: 3, rays: rays }] }; } },
  { n: 'Galaxy Swirl', gen() { var n = 48; return { pins: circlePins(0.5,0.5,0.43,n), threads: [skipThread(0,n,23), skipThread(3,n,17), skipThread(4,n,11), skipThread(1,n,7)] }; } },
  { n: 'Sacred Geometry', gen() { var r1 = circlePins(0.5,0.5,0.15,6); var r2 = circlePins(0.5,0.5,0.28,6,Math.PI/6); var r3 = circlePins(0.5,0.5,0.42,12); return { pins: r1.concat(r2).concat(r3), threads: [{ c: 0, seq: [0,1,2,3,4,5,0] }, { c: 0, seq2: [6,7,8,9,10,11,6] }, skipThread(1,12,5,12), skipThread(4,12,7,12), { c: 2, seq: [0,6,12,1,7,13,2,8,14,0] }] }; } },
  { n: 'Peacock', gen() { var n = 36; return { pins: circlePins(0.5,0.5,0.42,n), threads: [skipThread(0,n,13), skipThread(1,n,17), skipThread(2,n,11), skipThread(4,n,7)] }; } },
  { n: 'Rose Window', gen() { var n = 60; return { pins: circlePins(0.5,0.5,0.44,n), threads: [skipThread(0,n,29), skipThread(3,n,23), skipThread(4,n,17), skipThread(1,n,13), skipThread(2,n,7)] }; } },
  { n: 'Cosmic Web', gen() { var n = 60; return { pins: circlePins(0.5,0.5,0.44,n), threads: [skipThread(0,n,25), skipThread(4,n,19), skipThread(3,n,14), skipThread(1,n,11), skipThread(2,n,8)] }; } },
  { n: 'Sunburst Crown', gen() { var n = 48; var outer = circlePins(0.5,0.55,0.4,n,Math.PI/2); var s = [0]; for (var i = 0; i < n; i += 4) s.push(i+1, 0); return { pins: [[0.5,0.3]].concat(outer), threads: [skipThread(0,n,23), skipThread(4,n,17), skipThread(1,n,11), skipThread(2,n,7), { c: 3, seq: s }] }; } },
  { n: 'Infinity Knot', gen() { var n = 72; return { pins: circlePins(0.5,0.5,0.44,n), threads: [skipThread(0,n,31), skipThread(3,n,25), skipThread(4,n,19), skipThread(1,n,13), skipThread(2,n,11), skipThread(0,n,7)] }; } },
  { n: 'Phoenix Feather', gen() { var n = 48; return { pins: circlePins(0.5,0.5,0.44,n), threads: [skipThread(0,n,23), skipThread(4,n,17), skipThread(3,n,13), skipThread(1,n,9), skipThread(2,n,5)] }; } },
  { n: 'Grand Mandala', gen() { var r1 = circlePins(0.5,0.5,0.12,8); var r2 = circlePins(0.5,0.5,0.25,16); var r3 = circlePins(0.5,0.5,0.38,24); var r4 = circlePins(0.5,0.5,0.44,48); return { pins: r1.concat(r2).concat(r3).concat(r4), threads: [{ c: 0, seq: [0,1,2,3,4,5,6,7,0] }, skipThread(3,16,7,8), skipThread(4,24,11,24), skipThread(1,48,19,48), skipThread(2,48,13,48), skipThread(0,48,7,48)] }; } },
];

// expand with dedupe (the intended semantics — the P0 fix): per level, per color,
// pin-segments in thread order + ray count
function expand(li) {
  const raw = LEVELS[li].gen();
  const threads = [];
  raw.threads.forEach((t) => {
    const segs = []; const seen = {};
    const add = (a, b) => { const k = a < b ? a + '-' + b : b + '-' + a; if (seen[k]) return; seen[k] = 1; segs.push([a, b]); };
    if (t.seq) for (let i = 0; i < t.seq.length - 1; i++) add(t.seq[i], t.seq[i + 1]);
    if (t.seq2) for (let i = 0; i < t.seq2.length - 1; i++) add(t.seq2[i], t.seq2[i + 1]);
    let rays = 0;
    if (t.rays) t.rays.forEach((ray) => { const k = 'r' + ray.join(','); if (seen[k]) return; seen[k] = 1; rays++; });
    threads.push({ c: t.c, segs, rays });
  });
  const colors = {};
  threads.forEach((t) => { if (!colors[t.c]) colors[t.c] = { c: t.c, threads: [] }; colors[t.c].threads.push(t); });
  return { pins: raw.pins, byColor: Object.keys(colors).map(Number).sort((a, b) => a - b).map((c) => colors[c]) };
}
const EX = LEVELS.map((_, i) => expand(i));
const totalOf = (li) => EX[li].byColor.reduce((s, col) => s + col.threads.reduce((x, t) => x + t.segs.length + t.rays, 0), 0);

// sanity of the independent data itself: every level must have >0 segments,
// and the deduped totals must be <= raw totals (duplicates existed on L14/18/19/20/26/27/29)
{
  let ok = true, note = '';
  for (let i = 0; i < 30; i++) {
    if (totalOf(i) <= 0) { ok = false; note = 'L' + (i + 1) + ' empty'; break; }
    for (const col of EX[i].byColor) for (const t of col.threads)
      for (const [a, b] of t.segs) if (a >= EX[i].pins.length || b >= EX[i].pins.length) { ok = false; note = 'L' + (i + 1) + ' seg pin OOR'; }
  }
  T('data-integrity', ok, note);
}

// ---------- boot ----------
const g = bootGame('string-art', {});
const E = (id) => g.sandbox.document.getElementById(id);
const S = 480; // canvas.style.width from wrap.clientWidth in the harness
const pinXY = (li, i) => ({ x: EX[li].pins[i][0] * S, y: EX[li].pins[i][1] * S });
const tapPin = (li, i) => { const p = pinXY(li, i); const cv = E('canvas'); cv.dispatch('mousedown', { clientX: p.x, clientY: p.y, preventDefault() {} }); cv.dispatch('mouseup', { clientX: p.x, clientY: p.y, preventDefault() {} }); };
const countText = () => String(E('status-count').textContent);
const chips = () => E('palette').children;
const clickChip = (ci) => { const c = chips().find((ch) => String(ch.dataset.color) === String(ci)); if (c) c.dispatch('click', {}); return !!c; };
const toastShown = () => E('toast').classList.contains('show');
const progress = () => JSON.parse(g.sandbox.localStorage.getItem('stringArt_v1') || '{}');
const waitWin = () => { g.pump(40); return E('overlay').classList.contains('show'); };
const ovText = (el) => { let out = ''; const w = (n) => { if (n.textContent) out += n.textContent; (n.children || []).forEach(w); }; w(el); return out; };

T('boot-clean', g.loadErrors.length === 0, g.loadErrors.join('; ').slice(0, 200));
T('menu-shown', !E('menu-screen').classList.contains('hidden') && String(E('menu-stats').textContent) === '0 / 30 levels completed');
T('continue-label-fresh', String(E('continue-label').textContent) === 'Start Level 1');

// how-to overlay
E('btn-howto').dispatch('click', {});
T('howto-open', E('overlay').classList.contains('show') && ovText(E('overlay-content')).includes('How to Play'));
E('ov-close').dispatch('click', {});
T('howto-close', !E('overlay').classList.contains('show'));

// menu toggles
E('btn-sound').dispatch('click', {});
T('sound-off', String(E('btn-sound').textContent) === 'Sound: Off');
E('btn-sound').dispatch('click', {});
E('btn-music').dispatch('click', {});
T('music-off', String(E('btn-music').textContent) === 'Music: Off');
E('btn-music').dispatch('click', {});
T('toggles-restored', String(E('btn-sound').textContent) === 'Sound: On' && String(E('btn-music').textContent) === 'Music: On');

// ---------- L1 ----------
E('btn-continue').dispatch('click', {});
T('l1-start', !E('game-screen').classList.contains('hidden') && String(E('hdr-level').textContent) === 'Level 1: Heart' && chips().length === 1);
T('l1-count0', countText() === '0 / 8 strings', countText());
T('l1-toast-begin', toastShown());
tapPin(0, 0); // no color selected yet
T('tap-before-color-ignored', countText() === '0 / 8 strings');
E('btn-hint').dispatch('click', {}); // no color selected
T('hint-no-color-toast', toastShown());
clickChip(0);
T('color-selected', chips()[0].classList.contains('active') && String(E('status-hint').textContent) === 'Tapping Rose pins — 8 left');
for (let i = 0; i < 8; i++) tapPin(0, i);
T('l1-complete-count', countText() === '8 / 8 strings', countText());
T('l1-win', waitWin() && ovText(E('overlay-content')).includes('Heart Complete!'));
T('l1-3stars', ovText(E('overlay-content')).includes('★★★'));
T('l1-progress-saved', progress().l0 && progress().l0.stars === 3);

// ---------- L2 (hint x2 keeps 3 stars; wrong pin toast) ----------
E('ov-next').dispatch('click', {});
T('l2-start', String(E('hdr-level').textContent) === 'Level 2: Star' && countText() === '0 / 5 strings');
clickChip(0);
E('btn-hint').dispatch('click', {});
T('hint-toast', toastShown() && String(E('toast').textContent) === 'Follow the golden glow!');
E('btn-hint').dispatch('click', {});
tapPin(1, 1); // pin 1 is not in any Star segment
T('wrong-pin-toast', toastShown() && String(E('toast').textContent).includes('Not part of this color'));
T('wrong-pin-noop', countText() === '0 / 5 strings');
for (let i = 0; i < 5; i++) tapPin(1, [0, 2, 4, 6, 8][i]);
T('l2-win', waitWin());
T('l2-2hints-3stars', ovText(E('overlay-content')).includes('★★★') && progress().l1 && progress().l1.stars === 3);

// ---------- menu / stats / level select ----------
E('ov-menu').dispatch('click', {});
T('menu-stats-2', String(E('menu-stats').textContent) === '2 / 30 levels completed');
T('continue-label-l3', String(E('continue-label').textContent) === 'Level 3: Diamond');
E('btn-levels').dispatch('click', {});
T('level-select-open', !E('level-select').classList.contains('hidden'));
const cells = E('level-select').querySelectorAll('.ls-cell');
T('cells-30', cells.length === 30);
T('cells-completed', cells[0].classList.contains('completed') && cells[1].classList.contains('completed') && !cells[3].classList.contains('completed'));
T('cells-locked-onclickless', typeof cells[3].onclick !== 'function' && typeof cells[29].onclick !== 'function' && typeof cells[2].onclick === 'function');
cells[3].dispatch('click', {}); // locked L4
T('locked-cell-inert', !E('level-select').classList.contains('hidden') && E('game-screen').classList.contains('hidden'));
cells[2].dispatch('click', {}); // L3
T('select-plays-l3', String(E('hdr-level').textContent) === 'Level 3: Diamond');

// ---------- L3: drag, undo, reset ----------
clickChip(0);
{ // drag-to-thread: mousedown places (0,1), mousemove to pin 2 places (2,3)
  const a = pinXY(2, 0), b = pinXY(2, 2), cv = E('canvas');
  cv.dispatch('mousedown', { clientX: a.x, clientY: a.y, preventDefault() {} });
  cv.dispatch('mousemove', { clientX: b.x, clientY: b.y, preventDefault() {} });
  cv.dispatch('mouseup', { clientX: b.x, clientY: b.y, preventDefault() {} });
}
T('drag-places-2', countText() === '2 / 4 strings', countText());
E('btn-undo').dispatch('click', {});
T('undo-1', countText() === '1 / 4 strings');
E('btn-undo').dispatch('click', {});
E('btn-undo').dispatch('click', {});
T('undo-empty-toast', toastShown() && String(E('toast').textContent) === 'Nothing to undo');
E('btn-reset').dispatch('click', {});
T('reset-clears', countText() === '0 / 4 strings');
clickChip(0); // reset deselects the color
for (let i = 0; i < 4; i++) tapPin(2, i);
T('l3-win', waitWin());
E('ov-next').dispatch('click', {});

// ---------- L4: far-tap ignored ----------
T('l4-start', String(E('hdr-level').textContent) === 'Level 4: Triangle');
clickChip(0);
E('canvas').dispatch('mousedown', { clientX: 5, clientY: 5, preventDefault() {} });
E('canvas').dispatch('mouseup', { clientX: 5, clientY: 5, preventDefault() {} });
T('far-tap-ignored', countText() === '0 / 3 strings');
for (let i = 0; i < 3; i++) tapPin(3, i);
T('l4-win', waitWin());
E('ov-next').dispatch('click', {});

// ---------- L5 -> L6 (multi-color + done toast + auto-advance) ----------
clickChip(0); // L5 has one color — must select before taps register
for (let i = 0; i < 12; i++) tapPin(4, (i * 5) % 12);
T('l5-win', waitWin(), countText());
E('ov-next').dispatch('click', {});
T('l6-2chips', chips().length === 2);
clickChip(1); // second color first
T('l6-c1-selected', String(E('status-hint').textContent) === 'Tapping Mint pins — 4 left');
for (let i = 0; i < 4; i++) tapPin(5, [1, 3, 5, 7][i]);
T('l6-c1-done', chips().find((c) => String(c.dataset.color) === '1').classList.contains('done'));
clickChip(1); // click the done chip
T('done-color-toast', toastShown() && String(E('toast').textContent) === 'This color is complete!');
T('l6-auto-advanced', chips().find((c) => String(c.dataset.color) === '0').classList.contains('active') && String(E('status-hint').textContent) === 'Tapping Rose pins — 4 left');
for (let i = 0; i < 4; i++) tapPin(5, [0, 2, 4, 6][i]);
T('l6-win', waitWin());
E('ov-next').dispatch('click', {});

// ---------- generic sweep L7..L30 with special cases ----------
function playLevel(li) { // select colors in order; taps per thread; rays via one extra tap
  const cols = EX[li].byColor;
  for (const col of cols) {
    if (!clickChip(col.c)) return false;
    for (const t of col.threads) for (const seg of t.segs) tapPin(li, seg[0]);
    if (col.threads.some((t) => t.rays > 0)) tapPin(li, 0); // fallback auto-places ALL rays
  }
  return true;
}
let sweepOk = true;
for (let li = 6; li < 30 && sweepOk; li++) {
  const want = totalOf(li) + ' / ' + totalOf(li) + ' strings';
  if (li === 7) { // visibilitychange mid-level, then resume
    g.sandbox.document.hidden = true;
    g.sandbox.document.dispatch('visibilitychange', {});
    g.pump(3);
    g.sandbox.document.hidden = false;
    g.sandbox.document.dispatch('visibilitychange', {});
    g.pump(3);
  }
  if (li === 8) { // menu escape mid-level, then Continue resumes at L9
    clickChip(EX[8].byColor[0].c);
    E('btn-menu').dispatch('click', {});
    if (!(String(E('menu-stats').textContent) === '8 / 30 levels completed' && String(E('continue-label').textContent) === 'Level 9: Tree')) { T('menu-escape-l9', false, E('menu-stats').textContent + '|' + E('continue-label').textContent); sweepOk = false; break; }
    E('btn-continue').dispatch('click', {});
    if (String(E('hdr-level').textContent) !== 'Level 9: Tree') { T('continue-resumes-l9', false, E('hdr-level').textContent); sweepOk = false; break; }
  }
  if (li === 10) { // 3 hints => star downgrade to 2
    clickChip(EX[10].byColor[0].c);
    E('btn-hint').dispatch('click', {}); E('btn-hint').dispatch('click', {}); E('btn-hint').dispatch('click', {});
  }
  if (li === 9) { // L10 Sun: rays place all-at-once — check the jump explicitly
    playLevel(9);
    if (countText() !== '25 / 25 strings') { T('l10-rays-autoplace', false, countText()); sweepOk = false; break; }
  } else if (!playLevel(li)) {
    T('sweep-chip-' + (li + 1), false, 'chip missing'); sweepOk = false; break;
  }
  if (countText() !== want) { T('sweep-count-' + (li + 1), false, countText() + ' want ' + want); sweepOk = false; break; }
  if (!waitWin()) { T('sweep-win-' + (li + 1), false, 'overlay not shown'); sweepOk = false; break; }
  if (li === 10) {
    if (!(progress().l10 && progress().l10.stars === 2)) { T('l11-3hints-2stars', false, JSON.stringify(progress().l10)); sweepOk = false; break; }
    T('l11-3hints-2stars', true);
  } else if (!(progress()['l' + li] && progress()['l' + li].stars === 3)) {
    T('sweep-stars-' + (li + 1), false, JSON.stringify(progress()['l' + li])); sweepOk = false; break;
  }
  if (li < 29) E('ov-next').dispatch('click', {});
  else { E('ov-menu').dispatch('click', {}); } // L30: "All Levels Complete!"
}
T('sweep-30-done', sweepOk && String(E('menu-stats').textContent) === '30 / 30 levels completed', E('menu-stats').textContent);

// ---------- persistence reload + partial-progress locking ----------
{
  const g2 = bootGame('string-art', { seedLS: { stringArt_v1: g.sandbox.localStorage.getItem('stringArt_v1') } });
  const e2 = (id) => g2.sandbox.document.getElementById(id);
  T('reload-full-progress', String(e2('menu-stats').textContent) === '30 / 30 levels completed' && String(e2('continue-label').textContent) === 'Level 30: Grand Mandala');
  const g3 = bootGame('string-art', { seedLS: { stringArt_v1: JSON.stringify({ l0: { stars: 3, time: 10 }, l1: { stars: 2, time: 20 } }) } });
  const e3 = (id) => g3.sandbox.document.getElementById(id);
  T('reload-partial-stats', String(e3('menu-stats').textContent) === '2 / 30 levels completed');
  e3('btn-levels').dispatch('click', {});
  const c3 = e3('level-select').querySelectorAll('.ls-cell');
  const starsOf = (cell) => { const st = (cell.children || []).find((n) => n.classList && n.classList.contains('ls-stars')); return st ? String(st.textContent) : ''; };
  T('partial-locking', typeof c3[3].onclick !== 'function' && typeof c3[2].onclick === 'function' && starsOf(c3[0]) === '★★★' && starsOf(c3[1]) === '★★');
  c3[3].dispatch('click', {});
  T('partial-locked-inert', !e3('level-select').classList.contains('hidden'));
}

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok).map((r) => r.name);
console.log('string-art: 30/30 levels completed via real canvas taps/drags with independently replicated geometry: ' + (fails.length ? 'FAIL' : 'PASS'));
console.log(JSON.stringify({ pass, fail: fails.length, total: results.length, verdict: fails.length ? 'FAIL' : 'PASS', fails, extra: { durS: ((Date.now() - t0) / 1000).toFixed(1), fixes: 'P0-1: 7 levels (L14/18/19/20/26/27/29) unwinnable — spoke seqs and gcd(skip,n)>1 skip-threads repeat their own pairs (a,b)/(b,a); isSegmentPlaced matches unordered so repeats were never placeable (L14 gated L15+, 17 levels unreachable) — fixed by deduping segments at expand. P0-2: L10 center was the flat coord [0.5,0.5], splicing two numbers into the pin list: pins 0/1 NaN-untappable, segs (0,1)/(8,0) unplaceable — nested to a real center pin. P0-3: skipThread had no ring offset — all multi-ring curves drew over pins 0..N-1 and L30 was 191/192-unwinnable (same-color pair {7,0}vs{0,7}); added offset param, L23/L30 rings corrected. P2: circlePins `startAngle||default` treated L12\'s explicit 0 as falsy, rotating the artwork 90°. Elapsed-time star tiers (>180s) not exercised in harness; hint-downgrade tier is.' } }));
process.exit(fails.length ? 1 : 0);
