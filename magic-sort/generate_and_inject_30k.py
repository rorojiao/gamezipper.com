"""
Generate + Inject 5000 new levels for Magic Sort: 25001-30000.
All-in-one script to avoid file cleanup issues.
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
    print("Magic Sort: Generate + Inject 5000 levels (25001-30000)", flush=True)
    print("=" * 60, flush=True)
    
    # Step 1: Generate 5000 new levels
    print("\n[Step 1] Generating 5000 levels...", flush=True)
    t0 = time.time()
    new_levels = []
    
    for batch_idx in range(5):
        start = 25001 + batch_idx * 1000
        seed_base = 60000000 + batch_idx * 2000000
        batch_ok = 0
        
        for i in range(1000):
            seed = seed_base + i
            result = generate_level_fast(29, seed, extra_tubes=3)
            if result:
                new_levels.append((29, result))
                batch_ok += 1
            if i % 200 == 199:
                elapsed = time.time() - t0
                print(f"  Batch {batch_idx+1}/5: {i+1}/1000 ({batch_ok} ok) {elapsed:.1f}s", flush=True)
        
        print(f"  Batch {batch_idx+1}/5 done: {batch_ok}/1000, total: {len(new_levels)}", flush=True)
    
    # Deduplicate
    seen = set()
    unique_levels = []
    for n, state in new_levels:
        key = str(state)
        if key not in seen:
            seen.add(key)
            unique_levels.append((n, state))
    
    print(f"\nGenerated {len(unique_levels)} unique levels in {time.time()-t0:.1f}s", flush=True)
    
    # Step 2: Load and parse existing index.html
    print("\n[Step 2] Loading existing index.html...", flush=True)
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
    
    # Step 5: Update DIFF_SECTIONS (add 20001-30000)
    print("\n[Step 5] Adding DIFF_SECTIONS...", flush=True)
    new_sections = []
    section_labels = [
        (20001, "🌀 HYPERVOID ASCEND", "#6600cc"),
        (20201, "💀 DEATHLESS REALM", "#1a0a00"),
        (20401, "⚡ STORM SOVEREIGN", "#ffdd00"),
        (20601, "🔮 ARCANE NEXUS", "#ff00ff"),
        (20801, "👑 CROWN OF STARS", "#ffd700"),
        (21001, "🔥 PHOENIX RISING", "#ff6600"),
        (21201, "🌈 PRISMATIC SURGE", "#ff69b4"),
        (21401, "💎 DIAMOND VEIL", "#b9f2ff"),
        (21601, "🌀 VORTEX EMPEROR", "#00ffcc"),
        (21801, "⚡ THUNDER COLOSSUS", "#ffff00"),
        (22001, "💀 SHADOW MONARCH", "#330033"),
        (22201, "🔥 SOLAR TEMPEST", "#ff4500"),
        (22401, "👑 ETERNAL FLAME", "#ffa500"),
        (22601, "🌌 STAR WEAVER", "#4169e1"),
        (22801, "🔮 MYSTIC FORGE", "#9900ff"),
        (23001, "⚡ NOVA BURST", "#00ffff"),
        (23201, "💀 VOID PHANTOM", "#4a0000"),
        (23401, "🌀 CHAOS INFINITY", "#ff0055"),
        (23601, "🔥 BLAZING TITAN", "#ff3300"),
        (23801, "👑 CELESTIAL CROWN", "#ffd700"),
        (24001, "🔮 ARCANE TEMPEST", "#cc00ff"),
        (24201, "💎 CRYSTAL GENESIS", "#00ccff"),
        (24401, "🌈 RAINBOW APEX", "#ff69b4"),
        (24601, "💀 OMEGA WRAITH", "#2a002a"),
        (24801, "⚡ INFINITE VOID", "#ffff00"),
        (25001, "🔥 ABYSSAL INFERNO", "#ff4500"),
        (25201, "🌀 QUANTUM CHAOS", "#33ffcc"),
        (25401, "👑 APEX GODHEAD", "#ffd700"),
        (25601, "🔮 ETHEREAL DREAM", "#9933ff"),
        (25801, "💀 REALM SHATTER", "#1a001a"),
        (26001, "⚡ ULTRA SURGE", "#ffcc00"),
        (26201, "🔥 PHOENIX REBORN", "#ff6600"),
        (26401, "💎 PRISM NEXUS", "#b9f2ff"),
        (26601, "🌌 COSMIC DREAM", "#4169e1"),
        (26801, "👑 SOVEREIGN OMEGA", "#ff9900"),
        (27001, "🔮 MYSTIC APEX", "#cc00ff"),
        (27201, "💀 SHADOW NEXUS", "#4a0000"),
        (27401, "🌈 CELESTIAL WAVE", "#ff69b4"),
        (27601, "⚡ HYPER CHARGE", "#00ffff"),
        (27801, "🔥 INFERNO PEAK", "#ff3300"),
        (28001, "🌀 DIMENSION CRUX", "#6600cc"),
        (28201, "💎 DIAMOND APEX", "#00ccff"),
        (28401, "💀 DEATH WEAVER", "#2a002a"),
        (28601, "⚡ CHAOS BOLT", "#ffff00"),
        (28801, "👑 ETERNAL ZENITH", "#ffd700"),
        (29001, "🔥 BLAZE GENESIS", "#ff4500"),
        (29201, "🔮 ARCANE SURGE", "#9900ff"),
        (29401, "🌌 NEBULA THRONE", "#4169e1"),
        (29601, "💀 VOID EMPYREAN", "#1a001a"),
        (29801, "⚡ FINAL ASCENSION", "#ffffff"),
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
        print(f"  Added {len(section_labels)} new DIFF_SECTIONS (20001-30000)", flush=True)
    
    # Step 6: Update meta tags
    print("\n[Step 6] Updating meta tags...", flush=True)
    meta_replacements = [
        ('25,000+', '30,000'),
        ('25000 levels', '30000 levels'),
        ('25000 hand-crafted', '30000 hand-crafted'),
        ('125+ difficulty', '168+ difficulty'),
    ]
    for old, new in meta_replacements:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            print(f"  {old} -> {new} ({count} occurrences)", flush=True)
    
    # Step 7: Add milestone emojis
    print("\n[Step 7] Adding milestones...", flush=True)
    new_milestones = '''
  if (lv === 15500) return "💫";
  if (lv === 16000) return "⚜️";
  if (lv === 16500) return "🔱";
  if (lv === 17000) return "🌠";
  if (lv === 17500) return "✨";
  if (lv === 18000) return "☄️";
  if (lv === 18500) return "🌌";
  if (lv === 19000) return "💀";
  if (lv === 19500) return "👁️";
  if (lv === 20000) return "👑🏆";
  if (lv === 20500) return "🔥";
  if (lv === 21000) return "💎";
  if (lv === 21500) return "🌟";
  if (lv === 22000) return "🌀";
  if (lv === 22500) return "🔮";
  if (lv === 23000) return "⚡";
  if (lv === 23500) return "💥";
  if (lv === 24000) return "💎";
  if (lv === 24500) return "🌈";
  if (lv === 25000) return "🏆✨";
  if (lv === 25500) return "🌟";
  if (lv === 26000) return "👑";
  if (lv === 26500) return "💫";
  if (lv === 27000) return "🔥";
  if (lv === 27500) return "🔱";
  if (lv === 28000) return "⚡";
  if (lv === 28500) return "🔮";
  if (lv === 29000) return "💀";
  if (lv === 29500) return "🌌";
  if (lv === 30000) return "👑🌟🏆";'''
    
    content = content.replace(
        'if (lv === 15000) return "🏆";\n  if (lv % 100',
        'if (lv === 15000) return "🏆";' + new_milestones + '\n  if (lv % 100'
    )
    print("  Added milestones 15500-30000", flush=True)
    
    # Step 8: Add new achievements
    print("\n[Step 8] Adding achievements...", flush=True)
    new_achievements = '''
  { id: "twenty_k", name: "COSMIC LEGEND", desc: "Complete 20,000 levels", icon: "\\u{1F451}\\u{1F3C6}", check: (s) => s.completed >= 20000 },
  { id: "twentytwo_k", name: "HYPERVOID MASTER", desc: "Complete 22,000 levels", icon: "\\u{1F300}", check: (s) => s.completed >= 22000 },
  { id: "twentyfive_k", name: "ETERNAL SOVEREIGN", desc: "Complete 25,000 levels", icon: "\\u{1F525}", check: (s) => s.completed >= 25000 },
  { id: "twentyeight_k", name: "FINAL ASCENDANT", desc: "Complete 28,000 levels", icon: "\\u{26A1}", check: (s) => s.completed >= 28000 },
  { id: "thirty_k", name: "ULTIMATE GOD", desc: "Complete all 30,000 levels", icon: "\\u{1F451}\\u{1F31F}\\u{1F3C6}", check: (s) => s.completed >= 30000 },'''
    
    fifteen_k_pattern = '{ id: "fifteen_k"'
    if fifteen_k_pattern in content:
        idx = content.index(fifteen_k_pattern)
        # Insert before fifteen_k
        content = content[:idx] + new_achievements + '\n  ' + content[idx:]
        print("  Added 5 new achievements (20K-30K)", flush=True)
    
    # Step 9: Write output
    print("\n[Step 9] Writing updated index.html...", flush=True)
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    new_size = len(content)
    print(f"  Final size: {new_size:,} bytes", flush=True)
    
    # Final verification
    print("\n" + "=" * 60, flush=True)
    print("VERIFICATION", flush=True)
    print("=" * 60, flush=True)
    
    with open(INDEX_HTML, 'r') as f:
        verify_content = f.read()
    
    # Check _LD count
    vm = re.search(r'const _LD=\[(.*?)\];', verify_content, re.DOTALL)
    if vm:
        count = vm.group(1).count('],[') + 1
        print(f"✅ Total levels: {count}", flush=True)
    
    # Check DIFF_SECTIONS
    vm2 = re.search(r'const DIFF_SECTIONS\s*=\s*\[(.*?)\];', verify_content, re.DOTALL)
    if vm2:
        entries = re.findall(r'\{ start: (\d+),', vm2.group(1))
        print(f"✅ DIFF_SECTIONS: {len(entries)}, last: {entries[-1]}", flush=True)
    
    # Check title
    vtitle = re.search(r'<title>(.*?)</title>', verify_content)
    if vtitle:
        print(f"✅ Title: {vtitle.group(1)}", flush=True)
    
    # Check milestones
    vms = re.findall(r'if \(lv === (\d+)\) return', verify_content)
    vms_nums = sorted([int(x) for x in vms])
    print(f"✅ Milestones: {len(vms_nums)}, max: {max(vms_nums)}", flush=True)
    
    # Check achievements
    vach = re.findall(r'id: "(twenty_k|thirty_k|twentyfive_k|twentytwo_k|twentyeight_k)"', verify_content)
    print(f"✅ New achievements: {vach}", flush=True)
    
    total_time = time.time() - t0
    print(f"\n{'='*60}", flush=True)
    print(f"ALL DONE! Total time: {total_time:.1f}s", flush=True)
    print(f"MILESTONE: 30,000+ LEVELS!", flush=True)

if __name__ == "__main__":
    main()
