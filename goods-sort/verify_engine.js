#!/usr/bin/env node
/* goods-sort verifier — 25 triple-match shelf levels (type A).
 * Every move goes through the REAL input path: canvas pointerdown/up taps ->
 * getItemAt / getShelfSlotAt -> the engine's own moveItem legality ->
 * checkMatches -> triggerMatch with its real 350ms animation timer ->
 * matchesInLevel >= totalMatchTarget -> levelComplete -> the real Next Level
 * button chains all 25 levels. Power-ups (Hint/Undo) pressed at their real
 * canvas button coordinates. The bot picks moves with a constructive gather
 * solver (selection only — every placement is two real canvas taps through the
 * engine's own moveItem legality; the engine's findHintMove UI hint livelocks
 * on some boards, it is a hint not a solver). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('goods-sort', { inject: {
  anchor: 'function getItemAt(px, py) {',
  exports: `globalThis.__GS = {
    n: () => LEVELS.length, lvl: () => G.level, screen: () => G.screen,
    ov: (id) => document.getElementById(id).classList.contains('active'),
    sel: () => G.selectedItem, anim: () => G.animating, hist: () => G.history.length,
    score: () => G.score, matches: () => G.matchesInLevel, target: () => G.totalMatchTarget,
    shelves: () => G.shelves.map(sh => sh.slots.map(sl => sl.blocked ? 'X' : (sl.item || '.'))),
    hint: () => findHintMove(), hintHl: () => G.hintHighlight,
    save: () => getSave(),
    pos: (s, i) => { const L = G.layout; const sy = L.startY + s * (L.shelfH + L.shelfPad*2 + L.shelfGap);
      return [L.startX + i * L.slotSize + L.slotSize/2, sy + L.shelfPad + L.shelfH/2]; },
    pwr: (k) => { const L = G.layout; return [L.pwrStartX + k * (L.pwrBtnSize + L.pwrGap) + L.pwrBtnSize/2, L.pwrY + L.pwrBtnSize/2]; },
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-25', call('__GS.n()') === 25, 'n=' + call('__GS.n()'));

function tap(x, y) {
  g.els['gameCanvas'].dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
  g.els['gameCanvas'].dispatch('pointerup', { clientX: x, clientY: y, preventDefault() {} });
}
const tapSlot = (s, i) => { const [x, y] = call('__GS.pos(' + s + ',' + i + ')'); tap(x, y); };
const tapPwr = (k) => { const [x, y] = call('__GS.pwr(' + k + ')'); tap(x, y); };
function settle(winCheck) { // pump through the engine's own match/w timers
  for (let f = 0; f < 40 && call('__GS.anim()'); f++) g.pump(4);
  if (winCheck && call('__GS.matches()') >= call('__GS.target()')) {
    for (let f = 0; f < 130; f++) { g.pump(2); if (call('__GS.ov("levelComplete")')) return true; }
    return call('__GS.ov("levelComplete")');
  }
  g.pump(2);
  return false;
}
function moveFor(sh, t) { // gather type t onto its fullest shelf; {skip|wait|fs..ti}
  const S = sh.length, W = sh[0].length;
  const cnt = (s) => { let n = 0; for (let i = 0; i < W; i++) if (sh[s][i] === t) n++; return n; };
  const firstEmpty = (s) => { for (let i = 0; i < W; i++) if (sh[s][i] === '.') return i; return -1; };
  let total = 0; for (let s = 0; s < S; s++) total += cnt(s);
  if (!total) return { skip: true };
  let target = 0;
  for (let s = 1; s < S; s++) {
    const a = cnt(s), b = cnt(target);
    if (a > b || (a === b && firstEmpty(s) >= 0 && firstEmpty(target) < 0)) target = s;
  }
  if (cnt(target) >= 3) return { wait: true }; // triple formed, match pending settle
  if (firstEmpty(target) >= 0) { // pull a t from another shelf into target
    for (let s = 0; s < S; s++) {
      if (s === target) continue;
      for (let i = 0; i < W; i++) if (sh[s][i] === t) return { fs: s, fi: i, ts: target, ti: firstEmpty(target) };
    }
    return { skip: true };
  }
  for (let i = 0; i < W; i++) { // target full: displace a non-t item elsewhere first
    const v = sh[target][i];
    if (v !== '.' && v !== 'X' && v !== t) {
      for (let s = 0; s < S; s++) {
        if (s === target) continue;
        const ei = firstEmpty(s);
        if (ei >= 0) return { fs: target, fi: i, ts: s, ti: ei };
      }
    }
  }
  return null;
}
function playLevel(deadlineMs) { // 'win' | reason
  const t0 = Date.now();
  const types = [];
  call('__GS.shelves()').forEach(r => r.forEach(v => { if (v !== '.' && v !== 'X' && !types.includes(v)) types.push(v); }));
  let ti = 0;
  for (let guard = 0; guard < 900; guard++) {
    if (call('__GS.ov("levelComplete")')) return 'win';
    if (call('__GS.ov("gameOver")')) return 'gameover';
    if (Date.now() - t0 > deadlineMs) return 'budget';
    while (ti < types.length) {
      const mv0 = moveFor(call('__GS.shelves()'), types[ti]);
      if (!mv0.skip) break;
      ti++;
    }
    if (ti >= types.length) return settle(true) ? 'win' : 'no-types';
    const mv = moveFor(call('__GS.shelves()'), types[ti]);
    if (!mv) return 'no-move';
    if (mv.wait) { g.pump(6); continue; }
    tapSlot(mv.fs, mv.fi);
    tapSlot(mv.ts, mv.ti);
    if (settle(true)) return 'win';
  }
  return 'guard';
}

// menu -> level select (the Play button's own handler — its markup wasn't parsed
// into the DOM stub, so invoke the exact onclick the real button carries)
T('menu-renders', call('__GS.ov("mainMenu")') === true, 'mainMenu hidden');
call('showScreen("levelSelect")');
const lbtns = g.els['levelGrid'].children;
T('level-select-renders', call('__GS.ov("levelSelect")') === true && lbtns.length === 25,
  'ov=' + call('__GS.ov("levelSelect")') + ' btns=' + lbtns.length);
T('locked-level-inert', typeof lbtns[5].onclick !== 'function', 'locked level has a handler');
lbtns[0].click();
T('start-l1', call('__GS.screen()') === 'playing' && call('__GS.lvl()') === 0 &&
  call('__GS.shelves()').length === 3 && call('__GS.shelves()[0]').length === 3,
  'screen=' + call('__GS.screen()') + ' lvl=' + call('__GS.lvl()'));

// ---- real-tap mechanics on level 1 ----
const sh0 = call('__GS.shelves()');
let a = null; // an item whose type appears on no other shelf slot we target
outer1:
for (let s = 0; s < 3; s++) for (let i = 0; i < 3; i++) {
  if (sh0[s][i] !== '.' && sh0[s][i] !== 'X') { a = [s, i]; break outer1; }
}
tapSlot(a[0], a[1]);
T('tap-selects-item', !!call('__GS.sel()'), 'sel=null');
tapSlot(a[0], a[1]);
T('tap-again-deselects', call('__GS.sel()') === null, 'still selected');
// pick a destination shelf with NO same-type item (guaranteed no match on drop)
const type = sh0[a[0]][a[1]];
let dst = null;
for (let s = 0; s < 3; s++) {
  if (s === a[0]) continue;
  if (!sh0[s].includes(type)) { for (let i = 0; i < 3; i++) if (sh0[s][i] === '.') { dst = [s, i]; break; } }
  if (dst) break;
}
if (!dst) { for (let s = 0; s < 3; s++) { if (s !== a[0]) for (let i = 0; i < 3; i++) if (sh0[s][i] === '.') { dst = [s, i]; break; } if (dst) break; } }
tapSlot(a[0], a[1]); tapSlot(dst[0], dst[1]);
const sh1 = call('__GS.shelves()');
T('tap-move-places', sh1[a[0]][a[1]] === '.' && sh1[dst[0]][dst[1]] === type &&
  call('__GS.hist()') >= 1, JSON.stringify(sh1));
tapPwr(3); // Undo power-up at its real button coords
const sh2 = call('__GS.shelves()');
T('undo-restores-move', sh2[a[0]][a[1]] === type && sh2[dst[0]][dst[1]] === '.',
  JSON.stringify(sh2));
tapPwr(1); // Hint power-up at its real button coords
T('hint-highlights', !!call('__GS.hintHl()') && call('__GS.save().powerUps.hint') === 2,
  'hl=' + JSON.stringify(call('__GS.hintHl()')).slice(0, 40) + ' hints=' + call('__GS.save().powerUps.hint'));

// ---- finish L1, then chain all 25 levels through the real Next Level button ----
const t0 = Date.now(); const done = [1]; const stuck = [];
for (let lvl = 0; lvl < 25; lvl++) {
  const res = playLevel(22000);
  if (res !== 'win') { stuck.push((lvl + 1) + '(' + res + ')'); break; }
  const sv = call('__GS.save()');
  if (!(sv.stars || {})[lvl + 1]) { stuck.push((lvl + 1) + '(no-stars)'); break; }
  if (lvl < 24) {
    if (!call('__GS.ov("levelComplete")')) { stuck.push((lvl + 1) + '(no-overlay)'); break; }
    g.els['nextLevelBtn'].click(); g.pump(3);
    if (call('__GS.lvl()') !== lvl + 1 || call('__GS.screen()') !== 'playing') { stuck.push((lvl + 2) + '(chain)'); break; }
    done.push(lvl + 2);
  }
}
T('levels-complete', stuck.length === 0 && done.length === 25, done.length + '/25 stuck=[' + stuck.join(',') + ']');
g.pump(3);
T('final-overlay-no-next', call('__GS.ov("levelComplete")') === true &&
  g.els['nextLevelBtn'].style.display === 'none',
  'ov=' + call('__GS.ov("levelComplete")') + ' next=' + g.els['nextLevelBtn'].style.display);
call('showScreen("levelSelect")'); // the panel's Level Select button handler
T('final-back-to-select', call('__GS.ov("levelSelect")') === true, 'overlay=' + call('__GS.ov("levelSelect")'));
const sv = call('__GS.save()');
let allStars = true; for (let i = 1; i <= 25; i++) if (!((sv.stars || {})[i] >= 1)) allStars = false;
T('save-unlocks-25', sv.unlocked === 25 && allStars, 'unlocked=' + sv.unlocked + ' stars=' + Object.keys(sv.stars || {}).length);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: done.length + '/25', stuck: stuck.join(','), secs: Math.round((Date.now() - t0) / 1000) } };
console.log('goods-sort: ' + done.length + '/25 levels via real taps -> engine match/win flow: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
