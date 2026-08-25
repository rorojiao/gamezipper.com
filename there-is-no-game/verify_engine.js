#!/usr/bin/env node
/* there-is-no-game verifier — A/B-type: all 20 levels completed through the engine's
 * REAL input path (canvas pointerdown/move/up + window keydown for the platformer level),
 * sequential title -> L1..L20 -> ending screen. Every level's own win condition in its
 * update handler fires completeLevel(); the state machine only advances on levelWon. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('there-is-no-game', { viewport: [1280, 720], inject: {
  anchor: 'function completeLevel(){',
  exports: `draw = function(){}; // draw-only; headless speed
globalThis.__S = {
  st: () => state,
  lvl: () => level,
  pb: () => ({ x: playBtn.x, y: playBtn.y, visible: playBtn.visible }),
  objs: () => levelObjects.map(o => ({ text: o.text, x: o.x, y: o.y, w: o.w, h: o.h, placed: !!o.placed, dim: o.dim })),
  mg: () => miniGameState,
  ta: () => titleAnim,
  cs: () => creditScroll,
  vol: () => volumeVal,
  stars: () => levelStars,
  ach: () => achievements,
  unlocked: () => chapterUnlocked,
  total: () => totalStarCount(),
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const C = g.els.c;
const ptr = (type, x, y) => C.dispatch(type, { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
const click = (x, y) => { ptr('pointerdown', x, y); ptr('pointerup', x, y); };
const drag = (x0, y0, x1, y1) => { ptr('pointerdown', x0, y0); ptr('pointermove', x1, y1); ptr('pointerup', x1, y1); };
const key = (k, down) => g.sandbox.dispatchEvent({ type: down ? 'keydown' : 'keyup', key: k, preventDefault() {} });

const DEADLINE = Date.now() + 100000;
const pump = (n) => g.pump(n);
const waitAdvance = (idx, cap) => { // pump until engine advances past level idx (win path) or hits ending
  for (let f = 0; f < cap && Date.now() < DEADLINE; f++) {
    if (g.call('__S.lvl()') !== idx || g.call('__S.st()') === 'ending') return true;
    pump(1);
  }
  return g.call('__S.lvl()') !== idx || g.call('__S.st()') === 'ending';
};

// ---- per-level action scripts (game coords; viewport 1280x720 => scale 1, client==game) ----
const ACTIONS = {
  0: () => { const p = g.call('__S.pb()'); click(p.x, p.y); }, // L1 catch the PLAY button before it flees (2s)
  1: () => click(450, 420), // L2 break the load-bearing O of OVER (gameOvers[4] center)
  2: () => { ptr('pointerdown', 640, 415); ptr('pointermove', 785, 415); pump(4); ptr('pointerup', 785, 415); }, // L3 volume >= 95%
  3: () => { // L4 spell GAME: G/A/M/E letters at 360/520/680/840 -> slots 0..3
    drag(360, 350, 515, 295); drag(520, 350, 615, 295); drag(680, 350, 715, 295); drag(840, 350, 815, 295);
  },
  4: () => { // L5 assembly: drag each scattered piece to its matching slot
    const slots = { play: [970, 205], score: [970, 305], timer: [970, 405], level: [970, 505] };
    for (const o of g.call('__S.objs()')) { const s = slots[o.text]; if (s) drag(o.x + o.w / 2, o.y + o.h / 2, s[0], s[1]); }
  },
  5: () => { // L6 genre break: RPG attack x3 -> FPS 3 moving targets -> puzzle 3 cells
    click(640, 475); click(640, 475); click(640, 475); pump(2);
    for (let t = 0; t < 3 && g.call('__S.mg().genre') === 'fps'; t++) {
      const mg = g.call('__S.mg()'), ta = g.call('__S.ta()'), i = mg.targets;
      const tx = 200 + Math.sin(ta * 3 + (i - 1) * 2) * 200 + (i - 1) * 200, ty = 250 + Math.cos(ta * 2 + (i - 1)) * 80;
      click(tx, ty); pump(1);
    }
    pump(2);
    click(300, 350); click(470, 350); click(640, 350); // 3 of the 4 color cells (needed=3)
  },
  6: () => { // L7 fix code: drop all 4 fragments in the top strip (gy<200)
    for (const o of g.call('__S.objs()')) drag(o.x + 10, o.y + o.h / 2, 640, 150);
  },
  7: null, // L8 platformer — handled separately with real keys
  8: () => { // L9 dimension sort
    for (const o of g.call('__S.objs()')) drag(o.x + o.w / 2, o.y + o.h / 2, o.dim === 'Fantasy' ? 320 : 960, 525);
  },
  9: () => { click(540, 305); click(540, 305); click(540, 305); click(540, 305); }, // L10 the lying "Quit" button actually starts (x4)
  10: () => { // L11 save file: fragments onto their matching timeline slots
    const slotXY = { 'Chapter 1': [405, 220], 'Chapter 2': [605, 220], 'Chapter 3': [805, 220], 'Chapter 4': [1005, 220] };
    for (const o of g.call('__S.objs()')) { const s = slotXY[o.text]; if (s) drag(o.x + o.w / 2, o.y + o.h / 2, s[0], s[1]); }
  },
  11: () => { for (let i = 0; i < 10; i++) click(640, 315); }, // L12 click the stuck loading bar 10x
  12: () => click(230, 167), // L13 the one real browser tab
  13: () => { // L14 captcha: trees at grid idx 0,2,4,6,8 then VERIFY
    for (const i of [0, 2, 4, 6, 8]) click(390 + (i % 3) * 170 + 75, 170 + Math.floor(i / 3) * 140 + 60);
    click(640, 632);
  },
  14: () => click(340, 200), // L15 the real X (W/2-300, y200, size16)
  15: () => { const m = g.call('__S.mg()'); click(m.cancelX + 80, m.cancelY + 22); }, // L16 CANCEL before it flees at 30%
  16: () => { // L17 click 3 scrolling credit lines at their current on-screen position
    for (let tries = 0; tries < 300 && Date.now() < DEADLINE; tries++) {
      const mg = g.call('__S.mg()');
      if (mg.found.length >= 3) return;
      const cs = g.call('__S.cs()'), len = mg.credits.length, period = (len + 4) * 55;
      for (let i = 0; i < len; i++) {
        if (mg.found.includes(i)) continue;
        const cy = 150 + i * 55 - cs % period;
        const ay = cy < -50 ? cy + period : cy;
        if (ay > 60 && ay < 660) { click(640, ay); break; }
      }
      pump(3);
    }
  },
  17: () => { // L18 save all 20 level blocks: 20 pointerdowns before the 0.5s delete tick
    for (let i = 0; i < 20; i++) ptr('pointerdown', 100 + (i % 10) * 110 + 45, 200 + Math.floor(i / 10) * 180 + 30);
  },
  18: () => { // L19 final boss: 3 clicks on the moving boss (0.5s attack cooldown)
    for (let t = 0; t < 3; t++) {
      const m = g.call('__S.mg()');
      click(m.bossX, m.bossY);
      pump(35);
    }
  },
  19: () => { // L20 true ending: the game thanks you — pure wait (~17s virtual)
    for (let f = 0; f < 1500 && g.call('__S.st()') !== 'ending' && Date.now() < DEADLINE; f++) pump(2);
  },
};

// ---- L8 platformer: mirror of updatePlatformer+updateL8 physics to find jump thresholds ----
const PLAT = [{ x: 0, y: 550, w: 400, h: 30 }, { x: 500, y: 480, w: 200, h: 20 }, { x: 800, y: 400, w: 200, h: 20 }, { x: 1050, y: 350, w: 200, h: 30 }];
function simStep(s, jump) { // right always held; jump pressed this frame if grounded
  if (jump && s.grounded) s.vy = -12;
  s.vx = 4; s.vy += 0.5; s.px += s.vx; s.py += s.vy; s.vx *= 0.92;
  s.grounded = false;
  for (const p of PLAT) if (s.py >= p.y - 30 && s.py <= p.y && s.px >= p.x - 15 && s.px <= p.x + p.w + 15 && s.vy >= 0) { s.py = p.y - 30; s.vy = 0; s.grounded = true; break; }
  if (s.py > 720 + 50) return 'fell';
  if (Math.abs(s.px - 1100) < 40 && Math.abs(s.py - 420) < 60) return 'win';
  return 'ok';
}
function runSim(th, cap) { // adaptive: jump when grounded && px >= next unused threshold
  const s = { px: 100, py: 500, vx: 0, vy: 0, grounded: false }, used = [false, false, false];
  for (let f = 0; f < (cap || 900); f++) {
    let j = false;
    for (let k = 0; k < 3; k++) if (!used[k] && s.grounded && s.px >= th[k]) { used[k] = true; j = true; break; }
    const r = simStep(s, j);
    if (r !== 'ok') return { r, s, f };
  }
  return { r: 'timeout', s, f: cap || 900 };
}
function findThresholds() {
  // jump 1: from ground platform onto platform[1]
  for (let X1 = 300; X1 <= 400; X1 += 4) {
    const s = { px: 100, py: 500, vx: 0, vy: 0, grounded: false };
    let ok = false;
    for (let f = 0; f < 600; f++) {
      const j = s.grounded && s.px >= X1;
      const r = simStep(s, j);
      if (r === 'fell') break;
      if (s.grounded && s.py === 450 && s.px >= 485 && s.px <= 715) { ok = true; break; } // standing on platform[1]
      if (r === 'win') break;
    }
    if (ok) {
      // jump 2: onto platform[2] (y400 -> py 370)
      for (let X2 = 600; X2 <= 715; X2 += 4) {
        const s2 = { px: 100, py: 500, vx: 0, vy: 0, grounded: false };
        let hit2 = null;
        for (let f = 0; f < 900; f++) {
          const j = (s2.grounded && s2.py === 520 && s2.px >= X1) || (s2.grounded && s2.py === 450 && s2.px >= X2);
          const r = simStep(s2, j);
          if (r === 'fell') break;
          if (s2.grounded && s2.py === 370 && s2.px >= 785 && s2.px <= 1015) { hit2 = s2; break; }
          if (r === 'win') break;
        }
        if (hit2) {
          for (let X3 = 800; X3 <= 1015; X3 += 4) {
            const r = runSim([X1, X2, X3]);
            if (r.r === 'win') return [X1, X2, X3];
          }
        }
      }
    }
  }
  return null;
}
const TH = findThresholds();
function playPlatformer() {
  if (!TH) return false;
  key('ArrowRight', true);
  const used = [false, false, false];
  for (let f = 0; f < 1200 && Date.now() < DEADLINE; f++) {
    const m = g.call('__S.mg()');
    if (!m || g.call('__S.lvl()') !== 7) break;
    let wantJump = false;
    for (let k = 0; k < 3; k++) if (!used[k] && m.grounded && m.px >= TH[k]) { used[k] = true; wantJump = true; break; }
    if (wantJump) { key(' ', true); pump(1); key(' ', false); } else pump(1);
  }
  key('ArrowRight', false);
  return true;
}

// ---- run the whole game sequentially through the engine's own state machine ----
pump(5);
T('title-screen', g.call('__S.st()') === 'title', 'st=' + g.call('__S.st()'));
click(640, 477); // START
pump(60);
T('started', g.call('__S.st()') === 'playing' && g.call('__S.lvl()') === 0, 'st=' + g.call('__S.st()') + ' lvl=' + g.call('__S.lvl()'));

const cleared = [];
for (let idx = 0; idx < 20 && Date.now() < DEADLINE; idx++) {
  pump(2);
  if (idx === 7) { if (!playPlatformer()) { fails.push('L8 platformer: no jump solution found'); break; } }
  else { const fn = ACTIONS[idx]; if (fn) fn(); }
  const adv = waitAdvance(idx, 700);
  if (adv) cleared.push(idx + 1);
  else { fails.push('L' + (idx + 1) + ' never completed (st=' + g.call('__S.st()') + ')'); break; }
}
T('levels-won', cleared.length === 20, cleared.length + '/20 missing:[' + Array.from({ length: 20 }, (_, i) => i + 1).filter(x => !cleared.includes(x)).join(',') + ']');
T('ending-reached', g.call('__S.st()') === 'ending', 'st=' + g.call('__S.st()'));

const stars = g.call('__S.stars()');
T('all-starred', Array.isArray(stars) && stars.length === 20 && stars.every(s => s > 0), 'stars=' + JSON.stringify(stars).slice(0, 60));
T('chapters-unlocked', g.call('__S.unlocked()').every(Boolean), JSON.stringify(g.call('__S.unlocked()')));
const ach = g.call('__S.ach()');
T('achievements', [0, 1, 2, 3, 4, 5].every(a => ach.includes(a)), 'ach=' + JSON.stringify(ach));
const saved = JSON.parse(g.ls.getItem('tng_save') || 'null');
T('save-progress', !!saved && saved.levelStars && saved.levelStars.filter(s => s > 0).length >= 20, 'saved=' + (saved ? saved.levelStars.filter(s => s > 0).length : 'none'));

click(640, 665); pump(50); // ending screen PLAY AGAIN -> title
T('ending-restart', g.call('__S.st()') === 'title', 'st=' + g.call('__S.st()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { cleared: cleared.length + '/20', stars: g.call('__S.total()') + '/60', jumpTh: TH ? TH.join(',') : 'none' } };
console.log('there-is-no-game: ' + cleared.length + '/20 levels via real pointer/key play to ending screen: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
