"""
Inject expansion 9001-10000 into Magic Sort index.html.
Reads existing base-30 _LD, decodes, adds new levels, re-encodes, updates DIFF_SECTIONS.
Steps:
1. Read current base-30 _LD data from index.html
2. Decode all existing levels back to {n, b} format
3. Read new 1000 levels from expansion txt
4. Encode all levels in base-30
5. Write new _LD array into index.html
6. Update DIFF_SECTIONS
7. Update comments
"""
import sys
import os
import re
import json

INDEX_HTML = "/home/msdn/gamezipper.com/magic-sort/index.html"
EXPANSION_FILE = "/home/msdn/gamezipper.com/magic-sort/expansion_9001_10000.txt"
BASE = 30

def decode_tube(v, base=BASE):
    """Decode a base-N encoded tube back to [layer0, layer1, layer2, layer3] (bottom to top)."""
    tube = []
    for j in range(4):
        c = v % base
        if c > 0:
            tube.append(c - 1)  # color index 0-based
        v //= base
    return tube  # bottom to top order

def encode_tube(tube, base=BASE):
    """Encode a tube [layer0, layer1, layer2, layer3] (bottom to top) to base-N number."""
    v = 0
    for i, c in enumerate(tube):
        if c >= 0:
            v += (c + 1) * (base ** i)
    return v

def decode_level(ld_entry):
    """Decode a compressed level entry [n, tube1, tube2, ...] to (n, bottles)."""
    n = ld_entry[0]
    bottles = []
    for i in range(1, len(ld_entry)):
        tube = decode_tube(ld_entry[i])
        bottles.append(tube)
    return n, bottles

def encode_level(n, bottles, base=BASE):
    """Encode a level (n, bottles) to compressed format [n, tube1, tube2, ...]."""
    result = [n]
    for tube in bottles:
        encoded = encode_tube(tube, base)
        result.append(encoded)
    return result

def parse_expansion_level(line):
    """Parse a line like '{n:22,b:[[0,1,2,3],[4,5,6,7],[],[]]}' to (n, bottles)."""
    line = line.strip().rstrip(',')
    json_str = re.sub(r'\{n:', '{"n":', line)
    json_str = re.sub(r',b:', ',"b":', json_str)
    try:
        data = json.loads(json_str)
        return data['n'], data['b']
    except json.JSONDecodeError as e:
        print(f"  Parse error: {e} on line: {line[:80]}...", flush=True)
        return None, None

def main():
    # 1. Read current index.html
    with open(INDEX_HTML, 'r') as f:
        content = f.read()
    
    print(f"Original file: {len(content):,} bytes, {content.count(chr(10))} lines", flush=True)
    
    # 2. Extract _LD array
    m = re.search(r'const _LD=\[(.*?)\];', content, re.DOTALL)
    if not m:
        print("ERROR: Could not find _LD array")
        sys.exit(1)
    
    ld_str = m.group(1)
    _LD = json.loads('[' + ld_str + ']')
    print(f"Existing levels in _LD: {len(_LD)}", flush=True)
    
    # 3. Decode all existing levels
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
    
    # 4. Read new expansion levels
    if not os.path.exists(EXPANSION_FILE):
        print(f"ERROR: {EXPANSION_FILE} not found")
        sys.exit(1)
    
    with open(EXPANSION_FILE, 'r') as f:
        new_lines = [l.strip() for l in f if l.strip() and l.strip().startswith('{n:')]
    
    print(f"New levels from expansion: {len(new_lines)}", flush=True)
    
    new_count = 0
    for line in new_lines:
        n, bottles = parse_expansion_level(line)
        if n is not None:
            all_levels.append((n, bottles))
            new_count += 1
    
    print(f"Parsed new levels: {new_count}", flush=True)
    print(f"Total levels: {len(all_levels)}", flush=True)
    
    if len(all_levels) != 10000:
        print(f"WARNING: Expected 10000 levels, got {len(all_levels)}", flush=True)
    
    # 5. Encode all levels in base-30
    print(f"\nEncoding all {len(all_levels)} levels in base-{BASE}...", flush=True)
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
    
    # 6. Build new _LD string
    ld_parts = []
    for entry in new_LD:
        ld_parts.append('[' + ','.join(str(x) for x in entry) + ']')
    new_ld_str = 'const _LD=[' + ','.join(ld_parts) + '];'
    
    print(f"New _LD array size: {len(new_ld_str):,} bytes", flush=True)
    
    # 7. Replace in content
    old_ld_match = re.search(r'const _LD=\[.*?\];', content, re.DOTALL)
    content = content[:old_ld_match.start()] + new_ld_str + content[old_ld_match.end():]
    print("Replaced _LD array", flush=True)
    
    # 8. Update level count comments
    for old_cmt in ['// ─── Level Definitions (9000 levels) ───',
                     '// ─── Level Definitions (9000 levels, compact encoding) ───']:
        if old_cmt in content:
            content = content.replace(old_cmt, '// ─── Level Definitions (10000 levels, compact encoding) ───')
            print(f"Updated comment: {old_cmt}", flush=True)
    
    # 9. Add new DIFF_SECTIONS for 9001-10000
    diff_sections_match = re.search(r'const DIFF_SECTIONS = \[(.*?)\];', content, re.DOTALL)
    if diff_sections_match:
        diff_content = diff_sections_match.group(1)
        # Find the last entry - ABSOLUTE ZERO
        last_section_pattern = '{ start: 8801, label: "👑 ABSOLUTE ZERO", color: "#00cccc" }'
        if last_section_pattern in diff_content:
            new_sections = """,
  { start: 9001, label: "💀 BEYOND INFINITE", color: "#1a001a" },
  { start: 9201, label: "🌑 COSMIC END", color: "#0a0a0a" },
  { start: 9401, label: "🌀 DIMENSION X", color: "#ff0033" },
  { start: 9601, label: "⚡ OMEGA PRIME", color: "#33ff33" },
  { start: 9801, label: "👑 LEGEND'S END", color: "#ffd700" }"""
            diff_content = diff_content.replace(
                last_section_pattern,
                last_section_pattern + new_sections
            )
            content = content[:diff_sections_match.start()] + 'const DIFF_SECTIONS = [' + diff_content + '];' + content[diff_sections_match.end():]
            print("Added 5 new DIFF_SECTIONS (9001-10000)", flush=True)
        else:
            print("WARNING: Could not find last DIFF_SECTION entry (ABSOLUTE ZERO)", flush=True)
            # Fallback: find last section and append
            last_entry_match = re.search(r'(\{ start: \d+, label: "[^"]+", color: "[^"]+" \})\s*\]', diff_content)
            if last_entry_match:
                last_entry = last_entry_match.group(1)
                new_sections = """,
  { start: 9001, label: "💀 BEYOND INFINITE", color: "#1a001a" },
  { start: 9201, label: "🌑 COSMIC END", color: "#0a0a0a" },
  { start: 9401, label: "🌀 DIMENSION X", color: "#ff0033" },
  { start: 9601, label: "⚡ OMEGA PRIME", color: "#33ff33" },
  { start: 9801, label: "👑 LEGEND'S END", color: "#ffd700" }"""
                diff_content = diff_content.replace(
                    last_entry,
                    last_entry + new_sections
                )
                content = content[:diff_sections_match.start()] + 'const DIFF_SECTIONS = [' + diff_content + '];' + content[diff_sections_match.end():]
                print("Added 5 new DIFF_SECTIONS (9001-10000) via fallback", flush=True)
    else:
        print("WARNING: Could not find DIFF_SECTIONS", flush=True)
    
    # 10. Write updated content
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    print(f"\n{'='*60}", flush=True)
    print(f"INJECTION COMPLETE!")
    print(f"  Total levels: {len(all_levels)}", flush=True)
    print(f"  Encoding: base-{BASE}", flush=True)
    print(f"  File size: {len(content):,} bytes", flush=True)
    print(f"  New DIFF_SECTIONS: +5 (9001-10000)", flush=True)
    print(f"  MILESTONE: 10,000 LEVELS!", flush=True)

if __name__ == "__main__":
    main()
