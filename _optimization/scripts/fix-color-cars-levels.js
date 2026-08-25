#!/usr/bin/env node
/* Regenerate structurally-unsolvable color-cars-parking levels (blocks crossing car
 * paths with no reachable switch, switches buried under immovable cars). Candidates
 * are generated in the style of the original levels and validated by an engine-exact
 * planner (same semantics as verify_engine.js, incl. the P0 chase fix); only levels
 * the planner PROVES unsolvable are replaced. */
const fs = require('fs');
const html = fs.readFileSync('color-cars-parking/index.html', 'utf8');
const m = html.match(/var LEVELS=\[([\s\S]*?)\];\n/);
if (!m) { console.error('LEVELS not found'); process.exit(1); }
const LEVELS = eval('[' + m[1] + ']');

// ---- engine-exact sim (mirrors the FIXED engine) ----
let G_paths, G_blocks, G_sws, G_budget, G_planMs = 3000;
function makeSim(paths0, blocks0, sws0) {
  return { paths: paths0, cars: paths0.map(p => ({ xi: p[0][0], yi: p[0][1], pi: 0, ap: 0, moving: false, done: p.length === 1 })), blocks: blocks0.map(b => ({ active: true, ...b })), sws: sws0.map(() => ({ on: true })), failed: false }; // raw level data lacks `active` — engine startGame defaults it true
}
function stepCollision(s2, ci) {
  const car = s2.cars[ci];
  if (car.pi >= s2.paths[ci].length - 1) return false;
  const nx = s2.paths[ci][car.pi][0], ny = s2.paths[ci][car.pi][1];
  for (let j = 0; j < s2.cars.length; j++) {
    if (j === ci) continue;
    const o = s2.cars[j];
    if (o.moving && o.pi < s2.paths[j].length) {
      const ox = o.pi > 0 ? s2.paths[j][o.pi - 1][0] : s2.paths[j][0][0];
      const oy = o.pi > 0 ? s2.paths[j][o.pi - 1][1] : s2.paths[j][0][1];
      const onx = s2.paths[j][o.pi][0], ony = s2.paths[j][o.pi][1];
      if (((ox === nx && oy === ny) || (onx === nx && ony === ny)) && o.ap < 0.8) return true;
    }
    if (!o.done && o.xi === nx && o.yi === ny && !(o.moving && o.ap >= 0.8)) return true;
  }
  for (const b of s2.blocks) if (b.active && b.x === nx && b.y === ny) return true;
  return false;
}
function simFrame(s2) {
  G_budget--;
  s2.cars.forEach((car, idx) => {
    if (!car.moving || s2.failed) return;
    car.ap += 0.05;
    if (car.ap >= 1) {
      car.ap = 0; car.pi++;
      if (car.pi >= s2.paths[idx].length) { car.moving = false; car.done = true; car.xi = s2.paths[idx][s2.paths[idx].length - 1][0]; car.yi = s2.paths[idx][s2.paths[idx].length - 1][1]; }
      else { car.xi = s2.paths[idx][car.pi - 1][0]; car.yi = s2.paths[idx][car.pi - 1][1]; if (stepCollision(s2, idx)) { s2.failed = true; car.moving = false; } }
    }
  });
}
const allDone = s2 => s2.cars.every(c => c.done);
const clone = s2 => ({ paths: s2.paths, cars: s2.cars.map(c => ({ ...c })), blocks: s2.blocks.map(b => ({ ...b })), sws: s2.sws.map(x => ({ ...x })), failed: s2.failed });
function runOut(sim) { let f = 0; while (!allDone(sim) && !sim.failed && f++ < 900 && G_budget > 0) simFrame(sim); return allDone(sim) && !sim.failed; }
function clickOK(s2, ci) {
  const car = s2.cars[ci];
  if (car.moving || car.done) return false;
  const nx = s2.paths[ci][0][0], ny = s2.paths[ci][0][1];
  for (let j = 0; j < s2.cars.length; j++) {
    if (j === ci) continue;
    const o = s2.cars[j];
    if (o.moving && o.pi < s2.paths[j].length) {
      const ox = o.pi > 0 ? s2.paths[j][o.pi - 1][0] : s2.paths[j][0][0], oy = o.pi > 0 ? s2.paths[j][o.pi - 1][1] : s2.paths[j][0][1];
      const onx = s2.paths[j][o.pi][0], ony = s2.paths[j][o.pi][1];
      if (((ox === nx && oy === ny) || (onx === nx && ony === ny)) && o.ap < 0.8) return false;
    }
    if (!o.done && o.xi === nx && o.yi === ny) return false;
  }
  for (const b of s2.blocks) if (b.active && b.x === nx && b.y === ny) return false;
  return true;
}
function toggleOK(s2, si) { return !s2.cars.some(c => !c.done && c.xi === G_sws[si].x && c.yi === G_sws[si].y); }
function doToggle(sim, si) { sim.sws[si].on = !sim.sws[si].on; for (const t of G_sws[si].t) { const b = sim.blocks.find(x => x.x === t.x && x.y === t.y); if (b) b.active = sim.sws[si].on; } }
const OFFS = [0, 16, 20, 40, 80, 12, 8, 4, 2, 60]; // leaner: churn must stay under GC
function perms(arr) { if (arr.length <= 1) return [arr]; const out = []; arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach(p => out.push([x, ...p]))); return out; }
function searchSeq(seq, deadline) {
  G_budget = 60000;
  const rec = (sim, k) => {
    G_budget--; // a rec node costs budget even at offset 0 — otherwise the zero-frame branch explodes free
    if (sim.failed || G_budget <= 0 || Date.now() > deadline) return false;
    if (k >= seq.length) return runOut(clone(sim));
    for (const off of OFFS) {
      const s2 = clone(sim);
      let ok = true;
      for (let i = 0; i < off; i++) { simFrame(s2); if (s2.failed) { ok = false; break; } }
      if (!ok) continue;
      const a = seq[k];
      if (a.kind === 'car') {
        const ci = a.i;
        if (s2.cars[ci].moving || s2.cars[ci].done || !clickOK(s2, ci)) continue;
        s2.cars[ci].moving = true; s2.cars[ci].pi = 1; s2.cars[ci].ap = 0;
        if (rec(s2, k + 1)) return true;
      } else {
        if (!toggleOK(s2, a.i)) continue;
        doToggle(s2, a.i);
        if (rec(s2, k + 1)) return true;
      }
    }
    return false;
  };
  return rec(makeSim(G_paths, G_blocks, G_sws), 0);
}
function solvable(lvl, ms) {
  G_paths = lvl.cars.map(c => c.path.map(p => [p.x, p.y]));
  G_blocks = (lvl.blocks || []).map(b => ({ ...b }));
  G_sws = (lvl.switches || []).map(s => ({ ...s, t: s.targets || [] })); // raw data names them targets
  const cars = G_paths.map((_, i) => i);
  const baseSeqs = perms(cars).map(o => o.map(i => ({ kind: 'car', i })));
  const seqs = [];
  for (const bs of baseSeqs) {
    seqs.push(bs);
    for (let si = 0; si < G_sws.length; si++) for (const pos of [0, bs.length]) seqs.push([...bs.slice(0, pos), { kind: 'sw', i: si }, ...bs.slice(pos)]);
  }
  const deadline = Date.now() + (ms || G_planMs);
  for (const seq of seqs) { if (searchSeq(seq, deadline)) return true; if (Date.now() > deadline) return false; }
  return false;
}

// ---- candidate generator (original style: L-shaped grid paths) ----
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
function genLevel(w, h, nCars, withBlock) {
  const COLORS = ['red', 'blue', 'green', 'yellow'];
  for (let attempt = 0; attempt < 200; attempt++) {
    const cars = [], starts = new Set(), used = new Set();
    let okAll = true;
    for (let ci = 0; ci < nCars; ci++) {
      let path = null;
      for (let t = 0; t < 60; t++) {
        const sx = Math.floor(rnd() * w), sy = Math.floor(rnd() * h);
        if (starts.has(sx + ',' + sy)) continue;
        const p = [[sx, sy]];
        let x = sx, y = sy, len = 3 + Math.floor(rnd() * 4);
        const seen = new Set([sx + ',' + sy]);
        let bad = false;
        for (let s = 0; s < len; s++) {
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            return nx >= 0 && nx < w && ny >= 0 && ny < h && !seen.has(nx + ',' + ny) && !starts.has(nx + ',' + ny);
          });
          if (!dirs.length) { bad = true; break; }
          const [dx, dy] = dirs[Math.floor(rnd() * dirs.length)];
          x += dx; y += dy; seen.add(x + ',' + y); p.push([x, y]);
        }
        if (bad || p.length < 3) continue;
        path = p; starts.add(sx + ',' + sy);
        break;
      }
      if (!path) { okAll = false; break; }
      cars.push({ color: COLORS[ci % 4], sx: path[0][0], sy: path[0][1], path: path.map(([px, py]) => ({ x: px, y: py })) });
    }
    if (!okAll) continue;
    // optional block: on one car's mid-path cell, cleared by a switch off every path
    let blocks = [], switches = [];
    if (withBlock) {
      const ci = Math.floor(rnd() * cars.length);
      const cell = cars[ci].path[1 + Math.floor(rnd() * (cars[ci].path.length - 2))];
      blocks = [{ x: cell.x, y: cell.y, color: cars[ci].color }];
      const onPath = new Set();
      cars.forEach(c => c.path.forEach(p => onPath.add(p.x + ',' + p.y)));
      cars.forEach(c => starts.add(c.sx + ',' + c.sy));
      const free = [];
      for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (!onPath.has(x + ',' + y)) free.push([x, y]);
      if (!free.length) continue;
      const [swx, swy] = free[Math.floor(rnd() * free.length)];
      switches = [{ x: swx, y: swy, color: cars[ci].color, targets: [{ x: cell.x, y: cell.y }] }];
    }
    return { name: 'GEN', w, h, cars, blocks, switches };
  }
  return null;
}

// sequential solver for big traffic-jam levels (10-12 cars): greedy + random orders,
// each car driven to completion before the next click (offset >= any full drive)
function seqSimRun(paths0, blocks0, order) {
  const sim = makeSim(paths0, blocks0, []);
  for (const ci of order) {
    if (sim.cars[ci].done) continue;
    sim.cars[ci].moving = true; sim.cars[ci].pi = 1; sim.cars[ci].ap = 0;
    let f = 0;
    while (!sim.cars[ci].done && !sim.failed && f++ < 900) simFrame(sim);
    if (sim.failed) return false;
  }
  return allDone(sim);
}
function fastSequential(lvl, tries) {
  G_paths = lvl.cars.map(c => c.path.map(p => [p.x, p.y]));
  G_blocks = (lvl.blocks || []).map(b => ({ active: true, ...b }));
  G_sws = [];
  const cars = G_paths.map((_, i) => i);
  for (let t = 0; t < (tries || 300); t++) {
    const order = cars.slice();
    if (t === 0) { // greedy: repeatedly run whatever completes
      const done = new Set();
      let progress = true;
      while (done.size < cars.length && progress) {
        progress = false;
        for (const ci of cars) if (!done.has(ci) && seqSimRun(G_paths, G_blocks, [...done, ci])) { done.add(ci); progress = true; }
      }
      if (done.size === cars.length) return true;
      continue;
    }
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    if (seqSimRun(G_paths, G_blocks, order)) return true;
  }
  return false;
}

let changed = 0;
const ONLY = (process.argv[2] || '').split(',').filter(Boolean).map(Number).map(x => x - 1);
for (let i = 0; i < LEVELS.length; i++) {
  if (ONLY.length && !ONLY.includes(i)) continue;
  const lvl = LEVELS[i];
  const t0 = Date.now();
  if (lvl.cars.length > 5 ? fastSequential(lvl) : solvable(lvl, 1200)) { process.stderr.write('L' + (i + 1) + ' ok ' + (Date.now() - t0) + 'ms\n'); continue; }
  process.stderr.write('L' + (i + 1) + ' UNSOLVABLE, regen...\n');
  // regenerate: same grid + car count + block/switch flavor, keep the thematic name
  const nCars = lvl.cars.length;
  const withBlock = (lvl.blocks || []).length > 0;
  let fixed = null;
  for (let t = 0; t < 40 && !fixed; t++) {
    const cand = genLevel(lvl.w, lvl.h, Math.min(nCars, 5), withBlock); // cap at 5 cars: perms-based validation can't handle 10+
    if (!cand) continue;
    cand.name = lvl.name;
    if (solvable(cand, 1500)) fixed = cand;
  }
  if (fixed) { LEVELS[i] = fixed; changed++; console.log('L' + (i + 1) + ' (' + lvl.name + ') regenerated'); writeLevels(); }
  else console.log('L' + (i + 1) + ' (' + lvl.name + ') COULD NOT REGENERATE');
}
console.log('regenerated ' + changed + ' levels');
// splice back
function writeLevels() {
const ser = LEVELS.map(l => {
  const cars = l.cars.map(c => `{color:'${c.color}',sx:${c.sx},sy:${c.sy},path:[${c.path.map(p => `{x:${p.x},y:${p.y}}`).join(',')}]}`).join(',');
  const blocks = (l.blocks || []).map(b => `{x:${b.x},y:${b.y},color:'${b.color || 'red'}'}`).join(',');
  const sws = (l.switches || []).map(s => `{x:${s.x},y:${s.y},color:'${s.color || 'red'}',targets:[${(s.targets || []).map(t => `{x:${t.x},y:${t.y}}`).join(',')}]}`).join(',');
  return `{name:${JSON.stringify(l.name)},w:${l.w},h:${l.h},cars:[${cars}],blocks:[${blocks}],switches:[${sws}]},`;
}).join('\n');
fs.writeFileSync('color-cars-parking/index.html', html.replace(m[0], 'var LEVELS=[\n' + ser + '\n];\n'));
}
writeLevels();
console.log('written');
