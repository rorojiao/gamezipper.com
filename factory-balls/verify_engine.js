#!/usr/bin/env node
/* factory-balls verifier (type A): every one of the 50 levels must be completed through the
 * real input path. A BFS over EXACT engine mechanics (dipBallInColor / ballMatches /
 * TOOL_REGION called in-page — no reimplementation) produces a dip/mask/unmask plan; the
 * plan executes as real pointer drags (ball -> bucket / tool slot / ship box) and taps
 * (tool removal). Win = the engine's own winLevel() firing (st==='win'), then _fb.next()
 * chains levels 1..50. Also checks the on-ball tap-to-remove-tool path (hint says "Tap to
 * remove tool"). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('factory-balls', { inject: {
  anchor: 'function winLevel(){',
  exports: `globalThis.__R = {
    st: () => st, lv: () => curLv, n: () => LV.length,
    levels: () => LV,
    ball: () => JSON.parse(JSON.stringify(ball)),
    tools: () => ballTools.slice(),
    steps: () => steps,
    dims: () => ({ W: W, H: H }),
    cvs: () => cvs,
    // engine-exact helpers for the planner
    dip: (bJson, tools, color) => { var b = JSON.parse(bJson); dipBallInColor(b, tools, color); return JSON.stringify(b); },
    match: (lvIdx, bJson) => { var b = JSON.parse(bJson); return !!ballMatches(LV[lvIdx].t, b); },
    keys: () => RG_KEYS,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N === 50, 'n=' + N);

// ---- planner: greedy best-first over (ball, tool-SET) with the engine's own dip/match ----
// Dips depend only on tool membership, so the state is the set (sorted). A "remove" action
// removes ANY tool: the executor pops (tap) everything above it and re-adds those, which is
// real-input faithful and leaves the identical ball + set. Guidance heuristic = number of
// regions not at their engine-expected color (expected read from the level data; the final
// state is still validated by the engine's own ballMatches before shipping).
function planLevel(li, opts) {
  const lv = g.call(`__R.levels()[${li}]`);
  const KEYS = g.call('__R.keys()');
  const RG = KEYS.concat('strip_v');
  const start = JSON.stringify(Object.fromEntries(RG.map(k => [k, 'white'])));
  // engine-expected color per region (same rule ballMatches applies: overlay ? overlay.c : base)
  const exp = {}; exp.__base = lv.t.b;
  for (const o of lv.t.r || []) exp[o.rg] = o.c;
  const mism = (bObj) => { let n = 0; for (const k of RG) if (bObj[k] !== (exp[k] || exp.__base)) n++; return n; };
  const key = (b, t) => b + '|' + t.join(',');
  const seen = new Set([key(start, [])]);
  const open = [{ b: start, t: [], acts: [], f: mism(JSON.parse(start)) }];
  let pops = 0;
  while (open.length && pops++ < 60000 && seen.size < 250000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f || (open[i].f === open[bi].f && open[i].acts.length < open[bi].acts.length)) bi = i;
    const node = open.splice(bi, 1)[0];
    const { b, t, acts } = node;
    if (t.length === 0 && g.call(`__R.match(${li}, ${JSON.stringify(b)})`)) return acts; // ship!
    const push = (a, nb, nt) => { const k = key(nb, nt); if (seen.has(k)) return; seen.add(k); open.push({ b: nb, t: nt, acts: acts.concat(a), f: mism(JSON.parse(nb)) + acts.length * 0.01 }); };
    for (const c of lv.paints) push({ op: 'dip', c }, g.call(`__R.dip(${JSON.stringify(b)}, ${JSON.stringify(t)}, '${c}')`), t);
    for (const tool of lv.tools) if (!t.includes(tool)) push({ op: 'tool', tool }, b, t.concat(tool).sort());
    if (t.length && !(opts && opts.noUnmask)) for (const tool of t) push({ op: 'remove', tool }, b, t.filter(x => x !== tool));
  }
  return null;
}

// ---- real-input executor ----
const cvsEl = () => g.call('__R.cvs()');
const pev = (type, x, y) => cvsEl().dispatch(type, { clientX: x, clientY: y, pointerId: 7, button: 0, isPrimary: true, preventDefault() {} });
function layout() {
  const { W, H } = g.call('__R.dims()');
  const li = g.call('__R.lv()');
  const lv = g.call(`__R.levels()[${li}]`);
  const toolSp = Math.min(58, (W - 110) / Math.max(lv.tools.length, 1));
  const bkSp = Math.min(62, (W - 110) / Math.max(lv.paints.length, 1));
  return {
    W, H,
    ball: { x: W / 2 - 50, y: H - 58, r: 20 },
    tool: (i) => ({ x: W / 2 - (lv.tools.length - 1) * toolSp / 2 + i * toolSp, y: H - 230 }),
    bucket: (i) => ({ x: W / 2 - (lv.paints.length - 1) * bkSp / 2 + i * bkSp, y: H - 138 }),
    ship: { x: W - 55, y: 95 },
  };
}
// drag ball to (x,y) through a few interpolated moves (engine needs pointermove to update drag pos)
function dragBallTo(x, y) {
  const L = layout();
  pev('pointerdown', L.ball.x, L.ball.y);
  const steps = 4;
  for (let s = 1; s <= steps; s++) pev('pointermove', L.ball.x + (x - L.ball.x) * s / steps, L.ball.y + (y - L.ball.y) * s / steps);
  pev('pointerup', x, y);
}
function tapBall() { // engine hint: "Tap to remove tool" — pointer down+up on the ball, <12px move
  const L = layout();
  pev('pointerdown', L.ball.x, L.ball.y);
  pev('pointerup', L.ball.x + 2, L.ball.y + 2);
}
function execAct(a) {
  const L = layout();
  const li = g.call('__R.lv()');
  const lv = g.call(`__R.levels()[${li}]`);
  if (a.op === 'dip') { const i = lv.paints.indexOf(a.c); const p = L.bucket(i); dragBallTo(p.x, p.y); }
  else if (a.op === 'tool') { const i = lv.tools.indexOf(a.tool); const p = L.tool(i); dragBallTo(p.x, p.y); }
  else if (a.op === 'remove') { // pop tools above, pop target, re-add the ones above (set = planned set)
    let tools = g.call('__R.tools()');
    const above = [];
    while (tools.length && tools[tools.length - 1] !== a.tool) { tapBall(); above.push(tools.pop()); }
    if (tools.length) { tapBall(); tools.pop(); }
    for (const t of above) { const i = lv.tools.indexOf(t); const p = L.tool(i); dragBallTo(p.x, p.y); }
  }
  else if (a.op === 'ship') dragBallTo(L.ship.x, L.ship.y);
}

// menu -> play
const { W, H } = g.call('__R.dims()');
cvsEl(); // touch
pev('pointerdown', W / 2, H * 0.5 + 21); pev('pointerup', W / 2, H * 0.5 + 21);
T('start-game', g.call('__R.st()') === 'playing', 'st=' + g.call('__R.st()'));

const solved = [], unsolvable = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < N && Date.now() - T0 < 95000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at ' + li); fails.push('chain broken at L' + (li + 1)); break; }
  const plan = planLevel(li);
  if (!plan) { unsolvable.push(li + 1); fails.push('L' + (li + 1) + ' no solution under engine mechanics'); break; }
  let ok = false;
  for (const a of plan) execAct(a);
  execAct({ op: 'ship' }); // plan proves match+no-tools; the ship drag is the win input
  g.pump(30); // showWin setTimeout 400ms
  if (g.call('__R.st()') === 'win') ok = true;
  if (!ok) { notes.push('L' + (li + 1) + ' plan failed (st=' + g.call('__R.st()') + ' steps=' + g.call('__R.steps()') + ')'); fails.push('L' + (li + 1) + ' plan-exec failed'); break; }
  solved.push(li + 1);
  if (li < N - 1) g.call('window._fb.next()');
}
T('all-50-solved', solved.length === N, 'solved=' + solved.length + '/' + N + (unsolvable.length ? ' unsolvable:[' + unsolvable.join(',') + ']' : '') + ' ' + notes.slice(0, 4).join('|'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N, unsolvable, notes: notes.slice(0, 8) } };
console.log('factory-balls: ' + solved.length + '/' + N + ' levels solved via greedy-best-first plan + real drags: ' + out.verdict);
if (notes.length || unsolvable.length) console.log('detail: unsolvable=[' + unsolvable.join(',') + '] ' + notes.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
