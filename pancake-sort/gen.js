#!/usr/bin/env node
/*
 * Pancake Sort — level generator (GameZipper Round 63, Game #477).
 *
 * Generates 30 levels across 5 tiers. Each level is a scrambled permutation
 * of [1..N]; `par` is the BFS-computed minimum flip distance to the sorted
 * state [1,2,...,N] (ascending top-to-bottom = smallest on top, largest on
 * bottom). Stack is stored TOP-TO-BOTTOM: stack[0] is the top pancake.
 *
 * Flip of position k (1-indexed from top) reverses stack[0..k-1].
 *
 * Output: pancake-sort/levels.json
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---- BFS: minimum flips from `start` to sorted [1..n] ---- */
function bfsMin(start, n) {
  const target = [];
  for (let i = 1; i <= n; i++) target.push(i);
  const targetKey = target.join(',');
  const startKey = start.join(',');
  if (startKey === targetKey) return 0;
  const visited = Object.create(null);
  visited[startKey] = 0;
  const queue = [start.slice()];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const ck = cur.join(',');
    const d = visited[ck];
    if (d >= 11) continue; // cap (pancake number for n<=10 is <=11)
    for (let k = 2; k <= n; k++) {
      const next = cur.slice();
      for (let i = 0, j = k - 1; i < j; i++, j--) {
        const t = next[i]; next[i] = next[j]; next[j] = t;
      }
      const nk = next.join(',');
      if (visited[nk] === undefined) {
        const nd = d + 1;
        if (nk === targetKey) return nd;
        visited[nk] = nd;
        queue.push(next);
      }
    }
  }
  return -1; // unreachable (should never happen — graph is connected)
}

/* ---- Mulberry32 PRNG (deterministic per seed) ---- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Apply `k` random valid flips to a sorted stack to produce a scramble. */
function scramble(n, k, rng) {
  const s = [];
  for (let i = 1; i <= n; i++) s.push(i);
  let lastFlip = -1;
  for (let i = 0; i < k; i++) {
    let f;
    let tries = 0;
    do {
      f = 2 + Math.floor(rng() * (n - 1)); // flip size 2..n
      tries++;
    } while (f === lastFlip && tries < 8); // avoid immediate undo
    lastFlip = f;
    for (let a = 0, b = f - 1; a < b; a++, b--) {
      const t = s[a]; s[a] = s[b]; s[b] = t;
    }
  }
  // Guard: if scramble produced a sorted stack, flip a middle to break it.
  let sorted = true;
  for (let i = 0; i < n; i++) if (s[i] !== i + 1) { sorted = false; break; }
  if (sorted) {
    const f = Math.max(2, Math.floor(n / 2));
    for (let a = 0, b = f - 1; a < b; a++, b--) {
      const t = s[a]; s[a] = s[b]; s[b] = t;
    }
  }
  return s;
}

/* Per-level config: [N, scrambleDistance, parMin, parMax]. Stack sizes and
   scramble distances ascend within each tier for a smooth difficulty curve. */
const TIERS = [
  'Beginner', 'Easy', 'Medium', 'Hard', 'Master'
];
const LEVEL_CFG = [
  // Beginner (Lv 1-6): N 3-4, scr 2-3, par 2-4
  [3, 2, 2, 4], [3, 3, 2, 4], [4, 2, 2, 4], [4, 3, 2, 4], [4, 3, 2, 4], [4, 3, 2, 4],
  // Easy (Lv 7-12): N 5-6, scr 3-4, par 3-6
  [5, 3, 3, 6], [5, 4, 3, 6], [5, 4, 3, 6], [6, 3, 3, 6], [6, 4, 3, 6], [6, 4, 3, 6],
  // Medium (Lv 13-18): N 6-7, scr 4-5, par 4-7
  [6, 4, 4, 7], [6, 5, 4, 7], [7, 4, 4, 7], [7, 5, 4, 7], [7, 5, 4, 7], [7, 5, 4, 7],
  // Hard (Lv 19-24): N 7-8, scr 5-6, par 5-8
  [7, 5, 5, 8], [7, 6, 5, 8], [8, 5, 5, 8], [8, 6, 5, 8], [8, 6, 5, 8], [8, 6, 5, 8],
  // Master (Lv 25-30): N 8-10, scr 6-8, par 6-10
  [8, 6, 6, 10], [8, 7, 6, 10], [9, 7, 6, 10], [9, 8, 6, 10], [10, 7, 6, 10], [10, 8, 6, 10],
];

function tierForLevelIdx(idx) {
  return Math.floor(idx / 6); // 0..4
}

function main() {
  const levels = [];
  for (let i = 0; i < LEVEL_CFG.length; i++) {
    const [n, scrDist, parMin, parMax] = LEVEL_CFG[i];
    const tier = TIERS[tierForLevelIdx(i)];
    let best = null;
    // Try many seeds; keep the first scramble whose par lands in range & <= 10.
    for (let seedTry = 0; seedTry < 400; seedTry++) {
      const rng = mulberry32((i + 1) * 100003 + seedTry * 97);
      const st = scramble(n, scrDist, rng);
      const par = bfsMin(st, n);
      if (par < 0 || par > 10) continue;
      if (par >= parMin && par <= parMax) {
        best = { stack: st, par };
        break;
      }
      // Track a fallback (in-range par preferred, else smallest valid par).
      if (!best || (par <= 10 && par > 0)) {
        if (!best || Math.abs(par - (parMin + parMax) / 2) < Math.abs(best.par - (parMin + parMax) / 2)) {
          best = { stack: st, par };
        }
      }
    }
    if (!best) throw new Error('Failed to generate level ' + (i + 1));
    levels.push({
      id: i + 1,
      tier: tier,
      tierIdx: tierForLevelIdx(i),
      n: n,
      stack: best.stack,
      par: best.par,
      maxHints: 3,
      maxUndos: 3
    });
    console.log(`Lv ${i + 1} [${tier}] N=${n} scr=${scrDist} par=${best.par} stack=[${best.stack.join(',')}]`);
  }
  const out = {
    generated: new Date().toISOString(),
    game: 'Pancake Sort Master',
    total: levels.length,
    tiers: TIERS,
    levels: levels
  };
  const outPath = path.join(__dirname, 'levels.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${levels.length} levels to ${outPath}`);
}

main();
