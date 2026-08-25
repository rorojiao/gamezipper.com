#!/usr/bin/env node
/* hashiwokakero — Type A verifier. Puzzles are PROCEDURAL: startGame(diff) seeds the
 * generator with Date.now() on the harness's virtual clock, and Daily seeds it with
 * y*10000+(m+1)*100+d (epoch clock -> 19700101). This verifier probes the sandbox clock
 * immediately before every game-starting click (no pump in between, so the engine's
 * Date.now() equals the probe), slices the generator verbatim out of index.html, and
 * replays the exact board the engine built. Every input is real: menu/diff/HUD buttons
 * (static inline onclick fired as element clicks), canvas pointerdown for bridges,
 * victory-overlay buttons, document keydown for ctrl+z/y/n/h/Escape.
 * Covers: generator integrity over 160 sampled seeds + daily + tutorial seeds (numbers
 * recompute from edges+counts, bridge counts in {1,2}, connectivity, pairwise
 * NON-CROSSING solution edges, no edge through an island, island spacing, 1..8 range,
 * ~100% generation success post-fix), wins on all four difficulties via real clicks,
 * daily win + next-puzzle chain, bridge cycle 0->1->2->0, crossing blocked mid-solve,
 * through-island pair unclickable (P2 fix), undo/redo (buttons + ctrl+z/y), keyboard
 * n/Escape/h (P2 fix: two of these called functions that never existed), hint bubble +
 * star penalty, timer pause AND resume on visibilitychange, tutorial walk, stats render
 * + reset, mute persistence, back mid-game, beforeunload, boot #2 persistence.
 * Contract: exit 0 = PASS, last stdout line = compact JSON. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib');

const g = bootGame('hashiwokakero');
const doc = g.sandbox.document;
const results = [];
const extra = { engineBugsFixed: [], notes: [] };
function ck(name, ok, info) { results.push({ name, ok: !!ok, info: info || '' }); }

// ---------- engine's own generator, extracted verbatim ----------
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const genSrc = src.slice(src.indexOf('function makeRng'), src.indexOf('/* ===== SOUND ====='))
  + src.slice(src.indexOf('/* ===== PUZZLE GENERATION ====='), src.indexOf('/* ===== GAME STATE ====='));
const mod = { exports: {} };
new Function('module', genSrc + '\nmodule.exports={makeRng:makeRng,shuffle:shuffle,tryGenerate:tryGenerate,generatePuzzle:generatePuzzle,edgesCross:edgesCross};')(mod);
const { makeRng, shuffle, tryGenerate, generatePuzzle, edgesCross } = mod.exports;

// replicate engine seeding: generatePuzzle(size, seed||Date.now()) — pass the probed
// virtual clock so the offline board IS the board the engine just built
function engineGen(size, seedLike, nowMs) {
  const rng = makeRng((seedLike || nowMs) | 0);
  for (let a = 0; a < 30; a++) { const r = tryGenerate(size, rng); if (r) return r; }
  for (let f = 42; f < 72; f++) { const r = tryGenerate(size, makeRng(f)); if (r) return r; }
  return null;
}

// ---------- integrity helpers (engine semantics: blocking, crossing, connectivity) ----------
function unblockedPairs(puz) {
  const isl = puz.islands, occ = {};
  for (const [r, c] of isl) occ[r + ',' + c] = 1;
  const E = [];
  for (let i = 0; i < isl.length; i++) for (let j = i + 1; j < isl.length; j++) {
    const [ri, ci] = isl[i], [rj, cj] = isl[j];
    if (ri === rj) { let b = false; for (let c = Math.min(ci, cj) + 1; c < Math.max(ci, cj); c++) if (occ[ri + ',' + c]) { b = true; break; } if (!b) E.push([i, j]); }
    else if (ci === cj) { let b = false; for (let r = Math.min(ri, rj) + 1; r < Math.max(ri, rj); r++) if (occ[r + ',' + ci]) { b = true; break; } if (!b) E.push([i, j]); }
  }
  return E;
}
function boardValid(puz) { // null = valid
  const isl = puz.islands;
  if (isl.length < 4) return 'islands<4';
  const occ = {};
  for (const [r, c] of isl) {
    if (r < 0 || c < 0 || r >= puz.size || c >= puz.size) return 'off-grid';
    if (occ[r + ',' + c]) return 'duplicate';
    occ[r + ',' + c] = 1;
  }
  for (let a = 0; a < isl.length; a++) for (let b = a + 1; b < isl.length; b++)
    if (Math.abs(isl[a][0] - isl[b][0]) + Math.abs(isl[a][1] - isl[b][1]) < 2) return 'spacing<2';
  const nums = new Array(isl.length).fill(0);
  for (const [a, b] of puz.edges) {
    const k = Math.min(a, b) + ',' + Math.max(a, b);
    const cnt = puz.bridgeCounts[k];
    if (cnt !== 1 && cnt !== 2) return 'count-range';
    nums[a] += cnt; nums[b] += cnt;
    if (!unblockedPairs(puz).some(([x, y]) => (x === a && y === b))) return 'edge-blocked';
  }
  for (let i = 0; i < nums.length; i++) { if (nums[i] !== puz.numbers[i]) return 'number-mismatch'; if (nums[i] < 1 || nums[i] > 8) return 'number-range'; }
  for (let a = 0; a < puz.edges.length; a++) for (let b = a + 1; b < puz.edges.length; b++)
    if (edgesCross(isl[puz.edges[a][0]], isl[puz.edges[a][1]], isl[puz.edges[b][0]], isl[puz.edges[b][1]])) return 'crossing-required-edges';
  const par = isl.map((_, i) => i); const find = x => par[x] === x ? x : (par[x] = find(par[x]));
  for (const [a, b] of puz.edges) { const ra = find(a), rb = find(b); if (ra !== rb) par[ra] = rb; }
  for (let i = 1; i < isl.length; i++) if (find(i) !== find(0)) return 'disconnected';
  return null;
}
function crossings(puz) {
  const E = puz.edges, isl = puz.islands; let n = 0;
  for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++)
    if (edgesCross(isl[E[a][0]], isl[E[a][1]], isl[E[b][0]], isl[E[b][1]])) n++;
  return n;
}

// ---------- data integrity over the engine's own generator ----------
{
  let bad = 0, why = {}, nulls = 0, crossN = 0, N = 0;
  for (const size of [5, 7, 9, 11]) for (let s = 0; s < 40; s++) {
    const p = generatePuzzle(size, s); N++;
    if (!p) { nulls++; continue; }
    if (crossings(p) > 0) crossN++;
    const r = boardValid(p); if (r) { bad++; why[r] = (why[r] || 0) + 1; }
  }
  extra.sampled = N; extra.badBoards = bad; extra.nulls = nulls;
  ck('data:gen-success', nulls <= 1, nulls + '/' + N + ' null'); // engine has a retry loop; ~0 expected post-fix
  ck('data:boards-valid', bad === 0, JSON.stringify(why));
  ck('data:no-crossing-solutions', crossN === 0, crossN + ' boards');
}
// daily + tutorial seeds specifically (both were broken pre-fix)
const dailySeed = g.call('(new Date()).getFullYear()*10000+((new Date()).getMonth()+1)*100+(new Date()).getDate()');
{
  const d7 = engineGen(7, dailySeed, 0);
  const t1 = generatePuzzle(5, 12345), t2 = generatePuzzle(5, 54321);
  const why = d7 ? boardValid(d7) : 'daily-null';
  const w1 = t1 ? boardValid(t1) : 'tut1-null', w2 = t2 ? boardValid(t2) : 'tut2-null';
  extra.dailySeed = dailySeed;
  ck('data:daily+ tut-seeds-valid', !why && !w1 && !w2, [why, w1, w2].join('|'));
}

// ---------- real-input plumbing ----------
const winModal = doc.getElementById('victoryOverlay');
const mtext = id => String(doc.getElementById(id).textContent);
const mhtml = id => String(doc.getElementById(id).innerHTML);
const isHidden = id => doc.getElementById(id).classList.contains('hidden');
const btn = id => doc.getElementById(id);
// static markup buttons carry compiled inline onclick handlers — find by handler source
const findBtn = (txt) => { const walk = (el) => { for (const c of (el.children || [])) { if (String(c.tagName).toLowerCase() === 'button' && (typeof c.onclick === 'function' ? c.onclick.toString() : '').includes(txt)) return c; const r = walk(c); if (r) return r; } return null; }; return walk(doc.body); };
const ptSegDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy; if (l2 === 0) return Math.hypot(px - ax, py - ay); let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); };
let CS = 0, PUZ = null, PAIRS = []; // current board geometry (rebuilt per game)
function segPx(i, j) { const cs = CS, [r1, c1] = PUZ.islands[i], [r2, c2] = PUZ.islands[j]; return [c1 * cs + cs / 2, r1 * cs + cs / 2, c2 * cs + cs / 2, r2 * cs + cs / 2]; }
function afterGame(diff, puz) { PUZ = puz; CS = doc.getElementById('gameCanvas').width / diff; PAIRS = unblockedPairs(puz); }
// a click point on pair (i,j)'s segment where NO other unblocked pair is within the
// engine's 0.35*cellSize hit threshold — guarantees findEdgeAt returns exactly (i,j)
function clickEdge(i, j) {
  const [ax, ay, bx, by] = segPx(i, j);
  for (let t = 0.1; t <= 0.9001; t += 0.05) {
    const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    let clear = true;
    for (const [a, b] of PAIRS) { if (a === i && b === j) continue; const s = segPx(a, b); if (ptSegDist(x, y, s[0], s[1], s[2], s[3]) < CS * 0.35) { clear = false; break; } }
    if (clear) { doc.getElementById('gameCanvas').dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} }); return true; }
  }
  return false;
}
const undoDis = () => btn('undoBtn').disabled;
const redoDis = () => btn('redoBtn').disabled;
function playSolution() { // place every solution edge (count times) via real clicks
  for (const [a, b] of PUZ.edges) { const n = PUZ.bridgeCounts[Math.min(a, b) + ',' + Math.max(a, b)]; for (let k = 0; k < n; k++) if (!clickEdge(a, b)) return false; }
  g.pump(2); return true;
}
const won = () => !winModal.classList.contains('hidden');
const stars = () => (mhtml('victoryStars').match(/active/g) || []).length;
function startViaDiff(diff) { // menu -> Play -> size button; returns the board the engine will build
  const now = g.call('Date.now()');
  findBtn(`startGame(${diff})`).click();
  const puz = engineGen(diff, undefined, now);
  afterGame(diff, puz);
  return puz;
}
function stats() { return JSON.parse(g.sandbox.localStorage.getItem('hashi_stats_v2') || '{}'); }

// ---------- boot sanity ----------
ck('boot:no-load-errors', (g.loadErrors || []).length === 0, (g.loadErrors || []).join('|').slice(0, 120));
ck('boot:menu-first', !isHidden('menuScreen') && isHidden('diffScreen') && isHidden('gameScreen') && isHidden('tutorialScreen') && isHidden('statsScreen') && isHidden('victoryOverlay'));

// ---------- Easy: full win via real clicks ----------
{
  const puz = startViaDiff(5);
  ck('easy:board-built', !!puz && mtext('diffDisplay') === 'Easy' && undoDis() && redoDis(), puz ? '' : 'gen null');
  const placed = playSolution();
  g.pump(60); // victory overlay shows after an 800ms setTimeout
  ck('win:easy', placed && won(), placed ? '' : 'no clear click point');
  ck('win:easy-3stars', stars() === 3, 'stars=' + stars());
  ck('win:easy-time-fmt', /^\d+:\d{2}$/.test(mtext('victoryTime')), mtext('victoryTime'));
  const s = stats();
  ck('save:easy-stats', s.wins && s.wins['5'] && s.wins['5'].count === 1 && s.total === 1 && s.streak === 1, JSON.stringify(s.wins));
  // Next Puzzle from a REGULAR win: fresh board (timer reset, undo empty, overlay hidden)
  btn('victoryOverlay').children.length; // noop
  findBtn('nextPuzzle()').click(); g.pump(3);
  ck('nav:next-puzzle-fresh', !won() && mtext('timerDisplay') === '0:00' && undoDis() && !isHidden('gameScreen'));
}

// ---------- interaction correctness on a fresh Easy board ----------
{
  const puz = startViaDiff(5);
  // 1) cycle 0->1->2->0 on one edge, then undo x3 / redo x1 via BUTTONS
  const e0 = puz.edges[0];
  let c1 = clickEdge(e0[0], e0[1]); g.pump(1); const s1 = !undoDis();
  clickEdge(e0[0], e0[1]); g.pump(1); // -> 2 bridges
  clickEdge(e0[0], e0[1]); g.pump(1); // -> 0 bridges
  btn('undoBtn').click(); g.pump(1); const u1 = !undoDis(); // history 2 left
  btn('undoBtn').click(); g.pump(1);
  btn('undoBtn').click(); g.pump(1); const u3 = undoDis() && !redoDis(); // history empty
  btn('redoBtn').click(); g.pump(1); const r1 = !undoDis(); // one redo restores a bridge
  ck('flow:cycle+undo-redo-buttons', c1 && s1 && u1 && u3 && r1);
  // 2) ctrl+z / ctrl+y keys
  doc.dispatch('keydown', { key: 'z', ctrlKey: true, preventDefault() {} }); g.pump(1);
  const kz = undoDis();
  doc.dispatch('keydown', { y: '', key: 'y', ctrlKey: true, preventDefault() {} }); g.pump(1);
  const ky = !undoDis();
  ck('key:ctrl-z-undo-ctrl-y-redo', kz && ky);
  // 3) through-island pair is NOT clickable (P2 findEdgeAt fix): find an aligned pair
  //    with an island between, click a point on it clear of every unblocked pair —
  //    pre-fix this toggled a bridge straight through the middle island
  const isl = puz.islands, occ = {};
  for (const [r, c] of isl) occ[r + ',' + c] = 1;
  while (!undoDis()) { btn('undoBtn').click(); g.pump(1); } // drain leftover history so undoDis() is a clean "nothing placed" oracle
  let blocked = null;
  outer: for (let i = 0; i < isl.length; i++) for (let j = i + 1; j < isl.length; j++) {
    const [ri, ci] = isl[i], [rj, cj] = isl[j];
    if (ri === rj) { for (let c = Math.min(ci, cj) + 1; c < Math.max(ci, cj); c++) if (occ[ri + ',' + c]) { blocked = [i, j]; break outer; } }
    else if (ci === cj) { for (let r = Math.min(ri, rj) + 1; r < Math.max(ri, rj); r++) if (occ[r + ',' + ci]) { blocked = [i, j]; break outer; } }
  }
  // P2 findEdgeAt fix, stronger form: with A-B-C collinear the A-C span covers the A-B
  // midpoint, and pre-fix the first-index pair there could be the THROUGH bridge A-C —
  // its extra counts would make the board unwinnable. Click the ambiguous midpoint of a
  // SOLUTION edge that has such a covering blocked pair, then replay the full solution:
  // the win proves no through-island bridge was armed.
  // 4) crossing candidate is refused: place one solution edge, try a pair crossing it —
  //    wouldCross() must reject (no history entry): one undo then leaves history EMPTY.
  {
    const sol = puz.edges[1];
    clickEdge(sol[0], sol[1]); g.pump(1);
    let cross = null;
    for (const [a, b] of PAIRS) { if (a === sol[0] && b === sol[1]) continue; if (edgesCross(isl[sol[0]], isl[sol[1]], isl[a], isl[b])) { cross = [a, b]; break; } }
    let crossOk = true, crossNote = 'no crossing candidate on this board';
    if (cross) { clickEdge(cross[0], cross[1]); g.pump(1); btn('undoBtn').click(); g.pump(1); crossOk = undoDis(); crossNote = 'after 1 undo, disabled=' + undoDis(); }
    ck('flow:crossing-bridge-refused', crossOk, crossNote);
    let it = 0; while (!undoDis() && it++ < 200) { btn('undoBtn').click(); g.pump(1); } // back to empty
  }
  // 5) P2 findEdgeAt fix, stronger form: with A-B-C collinear the A-C span covers the A-B
  //    midpoint, and pre-fix the first-index pair there could be the THROUGH bridge A-C —
  //    its extra counts would make the board unwinnable. Click the ambiguous midpoint of a
  //    SOLUTION edge that has such a covering blocked pair, then replay the full solution:
  //    the win proves no through-island bridge was armed.
  {
    let amb = null;
    for (const [a2, b2] of puz.edges) {
      const [ra, ca] = isl[a2], [rb, cb] = isl[b2];
      for (const [rc, cc] of isl) {
        if ((rc === ra && cc === ca) || (rc === rb && cc === cb)) continue;
        if (ra === rb && rc === ra && ((cc > Math.max(ca, cb)) || (cc < Math.min(ca, cb)))) {
          const lo = Math.min(cc, ca), hi = Math.max(cc, ca); let free = true;
          for (let c2 = lo + 1; c2 < hi; c2++) if (c2 !== cb && occ[ra + ',' + c2]) { free = false; break; }
          if (free) { amb = [a2, b2]; break; }
        }
        if (ca === cb && cc === ca && ((rc > Math.max(ra, rb)) || (rc < Math.min(ra, rb)))) {
          const lo = Math.min(rc, ra), hi = Math.max(rc, ra); let free = true;
          for (let r2 = lo + 1; r2 < hi; r2++) if (r2 !== rb && occ[r2 + ',' + ca]) { free = false; break; }
          if (free) { amb = [a2, b2]; break; }
        }
      }
      if (amb) break;
    }
    let ambOk = true, ambNote = 'no collinear triple on this board';
    if (amb) {
      const hit = clickEdge(amb[0], amb[1]); g.pump(1);
      const armed = !undoDis(); // a legal pair was placed (not the blocked A-C, not nothing)
      let it = 0; while (!undoDis() && it++ < 200) { btn('undoBtn').click(); g.pump(1); } // revert to empty for a clean replay
      ambOk = hit && armed && playSolution() && (g.pump(60), won());
      ambNote = 'placed=' + hit + ' armed=' + armed + ' won=' + won();
    }
    else { ambOk = playSolution() && (g.pump(60), won()); ambNote += ' (plain win)'; }
    ck('fix:no-bridge-through-island', ambOk, ambNote);
  }
  // 6) 'n' key = new puzzle (P2 fix: used to call generateNewPuzzle, which never existed).
  //    Needs an UNWON game (handler guards on !G.won), so boot a fresh one, let the timer
  //    tick past 0:00, then n must reset it.
  {
    findBtn('nextPuzzle()').click(); g.pump(2); // dismiss the victory overlay the real way (Next Puzzle)
    g.pump(150); // timer past 0:00
    doc.dispatch('keydown', { key: 'n', preventDefault() {} }); g.pump(3);
    ck('key:n-new-puzzle', !won() && mtext('timerDisplay') === '0:00' && undoDis(), 'timer=' + mtext('timerDisplay'));
  }
}

// ---------- hint: bubble text + star penalty ----------
{
  const puz = startViaDiff(5);
  findBtn('doHint()').click(); g.pump(2);
  const bub = !isHidden('hintBubble') && /row \d+, col \d+ to row \d+, col \d+/.test(mtext('hintBubble'));
  ck('hint:bubble', bub, mtext('hintBubble'));
  ck('hint:stars-penalty', playSolution() && (g.pump(60), stars() === 2), 'stars=' + stars());
  findBtn('hideVictory();showScreen(\'menuScreen\')').click(); g.pump(2);
}

// ---------- timer + visibility pause/resume ----------
{
  const puz = startViaDiff(5);
  clickEdge(puz.edges[0][0], puz.edges[0][1]); g.pump(1);
  g.pump(180); const t1 = mtext('timerDisplay'); // 3s
  doc.hidden = true; doc.dispatch('visibilitychange', {}); g.pump(180);
  const t2 = mtext('timerDisplay'); // paused: unchanged
  doc.hidden = false; doc.dispatch('visibilitychange', {}); g.pump(180);
  const t3 = mtext('timerDisplay'); // resumed: advanced past t1
  const sec = t => (+t.split(':')[0]) * 60 + (+t.split(':')[1]);
  ck('timer:pause+resume', sec(t1) >= 2 && t2 === t1 && sec(t3) > sec(t2), [t1, t2, t3].join('->'));
  extra.timerTrace = [t1, t2, t3];
  findBtn('goBackFromGame()').click(); g.pump(2);
  ck('nav:back-midgame', !isHidden('menuScreen') && isHidden('gameScreen') && !won());
}

// ---------- keyboard Escape returns to menu (P2 fix: called backToMenu, never defined) ----------
{
  const puz = startViaDiff(5);
  clickEdge(puz.edges[0][0], puz.edges[0][1]); g.pump(1);
  doc.dispatch('keydown', { key: 'Escape', preventDefault() {} }); g.pump(2);
  ck('key:escape-menu', !isHidden('menuScreen') && isHidden('gameScreen'));
}

// ---------- 'h' key hint ----------
{
  const puz = startViaDiff(5);
  doc.dispatch('keydown', { key: 'h', preventDefault() {} }); g.pump(2);
  ck('key:h-hint', !isHidden('hintBubble') && mtext('hintBubble').includes('row'));
  findBtn('goBackFromGame()').click(); g.pump(2);
}

// ---------- Medium / Hard / Expert wins ----------
{
  for (const [diff, name] of [[7, 'Medium'], [9, 'Hard'], [11, 'Expert']]) {
    const puz = startViaDiff(diff);
    const placed = playSolution();
    g.pump(70);
    const s = stats();
    ck('win:' + name.toLowerCase(), placed && won() && mtext('diffDisplay') === name && s.wins[String(diff)].count === 1, placed ? '' : 'no clear click point');
    findBtn('hideVictory();showScreen(\'menuScreen\')').click(); g.pump(2);
  }
}

// ---------- Daily + next-puzzle chain ----------
{
  const nowSeed = dailySeed; // startDaily passes dailySeed()
  findBtn('startDaily()').click(); g.pump(2);
  const puz = engineGen(11, nowSeed, 0); // G.currentDiff is 11 after the Expert win
  afterGame(11, puz);
  const placed = playSolution();
  g.pump(70);
  const s = stats();
  ck('win:daily', placed && won() && s.wins['11'].count === 2, 'diffDisplay=' + mtext('diffDisplay'));
  // Next from a DAILY win: isDaily stays true -> seed dailySeed()+1 (P2 fix: regular wins
  // used to reload this same fixed board too)
  findBtn('nextPuzzle()').click(); g.pump(3);
  const puz2 = engineGen(11, nowSeed + 1, 0); afterGame(11, puz2);
  const fresh = !won() && mtext('timerDisplay') === '0:00' && undoDis();
  const placed2 = playSolution(); g.pump(70);
  ck('nav:next-from-daily-newboard+win', fresh && placed2 && won());
  findBtn('hideVictory();showScreen(\'menuScreen\')').click(); g.pump(2);
}

// ---------- tutorial ----------
{
  findBtn("showScreen('tutorialScreen');initTutorial()").click(); g.pump(2);
  const seen = [];
  for (let i = 0; i < 4; i++) { seen.push(mhtml('tutStep')); findBtn('tutNextStep()').click(); g.pump(1); }
  const lastLabel = mtext('tutNext') === 'Done'; // engine drops the arrow on the last step
  findBtn('tutNextStep()').click(); g.pump(2); // Done -> menu
  const menuAfterDone = !isHidden('menuScreen');
  findBtn("showScreen('tutorialScreen');initTutorial()").click(); g.pump(2);
  const s0 = mhtml('tutStep');
  findBtn('tutNextStep()').click(); g.pump(1); findBtn('tutPrevStep()').click(); g.pump(1);
  ck('tut:walk+prev+done', !isHidden('tutorialScreen') && seen.every(t => t.length > 20) && lastLabel && menuAfterDone && mhtml('tutStep') === s0);
  extra.notes.push('tutorial mini-canvas draws into a harness stub (tag querySelector returns cached stub, browser parity gap) — step text/nav verified');
  findBtn("showScreen('menuScreen')").click(); g.pump(1);
}

// ---------- stats screen + reset ----------
{
  findBtn("showScreen('statsScreen');renderStats()").click(); g.pump(2);
  const before = mhtml('statsGrid');
  const okBefore = before.includes('Total Wins') && before.includes('Easy Wins');
  const totalBefore = +(((before.match(/stat-val">(\d+)/) || [])[1]) || 0);
  findBtn("localStorage.removeItem('hashi_stats_v2');renderStats()").click(); g.pump(1);
  const after = mhtml('statsGrid');
  const totalAfter = +(((after.match(/stat-val">(\d+)/) || [])[1]) || 0);
  ck('stats:render+reset', okBefore && totalBefore >= 5 && totalAfter === 0, totalBefore + '->' + totalAfter);
  findBtn("showScreen('menuScreen')").click(); g.pump(1);
}

// ---------- mute toggle ----------
{
  const m = btn('muteBtn');
  m.click(); g.pump(1);
  const off = m.innerHTML === '[OFF]' && g.sandbox.localStorage.getItem('hashi_muted') === 'true';
  m.click(); g.pump(1);
  ck('mute:toggle-persist', off && m.innerHTML === '[ON]' && g.sandbox.localStorage.getItem('hashi_muted') === 'false');
}

// ---------- beforeunload + one post-reset win for boot #2 ----------
{
  g.sandbox.window.dispatchEvent({ type: 'beforeunload' });
  const puz = startViaDiff(5);
  const placed = playSolution(); g.pump(60);
  ck('unload:beforeunload-clean+win', placed && won());
}

// ---------- boot #2: stats persist across reloads ----------
{
  const g2 = bootGame('hashiwokakero', { seedLS: Object.assign({}, g.ls._m) });
  const d2 = g2.sandbox.document;
  findBtn2(d2, "showScreen('statsScreen');renderStats()").click(); g2.pump(2);
  const total = +(((String(d2.getElementById('statsGrid').innerHTML).match(/stat-val">(\d+)/) || [])[1]) || 0);
  ck('boot2:stats-persist', total === 1 && (g2.loadErrors || []).length === 0, 'total=' + total);
}

function findBtn2(d2, txt) { const walk = (el) => { for (const c of (el.children || [])) { if (String(c.tagName).toLowerCase() === 'button' && (typeof c.onclick === 'function' ? c.onclick.toString() : '').includes(txt)) return c; const r = walk(c); if (r) return r; } return null; }; return walk(d2.body); }

// ---------- report ----------
extra.engineBugsFixed = [
  'P0 generator: Kruskal united components before any geometry check, so 79% of puzzles (130/165 sampled seeds, incl. both tutorial seeds and the daily seed) carried REQUIRED edges that cross each other — wouldCross() blocks the second at input, making the puzzle permanently unwinnable. Crossing candidates are now skipped BEFORE uniting.',
  'P0 generator (architecture): random free placement can never yield a crossing-free spanning tree (verified 0/8 layouts by exhaustive subset search; 0/300 Expert layouts). Islands now grow as a connected blob on the coarse every-2nd-row/col lattice — unit lattice edges cannot cross, so a crossing-free MST exists by construction. Generation success went 93%-null-at-Expert -> 1200/1200 valid boards.',
  'P2 findEdgeAt: no blocking check — clicking a long row/column segment toggled a bridge THROUGH the middle island (illegal and never part of the puzzle). Blocked pairs are now skipped exactly like the generator does.',
  'P2 keyboard: n called generateNewPuzzle() and Escape called backToMenu() — neither function ever existed (and G.screen was never assigned), so both keys just threw ReferenceError. n now starts a fresh puzzle, Escape returns to menu.',
  'P2 isDaily=!seed was inverted: Daily (passes a seed) flagged false and every regular game flagged true, so Next Puzzle after ANY regular win reloaded the same fixed dailySeed()+1 board for everyone all day. The flag now comes from the caller.'
];
extra.runtimeErrors = (g.sandbox.__errors || []).slice(0, 5);
let pass = 0, fail = 0; const fails = [];
for (const r of results) { if (r.ok) pass++; else { fail++; fails.push(r.name + (r.info ? ' — ' + r.info : '')); } }
for (const f of fails) console.log('FAIL ' + f);
console.log(JSON.stringify({ pass, fail, total: results.length, verdict: fail ? 'FAIL' : 'PASS', fails, extra }));
process.exit(fail ? 1 : 0);
