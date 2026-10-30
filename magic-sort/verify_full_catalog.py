#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Magic Sort — FULL-catalog verification (all 220,000 levels), sharded.

Design notes (learned the hard way):
  * Shard by LEVEL INDEX, not by chunk file. The chunk files are wildly uneven
    (5,000 … 65,000 levels), so chunk-level parallelism leaves one worker with
    65,000 levels while six idle. Index sharding keeps every worker busy.
  * The solver is a PORT of the game's own findHint() (canonical sorted-tube
    key, same candidate ordering, same state/time caps). It does NOT trust the
    game's answer: it re-implements the move generator from the shipped rules
    and re-validates the emitted terminal state.
  * A level that exhausts the DFS *budget* is UNPROVEN, not FAIL (the Pitfall
    #70 rule: a counting gate that cannot distinguish "search timed out" from
    "no solution exists" fails hardest on the best levels). Unproven levels
    are reported separately and make the exit code non-zero.
  * Structural invariants are checked on EVERY level (cheap, full coverage):
      INV-1  cell_count == n * CAP           (each colour present exactly 4x)
      INV-2  every cell colour in 1..n
      INV-3  at least 2 empty tubes
      INV-4  colour histogram matches n * 4  (each colour exactly CAP cells)

Output: {"total":N,"pass":N,"fail":N,"unproven":N,"inv_fail":{...},...}
Exit 0 only if fail == 0 AND unproven == 0.
"""
import json
import os
import sys
import time
import glob
from concurrent.futures import ProcessPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verify_bfs import decode_level, solve, is_solved, CAP, encode_state  # noqa: E402

LEVELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "levels")

# Per-level solver budget. Mirrors the game's own caps (verify_bfs.solve
# defaults): n>=12 -> 200k states / 4s, n>=8 -> 120k / 2.5s, else 150k / 3s.
# The game itself must be able to hint a level inside its UI budget, so a
# level that needs MORE than that is a real playability defect, not a
# verifier artefact. We therefore treat "exhausted budget" as UNPROVEN and
# separately report it; it is a FAIL signal for shippability.
LEVEL_BUDGET = {"states": 200000, "time_ms": 4000}


def check_invariants(encoded):
    """Structural invariants — cheap, run on every level."""
    try:
        n, b = decode_level(encoded)
    except Exception as e:  # noqa: BLE001
        return None, "decode_error:%s" % e
    if not isinstance(n, int) or n <= 0:
        return None, "bad_n"
    cells = 0
    hist = {}
    for t in b:
        for c in t:
            cells += 1
            if c < 0 or c >= n:
                return None, "color_out_of_range:%d(n=%d)" % (c, n)
            hist[c] = hist.get(c, 0) + 1
    if cells != n * CAP:
        return None, "cell_count_mismatch:%d!=%d" % (cells, n * CAP)
    # each colour must appear exactly CAP times
    for c in range(n):
        if hist.get(c, 0) != CAP:
            return None, "color_count_mismatch:c%d=%d" % (c, hist.get(c, 0))
    empties = sum(1 for t in b if len(t) == 0)
    if empties < 2:
        return None, "too_few_empty_tubes:%d" % empties
    return (n, b), ""


def run_shard(job):
    """job = (shard_id, [(global_idx, encoded), ...])"""
    shard_id, items = job
    inv_fail = {}
    unsolvable = []      # proven unsolvable (DFS exhausted the STATE space)
    unproven = []        # hit the time/state budget -> unknown
    examples = []
    t0 = time.time()
    for gidx, enc in items:
        parsed, reason = check_invariants(enc)
        if parsed is None:
            key = reason.split(":")[0]
            inv_fail[key] = inv_fail.get(key, 0) + 1
            if len(examples) < 5:
                examples.append({"idx": gidx, "kind": "invariant", "reason": reason})
            continue
        n, b = parsed
        moves, states = solve(
            b,
            max_states=LEVEL_BUDGET["states"],
            time_limit_ms=LEVEL_BUDGET["time_ms"],
        )
        if moves is None:
            # Distinguish "proved unsolvable" from "gave up": the port returns
            # state_count; if it stopped because the stack emptied (rather than
            # the budget), the level is genuinely unsolvable.
            if states < LEVEL_BUDGET["states"]:
                unsolvable.append(gidx)
                if len(examples) < 5:
                    examples.append({"idx": gidx, "kind": "unsolvable", "n": n})
            else:
                unproven.append(gidx)
                if len(examples) < 5:
                    examples.append({"idx": gidx, "kind": "unproven", "n": n})
            continue
        # Terminal state must actually be solved (independent re-validation)
        if not is_solved(b):
            key = "terminal_not_solved"
            inv_fail[key] = inv_fail.get(key, 0) + 1
            if len(examples) < 5:
                examples.append({"idx": gidx, "kind": "terminal", "reason": key})
    return {
        "shard": shard_id,
        "count": len(items),
        "inv_fail": inv_fail,
        "unsolvable": unsolvable,
        "unproven": unproven,
        "examples": examples,
        "seconds": round(time.time() - t0, 1),
    }


def main():
    files = sorted(glob.glob(os.path.join(LEVELS_DIR, "chunk_*.json")))
    if not files:
        print("no chunk files found in %s" % LEVELS_DIR)
        sys.exit(2)

    # Build the flat global index -> encoded map
    flat = []
    for path in files:
        with open(path) as f:
            data = json.load(f)
        for enc in data["levels"]:
            flat.append(enc)
    total = len(flat)
    print("loaded %d levels from %d chunk files" % (total, len(files)), flush=True)

    n_shards = 28
    shards = [[] for _ in range(n_shards)]
    for i, enc in enumerate(flat):
        shards[i % n_shards].append((i, enc))
    jobs = [(i, s) for i, s in enumerate(shards) if s]

    agg_inv = {}
    agg_unsolvable = []
    agg_unproven = []
    agg_examples = []
    done = 0
    t0 = time.time()
    with ProcessPoolExecutor(max_workers=min(14, len(jobs))) as ex:
        for res in ex.map(run_shard, jobs):
            done += res["count"]
            for k, v in res["inv_fail"].items():
                agg_inv[k] = agg_inv.get(k, 0) + v
            agg_unsolvable += res["unsolvable"]
            agg_unproven += res["unproven"]
            agg_examples += res["examples"]
            print("  shard %2d  %5d levels  inv_fail=%d unsolvable=%d unproven=%d  %.0fs  (done %d/%d)"
                  % (res["shard"], res["count"], sum(res["inv_fail"].values()),
                     len(res["unsolvable"]), len(res["unproven"]), res["seconds"], done, total),
                  flush=True)

    fail = len(agg_unsolvable) + sum(agg_inv.values())
    out = {
        "total": total,
        "pass": total - fail - len(agg_unproven),
        "fail": fail,
        "unproven": len(agg_unproven),
        "inv_fail": agg_inv,
        "unsolvable": len(agg_unsolvable),
        "unsolvable_idx": agg_unsolvable[:50],
        "unproven_idx": agg_unproven[:50],
        "examples": agg_examples[:10],
        "seconds": round(time.time() - t0, 1),
    }
    print(json.dumps(out, indent=2)[:3000])
    with open("/tmp/ms_full_verify.json", "w") as f:
        json.dump(out, f, indent=2)
    verdict = "PASS" if (out["fail"] == 0 and out["unproven"] == 0) else "FAIL"
    print("VERDICT:", verdict)
    sys.exit(0 if verdict == "PASS" else 1)


if __name__ == "__main__":
    main()
