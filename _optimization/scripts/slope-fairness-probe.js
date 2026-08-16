#!/usr/bin/env node
/* slope fairness probe — evidence harness for the spawn-flash / pre-spawn-wall fixes.
 * Drives the real engine (vm sandbox) N runs × 30s with a lookahead-3 dodge policy.
 * Metrics:
 *   flashSignature  deaths where the nearest obstacle is >60z away (mod-arithmetic bug class)
 *   legitArrival    deaths at genuine obstacle arrival (skill-based)
 *   survivedFull30s runs reaching 30s (before fix: mathematically 0)
 * Usage: node slope-fairness-probe.js [runs] [seedBase] */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const repo = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(repo, 'slope', 'game.js'), 'utf8');

function mkCtx(rand) {
  const ctx = {
    console, Date, JSON,
    setInterval: () => 0, clearInterval() {}, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => {},
    performance: { now: () => 0 },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'node' }, location: { href: '' },
    document: {
      getElementById: () => ({ getContext: () => new Proxy({}, { get: () => () => 1 }), addEventListener() {}, style: {}, classList: { add() {}, remove() {}, toggle() {} }, width: 800, height: 600, textContent: '' }),
      addEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
      createElement: () => ({ getContext: () => null, style: {} }), body: { appendChild() {} },
      hidden: false, visibilityState: 'visible',
    },
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.addEventListener = () => {};
  const AC = function () {
    return {
      createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, type: '' }),
      createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 } }),
      destination: {}, currentTime: 0, resume() {}, state: 'running',
    };
  };
  ctx.AudioContext = AC; ctx.webkitAudioContext = AC;
  let s = rand >>> 0;
  ctx.Math = Object.create(Math);
  ctx.Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  vm.createContext(ctx);
  vm.runInContext(src + ';globalThis.__p={start(){startGame()},frame(){update()},get state(){return gameState},get roadZ(){return roadZ},get obstacles(){return obstacles},get playerX(){return playerX},set steer(v){tiltX=v}};', ctx, { filename: 'game.js' });
  return ctx;
}

const N = parseInt(process.argv[2] || '40', 10);
const seedBase = parseInt(process.argv[3] || '12345', 10);
const FR = 1800; // 30s at 60fps
let flash = 0, legit = 0, surv = 0;
const times = [];
for (let run = 0; run < N; run++) {
  const ctx = mkCtx(seedBase + run * 7919);
  const p = ctx.__p;
  p.start();
  let died = false;
  for (let f = 0; f < FR; f++) {
    const ahead = p.obstacles.filter(o => o.alive && o.z - p.roadZ > -20 && o.z - p.roadZ < 280)
      .sort((a, b) => a.z - b.z).slice(0, 3);
    let bestT = 0, bestS = -1e9;
    for (let t = -0.63; t <= 0.631; t += 0.07) {
      let sc = 99;
      for (const o of ahead) {
        const d = o.z - p.roadZ;
        const clear = Math.abs(t - o.lane) - 0.28; // collision window is |dx|<0.22; keep 0.06 safety
        sc = Math.min(sc, clear - Math.max(0, 280 - d) * 0.0009);
      }
      sc -= Math.abs(t - p.playerX) * 0.15;
      if (sc > bestS) { bestS = sc; bestT = t; }
    }
    p.steer = Math.max(-0.9, Math.min(0.9, (bestT - p.playerX) * 4));
    p.frame();
    if (p.state !== 'playing') {
      died = true;
      let kd = 1e9;
      for (const o of p.obstacles) { const d = Math.abs(o.z - p.roadZ); if (d < kd) kd = d; }
      if (kd > 60) flash++; else legit++;
      times.push(+(f / 60).toFixed(1));
      break;
    }
  }
  if (!died) { surv++; times.push(30); }
}
times.sort((a, b) => a - b);
const avg = times.reduce((a, b) => a + b, 0) / times.length;
const out = {
  at: new Date().toISOString(), runs: N,
  deaths: { flashSignature: flash, legitArrival: legit },
  survivedFull30s: surv,
  avgSurvivalSec: +avg.toFixed(1),
  medianSurvivalSec: times[N >> 1],
  worstSec: times[0],
};
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(repo, '_optimization', 'evidence', 'slope', 'fairness-probe.json'), JSON.stringify(out, null, 1) + '\n');
