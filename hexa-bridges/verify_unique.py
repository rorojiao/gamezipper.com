#!/usr/bin/env python3
"""
hexa-bridges independent solution counter (R339, 2026-10-29).

CLAIM UNDER TEST: the page advertises "30 unique-solution levels" (meta description,
og:description, JSON-LD description, FAQ).  Pitfall #99 / #86: a uniqueness CLAIM is
only meaningful if the win predicate is rule-based (it is) AND the catalog really
admits exactly one solution.  If a level admits >=2 valid solutions the COPY is wrong
(P1 copy drift) even though gameplay itself is fine.

RULE, re-implemented FROM THE ENGINE SOURCE (not from the level key names):
  hexa-bridges/index.html
    DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]]     (line 303)
    cellNeighbors(q,r,Q,R) -> in-grid neighbours          (line 308)
    checkWin()                                            (line 689)
      1. every anchor cell's degree == its clue value
      2. every NON-anchor cell's degree <= 2
      3. bridges.size === Q*R - 1        (V-1 edges)
      4. the edge set is connected and acyclic (a spanning tree)
  => a solution is a SPANNING TREE of the hex-grid graph in which every anchor has its
     exact clue degree and every other cell has degree <= 2.

ALGORITHM (chosen deliberately): enumerate edge SUBSETS by an include/exclude DFS over
a FIXED global edge order.  Each subset is therefore visited EXACTLY ONCE.
  - the earlier tree-GROWTH formulation visited the same tree once per growth order,
    which over-counted (Pitfall #75's "dedup key must be order-independent" trap);
  - because an ACYCLIC edge set with V-1 edges on V vertices has exactly one connected
    component, acyclicity + the edge count IMPLY connectivity, so no separate
    connectivity search is needed.
Prunes:
  - anchor degree overflow  (deg > clue) and underflow (deg + undecided < clue)
  - non-anchor degree > 2 and underflow (deg + undecided < 1)
  - cycle prevention via union-find (an edge inside one component is rejected)
  - global degree-sum feasibility for the non-anchor cells
  - the edge budget (exactly V-1 edges)

Every emitted solution is RE-VALIDATED by an independent validator written from the
rule text; the STORED solution is checked with the same validator.

CONTROLS (mandatory, per Pitfall #67/#70/#86/#99):
  (a) POSITIVE   - the STORED solution must be accepted by the validator.
  (b) NEGATIVE   - relaxing the anchor-degree rule must not DECREASE the count.
  (c) SENSITIVITY- dropping ALL anchors must make the level multi-solution.
  (d) TIMEOUT    - a level not proven within the budget is reported UNPROVEN, never 0.
"""

import json, re, sys, os, time

HERE = os.path.dirname(os.path.abspath(__file__))
IDX = os.path.join(HERE, 'index.html')
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
NODE_BUDGET = 8_000_000


def build(Q, R):
    idx, cells = {}, []
    for q in range(Q):
        for r in range(R):
            idx[(q, r)] = len(cells)
            cells.append((q, r))
    adj = {i: set() for i in range(len(cells))}
    for (q, r), i in idx.items():
        for dq, dr in DIRS:
            nq, nr = q + dq, r + dr
            if 0 <= nq < Q and 0 <= nr < R:
                j = idx[(nq, nr)]
                if j != i:
                    adj[i].add(j)
                    adj[j].add(i)
    return idx, cells, adj


def all_edges(Q, R):
    """Fixed global edge list (index order = deterministic DFS order)."""
    idx, cells, adj = build(Q, R)
    E = []
    for i in range(len(cells)):
        for j in sorted(adj[i]):
            if i < j:
                E.append((i, j))
    return idx, cells, adj, E


def validate(edges, anchors, idx, cells, adj, enforce_anchor=True):
    """Independent validator, written from the RULE TEXT (not from the engine code)."""
    V = len(cells)
    deg = {i: 0 for i in range(V)}
    for a, b in edges:
        ia, ib = idx[a], idx[b]
        if ia == ib or ib not in adj[ia]:
            return False, 'edge %s-%s not adjacent' % (a, b)
        deg[ia] += 1
        deg[ib] += 1
    if enforce_anchor:
        for k, clue in anchors.items():
            q, r = k.split(',')
            i = idx[(int(q), int(r))]
            if deg[i] != clue:
                return False, 'anchor %s degree %d != clue %d' % (k, deg[i], clue)
    for (q, r), i in idx.items():
        if '%d,%d' % (q, r) not in anchors and deg[i] > 2:
            return False, 'non-anchor %d,%d degree %d > 2' % (q, r, deg[i])
    if len(edges) != V - 1:
        return False, 'edge count %d != V-1' % len(edges)
    par = list(range(V))

    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x
    for a, b in edges:
        ra, rb = find(idx[a]), find(idx[b])
        if ra == rb:
            return False, 'cycle'
        par[ra] = rb
    if len({find(i) for i in range(V)}) != 1:
        return False, 'not connected'
    return True, 'ok'


def count_solutions(anchors, Q, R, enforce_anchor=True, limit=2):
    """Returns (count, status, nodes) with status in {PROVEN, UNPROVEN}."""
    idx, cells, adj, E = all_edges(Q, R)
    V = len(cells)
    need_total = V - 1
    anchor_of = {}
    for k, v in anchors.items():
        q, r = k.split(',')
        anchor_of[idx[(int(q), int(r))]] = v

    # vertex -> list of incident edge indices
    inc = {i: [] for i in range(V)}
    for ei, (a, b) in enumerate(E):
        inc[a].append(ei)
        inc[b].append(ei)

    # per-vertex max degree
    if enforce_anchor:
        cap = {i: (anchor_of[i] if i in anchor_of else 2) for i in range(V)}
    else:
        # relaxed: an anchor's degree is FREE (bounded only by its grid degree),
        # so the cap is the number of neighbours it actually has.
        cap = {i: (len(adj[i]) if i in anchor_of else 2) for i in range(V)}
    # for the relaxed control the anchor-degree RULE is dropped from validation too
    is_anchor = set(anchor_of)

    # ---- global degree-sum feasibility (non-anchor cells) -------------------
    # Only valid when the anchor degrees are PINNED: then the non-anchor degree
    # sum is forced to 2*(V-1) - sum(clues), and every non-anchor needs >= 1 and
    # <= 2.  In relaxed mode the anchor degrees are free, so this bound does not
    # apply and must NOT be enforced (it would wrongly report 0).
    if enforce_anchor:
        M = sum(1 for i in range(V) if i not in is_anchor)
        S = 2 * need_total - sum(anchor_of.values())
        if S < M or S > 2 * M:
            return 0, 'PROVEN', 0    # provably impossible

    deg = {i: 0 for i in range(V)}
    rem_inc = {i: len(inc[i]) for i in range(V)}
    par = list(range(V))

    def find(x):
        # NO path compression: the parent pointers are rolled back on backtracking,
        # so `find` must not mutate `par` behind the rollback stack's back.
        while par[x] != x:
            x = par[x]
        return x

    sols = []
    nodes = [0]
    timed_out = [False]
    sel = []
    unions = []

    # order edges so that the most constrained vertices are decided first:
    # edges incident to an anchor with a HIGH clue come first (their degree is
    # exactly pinned, so deciding them early prunes hardest).
    order = sorted(range(len(E)), key=lambda ei: (
        -max(anchor_of.get(E[ei][0], 0), anchor_of.get(E[ei][1], 0)),
        ei))

    def rec(k, chosen):
        nodes[0] += 1
        if nodes[0] > NODE_BUDGET:
            timed_out[0] = True
            return
        if chosen == need_total:
            ekeys = [(cells[a], cells[b]) for a, b in sel]
            ok, _ = validate(ekeys, anchors, idx, cells, adj, enforce_anchor=enforce_anchor)
            if ok:
                sols.append(tuple(sorted((tuple(a), tuple(b)) for a, b in ekeys)))
            return
        if k == len(order):
            return
        remaining_slots = need_total - chosen
        if len(order) - k < remaining_slots:
            return                       # not enough edges left

        ei = order[k]
        a, b = E[ei]

        # ---------- EXCLUDE ei ----------
        rem_inc[a] -= 1
        rem_inc[b] -= 1
        # feasibility: a vertex whose degree can no longer reach its requirement
        bad = False
        for v in (a, b):
            if deg[v] > cap[v]:
                bad = True
            if v in is_anchor:
                if enforce_anchor and deg[v] + rem_inc[v] < anchor_of[v]:
                    bad = True
            else:
                if deg[v] + rem_inc[v] < 1:
                    bad = True
        if not bad:
            rec(k + 1, chosen)
        rem_inc[a] += 1
        rem_inc[b] += 1
        if timed_out[0] or len(sols) >= limit:
            return

        # ---------- INCLUDE ei ----------
        ra, rb = find(a), find(b)
        if ra != rb and deg[a] < cap[a] and deg[b] < cap[b]:
            par[ra] = rb
            unions.append((ra, rb))
            deg[a] += 1
            deg[b] += 1
            sel.append((a, b))
            rem_inc[a] -= 1
            rem_inc[b] -= 1
            rec(k + 1, chosen + 1)
            sel.pop()
            rem_inc[a] += 1
            rem_inc[b] += 1
            deg[a] -= 1
            deg[b] -= 1
            # ROLLBACK the union (LIFO: deeper unions were already undone)
            ur, _ = unions.pop()
            par[ur] = ur

    rec(0, 0)
    if timed_out[0] and len(sols) < limit:
        return len(sols), 'UNPROVEN', nodes[0]
    return len(sols), 'PROVEN', nodes[0]


def load_levels():
    html = open(IDX, encoding='utf-8').read()
    m = re.search(r'window\.__LEVELS_DATA\s*=\s*(\{.*?\});\s*\n', html, re.S)
    if not m:
        raise SystemExit('could not locate window.__LEVELS_DATA')
    return json.loads(m.group(1))['LEVELS']


def main():
    levels = load_levels()
    print('levels extracted: %d' % len(levels))
    fails, unproven, multis = [], [], []
    for lv in levels:
        i, Q, R = lv['i'], lv['Q'], lv['R']
        anchors = lv['anchors']
        stored = [tuple(map(tuple, e)) for e in lv['solution']]
        idx, cells, adj = build(Q, R)
        ok, why = validate(stored, anchors, idx, cells, adj)
        if not ok:
            fails.append('L%d stored solution INVALID: %s' % (i, why))
            print('L%-2d %-8s stored solution INVALID -> %s' % (i, lv['tier'], why))
            continue
        t0 = time.time()
        n, st, nodes = count_solutions(anchors, Q, R)
        # (b) NEGATIVE control: relaxing the anchor-degree rule must not DECREASE
        #     the count.  If the relaxed run is UNPROVEN (budget exhausted) the
        #     comparison is INCONCLUSIVE and must NOT be reported as a failure —
        #     an unproven count is not a zero count (Pitfall #70).
        nrelax, strel, _ = count_solutions(anchors, Q, R, enforce_anchor=False)
        if strel == 'PROVEN' and nrelax < n:
            fails.append('L%d relaxed(%d) < constrained(%d) -> tool bug' % (i, nrelax, n))
        # (c) SENSITIVITY control: dropping ALL anchors must make the level
        # multi-solution. If a "uniqueness" counter cannot go multi when the
        # constraints are removed, the counter cannot detect anything.
        nsens, _s, _ = count_solutions({}, Q, R, enforce_anchor=False)
        sens_ok = nsens >= 2
        if not sens_ok:
            fails.append('L%d sensitivity control FAILED (no-anchor count=%d, expected >=2)'
                         % (i, nsens))
        dt = time.time() - t0
        if st == 'UNPROVEN':
            unproven.append(i)
            print('L%-2d %-8s UNPROVEN (nodes=%d, %.1fs)' % (i, lv['tier'], nodes, dt))
            continue
        flag = '   <<< MULTI-SOLUTION' if n >= 2 else ''
        if n >= 2:
            multis.append(i)
        print('L%-2d %-8s Q%dR%d solutions=%d (%s) relaxed=%d noanchor=%d nodes=%d %.1fs%s'
              % (i, lv['tier'], Q, R, n, st, nrelax, nsens, nodes, dt, flag))

    print()
    print('=' * 74)
    print('stored-solution failures : %d  %s' % (len(fails), fails if fails else ''))
    print('unproven levels          : %d  %s' % (len(unproven), unproven))
    print('MULTI-SOLUTION levels    : %d  %s' % (len(multis), multis))
    if fails:
        print('VERDICT: FAIL (tool or data error)')
        sys.exit(1)
    if unproven:
        print('VERDICT: FAIL (unproven levels are not PASS)')
        sys.exit(1)
    if multis:
        print('VERDICT: FAIL (page claims unique solutions, %d levels are multi)' % len(multis))
        sys.exit(1)
    print('VERDICT: PASS (all %d levels have exactly one solution)' % len(levels))
    sys.exit(0)


if __name__ == '__main__':
    main()
