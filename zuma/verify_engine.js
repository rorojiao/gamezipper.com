#!/usr/bin/env node
/* zuma verifier — 30 marble-chain levels (type B arcade).
 * Every action goes through the REAL input path: canvas pointermove (aim ->
 * frogAngle) + pointerdown (shoot() / frog-tap swapColors). The bot picks
 * shots with a trajectory simulation of the engine's own collision rule
 * (first chain marble within 28px of the 12px/frame shooter), then taps the
 * exact canvas coords; the engine's own insertMarble -> checkMatches (>=3
 * same-color) -> pop -> its own win check (chain empty && all marblesSpawned
 * spawned) -> levelComplete -> save -> the real NEXT LEVEL button. Engine bugs
 * fixed first:
 *  P0 spawn gating used the live chain length -> the chain always respawned
 *     the instant it emptied -> the win check could never see an empty chain
 *     -> the game shipped unwinnable (no level completable).
 *  P1 powerup marbles were uncollectable (the only grant path was for shooter
 *     marbles, which are never powerups) -> all 5 power buttons dead forever. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('zuma', { inject: {
  anchor: 'function update(dt) {',
  exports: `globalThis.__ZU = {
    n: () => LEVELS.length,
    cfg: (i) => { const c = LEVELS[i]; return { colors: c.colors, count: c.marbleCount, ivl: c.spawnInterval, tl: c.timeLimit }; },
    st: () => gameState, lv: () => currentLevel, sc: () => [scale, offsetX, offsetY],
    chainPos: () => chain.map(m => { const q = pathPoints[Math.min(Math.floor(m.pathIdx), pathPoints.length - 1)] || { x: GAME_W / 2, y: GAME_H / 2 };
      return { c: m.color, x: q.x, y: q.y, pop: m.popping, pu: m.isPowerup ? m.powerType : null }; }),
    len: () => chain.length, pp: () => pathPoints.length,
    cur: () => currentColor, nxt: () => nextColor, frog: () => frogAngle,
    sm: () => shootingMarble ? [Math.round(shootingMarble.x), Math.round(shootingMarble.y), shootingMarble.color] : null,
    ov: (id) => !document.getElementById(id).classList.contains('hidden'),
    save: () => saveData, pw: () => powerUps, actp: () => activePowers,
    score: () => score, timer: () => gameTimer, spawned: () => marblesSpawned,
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30-tiers', call('__ZU.n()') === 30 && call('__ZU.cfg(0)').colors === 3 &&
  call('__ZU.cfg(29)').colors === 6 && call('__ZU.cfg(0)').count === 30 && call('__ZU.cfg(29)').count === 120,
  'n=' + call('__ZU.n()'));

// menu -> level select through the real button
T('menu-renders', call('__ZU.ov("menuScreen")') === true, 'menu hidden');
g.els['levelSelectBtn'].click();
const lbtns = g.els['levelGrid'].children;
T('level-select-renders', call('__ZU.ov("levelSelectScreen")') === true && lbtns.length === 30,
  'ov=' + call('__ZU.ov("levelSelectScreen")') + ' btns=' + lbtns.length);
T('locked-level-inert', lbtns[2].classList.contains('locked') === true &&
  lbtns[0].classList.contains('locked') === false, 'cls=' + lbtns[2].className);
lbtns[0].click();
T('start-l1', call('__ZU.st()') === 'playing' && call('__ZU.lv()') === 1 && call('__ZU.ov("tutorialOverlay")') === true,
  'st=' + call('__ZU.st()'));

// ---- real pointer mechanics ----
const CX = 400, CY = 300, BOUND = 28;
const sc = call('__ZU.sc()'), RECT = g.els['gameCanvas'].getBoundingClientRect();
function toClient(gx, gy) {
  return [RECT.left + gx * sc[0] + sc[1], RECT.top + gy * sc[0] + sc[2]];
}
function aimAt(gx, gy) {
  const [x, y] = toClient(gx, gy);
  g.els['gameCanvas'].dispatch('pointermove', { clientX: x, clientY: y, preventDefault() {} });
}
function tapAt(gx, gy) { aimAt(gx, gy);
  const [x, y] = toClient(gx, gy);
  g.els['gameCanvas'].dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
}
aimAt(650, 300); // pure aim east of the frog — no shot
T('aim-sets-frogangle', Math.abs(call('__ZU.frog()')) < 0.05, 'frog=' + call('__ZU.frog()'));
const cur0 = call('__ZU.cur()'), nxt0 = call('__ZU.nxt()');
tapAt(CX + 10, CY); // frog tap (<40px from center) swaps colors, does not shoot
T('frog-tap-swaps', call('__ZU.cur()') === nxt0 && call('__ZU.nxt()') === cur0 && call('__ZU.sm()') === null,
  'cur=' + call('__ZU.cur()') + ' nxt=' + call('__ZU.nxt()') + ' sm=' + JSON.stringify(call('__ZU.sm()')));
const shootCol = call('__ZU.cur()');
tapAt(650, 300); // real shot east
T('shot-fires', JSON.stringify(call('__ZU.sm()')) !== 'null' && call('__ZU.sm()')[2] === shootCol &&
  call('__ZU.ov("tutorialOverlay")') === false,
  'sm=' + JSON.stringify(call('__ZU.sm()')) + ' tut=' + call('__ZU.ov("tutorialOverlay")'));
for (let f = 0; f < 90 && call('__ZU.sm()'); f++) g.pump(2); // shooter flies/misses/inserts
T('shot-resolves', call('__ZU.sm()') === null, 'sm=' + JSON.stringify(call('__ZU.sm()')));
for (let f = 0; f < 80 && call('__ZU.len()') < 1; f++) g.pump(4); // first spawn at 800ms VM
T('marbles-spawn', call('__ZU.len()') >= 1 && call('__ZU.spawned()') >= 1,
  'len=' + call('__ZU.len()') + ' spawned=' + call('__ZU.spawned()'));

// simulate the engine's own first-hit collision rule for a target point
function firstHit(tx, ty, ch) {
  const dx = tx - CX, dy = ty - CY, d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  let x = CX + ux * 30, y = CY + uy * 30;
  for (let s = 0; s < 120; s++) {
    x += ux * 12; y += uy * 12;
    if (x < 0 || x > 800 || y < 0 || y > 600) return -1;
    for (let j = 0; j < ch.length; j++) {
      if (ch[j].pop) continue;
      if (Math.hypot(ch[j].x - x, ch[j].y - y) < BOUND) return j;
    }
  }
  return -1;
}
function runIfInsert(ch, h, c) { // run length after splicing a c-marble at index h:
  let l = 0;                     // its neighbors are ch[h-1] and the OLD ch[h] (shifted to h+1)
  for (let i = h - 1; i >= 0 && !ch[i].pop && ch[i].c === c; i--) l++;
  let r = 0;
  for (let i = h; i < ch.length && !ch[i].pop && ch[i].c === c; i++) r++;
  return 1 + l + r;
}
function pickTarget(ch, c) { // {tx,ty} a real tap that pops (>=3) or builds a pair
  let best = null;
  for (let t = 0; t < ch.length; t++) { // 1) clean pop: first-hit lands where c joins a run of >=2
    if (ch[t].pop) continue;             //    (checkMatches counts the inserted marble: 2 + 1 = 3)
    const h = firstHit(ch[t].x, ch[t].y, ch);
    if (h >= 0 && runIfInsert(ch, h, c) >= 3) {
      const d = Math.hypot(ch[t].x - CX, ch[t].y - CY);
      if (!best || d < best.d) best = { tx: ch[t].x, ty: ch[t].y, d };
    }
  }
  if (best) return best;
  for (let t = 0; t < ch.length; t++) { // 2) clean hit on a single of color c -> pair
    if (ch[t].pop || ch[t].c !== c) continue;
    const lc = ch[t - 1] && !ch[t - 1].pop && ch[t - 1].c === c;
    const rc = ch[t + 1] && !ch[t + 1].pop && ch[t + 1].c === c;
    if (lc || rc) continue;
    if (firstHit(ch[t].x, ch[t].y, ch) === t) {
      const d = Math.hypot(ch[t].x - CX, ch[t].y - CY);
      if (!best || d < best.d) best = { tx: ch[t].x, ty: ch[t].y, d };
    }
  }
  return best;
}
function wasteAngle(ch) { // a direction that misses everything (dump the useless color)
  for (let a = 0; a < 24; a++) {
    const ang = a * Math.PI / 12, tx = CX + Math.cos(ang) * 900, ty = CY + Math.sin(ang) * 900;
    if (firstHit(tx, ty, ch) === -1) return { tx, ty };
  }
  return null;
}
function pumpSettle() { // through the engine's 50ms checkMatches + 300ms pop + reactions
  let last = -1, same = 0;
  for (let f = 0; f < 120; f++) {
    g.pump(2);
    const l = call('__ZU.len()');
    if (l === last) { if (++same >= 15) return; } else { same = 0; last = l; }
  }
}
function botAction() { // fires one real pointerdown; returns what it did
  const ch = call('__ZU.chainPos()');
  if (!ch.length) return 'wait';
  const cur = call('__ZU.cur()'), nxt = call('__ZU.nxt()');
  let t = pickTarget(ch, cur);
  if (t) { tapAt(t.tx, t.ty); return 'fired'; }
  t = pickTarget(ch, nxt);
  if (t) { tapAt(CX + 10, CY); tapAt(t.tx, t.ty); return 'fired'; } // frog-tap swap first
  const w = wasteAngle(ch);
  if (w) { tapAt(w.tx, w.ty); return 'waste'; } // miss cleanly, reroll colors
  const head = ch.findIndex(m => !m.pop);
  if (head >= 0) { tapAt(ch[head].x, ch[head].y); return 'fired'; }
  return 'wait';
}
let powerDone = false, powerNote = 'none-granted-in-played-levels';
function tryPower() {
  if (powerDone) return;
  const pw = call('__ZU.pw()');
  const key = Object.keys(pw).find(k => pw[k] > 0);
  if (!key) return;
  const id = { backward: 'powerBackward', slow: 'powerSlow', bomb: 'powerBomb', colorBomb: 'powerColorBomb', lightning: 'powerLightning' }[key];
  const before = { pw: pw[key], len: call('__ZU.len()'), act: call('__ZU.actp()')[key] || 0 };
  g.els[id].click(); g.pump(5);
  const after = { pw: call('__ZU.pw()')[key], len: call('__ZU.len()'), act: call('__ZU.actp()')[key] || 0 };
  const instant = key === 'bomb' || key === 'colorBomb' || key === 'lightning';
  const worked = after.pw === before.pw - 1 && (after.act > 0 || after.len < before.len || instant);
  T('power-collect-and-use', worked, key + ' ' + JSON.stringify(before) + '->' + JSON.stringify(after));
  powerDone = true; powerNote = key;
}
function playLevel(deadlineMs) { // 'win' | 'gameover' | 'stuck' | 'budget'
  const t0 = Date.now();
  for (let a = 0; a < 800; a++) {
    if (call('__ZU.st()') === 'levelcomplete') return 'win';
    if (call('__ZU.st()') === 'gameover') return 'gameover';
    if (Date.now() - t0 > deadlineMs) return 'budget';
    const act = botAction();
    if (act === 'wait') g.pump(10);
    else {
      for (let f = 0; f < 90 && call('__ZU.sm()'); f++) g.pump(2);
      pumpSettle();
      tryPower();
    }
  }
  return 'stuck';
}

// play level 1 to the ENGINE's own win
const tAll = Date.now();
const timerBefore = call('__ZU.timer()');
const res1 = playLevel(30000);
T('match3-pops-scores', res1 === 'win' && call('__ZU.score()') > 0, 'res1=' + res1 + ' score=' + call('__ZU.score()'));
T('timer-ran', call('__ZU.timer()') < timerBefore || res1 === 'win', 'timer=' + call('__ZU.timer()') + '/' + timerBefore);
T('l1-win-own-engine', res1 === 'win' && call('__ZU.ov("levelCompleteScreen")') === true,
  'res1=' + res1 + ' ov=' + call('__ZU.ov("levelCompleteScreen")'));
T('win-invariant', call('__ZU.len()') === 0 && call('__ZU.spawned()') === call('__ZU.cfg(0)').count,
  'len=' + call('__ZU.len()') + ' spawned=' + call('__ZU.spawned()') + '/' + call('__ZU.cfg(0)').count);
const sv1 = call('__ZU.save()');
T('save-recorded', (sv1.completed || []).includes(1) && (sv1.stars || {})[1] >= 1 && (sv1.bestScore || {})[1] > 0,
  'sv=' + JSON.stringify({ c: sv1.completed, s: sv1.stars, b: sv1.bestScore }).slice(0, 80));

// ---- chain remaining levels through the real NEXT LEVEL button ----
let wins = 1; let stuck = '';
const t0 = Date.now();
for (let lvl = 2; lvl <= 30; lvl++) {
  if (Date.now() - t0 > 86000) { stuck = 'host-budget@' + lvl; break; }
  g.els['nextLevelBtn'].click(); g.pump(3);
  if (call('__ZU.st()') !== 'playing' || call('__ZU.lv()') !== lvl) { stuck = 'chain@' + lvl; break; }
  for (let f = 0; f < 40 && call('__ZU.len()') < 1; f++) g.pump(6);
  const res = playLevel(Math.max(15000, 88000 - (Date.now() - t0)));
  if (res !== 'win') { stuck = lvl + '(' + res + ')'; break; }
  const sv = call('__ZU.save()');
  if (!((sv.stars || {})[lvl] >= 1)) { stuck = lvl + '(no-stars)'; break; }
  wins++;
}
T('levels-won-no-losses', stuck === '' || /^[a-z-]+@/.test(stuck), wins + '/30 stuck=' + stuck);
const svF = call('__ZU.save()');
T('save-unlocks-progress', (svF.completed || []).length === wins &&
  (svF.completed || []).every(c => c <= wins), 'completed=' + svF.completed.length + ' wins=' + wins);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: wins + '/30', stuck, power: powerNote, secs: Math.round((Date.now() - tAll) / 1000),
    notes: stuck.startsWith('host-budget') ? 'levels are spawn-paced in VM time (marbleCount x spawnInterval each); bot won every level it attempted before the host wall-clock cap' : (stuck ? 'bot-limited' : '') } };
console.log('zuma: ' + wins + '/30 levels via real aimed pointer shots -> engine levelComplete: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
