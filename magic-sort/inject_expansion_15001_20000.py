"""
Inject expansion 15001-20000 into Magic Sort index.html.
Reads existing base-30 _LD, decodes, adds new levels, re-encodes, updates DIFF_SECTIONS & meta.
"""
import sys
import os
import re
import json

INDEX_HTML = "/home/msdn/gamezipper.com/magic-sort/index.html"
EXPANSION_FILE = "/home/msdn/gamezipper.com/magic-sort/expansion_15001_20000.txt"
BASE = 30

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

def decode_level(ld_entry):
    n = ld_entry[0]
    bottles = []
    for i in range(1, len(ld_entry)):
        tube = decode_tube(ld_entry[i])
        bottles.append(tube)
    return n, bottles

def encode_level(n, bottles, base=BASE):
    result = [n]
    for tube in bottles:
        encoded = encode_tube(tube, base)
        result.append(encoded)
    return result

def parse_expansion_level(line):
    line = line.strip().rstrip(',')
    try:
        data = json.loads(line)
        return data['n'], data['b']
    except json.JSONDecodeError as e:
        print(f"  Parse error: {e} on line: {line[:80]}...", flush=True)
        return None, None

def main():
    with open(INDEX_HTML, 'r') as f:
        content = f.read()
    
    print(f"Original file: {len(content):,} bytes, {content.count(chr(10))} lines", flush=True)
    
    # Find and parse existing _LD
    m = re.search(r'const _LD=\[(.*?)\];', content, re.DOTALL)
    if not m:
        print("ERROR: Could not find _LD array")
        sys.exit(1)
    
    ld_str = m.group(1)
    _LD = json.loads('[' + ld_str + ']')
    print(f"Existing levels in _LD: {len(_LD)}", flush=True)
    
    # Decode all existing levels
    all_levels = []
    for i, entry in enumerate(_LD):
        n, bottles = decode_level(entry)
        all_levels.append((n, bottles))
    
    # Verify round-trip for first level
    test_encoded = encode_level(all_levels[0][0], all_levels[0][1])
    if test_encoded == list(_LD[0]):
        print("Round-trip verification: PASS (first level)", flush=True)
    else:
        print(f"Round-trip MISMATCH! Expected {_LD[0]}, got {test_encoded}", flush=True)
        sys.exit(1)
    
    # Load new levels
    if not os.path.exists(EXPANSION_FILE):
        print(f"ERROR: {EXPANSION_FILE} not found")
        sys.exit(1)
    
    with open(EXPANSION_FILE, 'r') as f:
        new_lines = [l.strip() for l in f if l.strip() and l.strip().startswith('{')]
    
    print(f"New levels from expansion: {len(new_lines)}", flush=True)
    
    new_count = 0
    for line in new_lines:
        n, bottles = parse_expansion_level(line)
        if n is not None:
            all_levels.append((n, bottles))
            new_count += 1
    
    print(f"Parsed new levels: {new_count}", flush=True)
    print(f"Total levels: {len(all_levels)}", flush=True)
    
    if len(all_levels) != 20000:
        print(f"WARNING: Expected 20000 levels, got {len(all_levels)}", flush=True)
    
    # Encode all levels in base-30
    print(f"Encoding all {len(all_levels)} levels in base-{BASE}...", flush=True)
    new_LD = []
    for n, bottles in all_levels:
        encoded = encode_level(n, bottles, BASE)
        new_LD.append(encoded)
    
    # Verify round-trips
    test_tube = decode_tube(new_LD[0][1], BASE)
    if test_tube == all_levels[0][1][0]:
        print("Base-30 round-trip: PASS (first tube of first level)", flush=True)
    
    last_idx = len(all_levels) - 1
    last_tube_check = decode_tube(new_LD[last_idx][1], BASE)
    if last_tube_check == all_levels[last_idx][1][0]:
        print("Base-30 round-trip: PASS (first tube of last level)", flush=True)
    
    # Build new _LD string
    ld_parts = []
    for entry in new_LD:
        ld_parts.append('[' + ','.join(str(x) for x in entry) + ']')
    new_ld_str = 'const _LD=[' + ','.join(ld_parts) + '];'
    
    print(f"New _LD array size: {len(new_ld_str):,} bytes", flush=True)
    
    # Replace _LD in content
    old_ld_match = re.search(r'const _LD=\[.*?\];', content, re.DOTALL)
    content = content[:old_ld_match.start()] + new_ld_str + content[old_ld_match.end():]
    print("Replaced _LD array", flush=True)
    
    # Update level count comments
    content = content.replace(
        '// ─── Level Definitions (15000 levels, compact encoding) ───',
        '// ─── Level Definitions (20000 levels, compact encoding) ───'
    )
    print("Updated level count comment to 20000", flush=True)
    
    # Add new DIFF_SECTIONS for 15001-20000
    new_diff_sections = """,
  { start: 15001, label: "🔮 OMNIVERSE ASCEND", color: "#9933ff" },
  { start: 15201, label: "💀 VOID EMPEROR", color: "#1a001a" },
  { start: 15401, label: "⚡ CHAOS NEXUS", color: "#ff3300" },
  { start: 15601, label: "👑 ETERNAL THRONE", color: "#ffd700" },
  { start: 15801, label: "🌌 COSMIC GENESIS", color: "#4169e1" },
  { start: 16001, label: "🔮 DIMENSION RIFT", color: "#cc00ff" },
  { start: 16201, label: "💀 OMEGA SINGULARITY", color: "#330033" },
  { start: 16401, label: "⚡ INFINITE CRESCENDO", color: "#ffff00" },
  { start: 16601, label: "👑 APEX OMEGA", color: "#ff9900" },
  { start: 16801, label: "🌈 PRISMATIC VOID", color: "#ff69b4" },
  { start: 17001, label: "🔥 ABYSSAL STORM", color: "#ff4500" },
  { start: 17201, label: "💎 CRYSTAL NEXUS", color: "#b9f2ff" },
  { start: 17401, label: "🌀 QUANTUM RIFT", color: "#33ffcc" },
  { start: 17601, label: "⚡ THUNDER APEX", color: "#ffcc00" },
  { start: 17801, label: "👑 SOVEREIGN EDGE", color: "#ff0066" },
  { start: 18001, label: "💀 ELDRITCH FORGE", color: "#2a002a" },
  { start: 18201, label: "🌑 VOID NEXUS", color: "#050510" },
  { start: 18401, label: "🌀 CHAOS WEAVER", color: "#ff0055" },
  { start: 18601, label: "⚡ INFINITE BLAZE", color: "#ff6600" },
  { start: 18801, label: "👑 COSMIC SOVEREIGN", color: "#ffd700" },
  { start: 19001, label: "🔮 ABYSSAL FORGE", color: "#9900ff" },
  { start: 19201, label: "🌈 CELESTIAL EDGE", color: "#ff69b4" },
  { start: 19401, label: "💀 VOID WALKER II", color: "#4a0000" },
  { start: 19601, label: "⚡ QUANTUM SURGE", color: "#00ffff" },
  { start: 19801, label: "🔥 INFERNO APEX", color: "#ff4500" }"""
    
    # Find last DIFF_SECTION entry and append
    last_section_match = re.search(
        r'(\{ start: 14801, label: "[^"]+", color: "[^"]+" \})\s*\]',
        content
    )
    if last_section_match:
        last_entry = last_section_match.group(1)
        content = content.replace(
            last_entry + '\n];',
            last_entry + new_diff_sections + '\n];'
        )
        print("Added 25 new DIFF_SECTIONS (15001-20000)", flush=True)
    else:
        print("WARNING: Could not find last DIFF_SECTION entry", flush=True)
        # Try generic approach
        diff_match = re.search(r'const DIFF_SECTIONS = \[(.*)\];', content, re.DOTALL)
        if diff_match:
            old_diff = diff_match.group(1)
            # Find the last } before ]
            last_brace_pos = old_diff.rfind('}')
            if last_brace_pos >= 0:
                new_diff = old_diff[:last_brace_pos+1] + new_diff_sections + old_diff[last_brace_pos+1:]
                content = content[:diff_match.start()] + 'const DIFF_SECTIONS = [' + new_diff + '];' + content[diff_match.end():]
                print("Added 25 new DIFF_SECTIONS (15001-20000) via fallback", flush=True)
    
    # Update meta tags
    content = content.replace('15,000', '20,000')
    content = content.replace('15000 levels', '20000 levels')
    content = content.replace('15000 hand-crafted', '20000 hand-crafted')
    print("Updated meta tags from 15000 to 20000", flush=True)
    
    # Update achievement thresholds
    # The fifteen_k achievement should now be twenty_k
    content = content.replace(
        '{ id: "fifteen_k", name: "OMNIVERSE MASTER", desc: "Complete all 15,000 levels"',
        '{ id: "twenty_k", name: "OMNIVERSE MASTER", desc: "Complete all 20,000 levels"'
    )
    content = content.replace(
        'check: (s) => s.completed >= 15000 }',
        'check: (s) => s.completed >= 20000 }'
    )
    
    # Add new achievements for 15K, 16K, 17K, 18K, 19K milestones
    # Find the fifteen_k/twenty_k achievement and add before it
    old_achievements_block = '{ id: "fourteen_k", name: "COSMIC ARCHITECT", desc: "Complete all 15,000 levels", icon: "\\u{1F451}", check: (s) => s.completed >= 14000 },'
    new_achievements_block = """{ id: "fourteen_k", name: "COSMIC ARCHITECT", desc: "Complete 14,000 levels", icon: "\\u{1F451}", check: (s) => s.completed >= 14000 },
  { id: "fifteen_k", name: "COSMIC MASTER", desc: "Complete 15,000 levels", icon: "\\u{1F3C6}", check: (s) => s.completed >= 15000 },
  { id: "sixteen_k", name: "VOID SOVEREIGN", desc: "Complete 16,000 levels", icon: "\\u{1F525}", check: (s) => s.completed >= 16000 },
  { id: "seventeen_k", name: "ABYSS LORD", desc: "Complete 17,000 levels", icon: "\\u{2694}\\u{FE0F}", check: (s) => s.completed >= 17000 },
  { id: "eighteen_k", name: "QUANTUM MASTER", desc: "Complete 18,000 levels", icon: "\\u{26A1}", check: (s) => s.completed >= 18000 },
  { id: "nineteen_k", name: "ELDRITCH SAGE", desc: "Complete 19,000 levels", icon: "\\u{1F52E}", check: (s) => s.completed >= 19000 },"""
    
    if old_achievements_block in content:
        content = content.replace(old_achievements_block, new_achievements_block)
        print("Added milestone achievements for 15K-19K", flush=True)
    
    # Update the level milestone function
    # Find: if (lv === 15000) return "🏆";
    content = content.replace(
        'if (lv === 15000) return "\\u{1F3C6}";',
        'if (lv === 15000) return "\\u{1F3C6}";\n  if (lv === 20000) return "\\u{1F451}\\u{1F3C6}";'
    )
    print("Updated level milestone for 20000", flush=True)
    
    # Write updated content
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    new_size = len(content)
    new_lines = content.count('\n')
    print(f"\n{'='*60}", flush=True)
    print(f"INJECTION COMPLETE!", flush=True)
    print(f"  Total levels: {len(all_levels)}", flush=True)
    print(f"  Encoding: base-{BASE}", flush=True)
    print(f"  File size: {new_size:,} bytes ({new_lines} lines)", flush=True)
    print(f"  New DIFF_SECTIONS: +25 (15001-20000)", flush=True)
    print(f"  MILESTONE: 20,000 LEVELS!")

if __name__ == "__main__":
    main()
