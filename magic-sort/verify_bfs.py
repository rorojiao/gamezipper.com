#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Magic Sort — DFS solvability verifier (Python port of game's findHint()).

Mirrors the JS findHint() at magic-sort/index.html L2931:
  - DFS (not BFS) with canonical (tube-order-independent) state keys
  - Move ordering: progress-first (complete dest > consolidate > bigger pour)
  - Skip: same-color src already complete; reverse of last move; empty→empty transfer
  - Depth bound: 10 * numColors; state budget: 80k-200k by color count
  - Time bound: 4s for 12+ colors; 2.5-3s for smaller

This is fast enough to verify tens of thousands of levels per hour.
"""
import json
import time
import sys
from collections import defaultdict

CAP = 4


def decode_level(encoded):
    """encoded = [n, tube0, tube1, ...]; tube = base-30 int (4 cells)."""
    n = encoded[0]
    b = []
    for i in range(1, len(encoded)):
        v = encoded[i]
        t = []
        for _ in range(CAP):
            c = v % 30
            if c > 0:
                t.insert(0, c - 1)  # unshift equivalent
            v //= 30
        b.append(t)
    # Ensure ≥2 empty bottles (matches decoder L549-554)
    empty = sum(1 for t in b if len(t) == 0)
    while empty < 2:
        b.append([])
        empty += 1
    return n, b


def encode_state(b):
    """Canonical key (sorted tube strings, joined)."""
    return "|".join(",".join(str(c) for c in t) for t in sorted(b))


def is_solved(b):
    for t in b:
        if not t:
            continue
        if len(t) != CAP or any(c != t[0] for c in t):
            return False
    return True


def gen_candidates(state):
    """Yield candidate moves: (from, to, count, priority)."""
    cands = []
    for fr in range(len(state)):
        src = state[fr]
        src_len = len(src)
        if src_len == 0:
            continue
        fc = src[-1]
        # run length of fc from top
        run_r = 0
        for i in range(src_len - 1, -1, -1):
            if src[i] == fc:
                run_r += 1
            else:
                break
        if src_len == CAP and run_r == CAP:
            continue  # source already complete
        for to in range(len(state)):
            if to == fr:
                continue
            dst = state[to]
            dst_len = len(dst)
            if dst_len >= CAP:
                continue
            tc = dst[-1] if dst_len > 0 else -1
            if tc != -1 and tc != fc:
                continue
            # skip useless: pouring monochrome source into empty tube
            if tc == -1 and run_r == src_len:
                continue
            count = min(run_r, CAP - dst_len)
            if count <= 0:
                continue
            pri = count
            if tc == fc:
                pri += 10
            if dst_len + count == CAP:
                pri += 50
            cands.append((fr, to, count, fc, pri))
    # lower pri first (pushed later = popped first in LIFO)
    cands.sort(key=lambda x: x[4])
    return cands


def solve(b, max_states=None, time_limit_ms=None, max_depth_mult=10):
    """DFS solver matching game's findHint() with canonical keys."""
    n_colors = max((c for t in b for c in t), default=0) + 1
    if max_states is None:
        max_states = 200000 if n_colors >= 14 else 120000 if n_colors >= 12 else 80000 if n_colors >= 10 else 120000 if n_colors >= 8 else 150000
    if time_limit_ms is None:
        time_limit_ms = 4000 if n_colors >= 12 else 2500 if n_colors >= 8 else 3000

    start = time.time()
    key = encode_state(b)
    visited = {key}
    stack = [(b, [])]
    max_depth = n_colors * max_depth_mult
    state_count = 0

    while stack and state_count < max_states:
        if state_count % 2000 == 0 and (time.time() - start) * 1000 > time_limit_ms:
            # QA R343: distinguish TIME-out from stack EXHAUSTION — previously both
            # returned (None, count) and callers mislabeled slow-but-solvable big-n
            # levels as "proven unsolvable" (9/9 sampled n=29 claims solved by an
            # uncapped DFS). Third return value now carries the stop reason.
            return None, state_count, "timeout"
        cur, moves = stack.pop()
        state_count += 1
        if len(moves) >= max_depth:
            continue

        for fr, to, count, fc, _pri in gen_candidates(cur):
            # Build next state
            nxt = [t[:] for t in cur]
            for _ in range(count):
                nxt[fr].pop()
                nxt[to].append(fc)
            nxt_key = encode_state(nxt)
            if nxt_key in visited:
                continue
            visited.add(nxt_key)

            new_moves = moves + [(fr, to, count)]
            if is_solved(nxt):
                return new_moves, state_count, "solved"
            stack.append((nxt, new_moves))
    return None, state_count, "exhausted"


def verify_file(json_path, sample=None, time_limit_ms=4000):
    """Verify levels in a chunk file. Returns (pass, fail, skipped) + stats."""
    with open(json_path) as f:
        data = json.load(f)
    levels = data["levels"]
    if sample is not None and sample < len(levels):
        # uniform sample
        import random
        rng = random.Random(42)
        levels = rng.sample(levels, sample)

    pass_ct = fail_ct = 0
    fail_examples = []
    total_time = 0
    for idx, lv in enumerate(levels):
        n, b = decode_level(lv)
        # Quick solvability check: color count = sum(CAP) cells
        cell_count = sum(len(t) for t in b)
        expected = n * CAP
        if cell_count != expected:
            fail_ct += 1
            fail_examples.append((idx, "cell_count_mismatch", cell_count, expected))
            continue
        # DFS solve
        t0 = time.time()
        moves, st, _why = solve(b, time_limit_ms=time_limit_ms)
        total_time += time.time() - t0
        if moves is not None:
            pass_ct += 1
        else:
            fail_ct += 1
            if len(fail_examples) < 5:
                fail_examples.append((idx, "no_solution", st, n))
    return {
        "total": len(levels),
        "pass": pass_ct,
        "fail": fail_ct,
        "fail_examples": fail_examples,
        "avg_time_s": total_time / max(len(levels), 1),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: verify_bfs.py <chunk_X.json> [sample]")
        sys.exit(1)
    path = sys.argv[1]
    sample = int(sys.argv[2]) if len(sys.argv) > 2 else None
    print(f"Verifying {path} (sample={sample})...")
    result = verify_file(path, sample=sample)
    print(json.dumps(result, indent=2))
    pct = 100 * result["pass"] / max(result["total"], 1)
    print(f"\n  PASS: {result['pass']}/{result['total']} ({pct:.1f}%)")
    print(f"  FAIL: {result['fail']}")
    print(f"  Avg solve time: {result['avg_time_s']*1000:.1f}ms")
    if result["fail_examples"]:
        print(f"  Fail examples (first 5):")
        for ex in result["fail_examples"]:
            print(f"    {ex}")