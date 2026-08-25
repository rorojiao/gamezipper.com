#!/usr/bin/env node
/* treasure-dig verifier (type A): all 30 procedurally generated (deterministic PRNG) levels
 * must be won through the real input path — canvas pointerdown taps dig orthogonal-adjacent
 * cells; gems/exit/win all fire from the engine's own digCell/checkWin. The planner BFSes the
 * engine's own state.grid treating ROCK/BOMB/DOOR/WATER/LAVA as impassable (hazards: digging
 * water/lava floods the digger's own tunnel — see floodWater revisit — and bombs end the run;
 * the engine grants a shield for exactly one hazard hit, so avoidance is the winning strategy).
 * Also exercises: pause blocks digging, real bomb death -> result overlay -> retry, level
 * select (all 30 unlocked, real card clicks), star/unlock persistence. Replaces the old
 * verify_levels.js whose win check injected state directly. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('treasure-dig', {
  inject: {
    anchor: 'function digCell(x, y){',
    exports: `globalThis.__R = {
      st: () => state.screen, lv: () => state.currentLevel, n: () => LEVELS.length,
      won: () => state.won, over: () => state.gameOver, paused: () => state.paused,
      gemsN: () => state.gemsCollected, total: () => state.totalGems, score: () => state.score,
      dx: () => state.diggerX, dy: () => state.diggerY,
      stars: (i) => state.stars[i] || 0, unlocked: () => state.maxUnlocked,
      bombs: function () { var out = [], G = state.grid; for (var y = 0; y < GRID_H; y++) for (var x = 0; x < GRID_W; x++) if (G[y][x] === T.BOMB) out.push([x, y]); return out; },
      gemCells: function () { var out = [], G = state.grid; for (var y = 0; y < GRID_H; y++) for (var x = 0; x < GRID_W; x++) if (G[y][x] >= T.GEM_BLUE && G[y][x] <= T.GEM_GOLD) out.push([x, y]); return out; },
      exit: function () { var L = LEVELS[state.currentLevel - 1]; return [L.exitX, L.exitY]; },
      route: function (tx, ty, allowHazard) {
        // allowHazard: hazard cells (BOMB/WATER/LAVA) are passable with a budget of ONE —
        // the engine grants shield:1 (tier>=3), which survives exactly one hazard dig.
        // BFS state is (x, y, hazardsUsed) so no route ever plans two hazard digs.
        var G = state.grid, budget = allowHazard && state.shield > 0 ? 1 : 0;
        var haz = function (c) { return c === T.BOMB || c === T.WATER || c === T.LAVA; };
        var prev = {}, seen = {}, q = [[state.diggerX, state.diggerY, 0]];
        seen[state.diggerX + ',' + state.diggerY + ',0'] = true;
        while (q.length) {
          var cur = q.shift();
          if (cur[0] === tx && cur[1] === ty) {
            var path = [], p = cur, sx0 = state.diggerX, sy0 = state.diggerY;
            while (p && !(p[0] === sx0 && p[1] === sy0)) { path.push([p[0], p[1]]); p = prev[p[0] + ',' + p[1] + ',' + p[2]]; }
            return path.reverse();
          }
          var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (var i = 0; i < 4; i++) {
            var nx = cur[0] + dirs[i][0], ny = cur[1] + dirs[i][1];
            if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
            var c = G[ny][nx];
            var used = cur[2] + (haz(c) ? 1 : 0);
            if (c === T.ROCK || c === T.DOOR || used > budget) continue;
            var k = nx + ',' + ny + ',' + used;
            if (seen[k]) continue;
            seen[k] = true; prev[k] = cur; q.push([nx, ny, used]);
          }
        }
        return null;
      },
      ls: () => { try { return localStorage.getItem('treasure_dig_save'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

const cv = g.els['game-canvas'];
const CELL = 45;
const tap = (x, y) => cv.dispatch('pointerdown', { clientX: x * CELL + CELL / 2, clientY: y * CELL + CELL / 2, pointerId: 7, button: 0, isPrimary: true, preventDefault() {} });
function walk(tx, ty, haz) { // real-tap walk along the engine-grid BFS route
  for (let guard = 0; guard < 80; guard++) {
    const route = g.call(`__R.route(${tx}, ${ty}, ${haz ? 1 : 0})`);
    if (route === null) return g.call('__R.dx()') === tx && g.call('__R.dy()') === ty ? true : 'no-route';
    if (route.length === 0) return true;
    tap(route[0][0], route[0][1]);
    if (g.call('__R.over()')) return 'gameOver';
    if (g.call('__R.won()')) return true; // exit tap with all gems -> engine win (fires mid-walk)
    if (g.call('__R.dx()') !== route[0][0] || g.call('__R.dy()') !== route[0][1]) return 'stuck-at-' + g.call('__R.dx()') + ',' + g.call('__R.dy()');
  }
  return 'loop';
}
function solveLevel() {
  for (let guard = 0; guard < 30; guard++) {
    const gems = g.call('__R.gemCells()');
    if (!gems.length) break;
    let best = null;
    for (const gm of gems) {
      const strict = g.call(`__R.route(${gm[0]}, ${gm[1]}, 0)`);
      const haz = strict === null ? g.call(`__R.route(${gm[0]}, ${gm[1]}, 1)`) : strict;
      if (haz !== null && (best === null || haz.length < best.len)) best = { x: gm[0], y: gm[1], len: haz.length, haz: strict === null };
    }
    if (!best) return 'gem-unreachable(' + gems.length + ' left)';
    const res = walk(best.x, best.y, best.haz);
    if (res !== true) return res;
  }
  if (g.call('__R.gemCells()').length) return 'gems-left';
  const ex = g.call('__R.exit()');
  const res = walk(ex[0], ex[1], true);
  if (res !== true) return res;
  g.pump(30); // 400ms showResult timeout
  return g.call('__R.won()') ? true : 'not-won gems=' + g.call('__R.gemsN()') + '/' + g.call('__R.total()') + ' at ' + g.call('__R.dx()') + ',' + g.call('__R.dy()') + ' exit ' + ex.join(',');
}

// --- menu -> level 1 via the real Continue button ---
g.els['btn-continue'].click();
T('level-1-starts', g.call('__R.st()') === 'game' && g.call('__R.lv()') === 1, 'st=' + g.call('__R.st()'));

// --- pause blocks digging ---
g.els['btn-pause'].click();
const px0 = g.call('__R.dx()'), py0 = g.call('__R.dy()');
tap(px0, py0 + 1);
T('pause-blocks-dig', g.call('__R.paused()') === true && g.call('__R.dx()') === px0, 'moved while paused');
g.els['btn-pause'].click(); // resume

const solved = [], notes = [];
const T0 = Date.now();
for (let li = 1; li <= 30 && Date.now() - T0 < 95000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at L' + li); fails.push('chain broken at L' + li); break; }
  const res = solveLevel();
  if (res !== true) { notes.push('L' + li + ' ' + res); fails.push('L' + li + ' not won (' + res + ')'); break; }
  T('L' + li + '-stars', g.call(`__R.stars(${li})`) >= 1, 'stars=' + g.call(`__R.stars(${li})`));
  solved.push(li);
  if (li < 30) { g.els['result-overlay'].classList.remove('show'); g.els['btn-next-level'].click(); }
}
T('all-30-solved', solved.length === 30, 'solved=' + solved.length + '/30 ' + notes.slice(0, 4).join('|'));
T('all-unlocked', g.call('__R.unlocked()') === 30, 'unlocked=' + g.call('__R.unlocked()'));

// --- real bomb death -> Game Over overlay -> retry recovers ---
g.els['btn-level-select'].click();
const cards = g.els['level-select-grid'].children;
T('level-select-30', cards.length === 30, 'cards=' + cards.length);
cards[5].click(); // real card click starts level 6 (tier 1 — the first tier with bombs)
T('card-click-starts', g.call('__R.lv()') === 6 && g.call('__R.st()') === 'game', 'lv=' + g.call('__R.lv()'));
let died = false;
for (const b of g.call('__R.bombs()')) {
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = b[0] + ox, ny = b[1] + oy;
    if (nx < 0 || ny < 0 || nx > 9 || ny > 11) continue;
    if (g.call(`__R.route(${nx}, ${ny})`) === null) continue;
    if (walk(nx, ny) !== true) continue;
    tap(b[0], b[1]); // dig the bomb
    died = g.call('__R.over()');
    break;
  }
  if (died) break;
}
T('bomb-kills', died === true, 'died=' + died);
g.pump(55); // 600-800ms showResult(false) timeout
T('gameover-overlay', g.els['result-overlay'].classList.contains('show'), 'overlay');
g.els['btn-retry'].click();
T('retry-recovers', g.call('__R.over()') === false && g.call('__R.st()') === 'game' && g.call('__R.gemsN()') === 0, 'retry');

// --- persistence ---
T('save-persisted', (() => { const d = JSON.parse(g.call('__R.ls()') || '{}'); return d.maxUnlocked === 30 && Object.keys(d.stars || {}).length === 30; })(), 'ls=' + String(g.call('__R.ls()')).slice(0, 90));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/30', notes: notes.slice(0, 6) } };
console.log('treasure-dig: ' + solved.length + '/30 levels won via real dig taps: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
