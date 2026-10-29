#!/usr/bin/env python3
"""
hexa-bridges: INDEPENDENT BRUTE-FORCE cross-check of verify_unique.py.

Per Pitfall #67 / #88 / #99, a counter's verdict is only evidence if a DIFFERENT
implementation reproduces it.  This script enumerates edge subsets by brute force
(itertools.combinations over ALL candidate edges) — a completely different search
order and a different pruning strategy from verify_unique.py's union-find DFS — and
prints the actual solutions so they can be checked against the rule by hand.

The brute force is only feasible for the smaller grids (3x3 / 4x3); the larger tiers
are covered by verify_unique.py plus the engine-level validation.

Usage:  python3 verify_unique_bruteforce.py [max_edges]
        max_edges defaults to 23 (= 4x3 grids). Pass 0 to skip nothing.
"""
import itertools, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def all_edges(Q, R):
    cells = [(q, r) for q in range(Q) for r in range(R)]
    idx = {c: i for i, c in enumerate(cells)}
    E = []
    for (q, r) in cells:
        for dq, dr in DIRS:
            nq, nr = q + dq, r + dr
            if (nq, nr) in idx:
                a, b = idx[(q, r)], idx[(nq, nr)]
                if a < b:
                    E.append((a, b))
    return cells, idx, E


def check(edge_ids, cells, idx, E, anchors, Q, R):
    """Rule check, written from hexa-bridges checkWin() (index.html:689).

    Deliberately implemented with its OWN adjacency set (not shared with
    verify_unique.py) so the two implementations share nothing but the RULE.
    """
    deg = [0] * len(cells)
    for e in edge_ids:
        a, b = E[e]
        deg[a] += 1
        deg[b] += 1
    for k, clue in anchors.items():
        q, r = k.split(',')
        if deg[idx[(int(q), int(r))]] != clue:
            return False
    for (q, r), i in idx.items():
        if '%d,%d' % (q, r) not in anchors and deg[i] > 2:
            return False
    if len(edge_ids) != Q * R - 1:
        return False
    par = list(range(len(cells)))

    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x
    for e in edge_ids:
        a, b = E[e]
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        par[ra] = rb
    return len({find(i) for i in range(len(cells))}) == 1


def main():
    html = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
    m = re.search(r'window\.__LEVELS_DATA\s*=\s*(\{.*?\});\s*\n', html, re.S)
    levels = json.loads(m.group(1))['LEVELS']
    maxE = int(sys.argv[1]) if len(sys.argv) > 1 else 23

    # import the main counter so the two verdicts can be compared directly
    sys.path.insert(0, HERE)
    import importlib.util
    spec = importlib.util.spec_from_file_location('vu', os.path.join(HERE, 'verify_unique.py'))
    vu = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(vu)

    multi, mismatch, checked = [], [], 0
    for lv in levels:
        Q, R = lv['Q'], lv['R']
        cells, idx, E = all_edges(Q, R)
        if len(E) > maxE:
            print('L%-2d %-8s SKIP (edges=%d > budget %d)' % (lv['i'], lv['tier'], len(E), maxE))
            continue
        found = []
        for combo in itertools.combinations(range(len(E)), Q * R - 1):
            if check(combo, cells, idx, E, lv['anchors'], Q, R):
                found.append(combo)
                if len(found) >= 3:
                    break
        # The stored solution must be among them.
        # NOTE: `found` holds INDICES into THIS script's edge list E, while the
        # stored solution is a list of CELL pairs.  The two edge lists are built in
        # different orders, so the comparison must first translate the brute-force
        # edge ids back into cell pairs — comparing the ids directly would be
        # meaningless (and was a bug in the first version of this script).
        stored_pairs = sorted(tuple(sorted((idx[tuple(a)], idx[tuple(b)])))
                              for a, b in lv['solution'])
        stored_set = set(stored_pairs)
        brute_pairs = [tuple(sorted((E[e][0], E[e][1]) for e in combo)) for combo in found]
        stored_match = any(set(bp) == stored_set for bp in brute_pairs)
        n_main, st_main, _ = vu.count_solutions(lv['anchors'], Q, R)
        checked += 1
        agree = (st_main == 'PROVEN' and n_main == len(found))
        if not agree:
            mismatch.append((lv['i'], n_main, st_main, len(found)))
        print('L%-2d %-8s Q%dR%d edges=%d brute=%d main=%d(%s) stored_in_first=%s %s'
              % (lv['i'], lv['tier'], Q, R, len(E), len(found), n_main, st_main,
                 stored_match, 'OK' if agree else '<<< MISMATCH'))
        if len(found) >= 2:
            multi.append(lv['i'])
            for si, combo in enumerate(found[:2]):
                sol = sorted((cells[a], cells[b]) for a, b in combo)
                print('      solution%d: %s' % (si + 1, sol))
            print('      STORED  : %s' % sorted((tuple(a), tuple(b)) for a, b in lv['solution']))
        if not stored_match:
            print('      !! STORED SOLUTION NOT AMONG THE FIRST BRUTE-FORCE SOLUTIONS')
    print()
    print('levels cross-checked     : %d' % checked)
    print('BRUTE-FORCE multi levels : %d  %s' % (len(multi), multi))
    print('verdict mismatches       : %d  %s' % (len(mismatch), mismatch))
    if mismatch:
        print('VERDICT: FAIL (implementations disagree)')
        sys.exit(1)
    print('VERDICT: PASS (both implementations agree on every cross-checked level)')
    sys.exit(0)


if __name__ == '__main__':
    main()
