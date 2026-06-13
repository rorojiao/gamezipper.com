"""
Generate + Inject 5000 new levels for Magic Sort: 40001-45000.
Based on generate_and_inject_40k.py pattern.
Uses new seed range 90000000+ to avoid collisions.
"""
import random
import sys
import os
import time
import json
import re
from collections import deque

CAP = 4
BASE = 30
INDEX_HTML = "/home/msdn/gamezipper.com/magic-sort/index.html"
START_LEVEL = 40001  # current _LD.length = 40000
TARGET_LEVEL = 45000
LEVELS_TO_GEN = TARGET_LEVEL - 40000  # 5000

def is_solved(bottles):
    for b in bottles:
        if len(b) == 0: continue
        if len(b) != CAP or len(set(b)) != 1: return False
    return True

def generate_random_state(num_colors, seed, extra_tubes=3):
    rng = random.Random(seed)
    pool = []
    for c in range(num_colors):
        pool.extend([c] * CAP)
    rng.shuffle(pool)
    tubes = [pool[i*CAP:(i+1)*CAP] for i in range(num_colors)]
    for _ in range(extra_tubes):
        tubes.append([])
    return tubes

def quick_solve_check(bottles, max_iters=5000):
    if is_solved(bottles):
        return False
    initial_key = tuple(tuple(b) for b in bottles)
    visited = {initial_key}
    queue = deque([bottles])
    while queue and len(visited) < max_iters:
        state = queue.popleft()
        n = len(state)
        for i in range(n):
            if not state[i]: continue
            top = state[i][-1]
            pc = 0
            for j in range(len(state[i])-1, -1, -1):
                if state[i][j] == top: pc += 1
                else: break
            is_complete = (pc == len(state[i]) and len(set(state[i])) == 1)
            for j in range(n):
                if i == j: continue
                if not state[j]:
                    if is_complete: continue
                    amt = min(pc, CAP - len(state[j]))
                elif state[j][-1] == top and len(state[j]) < CAP:
                    amt = min(pc, CAP - len(state[j]))
                else:
                    continue
                if amt <= 0: continue
                new_state = [list(b) for b in state]
                moved = new_state[i][-amt:]
                del new_state[i][-amt:]
                new_state[j].extend(moved)
                key = tuple(tuple(b) for b in new_state)
                if key in visited: continue
                visited.add(key)
                if is_solved(new_state):
                    return True
                queue.append(new_state)
    return len(visited) >= max_iters

def generate_level_fast(num_colors, seed, extra_tubes=3):
    for attempt in range(3):
        s = seed * 100 + attempt
        state = generate_random_state(num_colors, s, extra_tubes)
        if is_solved(state): continue
        pre_solved = sum(1 for b in state if len(b) == CAP and len(set(b)) == 1)
        if pre_solved >= num_colors * 0.7: continue
        if quick_solve_check([list(b) for b in state]):
            return state
    return None

def decode_tube(v, base=BASE):
    tube = []
    for j in range(4):
        c = v % base
        if c > 0:
            tube.append(c - 1)
        v //= base
    return tube

def encode_tube(tube, base=BASE):
    v = 0
    for i, c in enumerate(tube):
        if c >= 0:
            v += (c + 1) * (base ** i)
    return v

def encode_level(n, bottles, base=BASE):
    result = [n]
    for tube in bottles:
        encoded = encode_tube(tube, base)
        result.append(encoded)
    return result

def main():
    print("=" * 60, flush=True)
    print(f"Magic Sort: Generate + Inject {LEVELS_TO_GEN} levels ({START_LEVEL}-{TARGET_LEVEL})", flush=True)
    print("=" * 60, flush=True)

    # Step 1: Generate new levels
    print(f"\n[Step 1] Generating {LEVELS_TO_GEN} levels...", flush=True)
    t0 = time.time()
    new_levels = []

    num_batches = (LEVELS_TO_GEN + 999) // 1000
    for batch_idx in range(num_batches):
        batch_size = min(1000, LEVELS_TO_GEN - batch_idx * 1000)
        seed_base = 90000000 + batch_idx * 2000000
        batch_ok = 0

        for i in range(batch_size):
            seed = seed_base + i
            result = generate_level_fast(29, seed, extra_tubes=3)
            if result:
                new_levels.append((29, result))
                batch_ok += 1
            if i % 200 == 199:
                elapsed = time.time() - t0
                print(f"  Batch {batch_idx+1}/{num_batches}: {i+1}/{batch_size} ({batch_ok} ok) {elapsed:.1f}s", flush=True)

        print(f"  Batch {batch_idx+1}/{num_batches} done: {batch_ok}/{batch_size}, total: {len(new_levels)}", flush=True)

    # Deduplicate
    seen = set()
    unique_levels = []
    for n, state in new_levels:
        key = str(state)
        if key not in seen:
            seen.add(key)
            unique_levels.append((n, state))

    print(f"\nGenerated {len(unique_levels)} unique levels in {time.time()-t0:.1f}s", flush=True)

    if len(unique_levels) < LEVELS_TO_GEN * 0.9:
        print(f"WARNING: Low yield ({len(unique_levels)}/{LEVELS_TO_GEN}), may need retry")

    # Trim to exact target
    levels_needed = LEVELS_TO_GEN
    if len(unique_levels) > levels_needed:
        unique_levels = unique_levels[:levels_needed]
    print(f"Using {len(unique_levels)} levels (targeting {TARGET_LEVEL} total)", flush=True)

    # Step 2: Load and parse existing index.html
    print("\n[Step 2] Loading existing index.html...", flush=True)
    # Backup first
    os.system(f"cp {INDEX_HTML} {INDEX_HTML}.bak.40000")
    print("  Backup created", flush=True)

    with open(INDEX_HTML, 'r') as f:
        content = f.read()
    print(f"  Original: {len(content):,} bytes", flush=True)

    # Parse existing _LD
    m = re.search(r'const _LD=\[(.*?)\];', content, re.DOTALL)
    if not m:
        print("ERROR: Could not find _LD array")
        sys.exit(1)

    _LD = json.loads('[' + m.group(1) + ']')
    print(f"  Existing levels: {len(_LD)}", flush=True)

    # Verify round-trip
    test_entry = _LD[0]
    n = test_entry[0]
    bottles = []
    for i in range(1, len(test_entry)):
        bottles.append(decode_tube(test_entry[i]))

    re_encoded = encode_level(n, bottles)
    if re_encoded == list(test_entry):
        print("  Round-trip verification: PASS", flush=True)
    else:
        print(f"  Round-trip FAILED: {test_entry} vs {re_encoded}", flush=True)
        sys.exit(1)

    # Step 3: Append new levels
    print(f"\n[Step 3] Appending {len(unique_levels)} new levels...", flush=True)
    for n, state in unique_levels:
        encoded = encode_level(n, state)
        _LD.append(encoded)

    print(f"  Total levels: {len(_LD)}", flush=True)

    # Step 4: Build new _LD string and replace
    print("\n[Step 4] Building new _LD array...", flush=True)
    ld_parts = []
    for entry in _LD:
        ld_parts.append('[' + ','.join(str(x) for x in entry) + ']')
    new_ld_str = 'const _LD=[' + ','.join(ld_parts) + '];'
    print(f"  New _LD size: {len(new_ld_str):,} bytes", flush=True)

    old_ld_match = re.search(r'const _LD=\[.*?\];', content, re.DOTALL)
    content = content[:old_ld_match.start()] + new_ld_str + content[old_ld_match.end():]
    print("  Replaced _LD in content", flush=True)

    # Step 5: Update DIFF_SECTIONS (add 40001-45000)
    print("\n[Step 5] Adding DIFF_SECTIONS...", flush=True)
    section_labels = [
        (40001, "🔮 ARCANE FORGE", "#660099"),
        (40201, "🌟 CELESTIAL GATE", "#ffdd44"),
        (40401, "💀 BONE MARSH", "#888888"),
        (40601, "🔥 PYRE LANDS", "#ff5500"),
        (40801, "💎 GEMSTORM", "#00aaff"),
        (41001, "🌊 TIDAL FORCE", "#0044aa"),
        (41201, "⚡ SURGE CORE", "#ddff00"),
        (41401, "🐉 WYVERN NEST", "#ff0044"),
        (41601, "🌑 VOID RIFT", "#220022"),
        (41801, "🌀 MAELSTROM", "#9900aa"),
        (42001, "🔥 EMBER THRONE", "#ff7733"),
        (42201, "💎 DIAMOND EDGE", "#00ddff"),
        (42401, "🌟 NOVA BURST", "#ffcc00"),
        (42601, "🌊 DEEP CURRENT", "#003388"),
        (42801, "💀 GRIM HOLD", "#440044"),
        (43001, "⚡ BOLT SANCTUM", "#ffff55"),
        (43201, "🔥 CRIMSON FANG", "#cc1100"),
        (43401, "🌀 SPIRAL DREAM", "#aa00cc"),
        (43601, "💎 AZURE PEAK", "#0099ff"),
        (43801, "🌟 GOLDEN DAWN", "#ffaa00"),
        (44001, "🐉 ANCIENT WYRM", "#dd0033"),
        (44201, "🌑 NIGHTFALL", "#110011"),
        (44401, "🌊 WHIRLPOOL", "#0055aa"),
        (44601, "⚡ ARC STORM", "#ffee00"),
        (44801, "👑 ULTIMATE LEGEND", "#ffd700"),
    ]

    new_section_str = ""
    for start, label, color in section_labels:
        new_section_str += f',\n  {{ start: {start}, label: "{label}", color: "{color}" }}'

    # Find the closing of DIFF_SECTIONS
    diff_match = re.search(r'const DIFF_SECTIONS\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if diff_match:
        old_diff = diff_match.group(1)
        last_brace_pos = old_diff.rfind('}')
        new_diff = old_diff[:last_brace_pos+1] + new_section_str + old_diff[last_brace_pos+1:]
        content = content[:diff_match.start()] + 'const DIFF_SECTIONS = [' + new_diff + '];' + content[diff_match.end():]
        print(f"  Added {len(section_labels)} new DIFF_SECTIONS (40001-45000)", flush=True)

    # Step 6: Update meta tags
    print("\n[Step 6] Updating meta tags...", flush=True)
    meta_replacements = [
        ('40,000+', '45,000'),
        ('40,000 Levels', '45,000 Levels'),
        ('40000 levels', '45000 levels'),
        ('40000 hand-crafted', '45000 hand-crafted'),
        ('218+ difficulty', '243+ difficulty'),
        ('40,000 levels', '45,000 levels'),
        ('Play Magic Sort Online Free - 40,000 Levels', 'Play Magic Sort Online Free - 45,000 Levels'),
    ]
    for old, new in meta_replacements:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            print(f"  {old} -> {new} ({count} occurrences)", flush=True)

    # Step 7: Add milestone emojis
    print("\n[Step 7] Adding milestones...", flush=True)
    new_milestones = '''
  if (lv === 40500) return "🔮";
  if (lv === 41000) return "🌟";
  if (lv === 41500) return "💎";
  if (lv === 42000) return "🔥";
  if (lv === 42500) return "⚡";
  if (lv === 43000) return "🌀";
  if (lv === 43500) return "💀";
  if (lv === 44000) return "🐉";
  if (lv === 44500) return "🌑";
  if (lv === 45000) return "👑🔥🏆💎";'''

    # Find the last existing milestone (40000)
    if 'if (lv === 40000) return' in content:
        content = content.replace(
            'if (lv === 40000) return "👑🔥🏆";\n  if (lv % 100',
            'if (lv === 40000) return "👑🔥🏆";' + new_milestones + '\n  if (lv % 100'
        )
        print("  Added milestones 40500-45000", flush=True)
    else:
        print("  WARNING: Could not find 40000 milestone anchor", flush=True)

    # Step 8: Add new achievements
    print("\n[Step 8] Adding achievements...", flush=True)
    new_achievements = '''
  { id: "fortytwo_k", name: "ARCANE MASTER", desc: "Complete 42,000 levels", icon: "\\u{1F5DD}", check: (s) => s.completed >= 42000 },
  { id: "fortyfive_k", name: "ULTIMATE LEGEND", desc: "Complete all 45,000 levels", icon: "\\u{1F451}\\u{1F525}\\u{1F3C6}\\u{1F48E}", check: (s) => s.completed >= 45000 },'''

    forty_k_pattern = '{ id: "forty_k"'
    if forty_k_pattern in content:
        idx = content.index(forty_k_pattern)
        # Find the end of forty_k achievement line
        end_idx = content.index('},', idx) + 2
        content = content[:end_idx] + new_achievements + '\n  ' + content[end_idx:]
        print("  Added 2 new achievements (42K-45K)", flush=True)

    # Step 9: Write output
    print("\n[Step 9] Writing updated index.html...", flush=True)
    with open(INDEX_HTML, 'w') as f:
        f.write(content)

    final_size = os.path.getsize(INDEX_HTML)
    print(f"\nDone! Final file: {final_size:,} bytes", flush=True)
    print(f"Total levels: {len(_LD)}", flush=True)
    print(f"New levels added: {len(unique_levels)}", flush=True)
    print(f"Time: {time.time()-t0:.1f}s", flush=True)

if __name__ == "__main__":
    main()
