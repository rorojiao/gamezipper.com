#!/usr/bin/env python3
"""Build levels.json from canonical Hiroimono application/x-janko pages."""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

BASE = "https://www.janko.at/Raetsel/Hiroimono/{:03d}.a.htm"
CACHE = Path(__file__).with_name("source-cache")
OUT = Path(__file__).with_name("levels.json")


def parse(raw: str, n: int) -> dict:
    data = re.search(r'<script id="data" type="application/x-janko">(.*?)</script>', raw, re.S)
    if not data:
        raise ValueError(f"L{n}: missing data block")
    text = data.group(1)
    size_match = re.search(r"^size\s+(\d+)", text, re.M)
    problem_match = re.search(r"\[problem\]\n(.*?)\n\[solution\]", text, re.S)
    solution_match = re.search(r"\[solution\]\n(.*?)\n(?:\[moves\]|\[end\])", text, re.S)
    if not size_match or not problem_match or not solution_match:
        raise ValueError(f"L{n}: malformed size/problem/solution block")
    size = int(size_match.group(1))
    problem = problem_match.group(1)
    solution = solution_match.group(1)
    problem_rows = [line.split() for line in problem.strip().splitlines()]
    solution_rows = [line.split() for line in solution.strip().splitlines()]
    if len(problem_rows) != size or any(len(row) != size for row in problem_rows):
        raise ValueError(f"L{n}: bad problem dimensions")
    stones = [(r, c) for r, row in enumerate(problem_rows) for c, v in enumerate(row) if v == "x"]
    order_grid = [[None if v == "-" else int(v) for v in row] for row in solution_rows]
    max_order = max(v or 0 for row in order_grid for v in row)
    route = []
    for k in range(1, max_order + 1):
        pos = [(r, c) for r, row in enumerate(order_grid) for c, v in enumerate(row) if v == k]
        if len(pos) != 1:
            raise ValueError(f"L{n}: order {k} occurs {len(pos)} times")
        route.append(pos[0])
    return {"id": n, "size": size, "stones": stones, "solution": route}


def validate(level: dict) -> None:
    stones = {tuple(p) for p in level["stones"]}
    route = [tuple(p) for p in level["solution"]]
    if len(stones) != len(level["stones"]):
        raise ValueError("duplicate stones")
    if set(route) != stones or len(route) != len(stones):
        raise ValueError("route does not cover every stone once")
    remaining = set(stones)
    previous = None
    for i, current in enumerate(route):
        if current not in remaining:
            raise ValueError(f"step {i+1}: selected removed/non-stone cell")
        if previous is not None:
            pr, pc = previous
            cr, cc = current
            if pr != cr and pc != cc:
                raise ValueError(f"step {i+1}: not row/column aligned")
            if i >= 2:
                before = route[i-2]
                incoming = (pr-before[0], pc-before[1])
                outgoing = (cr-pr, cc-pc)
                if (outgoing[0] and incoming[0] and outgoing[0]*incoming[0] < 0) or (outgoing[1] and incoming[1] and outgoing[1]*incoming[1] < 0):
                    raise ValueError(f"step {i+1}: direct reversal")
            dr = (cr > pr) - (cr < pr)
            dc = (cc > pc) - (cc < pc)
            r, c = pr + dr, pc + dc
            while (r, c) != current:
                if (r, c) in remaining:
                    raise ValueError(f"step {i+1}: skips remaining stone {(r,c)}")
                r, c = r + dr, c + dc
        remaining.remove(current)
        previous = current
    if remaining:
        raise ValueError("remaining stones after route")


def main() -> int:
    CACHE.mkdir(exist_ok=True)
    levels = []
    for n in range(1, 31):
        cache = CACHE / f"{n:03d}.html"
        if not cache.exists():
            request = Request(BASE.format(n), headers={"User-Agent": "Mozilla/5.0 Chrome/120"})
            cache.write_bytes(urlopen(request, timeout=30).read())
        level = parse(cache.read_text(errors="replace"), n)
        validate(level)
        levels.append(level)
        print(f"L{n:02d}: {level['size']}x{level['size']} {len(level['stones'])} stones PASS")
    OUT.write_text(json.dumps(levels, indent=2) + "\n")
    print(f"Generated {len(levels)} validated levels -> {OUT}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
