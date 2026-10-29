
#!/usr/bin/env python3
"""
Hexa-Bridges structural verifier.

For each level:
  1. Anchors are valid cell keys
  2. Solution is a list of edges
  3. Each edge connects 2 valid cells in the grid
  4. Solution forms a single spanning tree (n-1 edges, no cycles, fully connected)
  5. Each anchor's tree-degree equals its clue value
  6. Non-anchor cells have tree-degree <= 2
"""
import json
import os
import sys

DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]

def cell_neighbors(q, r, Q, R):
    return [(nq, nr) for dq, dr in DIRS if 0 <= (nq := q + dq) < Q and 0 <= (nr := r + dr) < R]

def is_adjacent(a, b, Q, R):
    return (b[0], b[1]) in cell_neighbors(a[0], a[1], Q, R)

def check_level(lv):
    Q, R = lv["size"][0], lv["size"][1]
    anchors = lv["anchors"]
    sol = lv["solution"]
    
    # 1. Anchor keys valid
    for k in anchors:
        q, r = map(int, k.split(","))
        if not (0 <= q < Q and 0 <= r < R):
            return f"anchor key {k} out of bounds"
        if anchors[k] < 0 or anchors[k] > 6:
            return f"anchor {k} clue {anchors[k]} not in [0,6]"
    
    # 2. All anchor cells distinct
    if len(anchors) != len(set(anchors)):
        return "duplicate anchor cells"
    
    # 3. Solution is list of pairs of [q, r]
    seen_edges = set()
    n_cells = Q * R
    expected_edges = n_cells - 1  # tree
    if len(sol) != expected_edges:
        return f"expected {expected_edges} edges (n-1 for tree), got {len(sol)}"
    
    for i, edge in enumerate(sol):
        if len(edge) != 2:
            return f"edge {i}: not 2 cells"
        a, b = edge
        if not (isinstance(a, list) and isinstance(b, list) and len(a) == 2 and len(b) == 2):
            return f"edge {i}: malformed"
        if not (0 <= a[0] < Q and 0 <= a[1] < R):
            return f"edge {i}: cell A out of bounds"
        if not (0 <= b[0] < Q and 0 <= b[1] < R):
            return f"edge {i}: cell B out of bounds"
        if not is_adjacent(a, b, Q, R):
            return f"edge {i}: cells not adjacent"
        # Canonical edge
        s1 = f"{a[0]},{a[1]}"
        s2 = f"{b[0]},{b[1]}"
        key = s1 + "|" + s2 if s1 < s2 else s2 + "|" + s1
        if key in seen_edges:
            return f"edge {i}: duplicate edge"
        seen_edges.add(key)
    
    # 4. Check connectivity + tree (no cycles)
    parent = {}
    for q in range(Q):
        for r in range(R):
            parent[f"{q},{r}"] = f"{q},{r}"
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    deg = {}
    for edge in sol:
        a, b = edge
        ka = f"{a[0]},{a[1]}"
        kb = f"{b[0]},{b[1]}"
        ra, rb = find(ka), find(kb)
        if ra == rb:
            return "cycle detected in solution"
        parent[ra] = rb
        deg[ka] = deg.get(ka, 0) + 1
        deg[kb] = deg.get(kb, 0) + 1
    
    # Connected?
    roots = set()
    for q in range(Q):
        for r in range(R):
            roots.add(find(f"{q},{r}"))
    if len(roots) != 1:
        return f"not connected: {len(roots)} components"
    
    # 5. Anchor degrees match
    for k, clue in anchors.items():
        if deg.get(k, 0) != clue:
            return f"anchor {k} clue {clue} but tree degree {deg.get(k, 0)}"
    
    # 6. Non-anchor max degree 2
    for q in range(Q):
        for r in range(R):
            k = f"{q},{r}"
            if k not in anchors:
                if deg.get(k, 0) > 2:
                    return f"non-anchor {k} has degree {deg.get(k, 0)} > 2"
    
    return None

def main():
    # R338 — anchor the data path to THIS script's directory.
    # The old relative path ("hexa-bridges/levels.json") only resolved when the
    # script was run from the repo ROOT, so running it from its own directory —
    # the natural way to run it — died with FileNotFoundError. That is the
    # cwd-shadow verifier bug (Pitfall #50 / #55): a verifier must read its own
    # game's files regardless of cwd.
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "levels.json")) as f:
        data = json.load(f)
    levels = data["levels"]
    n_pass = 0
    n_fail = 0
    failures = []
    for i, lv in enumerate(levels):
        err = check_level(lv)
        if err is None:
            n_pass += 1
        else:
            n_fail += 1
            failures.append((i+1, err))
    
    print(f"verify_python: {n_pass}/{len(levels)} PASS")
    if failures:
        for lv, err in failures:
            print(f"  Level {lv}: {err}")
        sys.exit(1)
    if n_pass != len(levels):
        sys.exit(1)

if __name__ == "__main__":
    main()
