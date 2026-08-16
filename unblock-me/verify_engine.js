// Unblock-me deterministic per-level solvability verifier (v2).
//
// Reads LEVELS + rules from the game under test (unblock-me/index.html, READ-ONLY)
// and runs an exhaustive BFS with the game's EXACT move semantics:
//   - 6x6 grid; w>h blocks slide horizontally, h>w vertically, 1x1 both axes.
//   - One slide of s cells along a free path = one move (matches game solveBFS edges).
//   - Goal: red block right edge reaches column 6 (red.x + red.w >= 6), i.e. red.x == 6 - w.
// Verdicts per level:
//   SOLVED       - shortest slide-count found (and solution replay-verified vs game rules)
//   UNSOLVABLE   - reachable state space fully exhausted, goal never reached (proof)
//   INCONCLUSIVE - exceeded budget (60s / 20M states per level)
//
// v2 performance vs v1 (which re-built the occupancy grid inside every canMove probe
// and used O(n) queue.shift()): flat Uint8Array states, one grid fill per expansion,
// contiguous free-run move generation, ring buffer queue, packed 1-char-per-block
// Set keys. This turns the old "BFS-budget-exceeded" results into definite verdicts.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_HTML = path.join(__dirname, 'index.html');
const EVIDENCE_DIR = path.join(__dirname, '..', '_optimization', 'evidence', 'unblock-me');
const MAX_STATES_PER_LEVEL = 20000000; // budget: still exceeded -> INCONCLUSIVE
const MAX_SECONDS_PER_LEVEL = 60;

// ─── Extract LEVELS from the game HTML (no game files are modified) ───
const html = fs.readFileSync(GAME_HTML, 'utf8');
const m = html.match(/const LEVELS\s*=\s*\[/);
if (!m) throw new Error('LEVELS array not found in ' + GAME_HTML);
let i = m.index + m[0].length;
let depth = 1;
const start = i;
while (i < html.length && depth > 0) {
  if (html[i] === '[') depth++;
  else if (html[i] === ']') depth--;
  i++;
}
const lvlsStr = html.slice(start, i - 1);
const cleaned = lvlsStr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/,\s*$/, '');
const LEVELS = vm.runInNewContext('([' + cleaned + '])', { RED: 'red' });

// Designer-intended optimal move counts from level comments: "// Level N (k moves)"
const intendedMoves = {};
{
  const re = /\/\/\s*Level\s+(\d+)[^\n]*?\((\d+)\s+move/i;
  for (const line of lvlsStr.split('\n')) {
    const mm = line.match(re);
    if (mm) intendedMoves[+mm[1]] = +mm[2];
  }
}

// ─── Game-exact rules (copied semantics from index.html) for solution replay ───
function gameBuildGrid(blks) {
  const g = Array.from({ length: 6 }, () => Array(6).fill(-1));
  blks.forEach((b, i) => {
    for (let dy = 0; dy < b.h; dy++)
      for (let dx = 0; dx < b.w; dx++) g[b.y + dy][b.x + dx] = i;
  });
  return g;
}

function gameCanMove(blks, idx, dir, steps) {
  const b = blks[idx];
  const grid = gameBuildGrid(blks);
  if (dir === 'right') {
    for (let s = 1; s <= steps; s++) {
      const nx = b.x + b.w - 1 + s;
      if (nx >= 6) return false;
      for (let dy = 0; dy < b.h; dy++)
        if (grid[b.y + dy][nx] !== -1 && grid[b.y + dy][nx] !== idx) return false;
    }
  } else if (dir === 'left') {
    for (let s = 1; s <= steps; s++) {
      const nx = b.x - s;
      if (nx < 0) return false;
      for (let dy = 0; dy < b.h; dy++)
        if (grid[b.y + dy][nx] !== -1 && grid[b.y + dy][nx] !== idx) return false;
    }
  } else if (dir === 'down') {
    for (let s = 1; s <= steps; s++) {
      const ny = b.y + b.h - 1 + s;
      if (ny >= 6) return false;
      for (let dx = 0; dx < b.w; dx++)
        if (grid[ny][b.x + dx] !== -1 && grid[ny][b.x + dx] !== idx) return false;
    }
  } else if (dir === 'up') {
    for (let s = 1; s <= steps; s++) {
      const ny = b.y - s;
      if (ny < 0) return false;
      for (let dx = 0; dx < b.w; dx++)
        if (grid[ny][b.x + dx] !== -1 && grid[ny][b.x + dx] !== idx) return false;
    }
  }
  return true;
}

function fmtMove(blk, dx, dy) {
  const d = dx > 0 ? 'R' + dx : dx < 0 ? 'L' + -dx : dy > 0 ? 'D' + dy : 'U' + -dy;
  return `B${blk}:${d}`;
}

// Replay a solver solution under the game's own canMove rules; win check per checkWin().
function replaySolution(lvl, redIdx, moves) {
  const blks = lvl.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
  for (const mv of moves) {
    const { block, dx, dy } = mv;
    if (block < 0 || block >= blks.length) return false;
    if ((dx !== 0) === (dy !== 0)) return false; // exactly one axis must move
    const b = blks[block];
    if (dx !== 0 && b.w < b.h) return false; // horizontal move on vertical-only block
    if (dy !== 0 && b.h < b.w) return false; // vertical move on horizontal-only block
    const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    const steps = Math.abs(dx) + Math.abs(dy);
    if (!gameCanMove(blks, block, dir, steps)) return false;
    b.x += dx;
    b.y += dy;
  }
  const rb = blks[redIdx];
  return rb.x + rb.w >= 6;
}

// ─── Exhaustive BFS solver ───
// State: Uint8Array stride 2N -> [x0..xN-1, y0..yN-1]. Key: 1 char per block
// (48 + x + 6*y) so dedup is exact (no hashing collisions -> sound verdicts).
function solveLevel(lvl, maxStates = MAX_STATES_PER_LEVEL, maxSeconds = MAX_SECONDS_PER_LEVEL) {
  const t0 = process.hrtime.bigint();
  const ms = () => Number(process.hrtime.bigint() - t0) / 1e6;
  const N = lvl.length;
  const redIdx = lvl.findIndex((b) => b.color === 'red');
  if (redIdx === -1)
    return { verdict: 'UNSOLVABLE', states: 0, ms: ms(), reason: 'no red block: win condition can never be met' };

  const ws = new Uint8Array(N), hs = new Uint8Array(N);
  const canLR = new Uint8Array(N), canUD = new Uint8Array(N);
  const vgrid = new Uint8Array(36);
  const overlapCells = [];
  for (let k = 0; k < N; k++) {
    const b = lvl[k];
    ws[k] = b.w; hs[k] = b.h;
    canLR[k] = b.w >= b.h ? 1 : 0; // game isHorizontal()
    canUD[k] = b.h >= b.w ? 1 : 0; // vertical allowed (1x1 gets both)
    if (b.x < 0 || b.y < 0 || b.x + b.w > 6 || b.y + b.h > 6)
      return { verdict: 'ERROR', states: 0, ms: ms(), reason: `block ${k} out of bounds` };
    for (let dy = 0; dy < b.h; dy++)
      for (let dx = 0; dx < b.w; dx++) {
        const c = (b.y + dy) * 6 + b.x + dx;
        // Data-defect detection: game buildGrid() resolves overlaps last-writer-wins;
        // we simulate that exact semantics, but record the defect.
        if (vgrid[c] && vgrid[c] !== k + 1) overlapCells.push(c);
        vgrid[c] = k + 1;
      }
  }
  const initialOverlap = overlapCells.length > 0;
  const goalX = 6 - ws[redIdx]; // red.x + red.w >= 6  <=>  red.x >= 6 - w (slides cap x+w at 6)

  const stride = 2 * N;
  let cap = 1 << 16;
  let q = new Uint8Array(cap * stride);
  let parent = new Int32Array(cap);
  let mvBlk = new Int16Array(cap);
  let mvDx = new Int8Array(cap);
  let mvDy = new Int8Array(cap);

  for (let k = 0; k < N; k++) { q[k] = lvl[k].x; q[N + k] = lvl[k].y; }
  parent[0] = -1;
  const visited = new Set();
  const keyChars = new Uint8Array(N);
  {
    for (let k = 0; k < N; k++) keyChars[k] = 48 + q[k] + 6 * q[N + k];
    visited.add(String.fromCharCode.apply(null, keyChars));
  }
  let count = 1; // states stored (slot 0 = initial)
  let head = 0;
  const deadlineNs = Number(t0) + maxSeconds * 1e9;

  if (q[redIdx] >= goalX)
    return { verdict: 'SOLVED', moves: 0, states: 1, ms: ms(), solution: [], goalSlot: 0, initialOverlap };

  const grid = new Uint8Array(36);
  let goalSlot = -1;
  let budgetHit = false;
  let off = 0; // byte offset of the state being expanded (slot `head`)

  // Enqueue successor of state at slot `head`: block k shifted by (dx, dy).
  // Returns 0 = queued/duplicate, 1 = goal state reached, 2 = state budget exceeded.
  // Sets outer goalSlot when the new state satisfies the win condition.
  function tryPush(k, dx, dy) {
    for (let j = 0; j < N; j++) keyChars[j] = 48 + q[off + j] + 6 * q[off + N + j];
    keyChars[k] = 48 + (q[off + k] + dx) + 6 * (q[off + N + k] + dy);
    const key = String.fromCharCode.apply(null, keyChars);
    if (visited.has(key)) return 0;
    visited.add(key);
    if (count >= cap) {
      if (cap >= maxStates) return 2;
      cap = Math.min(maxStates, cap * 2);
      const nq = new Uint8Array(cap * stride); nq.set(q); q = nq;
      const np = new Int32Array(cap); np.set(parent); parent = np;
      const nb = new Int16Array(cap); nb.set(mvBlk); mvBlk = nb;
      const nx2 = new Int8Array(cap); nx2.set(mvDx); mvDx = nx2;
      const ny2 = new Int8Array(cap); ny2.set(mvDy); mvDy = ny2;
    }
    const noff = count * stride;
    q.copyWithin(noff, off, off + stride);
    q[noff + k] += dx;
    q[noff + N + k] += dy;
    parent[count] = head;
    mvBlk[count] = k; mvDx[count] = dx; mvDy[count] = dy;
    if (k === redIdx && q[noff + redIdx] >= goalX) { goalSlot = count; return 1; }
    count++;
    return 0;
  }

  expand: while (head < count) {
    if ((head & 1023) === 0 && Number(process.hrtime.bigint()) > deadlineNs)
      return { verdict: 'INCONCLUSIVE', states: count, ms: ms(), reason: `time budget ${maxSeconds}s exceeded`, initialOverlap };

    off = head * stride;
    grid.fill(0);
    for (let k = 0; k < N; k++) {
      const x = q[off + k], y = q[off + N + k], w = ws[k], h = hs[k];
      for (let dy = 0; dy < h; dy++) {
        const row = (y + dy) * 6;
        for (let dx = 0; dx < w; dx++) grid[row + x + dx] = k + 1;
      }
    }

    for (let k = 0; k < N && goalSlot === -1 && !budgetHit; k++) {
      const x = q[off + k], y = q[off + N + k], w = ws[k], h = hs[k];
      // (block, dx, dy) successors along free runs, both directions on each allowed axis
      if (canLR[k]) {
        for (let nx = x - 1; nx >= 0; nx--) { // left: entering column nx
          let free = true;
          for (let dy = 0; dy < h; dy++) if (grid[(y + dy) * 6 + nx]) { free = false; break; }
          if (!free) break;
          if (tryPush(k, nx - x, 0)) break;
        }
        if (goalSlot !== -1 || budgetHit) break;
        for (let nx = x + 1; nx + w <= 6; nx++) { // right: entering column nx + w - 1
          let free = true;
          for (let dy = 0; dy < h; dy++) if (grid[(y + dy) * 6 + nx + w - 1]) { free = false; break; }
          if (!free) break;
          if (tryPush(k, nx - x, 0)) break;
        }
        if (goalSlot !== -1 || budgetHit) break;
      }
      if (canUD[k]) {
        for (let ny = y - 1; ny >= 0; ny--) { // up: entering row ny
          let free = true;
          for (let dx = 0; dx < w; dx++) if (grid[ny * 6 + x + dx]) { free = false; break; }
          if (!free) break;
          if (tryPush(k, 0, ny - y)) break;
        }
        if (goalSlot !== -1 || budgetHit) break;
        for (let ny = y + 1; ny + h <= 6; ny++) { // down: entering row ny + h - 1
          let free = true;
          for (let dx = 0; dx < w; dx++) if (grid[(ny + h - 1) * 6 + x + dx]) { free = false; break; }
          if (!free) break;
          if (tryPush(k, 0, ny - y)) break;
        }
        if (goalSlot !== -1 || budgetHit) break;
      }
    }
    if (goalSlot !== -1 || budgetHit) break expand;
    head++;
  }

  if (goalSlot !== -1) {
    const seq = [];
    let idx = goalSlot;
    while (idx > 0) {
      seq.push({ block: mvBlk[idx], dx: mvDx[idx], dy: mvDy[idx] });
      idx = parent[idx];
    }
    seq.reverse();
    return {
      verdict: 'SOLVED',
      moves: seq.length,
      states: count,
      ms: ms(),
      solution: seq.map((s) => fmtMove(s.block, s.dx, s.dy)),
      solutionMoves: seq,
      goalSlot,
      initialOverlap,
    };
  }
  if (budgetHit)
    return { verdict: 'INCONCLUSIVE', states: count, ms: ms(), reason: `state budget ${maxStates} exceeded`, initialOverlap };
  // Loop exited because the queue emptied: every reachable state was explored.
  return { verdict: 'UNSOLVABLE', states: count, ms: ms(), reason: `reachable space exhausted (${count} states, no goal)`, initialOverlap };
}

// ─── Main ───
function main() {
  const out = [];
  const log = (s) => { out.push(s); console.log(s); };

  log(`Unblock-me deterministic solvability audit`);
  log(`source: unblock-me/index.html (read-only) | LEVELS extracted: ${LEVELS.length}`);
  log(`engine: exhaustive BFS, game-exact move semantics (1 slide = 1 move), budget ${MAX_SECONDS_PER_LEVEL}s / ${MAX_STATES_PER_LEVEL} states per level`);
  log('');

  const results = [];
  const t0 = process.hrtime.bigint();
  for (let li = 0; li < LEVELS.length; li++) {
    const lvl = LEVELS[li];
    const r = solveLevel(lvl);
    const entry = {
      level: li + 1,
      verdict: r.verdict,
      states: r.states,
      ms: Math.round(r.ms * 100) / 100,
      intendedMoves: intendedMoves[li + 1] !== undefined ? intendedMoves[li + 1] : null,
    };
    if (r.initialOverlap) entry.initialOverlap = true; // data defect: overlapping blocks at start; game buildGrid resolves last-writer-wins
    if (r.moves !== undefined) entry.moves = r.moves;
    if (r.reason) entry.reason = r.reason;
    if (r.solution) {
      entry.solution = r.solution;
      entry.solutionVerifiedByGameRules = replaySolution(lvl, lvl.findIndex((b) => b.color === 'red'), r.solutionMoves);
    }
    results.push(entry);

    const vc = r.verdict === 'SOLVED' ? 'SOLVED' : r.verdict === 'UNSOLVABLE' ? 'UNSOLVABLE' : 'INCONCLUSIVE';
    let line = `L${String(li + 1).padStart(2, '0')}  ${vc.padEnd(12)}`;
    if (r.verdict === 'SOLVED')
      line += ` optimal=${r.moves} slides  states=${String(r.states).padStart(8)}  ${r.ms.toFixed(1).padStart(7)}ms  intended=${entry.intendedMoves ?? '?'}  replay-ok=${entry.solutionVerifiedByGameRules}`;
    else if (r.verdict === 'UNSOLVABLE')
      line += ` states=${String(r.states).padStart(8)}  ${r.ms.toFixed(1).padStart(7)}ms  (${r.reason})`;
    else line += ` states=${r.states}  ${r.ms.toFixed(1)}ms  (${r.reason})`;
    if (r.initialOverlap) line += '  [DATA-DEFECT: overlapping blocks at start]';
    log(line);
  }

  const solved = results.filter((r) => r.verdict === 'SOLVED');
  const unsolvable = results.filter((r) => r.verdict === 'UNSOLVABLE');
  const inconclusive = results.filter((r) => r.verdict !== 'SOLVED' && r.verdict !== 'UNSOLVABLE');
  const durS = Math.round((Number(process.hrtime.bigint() - t0) / 1e9) * 100) / 100;

  log('');
  log(`SUMMARY: ${LEVELS.length} levels | SOLVED ${solved.length} | UNSOLVABLE ${unsolvable.length} | INCONCLUSIVE ${inconclusive.length} | total ${durS}s`);
  if (unsolvable.length) log(`UNSOLVABLE levels: ${unsolvable.map((r) => r.level).join(', ')}`);
  if (inconclusive.length) log(`INCONCLUSIVE levels: ${inconclusive.map((r) => r.level).join(', ')}`);
  const allReplayOk = solved.every((r) => r.solutionVerifiedByGameRules !== false);
  log(`All SOLVED solutions replay-verified against game canMove rules: ${allReplayOk}`);
  log(`AUDIT: ${inconclusive.length === 0 ? 'COMPLETE - every level has a definitive verdict' : 'INCOMPLETE - ' + inconclusive.length + ' level(s) indeterminate'}`);
  log(`GAME CONTENT: ${solved.length === LEVELS.length ? 'PASS (all levels solvable)' : `FAIL (${unsolvable.length} of ${LEVELS.length} levels provably unsolvable)`}`);
  log(`VERDICT: ${inconclusive.length === 0 ? (solved.length === LEVELS.length ? 'PASS' : 'FAIL') : 'PARTIAL'}`);

  // ─── Evidence ───
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const ts = new Date().toISOString();
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'verify.log'),
    `# unblock-me solvability audit | ${ts}\n# command: node unblock-me/verify_engine.js (cwd=repo root)\n` + out.join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'verify.json'),
    JSON.stringify(
      {
        slug: 'unblock-me',
        verifier: 'verify_engine.js v2 (exhaustive BFS, game-exact move semantics)',
        ts,
        durS,
        budget: { maxStatesPerLevel: MAX_STATES_PER_LEVEL, maxSecondsPerLevel: MAX_SECONDS_PER_LEVEL },
        summary: {
          total: LEVELS.length,
          solved: solved.length,
          unsolvable: unsolvable.length,
          inconclusive: inconclusive.length,
          unsolvableLevels: unsolvable.map((r) => r.level),
          inconclusiveLevels: inconclusive.map((r) => r.level),
          solutionsReplayVerified: allReplayOk,
          gameContent: solved.length === LEVELS.length ? 'PASS' : 'FAIL',
        },
        levels: results.map(({ solutionMoves, ...e }) => e),
      },
      null,
      1
    )
  );

  console.log(JSON.stringify({ pass: solved.length, fail: unsolvable.length + inconclusive.length, total: LEVELS.length, verdict: unsolvable.length === 0 && inconclusive.length === 0 ? 'PASS' : 'FAIL' }));
  process.exit(unsolvable.length === 0 && inconclusive.length === 0 ? 0 : 1); // convention: exit 0 = every level solvable
}

if (require.main === module) {
  main();
} else {
  module.exports = { LEVELS, intendedMoves, solveLevel, replaySolution, gameCanMove };
}
