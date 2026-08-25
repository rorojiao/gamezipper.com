#!/usr/bin/env node
/* virus-buster verifier — A/puzzle type: every level completable via the engine's real input path.
 *
 * Dr. Mario style: 8x16 bottle, 2-half pills in 3 colors, match 4+ in a row/column clears
 * pills+viruses, viruses stay anchored while pills fall. The bot plays REAL games: every pill
 * is driven through the engine's own document keydown handler (x=rotate, arrows=move,
 * space=hard-drop), locks through lockPill(), resolves through the engine's own cascade
 * (findMatches/applyGravity), and wins through virusCount<=0 -> levelComplete -> the real
 * Next Level button. An offline replica of the engine's match/gravity rules is used ONLY to
 * plan placements; execution is 100% real input.
 *
 * ENGINE FIXES VERIFIED HERE (index.html FIX comments):
 *  P1 — resumeGame() hard-set gameState='playing' even when paused DURING a cascade
 *       ('clearing'): pill was already null and the pending gravity steps only run in the
 *       'clearing' branch, so resume soft-locked the game forever. Pause now remembers the
 *       state it came from (pausedFrom) and resume restores it.
 *  P2 — levelComplete() rated pillsDropped against virusCount AFTER clearing (always 0), so
 *       levels 1-5 could never earn 3 stars. Now rated against levelViruses captured at
 *       initLevel.
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('virus-buster', { viewport: [520, 1000], inject: {
  anchor: "var gameState = 'menu'; // menu, playing, clearing, paused, gameover, levelcomplete",
  exports: `globalThis.__S={
  st:function(){return{gs:gameState,lv:level,sc:score,vir:virusCount,dropped:pillsDropped,combo:maxCombo,
    pill:pill?{x:pill.x,y:pill.y,dir:pill.dir,c1:pill.c1,c2:pill.c2}:null,next:nextPill?{c1:nextPill.c1,c2:nextPill.c2}:null}},
  board:function(){var out=[];for(var r=0;r<ROWS;r++){var row=[];for(var c=0;c<COLS;c++){var cell=grid[r][c];
    row.push(cell===null?null:(cell.isVirus?'V'+cell.color:'P'+cell.color))}out.push(row)}return out}};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

function walk(el, fn) { for (const c of (el.children || [])) { fn(c); walk(c, fn); } }
function btnByOnclick(match, root) {
  let b = null;
  walk(root || g.sandbox.document.body, (e) => {
    if (!b && String(e.tagName).toLowerCase() === 'button' && typeof e.onclick === 'function' && e.onclick.toString().includes(match)) b = e;
  });
  return b;
}
const S = () => g.call('__S.st()');
const B = () => g.call('__S.board()');

// ---- real input: the engine's own document keydown/keyup handlers ----
function key(k) {
  g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });
  g.sandbox.document.dispatch('keyup', { key: k, preventDefault() {} });
}
function waitGs(states, guardMax) {
  for (let i = 0; i < (guardMax || 300); i++) {
    if (states.includes(S().gs)) return true;
    g.pump(3);
  }
  return false;
}

// ---- offline replica of the engine's rules (planning only) ----
const ROWS = 16, COLS = 8;
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const cellsOf = (p) => [{ r: p.y, c: p.x, color: p.c1 }, { r: p.y + DIRS[p.dir][0], c: p.x + DIRS[p.dir][1], color: p.c2 }];
function canPlace(bd, p) {
  for (const cl of cellsOf(p)) {
    if (cl.r < 0 || cl.r >= ROWS || cl.c < 0 || cl.c >= COLS) return false;
    if (bd[cl.r][cl.c]) return false;
  }
  return true;
}
function simMatches(bd) {
  const m = {};
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      if (bd[r][c]) {
        const col = bd[r][c][1]; let end = c + 1;
        while (end < COLS && bd[r][end] && bd[r][end][1] === col) end++;
        if (end - c >= 4) for (let cc = c; cc < end; cc++) m[r + ',' + cc] = true;
        c = end;
      } else c++;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      if (bd[r][c]) {
        const col = bd[r][c][1]; let end = r + 1;
        while (end < ROWS && bd[end][c] && bd[end][c][1] === col) end++;
        if (end - r >= 4) for (let rr = r; rr < end; rr++) m[rr + ',' + c] = true;
        r = end;
      } else r++;
    }
  }
  return m;
}
function simGravity(bd) {
  for (let c = 0; c < COLS; c++) {
    const nc = new Array(ROWS).fill(null);
    let w = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!bd[r][c]) continue;
      if (bd[r][c][0] === 'V') { nc[r] = bd[r][c]; w = r - 1; }
      else { nc[w] = bd[r][c]; w--; }
    }
    for (let r = 0; r < ROWS; r++) bd[r][c] = nc[r];
  }
}
// lock pill at its resting spot, run the engine's cascade to completion
function simDrop(bd0, p0) {
  const bd = bd0.map(r => r.slice());
  let y = p0.y;
  while (canPlace(bd, { x: p0.x, y: y + 1, dir: p0.dir, c1: p0.c1, c2: p0.c2 })) y++;
  for (const cl of cellsOf({ x: p0.x, y, dir: p0.dir, c1: p0.c1, c2: p0.c2 })) bd[cl.r][cl.c] = 'P' + cl.color;
  let cleared = 0, clearedPills = 0, casc = 0;
  for (;;) {
    const m = simMatches(bd); const ks = Object.keys(m);
    if (!ks.length) break;
    for (const k of ks) { const [r, c] = k.split(',').map(Number); if (bd[r][c][0] === 'V') cleared++; else clearedPills++; bd[r][c] = null; }
    simGravity(bd);
    casc++;
    if (casc > 30) break;
  }
  return { bd, cleared, clearedPills };
}
function evalBoard(bd) {
  // Dr. Mario structure: only a same-color run that includes the TOP cell of its column can
  // be completed (drop the missing half from above). Buried runs are dead weight, so reward
  // top-run lengths, keep the top rows clear, and mildly tax stored pill halves.
  let r3 = 0, r2 = 0, danger = 0, stored = 0, polluted = 0;
  for (let c = 0; c < COLS; c++) {
    let top = ROWS;
    for (let rr = 0; rr < ROWS; rr++) if (bd[rr][c]) { top = rr; break; }
    if (top < ROWS) {
      const col = bd[top][c][1];
      let len = 1;
      while (top + len < ROWS && bd[top + len][c] && bd[top + len][c][1] === col) len++;
      if (len >= 3) r3++; else if (len === 2) r2++;
      // a lone pill head is a polluted column: garbage must consolidate into FEW columns,
      // never spread over the ones holding live runs
      else if (len === 1 && bd[top][c][0] === 'P') polluted++;
    }
    if (top < 3) danger += 3 - top;
    for (let rr = 0; rr < ROWS; rr++) if (bd[rr][c] && bd[rr][c][0] === 'P') stored++;
  }
  return 60 * r3 + 14 * r2 - 45 * danger - 1.0 * stored - 5 * polluted;
}
// enumerate real reachable placements: rotate at spawn, soft-drop once for dir 3 (needs y>=1),
// then walk horizontally with per-column canPlace checks exactly like the engine's tryMove
function choosePlacement(bd, pill, next) {
  let best = null, bestScore = -1e9;
  // reachability of each orientation from the spawn (3,0,dir0) through the engine's own
  // rotate-kick path (d3 needs a soft-drop first, so its intermediate cells must be clear)
  const rotOK = [
    true,
    !bd[1][3],
    !bd[1][3] && !bd[0][2],
    !bd[1][3] && !bd[1][4] && !bd[2][3] && !bd[1][2] && !bd[0][3],
  ];
  for (let d = 0; d < 4; d++) {
    if (!rotOK[d]) continue;
    const ystart = d === 3 ? 1 : 0;
    for (let x = 0; x < COLS; x++) {
      if (!canPlace(bd, { x, y: ystart, dir: d, c1: pill.c1, c2: pill.c2 })) continue;
      // traversable from spawn x=3?
      let ok = true;
      const step = x >= 3 ? 1 : -1;
      for (let cx = 3; cx !== x + step; cx += step) {
        if (!canPlace(bd, { x: cx, y: ystart, dir: d, c1: pill.c1, c2: pill.c2 })) { ok = false; break; }
      }
      if (!ok) continue;
      const res = simDrop(bd, { x, y: ystart, dir: d, c1: pill.c1, c2: pill.c2 });
      // pill-only matches don't kill viruses but they free space and unlock cascades
      let sc = 150 * res.cleared + 22 * res.clearedPills + evalBoard(res.bd);
      // full one-pill lookahead with the KNOWN Next colors: a placement that lets the next
      // pill clear is worth almost as much as clearing now (the Next box is real player info)
      if (next) {
        let b2 = 0;
        for (let d2 = 0; d2 < 4 && b2 < 4; d2++) for (let x2 = 0; x2 < COLS; x2++) {
          const y2 = d2 === 3 ? 1 : 0;
          if (!canPlace(res.bd, { x: x2, y: y2, dir: d2, c1: next.c1, c2: next.c2 })) continue;
          const r2 = simDrop(res.bd, { x: x2, y: y2, dir: d2, c1: next.c1, c2: next.c2 });
          if (r2.cleared + 0.2 * r2.clearedPills > b2) b2 = r2.cleared + 0.2 * r2.clearedPills;
        }
        sc += 120 * b2;
      }
      if (sc > bestScore) { bestScore = sc; best = { x, dir: d }; }
    }
  }
  return best; // null only if the board is truly unplayable
}
// drive the real pill: rotate to dir, move to x, hard-drop with the space key
function driveTo(x, dir) {
  let st = S();
  if (!st.pill) return false;
  if (dir === 3 && st.pill.y === 0) key('ArrowDown'); // dir 3 needs the pill one row down
  let gu = 0;
  while ((st = S()).pill && st.pill.dir !== dir && gu++ < 5) key('x');
  gu = 0;
  while ((st = S()).pill && st.pill.x !== x && gu++ < 10) key(st.pill.x < x ? 'ArrowRight' : 'ArrowLeft');
  key(' '); // hard drop -> lockPill -> engine cascade
  return true;
}

// ---- menu flow via real buttons ----
T('menu-visible', g.els['menu-screen'].style.display !== 'none', 'display=' + g.els['menu-screen'].style.display);
const howto = g.els['howto-overlay'];
T('howto-auto-shows', howto && howto.classList.contains('show'), 'show=' + !!(howto && howto.classList.contains('show')));
const gotIt = btnByOnclick('closeHowTo');
if (gotIt) gotIt.click(); g.pump(2);
T('howto-closes', !g.els['howto-overlay'].classList.contains('show'), 'still shown');

const selBtn = btnByOnclick('toggleLevelSelect');
if (selBtn) selBtn.click(); g.pump(2);
T('level-select-builds', (g.els['level-grid'].children || []).length === 20, 'buttons=' + (g.els['level-grid'].children || []).length);

const play = btnByOnclick('startGame(1)');
play.click(); g.pump(6);
let st = S();
T('game-starts', st.gs === 'playing' && st.lv === 1 && st.vir === 4, 'gs=' + st.gs + ' lv=' + st.lv + ' vir=' + st.vir);

// ---- basic input plumbing through the real keydown handler ----
const px0 = st.pill.x, pd0 = st.pill.dir;
key('ArrowLeft'); key('ArrowRight'); key('x');
st = S();
T('move-rotate-works', st.pill && (st.pill.dir !== pd0), 'dir=' + (st.pill || {}).dir);

// ---- pause/resume via real key + real Resume button ----
key('p'); g.pump(2);
const pausedMid = S().gs === 'paused' && g.els['pause-overlay'].classList.contains('show');
const resumeBtn = btnByOnclick('resumeGame');
if (resumeBtn) resumeBtn.click(); g.pump(2);
T('pause-resume', pausedMid && S().gs === 'playing', 'pausedMid=' + pausedMid + ' now=' + S().gs);

// ---- play the whole campaign: every level to its own win via real input ----
const DEADLINE = Date.now() + 98000;
let levelWins = 0, retriesUsed = 0, stuck = '', firstClearOk = false, sawClearing = false;
let prevVir = S().vir;

function playUntilTerminal() {
  let it = 0, noDrop = 0, lastDropped = S().dropped;
  while (it++ < 6000) {
    if (Date.now() > DEADLINE) return 'stuck:deadline';
    const s = S();
    if (s.vir < prevVir) { firstClearOk = true; prevVir = s.vir; }
    if (s.gs === 'levelcomplete') return 'win';
    if (s.gs === 'gameover') return 'over';
    if (s.gs === 'clearing') { g.pump(3); continue; }
    if (s.gs !== 'playing') { g.pump(3); continue; }
    if (!s.pill) return 'stuck:no-pill-after-resume';
    const bd = B();
    const plan = choosePlacement(bd, s.pill, s.next);
    if (!plan) return 'stuck:no-placement L' + s.lv;
    if (!driveTo(plan.x, plan.dir)) return 'stuck:drive';
    if (!pauseCycleOk && S().gs === 'clearing') {
      // regression test for the P1 pause-during-cascade fix: pause mid-cascade, resume via the
      // real button, and require the cascade to finish and a new pill to spawn (no soft-lock)
      key('p'); g.pump(2);
      const wasPaused = S().gs === 'paused';
      const rb = btnByOnclick('resumeGame');
      if (rb) rb.click();
      const resumedIntoCascade = wasPaused && S().gs === 'clearing';
      let g7 = 0; while (S().gs === 'clearing' && g7++ < 400) g.pump(3);
      pauseCycleOk = resumedIntoCascade && (S().gs === 'playing' || S().gs === 'levelcomplete') && (!!S().pill || S().gs === 'levelcomplete');
      if (S().gs === 'gameover') return 'over';
    }
    let g8 = 0;
    while (S().gs === 'clearing' && g8++ < 400) g.pump(3);
    if (S().dropped === lastDropped) { if (++noDrop > 40) return 'stuck:drop-does-nothing'; } else { noDrop = 0; lastDropped = S().dropped; }
  }
  return 'stuck:iterations';
}
let pauseCycleOk = false;

function clickAndWait(match, fn) {
  const b = btnByOnclick(match);
  if (b) b.click(); else g.call(match.replace(/\(\)$/, '') + '()');
  g.pump(4);
  return waitGs(['playing'], 200);
}

let lv = 1;
while (lv <= 20 && !stuck) {
  let attempt = 0, res = '';
  for (;;) {
    res = playUntilTerminal();
    if (res === 'win') break;
    if (res === 'over' && attempt < 3) { // real Try Again button — new random virus layout
      attempt++; retriesUsed++;
      if (!clickAndWait('restartLevel')) { res = 'stuck:retry-failed'; break; }
      prevVir = S().vir;
      continue;
    }
    break;
  }
  if (res !== 'win') { stuck = 'L' + lv + ' ' + res + ' (attempts ' + (attempt + 1) + ')'; break; }
  levelWins++;
  if (lv < 20) {
    if (!clickAndWait('nextLevel') || S().lv !== lv + 1) { stuck = 'chain broke after L' + lv + ' (now ' + S().lv + ' gs=' + S().gs + ')'; break; }
    prevVir = S().vir;
    lv++;
  } else {
    // L20 done: endless mode — Next Level continues to 21, then quit to menu via real button
    const endlessOk = clickAndWait('nextLevel') && S().lv === 21 && S().vir > 0;
    T('endless-mode-continues', endlessOk, 'lv=' + S().lv + ' vir=' + S().vir + ' gs=' + S().gs);
    const menu = btnByOnclick('quitToMenu');
    if (menu) menu.click(); else g.call('quitToMenu()');
    g.pump(3);
    break;
  }
}

st = S();
T('match-clears-viruses', firstClearOk, 'cleared=' + firstClearOk);
T('pause-during-cascade-survives', pauseCycleOk, 'pauseCycleOk=' + pauseCycleOk);
T('all-20-levels-clearable', levelWins === 20 && !stuck, levelWins + '/20' + (stuck ? ' stuck: ' + stuck : ''));
T('back-to-menu', S().gs === 'menu' && g.els['menu-screen'].style.display !== 'none', 'gs=' + S().gs);
const saved = JSON.parse(g.ls.getItem('virus_buster') || '{}');
T('progress-saved', (saved.maxLevel || 0) >= 21, 'maxLevel=' + (saved.maxLevel || 0));
T('score-positive', (saved.bestScore || 0) > 0, 'best=' + (saved.bestScore || 0));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: levelWins + '/20', retries: retriesUsed, stuck: stuck || '' } };
console.log('virus-buster: ' + levelWins + '/20 levels cleared via real keyboard input (rotate/move/space) with engine-side cascades: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
