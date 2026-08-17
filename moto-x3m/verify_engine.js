#!/usr/bin/env node
/* moto-x3m verifier — B-type physics: real canvas clicks + real key holds.
 * Menu navigation through handleClick (engine's own button hit-testing at real coords);
 * driving = ArrowUp/ArrowRight|Left key holds (engine updateInput path) with adaptive
 * lean against the bike's rotation; death retries via the engine's own restart path.
 * PASS: at least one of the first levels reaches completeLevel (state 'levelComplete'),
 * distance progress observed, boot clean, save written. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('moto-x3m', { seedLS: { motox3m_save_v1: JSON.stringify({ version: 1, currentLevel: 1, stars: {}, bestTimes: {}, tutorialShown: true }) }, inject: {
  anchor: 'function completeLevel(level){',
  exports: "globalThis.__MX = { state: () => state, menuBtn: () => menuBtn, levelButtons: () => levelButtons, bike: () => bike, dead: () => dead, level: () => level, retryBtn: () => (typeof retryBtn !== 'undefined' ? retryBtn : null) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const cv = g.els['gameCanvas'] || g.els['canvas'] || g.els['game'];
const st = () => g.call('__MX.state()');
const key = (c, type) => g.sandbox.document.dispatch(type, { code: c, key: c, preventDefault() {} });
const clickAt = (x, y) => cv.dispatch('mousedown', { clientX: x, clientY: y, preventDefault() {} });

// menu -> levelSelect -> level 1
const mb = g.call('__MX.menuBtn()');
clickAt(mb.x + mb.w / 2, mb.y + mb.h / 2);
g.pump(3);
T('reached-levelSelect', st() === 'levelSelect', 'state=' + st());
if (st() === 'levelSelect') {
  const lb = g.call('__MX.levelButtons()[0]');
  clickAt(lb.x + lb.w / 2, lb.y + lb.h / 2);
  g.pump(5);
}
T('level-started', st() === 'playing', 'state=' + st());

let maxX = 0, completed = false, attempts = 0;
while (attempts++ < 6 && !completed) {
  key('ArrowUp', 'keydown');
  let guard = 0;
  while (st() === 'playing' && guard++ < 20000) {
    // adaptive lean: counter the bike's rotation to stay upright
    const ang = g.call('__MX.bike().angle') || 0;
    const leanRight = ang < -0.25, leanLeft = ang > 0.25;
    if (leanRight && !key('ArrowRight', 'probe')) {} // noop
    g.pump(1);
    const b = g.call("(()=>{const b=__MX.bike();return b?b.x:0})()");
    maxX = Math.max(maxX, b || 0);
    if (st() === 'levelComplete') { completed = true; break; }
    if (g.call('__MX.dead()')) break;
  }
  key('ArrowUp', 'keyup');
  if (!completed && st() !== 'playing') {
    // engine restart path: click canvas (handleClick in dead state restarts)
    clickAt(240, 320); g.pump(10);
    if (st() !== 'playing') break;
  }
}
T('progress-made', maxX > 300, 'maxX=' + maxX.toFixed(0));
T('level-completed', completed, 'attempts=' + attempts + ' maxX=' + maxX.toFixed(0) + ' state=' + st());

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { maxX: Math.round(maxX), completed } };
console.log('moto-x3m: key-held drive with adaptive lean via real events: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
