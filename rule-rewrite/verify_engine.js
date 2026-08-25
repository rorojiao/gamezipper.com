#!/usr/bin/env node
/* rule-rewrite verifier — 25 Baba-style rule puzzles (type A).
 * Every move replays through the REAL input path: document keydown -> move() ->
 * parseRules + tryPush (the engine's own push/stop/text rules) ->
 * applyTransforms + applyInteractions (sink/hot/melt/defeat/open/shut/weak) ->
 * the engine's own checkWin (YOU object sharing a tile with a WIN object) ->
 * win modal via its real 500ms timer -> the real nextLevel() (Next Level button
 * handler) chains all 25 levels. Undo via the real 'z' key, restart via 'r'.
 * Solutions come from a host-side EXACT mirror of move() searched breadth-first
 * (shortest key sequence), replayed key-by-key on the engine; a 120-random-key
 * fidelity walk on level 6 (sink/push/transform interactions) asserts the mirror
 * matches the engine state after every single move.
 * Engine P0 found & fixed (see index.html FIX comment): level 19 "Mirror World"
 * shipped with no 'win' text at all — no rule could ever grant WIN, so the level
 * (and the whole 25-level chain) was mathematically unwinnable. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('rule-rewrite', { inject: {
  anchor: 'function move(dx,dy){',
  exports: `globalThis.__RW = {
    st: () => ({ idx: state.levelIdx, won: state.won, lost: state.lost, moves: state.moves }),
    ents: () => state.entities.map(e => [e.kind, e.name, e.x, e.y]),
    w: () => state.w, h: () => state.h, n: () => LEVELS.length,
    win: () => document.getElementById('win-modal').classList.contains('active'),
    tut: () => document.getElementById('tutorial-overlay').classList.contains('active'),
    prog: () => { try { return JSON.parse(localStorage.getItem('rulerewrite_progress') || '{}'); } catch (e) { return {}; } },
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
const KEY = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const DX = [0, 0, -1, 1], DY = [-1, 1, 0, 0];
const key = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-25', call('__RW.n()') === 25, 'n=' + call('__RW.n()'));

/* ---------- exact host-side mirror of the engine's move() ---------- */
const NAMES = ['baba','wall','rock','flag','water','lava','key','door','skull','grass','ice','tile','is','you','win','stop','push','sink','melt','hot','defeat','open','shut','weak','move'];
const NIDX = {}; NAMES.forEach((nm, i) => NIDX[nm] = i);
const IS = 12; // 'is' text index; nouns 0-11, props 13-24 (prop bit = 1 << (name-13))
const YOUB = 1 << 0, WINB = 1 << 1, STOPB = 1 << 2, PUSHB = 1 << 3;
const SINKB = 1 << 4, MELTB = 1 << 5, HOTB = 1 << 6, DEFB = 1 << 7, OPB = 1 << 8, SHB = 1 << 9, WB = 1 << 10;
const pack = (k, nm, x, y) => (k << 15) | (nm << 10) | (x << 5) | y;
function readState() {
  return call('__RW.ents()').map(a => pack(a[0] === 'text' ? 1 : 0, NIDX[a[1]], a[2], a[3]));
}
const tg = new Int16Array(512), props = new Int16Array(32), trans = new Int16Array(32); // scratch
function parseRules(es) {
  tg.fill(-1); props.fill(0); trans.fill(-1);
  for (const e of es) if (e.kind === 1) tg[e.x * 16 + e.y] = e.name;
  for (const e of es) {
    if (e.kind !== 1 || e.name >= IS) continue;
    let r = tg[(e.x + 1) * 16 + e.y];
    if (r === IS) {
      r = tg[(e.x + 2) * 16 + e.y];
      if (r >= 13) props[e.name] |= 1 << (r - 13);
      else if (r >= 0 && r < IS) trans[e.name] = r;
    }
    r = tg[e.x * 16 + e.y + 1];
    if (r === IS) {
      r = tg[e.x * 16 + e.y + 2];
      if (r >= 13) props[e.name] |= 1 << (r - 13);
      else if (r >= 0 && r < IS) trans[e.name] = r;
    }
  }
}
const hp = (e, bit) => e.kind === 1 ? bit === PUSHB : (props[e.name] & bit) !== 0;
function tryPush(es, ent, dx, dy, W, H, vis) {
  const k = ent.x * 16 + ent.y;
  if (vis[k]) return true;
  vis[k] = 1;
  const nx = ent.x + dx, ny = ent.y + dy;
  if (nx < 0 || nx >= W || ny < 0 || ny >= H) return false;
  let hasStop = false; const pl = [];
  for (const t of es) if (t.x === nx && t.y === ny) { if (hp(t, PUSHB)) pl.push(t); else if (hp(t, STOPB)) hasStop = true; }
  if (hasStop) return false;
  for (const t of pl) if (!tryPush(es, t, dx, dy, W, H, vis)) return false;
  ent.x = nx; ent.y = ny;
  return true;
}
function step(ints, dx, dy, W, H) {
  const es = new Array(ints.length);
  for (let i = 0; i < ints.length; i++) { const v = ints[i]; es[i] = { kind: v >> 15, name: (v >> 10) & 31, x: (v >> 5) & 31, y: v & 31 }; }
  parseRules(es);
  const yous = [];
  for (const e of es) if (e.kind === 0 && hp(e, YOUB)) yous.push(e);
  if (yous.length === 0) return { i: ints, moved: false, won: false, lost: true };
  let anyMoved = false;
  for (const you of yous) {
    const nx = you.x + dx, ny = you.y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
    let blocked = false; const pt = [];
    for (const t of es) if (t.x === nx && t.y === ny) { if (hp(t, PUSHB)) pt.push(t); else if (hp(t, STOPB)) blocked = true; }
    if (blocked) continue;
    let can = true;
    for (const t of pt) if (!tryPush(es, t, dx, dy, W, H, {})) { can = false; break; }
    if (can) { you.x = nx; you.y = ny; anyMoved = true; }
  }
  const enc = () => es.map(e => pack(e.kind, e.name, e.x, e.y));
  if (!anyMoved) return { i: enc(), moved: false, won: false, lost: false };
  let changed = true, it = 0; // applyTransforms (fixed point)
  while (changed && it < 10) {
    changed = false; it++;
    parseRules(es);
    for (const e of es) if (e.kind === 0) { const nn = trans[e.name]; if (nn >= 0 && nn !== e.name) { e.name = nn; changed = true; } }
  }
  parseRules(es);
  const groups = new Map(); // applyInteractions
  for (const e of es) { if (e.kind !== 0) continue; const kk = e.x * 16 + e.y; let a = groups.get(kk); if (!a) groups.set(kk, a = []); a.push(e); }
  const rm = new Set();
  for (const a of groups.values()) {
    if (a.length < 2) continue;
    if (a.some(e => hp(e, SINKB))) { for (const e of a) rm.add(e); continue; }
    if (a.some(e => hp(e, HOTB)) && a.some(e => hp(e, MELTB))) for (const e of a) if (hp(e, MELTB)) rm.add(e);
    if (a.some(e => hp(e, DEFB)) && a.some(e => hp(e, YOUB))) for (const e of a) if (hp(e, YOUB)) rm.add(e);
    if (a.some(e => hp(e, OPB)) && a.some(e => hp(e, SHB))) for (const e of a) if (hp(e, OPB) || hp(e, SHB)) rm.add(e);
  }
  for (const a of groups.values()) { if (a.length < 2) continue; for (const e of a) if (hp(e, WB)) rm.add(e); }
  const out = rm.size ? es.filter(e => !rm.has(e)) : es;
  let won = false, hasYou = false; // checkWin + checkLose
  for (const e of out) {
    if (e.kind !== 0) continue;
    if (hp(e, YOUB)) {
      hasYou = true;
      if (!won) for (const m of out) if (m !== e && m.kind === 0 && m.x === e.x && m.y === e.y && hp(m, WINB)) { won = true; break; }
    }
  }
  return { i: out.map(e => pack(e.kind, e.name, e.x, e.y)), moved: true, won, lost: !won && !hasYou };
}
function bfs(ints0, W, H, budgetMs) {
  const tEnd = Date.now() + budgetMs;
  const seen = new Set([ints0.join(',')]);
  let frontier = [{ i: ints0, prev: null, d: -1 }];
  while (frontier.length) {
    const nf = [];
    for (const n of frontier) {
      for (let d = 0; d < 4; d++) {
        const r = step(n.i, DX[d], DY[d], W, H);
        if (!r.moved) continue;
        const child = { i: r.i, prev: n, d };
        if (r.won) {
          const path = []; let c = child;
          while (c.d >= 0) { path.push(c.d); c = c.prev; }
          return path.reverse();
        }
        if (r.lost) continue;
        const k = r.i.join(',');
        if (seen.has(k)) continue;
        if (seen.size > 5000000) return null;
        seen.add(k);
        nf.push(child);
      }
    }
    frontier = nf;
    if (Date.now() > tEnd) return null;
  }
  return null;
}
/* random real-key walk; assert mirror == engine after EVERY move */
function fidelity(nMoves) {
  let s = 424242;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let cur = readState();
  for (let i = 0; i < nMoves; i++) {
    const stt = call('__RW.st()');
    if (stt.won || stt.lost) break;
    const d = Math.floor(rnd() * 4);
    const r = step(cur, DX[d], DY[d], call('__RW.w()'), call('__RW.h()'));
    key(KEY[d]);
    const eng = readState();
    if (eng.join(',') !== r.i.join(',')) return 'move ' + i + ' dir ' + d;
    cur = eng;
  }
  return null;
}

const t0 = Date.now();
function winLevel() { // number = moves used; string = failure reason
  const W = call('__RW.w()'), H = call('__RW.h()'), ints0 = readState();
  for (const bud of [2600, 26000]) {
    if (Date.now() - t0 > 100000 - bud - 3000) continue; // skip only budgets that can't fit
    const sol = bfs(ints0, W, H, bud);
    if (sol) {
      for (const d of sol) key(KEY[d]);
      const stt = call('__RW.st()');
      if (!stt.won) return 'replay-mismatch';
      g.pump(40); // real 500ms win-modal timer
      if (call('__RW.win()') !== true) return 'no-win-modal';
      return sol.length;
    }
  }
  return 'no-solution-in-budget';
}

// ---- level 1: tutorial, real key input, real undo, win via real keys ----
T('tutorial-on-l1', call('__RW.tut()') === true, 'tutorial not shown');
call('closeTutorial()');
T('tutorial-closes', call('__RW.tut()') === false, 'still active');
const ents1 = readState().join(',');
const mv0 = call('__RW.st().moves');
key('ArrowRight');
T('key-input-moves', call('__RW.st().moves') === mv0 + 1 && readState().join(',') !== ents1, 'moves=' + call('__RW.st().moves'));
key('z');
T('undo-restores', readState().join(',') === ents1 && call('__RW.st().moves') === mv0, 'undo state differs');
const l1 = winLevel();
T('l1-won-via-keys', typeof l1 === 'number', String(l1));
T('l1-stars-saved', ((call('__RW.prog()') || {})['l0'] || 0) >= 1, 'prog=' + JSON.stringify(call('__RW.prog()')).slice(0, 60));

// ---- chain levels 2..25 through the real Next Level handler ----
call('nextLevel()'); g.pump(2);
const ents2 = readState().join(',');
key('ArrowRight'); key('ArrowDown'); key('ArrowRight');
key('r');
T('restart-key-resets', readState().join(',') === ents2 && call('__RW.st().moves') === 0, 'restart state differs');
const moves = ['1:' + l1], det = [];
let chainOk = true;
for (let idx = 1; idx <= 24 && Date.now() - t0 < 90000; idx++) {
  if (call('__RW.st().idx') !== idx) { chainOk = false; det.push('idx' + idx + ' got ' + call('__RW.st().idx')); break; }
  if (idx === 5) { // mirror fidelity stress on "Sink or Swim" (sink/push/transform)
    const fid = fidelity(120); T('mirror-fidelity', fid === null, String(fid));
    key('r'); g.pump(1);
  }
  const r = winLevel();
  if (typeof r !== 'number') { chainOk = false; det.push((idx + 1) + ':' + r); break; }
  moves.push((idx + 1) + ':' + r + '@' + (Date.now() - t0) + 'ms');
  if (idx < 24) { call('nextLevel()'); g.pump(2); }
}
T('levels-2-25-chain', chainOk && moves.length === 25, moves.length + '/25 [' + det.join(';') + ']');
call('nextLevel()'); g.pump(2); // finishing level 25 -> Congratulations tutorial
T('final-congrats', call('__RW.tut()') === true, 'congrats tutorial not shown');
const pr = call('__RW.prog()') || {};
let all25 = true; for (let i = 0; i < 25; i++) if (!(pr['l' + i] >= 1)) all25 = false;
T('progress-all-25', all25, Object.keys(pr).length + ' prog keys');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: moves.length + '/25', moves: moves.join(' '), stuck: det.join(';') } };
console.log('rule-rewrite: ' + moves.length + '/25 levels via real keys -> engine checkWin: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
