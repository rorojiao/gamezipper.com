#!/usr/bin/env node
/* hextris verifier — B-type: all 20 levels played to the engine's own triggerWin()
 * (gameState -> 'won', blocksCleared >= level.targetBlocks) via REAL window keydown
 * rotations (ArrowLeft/Right = engine rotate()). The bot mirrors findMatches() to pick
 * the best receiving column for each falling block, then rotates the hexagon so that
 * column is index 0 when the block lands — all placement/clear/score/win logic stays
 * 100% inside the engine. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hextris', { inject: {
  anchor: 'function landBlock(){',
  exports: `render = function(){}; // draw-only; headless speed
Sound.startBgm = function(){}; Sound.stopBgm = function(){}; // bgm synth uses gain.cancelScheduledValues (real AudioParam only) — audio path, not game logic
globalThis.__S = {
  start: (id) => startLevel(id),
  gs: () => gameState,
  screen: () => screen,
  score: () => score,
  cleared: () => blocksCleared,
  placed: () => blocksPlaced,
  target: () => isEndless ? Infinity : level.targetBlocks,
  cols: () => columns.map(col => col.map(b => ({ c: b.color, t: b.type }))),
  falling: () => falling ? { c: falling.color, t: falling.type } : null,
  tut: () => !overlays.tutorial.classList.contains('hidden'),
  save: () => Save.data,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
T('levels-exist', g.call('LEVELS.length') === 20, 'n=' + g.call('LEVELS.length'));

const kd = (k) => g.sandbox.dispatchEvent({ type: 'keydown', key: k, preventDefault() {} });
const ku = (k) => g.sandbox.dispatchEvent({ type: 'keyup', key: k });

// --- bot: mirrors the engine's compatible()/findMatches() semantics for move choice only ---
const compat = (a, b) => !!b && (a.t === 'rainbow' || b.t === 'rainbow' || a.c === b.c);
function findMatchesSim(b) {
  const toClear = new Set();
  for (let c = 0; c < 6; c++) {
    const col = b[c]; if (!col.length) continue;
    let start = 0;
    for (let s = 1; s <= col.length; s++) {
      const prev = col[s - 1], cur = s < col.length ? col[s] : null;
      if (cur && compat(prev, cur)) continue;
      if (s - start >= 3) for (let k = start; k < s; k++) toClear.add(c + ',' + k);
      start = s;
    }
  }
  const maxLen = Math.max(0, ...b.map(x => x.length));
  for (let s = 0; s < maxLen; s++) {
    const seq = [];
    for (let k = 0; k < 12; k++) { const c = k % 6; seq.push(b[c][s] ? c : -1); }
    let i = 0;
    while (i < seq.length) {
      if (seq[i] === -1) { i++; continue; }
      let j = i + 1;
      while (j < seq.length && seq[j] !== -1 && compat(b[seq[i]][s], b[seq[j]][s])) j++;
      if (j - i >= 3) for (let k = i; k < j; k++) toClear.add(seq[k] + ',' + s);
      i = j > i + 1 ? j : i + 1;
    }
  }
  return toClear;
}
function simClears(cols, c, entry) {
  const b = cols.map(col => col.slice());
  b[c].push(entry);
  let total = 0, m = findMatchesSim(b), guard = 0;
  while (m.size > 0 && guard++ < 20) {
    for (const key of m) { const [cc, s] = key.split(',').map(Number); b[cc][s] = null; }
    for (let cc = 0; cc < 6; cc++) b[cc] = b[cc].filter(x => x);
    total += m.size;
    m = findMatchesSim(b);
  }
  return total;
}
function chooseColumn(f, cols) {
  let best = 0, bestScore = -1e9;
  for (let c = 0; c < 6; c++) {
    const k = cols[c].length;
    if (k >= 9) continue;
    const entry = { c: f.c, t: f.t };
    let sc;
    if (f.t === 'bomb') {
      let freed = 0; cols.forEach(col => col.forEach(x => { if (x.c === f.c || x.t === 'rainbow') freed++; }));
      sc = freed * 30 - k * 5 + (k >= 7 ? 200 : 0);
    } else {
      const cleared = simClears(cols, c, entry);
      let a1 = 1; for (let d = 1; d < 6; d++) { const cc = (c + d) % 6; if (cols[cc][k] && compat(entry, cols[cc][k])) a1++; else break; }
      let a2 = 1; for (let d = 1; d < 6; d++) { const cc = (c - d + 6) % 6; if (cols[cc][k] && compat(entry, cols[cc][k])) a2++; else break; }
      let r = 1; for (let s = k - 1; s >= 0; s--) { if (cols[c][s] && compat(entry, cols[c][s])) r++; else break; }
      sc = (cleared > 0 ? 10000 + cleared * 100 : 0) + Math.max(a1 + a2 - 1, r) * 12 - k * 4;
      if (k >= 8) sc -= 100000;
      else if (k >= 7) sc -= 500;
    }
    if (sc > bestScore) { bestScore = sc; best = c; }
  }
  return best;
}

const DEADLINE = Date.now() + 100000;
const results = [];
for (let id = 1; id <= 20 && Date.now() < DEADLINE; id++) {
  g.call(`__S.start(${id})`);
  if (g.call('__S.tut()')) g.els.tutStart.click(); // first-run tutorial: engine's own button
  g.pump(3);
  let ok = false, reason = '';
  for (let blk = 0; blk < 700; blk++) {
    const gs = g.call('__S.gs()');
    if (gs === 'won') { ok = true; break; }
    if (gs === 'over') { reason = 'gameover@placed' + g.call('__S.placed()'); break; }
    const f = g.call('__S.falling()');
    if (!f) { g.pump(2); continue; }
    const target = chooseColumn(f, g.call('__S.cols()'));
    const cw = (6 - target) % 6, ccw = target; // rotations so columns[target] lands as index 0
    const key = cw <= ccw ? 'ArrowRight' : 'ArrowLeft', n = Math.min(cw, ccw);
    for (let r = 0; r < n; r++) { kd(key); ku(key); }
    let landed = false;
    const placed0 = g.call('__S.placed()');
    for (let fr = 0; fr < 160; fr++) { // landing signal = engine's own blocksPlaced++ inside landBlock
      g.pump(3);
      const gs2 = g.call('__S.gs()');
      if (gs2 === 'won') { ok = true; break; }
      if (gs2 === 'over') { reason = 'gameover'; break; }
      if (g.call('__S.placed()') > placed0) { landed = true; break; }
    }
    if (ok || reason === 'gameover') break;
    if (!landed) { reason = 'stuck'; break; }
    if (Date.now() > DEADLINE) { reason = 'deadline'; break; }
  }
  if (ok) results.push(id); else fails.push('L' + id + (reason ? ' ' + reason : ' not won'));
  if (!ok && id === 1) break; // level 1 must be winnable; stop early on fundamental breakage
}
T('levels-won', results.length === 20, results.length + '/20 missing:[' + Array.from({ length: 20 }, (_, i) => i + 1).filter(x => !results.includes(x)).join(',') + ']');

const save = g.call('__S.save()');
T('save-progress', save && save.unlocked >= 20 && save.endlessUnlocked === true,
  'unlocked=' + (save && save.unlocked) + ' endless=' + (save && save.endlessUnlocked));

// pause/resume through real key input on level 1
g.call('__S.start(1)'); g.pump(3);
kd(' '); g.pump(2);
const paused = g.call('__S.gs()') === 'paused';
kd(' '); g.pump(2);
T('pause-resume-keys', paused && g.call('__S.gs()') === 'playing', 'paused=' + paused + ' after=' + g.call('__S.gs()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { won: results.length + '/20' } };
console.log('hextris: ' + results.length + '/20 levels via real-key rotation bot to engine triggerWin: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
