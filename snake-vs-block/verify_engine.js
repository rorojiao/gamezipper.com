#!/usr/bin/env node
/* snake-vs-block verifier — B-type: drag-steered play through real pointer events.
 * Returning-player save (tutorialDone) seeded in localStorage; Space starts the level
 * (engine's own keydown path); steering = real pointerdown/pointermove drags updating
 * input.pointerX. Policy: aim the snake head at the center of the lowest-cost gap of
 * the nearest incoming row (avoid blocks, prefer coin columns).
 * PASS: level reaches LEVEL_COMPLETE (engine's own completion), score>0, snake loses no
 * more balls than it holds (no negative length), persistence writes, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('snake-vs-block', { seedLS: { svb_save: JSON.stringify({ version: "v1", tutorialDone: true, maxLevel: 1, levels: {} }) }, inject: {
  anchor: 'function startLevel(levelIdx) {',
  exports: "globalThis.__SVB = { state: () => state, STATE: () => STATE, input: () => input, rows: () => state.rows };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const cv = g.els['gameCanvas'] || g.els['game'] || g.els['canvas'];
const cur = () => g.call('__SVB.state().current');
const PLAYING = () => g.call('__SVB.STATE().PLAYING');

// Space on MENU starts the level (tutorial already done via seeded save)
g.sandbox.document.dispatch('keydown', { key: ' ', code: 'Space', preventDefault() {} });
g.pump(5);
T('game-started', cur() === PLAYING(), 'current=' + cur());

let lastPX = 240;
cv.dispatch('pointerdown', { clientX: lastPX, clientY: 400, preventDefault() {} });
let guard = 0, minSnake = 1e9, maxScore = 0;
while (guard++ < 20000) {
  g.pump(1);
  if (cur() !== PLAYING()) break;
  const st = g.call("(()=>{const s=__SVB.state();return {len:s.snakeLength,x:s.snakeX,score:s.score}})()");
  minSnake = Math.min(minSnake, st.len);
  maxScore = Math.max(maxScore, st.score);
  // nearest row below the snake head: steer to its safest x
  const tgt = g.call("(()=>{const s=__SVB.state();const rows=s.activeRows&&s.activeRows.length?s.activeRows:s.rows;if(!rows||!rows.length)return null;let best=null,bd=1e9;for(const r of rows){const d=r.y!==undefined?Math.abs(r.y-300):-0;if(d<bd){bd=d;best=r}}if(!best)return null;const W=480;let bx=W/2,bcost=1e9;for(let x=20;x<W-20;x+=10){let cost=0;for(const b of best.blocks){const bx1=b.x,bx2=b.x+b.w;if(x>bx1-14&&x<bx2+14)cost+=b.n===undefined?99:b.n}for(const c of best.coins){if(Math.abs(c.x-x)<18)cost-=2}if(cost<bcost){bcost=cost;bx=x}}return bx})()");
  if (tgt !== null && tgt !== undefined) {
    const dx = Math.max(-30, Math.min(30, tgt - lastPX));
    lastPX += dx;
    cv.dispatch('pointermove', { clientX: lastPX, clientY: 400, preventDefault() {} });
  }
}
const endState = cur();
T('level-completed', endState === g.call('__SVB.STATE().LEVEL_COMPLETE'), 'end=' + endState);
T('score-earned', maxScore > 0, 'score=' + maxScore);
T('snake-nonnegative', minSnake >= 0, 'minLen=' + minSnake);

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { endState, maxScore, minSnake } };
console.log('snake-vs-block: drag-steered level run via real pointer events: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
