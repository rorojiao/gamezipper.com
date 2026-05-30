"""
Re-encode ALL levels (existing 6000 + new 1000) in base-30, inject into index.html.
Steps:
1. Read current _LD base-23 data from index.html
2. Decode all 6000 levels back to {n, b} format  
3. Read new 1000 levels from expansion txt
4. Encode all 7000 levels in base-30
5. Write new _LD array into index.html
6. Update decoder from %23 to %30
7. Update DIFF_SECTIONS
8. Update comments
"""
import sys
import os
import re
import json

INDEX_HTML = "/home/msdn/gamezipper.com/magic-sort/index.html"
EXPANSION_FILE = "/home/msdn/gamezipper.com/magic-sort/expansion_6001_7000.txt"
OLD_BASE = 23
NEW_BASE = 30

def decode_tube_base23(v, base=OLD_BASE):
    """Decode a base-23 encoded tube back to [layer0, layer1, layer2, layer3] (bottom to top)."""
    tube = []
    for j in range(4):
        c = v % base
        if c > 0:
            tube.append(c - 1)  # color index 0-based
        v //= base
    return tube  # bottom to top order

def encode_tube(tube, base=NEW_BASE):
    """Encode a tube [layer0, layer1, layer2, layer3] (bottom to top) to base-N number.
    Empty slots are 0, colors are 1-indexed."""
    v = 0
    # Decode reads from v%base first (bottom), so we encode bottom first
    for i, c in enumerate(tube):
        if c >= 0:  # valid color
            v += (c + 1) * (base ** i)
        # empty slots contribute 0
    return v

def decode_level_base23(ld_entry):
    """Decode a compressed level entry [n, tube1, tube2, ...] to {n, b}."""
    n = ld_entry[0]
    bottles = []
    for i in range(1, len(ld_entry)):
        tube = decode_tube_base23(ld_entry[i])
        bottles.append(tube)
    return n, bottles

def encode_level(n, bottles, base=NEW_BASE):
    """Encode a level {n, b} to compressed format [n, tube1, tube2, ...]."""
    result = [n]
    for tube in bottles:
        encoded = encode_tube(tube, base)
        result.append(encoded)
    return result

def parse_expansion_level(line):
    """Parse a line like '{n:22,b:[[0,1,2,3],[4,5,6,7],[],[]]}' to (n, bottles)."""
    line = line.strip().rstrip(',')
    # Convert JS object notation to JSON
    # {n:22,b:[[1,2],[],[]]} → {"n":22,"b":[[1,2],[],[]]}
    json_str = re.sub(r'\{n:', '{"n":', line)
    json_str = re.sub(r',b:', ',"b":', json_str)
    try:
        data = json.loads(json_str)
        n = data['n']
        bottles = data['b']
        return n, bottles
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
    # Parse the _LD array
    # It's a JSON-like array of arrays
    _LD = json.loads('[' + ld_str + ']')
    print(f"Existing levels in _LD: {len(_LD)}", flush=True)
    
    # 3. Decode all existing levels
    all_levels = []  # list of (n, bottles)
    for i, entry in enumerate(_LD):
        n, bottles = decode_level_base23(entry)
        all_levels.append((n, bottles))
    
    # Verify round-trip for first level
    test_encoded = encode_level(all_levels[0][0], all_levels[0][1], OLD_BASE)
    if test_encoded == list(_LD[0]):
        print("Round-trip verification: PASS (first level)", flush=True)
    else:
        print(f"Round-trip MISMATCH! Expected {_LD[0]}, got {test_encoded}", flush=True)
    
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
    
    # 5. Encode all levels in base-30
    print(f"\nEncoding all {len(all_levels)} levels in base-{NEW_BASE}...", flush=True)
    new_LD = []
    for n, bottles in all_levels:
        encoded = encode_level(n, bottles, NEW_BASE)
        new_LD.append(encoded)
    
    # Verify first existing level round-trip
    decoded_n, decoded_b = decode_level_base23(new_LD[0])  # Need base-30 decode
    # Manual base-30 decode check
    test_tube = decode_tube_base23(new_LD[0][1], NEW_BASE)
    if test_tube == all_levels[0][1][0]:
        print("Base-30 round-trip: PASS (first tube of first level)", flush=True)
    else:
        print(f"Base-30 round-trip MISMATCH! Expected {all_levels[0][1][0]}, got {test_tube}", flush=True)
    
    # Verify last new level
    last_idx = len(all_levels) - 1
    last_tube_check = decode_tube_base23(new_LD[last_idx][1], NEW_BASE)
    if last_tube_check == all_levels[last_idx][1][0]:
        print("Base-30 round-trip: PASS (first tube of last level)", flush=True)
    else:
        print(f"Base-30 round-trip MISMATCH for last level!", flush=True)
    
    # 6. Build new _LD string
    # Format as compact array
    ld_parts = []
    for entry in new_LD:
        ld_parts.append('[' + ','.join(str(x) for x in entry) + ']')
    new_ld_str = 'const _LD=[' + ','.join(ld_parts) + '];'
    
    print(f"New _LD array size: {len(new_ld_str):,} bytes", flush=True)
    
    # 7. Replace in content
    old_ld_match = re.search(r'const _LD=\[.*?\];', content, re.DOTALL)
    content = content[:old_ld_match.start()] + new_ld_str + content[old_ld_match.end():]
    print("Replaced _LD array", flush=True)
    
    # 8. Update decoder from %23 to %30
    old_decoder = 'v%23'
    new_decoder = f'v%{NEW_BASE}'
    if old_decoder in content:
        content = content.replace(old_decoder, new_decoder)
        print(f"Updated decoder base: 23 → {NEW_BASE}", flush=True)
    else:
        print("WARNING: Could not find decoder pattern", flush=True)
    
    # Also update the comment about base
    old_base_comment = '// Tube encoded as base-23 number (4 slots, 0=empty, 1-22=colors)'
    new_base_comment = f'// Tube encoded as base-{NEW_BASE} number (4 slots, 0=empty, 1-29=colors)'
    if old_base_comment in content:
        content = content.replace(old_base_comment, new_base_comment)
        print("Updated base comment", flush=True)
    
    # 9. Update total level count comment
    old_count_comment = '// ─── Level Definitions (6000 levels, compact encoding) ───'
    new_count_comment = f'// ─── Level Definitions (7000 levels, compact encoding) ───'
    if old_count_comment in content:
        content = content.replace(old_count_comment, new_count_comment)
        print("Updated level count comment", flush=True)
    
    # 10. Add new DIFF_SECTIONS
    # Find current last section in DIFF_SECTIONS
    diff_sections_match = re.search(r'const DIFF_SECTIONS = \[(.*?)\];', content, re.DOTALL)
    if diff_sections_match:
        diff_content = diff_sections_match.group(1)
        # Find the last entry - should end with APEX ULTIMATE
        last_section_pattern = r'\{ start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" \}'
        if last_section_pattern in diff_content:
            new_sections = """,\n  { start: 6001, label: "🖤 OMEGA+", color: "#1a1a4e" },\n  { start: 6151, label: "💎 TITAN", color: "#b9f2ff" },\n  { start: 6301, label: "⚡ COLOSSUS", color: "#33ff99" },\n  { start: 6451, label: "🌀 LEVIATHAN", color: "#cc33ff" },\n  { start: 6601, label: "🔥 BEHEMOTH", color: "#ff3300" },\n  { start: 6751, label: "👑 MYTHOS", color: "#ffdd00" },\n  { start: 6901, label: "🌟 APEX ETERNAL", color: "#ff0066" }"""
            diff_content = diff_content.replace(
                '{ start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" }',
                '{ start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" }' + new_sections
            )
            content = content[:diff_sections_match.start()] + 'const DIFF_SECTIONS = [' + diff_content + '];' + content[diff_sections_match.end():]
            print("Added 7 new DIFF_SECTIONS", flush=True)
        else:
            print("WARNING: Could not find last DIFF_SECTION entry", flush=True)
    else:
        print("WARNING: Could not find DIFF_SECTIONS", flush=True)
    
    # 11. Write updated content
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    print(f"\n{'='*60}", flush=True)
    print(f"INJECTION COMPLETE!", flush=True)
    print(f"  Total levels: {len(all_levels)}", flush=True)
    print(f"  Encoding: base-{NEW_BASE}", flush=True)
    print(f"  File size: {len(content):,} bytes", flush=True)
    print(f"  New DIFF_SECTIONS: +7 (6001-7000)", flush=True)

if __name__ == "__main__":
    main()
