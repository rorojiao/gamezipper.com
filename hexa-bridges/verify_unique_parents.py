#!/usr/bin/env python3
"""
hexa-bridges: THIRD independent implementation of the uniqueness counter.

Formulations used (they share no code):
  verify_unique.py       : EDGE-SUBSET DFS (include/exclude over every candidate
                           edge) with a union-find cycle check.
  verify_unique_growth.py: TREE-GROWTH from a root, dedup on the canonical
                           sorted edge-set key (Pitfall #75's dedup lesson).
  THIS script            : PARENT-FUNCTION enumeration.

PARENT-FUNCTION METHOD
----------------------
Root the tree at cell 0.  Every other cell v has exactly ONE parent p(v) that
must be a grid neighbour of v.  A spanning tree corresponds bijectively to a
parent function, so enumerating parent functions enumerates each tree exactly
once — no growth-order duplicates at all, which is what makes the growth
variant blow up.

Pruning (the reason this finishes on 5x4 grids):
  * children(p) <= cap_children(p), where
        cap_children(p) = clue(p) - 1   for an anchor p != root   (its own
                                        parent edge already uses 1 degree)
        cap_children(p) = clue(p)       for an anchor p == root
        cap_children(p) = 1             for a NON-anchor p != root (degree <= 2)
        cap_children(p) = 2             for a non-anchor p == root
    An anchor with clue 1 therefore can never be anybody's parent -> it is a
    leaf.  That single rule prunes the search enormously.
  * the final graph must be connected (checked with a fresh union-find) and
    must satisfy the full rule, re-implemented independently below.

A verdict is only evidence when it agrees with the other implementations.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
NODE_BUDGET = 20_000_000


def load_levels():
    html = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
    m = re.search(r'window\.__LEVELS_DATA\s*=\s*(\{.*?\});\s*\n', html, re.S)
    return json.loads(m.group(1))['LEVELS']


def build(Q, R):
    cells = [(q, r) for q in range(Q) for r in range(R)]
    idx = {c: i for i, c in enumerate(cells)}
    nb = {i: [] for i in range(len(cells))}
    for i, (q, r) in enumerate(cells):
        for dq, dr in DIRS:
            nq, nr = q + dq, r + dr
            if (nq, nr) in idx:
                nb[i].append(idx[(nq, nr)])
    return cells, idx, nb


def rule_ok(edges, clue_of, V):
    """Full rule, re-implemented independently from hexa-bridges checkWin()."""
    deg = [0] * V
    for a, b in edges:
        deg[a] += 1
        deg[b] += 1
    for i, clue in clue_of.items():
        if deg[i] != clue:
            return False
    for i in range(V):
        if i not in clue_of and deg[i] > 2:
            return False
    if len(edges) != V - 1:
        return False
    par = list(range(V))

    def f(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x
    for a, b in edges:
        ra, rb = f(a), f(b)
        if ra == rb:
            return False
        par[ra] = rb
    return len({f(i) for i in range(V)}) == 1


def count_by_parents(clue_of, nb, V, limit=2):
    sols = []
    nodes = [0]
    budget_hit = [False]
    parent = [-1] * V
    children = [0] * V
    order = list(range(1, V))          # cell 0 is the root
    edges = []

    cap_children = {}
    for i in range(V):
        if i in clue_of:
            cap_children[i] = clue_of[i] if i == 0 else clue_of[i] - 1
        else:
            cap_children[i] = 2 if i == 0 else 1

    def rec(k):
        nodes[0] += 1
        if nodes[0] > NODE_BUDGET:
            budget_hit[0] = True
            return
        if k == len(order):
            # every non-root has a parent -> V-1 edges; check connectivity+rule
            if rule_ok(edges, clue_of, V):
                sols.append(tuple(sorted(edges)))
            return
        v = order[k]
        for p in nb[v]:
            if children[p] >= cap_children[p]:
                continue
            parent[v] = p
            children[p] += 1
            edges.append((v, p))
            rec(k + 1)
            edges.pop()
            children[p] -= 1
            parent[v] = -1
            if budget_hit[0] or len(sols) >= limit:
                return

    rec(0)
    if budget_hit[0] and len(sols) < limit:
        return len(sols), 'UNPROVEN', nodes[0]
    return len(sols), 'PROVEN', nodes[0]


def main():
    levels = load_levels()
    import importlib.util
    spec = importlib.util.spec_from_file_location('vu', os.path.join(HERE, 'verify_unique.py'))
    vu = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(vu)

    fails = []
    inconclusive = []
    print('%-4s %-9s %-7s %-12s %-12s %s' % ('L', 'tier', 'grid', 'parents', 'edgeDFS', 'verdict'))
    for lv in levels:
        Q, R = lv['Q'], lv['R']
        cells, idx, nb = build(Q, R)
        V = len(cells)
        clue_of = {}
        for k, v in lv['anchors'].items():
            q, r = k.split(',')
            clue_of[idx[(int(q), int(r))]] = v
        n_p, st_p, _ = count_by_parents(clue_of, nb, V)
        n_m, st_m, _ = vu.count_solutions(lv['anchors'], Q, R)
        if st_p == 'PROVEN' and st_m == 'PROVEN':
            ok = (n_p == n_m)
            verdict = 'OK' if ok else '<<< MISMATCH'
            if not ok:
                fails.append((lv['i'], n_p, st_p, n_m, st_m))
        else:
            ok = None
            verdict = 'inconclusive (%s vs %s)' % (st_p, st_m)
            inconclusive.append((lv['i'], n_p, st_p, n_m, st_m))
        print('L%-3d %-9s %d x %-3d %-12s %-12s %s'
              % (lv['i'], lv['tier'], Q, R,
                 '%d(%s)' % (n_p, st_p), '%d(%s)' % (n_m, st_m), verdict))
        sys.stdout.flush()
    print()
    print('proved & compared      : %d' % (len(levels) - len(inconclusive)))
    print('mismatches              : %d  %s' % (len(fails), fails))
    print('inconclusive (unproven) : %d  %s' % (len(inconclusive), inconclusive))
    if fails:
        print('VERDICT: FAIL (implementations disagree)')
        sys.exit(1)
    if inconclusive:
        print('VERDICT: INCONCLUSIVE (%d levels unproven by one implementation)' % len(inconclusive))
        sys.exit(3)
    print('VERDICT: PASS (parent-function enumeration and edge-subset DFS agree on all %d levels)'
          % len(levels))
    sys.exit(0)


if __name__ == '__main__':
    main()
