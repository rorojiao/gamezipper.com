#!/usr/bin/env python3
"""Set Quest (R1012) — level generator.

Mechanic: classic SET card-attribute matching (Cannei 1991).
A valid TRIPLE of cards: for EVERY attribute, the three cards are either all
the same value or all three different values.

Board construction (constructive, not rejection-sampled):
  1. pick a valid triple as the planted solution
  2. greedily add cards from the deck while the board still holds EXACTLY ONE
     valid triple
  => every level has exactly one solution, so "unique solution" is provable.

Tier ladder (5 tiers x 6 levels = 30):
  T1 Beginner : 3 attributes (shape/color/number),      9 cards
  T2 Easy     : 4 attributes (+shading),                 9 cards
  T3 Medium   : 4 attributes,                           12 cards
  T4 Hard     : 4 attributes,                           15 cards
  T5 Expert   : 4 attributes,                           18 cards

Attributes (3 values each):
  shape  0=circle 1=square 2=triangle
  color  0=red    1=green  2=purple
  number 0=one    1=two    2=three
  shade  0=solid  1=striped 2=outline   (4-attribute tiers only)

Output: levels.json  {levels:[{id,tier,features,cards,solution,par}]}
  cards  : list of attribute tuples (len 3 or 4)
  solution: 3 indices into cards forming the unique valid triple
"""
import itertools
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))

SHAPE = ('circle', 'square', 'triangle')
COLOR = ('red', 'green', 'purple')
NUMBER = ('one', 'two', 'three')
SHADE = ('solid', 'striped', 'outline')

FEATURES_3 = 3
FEATURES_4 = 4


def deck_size(nfeat):
    return 3 ** nfeat


def is_valid_triple(a, b, c, nfeat):
    for f in range(nfeat):
        vals = {a[f], b[f], c[f]}
        if len(vals) == 2:          # exactly two equal -> neither all-same nor all-different
            return False
    return True


def count_sets(cards, nfeat):
    n = 0
    for tri in itertools.combinations(cards, 3):
        if is_valid_triple(tri[0], tri[1], tri[2], nfeat):
            n += 1
    return n


def find_sets(cards, nfeat):
    return [tri for tri in itertools.combinations(cards, 3)
            if is_valid_triple(tri[0], tri[1], tri[2], nfeat)]


def all_cards(nfeat):
    """Every card of the deck as an attribute tuple."""
    out = []
    for idx in range(deck_size(nfeat)):
        v, card = idx, []
        for _ in range(nfeat):
            card.append(v % 3)
            v //= 3
        out.append(tuple(card))
    return out


def build_board(nfeat, board_n, rng, tries=4000):
    """Construct a board with EXACTLY ONE valid triple. Returns (cards, sol)."""
    deck = all_cards(nfeat)
    for _ in range(tries):
        base = rng.sample(deck, 3)
        if not is_valid_triple(base[0], base[1], base[2], nfeat):
            continue
        board = list(base)
        pool = [c for c in deck if c not in board]
        rng.shuffle(pool)
        for c in pool:
            if len(board) >= board_n:
                break
            if count_sets(board + [c], nfeat) == 1:
                board.append(c)
        if len(board) == board_n:
            sets = find_sets(board, nfeat)
            if len(sets) == 1:
                # Scatter the planted solution across the board.
                #
                # The constructive build above always puts the planted triple at
                # positions 0,1,2 (it IS board[0:3]) and appends the decoys
                # after it. The game renders `cards` in array order, so without
                # this shuffle the answer is ALWAYS the first three cards on
                # screen and the puzzle is trivial. A permutation of the board
                # cannot change which triples are valid (the property is
                # permutation-invariant), so uniqueness still holds; we only
                # recompute the solution indices.
                order = list(range(board_n))
                for _ in range(200):
                    rng.shuffle(order)
                    new_sol = sorted(order.index(board.index(x)) for x in sets[0])
                    # The solution must be SPREAD OUT, not clustered: require
                    # the first and last solution cards to be at least 4 slots
                    # apart so no card position alone reveals the answer.
                    if new_sol[-1] - new_sol[0] >= 4:
                        shuffled = [board[i] for i in order]
                        return shuffled, tuple(new_sol)
    return None, None


TIERS = [
    # tier name,    nfeat, board_n, par_seconds
    ('Beginner', FEATURES_3, 9, 45),
    ('Easy',     FEATURES_4, 9, 60),
    ('Medium',   FEATURES_4, 12, 90),
    ('Hard',     FEATURES_4, 15, 140),
    ('Expert',   FEATURES_4, 18, 200),
]


def main():
    rng = random.Random(20261029)
    levels = []
    lid = 0
    for tier, nfeat, board_n, par in TIERS:
        for _ in range(6):
            board, sol = build_board(nfeat, board_n, rng)
            if board is None:
                raise SystemExit(f'FAILED to construct board for tier {tier}')
            assert count_sets(board, nfeat) == 1, 'constructed board is not unique'
            lid += 1
            levels.append({
                'id': lid,
                'tier': tier,
                'features': nfeat,
                'cards': [list(c) for c in board],
                'solution': list(sol),
                'par': par,
            })

    out = {'game': 'set-quest', 'features': {
        'shape': list(SHAPE), 'color': list(COLOR),
        'number': list(NUMBER), 'shade': list(SHADE)},
        'levels': levels}
    path = os.path.join(HERE, 'levels.json')
    with open(path, 'w') as f:
        json.dump(out, f, indent=1)

    print(f'wrote {path}  levels={len(levels)}')
    from collections import Counter
    print('tier counts:', dict(Counter(l['tier'] for l in levels)))
    for t, nf, bn, _ in TIERS:
        ls = [l for l in levels if l['tier'] == t]
        ns = [count_sets([tuple(c) for c in l['cards']], nf) for l in ls]
        print(f'  {t:9s} features={nf} board={bn}  sets_per_level={ns}')
    # distinctness of boards
    keys = {tuple(map(tuple, l['cards'])) for l in levels}
    print(f'distinct boards: {len(keys)}/{len(levels)}')


if __name__ == '__main__':
    main()
