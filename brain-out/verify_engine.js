#!/usr/bin/env node
/* brain-out verifier — 30 lateral-thinking levels, each solved through the real canvas
 * pointer path (down/move/up at engine coordinates). P0 fixed en route: L9's answer
 * buttons were labeled 1-5 while the win check required 7 — unwinnable; now 3-7. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('brain-out', { inject: {
  anchor: 'function handleLevelDown(px,py){',
  exports: `globalThis.__O = {
    n: () => levels.length,
    go: (i) => { initLevel(i); state = 'playing'; }, // initLevel sets levelData/currentLevel internally
    state: () => state,
    won: () => !!(levelWon || (showResult && resultCorrect)),
    geo: () => ({ cx: vw() / 2, cy: vh() / 2, s: scale(), w: vw(), h: vh() }),
    data: () => levelData,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = () => g.els.c || g.els.canvas || Object.entries(g.els).find(([k, v]) => v && v.getContext)[1];
const down = (x, y) => C().dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
const move = (x, y) => C().dispatch('pointermove', { clientX: x, clientY: y, preventDefault() {} });
const up = (x, y) => C().dispatch('pointerup', { clientX: x, clientY: y, preventDefault() {} });
const tap = (x, y) => { down(x, y); up(x, y); };
const drag = (x1, y1, x2, y2) => { down(x1, y1); for (let k = 1; k <= 6; k++) move(x1 + (x2 - x1) * k / 6, y1 + (y2 - y1) * k / 6); up(x2, y2); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__O.n()');
T('levels-exist', N === 30, 'n=' + N);

function play(i) {
  g.call(`__O.go(${i})`); g.pump(45); // drain winLevel's clickBlock from the previous level
  const { cx, cy, s, w } = g.call('__O.geo()');
  const d = () => g.call('__O.data()') || {};
  switch (i) {
    case 0: { const n = d().n30; drag(n.x, n.y, cx, cy); break; }
    case 1: tap(cx, cy - 60 * s); break;
    case 2: { const sun = d(); drag(sun.sunX, sun.sunY, -100, 80); g.pump(60); return; }
    case 3: tap(cx - 90 * s + 2 * 60 * s, cy + 90 * s); break; // the 5-apple button (val = 3+i)
    case 4: {
      const items = d().items || [];
      const word = items.find(it => it.isWord);
      if (word) { const box = d().boxRect; drag(word.x, word.y, box.x + box.w / 2, box.y + box.h / 2); }
      break;
    }
    case 5: tap(cx + 20 * s, cy - 38 * s); break;
    case 6: tap(cx - 40 * s, cy); break;
    case 7: { const c = (d().circles || [])[(d().diffIdx ?? 0)]; if (c) tap(c.x, c.y); break; }
    case 8: { const fy = d().fenceY; drag(cx + 10 * s, fy, cx + 10 * s, cy + 120 * s); break; }
    case 9: tap(cx - 80 * s + 4 * 40 * s, cy + 110 * s); break; // button "7"
    case 10: tap(cx, cy + 30 * s); break;
    case 11: { // 5-bulb lights-out (tap flips neighbors)
      const bulbs0 = d().bulbs || [0, 0, 0, 0, 0];
      const apply = (b, i) => { const n = b.slice(); n[i] ^= 1; if (i > 0) n[i - 1] ^= 1; if (i < 4) n[i + 1] ^= 1; return n; };
      let sol = null;
      for (let m = 0; m < 32 && sol === null; m++) { let b = bulbs0.slice(); for (let i = 0; i < 5; i++) if (m & (1 << i)) b = apply(b, i); if (b.every(v => v === 1)) sol = m; }
      if (sol !== null) for (let i = 0; i < 5; i++) if (sol & (1 << i)) tap(cx - 100 * s + i * 50 * s, cy);
      break;
    }
    case 12: tap(cx - 80 * s + 3 * 40 * s, cy + 120 * s); break; // "8"
    case 13: { // remove top-right stick of the 8, then confirm
      const e8x = cx - 110 * s;
      tap(e8x + 15 * s, cy - 10 * s + 15); // stick #4 (vertical, top-right)
      g.pump(2);
      tap(cx, cy + 100 * s);
      break;
    }
    case 14: { for (let w2 = 0; w2 < 400 && !(d().done); w2++) g.pump(1); tap(cx - 80 * s, cy); break; }
    case 15: tap(cx, cy); break;
    case 16: { drag(cx, cy, cx, cy + 120 * s); g.pump(60); return; }
    case 17: tap(cx - 60 * s, cy + 100 * s); break;
    case 18: { const f = d(); drag(f.fishX, f.fishY, cx, cy - 100 * s); break; }
    case 19: tap(cx - 75 * s + 3 * 30 * s, cy + 90 * s); break; // "6"
    case 20: tap(cx + 105 * s, cy - 65 * s); break;
    case 21: { const dd = d(); drag(dd.redX, dd.y, dd.blueX, dd.y); break; }
    case 22: tap(cx + 100 * s, cy + 50 * s); break;
    case 23: tap(cx, cy - 80 * s + 5 * 30 * s); break;
    case 24: { const dd = d(); drag(dd.keyX, dd.keyY, dd.lockX, dd.lockY); break; }
    case 25: tap(cx - 75 * s + 2 * 50 * s, cy + 50 * s); break;
    case 26: { tap(cx, cy + 60 * s); g.pump(40); return; }
    case 27: tap(cx, cy - 10 * s + 1 * 50 * s); break;
    case 28: {
      for (let k = 0; k < 300; k++) {
        const dd = d();
        const lt = dd.leftNums.reduce((a, b) => a + b, 0), rt = dd.rightNums.reduce((a, b) => a + b, 0);
        if (lt === rt) { tap(cx, cy + 120 * s); return; }
        tap(cx, cy + 30 * s); // random swap, retry until balanced
        g.pump(2);
      }
      return;
    }
    case 29: { tap(w - 65 * s, cy); g.pump(30); tap(cx, cy + 30 * s); break; }
  }
  g.pump(30);
}

const solved = [];
for (let i = 0; i < N; i++) {
  for (let t = 0; t < 3 && !g.call('__O.won()'); t++) play(i);
  if (g.call('__O.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('levels-completed', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('brain-out: ' + solved.length + '/' + N + ' trick levels solved via canvas interactions: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
