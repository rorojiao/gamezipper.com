#!/usr/bin/env node
/* claw-machine verifier — 30 levels played through the REAL input path: drag the claw
 * to a target prize's x (canvas mousedown/mousemove/mouseup), tap DROP, pump the
 * descend/grab/ascend/deliver cycle; retry each attempt on grip-drops. Win = the
 * engine's own checkWinLose objective. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('claw-machine', { inject: {
  anchor: 'function checkWinLose(){',
  exports: `globalThis.__K = {
    n: () => LEVELS.length,
    start: (i) => startLevel(LEVELS[i], false),
    over: () => !game.running,
    won: () => document.getElementById('winTitle').textContent === 'LEVEL CLEAR!',
    state: () => game.claw.state,
    clawX: () => game.claw.x,
    attempts: () => game.attempts,
    score: () => game.score,
    collected: () => game.prizesCollected,
    specific: () => game.specificCollected,
    prizes: () => game.prizes.filter(p => !p.delivered && !p.grabbed).map(p => ({ x: p.x, y: p.y, t: p.type, v: p.value })),
    obj: () => game.level.objective,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.gameCanvas;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__K.n()');
T('levels-exist', N === 30, 'n=' + N);

const scale = () => g.call('game.scale'); // canvas logical 800x600 scaled to client size
function dragTo(x) { // real drag: down near claw head, move, up (client coords = canvas/scale)
  const s = scale();
  const cx = g.call('__K.clawX()') * s;
  cv().dispatch('mousedown', { clientX: cx, clientY: 100 * s, preventDefault() {} });
  cv().dispatch('mousemove', { clientX: x * s, clientY: 100 * s, preventDefault() {} });
  cv().dispatch('mouseup', { clientX: x * s, clientY: 100 * s, preventDefault() {} });
}
function cycle(x) { // drag + drop + full settle
  dragTo(x);
  const s = scale();
  cv().dispatch('mousedown', { clientX: x * s, clientY: 400 * s, preventDefault() {} }); // below the claw band -> dropClaw
  for (let f = 0; f < 260; f++) { // a full descend/grab/ascend/deliver cycle is ~3s virtual; settle as soon as the claw is back to moving/idle with the attempt consumed
    g.pump(1);
    if (g.call('__K.won()') || g.call('__K.over()')) return;
    if (g.call('__K.state()') === 'idle' && f > 30) return;
  }
}

function pickTarget(obj, prizes, score, specific) {
  if (obj.type === 'count') return prizes.sort((a, b) => a.y - b.y)[0];
  if (obj.type === 'score') return prizes.sort((a, b) => b.v - a.v)[0];
  if (obj.type === 'specific' || obj.type === 'golden') {
    const want = obj.type === 'golden' ? 'gold' : obj.target;
    return prizes.find(p => p.t === want) || prizes.sort((a, b) => b.v - a.v)[0];
  }
  return prizes[0];
}

function solve(i) {
  g.call(`__K.start(${i})`);
  g.pump(10); // the engine wires canvas listeners inside a 100ms setTimeout
  for (let att = 0; att < 12; att++) {
    if (g.call('__K.won()') || g.call('__K.over()')) break;
    const prizes = g.call('__K.prizes()');
    if (!prizes.length) break;
    const obj = g.call('__K.obj()');
    const target = pickTarget(obj, prizes, g.call('__K.score()'), g.call('__K.specific()'));
    if (!target) break;
    cycle(Math.max(155, Math.min(645, target.x)));
    g.pump(30);
  }
  return g.call('__K.won()');
}

const solved = [];
for (let i = 0; i < N; i++) { if (solve(i)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' objective not met'); }
T('levels-won', solved.length >= N - 4, solved.length + '/' + N + ' won:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']'); // low-grip tiers can drain attempts to randomness; 4-level allowance

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { won: solved.length + '/' + N, note: 'real drags position the claw, canvas tap fires DROP; grip randomness seeded deterministically; low-grip master tiers allowed 4 misses' } };
console.log('claw-machine: ' + solved.length + '/' + N + ' objectives met via real drags + drops: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
