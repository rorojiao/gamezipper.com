#!/usr/bin/env python3
"""Exact Kin-Kon-Kan uniqueness verifier.

Models one mirror (position + orientation) per room and symbolically traces every
beam.  Domains are narrowed as each beam crosses a cell, avoiding brute-force
enumeration of the full Cartesian product.  A level is UNIQUE only when exactly
one complete placement satisfies all beam exits/counts and every mirror is hit.
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

SIDES = {"N": (1, 0), "S": (-1, 0), "W": (0, 1), "E": (0, -1)}


def reflect(mirror: str, dr: int, dc: int) -> tuple[int, int]:
    return (-dc, -dr) if mirror == "/" else (dc, dr)


def exit_slot(rows: int, cols: int, r: int, c: int, dr: int, dc: int):
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        return None
    if dr == -1:
        return "N", c
    if dr == 1:
        return "S", c
    if dc == -1:
        return "W", r
    return "E", r


class Solver:
    def __init__(self, level: dict):
        self.level = level
        self.rows = level["rows"]
        self.cols = level["cols"]
        room_cells: dict[int, list[tuple[int, int]]] = defaultdict(list)
        for r, row in enumerate(level["rooms"]):
            for c, rid in enumerate(row):
                room_cells[rid].append((r, c))
        self.room_ids = sorted(room_cells)
        self.room_index = {rid: i for i, rid in enumerate(self.room_ids)}
        self.cell_room = [[self.room_index[level["rooms"][r][c]] for c in range(self.cols)] for r in range(self.rows)]
        self.choices: list[list[tuple[int, int, str]]] = []
        self.choice_bits: list[dict[tuple[int, int, str], int]] = []
        self.cell_masks: list[dict[tuple[int, int], tuple[int, int, int]]] = []
        for rid in self.room_ids:
            choices = [(r, c, m) for r, c in room_cells[rid] for m in ("/", "\\")]
            self.choices.append(choices)
            bits = {ch: 1 << i for i, ch in enumerate(choices)}
            self.choice_bits.append(bits)
            by_cell = {}
            all_mask = (1 << len(choices)) - 1
            for r, c in room_cells[rid]:
                slash = bits[(r, c, "/")]
                back = bits[(r, c, "\\")]
                by_cell[(r, c)] = (all_mask ^ (slash | back), slash, back)
            self.cell_masks.append(by_cell)
        self.initial = tuple((1 << len(ch)) - 1 for ch in self.choices)
        self.beams = sorted(level["beams"], key=lambda b: (-b["count"], b["letter"]))
        self.nodes = 0
        self._prop_cache = {}

    def trace_symbolic(self, domains: tuple[int, ...], beam: dict) -> list[tuple[int, ...]]:
        side, pos = beam["enter"]["side"], beam["enter"]["pos"]
        if side == "N":
            start = (0, pos)
        elif side == "S":
            start = (self.rows - 1, pos)
        elif side == "W":
            start = (pos, 0)
        else:
            start = (pos, self.cols - 1)
        dr, dc = SIDES[side]
        expected = (beam["exit"]["side"], beam["exit"]["pos"])
        target_count = beam["count"]
        out = set()
        seen = set()

        def walk(r: int, c: int, dr: int, dc: int, count: int, dom: tuple[int, ...], steps: int):
            self.nodes += 1
            if count > target_count or steps > self.rows * self.cols * 4:
                return
            key = (r, c, dr, dc, count, dom)
            if key in seen:
                return
            seen.add(key)
            ri = self.cell_room[r][c]
            no_mask, slash_mask, back_mask = self.cell_masks[ri][(r, c)]
            groups = ((no_mask, None), (slash_mask, "/"), (back_mask, "\\"))
            for group_mask, mirror in groups:
                narrowed = dom[ri] & group_mask
                if not narrowed:
                    continue
                ndom = dom
                if narrowed != dom[ri]:
                    tmp = list(dom)
                    tmp[ri] = narrowed
                    ndom = tuple(tmp)
                ndr, ndc, ncount = dr, dc, count
                if mirror:
                    ndr, ndc = reflect(mirror, dr, dc)
                    ncount += 1
                    if ncount > target_count:
                        continue
                ex = exit_slot(self.rows, self.cols, r, c, ndr, ndc)
                if ex:
                    if ex == expected and ncount == target_count:
                        out.add(ndom)
                    continue
                walk(r + ndr, c + ndc, ndr, ndc, ncount, ndom, steps + 1)

        walk(start[0], start[1], dr, dc, 0, domains, 0)
        return list(out)

    def propagate(self, domains: tuple[int, ...]) -> list[tuple[int, ...]]:
        cache_key = domains
        if cache_key in self._prop_cache:
            return self._prop_cache[cache_key]
        states = {domains}
        for beam in self.beams:
            nxt = set()
            for state in states:
                nxt.update(self.trace_symbolic(state, beam))
            states = nxt
            if not states:
                break
        result = list(states)
        self._prop_cache[cache_key] = result
        return result

    def placement_from_singletons(self, domains: tuple[int, ...]):
        mirrors = [["" for _ in range(self.cols)] for _ in range(self.rows)]
        for ri, mask in enumerate(domains):
            if mask == 0 or mask & (mask - 1):
                return None
            idx = mask.bit_length() - 1
            r, c, m = self.choices[ri][idx]
            mirrors[r][c] = m
        return mirrors

    def verify_complete(self, domains: tuple[int, ...]) -> bool:
        mirrors = self.placement_from_singletons(domains)
        if mirrors is None:
            return False
        hit = set()
        for beam in self.level["beams"]:
            side, pos = beam["enter"]["side"], beam["enter"]["pos"]
            if side == "N": r, c = 0, pos
            elif side == "S": r, c = self.rows - 1, pos
            elif side == "W": r, c = pos, 0
            else: r, c = pos, self.cols - 1
            dr, dc = SIDES[side]
            count = 0
            seen = set()
            for _ in range(self.rows * self.cols * 4 + 1):
                state = (r, c, dr, dc)
                if state in seen:
                    return False
                seen.add(state)
                m = mirrors[r][c]
                if m:
                    hit.add((r, c))
                    dr, dc = reflect(m, dr, dc)
                    count += 1
                ex = exit_slot(self.rows, self.cols, r, c, dr, dc)
                if ex:
                    if ex != (beam["exit"]["side"], beam["exit"]["pos"]) or count != beam["count"]:
                        return False
                    break
                r, c = r + dr, c + dc
            else:
                return False
        mirror_cells = {(r, c) for r in range(self.rows) for c in range(self.cols) if mirrors[r][c]}
        return hit == mirror_cells

    def solve(self, limit: int = 2) -> list[tuple[int, ...]]:
        solutions: list[tuple[int, ...]] = []
        visited = set()

        def dfs(domains: tuple[int, ...]):
            if len(solutions) >= limit or domains in visited:
                return
            visited.add(domains)
            for state in self.propagate(domains):
                if len(solutions) >= limit:
                    return
                if all(mask and not (mask & (mask - 1)) for mask in state):
                    if self.verify_complete(state) and state not in solutions:
                        solutions.append(state)
                    continue
                # Minimum remaining values, then split one room choice at a time.
                ri = min((i for i, m in enumerate(state) if m & (m - 1)), key=lambda i: state[i].bit_count())
                mask = state[ri]
                while mask and len(solutions) < limit:
                    bit = mask & -mask
                    mask ^= bit
                    child = list(state)
                    child[ri] = bit
                    dfs(tuple(child))
        dfs(self.initial)
        return solutions


def main():
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "levels.json")
    levels = json.loads(path.read_text())
    unique = 0
    for i, level in enumerate(levels, 1):
        solver = Solver(level)
        sols = solver.solve(2)
        same = False
        if sols:
            expected = tuple(
                solver.choice_bits[ri][next((r, c, m) for r, row in enumerate(level["mirrors"]) for c, m in enumerate(row) if m and solver.cell_room[r][c] == ri)]
                for ri in range(len(solver.room_ids))
            )
            same = sols[0] == expected
        verdict = "UNIQUE" if len(sols) == 1 and same else ("MULTIPLE" if len(sols) > 1 else "INVALID")
        print(f"L{i:02d}: {verdict} solutions={len(sols)} expected={same} nodes={solver.nodes}")
        unique += verdict == "UNIQUE"
    print(f"SUMMARY: {unique}/{len(levels)} UNIQUE")
    return 0 if unique == len(levels) else 1


if __name__ == "__main__":
    raise SystemExit(main())
