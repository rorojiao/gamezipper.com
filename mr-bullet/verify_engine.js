#!/usr/bin/env node
/* mr-bullet verifier (type A): all 30 ricochet levels must be beaten through the real input
 * path (pointer drag-aim -> release fires). Aim planning happens in-page with the engine's OWN
 * computeTrajectory + checkHitsAlongPath on cloned target arrays (plus a faithful mirror of
 * processBulletHit's barrel-chain arithmetic for scoring only); the win is always the engine's
 * own enemiesRemaining<=0 -> showWin -> scene==='win'. Lose -> btn-retry-lose with a rotated
 * tie-break, up to 3 attempts per level. Also asserts star/unlock persistence. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mr-bullet', { inject: {
  anchor: 'function processBulletHit(){',
  exports: `globalThis.__R = {
    scene: () => scene, lv: () => currentLevel, n: () => LEVELS.length,
    bullets: () => bulletsLeft, rem: () => enemiesRemaining,
    sh: () => ({ x: shooterX, y: shooterY }),
    cwid: () => canvas.width, chi: () => canvas.height,
    stars: (i) => save.stars[i] || 0,
    unlocked: () => save.unlocked,
    alive: () => ({
      enemies: levelData.enemies.filter(e => !e[3]).map(e => [e[0], e[1], e[2]]),
      barrels: levelData.barrels.filter(b => !b[3]).map(b => [b[0], b[1], b[2]]),
      hostages: levelData.hostages.filter(h => !h[3]).map(h => [h[0], h[1], h[2]]),
      walls: levelData.walls.map(w => w.slice()),
    }),
    // sweep aims with the engine's own trajectory + hit functions on CLONES; returns ranked aims.
    // robust = the aim still kills at +-0.25deg jitter (corner-clipping ricochets are fragile).
    sweep: function(n) {
      var st = { enemies: levelData.enemies.filter(function(e){return !e[3];}).map(function(e){return [e[0],e[1],e[2],false];}),
                 barrels: levelData.barrels.filter(function(b){return !b[3];}).map(function(b){return [b[0],b[1],b[2],false];}),
                 hostages: levelData.hostages.filter(function(h){return !h[3];}).map(function(h){return [h[0],h[1],h[2],false];}) };
      function evalAng(ang) {
        var ax = shooterX + Math.cos(ang) * 100, ay = shooterY + Math.sin(ang) * 100;
        var segs = computeTrajectory(shooterX, shooterY, ax, ay, levelData.walls);
        var en = st.enemies.map(function(e){return e.slice();});
        var ba = st.barrels.map(function(b){return b.slice();});
        var ho = st.hostages.map(function(h){return h.slice();});
        var hits = checkHitsAlongPath(segs, en, ba, ho);
        var kills = 0, hostage = hits.hostages.length > 0;
        if (hits.enemies.length) kills = 1;
        if (hits.barrels.length && !hostage) {
          // mirror of processBulletHit chain: explode radius 60, chain barrels, count enemy kills
          var dead = {}, deadB = {}, queue = [hits.barrels[0]], total = 0;
          deadB[hits.barrels[0]] = true;
          while (queue.length) {
            var bi = queue.shift(); var b = ba[bi];
            for (var ei = 0; ei < en.length; ei++) {
              if (dead[ei]) continue;
              if (pointInCircle(b[0], b[1], en[ei][0], en[ei][1], 60)) { dead[ei] = true; total++; }
            }
            for (var bj = 0; bj < ba.length; bj++) {
              if (deadB[bj]) continue;
              if (pointInCircle(b[0], b[1], ba[bj][0], ba[bj][1], 60)) { deadB[bj] = true; queue.push(bj); }
            }
            for (var hj = 0; hj < ho.length; hj++) {
              if (!dead['h' + hj] && pointInCircle(b[0], b[1], ho[hj][0], ho[hj][1], 60)) { dead['h' + hj] = true; hostage = true; }
            }
          }
          kills = total;
        }
        return { kills: kills, hostage: hostage };
      }
      var out = [];
      for (var k = 0; k < n; k++) {
        var ang = (k / n) * Math.PI * 2;
        var r = evalAng(ang);
        if (r.kills > 0 && !r.hostage) {
          var rp = evalAng(ang + 0.0044), rm = evalAng(ang - 0.0044);
          var robust = rp.kills > 0 && !rp.hostage && rm.kills > 0 && !rm.hostage;
          out.push({ ang: ang, kills: r.kills, hostage: false, robust: robust });
        } else if (r.hostage) {
          out.push({ ang: ang, kills: 0, hostage: true, robust: false });
        }
      }
      return out;
    },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N === 30, 'n=' + N);

const cv = g.els['canvas'];
// virtual (400x600) -> client coords: exact per-axis scale through the engine's own s2v
const xs = () => g.call('__R.cwid()') / 400;
const ys = () => g.call('__R.chi()') / 600;
const pev2 = (type, vx, vy) => cv.dispatch(type, { clientX: vx * xs(), clientY: vy * ys(), pointerId: 3, button: 0, isPrimary: true, preventDefault() {} });

function fire(angle) {
  const s = g.call('__R.sh()');
  pev2('pointerdown', s.x, s.y);
  pev2('pointermove', s.x + Math.cos(angle) * 60, s.y + Math.sin(angle) * 60);
  pev2('pointerup', s.x + Math.cos(angle) * 60, s.y + Math.sin(angle) * 60);
}

g.els['btn-start'].click();
T('start-game', g.call('__R.scene()') === 'game', 'scene=' + g.call('__R.scene()'));

const solved = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < N && Date.now() - T0 < 100000; li++) {
  if (g.call('__R.lv()') !== li) { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  let won = false;
  for (let attempt = 0; attempt < 3 && !won; attempt++) {
    if (attempt > 0) g.els['btn-retry-lose'].click(); // fresh reload of the level
    const rot = attempt * 0.0073; // rotate tie-break between attempts
    let shots = 0;
    while (g.call('__R.scene()') === 'game' && g.call('__R.bullets()') > 0 && g.call('__R.rem()') > 0 && shots < 8) {
      const aims = g.call('__R.sweep(720)').filter(a => !a.hostage);
      if (!aims.length) break;
      aims.sort((a, b) => b.kills - a.kills || (b.robust ? 1 : 0) - (a.robust ? 1 : 0) || ((a.ang + rot) % 6.2832) - ((b.ang + rot) % 6.2832));
      const best = aims[0];
      fire(best.ang); shots++;
      for (let i = 0; i < 260 && g.call('__R.scene()') === 'game'; i++) g.pump(1);
      g.pump(50); // win/lose setTimeout 500-600ms
    }
    won = g.call('__R.scene()') === 'win';
    if (!won && g.call('__R.scene()') !== 'lose') { notes.push('L' + (li + 1) + ' stuck scene=' + g.call('__R.scene()') + ' rem=' + g.call('__R.rem()') + ' bullets=' + g.call('__R.bullets()')); break; }
  }
  if (won) {
    T('L' + (li + 1) + '-win', true);
    T('L' + (li + 1) + '-stars', g.call('__R.stars(' + li + ')') >= 1, 'stars=' + g.call('__R.stars(' + li + ')'));
    solved.push(li + 1);
    if (li < N - 1) g.els['btn-next'].click();
  } else {
    T('L' + (li + 1) + '-win', false, 'rem=' + g.call('__R.rem()') + ' bullets=' + g.call('__R.bullets()'));
    break;
  }
}
T('all-30-solved', solved.length === N, 'solved=' + solved.length + '/' + N + ' ' + notes.slice(0, 4).join('|'));
T('unlock-progress', g.call('__R.unlocked()') >= N, 'unlocked=' + g.call('__R.unlocked()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N, notes: notes.slice(0, 6) } };
console.log('mr-bullet: ' + solved.length + '/' + N + ' levels beaten via real drag-aims: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
