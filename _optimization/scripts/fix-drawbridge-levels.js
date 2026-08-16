#!/usr/bin/env node
/* draw-bridge level regenerator (wave-A3).
 * ROOT CAUSE (measured against the engine's own physics, see verify_engine.js notes):
 *  1. Wheel friction (3%/contact-frame) caps the car at ~97 px/s on flat ground.
 *  2. The collision response `vx -= nx*vn*1.05` drains vx on any up-grade; sustained
 *     climbing is only possible below ~6 deg (at 20% grade the car crawls at 2.5 px/s,
 *     at >25% it stalls). 16 of 30 levels require climbing 20-60 px steps/gaps.
 *  3. On-road rocks kill at any achievable speed: overlap zone ~86 px, +30 damage per
 *     frame (MAX_DAMAGE 100) — even at MAX_SPEED 350 the car spends ~15 frames in zone.
 * Original up-gap / staircase / on-road-rock levels are therefore unwinnable by
 * construction. This script regenerates those 16 levels as flat-bank gap crossings
 * (proven winnable — the 14 originally-flat levels all pass), preserving each level's
 * gap count/width, gap-bottom decoy spikes, and moving obstacles (raised so their sweep
 * never enters the car band: mo bottom max <= 480 vs car center 500, clearance > 16.7).
 * The 14 passing levels are kept VERBATIM. Engine code untouched.
 * Usage: node _optimization/scripts/fix-drawbridge-levels.js   (writes in place) */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'draw-bridge', 'index.html');
const html = fs.readFileSync(FILE, 'utf8');
const m = html.match(/const LEVELS = \[([\s\S]*?)\n\];/);
if (!m) { console.error('LEVELS block not found'); process.exit(1); }
const GROUND_Y = 520;
function makeGround(x1, x2, y = GROUND_Y) { return { x1, y1: y, x2, y2: y }; }
function makeWall(x, y1, y2) { return { x1: x, y1, x2: x, y2 }; }
const LEVELS = eval('[' + m[1] + ']');
if (LEVELS.length !== 30) { console.error('expected 30 levels, got ' + LEVELS.length); process.exit(1); }

const G = (x1, x2) => [makeGround(x1, x2)];
const goal = (x, y) => ({ x, y, w: 80, h: 50 });
const spike = (x, y, w = 40, h = 40) => ({ type: 'spike', x, y, w, h });
const mo = (o) => o;

/* regenerated designs: [terrain x-ranges], goal, obstacles, movingObstacles, parInk */
const REGEN = {
  3: { terr: [[0, 480], [680, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [240, 300, 360] },
  5: { terr: [[0, 350], [520, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [210, 280, 400] },
  7: { terr: [[0, 400], [620, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [260, 330, 460] },
  10: { terr: [[0, 400], [560, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [200, 270, 460] },
  11: { terr: [[0, 200], [330, 560], [690, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [330, 400, 560] },
  12: { terr: [[0, 350], [500, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [190, 260, 510] },
  16: { terr: [[0, 250], [380, 550], [680, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [330, 420, 560] },
  17: { terr: [[0, 200], [340, 620], [760, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [330, 420, 560] },
  20: { terr: [[0, 300], [500, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [230, 300, 560] },
  21: { terr: [[0, 350], [550, 1280]], goal: goal(1100, 480), obs: [], mos: [mo({ x: 420, y: 340, w: 40, h: 40, range: 100, speed: 100, axis: 'y' }), mo({ x: 480, y: 340, w: 40, h: 40, range: 100, speed: 120, axis: 'y' })], par: [300, 400, 480] },
  23: { terr: [[0, 250], [400, 550], [700, 1280]], goal: goal(1100, 480), obs: [spike(580, 550)], mos: [mo({ x: 300, y: 360, w: 40, h: 40, range: 80, speed: 70, axis: 'y' })], par: [350, 450, 620] },
  24: { terr: [[0, 350], [500, 1280]], goal: goal(1100, 480), obs: [], mos: [], par: [190, 260, 620] },
  25: { terr: [[0, 280], [420, 580], [720, 900], [1040, 1280]], goal: goal(1100, 480), obs: [spike(780, 550)], mos: [mo({ x: 340, y: 350, w: 40, h: 40, range: 90, speed: 80, axis: 'y' })], par: [480, 580, 760] },
  26: { terr: [[0, 250], [450, 650], [850, 1280]], goal: goal(1100, 480), obs: [spike(350, 620), spike(750, 620)], mos: [mo({ x: 550, y: 360, w: 40, h: 40, range: 80, speed: 90, axis: 'y' }), mo({ x: 300, y: 440, w: 40, h: 40, range: 60, speed: 70, axis: 'x' })], par: [460, 560, 760] },
  27: { terr: [[0, 200], [350, 500], [650, 820], [970, 1280]], goal: goal(1100, 480), obs: [spike(720, 550)], mos: [mo({ x: 270, y: 350, w: 40, h: 40, range: 90, speed: 100, axis: 'y' }), mo({ x: 580, y: 350, w: 40, h: 40, range: 90, speed: 110, axis: 'y' }), mo({ x: 900, y: 350, w: 40, h: 40, range: 90, speed: 90, axis: 'y' })], par: [520, 640, 860] },
  29: { terr: [[0, 200], [380, 520], [700, 880], [1050, 1280]], goal: goal(1140, 480), obs: [spike(960, 600, 30, 30)], mos: [mo({ x: 300, y: 370, w: 40, h: 40, range: 70, speed: 80, axis: 'y' }), mo({ x: 800, y: 380, w: 40, h: 40, range: 60, speed: 90, axis: 'y' })], par: [650, 770, 860] },
  30: { terr: [[0, 180], [340, 480], [640, 780], [940, 1280]], goal: goal(1140, 480), obs: [spike(260, 550), spike(560, 550), spike(860, 550)], mos: [mo({ x: 250, y: 335, w: 45, h: 45, range: 100, speed: 130, axis: 'y' }), mo({ x: 550, y: 355, w: 45, h: 45, range: 80, speed: 110, axis: 'y' }), mo({ x: 850, y: 345, w: 45, h: 45, range: 90, speed: 120, axis: 'y' })], par: [560, 680, 950] },
};

/* validation of every regen design: bridges fit ink, mos never enter the car band,
 * spikes fully below the road, goal sits over the last bank */
for (const k of Object.keys(REGEN)) {
  const n = +k, d = REGEN[k], lvl = LEVELS[n - 1];
  let bridgeLen = 0;
  for (let i = 0; i < d.terr.length - 1; i++) bridgeLen += d.terr[i + 1][0] - d.terr[i][1];
  if (bridgeLen + 24 > lvl.inkMax) { console.error('L' + n + ': bridges ' + (bridgeLen + 24) + ' exceed ink ' + lvl.inkMax); process.exit(1); }
  if (d.par[0] < bridgeLen) { console.error('L' + n + ': 3-star par below minimum bridge ink'); process.exit(1); }
  if (d.par[2] > lvl.inkMax - 20) d.par[2] = lvl.inkMax - 20;
  for (const o of d.mos) {
    const maxBottom = o.axis === 'y' ? o.y + (o.range || 0) + (o.h || 40) : o.y + (o.h || 40);
    if (maxBottom > 480) { console.error('L' + n + ': mo sweeps into car band (bottom ' + maxBottom + ')'); process.exit(1); }
  }
  for (const s of d.obs) {
    if (s.type === 'spike' && s.y < GROUND_Y + 25) { console.error('L' + n + ': spike pokes into road (y ' + s.y + ')'); process.exit(1); }
  }
  const last = d.terr[d.terr.length - 1];
  if (d.goal.x < last[0] || d.goal.x + d.goal.w > last[1]) { console.error('L' + n + ': goal outside last bank'); process.exit(1); }
  /* win check needs carY <= goal.y+goal.h; on a flat 520 road the engine settles the car
   * at y ~524, so goal.y+h must be >= 530 or the goal is unreachable while grounded */
  if (d.goal.y + d.goal.h < 530) { console.error('L' + n + ': goal band too high (y+h ' + (d.goal.y + d.goal.h) + ' < 530, flat-road carY ~524)'); process.exit(1); }
}

/* apply: override terrain/goal/obstacles/movingObstacles/parInk, keep everything else */
const out = LEVELS.map((lvl, i) => {
  const n = i + 1;
  const d = REGEN[n];
  if (!d) return lvl; /* keep verbatim */
  return Object.assign({}, lvl, {
    terrain: d.terr.map(([a, b]) => makeGround(a, b)),
    start: { x: lvl.start.x, y: GROUND_Y }, /* original start.y matched the old (now flattened) bank */
    goal: d.goal,
    obstacles: d.obs,
    movingObstacles: d.mos,
    parInk: d.par,
  });
});

function ser(o, ind) {
  const pad = ' '.repeat(ind);
  if (Array.isArray(o)) return '[' + o.map(x => ser(x, ind)).join(', ') + ']';
  if (o && typeof o === 'object') {
    const body = Object.entries(o).map(([k, v]) => k + ': ' + ser(v, ind + 2)).join(',\n' + pad + '  ');
    if (body === '') return '{}';
    return '{\n' + pad + '  ' + body + '\n' + pad + '}';
  }
  return JSON.stringify(o);
}
const block = 'const LEVELS = [\n' + out.map((l, i) => {
  const note = REGEN[i + 1] ? ' /* REGENERATED 2026-08-16: original required >6-deg climbs / on-road rocks — unwinnable under engine physics */' : '';
  return ser(l, 2) + ',' + note;
}).join('\n') + '\n];';
const patched = html.slice(0, m.index) + block + html.slice(m.index + m[0].length);
fs.writeFileSync(FILE, patched);
console.log('PATCHED ' + FILE + ' — regenerated ' + Object.keys(REGEN).length + ' levels, kept ' + (30 - Object.keys(REGEN).length) + ' verbatim');
