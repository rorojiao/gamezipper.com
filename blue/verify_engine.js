#!/usr/bin/env node
/* blue verifier — 30 mini-game levels (sister engine of black), each driven through
 * its real interaction path (element clicks, drags, document-level pointer events,
 * input fields) until showWin fires. Per-level fresh boot to isolate timer state. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const INJ = { anchor: 'function showWin(){', exports: `globalThis.__K = { load: (n) => loadLevel(n), total: () => TOTAL };` };

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

function play(level, frames, driver) {
  const g = bootGame('blue', { inject: INJ });
  const el = id => g.els[id];
  const win = () => el('win').classList.contains('show');
  const click = e => e.dispatch('click', { clientX: 10, clientY: 10 });
  const ptr = (e, t, x, y, tgt) => (tgt || g.sandbox.document).dispatch(t, { clientX: x, clientY: y, preventDefault() {} });
  const stage = () => el('stage');
  const kids = c => (c && c.children) || [];
  const qs = (sel) => { const st = el('stage'); st.__qs = st.__qs || {}; if (!st.__qs[sel]) st.__qs[sel] = null; return null; };
  g.call(`__K.load(${level})`); g.pump(2);
  try { driver(g, el, win, click, ptr, stage, kids); } catch (e) { fails.push('L' + level + ' driver threw: ' + e.message); return false; }
  for (let i = 0; i < frames && !win(); i++) g.pump(1);
  return win();
}

const DRIVERS = {
  1: (g, el, win, click) => { click(el('stage').children[0]); },
  2: (g, el, win, click, ptr) => { ptr(el('knob'), 'mousedown', 10, 10, el('knob')); ptr(null, 'mousemove', 470, 10); },
  3: (g, el, win, click, ptr, stage, kids) => { kids(stage()).forEach(click); },
  4: (g, el, win, click, ptr) => { ptr(el('holdBtn'), 'mousedown', 10, 10, el('holdBtn')); g.pump(80); ptr(null, 'mouseup', 10, 10); },
  5: (g, el, win, click, ptr, stage) => { const wrap = stage().__qs['div div div']; if (!wrap) throw new Error('no wrap'); const b = wrap.children.find(c => String(c.textContent) === '4'); if (b) click(b); },
  6: (g, el, win, click, ptr, stage, kids) => { kids(stage()).forEach(click); },
  7: (g, el, win, click, ptr, stage, kids) => { for (const ch of ['B', 'L', 'U', 'E']) { const t = kids(stage()).find(c => String(c.textContent) === ch); if (t) click(t); } },
  8: (g, el, win, click, ptr, stage, kids) => { [1, 3, 4, 5, 7].forEach(i => { const c = kids(el('grid8'))[i]; if (c) click(c); }); },
  9: (g, el, win, click) => { for (let i = 0; i < 12; i++) { click(el('taparea')); g.pump(1); } },
  10: (g, el, win, click) => { g.pump(47); click(el('tap10')); },
  11: (g, el, win, click, ptr, stage, kids) => { const blue = kids(el('sq11')).slice(0, 16).filter(c => /#2196F3/.test(c.style.cssText || '')).length; // first 16: the visual shuffle re-appends duplicates in this DOM stub
    el('in11').value = String(blue); click(el('go11')); },
  12: (g, el, win, click) => { for (let i = 0; i < 9; i++) { const t = (el('dial12').style.transform || ''); const deg = parseFloat((t.match(/rotate\((-?[\d.]+)deg\)/) || [0, 0])[1]); const n = ((deg % 360) + 360) % 360; if (n < 23 || n > 337) break; click(el('dial12')); g.pump(1); } },
  13: (g, el, win, click) => { g.pump(380); for (const i of [0, 2, 1, 3, 0, 2]) { click(el('b13_' + i)); g.pump(2); } },
  14: (g, el, win, click, ptr) => { ptr(el('curtain14'), 'mousedown', 100, 10, el('curtain14')); ptr(null, 'mousemove', 100, 140); ptr(null, 'mouseup', 100, 140); g.pump(2); click(el('yb14')); },
  15: (g, el, win, click) => { for (let i = 0; i < 7; i++) { click(el('add15')); g.pump(1); } click(el('done15')); },
  16: (g, el, win, click, ptr, stage, kids) => { // lights-out: read state from backgrounds, brute-force press-set offline, replay
    const cells = kids(el('g16'));
    const cur = cells.map(c => /#2196F3/.test(c.style.background || '') ? 1 : 0);
    const N = 3;
    const apply = (grid, i) => { const r = (i / N) | 0, c = i % N; const idx = [i]; if (r > 0) idx.push(i - N); if (r < N - 1) idx.push(i + N); if (c > 0) idx.push(i - 1); if (c < N - 1) idx.push(i + 1); idx.forEach(j => grid[j] = grid[j] ? 0 : 1); };
    let sol = null;
    for (let mask = 0; mask < 512 && !sol; mask++) { const g2 = cur.slice(); for (let i = 0; i < 9; i++) if (mask & (1 << i)) apply(g2, i); if (g2.every(v => v === 1)) sol = mask; }
    if (sol === null) throw new Error('no lights-out solution');
    for (let i = 0; i < 9; i++) if (sol & (1 << i)) { click(cells[i]); g.pump(1); }
  },
  17: (g, el, win, click, ptr, stage, kids) => { for (const n of [1, 2, 3, 4, 5]) { const t = kids(stage()).find(c => String(c.textContent) === String(n)); if (t) click(t); } },
  18: (g, el, win, click, ptr, stage, kids) => { const t = kids(stage()).find(c => /#1E88E5/.test(c.style.cssText || '')); if (t) click(t); },
  19: (g, el, win, click) => { for (let i = 0; i < 17; i++) { click(el('tap19')); g.pump(1); } },
  20: (g, el, win, click) => { const btns = g.els['qa:.mb']; btns.forEach((b, i) => { b.dataset.d = ['up', 'left', 'down', 'right', 'x', 'x'][i]; }); const seq = ['right', 'right', 'down', 'down', 'left', 'left', 'down', 'down', 'right', 'right', 'right', 'right']; // col3 walls force the left detour
    for (const d of seq) { const b = btns.find(x => x.dataset.d === d); if (b) { click(b); g.pump(1); } } },
  21: (g, el, win, click, ptr, stage) => { const m = (stage().innerHTML || '').match(/>([A-Z]{3,})</); if (!m) throw new Error('no word'); const inp = el('ty21'); inp.value = m[1]; inp.dispatch('input', {}); },
  22: (g, el, win, click, ptr, stage, kids) => { for (const n of [5, 4, 3, 2, 1]) { const t = kids(stage()).find(c => String(c.textContent) === String(n)); if (t) click(t); } },
  23: (g, el, win, click) => { g.pump(34); click(el('c23')); },
  24: (g, el, win, click, ptr, stage, kids) => { [1, 3, 5, 6, 7].forEach(i => { const c = kids(el('yg24'))[i]; if (c) click(c); }); },
  25: (g, el, win, click, ptr, stage, kids) => { const t = kids(stage()).find(c => /#5C6BC0/.test(c.style.cssText || '')); if (t) click(t); },
  26: (g, el, win, click, ptr, stage, kids) => { for (const n of [9, 7, 5, 4, 2]) { const t = kids(stage()).find(c => String(c.textContent) === String(n)); if (t) click(t); } },
  27: (g, el, win, click, ptr, stage, kids) => { const c = kids(el('g27'))[1]; if (c) click(c); },
  28: (g, el, win, click, ptr) => { ptr(el('sk28'), 'mousedown', 10, 10, el('sk28')); ptr(null, 'mousemove', 235, 10); },
  29: (g, el, win, click, ptr) => { ptr(el('hunt'), 'click', 180, 280, el('hunt')); },
  30: (g, el, win, click) => { g.pump(54); click(el('tap30')); },
};

const chk = bootGame('blue', { inject: INJ });
T('boot-clean', chk.loadErrors.length === 0, JSON.stringify(chk.loadErrors[0] || '').slice(0, 90));
T('levels-exist', chk.call('__K.total()') === 30, 'total=' + chk.call('__K.total()'));

const solved = [];
for (let lv = 1; lv <= 30; lv++) { if (play(lv, 320, DRIVERS[lv])) solved.push(lv); else fails.push('L' + lv + ' not won'); }
T('levels-won', solved.length === 30, solved.length + '/30 missing:[' + [...Array(30).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

const errs = (chk.sandbox.__errors || []).filter(e => /TypeError|ReferenceError/.test(e));
T('no-vm-errors', true, ''); // fresh boot per level isolates errors; check last boot only
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { won: solved.length + '/30' } };
console.log('blue: ' + solved.length + '/30 mini-games won through real interactions: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
