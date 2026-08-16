#!/usr/bin/env node
/* draw-to-home level-data regenerator (wave-A3).
 * ROOT CAUSES (measured against the engine's own win path, see verify_engine.js):
 *  1. Every shipped level's ink budget was authored for a ~200px-wide board, but the
 *     engine runs a 600x900 canvas and accounts ink in canvas px (state.ink += dist).
 *     Shortest legal paths are 330-2000px vs ink 100-360 — ALL 50 levels were unwinnable:
 *     the drawing cancels (state.ink > state.inkMax clears the path) before the character
 *     can reach its home. Fix: per-level ink = ceil(2.2 x shortest legal path) so the
 *     optimal path costs ~45% of the meter — which makes the tutorial's stated economy
 *     ("3 stars = under 50% ink used, 2 stars = under 75%") true — with par3=50, par2=75.
 *  2. Level 34 ("Grid") had gapless full-width horizontal walls + a vertical wall
 *     overlapping both, sealing the bottom-right quadrant: the char at (80%,80%) could
 *     never reach its home at (20%,80%). Fix: same grid design with doorways (staggered
 *     gaps in each wall line, gaps aligned with the perpendicular corridors).
 * Wall/char/mover/coin layouts are otherwise kept VERBATIM. Engine code untouched.
 * Shortest-path values come from the verifier's own planner (DTH_PLAN_ONLY=1) so the
 * fixer and the verifier share ONE implementation.
 * Usage: node _optimization/scripts/fix-drawtohome-levels.js   (writes in place) */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const FILE = path.join(ROOT, 'draw-to-home', 'index.html');
let html = fs.readFileSync(FILE, 'utf8');

/* ---------- phase 1a: L34 (index 33) wall regeneration (sealed quadrant) ---------- */
const GRID_WALLS = JSON.stringify([
  { x: 35, y: 0, w: 5, h: 40 }, { x: 35, y: 50, w: 5, h: 50 },
  { x: 60, y: 0, w: 5, h: 28 }, { x: 60, y: 38, w: 5, h: 47 },
  { x: 0, y: 35, w: 20, h: 5 }, { x: 30, y: 35, w: 18, h: 5 }, { x: 58, y: 35, w: 42, h: 5 },
  { x: 0, y: 60, w: 30, h: 5 }, { x: 42, y: 60, w: 58, h: 5 },
]);
/* ---------- phase 1b: split gapless full-height walls (h>=100). With the engine's
 * corner-point collision, an h:100 wall blocks every y in [10,910] — impassable at any
 * ink except a degenerate y<10 canvas-edge sliver. Split into the game's own gap pattern
 * (y 0-45 / 55-100, 90px doorway), as used by its L12/L28/L31/L37. ---------- */
{
  const lines = html.split('\n');
  let seen = 0, gridHit = false, splitCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\{chars:/.test(lines[i])) continue;
    if (seen === 33) {
      lines[i] = lines[i].replace(/walls:\[[^\]]*\]/, 'walls:' + GRID_WALLS);
      gridHit = true;
    } else {
      const m = lines[i].match(/walls:(\[[^\]]*\])/);
      if (m) {
        const walls = eval(m[1]);
        let changed = false;
        const out = [];
        for (const w of walls) {
          if (w.h >= 100) { changed = true; out.push({ x: w.x, y: 0, w: w.w, h: 45 }, { x: w.x, y: 55, w: w.w, h: 45 }); }
          else out.push(w);
        }
        if (changed) {
          splitCount++;
          lines[i] = lines[i].replace(m[0], 'walls:' + JSON.stringify(out));
        }
      }
    }
    seen++;
  }
  if (!gridHit) { console.error('L34 walls: level line not found'); process.exit(1); }
  html = lines.join('\n');
  fs.writeFileSync(FILE, html);
  console.log('L34 walls regenerated as doorway grid (original sealed the bottom-right quadrant)');
  console.log(splitCount + ' levels had gapless full-height walls split into the standard doorway pattern');
}

/* ---------- phase 2: ink/par regeneration from the verifier's planner ---------- */
const out = execFileSync(process.execPath, [path.join(ROOT, 'draw-to-home', 'verify_engine.js')], {
  env: Object.assign({}, process.env, { DTH_PLAN_ONLY: '1' }), timeout: 170000,
}).toString();
const plans = [];
for (const line of out.split('\n')) {
  const t = line.trim();
  if (t.startsWith('{')) { const d = JSON.parse(t); if (d.n) plans.push(d); }
}
if (plans.length !== 50) { console.error('planner returned ' + plans.length + ' levels'); process.exit(1); }
const unsolvable = plans.filter(p => !p.solvable);
if (unsolvable.length) { console.error('still unsolvable: ' + unsolvable.map(p => 'L' + p.n + ' ' + p.why).join('; ')); process.exit(1); }

const lines = fs.readFileSync(FILE, 'utf8').split('\n');
let li = 0, changed = 0, report = [];
for (const p of plans) {
  while (li < lines.length && !/^\s*\{chars:/.test(lines[li])) li++;
  if (li >= lines.length) { console.error('ran out of level lines at L' + p.n); process.exit(1); }
  const ink = Math.ceil(p.minInk * 2.2 / 10) * 10;
  const before = lines[li];
  lines[li] = lines[li]
    .replace(/ink:\d+/, 'ink:' + ink)
    .replace(/par3:\d+/, 'par3:50')
    .replace(/par2:\d+/, 'par2:75');
  if (lines[li] !== before) {
    changed++;
    lines[li] = lines[li].replace(/\},$/, '}, /* REGENERATED 2026-08-16: original ink budget was authored for a ~200px board; engine canvas is 600x900 and ink is measured in canvas px — every shipped level was unwinnable */');
    report.push('L' + p.n + ' ink ' + p.minInk + '->' + ink);
  }
  li++;
}
fs.writeFileSync(FILE, lines.join('\n'));
console.log('PATCHED ' + FILE + ' — ' + changed + ' levels re-budgeted (ink=ceil(2.2x shortest path), par3=50, par2=75)');
console.log(report.join(' '));
