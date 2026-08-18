#!/usr/bin/env node
/* black verifier — 30 mini-game levels, each driven through its REAL interaction path
 * (element click/pointer events, canvas taps, input handlers) until showWin fires.
 * Drivers below were written from each render()'s own listeners; nothing is short-circuited.
 * P0 fixed en route: L23's win check measured the moon's distance from its own orbit
 * center (always R=80) so d<20 was unreachable — orbit now pulses through the sun. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('black', { inject: {
  anchor: 'function showWin(){',
  exports: `globalThis.__K = { load: (n) => loadLevel(n), cur: () => state.current, total: () => TOTAL };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const el = id => g.els[id];
const winShown = () => (el('win').classList.contains('show'));
const click = e => e.dispatch('click', {});
const ptr = (e, type, x, y) => e.dispatch(type, { clientX: x, clientY: y, preventDefault() {} });
const qdiv = () => { const st = el('stage'); return (st.__qs && st.__qs['div']) || g.els['q:div']; }; // stage.querySelector('div') per-element cache

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-exist', g.call('__K.total()') === 30, 'total=' + g.call('__K.total()'));

// one fresh boot per level (a browser reload): pending win/tick timers from a previous
// level otherwise leak across and contaminate the next level's win screen check
function play(level, frames, driver) {
  const gg = bootGame('black', { inject: { anchor: 'function showWin(){', exports: 'globalThis.__K={load:n=>loadLevel(n)};' } });
  const gel = id => gg.els[id];
  const gwin = () => gel('win').classList.contains('show');
  const gclick = e => e.dispatch('click', {});
  const gptr = (e, t, x, y) => e.dispatch(t, { clientX: x, clientY: y, preventDefault() {} });
  const gqdiv = () => { const st = gel('stage'); return (st.__qs && st.__qs['div']) || gg.els['q:div']; };
  const gchildren = c => (c && c.children) || [];
  gg.call(`__K.load(${level})`); gg.pump(2);
  try { driver(gg, gel, gwin, gclick, gptr, gqdiv, gchildren); } catch (e) { fails.push('L' + level + ' driver threw: ' + e.message); return false; }
  for (let i = 0; i < frames && !gwin(); i++) gg.pump(1);
  return gwin();
}
const children = c => (c && c.children) || [];

const DRIVERS = { // (g, el, winShown, click, ptr, qdiv, children)
  1: (g, el, winShown, click, ptr, qdiv, children) => { ptr(el('orb1'), 'pointerdown', 10, 10); }, // hold-to-charge: tick() runs on rAF
  2: (g, el, winShown, click, ptr, qdiv, children) => { ptr(el('moon2'), 'pointerdown', 60, 60); ptr(el('moon2'), 'pointermove', 120, 120); },
  3: (g, el, winShown, click, ptr, qdiv, children) => { children(qdiv()).forEach(click); }, // 5 star taps
  4: (g, el, winShown, click, ptr, qdiv, children) => { ptr(el('plate4'), 'pointerdown', 10, 10); }, // hold 2s via rAF tick
  5: (g, el, winShown, click, ptr, qdiv, children) => { [100, 380, 100, 380].forEach(x => ptr(el('stage'), 'pointermove', x, 100)); }, // cross the flame mid 3x
  6: (g, el, winShown, click, ptr, qdiv, children) => { for (const h of ['hand6a', 'hand6b']) { ptr(el(h), 'pointerdown', 50, 50); ptr(el(h), 'pointermove', 50, 50); } },
  7: (g, el, winShown, click, ptr, qdiv, children) => { for (const ch of ['B', 'L', 'A', 'C', 'K']) { const t = children(qdiv()).find(c => c._ch === ch); if (t) click(t); } },
  8: (g, el, winShown, click, ptr, qdiv, children) => { g.pump(250); for (const i of [2, 0, 3, 1]) { click(el('b8_' + i)); g.pump(3); } }, // wait out the flash sequence
  9: (g, el, winShown, click, ptr, qdiv, children) => { let x = 10; for (let i = 0; i < 25; i++) { x += 9; ptr(el('cv9'), 'pointermove', x, 20 + i * 4); } },
  10: (g, el, winShown, click, ptr, qdiv, children) => {}, // countdown reaches 0.0 on its own — just wait
  11: (g, el, winShown, click, ptr, qdiv, children) => { const objs = children(el('objs11')), shads = children(el('shads11'));
    for (const o of objs) { click(o); const sh = shads.find(s => s._n === o._n); if (sh) { click(sh); g.pump(1); } } },
  12: (g, el, winShown, click, ptr, qdiv, children) => { children(el('dials12')).forEach(d => { const need = (10 - d._val) % 10; let y = 100;
    ptr(d, 'pointerdown', 10, y); for (let i = 0; i < need; i++) { y -= 16; ptr(d, 'pointermove', 10, y); } }); },
  13: (g, el, winShown, click, ptr, qdiv, children) => { g.pump(250); const ks = children(el('keys13')); for (const i of [0, 2, 3, 2]) { click(ks[i]); g.pump(3); } },
  14: (g, el, winShown, click, ptr, qdiv, children) => { for (const i of [0, 2, 4, 6, 8]) { const cs = children(el('grid14')); if (cs[i]) click(cs[i]); g.pump(1); } }, // lit tiles are 0,2,4,6,8; grid re-renders each tap
  15: (g, el, winShown, click, ptr, qdiv, children) => { for (let i = 0; i < 5; i++) { click(el('tower15')); g.pump(3); } },
  16: (g, el, winShown, click, ptr, qdiv, children) => { const inp = el('inp16'); inp.value = 'DARK'; inp.oninput && inp.oninput({}); },
  17: (g, el, winShown, click, ptr, qdiv, children) => { children(el('grid17')).forEach((c, i) => { click(c); g.pump(1); }); },
  18: (g, el, winShown, click, ptr, qdiv, children) => { const t = children(el('grid18')).find(c => /#000/.test(c.style.cssText || '')); if (t) click(t); },
  19: (g, el, winShown, click, ptr, qdiv, children) => { const path = [[1, 0], [1, 1], [1, 2], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4]]; // row-2 corridor — (2,1) is a wall
    for (const [cx, cy] of path) { ptr(el('cv19'), 'click', cx * 50 + 25, cy * 50 + 25); g.pump(1); } },
  20: (g, el, winShown, click, ptr, qdiv, children) => { for (let i = 0; i < 5; i++) { click(el('rAdd')); g.pump(1); } }, // 7 vs 2 -> +5 right
  21: (g, el, winShown, click, ptr, qdiv, children) => { ptr(el('cv21'), 'pointerdown', 230, 140); for (let k = 0; k <= 33; k++) { const a = k * (Math.PI / 16); ptr(el('cv21'), 'pointermove', 140 + 90 * Math.cos(a), 140 + 90 * Math.sin(a)); } }, // 33 steps: an exact 360.0 loses to float error at the >=360 check,
  22: (g, el, winShown, click, ptr, qdiv, children) => { for (const n of [1, 4, 9, 16, 25]) { const t = children(qdiv()).find(c => c._n === n); if (t) click(t); } },
  23: (g, el, winShown, click, ptr, qdiv, children) => { // angle is closure-local — probe by tapping periodically; a miss just resumes the spin, a hit during the dive wins
    for (let i = 0; i < 26; i++) { click(el('tap23')); g.pump(25); } },
  24: (g, el, winShown, click, ptr, qdiv, children) => { g.pump(85); click(el('stop24')); }, // angle = 2/frame -> 170deg at frame 85, inside 180±15
  25: (g, el, winShown, click, ptr, qdiv, children) => { ['r25', 'g25', 'b25'].forEach(id => { click(el(id)); g.pump(1); }); },
  26: (g, el, winShown, click, ptr, qdiv, children) => { const used = new Set(); for (const n of [1, 1, 2, 3, 5, 8, 13]) {
    const t = children(qdiv()).find((c, i) => c._n === n && !used.has(c)); if (t) { used.add(t); click(t); } } },
  27: (g, el, winShown, click, ptr, qdiv, children) => { const t = children(el('opts27')).find(c => String(c.textContent) === '3'); if (t) click(t); },
  28: (g, el, winShown, click, ptr, qdiv, children) => { const t = children(el('opts28')).find(c => String(c.textContent) === '8'); if (t) click(t); },
  29: (g, el, winShown, click, ptr, qdiv, children) => { const t = children(el('opts29')).find(c => String(c.textContent) === '255'); if (t) click(t); },
  30: (g, el, winShown, click, ptr, qdiv, children) => { const cs = children(el('stage')).filter(c => c._n >= 1 && c._n <= 7).sort((a, b) => a._n - b._n);
    for (const c of cs) { click(c); g.pump(2); } },
};

const solved = [];
for (let lv = 1; lv <= 30; lv++) {
  if (play(lv, 600, (g, el, winShown, click, ptr, qdiv, children) => { const fn = DRIVERS[lv]; fn && fn(g, el, winShown, click, ptr, qdiv, children); })) solved.push(lv);
  else fails.push('L' + lv + ' not won');
}
T('levels-won', solved.length === 30, solved.length + '/30 missing:[' + [...Array(30).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { won: solved.length + '/30' } };
console.log('black: ' + solved.length + '/30 mini-games won through real interactions: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
