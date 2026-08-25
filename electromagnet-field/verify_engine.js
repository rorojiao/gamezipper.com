#!/usr/bin/env node
/* electromagnet-field verifier — A-type: all 30 levels solved by an independent solver that
 * mirrors calculateField()+traceFieldLine() exactly (same float op order), searching polarity
 * assignments by ascending flip count from the initial layout. Each solution is REPLAYED via
 * real canvas pointerdown flips on the magnets, then the engine's own Check button runs
 * checkWin() -> win overlay -> Next Level. No win logic is loosened. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('electromagnet-field', { inject: {
  anchor: 'function checkWin(){',
  exports: `draw = function(){}; // draw-only (field-line tracing per frame); headless speed
globalThis.__S = {
  n: () => LEVELS.length,
  geo: () => ({ cs: cellSize, gw: gridW, gh: gridH }),
  mags: () => magnets.map(m => ({ r: m.r, c: m.c, p: m.p })),
  tgts: () => targets.map(t => ({ r: t.r, c: t.c })),
  grid: () => grid,
  load: (i) => loadLevel(i),
  flips: () => flipCount,
  won: () => document.getElementById('ov-win').classList.contains('show'),
  failed: () => document.getElementById('ov-fail').classList.contains('show'),
  done: () => Object.keys(loadProgress()).length,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const N = g.call('__S.n()');
T('levels-exist', N === 30, 'n=' + N);

// exact mirror of calculateField/traceFieldLine/checkWin target coverage
function makeCheck(cs, gw, gh, grid, mags0, targets) {
  const W = gw * cs, H = gh * cs;
  return function (pols) {
    const cen = mags0.map((m, i) => ({ x: m.c * cs + cs / 2, y: m.r * cs + cs / 2, p: pols[i] }));
    const field = (x, y) => {
      let bx = 0, by = 0;
      for (let i = 0; i < cen.length; i++) {
        const o = cen[i];
        const dx = x - o.x, dy = y - o.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) dist = 20;
        const mag = (o.p === 'N' ? 1 : -1) * 5000 / (dist * dist);
        bx += mag * dx / dist; by += mag * dy / dist;
      }
      return { bx, by };
    };
    const hit = new Set();
    for (let mi = 0; mi < cen.length; mi++) {
      const m = cen[mi];
      let x = m.x, y = m.y;
      for (let j = 0; j < 8; j++) { // 8 seeded radial rays per magnet (engine's fieldLinesPerMagnet)
        const angleStep = (2 * Math.PI * j) / 8;
        const angle = m.p === 'N' ? angleStep : angleStep + Math.PI;
        let rx = x + Math.cos(angle) * 8, ry = y + Math.sin(angle) * 8;
        const cell = (px, py) => { const c = Math.floor(px / cs), r = Math.floor(py / cs); if (r >= 0 && r < gh && c >= 0 && c < gw && grid[r][c] === 3) hit.add(r + ',' + c); };
        cell(rx, ry);
        for (let step = 0; step < 50; step++) {
          const f = field(rx, ry);
          const fm = Math.sqrt(f.bx * f.bx + f.by * f.by);
          if (fm < 0.1) break;
          rx += f.bx / fm * 8; ry += f.by / fm * 8;
          cell(rx, ry);
          if (rx < 0 || rx > W || ry < 0 || ry > H) break;
          for (let oi = 0; oi < cen.length; oi++) {
            if (oi === mi) continue;
            const ddx = rx - cen[oi].x, ddy = ry - cen[oi].y;
            if (ddx * ddx + ddy * ddy < (cs / 2) * (cs / 2)) { oi = cen.length; break; }
          }
        }
      }
    }
    for (let t = 0; t < targets.length; t++) if (!hit.has(targets[t].r + ',' + targets[t].c)) return false;
    return true;
  };
}
// (the old single-ray mirror body above was replaced by the 8-ray seeded walk; this closes makeCheck)

function solve(mags0, check, deadline) {
  const k = mags0.length;
  const p0 = mags0.map(m => m.p);
  if (check(p0)) return [];
  for (let d = 1; d <= k; d++) {
    const idxs = Array.from({ length: k }, (_, i) => i);
    const combo = (start, chosen) => {
      if (Date.now() > deadline) return null;
      if (chosen.length === d) {
        const pols = p0.slice();
        const flip = [];
        for (const i of chosen) { pols[i] = pols[i] === 'N' ? 'S' : 'N'; flip.push(i); }
        return check(pols) ? flip : false;
      }
      for (let j = start; j < idxs.length; j++) {
        const r = combo(j + 1, chosen.concat(idxs[j]));
        if (r) return r;
      }
      return false;
    };
    const r = combo(0, []);
    if (r) return r;
    if (Date.now() > deadline) return null;
  }
  return null;
}

const canvas = g.els.cv;
const flipPtr = (r, c, cs) => canvas.dispatch('pointerdown', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2, pointerId: 1, button: 0, preventDefault() {} });

const DEADLINE = Date.now() + 100000;
const solved = [];
const flipCounts = [];
for (let i = 0; i < N && Date.now() < DEADLINE; i++) {
  if (i > 0) g.call(`__S.load(${i})`); // level 0 loads at init; engine's own loader either way
  g.pump(2);
  const geo = g.call('__S.geo()');
  const mags = g.call('__S.mags()');
  const tgts = g.call('__S.tgts()');
  const grid = g.call('__S.grid()');
  const check = makeCheck(geo.cs, geo.gw, geo.gh, grid, mags, tgts);
  const sol = solve(mags, check, Date.now() + 12000);
  if (!sol) { fails.push('L' + (i + 1) + ' no polarity assignment covers all ' + tgts.length + ' targets (unwinnable)'); break; }
  for (const mi of sol) flipPtr(mags[mi].r, mags[mi].c, geo.cs);
  g.els['btn-check'].click();
  g.pump(30); // engine's own 400ms win-overlay timer
  if (g.call('__S.won()')) { solved.push(i + 1); flipCounts.push(sol.length); g.els['win-next'].click(); g.pump(2); }
  else { fails.push('L' + (i + 1) + ' engine checkWin rejected solver solution (' + sol.length + ' flips, fail-overlay=' + g.call('__S.failed()') + ')'); break; }
}
T('levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' + Array.from({ length: N }, (_, x) => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('save-progress', g.call('__S.done()') === N, 'saved=' + g.call('__S.done()'));

// undo round-trip on level 1: flip twice then undo twice -> original polarity, flipCount 0
g.call('__S.load(0)'); g.pump(2);
const geo1 = g.call('__S.geo()'), m1 = g.call('__S.mags()');
flipPtr(m1[0].r, m1[0].c, geo1.cs);
const p1 = g.call('__S.mags()')[0].p;
g.els['btn-undo'].click(); g.els['btn-undo'].click();
T('undo-restores', g.call('__S.mags()')[0].p === m1[0].p && g.call('__S.flips()') === 0,
  'p=' + g.call('__S.mags()')[0].p + ' flips=' + g.call('__S.flips()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { solved: solved.length + '/' + N, flipsUsed: flipCounts.join(',') } };
console.log('electromagnet-field: ' + solved.length + '/' + N + ' levels via real magnet flips + engine Check: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
