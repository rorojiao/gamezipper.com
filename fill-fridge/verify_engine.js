// fill-fridge engine verifier — vm harness, real input paths only.
// Win path: canvas pointerdown on a staging item -> pointermove over the
// fridge (snapToGrid ghost) -> pointerup (canPlace -> placeItem) for EVERY
// item -> items.every(placed) -> 200ms + 800ms timers -> showComplete.
// Placements come from an offline exact-cover packer over the same SHAPES /
// LEVELS tables parsed from index.html, replayed through real pointer events.
// Geometry (cellSize, fridge origin, staging boxes) is mirrored from
// resizeCanvas()/getStagingPositions() and validated against the live canvas
// dimensions before use.
//
// P2 fixed (tier/star scaling): stars and difficulty labels were fill-ratio
// based, but the ratio is a per-level constant capped at .667 across all 20
// levels — under the .75 three-star bound NO level could award 3 stars (the
// FAQ-advertised "+1 hint per 3-star level" was unreachable) and labels read
// Medium/Easy only, contradicting the authored comments (L6 Medium, L11
// Hard, L16 Expert). Now index-tiered: L1-5 Easy/1*, L6-10 Medium/2*,
// L11-15 Hard/3*, L16-20 Expert/3*.
'use strict';
const path = require('path');
const harness = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + detail : '')); }
}
function errs(g) { return (g.loadErrors || []).concat(g.sandbox.__errors || []); }
function el(g, id) { return g.els[id]; }
function click(g, id) { el(g, id).dispatch('click', { type: 'click', preventDefault() {} }); }
function hidden(g, id) { return el(g, id).classList.contains('hidden'); }

// ---------- parse SHAPES + LEVELS from source (single source of truth) ----------
const SRC = require('fs').readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const SHAPES = {};
{
  const sm = SRC.match(/const SHAPES=\{([\s\S]*?)\n\};/)[1];
  for (const m of sm.matchAll(/\n  (\w+):\[((?:\[\d+,\d+\],?)+)\]/g)) {
    SHAPES[m[1]] = m[2].split('],[').map(s => s.replace(/[\[\]]/g, '').split(',').map(Number));
  }
}
const DEFS = [...SRC.matchAll(/makeLevel\((\d+),(\d+),\[\s*([\s\S]*?)\]\)/g)].map(m => ({
  cols: +m[1], rows: +m[2], items: [...m[3].matchAll(/\['(\w+)'\]/g)].map(x => x[1]),
}));
ck('defs: 20 levels parsed', DEFS.length === 20, String(DEFS.length));
ck('defs: 24 shapes parsed', Object.keys(SHAPES).length === 24, String(Object.keys(SHAPES).length));
function tierOf(num) { return num <= 5 ? 1 : num <= 10 ? 2 : num <= 15 ? 3 : 4; }
function starsOf(num) { const t = tierOf(num); return t === 4 ? 3 : t; }

// ---------- exact-cover packer (first-empty-cell + same-shape dedup) ----------
function packLevel(def) {
  const { cols, rows } = def;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const items = def.items.map((s, i) => ({ s, cells: SHAPES[s], id: i }));
  items.sort((a, b) => b.cells.length - a.cells.length);
  const placements = [];
  let nodes = 0;
  const firstEmpty = () => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] < 0) return [r, c]; return null; };
  function rec(idx) {
    if (idx >= items.length) return true;
    if (++nodes > 3e6) return false;
    const fe = firstEmpty();
    if (!fe) return true;
    const [R, C] = fe;
    for (let k = idx; k < items.length; k++) {
      const it = items[k];
      let dup = false;
      for (let j = idx; j < k; j++) if (items[j].s === it.s) { dup = true; break; }
      if (dup) continue;
      for (const [dr, dc] of it.cells) {
        const r0 = R - dr, c0 = C - dc;
        if (r0 < 0 || c0 < 0) continue;
        let ok = true;
        for (const [ar, ac] of it.cells) {
          const r = r0 + ar, c = c0 + ac;
          if (r >= rows || c >= cols || grid[r][c] >= 0) { ok = false; break; }
        }
        if (!ok) continue;
        for (const [ar, ac] of it.cells) grid[r0 + ar][c0 + ac] = it.id;
        [items[idx], items[k]] = [items[k], items[idx]];
        placements.push({ id: it.id, r0, c0 });
        if (rec(idx + 1)) return true;
        placements.pop();
        [items[idx], items[k]] = [items[k], items[idx]];
        for (const [ar, ac] of it.cells) grid[r0 + ar][c0 + ac] = -1;
      }
    }
    return false;
  }
  const ok = rec(0);
  return ok ? placements : null;
}
const SOLUTIONS = DEFS.map(packLevel);
ck('packer: all 20 levels solvable', SOLUTIONS.every(s => s !== null),
  SOLUTIONS.map((s, i) => s ? '' : (i + 1)).filter(Boolean).join(',') + ' unsolvable');

// ---------- engine geometry mirror ----------
function geom(g, def) {
  const vw = g.call('window.innerWidth'), vh = g.call('window.innerHeight');
  ck('geom: viewport finite', Number.isFinite(vw) && Number.isFinite(vh), vw + 'x' + vh);
  const wrapW = el(g, 'canvas-wrap').getBoundingClientRect().width;
  const maxW = Math.min(wrapW, 520);
  const availH = Math.max(300, vh - 200);
  const cs = Math.min(Math.floor((maxW - 24) / def.cols), Math.floor((availH - 40) / (def.rows + 3)), 100);
  const canvasW = maxW;
  const fridgeX = (canvasW - cs * def.cols) / 2;
  const stagingY = 10 + cs * def.rows + 20;
  return { cs, canvasW, fridgeX, fridgeY: 10, stagingY };
}
function assertGeom(g, def, G) {
  const cv = el(g, 'game-canvas');
  const stagingRows = Math.max(2, Math.ceil(def.items.length / 4));
  const expectH = G.stagingY + stagingRows * (G.cs * 1.5) + 20 + 10;
  ck('geom: canvas dims match mirror', cv.width === G.canvasW && Math.abs(cv.height - expectH) < 2,
    cv.width + 'x' + cv.height + ' vs ' + G.canvasW + 'x' + expectH);
}
function stagingBox(G, shape) { // mirror getStagingPositions for one item
  const cs = G.cs, W = G.canvasW;
  const maxPerRow = Math.max(3, Math.floor((W - 20) / (cs * 2.5)));
  const gap = 8, itemW = cs * 2;
  return { maxPerRow, gap, itemW, cs, W };
}
// drag item (by original def index) from staging to grid anchor (r0,c0)
function dragPlace(g, G, def, itemId, unplacedOrder, r0, c0, expectPlace) {
  const idx = unplacedOrder.indexOf(itemId);
  if (idx < 0) { ck('drag: item in staging', false, 'id ' + itemId); return; }
  const { maxPerRow, gap, itemW, cs, W } = stagingBox(G, def.items[itemId]);
  const row = Math.floor(idx / maxPerRow), col = idx % maxPerRow;
  const rowCount = Math.min(unplacedOrder.length - row * maxPerRow, maxPerRow);
  const rowStartX = (W - (rowCount * (itemW + gap) - gap)) / 2;
  const x = rowStartX + col * (itemW + gap);
  let maxR = 0, maxC = 0;
  for (const [r, c] of SHAPES[def.items[itemId]]) { maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); }
  const iw = (maxC + 1) * cs * .55, ih = (maxR + 1) * cs * .55;
  const y = G.stagingY + row * (cs * 2 + gap) + (cs * 1.5 - ih) / 2;
  const cv = el(g, 'game-canvas');
  const ev = (x2, y2) => ({ clientX: x2, clientY: y2, pointerId: 1, button: 0, preventDefault() {} });
  cv.dispatch('pointerdown', Object.assign({ type: 'pointerdown' }, ev(x + iw / 2, y + ih / 2)));
  // snapToGrid does Math.round((px-fridgeX)/cs) on the POINTER position to get the
  // TOP-LEFT anchor cell — targeting the cell CENTER (c0+0.5) rounds HALF-UP to
  // c0+1 (observed: pointer at (2.5,1.5) -> ghost 3,2). Aim at anchor+0.3 cell so
  // the round lands exactly on (c0,r0).
  const tx = G.fridgeX + (c0 + 0.3) * cs, ty = G.fridgeY + (r0 + 0.3) * cs;
  cv.dispatch('pointermove', Object.assign({ type: 'pointermove' }, ev(tx, ty)));
  cv.dispatch('pointerup', Object.assign({ type: 'pointerup' }, ev(tx, ty)));
  g.pump(3);
  if (expectPlace !== undefined) {
    const placed = def.items.length - unplacedOrder.filter(id => unplacedOrder.indexOf(id) >= 0).length; // informational only
    void placed;
  }
}
// drop the item but release OUTSIDE the fridge (no ghost) -> nothing placed
function dragDropOutside(g, G, def, itemId, unplacedOrder) {
  const idx = unplacedOrder.indexOf(itemId);
  const { maxPerRow, gap, itemW, cs, W } = stagingBox(G, def.items[itemId]);
  const row = Math.floor(idx / maxPerRow), col = idx % maxPerRow;
  const rowCount = Math.min(unplacedOrder.length - row * maxPerRow, maxPerRow);
  const rowStartX = (W - (rowCount * (itemW + gap) - gap)) / 2;
  const x = rowStartX + col * (itemW + gap);
  let maxR = 0, maxC = 0;
  for (const [r, c] of SHAPES[def.items[itemId]]) { maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); }
  const iw = (maxC + 1) * cs * .55, ih = (maxR + 1) * cs * .55;
  const y = G.stagingY + row * (cs * 2 + gap) + (cs * 1.5 - ih) / 2;
  const cv = el(g, 'game-canvas');
  const ev = (x2, y2) => ({ clientX: x2, clientY: y2, pointerId: 1, preventDefault() {} });
  cv.dispatch('pointerdown', Object.assign({ type: 'pointerdown' }, ev(x + iw / 2, y + ih / 2)));
  const ry = G.stagingY + 4; // release back over staging — outside fridge bounds
  cv.dispatch('pointermove', Object.assign({ type: 'pointermove' }, ev(x + iw / 2, ry)));
  cv.dispatch('pointerup', Object.assign({ type: 'pointerup' }, ev(x + iw / 2, ry)));
  g.pump(3);
}

// solve level num (1-based) whose game screen is already active; returns stars won
function solveLevel(g, num) {
  const def = DEFS[num - 1];
  const sol = SOLUTIONS[num - 1];
  const G = geom(g, def);
  assertGeom(g, def, G);
  const unplaced = def.items.map((_, i) => i);
  for (const p of sol) {
    dragPlace(g, G, def, p.id, unplaced, p.r0, p.c0);
    unplaced.splice(unplaced.indexOf(p.id), 1);
  }
  g.pump(75); // 200ms + 800ms win chain
  const stars = starsOf(num);
  const sv = JSON.parse(g.ls.getItem('fillfridge_save_v1'));
  ck('L' + num + ': overlay shown', !hidden(g, 'complete-overlay'));
  ck('L' + num + ': result text', el(g, 'result-score').textContent === 'Level ' + num + ' Complete!', el(g, 'result-score').textContent);
  ck('L' + num + ': ' + stars + ' stars', el(g, 'result-stars').children.filter(s => String(s.className).indexOf('filled') >= 0).length === stars);
  ck('L' + num + ': saved', sv.levels[num] && sv.levels[num].completed === true && sv.levels[num].stars === stars, JSON.stringify(sv.levels[num]));
  ck('L' + num + ': item count full', el(g, 'item-count').textContent === def.items.length + '/' + def.items.length, el(g, 'item-count').textContent);
  ck('L' + num + ': finalScore', g.call('window.finalScore') === stars, String(g.call('window.finalScore')));
  return stars;
}

// ---------- boot 1 ----------
const g = harness.bootGame('fill-fridge');
ck('boot: no load errors', errs(g).length === 0, errs(g).join(' | '));
ck('boot: title shown', !hidden(g, 'title-screen') && hidden(g, 'game-screen') && hidden(g, 'level-screen'));

click(g, 'btn-how');
ck('how: shown', !hidden(g, 'how-screen') && hidden(g, 'title-screen'));
click(g, 'btn-how-back');
ck('how: back to title', !hidden(g, 'title-screen'));

click(g, 'btn-play');
ck('levelsel: shown', !hidden(g, 'level-screen'));
ck('levelsel: 20 buttons', el(g, 'level-grid').children.length === 20, String(el(g, 'level-grid').children.length));
ck('levelsel: L1 enabled+current', !el(g, 'level-grid').children[0].disabled && el(g, 'level-grid').children[0].classList.contains('current'));
ck('levelsel: L2 locked', el(g, 'level-grid').children[1].disabled === true);
ck('levelsel: L20 locked', el(g, 'level-grid').children[19].disabled === true);
ck('levelsel: progress 0%', el(g, 'progress-fill').style.width === '0%', el(g, 'progress-fill').style.width);
click(g, 'level-grid'); // container click does nothing
el(g, 'level-grid').children[1].dispatch('click', { type: 'click', preventDefault() {} }); // locked L2
ck('levelsel: locked click ignored', hidden(g, 'game-screen'));

el(g, 'level-grid').children[0].dispatch('click', { type: 'click', preventDefault() {} });
ck('L1: game screen', !hidden(g, 'game-screen') && hidden(g, 'level-screen'));
ck('L1: title', el(g, 'level-title').textContent === 'Level 1', el(g, 'level-title').textContent);
ck('L1: item count 0/8', el(g, 'item-count').textContent === '0/8', el(g, 'item-count').textContent);
ck('L1: hints 9', el(g, 'hint-count').textContent === '(9)', el(g, 'hint-count').textContent);

click(g, 'sound-toggle');
ck('sound: off', el(g, 'sound-toggle').textContent === 'Sound: OFF');
click(g, 'sound-toggle');
ck('sound: on', el(g, 'sound-toggle').textContent === 'Sound: ON');

// L1 mechanics detour
{
  const def = DEFS[0], G = geom(g, def);
  assertGeom(g, def, G);
  const sol = SOLUTIONS[0];
  const unplaced = def.items.map((_, i) => i);
  // 1. drop outside fridge -> not placed
  dragDropOutside(g, G, def, unplaced[0], unplaced);
  ck('L1: outside drop places nothing', el(g, 'item-count').textContent === '0/8', el(g, 'item-count').textContent);
  // 2. place + undo + re-place
  const p0 = sol.find(x => x.id === unplaced[0]);
  dragPlace(g, G, def, p0.id, unplaced, p0.r0, p0.c0);
  unplaced.splice(unplaced.indexOf(p0.id), 1);
  ck('L1: placed 1/8', el(g, 'item-count').textContent === '1/8', el(g, 'item-count').textContent);
  click(g, 'btn-undo');
  ck('L1: undo -> 0/8', el(g, 'item-count').textContent === '0/8', el(g, 'item-count').textContent);
  unplaced.push(p0.id); unplaced.sort((a, b) => a - b);
  dragPlace(g, G, def, p0.id, unplaced, p0.r0, p0.c0);
  unplaced.splice(unplaced.indexOf(p0.id), 1);
  ck('L1: re-placed 1/8', el(g, 'item-count').textContent === '1/8', el(g, 'item-count').textContent);
  // 3. invalid drop: second item on an overlapping anchor -> rejected
  const p1 = sol.find(x => x.id === unplaced[0]);
  dragPlace(g, G, def, p1.id, unplaced, p0.r0, p0.c0); // same anchor as placed item
  const cnt = el(g, 'item-count').textContent;
  ck('L1: invalid overlap rejected or valid elsewhere', cnt === '1/8' || cnt === '2/8', cnt);
  if (cnt === '2/8') { // happened to fit elsewhere via clamp — undo it to keep state deterministic
    click(g, 'btn-undo');
    unplaced.push(p1.id); unplaced.sort((a, b) => a - b);
  }
  // 4. hint
  click(g, 'btn-hint');
  ck('L1: hint consumed', el(g, 'hint-count').textContent === '(8)', el(g, 'hint-count').textContent);
  // 5. shuffle unplaces everything (order randomizes -> restart for clean state)
  click(g, 'btn-shuffle');
  ck('L1: shuffle unplaces all', el(g, 'item-count').textContent === '0/8', el(g, 'item-count').textContent);
  click(g, 'btn-restart');
  ck('L1: restart fresh', el(g, 'item-count').textContent === '0/8' && el(g, 'level-title').textContent === 'Level 1');
}
solveLevel(g, 1);

// mid-run: back to level select, then chain L2..L20
click(g, 'btn-back');
ck('detour: level screen', !hidden(g, 'level-screen'));
ck('detour: L2 current', el(g, 'level-grid').children[1].classList.contains('current'));
ck('detour: progress 5%', el(g, 'progress-fill').style.width === '5%', el(g, 'progress-fill').style.width);
ck('detour: L1 stars shown', el(g, 'level-grid').children[0].innerHTML.indexOf('*oo') >= 0, el(g, 'level-grid').children[0].innerHTML);
ck('detour: L1 Easy label', el(g, 'level-grid').children[0].innerHTML.indexOf('Easy') >= 0);
ck('detour: L11 Hard label (tier)', el(g, 'level-grid').children[10].innerHTML.indexOf('Hard') >= 0, el(g, 'level-grid').children[10].innerHTML);
ck('detour: L16 Expert label (tier)', el(g, 'level-grid').children[15].innerHTML.indexOf('Expert') >= 0, el(g, 'level-grid').children[15].innerHTML);
el(g, 'level-grid').children[1].dispatch('click', { type: 'click', preventDefault() {} });
ck('detour: L2 started', el(g, 'level-title').textContent === 'Level 2', el(g, 'level-title').textContent);
solveLevel(g, 2);

let hints = 9 - 1; // one hint used on L1
let threeStars = 0;
for (let num = 3; num <= 20; num++) {
  click(g, 'btn-next');
  ck('L' + num + ': started', el(g, 'level-title').textContent === 'Level ' + num, el(g, 'level-title').textContent);
  // hint-count is refreshed only by startLevel, so check it at level START:
  // at L{num} start it reflects 9 - used + all 3-star bonuses through L{num-1}
  ck('L' + num + ': hint economy (' + hints + ')', el(g, 'hint-count').textContent === '(' + hints + ')', el(g, 'hint-count').textContent);
  const st = solveLevel(g, num);
  if (st === 3) threeStars++;
  hints += st === 3 ? 1 : 0;
  if (num === 5) { // after L5: level-select detour, re-enter at L6
    click(g, 'btn-levels');
    ck('detour2: level screen + 25%', !hidden(g, 'level-screen') && el(g, 'progress-fill').style.width === '25%', el(g, 'progress-fill').style.width);
    ck('detour2: L6 unlocked+current', !el(g, 'level-grid').children[5].disabled && el(g, 'level-grid').children[5].classList.contains('current'));
    el(g, 'level-grid').children[5].dispatch('click', { type: 'click', preventDefault() {} });
    ck('detour2: L6 started', el(g, 'level-title').textContent === 'Level 6', el(g, 'level-title').textContent);
    ck('detour2: hint economy (' + hints + ')', el(g, 'hint-count').textContent === '(' + hints + ')', el(g, 'hint-count').textContent);
    const st6 = solveLevel(g, 6);
    if (st6 === 3) threeStars++;
    hints += st6 === 3 ? 1 : 0;
    num++; // L6 done here
  }
}
// after L20 (loop ended at num=20 with its solve): next -> level select
ck('end: overlay visible', !hidden(g, 'complete-overlay'));
click(g, 'btn-next');
ck('end: level screen 100%', !hidden(g, 'level-screen') && el(g, 'progress-fill').style.width === '100%', el(g, 'progress-fill').style.width);
ck('end: all unlocked', Array.from(el(g, 'level-grid').children).every(b => !b.disabled));
const svEnd = JSON.parse(g.ls.getItem('fillfridge_save_v1'));
ck('end: 20 completed in LS', Object.keys(svEnd.levels).length === 20, String(Object.keys(svEnd.levels).length));
ck('end: hints total ' + hints, svEnd.hints === hints, String(svEnd.hints));
ck('end: no load errors', errs(g).length === 0, errs(g).join(' | '));

// reset flow: cancel first, then confirm
click(g, 'btn-reset-progress');
ck('reset: confirm shown', !hidden(g, 'reset-overlay'));
click(g, 'btn-reset-no');
ck('reset: cancel keeps progress', hidden(g, 'reset-overlay') && el(g, 'progress-fill').style.width === '100%');
click(g, 'btn-reset-progress');
click(g, 'btn-reset-yes');
const svReset = JSON.parse(g.ls.getItem('fillfridge_save_v1'));
ck('reset: LS wiped, hints 9', Object.keys(svReset.levels).length === 0 && svReset.hints === 9, JSON.stringify(svReset));
ck('reset: L2 locked again', el(g, 'level-grid').children[1].disabled === true);
ck('reset: progress 0%', el(g, 'progress-fill').style.width === '0%');

// ---------- boot 2: returning player ----------
const seed = { fillfridge_save_v1: JSON.stringify({ v: 1, levels: { 1: { completed: true, stars: 1 }, 2: { completed: true, stars: 2 } }, hints: 7, best: {} }) };
const g2 = harness.bootGame('fill-fridge', { seedLS: seed });
ck('boot2: no load errors', errs(g2).length === 0, errs(g2).join(' | '));
click(g2, 'btn-play');
ck('boot2: L3 frontier current+enabled', !el(g2, 'level-grid').children[2].disabled && el(g2, 'level-grid').children[2].classList.contains('current'));
ck('boot2: L4 locked', el(g2, 'level-grid').children[3].disabled === true);
ck('boot2: saved stars rendered', el(g2, 'level-grid').children[0].innerHTML.indexOf('*oo') >= 0 && el(g2, 'level-grid').children[1].innerHTML.indexOf('**o') >= 0);
el(g2, 'level-grid').children[2].dispatch('click', { type: 'click', preventDefault() {} });
ck('boot2: hints carried (7)', el(g2, 'hint-count').textContent === '(7)', el(g2, 'hint-count').textContent);
ck('boot2: L3 board live', el(g2, 'item-count').textContent === '0/9', el(g2, 'item-count').textContent);
click(g2, 'btn-back');
ck('boot2: back out clean', !hidden(g2, 'level-screen'));

// ---------- summary ----------
const extra = { levels: 20, allSolvable: SOLUTIONS.every(s => s !== null), fixes: 'P2 tier/star rescale (3* unreachable on every level, difficulty labels contradicted authored tiers)' };
console.log(JSON.stringify({ pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra }));
process.exit(fail === 0 ? 0 : 1);
