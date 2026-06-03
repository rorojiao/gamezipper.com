#!/usr/bin/env python3
"""Fix all known unsolvable levels using CORRECT encoding that matches the game.

Game convention:
- b[0] = visual BOTTOM of tube
- b[-1] = visual TOP of tube
- Encoded: j=0 position in encoded value → b[-1] (top), j=CAP-1 position → b[0] (bottom)
"""
import json
import random
import time
import re
from collections import Counter

CAP = 4

def is_win(bottles):
    """All non-empty tubes fully sorted (all same color)."""
    return all(len(b)==0 or (len(b)==4 and all(c==b[0] for c in b)) for b in bottles)

def state_key(bottles):
    non_empty = tuple(sorted(tuple(b) for b in bottles if b))
    empty = sum(1 for b in bottles if not b)
    return (non_empty, empty)

def solve_dfs(bottles, time_limit=5.0):
    """DFS using game convention: b[-1] = top, b[0] = bottom."""
    start = time.time()
    memo = {state_key(bottles)}
    def get_moves(b):
        complete, empty_src, partial, to_empty = [], [], [], []
        for s in range(len(b)):
            if not b[s]: continue
            fc = b[s][-1]  # TOP of source
            cnt = 0
            for i in range(len(b[s])-1, -1, -1):
                if b[s][i] == fc: cnt += 1
                else: break
            for d in range(len(b)):
                if s == d or len(b[d]) >= CAP: continue
                tc = b[d][-1] if b[d] else -1  # TOP of dest
                if tc != -1 and tc != fc: continue
                space = CAP - len(b[d])
                pc = min(cnt, space)
                if pc == 0: continue
                if tc != -1 and len(b[d]) + pc == CAP:
                    complete.append((s, d))
                elif len(b[s]) == pc:
                    (to_empty if tc == -1 else empty_src).append((s, d))
                elif tc == -1:
                    to_empty.append((s, d))
                else:
                    partial.append((s, d))
        return complete + empty_src + partial + to_empty
    def pour(b, s, d):
        fc = b[s][-1]
        cnt = 0
        for i in range(len(b[s])-1, -1, -1):
            if b[s][i] == fc: cnt += 1
            else: break
        pc = min(cnt, CAP - len(b[d]))
        nb = [list(bottle) for bottle in b]
        for _ in range(pc):
            nb[s].pop()
            nb[d].append(fc)
        return nb
    stack = [bottles]
    while stack:
        current = stack.pop()
        if is_win(current): return True
        if time.time() - start > time_limit: return False
        for s, d in get_moves(current):
            nb = pour(current, s, d)
            key = state_key(nb)
            if key not in memo:
                memo.add(key)
                stack.append(nb)
    return False

def make_random_state(n_colors, n_empty, rng):
    """b[0]=bottom, b[-1]=top (game convention)."""
    colors = []
    for c in range(n_colors):
        colors.extend([c] * CAP)
    rng.shuffle(colors)
    bottles = []
    idx = 0
    total = n_colors + n_empty
    for b in range(total):
        bottle = []
        for _ in range(CAP):
            if idx < len(colors):
                bottle.append(colors[idx])
                idx += 1
        bottles.append(bottle)
    return bottles

def generate_good_level(n_colors, n_empty, seed):
    rng = random.Random(seed)
    for attempt in range(80):
        state = make_random_state(n_colors, n_empty, rng)
        if is_win(state) or all(len(t) == CAP for t in state):
            continue
        if solve_dfs(state, time_limit=3.0):
            return state
    return None

def encode_state(state, n_colors):
    """Encode matching game's decodeLevel.
    j=0 in encoded value → b[-1] (top), j=CAP-1 → b[0] (bottom).
    """
    encoded = [n_colors]
    for t in state:
        v = 0
        for j in range(CAP):
            # j=0 should be t[-1] (top)
            src_idx = CAP - 1 - j
            c = (t[src_idx] + 1) if src_idx < len(t) else 0
            v += c * (30 ** j)
        encoded.append(v)
    return encoded

def decode(encoded):
    """Mirror game's decodeLevel."""
    n = encoded[0]
    b = []
    for i in range(1, len(encoded)):
        t = []
        v = encoded[i]
        for j in range(CAP):
            c = v % 30
            if c > 0: t.insert(0, c - 1)
            v = v // 30
        b.append(t)
    while len(b) < n + 2: b.append([])
    return n, b

# === Test round-trip ===
print("=== Round-trip test ===")
test = [[9, 6, 9, 12], [12, 2, 2, 10]]  # t[0]=bottom, t[-1]=top
print(f"Test state: {test}")
enc = encode_state(test, 15)
print(f"Encoded: {enc[:3]}")
n, dec = decode(enc)
print(f"Decoded: {dec}")
print(f"Round-trip OK: {dec == test}")

# === Generate and apply ===
html_path = "/home/msdn/gamezipper.com/magic-sort/index.html"
with open(html_path) as f:
    content = f.read()
m = re.search(r'const _LD=(\[[\s\S]*?\]);', content)
_LD = eval(m.group(1))
print(f"\nTotal levels: {len(_LD)}")

# Get all known unsolvable level numbers
ALL_TARGETS = []
for fname in ["/tmp/unsolvable_2050_3000_uniq.txt", "/tmp/unsolvable_pre_apex.txt"]:
    try:
        with open(fname) as f:
            for line in f:
                line = line.strip()
                if line: ALL_TARGETS.append(int(line))
    except FileNotFoundError:
        pass
for lv in [1669, 1693, 1781, 1816, 1837]:
    if lv not in ALL_TARGETS: ALL_TARGETS.append(lv)
ALL_TARGETS = sorted(set(ALL_TARGETS))
print(f"Targets: {len(ALL_TARGETS)}")

# Generate replacements
replacements = {}
seen = set()
failures = []
t0 = time.time()
for level_num in ALL_TARGETS:
    n_colors = _LD[level_num - 1][0]
    state = generate_good_level(n_colors, 2, seed=level_num)
    if state is None:
        failures.append(level_num)
        continue
    key = state_key(state)
    if key in seen:
        for offset in [1, 7, 13, 100, 1000, 9999, 12345, 77777]:
            state2 = generate_good_level(n_colors, 2, seed=level_num + offset)
            if state2 and state_key(state2) not in seen:
                state = state2
                key = state_key(state2)
                break
        else:
            failures.append(level_num)
            continue
    seen.add(key)
    encoded = encode_state(state, n_colors)
    replacements[level_num] = encoded
print(f"\nGenerated {len(replacements)}/{len(ALL_TARGETS)} in {time.time()-t0:.0f}s")
print(f"Failures: {failures}")

# Apply
patched = content
applied = 0
for level_num, new_encoded in replacements.items():
    idx = level_num - 1
    old_lv = _LD[idx]
    old_text = '[' + ','.join(str(x) for x in old_lv) + ']'
    new_text = '[' + ','.join(str(x) for x in new_encoded) + ']'
    count = patched.count(old_text)
    if count == 0:
        for variant in [old_text + ',', ',' + old_text]:
            c = patched.count(variant)
            if c > 0:
                old_text = variant
                count = c
                break
    if count == 0:
        continue
    if old_text.endswith(','):
        new_text = new_text + ','
    elif old_text.startswith(','):
        new_text = ',' + new_text
    patched = patched.replace(old_text, new_text, 1)
    applied += 1
print(f"Applied {applied}")

m2 = re.search(r'const _LD=(\[[\s\S]*?\]);', patched)
new_LD = eval(m2.group(1))
print(f"New _LD length: {len(new_LD)}")
seen2 = {}
dups2 = []
for i, lv in enumerate(new_LD):
    k = json.dumps(lv)
    if k in seen2: dups2.append((seen2[k], i))
    else: seen2[k] = i
print(f"Duplicates: {len(dups2)}")

if patched != content:
    with open(html_path, 'w') as f:
        f.write(patched)
    print(f"✅ Wrote {len(patched)} bytes (delta {len(patched)-len(content):+d})")
