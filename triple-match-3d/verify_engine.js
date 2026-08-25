#!/usr/bin/env node
/* triple-match-3d verifier (type A): all 25 procedurally generated levels must be cleared
 * through the real input path (canvas pointerdown taps; matches/win fire from the engine's
 * own checkMatches/gameWin). Planning happens in-page with the engine's own topmost-hit-box
 * logic (findTap), taps are real events. The engine's 80ms real-clock tap debounce is
 * neutralized by advancing the sandbox clock between taps (harness time control only).
 * Also exercises the three power-ups (hint/shuffle/undo), star + unlock persistence, and
 * the win-screen -> next-level chain. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('triple-match-3d', {
  viewport: { w: 900, h: 900 },
  inject: {
    anchor: 'function startLevel(levelNum){',
    exports: `globalThis.__R = {
      st: () => gameState, lv: () => currentLevel, n: () => TOTAL_LEVELS,
      tray: () => trayItems.slice(), trayMax: () => maxTrayFill,
      rem: () => fieldItems.filter(i => !i.collected).length,
      stars: (i) => saveData.levelStars[i] || 0, unlocked: () => saveData.unlockedLevel,
      pu: () => ({ hint: powerUps.hint, shuffle: powerUps.shuffle, undo: powerUps.undo }),
      // in-page planner mirroring handleTap's topmost-box selection exactly
      findTap: function (emoji) {
        var sorted = fieldItems.filter(function (i) { return !i.collected; }).sort(function (a, b) { return b.z - a.z; });
        for (var idx = 0; idx < sorted.length; idx++) {
          var item = sorted[idx];
          if (item.emoji !== emoji) continue;
          var half = 36 * item.scale * 0.55;
          var cands = [[0, 0], [half * 0.45, 0], [-half * 0.45, 0], [0, half * 0.45], [0, -half * 0.45]];
          for (var c = 0; c < cands.length; c++) {
            var x = item.x + cands[c][0], y = item.y + cands[c][1];
            for (var k = 0; k < sorted.length; k++) {
              var it = sorted[k], h2 = 36 * it.scale * 0.55;
              if (Math.abs(x - it.x) < h2 && Math.abs(y - it.y) < h2) { if (it === item) return { x: x, y: y }; break; }
            }
          }
        }
        return null;
      },
      counts: function () {
        var c = {};
        fieldItems.forEach(function (i) { if (!i.collected) c[i.emoji] = (c[i.emoji] || 0) + 1; });
        return c;
      },
    };`,
  },
});

const realNow = Date.now.bind(Date); // capture before the sandbox override (harness Date may alias host Date)
let fakeNow = 1000000;
g.sandbox.Date.now = () => (fakeNow += 120); // engine's tap debounce reads Date.now()

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 25, 'n=' + g.call('__R.n()'));

const cv = g.els['gameCanvas'];
const tap = (x, y) => cv.dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 6, button: 0, isPrimary: true, preventDefault() {} });

// --- start L1 via the play button (property onclick) ---
g.els['playBtn'].click();
T('level-1-starts', g.call('__R.st()') === 'playing' && g.call('__R.lv()') === 1, 'st=' + g.call('__R.st()'));

// --- power-up exercises on L1 (before solving) ---
tap.apply(null, (() => { const e = Object.keys(g.call('__R.counts()'))[0]; const p = g.call(`__R.findTap(${JSON.stringify(e)})`); return p ? [p.x, p.y] : [10, 10]; })());
g.pump(20);
T('undo-restores', (() => { const r0 = g.call('__R.rem()'); g.els['undoBtn'].click(); return g.call('__R.rem()') === r0 + 1; })(), 'undo rem');
T('hint-consumed', g.els['hintBtn'].click() === undefined && g.call('__R.pu()').hint === 2, 'hint=' + g.call('__R.pu()').hint);
g.els['shuffleBtn'].click();
T('shuffle-consumed', g.call('__R.pu()').shuffle === 1, 'shuffle=' + g.call('__R.pu()').shuffle);

// --- greedy solver: complete the triple of the type with the most items remaining ---
function solveLevel() {
  let guard = 0;
  while (g.call('__R.rem()') > 0 && guard++ < 1200) {
    const counts = g.call('__R.counts()');
    const tray = g.call('__R.tray()');
    const trayCounts = {};
    tray.forEach(e => trayCounts[e] = (trayCounts[e] || 0) + 1);
    let best = null, bestScore = -1;
    for (const e in counts) {
      if (counts[e] === 0) continue;
      const sc = (trayCounts[e] || 0) * 100 + counts[e];
      if (sc > bestScore) { bestScore = sc; best = e; }
    }
    if (!best) return 'no-emoji';
    while ((trayCounts[best] || 0) < 3) {
      const p = g.call(`__R.findTap(${JSON.stringify(best)})`);
      if (!p) return 'no-tap-point-for ' + best;
      tap(p.x, p.y);
      trayCounts[best] = (trayCounts[best] || 0) + 1;
      if (g.call('__R.rem()') === 0) break;
    }
    g.pump(18); // 200ms match timeout
    if (g.call('__R.st()') === 'lost') return 'lost tray=' + g.call('__R.tray()').length;
  }
  g.pump(40); // 500ms win-check timeout
  return g.call('__R.st()') === 'won' ? true : 'st=' + g.call('__R.st()') + ' rem=' + g.call('__R.rem()') + ' tray=' + g.call('__R.tray()').length;
}

const solved = [], notes = [];
const T0 = realNow();
for (let li = 1; li <= 25 && realNow() - T0 < 100000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at L' + li); fails.push('chain broken at L' + li); break; }
  const res = solveLevel();
  if (res !== true) {
    notes.push('L' + li + ' ' + res);
    fails.push('L' + li + ' not cleared (' + res + ')');
    break;
  }
  T('L' + li + '-stars', g.call(`__R.stars(${li})`) >= 1, 'stars=' + g.call(`__R.stars(${li})`));
  solved.push(li);
  if (li < 25) g.els['nextBtn'].click();
}
T('all-25-solved', solved.length === 25, 'solved=' + solved.length + '/25 ' + notes.slice(0, 4).join('|'));
T('unlock-progress', g.call('__R.unlocked()') === 25, 'unlocked=' + g.call('__R.unlocked()'));
T('next-hidden-on-last', g.els['nextBtn'].style.display === 'none', 'display=' + g.els['nextBtn'].style.display);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/25', notes: notes.slice(0, 6) } };
console.log('triple-match-3d: ' + solved.length + '/25 levels cleared via real taps: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
