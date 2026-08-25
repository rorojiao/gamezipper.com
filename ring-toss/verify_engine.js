#!/usr/bin/env node
/* ring-toss verifier — B-type: all 30 levels cleared via REAL drag-to-aim pointer input.
 * The bot mirrors updateRing()'s projectile math (gravity + wind + wall bounces + landing
 * window) to pick each shot (coarse-to-fine power/angle scan maximizing peg points +
 * stack combo), then replays it through pointerdown/pointermove/pointerup. All physics,
 * scoring, win detection (checkWin -> wonLevel -> win overlay via the engine's own
 * setTimeout) stay in the engine; the sim only chooses where to aim. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('ring-toss', { inject: {
  anchor: 'function updateRing(r){',
  exports: `globalThis.__S = {
  n: () => LEVELS.length,
  lv: (i) => LEVELS[i],
  load: (i) => loadLevel(i),
  info: () => ({ cw, ch, lx: launcherX, ly: launcherY, wind, cur: curLevel, target: LEVELS[curLevel].target }),
  pegs: () => pegs.map(p => ({ x: p.x, y: p.y, pts: p.pts, r: p.r, stack: p.stack })),
  walls: () => walls.map(w => ({ x: w.x, y: w.y, w: w.w, h: w.h })),
  score: () => score, rings: () => ringsLeft, flying: () => !!(activeRing && activeRing.flying),
  won: () => wonLevel(),
  winShown: () => document.getElementById('ov-win').classList.contains('show'),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const N = g.call('__S.n()');
T('levels-exist', N === 30, 'n=' + N);

// physics mirror of updateRing() (frame-stepped, same op order)
function simulate(cw, ch, wind, walls, pegs, lx, ly, vx, vy, wantPegY) {
  let x = lx, y = ly;
  for (let f = 0; f < 900; f++) {
    vy += 0.35; vx += wind; x += vx; y += vy;
    for (const w of walls) {
      const rr = 10;
      if (x + rr > w.x && x - rr < w.x + w.w && y + rr > w.y && y - rr < w.y + w.h) {
        const dxL = Math.abs(x - w.x), dxR = Math.abs(x - (w.x + w.w));
        const dyT = Math.abs(y - w.y), dyB = Math.abs(y - (w.y + w.h));
        const mn = Math.min(dxL, dxR, dyT, dyB);
        if (mn === dxL) { x = w.x - rr; vx = -Math.abs(vx) * 0.5; }
        else if (mn === dxR) { x = w.x + w.w + rr; vx = Math.abs(vx) * 0.5; }
        else if (mn === dyT) { y = w.y - rr; vy = -Math.abs(vy) * 0.5; }
        else { y = w.y + w.h + rr; vy = Math.abs(vy) * 0.5; }
      }
    }
    for (let i = 0; i < pegs.length; i++) {
      const p = pegs[i];
      const dist = Math.hypot(x - p.x, y - p.y);
      if (vy > 0 && dist < p.r + 8 && dist > p.r - 12 && y < p.y + 12 && y > p.y - 20) return { peg: i };
    }
    if (y > ch + 30 || x < -30 || x > cw + 30) return { dead: true };
    if (wantPegY !== undefined && vy > 0 && y > wantPegY + 60) return { dead: true }; // early abort for targeted scans
  }
  return { dead: true };
}

function bestShot(state) {
  const { cw, ch, lx, ly, wind } = state.info;
  const pegs = state.pegs, walls = state.walls;
  let best = null;
  for (const coarse of [true, false]) {
    const aStep = coarse ? 0.03 : 0.004, pStep = coarse ? 6 : 1;
    for (let ang = -Math.PI; ang <= 0; ang += aStep) {
      for (let pw = 24; pw <= 170; pw += pStep) {
        if (coarse && (pw % 6 !== 0 || pw < 24)) continue;
        const vx = Math.cos(ang) * pw * 0.12, vy = Math.sin(ang) * pw * 0.12;
        const res = simulate(cw, ch, wind, walls, pegs, lx, ly, vx, vy);
        if (res.peg === undefined) continue;
        const p = pegs[res.peg];
        const val = p.pts + p.stack * 5; // stack combo the engine will award
        if (!best || val > best.val) best = { val, ang, pw };
      }
    }
    if (best && !coarse) break;
    if (best && coarse) { /* refine around best.ang/best.pw below */ break; }
  }
  // refine around the best coarse hit
  if (best) {
    for (let dA = -0.03; dA <= 0.03; dA += 0.004) {
      for (let dP = -6; dP <= 6; dP += 1) {
        const ang = best.ang + dA, pw = Math.min(170, Math.max(24, best.pw + dP));
        const vx = Math.cos(ang) * pw * 0.12, vy = Math.sin(ang) * pw * 0.12;
        const res = simulate(cw, ch, wind, walls, pegs, lx, ly, vx, vy);
        if (res.peg !== undefined) {
          const p = pegs[res.peg];
          const val = p.pts + p.stack * 5;
          if (val > best.val || (val === best.val && Math.abs(dA) < 0.01)) best = { val, ang, pw };
        }
      }
    }
  }
  return best;
}

const canvas = g.els.cv;
const ptr = (type, x, y) => canvas.dispatch(type, { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });

const DEADLINE = Date.now() + 100000;
const solved = [];
g.pump(3); // let the deferred init refit+reload settle
for (let i = 0; i < N && Date.now() < DEADLINE; i++) {
  g.call(`__S.load(${i})`);
  g.pump(2);
  let won = false, misses = 0;
  while (!won && g.call('__S.rings()') > 0 && Date.now() < DEADLINE) {
    const state = { info: g.call('__S.info()'), pegs: g.call('__S.pegs()'), walls: g.call('__S.walls()') };
    const shot = bestShot(state);
    const info = state.info;
    if (!shot) { // no hitting trajectory found at all -> burn a ring upward, honest outcome
      ptr('pointerdown', 100, 100); ptr('pointermove', info.lx - 60, info.ly - 60); ptr('pointerup', info.lx - 60, info.ly - 60);
      misses++;
    } else {
      const ex = info.lx - Math.cos(shot.ang) * shot.pw, ey = info.ly - Math.sin(shot.ang) * shot.pw;
      ptr('pointerdown', info.lx, info.ly);
      ptr('pointermove', ex, ey);
      ptr('pointerup', ex, ey);
    }
    for (let f = 0; f < 900 && g.call('__S.flying()'); f++) g.pump(1);
    g.pump(2);
    if (g.call('__S.won()')) { won = true; }
  }
  if (won) {
    for (let f = 0; f < 60 && !g.call('__S.winShown()'); f++) g.pump(2); // engine's own 600ms win-overlay timer
    if (g.call('__S.winShown()')) { solved.push(i + 1); g.els['win-next'].click(); } else fails.push('L' + (i + 1) + ' win overlay never shown');
  } else fails.push('L' + (i + 1) + ' target not reached (score ' + g.call('__S.score()') + '/' + g.call('__S.info()').target + ')');
}
T('levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' + Array.from({ length: N }, (_, x) => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
const saved = JSON.parse(g.ls.getItem('rt_progress') || '{}');
T('save-progress', Object.keys(saved).length >= solved.length - 1, 'saved=' + Object.keys(saved).length);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('ring-toss: ' + solved.length + '/' + N + ' levels via real aim-drag shots to engine win overlay: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
