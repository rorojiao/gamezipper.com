"""
Inject expansion 12001-13000 into Magic Sort index.html.
Reads existing base-30 _LD, decodes, adds new levels, re-encodes, updates DIFF_SECTIONS.
"""
import sys
import os
import re
import json

INDEX_HTML = "/home/msdn/gamezipper.com/magic-sort/index.html"
EXPANSION_FILE = "/home/msdn/gamezipper.com/magic-sort/expansion_12001_13000.txt"
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
    json_str = re.sub(r'\{n:', '{"n":', line)
    json_str = re.sub(r',b:', ',"b":', json_str)
    try:
        data = json.loads(json_str)
        return data['n'], data['b']
    except json.JSONDecodeError as e:
        print(f"  Parse error: {e} on line: {line[:80]}...", flush=True)
        return None, None

def main():
    with open(INDEX_HTML, 'r') as f:
        content = f.read()
    
    print(f"Original file: {len(content):,} bytes, {content.count(chr(10))} lines", flush=True)
    
    m = re.search(r'const _LD=\[(.*?)\];', content, re.DOTALL)
    if not m:
        print("ERROR: Could not find _LD array")
        sys.exit(1)
    
    ld_str = m.group(1)
    _LD = json.loads('[' + ld_str + ']')
    print(f"Existing levels in _LD: {len(_LD)}", flush=True)
    
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
    
    if len(all_levels) != 13000:
        print(f"WARNING: Expected 13000 levels, got {len(all_levels)}", flush=True)
    
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
    
    # Build new _LD string
    ld_parts = []
    for entry in new_LD:
        ld_parts.append('[' + ','.join(str(x) for x in entry) + ']')
    new_ld_str = 'const _LD=[' + ','.join(ld_parts) + '];'
    
    print(f"New _LD array size: {len(new_ld_str):,} bytes", flush=True)
    
    # Replace in content
    old_ld_match = re.search(r'const _LD=\[.*?\];', content, re.DOTALL)
    content = content[:old_ld_match.start()] + new_ld_str + content[old_ld_match.end():]
    print("Replaced _LD array", flush=True)
    
    # Update level count comments
    content = content.replace(
        '// ─── Level Definitions (12000 levels, compact encoding) ───',
        '// ─── Level Definitions (13000 levels, compact encoding) ───'
    )
    print("Updated level count comment to 13000", flush=True)
    
    # Add new DIFF_SECTIONS for 12001-13000
    diff_sections_match = re.search(r'const DIFF_SECTIONS = \[(.*?)\];', content, re.DOTALL)
    if diff_sections_match:
        diff_content = diff_sections_match.group(1)
        last_section_pattern = '{ start: 11801, label: "ZENITH ASCENDED", color: "#ccff00" }'
        if last_section_pattern in diff_content:
            new_sections = """,
  { start: 12001, label: "🔥 PHOENIX RISE", color: "#ff0066" },
  { start: 12201, label: "💎 INFINITY PRIME", color: "#00ffcc" },
  { start: 12401, label: "⚡ COSMIC NOVA", color: "#ff6600" },
  { start: 12601, label: "🌀 ELDRITCH SURGE", color: "#6600cc" },
  { start: 12801, label: "👑 APEX TRANSCEND", color: "#ffcc00" }"""
            diff_content = diff_content.replace(
                last_section_pattern,
                last_section_pattern + new_sections
            )
            content = content[:diff_sections_match.start()] + 'const DIFF_SECTIONS = [' + diff_content + '];' + content[diff_sections_match.end():]
            print("Added 5 new DIFF_SECTIONS (12001-13000)", flush=True)
        else:
            print("WARNING: Could not find last DIFF_SECTION entry (ZENITH ASCENDED)", flush=True)
    else:
        print("WARNING: Could not find DIFF_SECTIONS", flush=True)
    
    # Update SEO meta tags
    content = content.replace('12,000', '13,000')
    # Only replace 12000 where it means level count (not in seeds, etc)
    # Be careful with 12000 - only replace specific known patterns
    content = re.sub(r'12000 levels', '13000 levels', content)
    print("Updated SEO meta tags to 13,000", flush=True)
    
    # Update achievements count
    content = content.replace('19+ achievements', '20+ achievements')
    
    # Add new milestone emojis
    if 'if (lv === 12500) return' not in content:
        content = content.replace(
            'if (lv === 12000) return "\\u{1F525}";',
            'if (lv === 12000) return "\\u{1F525}";\n  if (lv === 12500) return "\\u{1F4A5}";\n  if (lv === 13000) return "\\u{1F48E}";'
        )
        print("Added 12500/13000 milestone emojis", flush=True)
    
    # Add new achievement for 13K
    if 'thirteen_k' not in content:
        content = content.replace(
            '{ id: "twelve_k", name: "TRANSCENDENT GOD"',
            '{ id: "thirteen_k", name: "INFINITE SOVEREIGN", desc: "Complete all 13,000 levels", icon: "\\u{1F48E}", check: (s) => s.completed >= 13000 },\n  { id: "twelve_k", name: "TRANSCENDENT GOD"'
        )
        print("Added INFINITE SOVEREIGN achievement (13K)", flush=True)
    
    # Write updated content
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    print(f"\n{'='*60}", flush=True)
    print(f"INJECTION COMPLETE!")
    print(f"  Total levels: {len(all_levels)}", flush=True)
    print(f"  Encoding: base-{BASE}", flush=True)
    print(f"  File size: {len(content):,} bytes", flush=True)
    print(f"  New DIFF_SECTIONS: +5 (12001-13000)", flush=True)
    print(f"  MILESTONE: 13,000 LEVELS!")

if __name__ == "__main__":
    main()
