#!/usr/bin/env node
/* cut-the-rope verifier — 25 physics levels: cut ropes through REAL swipe gestures
 * (mousedown/mousemove across a rope stick — tryCut line-intersection), beam-searching
 * cut order and timing; win = candy reaches Om Nom (engine winLevel). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('cut-the-rope', { inject: {
  anchor: 'function tryCut(x1,y1,x2,y2){',
  exports: `globalThis.__T = {
    n: () => LV.length,
    hasBubble: (i) => !!(LV[i].u || []).length,
    load: (i) => startLevel(i), // sets state='settle' (loadLevel alone leaves state='menu' and the loop never runs physics)
    state: () => state,
    candy: () => ({ x: candy.x, y: candy.y }),
    omnom: () => ({ x: omnom.x, y: omnom.y }),
    ropes: () => ropes.map(r => ({ cut: r.cut, sticks: r.sticks.filter(s => s.on).map(s => ({ ax: s.a.x, ay: s.a.y, bx: s.b.x, by: s.b.y })) })),
    stars: () => starsGot,
    view: () => ({ scale: scale, ox: offX, oy: offY }),
    inBubble: () => inBubble,
    bubble: () => bubbleObj ? { x: bubbleObj.x, y: bubbleObj.y, r: bubbleObj.r } : null,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.game;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 25, 'n=' + N);

const toScreen = (wx, wy) => { const v = g.call('__T.view()'); return [wx * v.scale + v.ox, wy * v.scale + v.oy]; };
// real swipe across a rope stick's midpoint (perpendicular crossing)
function swipe(ax, ay, bx, by) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const px = -dy / len * 8, py = dx / len * 8;
  const [sx1, sy1] = toScreen(mx - px, my - py);
  const [sx2, sy2] = toScreen(mx + px, my + py);
  cv().dispatch('mousedown', { clientX: sx1, clientY: sy1, preventDefault() {} });
  cv().dispatch('mousemove', { clientX: sx2, clientY: sy2, preventDefault() {} });
  cv().dispatch('mouseup', { clientX: sx2, clientY: sy2, preventDefault() {} });
}
const cutRope = (ri, where) => { // cut rope ri across a chosen still-on stick (0=anchor side, 1=candy side)
  const ropes = g.call('__T.ropes()');
  const rope = ropes[ri];
  if (!rope || rope.cut || !rope.sticks.length) return false;
  const t = where === undefined ? 0.5 : where;
  const s = rope.sticks[Math.min(rope.sticks.length - 1, Math.floor(rope.sticks.length * t))];
  swipe(s.ax, s.ay, s.bx, s.by);
  return true;
};
function settle(maxFrames) {
  for (let f = 0; f < (maxFrames || 400); f++) {
    g.pump(1);
    const st = g.call('__T.state()');
    if (st === 'win' || st === 'lose') return st;
  }
  return g.call('__T.state()');
}

const tapWorld = (wx, wy) => { const [sx, sy] = toScreen(wx, wy); cv().dispatch('mousedown', { clientX: sx, clientY: sy, preventDefault() {} }); }; // pops a bubble when clicked inside it
function popIfBubble(delayFrames) { // returns true if a bubble was popped after waiting
  for (let f = 0; f < (delayFrames || 0); f++) { g.pump(1); if (g.call('__T.state()') !== 'play') return false; }
  const b = g.call('__T.bubble()');
  if (b) { tapWorld(b.x, b.y); return true; }
  return false;
}

function solve(i, budgetMs) {
  const t0 = Date.now();
  g.call(`__T.load(${i})`); g.pump(1);
  const nR = g.call('__T.ropes()').length; // after load — before load the previous level's ropes (or none) answer
  // frontier: {cutsDone:set, delaysLeft:[{rope,frame}], frame}
  // simple beam: enumerate orderings with per-cut delays from a small set
  const delays = [0, 2, 5, 9, 14, 20, 28, 40, 55, 75, 100, 140];
  const gen = (spots) => {
    const plans = [];
    const rec = (prefix, remaining) => {
      if (!remaining.length) { plans.push(prefix); return; }
      for (let k = 0; k < remaining.length; k++) {
        const rest = remaining.slice(0, k).concat(remaining.slice(k + 1));
        for (const d of delays) for (const sp of spots) rec(prefix.concat([[remaining[k], d, sp]]), rest);
        if (plans.length > 1200) return;
      }
    };
    rec([], Array.from({ length: nR }, (_, x) => x));
    return plans;
  };
  const plans = gen([0.5]).concat(gen([0.12, 0.3, 0.7, 0.95])); // mid-cut plans searched first
  const hasBubble = g.call(`__T.hasBubble(${i})`);
  const popDelays = hasBubble ? [0, 5, 10, 16, 24, 34, 46, 60, 80, 105, 135, 170, 210] : [-1];
  let bubblePopDelay = -1;
  outerLoop:
  for (const pd of popDelays) for (const plan of plans) {
    bubblePopDelay = pd;
    if (Date.now() - t0 > (budgetMs || 4000)) break outerLoop;
    g.call(`__T.load(${i})`);
    let frame = 0, pi = 0, guard = 0;
    while (g.call('__T.state()') === 'settle' && guard++ < 200) g.pump(1); // settle phase ignores input
    while (g.call('__T.state()') === 'play' && pi < plan.length) {
      if (frame >= plan[pi][1]) { if (!cutRope(plan[pi][0], plan[pi][2])) pi = plan.length; else pi++; }
      g.pump(1); frame++;
      if (frame > 700) break;
    }
    // bubble levels: wait for bubble entry, ride the rise for popDelay frames, pop
    if (bubblePopDelay >= 0 && g.call('__T.state()') === 'play') {
      for (let f = 0; f < 500 && !g.call('__T.inBubble()') && g.call('__T.state()') === 'play'; f++) g.pump(1);
      if (g.call('__T.inBubble()')) {
        for (let f = 0; f < bubblePopDelay && g.call('__T.state()') === 'play'; f++) g.pump(1);
        if (g.call('__T.state()') === 'play') popIfBubble(0);
      }
    }
    const res = settle(600);
    if (res === 'win') return true;
  }
  return false;
}

const solved = [];
for (let i = 0; i < N; i++) { if (solve(i, 5000)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' candy never reached Om Nom'); }
T('levels-won', solved.length === N, solved.length + '/' + N + ' won:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { won: solved.length + '/' + N } };
console.log('cut-the-rope: ' + solved.length + '/' + N + ' candies delivered via real rope-cut swipes: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
