// tap-away engine verifier — verifies each LEVEL is solvable.
//
// Algorithm: Iterative DFS using a manual stack. At each stack frame, we maintain the
// current block state. When multiple blocks are removable, we BRANCH by pushing one
// path forward and recording the alternative as a backup frame.
//
// Game rule: a block at (x, y) pointing in direction d (0=up, 1=right, 2=down, 3=left)
// can be removed iff all cells on its line-of-sight (in direction d, until grid edge)
// have no other block at that position. Goal: remove all blocks.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lvlMatch = html.match(/var LEVELS=\s*(\[[\s\S]*?\]);/);
if (!lvlMatch) {
  console.log(JSON.stringify({ verdict: 'FAIL', error: 'LEVELS array not found' }));
  process.exit(1);
}
const LEVELS = (new Function('return ' + lvlMatch[1]))();
const N = LEVELS.length;

function DIR_DX(d) { return d === 1 ? 1 : d === 3 ? -1 : 0; }
function DIR_DY(d) { return d === 0 ? -1 : d === 2 ? 1 : 0; }

function canRemove(block, state, w, h) {
  if (block.removed) return false;
  const dx = DIR_DX(block.d), dy = DIR_DY(block.d);
  let cx = block.x + dx, cy = block.y + dy;
  while (cx >= 0 && cx < w && cy >= 0 && cy < h) {
    for (const b of state) {
      if (b !== block && !b.removed && b.x === cx && b.y === cy) return false;
    }
    cx += dx; cy += dy;
  }
  return true;
}

function isSolvable(level, opsBudget = 100000) {
  const w = level.w, h = level.h;
  const initState = level.blocks.map(b => ({ x: b.x, y: b.y, d: b.d, removed: false }));

  function snapshot(s) { return s.map(b => ({ ...b })); }
  function applyRemove(s, idx) {
    const ns = snapshot(s);
    ns[idx].removed = true;
    return ns;
  }

  // Iterative DFS with branching. Stack frames contain:
  //   state: snapshot of current state
  //   branchIdx: index into the current list of "removable" blocks to TRY next
  // When branchIdx >= removable.length, this frame is exhausted; pop and continue previous.
  // When we apply a branch, we push a NEW frame with the post-removal state and reset.

  let ops = 0;
  // First frame: compute removable
  const initialRemovable = [];
  for (let i = 0; i < initState.length; i++) {
    if (canRemove(initState[i], initState, w, h)) initialRemovable.push(i);
  }
  const stack = [{ state: initState, branchIdx: 0, removable: initialRemovable }];

  while (stack.length > 0) {
    if (++ops > opsBudget) return { ok: false, reason: 'budget', ops };
    const top = stack[stack.length - 1];

    // Win check
    if (!top.state.some(b => !b.removed)) return { ok: true, ops };

    if (top.branchIdx >= top.removable.length) {
      // This frame exhausted its branches — backtrack
      stack.pop();
      continue;
    }

    // Take next branch
    const choice = top.removable[top.branchIdx];
    top.branchIdx++;
    // Push new frame with freshly-computed removable
    const newState = top.state.map(b => ({ ...b }));
    newState[choice].removed = true;
    const newRemovable = [];
    for (let i = 0; i < newState.length; i++) {
      if (canRemove(newState[i], newState, w, h)) newRemovable.push(i);
    }
    stack.push({ state: newState, branchIdx: 0, removable: newRemovable });
  }

  return { ok: false, reason: 'exhausted', ops };
}

// Per-level test
let passed = 0, failed = 0;
const failReasons = [];
const levelReports = [];

for (let i = 0; i < N; i++) {
  const L = LEVELS[i];
  // Structural
  if (!L.w || !L.h || !Array.isArray(L.blocks) || L.blocks.length === 0) {
    failed++;
    failReasons.push({ idx: i, reasons: 'structural_invalid' });
    continue;
  }
  const seen = new Set();
  let structuralOk = true;
  for (const b of L.blocks) {
    const k = `${b.x},${b.y}`;
    if (seen.has(k)) { structuralOk = false; failReasons.push({ idx: i, reasons: `dup cell ${k}` }); break; }
    seen.add(k);
    if (b.x < 0 || b.x >= L.w || b.y < 0 || b.y >= L.h) { structuralOk = false; failReasons.push({ idx: i, reasons: `OOB ${JSON.stringify(b)}` }); break; }
    if (b.d < 0 || b.d > 3) { structuralOk = false; failReasons.push({ idx: i, reasons: `bad dir ${b.d}` }); break; }
  }
  if (!structuralOk) { failed++; continue; }

  // Solvability
  const r = isSolvable(L, 200000);
  if (r.ok) {
    passed++;
    levelReports.push({ idx: i, par: L.par, blocks: L.blocks.length, ops: r.ops });
  } else {
    failed++;
    failReasons.push({ idx: i, reasons: r.reason + (r.ops ? ` (ops=${r.ops})` : '') });
  }
}

console.log(JSON.stringify({
  total: N,
  passed,
  failed,
  failReasons: failReasons.slice(0, 5),
  levelReports,
  verdict: failed === 0 ? `PASS ${passed}/${N}` : `FAIL ${failed}/${N}`,
}, null, 2));
process.exit(failed === 0 ? 0 : 1);
